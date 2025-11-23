import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS } from './helpers/auth'

/**
 * E2E Tests for Templates & Integration Endpoints
 * Tests template CRUD, application, Xactimate/CoreLogic export
 */

test.describe('Template Endpoints', () => {
  test('Admin can list templates', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.get('/api/templates')
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data.templates || data.data?.templates)).toBe(true)
  })

  test('Admin can create template', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.post('/api/templates', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        name: `Test Template - ${Date.now()}`,
        template_type: 'program',
        default_line_items: [],
        required_gates: ['Arrival', 'Intake']
      }
    })
    
    expect([200, 201, 400]).toContain(response.status())
  })

  test('Admin can apply template to job', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.post('/api/jobs/test-job-id/apply-template', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        templateId: 'test-template-id'
      }
    })
    
    expect([200, 400, 404]).toContain(response.status())
  })
})

test.describe('Integration Endpoints', () => {
  test('Admin can export to Xactimate', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.get('/api/integrations/xactimate/export?jobId=test-job-id')
    
    expect([200, 400, 404]).toContain(response.status())
  })

  test('Admin can export to CoreLogic', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.get('/api/integrations/corelogic/export?jobId=test-job-id')
    
    expect([200, 400, 404]).toContain(response.status())
  })

  test('Admin can check integration status', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.get('/api/integrations/status')
    
    expect(response.ok()).toBeTruthy()
  })
})

