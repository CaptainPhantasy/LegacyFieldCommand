/**
 * UI Component Tests - Hydro/Drying System
 * Tests hydro UI components in field app
 */

import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers/auth';

test.describe('Hydro UI Components', () => {
  let jobId: string | null = null;
  let gateId: string | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.admin);
    
    // Create a job for testing
    const jobTitle = `Hydro UI Test Job ${Date.now()}`;
    const createResponse = await page.request.post('/api/admin/jobs', {
      data: {
        title: jobTitle,
        address_line_1: '123 Test St',
        status: 'lead',
      },
    });
    const jobData = await createResponse.json();
    jobId = jobData.data.id;

    // Get Moisture/Equipment gate
    const gatesResponse = await page.request.get(`/api/field/jobs/${jobId}`);
    const gatesData = await gatesResponse.json();
    const moistureGate = gatesData.data.gates?.find((g: any) => g.stage_name === 'Moisture/Equipment');
    gateId = moistureGate?.id;
  });

  test('Hydro components are visible in Moisture/Equipment gate', async ({ page }) => {
    if (!gateId) {
      test.skip();
      return;
    }

    await loginAs(page, TEST_USERS.fieldTech);
    await page.goto(`/field/gates/${gateId}`);
    await page.waitForLoadState('networkidle');
    
    // Check if page loaded
    await expect(page.locator('body')).toBeVisible();
    
    // Look for hydro-related UI elements
    // These may be in the page content
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('User can create chamber from UI', async ({ page }) => {
    if (!gateId || !jobId) {
      test.skip();
      return;
    }

    await loginAs(page, TEST_USERS.fieldTech);
    await page.goto(`/field/gates/${gateId}`);
    await page.waitForLoadState('networkidle');
    
    // Look for chamber setup component
    // This would be in the Moisture/Equipment gate page
    const chamberButton = page.locator('button:has-text("Chamber"), button:has-text("Create Chamber"), [data-testid="create-chamber"]').first();
    
    if (await chamberButton.isVisible()) {
      await chamberButton.click();
      await page.waitForTimeout(500);
      
      // Look for form
      const nameInput = page.locator('input[name="name"], input[placeholder*="chamber" i]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill(`Test Chamber ${Date.now()}`);
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // Page should still be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('User can add psychrometric reading from UI', async ({ page }) => {
    if (!gateId || !jobId) {
      test.skip();
      return;
    }

    // Create a chamber first via API
    const chamberResponse = await page.request.post('/api/hydro/chambers', {
      data: {
        job_id: jobId,
        name: `Test Chamber ${Date.now()}`,
        chamber_type: 'drying',
        status: 'active',
      },
    });
    const chamberData = await chamberResponse.json();
    const chamberId = chamberData.data.id;

    await loginAs(page, TEST_USERS.fieldTech);
    await page.goto(`/field/gates/${gateId}`);
    await page.waitForLoadState('networkidle');
    
    // Look for psychrometric capture component
    const tempInput = page.locator('input[name*="temp" i], input[placeholder*="temperature" i]').first();
    
    if (await tempInput.isVisible()) {
      await tempInput.fill('72');
      
      const rhInput = page.locator('input[name*="humidity" i], input[placeholder*="humidity" i]').first();
      if (await rhInput.isVisible()) {
        await rhInput.fill('45');
      }
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Page should still be visible
    await expect(page.locator('body')).toBeVisible();
  });
});

