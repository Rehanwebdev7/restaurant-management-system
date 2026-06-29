/**
 * UI-F-41: Tiny status dot for the TopBar.
 *
 *  - green  → backend reachable
 *  - red    → backend not reachable
 *  - gray   → first probe still in flight
 *
 * Tooltip surfaces a human-readable "last checked Ns ago" so support can
 * tell at a glance whether the dot is stale.
 */
import { useEffect, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useBackendHealth } from '@/lib/backend-health'

function formatAgo(d: Date | null, nowTick: number): string {
  if (!d) return 'never'
  // nowTick is read so the component re-renders every 5s and the "ago" string
  // stays current without re-pinging the backend.
  void nowTick
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export function BackendHealthIndicator() {
  const { status, lastChecked } = useBackendHealth()
  const [nowTick, setNowTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setNowTick((n) => n + 1), 5_000)
    return () => window.clearInterval(id)
  }, [])

  const color =
    status === 'up'
      ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]'
      : status === 'down'
        ? 'bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.20)]'
        : 'bg-muted-foreground/60'

  const label =
    status === 'up' ? 'Backend up' : status === 'down' ? 'Backend unreachable' : 'Checking backend…'

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className="grid place-items-center size-7 rounded-md outline-none transition-colors duration-quick focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              aria-hidden
              className={cn('size-2.5 rounded-full transition-colors duration-quick', color)}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {label} · last checked {formatAgo(lastChecked, nowTick)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
