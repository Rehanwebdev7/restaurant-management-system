/**
 * Cashier — Split Bill (2026-06-24).
 *
 * Search an order by orderNumber, then split the bill across multiple
 * "people" using one of three modes:
 *   • EQUAL   — every person pays totalAmount / personCount
 *   • AMOUNT  — type a custom amount per person; running total + remainder
 *   • ITEM    — assign each line item to a person (line items are
 *               synthesised from the order header because the backend
 *               OrderItem schema isn't exposed via /api/cashier/orders/{id}
 *               yet; we render line-item rows derived from subtotal as a
 *               working approximation, with PendingBadge to signal it).
 *
 * "Print individual bills" pre-stages each person's portion into a printable
 * window via window.print after rewriting the body — keeps things working
 * without a backend change.
 */
import { useMemo, useState } from 'react'
import {
  Search, Plus, Trash2, Printer, Users as UsersIcon, Receipt, Split,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import apiClient from '@/api/client'
import { unwrap } from '@/api/normalize'
import { useCashierOrder } from '@/api/queries/cashier'
import type { CashierOrder, PagedResponse } from '@/api/services/cashier'
import { toast } from '@/lib/toast'

const crumb = [
  { label: 'Cashier', href: '/cashier/dashboard' },
  { label: 'Split Bill' },
]

const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const PendingBadge = () => (
  <Badge variant="warning" className="ml-2 align-middle">Sample · backend pending</Badge>
)

type SplitMode = 'EQUAL' | 'AMOUNT' | 'ITEM'

interface Person {
  id: string
  name: string
  /** EQUAL mode is computed; AMOUNT mode stores typed value; ITEM mode is derived. */
  amount: number
}

interface SyntheticLineItem {
  id: string
  name: string
  price: number
  qty: number
  /** personId or null */
  assignedTo: string | null
}

/**
 * Best-effort lookup of an order by orderNumber via the history endpoint.
 * The cashier API supports `?orderNumber=` filtering.
 */
async function findOrderByNumber(orderNumber: string): Promise<CashierOrder | null> {
  if (!orderNumber.trim()) return null
  try {
    const r = await apiClient.get('/api/cashier/orders/history', {
      params: { page: 1, pageSize: 50, orderNumber: orderNumber.trim() },
    })
    const page = unwrap<PagedResponse<CashierOrder>>(r, 'data.data')
    if (page?.records?.length) {
      const exact = page.records.find((o) => o.orderNumber === orderNumber.trim())
      return exact ?? page.records[0] ?? null
    }
    return null
  } catch {
    return null
  }
}

function makePerson(idx: number): Person {
  return { id: `p-${Date.now()}-${idx}`, name: `Person ${idx}`, amount: 0 }
}

function deriveLineItems(order: CashierOrder | null): SyntheticLineItem[] {
  if (!order) return []
  const count = Math.max(1, order.orderItemsCount || 1)
  const each = (Number(order.subtotal) || Number(order.totalAmount) || 0) / count
  return Array.from({ length: count }).map((_, i) => ({
    id: `li-${order.id}-${i}`,
    name: `Item ${i + 1}`,
    price: each,
    qty: 1,
    assignedTo: null,
  }))
}

export default function SplitBill() {
  const [query, setQuery] = useState('')
  const [searchTrigger, setSearchTrigger] = useState('')

  const searchQ = useQuery({
    queryKey: ['cashier', 'split-bill', 'lookup', searchTrigger],
    queryFn: () => findOrderByNumber(searchTrigger),
    enabled: !!searchTrigger,
    staleTime: 60_000,
    retry: false,
  })
  const detailQ = useCashierOrder(searchQ.data?.id ?? null)
  const order = detailQ.data ?? searchQ.data ?? null

  const [mode, setMode] = useState<SplitMode>('EQUAL')
  const [people, setPeople] = useState<Person[]>([makePerson(1), makePerson(2)])
  const [lineItems, setLineItems] = useState<SyntheticLineItem[]>([])

  /* Reset working state when a new order is loaded */
  const orderId = order?.id ?? null
  useMemo(() => {
    setLineItems(deriveLineItems(order))
  }, [orderId, order?.subtotal, order?.totalAmount, order?.orderItemsCount])

  const total = Number(order?.totalAmount ?? 0)
  const handleSearch = () => setSearchTrigger(query.trim())

  const addPerson = () =>
    setPeople((prev) => [...prev, makePerson(prev.length + 1)])

  const removePerson = (id: string) => {
    setPeople((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev))
    setLineItems((prev) => prev.map((li) => (li.assignedTo === id ? { ...li, assignedTo: null } : li)))
  }

  const updatePersonName = (id: string, name: string) =>
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))

  const updatePersonAmount = (id: string, amountStr: string) => {
    const v = Number(amountStr.replace(/[^\d.]/g, '')) || 0
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, amount: v } : p)))
  }

  const assignItem = (lineId: string, personId: string) =>
    setLineItems((prev) =>
      prev.map((li) => (li.id === lineId ? { ...li, assignedTo: personId === '__unassigned' ? null : personId } : li)),
    )

  /* Compute per-person totals based on mode */
  const totals = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {}
    for (const p of people) out[p.id] = 0
    if (!order) return out
    if (mode === 'EQUAL') {
      const each = people.length > 0 ? total / people.length : 0
      for (const p of people) out[p.id] = each
    } else if (mode === 'AMOUNT') {
      for (const p of people) out[p.id] = p.amount
    } else {
      for (const li of lineItems) {
        if (li.assignedTo && out[li.assignedTo] != null) {
          out[li.assignedTo] = (out[li.assignedTo] ?? 0) + li.price * li.qty
        }
      }
    }
    return out
  }, [people, lineItems, mode, total, order])

  const assignedSum = useMemo(
    () => Object.values(totals).reduce((s, n) => s + n, 0),
    [totals],
  )
  const remainder = total - assignedSum
  const balanced = Math.abs(remainder) < 0.01

  const printIndividualBills = () => {
    if (!order) return
    const win = window.open('', '_blank', 'width=720,height=900')
    if (!win) {
      toast.warning('Pop-up blocked — allow pop-ups to print.')
      return
    }
    const escape = (s: string) =>
      s.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))
    const html = `
      <html>
        <head>
          <title>Split bill · ${escape(order.orderNumber)}</title>
          <style>
            body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 24px; color: #111; }
            .bill { page-break-after: always; border-bottom: 1px dashed #999; padding-bottom: 16px; margin-bottom: 16px; }
            .row { display: flex; justify-content: space-between; padding: 4px 0; }
            h1 { font-size: 18px; margin: 0 0 8px; }
            h2 { font-size: 14px; margin: 0 0 4px; color: #555; }
            .total { border-top: 1px solid #000; margin-top: 8px; padding-top: 6px; font-weight: 700; }
          </style>
        </head>
        <body>
          ${people.map((p) => {
            const personTotal = totals[p.id] ?? 0
            const items = lineItems.filter((li) => li.assignedTo === p.id)
            const itemRows = items
              .map((li) => `<div class="row"><span>${escape(li.name)} × ${li.qty}</span><span>₹${li.price.toFixed(2)}</span></div>`)
              .join('')
            return `
              <div class="bill">
                <h1>${escape(p.name)}</h1>
                <h2>Order ${escape(order.orderNumber)} · ${escape(order.orderType)}${order.tableNumber ? ` · Table ${escape(order.tableNumber)}` : ''}</h2>
                ${mode === 'ITEM' ? itemRows : ''}
                <div class="row total"><span>Total</span><span>₹${personTotal.toFixed(2)}</span></div>
              </div>
            `
          }).join('')}
          <script>window.onload = () => window.print()</script>
        </body>
      </html>
    `
    win.document.open()
    win.document.write(html)
    win.document.close()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Split Bill"
        description="Look up an order, split across multiple people, print individual bills."
        breadcrumbs={crumb}
        actions={
          <Button onClick={printIndividualBills} disabled={!order || !balanced}>
            <Printer className="size-4" /> Print individual bills
          </Button>
        }
      />

      {/* Order lookup */}
      <Card>
        <CardHeader>
          <CardTitle>Find order</CardTitle>
          <CardDescription>Enter the order number from the receipt.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="e.g. ORD-2026-001234"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              />
            </div>
            <Button onClick={handleSearch} loading={searchQ.isFetching || detailQ.isFetching}>
              <Search className="size-4" /> Search
            </Button>
          </div>
          {searchTrigger && !searchQ.isLoading && !order ? (
            <p className="text-sm text-destructive mt-3" role="alert">
              No order found for "{searchTrigger}". Try the exact order number from the receipt.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {!order ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<Receipt className="size-7" />}
              title="No order loaded"
              description="Search by order number to begin splitting the bill."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Order summary */}
          <Card>
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <span className="font-mono">{order.orderNumber}</span>
                <Badge variant="outline">{order.orderType}</Badge>
                {order.tableNumber ? <Badge variant="info">Table {order.tableNumber}</Badge> : null}
              </CardTitle>
              <CardDescription>
                {order.customerName ?? 'Walk-in'} · {order.orderItemsCount} items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Summary label="Subtotal" value={Number(order.subtotal)} />
                <Summary label="Tax" value={Number(order.taxAmount)} />
                <Summary label="Discount" value={-Number(order.discountAmount)} />
                <Summary label="Total" value={total} accent />
              </div>
            </CardContent>
          </Card>

          {/* Mode selector */}
          <Card>
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <Split className="size-4" /> Split mode
              </CardTitle>
              <CardDescription>Choose how to divide {inr(total)} across {people.length} people.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <ModeChip active={mode === 'EQUAL'} onClick={() => setMode('EQUAL')} title="Equal split" subtitle={`${inr(total / Math.max(1, people.length))} each`} />
                <ModeChip active={mode === 'AMOUNT'} onClick={() => setMode('AMOUNT')} title="By amount" subtitle="Type a custom amount per person" />
                <ModeChip active={mode === 'ITEM'} onClick={() => setMode('ITEM')} title="By item" subtitle="Assign items per person" />
              </div>
            </CardContent>
          </Card>

          {/* Item assignment table (ITEM mode) */}
          {mode === 'ITEM' ? (
            <Card>
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2">
                  Items <PendingBadge />
                </CardTitle>
                <CardDescription>Backend `/api/cashier/orders/{'{id}'}/items` is not yet exposed — items are inferred from the order header.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {lineItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items to assign.</p>
                ) : lineItems.map((li) => (
                  <div key={li.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center p-3 border border-border rounded-md">
                    <div>
                      <p className="text-sm font-medium">{li.name}</p>
                      <p className="text-xs text-muted-foreground">Qty {li.qty} · {inr(li.price)}</p>
                    </div>
                    <Select value={li.assignedTo ?? '__unassigned'} onValueChange={(v) => assignItem(li.id, v)}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Assign to" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__unassigned">Unassigned</SelectItem>
                        {people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span className="tabular-nums font-semibold text-right sm:w-24">{inr(li.price * li.qty)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {/* People cards */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="inline-flex items-center gap-2"><UsersIcon className="size-4" /> People ({people.length})</CardTitle>
                  <CardDescription>Each person can be renamed; ITEM mode lists their assigned items.</CardDescription>
                </div>
                <Button onClick={addPerson} variant="outline"><Plus className="size-4" /> Add another person</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {people.map((p) => {
                  const personTotal = totals[p.id] ?? 0
                  const items = lineItems.filter((li) => li.assignedTo === p.id)
                  return (
                    <li key={p.id}>
                      <Card>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <Input
                              value={p.name}
                              onChange={(e) => updatePersonName(p.id, e.target.value)}
                              className="font-semibold"
                              aria-label="Person name"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removePerson(p.id)}
                              disabled={people.length <= 1}
                              aria-label="Remove person"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                          {mode === 'AMOUNT' ? (
                            <div className="space-y-1.5">
                              <Label htmlFor={`amt-${p.id}`}>Amount (₹)</Label>
                              <Input
                                id={`amt-${p.id}`}
                                inputMode="decimal"
                                value={p.amount === 0 ? '' : String(p.amount)}
                                onChange={(e) => updatePersonAmount(p.id, e.target.value)}
                              />
                            </div>
                          ) : null}
                          {mode === 'ITEM' ? (
                            <div className="space-y-1">
                              {items.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No items assigned yet.</p>
                              ) : items.map((li) => (
                                <div key={li.id} className="flex items-center justify-between text-xs">
                                  <span className="truncate">{li.name} × {li.qty}</span>
                                  <span className="tabular-nums">{inr(li.price * li.qty)}</span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          <div className="flex items-center justify-between border-t border-border pt-2">
                            <span className="text-xs text-muted-foreground">Their total</span>
                            <span className="font-mono font-bold tabular-nums">{inr(personTotal)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Reconciliation footer */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Assigned · {inr(assignedSum)} of {inr(total)}</p>
                  {balanced ? (
                    <Badge variant="success">Bill balanced</Badge>
                  ) : remainder > 0 ? (
                    <Badge variant="warning">Unassigned: {inr(remainder)}</Badge>
                  ) : (
                    <Badge variant="destructive">Over by {inr(-remainder)}</Badge>
                  )}
                </div>
                <Button onClick={printIndividualBills} disabled={!balanced}>
                  <Printer className="size-4" /> Print individual bills
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function Summary({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`tabular-nums font-mono ${accent ? 'text-lg font-bold' : 'text-sm font-medium'}`}>
        {inr(value)}
      </p>
    </div>
  )
}

function ModeChip({
  active, onClick, title, subtitle,
}: { active: boolean; onClick: () => void; title: string; subtitle: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-md border p-3 transition-colors ${active ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'}`}
      aria-pressed={active}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </button>
  )
}
