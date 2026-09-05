import { test, expect, Page } from '@playwright/test';

/**
 * TASK-FE-AUTH-REDIRECT-CLEANUP: E2E tests for the new auth redirect behavior.
 *
 * Covered behavior:
 *   1. Each role (Admin, Seller, Supplier, Agent, Buyer/Customer) lands on its own
 *      panel after login (auth-redirect.util → ROLE_LANDING_PATHS).
 *   2. Guarded routes forward unauthenticated users to /auth/login?returnUrl=…,
 *      and after login the user returns to the originally requested page.
 *   3. Open-redirect guard: external / non-internal returnUrl values are rejected.
 *
 * The backend is not required: /api/Auth/login and every panel API call are mocked
 * with the project's standard { isSuccess, data } envelope, matching the convention
 * used by checkout-flow.spec.ts.
 *
 * JWTs are unsigned HS256-shaped tokens (header.payload.signature) — the app only
 * base64-decodes the payload client-side (jwt.util.ts) and never verifies the
 * signature in the browser, so self-made tokens are enough to exercise the
 * full routing stack (guards + login navigation).
 */

const BASE = process.env['BASE_URL'] || 'http://localhost:4200';
const API = process.env['API_URL'] || 'http://localhost:5291/api';

// ── Token helpers ──────────────────────────────────────

function makeJwt(role: string, username: string): string {
  const b64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url({
    sub: `user-${role.toLowerCase()}`,
    unique_name: username,
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1h
  });
  return `${header}.${payload}.fake-signature`;
}

// ── Mock API responses ─────────────────────────────────

interface RoleCase {
  role: string;
  username: string;
  /** URL the role should land on after plain login */
  expectedPath: string;
  /** A marker text visible on the landing panel */
  panelMarker: string;
}

const ROLE_CASES: RoleCase[] = [
  // /admin and /agent are child redirects (→ /admin/dashboard, /agent/ready-items);
  // assert on the final URL after Angular resolves the child route.
  { role: 'Admin', username: 'admin01', expectedPath: '/admin/dashboard', panelMarker: 'داشبورد' },
  { role: 'Seller', username: 'seller01', expectedPath: '/seller', panelMarker: 'داشبورد' },
  { role: 'Supplier', username: 'supplier01', expectedPath: '/supplier', panelMarker: 'داشبورد' },
  { role: 'Agent', username: 'agent01', expectedPath: '/agent/ready-items', panelMarker: 'آیتم‌های آماده' },
  { role: 'Buyer', username: 'buyer01', expectedPath: '/', panelMarker: 'تولیدی' },
];

function success<T>(data: T) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify({ isSuccess: true, data }) };
}

/**
 * Intercept the login endpoint to return a token for the requested role.
 * MUST be registered AFTER mockPanelApis: Playwright matches routes in reverse
 * registration order, so registering this last lets the exact login route win
 * over the panel catch-all.
 */
async function mockLoginEndpoint(page: Page, role: string, username: string) {
  await page.route(`${API}/Auth/login`, (route) =>
    route.fulfill(success({ accessToken: makeJwt(role, username), refreshToken: 'rt-' + role, expiresInMinutes: 60, tokenType: 'Bearer' })),
  );
}

/**
 * Swallow panel API traffic so dashboards don't surface unrelated errors.
 * Panel components treat failing/absent data as non-fatal; we only care about
 * the final URL after the login redirect, not the dashboard content.
 *
 * A catch-all for the API origin stops any unmocked panel call from reaching a
 * real backend, whose 401 would make the TokenInterceptor clear the fresh token
 * and bounce the user back to login. Because Playwright matches routes in
 * reverse registration order, call mockPanelApis BEFORE mockLoginEndpoint so
 * the exact login route (registered last) takes precedence over the catch-all.
 */
async function mockPanelApis(page: Page) {
  // Backstop for every other API call the panels fire
  await page.route(`${API}/**`, (route) => route.fulfill(success({})));

  // Admin dashboard endpoints
  await page.route(`${API}/v1/admin/dashboard`, (route) =>
    route.fulfill(success({ totalUsers: 1, totalSellers: 1, totalOrders: 0, totalRevenue: 0, conversionRate: 0 })),
  );
  await page.route(`${API}/v1/admin/products**`, (route) =>
    route.fulfill(success({ items: [], totalCount: 0, page: 1, pageSize: 10 })),
  );
  // Seller dashboard
  await page.route(`${API}/seller/dashboard`, (route) => route.fulfill(success({})));
  // Supplier dashboard
  await page.route(`${API}/v1/suppliers/dashboard`, (route) => route.fulfill(success({})));
  // Agent ready items
  await page.route(`${API}/v1/agents/**`, (route) => route.fulfill(success([])));
  // Cart merge call fired by AuthService on successful login
  await page.route(`${API}/cart/merge**`, (route) => route.fulfill(success(true)));
  // Profile (header / layout)
  await page.route(`${API}/Profile`, (route) => route.fulfill(success(null)));
}

// ── Shared page interactions ───────────────────────────

async function gotoLoginPage(page: Page, returnUrl?: string) {
  const url = returnUrl ? `${BASE}/auth/login?returnUrl=${encodeURIComponent(returnUrl)}` : `${BASE}/auth/login`;
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

async function fillAndSubmitLoginForm(page: Page, username: string) {
  await page.locator('#nationalCode').fill(username);
  await page.locator('#password').fill('pass-123456');
  await page.getByRole('button', { name: 'ورود' }).click();
}

// ════════════════════════════════════════════════════════
// TEST SUITE 1: role-based landing page after login
// ════════════════════════════════════════════════════════

test.describe('Role-based landing after login', () => {
  test.describe.configure({ mode: 'serial' });

  for (const { role, username, expectedPath, panelMarker } of ROLE_CASES) {
    test(`login as ${role} lands on ${expectedPath}`, async ({ page }) => {
      await mockPanelApis(page);
      await mockLoginEndpoint(page, role, username);

      await gotoLoginPage(page);
      await fillAndSubmitLoginForm(page, username);

      // Wait for the role's landing URL
      await page.waitForURL((url) => url.pathname === expectedPath, { timeout: 15_000 });
      expect(new URL(page.url()).pathname).toBe(expectedPath);

      // The panel shell (or home page) actually rendered
      if (expectedPath === '/') {
        await expect(page.locator('header, app-header, app-root').first()).toBeVisible();
      } else {
        await expect(page.locator('app-admin-layout')).toBeVisible();
        await expect(page.locator(`text=${panelMarker}`).first()).toBeVisible();
      }
    });
  }
});

// ════════════════════════════════════════════════════════
// TEST SUITE 2: returnUrl round-trip
// ════════════════════════════════════════════════════════

test.describe('returnUrl round-trip after login', () => {
  test.describe.configure({ mode: 'serial' });

  test('guard forwards unauthenticated users to login with returnUrl', async ({ page }) => {
    // Buyer token — will be redirected away from /admin (forbidden) → own panel,
    // so we first assert the guard bounce for a *guest* hitting a protected page.
    await mockPanelApis(page);

    await page.goto(`${BASE}/orders`);
    await page.waitForURL((url) => url.pathname === '/auth/login', { timeout: 15_000 });
    expect(new URL(page.url()).searchParams.get('returnUrl')).toBe('/orders');
  });

  test('after login, user returns to the originally requested page', async ({ page }) => {
    const returnUrl = '/orders';
    await mockPanelApis(page);
    await mockLoginEndpoint(page, 'Buyer', 'buyer02');

    await gotoLoginPage(page, returnUrl);
    await fillAndSubmitLoginForm(page, 'buyer02');

    await page.waitForURL((url) => url.pathname === returnUrl, { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe(returnUrl);
  });

  test('cart (guard-protected) also round-trips through returnUrl', async ({ page }) => {
    await mockPanelApis(page);

    // Guest → bounced to login with returnUrl=/cart
    await page.goto(`${BASE}/cart`);
    await page.waitForURL((url) => url.pathname === '/auth/login', { timeout: 15_000 });
    expect(new URL(page.url()).searchParams.get('returnUrl')).toBe('/cart');

    // Now complete login and confirm we land back on /cart
    await mockLoginEndpoint(page, 'Buyer', 'buyer03');
    await fillAndSubmitLoginForm(page, 'buyer03');
    await page.waitForURL((url) => url.pathname === '/cart', { timeout: 15_000 });
  });

  test('external returnUrl is ignored and role landing is used instead', async ({ page }) => {
    const role = 'Admin';
    const username = 'admin02';
    await mockPanelApis(page);
    await mockLoginEndpoint(page, role, username);

    // A malicious / off-site returnUrl must not be honored
    await gotoLoginPage(page, 'https://evil.example.com/phish');
    await fillAndSubmitLoginForm(page, username);

    // /admin child-redirects to /admin/dashboard
    await page.waitForURL((url) => url.pathname === '/admin/dashboard', { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe('/admin/dashboard');
  });

  test('panel returnUrl for a mismatched role falls back to role landing', async ({ page }) => {
    // A Seller given ?returnUrl=/admin must NOT be taken to /admin —
    // the util redirects panel paths only when they match the caller's own panel.
    const role = 'Seller';
    const username = 'seller02';
    await mockPanelApis(page);
    await mockLoginEndpoint(page, role, username);

    await gotoLoginPage(page, '/admin');
    await fillAndSubmitLoginForm(page, username);

    await page.waitForURL((url) => url.pathname === '/seller', { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe('/seller');
  });
});

// ═════════════════════════════════ app code sanity ═════

test.describe('Auth pages sanity', () => {
  test('login page renders the form', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#nationalCode')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('legacy /login redirects to /auth/login', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForURL((url) => url.pathname === '/auth/login', { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe('/auth/login');
  });
});
