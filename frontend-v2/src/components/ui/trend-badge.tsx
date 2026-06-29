import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * UI-F-33 Dashboard wow factor — trend pill.
 * Shows ↑X% green / ↓X% red / 0% neutral.
 * Animated count-up. Respects prefers-reduced-motion.
 *
 * `delta` is a fraction: 0.124 = +12.4%, -0.052 = -5.2%.
 */

interface TrendBadgeProps {
  delta: number
  className?: string
  /** When true, shows just the icon + percentage on a tight pill (default). */
  compact?: boolean
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function useCountUpNumber(target: number, duration = 700): number {
  const [value, setValue] = useState(prefersReducedMotion() ? target : 0)
  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const from = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(from + (target - from) * easeOutCubic(t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

export function TrendBadge({ delta, className, compact = true }: TrendBadgeProps) {
  const abs = Math.abs(delta)
  const animated = useCountUpNumber(abs * 100)
  const direction = delta > 0.0001 ? 'up' : delta < -0.0001 ? 'down' : 'flat'

  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus
  const color =
    direction === 'up'
      ? 'bg-success/10 text-success border-success/30'
      : direction === 'down'
        ? 'bg-destructive/10 text-destructive border-destructive/30'
        : 'bg-muted text-muted-foreground border-border'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums',
        color,
        className
      )}
    >
      <Icon className={compact ? 'size-3' : 'size-3.5'} />
      {animated.toFixed(1)}%
    </span>
  )
}
