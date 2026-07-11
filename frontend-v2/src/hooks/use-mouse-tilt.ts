import { useCallback, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * useMouseTilt — 3D perspective tilt on hover. The element rotates
 * toward the cursor within its own bounding box, giving cards a subtle
 * modern SaaS feel. Desktop only — no-op on touch (parent should skip via
 * `pointer:coarse`), no-op when the user prefers reduced motion.
 *
 * Usage:
 *   const tilt = useMouseTilt()
 *   <div style={{ perspective: '1000px' }}>
 *     <div ref={tilt.ref} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}>
 *       ...card content...
 *     </div>
 *   </div>
 */
export function useMouseTilt<T extends HTMLElement = HTMLDivElement>(
  maxDeg = 10,
  scale = 1.02,
) {
  const ref = useRef<T | null>(null)
  const reduce = useReducedMotion()

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (reduce) return
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5   // -0.5 .. +0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      const rotY = px * maxDeg * 2                             // horizontal → rotateY
      const rotX = -py * maxDeg * 2                            // vertical   → rotateX (inverted)
      el.style.transform =
        `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(${scale})`
    },
    [reduce, maxDeg, scale],
  )

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}
