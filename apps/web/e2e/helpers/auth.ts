import { Page } from '@playwright/test'

/**
 * Helper functions for authentication in E2E tests
 */

export interface TestUser {
  email: string
  password: string
  role: 'admin' | 'field_tech'
}

// Test users - these should exist in your Supabase test database
// IMPORTANT: Use valid email addresses to prevent bounce issues
// If email confirmations are disabled in Supabase, any format works
// If enabled, use real email addresses you control
export const TEST_USERS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'test@legacyfield.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'TestPass123!',
    role: 'admin' as const,
  },
  fieldTech: {
    email: process.env.TEST_TECH_EMAIL || 'tech@legacyfield.com',
    password: process.env.TEST_TECH_PASSWORD || 'TestPass123!',
    role: 'field_tech' as const,
  },
}

/**
 * NOTE: To prevent email bounce issues:
 * 1. Disable email confirmations in Supabase Dashboard (recommended for dev)
 * 2. Or use valid email addresses you control
 * 3. Or set up custom SMTP provider for production
 */

/**
 * Login as a specific user
 */
export async function loginAs(page: Page, user: TestUser): Promise<void> {
  // Navigate to login with longer timeout for mobile
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 90000 })
  
  // Wait for page to be ready - try multiple selectors
  try {
    await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 60000 })
  } catch (error) {
    // If email input not found, check what's on the page
    const bodyText = await page.textContent('body').catch(() => '')
    const pageTitle = await page.title().catch(() => '')
    console.log('Page title:', pageTitle)
    console.log('Body text snippet:', bodyText.substring(0, 200))
    throw new Error(`Login page not loaded. Title: ${pageTitle}, URL: ${page.url()}`)
  }
  
  // Fill in login form
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)
  
  // Submit form - button has text "Sign in" and formAction attribute
  await page.click('button:has-text("Sign in")')
  
  // Wait for navigation - might redirect to login with error or to dashboard
  await page.waitForLoadState('networkidle')
  
  // Check if we're still on login page (error case)
  const currentUrl = page.url()
  if (currentUrl.includes('/login')) {
    // Check for error message
    const errorInUrl = currentUrl.includes('error=')
    if (errorInUrl) {
      throw new Error(`Login failed: ${currentUrl}`)
    }
    // If no error in URL but still on login, wait a bit more
    await page.waitForTimeout(1000)
  }
  
  // Wait for redirect (admin goes to /, field tech goes to /field)
  // Note: Pages do the redirect, not middleware
  if (user.role === 'field_tech') {
    await page.waitForURL('/field', { timeout: 10000 })
  } else {
    await page.waitForURL('/', { timeout: 10000 })
  }
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Look for sign out link
  const signOutLink = page.locator('a[href*="signout"]').first()
  if (await signOutLink.isVisible()) {
    await signOutLink.click()
    await page.waitForURL('/login', { timeout: 5000 })
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check if we're on login page
  const currentUrl = page.url()
  if (currentUrl.includes('/login')) {
    return false
  }
  
  // Check for sign out link (indicates logged in)
  const signOutLink = page.locator('a[href*="signout"]').first()
  return await signOutLink.isVisible().catch(() => false)
}

