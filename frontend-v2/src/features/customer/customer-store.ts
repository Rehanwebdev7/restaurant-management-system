import { useWishlistStore } from './store/useWishlistStore'
import { useThemeStore, type ThemeMode } from './store/useThemeStore'

export type { ThemeMode }

export interface UseWishlist {
  ids: number[]
  has: (id: number) => boolean
  toggle: (id: number) => void
  remove: (id: number) => void
  clear: () => void
}

export function useWishlist(): UseWishlist {
  const ids = useWishlistStore((state) => state.ids)
  const has = useWishlistStore((state) => state.has)
  const toggle = useWishlistStore((state) => state.toggle)
  const remove = useWishlistStore((state) => state.remove)
  const clear = useWishlistStore((state) => state.clear)

  return { ids, has, toggle, remove, clear }
}

export interface UseCustomerTheme {
  mode: ThemeMode
  toggle: () => void
  setMode: (mode: ThemeMode) => void
}

export function useCustomerTheme(): UseCustomerTheme {
  const mode = useThemeStore((state) => state.mode)
  const toggle = useThemeStore((state) => state.toggle)
  const setMode = useThemeStore((state) => state.setMode)

  return { mode, toggle, setMode }
}
