/**
 * Work Management - Groups API E2E Tests
 * Tests CRUD operations for groups
 */

import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers/auth';

test.describe('Groups API', () => {
  let boardId: string | null = null;
  let groupId: string | null = null;
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

  test('Admin can create a group', async ({ page }) => {
    const groupName = `Test Group ${Date.now()}`;
    
    const response = await page.request.post('/api/groups', {
      data: {
        board_id: boardId,
        name: groupName,
        position: 0,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(groupName);
    expect(data.data.board_id).toBe(boardId);
    
    groupId = data.data.id;
  });

  test('Admin can list groups for board', async ({ page }) => {
    // Create a group first
    const createResponse = await page.request.post('/api/groups', {
      data: {
        board_id: boardId,
        name: `Test Group ${Date.now()}`,
        position: 0,
      },
    });
    const createData = await createResponse.json();
    groupId = createData.data.id;

    const response = await page.request.get(`/api/groups?board_id=${boardId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.groups)).toBe(true);
    expect(data.data.groups.length).toBeGreaterThan(0);
  });

  test('Admin can update group', async ({ page }) => {
    if (!groupId) {
      const createResponse = await page.request.post('/api/groups', {
        data: {
          board_id: boardId,
          name: `Test Group ${Date.now()}`,
          position: 0,
        },
      });
      const createData = await createResponse.json();
      groupId = createData.data.id;
    }

    const updatedName = `Updated Group ${Date.now()}`;
    const response = await page.request.put(`/api/groups/${groupId}`, {
      data: {
        name: updatedName,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(updatedName);
  });

  test('Admin can delete group', async ({ page }) => {
    // Create a group to delete
    const createResponse = await page.request.post('/api/groups', {
      data: {
        board_id: boardId,
        name: `Test Group ${Date.now()}`,
        position: 0,
      },
    });
    const createData = await createResponse.json();
    const deleteGroupId = createData.data.id;

    const response = await page.request.delete(`/api/groups/${deleteGroupId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify group is deleted
    const getResponse = await page.request.get(`/api/groups/${deleteGroupId}`);
    expect(getResponse.status()).toBe(404);
  });
});

