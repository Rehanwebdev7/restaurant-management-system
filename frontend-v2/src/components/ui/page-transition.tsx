/**
 * PageTransition — native-feeling page swap for customer routes.
 *
 * Mobile (< lg): slide-from-right on enter, slide-to-left on exit (spring,
 * ~320 ms). Mirrors iOS / Swiggy navigation feel.
 *
 * Desktop (≥ lg): subtle fade + slide-up (200 ms tween). Stays subtle so
 * the eye isn't pulled around on large screens.
 *
 * Honors `prefers-reduced-motion` — collapses to an instant cross-fade.
 *
 * Wrap inside CustomerLayout main; `useLocation()` provides the key so
 * AnimatePresence detects route changes.
 */

import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  children: ReactNode
}

function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    let mq: MediaQueryList
    try {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    } catch {
      return
    }
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return prefers
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 1024
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 1023px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    setIsMobile(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isMobile
}

export function PageTransition({ children }: Props) {
  const location = useLocation()
  const reduced = usePrefersReducedMotion()
  const mobile = useIsMobile()

  // Reduced motion: render children directly. We deliberately skip
  // AnimatePresence + motion.div entirely so there is no fade-in overlay
  // window during which a controlled input's onChange events could be
  // missed (this fixes E2E flake where fill()/keyboard.type() reached
  // a stale motion-wrapped DOM node). Also helps screen-reader users
  // who prefer no motion at all.
  if (reduced) {
    // location key is unused in this branch, intentional.
    void location
    return <>{children}</>
  }

  if (mobile) {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.7 }}
          style={{ willChange: 'transform, opacity' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    )
  }

  // Desktop: subtle fade + slight up-shift.
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default PageTransition
