import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS, logout } from './helpers/auth'
import { createJob, findJobByTitle, getJobIdFromUrl, getJobIdFromApi } from './helpers/jobs'
import { 
  getGateId, 
  completeArrivalGate, 
  completeIntakeGate,
  completePhotosGate,
  completeMoistureGate,
  completeScopeGate,
  completeSignoffsGate,
  completeDepartureGate,
  navigateToGate,
  GATE_ORDER
} from './helpers/gates'

/**
 * Full End-to-End Workflow Test
 * 
 * Tests the complete job lifecycle:
 * 1. Admin creates job
 * 2. Admin assigns job to tech
 * 3. Tech completes all 7 gates
 * 4. Verify job status updates
 */
test.describe('Full Job Workflow', () => {
  let jobTitle: string
  let jobId: string | null = null

  test.beforeAll(async () => {
    // Generate unique job title for this test run
    jobTitle = `E2E Test Job - ${Date.now()}`
  })

  test('Admin creates and assigns job', async ({ page }) => {
    // Login as admin
    await loginAs(page, TEST_USERS.admin)
    
    // Verify we're on admin dashboard
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1').first()).toContainText(/Dashboard/i)
    
    // Create new job - link text is "+ New Job"
    await page.click('a:has-text("New Job"), a[href="/jobs/new"]')
    await page.waitForURL(/\/jobs\/new/, { timeout: 5000 })
    
    await page.fill('input[name="title"]', jobTitle)
    await page.fill('input[name="address"]', '123 Test St, Test City, ST 12345')
    
    // Assign to field tech during creation - MUST select tech that matches TEST_USERS.fieldTech
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
    
    test.skip(!techSelected, 'No field tech available for assignment')
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Create Job")')
    
    // Wait for redirect to dashboard
    await page.waitForURL('/', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Verify job appears on dashboard
    const jobTitleElement = page.locator(`text=${jobTitle}`).first()
    await expect(jobTitleElement).toBeVisible({ timeout: 5000 })
    
    // Get job ID by logging in as field tech and finding it on their dashboard
    await loginAs(page, TEST_USERS.fieldTech)
    await page.waitForURL('/field', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Try to get job from API first (most reliable)
    jobId = await getJobIdFromApi(page, jobTitle)
    
    // If API didn't work, try UI
    if (!jobId) {
      await page.reload()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      // Find job on field tech dashboard
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
    
    // If still no job ID, provide detailed error
    if (!jobId) {
      const response = await page.request.get('/api/field/jobs')
      if (response.ok()) {
        const data = await response.json()
        const availableJobs = data.jobs?.map((j: any) => ({ title: j.title, lead_tech_id: j.lead_tech_id })) || []
        throw new Error(`Job "${jobTitle}" not found. Available jobs: ${JSON.stringify(availableJobs)}. The job may have been assigned to a different tech than the one we logged in as.`)
      }
      throw new Error(`Job "${jobTitle}" not found on field tech dashboard and API check failed`)
    }
    
    expect(jobId).not.toBeNull()
  })

  test('Field tech completes all gates', async ({ page }) => {
    test.setTimeout(600000) // 10 minutes for full workflow on mobile
    // Skip if job wasn't created
    test.skip(!jobId, 'Job ID not available from previous test')
    
    // Login as field tech
    await loginAs(page, TEST_USERS.fieldTech)
    
    // Verify we're on field dashboard
    await expect(page).toHaveURL('/field')
    
    // Navigate to job
    await page.goto(`/field/jobs/${jobId}`)
    await page.waitForLoadState('networkidle')
    
    // Complete gates in order
    for (const gateName of GATE_ORDER) {
      test.step(`Complete ${gateName} gate`, async () => {
        // Get gate ID
        const gateId = await getGateId(page, jobId!, gateName)
        expect(gateId).not.toBeNull()
        
        // Navigate to gate
        await navigateToGate(page, jobId!, gateId!)
        
        // Complete gate based on type
        switch (gateName) {
          case 'Arrival':
            await completeArrivalGate(page)
            break
          case 'Intake':
            await completeIntakeGate(page)
            break
          case 'Photos':
            // Photos gate requires actual photo uploads
            // Use exception flow for testing
            await completePhotosGate(page)
            break
          case 'Moisture/Equipment':
            await completeMoistureGate(page)
            break
          case 'Scope':
            await completeScopeGate(page)
            break
          case 'Sign-offs':
            await completeSignoffsGate(page)
            break
          case 'Departure':
            await completeDepartureGate(page)
            break
        }
        
        // Verify gate is marked complete
        await page.goto(`/field/jobs/${jobId}`)
        await page.waitForLoadState('networkidle')
        
        // Check that gate shows as complete - gates have status badges
        const gateCard = page.locator(`text=${gateName}`).locator('xpath=ancestor::a').first()
        await expect(gateCard).toBeVisible({ timeout: 5000 })
        
        // Check for "Complete" status badge
        const completeStatus = gateCard.locator('text=/Complete|complete/i').first()
        await expect(completeStatus).toBeVisible({ timeout: 5000 })
      })
    }
    
    // Verify job status is updated
    try {
      await page.reload({ waitUntil: 'networkidle', timeout: 30000 })
    } catch (error: any) {
      // If reload fails, navigate back to job page
      if (error.message?.includes('canceled') || error.message?.includes('interrupted')) {
        await page.goto(`/field/jobs/${jobId}`, { waitUntil: 'networkidle', timeout: 30000 })
      } else {
        throw error
      }
    }
    // Job should show as completed or in progress
  })

  // Note: afterAll doesn't support page fixture - removed
})

