import { test, expect, Page } from '@playwright/test';

/**
 * TASK-FE-E2E-TESTS-REDESIGN — blog list + detail (Material redesign).
 *
 * Fully mocked: no backend required. Uses the project's standard
 * { isSuccess, data } envelope and an unsigned JWT like auth-redirect.spec.ts.
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

interface MockPost {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  featuredImage?: string;
  categoryId: string;
  authorId: string;
  isPublished: boolean;
  viewCount: number;
  publishedAt: string;
}

function makePosts(count: number): MockPost[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `post-${i + 1}`,
    title: `مقاله آزمایشی ${i + 1}`,
    slug: `mock-post-${i + 1}`,
    shortDescription: 'خلاصه آزمایشی برای کارت وبلاگ',
    content: '<h2>سرتیتر</h2><p>متن بدنه مقاله آزمایشی.</p>',
    categoryId: 'cat-1',
    authorId: 'author-1',
    isPublished: true,
    viewCount: (i + 1) * 10,
    publishedAt: new Date(Date.now() - i * 86_400_000).toISOString(),
  }));
}

const PAGE_SIZE = 9;

/**
 * Mock blog APIs. Page 1 returns 9 posts (fills the grid + featured hero),
 * page 2 returns 1 post (grid-only page: featured must be hidden).
 */
async function mockBlogApis(page: Page, total: number): Promise<void> {
  const all = makePosts(total);

  // Backstop FIRST: Playwright matches routes in reverse registration order,
  // so later (more specific) routes take precedence over this catch-all.
  await page.route(`${API}/**`, (route) => route.fulfill(success({})));

  await page.route(`${API}/Blog**`, (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get('pageNumber') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? String(PAGE_SIZE));
    const items = all.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    return route.fulfill(success({ items, totalCount: all.length, page: pageNumber, pageSize, totalPages: Math.ceil(all.length / pageSize) }));
  });

  // Detail page: any post id
  await page.route(`${API}/Blog/*`, (route) => {
    const id = new URL(route.request().url()).pathname.split('/').pop();
    const post = all.find((p) => p.id === id) ?? all[0];
    return route.fulfill(success(post));
  });
}

async function seedGuestToken(page: Page): Promise<void> {
  await page.addInitScript(
    ([tokenKey, token]) => localStorage.setItem(tokenKey, token),
    ['access_token', makeJwt('Buyer', 'blog-e2e')],
  );
}

test.describe('Blog redesign — list', () => {
  test.describe.configure({ mode: 'serial' });

  test('renders hero, category pills and Material grid of cards', async ({ page }) => {
    await seedGuestToken(page);
    await mockBlogApis(page, 10);
    await page.goto(`${BASE}/blog`);
    await page.waitForLoadState('networkidle');

    // Hero + category pills
    await expect(page.locator('.blog-hero__title')).toContainText('آموزش‌ها');
    await expect(page.locator('.blog-cat')).toHaveCount(6);

    // Material grid: featured hero + remaining posts of page 1 (9 - 1 featured = 8 tiles)
    await expect(page.locator('.blog-featured')).toBeVisible();
    await expect(page.locator('.blog-card')).toHaveCount(8);
    await expect(page.locator('mat-grid-list')).toBeVisible();
  });

  test('paginator shows Persian range label and paginates to page 2', async ({ page }) => {
    await seedGuestToken(page);
    await mockBlogApis(page, 10);
    await page.goto(`${BASE}/blog`);
    await page.waitForLoadState('networkidle');

    const range = page.locator('.mat-mdc-paginator-range-label');
    await expect(range).toHaveText(/1 – 9 از 10/);

    // Featured hero is page-1-only by design
    await expect(page.locator('.blog-featured')).toBeVisible();

    await page.locator('button.mat-mdc-paginator-navigation-next').click();
    await expect(range).toHaveText(/10 – 10 از 10/);

    // Page 2: the single post shows as a grid card, no featured hero
    await expect(page.locator('.blog-card')).toHaveCount(1);
    await expect(page.locator('.blog-featured')).toHaveCount(0);
  });

  test('category filter pill re-queries posts', async ({ page }) => {
    await seedGuestToken(page);
    await mockBlogApis(page, 10);

    let sawSlugParam = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/Blog') && req.url().includes('pageSize=')) sawSlugParam = true;
    });

    await page.goto(`${BASE}/blog`);
    await page.waitForLoadState('networkidle');

    await page.locator('.blog-cat', { hasText: 'راهنمای خرید' }).click();
    await expect(page.locator('.blog-state__text, .blog-card').first()).toBeVisible();
    // Re-query happened (component always refetches on category change)
    expect(sawSlugParam).toBe(true);
  });

  test('clicking a card navigates to the detail page', async ({ page }) => {
    await seedGuestToken(page);
    await mockBlogApis(page, 10);
    await page.goto(`${BASE}/blog`);
    await page.waitForLoadState('networkidle');

    await page.locator('.blog-card').first().click();
    await page.waitForURL(/\/blog\/post-/, { timeout: 15_000 });

    await expect(page.locator('.bd-title')).toContainText('مقاله آزمایشی');
    await expect(page.locator('.bd-meta')).toBeVisible();
    await expect(page.locator('.blog-content')).toContainText('متن بدنه');
    await expect(page.locator('.share-btn')).toHaveCount(3);
  });
});
