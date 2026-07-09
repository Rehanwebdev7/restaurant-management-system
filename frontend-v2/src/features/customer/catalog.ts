/**
 * Catalog data shared by HomePage, MenuPage, CartPage, and the wishlist
 * drawer in CustomerLayout. Pulled out of pages.tsx so the layout
 * can import dish details without a circular dependency.
 */

import { useEffect, useMemo, useState } from 'react'
import type { CustomerMenuItem } from '@/api/services/customer'
import { useCustomerMenuItems, useCustomerCategories, useCustomerBranches } from '@/api/queries/customer'

export interface Dish {
  id: number
  name: string
  price: number
  category: string                          // slug (starters/mains/etc) — legacy fallback grouping
  categoryId: number | null                 // real backend category id — SaaS-safe filtering
  categoryName: string | null               // real backend category name
  rating: number                            // 0 when never rated — gate UI on reviewCount
  reviewCount: number
  description: string
  veg: boolean
  img: string
  signature?: boolean
  // Rich per-item fields surfaced from backend (2026-07-10)
  preparationMinutes?: number | null
  spiceLevel?: string | null                // free-form: "MILD"|"MEDIUM"|"HOT"|...
  createdAt?: string | null                 // ISO — powers "New" ribbon (< 14 days)
  halfPrice?: number | null
  qtrPrice?: number | null
}

/* ---------- Branch selection (persisted to localStorage) ---------- */

const BRANCH_KEY = 'customer_selected_branch_id'
// Sentinel: 0 means "not yet selected — pick the first branch the tenant
// returns from `/api/customer/restaurant_branch/public/all`". The previous
// hardcoded default (4) broke whenever the tenant didn't own that branch
// (multi-tenant SaaS — branch ids vary per tenant).
const NO_BRANCH = 0

type BranchListener = (id: number) => void
const branchListeners = new Set<BranchListener>()

export function getSelectedBranchId(): number {
  if (typeof window === 'undefined') return NO_BRANCH
  const raw = localStorage.getItem(BRANCH_KEY)
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n > 0 ? n : NO_BRANCH
}

export function setSelectedBranchId(id: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(BRANCH_KEY, String(id))
  branchListeners.forEach((fn) => fn(id))
}

export function useSelectedBranchId(): { branchId: number; setBranchId: (id: number) => void } {
  const [branchId, setBranchIdState] = useState<number>(getSelectedBranchId)
  useEffect(() => {
    const fn: BranchListener = (id) => setBranchIdState(id)
    branchListeners.add(fn)
    return () => { branchListeners.delete(fn) }
  }, [])
  return { branchId, setBranchId: setSelectedBranchId }
}

/* ---------- Customer order queue (offline-friendly until backend ships) ---------- */

const ORDERS_QUEUE_KEY = 'customer_orders_queue'

export interface QueuedOrder {
  id: string        // KOT-2042 style local id; stays until backend assigns real id
  placedAt: string  // ISO timestamp
  branchId: number
  items: { dishId: number; name: string; price: number; qty: number; img: string }[]
  total: number
  paymentMethod: 'card' | 'paypal' | 'cod'
  status: 'queued' | 'synced' | 'failed'
  serverOrderId?: number
}

export function readOrdersQueue(): QueuedOrder[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ORDERS_QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeOrdersQueue(orders: QueuedOrder[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ORDERS_QUEUE_KEY, JSON.stringify(orders))
}

export function enqueueOrder(order: QueuedOrder): void {
  const queue = readOrdersQueue()
  queue.unshift(order)
  writeOrdersQueue(queue.slice(0, 50)) // cap at 50 most recent
}

/* ---------- Map backend item → local Dish shape ---------- */

const CATEGORY_FALLBACK_IMG = 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80'

function categorySlug(name: string | null | undefined): string {
  if (!name) return 'mains'
  const lower = name.toLowerCase()
  if (lower.includes('beverage') || lower.includes('drink')) return 'drinks'
  if (lower.includes('starter') || lower.includes('appetizer')) return 'starters'
  if (lower.includes('bread') || lower.includes('roti') || lower.includes('naan')) return 'breads'
  if (lower.includes('dessert') || lower.includes('sweet')) return 'desserts'
  return 'mains'
}

const DETAILED_DESCRIPTIONS: { key: string; text: string }[] = [
  { key: 'butter chicken', text: 'Tender tandoor-roasted chicken slow-simmered in a rich, buttery tomato-cream gravy with fragrant fenugreek.' },
  { key: 'paneer butter', text: 'Fresh cottage cheese cubes folded in a silky, spice-infused tomato butter curry with ground cashew paste.' },
  { key: 'paneer tikka', text: 'Skewered cottage cheese blocks marinated in mustard oil, yogurt, and hand-ground spices, char-grilled in a clay tandoor.' },
  { key: 'tandoori chicken', text: 'Classic whole spring chicken double-marinated in Kashmiri chillies and yogurt, charred over active hardwood coals.' },
  { key: 'biryani', text: 'Fragrant long-grain basmati rice layered with garden herbs, saffron strands, and slow-cooked meat or vegetables.' },
  { key: 'naan', text: 'Traditional hand-stretched leavened flatbread baked fresh against the clay walls of our tandoor oven.' },
  { key: 'roti', text: 'Whole wheat flatbread baked fresh in our traditional tandoor oven.' },
  { key: 'lassi', text: 'Creamy whipped yogurt drink sweetened with fresh mango pulp, cardamom dust, and saffron strands.' },
  { key: 'jamun', text: 'Decadent warm milk dumplings fried golden and immersed in a cardamom-infused sweet sugar syrup.' }
]

function getGourmetDescription(name: string, backendDesc?: string | null): string {
  if (backendDesc && backendDesc.trim().length > 0 && backendDesc !== 'Hand-crafted by our chefs.') {
    return backendDesc
  }
  const cleanName = name.toLowerCase()
  const match = DETAILED_DESCRIPTIONS.find((d) => cleanName.includes(d.key))
  return match ? match.text : 'A chef-special recipe crafted with fresh ingredients, signature spices, and authentic slow-cooking techniques.'
}

export function backendItemToDish(item: CustomerMenuItem): Dish {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    category: categorySlug(item.categoryName),
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    // Real rating & count from backend. UI must render stars only when
    // `reviewCount > 0` — otherwise `rating` is likely a system default and
    // showing it would falsely inflate every fresh tenant's items.
    rating: item.rating,
    reviewCount: item.reviewCount,
    description: getGourmetDescription(item.name, item.description),
    veg: item.isVeg,
    img: item.imageUrl ?? CATEGORY_FALLBACK_IMG,
    // Signature = owner-curated "Chef's Pick" flag (`isRecommended`).
    // No more rating-based synthesis — that lied for un-rated items.
    signature: item.signature,
    preparationMinutes: item.preparationMinutes,
    spiceLevel: item.spiceLevel,
    createdAt: item.createdAt,
    halfPrice: item.halfPrice,
    qtrPrice: item.qtrPrice,
  }
}

/**
 * Hook used by HomePage + MenuPage. Returns:
 *  • dishes — real backend list when available, else local sample
 *  • usingLiveBackend — true when records came from the API
 *  • isLoading — true while the first fetch is in flight
 *  • branchId — the active branch id (also exposes setBranchId)
 */
export function useCustomerCatalog() {
  const { branchId, setBranchId } = useSelectedBranchId()
  // Branches list (host-resolved by backend). We block the menu / category
  // fetch until the branch list is in AND the persisted branchId is in it —
  // otherwise a stale localStorage id from a previous tenant would fire a
  // wasted round-trip to the wrong branch on every hard refresh.
  const branchesQ = useCustomerBranches()
  const branches = branchesQ.data
  const validatedBranchId = useMemo(() => {
    if (!branches || branches.length === 0) return 0
    return branches.some((b) => b.id === branchId) ? branchId : 0
  }, [branches, branchId])

  const menuQ = useCustomerMenuItems(validatedBranchId)
  const catQ = useCustomerCategories(validatedBranchId)

  const live = menuQ.data ?? []
  const dishes = useMemo<Dish[]>(() => {
    if (live.length > 0) return live.map(backendItemToDish)
    return DISHES
  }, [live])

  return {
    dishes,
    categories: catQ.data ?? [],
    usingLiveBackend: live.length > 0,
    isLoading: branchesQ.isLoading || menuQ.isLoading,
    isFetching: menuQ.isFetching,
    branchId: validatedBranchId,
    setBranchId,
  }
}

export const CATEGORIES = [
  { id: 'starters', name: 'Starters', img: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=600&q=80' },
  { id: 'mains', name: 'Mains', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80' },
  { id: 'breads', name: 'Breads', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80' },
  { id: 'drinks', name: 'Drinks', img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80' },
  { id: 'desserts', name: 'Desserts', img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=600&q=80' },
] as const

export const DISHES: Dish[] = [
  { id: 1, name: 'Paneer Tikka',     price: 280, category: 'starters', categoryId: null, categoryName: 'Starters', rating: 4.6, reviewCount: 0, veg: true,  description: 'Marinated cottage cheese in spiced yogurt, char-grilled.', img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80', signature: true },
  { id: 2, name: 'Tandoori Chicken', price: 380, category: 'starters', categoryId: null, categoryName: 'Starters', rating: 4.8, reviewCount: 0, veg: false, description: 'Whole chicken marinated in clay-oven blend, blistered to perfection.', img: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80', signature: true },
  { id: 3, name: 'Butter Chicken',   price: 420, category: 'mains',    categoryId: null, categoryName: 'Mains',    rating: 4.9, reviewCount: 0, veg: false, description: 'Tender tandoor-roasted chicken in our chef-secret tomato cream gravy.', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80', signature: true },
  { id: 4, name: 'Paneer Butter Masala', price: 320, category: 'mains', categoryId: null, categoryName: 'Mains', rating: 4.7, reviewCount: 0, veg: true,  description: 'Silky tomato-cashew gravy with hand-pressed cottage cheese.', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80' },
  { id: 5, name: 'Hyderabadi Biryani', price: 360, category: 'mains', categoryId: null, categoryName: 'Mains', rating: 4.8, reviewCount: 0, veg: false, description: 'Long-grain basmati layered with aromatic spices and slow-cooked chicken.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },
  { id: 6, name: 'Garlic Naan',      price: 80,  category: 'breads',   categoryId: null, categoryName: 'Breads',   rating: 4.7, reviewCount: 0, veg: true,  description: 'Buttery clay-oven flatbread brushed with garlic and coriander.', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80' },
  { id: 7, name: 'Mango Lassi',      price: 110, category: 'drinks',   categoryId: null, categoryName: 'Drinks',   rating: 4.5, reviewCount: 0, veg: true,  description: 'Alphonso mango whirled with creamy yogurt and rose water.', img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80' },
  { id: 8, name: 'Gulab Jamun',      price: 140, category: 'desserts', categoryId: null, categoryName: 'Desserts', rating: 4.9, reviewCount: 0, veg: true,  description: 'Cardamom-scented milk dumplings soaked in saffron syrup.', img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=600&q=80' },
]

// UI-F-22 perf — hero JPEGs at w=1600 weighed ~280 KB each. Mobile viewports
// render them at <= 800 px so we ship the 800-wide variant; that cuts the LCP
// image bytes ~60 %. Desktop browsers up-scale slightly but it's imperceptible
// at the dark overlay we apply on top.
export const HERO_IMAGES = {
  home:      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  signature: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
  whyUs:     'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  gallery:   'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
  contact:   'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
  about:     'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
  legal:     'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
} as const

export const GALLERY = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
]

/* ---------------- cart store (localStorage) ---------------- */

import { useCartStore, type CartLine } from './store/useCartStore'
export type { CartLine }

export function readCart(): CartLine[] {
  return useCartStore.getState().items
}

export function writeCart(c: CartLine[]): void {
  useCartStore.setState({ items: c })
}

export interface UseCart {
  items: CartLine[]
  setQty: (id: number, delta: number) => void
  add: (id: number, qty?: number) => void
}

export function useCart(): UseCart {
  const items = useCartStore((state) => state.items)
  const setQty = useCartStore((state) => state.setQty)
  const add = useCartStore((state) => state.add)

  return { items, setQty, add }
}
