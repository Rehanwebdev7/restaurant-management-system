import { useCallback, useRef, useState, type TouchEvent } from 'react'

/**
 * UI-F-2: pull-to-refresh hook for mobile views.
 *
 *  - Only engages when the container is scrolled to the top (so we don't
 *    fight native scroll momentum).
 *  - Triggers `onRefresh` once the user pulls past `threshold` (default 80px)
 *    AND releases. Pull distance dampens with sqrt to feel native.
 *  - Reports `distance` so the wrapper component can render a peeking indicator.
 */

export interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  /** Maximum pull distance the user can drag the indicator down. */
  maxDistance?: number
  /** Predicate for whether the container is currently scrolled to top. */
  isAtTop?: () => boolean
}

export interface UsePullToRefreshResult {
  isRefreshing: boolean
  /** Pixel distance the indicator should be translated downwards (0..maxDistance). */
  distance: number
  onTouchStart: (e: TouchEvent) => void
  onTouchMove: (e: TouchEvent) => void
  onTouchEnd: () => void
}

export function usePullToRefresh(opts: UsePullToRefreshOptions): UsePullToRefreshResult {
  const { onRefresh, threshold = 80, maxDistance = 140, isAtTop } = opts

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [distance, setDistance] = useState(0)
  const startY = useRef<number | null>(null)
  const pulling = useRef(false)

  const atTop = useCallback((): boolean => {
    if (isAtTop) return isAtTop()
    // Default: use the scroll position of the main app scroller, falling back to window.
    const main = typeof document !== 'undefined' ? document.getElementById('app-main-scroll') : null
    if (main) return main.scrollTop <= 0
    if (typeof window === 'undefined') return true
    return window.scrollY <= 0
  }, [isAtTop])

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (isRefreshing) return
      const first = e.touches[0]
      if (!first) return
      if (!atTop()) {
        startY.current = null
        return
      }
      startY.current = first.clientY
      pulling.current = true
    },
    [atTop, isRefreshing]
  )

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || startY.current == null || isRefreshing) return
      const first = e.touches[0]
      if (!first) return
      const delta = first.clientY - startY.current
      if (delta <= 0) {
        setDistance(0)
        return
      }
      // Dampen with sqrt for a "rubber band" feel; clamp to maxDistance.
      const damped = Math.min(maxDistance, Math.sqrt(delta) * 8)
      setDistance(damped)
    },
    [isRefreshing, maxDistance]
  )

  const onTouchEnd = useCallback(() => {
    if (!pulling.current || isRefreshing) {
      pulling.current = false
      startY.current = null
      return
    }
    pulling.current = false
    startY.current = null
    if (distance >= threshold) {
      setIsRefreshing(true)
      setDistance(threshold)
      onRefresh()
        .catch(() => {
          /* caller is responsible for surfacing the error toast */
        })
        .finally(() => {
          setIsRefreshing(false)
          setDistance(0)
        })
    } else {
      setDistance(0)
    }
  }, [distance, isRefreshing, onRefresh, threshold])

  return { isRefreshing, distance, onTouchStart, onTouchMove, onTouchEnd }
}
