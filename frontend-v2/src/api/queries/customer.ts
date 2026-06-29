import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCustomerMenuItems,
  fetchCustomerCategories,
  fetchCustomerBranches,
  fetchCustomerSliders,
  fetchCustomerBranding,
  customerSendOtp,
  customerVerifyOtp,
  customerLoginPassword,
  placeCustomerOrder,
  fetchCustomerOrders,
  type PlaceOrderInput,
} from '@/api/services/customer'

/**
 * TanStack Query hooks for the customer-facing surface. Each read query
 * returns an empty array / null when the backend route is unavailable so
 * pages can fall back to sample data without changing their render path.
 */

export function useCustomerMenuItems(branchId: number | null | undefined) {
  return useQuery({
    queryKey: ['customer', 'menu', branchId ?? 'unset'],
    queryFn: () => (branchId ? fetchCustomerMenuItems(branchId) : Promise.resolve([])),
    // branchId 0 is the "not selected yet" sentinel — skip the fetch
    enabled: branchId != null && branchId > 0,
    staleTime: 60_000,
  })
}

export function useCustomerCategories(branchId: number | null | undefined) {
  return useQuery({
    queryKey: ['customer', 'categories', branchId ?? 'unset'],
    queryFn: () => (branchId ? fetchCustomerCategories(branchId) : Promise.resolve([])),
    enabled: branchId != null && branchId > 0,
    staleTime: 5 * 60_000,
  })
}

export function useCustomerBranches(restaurantId?: number) {
  return useQuery({
    queryKey: ['customer', 'branches', restaurantId ?? 'host-resolved'],
    queryFn: () => fetchCustomerBranches(restaurantId),
    staleTime: 5 * 60_000,
  })
}

export function useCustomerSliders(branchId?: number) {
  return useQuery({
    queryKey: ['customer', 'sliders', branchId ?? 'all'],
    queryFn: () => fetchCustomerSliders(branchId),
    staleTime: 5 * 60_000,
  })
}

export function useCustomerBranding() {
  return useQuery({
    queryKey: ['customer', 'branding'],
    queryFn: fetchCustomerBranding,
    staleTime: 10 * 60_000,
  })
}

export function useCustomerOrders() {
  return useQuery({
    queryKey: ['customer', 'orders'],
    queryFn: fetchCustomerOrders,
    staleTime: 30_000,
  })
}

export function useCustomerSendOtp() {
  return useMutation({ mutationFn: (mobile: string) => customerSendOtp(mobile) })
}

export function useCustomerVerifyOtp() {
  return useMutation({
    mutationFn: ({ mobile, otp }: { mobile: string; otp: string }) => customerVerifyOtp(mobile, otp),
  })
}

export function useCustomerPasswordLogin() {
  return useMutation({
    mutationFn: ({ mobile, password }: { mobile: string; password: string }) =>
      customerLoginPassword(mobile, password),
  })
}

export function usePlaceCustomerOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PlaceOrderInput) => placeCustomerOrder(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customer', 'orders'] })
    },
  })
}
