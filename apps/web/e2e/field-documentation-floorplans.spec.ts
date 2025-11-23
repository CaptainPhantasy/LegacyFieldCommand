/**
 * Field Documentation - Floor Plans, Rooms, Boxes, Content API E2E Tests
 * Tests CRUD operations for floor plans, rooms, boxes, and content items
 */

import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers/auth';

test.describe('Floor Plans, Rooms, Boxes, Content API', () => {
  let jobId: string | null = null;
  let floorPlanId: string | null = null;
  let roomId: string | null = null;
  let boxId: string | null = null;
  let contentItemId: string | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);
    
    // Create a job for testing
    const jobTitle = `Floor Plan Test Job ${Date.now()}`;
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

  test('Field tech can create floor plan', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    const response = await page.request.post('/api/floor-plans', {
      data: {
        job_id: jobId,
        name: `Test Floor Plan ${Date.now()}`,
        floor_level: 1,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.job_id).toBe(jobId);
    expect(data.data.name).toBeDefined();
    
    floorPlanId = data.data.id;
  });

  test('Field tech can list floor plans for job', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    // Create a floor plan first
    const createResponse = await page.request.post('/api/floor-plans', {
      data: {
        job_id: jobId,
        name: `Test Floor Plan ${Date.now()}`,
        floor_level: 1,
      },
    });
    const createData = await createResponse.json();
    floorPlanId = createData.data.id;

    const response = await page.request.get(`/api/floor-plans?job_id=${jobId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.floor_plans)).toBe(true);
    expect(data.data.floor_plans.length).toBeGreaterThan(0);
  });

  test('Field tech can create room', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    const response = await page.request.post('/api/rooms', {
      data: {
        job_id: jobId,
        name: `Test Room ${Date.now()}`,
        room_type: 'bedroom',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.job_id).toBe(jobId);
    expect(data.data.name).toBeDefined();
    
    roomId = data.data.id;
  });

  test('Field tech can link room to floor plan', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    // Create floor plan and room
    const floorPlanResponse = await page.request.post('/api/floor-plans', {
      data: {
        job_id: jobId,
        name: `Test Floor Plan ${Date.now()}`,
        floor_level: 1,
      },
    });
    const floorPlanData = await floorPlanResponse.json();
    floorPlanId = floorPlanData.data.id;

    const roomResponse = await page.request.post('/api/rooms', {
      data: {
        job_id: jobId,
        name: `Test Room ${Date.now()}`,
        room_type: 'bedroom',
      },
    });
    const roomData = await roomResponse.json();
    roomId = roomData.data.id;

    // Link room to floor plan
    const linkResponse = await page.request.post(`/api/rooms/${roomId}/link-floor-plan`, {
      data: {
        floor_plan_id: floorPlanId,
        x_coordinate: 100,
        y_coordinate: 200,
      },
    });

    expect(linkResponse.ok()).toBeTruthy();
    const linkData = await linkResponse.json();
    expect(linkData.success).toBe(true);
  });

  test('Field tech can create box', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    if (!roomId) {
      const roomResponse = await page.request.post('/api/rooms', {
        data: {
          job_id: jobId,
          name: `Test Room ${Date.now()}`,
          room_type: 'bedroom',
        },
      });
      const roomData = await roomResponse.json();
      roomId = roomData.data.id;
    }

    const response = await page.request.post('/api/boxes', {
      data: {
        job_id: jobId,
        room_id: roomId,
        box_number: `BOX-${Date.now()}`,
        status: 'packed',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.job_id).toBe(jobId);
    expect(data.data.room_id).toBe(roomId);
    
    boxId = data.data.id;
  });

  test('Field tech can add content item to box', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    if (!roomId) {
      const roomResponse = await page.request.post('/api/rooms', {
        data: {
          job_id: jobId,
          name: `Test Room ${Date.now()}`,
          room_type: 'bedroom',
        },
      });
      const roomData = await roomResponse.json();
      roomId = roomData.data.id;
    }

    if (!boxId) {
      const boxResponse = await page.request.post('/api/boxes', {
        data: {
          job_id: jobId,
          room_id: roomId,
          box_number: `BOX-${Date.now()}`,
          status: 'packed',
        },
      });
      const boxData = await boxResponse.json();
      boxId = boxData.data.id;
    }

    const response = await page.request.post('/api/content-items', {
      data: {
        box_id: boxId,
        description: `Test Content Item ${Date.now()}`,
        quantity: 1,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.box_id).toBe(boxId);
    
    contentItemId = data.data.id;
  });

  test('Field tech can list boxes for job', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    if (!roomId) {
      const roomResponse = await page.request.post('/api/rooms', {
        data: {
          job_id: jobId,
          name: `Test Room ${Date.now()}`,
          room_type: 'bedroom',
        },
      });
      const roomData = await roomResponse.json();
      roomId = roomData.data.id;
    }

    // Create a box first
    const createResponse = await page.request.post('/api/boxes', {
      data: {
        job_id: jobId,
        room_id: roomId,
        box_number: `BOX-${Date.now()}`,
        status: 'packed',
      },
    });
    const createData = await createResponse.json();
    boxId = createData.data.id;

    const response = await page.request.get(`/api/boxes?job_id=${jobId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.boxes)).toBe(true);
    expect(data.data.boxes.length).toBeGreaterThan(0);
  });

  test('Field tech can update box status', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    if (!roomId) {
      const roomResponse = await page.request.post('/api/rooms', {
        data: {
          job_id: jobId,
          name: `Test Room ${Date.now()}`,
          room_type: 'bedroom',
        },
      });
      const roomData = await roomResponse.json();
      roomId = roomData.data.id;
    }

    if (!boxId) {
      const boxResponse = await page.request.post('/api/boxes', {
        data: {
          job_id: jobId,
          room_id: roomId,
          box_number: `BOX-${Date.now()}`,
          status: 'packed',
        },
      });
      const boxData = await boxResponse.json();
      boxId = boxData.data.id;
    }

    const response = await page.request.put(`/api/boxes/${boxId}`, {
      data: {
        status: 'moved',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('moved');
  });

  test('Field tech can list content items for box', async ({ page }) => {
    if (!boxId) {
      test.skip();
      return;
    }

    // Create a content item first
    const createResponse = await page.request.post('/api/content-items', {
      data: {
        box_id: boxId,
        description: `Test Content Item ${Date.now()}`,
        quantity: 1,
      },
    });
    const createData = await createResponse.json();
    contentItemId = createData.data.id;

    const response = await page.request.get(`/api/content-items?box_id=${boxId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.content_items)).toBe(true);
    expect(data.data.content_items.length).toBeGreaterThan(0);
  });
});

