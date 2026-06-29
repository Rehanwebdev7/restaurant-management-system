/**
 * UI-F-11: Sentry Day 1 wiring.
 * Init only if DSN is present — works as no-op in dev / when DSN missing.
 *
 * Perf: Sentry SDK is ~88 kB gzipped — loading it on the critical path adds
 * meaningful main-bundle weight. We dynamic-import it inside an idle callback
 * so first paint isn't blocked. Errors that happen BEFORE Sentry finishes
 * loading are buffered and flushed once it's ready (rare for a 1–2s delay).
 */
import { env } from '@/config/env'

const pendingErrors: Array<{ error: unknown; context?: Record<string, unknown> }> = []
let sentryReady: Promise<typeof import('@sentry/react') | null> | null = null

function scheduleIdle(cb: () => void): void {
  if (typeof window === 'undefined') return
  const ric = (window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  }).requestIdleCallback
  if (typeof ric === 'function') ric(cb, { timeout: 3000 })
  else window.setTimeout(cb, 1500)
}

export function initSentry(): void {
  if (!env.VITE_SENTRY_DSN) return
  if (typeof window === 'undefined') return
  if (sentryReady) return

  scheduleIdle(() => {
    sentryReady = import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: env.VITE_SENTRY_DSN,
        release: env.VITE_APP_VERSION,
        environment: import.meta.env.MODE,
        integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
        tracesSampleRate: 0.2,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
      })
      // Flush errors that happened before Sentry loaded. The captureException
      // signature in @sentry/react has a narrow `contexts: never` constraint
      // on its first overload; we hand it a plain object so cast loosely.
      while (pendingErrors.length) {
        const item = pendingErrors.shift()!
        ;(Sentry.captureException as (e: unknown, c?: unknown) => string)(item.error, item.context)
      }
      return Sentry
    }).catch(() => null)
  })
}

/**
 * Forward an error to Sentry — buffered until Sentry finishes loading.
 * Used by the global ErrorBoundary so the boundary itself stays in the
 * critical-path bundle without dragging Sentry along.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (sentryReady) {
    sentryReady.then((Sentry) => {
      if (Sentry) (Sentry.captureException as (e: unknown, c?: unknown) => string)(error, context)
    })
    return
  }
  pendingErrors.push({ error, context })
  // If Sentry never started (no DSN), errors stay buffered + discarded — same
  // behavior as before, just at lower main-bundle cost.
}
