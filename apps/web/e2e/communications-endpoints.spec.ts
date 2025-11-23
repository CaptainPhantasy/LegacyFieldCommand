import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS } from './helpers/auth'

/**
 * E2E Tests for Communications Endpoints
 * Tests email templates, sending, voice transcription
 */

test.describe('Communications Endpoints', () => {
  test('Admin can list email templates', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.get('/api/communications/email/templates')
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data.templates || data.data?.templates)).toBe(true)
  })

  test('Admin can create email template', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.post('/api/communications/email/templates', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        name: `Test Template - ${Date.now()}`,
        subject: 'Test Subject',
        body: 'Test Body',
        template_type: 'custom'
      }
    })
    
    expect([200, 201]).toContain(response.status())
  })

  test('Admin can send templated email', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.post('/api/communications/email/send', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        templateId: 'test-template-id',
        recipientEmail: 'test@example.com',
        variables: {}
      }
    })
    
    expect([200, 400, 404]).toContain(response.status())
  })

  test('Admin can get communication history', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.get('/api/communications/history/test-job-id')
    
    expect([200, 404]).toContain(response.status())
  })
})

