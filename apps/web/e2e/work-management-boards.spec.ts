/**
 * Work Management - Boards API E2E Tests
 * Tests CRUD operations for boards
 */

import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers/auth';

test.describe('Boards API', () => {
  let boardId: string | null = null;
  let accountId: string | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);
    
    // Get account ID from user profile
    const response = await page.request.get('/api/admin/users');
    const data = await response.json();
    if (data.success && data.data?.users?.length > 0) {
      accountId = data.data.users[0].account_id;
    }
  });

  test('Admin can create a board', async ({ page }) => {
    const boardName = `Test Board ${Date.now()}`;
    
    const response = await page.request.post('/api/boards', {
      data: {
        name: boardName,
        board_type: 'active_jobs',
        account_id: accountId,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(boardName);
    expect(data.data.board_type).toBe('active_jobs');
    
    boardId = data.data.id;
  });

  test('Admin can list boards', async ({ page }) => {
    const response = await page.request.get('/api/boards');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.boards)).toBe(true);
  });

  test('Admin can filter boards by type', async ({ page }) => {
    const response = await page.request.get('/api/boards?board_type=active_jobs');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    if (data.data.boards.length > 0) {
      expect(data.data.boards[0].board_type).toBe('active_jobs');
    }
  });

  test('Admin can get board details', async ({ page }) => {
    if (!boardId) {
      // Create a board first
      const createResponse = await page.request.post('/api/boards', {
        data: {
          name: `Test Board ${Date.now()}`,
          board_type: 'active_jobs',
          account_id: accountId,
        },
      });
      const createData = await createResponse.json();
      boardId = createData.data.id;
    }

    const response = await page.request.get(`/api/boards/${boardId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(boardId);
  });

  test('Admin can update board', async ({ page }) => {
    if (!boardId) {
      const createResponse = await page.request.post('/api/boards', {
        data: {
          name: `Test Board ${Date.now()}`,
          board_type: 'active_jobs',
          account_id: accountId,
        },
      });
      const createData = await createResponse.json();
      boardId = createData.data.id;
    }

    const updatedName = `Updated Board ${Date.now()}`;
    const response = await page.request.put(`/api/boards/${boardId}`, {
      data: {
        name: updatedName,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(updatedName);
  });

  test('Admin can delete board', async ({ page }) => {
    // Create a board to delete
    const createResponse = await page.request.post('/api/boards', {
      data: {
        name: `Test Board ${Date.now()}`,
        board_type: 'active_jobs',
        account_id: accountId,
      },
    });
    const createData = await createResponse.json();
    const deleteBoardId = createData.data.id;

    const response = await page.request.delete(`/api/boards/${deleteBoardId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify board is deleted
    const getResponse = await page.request.get(`/api/boards/${deleteBoardId}`);
    expect(getResponse.status()).toBe(404);
  });

  test('Non-admin cannot create board', async ({ page }) => {
    await loginAs(page, TEST_USERS.fieldTech);
    
    const response = await page.request.post('/api/boards', {
      data: {
        name: 'Unauthorized Board',
        board_type: 'active_jobs',
        account_id: accountId,
      },
    });

    // Should fail with 403 or 401
    expect([401, 403]).toContain(response.status());
  });
});

