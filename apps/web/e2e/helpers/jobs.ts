import { Page } from '@playwright/test'

/**
 * Helper functions for job operations in E2E tests
 */

export interface JobData {
  title: string
  address: string
  leadTechId?: string
}

/**
 * Create a new job via the UI
 */
export async function createJob(page: Page, jobData: JobData): Promise<string> {
  // Navigate to job creation page
  await page.goto('/jobs/new')
  
  // Fill in job form
  await page.fill('input[name="title"]', jobData.title)
  await page.fill('input[name="address"]', jobData.address)
  
  // Select lead tech if provided
  if (jobData.leadTechId && jobData.leadTechId !== 'unassigned') {
    await page.selectOption('select[name="leadTechId"]', jobData.leadTechId)
  }
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('/', { timeout: 10000 })
  
  // Extract job ID from the page (from job list or URL)
  // For now, we'll return the job title and find it in the list
  return jobData.title
}

/**
 * Get the field tech user ID that we'll be logging in as
 * This ensures we assign jobs to the correct tech
 */
export async function getFieldTechUserIdForTest(page: Page, fieldTechEmail: string): Promise<string | null> {
  // We need to get the user ID from the auth system
  // Since we can't easily do this from the test, we'll use a workaround:
  // After logging in as the field tech, we can get their ID from the API response
  // For now, return null and we'll get it after login
  return null
}

/**
 * Find the tech option in the dropdown that matches the target user ID
 */
export async function findTechOptionByUserId(page: Page, targetUserId: string): Promise<string | null> {
  const techSelect = page.locator('select[name="leadTechId"]')
  const options = await techSelect.locator('option').all()
  
  for (const option of options.slice(1)) { // Skip "unassigned"
    const value = await option.getAttribute('value')
    if (value === targetUserId) {
      return value
    }
  }
  return null
}

/**
 * Get job ID by title from the field tech API
 * This is more reliable than trying to find it in the UI
 */
export async function getJobIdFromApi(page: Page, title: string): Promise<string | null> {
  try {
    const response = await page.request.get('/api/field/jobs')
    if (response.ok()) {
      const data = await response.json()
      const job = data.jobs?.find((j: any) => j.title === title)
      return job?.id || null
    }
  } catch (e) {
    // API might not be accessible
  }
  return null
}

/**
 * Get the logged-in user's ID from the API response
 */
export async function getCurrentUserId(page: Page): Promise<string | null> {
  try {
    // Try to get user ID from the jobs API response
    const response = await page.request.get('/api/field/jobs')
    if (response.ok()) {
      // The API uses the logged-in user's ID, but we can't get it directly
      // However, we can infer it by checking which jobs are returned
      // Actually, better: get it from the page context after login
      return null
    }
  } catch (e) {
    // API might not be accessible
  }
  return null
}

/**
 * Find a job by title in the job list
 * Since admin dashboard doesn't have clickable job links, we extract ID from network response
 */
export async function findJobByTitle(page: Page, title: string): Promise<string | null> {
  // Wait for page to load
  await page.waitForLoadState('networkidle')
  
  // First, verify the job title text on the page to confirm it exists
  const jobTitleElement = page.locator(`text=${title}`).first()
  const isVisible = await jobTitleElement.isVisible({ timeout: 5000 }).catch(() => false)
  
  if (!isVisible) {
    return null
  }
  
  // Try to get job ID from the page's data by intercepting network requests
  // or by checking if the job data is available in the page context
  // Since jobs are server-rendered, we can try to extract from the HTML structure
  
  // Alternative: Look for data attributes or IDs in the DOM
  // Check if the job list item has a data-job-id attribute
  const jobListItem = jobTitleElement.locator('xpath=ancestor::li')
  const dataJobId = await jobListItem.getAttribute('data-job-id').catch(() => null)
  if (dataJobId) {
    return dataJobId
  }
  
  // If that doesn't work, we'll need to use a workaround:
  // 1. Assign job to tech
  // 2. Login as tech
  // 3. Find job on tech dashboard (which has links)
  // For now, return null and tests will need to handle assignment first
  return null
}

/**
 * Assign a job to a tech
 */
export async function assignJobToTech(page: Page, jobId: string, techId: string): Promise<void> {
  // Navigate to job detail page
  await page.goto(`/jobs/${jobId}`)
  
  // Find and click assign button/select
  const assignSelect = page.locator('select[name*="tech"], select[id*="tech"]').first()
  if (await assignSelect.isVisible()) {
    await assignSelect.selectOption(techId)
    // Wait for update to complete
    await page.waitForTimeout(1000)
  }
}

/**
 * Get job ID from current URL
 */
export function getJobIdFromUrl(url: string): string | null {
  const match = url.match(/\/jobs\/([^\/]+)/)
  return match ? match[1] : null
}
