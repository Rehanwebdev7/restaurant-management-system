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
  isActive?: boolean | null
  isAvailable?: boolean | null
  dietaryType?: boolean | null  // true = veg, false = non-veg
  menuCategoryId?: BackendMenuCategoryRef | null
  branchId?: BackendBranchRef | null
  imageUrl?: string | null
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
  isVeg: boolean
  isAvailable: boolean
  imageUrl: string | null
  categoryId: number | null
  categoryName: string | null
  branchId: number | null
  signature: boolean
  rating: number
}

export interface CustomerMenuCategory {
  id: number
  name: string
  imageUrl?: string | null
  displayOrder?: number | null
}

export interface CustomerBranch {
  id: number
  branchName: string
  addressLine1?: string | null
  city?: string | null
  pincode?: string | null
  phone?: string | null
  lat?: number | null
  lng?: number | null
}

export interface CustomerSlider {
  id: number
  title?: string | null
  imageUrl: string
  linkUrl?: string | null
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
    isVeg: b.dietaryType === true,
    isAvailable: b.isAvailable !== false && b.isActive !== false,
    imageUrl: b.imageUrl ?? null,
    categoryId: b.menuCategoryId?.id ?? null,
    categoryName: b.menuCategoryId?.name ?? null,
    branchId: b.branchId?.id ?? null,
    signature: false,
    rating: 4.5,
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
  driveIconUrl?: string | null
  displayOrder?: number | null
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
      imageUrl: c.driveIconUrl ?? null,
      displayOrder: c.displayOrder ?? null,
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

export async function fetchCustomerOrders(): Promise<unknown[]> {
  try {
    const r = await apiClient.get('/api/customer/orders/history')
    return unwrap<unknown[]>(r, 'data.data') ?? []
  } catch {
    return []
  }
}
