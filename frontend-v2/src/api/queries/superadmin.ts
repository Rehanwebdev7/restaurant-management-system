/**
 * Superadmin TanStack Query hooks — one per service function.
 * Dashboards refresh every 30 s; list queries use staleTime for snappy navigation.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchSuperadminDashboard,
  fetchSuperadminUsers,
  fetchSuperadminCustomers,
  fetchSuperadminBranches,
  fetchSuperadminPlans,
  fetchSuperadminSubscriptions,
  fetchSuperadminUserApprovals,
  fetchSuperadminPaymentGateways,
  fetchSuperadminNotifications,
  fetchSuperadminAuditLogs,
  updateUserApproval,
} from '@/api/services/superadmin'

const k = (...parts: unknown[]) => ['superadmin', ...parts] as const

export const useSuperadminDashboard = (opts: { fromDate?: string; toDate?: string } = {}) =>
  useQuery({
    queryKey: k('dashboard', opts),
    queryFn: () => fetchSuperadminDashboard(opts),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })

export const useSuperadminUsers = () =>
  useQuery({ queryKey: k('users'), queryFn: fetchSuperadminUsers, staleTime: 60_000 })

export const useSuperadminCustomers = () =>
  useQuery({ queryKey: k('customers'), queryFn: fetchSuperadminCustomers, staleTime: 60_000 })

export const useSuperadminRestaurants = () =>
  useQuery({ queryKey: k('restaurants'), queryFn: fetchSuperadminBranches, staleTime: 60_000 })

export const useSuperadminPlans = () =>
  useQuery({ queryKey: k('plans'), queryFn: () => fetchSuperadminPlans(), staleTime: 5 * 60_000 })

export const useSuperadminSubscriptions = () =>
  useQuery({
    queryKey: k('subscriptions'),
    queryFn: () => fetchSuperadminSubscriptions(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })

export const useSuperadminUserApprovals = (approvalStatus = 'PENDING') =>
  useQuery({
    queryKey: k('user-approvals', approvalStatus),
    queryFn: () => fetchSuperadminUserApprovals({ approvalStatus }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })

export const useSuperadminPaymentGateways = () =>
  useQuery({
    queryKey: k('payment-gateways'),
    queryFn: fetchSuperadminPaymentGateways,
    staleTime: 5 * 60_000,
  })

export const useSuperadminNotifications = () =>
  useQuery({
    queryKey: k('notifications'),
    queryFn: fetchSuperadminNotifications,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })

export const useSuperadminAuditLogs = () =>
  useQuery({
    queryKey: k('audit-logs'),
    queryFn: fetchSuperadminAuditLogs,
    staleTime: 60_000,
  })

export function useUpdateUserApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; approvalStatus: 'APPROVED' | 'REJECTED'; approvalNotes?: string }) =>
      updateUserApproval(vars.id, { approvalStatus: vars.approvalStatus, approvalNotes: vars.approvalNotes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin'] })
    },
  })
}
