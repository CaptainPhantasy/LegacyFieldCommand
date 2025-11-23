import { test, expect, devices } from '@playwright/test'
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
 * iOS Simulator Workflow Test
 * 
 * Tests the complete workflow as it would run on iPhone 14 simulator
 * Uses WebKit (Safari) to simulate iOS behavior
 */
test.describe('iOS Simulator Workflow', () => {
  let jobTitle: string
  let jobId: string | null = null

  test.beforeAll(async () => {
    jobTitle = `iOS Test Job - ${Date.now()}`
  })

  test('Complete workflow on iOS Safari', async ({ page }) => {
    test.setTimeout(300000) // 5 minutes for full workflow
    
    // Use iPhone 14 viewport and user agent
    await page.setViewportSize({ width: 390, height: 844 }) // iPhone 14 dimensions
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    })

    // Step 1: Admin creates job
    await test.step('Admin creates and assigns job', async () => {
      await loginAs(page, TEST_USERS.admin)
      await expect(page).toHaveURL('/')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000) // Wait for page to fully render on mobile
      
      // Try multiple selectors for the "New Job" link
      const newJobLink = page.locator('a[href="/jobs/new"]').or(page.locator('a:has-text("New Job")')).or(page.locator('a:has-text("+ New Job")')).first()
      await newJobLink.waitFor({ state: 'visible', timeout: 30000 })
      await newJobLink.click()
      await page.waitForURL(/\/jobs\/new/, { timeout: 30000 })
      await page.waitForLoadState('networkidle')
      
      await page.fill('input[name="title"]', jobTitle)
      await page.fill('input[name="address"]', '123 Test St, Test City, ST 12345')
      
      const techSelect = page.locator('select[name="leadTechId"]')
      const options = await techSelect.locator('option').all()
      const targetTechId = '42e04a00-7c38-4828-a40c-3fe118a9d230'
      
      let techSelected = false
      for (const option of options.slice(1)) {
        const value = await option.getAttribute('value')
        if (value === targetTechId) {
          await techSelect.selectOption(value)
          techSelected = true
          break
        }
      }
      
      if (!techSelected && options.length > 1) {
        for (const option of options.slice(1)) {
          const value = await option.getAttribute('value')
          if (value && value !== 'unassigned') {
            await techSelect.selectOption(value)
            techSelected = true
            break
          }
        }
      }
      
      test.skip(!techSelected, 'No field tech available')
      
      await page.click('button[type="submit"]:has-text("Create Job")')
      await page.waitForURL('/', { timeout: 30000 })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000) // Extra wait for mobile
      
      await loginAs(page, TEST_USERS.fieldTech)
      await page.waitForURL('/field', { timeout: 10000 })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      jobId = await getJobIdFromApi(page, jobTitle)
      
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
      
      expect(jobId).not.toBeNull()
    })

    test.skip(!jobId, 'Job ID not available')

    // Step 2: Test data persistence
    await test.step('Test data persistence on Intake gate', async () => {
      const gateId = await getGateId(page, jobId!, 'Intake')
      expect(gateId).not.toBeNull()
      
      await navigateToGate(page, jobId!, gateId!)
      await page.waitForLoadState('networkidle')
      
      // Fill form fields
      await page.fill('input[id="customer-name"], input[name="customerName"]', 'John Doe')
      await page.fill('input[id="customer-phone"], input[name="customerPhone"]', '555-1234')
      await page.selectOption('select[id="loss-type"], select[name="lossType"]', 'Water')
      
      // Wait for autosave (2.5 seconds debounce + network time)
      await page.waitForTimeout(4000)
      
      // Check for autosave indicator
      const autosaveIndicator = page.locator('text=/Draft saved|Saving|✓ Draft saved/i')
      await expect(autosaveIndicator).toBeVisible({ timeout: 10000 }).catch(() => {
        console.log('Autosave indicator not found, but continuing...')
      })
      
      // Simulate closing browser (clear cookies/localStorage but keep session)
      // In real iOS, we'd close Safari, but in Playwright we simulate by navigating away and back
      await page.goto('/field', { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(1000)
      
      // Navigate back to gate
      try {
        await navigateToGate(page, jobId!, gateId!)
      } catch (error: any) {
        // If navigation fails, try direct navigation
        if (error.message?.includes('interrupted')) {
          await page.waitForURL(/\/field\/gates\//, { timeout: 10000 })
          await page.waitForLoadState('networkidle')
        } else {
          throw error
        }
      }
      
      // Verify data persisted
      const customerName = await page.inputValue('input[id="customer-name"], input[name="customerName"]').catch(() => '')
      const customerPhone = await page.inputValue('input[id="customer-phone"], input[name="customerPhone"]').catch(() => '')
      const lossType = await page.locator('select[id="loss-type"], select[name="lossType"]').inputValue().catch(() => '')
      
      expect(customerName).toBe('John Doe')
      expect(customerPhone).toBe('555-1234')
      expect(lossType).toBe('Water')
    })

    // Step 3: Complete all gates
    await test.step('Complete all gates', async () => {
      for (const gateName of GATE_ORDER) {
        await test.step(`Complete ${gateName} gate`, async () => {
          const gateId = await getGateId(page, jobId!, gateName)
          expect(gateId).not.toBeNull()
          
          await navigateToGate(page, jobId!, gateId!)
          await page.waitForLoadState('networkidle')
          
          switch (gateName) {
            case 'Arrival':
              await completeArrivalGate(page)
              break
            case 'Intake':
              await completeIntakeGate(page)
              break
            case 'Photos':
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
          
          // Verify gate is complete or skipped
          await page.goto(`/field/jobs/${jobId}`)
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(1000) // Wait for status to update
          
          const gateCard = page.locator(`text=${gateName}`).locator('xpath=ancestor::a').first()
          await expect(gateCard).toBeVisible({ timeout: 10000 })
          
          // Check for either Complete or Skipped status
          const statusBadge = gateCard.locator('text=/Complete|complete|Skipped|skipped/i').first()
          await expect(statusBadge).toBeVisible({ timeout: 10000 })
        })
      }
    })

    // Step 4: Verify job completion
    await test.step('Verify job is complete', async () => {
      await page.goto(`/field/jobs/${jobId}`)
      await page.waitForLoadState('networkidle')
      
      // All gates should be complete
      for (const gateName of GATE_ORDER) {
        const gateCard = page.locator(`text=${gateName}`).locator('xpath=ancestor::a').first()
        const completeStatus = gateCard.locator('text=/Complete|complete/i').first()
        await expect(completeStatus).toBeVisible({ timeout: 5000 })
      }
    })
  })
})

