/**
 * UI-F-1 — PayPal Checkout primitive.
 *
 * Wraps <PayPalScriptProvider> + <PayPalButtons> with a graceful fallback
 * when VITE_PAYPAL_CLIENT_ID is missing. In dev (no env), a stub button
 * fires onSuccess after 800ms so customer / cashier flows stay testable.
 *
 *   <PayPalCheckoutButton
 *     amount={1234}
 *     currency="INR"
 *     onSuccess={(orderId) => navigate('/orders')}
 *     onError={(msg) => toast.error(msg)}
 *   />
 *
 * Server-side capture (NestJS phase) will validate the orderId before the
 * order moves to PAID — never trust the client.
 */
import * as React from 'react'
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js'
import type {
  OnApproveData,
  OnApproveActions,
  CreateOrderData,
  CreateOrderActions,
} from '@paypal/paypal-js'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { env } from '@/config/env'
import { cn } from '@/lib/utils'

export interface PayPalCheckoutButtonProps {
  /** Amount in major units. */
  amount: number
  /** ISO-4217 code, default 'INR'. */
  currency?: string
  /** Receives the PayPal order id once buyer approves. */
  onSuccess: (orderId: string) => void
  /** Receives a human-readable failure message. */
  onError: (message: string) => void
  className?: string
  /** Disable the whole control externally (e.g. cart total is 0). */
  disabled?: boolean
}

export function PayPalCheckoutButton(props: PayPalCheckoutButtonProps): React.ReactElement {
  const { amount, currency = 'INR', className, disabled } = props
  const clientId = env.VITE_PAYPAL_CLIENT_ID

  // Mock fallback when env is empty — keeps the flow drivable in dev.
  if (!clientId) {
    return <MockPayPalButton {...props} />
  }

  return (
    <div className={cn('paypal-checkout-button min-h-[44px]', className)}>
      <PayPalScriptProvider
        options={{
          clientId,
          currency,
          intent: 'capture',
        }}
      >
        <LiveButtons amount={amount} currency={currency} onSuccess={props.onSuccess} onError={props.onError} disabled={disabled} />
      </PayPalScriptProvider>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Live PayPal Buttons (env present)                                          */
/* -------------------------------------------------------------------------- */

interface LiveButtonsProps {
  amount: number
  currency: string
  onSuccess: (orderId: string) => void
  onError: (message: string) => void
  disabled?: boolean
}

function LiveButtons({ amount, currency, onSuccess, onError, disabled }: LiveButtonsProps): React.ReactElement {
  const [{ isPending, isRejected }] = usePayPalScriptReducer()

  const createOrder = (_data: CreateOrderData, actions: CreateOrderActions): Promise<string> =>
    actions.order.create({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        },
      ],
    })

  const onApprove = async (data: OnApproveData, actions: OnApproveActions): Promise<void> => {
    try {
      // Capture client-side so the order moves out of CREATED. Server must re-verify.
      if (actions.order) {
        await actions.order.capture()
      }
      onSuccess(data.orderID)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'PayPal capture failed')
    }
  }

  if (isRejected) {
    return (
      <Button type="button" variant="outline" disabled className="w-full">
        PayPal failed to load
      </Button>
    )
  }

  return (
    <div className="relative">
      {isPending ? (
        <div
          className="flex h-11 w-full items-center justify-center rounded-md border border-input bg-background text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          Loading PayPal…
        </div>
      ) : null}
      <div className={cn(isPending && 'sr-only')}>
        <PayPalButtons
          style={{ layout: 'horizontal', tagline: false, height: 44, label: 'pay' }}
          disabled={disabled}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={(err) => onError(err instanceof Error ? err.message : 'PayPal error')}
          onCancel={() => onError('Payment cancelled')}
        />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Mock button (env missing)                                                   */
/* -------------------------------------------------------------------------- */

function MockPayPalButton({ amount, currency = 'INR', onSuccess, className, disabled }: PayPalCheckoutButtonProps): React.ReactElement {
  const [running, setRunning] = React.useState(false)

  const handleClick = (): void => {
    setRunning(true)
    window.setTimeout(() => {
      setRunning(false)
      const mockId = `MOCK-PAYPAL-${Date.now()}`
      onSuccess(mockId)
    }, 800)
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      loading={running}
      disabled={disabled}
      className={cn('w-full bg-[#ffc439] text-[#003087] hover:bg-[#f5b82e] hover:text-[#003087]', className)}
      size="lg"
      aria-label={`Pay ${formatAmount(amount, currency)} with PayPal (mock mode)`}
    >
      {running ? 'Simulating PayPal…' : `Pay ${formatAmount(amount, currency)} · PayPal (mock)`}
    </Button>
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
