import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { captureException } from '@/lib/sentry'
import { Button } from '@/components/ui/button'

/**
 * UI-F-12: Global ErrorBoundary with friendly fallback.
 * UI-F-11: forwards errors to Sentry via the buffered captureException helper
 * — Sentry SDK itself is lazily loaded in idle so it does not block first
 * paint. Errors caught before Sentry boots are queued and flushed once it
 * finishes loading.
 */
interface State {
  error: Error | null
}

interface Props {
  children: ReactNode
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info)
    captureException(error, {
      contexts: { react: { componentStack: info.componentStack ?? '' } },
    })
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="inline-flex size-14 rounded-full bg-destructive/10 text-destructive items-center justify-center mx-auto">
              <AlertTriangle className="size-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              We hit an unexpected error. The team has been notified — try refreshing or come back in a
              moment.
            </p>
            <pre className="text-left text-xs bg-muted p-3 rounded font-mono max-h-40 overflow-auto">
              {this.state.error.message}
            </pre>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="size-4" /> Refresh page
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
