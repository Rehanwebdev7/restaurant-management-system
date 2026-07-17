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

export async function impersonateUser(id: number): Promise<MutationResult<{ token?: string; name?: string; email?: string }>> {
  try {
    const r = await apiClient.post(`/api/admin/users/${id}/impersonate`, {})
    return { ok: true, data: unwrap(r, 'data.data') ?? {} }
  } catch (err) {
    return { ok: false, message: mutationError(err) }
  }
}

export async function grantSubscriptionGrace(id: number, body: { days: number; notes?: string }): Promise<MutationResult<string>> {
  try {
    const r = await apiClient.post(`/api/admin/subscriptions/${id}/grant-grace`, body)
    return { ok: true, data: unwrap<string>(r, 'data.data') ?? 'Grace granted' }
  } catch (err) {
    return { ok: false, message: mutationError(err) }
  }
}

/* ═══════════════════════════════════════════════════════════════════
 * GENERIC CRUD FACTORY (2026-07-16 evening)
 *
 * Almost every admin controller follows the same convention:
 *   GET  {base}/all           → list T[]
 *   GET  {base}/{id}          → get T
 *   POST {base}/add           → create (body: T)
 *   PUT  {base}/update        → update (body: T with id)
 *   DELETE {base}/{id}        → delete
 *
 * Building a generic factory here saves ~50 near-identical wrapper
 * functions across 14 new resources.
 * ═══════════════════════════════════════════════════════════════════ */

export interface CrudService<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  list: () => Promise<T[]>
  get: (id: number) => Promise<T | null>
  create: (body: TCreate) => Promise<MutationResult<T>>
  update: (body: TUpdate & { id?: number }) => Promise<MutationResult<T>>
  remove: (id: number) => Promise<MutationResult<void>>
}

export function makeCrudService<T, TCreate = Partial<T>, TUpdate = Partial<T>>(
  basePath: string,
  opts: { listPath?: string; addPath?: string; updatePath?: string } = {},
): CrudService<T, TCreate, TUpdate> {
  const listPath   = opts.listPath   ?? '/all'
  const addPath    = opts.addPath    ?? '/add'
  const updatePath = opts.updatePath ?? '/update'
  return {
    list: () => safeGetList<T>(`${basePath}${listPath}`),
    get:  (id) => safeGet<T>(`${basePath}/${id}`),
    create: async (body) => {
      try {
        const r = await apiClient.post(`${basePath}${addPath}`, body)
        return { ok: true, data: (unwrap(r, 'data.data') as T) ?? ({} as T) }
      } catch (err) { return { ok: false, message: mutationError(err) } }
    },
    update: async (body) => {
      try {
        const r = await apiClient.put(`${basePath}${updatePath}`, body)
        return { ok: true, data: (unwrap(r, 'data.data') as T) ?? ({} as T) }
      } catch (err) { return { ok: false, message: mutationError(err) } }
    },
    remove: async (id) => {
      try {
        await apiClient.delete(`${basePath}/${id}`)
        return { ok: true, data: undefined }
      } catch (err) { return { ok: false, message: mutationError(err) } }
    },
  }
}

/* ═══════════════════════════════════════════════════════════════════
 * 14 NEW RESOURCE SERVICES (all admin endpoints already exist)
 * ═══════════════════════════════════════════════════════════════════ */

// Loose types — real backend shapes vary; pages read the fields they need.
export type AdminEntity = Record<string, unknown> & { id?: number }

export const menuCategoryService     = makeCrudService<AdminEntity>('/api/admin/menu_category')
export const menuSubcategoryService  = makeCrudService<AdminEntity>('/api/admin/menu_subcategory')
export const sectionService          = makeCrudService<AdminEntity>('/api/admin/section')
export const diningTablesService     = makeCrudService<AdminEntity>('/api/admin/dining_tables')
export const addonsService           = makeCrudService<AdminEntity>('/api/admin/addons')
export const addonsItemsService      = makeCrudService<AdminEntity>('/api/admin/addons_items')
export const menuItemsService        = makeCrudService<AdminEntity>('/api/admin/menu_items')
export const menuItemAddonsService   = makeCrudService<AdminEntity>('/api/admin/menu_item_addons')
export const deliveryZonesService    = makeCrudService<AdminEntity>('/api/admin/delivery_zones')
export const ordersService           = makeCrudService<AdminEntity>('/api/admin/orders')
export const orderItemsService       = makeCrudService<AdminEntity>('/api/admin/order_items')
export const orderPaymentsService    = makeCrudService<AdminEntity>('/api/admin/order_payments')
export const businessSettingService  = makeCrudService<AdminEntity>('/api/admin/business_setting')
export const paymentGatewayService   = makeCrudService<AdminEntity>('/api/admin/payment_gateway')
export const statesService           = makeCrudService<AdminEntity>('/api/admin/states')
export const citiesService           = makeCrudService<AdminEntity>('/api/admin/cities')
export const restaurantBranchService = makeCrudService<AdminEntity>('/api/admin/restaurant_branch')

// API Logs — list only (backend has getAll, no CRUD)
export const fetchApiLogs = () => safeGetList<AdminEntity>('/api/admin/api_logs/getAll')

// Users filtered by role (Kitchen/Delivery/Cashier tabs). Backend supports ?roleId= param.
export const fetchUsersByRole = (role: string) =>
  safeGet<SuperadminUser[]>(`/api/superadmin/users/filter`, { role }).then((r) => r ?? [])

/* ═══════════════════════════════════════════════════════════════════
 * User Tree + Detail + Create endpoints (Phase C 2026-07-16 evening)
 *
 * Backend response fields are snake_case (user_id, full_name, etc.);
 * these interfaces + normalisers convert to camelCase for React.
 * Backend controller: SuperadminUserDirectoryController.java
 * ═══════════════════════════════════════════════════════════════════ */

export interface RestaurantTreeNode {
  userId: number
  fullName: string
  email: string | null
  mobile: string | null
  approvalStatus: string | null
  isActive: boolean
  createdAt: string | null
  branchCount: number
  kitchenCount: number
  deliveryCount: number
  cashierCount: number
}

export interface TreeChildNode {
  userId: number
  fullName: string
  role: string
  roleId?: number
  mobile: string | null
  email: string | null
  isActive: boolean
}

export interface RestaurantDetailNode {
  userId: number
  fullName: string
  email: string | null
  mobile: string | null
  role: string
  city: string | null
  state: string | null
  pincode: string | null
  gstNumber: string | null
  approvalStatus: string | null
  isActive: boolean
  createdAt: string | null
  restaurant: TreeChildNode[]
  branch: TreeChildNode[]
  kitchen: TreeChildNode[]
  delivery: TreeChildNode[]
  cashier: TreeChildNode[]
}

/** snake_case → camelCase for tree/parent row. */
function normalizeTreeNode(raw: Record<string, unknown>): RestaurantTreeNode {
  return {
    userId: Number(raw.user_id ?? raw.userId ?? 0),
    fullName: String(raw.full_name ?? raw.fullName ?? ''),
    email: (raw.email as string) ?? null,
    mobile: (raw.mobile as string) ?? (raw.mobile_number as string) ?? null,
    approvalStatus: (raw.approval_status as string) ?? (raw.approvalStatus as string) ?? null,
    isActive: raw.is_active === true || raw.is_active === 1 || raw.isActive === true,
    createdAt: (raw.created_at as string) ?? (raw.createdAt as string) ?? null,
    branchCount: Number(raw.branch_count ?? raw.branchCount ?? 0),
    kitchenCount: Number(raw.kitchen_count ?? raw.kitchenCount ?? 0),
    deliveryCount: Number(raw.delivery_count ?? raw.deliveryCount ?? 0),
    cashierCount: Number(raw.cashier_count ?? raw.cashierCount ?? 0),
  }
}

function normalizeChild(raw: Record<string, unknown>): TreeChildNode {
  const status = raw.status
  return {
    userId: Number(raw.user_id ?? raw.userId ?? 0),
    fullName: String(raw.full_name ?? raw.fullName ?? ''),
    role: String(raw.role ?? ''),
    roleId: raw.role_id != null ? Number(raw.role_id) : (raw.roleId != null ? Number(raw.roleId) : undefined),
    mobile: (raw.mobile_number as string) ?? (raw.mobile as string) ?? null,
    email: (raw.email as string) ?? null,
    isActive: status === 1 || status === true || status === '1' || raw.is_active === true,
  }
}

export const fetchRestaurantTree = async (): Promise<RestaurantTreeNode[]> => {
  const raw = await safeGetList<Record<string, unknown>>('/api/admin/users/tree')
  return raw.map(normalizeTreeNode)
}

export const fetchRestaurantChildren = async (adminId: number): Promise<TreeChildNode[]> => {
  const raw = await safeGetList<Record<string, unknown>>(`/api/admin/users/tree/${adminId}`)
  return raw.map(normalizeChild)
}

export const fetchRestaurantDetail = async (id: number): Promise<RestaurantDetailNode | null> => {
  const raw = await safeGet<Record<string, unknown>>(`/api/admin/users/${id}/detail`)
  if (!raw) return null
  return {
    userId: Number(raw.user_id ?? raw.userId ?? 0),
    fullName: String(raw.full_name ?? raw.fullName ?? ''),
    email: (raw.email as string) ?? null,
    mobile: (raw.mobile as string) ?? null,
    role: String(raw.role ?? ''),
    city: (raw.city as string) ?? null,
    state: (raw.state as string) ?? null,
    pincode: (raw.pincode as string) ?? null,
    gstNumber: (raw.gst_number as string) ?? (raw.gstNumber as string) ?? null,
    approvalStatus: (raw.approval_status as string) ?? null,
    isActive: raw.is_active === true || raw.isActive === true,
    createdAt: (raw.created_at as string) ?? null,
    restaurant: ((raw.restaurant as Record<string, unknown>[]) ?? []).map(normalizeChild),
    branch:     ((raw.branch     as Record<string, unknown>[]) ?? []).map(normalizeChild),
    kitchen:    ((raw.kitchen    as Record<string, unknown>[]) ?? []).map(normalizeChild),
    delivery:   ((raw.delivery   as Record<string, unknown>[]) ?? []).map(normalizeChild),
    cashier:    ((raw.cashier    as Record<string, unknown>[]) ?? []).map(normalizeChild),
  }
}

export interface CreateUserBody {
  name: string
  mobile: string
  email?: string
  password: string
  role: 'restaurant' | 'branch' | 'kitchen' | 'delivery' | 'cashier'
  parentId?: number | null
  isActive?: boolean
  approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED'
  gstNumber?: string
  city?: string
  state?: string
  pincode?: string
}

export async function createUser(body: CreateUserBody): Promise<MutationResult<{ id?: number }>> {
  try {
    const payload: Record<string, unknown> = {
      name: body.name,
      mobile: body.mobile,
      email: body.email ?? null,
      password: body.password,
      role: body.role,
      isActive: body.isActive ?? true,
      approvalStatus: body.approvalStatus ?? 'APPROVED',
    }
    if (body.parentId != null) payload.parentId = { id: body.parentId }
    if (body.gstNumber) payload.gstNumber = body.gstNumber
    if (body.city)      payload.city = body.city
    if (body.state)     payload.state = body.state
    if (body.pincode)   payload.pincode = body.pincode
    const r = await apiClient.post('/api/admin/users/add', payload)
    return { ok: true, data: (unwrap(r, 'data.data') as { id?: number }) ?? {} }
  } catch (err) {
    return { ok: false, message: mutationError(err) }
  }
}
