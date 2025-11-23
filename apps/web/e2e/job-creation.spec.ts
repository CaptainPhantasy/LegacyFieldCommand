import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS } from './helpers/auth'
import { getJobIdFromApi } from './helpers/jobs'

/**
 * Job Creation Test Suite
 * 
 * Tests the job creation flow:
 * 1. Admin can create jobs
 * 2. Form validation works
 * 3. Jobs appear in dashboard
 * 4. Default gates are created
 */
test.describe('Job Creation', () => {
  test('Admin can create a new job', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    // Navigate to job creation - link text is "+ New Job"
    await page.click('a:has-text("New Job"), a[href="/jobs/new"]')
    await expect(page).toHaveURL(/\/jobs\/new/)
    
    // Verify form is visible
    await expect(page.locator('input[name="title"]')).toBeVisible()
    await expect(page.locator('input[name="address"]')).toBeVisible()
    await expect(page.locator('select[name="leadTechId"]')).toBeVisible()
  })

  test('Job creation form validates required fields', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    await page.goto('/jobs/new')
    
    // Try to submit without filling fields
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // HTML5 validation should prevent submission
    // Check if form is still on page (not redirected)
    await expect(page).toHaveURL(/\/jobs\/new/)
  })

  test('Job creation creates default gates', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const jobTitle = `Test Job - ${Date.now()}`
    
    await page.goto('/jobs/new')
    await page.fill('input[name="title"]', jobTitle)
    await page.fill('input[name="address"]', '123 Test St')
    
    // Assign to field tech - MUST select the tech that matches TEST_USERS.fieldTech
    // Known field tech user ID for tech@legacyfield.com: 42e04a00-7c38-4828-a40c-3fe118a9d230
    // We'll try to find this specific tech in the dropdown
    
    const techSelect = page.locator('select[name="leadTechId"]')
    const options = await techSelect.locator('option').all()
    let selectedTechId: string | null = null
    const targetTechId = '42e04a00-7c38-4828-a40c-3fe118a9d230' // tech@legacyfield.com
    
    // Try to find the tech with the matching ID
    for (const option of options.slice(1)) { // Skip "unassigned"
      const value = await option.getAttribute('value')
      if (value === targetTechId) {
        selectedTechId = value
        await techSelect.selectOption(value)
        break
      }
    }
    
    // If target tech not found, try first available tech as fallback
    // But note: this might cause the test to fail if we log in as a different tech
    if (!selectedTechId && options.length > 1) {
      for (const option of options.slice(1)) {
        const value = await option.getAttribute('value')
        if (value && value !== 'unassigned') {
          selectedTechId = value
          await techSelect.selectOption(value)
          console.warn(`Warning: Target tech ${targetTechId} not found, selected ${value} instead. Test may fail if this doesn't match logged-in user.`)
          break
        }
      }
    }
    
    // If no tech available, skip this test
    test.skip(!selectedTechId, 'No field tech available for assignment')
    
    await page.click('button[type="submit"]:has-text("Create Job")')
    
    // Wait for redirect
    await page.waitForURL('/', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Verify job appears on dashboard
    const jobTitleElement = page.locator(`text=${jobTitle}`).first()
    await expect(jobTitleElement).toBeVisible({ timeout: 5000 })
    
    // Now login as field tech to verify gates
    await loginAs(page, TEST_USERS.fieldTech)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // First, try to get job ID from API (more reliable)
    let jobId = await getJobIdFromApi(page, jobTitle)
    
    // If API didn't work, try UI
    if (!jobId) {
      await page.reload()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      // Find job on field tech dashboard (jobs are clickable here)
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
    
    // If still no job ID, the assignment didn't work - verify the job was assigned to this tech
    if (!jobId) {
      // Check API response to see what jobs are available
      const response = await page.request.get('/api/field/jobs')
      if (response.ok()) {
        const data = await response.json()
        console.log('Available jobs for field tech:', data.jobs?.map((j: any) => ({ id: j.id, title: j.title, lead_tech_id: j.lead_tech_id })))
      }
      throw new Error(`Job "${jobTitle}" not found on field tech dashboard. Job may have been assigned to a different tech.`)
    }
    
    // Navigate to job using the ID we found
    await page.goto(`/field/jobs/${jobId}`)
    await page.waitForLoadState('networkidle')
    
    // We're already on the job detail page from the goto above
    
    // Check for gates (should be 7)
    const gateNames = [
      'Arrival',
      'Intake',
      'Photos',
      'Moisture/Equipment',
      'Scope',
      'Sign-offs',
      'Departure',
    ]
    
    for (const gateName of gateNames) {
      const gateElement = page.locator(`text=${gateName}`).first()
      await expect(gateElement).toBeVisible({ timeout: 5000 })
    }
  })

  test('Job can be assigned to tech', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const jobTitle = `Assign Test - ${Date.now()}`
    
    await page.goto('/jobs/new')
    await page.fill('input[name="title"]', jobTitle)
    await page.fill('input[name="address"]', '123 Test St')
    
    // Select the tech that matches our test user (tech@legacyfield.com)
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
    
    // Submit form and wait for redirect
    await page.click('button[type="submit"]:has-text("Create Job")')
    await page.waitForURL('/', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Give time for job to be created
    
    // Verify job appears on admin dashboard
    const jobTitleElement = page.locator(`text=${jobTitle}`).first()
    await expect(jobTitleElement).toBeVisible({ timeout: 10000 })
    
    // Get job ID from admin API to verify assignment
    const adminResponse = await page.request.get('/api/admin/jobs')
    if (adminResponse.ok()) {
      const adminData = await adminResponse.json()
      const createdJob = adminData.data?.jobs?.find((j: any) => j.title === jobTitle)
      if (createdJob) {
        console.log('Created job:', { id: createdJob.id, title: createdJob.title, lead_tech_id: createdJob.lead_tech_id })
        // Verify it's assigned to the selected tech
        if (techSelected) {
          expect(createdJob.lead_tech_id).toBe(targetTechId)
        }
      }
    }
    
    // Now login as field tech to verify they can see the job
    await loginAs(page, TEST_USERS.fieldTech)
    await page.goto('/field')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000) // Give time for jobs to load
    
    // Check via API first to verify job is assigned
    const response = await page.request.get('/api/field/jobs')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    const assignedJob = data.jobs?.find((j: any) => j.title === jobTitle)
    
    if (!assignedJob) {
      // Job not found - log available jobs for debugging
      console.log('Available jobs:', data.jobs?.map((j: any) => ({ id: j.id, title: j.title, lead_tech_id: j.lead_tech_id })))
      // Wait and reload
      await page.waitForTimeout(3000)
      await page.reload()
      await page.waitForLoadState('networkidle')
    } else {
      console.log('Found assigned job:', { id: assignedJob.id, title: assignedJob.title })
    }
    
    // Verify job appears in UI - look for job title or link
    const jobLink = page.locator(`a:has-text("${jobTitle}"), text=${jobTitle}`).first()
    await expect(jobLink).toBeVisible({ timeout: 15000 })
  })
})

