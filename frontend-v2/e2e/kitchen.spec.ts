import { test, expect } from '@playwright/test'

const BACKEND_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:8091/rms'

/**
 * Kitchen role smoke:
 *  - Logs in with seeded kitchen creds.
 *  - Asserts redirect to /kitchen/dashboard and the page header renders.
 *  - Navigates to /kitchen/display and asserts the board renders.
 *
 * Requires the backend to be reachable and the seed data loaded.
 * Auto-skips when the Spring Boot backend is offline so CI/local runs
 * without a running API don't surface infra failures as spec failures.
 */
test.describe('kitchen — login → dashboard → display', () => {
  test('cashier-class kitchen user reaches KDS', async ({ page, request }) => {
    // Skip if backend down — login requires real API.
    try {
      const r = await request.get(BACKEND_BASE, { timeout: 1500 })
      if (r.status() >= 500) test.skip(true, `Backend ${BACKEND_BASE} unhealthy (${r.status()})`)
    } catch {
      test.skip(true, `Backend ${BACKEND_BASE} not reachable; skipping login-dependent smoke`)
    }
    await page.goto('/login')

    // id-based locators — getByLabel(/password/i) collides with the
    // 'Show password' toggle button.
    await page.locator('input#mobile').fill('9800000004')
    await page.locator('input#password').fill('kitchen@123')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForURL('**/kitchen/dashboard', { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: /kitchen dashboard/i })).toBeVisible()

    await page.goto('/kitchen/display')
    await expect(page.getByRole('heading', { name: /kitchen display/i })).toBeVisible()
  })
})
