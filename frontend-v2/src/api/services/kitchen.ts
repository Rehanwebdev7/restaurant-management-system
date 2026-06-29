/**
 * Kitchen API service — LIVE Spring Boot endpoints.
 * Verified 2026-06-23.
 */
import apiClient from '@/api/client'
import { unwrap } from '@/api/normalize'

export interface KitchenOrder {
  id: number
  orderNumber: string
  orderType: string
  status: string
  paymentStatus: string
  paymentMethod: string
  customerName: string | null
  customerPhone: string | null
  tableNumber: string | null
  subtotal: number
  taxAmount: number
  totalAmount: number
  amount?: number
  createdAt: string
  estimatedTime: number | null
  specialInstructions: string | null
  orderItemsCount: number
}

export interface KitchenPaged {
  totalRecords: number
  pageSize: number
  currentPage: number
  totalPages: number
  records: KitchenOrder[]
}

export interface KitchenDashboard {
  branchId: number
  branchName: string
  fromDate: string
  toDate: string
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  preparingOrders: number
  readyOrders: number
  ordersByStatus: Record<string, number>
  ordersByType: Record<string, number>
}

export interface KitchenNotification {
  id: number
  title?: string
  message?: string
  read?: boolean
  createdAt?: string
}

export interface KitchenNotificationsResponse {
  notifications: KitchenNotification[]
  unreadCount: number
}

const todayIso = () => new Date().toISOString().slice(0, 10)
const monthAgoIso = () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

export async function fetchKitchenDashboard(params: {
  fromDate?: string
  toDate?: string
} = {}): Promise<KitchenDashboard | null> {
  try {
    const r = await apiClient.get('/api/kitchen/dashboard/summary', {
      params: {
        fromDate: params.fromDate ?? monthAgoIso(),
        toDate: params.toDate ?? todayIso(),
      },
    })
    return unwrap<KitchenDashboard>(r, 'data.data')
  } catch {
    return null
  }
}

export async function fetchKitchenHistory(params: { page?: number; pageSize?: number; status?: string } = {}): Promise<KitchenPaged> {
  try {
    const r = await apiClient.get('/api/kitchen/orders/history', {
      params: { page: 1, pageSize: 25, ...params },
    })
    return (
      unwrap<KitchenPaged>(r, 'data.data') ?? {
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

export async function fetchKitchenNotifications(): Promise<KitchenNotificationsResponse> {
  try {
    const r = await apiClient.get('/api/kitchen/notifications')
    return unwrap<KitchenNotificationsResponse>(r, 'data.data') ?? { notifications: [], unreadCount: 0 }
  } catch {
    return { notifications: [], unreadCount: 0 }
  }
}

export async function advanceKitchenStatus(orderId: number, newStatus: string): Promise<boolean> {
  try {
    const r = await apiClient.post('/api/kitchen/orders/update_status', { orderId, status: newStatus })
    return r.data?.Status === 'SUCCESS'
  } catch {
    return false
  }
}
