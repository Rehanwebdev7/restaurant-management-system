import { Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { NotFound } from '@/components/error/NotFound'
import { PageLoader } from '@/components/ui/page-loader'
import { AuthGuard } from '@/lib/auth/AuthGuard'
import type { Role } from '@/components/layout/sidebarConfig'

const Login = lazy(() => import('@/features/auth/Login'))
const Signup = lazy(() => import('@/features/auth/Signup'))
const ForgotPassword = lazy(() => import('@/features/auth/ForgotPassword'))
const CustomerLogin = lazy(() => import('@/features/customer/CustomerLogin'))
const CustomerAddresses = lazy(() => import('@/features/customer/Addresses'))
const CustomerOrderTracking = lazy(() => import('@/features/customer/OrderTracking'))
const CustomerPaymentResponse = lazy(() => import('@/features/customer/PaymentResponse'))
const CustomerLocations = lazy(() => import('@/features/customer/LocationsPage'))

const KitchenDashboard = lazy(() => import('@/features/kitchen/KitchenDashboard'))
const KitchenDisplay = lazy(() => import('@/features/kitchen/KitchenDisplay'))
const KitchenOrderHistory = lazy(() => import('@/features/kitchen/KitchenOrderHistory'))
const KitchenReports = lazy(() => import('@/features/kitchen/KitchenReports'))

const DeliveryDashboard = lazy(() => import('@/features/delivery/DeliveryDashboard'))
const ActiveOrders = lazy(() => import('@/features/delivery/ActiveOrders'))
const DeliveryWallet = lazy(() => import('@/features/delivery/Wallet'))
const BankAccounts = lazy(() => import('@/features/delivery/BankAccounts'))
const DeliveryOrderHistory = lazy(() => import('@/features/delivery/DeliveryOrderHistory'))
const WithdrawalRequest = lazy(() => import('@/features/delivery/WithdrawalRequest'))

const CashierDashboard = lazy(() => import('@/features/cashier/CashierDashboard'))
const CashierOrders = lazy(() => import('@/features/cashier/CashierOrders'))
const CashierNewOrder = lazy(() => import('@/features/cashier/NewOrder'))
const CashierCustomers = lazy(() => import('@/features/cashier/Customers'))
const CashierMenuView = lazy(() => import('@/features/cashier/MenuView'))
const CashierOutstanding = lazy(() => import('@/features/cashier/Outstanding'))
const CashierWalletTopup = lazy(() => import('@/features/cashier/WalletTopupRequest'))
const CashierTableQrCodes = lazy(() => import('@/features/cashier/TableQrCodes'))

// 2026-06-24 — 11 new cashier sub-pages
const CashierOrderDetailC = lazy(() => import('@/features/cashier/subpages').then((m) => ({ default: m.CashierOrderDetail })))
const CashierDineInC = lazy(() => import('@/features/cashier/subpages').then((m) => ({ default: m.CashierDineIn })))
const CashierTakeawayC = lazy(() => import('@/features/cashier/subpages').then((m) => ({ default: m.CashierTakeaway })))
const CashierDeliveryC = lazy(() => import('@/features/cashier/subpages').then((m) => ({ default: m.CashierDelivery })))
const CashierRefundC = lazy(() => import('@/features/cashier/subpages').then((m) => ({ default: m.CashierRefund })))
const CashierKotPrintC = lazy(() => import('@/features/cashier/subpages').then((m) => ({ default: m.CashierKotPrint })))
const CashierBillPrintC = lazy(() => import('@/features/cashier/subpages').then((m) => ({ default: m.CashierBillPrint })))
const CashierWalletTopupHistoryC = lazy(() => import('@/features/cashier/subpages').then((m) => ({ default: m.CashierWalletTopupHistory })))
const CashierCouponsC = lazy(() => import('@/features/cashier/subpages').then((m) => ({ default: m.CashierCoupons })))
const CashierOperationsC = lazy(() => import('@/features/cashier/subpages').then((m) => ({ default: m.CashierOperations })))
const CashierShiftCloseC = lazy(() => import('@/features/cashier/subpages').then((m) => ({ default: m.CashierShiftClose })))
const CashierSplitBillC = lazy(() => import('@/features/cashier/SplitBill'))

const BranchDashboard = lazy(() => import('@/features/branch/BranchDashboard'))

const SuperadminDashboard = lazy(() => import('@/features/superadmin/SuperadminDashboard'))
const SuperadminAuditLog = lazy(() => import('@/features/superadmin/AuditLog'))

/**
 * Suspense wrapper helpers — each route group picks its own branded loader so
 * the customer site never flashes a panel-style spinner and vice versa.
 */
function CustomerSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader variant="customer" />}>{children}</Suspense>
}

function PanelSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader variant="panel" />}>{children}</Suspense>
}

/**
 * PanelShell — wraps AppShell so the lazy route component swapped into the
 * <Outlet> is bounded by a panel-styled Suspense, keeping the loader inside
 * the content area instead of replacing the entire chrome.
 */
function PanelShell({ role }: { role: Role }) {
  return (
    <AppShell role={role}>
      <PanelSuspense>
        <Outlet />
      </PanelSuspense>
    </AppShell>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      {/* Outer fallback handles any direct lazy children (e.g. /login). */}
      <Suspense fallback={<PageLoader variant="panel" />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/addresses" element={<CustomerAddresses />} />

          {/* Customer site — Phase 5 (legacy steakhouse-aesthetic preserved).
              Wrapped in CustomerSuspense so route transitions show the gold
              spinner + restaurant-name loader instead of the generic skeleton. */}
          <Route element={<CustomerSuspense><Outlet /></CustomerSuspense>}>
            <Route path="/" element={<CustomerSite />} />
            <Route path="/menu" element={<CustomerMenu />} />
            <Route path="/signature" element={<CustomerSignature />} />
            <Route path="/why-us" element={<CustomerWhyUs />} />
            <Route path="/gallery" element={<CustomerGallery />} />
            <Route path="/contact" element={<CustomerContact />} />
            <Route path="/cart" element={<CustomerCart />} />
            <Route path="/checkout" element={<CustomerCheckout />} />
            <Route path="/orders" element={<CustomerOrders />} />
            <Route path="/orders/:id" element={<CustomerOrderTracking />} />
            <Route path="/payment/callback" element={<CustomerPaymentResponse />} />
            <Route path="/locations" element={<CustomerLocations />} />
            <Route path="/profile" element={<CustomerProfile />} />
            <Route path="/about" element={<CustomerAbout />} />
            <Route path="/terms" element={<CustomerTerms />} />
            <Route path="/privacy" element={<CustomerPrivacy />} />
            <Route path="/refund" element={<CustomerRefund />} />
          </Route>

          {/* Kitchen panel — Phase 4a */}
          <Route element={<AuthGuard><PanelShell role="kitchen" /></AuthGuard>}>
            <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
            <Route path="/kitchen/display" element={<KitchenDisplay />} />
            <Route path="/kitchen/orders" element={<KitchenOrderHistory />} />
            <Route path="/kitchen/reports" element={<KitchenReports />} />
            <Route path="/kitchen" element={<Navigate to="/kitchen/dashboard" replace />} />
          </Route>

          {/* Delivery panel — Phase 4b */}
          <Route element={<AuthGuard><PanelShell role="delivery" /></AuthGuard>}>
            <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
            <Route path="/delivery/active" element={<ActiveOrders />} />
            <Route path="/delivery/wallet" element={<DeliveryWallet />} />
            <Route path="/delivery/bank" element={<BankAccounts />} />
            <Route path="/delivery/history" element={<DeliveryOrderHistory />} />
            <Route path="/delivery/withdraw" element={<WithdrawalRequest />} />
            <Route path="/delivery" element={<Navigate to="/delivery/dashboard" replace />} />
          </Route>

          {/* Cashier print routes — sit outside AppShell so @media print renders
              cleanly without sidebar/topbar chrome. Still auth-gated. */}
          <Route element={<AuthGuard><Outlet /></AuthGuard>}>
            <Route path="/cashier/print-kot/:id" element={<CashierKotPrintC />} />
            <Route path="/cashier/print-bill/:id" element={<CashierBillPrintC />} />
          </Route>

          {/* Cashier panel — Phase 4c */}
          <Route element={<AuthGuard><PanelShell role="cashier" /></AuthGuard>}>
            <Route path="/cashier/dashboard" element={<CashierDashboard />} />
            <Route path="/cashier/operations" element={<CashierOperationsC />} />
            <Route path="/cashier/new-order" element={<CashierNewOrder />} />
            <Route path="/cashier/orders" element={<CashierOrders />} />
            <Route path="/cashier/orders/:id" element={<CashierOrderDetailC />} />
            <Route path="/cashier/dine-in" element={<CashierDineInC />} />
            <Route path="/cashier/takeaway" element={<CashierTakeawayC />} />
            <Route path="/cashier/delivery" element={<CashierDeliveryC />} />
            <Route path="/cashier/refund" element={<CashierRefundC />} />
            <Route path="/cashier/coupons" element={<CashierCouponsC />} />
            <Route path="/cashier/split-bill" element={<CashierSplitBillC />} />
            <Route path="/cashier/shift-close" element={<CashierShiftCloseC />} />
            <Route path="/cashier/customers" element={<CashierCustomers />} />
            <Route path="/cashier/menu-view" element={<CashierMenuView />} />
            <Route path="/cashier/outstanding" element={<CashierOutstanding />} />
            <Route path="/cashier/wallet-topup" element={<CashierWalletTopup />} />
            <Route path="/cashier/wallet-topup-history" element={<CashierWalletTopupHistoryC />} />
            <Route path="/cashier/table-qr-codes" element={<CashierTableQrCodes />} />
            <Route path="/cashier" element={<Navigate to="/cashier/dashboard" replace />} />
          </Route>

          {/* Branch panel — Phase 4d */}
          <Route element={<AuthGuard><PanelShell role="branch" /></AuthGuard>}>
            <Route path="/branch/dashboard" element={<BranchDashboard />} />
            <Route path="/branch/orders" element={<BranchPages.Orders />} />
            <Route path="/branch/menu" element={<BranchPages.Menu />} />
            <Route path="/branch/users" element={<BranchPages.Users />} />
            <Route path="/branch/customers" element={<BranchPages.Customers />} />
            <Route path="/branch/outstanding" element={<BranchPages.Outstanding />} />
            <Route path="/branch/wallet-topup" element={<BranchPages.WalletTopup />} />
            <Route path="/branch/settings" element={<BranchPages.Settings />} />
            {/* 2026-06-24 — 10 new sub-pages mirroring restaurant subpages */}
            <Route path="/branch/menu-categories" element={<BranchPages.MenuCategories />} />
            <Route path="/branch/menu-subcategories" element={<BranchPages.MenuSubcategories />} />
            <Route path="/branch/sections" element={<BranchPages.Sections />} />
            <Route path="/branch/dining-tables" element={<BranchPages.DiningTables />} />
            <Route path="/branch/delivery-zones" element={<BranchPages.DeliveryZones />} />
            <Route path="/branch/addons" element={<BranchPages.Addons />} />
            <Route path="/branch/addon-items" element={<BranchPages.AddonItems />} />
            <Route path="/branch/hours" element={<BranchPages.Hours />} />
            <Route path="/branch/coupons" element={<BranchPages.Coupons />} />
            <Route path="/branch/sliders" element={<BranchPages.Sliders />} />
            {/* 2026-06-25 — 10 operations sub-pages */}
            <Route path="/branch/inventory" element={<BranchPages.Inventory />} />
            <Route path="/branch/staff-attendance" element={<BranchPages.StaffAttendance />} />
            <Route path="/branch/cash-register" element={<BranchPages.CashRegister />} />
            <Route path="/branch/petty-cash" element={<BranchPages.PettyCash />} />
            <Route path="/branch/wastage" element={<BranchPages.Wastage />} />
            <Route path="/branch/customer-feedback" element={<BranchPages.CustomerFeedback />} />
            <Route path="/branch/staff-roles" element={<BranchPages.StaffRoles />} />
            <Route path="/branch/shift-handover" element={<BranchPages.ShiftHandover />} />
            <Route path="/branch/maintenance-log" element={<BranchPages.MaintenanceLog />} />
            <Route path="/branch/training-records" element={<BranchPages.TrainingRecords />} />
            <Route path="/branch" element={<Navigate to="/branch/dashboard" replace />} />
          </Route>

          {/* Superadmin panel — Phase 4e */}
          <Route element={<AuthGuard><PanelShell role="superadmin" /></AuthGuard>}>
            <Route path="/superadmin/dashboard" element={<SuperadminDashboard />} />
            <Route path="/superadmin/restaurants" element={<SuperadminPages.Restaurants />} />
            <Route path="/superadmin/users" element={<SuperadminPages.Users />} />
            <Route path="/superadmin/subscription-plans" element={<SuperadminPages.Plans />} />
            <Route path="/superadmin/subscriptions" element={<SuperadminPages.Subscriptions />} />
            <Route path="/superadmin/user-approvals" element={<SuperadminPages.Approvals />} />
            <Route path="/superadmin/notifications" element={<SuperadminPages.Notifications />} />
            <Route path="/superadmin/audit-log" element={<SuperadminAuditLog />} />
            <Route path="/superadmin/reports" element={<SuperadminPages.Reports />} />
            <Route path="/superadmin/settings" element={<SuperadminPages.Settings />} />
            <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
          </Route>

          {/* Admin panel — LEGACY: AdminRoutes.js merges Admin + Superadmin.
              Both userType values land on /superadmin/*. We keep /admin/* as redirect
              targets so deep-links from the old app still resolve. */}
          <Route path="/admin/dashboard" element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="/admin/orders" element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="/admin/users" element={<Navigate to="/superadmin/users" replace />} />
          <Route path="/admin/products" element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="/admin/reports" element={<Navigate to="/superadmin/reports" replace />} />
          <Route path="/admin/settings" element={<Navigate to="/superadmin/settings" replace />} />
          <Route path="/admin" element={<Navigate to="/superadmin/dashboard" replace />} />

          {/* Restaurant panel — Phase 4g */}
          <Route element={<AuthGuard><PanelShell role="restaurant" /></AuthGuard>}>
            <Route path="/restaurant/dashboard" element={<RestaurantPages.Dashboard />} />
            <Route path="/restaurant/branches" element={<RestaurantPages.Branches />} />
            <Route path="/restaurant/orders" element={<RestaurantPages.Orders />} />
            <Route path="/restaurant/menu" element={<RestaurantPages.Menu />} />
            <Route path="/restaurant/users" element={<RestaurantPages.Users />} />
            <Route path="/restaurant/customers" element={<RestaurantPages.Customers />} />
            <Route path="/restaurant/payment-gateway" element={<RestaurantPages.PaymentGateway />} />
            <Route path="/restaurant/sliders" element={<RestaurantPages.Sliders />} />
            <Route path="/restaurant/bank" element={<RestaurantPages.Bank />} />
            <Route path="/restaurant/outstanding" element={<RestaurantPages.Outstanding />} />
            <Route path="/restaurant/wallet" element={<RestaurantPages.Wallet />} />
            <Route path="/restaurant/wallet-topup-history" element={<RestaurantPages.WalletTopupHistory />} />
            <Route path="/restaurant/withdrawals" element={<RestaurantPages.Withdrawals />} />
            <Route path="/restaurant/loans" element={<RestaurantPages.Loans />} />
            <Route path="/restaurant/reports" element={<RestaurantPages.Reports />} />
            <Route path="/restaurant/settings" element={<RestaurantPages.Settings />} />
            {/* 2026-06-24 — 10 new sub-pages closing the legacy parity gap */}
            <Route path="/restaurant/menu-categories" element={<RestaurantPages.MenuCategories />} />
            <Route path="/restaurant/menu-subcategories" element={<RestaurantPages.MenuSubcategories />} />
            <Route path="/restaurant/sections" element={<RestaurantPages.Sections />} />
            <Route path="/restaurant/dining-tables" element={<RestaurantPages.DiningTables />} />
            <Route path="/restaurant/delivery-zones" element={<RestaurantPages.DeliveryZones />} />
            <Route path="/restaurant/addons" element={<RestaurantPages.Addons />} />
            <Route path="/restaurant/addon-items" element={<RestaurantPages.AddonItems />} />
            <Route path="/restaurant/hours" element={<RestaurantPages.Hours />} />
            <Route path="/restaurant/coupons" element={<RestaurantPages.Coupons />} />
            <Route path="/restaurant/gallery" element={<RestaurantPages.Gallery />} />
            {/* 2026-06-25 — next 10 high-value sub-pages */}
            <Route path="/restaurant/menu-variants" element={<RestaurantPages.MenuVariants />} />
            <Route path="/restaurant/item-addons" element={<RestaurantPages.ItemAddons />} />
            <Route path="/restaurant/inventory" element={<RestaurantPages.Inventory />} />
            <Route path="/restaurant/vendors" element={<RestaurantPages.Vendors />} />
            <Route path="/restaurant/purchase-orders" element={<RestaurantPages.PurchaseOrders />} />
            <Route path="/restaurant/expenses" element={<RestaurantPages.Expenses />} />
            <Route path="/restaurant/profit-loss-report" element={<RestaurantPages.PLReport />} />
            <Route path="/restaurant/audit-trail" element={<RestaurantPages.AuditTrail />} />
            <Route path="/restaurant/api-keys" element={<RestaurantPages.ApiKeys />} />
            <Route path="/restaurant/notification-preferences" element={<RestaurantPages.NotificationPrefs />} />
            <Route path="/restaurant" element={<Navigate to="/restaurant/dashboard" replace />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

/* ---- Lazy module bundles ---- */
const BranchPagesMod = lazy(async () => {
  const m = await import('@/features/branch/pages')
  return {
    default: () => null,
    Orders: m.BranchOrders,
    Menu: m.BranchMenu,
    Users: m.BranchUsers,
    Outstanding: m.BranchOutstanding,
    Settings: m.BranchSettings,
    WalletTopup: m.BranchWalletTopup,
  } as any
})

// We can't use lazy this way for named exports; use direct lazy per export instead.
const BranchOrders = lazy(() => import('@/features/branch/pages').then((m) => ({ default: m.BranchOrders })))
const BranchMenu = lazy(() => import('@/features/branch/pages').then((m) => ({ default: m.BranchMenu })))
const BranchUsers = lazy(() => import('@/features/branch/pages').then((m) => ({ default: m.BranchUsers })))
const BranchCustomers = lazy(() => import('@/features/branch/pages').then((m) => ({ default: m.BranchCustomers })))
const BranchOutstanding = lazy(() => import('@/features/branch/pages').then((m) => ({ default: m.BranchOutstanding })))
const BranchSettings = lazy(() => import('@/features/branch/BranchSettings'))
const BranchWalletTopup = lazy(() => import('@/features/branch/pages').then((m) => ({ default: m.BranchWalletTopup })))

// 2026-06-25 — 10 operations sub-pages (inventory, attendance, etc.)
const BranchInventoryC = lazy(() => import('@/features/branch/operationsPages').then((m) => ({ default: m.BranchInventory })))
const BranchStaffAttendanceC = lazy(() => import('@/features/branch/operationsPages').then((m) => ({ default: m.BranchStaffAttendance })))
const BranchCashRegisterC = lazy(() => import('@/features/branch/operationsPages').then((m) => ({ default: m.BranchCashRegister })))
const BranchPettyCashC = lazy(() => import('@/features/branch/operationsPages').then((m) => ({ default: m.BranchPettyCash })))
const BranchWastageC = lazy(() => import('@/features/branch/operationsPages').then((m) => ({ default: m.BranchWastage })))
const BranchCustomerFeedbackC = lazy(() => import('@/features/branch/operationsPages').then((m) => ({ default: m.BranchCustomerFeedback })))
const BranchStaffRolesC = lazy(() => import('@/features/branch/operationsPages').then((m) => ({ default: m.BranchStaffRoles })))
const BranchShiftHandoverC = lazy(() => import('@/features/branch/operationsPages').then((m) => ({ default: m.BranchShiftHandover })))
const BranchMaintenanceLogC = lazy(() => import('@/features/branch/operationsPages').then((m) => ({ default: m.BranchMaintenanceLog })))
const BranchTrainingRecordsC = lazy(() => import('@/features/branch/operationsPages').then((m) => ({ default: m.BranchTrainingRecords })))

// 2026-06-24 — sub-pages module (10 new branch pages)
const BranchMenuCategoriesC = lazy(() => import('@/features/branch/subpages').then((m) => ({ default: m.BranchMenuCategories })))
const BranchMenuSubcategoriesC = lazy(() => import('@/features/branch/subpages').then((m) => ({ default: m.BranchMenuSubcategories })))
const BranchSectionsC = lazy(() => import('@/features/branch/subpages').then((m) => ({ default: m.BranchSectionsPage })))
const BranchDiningTablesC = lazy(() => import('@/features/branch/subpages').then((m) => ({ default: m.BranchDiningTables })))
const BranchDeliveryZonesC = lazy(() => import('@/features/branch/subpages').then((m) => ({ default: m.BranchDeliveryZones })))
const BranchAddonsC = lazy(() => import('@/features/branch/subpages').then((m) => ({ default: m.BranchAddons })))
const BranchAddonItemsC = lazy(() => import('@/features/branch/subpages').then((m) => ({ default: m.BranchAddonItems })))
const BranchHoursC = lazy(() => import('@/features/branch/subpages').then((m) => ({ default: m.BranchHours })))
const BranchCouponsC = lazy(() => import('@/features/branch/subpages').then((m) => ({ default: m.BranchCoupons })))
const BranchSlidersC = lazy(() => import('@/features/branch/subpages').then((m) => ({ default: m.BranchSliders })))

const BranchPages = {
  Orders: BranchOrders,
  Menu: BranchMenu,
  Users: BranchUsers,
  Customers: BranchCustomers,
  Outstanding: BranchOutstanding,
  Settings: BranchSettings,
  WalletTopup: BranchWalletTopup,
  MenuCategories: BranchMenuCategoriesC,
  MenuSubcategories: BranchMenuSubcategoriesC,
  Sections: BranchSectionsC,
  DiningTables: BranchDiningTablesC,
  DeliveryZones: BranchDeliveryZonesC,
  Addons: BranchAddonsC,
  AddonItems: BranchAddonItemsC,
  Hours: BranchHoursC,
  Coupons: BranchCouponsC,
  Sliders: BranchSlidersC,
  Inventory: BranchInventoryC,
  StaffAttendance: BranchStaffAttendanceC,
  CashRegister: BranchCashRegisterC,
  PettyCash: BranchPettyCashC,
  Wastage: BranchWastageC,
  CustomerFeedback: BranchCustomerFeedbackC,
  StaffRoles: BranchStaffRolesC,
  ShiftHandover: BranchShiftHandoverC,
  MaintenanceLog: BranchMaintenanceLogC,
  TrainingRecords: BranchTrainingRecordsC,
}

const SuperRestaurants = lazy(() => import('@/features/superadmin/pages').then((m) => ({ default: m.Restaurants })))
const SuperUsers = lazy(() => import('@/features/superadmin/pages').then((m) => ({ default: m.SuperUsers })))
const SuperPlans = lazy(() => import('@/features/superadmin/pages').then((m) => ({ default: m.SubscriptionPlans })))
const SuperSubs = lazy(() => import('@/features/superadmin/pages').then((m) => ({ default: m.Subscriptions })))
const SuperApprovals = lazy(() => import('@/features/superadmin/pages').then((m) => ({ default: m.UserApprovals })))
const SuperNotifs = lazy(() => import('@/features/superadmin/pages').then((m) => ({ default: m.Notifications })))
const SuperReports = lazy(() => import('@/features/superadmin/pages').then((m) => ({ default: m.SuperReports })))
const SuperSettings = lazy(() => import('@/features/superadmin/pages').then((m) => ({ default: m.SuperSettings })))

const SuperadminPages = {
  Restaurants: SuperRestaurants,
  Users: SuperUsers,
  Plans: SuperPlans,
  Subscriptions: SuperSubs,
  Approvals: SuperApprovals,
  Notifications: SuperNotifs,
  Reports: SuperReports,
  Settings: SuperSettings,
}

const AdminDashboardC = lazy(() => import('@/features/admin/pages').then((m) => ({ default: m.AdminDashboard })))
const AdminOrders = lazy(() => import('@/features/admin/pages').then((m) => ({ default: m.AdminOrders })))
const AdminUsers = lazy(() => import('@/features/admin/pages').then((m) => ({ default: m.AdminUsers })))
const AdminProducts = lazy(() => import('@/features/admin/pages').then((m) => ({ default: m.AdminProducts })))
const AdminReports = lazy(() => import('@/features/admin/pages').then((m) => ({ default: m.AdminReports })))
const AdminSettings = lazy(() => import('@/features/admin/pages').then((m) => ({ default: m.AdminSettings })))

// AdminPages was the original lazy-loaded admin page registry. AdminRoutes.js
// in legacy merged admin into superadmin, so the v2 router redirects /admin/*
// straight to the superadmin equivalents. These component refs stay imported
// only so React's lazy() chunking emits them — referenced via a no-op
// `void` so TS' noUnusedLocals doesn't complain.
void AdminDashboardC; void AdminOrders; void AdminUsers
void AdminProducts; void AdminReports; void AdminSettings

const RestaurantDashboardC = lazy(() => import('@/features/restaurant/pages').then((m) => ({ default: m.RestaurantDashboard })))
const RestaurantBranches = lazy(() => import('@/features/restaurant/pages').then((m) => ({ default: m.Branches })))
const RestaurantOrdersC = lazy(() => import('@/features/restaurant/pages').then((m) => ({ default: m.RestaurantOrders })))
// Menu Items uses the new full-CRUD page (13-field form, image upload, addon
// group multi-select) — replaces the legacy list-only stub in pages.tsx.
const RestaurantMenuC = lazy(() => import('@/features/restaurant/MenuItems').then((m) => ({ default: m.RestaurantMenuItemsPage })))
const RestaurantUsersC = lazy(() => import('@/features/restaurant/pages').then((m) => ({ default: m.RestaurantUsers })))
const RestaurantCustomersC = lazy(() => import('@/features/restaurant/pages').then((m) => ({ default: m.RestaurantCustomers })))
const RestaurantPaymentGatewayC = lazy(() => import('@/features/restaurant/pages').then((m) => ({ default: m.RestaurantPaymentGateway })))
const RestaurantSlidersC = lazy(() => import('@/features/restaurant/pages').then((m) => ({ default: m.RestaurantSliders })))
const RestaurantBankC = lazy(() => import('@/features/restaurant/pages').then((m) => ({ default: m.RestaurantBank })))
const RestaurantOutstandingC = lazy(() => import('@/features/restaurant/pages').then((m) => ({ default: m.RestaurantOutstanding })))
const RestaurantWalletC = lazy(() => import('@/features/restaurant/pages').then((m) => ({ default: m.RestaurantWallet })))
const RestaurantWithdrawalsC = lazy(() => import('@/features/restaurant/extraPages').then((m) => ({ default: m.RestaurantWithdrawalsPage })))
const RestaurantLoansC = lazy(() => import('@/features/restaurant/extraPages').then((m) => ({ default: m.RestaurantLoansPage })))
const RestaurantReportsC = lazy(() => import('@/features/restaurant/pages').then((m) => ({ default: m.RestaurantReports })))
const RestaurantSettingsC = lazy(() => import('@/features/restaurant/extraPages').then((m) => ({ default: m.RestaurantSettingsPage })))
const RestaurantWalletTopupHistoryC = lazy(() => import('@/features/restaurant/extraPages').then((m) => ({ default: m.RestaurantWalletTopupHistoryPage })))

// 2026-06-24 — sub-pages module (10 new owner pages)
const RestaurantMenuCategoriesC = lazy(() => import('@/features/restaurant/subpages').then((m) => ({ default: m.RestaurantMenuCategories })))
const RestaurantMenuSubcategoriesC = lazy(() => import('@/features/restaurant/subpages').then((m) => ({ default: m.RestaurantMenuSubcategories })))
const RestaurantSectionsC = lazy(() => import('@/features/restaurant/subpages').then((m) => ({ default: m.RestaurantSections })))
const RestaurantDiningTablesC = lazy(() => import('@/features/restaurant/subpages').then((m) => ({ default: m.RestaurantDiningTables })))
const RestaurantDeliveryZonesC = lazy(() => import('@/features/restaurant/subpages').then((m) => ({ default: m.RestaurantDeliveryZones })))
const RestaurantAddonsC = lazy(() => import('@/features/restaurant/subpages').then((m) => ({ default: m.RestaurantAddons })))
const RestaurantAddonItemsC = lazy(() => import('@/features/restaurant/subpages').then((m) => ({ default: m.RestaurantAddonItems })))
const RestaurantHoursC = lazy(() => import('@/features/restaurant/subpages').then((m) => ({ default: m.RestaurantHours })))
const RestaurantCouponsC = lazy(() => import('@/features/restaurant/subpages').then((m) => ({ default: m.RestaurantCoupons })))
const RestaurantGalleryC = lazy(() => import('@/features/restaurant/subpages').then((m) => ({ default: m.RestaurantGallery })))

// 2026-06-25 — extra sub-pages module (next 10 high-value owner pages)
const RestaurantMenuVariantsC = lazy(() => import('@/features/restaurant/extraSubpages').then((m) => ({ default: m.RestaurantMenuVariants })))
const RestaurantItemAddonsC = lazy(() => import('@/features/restaurant/extraSubpages').then((m) => ({ default: m.RestaurantItemAddons })))
const RestaurantInventoryC = lazy(() => import('@/features/restaurant/extraSubpages').then((m) => ({ default: m.RestaurantInventory })))
const RestaurantVendorsC = lazy(() => import('@/features/restaurant/extraSubpages').then((m) => ({ default: m.RestaurantVendors })))
const RestaurantPurchaseOrdersC = lazy(() => import('@/features/restaurant/extraSubpages').then((m) => ({ default: m.RestaurantPurchaseOrders })))
const RestaurantExpensesC = lazy(() => import('@/features/restaurant/extraSubpages').then((m) => ({ default: m.RestaurantExpenses })))
const RestaurantPLReportC = lazy(() => import('@/features/restaurant/extraSubpages').then((m) => ({ default: m.RestaurantPLReport })))
const RestaurantAuditTrailC = lazy(() => import('@/features/restaurant/extraSubpages').then((m) => ({ default: m.RestaurantAuditTrail })))
const RestaurantApiKeysC = lazy(() => import('@/features/restaurant/extraSubpages').then((m) => ({ default: m.RestaurantApiKeys })))
const RestaurantNotificationPrefsC = lazy(() => import('@/features/restaurant/extraSubpages').then((m) => ({ default: m.RestaurantNotificationPrefs })))

const RestaurantPages = {
  Dashboard: RestaurantDashboardC,
  Branches: RestaurantBranches,
  Orders: RestaurantOrdersC,
  Menu: RestaurantMenuC,
  Users: RestaurantUsersC,
  Customers: RestaurantCustomersC,
  PaymentGateway: RestaurantPaymentGatewayC,
  Sliders: RestaurantSlidersC,
  Bank: RestaurantBankC,
  Outstanding: RestaurantOutstandingC,
  Wallet: RestaurantWalletC,
  Withdrawals: RestaurantWithdrawalsC,
  Loans: RestaurantLoansC,
  Reports: RestaurantReportsC,
  Settings: RestaurantSettingsC,
  WalletTopupHistory: RestaurantWalletTopupHistoryC,
  MenuCategories: RestaurantMenuCategoriesC,
  MenuSubcategories: RestaurantMenuSubcategoriesC,
  Sections: RestaurantSectionsC,
  DiningTables: RestaurantDiningTablesC,
  DeliveryZones: RestaurantDeliveryZonesC,
  Addons: RestaurantAddonsC,
  AddonItems: RestaurantAddonItemsC,
  Hours: RestaurantHoursC,
  Coupons: RestaurantCouponsC,
  Gallery: RestaurantGalleryC,
  // 2026-06-25 extras
  MenuVariants: RestaurantMenuVariantsC,
  ItemAddons: RestaurantItemAddonsC,
  Inventory: RestaurantInventoryC,
  Vendors: RestaurantVendorsC,
  PurchaseOrders: RestaurantPurchaseOrdersC,
  Expenses: RestaurantExpensesC,
  PLReport: RestaurantPLReportC,
  AuditTrail: RestaurantAuditTrailC,
  ApiKeys: RestaurantApiKeysC,
  NotificationPrefs: RestaurantNotificationPrefsC,
}

const CustomerSite = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.HomePage })))
const CustomerMenu = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.MenuPage })))
const CustomerSignature = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.SignaturePage })))
const CustomerWhyUs = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.WhyUsPage })))
const CustomerGallery = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.GalleryPage })))
const CustomerContact = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.ContactPage })))
const CustomerCart = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.CartPage })))
const CustomerCheckout = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.CheckoutPage })))
const CustomerOrders = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.MyOrdersPage })))
const CustomerProfile = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.ProfilePage })))
const CustomerAbout = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.AboutPage })))
const CustomerTerms = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.TermsPage })))
const CustomerPrivacy = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.PrivacyPage })))
const CustomerRefund = lazy(() => import('@/features/customer/pages').then((m) => ({ default: m.RefundPage })))

// Mark unused exports so eslint doesn't trip on the placeholder bundle
void BranchPagesMod
