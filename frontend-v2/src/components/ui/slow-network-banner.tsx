import { useEffect, useState } from 'react'
import { WifiOff, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * UI-F-58: Slow connection pill.
 * Reads `navigator.connection.effectiveType` (NetworkInformation API) and shows
 * a bottom-of-viewport banner on slow-2g / 2g. Auto-dismisses on improvement.
 * Manual close hides until next slow event.
 */

type EffectiveType = 'slow-2g' | '2g' | '3g' | '4g'

interface NetworkInformation extends EventTarget {
  effectiveType?: EffectiveType
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation
}

const SLOW: ReadonlyArray<EffectiveType> = ['slow-2g', '2g']

export function SlowNetworkBanner({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const nav = navigator as NavigatorWithConnection
    const conn = nav.connection
    if (!conn) return undefined

    const refresh = () => {
      const slow = conn.effectiveType ? SLOW.includes(conn.effectiveType) : false
      setVisible(slow)
      if (!slow) setDismissed(false)
    }
    refresh()
    conn.addEventListener('change', refresh)
    return () => conn.removeEventListener('change', refresh)
  }, [])

  if (!visible || dismissed) return null

  return (
    <div
      role="status"
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-4 py-2 text-xs font-medium text-warning shadow-elevation-3',
        'animate-in fade-in slide-in-from-bottom-2',
        className
      )}
    >
      <WifiOff className="size-4" />
      <span>Slow connection detected — please be patient</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="ml-1 rounded-sm opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
