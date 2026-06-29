import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchRestaurantDashboard, fetchRestaurantMenuItems, fetchRestaurantCategories,
  fetchRestaurantUsers, fetchRestaurantCustomers, fetchRestaurantPaymentGateways,
  fetchRestaurantSliders, fetchRestaurantBankDetails, fetchRestaurantSections, fetchRestaurantTables,
  fetchRestaurantSubcategories, fetchRestaurantDeliveryZones, fetchRestaurantAddonGroups,
  fetchRestaurantAddonItems, fetchRestaurantHours, fetchRestaurantCoupons, fetchRestaurantGallery,
  fetchRestaurantOrders, fetchRestaurantBranding, updateRestaurantBranding,
  fetchRestaurantOutstanding,
  addRestaurantMenuItemsBulk,
  addRestaurantCategory, updateRestaurantCategory, deleteRestaurantCategory,
  addRestaurantSubcategory, updateRestaurantSubcategory, deleteRestaurantSubcategory,
  addRestaurantSection, updateRestaurantSection, deleteRestaurantSection,
  addRestaurantTable, updateRestaurantTable, deleteRestaurantTable,
  addRestaurantDeliveryZone, updateRestaurantDeliveryZone, deleteRestaurantDeliveryZone,
  addRestaurantAddonGroup, updateRestaurantAddonGroup, deleteRestaurantAddonGroup,
  addRestaurantAddonItem, updateRestaurantAddonItem, deleteRestaurantAddonItem,
  updateRestaurantHour,
  addRestaurantCoupon, updateRestaurantCoupon, deleteRestaurantCoupon,
  addRestaurantMenuItem, updateRestaurantMenuItem, deleteRestaurantMenuItem,
  addRestaurantUser, updateRestaurantUser, deleteRestaurantUser,
  addRestaurantCustomer, updateRestaurantCustomer, toggleRestaurantCustomerActive,
  addRestaurantPaymentGateway, updateRestaurantPaymentGateway, toggleRestaurantPaymentGatewayStatus,
  addRestaurantSlider, updateRestaurantSlider, deleteRestaurantSlider,
  addRestaurantBankDetail, updateRestaurantBankDetail, deleteRestaurantBankDetail,
  type CategoryInput, type SubcategoryInput, type SectionInput, type TableInput,
  type DeliveryZoneInput, type AddonGroupInput, type AddonItemInput, type HourInput,
  type CouponInput, type MenuItemInput, type UserInput, type CustomerInput, type PaymentGatewayInput,
  type RestaurantBranding, type BulkMenuItemInput,
  type SliderInput, type BankDetailInput,
} from '@/api/services/restaurant'

const k = (...parts: unknown[]) => ['restaurant', ...parts] as const

export const useRestaurantDashboard = (opts: { fromDate?: string; toDate?: string } = {}) =>
  useQuery({ queryKey: k('dashboard', opts), queryFn: () => fetchRestaurantDashboard(opts), refetchInterval: 30_000 })

export const useRestaurantMenuItems = () =>
  useQuery({ queryKey: k('menu-items'), queryFn: fetchRestaurantMenuItems, staleTime: 5 * 60_000 })

export const useRestaurantCategories = () =>
  useQuery({ queryKey: k('categories'), queryFn: fetchRestaurantCategories, staleTime: 5 * 60_000 })

export const useRestaurantUsers = () =>
  useQuery({ queryKey: k('users'), queryFn: fetchRestaurantUsers, staleTime: 60_000 })

export const useRestaurantCustomers = () =>
  useQuery({ queryKey: k('customers'), queryFn: fetchRestaurantCustomers, staleTime: 60_000 })

export const useRestaurantPaymentGateways = () =>
  useQuery({ queryKey: k('payment-gateways'), queryFn: fetchRestaurantPaymentGateways, staleTime: 5 * 60_000 })

export const useRestaurantSliders = () =>
  useQuery({ queryKey: k('sliders'), queryFn: fetchRestaurantSliders, staleTime: 60_000 })

export const useRestaurantBankDetails = () =>
  useQuery({ queryKey: k('bank-details'), queryFn: fetchRestaurantBankDetails, staleTime: 60_000 })

export const useRestaurantSections = () =>
  useQuery({ queryKey: k('sections'), queryFn: fetchRestaurantSections, staleTime: 5 * 60_000 })

export const useRestaurantTables = () =>
  useQuery({ queryKey: k('tables'), queryFn: fetchRestaurantTables, staleTime: 60_000 })

export const useRestaurantSubcategories = () =>
  useQuery({ queryKey: k('subcategories'), queryFn: fetchRestaurantSubcategories, staleTime: 5 * 60_000 })

export const useRestaurantDeliveryZones = () =>
  useQuery({ queryKey: k('delivery-zones'), queryFn: fetchRestaurantDeliveryZones, staleTime: 5 * 60_000 })

export const useRestaurantAddonGroups = () =>
  useQuery({ queryKey: k('addon-groups'), queryFn: fetchRestaurantAddonGroups, staleTime: 5 * 60_000 })

export const useRestaurantAddonItems = () =>
  useQuery({ queryKey: k('addon-items'), queryFn: fetchRestaurantAddonItems, staleTime: 5 * 60_000 })

export const useRestaurantHours = () =>
  useQuery({ queryKey: k('hours'), queryFn: fetchRestaurantHours, staleTime: 5 * 60_000 })

export const useRestaurantCoupons = () =>
  useQuery({ queryKey: k('coupons'), queryFn: fetchRestaurantCoupons, staleTime: 60_000 })

export const useRestaurantGallery = () =>
  useQuery({ queryKey: k('gallery'), queryFn: fetchRestaurantGallery, staleTime: 60_000 })

/* ------------------------------------------------------------------ */
/* 2026-06-24 — Mutation hooks. Each invalidates its list query.       */
/* ------------------------------------------------------------------ */

function useInvalidator(...keys: readonly (readonly unknown[])[]) {
  const qc = useQueryClient()
  return () => keys.forEach((kk) => qc.invalidateQueries({ queryKey: kk as unknown[] }))
}

/* Categories */
export const useAddRestaurantCategory = () => {
  const inv = useInvalidator(k('categories'))
  return useMutation({ mutationFn: (i: CategoryInput) => addRestaurantCategory(i), onSuccess: inv })
}
export const useUpdateRestaurantCategory = () => {
  const inv = useInvalidator(k('categories'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: CategoryInput }) => updateRestaurantCategory(id, input), onSuccess: inv })
}
export const useDeleteRestaurantCategory = () => {
  const inv = useInvalidator(k('categories'))
  return useMutation({ mutationFn: (id: number) => deleteRestaurantCategory(id), onSuccess: inv })
}

/* Subcategories */
export const useAddRestaurantSubcategory = () => {
  const inv = useInvalidator(k('subcategories'))
  return useMutation({ mutationFn: (i: SubcategoryInput) => addRestaurantSubcategory(i), onSuccess: inv })
}
export const useUpdateRestaurantSubcategory = () => {
  const inv = useInvalidator(k('subcategories'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: SubcategoryInput }) => updateRestaurantSubcategory(id, input), onSuccess: inv })
}
export const useDeleteRestaurantSubcategory = () => {
  const inv = useInvalidator(k('subcategories'))
  return useMutation({ mutationFn: (id: number) => deleteRestaurantSubcategory(id), onSuccess: inv })
}

/* Sections */
export const useAddRestaurantSection = () => {
  const inv = useInvalidator(k('sections'))
  return useMutation({ mutationFn: (i: SectionInput) => addRestaurantSection(i), onSuccess: inv })
}
export const useUpdateRestaurantSection = () => {
  const inv = useInvalidator(k('sections'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: SectionInput }) => updateRestaurantSection(id, input), onSuccess: inv })
}
export const useDeleteRestaurantSection = () => {
  const inv = useInvalidator(k('sections'))
  return useMutation({ mutationFn: (id: number) => deleteRestaurantSection(id), onSuccess: inv })
}

/* Tables */
export const useAddRestaurantTable = () => {
  const inv = useInvalidator(k('tables'))
  return useMutation({ mutationFn: (i: TableInput) => addRestaurantTable(i), onSuccess: inv })
}
export const useUpdateRestaurantTable = () => {
  const inv = useInvalidator(k('tables'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: TableInput }) => updateRestaurantTable(id, input), onSuccess: inv })
}
export const useDeleteRestaurantTable = () => {
  const inv = useInvalidator(k('tables'))
  return useMutation({ mutationFn: (id: number) => deleteRestaurantTable(id), onSuccess: inv })
}

/* Delivery zones */
export const useAddRestaurantDeliveryZone = () => {
  const inv = useInvalidator(k('delivery-zones'))
  return useMutation({ mutationFn: (i: DeliveryZoneInput) => addRestaurantDeliveryZone(i), onSuccess: inv })
}
export const useUpdateRestaurantDeliveryZone = () => {
  const inv = useInvalidator(k('delivery-zones'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: DeliveryZoneInput }) => updateRestaurantDeliveryZone(id, input), onSuccess: inv })
}
export const useDeleteRestaurantDeliveryZone = () => {
  const inv = useInvalidator(k('delivery-zones'))
  return useMutation({ mutationFn: (id: number) => deleteRestaurantDeliveryZone(id), onSuccess: inv })
}

/* Addon groups */
export const useAddRestaurantAddonGroup = () => {
  const inv = useInvalidator(k('addon-groups'))
  return useMutation({ mutationFn: (i: AddonGroupInput) => addRestaurantAddonGroup(i), onSuccess: inv })
}
export const useUpdateRestaurantAddonGroup = () => {
  const inv = useInvalidator(k('addon-groups'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: AddonGroupInput }) => updateRestaurantAddonGroup(id, input), onSuccess: inv })
}
export const useDeleteRestaurantAddonGroup = () => {
  const inv = useInvalidator(k('addon-groups'))
  return useMutation({ mutationFn: (id: number) => deleteRestaurantAddonGroup(id), onSuccess: inv })
}

/* Addon items */
export const useAddRestaurantAddonItem = () => {
  const inv = useInvalidator(k('addon-items'))
  return useMutation({ mutationFn: (i: AddonItemInput) => addRestaurantAddonItem(i), onSuccess: inv })
}
export const useUpdateRestaurantAddonItem = () => {
  const inv = useInvalidator(k('addon-items'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: AddonItemInput }) => updateRestaurantAddonItem(id, input), onSuccess: inv })
}
export const useDeleteRestaurantAddonItem = () => {
  const inv = useInvalidator(k('addon-items'))
  return useMutation({ mutationFn: (id: number) => deleteRestaurantAddonItem(id), onSuccess: inv })
}

/* Hours */
export const useUpdateRestaurantHour = () => {
  const inv = useInvalidator(k('hours'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: HourInput }) => updateRestaurantHour(id, input), onSuccess: inv })
}

/* Coupons */
export const useAddRestaurantCoupon = () => {
  const inv = useInvalidator(k('coupons'))
  return useMutation({ mutationFn: (i: CouponInput) => addRestaurantCoupon(i), onSuccess: inv })
}
export const useUpdateRestaurantCoupon = () => {
  const inv = useInvalidator(k('coupons'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: CouponInput }) => updateRestaurantCoupon(id, input), onSuccess: inv })
}
export const useDeleteRestaurantCoupon = () => {
  const inv = useInvalidator(k('coupons'))
  return useMutation({ mutationFn: (id: number) => deleteRestaurantCoupon(id), onSuccess: inv })
}

/* Menu items */
export const useAddRestaurantMenuItem = () => {
  const inv = useInvalidator(k('menu-items'))
  return useMutation({ mutationFn: (i: MenuItemInput) => addRestaurantMenuItem(i), onSuccess: inv })
}
export const useUpdateRestaurantMenuItem = () => {
  const inv = useInvalidator(k('menu-items'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: MenuItemInput }) => updateRestaurantMenuItem(id, input), onSuccess: inv })
}
export const useDeleteRestaurantMenuItem = () => {
  const inv = useInvalidator(k('menu-items'))
  return useMutation({ mutationFn: (id: number) => deleteRestaurantMenuItem(id), onSuccess: inv })
}

/* Users */
export const useAddRestaurantUser = () => {
  const inv = useInvalidator(k('users'))
  return useMutation({ mutationFn: (i: UserInput) => addRestaurantUser(i), onSuccess: inv })
}
export const useUpdateRestaurantUser = () => {
  const inv = useInvalidator(k('users'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: UserInput }) => updateRestaurantUser(id, input), onSuccess: inv })
}
export const useDeleteRestaurantUser = () => {
  const inv = useInvalidator(k('users'))
  return useMutation({ mutationFn: (id: number) => deleteRestaurantUser(id), onSuccess: inv })
}

/* Customers */
export const useAddRestaurantCustomer = () => {
  const inv = useInvalidator(k('customers'))
  return useMutation({ mutationFn: (i: CustomerInput) => addRestaurantCustomer(i), onSuccess: inv })
}
export const useUpdateRestaurantCustomer = () => {
  const inv = useInvalidator(k('customers'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: CustomerInput }) => updateRestaurantCustomer(id, input), onSuccess: inv })
}
export const useToggleRestaurantCustomerActive = () => {
  const inv = useInvalidator(k('customers'))
  return useMutation({ mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => toggleRestaurantCustomerActive(id, isActive), onSuccess: inv })
}

/* Payment gateways */
export const useAddRestaurantPaymentGateway = () => {
  const inv = useInvalidator(k('payment-gateways'))
  return useMutation({ mutationFn: (i: PaymentGatewayInput) => addRestaurantPaymentGateway(i), onSuccess: inv })
}
export const useUpdateRestaurantPaymentGateway = () => {
  const inv = useInvalidator(k('payment-gateways'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: PaymentGatewayInput }) => updateRestaurantPaymentGateway(id, input), onSuccess: inv })
}
export const useToggleRestaurantPaymentGatewayStatus = () => {
  const inv = useInvalidator(k('payment-gateways'))
  return useMutation({ mutationFn: ({ id, status }: { id: number; status: boolean }) => toggleRestaurantPaymentGatewayStatus(id, status), onSuccess: inv })
}

/* Sliders */
export const useAddRestaurantSlider = () => {
  const inv = useInvalidator(k('sliders'))
  return useMutation({ mutationFn: (i: SliderInput) => addRestaurantSlider(i), onSuccess: inv })
}
export const useUpdateRestaurantSlider = () => {
  const inv = useInvalidator(k('sliders'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: SliderInput }) => updateRestaurantSlider(id, input), onSuccess: inv })
}
export const useDeleteRestaurantSlider = () => {
  const inv = useInvalidator(k('sliders'))
  return useMutation({ mutationFn: (id: number) => deleteRestaurantSlider(id), onSuccess: inv })
}

/* Bank Details */
export const useAddRestaurantBankDetail = () => {
  const inv = useInvalidator(k('bank-details'))
  return useMutation({ mutationFn: (i: BankDetailInput) => addRestaurantBankDetail(i), onSuccess: inv })
}
export const useUpdateRestaurantBankDetail = () => {
  const inv = useInvalidator(k('bank-details'))
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: BankDetailInput }) => updateRestaurantBankDetail(id, input), onSuccess: inv })
}
export const useDeleteRestaurantBankDetail = () => {
  const inv = useInvalidator(k('bank-details'))
  return useMutation({ mutationFn: (id: number) => deleteRestaurantBankDetail(id), onSuccess: inv })
}

/* ------------------------------------------------------------------ */
/* 2026-06-25 — Stakeholder demo sub-pages                             */
/* ------------------------------------------------------------------ */

export interface RestaurantOrderFilters {
  status?: string
  orderType?: string
  fromDate?: string
  toDate?: string
}

export const useRestaurantOrders = (filters: RestaurantOrderFilters = {}) =>
  useQuery({
    queryKey: k('orders', filters),
    queryFn: () => fetchRestaurantOrders(filters),
    staleTime: 30_000,
  })

export const useRestaurantOutstanding = () =>
  useQuery({
    queryKey: k('outstanding'),
    queryFn: fetchRestaurantOutstanding,
    staleTime: 60_000,
  })

export const useRestaurantBranding = () =>
  useQuery({ queryKey: k('branding'), queryFn: fetchRestaurantBranding, staleTime: 5 * 60_000 })

export const useUpdateRestaurantBranding = () => {
  const inv = useInvalidator(k('branding'))
  return useMutation({ mutationFn: (input: RestaurantBranding) => updateRestaurantBranding(input), onSuccess: inv })
}

export const useAddRestaurantMenuItemsBulk = () => {
  const inv = useInvalidator(k('menu-items'))
  return useMutation({ mutationFn: (rows: BulkMenuItemInput[]) => addRestaurantMenuItemsBulk(rows), onSuccess: inv })
}
