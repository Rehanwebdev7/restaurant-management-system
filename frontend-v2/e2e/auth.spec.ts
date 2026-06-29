import { test, expect } from '@playwright/test'

/**
 * Auth smoke — verifies the panel-login form is wired up correctly:
 *  - Both fields render.
 *  - Submit stays disabled until both fields have valid input.
 *  - After filling both, submit becomes enabled.
 */
test.describe('auth — panel login', () => {
  test('form interactive and submit enables on valid input', async ({ page }) => {
    await page.goto('/login')
    // Wait for first-paint hydration so React owns the inputs before we type.
    await page.waitForLoadState('networkidle')

    // Unambiguous id-based locators — getByLabel/getByRole collide with the
    // language switcher / show-password toggle / character-count helper.
    const mobile = page.locator('input#mobile')
    const password = page.locator('input#password')
    const submit = page.getByRole('button', { name: /sign in/i }).first()

    await expect(mobile).toBeVisible()
    await expect(password).toBeVisible()
    await expect(submit).toBeDisabled()

    // Use .fill() (synchronous set) — keyboard.type was racing React's
    // controlled-input onChange under animated layouts. With reducedMotion
    // enabled in playwright.config.ts and PageLoader returning null in that
    // mode, .fill() reliably propagates value through React's state.
    await mobile.fill('9800000001')
    await expect(mobile).toHaveValue('9800000001')

    await password.fill('spice@123')
    await expect(password).toHaveValue('spice@123')

    await expect(submit).toBeEnabled({ timeout: 8_000 })
  })
})
