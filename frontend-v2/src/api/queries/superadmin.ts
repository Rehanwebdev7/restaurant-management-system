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
  impersonateUser,
  grantSubscriptionGrace,
  menuCategoryService,
  menuSubcategoryService,
  sectionService,
  diningTablesService,
  addonsService,
  addonsItemsService,
  menuItemsService,
  menuItemAddonsService,
  deliveryZonesService,
  ordersService,
  orderItemsService,
  orderPaymentsService,
  businessSettingService,
  paymentGatewayService,
  statesService,
  citiesService,
  restaurantBranchService,
  fetchApiLogs,
  fetchUsersByRole,
  fetchRestaurantTree,
  fetchRestaurantChildren,
  fetchRestaurantDetail,
  createUser,
  type CrudService,
  type AdminEntity,
  type CreateUserBody,
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin'] }) },
  })
}

export function useImpersonateUser() {
  return useMutation({ mutationFn: (id: number) => impersonateUser(id) })
}

export function useGrantSubscriptionGrace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; days: number; notes?: string }) =>
      grantSubscriptionGrace(vars.id, { days: vars.days, notes: vars.notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: k('subscriptions') }) },
  })
}

/* ═══════════════════════════════════════════════════════════════════
 * GENERIC CRUD HOOKS FACTORY (2026-07-16 evening)
 * Powers all 14 new resource pages via 5 hooks each (list/get/create/update/delete).
 * ═══════════════════════════════════════════════════════════════════ */

export interface CrudHooks<T> {
  useList: () => ReturnType<typeof useQuery<T[]>>
  useGet: (id: number | null) => ReturnType<typeof useQuery<T | null>>
  useCreate: () => ReturnType<typeof useMutation<Awaited<ReturnType<CrudService<T>['create']>>, Error, Partial<T>>>
  useUpdate: () => ReturnType<typeof useMutation<Awaited<ReturnType<CrudService<T>['update']>>, Error, Partial<T> & { id?: number }>>
  useDelete: () => ReturnType<typeof useMutation<Awaited<ReturnType<CrudService<T>['remove']>>, Error, number>>
}

export function makeCrudHooks<T>(key: string, service: CrudService<T>): CrudHooks<T> {
  const useList = () => useQuery({
    queryKey: k(key),
    queryFn: service.list,
    staleTime: 60_000,
  })
  const useGet = (id: number | null) => useQuery({
    queryKey: k(key, id),
    queryFn: () => (id != null ? service.get(id) : Promise.resolve(null)),
    enabled: id != null,
  })
  const useCreate = () => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (body: Partial<T>) => service.create(body),
      onSuccess: () => { qc.invalidateQueries({ queryKey: k(key) }) },
    })
  }
  const useUpdate = () => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (body: Partial<T> & { id?: number }) => service.update(body),
      onSuccess: () => { qc.invalidateQueries({ queryKey: k(key) }) },
    })
  }
  const useDelete = () => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (id: number) => service.remove(id),
      onSuccess: () => { qc.invalidateQueries({ queryKey: k(key) }) },
    })
  }
  return { useList, useGet, useCreate, useUpdate, useDelete }
}

/* All 15 resource hook bundles. Pages import as `const H = useMenuCategoryCrud()` */
export const menuCategoryCrud     = makeCrudHooks<AdminEntity>('menu-categories',     menuCategoryService)
export const menuSubcategoryCrud  = makeCrudHooks<AdminEntity>('menu-subcategories',  menuSubcategoryService)
export const sectionCrud          = makeCrudHooks<AdminEntity>('sections',            sectionService)
export const diningTablesCrud     = makeCrudHooks<AdminEntity>('dining-tables',       diningTablesService)
export const addonsCrud           = makeCrudHooks<AdminEntity>('addons',              addonsService)
export const addonsItemsCrud      = makeCrudHooks<AdminEntity>('addons-items',        addonsItemsService)
export const menuItemsCrud        = makeCrudHooks<AdminEntity>('menu-items',          menuItemsService)
export const menuItemAddonsCrud   = makeCrudHooks<AdminEntity>('menu-item-addons',    menuItemAddonsService)
export const deliveryZonesCrud    = makeCrudHooks<AdminEntity>('delivery-zones',      deliveryZonesService)
export const ordersCrud           = makeCrudHooks<AdminEntity>('orders',              ordersService)
export const orderItemsCrud       = makeCrudHooks<AdminEntity>('order-items',         orderItemsService)
export const orderPaymentsCrud    = makeCrudHooks<AdminEntity>('order-payments',      orderPaymentsService)
export const businessSettingCrud  = makeCrudHooks<AdminEntity>('business-setting',    businessSettingService)
export const paymentGatewayCrud   = makeCrudHooks<AdminEntity>('payment-gateway',     paymentGatewayService)
export const statesCrud           = makeCrudHooks<AdminEntity>('states',              statesService)
export const citiesCrud           = makeCrudHooks<AdminEntity>('cities',              citiesService)
export const restaurantBranchCrud = makeCrudHooks<AdminEntity>('restaurant-branch',   restaurantBranchService)

/* Read-only queries */
export const useSuperadminApiLogs = () =>
  useQuery({ queryKey: k('api-logs'), queryFn: fetchApiLogs, staleTime: 30_000 })

export const useSuperadminUsersByRole = (role: string) =>
  useQuery({
    queryKey: k('users-by-role', role),
    queryFn: () => fetchUsersByRole(role),
    staleTime: 60_000,
    enabled: !!role,
  })

/* User Tree + Detail + Create-user (Phase C) */

export const useRestaurantTree = () =>
  useQuery({ queryKey: k('restaurant-tree'), queryFn: fetchRestaurantTree, staleTime: 30_000 })

export const useRestaurantChildren = (adminId: number | null) =>
  useQuery({
    queryKey: k('restaurant-children', adminId),
    queryFn: () => (adminId != null ? fetchRestaurantChildren(adminId) : Promise.resolve([])),
    enabled: adminId != null,
    staleTime: 15_000,
  })

export const useRestaurantDetail = (id: number | null) =>
  useQuery({
    queryKey: k('restaurant-detail', id),
    queryFn: () => (id != null ? fetchRestaurantDetail(id) : Promise.resolve(null)),
    enabled: id != null,
  })

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateUserBody) => createUser(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: k('restaurant-tree') })
      qc.invalidateQueries({ queryKey: k('restaurant-children') })
      qc.invalidateQueries({ queryKey: k('users') })
      qc.invalidateQueries({ queryKey: k('users-by-role') })
    },
  })
}
