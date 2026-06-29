import { useEffect, useState } from 'react'

/**
 * UI-F-2: media query hook used to swap mobile/desktop UI primitives.
 *  - SSR safe (defaults to `false` when window is undefined).
 *  - Subscribes to `matchMedia.change` so the value stays live.
 */
export function useMediaQuery(query: string): boolean {
  const get = (): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia(query).matches
  }

  const [matches, setMatches] = useState<boolean>(get)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** Convenience helper — ≤ 768px viewport (Tailwind's `md` breakpoint - 1). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)')
}
