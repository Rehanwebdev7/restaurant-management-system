import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2, ClipboardList, ChefHat, Bike, PackageCheck, MapPin, Clock, RotateCcw, MessageSquarePlus,
  Ban, Loader2, XCircle, Star,
} from 'lucide-react'
import CustomerLayout from '@/features/customer/CustomerLayout'
import { formatPrice } from '@/features/customer/format'
import { useBrand } from '@/components/providers/BrandProvider'
import { DocumentTitle } from '@/lib/seo/document-title'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import DriverTrackingMap from '@/features/customer/DriverTrackingMap'
import { type BackendOrderDetail } from '@/api/services/customer'
import { useOrderTracking, useCancelCustomerOrder, useSubmitDishRating } from '@/api/queries/customer'
import { tokens } from '@/lib/auth/tokens'
import '@/styles/customer.css'

const ORDERS_KEY = 'customer_orders_v2'

export type OrderStatus = 'Placed' | 'Accepted' | 'Cooking' | 'Out for delivery' | 'Delivered' | 'Cancelled'

interface OrderLine {
  id: number
  menuItemId?: number
  name: string
  qty: number
  price: number
}

interface CustomerOrder {
  id: string
  placedAt: string
  status: OrderStatus
  eta: string
  items: OrderLine[]
  subtotal: number
  gst: number
  total: number
  address: string
}

const STATUS_STEPS: { key: OrderStatus; label: string; Icon: typeof CheckCircle2 }[] = [
  { key: 'Placed', label: 'Placed', Icon: ClipboardList },
  { key: 'Accepted', label: 'Accepted', Icon: CheckCircle2 },
  { key: 'Cooking', label: 'Cooking', Icon: ChefHat },
  { key: 'Out for delivery', label: 'Out for Delivery', Icon: Bike },
  { key: 'Delivered', label: 'Delivered', Icon: PackageCheck },
]

function readOrders(): CustomerOrder[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (o): o is CustomerOrder =>
        typeof o === 'object' && o !== null &&
        typeof (o as { id?: unknown }).id === 'string',
    )
  } catch {
    return []
  }
}

function synthesizeOrder(id: string): CustomerOrder {
  return {
    id,
    placedAt: new Date(Date.now() - 15 * 60_000).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    }),
    status: 'Cooking',
    eta: '18 min',
    items: [
      { id: 1, name: 'Butter Chicken', qty: 1, price: 420 },
      { id: 2, name: 'Garlic Naan', qty: 2, price: 80 },
      { id: 3, name: 'Mango Lassi', qty: 1, price: 110 },
    ],
    subtotal: 690,
    gst: 35,
    total: 725,
    address: '302, Sea Breeze Apts · Bandra West, Mumbai · 400050',
  }
}

function backendStatusToUi(s?: string | null): OrderStatus {
  if (!s) return 'Placed'
  const v = s.toUpperCase()
  if (v.includes('CANCEL') || v.includes('REJECT') || v.includes('FAIL')) return 'Cancelled'
  if (v.includes('DELIVERED') || v.includes('COMPLETED')) return 'Delivered'
  if (v.includes('OUT')) return 'Out for delivery'
  if (v.includes('COOK') || v.includes('PREPARING') || v.includes('READY')) return 'Cooking'
  if (v.includes('ACCEPT') || v.includes('CONFIRMED')) return 'Accepted'
  return 'Placed'
}

/** Status values where the customer is still allowed to cancel. */
const CANCELLABLE_UI: OrderStatus[] = ['Placed', 'Accepted']

function backendOrderToUi(d: BackendOrderDetail, fallbackId: string): CustomerOrder {
  const num = (v: number | string | undefined): number =>
    typeof v === 'number' ? v : v ? Number(v) || 0 : 0
  const subtotal = num(d.subtotal)
  const tax = num(d.taxAmount)
  const items: OrderLine[] = (d.orderItems ?? []).map((it, idx) => {
    // menuItemId may arrive as a scalar OR as a { id } object (backend joins)
    const mid = typeof it.menuItemId === 'object' && it.menuItemId !== null
      ? it.menuItemId.id
      : (typeof it.menuItemId === 'number' ? it.menuItemId : undefined)
    return {
      id: it.id ?? idx + 1,
      menuItemId: mid,
      name: it.menuItemName ?? `Item ${idx + 1}`,
      qty: it.quantity ?? 1,
      price: num(it.itemTotal ?? it.price),
    }
  })
  return {
    id: d.orderNumber ?? String(d.id ?? fallbackId),
    placedAt: d.createdAt
      ? new Date(d.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '—',
    status: backendStatusToUi(d.status),
    eta: d.estimatedTime ? `${d.estimatedTime} min` : '—',
    items,
    subtotal,
    gst: tax,
    total: num(d.totalAmount),
    address: d.tableNumber ? `Table ${d.tableNumber}` : 'Delivery address on file',
  }
}

export function OrderTrackingPage() {
  const brand = useBrand()
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNumericId = /^\d+$/.test(id)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Live-polling hook — auto-refreshes every 15s while status non-terminal.
  const trackQ = useOrderTracking(isNumericId && tokens.getCustomer() ? id : null)
  const cancelMut = useCancelCustomerOrder()

  const order = useMemo<CustomerOrder>(() => {
    if (trackQ.data) return backendOrderToUi(trackQ.data as BackendOrderDetail, id)
    const all = readOrders()
    const found = all.find((o) => o.id === id)
    return found ?? synthesizeOrder(id || 'KOT-DEMO')
  }, [id, trackQ.data])

  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === order.status)
  const canCancel = isNumericId && Boolean(tokens.getCustomer()) && CANCELLABLE_UI.includes(order.status)
  const isCancelled = order.status === 'Cancelled'
  const isDelivered = order.status === 'Delivered'

  // Rating state — per-menu-item stars, submitted individually
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [submittedFor, setSubmittedFor] = useState<Set<number>>(new Set())
  const submitRatingMut = useSubmitDishRating()

  const handleRate = (menuItemId: number, rating: number) => {
    setRatings((prev) => ({ ...prev, [menuItemId]: rating }))
    submitRatingMut.mutate(
      { menuItemId, rating },
      {
        onSuccess: (res) => {
          if (res.ok) {
            setSubmittedFor((prev) => new Set(prev).add(menuItemId))
            toast.success(`Rated ${rating}★ — thanks for the feedback!`)
          } else {
            toast.warning(res.message)
          }
        },
        onError: () => toast.warning('Could not submit rating — try again'),
      },
    )
  }

  const handleCancel = () => {
    if (!isNumericId) return
    cancelMut.mutate(
      { orderId: id },
      {
        onSuccess: () => {
          toast.success('Order cancelled')
          setShowCancelConfirm(false)
          void trackQ.refetch()
        },
        onError: (err) => {
          toast.warning(err instanceof Error ? err.message : 'Could not cancel order')
          setShowCancelConfirm(false)
        },
      },
    )
  }

  return (
    <CustomerLayout>
      <DocumentTitle title={`Tracking ${order.id} — ${brand.restaurantName}`} />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="subtitle">LIVE TRACKING</p>
        <div className="c-divider !ml-0" />
        <h1 className="display text-3xl sm:text-4xl mb-2">
          Tracking <span>{order.id}</span>
        </h1>
        <p className="text-sm text-[--c-text-soft] mb-8">
          Placed {order.placedAt} · Estimated arrival:{' '}
          <span className="gold-text font-bold">{order.eta}</span>
        </p>

        {/* Cancelled banner — takes over when order is cancelled */}
        {isCancelled ? (
          <div
            className="c-card p-5 mb-6 rounded-2xl border flex items-start gap-4"
            style={{
              background: 'rgba(220, 38, 38, 0.08)',
              borderColor: 'rgba(220, 38, 38, 0.4)',
              color: 'inherit',
            }}
          >
            <XCircle className="size-6 shrink-0 mt-0.5" style={{ color: 'rgb(220, 38, 38)' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: 'rgb(220, 38, 38)' }}>Order cancelled</p>
              <p className="text-xs text-[--c-text-soft] mt-1 leading-relaxed">
                This order has been cancelled. Any payment made will be refunded to your original method within 5–7 business days.
              </p>
            </div>
          </div>
        ) : null}

        {/* Poll status indicator — subtle inline toast when refetch fires */}
        {trackQ.isFetching && !trackQ.isLoading && !isCancelled ? (
          <div className="inline-flex items-center gap-2 text-[11px] text-[--c-text-muted] mb-2">
            <Loader2 className="size-3 animate-spin" /> Updating status…
          </div>
        ) : null}

        {/* Timeline Map Card */}
        <div className={cn(
          'c-card p-6 mb-6 rounded-2xl bg-[--c-bg-elev] border border-[--c-border]',
          isCancelled && 'opacity-40',
        )}>
          <div className="flex justify-between items-center relative gap-2">
            {STATUS_STEPS.map((step, idx) => {
              const isDone = idx < currentIdx
              const isCurrent = idx === currentIdx
              const isFuture = idx > currentIdx
              return (
                <div
                  key={step.key}
                  className="flex flex-col items-center text-center relative flex-1"
                >
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: isCurrent ? 1.15 : 1 }}
                    className={cn(
                      'size-11 rounded-full border-2 flex items-center justify-center mb-2.5 transition-all duration-300',
                      isCurrent && 'border-[--c-accent] bg-[var(--c-accent)] text-black shadow-lg shadow-[var(--c-shadow-primary)]',
                      isDone && 'border-[--c-accent]/40 text-[--c-accent]/80',
                      isFuture && 'border-[--c-border] text-[--c-text-muted]',
                    )}
                  >
                    <step.Icon className="size-5.5" />
                  </motion.span>
                  <p
                    className={cn(
                      'text-[9px] sm:text-xs font-bold tracking-wider uppercase',
                      isCurrent && 'gold-text',
                      isDone && 'text-[--c-accent]/80',
                      isFuture && 'text-[--c-text-muted]',
                    )}
                  >
                    {step.label}
                  </p>
                  {idx < STATUS_STEPS.length - 1 ? (
                    <span
                      className={cn(
                        'hidden md:block absolute top-5.5 left-[calc(50%+22px)] right-[calc(-50%+22px)] h-[2px] transition-colors duration-500',
                        idx < currentIdx ? 'bg-[--c-accent]/60' : 'bg-[--c-border]',
                      )}
                      aria-hidden
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        {/* Live Driver Map Fallback */}
        {order.status === 'Out for delivery' && (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-lg border border-[--c-border]">
            <DriverTrackingMap
              orderId={Number(order.id.replace(/[^0-9]/g, '')) || 0}
              driverLocation={null}
            />
          </div>
        )}

        {/* Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="c-card p-5 flex items-start gap-4 rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
            <div className="p-2.5 rounded-xl bg-[--c-border] text-[--c-accent] shrink-0">
              <MapPin className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="subtitle text-[9px] tracking-wider font-bold">DELIVERING TO</p>
              <p className="text-sm mt-1.5 font-medium leading-relaxed">{order.address}</p>
            </div>
          </div>
          <div className="c-card p-5 flex items-start gap-4 rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
            <div className="p-2.5 rounded-xl bg-[--c-border] text-[--c-accent] shrink-0">
              <Clock className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="subtitle text-[9px] tracking-wider font-bold">ESTIMATED TIME</p>
              <p className="text-sm mt-1.5 font-medium leading-relaxed">{order.eta} remaining</p>
            </div>
          </div>
        </div>

        {/* Order details summary list */}
        <div className="c-card overflow-hidden mb-6 rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
          <div className="p-5 border-b border-[--c-border]">
            <p className="subtitle">ORDER DETAILS</p>
            <h2 className="display text-xl sm:text-2xl">Items <span>Summary</span></h2>
          </div>
          <ul className="divide-y divide-[--c-border]">
            {order.items.map((line) => (
              <li key={line.id} className="p-4 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{line.name}</p>
                  <p className="text-xs text-[--c-text-muted] mt-0.5">{formatPrice(line.price)} × {line.qty}</p>
                </div>
                <p className="font-mono tabular-nums gold-text font-bold text-right">
                  {formatPrice(line.price * line.qty)}
                </p>
              </li>
            ))}
          </ul>
          <div className="p-5 space-y-2.5 border-t border-[--c-border] text-xs font-semibold text-[--c-text-soft]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST 5%</span>
              <span className="font-mono">{formatPrice(order.gst)}</span>
            </div>
            <div className="border-t border-[--c-border] pt-3 flex justify-between text-sm font-bold text-[--c-text]">
              <span>Grand Total</span>
              <span className="font-mono gold-text text-lg">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Rate items section — only shown after DELIVERED. Star row per dish. */}
        {isDelivered && order.items.some((l) => l.menuItemId) ? (
          <div className="c-card p-5 sm:p-6 rounded-2xl bg-[--c-bg-elev] border border-[--c-border] mb-4">
            <div className="mb-4">
              <p className="subtitle text-[10px]">HOW WAS IT?</p>
              <h3 className="display text-lg sm:text-xl">Rate <span>Your Meal</span></h3>
              <p className="text-xs text-[--c-text-muted] mt-1">Your ratings help other diners pick winners.</p>
            </div>
            <ul className="space-y-3">
              {order.items.filter((l) => l.menuItemId).map((line) => {
                const midNum = line.menuItemId as number
                const current = ratings[midNum] ?? 0
                const done = submittedFor.has(midNum)
                return (
                  <li key={line.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[--c-border] bg-black/10">
                    <p className="text-sm font-semibold truncate flex-1 min-w-0">{line.name}</p>
                    <div className="inline-flex gap-1 shrink-0" role="radiogroup" aria-label={`Rate ${line.name}`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handleRate(midNum, n)}
                          disabled={submitRatingMut.isPending || done}
                          aria-label={`${n} star${n > 1 ? 's' : ''}`}
                          className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
                          title={`${n} star${n > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={cn(
                              'size-5 transition-colors',
                              current >= n ? 'fill-current' : 'opacity-30',
                            )}
                            style={current >= n ? { color: 'var(--c-accent)' } : undefined}
                          />
                        </button>
                      ))}
                    </div>
                    {done ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 shrink-0">Thanks!</span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        {/* Cancel confirmation inline block (shown when Cancel clicked) */}
        {showCancelConfirm ? (
          <div
            className="c-card p-5 mb-4 rounded-2xl border"
            style={{
              background: 'rgba(220, 38, 38, 0.06)',
              borderColor: 'rgba(220, 38, 38, 0.35)',
            }}
          >
            <p className="text-sm font-bold mb-2" style={{ color: 'rgb(220, 38, 38)' }}>
              Cancel this order?
            </p>
            <p className="text-xs text-[--c-text-soft] mb-4 leading-relaxed">
              Once cancelled, this order can't be reinstated. Any prepayment refunds process in 5–7 days.
            </p>
            <div className="flex gap-2">
              <button
                className="c-button-outline inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelMut.isPending}
              >
                Keep Order
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'rgb(220, 38, 38)' }}
                onClick={handleCancel}
                disabled={cancelMut.isPending}
              >
                {cancelMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
                Yes, Cancel
              </button>
            </div>
          </div>
        ) : null}

        {/* Actions panel */}
        <div className={cn(
          'grid grid-cols-1 gap-3.5',
          canCancel ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
        )}>
          <button
            className="c-button-outline inline-flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer"
            onClick={() => {
              toast.success('Items added back to your cart')
              navigate('/cart')
            }}
          >
            <RotateCcw className="size-4" /> REORDER ITEMS
          </button>
          <button
            className="c-button-primary inline-flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer"
            onClick={() => toast.info('Support query opened. Our agent will call you shortly.')}
          >
            <MessageSquarePlus className="size-4" /> NEED HELP?
          </button>
          {canCancel ? (
            <button
              className="inline-flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer text-xs font-bold uppercase tracking-widest transition-colors border"
              style={{
                borderColor: 'rgba(220, 38, 38, 0.4)',
                color: 'rgb(220, 38, 38)',
                background: 'transparent',
              }}
              onClick={() => setShowCancelConfirm(true)}
            >
              <Ban className="size-4" /> Cancel Order
            </button>
          ) : null}
        </div>
      </section>
    </CustomerLayout>
  )
}
