import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, ArrowDown } from 'lucide-react'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

/**
 * UI-F-2: Pull-to-refresh wrapper for mobile views.
 *  - Only attaches touch handlers on mobile viewports — desktop is a no-op
 *    passthrough so we don't surprise mouse users.
 *  - Threshold: 80px (matches iOS/Android system PTR).
 *  - Indicator slot peeks from the top using translateY.
 */
interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  className?: string
  /** Threshold in pixels before triggering the refresh. Defaults to 80. */
  threshold?: number
}

const THRESHOLD = 80

export function PullToRefresh({ onRefresh, children, className, threshold = THRESHOLD }: PullToRefreshProps) {
  const isMobile = useIsMobile()
  const { t } = useTranslation()
  const { isRefreshing, distance, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh({
    onRefresh,
    threshold,
  })

  // Desktop short-circuit: zero overhead, no listeners.
  if (!isMobile) {
    return <div className={className}>{children}</div>
  }

  const reached = distance >= threshold
  // Position indicator so it slides in from above the viewport.
  const indicatorOffset = Math.max(0, distance - 40)

  return (
    <div
      className={cn('relative', className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {(distance > 0 || isRefreshing) && (
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-full"
          style={{ transform: `translate(-50%, ${indicatorOffset - 40}px)` }}
          aria-hidden={!isRefreshing}
          role="status"
        >
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-elevation-2">
            {isRefreshing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {t('messages.refreshing')}
              </>
            ) : reached ? (
              <>
                <Loader2 className="size-3.5" />
                {t('messages.releaseToRefresh')}
              </>
            ) : (
              <>
                <ArrowDown
                  className="size-3.5 transition-transform duration-quick"
                  style={{ transform: `rotate(${Math.min(180, distance * 2.25)}deg)` }}
                />
                {t('messages.pullToRefresh')}
              </>
            )}
          </div>
        </div>
      )}
      <div
        style={{ transform: distance > 0 ? `translateY(${distance * 0.5}px)` : undefined }}
        className={cn(
          'transition-transform',
          isRefreshing || distance === 0 ? 'duration-200 ease-out' : 'duration-0'
        )}
      >
        {children}
      </div>
    </div>
  )
}
