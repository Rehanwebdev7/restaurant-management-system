/**
 * Restaurant Owner API service — LIVE Spring Boot endpoints.
 * Verified 2026-06-23. All endpoints under /api/restaurant/* and return
 * the standard envelope { Status, StatusCode, message, data }.
 */
import apiClient from '@/api/client'
import { unwrap } from '@/api/normalize'

export interface RestaurantDashboard {
  todayRevenue?: number
  todayOrders?: number
  totalOrders?: number
  totalRevenue?: number
  totalCustomers?: number
  totalBranches?: number
  totalStaff?: number
  pendingOrders?: number
  completedOrders?: number
  averageOrderValue?: number
  ordersByStatus?: Record<string, number>
  ordersByType?: Record<string, number>
  [k: string]: unknown
}

export interface RestaurantMenuItem {
  id: number
  name: string
  description: string | null
  price?: number
  itemPrice?: number
  basePrice?: number
  isAvailable: boolean
  isVeg?: boolean
  imageUrl?: string | null
  categoryId?: { id: number; name?: string } | null
  subcategoryId?: { id: number; name?: string } | null
  restaurantId?: { id: number; name?: string } | null
}

export interface RestaurantCategory {
  id: number
  name: string
  description?: string | null
  imageUrl?: string | null
  isActive?: boolean
  displayOrder?: number
}

export interface RestaurantUser {
  id: number
  name: string
  email?: string
  mobile?: string
  role?: string
  isActive?: boolean
}

export interface RestaurantCustomer {
  id: number
  name: string
  email: string | null
  mobileNumber: string
  photoUrl?: string | null
}

export interface RestaurantPaymentGateway {
  id: number
  status: boolean
  allowCod: boolean
  stripeEnabled?: boolean
  paypalEnabled?: boolean
  razorpayEnabled?: boolean
  upiEnabled?: boolean
}

export interface RestaurantSlider {
  id: number
  imageUrl: string
  title?: string
  description?: string
  displayOrder?: number
  isActive?: boolean
}

export interface RestaurantBankDetail {
  id: number
  bankName?: string
  accountNumber?: string
  ifsc?: string
  holderName?: string
  upi?: string
}

export interface RestaurantSection {
  id: number
  name: string
  description?: string | null
}

export interface RestaurantTable {
  id: number
  tableNumber?: string
  name?: string
  capacity?: number
  sectionId?: { id: number; name?: string }
}

export interface RestaurantSubcategory {
  id: number
  name: string
  description?: string | null
  menuCategoryId?: { id: number; name?: string } | null
  priority?: number
  isActive?: boolean
  iconUrl?: string | null
}

export interface RestaurantDeliveryZone {
  id: number
  zoneName: string
  description?: string | null
  radiusKmFrom?: number
  radiusKmTo?: number
  deliveryCharge?: number
  freeDeliveryAbove?: number | null
  deliveryTimeMinutes?: number
  isActive?: boolean
  branchId?: { id: number; name?: string } | null
}

export interface RestaurantAddonGroup {
  id: number
  name: string
  description?: string | null
  minAddon?: number
  maxAddon?: number
  isMultiple?: boolean
  showOnline?: boolean
  showInCaptain?: boolean
  isActive?: boolean
}

export interface RestaurantAddonItem {
  id: number
  name: string
  price?: number
  attribute?: 'VEG' | 'NON_VEG' | string
  isActive?: boolean
  addonsId?: { id: number; name?: string } | null
}

export type DayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface RestaurantHour {
  id: number
  dayOfWeek: DayOfWeek
  openingTime?: string | null
  closingTime?: string | null
  isClosed?: boolean
  specialDate?: string | null
  occasionName?: string | null
}

export interface RestaurantCoupon {
  id: number
  couponName: string
  couponCode: string
  discountAmount?: number
  validity?: string | null
  description?: string | null
  title?: string | null
  isPercent?: boolean
  global?: boolean
  usageLimit?: number
  firstOrder?: boolean
  quantity?: number
  displayOnScreen?: boolean
  isDelete?: boolean
}

export interface RestaurantGalleryImage {
  id: number
  imageUrl: string
  caption?: string | null
  displayOrder?: number
  isActive?: boolean
}

const todayIso = () => new Date().toISOString().slice(0, 10)
const monthAgoIso = () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

async function safeGet<T>(url: string, shape: 'data.data' = 'data.data', params?: Record<string, unknown>): Promise<T | null> {
  try {
    const r = await apiClient.get(url, params ? { params } : undefined)
    return unwrap<T>(r, shape)
  } catch {
    return null
  }
}

async function safeGetList<T>(url: string): Promise<T[]> {
  const data = await safeGet<T[]>(url)
  return Array.isArray(data) ? data : []
}

export const fetchRestaurantDashboard = (opts: { fromDate?: string; toDate?: string } = {}) =>
  safeGet<RestaurantDashboard>('/api/restaurant/dashboard/summary', 'data.data', {
    fromDate: opts.fromDate ?? monthAgoIso(),
    toDate: opts.toDate ?? todayIso(),
  })

export const fetchRestaurantMenuItems = () => safeGetList<RestaurantMenuItem>('/api/restaurant/menu_items/all')
export const fetchRestaurantCategories = () => safeGetList<RestaurantCategory>('/api/restaurant/menu_category/all')
export const fetchRestaurantUsers = () => safeGetList<RestaurantUser>('/api/restaurant/users/all')
export const fetchRestaurantCustomers = () => safeGetList<RestaurantCustomer>('/api/restaurant/customers/all')
export const fetchRestaurantPaymentGateways = () => safeGetList<RestaurantPaymentGateway>('/api/restaurant/payment_gateway/all')
export const fetchRestaurantSliders = () => safeGetList<RestaurantSlider>('/api/restaurant/sliders/all')
export const fetchRestaurantBankDetails = () => safeGetList<RestaurantBankDetail>('/api/restaurant/bank_details/all')
export const fetchRestaurantSections = () => safeGetList<RestaurantSection>('/api/restaurant/section/all')
export const fetchRestaurantTables = () => safeGetList<RestaurantTable>('/api/restaurant/dining_tables/all')
export const fetchRestaurantSubcategories = () => safeGetList<RestaurantSubcategory>('/api/restaurant/menu_subcategory/all')
export const fetchRestaurantDeliveryZones = () => safeGetList<RestaurantDeliveryZone>('/api/restaurant/delivery_zones/all')
export const fetchRestaurantAddonGroups = () => safeGetList<RestaurantAddonGroup>('/api/restaurant/addons/all')
export const fetchRestaurantAddonItems = () => safeGetList<RestaurantAddonItem>('/api/restaurant/addons_items/all')
export const fetchRestaurantHours = () => safeGetList<RestaurantHour>('/api/restaurant/restaurant_hours/all')
export const fetchRestaurantCoupons = () => safeGetList<RestaurantCoupon>('/api/restaurant/coupon/all')
/** Gallery: backend route 500s as of 2026-06-24. Caller renders sample with pending badge. */
export const fetchRestaurantGallery = () => safeGetList<RestaurantGalleryImage>('/api/restaurant/gallery/all')

export function menuItemPrice(item: RestaurantMenuItem): number {
  return Number(item.price ?? item.itemPrice ?? item.basePrice ?? 0)
}

/* ------------------------------------------------------------------ */
/* 2026-06-24 — Mutation helpers (safe-shape, never throw).           */
/* Each tries the backend POST/PUT/DELETE; on any 4xx/5xx returns      */
/* { ok: false, message } so the UI falls back to local state          */
/* mutation + "backend pending" toast.                                 */
/* ------------------------------------------------------------------ */

export type MutationResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; message: string }

function errMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? (err as Error)?.message ?? fallback
}

async function safePost<T = unknown>(url: string, body: unknown, fallback: string): Promise<MutationResult<T>> {
  try {
    const r = await apiClient.post(url, body)
    const data = unwrap<T>(r, 'data.data')
    return { ok: true, data }
  } catch (err) { return { ok: false, message: errMessage(err, fallback) } }
}
async function safePut<T = unknown>(url: string, body: unknown, fallback: string): Promise<MutationResult<T>> {
  try {
    const r = await apiClient.put(url, body)
    const data = unwrap<T>(r, 'data.data')
    return { ok: true, data }
  } catch (err) { return { ok: false, message: errMessage(err, fallback) } }
}
async function safeDelete(url: string, fallback: string): Promise<MutationResult> {
  try {
    await apiClient.delete(url)
    return { ok: true }
  } catch (err) { return { ok: false, message: errMessage(err, fallback) } }
}

/* ---- Categories ---- */
export interface CategoryInput { name: string; description?: string }
export const addRestaurantCategory = (input: CategoryInput) =>
  safePost<RestaurantCategory>('/api/restaurant/menu_category/add', input, 'Add category failed')
export const updateRestaurantCategory = (id: number, input: CategoryInput) =>
  safePut<RestaurantCategory>(`/api/restaurant/menu_category/update/${id}`, input, 'Update category failed')
export const deleteRestaurantCategory = (id: number) =>
  safeDelete(`/api/restaurant/menu_category/delete/${id}`, 'Delete category failed')

/* ---- Subcategories ---- */
export interface SubcategoryInput { name: string; menuCategoryId: number; priority?: number }
export const addRestaurantSubcategory = (input: SubcategoryInput) =>
  safePost<RestaurantSubcategory>('/api/restaurant/menu_subcategory/add', input, 'Add subcategory failed')
export const updateRestaurantSubcategory = (id: number, input: SubcategoryInput) =>
  safePut<RestaurantSubcategory>(`/api/restaurant/menu_subcategory/update/${id}`, input, 'Update subcategory failed')
export const deleteRestaurantSubcategory = (id: number) =>
  safeDelete(`/api/restaurant/menu_subcategory/delete/${id}`, 'Delete subcategory failed')

/* ---- Sections ---- */
export interface SectionInput { name: string; description?: string }
export const addRestaurantSection = (input: SectionInput) =>
  safePost<RestaurantSection>('/api/restaurant/section/add', input, 'Add section failed')
export const updateRestaurantSection = (id: number, input: SectionInput) =>
  safePut<RestaurantSection>(`/api/restaurant/section/update/${id}`, input, 'Update section failed')
export const deleteRestaurantSection = (id: number) =>
  safeDelete(`/api/restaurant/section/delete/${id}`, 'Delete section failed')

/* ---- Tables ---- */
export interface TableInput { tableNumber: string; capacity: number; sectionId: number }
export const addRestaurantTable = (input: TableInput) =>
  safePost<RestaurantTable>('/api/restaurant/dining_tables/add', input, 'Add table failed')
export const updateRestaurantTable = (id: number, input: TableInput) =>
  safePut<RestaurantTable>(`/api/restaurant/dining_tables/update/${id}`, input, 'Update table failed')
export const deleteRestaurantTable = (id: number) =>
  safeDelete(`/api/restaurant/dining_tables/delete/${id}`, 'Delete table failed')

/* ---- Delivery zones ---- */
export interface DeliveryZoneInput { zoneName: string; deliveryCharge: number; freeDeliveryAbove?: number; deliveryTimeMinutes?: number }
export const addRestaurantDeliveryZone = (input: DeliveryZoneInput) =>
  safePost<RestaurantDeliveryZone>('/api/restaurant/delivery_zones/add', input, 'Add zone failed')
export const updateRestaurantDeliveryZone = (id: number, input: DeliveryZoneInput) =>
  safePut<RestaurantDeliveryZone>(`/api/restaurant/delivery_zones/update/${id}`, input, 'Update zone failed')
export const deleteRestaurantDeliveryZone = (id: number) =>
  safeDelete(`/api/restaurant/delivery_zones/delete/${id}`, 'Delete zone failed')

/* ---- Addon groups ---- */
export interface AddonGroupInput { name: string; minAddon: number; maxAddon: number; isMultiple: boolean; description?: string }
export const addRestaurantAddonGroup = (input: AddonGroupInput) =>
  safePost<RestaurantAddonGroup>('/api/restaurant/addons/add', input, 'Add addon group failed')
export const updateRestaurantAddonGroup = (id: number, input: AddonGroupInput) =>
  safePut<RestaurantAddonGroup>(`/api/restaurant/addons/update/${id}`, input, 'Update addon group failed')
export const deleteRestaurantAddonGroup = (id: number) =>
  safeDelete(`/api/restaurant/addons/delete/${id}`, 'Delete addon group failed')

/* ---- Addon items ---- */
export interface AddonItemInput { name: string; price: number; addonsId: number; attribute?: 'VEG' | 'NON_VEG' }
export const addRestaurantAddonItem = (input: AddonItemInput) =>
  safePost<RestaurantAddonItem>('/api/restaurant/addons_items/add', input, 'Add addon item failed')
export const updateRestaurantAddonItem = (id: number, input: AddonItemInput) =>
  safePut<RestaurantAddonItem>(`/api/restaurant/addons_items/update/${id}`, input, 'Update addon item failed')
export const deleteRestaurantAddonItem = (id: number) =>
  safeDelete(`/api/restaurant/addons_items/delete/${id}`, 'Delete addon item failed')

/* ---- Hours (update only — list is pre-populated by backend) ---- */
export interface HourInput { dayOfWeek: DayOfWeek; openingTime: string; closingTime: string; isClosed: boolean }
export const updateRestaurantHour = (id: number, input: HourInput) =>
  safePut<RestaurantHour>(`/api/restaurant/restaurant_hours/update/${id}`, input, 'Update hours failed')

/* ---- Coupons ---- */
export interface CouponInput {
  couponCode: string; couponName: string; discountAmount: number
  isPercent: boolean; validity?: string; usageLimit?: number; firstOrder?: boolean; global?: boolean
}
export const addRestaurantCoupon = (input: CouponInput) =>
  safePost<RestaurantCoupon>('/api/restaurant/coupon/add', input, 'Add coupon failed')
export const updateRestaurantCoupon = (id: number, input: CouponInput) =>
  safePut<RestaurantCoupon>(`/api/restaurant/coupon/update/${id}`, input, 'Update coupon failed')
export const deleteRestaurantCoupon = (id: number) =>
  safeDelete(`/api/restaurant/coupon/delete/${id}`, 'Delete coupon failed')

/* ---- Menu items ----
 * Full 13-field shape preserving legacy MenuItems.jsx form (branch / category /
 * subcategory / addons / name / price / mrp / cost / dietary / prep time /
 * image / 4 toggles / description). The legacy backend expects multipart for
 * the image field; we send JSON when there is no image and FormData otherwise.
 */
export interface MenuItemInput {
  name: string
  description?: string
  price: number
  mrp?: number
  ourCost?: number
  categoryId: number
  subcategoryId?: number
  branchId?: number
  /** "VEG" | "NON_VEG" | "EGG" — preserves legacy three-way dietary field. */
  dietaryType?: 'VEG' | 'NON_VEG' | 'EGG'
  /** Backwards-compat with the legacy boolean isVeg flag (sent alongside). */
  isVeg?: boolean
  prepTimeMinutes?: number
  /** Addon group ids the item is associated with. */
  addonGroupIds?: number[]
  isActive?: boolean
  isAvailable: boolean
  isOnline?: boolean
  isRecommended?: boolean
  /** Optional File for multipart upload. When present we POST FormData. */
  image?: File | null
}

function buildMenuItemFormData(input: MenuItemInput): FormData {
  const fd = new FormData()
  fd.append('name', input.name)
  if (input.description) fd.append('description', input.description)
  fd.append('price', String(input.price))
  if (input.mrp != null) fd.append('mrp', String(input.mrp))
  if (input.ourCost != null) fd.append('ourCost', String(input.ourCost))
  fd.append('categoryId', String(input.categoryId))
  if (input.subcategoryId != null) fd.append('subcategoryId', String(input.subcategoryId))
  if (input.branchId != null) fd.append('branchId', String(input.branchId))
  if (input.dietaryType) fd.append('dietaryType', input.dietaryType)
  if (input.isVeg != null) fd.append('isVeg', String(input.isVeg))
  if (input.prepTimeMinutes != null) fd.append('prepTimeMinutes', String(input.prepTimeMinutes))
  if (input.addonGroupIds?.length) {
    for (const id of input.addonGroupIds) fd.append('addonGroupIds', String(id))
  }
  fd.append('isActive', String(input.isActive ?? true))
  fd.append('isAvailable', String(input.isAvailable))
  if (input.isOnline != null) fd.append('isOnline', String(input.isOnline))
  if (input.isRecommended != null) fd.append('isRecommended', String(input.isRecommended))
  if (input.image) fd.append('image', input.image)
  return fd
}

export const addRestaurantMenuItem = (input: MenuItemInput) => {
  if (input.image) {
    return safePost<RestaurantMenuItem>('/api/restaurant/menu_items/add', buildMenuItemFormData(input), 'Add item failed')
  }
  return safePost<RestaurantMenuItem>('/api/restaurant/menu_items/add', input, 'Add item failed')
}
export const updateRestaurantMenuItem = (id: number, input: MenuItemInput) => {
  if (input.image) {
    return safePut<RestaurantMenuItem>(`/api/restaurant/menu_items/update/${id}`, buildMenuItemFormData(input), 'Update item failed')
  }
  return safePut<RestaurantMenuItem>(`/api/restaurant/menu_items/update/${id}`, input, 'Update item failed')
}
export const deleteRestaurantMenuItem = (id: number) =>
  safeDelete(`/api/restaurant/menu_items/delete/${id}`, 'Delete item failed')

/* ---- Users ---- */
export interface UserInput { name: string; mobile: string; email?: string; role: string; password?: string }
export const addRestaurantUser = (input: UserInput) =>
  safePost<RestaurantUser>('/api/restaurant/users/add', input, 'Add user failed')
export const updateRestaurantUser = (id: number, input: UserInput) =>
  safePut<RestaurantUser>(`/api/restaurant/users/update/${id}`, input, 'Update user failed')
export const deleteRestaurantUser = (id: number) =>
  safeDelete(`/api/restaurant/users/delete/${id}`, 'Delete user failed')

/* ---- Customers (no delete; soft-toggle via isActive) ---- */
export interface CustomerInput { name: string; mobileNumber: string; email?: string }
export const addRestaurantCustomer = (input: CustomerInput) =>
  safePost<RestaurantCustomer>('/api/restaurant/customers/add', input, 'Add customer failed')
export const updateRestaurantCustomer = (id: number, input: CustomerInput) =>
  safePut<RestaurantCustomer>(`/api/restaurant/customers/update/${id}`, input, 'Update customer failed')
export const toggleRestaurantCustomerActive = (id: number, isActive: boolean) =>
  safePut(`/api/restaurant/customers/toggle/${id}`, { isActive }, 'Toggle customer failed')

/* ---- Sliders ---- */
export interface SliderInput {
  title?: string
  description?: string
  displayOrder?: number
  isActive: boolean
  /** Optional File for multipart upload (mirrors menu-item image pattern). */
  image?: File | null
  /** Already-hosted URL if the slider was created via a CDN — sent only when image is null. */
  imageUrl?: string
}
function buildSliderFormData(input: SliderInput): FormData {
  const fd = new FormData()
  if (input.title) fd.append('title', input.title)
  if (input.description) fd.append('description', input.description)
  if (input.displayOrder != null) fd.append('displayOrder', String(input.displayOrder))
  fd.append('isActive', String(input.isActive))
  if (input.imageUrl) fd.append('imageUrl', input.imageUrl)
  if (input.image) fd.append('image', input.image)
  return fd
}
export const addRestaurantSlider = (input: SliderInput) => {
  if (input.image) {
    return safePost<RestaurantSlider>('/api/restaurant/sliders/add', buildSliderFormData(input), 'Add slider failed')
  }
  return safePost<RestaurantSlider>('/api/restaurant/sliders/add', input, 'Add slider failed')
}
export const updateRestaurantSlider = (id: number, input: SliderInput) => {
  if (input.image) {
    return safePut<RestaurantSlider>(`/api/restaurant/sliders/update/${id}`, buildSliderFormData(input), 'Update slider failed')
  }
  return safePut<RestaurantSlider>(`/api/restaurant/sliders/update/${id}`, input, 'Update slider failed')
}
export const deleteRestaurantSlider = (id: number) =>
  safeDelete(`/api/restaurant/sliders/delete/${id}`, 'Delete slider failed')

/* ---- Bank Details ---- */
export interface BankDetailInput {
  bankName: string
  accountNumber: string
  ifsc: string
  holderName: string
  branchName?: string
  upi?: string
  isPrimary?: boolean
}
export const addRestaurantBankDetail = (input: BankDetailInput) =>
  safePost<RestaurantBankDetail>('/api/restaurant/bank_details/add', input, 'Add bank account failed')
export const updateRestaurantBankDetail = (id: number, input: BankDetailInput) =>
  safePut<RestaurantBankDetail>(`/api/restaurant/bank_details/update/${id}`, input, 'Update bank account failed')
export const deleteRestaurantBankDetail = (id: number) =>
  safeDelete(`/api/restaurant/bank_details/delete/${id}`, 'Delete bank account failed')

/* ---- Payment gateways ---- */
export interface PaymentGatewayInput {
  status: boolean; allowCod: boolean
  stripeEnabled?: boolean; paypalEnabled?: boolean; razorpayEnabled?: boolean; upiEnabled?: boolean
}
export const addRestaurantPaymentGateway = (input: PaymentGatewayInput) =>
  safePost<RestaurantPaymentGateway>('/api/restaurant/payment_gateway/add', input, 'Add gateway failed')
export const updateRestaurantPaymentGateway = (id: number, input: PaymentGatewayInput) =>
  safePut<RestaurantPaymentGateway>(`/api/restaurant/payment_gateway/update/${id}`, input, 'Update gateway failed')
export const toggleRestaurantPaymentGatewayStatus = (id: number, status: boolean) =>
  safePut(`/api/restaurant/payment_gateway/toggle/${id}`, { status }, 'Toggle gateway failed')

/* ------------------------------------------------------------------ */
/* 2026-06-25 — Stakeholder demo sub-pages                             */
/*                                                                     */
/* Probe results (verified live):                                       */
/*   • GET    /api/restaurant/orders/history         500 (method N/A)   */
/*   • POST   /api/restaurant/orders/history         500 (method N/A)   */
/*   • POST   /api/restaurant/users/add              404 subscription   */
/*   • POST   /api/restaurant/menu_items/addMultiple 200 SUCCESS  ✅    */
/*   • GET/PUT /api/restaurant/branding              500 "No resource"  */
/*                                                                     */
/* For 500-routes we still call the endpoint then gracefully fall back. */
/* ------------------------------------------------------------------ */

export interface RestaurantOrder {
  id: number
  orderNumber: string
  orderType: 'DINING' | 'TAKEAWAY' | 'DELIVERY' | string
  status: string
  paymentStatus?: string
  paymentMethod?: string
  customerName?: string | null
  customerPhone?: string | null
  tableNumber?: string | null
  subtotal?: number
  taxAmount?: number
  discountAmount?: number
  deliveryFee?: number
  totalAmount?: number
  amount?: number
  createdAt: string
  branchName?: string | null
  orderItemsCount?: number
}

export interface RestaurantOrdersResponse {
  orders: RestaurantOrder[]
  /** True when the data is the local sample fallback (backend route unavailable). */
  sample: boolean
  totalRecords: number
}

interface RestaurantOrderHistoryParams {
  page?: number
  pageSize?: number
  status?: string
  orderType?: string
  fromDate?: string
  toDate?: string
}

const RESTAURANT_ORDER_SAMPLE: RestaurantOrder[] = [
  { id: 9041, orderNumber: 'KOT-9041', orderType: 'DINING', status: 'COMPLETED', customerName: 'Walk-in T-02', tableNumber: 'T-02', totalAmount: 645, createdAt: new Date(Date.now() - 1 * 3600_000).toISOString(), branchName: 'Main Branch' },
  { id: 9040, orderNumber: 'KOT-9040', orderType: 'DELIVERY', status: 'COMPLETED', customerName: 'Rohan Mehta', customerPhone: '9876543210', totalAmount: 320, createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(), branchName: 'Main Branch' },
  { id: 9039, orderNumber: 'KOT-9039', orderType: 'TAKEAWAY', status: 'CANCELLED', customerName: 'Priya Sharma', totalAmount: 0, createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(), branchName: 'Andheri' },
  { id: 9038, orderNumber: 'KOT-9038', orderType: 'DINING', status: 'COMPLETED', customerName: 'Walk-in T-07', tableNumber: 'T-07', totalAmount: 1280, createdAt: new Date(Date.now() - 4 * 3600_000).toISOString(), branchName: 'Main Branch' },
  { id: 9037, orderNumber: 'KOT-9037', orderType: 'DELIVERY', status: 'PREPARING_ORDER', customerName: 'Vikram S.', totalAmount: 480, createdAt: new Date(Date.now() - 5 * 3600_000).toISOString(), branchName: 'Bandra' },
  { id: 9036, orderNumber: 'KOT-9036', orderType: 'DINING', status: 'READY_FOR_ORDER', customerName: 'Sneha P.', tableNumber: 'T-04', totalAmount: 215, createdAt: new Date(Date.now() - 6 * 3600_000).toISOString(), branchName: 'Main Branch' },
  { id: 9035, orderNumber: 'KOT-9035', orderType: 'DINING', status: 'PENDING', customerName: 'Walk-in T-11', tableNumber: 'T-11', totalAmount: 750, createdAt: new Date(Date.now() - 7 * 3600_000).toISOString(), branchName: 'Main Branch' },
  { id: 9034, orderNumber: 'KOT-9034', orderType: 'TAKEAWAY', status: 'COMPLETED', customerName: 'Anita Roy', totalAmount: 420, createdAt: new Date(Date.now() - 8 * 3600_000).toISOString(), branchName: 'Andheri' },
]

function applyOrderFilters(rows: RestaurantOrder[], p: RestaurantOrderHistoryParams): RestaurantOrder[] {
  let out = rows
  if (p.status) out = out.filter((o) => o.status === p.status)
  if (p.orderType) out = out.filter((o) => o.orderType === p.orderType)
  if (p.fromDate) out = out.filter((o) => o.createdAt.slice(0, 10) >= p.fromDate!)
  if (p.toDate) out = out.filter((o) => o.createdAt.slice(0, 10) <= p.toDate!)
  return out
}

export async function fetchRestaurantOrders(params: RestaurantOrderHistoryParams = {}): Promise<RestaurantOrdersResponse> {
  // Probe: GET first, then POST. As of 2026-06-25 both 500.
  try {
    const r = await apiClient.get('/api/restaurant/orders/history', { params: { page: 1, pageSize: 50, ...params } })
    const page = unwrap<{ records: RestaurantOrder[]; totalRecords?: number }>(r, 'data.data')
    if (page?.records?.length) return { orders: page.records, sample: false, totalRecords: page.totalRecords ?? page.records.length }
  } catch { /* fall through */ }
  const filtered = applyOrderFilters(RESTAURANT_ORDER_SAMPLE, params)
  return { orders: filtered, sample: true, totalRecords: filtered.length }
}

/* ---- Branding (probe → fallback to brand cache) ---- */
export interface RestaurantBranding {
  restaurantName: string
  tagline?: string
  logoUrl?: string | null
  primaryHex?: string
}

export async function fetchRestaurantBranding(): Promise<RestaurantBranding | null> {
  try {
    const r = await apiClient.get('/api/restaurant/branding')
    return unwrap<RestaurantBranding>(r, 'data.data')
  } catch { return null }
}

export const updateRestaurantBranding = (input: RestaurantBranding) =>
  safePut<RestaurantBranding>('/api/restaurant/branding', input, 'Update branding failed')

/* ---- Bulk menu items ---- */
export interface BulkMenuItemInput {
  name: string
  description?: string
  price: number
  categoryId?: number
  isAvailable?: boolean
  isVeg?: boolean
}

export const addRestaurantMenuItemsBulk = (rows: BulkMenuItemInput[]) =>
  safePost<{ added: number }>('/api/restaurant/menu_items/addMultiple', rows, 'Bulk add failed')

/* ---- Outstanding (invoices awaiting settlement) ---- */
export interface RestaurantOutstandingRow {
  id: number
  orderNumber: string
  customer: string
  mobile: string
  amount: number
  daysOverdue: number
}

export interface RestaurantOutstandingResponse {
  rows: RestaurantOutstandingRow[]
  /** True when the data is the local sample fallback (backend route unavailable). */
  sample: boolean
}

interface BackendOutstanding {
  id: number
  orderNumber?: string
  invoiceNumber?: string
  customerName?: string
  customer?: { name?: string; mobile?: string; mobileNumber?: string } | null
  mobile?: string
  amount?: number | string
  outstandingAmount?: number | string
  daysOverdue?: number
  overdueDays?: number
}

const RESTAURANT_OUTSTANDING_SAMPLE: RestaurantOutstandingRow[] = [
  { id: 1, orderNumber: 'INV-2034', customer: 'Spice Garden — Andheri', mobile: '9988001122', amount: 4280, daysOverdue: 12 },
  { id: 2, orderNumber: 'KOT-1028', customer: 'Walk-in T-04', mobile: '—', amount: 620, daysOverdue: 3 },
  { id: 3, orderNumber: 'INV-2031', customer: 'Ananya Verma', mobile: '9988776655', amount: 1280, daysOverdue: 6 },
]

export async function fetchRestaurantOutstanding(): Promise<RestaurantOutstandingResponse> {
  try {
    const r = await apiClient.get('/api/restaurant/outstanding/all')
    const raw = unwrap<BackendOutstanding[]>(r, 'data.data')
    if (Array.isArray(raw) && raw.length > 0) {
      const rows: RestaurantOutstandingRow[] = raw.map((b) => ({
        id: Number(b.id),
        orderNumber: String(b.orderNumber ?? b.invoiceNumber ?? `INV-${b.id}`),
        customer: String(b.customerName ?? b.customer?.name ?? 'Customer'),
        mobile: String(b.mobile ?? b.customer?.mobile ?? b.customer?.mobileNumber ?? '—'),
        amount: Number(b.amount ?? b.outstandingAmount ?? 0),
        daysOverdue: Number(b.daysOverdue ?? b.overdueDays ?? 0),
      }))
      return { rows, sample: false }
    }
  } catch { /* fall through */ }
  return { rows: RESTAURANT_OUTSTANDING_SAMPLE, sample: true }
}
