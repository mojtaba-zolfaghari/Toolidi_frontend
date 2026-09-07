import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load successfully', async ({ page }) => {
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=پلتفرم B2B برای خرید و فروش عمده')).toBeVisible();
  });

  test('should have Material Design buttons', async ({ page }) => {
    const ctaPrimary = page.locator('mat-flat-button[color="primary"]');
    await expect(ctaPrimary).toBeVisible();
    await expect(ctaPrimary).toHaveText('خرید عمده');
  });
});