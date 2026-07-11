import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useMediaQuery } from '@/hooks/use-media-query'

/**
 * PremiumCursor — custom pointer that follows the mouse with spring lag
 * and grows over interactive elements. Desktop only (`useMediaQuery` hides
 * on touch). Reduced-motion snaps to native cursor (returns null).
 *
 * Implementation notes:
 * - Uses two divs: a small dot (fast follow) + a bigger circle (lagging).
 * - rAF loop updates position from `pointermove` — no per-move React state
 *   updates → cheap enough for high-refresh displays.
 * - Grows over `button`, `a`, `[role=button]` via `pointerover`/`pointerout`.
 */

export default function PremiumCursor() {
  const reduce = useReducedMotion()
  const isDesktop = useMediaQuery('(hover: hover) and (pointer: fine)')
  const dotRef = useRef<HTMLDivElement | null>(null)
  const ringRef = useRef<HTMLDivElement | null>(null)
  const target = useRef({ x: -100, y: -100 })
  const current = useRef({ x: -100, y: -100 })
  const [isOverInteractive, setIsOverInteractive] = useState(false)

  useEffect(() => {
    if (reduce || !isDesktop) return
    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX
      target.current.y = e.clientY
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`
      }
    }
    const onOver = (e: Event) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      if (t.closest('button, a, [role="button"], input, textarea, select')) {
        setIsOverInteractive(true)
      }
    }
    const onOut = (e: Event) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      if (t.closest('button, a, [role="button"], input, textarea, select')) {
        setIsOverInteractive(false)
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerout', onOut, { passive: true })

    let raf = 0
    const loop = () => {
      current.current.x += (target.current.x - current.current.x) * 0.15
      current.current.y += (target.current.y - current.current.y) * 0.15
      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    // Hide native cursor while premium cursor is active
    document.documentElement.dataset.premiumCursor = 'on'

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerout', onOut)
      cancelAnimationFrame(raf)
      delete document.documentElement.dataset.premiumCursor
    }
  }, [reduce, isDesktop])

  if (reduce || !isDesktop) return null

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--c-accent, #C9A96E)',
          boxShadow: '0 0 12px rgba(201,169,110,0.6)',
        }}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          width: isOverInteractive ? 48 : 30,
          height: isOverInteractive ? 48 : 30,
          borderRadius: '50%',
          border: `1.5px solid rgba(201, 169, 110, ${isOverInteractive ? 0.85 : 0.55})`,
          transition: 'width 220ms cubic-bezier(0.16,1,0.3,1), height 220ms, border-color 220ms, background 220ms',
          background: isOverInteractive ? 'rgba(201,169,110,0.12)' : 'transparent',
          mixBlendMode: 'exclusion',
        }}
      />
    </>
  )
}
