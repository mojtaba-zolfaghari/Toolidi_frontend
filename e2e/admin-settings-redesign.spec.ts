import { test, expect, Page } from '@playwright/test';

/**
 * TASK-FE-E2E-TESTS-REDESIGN — admin settings (Material redesign).
 *
 * Covers: guarded access, Material tabs switching, pre-filled validated form
 * fields (tax rate, gateways, SMS), and the save flow (PUT per setting key).
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

const SETTINGS_TABS = {
  basic: { taxRate: '9' },
  payment: {
    zarinPalMerchantId: 'zp-merchant-123',
    zarinPalIsSandbox: true,
    sepTerminalId: 'sep-term-1',
    sepMerchantId: 'sep-merchant-1',
    sepIsSandbox: false,
  },
  sms: {
    provider: 'kavenegar',
    apiKey: 'api-key-xyz',
    senderNumber: '1000200300',
    orderStatusEnabled: true,
  },
  markup: {
    globalPercent: 15,
    hasGlobal: true,
    categoryPercents: [{ scopeId: 'cat-1', percent: 10 }],
    productPercents: [],
  },
};

async function mockSettingsApis(page: Page): Promise<void> {
  // Backstop FIRST (reverse-order matching: specifics below win)
  await page.route(`${API}/**`, (route) => route.fulfill(success({})));

  await page.route(`${API}/v1/admin/settings-tabs`, (route) => route.fulfill(success(SETTINGS_TABS)));
  await page.route(`${API}/v1/admin/settings-tabs/**`, (route) => route.fulfill(success({ sent: true })));
  await page.route(`${API}/v1/admin/settings/**`, (route) => route.fulfill(success(true)));
  await page.route(`${API}/v1/admin/settings`, (route) => route.fulfill(success([])));

  // Product search for the markup autocomplete + categories
  await page.route(`${API}/admin/products**`, (route) =>
    route.fulfill(success({
      items: [{ id: 'prod-1', name: 'پروduct آزمایشی', sku: 'SKU-1' }],
      totalCount: 1, page: 1, pageSize: 8,
    })),
  );
  await page.route(`${API}/Category**`, (route) =>
    route.fulfill(success({ items: [{ id: 'cat-1', name: 'ابزار', slug: 'tools' }], totalCount: 1, page: 1, pageSize: 20 })),
  );
}

async function gotoAsAdmin(page: Page, path: string): Promise<void> {
  await page.addInitScript(
    ([tokenKey, token]) => localStorage.setItem(tokenKey, token),
    ['access_token', makeJwt('Admin', 'settings-e2e')],
  );
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState('networkidle');
}

test.describe('Admin settings redesign', () => {
  test.describe.configure({ mode: 'serial' });

  test('guest is bounced to login (guard still enforced)', async ({ page }) => {
    await page.goto(`${BASE}/admin/settings`);
    await page.waitForURL((url) => url.pathname === '/auth/login', { timeout: 15_000 });
    expect(new URL(page.url()).searchParams.get('returnUrl')).toBe('/admin/settings');
  });

  test('renders 4 tabs and pre-fills the basic tab from the API', async ({ page }) => {
    await mockSettingsApis(page);
    await gotoAsAdmin(page, '/admin/settings');

    await expect(page.locator('app-admin-layout')).toBeVisible();
    const tabs = page.locator('.mat-mdc-tab');
    await expect(tabs.filter({ hasText: 'پایه' })).toBeVisible();
    await expect(tabs.filter({ hasText: 'پرداخت' })).toBeVisible();
    await expect(tabs.filter({ hasText: 'پیامک' })).toBeVisible();
    await expect(tabs.filter({ hasText: 'حاشیه سود' })).toBeVisible();

    // Tax rate patched from mocked SettingsTabs.basic.taxRate
    const taxRate = page.locator('input[formcontrolname="taxRate"]');
    await expect(taxRate).toHaveValue('9');
  });

  test('switching to the payment tab reveals gateway fields', async ({ page }) => {
    await mockSettingsApis(page);
    await gotoAsAdmin(page, '/admin/settings');

    await page.locator('.mat-mdc-tab').filter({ hasText: 'پرداخت' }).click();
    const zarinpal = page.locator('input[formcontrolname="zarinpalMerchantId"]');
    await expect(zarinpal).toBeVisible();
    await expect(zarinpal).toHaveValue('zp-merchant-123');
    await expect(page.locator('mat-slide-toggle').first()).toBeVisible();
  });

  test('switching to the sms tab reveals sms fields', async ({ page }) => {
    await mockSettingsApis(page);
    await gotoAsAdmin(page, '/admin/settings');

    await page.locator('.mat-mdc-tab').filter({ hasText: 'پیامک' }).click();
    await expect(page.locator('input[formcontrolname="smsSenderNumber"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="smsSenderNumber"]')).toHaveValue('1000200300');
  });

  test('save() PUTs each setting key and shows the success message', async ({ page }) => {
    await mockSettingsApis(page);
    await gotoAsAdmin(page, '/admin/settings');

    const putUrls: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/v1/admin/settings/')) {
        putUrls.push(req.url().replace(API, ''));
      }
    });

    await page.locator('button', { hasText: 'ذخیره تنظیمات' }).click();

    await expect(page.locator('.admin-alert--success'))
      .toContainText('تنظیمات با موفقیت ذخیره شد', { timeout: 15_000 });
    // Several keys are written (tax rate + sandbox toggles + global markup…)
    expect(putUrls.length).toBeGreaterThan(2);
  });
});
