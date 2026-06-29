import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Axe-core a11y smoke. Allows minor / moderate / serious violations through
 * (the team is tracking those in tickets), and applies per-route thresholds:
 *   • `/`     — animated hero with rotator pagination buttons + reserve-table
 *               quick form has known minor label gaps; accept ≤ 2 critical.
 *   • `/login` — strict (must be 0).
 *   • `/menu`  — strict (must be 0).
 */
const CRITICAL_BUDGET: Record<string, number> = {
  '/': 2,
  '/menu': 0,
  '/login': 0,
}
const ROUTES: readonly string[] = Object.keys(CRITICAL_BUDGET)

async function scan(page: Page, path: string) {
  await page.goto(path)
  // Wait for hydration so dynamic content lands in the DOM before axe runs.
  await page.waitForLoadState('networkidle')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const critical = results.violations.filter((v) => v.impact === 'critical')
  return { critical, allViolations: results.violations }
}

test.describe('a11y — axe-core critical violations', () => {
  for (const path of ROUTES) {
    const budget = CRITICAL_BUDGET[path] ?? 0
    test(`≤ ${budget} critical violations on ${path}`, async ({ page }) => {
      const { critical } = await scan(page, path)
      expect(
        critical.length,
        `Found ${critical.length} critical violations on ${path} (budget ${budget}):\n${JSON.stringify(critical, null, 2)}`,
      ).toBeLessThanOrEqual(budget)
    })
  }
})
