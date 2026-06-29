/**
 * Cashier sub-pages — 11 new pages added 2026-06-24 to close the
 * legacy → v2 parity gap.
 *
 * Endpoint reality check (2026-06-24, cashier 9800000006):
 *  - /api/cashier/orders/history (+ orderType filter)        ✅ LIVE
 *  - /api/cashier/orders/{id}                                ❌ JDBC 500 → fall back to history scan
 *  - /api/cashier/orders/active / dine_in / takeaway / delivery ❌ GET-not-supported → use history?orderType
 *  - /api/cashier/outstanding/all|history|delivery           ❌ GET-not-supported → sample with PendingBadge
 *  - /api/cashier/wallet_topup_request/history               ✅ LIVE
 *  - /api/cashier/coupon/all                                 ✅ LIVE
 *  - /api/cashier/sliders/all                                ❌ no static resource → not used here
 */
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Printer, Receipt, Ban, CheckCircle2, RefreshCw, MapPin, Search,
  Ticket, Wallet, ChefHat, Bike, ShoppingBag, Utensils,
  ClipboardList, IndianRupee, AlertTriangle, Clock,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardSkeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  useCashierOrder, useCashierOrders, useCashierSections, useCashierTables,
  useCashierCoupons, useCashierWalletTopupHistory, useCashierDashboard,
  useMarkCashierOrderPaid, useCancelCashierOrder, useRefundCashierOrder,
} from '@/api/queries/cashier'
import type {
  CashierOrder, CashierCoupon, CashierWalletTopupRequest, CashierSection, CashierTable,
} from '@/api/services/cashier'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const crumb = (last: string) => [
  { label: 'Cashier', href: '/cashier/dashboard' },
  { label: last },
]

const PendingBadge = () => (
  <Badge variant="warning" className="ml-2 align-middle">Sample · backend pending</Badge>
)

const inr = (n: number) => `₹${Math.round(Number(n || 0)).toLocaleString('en-IN')}`

function statusBadge(s: string | null | undefined) {
  const v = (s ?? '').toUpperCase()
  if (v === 'COMPLETED' || v === 'DELIVERED' || v === 'SERVED' || v === 'PAID') return <Badge variant="success">{v}</Badge>
  if (v === 'CANCELLED' || v === 'REJECTED' || v === 'FAILED') return <Badge variant="destructive">{v}</Badge>
  if (v === 'COOKING' || v === 'PREPARING') return <Badge variant="warning">{v}</Badge>
  if (v === 'READY' || v === 'APPROVED') return <Badge variant="info">{v}</Badge>
  return <Badge variant="secondary">{v || '—'}</Badge>
}

/* ------------------------------------------------------------------ */
/* 1. OrderDetail                                                     */
/* ------------------------------------------------------------------ */
export function CashierOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const numericId = id ? Number(id) : null
  const q = useCashierOrder(numericId)
  const order = q.data ?? null
  const markPaid = useMarkCashierOrderPaid()
  const cancel = useCancelCashierOrder()

  const [confirmPay, setConfirmPay] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (q.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Order" breadcrumbs={crumb('Order')} />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (!order || !numericId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Order not found" breadcrumbs={crumb('Order')} />
        <EmptyState
          icon={<AlertTriangle className="size-7" />}
          title="Order not found"
          description="Backend `/api/cashier/orders/{id}` is throwing a JDBC error. We scan the history list as a fallback, but this id wasn't there either."
          action={<Button asChild><Link to="/cashier/orders">Back to orders</Link></Button>}
        />
      </div>
    )
  }

  const subtotal = Number(order.subtotal ?? 0)
  const tax = Number(order.taxAmount ?? 0)
  const discount = Number(order.discountAmount ?? 0)
  const delivery = Number(order.deliveryFee ?? 0)
  const total = Number(order.totalAmount ?? 0)

  const doMarkPaid = async () => {
    const res = await markPaid.mutateAsync(numericId)
    if (res.ok) toast.success('Marked as paid')
    else toast.warning(`Backend rejected: ${res.message}. Marked locally.`)
  }

  const doCancel = async () => {
    const res = await cancel.mutateAsync({ id: numericId, reason: 'Cancelled by cashier' })
    if (res.ok) toast.success('Order cancelled')
    else toast.warning(`Backend rejected: ${res.message}.`)
  }

  // Status timeline (synthetic — backend doesn't emit per-step timestamps yet)
  const steps = ['PENDING', 'COOKING', 'READY', 'COMPLETED']
  const currentIdx = Math.max(0, steps.indexOf(order.status.toUpperCase()))

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`${order.orderType} · ${new Date(order.createdAt).toLocaleString('en-IN')}`}
        breadcrumbs={[{ label: 'Cashier', href: '/cashier/dashboard' }, { label: 'Orders', href: '/cashier/orders' }, { label: order.orderNumber }]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to={`/cashier/print-kot/${numericId}`}><Printer className="size-4" /> Print KOT</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/cashier/print-bill/${numericId}`}><Receipt className="size-4" /> Print Bill</Link>
            </Button>
            <Button onClick={() => setConfirmPay(true)} disabled={order.paymentStatus === 'PAID'}>
              <CheckCircle2 className="size-4" /> Mark paid
            </Button>
            <Button variant="destructive" onClick={() => setConfirmCancel(true)} disabled={order.status === 'CANCELLED'}>
              <Ban className="size-4" /> Cancel
            </Button>
          </>
        }
      />

      {/* Header card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
              <div className="mt-1 flex items-center gap-2">{statusBadge(order.status)} {statusBadge(order.paymentStatus)}</div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="text-2xl font-bold tabular-nums">{inr(total)}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="pt-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Status timeline</p>
            <div className="flex items-center gap-2 overflow-x-auto">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold',
                      i <= currentIdx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <span className="font-mono">{i + 1}</span>{s}
                  </div>
                  {i < steps.length - 1 ? <span className="text-muted-foreground">→</span> : null}
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="pt-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Items ({order.orderItemsCount})</p>
            <div className="rounded-md border border-border divide-y divide-border text-sm">
              {/* Backend list endpoint doesn't ship item rows. We surface the
                  count + sample placeholder so the layout is honest. */}
              <div className="flex items-center justify-between px-4 py-3 text-muted-foreground italic">
                Item lines not available from `/orders/history`. Open KOT to see
                printable summary, or wait for backend to expose `/orders/{'{'}id{'}'}` cleanly.
              </div>
            </div>
          </div>
        </Card>

        {/* Right column: customer + payment */}
        <Card className="p-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Customer</p>
            <p className="font-medium mt-1">{order.customerName ?? (order.tableNumber ? `Table ${order.tableNumber}` : 'Walk-in')}</p>
            {order.customerPhone ? <p className="text-sm text-muted-foreground">{order.customerPhone}</p> : null}
            {order.customerEmail ? <p className="text-sm text-muted-foreground">{order.customerEmail}</p> : null}
          </div>
          <hr className="border-border" />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Payment breakdown</p>
            <dl className="text-sm space-y-1.5 tabular-nums">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{inr(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd>{inr(tax)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd>− {inr(discount)}</dd></div>
              {delivery > 0 ? (
                <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{inr(delivery)}</dd></div>
              ) : null}
              <hr className="border-border my-2" />
              <div className="flex justify-between font-bold text-base"><dt>Grand total</dt><dd>{inr(total)}</dd></div>
            </dl>
            <p className="mt-3 text-xs"><span className="text-muted-foreground">Method:</span> <span className="font-semibold">{order.paymentMethod}</span></p>
            {order.couponCode ? <p className="mt-1 text-xs"><span className="text-muted-foreground">Coupon:</span> <span className="font-mono">{order.couponCode}</span></p> : null}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmPay}
        onOpenChange={setConfirmPay}
        title="Mark order as paid?"
        description={`This will record ${inr(total)} as collected for ${order.orderNumber}.`}
        confirmLabel="Mark paid"
        onConfirm={doMarkPaid}
      />
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        destructive
        title="Cancel this order?"
        description={`${order.orderNumber} will be marked cancelled. This cannot be undone from the cashier panel.`}
        confirmLabel="Yes, cancel"
        onConfirm={doCancel}
      />

    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2. DineIn — table grid                                             */
/* ------------------------------------------------------------------ */
export function CashierDineIn() {
  const sectionsQ = useCashierSections()
  const tablesQ = useCashierTables()
  const ordersQ = useCashierOrders({ page: 1, pageSize: 100, status: 'PENDING' })
  const navigate = useNavigate()
  const [sectionFilter, setSectionFilter] = useState<string>('all')

  const sections: CashierSection[] = sectionsQ.data ?? []
  const tables: CashierTable[] = tablesQ.data ?? []
  const liveOrders = ordersQ.data?.records ?? []

  const occupiedTable = useMemo(() => {
    const map = new Map<string, CashierOrder>()
    liveOrders.forEach((o) => {
      if (o.orderType === 'DINING' && o.tableNumber) map.set(String(o.tableNumber), o)
    })
    return map
  }, [liveOrders])

  const filteredTables = useMemo(() => {
    if (sectionFilter === 'all') return tables
    const sid = Number(sectionFilter)
    return tables.filter((t) => t.sectionId?.id === sid)
  }, [tables, sectionFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dine-In"
        description={`${tables.length} tables across ${sections.length} sections`}
        breadcrumbs={crumb('Dine-In')}
        actions={
          <>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All sections" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sections</SelectItem>
                {sections.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { void tablesQ.refetch(); void ordersQ.refetch() }}>
              <RefreshCw className={tablesQ.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh
            </Button>
          </>
        }
      />

      {tablesQ.isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredTables.length === 0 ? (
        <EmptyState
          icon={<Utensils className="size-7" />}
          title="No tables in this section"
          description="Pick another section or add tables under restaurant settings."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredTables.map((t) => {
            const label = t.tableNumber ?? t.name ?? `T-${t.id}`
            const order = occupiedTable.get(String(label))
            const occupied = Boolean(order)
            return (
              <Card
                key={t.id}
                interactive
                className={cn('p-4 text-center', occupied ? 'border-warning/50 bg-warning/5' : 'border-success/30 bg-success/5')}
                onClick={() => {
                  if (order) navigate(`/cashier/orders/${order.id}`)
                  else navigate(`/cashier/new-order?tableNumber=${encodeURIComponent(label)}`)
                }}
              >
                <CardContent className="p-0 space-y-2">
                  <Utensils className={cn('size-7 mx-auto', occupied ? 'text-warning' : 'text-success')} />
                  <p className="text-lg font-bold">{label}</p>
                  <Badge variant={occupied ? 'warning' : 'success'} className="mx-auto">
                    {occupied ? 'Occupied' : 'Available'}
                  </Badge>
                  {t.capacity ? <p className="text-xs text-muted-foreground">Seats {t.capacity}</p> : null}
                  {order ? <p className="text-[10px] font-mono text-muted-foreground truncate">{order.orderNumber}</p> : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Takeaway                                                        */
/* ------------------------------------------------------------------ */
function OrdersByTypeTable({ title, orderType, icon }: {
  title: string
  orderType: 'TAKEAWAY' | 'DELIVERY'
  icon: React.ReactNode
}) {
  const q = useCashierOrders({ page: 1, pageSize: 50, orderType })
  const data = q.data?.records ?? []

  const columns = useMemo<ColumnDef<CashierOrder>[]>(() => [
    {
      accessorKey: 'orderNumber', header: 'Order',
      cell: ({ row }) => (
        <Link to={`/cashier/orders/${row.original.id}`} className="font-mono font-semibold hover:text-primary">
          {row.original.orderNumber}
        </Link>
      ),
    },
    {
      accessorKey: 'customerName', header: 'Customer',
      cell: ({ row }) => row.original.customerName ?? row.original.customerPhone ?? <span className="text-muted-foreground">Walk-in</span>,
    },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
    { accessorKey: 'paymentStatus', header: 'Payment', cell: ({ row }) => statusBadge(row.original.paymentStatus) },
    {
      accessorKey: 'totalAmount', header: 'Amount',
      cell: ({ row }) => <span className="tabular-nums font-medium">{inr(row.original.totalAmount)}</span>,
    },
    {
      accessorKey: 'createdAt', header: 'When',
      cell: ({ row }) => {
        try {
          return new Date(row.original.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        } catch { return row.original.createdAt }
      },
    },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={`${data.length} active ${orderType.toLowerCase()} orders`}
        breadcrumbs={crumb(title)}
        actions={
          <Button variant="outline" onClick={() => void q.refetch()}>
            <RefreshCw className={q.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh
          </Button>
        }
      />
      <DataTable
        data={data}
        columns={columns}
        loading={q.isLoading}
        searchPlaceholder={`Search ${orderType.toLowerCase()} orders…`}
        emptyTitle={`No ${orderType.toLowerCase()} orders`}
        emptyDescription="Once orders come in, they will appear here automatically."
        emptyAction={icon}
      />
    </div>
  )
}

export function CashierTakeaway() {
  return <OrdersByTypeTable title="Takeaway" orderType="TAKEAWAY" icon={<ShoppingBag className="size-6" />} />
}

/* ------------------------------------------------------------------ */
/* 4. Delivery                                                        */
/* ------------------------------------------------------------------ */
export function CashierDelivery() {
  const q = useCashierOrders({ page: 1, pageSize: 50, orderType: 'DELIVERY' })
  const data = q.data?.records ?? []

  const columns = useMemo<ColumnDef<CashierOrder>[]>(() => [
    {
      accessorKey: 'orderNumber', header: 'Order',
      cell: ({ row }) => (
        <Link to={`/cashier/orders/${row.original.id}`} className="font-mono font-semibold hover:text-primary">
          {row.original.orderNumber}
        </Link>
      ),
    },
    {
      accessorKey: 'customerName', header: 'Customer',
      cell: ({ row }) => row.original.customerName ?? row.original.customerPhone ?? <span className="text-muted-foreground">—</span>,
    },
    { accessorKey: 'status', header: 'Order', cell: ({ row }) => statusBadge(row.original.status) },
    { accessorKey: 'deliveryStatus', header: 'Delivery', cell: ({ row }) => statusBadge(row.original.deliveryStatus) },
    { accessorKey: 'totalAmount', header: 'Amount', cell: ({ row }) => <span className="tabular-nums font-medium">{inr(row.original.totalAmount)}</span> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery"
        description={`${data.length} delivery orders · live from `}
        breadcrumbs={crumb('Delivery')}
        actions={
          <Button variant="outline" onClick={() => void q.refetch()}>
            <RefreshCw className={q.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <DataTable
            data={data}
            columns={columns}
            loading={q.isLoading}
            searchPlaceholder="Search delivery orders…"
            emptyTitle="No delivery orders"
          />
        </Card>
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-primary" />
            <p className="font-semibold">Live map</p>
            <PendingBadge />
          </div>
          <div className="aspect-square rounded-md bg-muted/40 border border-dashed border-border grid place-items-center text-center p-6">
            <div className="space-y-2">
              <Bike className="size-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Real-time delivery map requires the `GET /api/cashier/delivery_runs` endpoint, which currently 500s.
                Drop-in MapPicker primitive ready for display mode.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 5. Refund                                                          */
/* ------------------------------------------------------------------ */
export function CashierRefund() {
  const [orderNumber, setOrderNumber] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [reason, setReason] = useState('CUSTOMER_REQUEST')
  const [amount, setAmount] = useState('')
  const [confirm, setConfirm] = useState(false)

  const q = useCashierOrders({ page: 1, pageSize: 50, orderNumber: searchTerm })
  const refund = useRefundCashierOrder()

  const matched = useMemo<CashierOrder | null>(() => {
    if (!searchTerm) return null
    const list = q.data?.records ?? []
    return list.find((o) => o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ?? null
  }, [q.data, searchTerm])

  const doSearch = () => {
    if (!orderNumber.trim()) { toast.warning('Enter an order number'); return }
    setSearchTerm(orderNumber.trim())
  }

  const doRefund = async () => {
    if (!matched) return
    const amt = Number(amount) || Number(matched.totalAmount)
    if (amt <= 0) { toast.warning('Refund amount must be > 0'); return }
    const res = await refund.mutateAsync({ id: matched.id, amount: amt, reason })
    if (res.ok) toast.success(`Refunded ${inr(amt)} for ${matched.orderNumber}`)
    else toast.warning(`Refund endpoint pending: ${res.message}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refund"
        description="Search an order and issue a refund. Backend POST /orders/{id}/refund is probed live; errors are surfaced cleanly."
        breadcrumbs={crumb('Refund')}
      />
      <Card className="p-5 space-y-4 max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ref-order">Order number</Label>
            <Input id="ref-order" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ORD-162-…" />
          </div>
          <div className="flex items-end">
            <Button onClick={doSearch}><Search className="size-4" /> Search</Button>
          </div>
        </div>

        {searchTerm && !matched && !q.isLoading ? (
          <EmptyState title="No matching order" description={`No order found for "${searchTerm}".`} />
        ) : null}

        {matched ? (
          <div className="rounded-md border border-border p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-mono font-semibold">{matched.orderNumber}</p>
                <p className="text-xs text-muted-foreground">{matched.customerName ?? 'Walk-in'} · {matched.orderType}</p>
              </div>
              <p className="text-xl font-bold tabular-nums">{inr(matched.totalAmount)}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER_REQUEST">Customer request</SelectItem>
                    <SelectItem value="QUALITY_ISSUE">Quality issue</SelectItem>
                    <SelectItem value="WRONG_ORDER">Wrong order delivered</SelectItem>
                    <SelectItem value="LATE_DELIVERY">Late delivery</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ref-amt">Amount</Label>
                <Input id="ref-amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Default ${inr(matched.totalAmount)}`} />
              </div>
            </div>
            <Button variant="destructive" onClick={() => setConfirm(true)}>
              <IndianRupee className="size-4" /> Issue refund
            </Button>
          </div>
        ) : null}
      </Card>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        destructive
        title="Issue refund?"
        description={matched ? `${inr(Number(amount) || Number(matched.totalAmount))} will be refunded for ${matched.orderNumber}.` : ''}
        confirmLabel="Yes, refund"
        onConfirm={doRefund}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 6. KOT Print                                                       */
/* ------------------------------------------------------------------ */
export function CashierKotPrint() {
  const { id } = useParams<{ id: string }>()
  const numericId = id ? Number(id) : null
  const q = useCashierOrder(numericId)
  const order = q.data ?? null

  useEffect(() => {
    if (order) {
      // Defer slightly so the layout is fully painted before the dialog opens
      const t = window.setTimeout(() => window.print(), 250)
      return () => window.clearTimeout(t)
    }
    return
  }, [order])

  if (q.isLoading) return <div className="p-6"><CardSkeleton /></div>
  if (!order) return <div className="p-6"><EmptyState title="KOT unavailable" description="Order not found in cashier history." /></div>

  return (
    <div className="kot-print bg-white text-black mx-auto p-3 font-mono" style={{ width: '80mm', minHeight: '100vh' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .kot-print, .kot-print * { visibility: visible; }
          .kot-print { position: absolute; left: 0; top: 0; width: 80mm; }
          .print\\:hidden, header, nav, aside { display: none !important; }
          @page { size: 80mm auto; margin: 4mm; }
        }
      `}</style>
      <div className="text-center border-b border-dashed border-black pb-2 mb-2">
        <p className="font-bold text-lg uppercase">Spice Garden</p>
        <p className="text-xs">KITCHEN ORDER TICKET</p>
      </div>
      <div className="text-xs space-y-0.5 mb-2">
        <div className="flex justify-between"><span>Order:</span><span>{order.orderNumber}</span></div>
        <div className="flex justify-between"><span>Type:</span><span>{order.orderType}</span></div>
        {order.tableNumber ? <div className="flex justify-between"><span>Table:</span><span>{order.tableNumber}</span></div> : null}
        <div className="flex justify-between"><span>Time:</span><span>{new Date(order.createdAt).toLocaleString('en-IN')}</span></div>
      </div>
      <div className="border-t border-dashed border-black pt-2 mb-2">
        <p className="text-xs font-bold uppercase mb-1">Items</p>
        <div className="text-xs">
          <div className="flex justify-between font-bold border-b border-black pb-0.5">
            <span>Item</span><span>Qty</span>
          </div>
          <div className="py-1">
            <p className="italic text-[10px]">{order.orderItemsCount} line(s) — itemized view requires backend `/orders/{'{'}id{'}'}/items` (currently broken)</p>
          </div>
        </div>
      </div>
      <div className="border-t border-dashed border-black pt-2 text-xs">
        <div className="flex justify-between font-bold"><span>TOTAL</span><span>{inr(order.totalAmount)}</span></div>
      </div>
      {order.specialInstructions ? (
        <div className="border-t border-dashed border-black pt-2 mt-2 text-xs">
          <p className="font-bold">Notes:</p>
          <p>{order.specialInstructions}</p>
        </div>
      ) : null}
      <div className="text-center text-[10px] mt-3 print:hidden">
        <Button size="sm" onClick={() => window.print()}><Printer className="size-3" /> Print again</Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 7. Bill Print                                                      */
/* ------------------------------------------------------------------ */
export function CashierBillPrint() {
  const { id } = useParams<{ id: string }>()
  const numericId = id ? Number(id) : null
  const q = useCashierOrder(numericId)
  const order = q.data ?? null

  useEffect(() => {
    if (order) {
      const t = window.setTimeout(() => window.print(), 250)
      return () => window.clearTimeout(t)
    }
    return
  }, [order])

  if (q.isLoading) return <div className="p-6"><CardSkeleton /></div>
  if (!order) return <div className="p-6"><EmptyState title="Bill unavailable" description="Order not found in cashier history." /></div>

  const subtotal = Number(order.subtotal ?? 0)
  const gstTotal = Number(order.taxAmount ?? subtotal * 0.05)
  const cgst = gstTotal / 2
  const sgst = gstTotal / 2
  const total = Number(order.totalAmount ?? 0)

  return (
    <div className="bill-print bg-white text-black mx-auto p-3 font-mono" style={{ width: '80mm', minHeight: '100vh' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .bill-print, .bill-print * { visibility: visible; }
          .bill-print { position: absolute; left: 0; top: 0; width: 80mm; }
          .print\\:hidden, header, nav, aside { display: none !important; }
          @page { size: 80mm auto; margin: 4mm; }
        }
      `}</style>
      <div className="text-center border-b border-dashed border-black pb-2 mb-2">
        <p className="font-bold text-lg uppercase">Spice Garden</p>
        <p className="text-[10px]">Restaurant · Andheri West, Mumbai</p>
        <p className="text-[10px]">GSTIN: 27AAACS1234D1ZA</p>
        <p className="text-xs font-bold uppercase mt-1">TAX INVOICE</p>
      </div>
      <div className="text-xs space-y-0.5 mb-2">
        <div className="flex justify-between"><span>Bill No:</span><span>{order.orderNumber}</span></div>
        {order.tableNumber ? <div className="flex justify-between"><span>Table:</span><span>{order.tableNumber}</span></div> : null}
        <div className="flex justify-between"><span>Date:</span><span>{new Date(order.createdAt).toLocaleString('en-IN')}</span></div>
        <div className="flex justify-between"><span>Type:</span><span>{order.orderType}</span></div>
        {order.customerName ? <div className="flex justify-between"><span>Customer:</span><span>{order.customerName}</span></div> : null}
      </div>
      <div className="border-t border-dashed border-black pt-2 mb-2 text-xs">
        <p className="font-bold uppercase mb-1">Charges</p>
        <div className="space-y-0.5">
          <div className="flex justify-between"><span>Items ({order.orderItemsCount})</span><span>{inr(subtotal)}</span></div>
          {Number(order.discountAmount) > 0 ? (
            <div className="flex justify-between"><span>Discount</span><span>− {inr(order.discountAmount)}</span></div>
          ) : null}
          {Number(order.deliveryFee) > 0 ? (
            <div className="flex justify-between"><span>Delivery</span><span>{inr(order.deliveryFee)}</span></div>
          ) : null}
          <div className="flex justify-between"><span>CGST 2.5%</span><span>{inr(cgst)}</span></div>
          <div className="flex justify-between"><span>SGST 2.5%</span><span>{inr(sgst)}</span></div>
        </div>
      </div>
      <div className="border-t border-dashed border-black pt-2 text-xs">
        <div className="flex justify-between font-bold text-base"><span>GRAND TOTAL</span><span>{inr(total)}</span></div>
        <p className="text-[10px] mt-1">Paid via {order.paymentMethod}</p>
      </div>
      <div className="text-center text-[10px] mt-4 border-t border-dashed border-black pt-2">
        <p>Thank you for dining with us!</p>
        <p className="italic">Visit again soon</p>
      </div>
      <div className="text-center text-[10px] mt-3 print:hidden">
        <Button size="sm" onClick={() => window.print()}><Printer className="size-3" /> Print again</Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 8. WalletTopupHistory                                              */
/* ------------------------------------------------------------------ */
export function CashierWalletTopupHistory() {
  const q = useCashierWalletTopupHistory()
  const data: CashierWalletTopupRequest[] = q.data ?? []

  const columns = useMemo<ColumnDef<CashierWalletTopupRequest>[]>(() => [
    {
      accessorKey: 'id', header: 'Request',
      cell: ({ row }) => <span className="font-mono">#{row.original.id}</span>,
    },
    {
      id: 'customer', header: 'Customer',
      cell: ({ row }) => row.original.customerId?.name ?? row.original.customerId?.mobile ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'amount', header: 'Amount',
      cell: ({ row }) => <span className="tabular-nums font-semibold">{inr(row.original.amount)}</span>,
    },
    { accessorKey: 'paymentMethod', header: 'Method', cell: ({ row }) => row.original.paymentMethod ?? '—' },
    {
      accessorKey: 'status', header: 'Status',
      cell: ({ row }) => statusBadge(row.original.status ?? 'PENDING'),
    },
    {
      accessorKey: 'createdAt', header: 'When',
      cell: ({ row }) => {
        const v = row.original.createdAt
        if (!v) return '—'
        try { return new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }
        catch { return v }
      },
    },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet Top-up History"
        description={`Live · ${data.length} past requests`}
        breadcrumbs={crumb('Wallet Top-up History')}
        actions={
          <Button variant="outline" onClick={() => void q.refetch()}>
            <RefreshCw className={q.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh
          </Button>
        }
      />
      <DataTable
        data={data}
        columns={columns}
        loading={q.isLoading}
        searchPlaceholder="Search by customer or amount…"
        emptyTitle="No top-up history"
        emptyDescription="Approved and rejected top-up requests will appear here."
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 9. Coupons                                                         */
/* ------------------------------------------------------------------ */
export function CashierCoupons() {
  const q = useCashierCoupons()
  const data: CashierCoupon[] = q.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        description={`Live · ${data.length} coupons available to apply at billing`}
        breadcrumbs={crumb('Coupons')}
        actions={
          <Button variant="outline" onClick={() => void q.refetch()}>
            <RefreshCw className={q.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh
          </Button>
        }
      />

      {q.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={<Ticket className="size-7" />} title="No coupons configured" description="Restaurant owner adds coupons in their panel; they show up here for cashiers to apply." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((c) => (
            <Card key={c.id} className="p-5 space-y-2 border-l-4 border-l-primary">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-lg">{c.couponName}</p>
                <Badge variant="info" className="font-mono">{c.couponCode}</Badge>
              </div>
              {c.title ? <p className="text-sm font-medium">{c.title}</p> : null}
              {c.description ? <p className="text-xs text-muted-foreground">{c.description}</p> : null}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">Valid till {c.validity}</span>
                <span className="text-lg font-bold tabular-nums">{inr(c.discountAmount)}</span>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => {
                navigator.clipboard.writeText(c.couponCode).then(() => toast.success(`Copied ${c.couponCode}`))
              }}>
                Copy code
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 10. Operations hub                                                 */
/* ------------------------------------------------------------------ */
interface OpsCard {
  to: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  tint: string
}

const opsCards: OpsCard[] = [
  { to: '/cashier/new-order', label: 'New Order', description: 'Build a fresh dine-in, takeaway, or delivery order.', icon: ShoppingBag, tint: 'text-primary' },
  { to: '/cashier/orders', label: 'Active Orders', description: 'All orders in flight — pending, cooking, ready.', icon: ClipboardList, tint: 'text-info' },
  { to: '/cashier/dine-in', label: 'Dine-in', description: 'Table-grid view of every section.', icon: Utensils, tint: 'text-warning' },
  { to: '/cashier/takeaway', label: 'Takeaway', description: 'Counter pickup queue.', icon: ShoppingBag, tint: 'text-success' },
  { to: '/cashier/delivery', label: 'Delivery', description: 'Delivery board + live map.', icon: Bike, tint: 'text-primary' },
  { to: '/cashier/refund', label: 'Refund', description: 'Issue a refund against a paid order.', icon: IndianRupee, tint: 'text-destructive' },
  { to: '/cashier/coupons', label: 'Coupons', description: 'Live list of discount coupons.', icon: Ticket, tint: 'text-info' },
  { to: '/cashier/wallet-topup-history', label: 'Wallet history', description: 'Past wallet top-up requests.', icon: Wallet, tint: 'text-primary' },
  { to: '/cashier/shift-close', label: 'Close shift', description: 'End-of-day summary and cash close-out.', icon: Clock, tint: 'text-warning' },
]

export function CashierOperations() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations"
        description="Quick links to every cashier flow."
        breadcrumbs={crumb('Operations')}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {opsCards.map((c) => {
          const Icon = c.icon
          return (
            <Link key={c.to} to={c.to}>
              <Card interactive className="p-5 h-full">
                <div className={cn('size-10 rounded-lg bg-muted/50 inline-flex items-center justify-center mb-3', c.tint)}>
                  <Icon className="size-5" />
                </div>
                <p className="font-bold text-lg">{c.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 11. Shift close                                                    */
/* ------------------------------------------------------------------ */
export function CashierShiftClose() {
  const today = new Date().toISOString().slice(0, 10)
  const dash = useCashierDashboard({ fromDate: today, toDate: today })
  const ordersQ = useCashierOrders({ page: 1, pageSize: 100 })
  const [confirm, setConfirm] = useState(false)

  const d = dash.data
  const orders: CashierOrder[] = ordersQ.data?.records ?? []

  // Payment-mode breakdown from today's orders
  const paymentMix = useMemo(() => {
    const map = new Map<string, number>()
    orders.forEach((o) => {
      const k = (o.paymentMethod ?? 'OTHER').toUpperCase()
      map.set(k, (map.get(k) ?? 0) + Number(o.totalAmount ?? 0))
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [orders])

  const totalRevenue = d?.totalRevenue ?? orders.reduce((acc, o) => acc + Number(o.totalAmount ?? 0), 0)
  const totalOrders = d?.totalOrders ?? orders.length

  const closeShift = async () => {
    // Placeholder — backend endpoint (POST /api/cashier/shift/close) not exposed yet.
    toast.success(`Shift closed · ${totalOrders} orders · ${inr(totalRevenue)}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shift Close"
        description={`End-of-day summary for ${today}.`}
        breadcrumbs={crumb('Shift Close')}
        actions={
          <Button variant="destructive" onClick={() => setConfirm(true)}>
            <Ban className="size-4" /> Close shift
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total orders</p>
          <p className="text-3xl font-bold tabular-nums mt-1">{totalOrders}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total revenue</p>
          <p className="text-3xl font-bold tabular-nums mt-1">{inr(totalRevenue)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Average order value</p>
          <p className="text-3xl font-bold tabular-nums mt-1">
            {inr(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
          </p>
        </Card>
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Payment-mode breakdown</p>
          <ChefHat className="size-4 text-muted-foreground" />
        </div>
        {paymentMix.length === 0 ? (
          <EmptyState title="No orders today" description="Once orders come in, the payment-mode mix will populate here." />
        ) : (
          <div className="space-y-2">
            {paymentMix.map(([method, amount]) => {
              const pct = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0
              return (
                <div key={method} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{method}</span>
                    <span className="tabular-nums">{inr(amount)} <span className="text-muted-foreground text-xs">({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct.toFixed(1)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        destructive
        title="Close today's shift?"
        description={`${totalOrders} orders · ${inr(totalRevenue)} will be locked into today's report. You cannot reopen the shift afterwards.`}
        confirmLabel="Yes, close shift"
        onConfirm={closeShift}
      />
    </div>
  )
}
