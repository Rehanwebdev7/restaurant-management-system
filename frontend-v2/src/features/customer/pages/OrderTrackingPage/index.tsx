import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2, ClipboardList, ChefHat, Bike, PackageCheck, MapPin, Clock, RotateCcw, MessageSquarePlus
} from 'lucide-react'
import CustomerLayout from '@/features/customer/CustomerLayout'
import { DocumentTitle } from '@/lib/seo/document-title'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import DriverTrackingMap from '@/features/customer/DriverTrackingMap'
import { fetchCustomerOrderDetail, type BackendOrderDetail } from '@/api/services/customer'
import { tokens } from '@/lib/auth/tokens'
import '@/styles/customer.css'

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

export function OrderTrackingPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [backendOrder, setBackendOrder] = useState<CustomerOrder | null>(null)

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
        <p className="subtitle">LIVE TRACKING</p>
        <div className="c-divider !ml-0" />
        <h1 className="display text-3xl sm:text-4xl mb-2">
          Tracking <span>{order.id}</span>
        </h1>
        <p className="text-sm text-[--c-text-soft] mb-8">
          Placed {order.placedAt} · Estimated arrival:{' '}
          <span className="gold-text font-bold">{order.eta}</span>
        </p>

        {/* Timeline Map Card */}
        <div className="c-card p-6 mb-6 rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
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
                  <p className="text-xs text-[--c-text-muted] mt-0.5">${line.price} × {line.qty}</p>
                </div>
                <p className="font-mono tabular-nums gold-text font-bold text-right">
                  ${(line.price * line.qty).toLocaleString('en-US')}
                </p>
              </li>
            ))}
          </ul>
          <div className="p-5 space-y-2.5 border-t border-[--c-border] text-xs font-semibold text-[--c-text-soft]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono">${order.subtotal.toLocaleString('en-US')}</span>
            </div>
            <div className="flex justify-between">
              <span>GST 5%</span>
              <span className="font-mono">${order.gst.toLocaleString('en-US')}</span>
            </div>
            <div className="border-t border-[--c-border] pt-3 flex justify-between text-sm font-bold text-[--c-text]">
              <span>Grand Total</span>
              <span className="font-mono gold-text text-lg">${order.total.toLocaleString('en-US')}</span>
            </div>
          </div>
        </div>

        {/* Actions panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
        </div>
      </section>
    </CustomerLayout>
  )
}
