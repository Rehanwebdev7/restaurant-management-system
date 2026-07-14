/**
 * CustomerErrorBoundary — customer surface safety net.
 *
 * Wraps <CustomerLayout> so any downstream React error renders a warm
 * restaurant-themed fallback instead of the raw white React crash screen.
 * The customer never sees stack traces, only "something went wrong" + a
 * retry CTA. Dev sees the error in the console.
 *
 * SaaS-safe: no brand assumptions in the fallback copy — uses generic
 * hospitality language that reads correct for any tenant.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class CustomerErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console for developer diagnosis; a hosted app would ship this
    // to Sentry / Grafana Cloud in prod. Kept local for now.
    // eslint-disable-next-line no-console
    console.error('[CustomerErrorBoundary] uncaught error:', error, info)
  }

  handleRetry = (): void => {
    this.setState({ error: null })
    // Full reload as a safe recovery — clears any bad module state that
    // triggered the initial throw. If the underlying data is broken the
    // user will land back on the same fallback, which is still better
    // than a white screen.
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--c-bg, #F7F0E3)',
          color: 'var(--c-text, #1A1A1A)',
          padding: '2rem 1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(180, 89, 63, 0.14)',
              color: '#B4593F',
              marginBottom: '1.25rem',
            }}
          >
            <AlertTriangle size={32} strokeWidth={2} aria-hidden />
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
              fontFamily: 'Cormorant Garamond, serif',
              letterSpacing: '-0.01em',
            }}
          >
            Kitchen's a bit busy
          </h1>
          <p
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.55,
              color: 'var(--c-text-soft, #5A4E3E)',
              marginBottom: '1.75rem',
            }}
          >
            Something went wrong on our end. Please refresh the page — we'll be
            right back with you.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.85rem 1.75rem',
              borderRadius: 9999,
              background: 'linear-gradient(135deg, #C9A96E 0%, #B4593F 100%)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              boxShadow: '0 8px 20px rgba(201, 169, 110, 0.28)',
            }}
          >
            <RefreshCw size={16} aria-hidden />
            Try again
          </button>
        </div>
      </div>
    )
  }
}

export default CustomerErrorBoundary
