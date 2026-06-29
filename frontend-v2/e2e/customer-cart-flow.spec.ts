import { test, expect } from '@playwright/test'

/**
 * Customer cart → checkout smoke:
 *  - Adds 2 dishes from /menu.
 *  - Lands on /cart, confirms totals row renders with Subtotal/GST/Total.
 *  - PROCEED TO CHECKOUT moves to /checkout with all three payment radios.
 */
test.describe('customer — cart → checkout flow', () => {
  test('two dishes, totals, payment options', async ({ page }) => {
    await page.goto('/menu')
    // Reset cart so we know the 2 ADDs land in a clean slate. Without this,
    // parallel-suite runs that reuse a context can carry over a previous
    // cart and our nth(0)/nth(1) clicks become qty+1 on existing lines.
    await page.evaluate(() => {
      try { window.localStorage.removeItem('customer_cart_v2') } catch { /* noop */ }
    })
    await page.reload()

    // Use unambiguous text-content selector. getByRole('button', { name: /^add$/i })
    // can collide with "Add to wishlist" / "Add ... to cart" accessible names on
    // the menu cards. Wait until at least one ADD button is on screen — that
    // implies the catalog has settled (either live or sample fallback) and the
    // dish grid is mounted, so subsequent clicks won't race hydration.
    const addButtons = page.locator('button:has-text("ADD")')
    await expect(addButtons.first()).toBeVisible({ timeout: 15_000 })
    await addButtons.nth(0).click()
    await addButtons.nth(1).click()

    await page.goto('/cart')
    // Allow up to 10s for the cart to resolve its line items against the
    // (cached) catalog — the page resolves async during hydration.
    await expect(page.getByText(/subtotal/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/gst/i)).toBeVisible()
    await expect(page.getByText(/^total$/i)).toBeVisible()

    await page.getByRole('button', { name: /proceed to checkout/i }).click()
    await expect(page).toHaveURL(/\/checkout$/)

    const group = page.getByRole('radiogroup', { name: /payment method/i })
    await expect(group).toBeVisible()
    await expect(page.getByText(/credit \/ debit card/i)).toBeVisible()
    await expect(page.getByText(/paypal/i).first()).toBeVisible()
    await expect(page.getByText(/cash on delivery/i)).toBeVisible()
  })
})
