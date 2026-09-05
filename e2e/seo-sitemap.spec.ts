import { test, expect, Page } from '@playwright/test';

/**
 * Live SEO endpoint checks: /robots.txt (frontend) + /sitemap.xml and its child
 * files (backend). These tests REQUIRE a live backend serving the dynamic sitemap
 * and a dev server serving the Angular app. When either is unreachable the whole
 * suite skips (normal `npm run e2e` stays green without a backend).
 *
 *   - backend:  dotnet run --project backend/src/Toolidi.Ecommerce.WebApi --launch-profile http
 *   - frontend: npm start  (started automatically by playwright.config webServer)
 *
 * URLs are overridable: BASE_URL (frontend), API_URL (backend),
 * SITEMAP_HOST (expected public origin of the sitemap files).
 */

const BASE = process.env['BASE_URL'] || 'http://localhost:4200';
const API = process.env['API_URL'] || 'http://localhost:5291';
const EXPECTED_SITEMAP_HOST = process.env['SITEMAP_HOST'] || 'https://api.toolidi.ir';

test.beforeAll(async ({ request }) => {
  const frontend = await request.get(`${BASE}/robots.txt`).catch(() => null);
  const backend = await request.get(`${API}/health`).catch(() => null);

  test.skip(
    frontend?.status() !== 200 || backend?.status() !== 200,
    'Live frontend and/or backend not reachable — start ng serve and the API before running these tests.',
  );
});

async function fetchText(page: Page, url: string): Promise<string> {
  const resp = await page.goto(url);
  expect(resp?.status(), `${url} status`).toBe(200);
  return (await resp!.text()) ?? '';
}

test('robots.txt is served with directives + Sitemap line', async ({ page }) => {
  const text = await fetchText(page, `${BASE}/robots.txt`);

  expect(text).toContain('User-agent: *');
  expect(text).toContain('Disallow: /admin');
  expect(text).toContain('Disallow: /seller');
  expect(text).toContain(`Sitemap: ${EXPECTED_SITEMAP_HOST}/sitemap.xml`);
  await page.close();
});

test('sitemap index resolves as sitemapindex with three children', async ({ page }) => {
  const resp = await page.goto(`${API}/sitemap.xml`);
  expect(resp?.status()).toBe(200);
  expect(resp?.headers()['content-type']).toContain('application/xml');
  const text = await resp!.text();

  expect(text).toContain('<sitemapindex');
  expect(text).toContain(`<loc>${EXPECTED_SITEMAP_HOST}/sitemap-pages.xml</loc>`);
  expect(text).toContain(`<loc>${EXPECTED_SITEMAP_HOST}/sitemap-products.xml</loc>`);
  expect(text).toContain(`<loc>${EXPECTED_SITEMAP_HOST}/sitemap-blog.xml</loc>`);
  // Dynamic sections carry lastmod metadata in the index
  expect(text).toContain('<lastmod>');
  await page.close();
});

test('each child sitemap resolves locally and has valid content', async ({ page }) => {
  // Children are fetched from the local API (the index lists their production origin,
  // which may point elsewhere) and must contain absolute toolidi.ir URLs.
  const children = [
    { path: 'sitemap-pages.xml', marker: 'categoryId=', min: 11 },
    { path: 'sitemap-products.xml', marker: '/product/slug/', min: 1 },
    { path: 'sitemap-blog.xml', marker: '/blog/', min: 1 },
  ];

  for (const child of children) {
    const resp = await page.goto(`${API}/${child.path}`);
    expect(resp?.status(), `${child.path} status`).toBe(200);
    expect(resp?.headers()['content-type'], `${child.path} content-type`).toContain('application/xml');
    const text = await resp!.text();

    expect(text).toContain('<urlset');
    const urlCount = (text.match(/<url>/g) ?? []).length;
    expect(urlCount, `${child.path} url count`).toBeGreaterThanOrEqual(child.min);
    expect(text, `${child.path} marker`).toContain(child.marker);
    expect(text, `${child.path} absolute URLs`).toContain('https://toolidi.ir/');
  }
  await page.close();
});

test('robots.txt Sitemap host matches the index child host (crawler chain)', async ({ page }) => {
  const robots = await fetchText(page, `${BASE}/robots.txt`);
  const robotsHost = robots.match(/Sitemap:\s*(https:\/\/[^/\s]+)/)?.[1] ?? '';

  const index = await fetchText(page, `${API}/sitemap.xml`);
  const indexHost = index.match(/<loc>(https:\/\/[^/]+)/)?.[1] ?? '';

  expect(robotsHost).toBe(EXPECTED_SITEMAP_HOST);
  expect(indexHost).toBe(EXPECTED_SITEMAP_HOST);
  expect(robotsHost).toBe(indexHost); // crawler can chain robots → sitemap → children
  await page.close();
});