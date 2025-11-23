import { Page } from '@playwright/test'
import { TEST_USERS } from './auth'

/**
 * Helper functions for gate operations in E2E tests
 */

export const GATE_ORDER = [
  'Arrival',
  'Intake',
  'Photos',
  'Moisture/Equipment',
  'Scope',
  'Sign-offs',
  'Departure',
]

/**
 * Navigate to a specific gate
 */
export async function navigateToGate(page: Page, jobId: string, gateId: string): Promise<void> {
  try {
    await page.goto(`/field/gates/${gateId}`, { waitUntil: 'networkidle', timeout: 60000 })
  } catch (error: any) {
    // If navigation was interrupted, wait for it to complete
    if (error.message?.includes('interrupted') || error.message?.includes('canceled')) {
      await page.waitForLoadState('networkidle', { timeout: 60000 })
    } else {
      // Retry once
      await page.waitForTimeout(2000)
      await page.goto(`/field/gates/${gateId}`, { waitUntil: 'networkidle', timeout: 60000 })
    }
  }
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000) // Extra wait for mobile rendering
}

/**
 * Complete Arrival gate
 */
export async function completeArrivalGate(page: Page): Promise<void> {
  // For testing, we'll log an exception since photo upload requires file system
  // In a real test, you'd create a test image file and upload it
  // await page.setInputFiles('input[type="file"]', 'path/to/test-image.jpg')
  
  // Check if exception button exists (for testing without photo)
  const exceptionButton = page.locator('button:has-text("Log Exception")').first()
  if (await exceptionButton.isVisible({ timeout: 10000 }).catch(() => false)) {
    await exceptionButton.click()
    // Wait for modal to open
    await page.waitForSelector('textarea', { timeout: 10000 })
    await page.waitForTimeout(500)
    // Fill exception reason in modal textarea
    const textarea = page.locator('textarea[placeholder*="exception"], textarea').first()
    await textarea.fill('E2E Test - No photo available')
    await page.waitForTimeout(300)
    // Submit the modal - try multiple selectors
    const submitButton = page.locator('button:has-text("Log Exception")').filter({ hasNotText: 'Cancel' }).last()
    await submitButton.waitFor({ state: 'visible', timeout: 10000 })
    await submitButton.click()
    // Wait for modal to close and redirect
    await page.waitForURL(/\/field\/jobs\//, { timeout: 10000 }).catch(() => {
      // If no redirect, wait a bit more
      return page.waitForTimeout(2000)
    })
  } else {
    // If no exception button, try to complete (might fail validation)
    const completeButton = page.locator('button:has-text("Complete Gate")').first()
    await completeButton.click()
    await page.waitForTimeout(2000)
  }
}

/**
 * Complete Intake gate
 */
export async function completeIntakeGate(page: Page): Promise<void> {
  // Fill in intake form
  await page.fill('input[id="customer-name"]', 'Test Customer')
  await page.fill('input[id="customer-phone"]', '555-1234')
  await page.selectOption('select[id="loss-type"]', 'Water')
  
  // Select at least one affected area (required) - Kitchen checkbox
  const kitchenLabel = page.locator('label:has-text("Kitchen")').first()
  if (await kitchenLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
    const kitchenCheckbox = kitchenLabel.locator('input[type="checkbox"]').first()
    await kitchenCheckbox.check()
    await page.waitForTimeout(500)
    
    // Wait for damage type select to appear for Kitchen
    const damageTypeSelect = page.locator('select').filter({ hasText: /Kitchen.*Damage Type/i }).or(page.locator('select').nth(1)).first()
    if (await damageTypeSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await damageTypeSelect.selectOption('Visible water')
      await page.waitForTimeout(500)
    }
  }
  
  // Wait for complete button to be enabled
  const completeButton = page.locator('button:has-text("Complete Gate")')
  await completeButton.waitFor({ state: 'visible', timeout: 10000 })
  
  // Wait for button to be enabled (check every 500ms for up to 30 seconds)
  let attempts = 0
  while (attempts < 60) {
    const isEnabled = await completeButton.evaluate((btn: HTMLButtonElement) => !btn.disabled)
    if (isEnabled) break
    await page.waitForTimeout(500)
    attempts++
  }
  
  // Click complete
  await completeButton.click()
  await page.waitForURL(/\/field\/jobs\//, { timeout: 15000 }).catch(() => {
    return page.waitForTimeout(2000)
  })
}

/**
 * Complete Photos gate (simplified - would need actual photo uploads)
 */
export async function completePhotosGate(page: Page): Promise<void> {
  // Photos gate redirects to /field/gates/photos/[id]
  // Wait for redirect if needed
  await page.waitForURL(/\/gates\/photos\//, { timeout: 5000 }).catch(() => {})
  await page.waitForLoadState('networkidle')
  
  // This is complex - requires selecting rooms and uploading photos
  // For now, we'll log an exception
  const exceptionButton = page.locator('button:has-text("Log Exception")').first()
  if (await exceptionButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await exceptionButton.click()
    // Wait for modal to open
    await page.waitForTimeout(500)
    // Fill exception reason in modal textarea
    const exceptionTextarea = page.locator('textarea[placeholder*="exception"], textarea').first()
    await exceptionTextarea.fill('E2E Test - Photo upload requires file system')
    // Submit modal - look for submit button in modal
    const submitButton = page.locator('button[type="submit"]:has-text("Log Exception")').first()
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitButton.click()
    } else {
      // Fallback: try any button with "Log Exception" text
      await page.click('button:has-text("Log Exception")').catch(() => {})
    }
    // Wait for modal to close and action to complete
    await page.waitForTimeout(2000)
  }
}

/**
 * Complete Moisture/Equipment gate
 */
export async function completeMoistureGate(page: Page): Promise<void> {
  // Fill in moisture readings
  await page.fill('input[id="moisture-readings"], input[name="moistureReadings"]', '45%')
  
  // Equipment is checkboxes - select at least one
  const equipmentCheckbox = page.locator('input[type="checkbox"][id*="equipment"], input[type="checkbox"][name*="equipment"]').first()
  if (await equipmentCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
    await equipmentCheckbox.check()
  }
  
  // Click complete
  await page.click('button:has-text("Complete Gate")')
  await page.waitForTimeout(2000)
}

/**
 * Complete Scope gate
 */
export async function completeScopeGate(page: Page): Promise<void> {
  // Scope gate has room checkboxes - select at least one
  const roomCheckbox = page.locator('input[type="checkbox"][id*="room"], input[type="checkbox"][name*="room"]').first()
  if (await roomCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
    await roomCheckbox.check()
  }
  
  // Fill in measurements and notes
  await page.fill('textarea[id="measurements"], textarea[name="measurements"]', 'Visual estimate only')
  await page.fill('textarea[id="scope-notes"], textarea[name="notes"]', 'E2E test scope notes')
  
  // Click complete
  await page.click('button:has-text("Complete Gate")')
  await page.waitForTimeout(2000)
}

/**
 * Complete Sign-offs gate
 */
export async function completeSignoffsGate(page: Page): Promise<void> {
  // Sign-off has signature checkbox
  const signatureCheckbox = page.locator('input[type="checkbox"][id*="signature"], input[type="checkbox"][name*="signature"]')
  if (await signatureCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
    await signatureCheckbox.check()
  }
  
  // Fill in claim number and next steps
  await page.fill('input[id="claim-number"], input[name="claimNumber"]', 'CLM-12345')
  await page.selectOption('select[id="next-steps"], select[name="nextSteps"]', 'Wait for adjuster')
  
  // Click complete
  await page.click('button:has-text("Complete Gate")')
  await page.waitForTimeout(2000)
}

/**
 * Complete Departure gate
 */
export async function completeDepartureGate(page: Page): Promise<void> {
  // Fill in departure data - these are select dropdowns
  await page.selectOption('select[id="equipment-status"], select[name="equipmentStatus"]', 'Left on-site')
  await page.selectOption('select[id="job-status"], select[name="jobStatus"]', 'Ready for estimate')
  
  // Optional: fill in notes
  const notesField = page.locator('textarea[id="final-notes"], textarea[name="notes"]')
  if (await notesField.isVisible({ timeout: 1000 }).catch(() => false)) {
    await notesField.fill('E2E test departure notes')
  }
  
  // Click complete
  await page.click('button:has-text("Complete Gate")')
  await page.waitForTimeout(2000)
}

/**
 * Get gate ID from job page
 */
export async function getGateId(page: Page, jobId: string, gateName: string): Promise<string | null> {
  const currentUrl = page.url()
  const targetUrl = `/field/jobs/${jobId}`
  
  // Only navigate if we're not already on the target URL
  if (!currentUrl.includes(targetUrl)) {
    await page.goto(targetUrl)
    await page.waitForLoadState('networkidle')
  } else {
    // If already on the page, just wait for it to be ready
    await page.waitForLoadState('networkidle')
  }
  
  // Find gate card with matching name - gates are displayed as links
  // The gate name is in an h3, and the whole card is a link
  const gateLink = page.locator(`a[href*="/field/gates/"]:has-text("${gateName}")`).first()
  
  if (await gateLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    const href = await gateLink.getAttribute('href')
    if (href) {
      // Extract gate ID from href like /field/gates/123 or /field/gates/photos/123
      const match = href.match(/\/gates\/(?:photos\/)?([^\/]+)/)
      return match ? match[1] : null
    }
  }
  
  // Alternative: look for the gate name text and find the parent link
  const gateNameElement = page.locator(`text=${gateName}`).first()
  if (await gateNameElement.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Find the parent link
    const parentLink = gateNameElement.locator('xpath=ancestor::a').first()
    if (await parentLink.isVisible().catch(() => false)) {
      const href = await parentLink.getAttribute('href')
      if (href) {
        const match = href.match(/\/gates\/(?:photos\/)?([^\/]+)/)
        return match ? match[1] : null
      }
    }
  }
  
  return null
}

