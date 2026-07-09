/**
 * Image fallback helper — used across customer surfaces so a broken URL
 * never renders as an empty tile. Backend `menu_items.imageUrl` may be
 * empty, malformed, or pointing at a stale CDN; without this, cards look
 * broken and reduce trust.
 *
 * Pick a per-content-kind fallback so a broken dish tile shows a warm
 * food photo, a broken category tile shows an ambience shot, and a
 * broken showcase tile shows an elegant dining room — instead of the
 * same generic photo everywhere.
 *
 * Usage:
 *   <img
 *     src={dish.img}
 *     onError={handleImageError('dish')}
 *     ...
 *   />
 */

export type ImageKind = 'dish' | 'category' | 'showcase' | 'gallery' | 'ambience'

const FALLBACKS: Record<ImageKind, string> = {
  // Warm food close-up (butter chicken / rich curry) — plate-focus.
  dish: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
  // Rustic ingredient board — reads as "category" not "dish".
  category: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80',
  // Elegant dining room / restaurant interior.
  showcase: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  // Curated food/ambience mosaic for gallery-style grids.
  gallery: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1000&q=80',
  // Ambient / mood shot — subtle lighting.
  ambience: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
}

export function imageFallback(kind: ImageKind): string {
  return FALLBACKS[kind]
}

/**
 * React onError handler factory. Swaps the src to the fallback once and
 * removes the handler so we never enter an infinite reload loop when even
 * the fallback fails (rare, but Unsplash CDN can rate-limit).
 */
export function handleImageError(kind: ImageKind) {
  return (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    // Guard: only substitute once.
    if (img.dataset.fallbackApplied === 'true') return
    img.dataset.fallbackApplied = 'true'
    img.src = imageFallback(kind)
  }
}
