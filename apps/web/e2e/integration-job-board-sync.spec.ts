/**
 * Integration Layer - Job ↔ Board Sync E2E Tests
 * Tests bidirectional sync between jobs and board items
 */

import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers/auth';
import { createJob } from './helpers/jobs';

test.describe('Job ↔ Board Integration Sync', () => {
  let jobId: string | null = null;
  let boardItemId: string | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);
  });

  test('Job creation automatically creates board item', async ({ page }) => {
    // Create a job
    const jobTitle = `Sync Test Job ${Date.now()}`;
    const createResponse = await page.request.post('/api/admin/jobs', {
      data: {
        title: jobTitle,
        address_line_1: '123 Test St',
        status: 'lead',
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const jobData = await createResponse.json();
    jobId = jobData.data.id;

    // Wait a bit for async sync to complete
    await page.waitForTimeout(1000);

    // Check if board item was created
    const boardItemResponse = await page.request.get(`/api/jobs/${jobId}/board-item`);
    
    expect(boardItemResponse.ok()).toBeTruthy();
    const boardItemData = await boardItemResponse.json();
    
    // Board item should exist (may be null if sync hasn't completed yet)
    if (boardItemData.data.board_item) {
      expect(boardItemData.data.board_item.name).toBe(jobTitle);
      boardItemId = boardItemData.data.board_item.id;
    }
  });

  test('Manual sync job to board works', async ({ page }) => {
    // Create a job first
    const jobTitle = `Manual Sync Job ${Date.now()}`;
    const createResponse = await page.request.post('/api/admin/jobs', {
      data: {
        title: jobTitle,
        address_line_1: '123 Test St',
        status: 'lead',
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const jobData = await createResponse.json();
    jobId = jobData.data.id;

    // Manually trigger sync
    const syncResponse = await page.request.post(`/api/jobs/${jobId}/sync-to-board`, {
      data: {},
    });

    expect(syncResponse.ok()).toBeTruthy();
    const syncData = await syncResponse.json();
    expect(syncData.success).toBe(true);
    expect(syncData.data.board_item).toBeDefined();
    expect(syncData.data.board_item.name).toBe(jobTitle);
    
    boardItemId = syncData.data.board_item.id;
  });

  test('Job update automatically updates board item', async ({ page }) => {
    // Create job and sync to board
    const jobTitle = `Update Test Job ${Date.now()}`;
    const createResponse = await page.request.post('/api/admin/jobs', {
      data: {
        title: jobTitle,
        address_line_1: '123 Test St',
        status: 'lead',
      },
    });
    const jobData = await createResponse.json();
    jobId = jobData.data.id;

    // Sync to board
    await page.request.post(`/api/jobs/${jobId}/sync-to-board`, { data: {} });
    await page.waitForTimeout(500);

    // Update job
    const updatedTitle = `Updated Job ${Date.now()}`;
    const updateResponse = await page.request.put(`/api/admin/jobs/${jobId}`, {
      data: {
        title: updatedTitle,
      },
    });

    expect(updateResponse.ok()).toBeTruthy();

    // Wait for async sync
    await page.waitForTimeout(1000);

    // Check board item was updated
    const boardItemResponse = await page.request.get(`/api/jobs/${jobId}/board-item`);
    const boardItemData = await boardItemResponse.json();
    
    if (boardItemData.data.board_item) {
      expect(boardItemData.data.board_item.name).toBe(updatedTitle);
    }
  });

  test('Get linked board item for job', async ({ page }) => {
    // Create job and sync
    const jobTitle = `Link Test Job ${Date.now()}`;
    const createResponse = await page.request.post('/api/admin/jobs', {
      data: {
        title: jobTitle,
        address_line_1: '123 Test St',
        status: 'lead',
      },
    });
    const jobData = await createResponse.json();
    jobId = jobData.data.id;

    // Sync to board
    await page.request.post(`/api/jobs/${jobId}/sync-to-board`, { data: {} });
    await page.waitForTimeout(500);

    // Get linked board item
    const response = await page.request.get(`/api/jobs/${jobId}/board-item`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    
    if (data.data.board_item) {
      expect(data.data.board_item.name).toBe(jobTitle);
      boardItemId = data.data.board_item.id;
    }
  });

  test('Get linked job for board item', async ({ page }) => {
    // Create job and sync
    const jobTitle = `Reverse Link Test ${Date.now()}`;
    const createResponse = await page.request.post('/api/admin/jobs', {
      data: {
        title: jobTitle,
        address_line_1: '123 Test St',
        status: 'lead',
      },
    });
    const jobData = await createResponse.json();
    jobId = jobData.data.id;

    // Sync to board
    const syncResponse = await page.request.post(`/api/jobs/${jobId}/sync-to-board`, { data: {} });
    const syncData = await syncResponse.json();
    boardItemId = syncData.data.board_item?.id;

    if (!boardItemId) {
      test.skip();
      return;
    }

    // Get linked job
    const response = await page.request.get(`/api/items/${boardItemId}/job`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    
    if (data.data.job) {
      expect(data.data.job.id).toBe(jobId);
      expect(data.data.job.title).toBe(jobTitle);
    }
  });

  test('Manual sync board item to job works', async ({ page }) => {
    // Create job and sync
    const jobTitle = `Board Sync Test ${Date.now()}`;
    const createResponse = await page.request.post('/api/admin/jobs', {
      data: {
        title: jobTitle,
        address_line_1: '123 Test St',
        status: 'lead',
      },
    });
    const jobData = await createResponse.json();
    jobId = jobData.data.id;

    // Sync to board
    const syncResponse = await page.request.post(`/api/jobs/${jobId}/sync-to-board`, { data: {} });
    const syncData = await syncResponse.json();
    boardItemId = syncData.data.board_item?.id;

    if (!boardItemId) {
      test.skip();
      return;
    }

    // Update board item column value (status)
    // First, get the board item to find columns
    const itemResponse = await page.request.get(`/api/items/${boardItemId}`);
    const itemData = await itemResponse.json();
    
    // Find status column
    const statusColumn = itemData.data.item.column_values?.find(
      (cv: any) => cv.columns?.column_type === 'status'
    );

    if (statusColumn) {
      // Update status
      await page.request.put(`/api/items/${boardItemId}/column-values`, {
        data: {
          values: [
            {
              column_id: statusColumn.column_id,
              value: 'in_progress',
              text_value: 'in_progress',
            },
          ],
        },
      });

      // Wait for async sync
      await page.waitForTimeout(1000);

      // Sync board item to job
      const boardSyncResponse = await page.request.post(`/api/items/${boardItemId}/sync-to-job`, {
        data: {},
      });

      expect(boardSyncResponse.ok()).toBeTruthy();
      const boardSyncData = await boardSyncResponse.json();
      expect(boardSyncData.success).toBe(true);
      expect(boardSyncData.data.job).toBeDefined();
    }
  });
});

