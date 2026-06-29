/**
 * use-haptic — tiny tap-feedback hook for mobile.
 *
 * Returns a `vibrate(pattern)` function that triggers `navigator.vibrate`
 * when supported (Android Chrome / WebView). On iOS Safari and unsupported
 * environments this is a no-op — never throws, never warns.
 *
 * Patterns:
 *   - 'light'  →  10 ms  (toggle / selection)
 *   - 'medium' →  20 ms  (default — add to cart, primary action)
 *   - 'heavy'  →  30 ms  (destructive / commit)
 *
 * Also respects `prefers-reduced-motion` — fully bypassed when reduced
 * motion is requested by the OS.
 */

import { useCallback } from 'react'

export type HapticPattern = 'light' | 'medium' | 'heavy'

export interface UseHaptic {
  vibrate: (pattern?: HapticPattern) => void
}

function patternToDuration(pattern: HapticPattern): number {
  if (pattern === 'light') return 10
  if (pattern === 'heavy') return 30
  return 20
}

export function useHaptic(): UseHaptic {
  const vibrate = useCallback((pattern: HapticPattern = 'medium') => {
    if (typeof window === 'undefined') return
    if (typeof navigator === 'undefined') return
    if (typeof navigator.vibrate !== 'function') return
    // Respect OS-level reduced motion preference — vibration counts as motion.
    try {
      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
      if (mq && mq.matches) return
    } catch {
      // matchMedia unavailable — fall through, still attempt vibrate.
    }
    try {
      navigator.vibrate(patternToDuration(pattern))
    } catch {
      // Some browsers throw if called outside a user gesture — swallow.
    }
  }, [])

  return { vibrate }
}
