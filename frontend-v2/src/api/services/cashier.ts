/**
 * Cashier API service — LIVE Spring Boot endpoints.
 * Shapes verified against real backend 2026-06-23.
 */
import apiClient from '@/api/client'
import { unwrap } from '@/api/normalize'

/* ---------- types matching real API ---------- */

export interface CashierOrder {
  id: number
  orderNumber: string
  orderType: 'DINING' | 'TAKEAWAY' | 'DELIVERY'
  status: string
  paymentStatus: string
  paymentMethod: string
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  tableNumber: string | null
  couponCode: string | null
  subtotal: number
  taxAmount: number
  discountAmount: number
  deliveryFee: number
  totalAmount: number
  amount?: number
  createdAt: string
  updatedAt: string | null
  completedAt: string | null
  estimatedTime: number | null
  specialInstructions: string | null
  deliveryStatus: string | null
  orderItemsCount: number
}

export interface PagedResponse<T> {
  totalRecords: number
  pageSize: number
  currentPage: number
  totalPages: number
  records: T[]
}

export interface CashierDashboardSummary {
  cashierId: number
  cashierName: string
  role: string
  branchId: number
  branchName: string
  fromDate: string
  toDate: string
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  pendingOrders: number
  preparingOrders: number
  readyOrders: number
  ordersByStatus: Record<string, number>
  ordersByType: Record<string, number>
  ordersByPayment: Record<string, number>
}

export interface NestedRef {
  id: number
  name?: string
  email?: string
  mobile?: string
}

export interface CashierMenuItem {
  id: number
  name: string
  description: string | null
  price: number
  itemPrice?: number
  basePrice?: number
  isAvailable: boolean
  isVeg?: boolean
  categoryId?: NestedRef | { id: number }
  subcategoryId?: NestedRef | { id: number }
  restaurantId?: NestedRef
  branchId?: NestedRef | null
  imageUrl?: string | null
}

export interface CashierMenuCategory {
  id: number
  name: string
  description?: string | null
  imageUrl?: string | null
  displayOrder?: number
  isActive?: boolean
}

export interface CashierCustomer {
  id: number
  name: string
  email: string | null
  mobileNumber: string
  photoUrl: string | null
}

export interface CashierTable {
  id: number
  name?: string
  tableNumber?: string
  capacity?: number
  status?: string
  sectionId?: NestedRef
}

export interface CashierSection {
  id: number
  name: string
  description?: string | null
}

/* ---------- service functions ---------- */

interface OrderHistoryParams {
  page?: number
  pageSize?: number
  status?: string
  orderType?: string
  orderNumber?: string
  fromDate?: string
  toDate?: string
}

export async function fetchCashierDashboard(params: {
  fromDate: string
  toDate: string
}): Promise<CashierDashboardSummary | null> {
  try {
    const r = await apiClient.get('/api/cashier/dashboard/summary', { params })
    return unwrap<CashierDashboardSummary>(r, 'data.data')
  } catch {
    return null
  }
}

export async function fetchCashierOrders(
  params: OrderHistoryParams = {}
): Promise<PagedResponse<CashierOrder>> {
  try {
    const r = await apiClient.get('/api/cashier/orders/history', {
      params: { page: 1, pageSize: 25, ...params },
    })
    return (
      unwrap<PagedResponse<CashierOrder>>(r, 'data.data') ?? {
        totalRecords: 0,
        pageSize: 0,
        currentPage: 1,
        totalPages: 0,
        records: [],
      }
    )
  } catch {
    return { totalRecords: 0, pageSize: 0, currentPage: 1, totalPages: 0, records: [] }
  }
}

export async function fetchCashierMenuItems(): Promise<CashierMenuItem[]> {
  try {
    const r = await apiClient.get('/api/cashier/menu_items/all')
    return unwrap<CashierMenuItem[]>(r, 'data.data') ?? []
  } catch {
    return []
  }
}

export async function fetchCashierMenuCategories(): Promise<CashierMenuCategory[]> {
  try {
    const r = await apiClient.get('/api/cashier/menu_category/all')
    return unwrap<CashierMenuCategory[]>(r, 'data.data') ?? []
  } catch {
    return []
  }
}

export async function fetchCashierCustomers(): Promise<CashierCustomer[]> {
  try {
    const r = await apiClient.get('/api/cashier/customers/all')
    return unwrap<CashierCustomer[]>(r, 'data.data') ?? []
  } catch {
    return []
  }
}

export async function fetchCashierTables(): Promise<CashierTable[]> {
  try {
    const r = await apiClient.get('/api/cashier/dining_tables/all')
    return unwrap<CashierTable[]>(r, 'data.data') ?? []
  } catch {
    return []
  }
}

export async function fetchCashierSections(): Promise<CashierSection[]> {
  try {
    const r = await apiClient.get('/api/cashier/section/all')
    return unwrap<CashierSection[]>(r, 'data.data') ?? []
  } catch {
    return []
  }
}

export interface CreateOrderItemInput {
  menuItemId: number
  quantity: number
  specialInstructions?: string
}

export interface CreateOrderInput {
  orderType: 'DINING' | 'TAKEAWAY' | 'DELIVERY'
  tableNumber?: string
  customerName?: string
  customerPhone?: string
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'WALLET'
  items: CreateOrderItemInput[]
  specialInstructions?: string
}

export async function createCashierOrder(input: CreateOrderInput): Promise<{ ok: true; data: unknown } | { ok: false; message: string }> {
  try {
    const r = await apiClient.post('/api/cashier/orders/add', input)
    const data = unwrap<unknown>(r, 'data.data')
    return { ok: true, data }
  } catch (err) {
    const message =
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
      (err as Error).message ??
      'Order create failed'
    return { ok: false, message }
  }
}

export async function createCashierCustomer(input: {
  name: string
  mobileNumber: string
  email?: string
}): Promise<{ ok: true; data: CashierCustomer } | { ok: false; message: string }> {
  try {
    const r = await apiClient.post('/api/cashier/customers/add', input)
    const data = unwrap<CashierCustomer>(r, 'data.data')
    return { ok: true, data }
  } catch (err) {
    const message =
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
      (err as Error).message ??
      'Customer create failed'
    return { ok: false, message }
  }
}

/* ---------- 2026-06-24 — sub-page fetchers ---------- */

export interface CashierCoupon {
  id: number
  couponName: string
  couponCode: string
  discountAmount: number
  validity: string
  displayOnScreen?: boolean
  description?: string | null
  title?: string | null
}

export interface CashierWalletTopupRequest {
  id: number
  amount: number
  createdAt?: string
  updatedAt?: string | null
  status?: string | null
  approvedById?: NestedRef | null
  customerId?: NestedRef | null
  paymentMethod?: string | null
  remark?: string | null
}

/**
 * Order detail. Backend `/api/cashier/orders/{id}` currently 500s on JDBC.
 * Until that's fixed we synthesize "detail" by scanning the history list
 * for a matching id — caller may also pass a fully-resolved CashierOrder.
 */
export async function fetchCashierOrderById(id: number): Promise<CashierOrder | null> {
  // Try the real endpoint first — when backend fixes the SQL we get live data for free.
  try {
    const r = await apiClient.get(`/api/cashier/orders/${id}`)
    const direct = unwrap<CashierOrder>(r, 'data.data')
    if (direct && typeof direct === 'object' && 'id' in direct) return direct
  } catch {
    // fall through to history scan
  }
  try {
    // Scan a generous slice of history. 200 covers the realistic backlog window.
    const r = await apiClient.get('/api/cashier/orders/history', {
      params: { page: 1, pageSize: 200 },
    })
    const page = unwrap<PagedResponse<CashierOrder>>(r, 'data.data')
    return page?.records.find((o) => Number(o.id) === Number(id)) ?? null
  } catch {
    return null
  }
}

export async function fetchCashierCoupons(): Promise<CashierCoupon[]> {
  try {
    const r = await apiClient.get('/api/cashier/coupon/all')
    return unwrap<CashierCoupon[]>(r, 'data.data') ?? []
  } catch {
    return []
  }
}

export async function fetchCashierWalletTopupHistory(): Promise<CashierWalletTopupRequest[]> {
  try {
    const r = await apiClient.get('/api/cashier/wallet_topup_request/history', {
      params: { page: 1, pageSize: 50 },
    })
    const page = unwrap<PagedResponse<CashierWalletTopupRequest>>(r, 'data.data')
    if (page?.records) return page.records
    // Some envelopes return the array directly under `data`.
    const arr = unwrap<CashierWalletTopupRequest[]>(r, 'data.data')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/**
 * Mark order as paid. Backend `mark_paid` endpoint isn't live yet — we
 * optimistically POST and surface the error so the UI can fall back to
 * a "marked locally" toast.
 */
export async function markCashierOrderPaid(
  id: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await apiClient.post(`/api/cashier/orders/${id}/mark-paid`, {})
    return { ok: true }
  } catch (err) {
    const message =
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
      (err as Error).message ??
      'Mark paid failed'
    return { ok: false, message }
  }
}

export async function cancelCashierOrder(
  id: number,
  reason?: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await apiClient.post(`/api/cashier/orders/${id}/cancel`, { reason })
    return { ok: true }
  } catch (err) {
    const message =
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
      (err as Error).message ??
      'Cancel failed'
    return { ok: false, message }
  }
}

/* ---- 2026-06-24 — Cashier coupon CRUD ---- */
export interface CashierCouponInput {
  couponCode: string; couponName: string; discountAmount: number
  validity?: string; description?: string; title?: string
}

export async function addCashierCoupon(
  input: CashierCouponInput
): Promise<{ ok: true; data: CashierCoupon } | { ok: false; message: string }> {
  try {
    const r = await apiClient.post('/api/cashier/coupon/add', input)
    return { ok: true, data: unwrap<CashierCoupon>(r, 'data.data') }
  } catch (err) {
    const message =
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
      (err as Error).message ?? 'Add coupon failed'
    return { ok: false, message }
  }
}
export async function updateCashierCoupon(
  id: number, input: CashierCouponInput
): Promise<{ ok: true; data: CashierCoupon } | { ok: false; message: string }> {
  try {
    const r = await apiClient.put(`/api/cashier/coupon/update/${id}`, input)
    return { ok: true, data: unwrap<CashierCoupon>(r, 'data.data') }
  } catch (err) {
    const message =
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
      (err as Error).message ?? 'Update coupon failed'
    return { ok: false, message }
  }
}
export async function deleteCashierCoupon(id: number): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await apiClient.delete(`/api/cashier/coupon/delete/${id}`)
    return { ok: true }
  } catch (err) {
    const message =
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
      (err as Error).message ?? 'Delete coupon failed'
    return { ok: false, message }
  }
}

export async function refundCashierOrder(
  id: number,
  amount: number,
  reason: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await apiClient.post(`/api/cashier/orders/${id}/refund`, { amount, reason })
    return { ok: true }
  } catch (err) {
    const message =
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
      (err as Error).message ??
      'Refund failed'
    return { ok: false, message }
  }
}
