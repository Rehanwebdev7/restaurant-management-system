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
  fetchCustomerOrderDetail,
  cancelCustomerOrder,
  fetchCustomerNotifications,
  fetchUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  fetchAvailableCoupons,
  applyCoupon,
  fetchWalletBalance,
  fetchWithdrawalHistory,
  fetchWalletTransactions,
  requestWalletWithdrawal,
  fetchReferralCode,
  fetchReferralStats,
  fetchReferralUsers,
  fetchReferralContacts,
  applyReferralCode,
  fetchStates,
  fetchCities,
  fetchPincodes,
  fetchRestaurantSections,
  fetchDiningTables,
  checkTableAvailability,
  fetchReservationConfig,
  fetchRestaurantHours,
  createStripePaymentIntent,
  confirmStripePayment,
  createPayPalOrder,
  capturePayPalOrder,
  createCCAvenueRequest,
  submitDishRating,
  fetchDishRatingSummary,
  fetchDishReviews,
  registerDeviceToken,
  unregisterDeviceToken,
  fetchCustomerContent,
  type PlaceOrderInput,
  type CustomerGalleryImage,
  type AvailableCouponsInput,
  type ApplyCouponInput,
  type WithdrawalRequestInput,
  type StripeIntentInput,
} from '@/api/services/customer'
import { tokens } from '@/lib/auth/tokens'

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
    queryFn: () => fetchCustomerOrders(),
    enabled: Boolean(tokens.getCustomer()),
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

/* ========== BATCH 1 — Order tracking + Notifications + Coupons ========== */

/**
 * Live-poll a single order's status. Uses `/api/customer/orders/{id}` (already
 * returns status field). Polls every 15s while status is not a terminal state
 * (DELIVERED/CANCELLED/COMPLETED); stops otherwise to save network. Skipped
 * entirely when no customer token or non-numeric id (falls back to synthesized
 * demo data in the page).
 */
const TERMINAL_STATUSES = new Set(['DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED', 'REJECTED'])

export function useOrderTracking(orderId: number | string | null | undefined) {
  const isNumeric = typeof orderId === 'number' || (typeof orderId === 'string' && /^\d+$/.test(orderId))
  const enabled = isNumeric && Boolean(tokens.getCustomer())
  return useQuery({
    queryKey: ['customer', 'order-track', orderId ?? 'unset'],
    queryFn: async () => {
      const res = await fetchCustomerOrderDetail(orderId as number | string)
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
    enabled,
    refetchInterval: (query) => {
      const status = (query.state.data?.status ?? '').toUpperCase()
      if (TERMINAL_STATUSES.has(status)) return false
      return 15_000
    },
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  })
}

export function useCancelCustomerOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number | string; reason?: string }) =>
      cancelCustomerOrder(orderId, reason),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ['customer', 'order-track', vars.orderId] })
      void qc.invalidateQueries({ queryKey: ['customer', 'orders'] })
    },
  })
}

/**
 * Notifications list. Only fires when a customer is signed in.
 * Pagination server-side; caller passes page number.
 */
export function useCustomerNotifications(pageNumber = 0, pageSize = 20) {
  return useQuery({
    queryKey: ['customer', 'notifications', pageNumber, pageSize],
    queryFn: () => fetchCustomerNotifications(pageNumber, pageSize),
    enabled: Boolean(tokens.getCustomer()),
    staleTime: 30_000,
  })
}

/**
 * Unread notifications count for the header bell badge. Polls every 60s so
 * badge updates without needing a full notifications refetch. Skipped when
 * not signed in — header just shows plain bell (no badge).
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['customer', 'notifications', 'unread-count'],
    queryFn: fetchUnreadNotificationCount,
    enabled: Boolean(tokens.getCustomer()),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customer', 'notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customer', 'notifications'] })
    },
  })
}

/**
 * Available coupons for a branch + order amount. Buckets: Global / Suggested
 * / FirstOrder. Only fires when the caller passes a non-zero branchId +
 * orderAmount (checkout typically has both).
 */
export function useAvailableCoupons(input: AvailableCouponsInput, enabled = true) {
  return useQuery({
    queryKey: ['customer', 'coupons', 'available', input.branchId ?? 'unset', input.orderAmount ?? 0, input.orderType ?? 'any'],
    queryFn: () => fetchAvailableCoupons(input),
    enabled: enabled && Boolean(tokens.getCustomer()) && Boolean(input.branchId) && (input.orderAmount ?? 0) > 0,
    staleTime: 60_000,
  })
}

export function useApplyCoupon() {
  return useMutation({
    mutationFn: (input: ApplyCouponInput) => applyCoupon(input),
  })
}

/* ========== BATCH 2 — Wallet + Referral ========== */

export function useWalletBalance() {
  return useQuery({
    queryKey: ['customer', 'wallet', 'balance'],
    queryFn: fetchWalletBalance,
    enabled: Boolean(tokens.getCustomer()),
    staleTime: 30_000,
  })
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: ['customer', 'wallet', 'transactions'],
    queryFn: fetchWalletTransactions,
    enabled: Boolean(tokens.getCustomer()),
    staleTime: 60_000,
  })
}

export function useWithdrawalHistory(pageNumber = 0, pageSize = 20) {
  return useQuery({
    queryKey: ['customer', 'wallet', 'withdrawals', pageNumber, pageSize],
    queryFn: () => fetchWithdrawalHistory(pageNumber, pageSize),
    enabled: Boolean(tokens.getCustomer()),
    staleTime: 60_000,
  })
}

export function useRequestWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: WithdrawalRequestInput) => requestWalletWithdrawal(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customer', 'wallet'] })
    },
  })
}

export function useReferralCode() {
  return useQuery({
    queryKey: ['customer', 'referral', 'code'],
    queryFn: fetchReferralCode,
    enabled: Boolean(tokens.getCustomer()),
    staleTime: 5 * 60_000,
  })
}

export function useReferralStats() {
  return useQuery({
    queryKey: ['customer', 'referral', 'stats'],
    queryFn: fetchReferralStats,
    enabled: Boolean(tokens.getCustomer()),
    staleTime: 60_000,
  })
}

export function useReferralUsers() {
  return useQuery({
    queryKey: ['customer', 'referral', 'users'],
    queryFn: fetchReferralUsers,
    enabled: Boolean(tokens.getCustomer()),
    staleTime: 60_000,
  })
}

export function useReferralContacts() {
  return useQuery({
    queryKey: ['customer', 'referral', 'contacts'],
    queryFn: fetchReferralContacts,
    enabled: Boolean(tokens.getCustomer()),
    staleTime: 5 * 60_000,
  })
}

export function useApplyReferralCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => applyReferralCode(code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customer', 'referral'] })
    },
  })
}

/* ========== BATCH 3 — Address dropdowns + Dine-in ========== */

export function useStates() {
  return useQuery({
    queryKey: ['customer', 'lookup', 'states'],
    queryFn: fetchStates,
    staleTime: 10 * 60_000,
  })
}
export function useCities(stateId: number | null | undefined) {
  return useQuery({
    queryKey: ['customer', 'lookup', 'cities', stateId ?? 'all'],
    queryFn: () => fetchCities(stateId ?? undefined),
    staleTime: 10 * 60_000,
  })
}
export function usePincodes(cityId: number | null | undefined) {
  return useQuery({
    queryKey: ['customer', 'lookup', 'pincodes', cityId ?? 'all'],
    queryFn: () => fetchPincodes(cityId ?? undefined),
    staleTime: 10 * 60_000,
  })
}

export function useRestaurantSections() {
  return useQuery({
    queryKey: ['customer', 'sections'],
    queryFn: fetchRestaurantSections,
    staleTime: 5 * 60_000,
  })
}
export function useDiningTables() {
  return useQuery({
    queryKey: ['customer', 'dining-tables'],
    queryFn: fetchDiningTables,
    staleTime: 60_000,
  })
}
export function useCheckTableAvailability() {
  return useMutation({
    mutationFn: ({ tableId, bookingDate, bookingTime }: { tableId: number; bookingDate: string; bookingTime?: string }) =>
      checkTableAvailability(tableId, bookingDate, bookingTime),
  })
}
export function useReservationConfig(branchId: number | null | undefined) {
  return useQuery({
    queryKey: ['customer', 'reservation-config', branchId ?? 'unset'],
    queryFn: () => fetchReservationConfig(branchId as number),
    enabled: branchId != null && branchId > 0,
    staleTime: 5 * 60_000,
  })
}

/* ========== BATCH 4 — Payments + Restaurant hours ========== */

export function useRestaurantHours() {
  return useQuery({
    queryKey: ['customer', 'restaurant-hours'],
    queryFn: fetchRestaurantHours,
    staleTime: 5 * 60_000,
  })
}

export function useCreateStripeIntent() {
  return useMutation({
    mutationFn: (input: StripeIntentInput) => createStripePaymentIntent(input),
  })
}
export function useConfirmStripePayment() {
  return useMutation({
    mutationFn: ({ paymentIntentId, orderId }: { paymentIntentId: string; orderId?: number }) =>
      confirmStripePayment(paymentIntentId, orderId),
  })
}
export function useCreatePayPalOrder() {
  return useMutation({
    mutationFn: ({ amount, orderId, currency }: { amount: number; orderId?: number; currency?: string }) =>
      createPayPalOrder(amount, orderId, currency),
  })
}
export function useCapturePayPalOrder() {
  return useMutation({
    mutationFn: ({ paypalOrderId, orderId }: { paypalOrderId: string; orderId?: number }) =>
      capturePayPalOrder(paypalOrderId, orderId),
  })
}
export function useCreateCCAvenueRequest() {
  return useMutation({
    mutationFn: ({ amount, orderId, currency }: { amount: number; orderId: number; currency?: string }) =>
      createCCAvenueRequest(amount, orderId, currency),
  })
}

/* ========== BATCH 5 — Reviews + FCM Push ========== */

export function useDishRatingSummary(menuItemId: number | null | undefined) {
  return useQuery({
    queryKey: ['customer', 'dish-rating', menuItemId ?? 'unset'],
    queryFn: () => fetchDishRatingSummary(menuItemId as number),
    enabled: menuItemId != null && menuItemId > 0,
    staleTime: 60_000,
  })
}

export function useDishReviews(menuItemId: number | null | undefined) {
  return useQuery({
    queryKey: ['customer', 'dish-reviews', menuItemId ?? 'unset'],
    queryFn: () => fetchDishReviews(menuItemId as number),
    enabled: menuItemId != null && menuItemId > 0,
    staleTime: 60_000,
  })
}

export function useSubmitDishRating() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ menuItemId, rating }: { menuItemId: number; rating: number }) =>
      submitDishRating(menuItemId, rating),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ['customer', 'dish-rating', vars.menuItemId] })
      void qc.invalidateQueries({ queryKey: ['customer', 'dish-reviews', vars.menuItemId] })
    },
  })
}

export function useRegisterDeviceToken() {
  return useMutation({
    mutationFn: ({ fcmToken, platform }: { fcmToken: string; platform?: string }) =>
      registerDeviceToken(fcmToken, platform),
  })
}

export function useUnregisterDeviceToken() {
  return useMutation({
    mutationFn: (tokenId: number) => unregisterDeviceToken(tokenId),
  })
}

/* ========== CONTENT BLOCKS — dummy → real refactor ========== */

/**
 * Generic content-blocks hook. Fetches all blocks for `page` (optionally
 * filtered by `sectionType`) for the current tenant (resolved by backend
 * from Host header). Public — no auth required.
 */
export function useCustomerContent(page: string, sectionType?: string) {
  return useQuery({
    queryKey: ['customer', 'content', page, sectionType ?? 'all'],
    queryFn: () => fetchCustomerContent(page, sectionType),
    staleTime: 5 * 60_000,
  })
}

/* Typed thin wrappers — one line each, all call the generic hook. Keeps
 * consumer code readable ("useHomeTestimonials()" reads better than
 * "useCustomerContent('HOME', 'TESTIMONIAL')") without adding new logic. */
export const useHomeTestimonials      = () => useCustomerContent('HOME', 'TESTIMONIAL')
export const useHomeStats             = () => useCustomerContent('HOME', 'STAT')
export const useHomeWhyDine           = () => useCustomerContent('HOME', 'WHY_DINE')
export const useHomeInstagram         = () => useCustomerContent('HOME', 'INSTAGRAM_POST')
export const useLocationsFacilities   = () => useCustomerContent('LOCATIONS', 'FACILITY')
export const useLocationsEvents       = () => useCustomerContent('LOCATIONS', 'EVENT_PACKAGE')
export const useLocationsAwards       = () => useCustomerContent('LOCATIONS', 'AWARD')
export const useLocationsReach        = () => useCustomerContent('LOCATIONS', 'REACH_INFO')
export const useContactFaqs           = () => useCustomerContent('CONTACT', 'FAQ')
export const useContactDepartments    = () => useCustomerContent('CONTACT', 'DEPARTMENT')
export const useContactHelpCategories = () => useCustomerContent('CONTACT', 'HELP_CATEGORY')
export const useContactHoursNotes     = () => useCustomerContent('CONTACT', 'HOURS_NOTE')
export const useAboutTeam             = () => useCustomerContent('ABOUT', 'TEAM_MEMBER')
