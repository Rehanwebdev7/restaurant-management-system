import { useCallback, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Magnetic-button hook. Attach the returned `ref` to the button and the
 * `handlers` to a parent container (e.g. the hero section). When the cursor
 * enters `radius` px of the button's centre, the button translates toward
 * the cursor at `strength` (0–1). Snaps back on leave. Desktop only —
 * no-op on touch (media query `(hover: none)` handled at parent) or when
 * the user prefers reduced motion.
 */
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(
  radius = 120,
  strength = 0.35,
) {
  const ref = useRef<T | null>(null)
  const reduce = useReducedMotion()

  const onParentMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (reduce) return
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      if (dist > radius) {
        el.style.transform = 'translate3d(0, 0, 0)'
        return
      }
      el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`
    },
    [reduce, radius, strength],
  )

  const onParentMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'translate3d(0, 0, 0)'
  }, [])

  return { ref, onParentMouseMove, onParentMouseLeave }
}
