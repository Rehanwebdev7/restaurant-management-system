import { colord } from 'colord'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchCustomerBranding } from '@/api/services/customer'

/**
 * UI-F-51 / UI-F-53: Restaurant brand provider.
 *
 * One-time fetch of `/api/customer/branding` on mount (cached for the
 * session). Falls back to defaults if backend returns 500 / unauthorized.
 *
 * Exposes: restaurantName, tagline, logoUrl, primaryHex + a setBrand
 * imperative setter so the platform restaurant-settings UI can preview
 * changes without a full reload.
 */

interface BrandContextValue {
  restaurantName: string
  tagline: string
  logoUrl: string | null
  primaryHex: string
  loading: boolean
  setBrand: (patch: Partial<Omit<BrandContextValue, 'loading' | 'setBrand'>>) => void
}

const BrandContext = createContext<BrandContextValue | null>(null)

const DEFAULTS = {
  restaurantName: 'Spice Garden',
  tagline: 'STEAKHOUSE',
  logoUrl: null as string | null,
  primaryHex: '#F97316',
}

const STORAGE_KEY = 'rms_brand_v1'

function readCached(): typeof DEFAULTS {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULTS
  }
}

function writeCached(value: typeof DEFAULTS): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    /* ignore quota errors */
  }
}

function applyBrandToRoot(hex: string): void {
  const color = colord(hex)
  if (!color.isValid()) return
  const { h, s, l } = color.toHsl()
  document.documentElement.style.setProperty('--primary', `${h} ${s}% ${l}%`)
  document.documentElement.style.setProperty('--ring', `${h} ${s}% ${l}%`)
  const fg = color.isDark() ? '0 0% 100%' : '222 47% 11%'
  document.documentElement.style.setProperty('--primary-foreground', fg)
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(readCached)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    applyBrandToRoot(state.primaryHex)
  }, [state.primaryHex])

  // One-time fetch — never blocks render (UI already cached).
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const payload = await fetchCustomerBranding()
      if (cancelled || !payload) {
        setLoading(false)
        return
      }
      const next = {
        restaurantName: payload.restaurantName ?? payload.name ?? state.restaurantName,
        tagline: payload.tagline ?? payload.subtitle ?? state.tagline,
        logoUrl: payload.logoUrl ?? payload.logo ?? state.logoUrl,
        primaryHex: payload.primaryColor ?? payload.primaryHex ?? state.primaryHex,
      }
      setState(next)
      writeCached(next)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setBrand = (patch: Partial<typeof DEFAULTS>): void => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      writeCached(next)
      return next
    })
  }

  return (
    <BrandContext.Provider value={{ ...state, loading, setBrand }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error('useBrand must be used within <BrandProvider>')
  return ctx
}
