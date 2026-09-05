import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env['BASE_URL'] || 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // Optional: run against a locally installed browser instead of the
    // Playwright-managed download, e.g. PW_CHANNEL=chrome npx playwright test
    channel: process.env['PW_CHANNEL'],
  },

  // Boot the Angular dev server automatically unless one is already running
  // (e.g. started manually via npm start).
  webServer: {
    command: 'npm start -- --port 4200 --host localhost',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 240_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
