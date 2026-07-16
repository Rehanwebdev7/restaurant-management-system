/**
 * Customer-facing API service.
 *
 * VERIFIED LIVE 2026-06-24:
 *   ✅ /api/customer/menu_items/public/advanceFilter?branchId={n}  → 200
 *   ✅ /api/customer/menu_category/public/filter?branchId={n}      → 200
 *   ✅ /api/admin/restaurant_branch/all  (with supadmin token)     → 200
 *   ❌ /api/customer/branding                                       → 500
 *   ❌ /login/customerSendOtp + customerVerifyOtp                   → 500
 *   ❌ /api/customer/orders/add                                     → 500
 *
 * Branches with data (live DB):
 *   • branchId=4 → 33 menu items (Spice Garden — Sanjay Patil branch)
 *   • branchId=6 → 9 menu items
 *
 * Strategy: use the PUBLIC routes for menu + categories, fall back to
 * sample data for branding / orders until backend ships those routes.
 */
import apiClient from '@/api/client'
import { unwrap } from '@/api/normalize'

/* ---------- types matching the LIVE backend shape ---------- */

interface BackendMenuCategoryRef { id: number; name: string }
interface BackendBranchRef { id: number; name?: string }

interface BackendMenuItem {
  id: number
  name: string
  description?: string | null
  price: number | string
  mrp?: number | string | null
  halfPrice?: number | string | null
  halfMrp?: number | string | null
  qtrPrice?: number | string | null
  qtrMrp?: number | string | null
  isActive?: boolean | null
  isAvailable?: boolean | null
  dietaryType?: boolean | null  // true = veg, false = non-veg
  menuCategoryId?: BackendMenuCategoryRef | null
  branchId?: BackendBranchRef | null
  imageUrl?: string | null
  // Rich per-item fields already returned by
  // /api/customer/menu_items/public/advanceFilter but ignored by v2 pre-2026-07-10.
  rating?: number | string | null           // computed getter: avg or system rating
  ratingCount?: number | null               // 0 when never rated
  isRecommended?: boolean | null            // owner-curated "Chef's Pick / show on home"
  preparationMinutes?: number | null        // real prep time
  spiceLevel?: string | null                // free-form: "MILD"|"MEDIUM"|"HOT"|...
  createdAt?: string | null                 // ISO — powers the "New" ribbon
}

interface PagedResponse<T> {
  totalRecords: number
  pageSize: number
  currentPage: number
  totalPages: number
  records: T[]
}

/* ---------- frontend-facing types (consumed by pages) ---------- */

export interface CustomerMenuItem {
  id: number
  name: string
  description: string
  price: number
  mrp: number | null
  halfPrice: number | null
  halfMrp: number | null
  qtrPrice: number | null
  qtrMrp: number | null
  isVeg: boolean
  isAvailable: boolean
  imageUrl: string | null
  categoryId: number | null
  categoryName: string | null
  branchId: number | null
  signature: boolean                        // driven by backend `isRecommended`
  rating: number                            // 0 when never rated
  reviewCount: number                       // 0 when never rated — gate UI on this
  preparationMinutes: number | null
  spiceLevel: string | null
  createdAt: string | null                  // ISO — for "New" ribbon (<14 days)
}

export interface CustomerMenuCategory {
  id: number
  name: string
  description?: string | null
  imageUrl?: string | null                  // resolved from iconUrl → driveIconUrl fallback
  priority?: number | null                  // backend field name (was displayOrder)
}

export interface CustomerBranch {
  id: number
  branchName: string
  addressLine1?: string | null
  city?: string | null
  pincode?: string | null
  phone?: string | null
  email?: string | null
  restaurantId?: number | null
  latitude?: number | null                  // backend field name (was lat)
  longitude?: number | null                 // backend field name (was lng)
}

export interface CustomerSlider {
  id: number
  title?: string | null
  description?: string | null
  imageUrl: string
  linkUrl?: string | null
}

export interface CustomerGalleryImage {
  id: number
  imageUrl: string
  driveImageUrl?: string | null
  title?: string | null
  description?: string | null
  category?: string | null
  platform?: string | null
  displayOrder?: number | null
}

export interface CustomerBranding {
  /** Resolved tenant id — drives every other tenant-scoped fetch. */
  restaurantId?: number | null
  restaurantName?: string
  tagline?: string
  logoUrl?: string
  primaryColor?: string
  /** Set true when the backend matched our Host against a real domain
   *  mapping (not the localhost fallback). Useful for telling embedded
   *  widgets "this domain isn't onboarded yet". */
  domainResolved?: boolean
  matchedDomain?: string | null
  requestHost?: string | null
  // Widened fields (2026-07-10) — projected from BusinessSettingEntity
  // via approved backend widen. All optional / nullable — UI must gate
  // rendering on presence so empty tenants show nothing (no lies).
  fssaiNumber?: string | null
  gstNumber?: string | null
  whatsappNumber?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  googleMapEmbed?: string | null
  googleRatingUrl?: string | null
  /** JSON blob — parse client-side. Shape: { facebook, instagram, twitter, youtube, ... } */
  socialMediaLinks?: string | null
  aboutUs?: string | null
  ourMission?: string | null
  ourVision?: string | null
  marqueeText?: string | null
  marqueeIsLive?: boolean | null
  marqueeBgColor?: string | null
  marqueeTextColor?: string | null
  marqueeSpeed?: number | null
  // permissive — backend may return any of these aliases
  name?: string
  subtitle?: string
  logo?: string
  primaryHex?: string
}

export interface CustomerOrderItemInput {
  menuItemId: number
  quantity: number
  specialInstructions?: string
}

export interface PlaceOrderInput {
  branchId: number
  orderType: 'DINING' | 'TAKEAWAY' | 'DELIVERY'
  items: CustomerOrderItemInput[]
  customerName: string
  customerPhone: string
  customerEmail?: string
  deliveryAddress?: string
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'WALLET' | 'STRIPE' | 'PAYPAL' | 'CCAVENUE'
  couponCode?: string
  specialInstructions?: string
}

/* ---------- helpers ---------- */

interface OkResult<T> { ok: true; data: T }
interface ErrResult { ok: false; message: string }
type Result<T> = OkResult<T> | ErrResult

function errorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string }
  return e.response?.data?.message ?? e.message ?? 'Request failed'
}

/* ---------- READ endpoints (use PUBLIC routes — verified live) ---------- */

function toCustomerMenuItem(b: BackendMenuItem): CustomerMenuItem {
  return {
    id: b.id,
    name: b.name,
    description: b.description ?? '',
    price: Number(b.price),
    mrp: b.mrp != null ? Number(b.mrp) : null,
    halfPrice: b.halfPrice != null ? Number(b.halfPrice) : null,
    halfMrp: b.halfMrp != null ? Number(b.halfMrp) : null,
    qtrPrice: b.qtrPrice != null ? Number(b.qtrPrice) : null,
    qtrMrp: b.qtrMrp != null ? Number(b.qtrMrp) : null,
    isVeg: b.dietaryType === true,
    isAvailable: b.isAvailable !== false && b.isActive !== false,
    imageUrl: b.imageUrl ?? null,
    categoryId: b.menuCategoryId?.id ?? null,
    categoryName: b.menuCategoryId?.name ?? null,
    branchId: b.branchId?.id ?? null,
    signature: b.isRecommended === true,
    rating: b.rating != null ? Number(b.rating) : 0,
    reviewCount: b.ratingCount ?? 0,
    preparationMinutes: b.preparationMinutes ?? null,
    spiceLevel: b.spiceLevel && b.spiceLevel.trim().length > 0 ? b.spiceLevel : null,
    createdAt: b.createdAt ?? null,
  }
}

/**
 * Live public endpoint — returns paginated dishes for the given branch.
 * Branches with data (DB 2026-06-24): id=4 (33 items), id=6 (9 items).
 */
export async function fetchCustomerMenuItems(branchId: number, pageSize = 200): Promise<CustomerMenuItem[]> {
  try {
    const r = await apiClient.get('/api/customer/menu_items/public/advanceFilter', {
      params: { branchId, pageSize },
    })
    const paged = unwrap<PagedResponse<BackendMenuItem>>(r, 'data.data')
    if (!paged || !Array.isArray(paged.records)) return []
    return paged.records.map(toCustomerMenuItem)
  } catch {
    return []
  }
}

interface BackendMenuCategory {
  id: number
  name: string
  description?: string | null
  iconUrl?: string | null
  driveIconUrl?: string | null
  priority?: number | null                   // backend field name (was displayOrder in v2 types)
}

export async function fetchCustomerCategories(branchId: number, pageSize = 100): Promise<CustomerMenuCategory[]> {
  try {
    const r = await apiClient.get('/api/customer/menu_category/public/filter', {
      params: { branchId, pageSize },
    })
    const paged = unwrap<PagedResponse<BackendMenuCategory>>(r, 'data.data')
    if (!paged || !Array.isArray(paged.records)) return []
    return paged.records.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      // Prefer drive-hosted CDN URL when present, fall back to iconUrl so
      // tenants who upload directly (no drive integration) still get an icon.
      imageUrl: c.driveIconUrl && c.driveIconUrl.trim().length > 0
        ? c.driveIconUrl
        : (c.iconUrl ?? null),
      priority: c.priority ?? null,
    }))
  } catch {
    return []
  }
}

/**
 * Branches list. No customer public route exists yet — but DB known to
 * have branchId 4 (33 items) and 6 (9 items). We return both so the user
 * can switch between them; once backend exposes a public branches route
 * this function will pick that up automatically.
 */
const KNOWN_BRANCHES: CustomerBranch[] = [
  { id: 4, branchName: 'Spice Garden — Bandra', addressLine1: 'Bandra West', city: 'Mumbai', phone: '+91 98765 00003' },
  { id: 6, branchName: 'Biryani House — Indiranagar', addressLine1: 'Indiranagar 100ft Road', city: 'Bangalore', phone: '+91 98765 00002' },
]

/**
 * Branches for the current tenant. Calls the PUBLIC endpoint so unsigned-in
 * customers can browse — backend resolves the tenant from the Host header.
 * When the host hasn't been onboarded yet the backend returns the full
 * active list (legacy behaviour); we still surface that so a fresh demo
 * cluster works out of the box.
 */
export async function fetchCustomerBranches(restaurantId?: number): Promise<CustomerBranch[]> {
  try {
    const r = await apiClient.get('/api/customer/restaurant_branch/public/all', {
      params: restaurantId ? { restaurantId } : undefined,
    })
    const data = unwrap<CustomerBranch[]>(r, 'data.data')
    if (Array.isArray(data) && data.length > 0) return data
  } catch {
    /* fall through to known list — only used in true offline */
  }
  return KNOWN_BRANCHES
}

export async function fetchCustomerSliders(branchId?: number): Promise<CustomerSlider[]> {
  try {
    // Backend only exposes the PUBLIC endpoint here. The plain `/all` route
    // required a customer access_token but never existed for sliders, so we
    // were burning a 500 on every hard refresh until now.
    const r = await apiClient.get('/api/customer/sliders/public/all', {
      params: branchId ? { branchId } : undefined,
    })
    return unwrap<CustomerSlider[]>(r, 'data.data') ?? []
  } catch {
    return []
  }
}

export async function fetchCustomerGallery(
  restaurantId: number,
  platform?: string,
): Promise<CustomerGalleryImage[]> {
  try {
    const r = await apiClient.get('/api/public/customer/gallery/get_gallery', {
      params: { restaurantId, ...(platform ? { platform } : {}) },
    })
    const raw = unwrap<Array<Record<string, unknown>>>(r, 'data.data') ?? []
    return raw
      .map((row) => ({
        id: Number(row.id),
        imageUrl: String(row.imageUrl ?? row.driveImageUrl ?? ''),
        driveImageUrl: (row.driveImageUrl as string | null) ?? null,
        title: (row.title as string | null) ?? null,
        description: (row.description as string | null) ?? null,
        category: (row.category as string | null) ?? null,
        platform: (row.platform as string | null) ?? null,
        displayOrder: (row.displayOrder as number | null) ?? null,
      }))
      .filter((g) => g.imageUrl.length > 0)
  } catch {
    return []
  }
}

export async function fetchCustomerBranding(): Promise<CustomerBranding | null> {
  try {
    const r = await apiClient.get('/api/customer/branding')
    return unwrap<CustomerBranding>(r, 'data.data')
  } catch {
    return null
  }
}

/* ---------- AUTH (customer OTP) ---------- */

export async function customerSendOtp(
  mobile: string,
): Promise<Result<{ sent: true; demoMode: boolean; otpId?: string }>> {
  try {
    const r = await apiClient.post('/login/customerSendOtp', { mobile })
    // ApiResponse envelope: { data: { otpId, expiresInSeconds, demoMode } }
    const env = unwrap<{ demoMode?: boolean; otpId?: string }>(r, 'data.data')
    return {
      ok: true,
      data: { sent: true, demoMode: env?.demoMode === true, otpId: env?.otpId },
    }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export async function customerVerifyOtp(
  mobile: string,
  otp: string,
): Promise<Result<{ token: string; name?: string; email?: string; customerId?: number }>> {
  try {
    const r = await apiClient.post('/login/customerVerifyOtp', { mobile, otp })
    const data = unwrap<{ token: string; name?: string; email?: string; customerId?: number }>(r, 'data.data')
    if (!data?.token) return { ok: false, message: 'Verification failed' }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export async function customerLoginPassword(
  mobile: string,
  password: string,
): Promise<Result<{ token: string; name?: string; email?: string; customerId?: number }>> {
  try {
    const r = await apiClient.post('/login/customer', { mobile, password })
    const data = unwrap<{ token: string; name?: string; email?: string; customerId?: number }>(r, 'data.data')
    if (!data?.token) return { ok: false, message: 'Login failed' }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

/* ---------- ADDRESSES (customer profile) ---------- */

export interface BackendCustomerAddress {
  id?: number
  addressType?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  pincode?: string | null
  landmark?: string | null
  deliveryInstructions?: string | null
  latitude?: number | null
  longitude?: number | null
  isDefault?: boolean | null
  isActive?: boolean | null
  customerId?: { id: number } | null
}

export async function fetchCustomerAddresses(): Promise<Result<BackendCustomerAddress[]>> {
  try {
    const r = await apiClient.get('/api/customer/customer_delivery_addresses/all')
    const list = unwrap<BackendCustomerAddress[]>(r, 'data.data') ?? []
    return { ok: true, data: Array.isArray(list) ? list : [] }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export async function addCustomerAddress(
  body: BackendCustomerAddress,
): Promise<Result<BackendCustomerAddress>> {
  try {
    const r = await apiClient.post('/api/customer/customer_delivery_addresses/add', body)
    // Some backends return only a string id — that's fine, the caller will refetch.
    const data = unwrap<BackendCustomerAddress>(r, 'data.data')
    return { ok: true, data: data ?? body }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export async function updateCustomerAddress(
  body: BackendCustomerAddress,
): Promise<Result<BackendCustomerAddress>> {
  try {
    const r = await apiClient.put('/api/customer/customer_delivery_addresses/update', body)
    const data = unwrap<BackendCustomerAddress>(r, 'data.data')
    return { ok: true, data: data ?? body }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export async function deleteCustomerAddress(id: number): Promise<Result<{ deleted: true }>> {
  try {
    await apiClient.delete(`/api/customer/customer_delivery_addresses/${id}`)
    return { ok: true, data: { deleted: true } }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

/* ---------- PROFILE ---------- */

export interface CustomerProfileInput {
  id?: number
  name?: string
  email?: string
  mobileNumber?: string
}

/**
 * Update the signed-in customer's profile. The legacy backend exposes
 * `/api/customer/customers/update` (mirrors the restaurant customers route)
 * and identifies the row by the `id` field on the body — so we pull the
 * customer id from localStorage (set during login) and stitch it in.
 * Returns the updated profile fields back so the caller can rehydrate the
 * canonical localStorage keys.
 */
export async function updateCustomerProfile(
  input: CustomerProfileInput,
): Promise<Result<CustomerProfileInput>> {
  try {
    let id = input.id
    if (id == null) {
      const raw = (typeof window !== 'undefined' ? window.localStorage.getItem('UserId') : null) ?? ''
      id = raw ? Number(raw) : undefined
    }
    if (id == null || !Number.isFinite(id)) {
      return { ok: false, message: 'Sign in again to save your profile' }
    }
    const body = { ...input, id }
    const r = await apiClient.put('/api/customer/customers/update', body)
    const data = unwrap<CustomerProfileInput>(r, 'data.data')
    return { ok: true, data: data ?? body }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

/* ---------- RESERVATIONS (table booking) ---------- */

export interface ReservationInput {
  name: string
  phone: string
  email?: string
  date: string  // YYYY-MM-DD
  time: string  // HH:MM
  guests: number
  notes?: string
}

/**
 * Public-endpoint reservation request — no customer token required. Backend
 * upserts a CustomersEntity by phone + creates a TableBookingEntity with
 * status REQUESTED. The restaurant team triages requested bookings before
 * confirming a table.
 */
export async function submitPublicReservation(
  input: ReservationInput,
): Promise<Result<{ reservationId: number }>> {
  try {
    const r = await apiClient.post('/api/customer/table_booking/public/add', input)
    const data = unwrap<{ reservationId: number }>(r, 'data.data')
    if (!data) return { ok: false, message: 'Reservation failed' }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

/* ---------- ORDERS ---------- */

export interface BackendOrderItem {
  id?: number
  menuItemId?: number | { id?: number }
  menuItemName?: string
  quantity?: number
  price?: number | string
  itemTotal?: number | string
  status?: string
}

export interface BackendOrderDetail {
  id?: number
  orderNumber?: string
  orderType?: string
  status?: string
  paymentStatus?: string
  paymentMethod?: string
  subtotal?: number | string
  taxAmount?: number | string
  deliveryFee?: number | string
  totalAmount?: number | string
  customerName?: string
  customerPhone?: string
  tableNumber?: string
  estimatedTime?: number
  createdAt?: string
  completedAt?: string
  orderItems?: BackendOrderItem[]
}

/**
 * Fetch a customer-side order detail. Uses the customer token's order endpoint
 * which (post-Session-17) projects to scalar columns instead of the raw
 * OrdersEntity — so it no longer blows past Postgres' 1664-column join limit.
 */
export async function fetchCustomerOrderDetail(
  orderId: number | string,
): Promise<Result<BackendOrderDetail>> {
  try {
    const r = await apiClient.get(`/api/customer/orders/${orderId}`)
    const data = unwrap<BackendOrderDetail>(r, 'data.data')
    if (!data?.id) return { ok: false, message: 'Order not found' }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}


export async function placeCustomerOrder(input: PlaceOrderInput): Promise<Result<{ orderId: number }>> {
  try {
    const r = await apiClient.post('/api/customer/orders/add', input)
    const data = unwrap<{ orderId: number; id?: number }>(r, 'data.data')
    const orderId = data?.orderId ?? data?.id
    if (!orderId) return { ok: false, message: 'Order create returned no id' }
    return { ok: true, data: { orderId } }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export interface CustomerOrderSummary {
  id: number
  orderNumber?: string
  status: string
  paymentStatus?: string
  paymentMethod?: string
  totalAmount: number
  itemCount?: number
  createdAt?: string
  orderType?: string
}

export async function fetchCustomerOrders(pageSize = 50): Promise<CustomerOrderSummary[]> {
  try {
    // Backend has no `/history` endpoint; `/getAll` returns a paginated map
    // `{ records: [...], totalRecords, currentPage, totalPages, pageSize }`
    // scoped to the signed-in customer via the access_token header.
    const r = await apiClient.get(`/api/customer/orders/getAll?pageNumber=0&pageSize=${pageSize}`)
    const payload = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const raw = Array.isArray(payload.records)
      ? (payload.records as Array<Record<string, unknown>>)
      : Array.isArray(payload)
        ? (payload as unknown as Array<Record<string, unknown>>)
        : []
    return raw
      .filter((o): o is Record<string, unknown> => typeof o === 'object' && o !== null)
      .map((o) => {
        const num = (v: unknown): number => typeof v === 'number' ? v : v ? Number(v) || 0 : 0
        const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
        const items = Array.isArray(o.orderItems) ? o.orderItems.length : undefined
        return {
          id: Number(o.id) || 0,
          orderNumber: str(o.orderNumber),
          status: str(o.status) ?? 'PLACED',
          paymentStatus: str(o.paymentStatus),
          paymentMethod: str(o.paymentMethod),
          totalAmount: num(o.totalAmount),
          itemCount: typeof o.itemCount === 'number' ? o.itemCount : items,
          createdAt: str(o.createdAt),
          orderType: str(o.orderType),
        }
      })
      .filter((o) => o.id > 0)
  } catch {
    return []
  }
}

/* ---------- ORDER ACTIONS (Batch 1: cancel) ---------- */

export async function cancelCustomerOrder(orderId: number | string, reason?: string): Promise<Result<{ cancelled: true }>> {
  try {
    // Backend expects `customerFeedback` (not `reason`) in the optional body.
    await apiClient.put(`/api/customer/orders/${orderId}/cancel`, reason ? { customerFeedback: reason } : {})
    return { ok: true, data: { cancelled: true } }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

/* ---------- NOTIFICATIONS (Batch 1) ---------- */

export interface CustomerNotification {
  id: number
  title: string
  message: string
  type?: string
  isRead: boolean
  createdAt?: string
  metadata?: Record<string, unknown> | null
}

export interface NotificationsPage {
  records: CustomerNotification[]
  totalRecords: number
  currentPage: number
  totalPages: number
  pageSize: number
}

export async function fetchCustomerNotifications(pageNumber = 0, pageSize = 20): Promise<NotificationsPage> {
  const empty: NotificationsPage = { records: [], totalRecords: 0, currentPage: 0, totalPages: 0, pageSize }
  try {
    const r = await apiClient.get(`/api/customer/notifications?pageNumber=${pageNumber}&pageSize=${pageSize}`)
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const rawRecords = Array.isArray(data.records) ? data.records as Array<Record<string, unknown>> : []
    const records: CustomerNotification[] = rawRecords
      .filter((n): n is Record<string, unknown> => typeof n === 'object' && n !== null)
      .map((n) => ({
        id: Number(n.id) || 0,
        title: (typeof n.title === 'string' ? n.title : '') || (typeof n.subject === 'string' ? n.subject : 'Notification'),
        message: (typeof n.message === 'string' ? n.message : '') || (typeof n.body === 'string' ? n.body : ''),
        type: typeof n.type === 'string' ? n.type : undefined,
        isRead: Boolean(n.isRead ?? n.read ?? false),
        createdAt: typeof n.createdAt === 'string' ? n.createdAt : undefined,
        metadata: typeof n.metadata === 'object' && n.metadata !== null ? n.metadata as Record<string, unknown> : null,
      }))
      .filter((n) => n.id > 0)
    return {
      records,
      totalRecords: typeof data.totalRecords === 'number' ? data.totalRecords : records.length,
      currentPage: typeof data.currentPage === 'number' ? data.currentPage : pageNumber,
      totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
      pageSize: typeof data.pageSize === 'number' ? data.pageSize : pageSize,
    }
  } catch {
    return empty
  }
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  try {
    const r = await apiClient.get('/api/customer/notifications/unread-count')
    const count = unwrap<number>(r, 'data.data')
    return typeof count === 'number' ? count : 0
  } catch {
    return 0
  }
}

export async function markNotificationRead(id: number): Promise<Result<{ ok: true }>> {
  try {
    await apiClient.put(`/api/customer/notifications/read/${id}`)
    return { ok: true, data: { ok: true } }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export async function markAllNotificationsRead(): Promise<Result<{ ok: true }>> {
  try {
    await apiClient.put('/api/customer/notifications/read-all')
    return { ok: true, data: { ok: true } }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

/* ---------- COUPONS (Batch 1) ---------- */

export interface CustomerCoupon {
  id: number
  code: string
  title?: string
  description?: string
  discountType?: string   // "PERCENT" | "FLAT" | ...
  discountValue?: number
  minOrderAmount?: number
  maxDiscount?: number
  bucket?: 'GLOBAL' | 'SUGGESTED' | 'FIRST_ORDER' | string
  validTill?: string
}

export interface AvailableCouponsInput {
  branchId?: number
  orderAmount?: number
  orderType?: string
}

export interface AvailableCouponsResult {
  global: CustomerCoupon[]
  suggested: CustomerCoupon[]
  firstOrder: CustomerCoupon[]
}

function normalizeCoupon(raw: Record<string, unknown>, bucket: string): CustomerCoupon {
  const num = (v: unknown): number | undefined =>
    typeof v === 'number' ? v : (v != null && v !== '' ? Number(v) : undefined)
  const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
  return {
    id: Number(raw.id) || 0,
    code: str(raw.code) ?? '',
    title: str(raw.title) ?? str(raw.name),
    description: str(raw.description),
    discountType: str(raw.discountType),
    discountValue: num(raw.discountValue),
    minOrderAmount: num(raw.minOrderAmount),
    maxDiscount: num(raw.maxDiscount),
    bucket: bucket as CustomerCoupon['bucket'],
    validTill: str(raw.validTill) ?? str(raw.validityEndDate),
  }
}

export async function fetchAvailableCoupons(input: AvailableCouponsInput): Promise<AvailableCouponsResult> {
  const empty: AvailableCouponsResult = { global: [], suggested: [], firstOrder: [] }
  try {
    const r = await apiClient.post('/api/customer/coupon/available', input)
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const toArr = (v: unknown): Array<Record<string, unknown>> =>
      Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null) : []
    return {
      global: toArr(data.global ?? data.globalCoupons).map((c) => normalizeCoupon(c, 'GLOBAL')).filter((c) => c.id > 0),
      suggested: toArr(data.suggested ?? data.suggestedCoupons).map((c) => normalizeCoupon(c, 'SUGGESTED')).filter((c) => c.id > 0),
      firstOrder: toArr(data.firstOrder ?? data.firstOrderCoupons).map((c) => normalizeCoupon(c, 'FIRST_ORDER')).filter((c) => c.id > 0),
    }
  } catch {
    return empty
  }
}

export interface ApplyCouponInput {
  code: string
  orderAmount: number
  branchId?: number
  orderType?: string
}

export interface AppliedCoupon {
  code: string
  discountAmount: number
  finalAmount?: number
  message?: string
  couponId?: number
}

export async function applyCoupon(input: ApplyCouponInput): Promise<Result<AppliedCoupon>> {
  try {
    const r = await apiClient.post('/api/customer/coupon/apply', input)
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const num = (v: unknown): number =>
      typeof v === 'number' ? v : (v != null && v !== '' ? Number(v) || 0 : 0)
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    const discountAmount = num(data.discountAmount ?? data.discount)
    if (!discountAmount && !data.finalAmount) {
      return { ok: false, message: str(data.message) ?? 'Coupon could not be applied' }
    }
    return {
      ok: true,
      data: {
        code: input.code,
        discountAmount,
        finalAmount: num(data.finalAmount),
        message: str(data.message),
        couponId: typeof data.couponId === 'number' ? data.couponId : undefined,
      },
    }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

/* ---------- WALLET (Batch 2) ---------- */

export interface WalletBalance {
  balance: number
  currency?: string
  pendingWithdrawal?: number
}

export interface WalletTransaction {
  id: number
  type: string          // "CREDIT" | "DEBIT" | "WITHDRAWAL" | "REFUND" | etc.
  amount: number
  description?: string
  balanceAfter?: number
  createdAt?: string
  status?: string
}

export async function fetchWalletBalance(): Promise<WalletBalance> {
  try {
    const r = await apiClient.get('/api/customer/wallet/balance')
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const num = (v: unknown): number => typeof v === 'number' ? v : v ? Number(v) || 0 : 0
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    return {
      balance: num(data.balance ?? data.walletBalance ?? data.totalBalance),
      currency: str(data.currency) ?? 'INR',
      pendingWithdrawal: num(data.pendingWithdrawal ?? data.pending),
    }
  } catch {
    return { balance: 0, currency: 'INR', pendingWithdrawal: 0 }
  }
}

export interface WithdrawalHistoryPage {
  records: WalletTransaction[]
  totalRecords: number
  currentPage: number
  totalPages: number
  pageSize: number
}

export async function fetchWithdrawalHistory(pageNumber = 0, pageSize = 20): Promise<WithdrawalHistoryPage> {
  const empty: WithdrawalHistoryPage = { records: [], totalRecords: 0, currentPage: 0, totalPages: 0, pageSize }
  try {
    const r = await apiClient.get(`/api/customer/wallet/withdrawal-history?pageNumber=${pageNumber}&pageSize=${pageSize}`)
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const raw = Array.isArray(data.records) ? data.records as Array<Record<string, unknown>> : []
    const num = (v: unknown): number => typeof v === 'number' ? v : v ? Number(v) || 0 : 0
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    const records: WalletTransaction[] = raw
      .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
      .map((t) => ({
        id: Number(t.id) || 0,
        type: str(t.type) ?? str(t.transactionType) ?? 'WITHDRAWAL',
        amount: num(t.amount),
        description: str(t.description) ?? str(t.remarks),
        balanceAfter: num(t.balanceAfter ?? t.walletBalance),
        createdAt: str(t.createdAt),
        status: str(t.status),
      }))
      .filter((t) => t.id > 0)
    return {
      records,
      totalRecords: typeof data.totalRecords === 'number' ? data.totalRecords : records.length,
      currentPage: typeof data.currentPage === 'number' ? data.currentPage : pageNumber,
      totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
      pageSize: typeof data.pageSize === 'number' ? data.pageSize : pageSize,
    }
  } catch {
    return empty
  }
}

export async function fetchWalletTransactions(): Promise<WalletTransaction[]> {
  try {
    const r = await apiClient.get('/api/customer/wallet_transaction/all')
    const raw = unwrap<Array<Record<string, unknown>>>(r, 'data.data') ?? []
    const num = (v: unknown): number => typeof v === 'number' ? v : v ? Number(v) || 0 : 0
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    return raw
      .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
      .map((t) => ({
        id: Number(t.id) || 0,
        type: str(t.type) ?? str(t.transactionType) ?? 'CREDIT',
        amount: num(t.amount),
        description: str(t.description) ?? str(t.remarks),
        balanceAfter: num(t.balanceAfter ?? t.walletBalance),
        createdAt: str(t.createdAt),
        status: str(t.status),
      }))
      .filter((t) => t.id > 0)
  } catch {
    return []
  }
}

export interface WithdrawalRequestInput {
  bankDetailId: number
  amount: number
  remarks?: string
}

export async function requestWalletWithdrawal(input: WithdrawalRequestInput): Promise<Result<{ requested: true }>> {
  try {
    await apiClient.post('/api/customer/wallet/withdrawal-request', input)
    return { ok: true, data: { requested: true } }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

/* ---------- REFERRAL (Batch 2) ---------- */

export interface ReferralCode {
  code: string
  shareUrl?: string
  message?: string
}

export interface ReferralStats {
  totalReferrals: number
  successfulReferrals: number
  pendingReferrals: number
  totalEarned: number
  currency?: string
}

export interface ReferralUser {
  id: number
  name?: string
  phone?: string
  status?: string
  joinedAt?: string
  earnedAmount?: number
}

export interface ReferralContact {
  id?: number
  name: string
  phone?: string
  email?: string
  invited?: boolean
}

export async function fetchReferralCode(): Promise<ReferralCode | null> {
  try {
    const r = await apiClient.get('/api/customer/referral/my-code')
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    const code = str(data.code) ?? str(data.referralCode)
    if (!code) return null
    return {
      code,
      shareUrl: str(data.shareUrl) ?? str(data.url),
      message: str(data.message) ?? str(data.shareMessage),
    }
  } catch {
    return null
  }
}

export async function fetchReferralStats(): Promise<ReferralStats> {
  const empty: ReferralStats = { totalReferrals: 0, successfulReferrals: 0, pendingReferrals: 0, totalEarned: 0, currency: 'INR' }
  try {
    const r = await apiClient.get('/api/customer/referral/stats')
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const num = (v: unknown): number => typeof v === 'number' ? v : v ? Number(v) || 0 : 0
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    return {
      totalReferrals: num(data.totalReferrals ?? data.total),
      successfulReferrals: num(data.successfulReferrals ?? data.successful),
      pendingReferrals: num(data.pendingReferrals ?? data.pending),
      totalEarned: num(data.totalEarned ?? data.earned ?? data.rewards),
      currency: str(data.currency) ?? 'INR',
    }
  } catch {
    return empty
  }
}

export async function fetchReferralUsers(): Promise<ReferralUser[]> {
  try {
    const r = await apiClient.get('/api/customer/referral/referrals')
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const raw = Array.isArray(data.referrals) ? data.referrals as Array<Record<string, unknown>>
      : Array.isArray(data.records) ? data.records as Array<Record<string, unknown>>
      : Array.isArray(data) ? data as unknown as Array<Record<string, unknown>>
      : []
    const num = (v: unknown): number => typeof v === 'number' ? v : v ? Number(v) || 0 : 0
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    return raw
      .filter((u): u is Record<string, unknown> => typeof u === 'object' && u !== null)
      .map((u) => ({
        id: Number(u.id) || 0,
        name: str(u.name) ?? str(u.customerName),
        phone: str(u.phone) ?? str(u.mobileNumber),
        status: str(u.status),
        joinedAt: str(u.joinedAt) ?? str(u.createdAt),
        earnedAmount: num(u.earnedAmount ?? u.reward),
      }))
      .filter((u) => u.id > 0)
  } catch {
    return []
  }
}

export async function fetchReferralContacts(): Promise<ReferralContact[]> {
  try {
    const r = await apiClient.get('/api/customer/referral/contacts')
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const raw = Array.isArray(data.contacts) ? data.contacts as Array<Record<string, unknown>>
      : Array.isArray(data) ? data as unknown as Array<Record<string, unknown>>
      : []
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    return raw
      .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
      .map((c) => ({
        id: typeof c.id === 'number' ? c.id : undefined,
        name: str(c.name) ?? 'Contact',
        phone: str(c.phone) ?? str(c.mobileNumber),
        email: str(c.email),
        invited: Boolean(c.invited),
      }))
  } catch {
    return []
  }
}

export async function applyReferralCode(code: string): Promise<Result<{ applied: true; message?: string }>> {
  try {
    const r = await apiClient.post('/api/customer/referral/apply', { code: code.trim().toUpperCase() })
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    return { ok: true, data: { applied: true, message: str(data.message) } }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

/* ---------- ADDRESS DROPDOWNS (Batch 3) ---------- */

export interface LookupOption {
  id: number
  name: string
  parentId?: number
}

async function fetchLookupAll(url: string, nameKey = 'name'): Promise<LookupOption[]> {
  try {
    const r = await apiClient.get(url)
    const raw = unwrap<Array<Record<string, unknown>>>(r, 'data.data') ?? []
    return raw
      .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
      .map((x) => ({
        id: Number(x.id) || 0,
        name: (typeof x[nameKey] === 'string' ? x[nameKey] as string : '') || (typeof x.name === 'string' ? x.name : ''),
        parentId: typeof x.stateId === 'object' && x.stateId != null
          ? Number((x.stateId as Record<string, unknown>).id) || undefined
          : typeof x.cityId === 'object' && x.cityId != null
          ? Number((x.cityId as Record<string, unknown>).id) || undefined
          : undefined,
      }))
      .filter((x) => x.id > 0 && x.name.length > 0)
  } catch {
    return []
  }
}

export async function fetchStates(): Promise<LookupOption[]> {
  return fetchLookupAll('/api/customer/states/all', 'stateName')
}
export async function fetchCities(stateId?: number): Promise<LookupOption[]> {
  const list = await fetchLookupAll('/api/customer/cities/all', 'cityName')
  return stateId ? list.filter((c) => c.parentId === stateId) : list
}
export async function fetchPincodes(cityId?: number): Promise<LookupOption[]> {
  const list = await fetchLookupAll('/api/customer/pincodes/all', 'pincode')
  return cityId ? list.filter((p) => p.parentId === cityId) : list
}

/* ---------- DINE-IN (Batch 3) ---------- */

export interface RestaurantSection {
  id: number
  name: string
  branchId?: number
  capacity?: number
}

export interface DiningTable {
  id: number
  tableNumber: string
  capacity?: number
  sectionId?: number
  branchId?: number
  isAvailable?: boolean
}

export interface ReservationConfig {
  minAdvanceMinutes?: number
  maxAdvanceDays?: number
  slotDurationMinutes?: number
  openTime?: string
  closeTime?: string
  requiresDeposit?: boolean
  depositAmount?: number
}

export async function fetchRestaurantSections(): Promise<RestaurantSection[]> {
  try {
    const r = await apiClient.get('/api/customer/section/all')
    const raw = unwrap<Array<Record<string, unknown>>>(r, 'data.data') ?? []
    const num = (v: unknown): number | undefined =>
      typeof v === 'number' ? v : v != null && v !== '' ? Number(v) : undefined
    const str = (v: unknown): string => typeof v === 'string' ? v : ''
    return raw
      .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
      .map((s) => ({
        id: Number(s.id) || 0,
        name: str(s.sectionName) || str(s.name) || 'Section',
        branchId: typeof s.branchId === 'object' && s.branchId != null
          ? Number((s.branchId as Record<string, unknown>).id) || undefined
          : num(s.branchId),
        capacity: num(s.capacity),
      }))
      .filter((s) => s.id > 0)
  } catch {
    return []
  }
}

export async function fetchDiningTables(): Promise<DiningTable[]> {
  try {
    const r = await apiClient.get('/api/customer/dining_tables/all')
    const raw = unwrap<Array<Record<string, unknown>>>(r, 'data.data') ?? []
    const num = (v: unknown): number | undefined =>
      typeof v === 'number' ? v : v != null && v !== '' ? Number(v) : undefined
    const str = (v: unknown): string => typeof v === 'string' ? v : ''
    return raw
      .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
      .map((t) => ({
        id: Number(t.id) || 0,
        tableNumber: str(t.tableNumber) || str(t.name) || `Table ${t.id}`,
        capacity: num(t.capacity),
        sectionId: typeof t.sectionId === 'object' && t.sectionId != null
          ? Number((t.sectionId as Record<string, unknown>).id) || undefined
          : num(t.sectionId),
        branchId: typeof t.branchId === 'object' && t.branchId != null
          ? Number((t.branchId as Record<string, unknown>).id) || undefined
          : num(t.branchId),
        isAvailable: t.isAvailable !== false,
      }))
      .filter((t) => t.id > 0)
  } catch {
    return []
  }
}

export async function checkTableAvailability(
  tableId: number,
  bookingDate: string,     // YYYY-MM-DD
  bookingTime?: string,    // HH:MM
): Promise<Result<{ available: boolean; reason?: string }>> {
  try {
    const params = new URLSearchParams({ tableId: String(tableId), bookingDate })
    if (bookingTime) params.set('bookingTime', bookingTime)
    const r = await apiClient.get(`/api/customer/table_booking/availability?${params.toString()}`)
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    return {
      ok: true,
      data: {
        available: Boolean(data.available ?? data.isAvailable ?? true),
        reason: typeof data.reason === 'string' ? data.reason : undefined,
      },
    }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export async function fetchReservationConfig(branchId: number): Promise<ReservationConfig> {
  try {
    const r = await apiClient.get(`/api/customer/table_booking/reservation-config/${branchId}`)
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const num = (v: unknown): number | undefined =>
      typeof v === 'number' ? v : v != null && v !== '' ? Number(v) : undefined
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    return {
      minAdvanceMinutes: num(data.minAdvanceMinutes),
      maxAdvanceDays: num(data.maxAdvanceDays),
      slotDurationMinutes: num(data.slotDurationMinutes),
      openTime: str(data.openTime),
      closeTime: str(data.closeTime),
      requiresDeposit: Boolean(data.requiresDeposit),
      depositAmount: num(data.depositAmount),
    }
  } catch {
    return {}
  }
}

/* ---------- RESTAURANT HOURS (Batch 4) ---------- */

export interface RestaurantHours {
  id: number
  dayOfWeek: string        // 'MONDAY' | 'TUESDAY' | ... | 'SUNDAY'
  openTime?: string        // HH:MM
  closeTime?: string       // HH:MM
  isClosed?: boolean
  branchId?: number
}

export async function fetchRestaurantHours(): Promise<RestaurantHours[]> {
  try {
    const r = await apiClient.get('/api/customer/restaurant_hours/all')
    const raw = unwrap<Array<Record<string, unknown>>>(r, 'data.data') ?? []
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    return raw
      .filter((h): h is Record<string, unknown> => typeof h === 'object' && h !== null)
      .map((h) => ({
        id: Number(h.id) || 0,
        dayOfWeek: str(h.dayOfWeek) ?? str(h.day) ?? '',
        openTime: str(h.openTime) ?? str(h.opensAt),
        closeTime: str(h.closeTime) ?? str(h.closesAt),
        isClosed: Boolean(h.isClosed ?? h.closed),
        branchId: typeof h.branchId === 'object' && h.branchId != null
          ? Number((h.branchId as Record<string, unknown>).id) || undefined
          : typeof h.branchId === 'number' ? h.branchId : undefined,
      }))
      .filter((h) => h.id > 0)
  } catch {
    return []
  }
}

/* ---------- PAYMENT GATEWAYS (Batch 4) ---------- */

export interface StripeIntentInput {
  amount: number
  currency?: string
  orderId?: number
  metadata?: Record<string, string>
}

export interface StripeIntentResult {
  clientSecret: string
  paymentIntentId?: string
}

export async function createStripePaymentIntent(input: StripeIntentInput): Promise<Result<StripeIntentResult>> {
  try {
    const r = await apiClient.post('/api/customer/stripe/create-payment-intent', {
      amount: input.amount,
      currency: input.currency ?? 'INR',
      orderId: input.orderId,
      metadata: input.metadata,
    })
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    const clientSecret = str(data.clientSecret) ?? str(data.client_secret)
    if (!clientSecret) return { ok: false, message: 'Stripe intent returned no clientSecret' }
    return {
      ok: true,
      data: {
        clientSecret,
        paymentIntentId: str(data.paymentIntentId) ?? str(data.id),
      },
    }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export async function confirmStripePayment(paymentIntentId: string, orderId?: number): Promise<Result<{ confirmed: true; status?: string }>> {
  try {
    const r = await apiClient.post('/api/customer/stripe/confirm-payment', { paymentIntentId, orderId })
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    return { ok: true, data: { confirmed: true, status: str(data.status) } }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export interface PayPalOrderResult {
  paypalOrderId: string
  approveUrl?: string
}

export async function createPayPalOrder(amount: number, orderId?: number, currency = 'USD'): Promise<Result<PayPalOrderResult>> {
  try {
    const r = await apiClient.post('/api/customer/paypal/create-order', { amount, currency, orderId })
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    const paypalOrderId = str(data.paypalOrderId) ?? str(data.id) ?? str(data.orderId)
    if (!paypalOrderId) return { ok: false, message: 'PayPal order create returned no id' }
    return { ok: true, data: { paypalOrderId, approveUrl: str(data.approveUrl) ?? str(data.href) } }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export async function capturePayPalOrder(paypalOrderId: string, orderId?: number): Promise<Result<{ captured: true; status?: string }>> {
  try {
    const r = await apiClient.post(`/api/customer/paypal/capture-order/${paypalOrderId}`, { orderId })
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    return { ok: true, data: { captured: true, status: str(data.status) } }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export interface CCAvenueRequestResult {
  redirectUrl?: string
  encRequest?: string
  accessCode?: string
}

export async function createCCAvenueRequest(amount: number, orderId: number, currency = 'INR'): Promise<Result<CCAvenueRequestResult>> {
  try {
    const r = await apiClient.post('/api/customer/ccavenue/payment-request', {
      amount, currency, orderId,
    })
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    return {
      ok: true,
      data: {
        redirectUrl: str(data.redirectUrl) ?? str(data.url),
        encRequest: str(data.encRequest),
        accessCode: str(data.accessCode),
      },
    }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

/* ---------- REVIEWS / RATINGS (Batch 5) ---------- */

export interface DishRatingSummary {
  itemId: number
  averageRating: number
  ratingCount: number
}

export interface DishReview {
  id: number
  rating: number
  mobileNumber?: string
  createdAt?: string
}

export async function submitDishRating(menuItemId: number, rating: number): Promise<Result<DishRatingSummary>> {
  try {
    const r = await apiClient.post('/api/customer/menu_item_ratings/submit', { menuItemId, rating })
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const num = (v: unknown, fallback = 0): number =>
      typeof v === 'number' ? v : v != null && v !== '' ? Number(v) || fallback : fallback
    return {
      ok: true,
      data: {
        itemId: num(data.itemId, menuItemId),
        averageRating: num(data.averageRating),
        ratingCount: num(data.ratingCount),
      },
    }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export async function fetchDishRatingSummary(menuItemId: number): Promise<DishRatingSummary> {
  const empty: DishRatingSummary = { itemId: menuItemId, averageRating: 0, ratingCount: 0 }
  try {
    const r = await apiClient.get(`/api/customer/menu_item_ratings/summary/${menuItemId}`)
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    const num = (v: unknown, fallback = 0): number =>
      typeof v === 'number' ? v : v != null && v !== '' ? Number(v) || fallback : fallback
    return {
      itemId: num(data.itemId, menuItemId),
      averageRating: num(data.averageRating),
      ratingCount: num(data.ratingCount),
    }
  } catch {
    return empty
  }
}

export async function fetchDishReviews(menuItemId: number): Promise<DishReview[]> {
  try {
    const r = await apiClient.get(`/api/customer/menu_item_ratings/for-item/${menuItemId}`)
    const raw = unwrap<Array<Record<string, unknown>>>(r, 'data.data') ?? []
    const num = (v: unknown, fallback = 0): number =>
      typeof v === 'number' ? v : v != null && v !== '' ? Number(v) || fallback : fallback
    const strFn = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    return raw
      .filter((rev): rev is Record<string, unknown> => typeof rev === 'object' && rev !== null)
      .map((rev) => ({
        id: num(rev.id),
        rating: num(rev.rating),
        mobileNumber: strFn(rev.mobileNumber),
        createdAt: strFn(rev.createdAt),
      }))
      .filter((rev) => rev.id > 0)
  } catch {
    return []
  }
}

/* ---------- DEVICE TOKEN / FCM (Batch 5) ---------- */

export async function registerDeviceToken(fcmToken: string, platform = 'web'): Promise<Result<{ registered: true; id?: number }>> {
  try {
    const r = await apiClient.post('/api/customer/device_token/register', { fcmToken, platform })
    const data = unwrap<Record<string, unknown>>(r, 'data.data') ?? {}
    return { ok: true, data: { registered: true, id: typeof data.id === 'number' ? data.id : undefined } }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

export async function unregisterDeviceToken(tokenId: number): Promise<Result<{ ok: true }>> {
  try {
    await apiClient.delete(`/api/customer/device_token/${tokenId}`)
    return { ok: true, data: { ok: true } }
  } catch (err) {
    return { ok: false, message: errorMessage(err) }
  }
}

/* ---------- CONTENT BLOCKS (2026-07-16 dummy → real refactor) ---------- */

/**
 * Polymorphic content block — one row = one card/tile on a customer page.
 * `sectionType` discriminates the shape (TESTIMONIAL, FACILITY, FAQ, etc.).
 * `meta` is a JSON escape hatch for type-specific extras (phone/email for
 * DEPARTMENT, accent text for EVENT_PACKAGE, rating for TESTIMONIAL, etc.).
 */
export interface ContentBlock {
  id: number
  sectionType: string
  sortOrder?: number
  title?: string
  subtitle?: string
  description?: string
  imageUrl?: string
  driveImageUrl?: string
  iconName?: string
  meta?: Record<string, unknown> | null
}

/**
 * Fetch content blocks for the current tenant + page. Tenant is inferred by
 * the backend from the Host header (same lookup pattern as `useBrand()`).
 * Optional `sectionType` filters to a single kind (TESTIMONIAL, FAQ, etc.).
 */
export async function fetchCustomerContent(page: string, sectionType?: string): Promise<ContentBlock[]> {
  try {
    const q = sectionType ? `?section=${encodeURIComponent(sectionType)}` : ''
    const r = await apiClient.get(`/api/customer/content/page/${encodeURIComponent(page)}${q}`)
    const raw = unwrap<Array<Record<string, unknown>>>(r, 'data.data') ?? []
    const str = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
    const num = (v: unknown): number | undefined =>
      typeof v === 'number' ? v : v != null && v !== '' ? Number(v) : undefined
    return raw
      .filter((b): b is Record<string, unknown> => typeof b === 'object' && b !== null)
      .map((b) => ({
        id: Number(b.id) || 0,
        sectionType: str(b.sectionType) ?? '',
        sortOrder: num(b.sortOrder),
        title: str(b.title),
        subtitle: str(b.subtitle),
        description: str(b.description),
        imageUrl: str(b.imageUrl),
        driveImageUrl: str(b.driveImageUrl),
        iconName: str(b.iconName),
        meta: typeof b.meta === 'object' && b.meta !== null ? b.meta as Record<string, unknown> : null,
      }))
      .filter((b) => b.id > 0)
  } catch {
    return []
  }
}
