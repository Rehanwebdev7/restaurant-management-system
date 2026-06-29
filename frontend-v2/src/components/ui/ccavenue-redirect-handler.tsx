/**
 * UI-F-1 — CCAvenue redirect primitive.
 *
 * CCAvenue is a redirect-style gateway: server encrypts the order payload
 * (encRequest), and the client POSTs a tiny form to CCAvenue's hosted page.
 * The user completes payment there and is redirected back via the merchant's
 * configured response URL — handled outside this component.
 *
 *   <CCAvenueRedirectHandler
 *     merchantId={env.VITE_CCAVENUE_MERCHANT_ID!}
 *     accessCode={accessCode}      // server-supplied
 *     encRequest={encRequest}      // server-supplied (AES-encrypted)
 *     orderId="ORD-123"
 *     amount={1234}
 *   />
 *
 * `gatewayUrl` defaults to the production CCAvenue endpoint; pass a sandbox
 * URL during testing.
 */
import * as React from 'react'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const DEFAULT_GATEWAY_URL =
  'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction'

export interface CCAvenueRedirectHandlerProps {
  /** CCAvenue merchant id (from .env / VITE_CCAVENUE_MERCHANT_ID). */
  merchantId: string
  /** CCAvenue access code (from server). */
  accessCode: string
  /** AES-encrypted request payload (from server). */
  encRequest: string
  /** Display-only order id. */
  orderId: string
  /** Display-only amount in major units. */
  amount: number
  /** ISO-4217 code, default 'INR'. */
  currency?: string
  /** Override the gateway endpoint (e.g. sandbox URL). */
  gatewayUrl?: string
  /** Fires just before the form submits. Useful for analytics / loading toasts. */
  onTrigger?: () => void
  className?: string
  /** External disable (e.g. cart total is 0). */
  disabled?: boolean
}

export function CCAvenueRedirectHandler({
  merchantId,
  accessCode,
  encRequest,
  orderId,
  amount,
  currency = 'INR',
  gatewayUrl = DEFAULT_GATEWAY_URL,
  onTrigger,
  className,
  disabled,
}: CCAvenueRedirectHandlerProps): React.ReactElement {
  const formRef = React.useRef<HTMLFormElement>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const missingConfig = !merchantId || !accessCode || !encRequest
  const isDisabled = disabled || missingConfig || submitting

  const handleClick = (): void => {
    if (isDisabled) return
    onTrigger?.()
    setSubmitting(true)
    // Defer submit one tick so the UI shows the loading state before the redirect kicks in.
    window.setTimeout(() => {
      formRef.current?.submit()
    }, 50)
  }

  if (missingConfig) {
    return (
      <Card flat className={cn('border-dashed', className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" aria-hidden />
            <CardTitle className="text-base">CCAvenue not ready</CardTitle>
          </div>
          <CardDescription>
            Waiting for <code className="rounded bg-muted px-1 py-0.5 text-xs">merchantId</code>,{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">accessCode</code>, and an encrypted
            request from the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" disabled className="w-full">
            <ExternalLink className="size-4" aria-hidden />
            Pay via CCAvenue
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ExternalLink className="size-4 text-primary" aria-hidden />
          <CardTitle className="text-base">Pay via CCAvenue</CardTitle>
        </div>
        <CardDescription>
          You'll be redirected to CCAvenue's secure page to complete your{' '}
          <span className="font-mono text-foreground">{orderId}</span> payment of{' '}
          <span className="font-semibold text-foreground">{formatAmount(amount, currency)}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Hidden POST form — CCAvenue requires application/x-www-form-urlencoded. */}
        <form
          ref={formRef}
          action={gatewayUrl}
          method="POST"
          target="_self"
          encType="application/x-www-form-urlencoded"
          className="hidden"
          aria-hidden="true"
        >
          <input type="hidden" name="command" value="initiateTransaction" />
          <input type="hidden" name="merchant_id" value={merchantId} />
          <input type="hidden" name="access_code" value={accessCode} />
          <input type="hidden" name="encRequest" value={encRequest} />
          <input type="hidden" name="order_id" value={orderId} />
        </form>
        <Button
          type="button"
          size="lg"
          className="w-full"
          loading={submitting}
          disabled={isDisabled}
          onClick={handleClick}
          aria-label={`Pay ${formatAmount(amount, currency)} via CCAvenue`}
        >
          {submitting ? 'Redirecting to CCAvenue…' : 'Pay via CCAvenue'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          You will be redirected in this tab. Do not close the window.
        </p>
      </CardContent>
    </Card>
  )
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
