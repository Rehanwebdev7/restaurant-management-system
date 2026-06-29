import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * UI-F-40: Top-of-viewport 2px progress bar.
 * Shows when any TanStack Query fetch/mutation > 300ms.
 * Future: hook React Router data-router `useNavigation()` once we migrate from BrowserRouter.
 */
export function TopProgressBar() {
  const fetching = useIsFetching()
  const mutating = useIsMutating()

  const active = fetching > 0 || mutating > 0
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!active) {
      if (!visible) return
      setWidth(100)
      const finish = setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 200)
      return () => clearTimeout(finish)
    }

    const startTimer = setTimeout(() => setVisible(true), 300)
    const grow = setInterval(() => {
      setWidth((w) => (w < 80 ? w + (80 - w) * 0.1 : w))
    }, 200)

    return () => {
      clearTimeout(startTimer)
      clearInterval(grow)
    }
  }, [active, visible])

  if (!visible) return null

  return (
    <div
      className={cn('fixed top-0 left-0 right-0 z-[100] h-0.5 bg-transparent pointer-events-none')}
      aria-hidden="true"
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary))] transition-[width] duration-standard ease-entrance"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
