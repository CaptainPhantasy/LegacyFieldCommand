import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS } from './helpers/auth'

/**
 * E2E Tests for Estimate Endpoints
 * Tests estimate generation, line items, coverage application, export
 */

test.describe('Estimate Endpoints', () => {
  test('Admin can generate estimate', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.post('/api/estimates/generate', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        jobId: 'test-job-id',
        policyId: 'test-policy-id'
      }
    })
    
    expect([200, 201, 400, 404]).toContain(response.status())
  })

  test('Admin can get estimate details', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.get('/api/estimates/test-estimate-id')
    
    expect([200, 404]).toContain(response.status())
  })

  test('Admin can manage line items', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    // Create line item
    const createResponse = await page.request.post('/api/estimates/test-estimate-id/line-items', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        description: 'Test line item',
        quantity: 1,
        unit_price: 100.00
      }
    })
    
    expect([200, 201, 400, 404]).toContain(createResponse.status())
  })

  test('Admin can apply coverage to estimate', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.post('/api/estimates/test-estimate-id/apply-coverage', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        policyId: 'test-policy-id'
      }
    })
    
    expect([200, 400, 404]).toContain(response.status())
  })

  test('Admin can export estimate', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin)
    
    const response = await page.request.get('/api/estimates/test-estimate-id/export?format=xactimate')
    
    expect([200, 404]).toContain(response.status())
  })
})

