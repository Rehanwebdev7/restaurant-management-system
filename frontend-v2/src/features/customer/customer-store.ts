/**
 * Shared client-side state for the customer site:
 *   - Wishlist (localStorage: `customer_wishlist_v2`)
 *   - Theme mode (localStorage: `customer_theme_mode`)
 *
 * Implemented as hooks backed by a tiny pub/sub so multiple components
 * (e.g. <CustomerLayout> header heart icon and a dish card on the home
 * page) stay in sync without prop drilling or a heavy state library.
 */

import { useEffect, useState } from 'react'

/* ---------------- wishlist ---------------- */

const WISHLIST_KEY = 'customer_wishlist_v2'
const wishlistListeners = new Set<(ids: number[]) => void>()

function readWishlist(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(WISHLIST_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is number => typeof x === 'number')
  } catch {
    return []
  }
}

function writeWishlist(ids: number[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids))
  wishlistListeners.forEach((fn) => fn(ids))
}

export interface UseWishlist {
  ids: number[]
  has: (id: number) => boolean
  toggle: (id: number) => void
  remove: (id: number) => void
  clear: () => void
}

export function useWishlist(): UseWishlist {
  const [ids, setIds] = useState<number[]>(readWishlist)

  useEffect(() => {
    const listener = (next: number[]) => setIds(next)
    wishlistListeners.add(listener)
    // Cross-tab sync via storage event
    const onStorage = (e: StorageEvent) => {
      if (e.key === WISHLIST_KEY) setIds(readWishlist())
    }
    window.addEventListener('storage', onStorage)
    return () => {
      wishlistListeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return {
    ids,
    has: (id: number) => ids.includes(id),
    toggle: (id: number) => {
      const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
      writeWishlist(next)
    },
    remove: (id: number) => {
      const next = ids.filter((x) => x !== id)
      writeWishlist(next)
    },
    clear: () => writeWishlist([]),
  }
}

/* ---------------- theme ---------------- */

const THEME_KEY = 'customer_theme_mode'
const themeListeners = new Set<(mode: ThemeMode) => void>()

export type ThemeMode = 'light' | 'dark'

function readTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'
  const raw = localStorage.getItem(THEME_KEY)
  return raw === 'light' ? 'light' : 'dark'
}

function writeTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(THEME_KEY, mode)
  themeListeners.forEach((fn) => fn(mode))
}

export interface UseCustomerTheme {
  mode: ThemeMode
  toggle: () => void
  setMode: (mode: ThemeMode) => void
}

export function useCustomerTheme(): UseCustomerTheme {
  const [mode, setModeState] = useState<ThemeMode>(readTheme)

  useEffect(() => {
    const listener = (next: ThemeMode) => setModeState(next)
    themeListeners.add(listener)
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) setModeState(readTheme())
    }
    window.addEventListener('storage', onStorage)
    return () => {
      themeListeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return {
    mode,
    toggle: () => writeTheme(mode === 'dark' ? 'light' : 'dark'),
    setMode: (next: ThemeMode) => writeTheme(next),
  }
}
