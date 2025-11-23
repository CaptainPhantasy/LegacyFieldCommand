import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS } from './helpers/auth'

/**
 * Error Scenarios Test Suite
 * 
 * Tests error handling and edge cases:
 * 1. Unauthorized access
 * 2. Invalid form submissions
 * 3. Network errors
 * 4. Missing required data
 */
test.describe('Error Scenarios', () => {
  test('Unauthorized users are redirected to login', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('Field tech cannot access admin dashboard', async ({ page }) => {
    await loginAs(page, TEST_USERS.fieldTech)
    
    // Try to access admin dashboard
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Should redirect to /field (page does the redirect)
    await expect(page).toHaveURL('/field')
  })

  test('Admin cannot access field dashboard', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    // Try to access field dashboard
    await page.goto('/field')
    await page.waitForLoadState('networkidle')
    
    // Should redirect to admin dashboard (page does the redirect)
    await expect(page).toHaveURL('/')
  })

  test('Invalid login shows error message', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button:has-text("Sign in")')
    
    // Should redirect with error in URL or show error on page
    await page.waitForTimeout(3000)
    
    // Check for error message in URL or on page
    const urlHasError = page.url().includes('error=')
    const errorMessage = page.locator('text=/error|invalid|incorrect|authentication/i')
    const hasError = await errorMessage.isVisible().catch(() => false)
    
    expect(hasError || urlHasError).toBe(true)
  })

  test('Job creation with missing fields shows validation', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    await page.goto('/jobs/new')
    
    // Try to submit with only title
    await page.fill('input[name="title"]', 'Test Job')
    // Don't fill address (required)
    
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // HTML5 validation should prevent submission
    // Form should still be visible
    await expect(page.locator('input[name="address"]')).toBeVisible()
  })

  test('Gate completion without required data shows error', async ({ page }) => {
    await loginAs(page, TEST_USERS.fieldTech)
    
    // This test requires a job to be assigned to the tech
    // For now, we'll check the structure
    
    // Navigate to a gate (if job exists)
    // Try to complete without filling required fields
    // Should show validation error
    
    // This is a placeholder - actual implementation depends on having a test job
    test.skip(true, 'Requires test job setup')
  })

  test('Photo upload error handling', async ({ page }) => {
    await loginAs(page, TEST_USERS.fieldTech)
    
    // Navigate to Photos gate
    // Try to upload invalid file
    // Should show error message
    
    test.skip(true, 'Requires file upload testing setup')
  })

  test('Network error during form submission', async ({ page, context }) => {
    // First login while online
    await loginAs(page, TEST_USERS.admin)
    
    // Navigate to job creation
    await page.goto('/jobs/new')
    await page.fill('input[name="title"]', 'Test Job')
    await page.fill('input[name="address"]', '123 Test St')
    
    // Simulate offline mode
    await context.setOffline(true)
    
    await page.click('button[type="submit"]:has-text("Create Job")')
    
    // Should show network error or stay on page
    await page.waitForTimeout(2000)
    
    // Check if we're still on the form page (network error prevented submission)
    const stillOnForm = page.url().includes('/jobs/new')
    expect(stillOnForm).toBe(true)
    
    // Re-enable network
    await context.setOffline(false)
  })
})

