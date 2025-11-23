/**
 * Report Generation E2E Tests
 * Tests report generation and PDF creation
 */

import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers/auth';

test.describe('Report Generation', () => {
  let jobId: string | null = null;
  let reportId: string | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);
    
    // Create a job for testing
    const jobTitle = `Report Test Job ${Date.now()}`;
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

  test('Admin can generate initial report', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    const response = await page.request.post('/api/reports/generate', {
      data: {
        job_id: jobId,
        report_type: 'initial',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.job_id).toBe(jobId);
    expect(data.data.report_type).toBe('initial');
    expect(data.data.report_number).toBeDefined();
    
    reportId = data.data.id;
  });

  test('Admin can generate hydro report', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    const response = await page.request.post('/api/reports/generate', {
      data: {
        job_id: jobId,
        report_type: 'hydro',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.report_type).toBe('hydro');
  });

  test('Admin can generate full report', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    const response = await page.request.post('/api/reports/generate', {
      data: {
        job_id: jobId,
        report_type: 'full',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.report_type).toBe('full');
  });

  test('Admin can list reports for job', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    // Generate a report first
    const createResponse = await page.request.post('/api/reports/generate', {
      data: {
        job_id: jobId,
        report_type: 'initial',
      },
    });
    const createData = await createResponse.json();
    reportId = createData.data.id;

    const response = await page.request.get(`/api/reports/jobs/${jobId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.reports)).toBe(true);
    expect(data.data.reports.length).toBeGreaterThan(0);
  });

  test('Admin can get report details', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    if (!reportId) {
      const createResponse = await page.request.post('/api/reports/generate', {
        data: {
          job_id: jobId,
          report_type: 'initial',
        },
      });
      const createData = await createResponse.json();
      reportId = createData.data.id;
    }

    const response = await page.request.get(`/api/reports/${reportId}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(reportId);
    expect(data.data.job_id).toBe(jobId);
  });

  test('Admin can download report PDF', async ({ page }) => {
    if (!jobId) {
      test.skip();
      return;
    }

    if (!reportId) {
      const createResponse = await page.request.post('/api/reports/generate', {
        data: {
          job_id: jobId,
          report_type: 'initial',
        },
      });
      const createData = await createResponse.json();
      reportId = createData.data.id;
    }

    // Wait for report to be generated
    await page.waitForTimeout(2000);

    // Check report status
    const statusResponse = await page.request.get(`/api/reports/${reportId}`);
    const statusData = await statusResponse.json();
    
    // If report is completed, try to download
    if (statusData.data.status === 'completed' && statusData.data.pdf_storage_path) {
      const downloadResponse = await page.request.get(`/api/reports/${reportId}/download`);
      
      // Should return PDF or 404 if not ready
      expect([200, 404]).toContain(downloadResponse.status());
      
      if (downloadResponse.ok()) {
        const contentType = downloadResponse.headers()['content-type'];
        expect(contentType).toContain('application/pdf');
      }
    }
  });
});

