import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchCashierDashboard,
  fetchCashierOrders,
  fetchCashierMenuItems,
  fetchCashierMenuCategories,
  fetchCashierCustomers,
  fetchCashierTables,
  fetchCashierSections,
  createCashierOrder,
  createCashierCustomer,
  fetchCashierOrderById,
  fetchCashierCoupons,
  fetchCashierWalletTopupHistory,
  markCashierOrderPaid,
  cancelCashierOrder,
  refundCashierOrder,
  addCashierCoupon,
  updateCashierCoupon,
  deleteCashierCoupon,
  type CashierMenuItem,
  type CashierCouponInput,
} from '@/api/services/cashier'

const todayIso = () => new Date().toISOString().slice(0, 10)
const monthAgoIso = () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

export function useCashierDashboard(opts: { fromDate?: string; toDate?: string } = {}) {
  return useQuery({
    queryKey: ['cashier', 'dashboard', opts],
    queryFn: () =>
      fetchCashierDashboard({ fromDate: opts.fromDate ?? monthAgoIso(), toDate: opts.toDate ?? todayIso() }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}

export function useCashierOrders(
  params: { page?: number; pageSize?: number; status?: string; orderType?: string; orderNumber?: string; fromDate?: string; toDate?: string } = {}
) {
  return useQuery({
    queryKey: ['cashier', 'orders', params],
    queryFn: () => fetchCashierOrders(params),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}

export function useCashierMenu() {
  return useQuery({
    queryKey: ['cashier', 'menu', 'items'],
    queryFn: fetchCashierMenuItems,
    staleTime: 5 * 60_000,
  })
}

export function useCashierMenuCategories() {
  return useQuery({
    queryKey: ['cashier', 'menu', 'categories'],
    queryFn: fetchCashierMenuCategories,
    staleTime: 5 * 60_000,
  })
}

export function useCashierCustomers() {
  return useQuery({
    queryKey: ['cashier', 'customers'],
    queryFn: fetchCashierCustomers,
    staleTime: 60_000,
  })
}

export function useCashierTables() {
  return useQuery({
    queryKey: ['cashier', 'tables'],
    queryFn: fetchCashierTables,
    staleTime: 60_000,
  })
}

export function useCashierSections() {
  return useQuery({
    queryKey: ['cashier', 'sections'],
    queryFn: fetchCashierSections,
    staleTime: 5 * 60_000,
  })
}

export function useCreateCashierOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCashierOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cashier', 'orders'] })
      qc.invalidateQueries({ queryKey: ['cashier', 'dashboard'] })
    },
  })
}

export function useCreateCashierCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCashierCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashier', 'customers'] }),
  })
}

/** Convenience: pick the right price field from menu item shape variations. */
export function menuItemPrice(item: CashierMenuItem): number {
  return Number(item.price ?? item.itemPrice ?? item.basePrice ?? 0)
}

/* ---------- 2026-06-24 — sub-page hooks ---------- */

export function useCashierOrder(id: number | null | undefined) {
  return useQuery({
    queryKey: ['cashier', 'order', id],
    queryFn: () => fetchCashierOrderById(Number(id)),
    enabled: typeof id === 'number' && id > 0,
    staleTime: 30_000,
  })
}

export function useCashierCoupons() {
  return useQuery({
    queryKey: ['cashier', 'coupons'],
    queryFn: fetchCashierCoupons,
    staleTime: 5 * 60_000,
  })
}

export function useCashierWalletTopupHistory() {
  return useQuery({
    queryKey: ['cashier', 'wallet-topup', 'history'],
    queryFn: fetchCashierWalletTopupHistory,
    staleTime: 60_000,
  })
}

export function useMarkCashierOrderPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markCashierOrderPaid(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['cashier', 'orders'] })
      qc.invalidateQueries({ queryKey: ['cashier', 'order', id] })
    },
  })
}

export function useCancelCashierOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => cancelCashierOrder(id, reason),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['cashier', 'orders'] })
      qc.invalidateQueries({ queryKey: ['cashier', 'order', vars.id] })
    },
  })
}

export function useRefundCashierOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount, reason }: { id: number; amount: number; reason: string }) =>
      refundCashierOrder(id, amount, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cashier', 'orders'] })
    },
  })
}

/* 2026-06-24 — Cashier coupon CRUD hooks */
export function useAddCashierCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CashierCouponInput) => addCashierCoupon(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashier', 'coupons'] }),
  })
}
export function useUpdateCashierCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CashierCouponInput }) => updateCashierCoupon(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashier', 'coupons'] }),
  })
}
export function useDeleteCashierCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCashierCoupon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashier', 'coupons'] }),
  })
}
