import { test, expect } from '@playwright/test';

test.describe('Admin Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming we need to be logged in as admin; for simplicity, we test if the page loads without auth redirect
    // In a real scenario, we would log in first. Here we just test the route.
    await page.goto('/admin/settings');
  });

  test('should load successfully', async ({ page }) => {
    await expect(page).toHaveURL('/admin/settings');
    await expect(page.locator('text=تنظیمات')).toBeVisible();
  });

  test('should have Material Design tabs', async ({ page }) => {
    const tabGroup = page.locator('mat-tab-group');
    await expect(tabGroup).toBeVisible();
    await expect(page.locator('mat-tab', { hasText: 'پایه' })).toBeVisible();
    await expect(page.locator('mat-tab', { hasText: 'پرداخت' })).toBeVisible();
    await expect(page.locator('mat-tab', { hasText: 'پیامک' })).toBeVisible();
    await expect(page.locator('mat-tab', { hasText: 'حاشیه سود' })).toBeVisible();
  });
});