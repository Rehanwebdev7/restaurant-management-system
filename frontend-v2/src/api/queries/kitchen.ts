import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchKitchenDashboard, fetchKitchenHistory, fetchKitchenNotifications, advanceKitchenStatus,
} from '@/api/services/kitchen'

export function useKitchenDashboard(opts: { fromDate?: string; toDate?: string } = {}) {
  return useQuery({
    queryKey: ['kitchen', 'dashboard', opts],
    queryFn: () => fetchKitchenDashboard(opts),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  })
}

export function useKitchenHistory(params: { page?: number; pageSize?: number; status?: string } = {}) {
  return useQuery({
    queryKey: ['kitchen', 'history', params],
    queryFn: () => fetchKitchenHistory(params),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  })
}

export function useKitchenNotifications() {
  return useQuery({
    queryKey: ['kitchen', 'notifications'],
    queryFn: fetchKitchenNotifications,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  })
}

export function useAdvanceKitchenStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: number; newStatus: string }) =>
      advanceKitchenStatus(orderId, newStatus),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kitchen'] })
    },
  })
}

// Legacy hook name for backward compat with KitchenDashboard.tsx
export const useKitchenOrders = useKitchenHistory
