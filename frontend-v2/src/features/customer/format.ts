/**
 * Customer surface currency + number formatters.
 *
 * Single source of truth so the whole app renders ₹ with en-IN grouping
 * (1,00,000 not 100,000). Prior code hardcoded `$` all over the customer
 * feature; that lie was flagged in the 2026-07-13 senior audit.
 *
 * Usage: `formatPrice(dish.price)` → "₹450"
 *        `formatPrice(order.total)` → "₹1,24,900"
 */

export const CURRENCY = '₹'

/** Format a price value with rupee symbol + en-IN comma grouping. */
export function formatPrice(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return `${CURRENCY}${n.toLocaleString('en-IN')}`
}

/** Same as formatPrice but returns just the number part (no symbol). */
export function formatPriceValue(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return n.toLocaleString('en-IN')
}
