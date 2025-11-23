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
    console.log('Body text snippet:', bodyText?.substring(0, 200) || '')
    throw new Error(`Login page not loaded. Title: ${pageTitle}, URL: ${page.url()}`)
  }
  
  // Fill in login form
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)
  
  // Submit form - button has text "Sign in" and formAction attribute
  await page.click('button:has-text("Sign in")')
  
  // Wait for navigation - use a more reliable strategy than networkidle
  // networkidle can timeout if there are continuous background requests (like auth checks)
  // Instead, wait for the URL to change with a reasonable timeout
  try {
    // Wait for URL to change from /login (either success or error redirect)
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  } catch (error) {
    // If navigation didn't happen, check current state
    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      // Check for error message in URL
      const errorInUrl = currentUrl.includes('error=')
      if (errorInUrl) {
        throw new Error(`Login failed: ${currentUrl}`)
      }
      // Give it a bit more time and check again
      await page.waitForTimeout(3000)
      const finalUrl = page.url()
      if (finalUrl.includes('/login') && !finalUrl.includes('error=')) {
        throw new Error(`Login did not redirect. Still on login page: ${finalUrl}`)
      }
    }
  }
  
  // Wait for redirect to specific page (admin goes to /, field tech goes to /field)
  // Use a more lenient timeout since we've already waited for navigation
  if (user.role === 'field_tech') {
    try {
      await page.waitForURL('/field', { timeout: 10000 })
    } catch {
      // If redirect didn't happen, check if we're on a valid page
      const url = page.url()
      if (url.includes('/login')) {
        throw new Error(`Expected redirect to /field but still on login: ${url}`)
      }
      // If we're on a different page, that might be okay (e.g., error page)
      // Let the test continue and see what happens
    }
  } else {
    try {
      await page.waitForURL('/', { timeout: 10000 })
    } catch {
      // If redirect didn't happen, check if we're on a valid page
      const url = page.url()
      if (url.includes('/login')) {
        throw new Error(`Expected redirect to / but still on login: ${url}`)
      }
      // If we're on a different page, that might be okay (e.g., error page)
      // Let the test continue and see what happens
    }
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

