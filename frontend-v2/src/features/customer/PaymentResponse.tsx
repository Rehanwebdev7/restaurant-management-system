/**
 * Payment-gateway return handler — `/payment/callback`.
 *
 * Stripe, PayPal and CCAvenue all redirect the browser back here with a
 * `status` query param and (where supported) `orderId` so the customer
 * sees a definitive success/failure screen before being routed onward.
 *
 * Matches legacy `PaymentResponsePage.jsx` behaviour: success → My Orders,
 * failure → Cart, cancelled → Cart with info toast.
 */

import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react'
import CustomerLayout from '@/features/customer/CustomerLayout'
import { DocumentTitle } from '@/lib/seo/document-title'

type PaymentStatus = 'success' | 'failed' | 'cancelled'

function parseStatus(raw: string | null): PaymentStatus {
  if (raw === 'success' || raw === 'failed' || raw === 'cancelled') return raw
  return 'failed'
}

export default function PaymentResponse() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const status = useMemo<PaymentStatus>(() => parseStatus(params.get('status')), [params])
  const orderId = params.get('orderId') ?? ''
  const transactionId = params.get('txn') ?? params.get('transactionId') ?? ''
  const amount = params.get('amount')

  const view = (() => {
    if (status === 'success') {
      return {
        Icon: CheckCircle2,
        tone: 'text-green-400',
        ring: 'border-[--c-accent] bg-[--c-accent]/10',
        eyebrow: 'PAYMENT CONFIRMED',
        title: 'Payment',
        accent: 'Successful',
        message: 'Thanks for ordering with Spice Garden. We have started preparing your meal.',
        primaryLabel: 'TRACK ORDER',
        primary: () => navigate(orderId ? `/orders/${orderId}` : '/orders'),
        secondaryLabel: 'CONTINUE SHOPPING',
        secondary: () => navigate('/menu'),
        iconClass: 'gold-text',
      }
    }
    if (status === 'cancelled') {
      return {
        Icon: AlertTriangle,
        tone: 'text-amber-400',
        ring: 'border-amber-500/60 bg-amber-500/10',
        eyebrow: 'PAYMENT CANCELLED',
        title: 'Payment',
        accent: 'Cancelled',
        message: 'You cancelled the payment. Your cart is intact so you can try again any time.',
        primaryLabel: 'BACK TO CART',
        primary: () => navigate('/cart'),
        secondaryLabel: 'BROWSE MENU',
        secondary: () => navigate('/menu'),
        iconClass: 'text-amber-400',
      }
    }
    return {
      Icon: XCircle,
      tone: 'text-red-400',
      ring: 'border-red-500/60 bg-red-500/10',
      eyebrow: 'PAYMENT FAILED',
      title: 'Payment',
      accent: 'Failed',
      message:
        'We could not complete your payment. No amount has been deducted. Please retry or use a different method.',
      primaryLabel: 'RETRY PAYMENT',
      primary: () => navigate('/checkout'),
      secondaryLabel: 'BACK TO CART',
      secondary: () => navigate('/cart'),
      iconClass: 'text-red-400',
    }
  })()

  const { Icon } = view

  return (
    <CustomerLayout>
      <DocumentTitle title={`Payment ${view.accent} — Spice Garden`} />
      <section className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div
          className={`mx-auto size-24 rounded-full border-2 ${view.ring} flex items-center justify-center mb-6`}
        >
          <Icon className={`size-12 ${view.iconClass}`} aria-hidden />
        </div>

        <p className="subtitle">{view.eyebrow}</p>
        <div className="c-divider" />
        <h1 className="display text-4xl sm:text-5xl mb-4">
          {view.title} <span>{view.accent}</span>
        </h1>
        <p className="text-sm text-[--c-text-soft] max-w-md mx-auto mb-8">{view.message}</p>

        {(orderId || transactionId || amount) ? (
          <dl className="c-card p-5 mb-8 space-y-2 text-sm text-left max-w-sm mx-auto">
            {orderId ? (
              <div className="flex items-center justify-between">
                <dt className="text-[--c-text-muted]">Order ID</dt>
                <dd className="font-mono font-semibold gold-text">{orderId}</dd>
              </div>
            ) : null}
            {transactionId ? (
              <div className="flex items-center justify-between">
                <dt className="text-[--c-text-muted]">Transaction</dt>
                <dd className="font-mono">{transactionId}</dd>
              </div>
            ) : null}
            {amount ? (
              <div className="flex items-center justify-between">
                <dt className="text-[--c-text-muted]">Amount</dt>
                <dd className="font-mono">₹{amount}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
          <button
            className="c-button-primary inline-flex items-center justify-center gap-2"
            onClick={view.primary}
          >
            {status === 'failed' ? <RotateCcw className="size-4" /> : <ArrowRight className="size-4" />}
            {view.primaryLabel}
          </button>
          <button
            className="c-button-outline inline-flex items-center justify-center"
            onClick={view.secondary}
          >
            {view.secondaryLabel}
          </button>
        </div>

        <p className="text-xs text-[--c-text-muted] mt-8">
          Need help? Email{' '}
          <Link to="/contact" className="gold-text hover:underline">
            support@spicegarden.com
          </Link>
        </p>
      </section>
    </CustomerLayout>
  )
}
