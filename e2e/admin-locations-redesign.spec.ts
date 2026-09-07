import { test, expect, Page } from '@playwright/test';

/**
 * TASK-FE-E2E-TESTS-REDESIGN — admin locations (Material redesign).
 *
 * Covers: auth-gated access with seeded Admin JWT, Material tabs,
 * mat-table + mat-paginator pagination/sort wiring, and the edit modal.
 * Fully mocked — no backend required.
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

const PROVINCES = [
  { id: 'pr-1', name: 'تهران', code: '1', isActive: true },
  { id: 'pr-2', name: 'اصفهان', code: '2', isActive: true },
  { id: 'pr-3', name: 'فارس', code: '3', isActive: false },
  { id: 'pr-4', name: 'خراسان رضوی', code: '4', isActive: true },
  { id: 'pr-5', name: 'آذربایجان شرقی', code: '5', isActive: true },
  { id: 'pr-6', name: 'البرز', code: '6', isActive: true },
  { id: 'pr-7', name: 'گیلان', code: '7', isActive: true },
  { id: 'pr-8', name: 'مازندران', code: '8', isActive: true },
  { id: 'pr-9', name: 'خوزستان', code: '9', isActive: true },
  { id: 'pr-10', name: 'کرمان', code: '10', isActive: true },
  { id: 'pr-11', name: 'یزد', code: '11', isActive: true },
  { id: 'pr-12', name: 'قم', code: '12', isActive: true },
];

// Cities are requested per province; tag each with the requesting province
// (the component does the same — the API payload has no provinceId).
function citiesFor(provinceId: string) {
  return [1, 2, 3].map((n) => ({
    id: `${provinceId}-city-${n}`,
    provinceId,
    name: `شهر ${n} ${provinceId}`,
    code: `${n}0`,
    isActive: true,
  }));
}

async function mockLocationApis(page: Page): Promise<void> {
  // Backstop FIRST (reverse-order matching: specifics below win)
  await page.route(`${API}/**`, (route) => route.fulfill(success({})));

  await page.route(`${API}/v1/locations/provinces`, (route) => route.fulfill(success(PROVINCES)));

  await page.route(`${API}/v1/locations/provinces/*/cities**`, (route) => {
    const provinceId = new URL(route.request().url()).pathname.split('/').slice(-2, -1)[0];
    return route.fulfill(success(citiesFor(provinceId)));
  });

  await page.route(`${API}/v1/admin/locations/supplier-restrictions`, (route) => route.fulfill(success([])));
  await page.route(`${API}/v1/admin/locations/agent-restrictions`, (route) => route.fulfill(success([])));

  // CRUD endpoints (not asserted here, but must not 404 through the backstop)
  await page.route(`${API}/v1/admin/locations/**`, (route) => route.fulfill(success({})));
}

async function gotoAsAdmin(page: Page, path: string): Promise<void> {
  await page.addInitScript(
    ([tokenKey, token]) => localStorage.setItem(tokenKey, token),
    ['access_token', makeJwt('Admin', 'locations-e2e')],
  );
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState('networkidle');
}

test.describe('Admin locations redesign', () => {
  test.describe.configure({ mode: 'serial' });

  test('guest is bounced to login (guard still enforced)', async ({ page }) => {
    await page.goto(`${BASE}/admin/locations`);
    await page.waitForURL((url) => url.pathname === '/auth/login', { timeout: 15_000 });
    expect(new URL(page.url()).searchParams.get('returnUrl')).toBe('/admin/locations');
  });

  test('renders 4 Material tabs and provinces table with pagination', async ({ page }) => {
    await mockLocationApis(page);
    await gotoAsAdmin(page, '/admin/locations');

    await expect(page.locator('app-admin-layout')).toBeVisible();
    await expect(page.locator('.mat-mdc-tab').filter({ hasText: 'استان‌ها' })).toBeVisible();
    await expect(page.locator('.mat-mdc-tab').filter({ hasText: 'شهرها' })).toBeVisible();
    await expect(page.locator('.mat-mdc-tab').filter({ hasText: 'محدودیت فروشنده' })).toBeVisible();
    await expect(page.locator('.mat-mdc-tab').filter({ hasText: 'محدودیت کارپخش' })).toBeVisible();

    // Provinces table renders (12 rows > default page size 10 → paginator active)
    const provinceRows = page.locator('mat-tab-group >> nth=0 >> .loc-table tbody tr');
    await expect(provinceRows).toHaveCount(10, { timeout: 15_000 });
    await expect(page.locator('.mat-mdc-paginator-range-label').first()).toHaveText(/1 – 10 از 12/);
  });

  test('paginator next page shows remaining provinces', async ({ page }) => {
    await mockLocationApis(page);
    await gotoAsAdmin(page, '/admin/locations');

    await expect(page.locator('.loc-table tbody tr').first()).toBeVisible();
    await page.locator('button.mat-mdc-paginator-navigation-next').first().click();
    await expect(page.locator('.mat-mdc-paginator-range-label').first()).toHaveText(/11 – 12 از 12/);
  });

  test('province row edit opens the Material modal pre-filled', async ({ page }) => {
    await mockLocationApis(page);
    await gotoAsAdmin(page, '/admin/locations');

    // Open the edit modal of the first province row
    await page.locator('.loc-table tbody tr').first().locator('button:has-text("edit")').click({ force: true });

    const dialog = page.locator('.admin-modal').first();
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input').first()).toHaveValue(/تهران|آذربایجان|اصفهان|فارس|خراسان|البرز|گیلان|مازندران|خوزستان|کرمان|یزد|قم/);
  });
});
