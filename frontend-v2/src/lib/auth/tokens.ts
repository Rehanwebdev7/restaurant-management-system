/**
 * Auth token storage helpers.
 * Preserves old localStorage keys for cross-build compatibility (UI-F-23).
 *
 * NOTE: plain-text localStorage is documented security debt — pay down in NestJS migration.
 */

const KEYS = {
  authToken: 'authToken',
  customerToken: 'customerToken',
  refreshToken: 'refreshToken',
  userRole: 'UserRole',
  userName: 'UserName',
  userMobile: 'UserMobile',
  userId: 'UserId',
  user: 'user',
} as const

export type TokenKind = 'auth' | 'customer'

export const tokens = {
  getAuth: () => localStorage.getItem(KEYS.authToken),
  getCustomer: () => localStorage.getItem(KEYS.customerToken),
  getRefresh: () => localStorage.getItem(KEYS.refreshToken),

  /**
   * Pick the right token for a URL.
   * `/api/customer/*` → customerToken; else authToken.
   */
  getForUrl: (url: string): string | null => {
    if (url.includes('/api/customer/')) {
      return localStorage.getItem(KEYS.customerToken)
    }
    return localStorage.getItem(KEYS.authToken)
  },

  setAuth: (token: string) => localStorage.setItem(KEYS.authToken, token),
  setCustomer: (token: string) => localStorage.setItem(KEYS.customerToken, token),
  setRefresh: (token: string) => localStorage.setItem(KEYS.refreshToken, token),

  clearAll: () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
    // Also clear UI prefs that are tied to session
    localStorage.removeItem('dark-mode')
  },
}

export const TOKEN_STORAGE_KEYS = KEYS
