import { test, expect, Page } from '@playwright/test';

/**
 * TASK-FE-E2E-TESTS-REDESIGN — home page.
 *
 * Covers: hero renders, Material cards/sections present, featured products
 * grid populated from the mocked API, and platform stats counters.
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

const MOCK_PRODUCTS = Array.from({ length: 8 }, (_, i) => ({
  id: `prod-${i + 1}`,
  categoryId: 'cat-1',
  name: `محصول آزمایشی ${i + 1}`,
  sku: `SKU-${i + 1}`,
  slug: `mock-prod-${i + 1}`,
  unitPrice: 100_000 * (i + 1),
  isPhysical: true,
  isDigital: false,
  isFeatured: true,
  imageUrl: '',
}));

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'ابزار', slug: 'tools', isActive: true, displayOrder: 1, children: [] },
  { id: 'cat-2', name: 'الکترونیک', slug: 'electronics', isActive: true, displayOrder: 2, children: [] },
];

async function mockHomeApis(page: Page): Promise<void> {
  // Backstop FIRST (reverse-order matching: specifics below win)
  await page.route(`${API}/**`, (route) => route.fulfill(success({})));

  await page.route(`${API}/Category**`, (route) => route.fulfill(success(MOCK_CATEGORIES)));
  await page.route(`${API}/v1/products**`, (route) =>
    route.fulfill(success({ items: MOCK_PRODUCTS, totalCount: MOCK_PRODUCTS.length, page: 1, pageSize: 8 })),
  );
  await page.route(`${API}/v1/public/platform-stats`, (route) =>
    route.fulfill(success({ activeProducers: 120, activeAgents: 45, completedOrders: 900, satisfactionRate: 96 })),
  );
  await page.route(`${API}/v1/public/seller-stats`, (route) =>
    route.fulfill(success({ activeSellers: 300, monthlyOrders: 1500, totalProducts: 4200 })),
  );
  await page.route(`${API}/v1/public/sellers`, (route) => route.fulfill(success([])));
}

async function gotoHome(page: Page): Promise<void> {
  await page.addInitScript(
    ([tokenKey, token]) => localStorage.setItem(tokenKey, token),
    ['access_token', makeJwt('Buyer', 'home-e2e')],
  );
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
}

test.describe('Home page', () => {
  test.describe.configure({ mode: 'serial' });

  test('renders hero with title and main sections', async ({ page }) => {
    await mockHomeApis(page);
    await gotoHome(page);

    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('.features')).toBeVisible();
    await expect(page.locator('section[data-section="categories"]')).toBeVisible();
  });

  test('featured products grid renders cards from the API', async ({ page }) => {
    await mockHomeApis(page);
    await gotoHome(page);

    await expect(page.locator('.featured-products-grid .featured-product-item')).toHaveCount(8);
    await expect(page.locator('.product-card-name').first()).toContainText('محصول آزمایشی');
  });

  test('platform stats section renders the stat cards', async ({ page }) => {
    await mockHomeApis(page);
    await gotoHome(page);

    // The counters animate from 0 toward the mocked values — just assert visibility
    await expect(page.locator('.stats-card').first()).toBeVisible();
    await expect(page.locator('.section-title').first()).toBeVisible();
  });

  test('category tree lists the mocked categories', async ({ page }) => {
    await mockHomeApis(page);
    await gotoHome(page);

    await expect(page.locator('text=ابزار').first()).toBeVisible();
    await expect(page.locator('text=الکترونیک').first()).toBeVisible();
  });
});
