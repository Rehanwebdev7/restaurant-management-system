/**
 * Superadmin API service — LIVE Spring Boot endpoints.
 * Verified 2026-06-24 against http://localhost:8091/rms with supadmin token.
 *
 * Endpoint map (real backend):
 *   /api/superadmin/dashboard/summary    — 200 SUCCESS
 *   /api/superadmin/users/all            — 200 SUCCESS  (platform-wide directory)
 *   /api/superadmin/customers/all        — 200 SUCCESS
 *   /api/admin/restaurant_branch/all     — 200 SUCCESS
 *   /api/admin/subscription-plans        — 200 SUCCESS  (Page<{plan, active_subscribers}>)
 *   /api/admin/subscriptions             — 200 SUCCESS  (Page<SubscriptionRecord>)
 *   /api/admin/user-approvals            — 200 SUCCESS  (Page<UserApprovalRecord>)
 *   /api/superadmin/payment_gateway/all  — 200 SUCCESS
 *   /api/admin/notifications             — 404 NOT FOUND in current backend (uses fallback)
 *
 * All endpoints follow standard envelope `{ Status, StatusCode, message, data }`.
 * Auth is the legacy `access_token` header (already wired in client.ts).
 */
import apiClient from '@/api/client'
import { unwrap } from '@/api/normalize'

/* ---------- types ---------- */

export interface PageEnvelope<T> {
  content: T[]
  totalElements?: number
  totalPages?: number
  number?: number
  size?: number
}

export interface SuperadminUser {
  id: number
  name: string
  email: string | null
  mobile: string | null
  role: string | null
  isActive: boolean | null
  isDeleted?: boolean | null
  createdAt?: string | null
  parentId?: { id: number; name?: string } | null
  branchId?: { id: number; name?: string } | null
  approvalStatus?: string | null
}

export interface SuperadminCustomer {
  id: number
  name: string
  email: string | null
  mobileNumber: string | null
  photoUrl?: string | null
  isActive?: boolean | null
  walletBalance?: number | null
  createdAt?: string | null
}

export interface SuperadminBranch {
  id: number
  branchName: string
  address?: string | null
  phone?: string | null
  email?: string | null
  isActive?: boolean | null
  latitude?: number | null
  longitude?: number | null
  restaurantId?: {
    id: number
    name?: string
    email?: string
    mobile?: string
    isOrderStopped?: boolean | null
  } | null
  pincodeId?: {
    pincode?: string
    cityId?: { name?: string } | null
    stateId?: { name?: string } | null
  } | null
}

export interface SuperadminPlan {
  planId: number
  planName: string
  description?: string | null
  price: number
  durationDays: number
  maxBranch: number | null
  maxKitchen: number | null
  maxDeliveryBoy: number | null
  features?: string | null
  isActive: boolean
  sortOrder?: number
  isDeleted?: boolean | null
}

export interface SuperadminPlanRow {
  plan: SuperadminPlan
  active_subscribers: number
}

export interface SuperadminSubscription {
  subscriptionId: number
  user: SuperadminUser
  plan: SuperadminPlan
  startDate: string | null
  endDate: string | null
  graceEndDate: string | null
  amountPaid: number | null
  discountAmount: number | null
  status: string
  couponCode: string | null
  paymentReference: string | null
  notes: string | null
  createdAt?: string | null
}

export interface SuperadminUserApproval {
  id: number
  name: string | null
  email: string | null
  mobile: string | null
  role: string | null
  approvalStatus: string | null
  approvalNotes: string | null
  createdAt: string | null
}

export interface SuperadminPaymentGateway {
  id: number
  status: boolean
  allowCod: boolean
  vendorname?: string | null
  onOf?: string | null
  title?: string | null
  paymentMethod?: string | null
  restaurantId?: { id: number; name?: string } | null
}

export interface SuperadminDashboard {
  summary?: {
    totalOrders?: number
    totalRevenue?: number
    averageOrderValue?: number
    period?: { fromDate?: string; toDate?: string }
  }
  orderByStatus?: Record<string, number>
  revenueTrend?: Array<{ date: string; revenue: number; orderCount: number }>
  dailyOrderTrend?: Array<{ date: string; orderCount: number }>
  topRestaurants?: Array<{
    restaurantId: number
    restaurantName: string
    totalOrders: number
    totalRevenue: number
    pendingOrders: number
    completedOrders: number
    cancelledOrders: number
  }>
  topMenuItems?: Array<{ id?: number; name?: string; totalOrders?: number }>
  totalRestaurants?: number
  totalCustomers?: number
  pendingApprovals?: number
  pendingApprovalsList?: SuperadminUserApproval[]
}

export interface SuperadminNotification {
  id: number
  title: string
  body?: string | null
  severity?: 'info' | 'warning' | 'destructive' | 'secondary' | 'success'
  createdAt?: string | null
}

/* UI-F-95: Activity / audit-log shape. Lightly typed because the backend
 *           endpoint is still aspirational; whatever it returns will be
 *           normalised into this shape by the page.                           */
export interface SuperadminAuditLog {
  id: number
  timestamp: string
  userName: string | null
  userRole: string | null
  action: string
  entity: string | null
  entityId: number | null
  diff?: string | null
}

/* ---------- helpers ---------- */

const todayIso = () => new Date().toISOString().slice(0, 10)
const monthAgoIso = () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

async function safeGet<T>(url: string, params?: Record<string, unknown>): Promise<T | null> {
  try {
    const r = await apiClient.get(url, params ? { params } : undefined)
    return unwrap<T>(r, 'data.data')
  } catch {
    return null
  }
}

async function safeGetList<T>(url: string): Promise<T[]> {
  const data = await safeGet<T[]>(url)
  return Array.isArray(data) ? data : []
}

async function safeGetPage<T>(url: string, params?: Record<string, unknown>): Promise<T[]> {
  const data = await safeGet<PageEnvelope<T>>(url, params)
  return Array.isArray(data?.content) ? data!.content : []
}

/* ---------- service functions ---------- */

export const fetchSuperadminDashboard = (opts: { fromDate?: string; toDate?: string } = {}) =>
  safeGet<SuperadminDashboard>('/api/superadmin/dashboard/summary', {
    fromDate: opts.fromDate ?? monthAgoIso(),
    toDate: opts.toDate ?? todayIso(),
  })

export const fetchSuperadminUsers = () => safeGetList<SuperadminUser>('/api/superadmin/users/all')

export const fetchSuperadminCustomers = () =>
  safeGetList<SuperadminCustomer>('/api/superadmin/customers/all')

export const fetchSuperadminBranches = () =>
  safeGetList<SuperadminBranch>('/api/admin/restaurant_branch/all')

export const fetchSuperadminPlans = (params: { pageSize?: number } = {}) =>
  safeGetPage<SuperadminPlanRow>('/api/admin/subscription-plans', {
    pageNumber: 0,
    pageSize: params.pageSize ?? 50,
  })

export const fetchSuperadminSubscriptions = (params: { pageSize?: number } = {}) =>
  safeGetPage<SuperadminSubscription>('/api/admin/subscriptions', {
    pageNumber: 0,
    pageSize: params.pageSize ?? 50,
  })

export const fetchSuperadminUserApprovals = (params: { approvalStatus?: string; pageSize?: number } = {}) =>
  safeGetPage<SuperadminUserApproval>('/api/admin/user-approvals', {
    pageNumber: 0,
    pageSize: params.pageSize ?? 50,
    ...(params.approvalStatus ? { approvalStatus: params.approvalStatus } : {}),
  })

export const fetchSuperadminPaymentGateways = () =>
  safeGetList<SuperadminPaymentGateway>('/api/superadmin/payment_gateway/all')

/**
 * Notifications endpoint is not yet present in the live Spring Boot backend (404).
 * Kept here so the UI can already wire the query; once backend ships it the
 * url just needs to start returning the standard envelope.
 */
export const fetchSuperadminNotifications = () =>
  safeGetList<SuperadminNotification>('/api/admin/notifications')

/**
 * UI-F-95: Audit log probe.
 * The Spring Boot backend may or may not expose `/api/superadmin/audit-logs/all`
 * today — if it 5xx/404s, `safeGet` swallows and returns `null`, the page falls
 * back to sample data with a "Sample (backend pending)" badge, mirroring the
 * pattern already used for notifications.
 */
export const fetchSuperadminAuditLogs = () =>
  safeGetList<SuperadminAuditLog>('/api/superadmin/audit-logs/all')

/* ---------- mutations ---------- */

type MutationResult<T> = { ok: true; data: T } | { ok: false; message: string }

function mutationError(err: unknown): string {
  return (
    (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
    (err as Error).message ??
    'Request failed'
  )
}

export async function updateUserApproval(
  id: number,
  body: { approvalStatus: 'APPROVED' | 'REJECTED'; approvalNotes?: string }
): Promise<MutationResult<string>> {
  try {
    const r = await apiClient.put(`/api/admin/user-approvals/${id}`, body)
    const data = unwrap<string>(r, 'data.data')
    return { ok: true, data: data ?? 'Updated' }
  } catch (err) {
    return { ok: false, message: mutationError(err) }
  }
}
