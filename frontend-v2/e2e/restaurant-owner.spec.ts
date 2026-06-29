import { test, expect } from '@playwright/test'

const BACKEND_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:8091/rms'

/**
 * Restaurant-owner smoke:
 *  - Logs in with seeded owner creds.
 *  - Navigates to /restaurant/menu and asserts the table renders.
 *  - Clicks the Menu Categories sidebar link and asserts the list renders.
 *
 * Auto-skips when the Spring Boot backend is offline.
 */
test.describe('restaurant owner — menu + categories', () => {
  test('owner sees menu table and categories list', async ({ page, request }) => {
    try {
      const r = await request.get(BACKEND_BASE, { timeout: 1500 })
      if (r.status() >= 500) test.skip(true, `Backend ${BACKEND_BASE} unhealthy (${r.status()})`)
    } catch {
      test.skip(true, `Backend ${BACKEND_BASE} not reachable; skipping login-dependent smoke`)
    }
    await page.goto('/login')
    // id-based locators — getByLabel(/password/i) collides with the
    // 'Show password' toggle button.
    await page.locator('input#mobile').fill('9800000001')
    await page.locator('input#password').fill('spice@123')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForURL('**/restaurant/dashboard', { timeout: 15_000 })

    await page.goto('/restaurant/menu')
    // Heading is "Menu Items" after Phase D1 (full 13-field CRUD page replaces
    // the legacy list-only stub). The page still renders a <table>.
    await expect(page.getByRole('heading', { name: /menu items/i })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()

    // Phase B: sidebar is grouped on desktop only (the v2 mobile layout uses
    // BottomTabBar instead of a sidebar, so the sidebar parent buttons aren't
    // in the DOM at small viewports). On desktop, expand "Menu Management"
    // then click "Categories"; on mobile, just navigate directly.
    const menuParent = page.getByRole('button', { name: /menu management/i }).first()
    const hasSidebar = await menuParent.isVisible().catch(() => false)
    if (hasSidebar) {
      const expanded = await menuParent.getAttribute('aria-expanded')
      if (expanded === 'false') await menuParent.click()
      await page.getByRole('link', { name: /^categories$/i }).first().click()
      await page.waitForURL('**/restaurant/menu-categories', { timeout: 10_000 })
    } else {
      await page.goto('/restaurant/menu-categories')
    }
    await expect(page.getByRole('heading', { name: /categories/i })).toBeVisible()
  })
})
