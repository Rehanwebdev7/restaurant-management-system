/**
 * TanStack Query Key Factory.
 *
 * Centralized so we can invalidate by namespace without typos.
 * One branch per backend resource. Add as we port modules.
 *
 * Pattern (from plan):
 *   qk.<resource>.all     → invalidates everything for a resource
 *   qk.<resource>.list(f) → list with filters
 *   qk.<resource>.detail(id) → single entity
 */

export const qk = {
  auth: {
    all: ['auth'] as const,
    me: () => [...qk.auth.all, 'me'] as const,
  },

  orders: {
    all: ['orders'] as const,
    list: (filters: Record<string, unknown> = {}) => [...qk.orders.all, 'list', filters] as const,
    detail: (id: string | number) => [...qk.orders.all, 'detail', String(id)] as const,
  },

  menuItems: {
    all: ['menu-items'] as const,
    list: (filters: Record<string, unknown> = {}) => [...qk.menuItems.all, 'list', filters] as const,
    detail: (id: string | number) => [...qk.menuItems.all, 'detail', String(id)] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    kitchen: () => [...qk.notifications.all, 'kitchen'] as const,
  },

  branding: {
    all: ['branding'] as const,
    current: () => [...qk.branding.all, 'current'] as const,
  },

  // Add new resources here as panels are ported.
} as const

export type QueryKeys = typeof qk
