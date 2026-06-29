import { useEffect, useState, type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * UI-F-33 dashboard wow factor:
 *  - large number with display typography
 *  - delta indicator (↑/↓ % with color)
 *  - optional sparkline (TODO with recharts in Phase 2 deep)
 *  - subtle gradient background on hero card
 *  - count-up animation via simple lerp
 */

interface StatCardProps {
  label: string
  value: number | string
  delta?: number  // e.g. 0.12 for +12% or -0.05 for -5%
  icon?: ReactNode
  hero?: boolean
  format?: (n: number) => string
  className?: string
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(target * easeOutCubic(t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

export function StatCard({ label, value, delta, icon, hero = false, format, className }: StatCardProps) {
  const numeric = typeof value === 'number' ? value : null
  const animated = useCountUp(numeric ?? 0)
  const display =
    numeric === null ? value : format ? format(animated) : Math.round(animated).toLocaleString('en-IN')

  return (
    <Card
      className={cn(
        'p-5 relative overflow-hidden',
        hero && 'bg-gradient-to-br from-primary/10 via-card to-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">{label}</p>
          <p
            className={cn(
              'font-bold tracking-tight tabular-nums',
              hero ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
            )}
          >
            {display}
          </p>
          {typeof delta === 'number' ? (
            <div
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold',
                delta >= 0 ? 'text-success' : 'text-destructive'
              )}
            >
              {delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {(Math.abs(delta) * 100).toFixed(1)}%
            </div>
          ) : null}
        </div>
        {icon ? (
          <div className="size-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center shrink-0">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  )
}

export function StatCardSkeleton({ hero = false }: { hero?: boolean }) {
  return (
    <Card className="p-5 space-y-3">
      <div className="skeleton-shimmer h-3 w-1/3 rounded" />
      <div className={cn('skeleton-shimmer rounded', hero ? 'h-12 w-2/3' : 'h-8 w-1/2')} />
      <div className="skeleton-shimmer h-3 w-1/4 rounded" />
    </Card>
  )
}
