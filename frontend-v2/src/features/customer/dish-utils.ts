/**
 * Dish presentation helpers shared by DishCard + DishCardRound.
 * Kept small and dependency-free so they can be imported anywhere.
 */

/**
 * Backend `spiceLevel` is a free-form String (no numeric field). Map the
 * common values our tenants ship to a 1–3 chili-count. Unknown / null → 0
 * (hides the meter). Case-insensitive, trims whitespace.
 */
export function spiceCount(level: string | null | undefined): number {
  if (!level) return 0
  const l = level.toUpperCase().trim()
  if (l === 'MILD' || l === 'LOW' || l === 'MILDLY_SPICY') return 1
  if (l === 'MEDIUM' || l === 'MED' || l === 'MODERATE') return 2
  if (l === 'HOT' || l === 'SPICY' || l === 'EXTRA_HOT' || l === 'VERY_HOT' || l === 'HIGH') return 3
  return 0
}

/**
 * Whether the backend `createdAt` places this dish within the last 14 days —
 * powers the small "New" chip. Silent-false on unparseable or future dates.
 */
export function isNewDish(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false
  const then = new Date(createdAt).getTime()
  if (Number.isNaN(then)) return false
  const daysDiff = (Date.now() - then) / (1000 * 60 * 60 * 24)
  return daysDiff < 14 && daysDiff >= 0
}
