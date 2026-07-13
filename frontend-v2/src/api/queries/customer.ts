import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCustomerMenuItems,
  fetchCustomerCategories,
  fetchCustomerBranches,
  fetchCustomerSliders,
  fetchCustomerBranding,
  fetchCustomerGallery,
  customerSendOtp,
  customerVerifyOtp,
  customerLoginPassword,
  placeCustomerOrder,
  fetchCustomerOrders,
  type PlaceOrderInput,
  type CustomerGalleryImage,
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

/**
 * Gallery for the resolved tenant. Auto-derives `restaurantId` from the
 * first known branch — consumers just pass an optional category filter.
 *
 * `category` filters client-side (case-insensitive substring against
 * RestaurantGalleryEntity.category — backend stores free-form uppercased
 * strings, no enum). If the filter matches zero rows, returns all rows
 * (avoids empty sections when a tenant hasn't tagged categories).
 */
export function useCustomerGallery(category?: string) {
  const branchesQ = useCustomerBranches()
  const restaurantId = branchesQ.data?.find(
    (b) => b.restaurantId != null,
  )?.restaurantId
  const q = useQuery({
    queryKey: ['customer', 'gallery', restaurantId ?? 'unset'],
    queryFn: () =>
      restaurantId ? fetchCustomerGallery(restaurantId) : Promise.resolve([]),
    enabled: restaurantId != null && restaurantId > 0,
    staleTime: 5 * 60_000,
  })
  const all: CustomerGalleryImage[] = q.data ?? []
  const filtered = useMemo(() => {
    if (!category) return all
    const needle = category.toLowerCase()
    const hits = all.filter((g) =>
      (g.category ?? '').toLowerCase().includes(needle),
    )
    return hits.length > 0 ? hits : all
  }, [all, category])
  return { ...q, all, filtered }
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
