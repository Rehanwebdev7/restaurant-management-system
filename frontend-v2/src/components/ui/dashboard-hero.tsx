import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '@/components/ui/card'
import { TrendBadge } from '@/components/ui/trend-badge'
import { cn } from '@/lib/utils'

/**
 * UI-F-33 Dashboard wow factor — hero stat card.
 *
 * Stripe / Linear / Vercel aesthetic:
 *  - Huge display number with animated count-up
 *  - Brand-gradient background (primary → primary/60)
 *  - White text on gradient
 *  - 7-day mini sparkline (recharts AreaChart, height 60)
 *  - Delta indicator + period label
 *
 * Reusable across all role dashboards (kitchen, cashier, restaurant, branch,
 * superadmin, delivery).
 *
 * `trendData` is optional — if absent, a flat sample series is rendered so the
 * card never looks empty on first paint.
 */

export interface DashboardHeroProps {
  label: string
  value: number
  /** Optional custom formatter. Receives the animated number. */
  format?: (n: number) => string
  /** e.g. 0.124 for +12.4%, -0.052 for -5.2%. Omit to hide. */
  delta?: number
  /** Sparkline trend points. Will use sample data if omitted. */
  trendData?: ReadonlyArray<{ x: string | number; y: number }>
  /** "Last 7 days" / "Today" — defaults to "Last 7 days". */
  period?: string
  /** Optional right-side icon badge. */
  icon?: ReactNode
  /** Override gradient direction or color (rare). */
  gradient?: string
  className?: string
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function useCountUp(target: number, duration = 1000): number {
  const [value, setValue] = useState(prefersReducedMotion() ? target : 0)
  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target)
      return
    }
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

/** Generate a gentle synthetic 7-day trend if no data is provided. */
function sampleTrend(seed: number): ReadonlyArray<{ x: number; y: number }> {
  const base = Math.max(20, Math.round(seed / 7) || 60)
  return Array.from({ length: 7 }, (_, i) => {
    const wobble = Math.sin(i * 0.9 + base * 0.01) * (base * 0.18)
    return { x: i, y: Math.max(0, Math.round(base + wobble + i * (base * 0.04))) }
  })
}

export function DashboardHero({
  label,
  value,
  format,
  delta,
  trendData,
  period = 'Last 7 days',
  icon,
  gradient,
  className,
}: DashboardHeroProps) {
  const animated = useCountUp(value)
  const display = format ? format(animated) : Math.round(animated).toLocaleString('en-IN')

  const data = useMemo(() => {
    if (trendData && trendData.length > 0) return trendData
    return sampleTrend(value)
  }, [trendData, value])

  const gradientId = useId().replace(/[:]/g, '')
  const gradClassName =
    gradient ?? 'bg-gradient-to-br from-primary via-primary to-primary/60'

  return (
    <Card
      className={cn(
        'relative overflow-hidden p-6 text-primary-foreground border-transparent shadow-elevation-2',
        gradClassName,
        className
      )}
      flat
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 size-44 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 size-44 rounded-full bg-black/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-primary-foreground/80">
            {label}
          </p>
          <p className="font-display font-bold tracking-tight tabular-nums text-4xl sm:text-5xl leading-tight text-primary-foreground">
            {display}
          </p>
          <div className="flex items-center gap-2 pt-1">
            {typeof delta === 'number' ? (
              <TrendBadge
                delta={delta}
                className="bg-white/15 border-white/20 text-primary-foreground"
              />
            ) : null}
            <span className="text-[11px] uppercase tracking-wider text-primary-foreground/70">
              {period}
            </span>
          </div>
        </div>
        {icon ? (
          <div className="size-11 rounded-xl bg-white/15 backdrop-blur-sm text-primary-foreground inline-flex items-center justify-center shrink-0">
            {icon}
          </div>
        ) : null}
      </div>

      {/* Sparkline */}
      <div className="relative mt-4 h-[60px] -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[...data]} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`hero-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1 }}
              contentStyle={{
                background: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
                padding: '6px 10px',
              }}
              labelFormatter={() => ''}
              formatter={(v) => {
                const n = Number(v ?? 0)
                return [format ? format(n) : n.toLocaleString('en-IN'), label]
              }}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke="#ffffff"
              strokeWidth={2}
              fill={`url(#hero-${gradientId})`}
              isAnimationActive={!prefersReducedMotion()}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function DashboardHeroSkeleton() {
  return (
    <Card className="p-6 space-y-3 shadow-elevation-2" flat>
      <div className="skeleton-shimmer h-3 w-1/3 rounded" />
      <div className="skeleton-shimmer h-12 w-2/3 rounded" />
      <div className="skeleton-shimmer h-3 w-1/4 rounded" />
      <div className="skeleton-shimmer h-[60px] w-full rounded" />
    </Card>
  )
}
