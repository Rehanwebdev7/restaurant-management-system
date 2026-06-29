import type { ComponentType } from 'react'
import {
  LayoutDashboard,
  ChefHat,
  ClipboardList,
  BarChart3,
  Bike,
  Wallet,
  Receipt,
  Users,
  Settings,
  ShoppingBag,
  Building2,
  ListChecks,
  ShieldCheck,
  ShieldAlert,
  Bell,
  Tags,
  QrCode,
  Split,
  Layers,
  Map as MapIcon,
  ListPlus,
  Clock,
  Ticket,
  Image as ImageIcon,
  Package,
  Truck,
  FileText,
  TrendingUp,
  Key,
  Boxes,
  Coins,
  Trash,
  MessageSquare,
  NotebookPen,
  Wrench,
  GraduationCap,
} from 'lucide-react'

/**
 * Config-driven sidebar replacing 7 hand-coded role sidebars (200–437 LOC each)
 * from legacy `frontend/src/components/*Sidebar.js`.
 */
export type Role =
  | 'superadmin'
  | 'admin'
  | 'restaurant'
  | 'branch'
  | 'cashier'
  | 'kitchen'
  | 'delivery'
  | 'customer'

export interface NavItem {
  /** Leaf link target. Required unless `children` is present. */
  to?: string
  label: string
  icon: ComponentType<{ className?: string }>
  badge?: string | number
  exact?: boolean
  /**
   * Optional submenu — when present, the item renders as a collapsible parent
   * (no link). Mirrors the legacy parent → children grouping (e.g. "User
   * Management" → All Users / Roles / …). The group auto-expands when the
   * current route matches any child.
   */
  children?: NavItem[]
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

export const sidebarConfig: Record<Role, NavSection[]> = {
  superadmin: [
    {
      items: [
        { to: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { to: '/superadmin/restaurants', label: 'Restaurants', icon: Building2 },
        { to: '/superadmin/users', label: 'Users', icon: Users },
        { to: '/superadmin/subscription-plans', label: 'Plans', icon: Tags },
        { to: '/superadmin/subscriptions', label: 'Subscriptions', icon: Receipt },
        { to: '/superadmin/user-approvals', label: 'Approvals', icon: ShieldCheck },
        { to: '/superadmin/notifications', label: 'Notifications', icon: Bell },
        { to: '/superadmin/audit-log', label: 'Audit Log', icon: ListChecks },
        { to: '/superadmin/reports', label: 'Reports', icon: BarChart3 },
        { to: '/superadmin/settings', label: 'Settings', icon: Settings },
      ],
    },
  ],
  // LEGACY: `AdminRoutes.js` merges admin + superadmin into one platform panel.
  // This config mirrors the superadmin sidebar so `userType: 'admin'` sees the
  // same UI when they happen to hit an /admin/* link before the redirect kicks in.
  admin: [
    {
      items: [
        { to: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { to: '/superadmin/restaurants', label: 'Restaurants', icon: Building2 },
        { to: '/superadmin/users', label: 'Users', icon: Users },
        { to: '/superadmin/subscription-plans', label: 'Plans', icon: Tags },
        { to: '/superadmin/subscriptions', label: 'Subscriptions', icon: Receipt },
        { to: '/superadmin/user-approvals', label: 'Approvals', icon: ShieldCheck },
        { to: '/superadmin/notifications', label: 'Notifications', icon: Bell },
        { to: '/superadmin/audit-log', label: 'Audit Log', icon: ListChecks },
        { to: '/superadmin/reports', label: 'Reports', icon: BarChart3 },
        { to: '/superadmin/settings', label: 'Settings', icon: Settings },
      ],
    },
  ],
  restaurant: [
    {
      items: [
        { to: '/restaurant/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        {
          label: 'User Management', icon: Users,
          children: [
            { to: '/restaurant/branches', label: 'Branches', icon: Building2 },
            { to: '/restaurant/users', label: 'Staff', icon: Users },
            { to: '/restaurant/customers', label: 'Customers', icon: Users },
          ],
        },
        {
          label: 'Menu Management', icon: ShoppingBag,
          children: [
            { to: '/restaurant/menu', label: 'Items', icon: ShoppingBag },
            { to: '/restaurant/menu-categories', label: 'Categories', icon: Tags },
            { to: '/restaurant/menu-subcategories', label: 'Subcategories', icon: Tags },
            { to: '/restaurant/menu-variants', label: 'Variants', icon: Layers },
            { to: '/restaurant/addons', label: 'Addons', icon: ChefHat },
            { to: '/restaurant/addon-items', label: 'Addon Items', icon: ListPlus },
            { to: '/restaurant/item-addons', label: 'Item Addons', icon: ListPlus },
            { to: '/restaurant/sections', label: 'Sections', icon: Layers },
            { to: '/restaurant/dining-tables', label: 'Dining Tables', icon: QrCode },
            { to: '/restaurant/hours', label: 'Hours', icon: Clock },
            { to: '/restaurant/delivery-zones', label: 'Delivery Zones', icon: MapIcon },
          ],
        },
        {
          label: 'Orders & Outstanding', icon: ClipboardList,
          children: [
            { to: '/restaurant/orders', label: 'Orders', icon: ClipboardList },
            { to: '/restaurant/outstanding', label: 'Outstanding', icon: Receipt },
          ],
        },
        {
          label: 'Inventory & Vendors', icon: Package,
          children: [
            { to: '/restaurant/inventory', label: 'Inventory', icon: Package },
            { to: '/restaurant/vendors', label: 'Vendors', icon: Truck },
            { to: '/restaurant/purchase-orders', label: 'Purchase Orders', icon: FileText },
            { to: '/restaurant/expenses', label: 'Expenses', icon: Wallet },
          ],
        },
        {
          label: 'Finance', icon: Wallet,
          children: [
            { to: '/restaurant/wallet', label: 'Wallet', icon: Wallet },
            { to: '/restaurant/wallet-topup-history', label: 'Top-up History', icon: Wallet },
            { to: '/restaurant/withdrawals', label: 'Withdrawals', icon: Receipt },
            { to: '/restaurant/loans', label: 'Loans', icon: Receipt },
            { to: '/restaurant/bank', label: 'Bank Accounts', icon: Building2 },
            { to: '/restaurant/payment-gateway', label: 'Payment Gateways', icon: Receipt },
          ],
        },
        {
          label: 'Marketing', icon: Ticket,
          children: [
            { to: '/restaurant/coupons', label: 'Coupons', icon: Ticket },
            { to: '/restaurant/sliders', label: 'Sliders', icon: ListChecks },
            { to: '/restaurant/gallery', label: 'Gallery', icon: ImageIcon },
          ],
        },
        {
          label: 'Reports', icon: BarChart3,
          children: [
            { to: '/restaurant/reports', label: 'Sales Reports', icon: BarChart3 },
            { to: '/restaurant/profit-loss-report', label: 'P&L Report', icon: TrendingUp },
            { to: '/restaurant/audit-trail', label: 'Audit Trail', icon: ShieldAlert },
          ],
        },
        {
          label: 'Settings', icon: Settings,
          children: [
            { to: '/restaurant/api-keys', label: 'API Keys', icon: Key },
            { to: '/restaurant/notification-preferences', label: 'Notifications', icon: Bell },
            { to: '/restaurant/settings', label: 'General Settings', icon: Settings },
          ],
        },
      ],
    },
  ],
  branch: [
    {
      items: [
        { to: '/branch/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { to: '/branch/orders', label: 'Orders', icon: ClipboardList },
        {
          label: 'Menu Management', icon: ShoppingBag,
          children: [
            { to: '/branch/menu', label: 'Items', icon: ShoppingBag },
            { to: '/branch/menu-categories', label: 'Categories', icon: Tags },
            { to: '/branch/menu-subcategories', label: 'Subcategories', icon: Tags },
            { to: '/branch/addons', label: 'Addons', icon: ChefHat },
            { to: '/branch/addon-items', label: 'Addon Items', icon: ListPlus },
            { to: '/branch/sections', label: 'Sections', icon: Layers },
            { to: '/branch/dining-tables', label: 'Dining Tables', icon: QrCode },
            { to: '/branch/hours', label: 'Hours', icon: Clock },
            { to: '/branch/delivery-zones', label: 'Delivery Zones', icon: MapIcon },
          ],
        },
        {
          label: 'Marketing', icon: Ticket,
          children: [
            { to: '/branch/coupons', label: 'Coupons', icon: Ticket },
            { to: '/branch/sliders', label: 'Sliders', icon: ImageIcon },
          ],
        },
        {
          label: 'Operations', icon: ListChecks,
          children: [
            { to: '/branch/inventory', label: 'Inventory', icon: Boxes },
            { to: '/branch/wastage', label: 'Wastage', icon: Trash },
            { to: '/branch/cash-register', label: 'Cash Register', icon: Coins },
            { to: '/branch/petty-cash', label: 'Petty Cash', icon: Wallet },
            { to: '/branch/shift-handover', label: 'Shift Handover', icon: NotebookPen },
            { to: '/branch/maintenance-log', label: 'Maintenance', icon: Wrench },
          ],
        },
        {
          label: 'People', icon: Users,
          children: [
            { to: '/branch/users', label: 'Staff', icon: Users },
            { to: '/branch/staff-attendance', label: 'Attendance', icon: Clock },
            { to: '/branch/staff-roles', label: 'Roles & Perms', icon: ShieldCheck },
            { to: '/branch/training-records', label: 'Training', icon: GraduationCap },
            { to: '/branch/customers', label: 'Customers', icon: Users },
            { to: '/branch/customer-feedback', label: 'Feedback', icon: MessageSquare },
          ],
        },
        {
          label: 'Finance', icon: Wallet,
          children: [
            { to: '/branch/outstanding', label: 'Outstanding', icon: Receipt },
            { to: '/branch/wallet-topup', label: 'Wallet Top-up', icon: Wallet },
          ],
        },
        { to: '/branch/settings', label: 'Settings', icon: Settings },
      ],
    },
  ],
  cashier: [
    {
      items: [
        { to: '/cashier/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { to: '/cashier/new-order', label: 'New Order', icon: ShoppingBag },
        { to: '/cashier/operations', label: 'Operations', icon: ListChecks },
        {
          label: 'Orders', icon: ClipboardList,
          children: [
            { to: '/cashier/orders', label: 'All Orders', icon: ClipboardList },
            { to: '/cashier/dine-in', label: 'Dine-In', icon: Layers },
            { to: '/cashier/takeaway', label: 'Takeaway', icon: ShoppingBag },
            { to: '/cashier/delivery', label: 'Delivery', icon: Bike },
            { to: '/cashier/refund', label: 'Refund', icon: Receipt },
            { to: '/cashier/split-bill', label: 'Split Bill', icon: Split },
          ],
        },
        {
          label: 'Catalog', icon: ListChecks,
          children: [
            { to: '/cashier/menu-view', label: 'Menu', icon: ListChecks },
            { to: '/cashier/customers', label: 'Customers', icon: Users },
            { to: '/cashier/coupons', label: 'Coupons', icon: Ticket },
            { to: '/cashier/table-qr-codes', label: 'Table QR Codes', icon: QrCode },
          ],
        },
        {
          label: 'Finance', icon: Wallet,
          children: [
            { to: '/cashier/outstanding', label: 'Outstanding', icon: Receipt },
            { to: '/cashier/wallet-topup', label: 'Wallet Top-up', icon: Wallet },
            { to: '/cashier/wallet-topup-history', label: 'Top-up History', icon: Wallet },
          ],
        },
        { to: '/cashier/shift-close', label: 'Shift Close', icon: Clock },
      ],
    },
  ],
  kitchen: [
    {
      items: [
        { to: '/kitchen/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { to: '/kitchen/display', label: 'KDS Display', icon: ChefHat },
        { to: '/kitchen/orders', label: 'Order History', icon: ListChecks },
        { to: '/kitchen/reports', label: 'Reports', icon: BarChart3 },
      ],
    },
  ],
  delivery: [
    {
      items: [
        { to: '/delivery/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { to: '/delivery/active', label: 'Active Orders', icon: Bike },
        { to: '/delivery/wallet', label: 'Wallet', icon: Wallet },
        { to: '/delivery/bank', label: 'Bank Accounts', icon: Building2 },
        { to: '/delivery/history', label: 'History', icon: Receipt },
        { to: '/delivery/withdraw', label: 'Withdraw', icon: ListChecks },
      ],
    },
  ],
  customer: [
    {
      items: [
        { to: '/menu', label: 'Menu', icon: ShoppingBag },
        { to: '/orders', label: 'My Orders', icon: ClipboardList },
        { to: '/profile', label: 'Profile', icon: Users },
      ],
    },
  ],
}
