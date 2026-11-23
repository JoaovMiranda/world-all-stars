import { defineConfig, devices } from '@playwright/test';

// E2E + axe checks against the full app (SSR + API). Browsers: `pnpm --filter web exec playwright install --with-deps chromium`.
const PORT = Number(process.env.E2E_PORT ?? 8787);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: BASE_URL, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(process.env.E2E_BASE_URL
    ? {}
    : { webServer: { command: 'pnpm --dir ../.. dev', url: BASE_URL, reuseExistingServer: !process.env.CI, timeout: 120_000 } }),
});
