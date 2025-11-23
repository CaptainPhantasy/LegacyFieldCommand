/**
 * Work Management - Subitems API E2E Tests
 * Tests CRUD operations for subitems
 */

import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers/auth';

test.describe('Subitems API', () => {
  let boardId: string | null = null;
  let itemId: string | null = null;
  let subitemId: string | null = null;
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

    // Create an item for testing
    const itemResponse = await page.request.post('/api/items', {
      data: {
        board_id: boardId,
        name: `Test Item ${Date.now()}`,
      },
    });
    const itemData = await itemResponse.json();
    itemId = itemData.data.id;
  });

  test('Admin can create a subitem', async ({ page }) => {
    if (!itemId) {
      test.skip();
      return;
    }

    const subitemName = `Test Subitem ${Date.now()}`;
    
    const response = await page.request.post('/api/subitems', {
      data: {
        item_id: itemId,
        name: subitemName,
        position: 0,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(subitemName);
    expect(data.data.item_id).toBe(itemId);
    expect(data.data.is_completed).toBe(false);
    
    subitemId = data.data.id;
  });

  test('Admin can list subitems for item', async ({ page }) => {
    if (!itemId) {
      test.skip();
      return;
    }

    // Create a subitem first
    const createResponse = await page.request.post('/api/subitems', {
      data: {
        item_id: itemId,
        name: `Test Subitem ${Date.now()}`,
        position: 0,
      },
    });
    const createData = await createResponse.json();
    subitemId = createData.data.id;

    const response = await page.request.get(`/api/subitems?item_id=${itemId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.subitems)).toBe(true);
    expect(data.data.subitems.length).toBeGreaterThan(0);
  });

  test('Admin can toggle subitem completion', async ({ page }) => {
    if (!itemId) {
      test.skip();
      return;
    }

    if (!subitemId) {
      const createResponse = await page.request.post('/api/subitems', {
        data: {
          item_id: itemId,
          name: `Test Subitem ${Date.now()}`,
          position: 0,
        },
      });
      const createData = await createResponse.json();
      subitemId = createData.data.id;
    }

    // Toggle to completed
    const completeResponse = await page.request.patch(`/api/subitems/${subitemId}/complete`, {
      data: {},
    });

    expect(completeResponse.ok()).toBeTruthy();
    const completeData = await completeResponse.json();
    expect(completeData.success).toBe(true);
    expect(completeData.data.is_completed).toBe(true);

    // Toggle back to incomplete
    const incompleteResponse = await page.request.patch(`/api/subitems/${subitemId}/complete`, {
      data: {},
    });

    expect(incompleteResponse.ok()).toBeTruthy();
    const incompleteData = await incompleteResponse.json();
    expect(incompleteData.success).toBe(true);
    expect(incompleteData.data.is_completed).toBe(false);
  });

  test('Admin can update subitem', async ({ page }) => {
    if (!itemId) {
      test.skip();
      return;
    }

    if (!subitemId) {
      const createResponse = await page.request.post('/api/subitems', {
        data: {
          item_id: itemId,
          name: `Test Subitem ${Date.now()}`,
          position: 0,
        },
      });
      const createData = await createResponse.json();
      subitemId = createData.data.id;
    }

    const updatedName = `Updated Subitem ${Date.now()}`;
    const response = await page.request.put(`/api/subitems/${subitemId}`, {
      data: {
        name: updatedName,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(updatedName);
  });

  test('Admin can delete subitem', async ({ page }) => {
    if (!itemId) {
      test.skip();
      return;
    }

    // Create a subitem to delete
    const createResponse = await page.request.post('/api/subitems', {
      data: {
        item_id: itemId,
        name: `Test Subitem ${Date.now()}`,
        position: 0,
      },
    });
    const createData = await createResponse.json();
    const deleteSubitemId = createData.data.id;

    const response = await page.request.delete(`/api/subitems/${deleteSubitemId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify subitem is deleted
    const getResponse = await page.request.get(`/api/subitems/${deleteSubitemId}`);
    expect(getResponse.status()).toBe(404);
  });
});

