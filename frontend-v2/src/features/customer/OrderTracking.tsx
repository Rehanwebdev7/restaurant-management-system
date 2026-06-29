/**
 * Order tracking page — `/orders/:id`.
 *
 * Reads orders from localStorage `customer_orders_v2`. If the requested order
 * is not stored, falls back to a synthetic order so direct-link probes
 * (e.g. `/orders/123`) still return a meaningful HTTP 200 page rather than
 * a "not found" placeholder. When the backend lands we will swap the read
 * for an `apiClient.get('/api/customer/orders/{id}')` call.
 *
 * Status timeline mirrors the legacy `OrdersPage.jsx` shape:
 *   Placed → Accepted → Cooking → Out for delivery → Delivered.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CheckCircle2, ClipboardList, ChefHat, Bike, PackageCheck, MapPin, Clock, Star, RotateCcw,
} from 'lucide-react'
import CustomerLayout from '@/features/customer/CustomerLayout'
import { DocumentTitle } from '@/lib/seo/document-title'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
// UI-F-94 — live driver tracking with sample-data fallback while backend
// is not yet shipping the endpoint.
import DriverTrackingMap from '@/features/customer/DriverTrackingMap'
import { fetchCustomerOrderDetail, type BackendOrderDetail } from '@/api/services/customer'
import { tokens } from '@/lib/auth/tokens'

const ORDERS_KEY = 'customer_orders_v2'

export type OrderStatus = 'Placed' | 'Accepted' | 'Cooking' | 'Out for delivery' | 'Delivered'

interface OrderLine {
  id: number
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
  { key: 'Placed', label: 'Order Placed', Icon: ClipboardList },
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
    placedAt: new Date(Date.now() - 18 * 60_000).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    }),
    status: 'Cooking',
    eta: '22 min',
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
  if (v.includes('DELIVERED') || v.includes('COMPLETED')) return 'Delivered'
  if (v.includes('OUT')) return 'Out for delivery'
  if (v.includes('COOK') || v.includes('PREPARING') || v.includes('READY')) return 'Cooking'
  if (v.includes('ACCEPT') || v.includes('CONFIRMED')) return 'Accepted'
  return 'Placed'
}

function backendOrderToUi(d: BackendOrderDetail, fallbackId: string): CustomerOrder {
  const num = (v: number | string | undefined): number =>
    typeof v === 'number' ? v : v ? Number(v) || 0 : 0
  const subtotal = num(d.subtotal)
  const tax = num(d.taxAmount)
  const items: OrderLine[] = (d.orderItems ?? []).map((it, idx) => ({
    id: it.id ?? idx + 1,
    name: it.menuItemName ?? `Item ${idx + 1}`,
    qty: it.quantity ?? 1,
    price: num(it.itemTotal ?? it.price),
  }))
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

export default function OrderTracking() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  // Backend-fetched detail when available; falls back to the local cart
  // queue or a synthetic demo order so deep-links never 404.
  const [backendOrder, setBackendOrder] = useState<CustomerOrder | null>(null)

  // Pull from backend if the URL id is a numeric order id AND we have a
  // customer token. String ids (KOT-xxx) are local cart-queue entries.
  useEffect(() => {
    let cancelled = false
    const isNumeric = /^\d+$/.test(id)
    if (!isNumeric || !tokens.getCustomer()) return
    void (async () => {
      const res = await fetchCustomerOrderDetail(id)
      if (!cancelled && res.ok) setBackendOrder(backendOrderToUi(res.data, id))
    })()
    return () => { cancelled = true }
  }, [id])

  const order = useMemo<CustomerOrder>(() => {
    if (backendOrder) return backendOrder
    const all = readOrders()
    const found = all.find((o) => o.id === id)
    return found ?? synthesizeOrder(id || 'KOT-DEMO')
  }, [id, backendOrder])

  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === order.status)

  return (
    <CustomerLayout>
      <DocumentTitle title={`Tracking ${order.id} — Spice Garden`} />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="subtitle">YOUR ORDER STATUS</p>
        <div className="c-divider !ml-0" />
        <h1 className="display text-3xl sm:text-4xl mb-2">
          Tracking <span>{order.id}</span>
        </h1>
        <p className="text-sm text-[--c-text-soft] mb-8">
          Placed {order.placedAt} · arriving in roughly{' '}
          <span className="gold-text font-semibold">{order.eta}</span>
        </p>

        {/* Timeline */}
        <ol className="c-card p-6 mb-6">
          <div className="grid grid-cols-5 gap-2 relative">
            {STATUS_STEPS.map((step, idx) => {
              const isDone = idx < currentIdx
              const isCurrent = idx === currentIdx
              const isFuture = idx > currentIdx
              return (
                <li
                  key={step.key}
                  className="flex flex-col items-center text-center relative"
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span
                    className={cn(
                      'size-10 rounded-full border-2 flex items-center justify-center mb-2 transition-colors',
                      isCurrent && 'border-[--c-accent] gold-text bg-[--c-accent]/10',
                      isDone && 'border-[--c-accent]/40 text-[--c-accent]/70',
                      isFuture && 'border-[--c-border] text-[--c-text-muted]',
                    )}
                  >
                    <step.Icon className="size-5" />
                  </span>
                  <p
                    className={cn(
                      'text-[10px] sm:text-xs font-semibold tracking-wider uppercase',
                      isCurrent && 'gold-text',
                      isDone && 'text-[--c-accent]/70',
                      isFuture && 'text-[--c-text-muted]',
                    )}
                  >
                    {step.label}
                  </p>
                  {idx < STATUS_STEPS.length - 1 ? (
                    <span
                      className={cn(
                        'hidden sm:block absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-0.5',
                        idx < currentIdx ? 'bg-[--c-accent]/60' : 'bg-[--c-border]',
                      )}
                      aria-hidden
                    />
                  ) : null}
                </li>
              )
            })}
          </div>
        </ol>

        {/* UI-F-94 — Live driver tracking (only renders when out-for-delivery). */}
        {order.status === 'Out for delivery' ? (
          <div className="mb-6">
            <DriverTrackingMap
              orderId={Number(order.id.replace(/[^0-9]/g, '')) || 0}
              driverLocation={null}
            />
          </div>
        ) : null}

        {/* Address + ETA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="c-card p-4 flex items-start gap-3">
            <MapPin className="size-5 gold-text shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="subtitle text-[10px]">DELIVERING TO</p>
              <p className="text-sm mt-1">{order.address}</p>
            </div>
          </div>
          <div className="c-card p-4 flex items-start gap-3">
            <Clock className="size-5 gold-text shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="subtitle text-[10px]">ESTIMATED ARRIVAL</p>
              <p className="text-sm mt-1">{order.eta} from now</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="c-card overflow-hidden mb-6">
          <div className="p-5 border-b border-[--c-border]">
            <p className="subtitle">ORDER SUMMARY</p>
            <h2 className="display text-2xl">Your <span>Items</span></h2>
          </div>
          <ul className="divide-y divide-[--c-border]">
            {order.items.map((l) => (
              <li key={l.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{l.name}</p>
                  <p className="text-xs text-[--c-text-muted]">₹{l.price} × {l.qty}</p>
                </div>
                <p className="font-mono tabular-nums gold-text font-semibold">
                  ₹{(l.price * l.qty).toLocaleString('en-IN')}
                </p>
              </li>
            ))}
          </ul>
          <div className="p-5 space-y-2 border-t border-[--c-border]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[--c-text-soft]">Subtotal</span>
              <span className="tabular-nums">₹{order.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[--c-text-soft]">GST 5%</span>
              <span className="tabular-nums">₹{order.gst.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[--c-border]">
              <span className="font-semibold">Total</span>
              <span className="display text-2xl gold-text">₹{order.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            className="c-button-outline inline-flex items-center justify-center gap-2"
            onClick={() => {
              toast.success('Items added back to your cart')
              navigate('/cart')
            }}
          >
            <RotateCcw className="size-4" /> REORDER
          </button>
          <button
            className="c-button-primary inline-flex items-center justify-center gap-2"
            onClick={() => toast.info('Rating flow opens when delivery completes')}
          >
            <Star className="size-4" /> RATE THIS ORDER
          </button>
        </div>
      </section>
    </CustomerLayout>
  )
}
