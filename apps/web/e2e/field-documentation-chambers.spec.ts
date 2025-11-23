/**
 * Field Documentation - Chambers API E2E Tests
 * Tests CRUD operations for chambers and psychrometric readings
 */

import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers/auth';
import { createJob } from './helpers/jobs';

test.describe('Chambers API', () => {
  let jobId: string | null = null;
  let chamberId: string | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);
    
    // Create a job for testing
    const jobTitle = `Chamber Test Job ${Date.now()}`;
    const createResponse = await page.request.post('/api/admin/jobs', {
      data: {
        title: jobTitle,
        address_line_1: '123 Test St',
        status: 'lead',
      },
    });
    const jobData = await createResponse.json();
    jobId = jobData.data.id;
  });

  test('Field tech can create a chamber', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    const chamberName = `Test Chamber ${Date.now()}`;
    
    const response = await page.request.post('/api/hydro/chambers', {
      data: {
        job_id: jobId,
        name: chamberName,
        chamber_type: 'drying',
        status: 'active',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(chamberName);
    expect(data.data.job_id).toBe(jobId);
    
    chamberId = data.data.id;
  });

  test('Field tech can list chambers for job', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    // Create a chamber first
    const createResponse = await page.request.post('/api/hydro/chambers', {
      data: {
        job_id: jobId,
        name: `Test Chamber ${Date.now()}`,
        chamber_type: 'drying',
        status: 'active',
      },
    });
    const createData = await createResponse.json();
    chamberId = createData.data.id;

    const response = await page.request.get(`/api/hydro/chambers?job_id=${jobId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.chambers)).toBe(true);
    expect(data.data.chambers.length).toBeGreaterThan(0);
  });

  test('Field tech can add psychrometric reading', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    // Create a chamber first
    const createResponse = await page.request.post('/api/hydro/chambers', {
      data: {
        job_id: jobId,
        name: `Test Chamber ${Date.now()}`,
        chamber_type: 'drying',
        status: 'active',
      },
    });
    const createData = await createResponse.json();
    chamberId = createData.data.id;

    // Add psychrometric reading
    const readingResponse = await page.request.post('/api/hydro/psychrometrics', {
      data: {
        chamber_id: chamberId,
        ambient_temp_f: 72,
        relative_humidity: 45,
        grains_per_pound: 55,
      },
    });

    expect(readingResponse.ok()).toBeTruthy();
    const readingData = await readingResponse.json();
    expect(readingData.success).toBe(true);
    expect(readingData.data.ambient_temp_f).toBe(72);
    expect(readingData.data.relative_humidity).toBe(45);
  });

  test('Field tech can update chamber', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    if (!chamberId) {
      const createResponse = await page.request.post('/api/hydro/chambers', {
        data: {
          job_id: jobId,
          name: `Test Chamber ${Date.now()}`,
          chamber_type: 'drying',
          status: 'active',
        },
      });
      const createData = await createResponse.json();
      chamberId = createData.data.id;
    }

    const updatedName = `Updated Chamber ${Date.now()}`;
    const response = await page.request.put(`/api/hydro/chambers/${chamberId}`, {
      data: {
        name: updatedName,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(updatedName);
  });

  test('Field tech can delete chamber', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    // Create a chamber to delete
    const createResponse = await page.request.post('/api/hydro/chambers', {
      data: {
        job_id: jobId,
        name: `Test Chamber ${Date.now()}`,
        chamber_type: 'drying',
        status: 'active',
      },
    });
    const createData = await createResponse.json();
    const deleteChamberId = createData.data.id;

    const response = await page.request.delete(`/api/hydro/chambers/${deleteChamberId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify chamber is deleted
    const getResponse = await page.request.get(`/api/hydro/chambers/${deleteChamberId}`);
    expect(getResponse.status()).toBe(404);
  });
});

