/**
 * Flying add-to-cart coin — dispatch/subscribe utility.
 *
 * When any DishCard, DishCardRound, SearchModal, or DishDetailModal fires
 * an add-to-cart click, it also calls `flyToCart(fromRect, imgUrl)` which
 * dispatches a document-level CustomEvent. `<CartFlyLayer>` mounted inside
 * `<CustomerLayout>` subscribes and spawns an animated gold-circled thumb
 * that flies with spring physics to the header cart icon.
 *
 * Kept in a tiny standalone module so no component owns the animation
 * state — every source just fires and forgets.
 */

export interface FlyToCartDetail {
  origin: { x: number; y: number; w: number; h: number }
  img: string
}

export const CART_FLY_EVENT = 'customer:cart-fly'

/**
 * Fire a flying-coin animation from `origin` (viewport coords) to the
 * cart icon. Safe to call when no listener is mounted — event is dropped.
 * `origin` should be a DOMRect-like object; pass `element.getBoundingClientRect()`.
 */
export function flyToCart(originEl: Element, img: string): void {
  if (typeof document === 'undefined') return
  const rect = originEl.getBoundingClientRect()
  const detail: FlyToCartDetail = {
    origin: { x: rect.left, y: rect.top, w: rect.width, h: rect.height },
    img,
  }
  document.dispatchEvent(new CustomEvent<FlyToCartDetail>(CART_FLY_EVENT, { detail }))
}
