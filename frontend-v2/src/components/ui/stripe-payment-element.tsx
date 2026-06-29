/**
 * UI-F-1 — Stripe Payment Element primitive.
 *
 * Wraps @stripe/react-stripe-js <Elements> + <PaymentElement> with the
 * project's shadcn aesthetic. Designed to plug into customer / cashier
 * checkout flows. The PaymentIntent is created server-side (NestJS phase);
 * this component only collects card details, confirms, and reports back.
 *
 *   <StripePaymentElement
 *     clientSecret={pi.clientSecret}
 *     amount={1234}            // major units (₹), display-only
 *     currency="INR"
 *     onSuccess={(pi) => navigate('/orders')}
 *     onError={(msg) => toast.error(msg)}
 *   />
 *
 * If VITE_STRIPE_PUBLISHABLE_KEY is missing, we render a disabled card so
 * the surrounding UI stays functional during early phases.
 */
import * as React from 'react'
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe, PaymentIntent, StripeError } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { Loader2, CreditCard, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { env } from '@/config/env'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/* Singleton Stripe.js loader — load once per app session.                    */
/* -------------------------------------------------------------------------- */

let stripePromise: Promise<Stripe | null> | null = null
function getStripe(): Promise<Stripe | null> | null {
  if (!env.VITE_STRIPE_PUBLISHABLE_KEY) return null
  if (!stripePromise) {
    stripePromise = loadStripe(env.VITE_STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export interface StripePaymentElementProps {
  /** Client secret from a server-side PaymentIntent. */
  clientSecret: string
  /** Amount in major units (display only — Stripe pulls the real number from PI). */
  amount: number
  /** ISO-4217 code, default 'INR'. */
  currency?: string
  /** Optional return URL for redirect-based methods (3DS, UPI). Defaults to current href. */
  returnUrl?: string
  /** Fires when PaymentIntent reaches `succeeded` or `processing` synchronously. */
  onSuccess: (paymentIntent: PaymentIntent) => void
  /** Fires with a human-readable message on any failure. */
  onError: (message: string) => void
  className?: string
}

export function StripePaymentElement(props: StripePaymentElementProps): React.ReactElement {
  const { clientSecret, amount, currency = 'INR', className } = props
  const stripeP = getStripe()

  // 1) Env not configured — disabled state
  if (!stripeP) {
    return (
      <Card flat className={cn('border-dashed', className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" aria-hidden />
            <CardTitle className="text-base">Stripe not configured</CardTitle>
          </div>
          <CardDescription>
            Set <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code>{' '}
            in your <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> to enable card payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" disabled className="w-full">
            <CreditCard className="size-4" aria-hidden />
            Pay {formatAmount(amount, currency)}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-primary" aria-hidden />
          <CardTitle className="text-base">Card payment</CardTitle>
        </div>
        <CardDescription>Powered by Stripe · all card networks accepted</CardDescription>
      </CardHeader>
      <CardContent>
        <Elements
          stripe={stripeP}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: 'hsl(var(--primary))',
                colorBackground: 'hsl(var(--background))',
                colorText: 'hsl(var(--foreground))',
                colorDanger: 'hsl(var(--destructive))',
                fontFamily: 'inherit',
                borderRadius: '6px',
              },
            },
          }}
        >
          <InnerForm {...props} />
        </Elements>
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Inner form — must live inside <Elements> to use the Stripe hooks.          */
/* -------------------------------------------------------------------------- */

function InnerForm(props: StripePaymentElementProps): React.ReactElement {
  const { amount, currency = 'INR', returnUrl, onSuccess, onError } = props
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = React.useState(false)
  const [ready, setReady] = React.useState(false)

  // While Stripe.js loads, show skeleton in-place of the element
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl ?? window.location.href,
        },
        redirect: 'if_required',
      })
      if (result.error) {
        const message = describeStripeError(result.error)
        onError(message)
        return
      }
      if (result.paymentIntent) {
        const pi = result.paymentIntent
        if (pi.status === 'succeeded' || pi.status === 'processing') {
          onSuccess(pi)
        } else {
          onError(`Payment ${pi.status.replace(/_/g, ' ')}. Please try again.`)
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unexpected payment error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="min-h-[180px]">
        {!ready ? <PaymentSkeleton /> : null}
        <div className={cn(!ready && 'sr-only')}>
          <PaymentElement onReady={() => setReady(true)} options={{ layout: 'tabs' }} />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full"
        size="lg"
        loading={submitting}
        disabled={!stripe || !elements || !ready}
        aria-label={`Pay ${formatAmount(amount, currency)} with card`}
      >
        {submitting ? 'Processing…' : `Pay ${formatAmount(amount, currency)}`}
      </Button>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function PaymentSkeleton(): React.ReactElement {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-label="Loading payment form">
      <div className="skeleton-shimmer h-10 w-full rounded-md" />
      <div className="skeleton-shimmer h-10 w-full rounded-md" />
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton-shimmer h-10 rounded-md" />
        <div className="skeleton-shimmer h-10 rounded-md" />
      </div>
      <div className="flex items-center justify-center pt-2 text-xs text-muted-foreground">
        <Loader2 className="mr-2 size-3 animate-spin" aria-hidden />
        Loading secure payment form…
      </div>
    </div>
  )
}

function describeStripeError(err: StripeError): string {
  if (err.message) return err.message
  if (err.code) return `Payment failed (${err.code})`
  return 'Payment failed. Please try again.'
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}
