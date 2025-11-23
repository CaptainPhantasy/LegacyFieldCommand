/**
 * Work Management - Items API E2E Tests
 * Tests CRUD operations for items and column values
 */

import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers/auth';

test.describe('Items API', () => {
  let boardId: string | null = null;
  let itemId: string | null = null;
  let statusColumnId: string | null = null;
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

    // Create a status column
    const columnResponse = await page.request.post('/api/columns', {
      data: {
        board_id: boardId,
        title: 'Status',
        column_type: 'status',
        position: 0,
      },
    });
    const columnData = await columnResponse.json();
    statusColumnId = columnData.data.id;
  });

  test('Admin can create an item', async ({ page }) => {
    const itemName = `Test Item ${Date.now()}`;
    
    const response = await page.request.post('/api/items', {
      data: {
        board_id: boardId,
        name: itemName,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(itemName);
    expect(data.data.board_id).toBe(boardId);
    
    itemId = data.data.id;
  });

  test('Admin can list items for board', async ({ page }) => {
    // Create an item first
    const createResponse = await page.request.post('/api/items', {
      data: {
        board_id: boardId,
        name: `Test Item ${Date.now()}`,
      },
    });
    const createData = await createResponse.json();
    itemId = createData.data.id;

    const response = await page.request.get(`/api/items?board_id=${boardId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.items)).toBe(true);
    expect(data.data.items.length).toBeGreaterThan(0);
  });

  test('Admin can get item details', async ({ page }) => {
    if (!itemId) {
      const createResponse = await page.request.post('/api/items', {
        data: {
          board_id: boardId,
          name: `Test Item ${Date.now()}`,
        },
      });
      const createData = await createResponse.json();
      itemId = createData.data.id;
    }

    const response = await page.request.get(`/api/items/${itemId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(itemId);
    expect(Array.isArray(data.data.column_values)).toBe(true);
  });

  test('Admin can update item column values', async ({ page }) => {
    if (!itemId || !statusColumnId) {
      const createResponse = await page.request.post('/api/items', {
        data: {
          board_id: boardId,
          name: `Test Item ${Date.now()}`,
        },
      });
      const createData = await createResponse.json();
      itemId = createData.data.id;
    }

    const response = await page.request.put(`/api/items/${itemId}/column-values`, {
      data: {
        values: [
          {
            column_id: statusColumnId,
            value: 'In Progress',
            text_value: 'In Progress',
          },
        ],
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.column_values)).toBe(true);
    expect(data.data.column_values.length).toBeGreaterThan(0);
  });

  test('Admin can update item', async ({ page }) => {
    if (!itemId) {
      const createResponse = await page.request.post('/api/items', {
        data: {
          board_id: boardId,
          name: `Test Item ${Date.now()}`,
        },
      });
      const createData = await createResponse.json();
      itemId = createData.data.id;
    }

    const updatedName = `Updated Item ${Date.now()}`;
    const response = await page.request.put(`/api/items/${itemId}`, {
      data: {
        name: updatedName,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(updatedName);
  });

  test('Admin can delete item', async ({ page }) => {
    // Create an item to delete
    const createResponse = await page.request.post('/api/items', {
      data: {
        board_id: boardId,
        name: `Test Item ${Date.now()}`,
      },
    });
    const createData = await createResponse.json();
    const deleteItemId = createData.data.id;

    const response = await page.request.delete(`/api/items/${deleteItemId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify item is deleted
    const getResponse = await page.request.get(`/api/items/${deleteItemId}`);
    expect(getResponse.status()).toBe(404);
  });
});

