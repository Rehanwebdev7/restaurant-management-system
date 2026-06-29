import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for frontend-v2 E2E + a11y smoke tests.
 *
 * Notes:
 *  - We do NOT start the dev server here. The runner assumes Vite is already
 *    running on :5174 (locally `npm run dev`, in CI the `e2e` job will spin
 *    it up explicitly so it can also point at a stub API).
 *  - Only Chromium for now to keep CI minutes low. Firefox / WebKit can be
 *    added later if the team wants cross-browser parity coverage.
 *  - Two projects per browser — desktop (1280x720) + mobile (375x812, iPhone
 *    SE-ish) — so we exercise both layouts in a single `npm run test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  retries: 1,
  reporter: [['html', { open: 'never' }]],
  // Cap workers at 2. With higher concurrency the Vite dev server falls
  // behind on serving /menu under simultaneous browser contexts, making
  // useCustomerCatalog slow enough to fail hydration-sensitive specs
  // (customer-cart-flow, customer-home) even though they pass in
  // isolation. CI's smaller machines also benefit from the lower load.
  workers: 2,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Skip framer-motion + CSS transition animations during tests so
    // controlled inputs receive keystrokes immediately without a
    // page-transition Suspense overlay intercepting events.
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],
})
