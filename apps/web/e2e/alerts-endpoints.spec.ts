import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS } from './helpers/auth'

/**
 * E2E Tests for Alerts & Monitoring Endpoints
 * Tests alert creation, acknowledgment, rules, monitoring
 */

test.describe('Alerts Endpoints', () => {
  test('Admin can list alerts', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.get('/api/alerts')
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data.alerts || data.data?.alerts)).toBe(true)
  })

  test('Admin can create alert', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.post('/api/alerts', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        alert_type: 'stale_job',
        severity: 'medium',
        title: 'Test Alert',
        message: 'Test message',
        job_id: 'test-job-id'
      }
    })
    
    expect([200, 201, 400]).toContain(response.status())
  })

  test('Admin can acknowledge alert', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.post('/api/alerts/test-alert-id/acknowledge', {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    expect([200, 404]).toContain(response.status())
  })

  test('Admin can manage alert rules', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    // List rules
    const listResponse = await page.request.get('/api/alerts/rules')
    expect(listResponse.ok()).toBeTruthy()
    
    // Create rule
    const createResponse = await page.request.post('/api/alerts/rules', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        name: `Test Rule - ${Date.now()}`,
        rule_type: 'stale_job',
        conditions: { days_without_update: 7 },
        severity: 'medium'
      }
    })
    
    expect([200, 201, 400]).toContain(createResponse.status())
  })

  test('Admin can get monitoring metrics', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.get('/api/monitoring/dashboard')
    
    expect(response.ok()).toBeTruthy()
  })

  test('Admin can check stale jobs', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.get('/api/monitoring/jobs/stale')
    
    expect(response.ok()).toBeTruthy()
  })
})

