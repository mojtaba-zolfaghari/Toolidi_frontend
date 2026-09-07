import { test, expect, Page } from '@playwright/test';

/**
 * TASK-FE-E2E-TESTS-REDESIGN — auth landing (/auth) role-selection hub.
 *
 * Covers: 4 role cards (buyer/seller/supplier/agent), each CTA routing to its
 * per-role flow, the direct-login hint link, and the logged-in auto-redirect
 * to the role's panel. Fully mocked — no backend required.
 */

const BASE = process.env['BASE_URL'] || 'http://localhost:4200';
const API = process.env['API_URL'] || 'http://localhost:5291/api';

function makeJwt(role: string, username: string): string {
  const b64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({
    sub: `user-${role.toLowerCase()}`,
    unique_name: username,
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  })}.fake-signature`;
}

function success<T>(data: T) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify({ isSuccess: true, data }) };
}

async function mockLandingApis(page: Page): Promise<void> {
  // Backstop FIRST (reverse-order matching: specifics below win)
  await page.route(`${API}/**`, (route) => route.fulfill(success({})));
  await page.route(`${API}/Profile`, (route) => route.fulfill(success(null)));
  await page.route(`${API}/cart/merge**`, (route) => route.fulfill(success(true)));
}

test.describe('Auth landing — role selection hub', () => {
  test.describe.configure({ mode: 'serial' });

  test('renders the 4 role cards with titles and CTAs', async ({ page }) => {
    await mockLandingApis(page);
    await page.goto(`${BASE}/auth`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('مسیر خود را انتخاب کنید');
    await expect(page.locator('.role-card')).toHaveCount(4);

    const titles = ['خریدار', 'فروشنده', 'تأمین‌کننده', 'کارپخش'];
    for (const [i, title] of titles.entries()) {
      await expect(page.locator('.role-card').nth(i).locator('h2')).toHaveText(title);
    }

    // Each card carries a Material icon and a CTA button
    await expect(page.locator('.role-card mat-icon')).toHaveCount(4);
    await expect(page.locator('.role-card__cta')).toHaveCount(4);
  });

  test('buyer card CTA routes to the login flow', async ({ page }) => {
    await mockLandingApis(page);
    await page.goto(`${BASE}/auth`);
    await page.waitForLoadState('networkidle');

    await page.locator('.role-card').first().locator('.role-card__cta').click();
    await page.waitForURL((url) => url.pathname === '/auth/login', { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe('/auth/login');
  });

  test('seller card routes to the seller registration flow', async ({ page }) => {
    await mockLandingApis(page);
    await page.goto(`${BASE}/auth`);
    await page.waitForLoadState('networkidle');

    await page.locator('.role-card').nth(1).click();
    await page.waitForURL((url) => url.pathname === '/auth/seller-register', { timeout: 15_000 });
  });

  test('supplier card routes to the supplier registration flow', async ({ page }) => {
    await mockLandingApis(page);
    await page.goto(`${BASE}/auth`);
    await page.waitForLoadState('networkidle');

    await page.locator('.role-card').nth(2).click();
    await page.waitForURL((url) => url.pathname === '/auth/supplier-register', { timeout: 15_000 });
  });

  test('agent card routes to the agent registration flow', async ({ page }) => {
    await mockLandingApis(page);
    await page.goto(`${BASE}/auth`);
    await page.waitForLoadState('networkidle');

    await page.locator('.role-card').nth(3).click();
    await page.waitForURL((url) => url.pathname === '/auth/agent-register', { timeout: 15_000 });
  });

  test('direct-login hint link routes to /auth/login', async ({ page }) => {
    await mockLandingApis(page);
    await page.goto(`${BASE}/auth`);
    await page.waitForLoadState('networkidle');

    await page.locator('.al-login-hint__link').click();
    await page.waitForURL((url) => url.pathname === '/auth/login', { timeout: 15_000 });
  });

  test('logged-in Admin hitting /auth is redirected to the admin panel', async ({ page }) => {
    await mockLandingApis(page);
    await page.addInitScript(
      ([tokenKey, token]) => localStorage.setItem(tokenKey, token),
      ['access_token', makeJwt('Admin', 'landing-e2e')],
    );

    await page.goto(`${BASE}/auth`);
    await page.waitForURL((url) => url.pathname === '/admin/dashboard', { timeout: 15_000 });
    await expect(page.locator('app-admin-layout')).toBeVisible();
  });
});
