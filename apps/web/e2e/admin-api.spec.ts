import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS } from './helpers/auth'

/**
 * E2E Tests for Admin API Endpoints
 * Tests the admin API functionality through the UI and direct API calls
 */

test.describe('Admin API - Jobs', () => {
  test('Admin can list jobs via API', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.admin)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const response = await page.request.get('/api/admin/jobs')
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data.jobs)).toBe(true)
    expect(data.data.pagination).toBeDefined()
  })

  test('Admin can create job via API', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.admin)
    
    // Wait for page to fully load and cookies to be set
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Give more time for cookies
    
    // Use page.request instead of request to share cookie context
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')
    const jobTitle = `API Test Job - ${Date.now()}`
    
    // Make request through page context to ensure cookies are shared
    const response = await page.request.post('/api/admin/jobs', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        title: jobTitle,
        address_line_1: '123 API Test St',
        status: 'lead',
      },
    })
    
    if (!response.ok()) {
      const errorText = await response.text()
      console.error('API Error:', response.status(), errorText)
    }
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.job.title).toBe(jobTitle)
    expect(data.data.job.id).toBeDefined()
    
    // Verify job appears in list
    const listResponse = await page.request.get('/api/admin/jobs')
    const listData = await listResponse.json()
    const createdJob = listData.data.jobs.find((j: any) => j.id === data.data.job.id)
    expect(createdJob).toBeDefined()
  })

  test('Admin can assign job to tech via API', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.admin)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // First, get a field tech user ID
    const usersResponse = await page.request.get('/api/admin/users?role=field_tech&limit=1')
    const usersData = await usersResponse.json()
    const fieldTech = usersData.data.users[0]
    
    if (!fieldTech) {
      test.skip(true, 'No field tech available for assignment')
      return
    }
    
    // Create a job
    const createResponse = await page.request.post('/api/admin/jobs', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        title: `Assignment Test - ${Date.now()}`,
        address_line_1: '123 Assign St',
      },
    })
    const createData = await createResponse.json()
    const jobId = createData.data.job.id
    
    // Assign job to tech
    const assignResponse = await page.request.post(`/api/admin/jobs/${jobId}/assign`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        lead_tech_id: fieldTech.id,
      },
    })
    
    expect(assignResponse.ok()).toBeTruthy()
    const assignData = await assignResponse.json()
    expect(assignData.success).toBe(true)
    expect(assignData.data.job.lead_tech_id).toBe(fieldTech.id)
  })
})

test.describe('Admin API - Users', () => {
  test('Admin can list users via API', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.admin)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const response = await page.request.get('/api/admin/users')
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data.users)).toBe(true)
  })

  test('Admin can get user details via API', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.admin)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')
    
    // Get users list first to get a valid user ID
    const usersResponse = await page.request.get('/api/admin/users?limit=1')
    const usersData = await usersResponse.json()
    const userId = usersData.data.users[0]?.id
    
    if (!userId) {
      test.skip(true, 'No users found')
      return
    }
    
    const response = await page.request.get(`/api/admin/users/${userId}`)
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.user.id).toBe(userId)
  })
})

test.describe('Admin API - Dashboard', () => {
  test('Admin can get dashboard stats via API', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.admin)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const response = await page.request.get('/api/admin/dashboard')
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.summary).toBeDefined()
    expect(data.data.summary.totalJobs).toBeDefined()
    expect(data.data.jobsByStatus).toBeDefined()
  })
})

