import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Minus, ShoppingCart, Trash2, IndianRupee, Utensils, Bike, ShoppingBag,
  Search, Receipt, CreditCard, Loader2,
} from 'lucide-react'
// UI-F-65: HID barcode scanner integration — uncomment to wire up.
// import { useBarcodeScanner } from '@/hooks/use-barcode-scanner'
// import { printReceipt } from '@/lib/pos-printer'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Wizard, WizardStep } from '@/components/ui/wizard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useCashierMenu, useCashierMenuCategories, useCashierTables, useCreateCashierOrder, menuItemPrice,
} from '@/api/queries/cashier'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type OrderType = 'DINING' | 'TAKEAWAY' | 'DELIVERY'

interface CartLine { itemId: number; qty: number }

export default function NewOrder() {
  const navigate = useNavigate()
  const itemsQ = useCashierMenu()
  const catsQ = useCashierMenuCategories()
  const tablesQ = useCashierTables()
  const createMut = useCreateCashierOrder()

  const items = itemsQ.data ?? []
  const cats = catsQ.data ?? []
  const tables = tablesQ.data ?? []

  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [orderType, setOrderType] = useState<OrderType>('DINING')
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'WALLET'>('CASH')
  const [notes, setNotes] = useState('')

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((m) => {
      if (!m.isAvailable) return false
      if (categoryId !== null && m.categoryId?.id !== categoryId) return false
      if (!q) return true
      return m.name.toLowerCase().includes(q)
    })
  }, [items, categoryId, search])

  // UI-F-65: HID barcode scanner wiring. Uncomment to enable — looks up
  // the scanned code against the menu (by sku / barcode column on the
  // backend) and pushes a line into the cart.
  //
  // useBarcodeScanner({
  //   onBarcode: (code) => {
  //     const match = items.find((m) => m.sku === code || m.barcode === code)
  //     if (!match) {
  //       toast.warning(`No menu item for code ${code}`)
  //       return
  //     }
  //     setQty(match.id, 1)
  //     toast.success(`Added ${match.name} (scanned)`)
  //   },
  //   // Disable on screens where a search box is focused-by-default.
  //   enabled: true,
  // })
  //
  // After payment posts, use printReceipt(receiptHtml) to push to the
  // 80mm thermal roll. Today routes through window.print(); WebUSB path
  // ships in the hardware phase.

  const setQty = (id: number, delta: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.itemId === id)
      if (idx === -1) {
        if (delta <= 0) return prev
        return [...prev, { itemId: id, qty: delta }]
      }
      const next = [...prev]
      const current = (next[idx]?.qty ?? 0) + delta
      if (current <= 0) next.splice(idx, 1)
      else next[idx] = { itemId: id, qty: current }
      return next
    })
  }

  const cartDetails = useMemo(
    () =>
      cart
        .map((l) => {
          const item = items.find((i) => i.id === l.itemId)
          if (!item) return null
          const price = menuItemPrice(item)
          return { id: item.id, name: item.name, price, qty: l.qty, subtotal: price * l.qty }
        })
        .filter((x): x is { id: number; name: string; price: number; qty: number; subtotal: number } => x !== null),
    [cart, items]
  )

  const subtotal = cartDetails.reduce((a, l) => a + l.subtotal, 0)
  const gstRate = 0.05
  const gst = Math.round(subtotal * gstRate)
  const total = subtotal + gst

  const placeOrder = async () => {
    if (cartDetails.length === 0) {
      toast.warning('Cart is empty')
      return
    }
    if (orderType === 'DINING' && !tableNumber.trim()) {
      toast.warning('Pick a table number for dine-in')
      return
    }
    const res = await createMut.mutateAsync({
      orderType,
      paymentMethod,
      items: cart.map((l) => ({ menuItemId: l.itemId, quantity: l.qty })),
      ...(orderType === 'DINING' ? { tableNumber: tableNumber.trim() } : {}),
      ...(orderType !== 'DINING' && customerName ? { customerName: customerName.trim() } : {}),
      ...(orderType !== 'DINING' && customerPhone ? { customerPhone: customerPhone } : {}),
      ...(notes ? { specialInstructions: notes } : {}),
    })
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success(`Order placed · ₹${total.toLocaleString('en-IN')}`)
    setCart([])
    navigate('/cashier/orders')
  }

  const TypeButton = ({ k, label, Icon }: { k: OrderType; label: string; Icon: typeof Utensils }) => (
    <button
      onClick={() => setOrderType(k)}
      className={cn(
        'flex flex-col items-center gap-1.5 p-3 rounded-md border transition-all duration-quick ease-entrance active:scale-[0.97]',
        orderType === k ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'
      )}
    >
      <Icon className="size-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )

  const loading = itemsQ.isLoading || catsQ.isLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Order"
        description={`Live menu from backend · ${items.length} items available`}
        breadcrumbs={[{ label: 'Cashier', href: '/cashier/dashboard' }, { label: 'New Order' }]}
      />

      <Wizard onComplete={placeOrder} submitLabel={createMut.isPending ? 'Placing…' : 'Place order'}>
        {/* Step 1: items */}
        <WizardStep title="Items" description="Add menu items to the cart.">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardContent className="pt-6 space-y-4">
                <div className="relative">
                  <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input placeholder="Search menu…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setCategoryId(null)}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-quick ease-entrance active:scale-[0.97]',
                      categoryId === null ? 'bg-primary text-primary-foreground shadow-elevation-1' : 'bg-muted text-muted-foreground hover:bg-accent')}
                  >All</button>
                  {cats.map((c) => (
                    <button key={c.id} onClick={() => setCategoryId(c.id)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-quick ease-entrance active:scale-[0.97]',
                        categoryId === c.id ? 'bg-primary text-primary-foreground shadow-elevation-1' : 'bg-muted text-muted-foreground hover:bg-accent')}>
                      {c.name}
                    </button>
                  ))}
                </div>
                {loading ? (
                  <ul className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => <li key={i} className="skeleton-shimmer h-14 rounded-md" />)}
                  </ul>
                ) : filteredItems.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">No items in this category.</div>
                ) : (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto themed-scrollbar pr-1">
                    {filteredItems.map((m) => {
                      const line = cart.find((l) => l.itemId === m.id)
                      const price = menuItemPrice(m)
                      return (
                        <li key={m.id}>
                          <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-card hover:border-primary/40 transition-all duration-quick">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate">{m.name}</p>
                              <p className="text-xs text-muted-foreground">{cats.find((c) => c.id === m.categoryId?.id)?.name ?? '—'}</p>
                            </div>
                            <p className="text-sm font-semibold tabular-nums">₹{price}</p>
                            {line ? (
                              <div className="flex items-center gap-1">
                                <Button size="xs" variant="outline" onClick={() => setQty(m.id, -1)}><Minus className="size-3" /></Button>
                                <span className="text-sm font-mono tabular-nums w-6 text-center">{line.qty}</span>
                                <Button size="xs" variant="outline" onClick={() => setQty(m.id, 1)}><Plus className="size-3" /></Button>
                              </div>
                            ) : (
                              <Button size="xs" onClick={() => setQty(m.id, 1)}><Plus className="size-3" /> Add</Button>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <CartCard cartDetails={cartDetails} subtotal={subtotal} gst={gst} total={total}
              onRemove={(id) => setCart((p) => p.filter((l) => l.itemId !== id))} onQty={setQty} />
          </div>
        </WizardStep>

        {/* Step 2: customer / table */}
        <WizardStep title="Customer" description="Order type, table or customer details.">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <TypeButton k="DINING" label="Dine-in" Icon={Utensils} />
                <TypeButton k="TAKEAWAY" label="Takeaway" Icon={ShoppingBag} />
                <TypeButton k="DELIVERY" label="Delivery" Icon={Bike} />
              </div>

              {orderType === 'DINING' ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="table">Table</label>
                  <Select value={tableNumber} onValueChange={setTableNumber}>
                    <SelectTrigger><SelectValue placeholder="Pick a table" /></SelectTrigger>
                    <SelectContent>
                      {tables.length === 0 ? (
                        <SelectItem value="__none" disabled>No tables loaded</SelectItem>
                      ) : (
                        tables.map((t) => (
                          <SelectItem key={t.id} value={String(t.tableNumber ?? t.name ?? t.id)}>
                            {t.tableNumber ?? t.name ?? `Table ${t.id}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="cname">Customer name</label>
                    <Input id="cname" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="cphone">Mobile</label>
                    <Input id="cphone" inputMode="numeric" maxLength={10} value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="notes">Special instructions (optional)</label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Less spicy" />
              </div>
            </CardContent>
          </Card>
        </WizardStep>

        {/* Step 3: payment + summary */}
        <WizardStep title="Payment" description="Review totals and pick a payment mode.">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm font-semibold">Items in this order</p>
                <ul className="divide-y divide-border">
                  {cartDetails.length === 0 ? (
                    <li className="py-4 text-sm text-muted-foreground">No items added.</li>
                  ) : (
                    cartDetails.map((l) => (
                      <li key={l.id} className="py-2 flex items-center justify-between">
                        <span className="text-sm">{l.qty} × {l.name}</span>
                        <span className="text-sm tabular-nums font-medium">₹{l.subtotal.toLocaleString('en-IN')}</span>
                      </li>
                    ))
                  )}
                </ul>
                <Separator />
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">GST (5%)</span><span className="tabular-nums">₹{gst.toLocaleString('en-IN')}</span></div>
                  <div className="flex items-center justify-between text-lg font-bold pt-2 border-t border-border"><span>Total</span><span className="tabular-nums">₹{total.toLocaleString('en-IN')}</span></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm font-semibold">Payment mode</p>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'CASH' | 'CARD' | 'UPI' | 'WALLET')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="WALLET">Wallet</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="info" className="gap-1">
                  {createMut.isPending ? <Loader2 className="size-3 animate-spin" /> : <CreditCard className="size-3" />}
                  POSTs to /api/cashier/orders/add
                </Badge>
              </CardContent>
            </Card>
          </div>
        </WizardStep>
      </Wizard>
    </div>
  )
}

function CartCard({
  cartDetails, subtotal, gst, total, onRemove, onQty,
}: {
  cartDetails: { id: number; name: string; price: number; qty: number; subtotal: number }[]
  subtotal: number; gst: number; total: number
  onRemove: (id: number) => void; onQty: (id: number, delta: number) => void
}) {
  return (
    <Card className="sticky top-0">
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-4 text-primary" />
          <p className="text-sm font-semibold">Cart</p>
          <Badge variant="secondary" className="ml-auto">{cartDetails.reduce((a, l) => a + l.qty, 0)} items</Badge>
        </div>
        {cartDetails.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No items yet.</p>
        ) : (
          <ul className="divide-y divide-border max-h-[40vh] overflow-y-auto themed-scrollbar">
            {cartDetails.map((l) => (
              <li key={l.id} className="py-2.5 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.qty} × ₹{l.price}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="xs" variant="ghost" onClick={() => onQty(l.id, -1)}><Minus className="size-3" /></Button>
                  <Button size="xs" variant="ghost" onClick={() => onQty(l.id, 1)}><Plus className="size-3" /></Button>
                  <Button size="xs" variant="ghost" onClick={() => onRemove(l.id)} aria-label="Remove"><Trash2 className="size-3 text-destructive" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Separator />
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span></div>
          <div className="flex items-center justify-between"><span className="text-muted-foreground">GST 5%</span><span className="tabular-nums">₹{gst.toLocaleString('en-IN')}</span></div>
          <div className="flex items-center justify-between pt-2 border-t border-border font-bold">
            <span className="inline-flex items-center gap-1"><Receipt className="size-4" /> Total</span>
            <span className="text-lg tabular-nums"><IndianRupee className="size-3 inline -mt-1" />{total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
