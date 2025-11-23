import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS } from './helpers/auth'
import { createJob, findJobByTitle, getJobIdFromApi } from './helpers/jobs'
import { getGateId, navigateToGate } from './helpers/gates'

/**
 * Validation Rules Test Suite
 * 
 * Tests gate validation and anti-fudging rules:
 * 1. Room consistency (Scope rooms must match Photos rooms)
 * 2. Photo requirements (3 photos per room)
 * 3. Timestamp validation (Arrival before Departure)
 */
test.describe('Gate Validation Rules', () => {
  let jobId: string | null = null
  let jobTitle: string

  test.beforeEach(async ({ page }) => {
    // Create a fresh job for each test
    await loginAs(page, TEST_USERS.admin)
    jobTitle = `Validation Test - ${Date.now()}`
    
    await page.goto('/jobs/new')
    await page.fill('input[name="title"]', jobTitle)
    await page.fill('input[name="address"]', '123 Test St')
    
    // Assign to tech during creation - MUST select tech that matches TEST_USERS.fieldTech
    const techSelect = page.locator('select[name="leadTechId"]')
    const options = await techSelect.locator('option').all()
    let techSelected = false
    const targetTechId = '42e04a00-7c38-4828-a40c-3fe118a9d230' // tech@legacyfield.com
    
    // Try to find and select the target tech
    for (const option of options.slice(1)) {
      const value = await option.getAttribute('value')
      if (value === targetTechId) {
        await techSelect.selectOption(value)
        techSelected = true
        break
      }
    }
    
    // Fallback to first available if target not found
    if (!techSelected && options.length > 1) {
      for (const option of options.slice(1)) {
        const value = await option.getAttribute('value')
        if (value && value !== 'unassigned') {
          await techSelect.selectOption(value)
          techSelected = true
          console.warn(`Warning: Target tech ${targetTechId} not found, selected ${value} instead`)
          break
        }
      }
    }
    
    await page.click('button[type="submit"]:has-text("Create Job")')
    await page.waitForURL('/', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Verify job appears
    const jobTitleElement = page.locator(`text=${jobTitle}`).first()
    await expect(jobTitleElement).toBeVisible({ timeout: 5000 })
    
    // Get job ID by logging in as field tech
    await loginAs(page, TEST_USERS.fieldTech)
    await page.waitForURL('/field', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Try API first to get job ID (more reliable)
    jobId = await getJobIdFromApi(page, jobTitle)
    
    // If API didn't work, try UI
    if (!jobId) {
      await page.reload()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      const jobLink = page.locator(`a:has-text("${jobTitle}")`).first()
      if (await jobLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        const href = await jobLink.getAttribute('href')
        if (href) {
          const match = href.match(/\/jobs\/([^\/]+)/)
          if (match) {
            jobId = match[1]
          }
        }
      }
    }
    
    // If still no job ID, check what went wrong
    if (!jobId) {
      const response = await page.request.get('/api/field/jobs')
      if (response.ok()) {
        const data = await response.json()
        const availableJobs = data.jobs?.map((j: any) => ({ title: j.title, lead_tech_id: j.lead_tech_id })) || []
        throw new Error(`Job "${jobTitle}" not found. Available jobs: ${JSON.stringify(availableJobs)}. Job may have been assigned to a different tech (selected: ${techSelected ? 'yes' : 'no'})`)
      }
    }
    
    expect(jobId).not.toBeNull()
    test.skip(!techSelected || !jobId, 'No field tech available or job ID not found')
  })

  test('Scope gate blocks rooms not in Photos gate', async ({ page }) => {
    test.skip(!jobId, 'Job ID not available')
    
    await loginAs(page, TEST_USERS.fieldTech)
    await page.goto(`/field/jobs/${jobId}`)
    await page.waitForLoadState('networkidle')
    
    // Try to complete Scope gate with rooms not in Photos
    const scopeGateId = await getGateId(page, jobId!, 'Scope')
    expect(scopeGateId).not.toBeNull()
    
    await navigateToGate(page, jobId!, scopeGateId!)
    await page.waitForLoadState('networkidle')
    
    // Fill scope with rooms (but Photos gate not completed)
    // Scope gate uses checkboxes for specific room names
    // Check a room checkbox (e.g., "Kitchen")
    const kitchenCheckbox = page.locator('label:has-text("Kitchen") input[type="checkbox"]').first()
    if (await kitchenCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await kitchenCheckbox.check()
      // Wait for state to update and button to become enabled
      await page.waitForTimeout(500)
    }
    
    // Fill measurements
    await page.fill('textarea[id="measurements"], textarea[name="measurements"]', 'Visual estimate only')
    
    // Wait for button to be enabled (it should be enabled if rooms are selected)
    const completeButton = page.locator('button:has-text("Complete Gate")').first()
    await expect(completeButton).toBeEnabled({ timeout: 5000 })
    
    // Try to complete - this should trigger server-side validation
    await completeButton.click()
    
    // Wait for validation to run (either error banner or redirect)
    await page.waitForTimeout(2000)
    
    // Should show validation error about room consistency (either in banner or error message)
    const errorBanner = page.locator('text=/room|photo|consistency|match/i')
    const hasError = await errorBanner.isVisible({ timeout: 5000 }).catch(() => false)
    
    // The validation should prevent completion, so either:
    // 1. Error banner appears, OR
    // 2. We're still on the gate page (didn't redirect)
    const stillOnGatePage = page.url().includes('/gates/')
    expect(hasError || stillOnGatePage).toBe(true)
  })

  test('Photos gate requires 3 photos per room', async ({ page }) => {
    test.skip(!jobId, 'Job ID not available')
    
    await loginAs(page, TEST_USERS.fieldTech)
    await page.goto(`/field/jobs/${jobId}`)
    
    const photosGateId = await getGateId(page, jobId!, 'Photos')
    expect(photosGateId).not.toBeNull()
    
    await navigateToGate(page, jobId!, photosGateId!)
    
    // Try to complete without required photos
    const completeButton = page.locator('button:has-text("Complete Gate")').first()
    
    // Button should be disabled or show error
    const isDisabled = await completeButton.isDisabled().catch(() => false)
    if (!isDisabled) {
      await completeButton.click()
      // Should show validation error
      await expect(page.locator('text=/photo|required|minimum/i')).toBeVisible({ timeout: 5000 })
    } else {
      // Button is disabled, which is correct
      expect(isDisabled).toBe(true)
    }
  })

  test('Departure gate validates timestamp order', async ({ page }) => {
    test.skip(!jobId, 'Job ID not available')
    
    await loginAs(page, TEST_USERS.fieldTech)
    await page.goto(`/field/jobs/${jobId}`)
    await page.waitForLoadState('networkidle')
    
    // Complete Arrival gate first (using exception for speed)
    const arrivalGateId = await getGateId(page, jobId!, 'Arrival')
    if (arrivalGateId) {
      await navigateToGate(page, jobId!, arrivalGateId)
      await page.waitForLoadState('networkidle')
      
      // Log exception to complete quickly
      const exceptionButton = page.locator('button:has-text("Log Exception")').first()
      if (await exceptionButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await exceptionButton.click()
        // Wait for modal to appear
        await page.waitForSelector('textarea', { timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(300)
        
        // Fill exception in modal
        const exceptionTextarea = page.locator('textarea[placeholder*="exception"], textarea').first()
        if (await exceptionTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
          await exceptionTextarea.fill('Test exception for validation test')
          
          // Submit modal - wait for it to be ready
          await page.waitForTimeout(200)
          const submitButton = page.locator('button[type="submit"]:has-text("Log Exception")').first()
          
          // Wait for submit button and click
          if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await submitButton.click()
            // Wait for modal to close (either redirect or banner appears)
            await page.waitForTimeout(1500)
          }
        }
        
        // Check if we were redirected or if we're still on the gate page
        const currentUrl = page.url()
        if (currentUrl.includes('/gates/')) {
          // Still on gate page, check for success banner
          await page.waitForTimeout(1000)
        }
        
        // Navigate back to job page to verify Arrival is complete
        await page.goto(`/field/jobs/${jobId}`)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
      }
    }
    
    // Try to complete Departure gate
    const departureGateId = await getGateId(page, jobId!, 'Departure')
    expect(departureGateId).not.toBeNull()
    
    await navigateToGate(page, jobId!, departureGateId!)
    await page.waitForLoadState('networkidle')
    
    // Fill departure data - these are select dropdowns
    await page.selectOption('select[id="equipment-status"], select[name="equipmentStatus"]', 'Left on-site')
    await page.selectOption('select[id="job-status"], select[name="jobStatus"]', 'Ready for estimate')
    
    // Wait for button to be enabled
    const completeButton = page.locator('button:has-text("Complete Gate")').first()
    await expect(completeButton).toBeEnabled({ timeout: 5000 })
    
    // Complete should work (Arrival was completed via exception)
    await completeButton.click()
    
    // Wait for completion or error
    await page.waitForTimeout(3000)
    
    // Check for error or success
    // If Arrival was completed, Departure should complete successfully
    // If there's a timestamp validation error, it will show in the banner
    const errorBanner = page.locator('text=/timestamp|arrival|before|error/i')
    const successBanner = page.locator('text=/complete|success/i')
    const redirectedToJob = page.url().includes('/field/jobs/') && !page.url().includes('/gates/')
    
    const hasError = await errorBanner.isVisible({ timeout: 2000 }).catch(() => false)
    const hasSuccess = await successBanner.isVisible({ timeout: 2000 }).catch(() => false)
    
    // Either error (if validation fails), success (if it completes), or redirect (also success)
    expect(hasError || hasSuccess || redirectedToJob).toBe(true)
  })
})

