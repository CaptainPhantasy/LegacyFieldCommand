/**
 * Work Management - Dashboards API E2E Tests
 * Tests CRUD operations for dashboards
 */

import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers/auth';

test.describe('Dashboards API', () => {
  let boardId: string | null = null;
  let dashboardId: string | null = null;
  let accountId: string | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);
    
    // Get account ID
    const userResponse = await page.request.get('/api/admin/users');
    const userData = await userResponse.json();
    if (userData.success && userData.data?.users?.length > 0) {
      accountId = userData.data.users[0].account_id;
    }

    // Create a board for testing
    const boardResponse = await page.request.post('/api/boards', {
      data: {
        name: `Test Board ${Date.now()}`,
        board_type: 'active_jobs',
        account_id: accountId,
      },
    });
    const boardData = await boardResponse.json();
    boardId = boardData.data.id;
  });

  test('Admin can create a dashboard', async ({ page }) => {
    if (!boardId) {
      test.skip();
      return;
    }

    const dashboardName = `Test Dashboard ${Date.now()}`;
    
    const response = await page.request.post('/api/dashboards', {
      data: {
        board_id: boardId,
        name: dashboardName,
        layout: 'grid',
        widgets: [],
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(dashboardName);
    expect(data.data.board_id).toBe(boardId);
    
    dashboardId = data.data.id;
  });

  test('Admin can list dashboards for board', async ({ page }) => {
    if (!boardId) {
      test.skip();
      return;
    }

    // Create a dashboard first
    const createResponse = await page.request.post('/api/dashboards', {
      data: {
        board_id: boardId,
        name: `Test Dashboard ${Date.now()}`,
        layout: 'grid',
        widgets: [],
      },
    });
    const createData = await createResponse.json();
    dashboardId = createData.data.id;

    const response = await page.request.get(`/api/dashboards?board_id=${boardId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.dashboards)).toBe(true);
    expect(data.data.dashboards.length).toBeGreaterThan(0);
  });

  test('Admin can get dashboard details', async ({ page }) => {
    if (!boardId) {
      test.skip();
      return;
    }

    if (!dashboardId) {
      const createResponse = await page.request.post('/api/dashboards', {
        data: {
          board_id: boardId,
          name: `Test Dashboard ${Date.now()}`,
          layout: 'grid',
          widgets: [],
        },
      });
      const createData = await createResponse.json();
      dashboardId = createData.data.id;
    }

    const response = await page.request.get(`/api/dashboards/${dashboardId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(dashboardId);
  });

  test('Admin can update dashboard', async ({ page }) => {
    if (!boardId) {
      test.skip();
      return;
    }

    if (!dashboardId) {
      const createResponse = await page.request.post('/api/dashboards', {
        data: {
          board_id: boardId,
          name: `Test Dashboard ${Date.now()}`,
          layout: 'grid',
          widgets: [],
        },
      });
      const createData = await createResponse.json();
      dashboardId = createData.data.id;
    }

    const updatedName = `Updated Dashboard ${Date.now()}`;
    const response = await page.request.put(`/api/dashboards/${dashboardId}`, {
      data: {
        name: updatedName,
        widgets: [
          {
            type: 'chart',
            config: {},
          },
        ],
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(updatedName);
    expect(Array.isArray(data.data.widgets)).toBe(true);
  });

  test('Admin can delete dashboard', async ({ page }) => {
    if (!boardId) {
      test.skip();
      return;
    }

    // Create a dashboard to delete
    const createResponse = await page.request.post('/api/dashboards', {
      data: {
        board_id: boardId,
        name: `Test Dashboard ${Date.now()}`,
        layout: 'grid',
        widgets: [],
      },
    });
    const createData = await createResponse.json();
    const deleteDashboardId = createData.data.id;

    const response = await page.request.delete(`/api/dashboards/${deleteDashboardId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify dashboard is deleted
    const getResponse = await page.request.get(`/api/dashboards/${deleteDashboardId}`);
    expect(getResponse.status()).toBe(404);
  });
});

