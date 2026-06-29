import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchBranchDashboard, fetchBranchMenuItems, fetchBranchCategories,
  fetchBranchUsers, fetchBranchCustomers, fetchBranchSections, fetchBranchTables,
  fetchBranchSubcategories, fetchBranchDeliveryZones, fetchBranchAddonGroups,
  fetchBranchAddonItems, fetchBranchHours, fetchBranchCoupons,
  fetchBranchBankDetails, fetchBranchSliders,
  addBranchCategory, updateBranchCategory, deleteBranchCategory,
  addBranchSubcategory, updateBranchSubcategory, deleteBranchSubcategory,
  addBranchSection, updateBranchSection, deleteBranchSection,
  addBranchTable, updateBranchTable, deleteBranchTable,
  addBranchDeliveryZone, updateBranchDeliveryZone, deleteBranchDeliveryZone,
  addBranchAddonGroup, updateBranchAddonGroup, deleteBranchAddonGroup,
  addBranchAddonItem, updateBranchAddonItem, deleteBranchAddonItem,
  updateBranchHour,
  addBranchCoupon, updateBranchCoupon, deleteBranchCoupon,
  addBranchMenuItem, updateBranchMenuItem, deleteBranchMenuItem,
  addBranchUser, updateBranchUser, deleteBranchUser,
  addBranchCustomer, updateBranchCustomer, toggleBranchCustomerActive,
  type BranchCategoryInput, type BranchSubcategoryInput, type BranchSectionInput, type BranchTableInput,
  type BranchDeliveryZoneInput, type BranchAddonGroupInput, type BranchAddonItemInput, type BranchHourInput,
  type BranchCouponInput, type BranchMenuItemInput, type BranchUserInput, type BranchCustomerInput,
} from '@/api/services/branch'

const k = (...parts: unknown[]) => ['branch', ...parts] as const

export const useBranchDashboard = (opts: { fromDate?: string; toDate?: string } = {}) =>
  useQuery({ queryKey: k('dashboard', opts), queryFn: () => fetchBranchDashboard(opts), refetchInterval: 30_000 })
export const useBranchMenuItems = () =>
  useQuery({ queryKey: k('menu-items'), queryFn: fetchBranchMenuItems, staleTime: 5 * 60_000 })
export const useBranchCategories = () =>
  useQuery({ queryKey: k('categories'), queryFn: fetchBranchCategories, staleTime: 5 * 60_000 })
export const useBranchUsers = () =>
  useQuery({ queryKey: k('users'), queryFn: fetchBranchUsers, staleTime: 60_000 })
export const useBranchCustomers = () =>
  useQuery({ queryKey: k('customers'), queryFn: fetchBranchCustomers, staleTime: 60_000 })
export const useBranchSections = () =>
  useQuery({ queryKey: k('sections'), queryFn: fetchBranchSections, staleTime: 5 * 60_000 })
export const useBranchTables = () =>
  useQuery({ queryKey: k('tables'), queryFn: fetchBranchTables, staleTime: 60_000 })

/* 2026-06-24 — sub-page hooks */
export const useBranchSubcategories = () =>
  useQuery({ queryKey: k('subcategories'), queryFn: fetchBranchSubcategories, staleTime: 5 * 60_000 })
export const useBranchDeliveryZones = () =>
  useQuery({ queryKey: k('delivery-zones'), queryFn: fetchBranchDeliveryZones, staleTime: 5 * 60_000 })
export const useBranchAddonGroups = () =>
  useQuery({ queryKey: k('addon-groups'), queryFn: fetchBranchAddonGroups, staleTime: 5 * 60_000 })
export const useBranchAddonItems = () =>
  useQuery({ queryKey: k('addon-items'), queryFn: fetchBranchAddonItems, staleTime: 5 * 60_000 })
export const useBranchHours = () =>
  useQuery({ queryKey: k('hours'), queryFn: fetchBranchHours, staleTime: 5 * 60_000 })
export const useBranchCoupons = () =>
  useQuery({ queryKey: k('coupons'), queryFn: fetchBranchCoupons, staleTime: 60_000 })
export const useBranchBankDetails = () =>
  useQuery({ queryKey: k('bank-details'), queryFn: fetchBranchBankDetails, staleTime: 60_000 })
export const useBranchSliders = () =>
  useQuery({ queryKey: k('sliders'), queryFn: fetchBranchSliders, staleTime: 60_000 })

/* ------------------------------------------------------------------ */
/* 2026-06-24 — Branch mutation hooks.                                 */
/* ------------------------------------------------------------------ */

function useInvalidator(...keys: readonly (readonly unknown[])[]) {
  const qc = useQueryClient()
  return () => keys.forEach((kk) => qc.invalidateQueries({ queryKey: kk as unknown[] }))
}

/* Categories */
export const useAddBranchCategory = () => { const inv = useInvalidator(k('categories'));
  return useMutation({ mutationFn: (i: BranchCategoryInput) => addBranchCategory(i), onSuccess: inv }) }
export const useUpdateBranchCategory = () => { const inv = useInvalidator(k('categories'));
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: BranchCategoryInput }) => updateBranchCategory(id, input), onSuccess: inv }) }
export const useDeleteBranchCategory = () => { const inv = useInvalidator(k('categories'));
  return useMutation({ mutationFn: (id: number) => deleteBranchCategory(id), onSuccess: inv }) }

/* Subcategories */
export const useAddBranchSubcategory = () => { const inv = useInvalidator(k('subcategories'));
  return useMutation({ mutationFn: (i: BranchSubcategoryInput) => addBranchSubcategory(i), onSuccess: inv }) }
export const useUpdateBranchSubcategory = () => { const inv = useInvalidator(k('subcategories'));
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: BranchSubcategoryInput }) => updateBranchSubcategory(id, input), onSuccess: inv }) }
export const useDeleteBranchSubcategory = () => { const inv = useInvalidator(k('subcategories'));
  return useMutation({ mutationFn: (id: number) => deleteBranchSubcategory(id), onSuccess: inv }) }

/* Sections */
export const useAddBranchSection = () => { const inv = useInvalidator(k('sections'));
  return useMutation({ mutationFn: (i: BranchSectionInput) => addBranchSection(i), onSuccess: inv }) }
export const useUpdateBranchSection = () => { const inv = useInvalidator(k('sections'));
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: BranchSectionInput }) => updateBranchSection(id, input), onSuccess: inv }) }
export const useDeleteBranchSection = () => { const inv = useInvalidator(k('sections'));
  return useMutation({ mutationFn: (id: number) => deleteBranchSection(id), onSuccess: inv }) }

/* Tables */
export const useAddBranchTable = () => { const inv = useInvalidator(k('tables'));
  return useMutation({ mutationFn: (i: BranchTableInput) => addBranchTable(i), onSuccess: inv }) }
export const useUpdateBranchTable = () => { const inv = useInvalidator(k('tables'));
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: BranchTableInput }) => updateBranchTable(id, input), onSuccess: inv }) }
export const useDeleteBranchTable = () => { const inv = useInvalidator(k('tables'));
  return useMutation({ mutationFn: (id: number) => deleteBranchTable(id), onSuccess: inv }) }

/* Delivery zones */
export const useAddBranchDeliveryZone = () => { const inv = useInvalidator(k('delivery-zones'));
  return useMutation({ mutationFn: (i: BranchDeliveryZoneInput) => addBranchDeliveryZone(i), onSuccess: inv }) }
export const useUpdateBranchDeliveryZone = () => { const inv = useInvalidator(k('delivery-zones'));
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: BranchDeliveryZoneInput }) => updateBranchDeliveryZone(id, input), onSuccess: inv }) }
export const useDeleteBranchDeliveryZone = () => { const inv = useInvalidator(k('delivery-zones'));
  return useMutation({ mutationFn: (id: number) => deleteBranchDeliveryZone(id), onSuccess: inv }) }

/* Addon groups */
export const useAddBranchAddonGroup = () => { const inv = useInvalidator(k('addon-groups'));
  return useMutation({ mutationFn: (i: BranchAddonGroupInput) => addBranchAddonGroup(i), onSuccess: inv }) }
export const useUpdateBranchAddonGroup = () => { const inv = useInvalidator(k('addon-groups'));
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: BranchAddonGroupInput }) => updateBranchAddonGroup(id, input), onSuccess: inv }) }
export const useDeleteBranchAddonGroup = () => { const inv = useInvalidator(k('addon-groups'));
  return useMutation({ mutationFn: (id: number) => deleteBranchAddonGroup(id), onSuccess: inv }) }

/* Addon items */
export const useAddBranchAddonItem = () => { const inv = useInvalidator(k('addon-items'));
  return useMutation({ mutationFn: (i: BranchAddonItemInput) => addBranchAddonItem(i), onSuccess: inv }) }
export const useUpdateBranchAddonItem = () => { const inv = useInvalidator(k('addon-items'));
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: BranchAddonItemInput }) => updateBranchAddonItem(id, input), onSuccess: inv }) }
export const useDeleteBranchAddonItem = () => { const inv = useInvalidator(k('addon-items'));
  return useMutation({ mutationFn: (id: number) => deleteBranchAddonItem(id), onSuccess: inv }) }

/* Hours */
export const useUpdateBranchHour = () => { const inv = useInvalidator(k('hours'));
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: BranchHourInput }) => updateBranchHour(id, input), onSuccess: inv }) }

/* Coupons */
export const useAddBranchCoupon = () => { const inv = useInvalidator(k('coupons'));
  return useMutation({ mutationFn: (i: BranchCouponInput) => addBranchCoupon(i), onSuccess: inv }) }
export const useUpdateBranchCoupon = () => { const inv = useInvalidator(k('coupons'));
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: BranchCouponInput }) => updateBranchCoupon(id, input), onSuccess: inv }) }
export const useDeleteBranchCoupon = () => { const inv = useInvalidator(k('coupons'));
  return useMutation({ mutationFn: (id: number) => deleteBranchCoupon(id), onSuccess: inv }) }

/* Menu items */
export const useAddBranchMenuItem = () => { const inv = useInvalidator(k('menu-items'));
  return useMutation({ mutationFn: (i: BranchMenuItemInput) => addBranchMenuItem(i), onSuccess: inv }) }
export const useUpdateBranchMenuItem = () => { const inv = useInvalidator(k('menu-items'));
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: BranchMenuItemInput }) => updateBranchMenuItem(id, input), onSuccess: inv }) }
export const useDeleteBranchMenuItem = () => { const inv = useInvalidator(k('menu-items'));
  return useMutation({ mutationFn: (id: number) => deleteBranchMenuItem(id), onSuccess: inv }) }

/* Users */
export const useAddBranchUser = () => { const inv = useInvalidator(k('users'));
  return useMutation({ mutationFn: (i: BranchUserInput) => addBranchUser(i), onSuccess: inv }) }
export const useUpdateBranchUser = () => { const inv = useInvalidator(k('users'));
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: BranchUserInput }) => updateBranchUser(id, input), onSuccess: inv }) }
export const useDeleteBranchUser = () => { const inv = useInvalidator(k('users'));
  return useMutation({ mutationFn: (id: number) => deleteBranchUser(id), onSuccess: inv }) }

/* Customers */
export const useAddBranchCustomer = () => { const inv = useInvalidator(k('customers'));
  return useMutation({ mutationFn: (i: BranchCustomerInput) => addBranchCustomer(i), onSuccess: inv }) }
export const useUpdateBranchCustomer = () => { const inv = useInvalidator(k('customers'));
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: BranchCustomerInput }) => updateBranchCustomer(id, input), onSuccess: inv }) }
export const useToggleBranchCustomerActive = () => { const inv = useInvalidator(k('customers'));
  return useMutation({ mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => toggleBranchCustomerActive(id, isActive), onSuccess: inv }) }
