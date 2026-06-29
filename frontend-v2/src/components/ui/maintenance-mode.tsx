import { Button } from '@/components/ui/button'
import { NetworkOffline } from '@/components/ui/illustrations'

/**
 * UI-F-82: Full-screen maintenance page.
 * Render as a fallback when the API returns 503 or a maintenance header.
 * `onRetry` defaults to `window.location.reload()`.
 */
interface MaintenanceModeProps {
  eta?: string
  onRetry?: () => void
}

export function MaintenanceMode({ eta, onRetry }: MaintenanceModeProps) {
  const retry = onRetry ?? (() => window.location.reload())
  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="inline-flex mx-auto text-primary">
          <NetworkOffline size={180} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">We're polishing things</h1>
          <p className="text-muted-foreground text-sm">
            The dashboard is briefly offline for maintenance. Thanks for your patience —
            we'll be back shortly.
          </p>
          {eta ? (
            <p className="text-xs font-mono text-muted-foreground">Estimated back: {eta}</p>
          ) : null}
        </div>
        <Button onClick={retry}>Try again</Button>
      </div>
    </div>
  )
}
