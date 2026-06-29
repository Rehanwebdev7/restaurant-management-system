/**
 * ScrollReveal — wraps children in a motion element that animates the first
 * time it enters the viewport.
 *
 * Variants (`kind` prop):
 *   - 'fade-up'      (default)  fade + slide up from `y` px
 *   - 'fade-in'                 just fade
 *   - 'slide-left'              fade + slide in from the right (alternating section feel)
 *   - 'slide-right'             fade + slide in from the left
 *   - 'scale-in'                fade + subtle scale-up — good for cards
 *   - 'blur-in'                 fade + scale + blur clear — premium / hero subsections
 *
 * Respects `prefers-reduced-motion` (transforms suppressed, fade preserved).
 *
 * Usage:
 *   <ScrollReveal delay={0.1} kind="slide-left"><MySection /></ScrollReveal>
 */
import { useRef, type CSSProperties, type ReactNode } from 'react'
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion'

type RevealKind = 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale-in' | 'blur-in'

interface ScrollRevealProps {
  children: ReactNode
  /** Delay before the reveal animation starts, in seconds. */
  delay?: number
  /** Pixels to translate from (only used by `fade-up` / slide variants). */
  y?: number
  /** Animation duration in seconds. */
  duration?: number
  /** Only animate the first time it enters the viewport. */
  once?: boolean
  /** Reveal variant — see file-level docs. */
  kind?: RevealKind
  /** Optional className passthrough on the wrapper. */
  className?: string
  /** Optional style passthrough. */
  style?: CSSProperties
  /** Render as a different element to preserve flow semantics. */
  as?: 'div' | 'section' | 'article' | 'li' | 'ul' | 'span'
}

const EASING = [0.16, 1, 0.3, 1] as const

function variantsFor(kind: RevealKind, y: number, reduce: boolean): Variants {
  // When reduced motion is enabled we always fall back to a pure fade so
  // users with vestibular sensitivities don't get translate / scale / blur.
  if (reduce) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    }
  }
  switch (kind) {
    case 'fade-in':
      return { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    case 'slide-left':
      return { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0 } }
    case 'slide-right':
      return { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } }
    case 'scale-in':
      return { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } }
    case 'blur-in':
      return {
        hidden: { opacity: 0, filter: 'blur(12px)', scale: 0.97 },
        visible: { opacity: 1, filter: 'blur(0px)', scale: 1 },
      }
    case 'fade-up':
    default:
      return { hidden: { opacity: 0, y }, visible: { opacity: 1, y: 0 } }
  }
}

export function ScrollReveal({
  children,
  delay = 0,
  y = 30,
  duration = 0.7,
  once = true,
  kind = 'fade-up',
  className,
  style,
  as = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once, margin: '0px 0px -10% 0px' })
  const reduce = useReducedMotion() ?? false

  const variants = variantsFor(kind, y, reduce)
  const MotionTag = motion[as] as typeof motion.div

  return (
    <MotionTag
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{ duration, delay, ease: EASING }}
    >
      {children}
    </MotionTag>
  )
}

/**
 * StaggerReveal — coordinates child reveal so a list of items cascades into
 * view instead of popping at once. Use the wrapper on the container and
 * `StaggerItem` on each child.
 */
export function StaggerReveal({
  children,
  className,
  delay = 0,
  staggerChildren = 0.06,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  staggerChildren?: number
  as?: 'div' | 'section' | 'ul' | 'ol'
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const MotionTag = motion[as] as typeof motion.div
  return (
    <MotionTag
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren, delayChildren: delay } },
      }}
    >
      {children}
    </MotionTag>
  )
}

export function StaggerItem({
  children,
  className,
  y = 24,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  y?: number
  as?: 'div' | 'li' | 'article'
}) {
  const reduce = useReducedMotion() ?? false
  const MotionTag = motion[as] as typeof motion.div
  return (
    <MotionTag
      className={className}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y },
        visible: reduce
          ? { opacity: 1 }
          : { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASING } },
      }}
    >
      {children}
    </MotionTag>
  )
}

export default ScrollReveal
