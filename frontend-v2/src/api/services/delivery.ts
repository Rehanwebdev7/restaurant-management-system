/**
 * Delivery API service — wraps live endpoints with safe fallbacks
 * so the UI still renders sample data when the user hasn't logged in.
 *
 * Endpoint reality check 2026-06-24:
 *   SUCCESS  → /api/delivery/bank_details/all
 *              /api/delivery/customer_delivery_addresses/all
 *              /api/delivery/restaurant_branch/all
 *   PENDING  → /dashboard/summary, /orders/{all,history,assigned,active},
 *              /wallet_transactions/all, /wallet_topup_request/history
 *              (backend returns 5xx or method-not-allowed — UI keeps sample fallback)
 */
import apiClient from '@/api/client'
import { unwrap } from '@/api/normalize'

export interface DeliveryActiveOrder {
  id: number | string
  orderNumber?: string
  customer?: string
  amount?: number
  distance?: string
  eta?: string
  [k: string]: unknown
}

export interface DeliveryWalletSummary {
  balance: number
  pendingPayout?: number
  transactions: { id: number; type: string; label: string; amount: number; when: string }[]
}

export interface DeliveryBankAccount {
  id: number
  bank: string
  account: string
  ifsc: string
  primary: boolean
}

export interface DeliveryCustomerAddress {
  id: number
  customerName?: string
  customerMobile?: string
  addressType?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  pincode?: string
  [k: string]: unknown
}

export interface DeliveryRestaurantBranch {
  id: number
  branchName: string
  city?: string
  state?: string
  address?: string
  [k: string]: unknown
}

export async function fetchActiveOrders(): Promise<DeliveryActiveOrder[]> {
  try {
    const response = await apiClient.get('/api/delivery/orders/active')
    const payload = unwrap<DeliveryActiveOrder[] | { records?: DeliveryActiveOrder[] }>(response, 'data.data')
    if (Array.isArray(payload)) return payload
    return payload?.records ?? []
  } catch {
    return []
  }
}


/**
 * Delivery dashboard summary — wired to `/api/delivery/dashboard/summary`.
 * Returns null when the backend route is unavailable so the UI can fall back
 * to its sample tiles without a render error.
 */
export interface DeliveryDashboardSummary {
  todayDeliveries?: number
  todayEarnings?: number
  pendingPickups?: number
  activeOrders?: number
  rating?: number
  totalDeliveries?: number
  [k: string]: unknown
}

export async function fetchDeliveryDashboard(): Promise<DeliveryDashboardSummary | null> {
  try {
    const response = await apiClient.get('/api/delivery/dashboard/summary')
    return unwrap<DeliveryDashboardSummary>(response, 'data.data')
  } catch {
    return null
  }
}

/**
 * Delivery order history — wired to `/api/delivery/orders/history`. Falls back
 * to an empty list so the history table renders gracefully without the route.
 */
export interface DeliveryHistoryOrder {
  id: number | string
  orderNumber?: string
  customer?: string
  amount?: number
  status?: string
  deliveredAt?: string
  pickedUpAt?: string
  [k: string]: unknown
}

export async function fetchDeliveryOrderHistory(): Promise<DeliveryHistoryOrder[]> {
  try {
    const response = await apiClient.get('/api/delivery/orders/history')
    const payload = unwrap<DeliveryHistoryOrder[] | { records?: DeliveryHistoryOrder[] }>(response, 'data.data')
    if (Array.isArray(payload)) return payload
    return payload?.records ?? []
  } catch {
    return []
  }
}

export async function fetchWalletSummary(): Promise<DeliveryWalletSummary | null> {
  try {
    const response = await apiClient.get('/api/delivery/wallet')
    return unwrap<DeliveryWalletSummary>(response, 'data.data')
  } catch {
    return null
  }
}

/* ---------- LIVE endpoints (verified 2026-06-24) ---------- */

interface RawBankAccount {
  id: number
  bankName?: string
  bank?: string
  accountNumber?: string
  accountNo?: string
  ifscCode?: string
  ifsc?: string
  isPrimary?: boolean
  primary?: boolean
}

export async function fetchBankAccounts(): Promise<DeliveryBankAccount[]> {
  try {
    const response = await apiClient.get('/api/delivery/bank_details/all')
    const raw = unwrap<RawBankAccount[]>(response, 'data.data') ?? []
    return raw.map((r) => {
      const acc = String(r.accountNumber ?? r.accountNo ?? '')
      const masked = acc.length > 4 ? 'XXXXXX' + acc.slice(-4) : acc
      return {
        id: Number(r.id),
        bank: String(r.bankName ?? r.bank ?? 'Bank'),
        account: masked,
        ifsc: String(r.ifscCode ?? r.ifsc ?? ''),
        primary: Boolean(r.isPrimary ?? r.primary ?? false),
      }
    })
  } catch {
    return []
  }
}

interface RawCustomerAddress {
  id: number
  customerId?: { name?: string; mobileNumber?: string } | null
  addressType?: string
  addressLine1?: string
  addressLine2?: string
  pincodeId?: { pincode?: string; city?: string; state?: string } | null
}

export async function fetchCustomerAddresses(): Promise<DeliveryCustomerAddress[]> {
  try {
    const response = await apiClient.get('/api/delivery/customer_delivery_addresses/all')
    const raw = unwrap<RawCustomerAddress[]>(response, 'data.data') ?? []
    return raw.map((r) => ({
      id: Number(r.id),
      customerName: r.customerId?.name ?? undefined,
      customerMobile: r.customerId?.mobileNumber ?? undefined,
      addressType: r.addressType ?? undefined,
      addressLine1: r.addressLine1 ?? undefined,
      addressLine2: r.addressLine2 ?? undefined,
      city: r.pincodeId?.city ?? undefined,
      state: r.pincodeId?.state ?? undefined,
      pincode: r.pincodeId?.pincode ?? undefined,
    }))
  } catch {
    return []
  }
}

interface RawRestaurantBranch {
  id: number
  branchName?: string
  city?: string
  state?: string
  address?: string
  addressLine1?: string
}

export async function fetchRestaurantBranches(): Promise<DeliveryRestaurantBranch[]> {
  try {
    const response = await apiClient.get('/api/delivery/restaurant_branch/all')
    const raw = unwrap<RawRestaurantBranch[]>(response, 'data.data') ?? []
    return raw.map((r) => ({
      id: Number(r.id),
      branchName: String(r.branchName ?? 'Branch'),
      city: r.city ?? undefined,
      state: r.state ?? undefined,
      address: r.address ?? r.addressLine1 ?? undefined,
    }))
  } catch {
    return []
  }
}
