/**
 * Field Documentation - Moisture & Equipment API E2E Tests
 * Tests CRUD operations for moisture points and equipment logs
 */

import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers/auth';

test.describe('Moisture & Equipment API', () => {
  let jobId: string | null = null;
  let chamberId: string | null = null;
  let moisturePointId: string | null = null;
  let equipmentLogId: string | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);
    
    // Create a job for testing
    const jobTitle = `Moisture Test Job ${Date.now()}`;
    const createResponse = await page.request.post('/api/admin/jobs', {
      data: {
        title: jobTitle,
        address_line_1: '123 Test St',
        status: 'lead',
      },
    });
    const jobData = await createResponse.json();
    jobId = jobData.data.id;

    // Create a chamber for testing
    const chamberResponse = await page.request.post('/api/hydro/chambers', {
      data: {
        job_id: jobId,
        name: `Test Chamber ${Date.now()}`,
        chamber_type: 'drying',
        status: 'active',
      },
    });
    const chamberData = await chamberResponse.json();
    chamberId = chamberData.data.id;
  });

  test('Field tech can create moisture point', async ({ page }) => {
    if (!chamberId) {
      test.skip();
      return;
    }

    const response = await page.request.post('/api/hydro/moisture', {
      data: {
        chamber_id: chamberId,
        x_coordinate: 10,
        y_coordinate: 20,
        moisture_level: 45,
        material_type: 'drywall',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.chamber_id).toBe(chamberId);
    expect(data.data.x_coordinate).toBe(10);
    expect(data.data.y_coordinate).toBe(20);
    expect(data.data.moisture_level).toBe(45);
    
    moisturePointId = data.data.id;
  });

  test('Field tech can list moisture points for chamber', async ({ page }) => {
    if (!chamberId) {
      test.skip();
      return;
    }

    // Create a moisture point first
    const createResponse = await page.request.post('/api/hydro/moisture', {
      data: {
        chamber_id: chamberId,
        x_coordinate: 10,
        y_coordinate: 20,
        moisture_level: 45,
        material_type: 'drywall',
      },
    });
    const createData = await createResponse.json();
    moisturePointId = createData.data.id;

    const response = await page.request.get(`/api/hydro/moisture?chamber_id=${chamberId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.moisture_points)).toBe(true);
    expect(data.data.moisture_points.length).toBeGreaterThan(0);
  });

  test('Field tech can update moisture point', async ({ page }) => {
    if (!chamberId) {
      test.skip();
      return;
    }

    if (!moisturePointId) {
      const createResponse = await page.request.post('/api/hydro/moisture', {
        data: {
          chamber_id: chamberId,
          x_coordinate: 10,
          y_coordinate: 20,
          moisture_level: 45,
          material_type: 'drywall',
        },
      });
      const createData = await createResponse.json();
      moisturePointId = createData.data.id;
    }

    const response = await page.request.put(`/api/hydro/moisture/${moisturePointId}`, {
      data: {
        moisture_level: 50,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.moisture_level).toBe(50);
  });

  test('Field tech can create equipment log', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    const response = await page.request.post('/api/hydro/equipment', {
      data: {
        job_id: jobId,
        equipment_type: 'dehumidifier',
        quantity: 2,
        is_active: true,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.job_id).toBe(jobId);
    expect(data.data.equipment_type).toBe('dehumidifier');
    expect(data.data.quantity).toBe(2);
    
    equipmentLogId = data.data.id;
  });

  test('Field tech can list equipment for job', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    // Create equipment log first
    const createResponse = await page.request.post('/api/hydro/equipment', {
      data: {
        job_id: jobId,
        equipment_type: 'air_mover',
        quantity: 3,
        is_active: true,
      },
    });
    const createData = await createResponse.json();
    equipmentLogId = createData.data.id;

    const response = await page.request.get(`/api/hydro/equipment?job_id=${jobId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.equipment)).toBe(true);
    expect(data.data.equipment.length).toBeGreaterThan(0);
  });

  test('Field tech can update equipment log', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    if (!equipmentLogId) {
      const createResponse = await page.request.post('/api/hydro/equipment', {
        data: {
          job_id: jobId,
          equipment_type: 'dehumidifier',
          quantity: 2,
          is_active: true,
        },
      });
      const createData = await createResponse.json();
      equipmentLogId = createData.data.id;
    }

    const response = await page.request.put(`/api/hydro/equipment/${equipmentLogId}`, {
      data: {
        quantity: 4,
        is_active: false,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.quantity).toBe(4);
    expect(data.data.is_active).toBe(false);
  });

  test('Field tech can delete moisture point', async ({ page }) => {
    if (!chamberId) {
      test.skip();
      return;
    }

    // Create a moisture point to delete
    const createResponse = await page.request.post('/api/hydro/moisture', {
      data: {
        chamber_id: chamberId,
        x_coordinate: 10,
        y_coordinate: 20,
        moisture_level: 45,
        material_type: 'drywall',
      },
    });
    const createData = await createResponse.json();
    const deleteMoisturePointId = createData.data.id;

    const response = await page.request.delete(`/api/hydro/moisture/${deleteMoisturePointId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify moisture point is deleted
    const getResponse = await page.request.get(`/api/hydro/moisture/${deleteMoisturePointId}`);
    expect(getResponse.status()).toBe(404);
  });
});

