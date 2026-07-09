import { colord } from 'colord'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchCustomerBranding } from '@/api/services/customer'

/**
 * Dynamic Restaurant brand provider.
 *
 * One-time fetch of `/api/customer/branding` on mount.
 * Sets CSS custom properties dynamically on the root element.
 */

interface BrandContextValue {
  restaurantName: string
  tagline: string
  logoUrl: string | null
  primaryHex: string
  radius: string
  fontSans: string
  fontSerif: string
  loading: boolean
  setBrand: (patch: Partial<Omit<BrandContextValue, 'loading' | 'setBrand'>>) => void
}

const BrandContext = createContext<BrandContextValue | null>(null)

const DEFAULTS = {
  restaurantName: 'Spice Garden',
  tagline: 'STEAKHOUSE',
  logoUrl: null as string | null,
  primaryHex: '#C9A96E', // Gold default
  radius: '16px',
  fontSans: 'Outfit',
  fontSerif: 'Cormorant Garamond',
}

const STORAGE_KEY = 'rms_brand_v2'

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

function applyThemeToRoot(state: typeof DEFAULTS): void {
  const hex = state.primaryHex
  const color = colord(hex)
  if (!color.isValid()) return
  const { h, s, l } = color.toHsl()
  const rgb = color.toRgb()

  // Standard primary variables (for Shadcn framework integration)
  document.documentElement.style.setProperty('--primary', `${h} ${s}% ${l}%`)
  document.documentElement.style.setProperty('--ring', `${h} ${s}% ${l}%`)
  const fg = color.isDark() ? '0 0% 100%' : '222 47% 11%'
  document.documentElement.style.setProperty('--primary-foreground', fg)

  // Customer Redesign theme tokens mapping
  document.documentElement.style.setProperty('--c-primary', hex)
  document.documentElement.style.setProperty('--c-primary-hover', color.darken(0.08).toHex())
  document.documentElement.style.setProperty('--c-primary-light', color.alpha(0.12).toRgbString())
  document.documentElement.style.setProperty('--c-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)

  // Radius token
  document.documentElement.style.setProperty('--c-radius', state.radius)

  // Typography tokens
  document.documentElement.style.setProperty('--c-font-sans', state.fontSans)
  document.documentElement.style.setProperty('--c-font-serif', state.fontSerif)

  // Dynamic shadows
  document.documentElement.style.setProperty('--c-shadow-primary', `0 10px 30px -10px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`)
  document.documentElement.style.setProperty('--c-shadow-primary-sm', `0 4px 12px -2px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`)
}

interface ExtendedBranding {
  restaurantName?: string
  name?: string
  tagline?: string
  subtitle?: string
  logoUrl?: string
  logo?: string
  primaryColor?: string
  primaryHex?: string
  radius?: string
  fontSans?: string
  fontSerif?: string
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(readCached)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    applyThemeToRoot(state)
  }, [state])

  // One-time fetch — never blocks render (UI already cached).
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const payload = await fetchCustomerBranding() as ExtendedBranding | null
      if (cancelled || !payload) {
        setLoading(false)
        return
      }
      const next = {
        restaurantName: payload.restaurantName ?? payload.name ?? state.restaurantName,
        tagline: payload.tagline ?? payload.subtitle ?? state.tagline,
        logoUrl: payload.logoUrl ?? payload.logo ?? state.logoUrl,
        primaryHex: payload.primaryColor ?? payload.primaryHex ?? state.primaryHex,
        radius: payload.radius ?? state.radius,
        fontSans: payload.fontSans ?? state.fontSans,
        fontSerif: payload.fontSerif ?? state.fontSerif,
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

// eslint-disable-next-line react-refresh/only-export-components
export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error('useBrand must be used within <BrandProvider>')
  return ctx
}
