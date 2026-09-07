import { test, expect } from '@playwright/test';

test.describe('Admin Locations Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/locations');
  });

  test('should load successfully', async ({ page }) => {
    await expect(page).toHaveURL('/admin/locations');
    await expect(page.locator('text=مدیریت مکان‌ها')).toBeVisible();
  });

  test('should have Material Design tabs', async ({ page }) => {
    const tabGroup = page.locator('mat-tab-group');
    await expect(tabGroup).toBeVisible();
    await expect(page.locator('mat-tab', { hasText: 'استان‌ها' })).toBeVisible();
    await expect(page.locator('mat-tab', { hasText: 'شهرها' })).toBeVisible();
    await expect(page.locator('mat-tab', { hasText: 'محدودیت ثبت‌نام فروشنده' })).toBeVisible();
    await expect(page.locator('mat-tab', { hasText: 'محدودیت ثبت‌نام کارپخش' })).toBeVisible();
  });

  test('should show provinces table when selected', async ({ page }) => {
    await expect(page.locator('mat-tab', { hasText: 'استان‌ها' })).toBeVisible();
    await page.locator('mat-tab', { hasText: 'استان‌ها' }).click();
    await expect(page.locator('mat-table')).toBeVisible();
    await expect(page.locator('mat-paginator')).toBeVisible();
  });
});