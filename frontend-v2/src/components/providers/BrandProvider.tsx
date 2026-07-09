import { colord } from 'colord'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchCustomerBranding } from '@/api/services/customer'

/**
 * Dynamic Restaurant brand provider.
 *
 * One-time fetch of `/api/customer/branding` on mount.
 * Sets CSS custom properties dynamically on the root element.
 */

/** Parsed socialMediaLinks JSON. Backend returns as string blob. */
export interface SocialLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  youtube?: string
  linkedin?: string
  whatsapp?: string
}

interface BrandContextValue {
  restaurantName: string
  tagline: string
  logoUrl: string | null
  primaryHex: string
  radius: string
  fontSans: string
  fontSerif: string
  loading: boolean
  /** True when the backend resolved the request Host to a real tenant domain.
   * False for localhost, unknown hosts, and the demo fallback branding.
   * Used to gate "seed" placeholder sections (chef story, awards, press, FAQ,
   * testimonials) — real tenants never see the demo content, demo domains do. */
  domainResolved: boolean
  // Widened per-tenant fields (2026-07-10) — surfaced by `CustBrandingController`
  // via approved projection widen. UI must gate rendering on presence.
  fssaiNumber: string | null
  gstNumber: string | null
  whatsappNumber: string | null
  phone: string | null
  email: string | null
  address: string | null
  googleMapEmbed: string | null
  googleRatingUrl: string | null
  /** Parsed from backend JSON string; empty object when missing/malformed. */
  socialLinks: SocialLinks
  aboutUs: string | null
  ourMission: string | null
  ourVision: string | null
  marqueeText: string | null
  marqueeIsLive: boolean
  marqueeBgColor: string | null
  marqueeTextColor: string | null
  marqueeSpeed: number
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
  domainResolved?: boolean
  // widened fields
  fssaiNumber?: string | null
  gstNumber?: string | null
  whatsappNumber?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  googleMapEmbed?: string | null
  googleRatingUrl?: string | null
  socialMediaLinks?: string | null
  aboutUs?: string | null
  ourMission?: string | null
  ourVision?: string | null
  marqueeText?: string | null
  marqueeIsLive?: boolean | null
  marqueeBgColor?: string | null
  marqueeTextColor?: string | null
  marqueeSpeed?: number | null
}

const EMPTY_WIDENED = {
  fssaiNumber: null as string | null,
  gstNumber: null as string | null,
  whatsappNumber: null as string | null,
  phone: null as string | null,
  email: null as string | null,
  address: null as string | null,
  googleMapEmbed: null as string | null,
  googleRatingUrl: null as string | null,
  socialLinks: {} as SocialLinks,
  aboutUs: null as string | null,
  ourMission: null as string | null,
  ourVision: null as string | null,
  marqueeText: null as string | null,
  marqueeIsLive: false,
  marqueeBgColor: null as string | null,
  marqueeTextColor: null as string | null,
  marqueeSpeed: 30,
}

function parseSocialLinks(raw: string | null | undefined): SocialLinks {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as SocialLinks
  } catch { /* malformed JSON — silently ignore */ }
  return {}
}

function nonBlank(v: string | null | undefined): string | null {
  if (v == null) return null
  const trimmed = String(v).trim()
  return trimmed.length > 0 ? trimmed : null
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(readCached)
  const [loading, setLoading] = useState(true)
  const [domainResolved, setDomainResolved] = useState(false)
  const [widened, setWidened] = useState(EMPTY_WIDENED)

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
      setDomainResolved(payload.domainResolved === true)
      setWidened({
        fssaiNumber: nonBlank(payload.fssaiNumber),
        gstNumber: nonBlank(payload.gstNumber),
        whatsappNumber: nonBlank(payload.whatsappNumber),
        phone: nonBlank(payload.phone),
        email: nonBlank(payload.email),
        address: nonBlank(payload.address),
        googleMapEmbed: nonBlank(payload.googleMapEmbed),
        googleRatingUrl: nonBlank(payload.googleRatingUrl),
        socialLinks: parseSocialLinks(payload.socialMediaLinks),
        aboutUs: nonBlank(payload.aboutUs),
        ourMission: nonBlank(payload.ourMission),
        ourVision: nonBlank(payload.ourVision),
        marqueeText: nonBlank(payload.marqueeText),
        marqueeIsLive: payload.marqueeIsLive === true,
        marqueeBgColor: nonBlank(payload.marqueeBgColor),
        marqueeTextColor: nonBlank(payload.marqueeTextColor),
        marqueeSpeed: payload.marqueeSpeed && payload.marqueeSpeed > 0 ? payload.marqueeSpeed : 30,
      })
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
    <BrandContext.Provider value={{ ...state, loading, domainResolved, ...widened, setBrand }}>
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
