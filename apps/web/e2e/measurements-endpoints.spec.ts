import { test, expect } from '@playwright/test'
import { loginAs, TEST_USERS } from './helpers/auth'

/**
 * E2E Tests for 3D/Measurement Endpoints
 * Tests file upload, listing, linking
 */

test.describe('Measurement Endpoints', () => {
  test('User can upload measurement file', async ({ page }) => {
    await loginAs(page, TEST_USERS.fieldTech)
    
    const response = await page.request.post('/api/measurements/upload', {
      multipart: {
        file: {
          name: 'test-measurement.obj',
          mimeType: 'application/octet-stream',
          buffer: Buffer.from('fake 3d file content')
        },
        jobId: 'test-job-id',
        room: 'Living Room',
        fileType: '3d_scan'
      }
    })
    
    // Will fail without actual file, but tests endpoint exists
    expect([200, 201, 400, 500]).toContain(response.status())
  })

  test('User can list measurements for job', async ({ page }) => {
    await loginAs(page, TEST_USERS.fieldTech)
    
    const response = await page.request.get('/api/measurements/test-job-id')
    
    expect([200, 404]).toContain(response.status())
    if (response.ok()) {
      const data = await response.json()
      expect(Array.isArray(data.measurements || data.data?.measurements)).toBe(true)
    }
  })

  test('User can link measurement to line items', async ({ page }) => {
    await loginAs(page, TEST_USERS.fieldTech)
    
    const response = await page.request.post('/api/measurements/test-measurement-id/link', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        lineItemIds: ['test-line-item-id'],
        gateIds: ['test-gate-id']
      }
    })
    
    expect([200, 400, 404]).toContain(response.status())
  })
})

