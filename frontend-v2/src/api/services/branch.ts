/**
 * Branch Manager API service — LIVE Spring Boot.
 * All endpoints under /api/branch/* and use standard envelope.
 *
 * 2026-06-24 — extended with 10 sub-page fetchers. Of the 12 probed:
 *   ✅ menu_category, menu_subcategory, section, dining_tables, delivery_zones,
 *      addons, addons_items, restaurant_hours, coupon, bank_details  →  200 OK
 *   ❌ payment_gateway, sliders  →  500 "No static resource" (controller absent)
 */
import apiClient from '@/api/client'
import { unwrap } from '@/api/normalize'

export interface BranchDashboard {
  todayRevenue?: number
  todayOrders?: number
  totalOrders?: number
  totalRevenue?: number
  pendingOrders?: number
  completedOrders?: number
  averageOrderValue?: number
  ordersByStatus?: Record<string, number>
  ordersByType?: Record<string, number>
  ordersByPayment?: Record<string, number>
  branchId?: number
  branchName?: string
  [k: string]: unknown
}

export interface BranchMenuItem {
  id: number; name: string; description: string | null
  price?: number; itemPrice?: number; basePrice?: number
  isAvailable: boolean; categoryId?: { id: number; name?: string } | null
}
export interface BranchCategory {
  id: number; name: string; description?: string | null
  imageUrl?: string | null; isActive?: boolean; displayOrder?: number
}
export interface BranchUser { id: number; name: string; mobile?: string; email?: string; role?: string; isActive?: boolean }
export interface BranchCustomer { id: number; name: string; email: string | null; mobileNumber: string }
export interface BranchSection { id: number; name: string; description?: string | null }
export interface BranchTable {
  id: number; tableNumber?: string; name?: string; capacity?: number
  sectionId?: { id: number; name?: string }
}

export interface BranchSubcategory {
  id: number; name: string; description?: string | null
  menuCategoryId?: { id: number; name?: string } | null
  priority?: number; isActive?: boolean
}

export interface BranchDeliveryZone {
  id: number; zoneName: string; description?: string | null
  radiusKmFrom?: number; radiusKmTo?: number
  deliveryCharge?: number; freeDeliveryAbove?: number | null
  deliveryTimeMinutes?: number; isActive?: boolean
  branchId?: { id: number; name?: string } | null
}

export interface BranchAddonGroup {
  id: number; name: string; description?: string | null
  minAddon?: number; maxAddon?: number
  isMultiple?: boolean; isActive?: boolean
}

export interface BranchAddonItem {
  id: number; name: string; price?: number
  attribute?: 'VEG' | 'NON_VEG' | string
  isActive?: boolean
  addonsId?: { id: number; name?: string } | null
}

export type BranchDayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface BranchHour {
  id: number; dayOfWeek: BranchDayOfWeek
  openingTime?: string | null; closingTime?: string | null
  isClosed?: boolean
}

export interface BranchCoupon {
  id: number; couponName: string; couponCode: string
  discountAmount?: number; validity?: string | null
  description?: string | null; title?: string | null
  isPercent?: boolean; global?: boolean
  usageLimit?: number; firstOrder?: boolean
  isDelete?: boolean
}

export interface BranchBankDetail {
  id: number; bankName?: string; accountNumber?: string
  ifsc?: string; holderName?: string; upi?: string
}

export interface BranchSlider {
  id: number; imageUrl: string; title?: string
  description?: string; displayOrder?: number; isActive?: boolean
}

const todayIso = () => new Date().toISOString().slice(0, 10)
const monthAgoIso = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10) }

async function safeGet<T>(url: string, params?: Record<string, unknown>): Promise<T | null> {
  try {
    const r = await apiClient.get(url, params ? { params } : undefined)
    return unwrap<T>(r, 'data.data')
  } catch { return null }
}
async function safeGetList<T>(url: string): Promise<T[]> {
  const data = await safeGet<T[]>(url)
  return Array.isArray(data) ? data : []
}

export const fetchBranchDashboard = (opts: { fromDate?: string; toDate?: string } = {}) =>
  safeGet<BranchDashboard>('/api/branch/dashboard/summary', {
    fromDate: opts.fromDate ?? monthAgoIso(), toDate: opts.toDate ?? todayIso(),
  })
export const fetchBranchMenuItems = () => safeGetList<BranchMenuItem>('/api/branch/menu_items/all')
export const fetchBranchCategories = () => safeGetList<BranchCategory>('/api/branch/menu_category/all')
export const fetchBranchUsers = () => safeGetList<BranchUser>('/api/branch/users/all')
export const fetchBranchCustomers = () => safeGetList<BranchCustomer>('/api/branch/customers/all')
export const fetchBranchSections = () => safeGetList<BranchSection>('/api/branch/section/all')
export const fetchBranchTables = () => safeGetList<BranchTable>('/api/branch/dining_tables/all')

/* New 2026-06-24 fetchers (mirrors restaurant subpages) */
export const fetchBranchSubcategories = () => safeGetList<BranchSubcategory>('/api/branch/menu_subcategory/all')
export const fetchBranchDeliveryZones = () => safeGetList<BranchDeliveryZone>('/api/branch/delivery_zones/all')
export const fetchBranchAddonGroups = () => safeGetList<BranchAddonGroup>('/api/branch/addons/all')
export const fetchBranchAddonItems = () => safeGetList<BranchAddonItem>('/api/branch/addons_items/all')
export const fetchBranchHours = () => safeGetList<BranchHour>('/api/branch/restaurant_hours/all')
export const fetchBranchCoupons = () => safeGetList<BranchCoupon>('/api/branch/coupon/all')
export const fetchBranchBankDetails = () => safeGetList<BranchBankDetail>('/api/branch/bank_details/all')
/** Sliders: backend route 500s ("No static resource") as of 2026-06-24. Caller renders sample fallback. */
export const fetchBranchSliders = () => safeGetList<BranchSlider>('/api/branch/sliders/all')

export const branchMenuItemPrice = (i: BranchMenuItem) => Number(i.price ?? i.itemPrice ?? i.basePrice ?? 0)

/* ------------------------------------------------------------------ */
/* 2026-06-24 — Mutation helpers, safe-shape.                          */
/* ------------------------------------------------------------------ */

export type BranchMutationResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; message: string }

function brErrMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? (err as Error)?.message ?? fallback
}

async function brSafePost<T = unknown>(url: string, body: unknown, fallback: string): Promise<BranchMutationResult<T>> {
  try { const r = await apiClient.post(url, body); return { ok: true, data: unwrap<T>(r, 'data.data') } }
  catch (err) { return { ok: false, message: brErrMessage(err, fallback) } }
}
async function brSafePut<T = unknown>(url: string, body: unknown, fallback: string): Promise<BranchMutationResult<T>> {
  try { const r = await apiClient.put(url, body); return { ok: true, data: unwrap<T>(r, 'data.data') } }
  catch (err) { return { ok: false, message: brErrMessage(err, fallback) } }
}
async function brSafeDelete(url: string, fallback: string): Promise<BranchMutationResult> {
  try { await apiClient.delete(url); return { ok: true } }
  catch (err) { return { ok: false, message: brErrMessage(err, fallback) } }
}

/* Categories */
export interface BranchCategoryInput { name: string; description?: string }
export const addBranchCategory = (input: BranchCategoryInput) =>
  brSafePost<BranchCategory>('/api/branch/menu_category/add', input, 'Add category failed')
export const updateBranchCategory = (id: number, input: BranchCategoryInput) =>
  brSafePut<BranchCategory>(`/api/branch/menu_category/update/${id}`, input, 'Update category failed')
export const deleteBranchCategory = (id: number) =>
  brSafeDelete(`/api/branch/menu_category/delete/${id}`, 'Delete category failed')

/* Subcategories */
export interface BranchSubcategoryInput { name: string; menuCategoryId: number; priority?: number }
export const addBranchSubcategory = (input: BranchSubcategoryInput) =>
  brSafePost<BranchSubcategory>('/api/branch/menu_subcategory/add', input, 'Add subcategory failed')
export const updateBranchSubcategory = (id: number, input: BranchSubcategoryInput) =>
  brSafePut<BranchSubcategory>(`/api/branch/menu_subcategory/update/${id}`, input, 'Update subcategory failed')
export const deleteBranchSubcategory = (id: number) =>
  brSafeDelete(`/api/branch/menu_subcategory/delete/${id}`, 'Delete subcategory failed')

/* Sections */
export interface BranchSectionInput { name: string; description?: string }
export const addBranchSection = (input: BranchSectionInput) =>
  brSafePost<BranchSection>('/api/branch/section/add', input, 'Add section failed')
export const updateBranchSection = (id: number, input: BranchSectionInput) =>
  brSafePut<BranchSection>(`/api/branch/section/update/${id}`, input, 'Update section failed')
export const deleteBranchSection = (id: number) =>
  brSafeDelete(`/api/branch/section/delete/${id}`, 'Delete section failed')

/* Tables */
export interface BranchTableInput { tableNumber: string; capacity: number; sectionId: number }
export const addBranchTable = (input: BranchTableInput) =>
  brSafePost<BranchTable>('/api/branch/dining_tables/add', input, 'Add table failed')
export const updateBranchTable = (id: number, input: BranchTableInput) =>
  brSafePut<BranchTable>(`/api/branch/dining_tables/update/${id}`, input, 'Update table failed')
export const deleteBranchTable = (id: number) =>
  brSafeDelete(`/api/branch/dining_tables/delete/${id}`, 'Delete table failed')

/* Delivery zones */
export interface BranchDeliveryZoneInput { zoneName: string; deliveryCharge: number; freeDeliveryAbove?: number; deliveryTimeMinutes?: number }
export const addBranchDeliveryZone = (input: BranchDeliveryZoneInput) =>
  brSafePost<BranchDeliveryZone>('/api/branch/delivery_zones/add', input, 'Add zone failed')
export const updateBranchDeliveryZone = (id: number, input: BranchDeliveryZoneInput) =>
  brSafePut<BranchDeliveryZone>(`/api/branch/delivery_zones/update/${id}`, input, 'Update zone failed')
export const deleteBranchDeliveryZone = (id: number) =>
  brSafeDelete(`/api/branch/delivery_zones/delete/${id}`, 'Delete zone failed')

/* Addon groups */
export interface BranchAddonGroupInput { name: string; minAddon: number; maxAddon: number; isMultiple: boolean; description?: string }
export const addBranchAddonGroup = (input: BranchAddonGroupInput) =>
  brSafePost<BranchAddonGroup>('/api/branch/addons/add', input, 'Add addon group failed')
export const updateBranchAddonGroup = (id: number, input: BranchAddonGroupInput) =>
  brSafePut<BranchAddonGroup>(`/api/branch/addons/update/${id}`, input, 'Update addon group failed')
export const deleteBranchAddonGroup = (id: number) =>
  brSafeDelete(`/api/branch/addons/delete/${id}`, 'Delete addon group failed')

/* Addon items */
export interface BranchAddonItemInput { name: string; price: number; addonsId: number; attribute?: 'VEG' | 'NON_VEG' }
export const addBranchAddonItem = (input: BranchAddonItemInput) =>
  brSafePost<BranchAddonItem>('/api/branch/addons_items/add', input, 'Add addon item failed')
export const updateBranchAddonItem = (id: number, input: BranchAddonItemInput) =>
  brSafePut<BranchAddonItem>(`/api/branch/addons_items/update/${id}`, input, 'Update addon item failed')
export const deleteBranchAddonItem = (id: number) =>
  brSafeDelete(`/api/branch/addons_items/delete/${id}`, 'Delete addon item failed')

/* Hours */
export interface BranchHourInput { dayOfWeek: BranchDayOfWeek; openingTime: string; closingTime: string; isClosed: boolean }
export const updateBranchHour = (id: number, input: BranchHourInput) =>
  brSafePut<BranchHour>(`/api/branch/restaurant_hours/update/${id}`, input, 'Update hour failed')

/* Coupons */
export interface BranchCouponInput {
  couponCode: string; couponName: string; discountAmount: number
  isPercent: boolean; validity?: string; usageLimit?: number; firstOrder?: boolean; global?: boolean
}
export const addBranchCoupon = (input: BranchCouponInput) =>
  brSafePost<BranchCoupon>('/api/branch/coupon/add', input, 'Add coupon failed')
export const updateBranchCoupon = (id: number, input: BranchCouponInput) =>
  brSafePut<BranchCoupon>(`/api/branch/coupon/update/${id}`, input, 'Update coupon failed')
export const deleteBranchCoupon = (id: number) =>
  brSafeDelete(`/api/branch/coupon/delete/${id}`, 'Delete coupon failed')

/* Menu items */
export interface BranchMenuItemInput {
  name: string; description?: string; price: number
  categoryId: number; subcategoryId?: number
  isVeg?: boolean; isAvailable: boolean
}
export const addBranchMenuItem = (input: BranchMenuItemInput) =>
  brSafePost<BranchMenuItem>('/api/branch/menu_items/add', input, 'Add item failed')
export const updateBranchMenuItem = (id: number, input: BranchMenuItemInput) =>
  brSafePut<BranchMenuItem>(`/api/branch/menu_items/update/${id}`, input, 'Update item failed')
export const deleteBranchMenuItem = (id: number) =>
  brSafeDelete(`/api/branch/menu_items/delete/${id}`, 'Delete item failed')

/* Users (staff) */
export interface BranchUserInput { name: string; mobile: string; email?: string; role: string; password?: string }
export const addBranchUser = (input: BranchUserInput) =>
  brSafePost<BranchUser>('/api/branch/users/add', input, 'Add user failed')
export const updateBranchUser = (id: number, input: BranchUserInput) =>
  brSafePut<BranchUser>(`/api/branch/users/update/${id}`, input, 'Update user failed')
export const deleteBranchUser = (id: number) =>
  brSafeDelete(`/api/branch/users/delete/${id}`, 'Delete user failed')

/* Customers */
export interface BranchCustomerInput { name: string; mobileNumber: string; email?: string }
export const addBranchCustomer = (input: BranchCustomerInput) =>
  brSafePost<BranchCustomer>('/api/branch/customers/add', input, 'Add customer failed')
export const updateBranchCustomer = (id: number, input: BranchCustomerInput) =>
  brSafePut<BranchCustomer>(`/api/branch/customers/update/${id}`, input, 'Update customer failed')
export const toggleBranchCustomerActive = (id: number, isActive: boolean) =>
  brSafePut(`/api/branch/customers/toggle/${id}`, { isActive }, 'Toggle customer failed')

/* ------------------------------------------------------------------ */
/* 2026-06-25 — Stakeholder demo sub-pages                             */
/*                                                                     */
/* Probe results (verified live):                                       */
/*   • GET    /api/branch/orders/history     500 (method N/A)          */
/*   • POST   /api/branch/orders/history     500 (method N/A)          */
/*   • POST   /api/branch/day-end/close      500 "No resource"         */
/*                                                                     */
/* Both fall back to local sample with PendingBadge.                    */
/* ------------------------------------------------------------------ */

export interface BranchOrder {
  id: number
  orderNumber: string
  orderType: 'DINING' | 'TAKEAWAY' | 'DELIVERY' | string
  status: string
  paymentStatus?: string
  paymentMethod?: string
  customerName?: string | null
  customerPhone?: string | null
  tableNumber?: string | null
  totalAmount?: number
  amount?: number
  createdAt: string
  orderItemsCount?: number
}

export interface BranchOrdersResponse {
  orders: BranchOrder[]
  sample: boolean
  totalRecords: number
}

interface BranchOrderHistoryParams {
  page?: number
  pageSize?: number
  status?: string
  orderType?: string
  fromDate?: string
  toDate?: string
}

const BRANCH_ORDER_SAMPLE: BranchOrder[] = [
  { id: 8541, orderNumber: 'KOT-8541', orderType: 'DINING', status: 'COMPLETED', customerName: 'Walk-in T-03', tableNumber: 'T-03', totalAmount: 530, createdAt: new Date(Date.now() - 1 * 3600_000).toISOString() },
  { id: 8540, orderNumber: 'KOT-8540', orderType: 'DELIVERY', status: 'COMPLETED', customerName: 'Akhil M.', customerPhone: '9988776655', totalAmount: 410, createdAt: new Date(Date.now() - 2 * 3600_000).toISOString() },
  { id: 8539, orderNumber: 'KOT-8539', orderType: 'TAKEAWAY', status: 'PREPARING_ORDER', customerName: 'Pooja D.', totalAmount: 220, createdAt: new Date(Date.now() - 3 * 3600_000).toISOString() },
  { id: 8538, orderNumber: 'KOT-8538', orderType: 'DINING', status: 'READY_FOR_ORDER', customerName: 'Walk-in T-08', tableNumber: 'T-08', totalAmount: 980, createdAt: new Date(Date.now() - 4 * 3600_000).toISOString() },
  { id: 8537, orderNumber: 'KOT-8537', orderType: 'DELIVERY', status: 'PENDING', customerName: 'Karan P.', totalAmount: 360, createdAt: new Date(Date.now() - 5 * 3600_000).toISOString() },
  { id: 8536, orderNumber: 'KOT-8536', orderType: 'DINING', status: 'CANCELLED', customerName: 'Walk-in T-12', tableNumber: 'T-12', totalAmount: 0, createdAt: new Date(Date.now() - 6 * 3600_000).toISOString() },
  { id: 8535, orderNumber: 'KOT-8535', orderType: 'DINING', status: 'COMPLETED', customerName: 'Walk-in T-05', tableNumber: 'T-05', totalAmount: 1150, createdAt: new Date(Date.now() - 7 * 3600_000).toISOString() },
]

function applyBranchOrderFilters(rows: BranchOrder[], p: BranchOrderHistoryParams): BranchOrder[] {
  let out = rows
  if (p.status) out = out.filter((o) => o.status === p.status)
  if (p.orderType) out = out.filter((o) => o.orderType === p.orderType)
  if (p.fromDate) out = out.filter((o) => o.createdAt.slice(0, 10) >= p.fromDate!)
  if (p.toDate) out = out.filter((o) => o.createdAt.slice(0, 10) <= p.toDate!)
  return out
}

export async function fetchBranchOrders(params: BranchOrderHistoryParams = {}): Promise<BranchOrdersResponse> {
  try {
    const r = await apiClient.get('/api/branch/orders/history', { params: { page: 1, pageSize: 50, ...params } })
    const page = unwrap<{ records: BranchOrder[]; totalRecords?: number }>(r, 'data.data')
    if (page?.records?.length) return { orders: page.records, sample: false, totalRecords: page.totalRecords ?? page.records.length }
  } catch { /* fall through */ }
  const filtered = applyBranchOrderFilters(BRANCH_ORDER_SAMPLE, params)
  return { orders: filtered, sample: true, totalRecords: filtered.length }
}

/* ---- Day-end closure ---- */
export interface DayEndCloseInput {
  countedCash: number
  expectedCash: number
  variance: number
  notes?: string
}

export const closeBranchDayEnd = (input: DayEndCloseInput) =>
  brSafePost<{ shiftId: number }>('/api/branch/day-end/close', input, 'Day-end close failed')
