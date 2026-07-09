import { Suspense, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ChevronRight, Lock, Home, Briefcase, Plus, AlertTriangle } from 'lucide-react'
import CustomerLayout from '@/features/customer/CustomerLayout'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { DocumentTitle } from '@/lib/seo/document-title'
import { tokens } from '@/lib/auth/tokens'
import {
  fetchCustomerAddresses,
  addCustomerAddress,
} from '@/api/services/customer'
import {
  DISHES, useCart, writeCart, useCustomerCatalog,
  enqueueOrder, readOrdersQueue, useSelectedBranchId, type QueuedOrder
} from '@/features/customer/catalog'
import {
  enqueueOrder as enqueueOfflineApiOrder,
  useOfflineQueueStatus
} from '@/lib/offline-queue'
import { usePlaceCustomerOrder } from '@/api/queries/customer'
import { StripePaymentElement } from '@/components/ui/stripe-payment-element'
import { PayPalCheckoutButton } from '@/components/ui/paypal-checkout-button'
import '@/styles/customer.css'

type PaymentMethod = 'card' | 'paypal' | 'cod'
type OrderType = 'DELIVERY' | 'TAKEAWAY'

interface Address {
  id: number
  label: 'Home' | 'Work' | 'Other'
  line1: string
  line2?: string
  city: string
  pincode: string
  phone: string
  primary?: boolean
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items } = useCart()
  const catalog = useCustomerCatalog()
  const { branchId } = useSelectedBranchId()
  const placeOrder = usePlaceCustomerOrder()
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY')
  const offlineStatus = useOfflineQueueStatus()

  // Auth check
  const customerToken = typeof window !== 'undefined' ? tokens.getCustomer() : null
  const isSignedIn = Boolean(customerToken)

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)

  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // New address form state
  const [newAddress, setNewAddress] = useState({
    label: 'Home' as 'Home' | 'Work' | 'Other',
    line1: '',
    line2: '',
    city: 'Mumbai',
    pincode: '',
    phone: '',
  })

  // Load addresses when signed in
  useEffect(() => {
    if (!isSignedIn) return

    let local: Address[] = []
    try {
      const raw = localStorage.getItem('customer_addresses_v2')
      if (raw) local = JSON.parse(raw)
    } catch {}

    setAddresses(local)
    if (local.length > 0) {
      const primary = local.find((a) => a.primary) ?? local[0]
      setSelectedAddressId(primary ? primary.id : null)
    }


    fetchCustomerAddresses()
      .then((res) => {
        if (res.ok && res.data) {
          const mapped = res.data.map((a: any, idx: number) => ({
            id: a.id ?? Date.now() + idx,
            label: (a.addressType?.toLowerCase().includes('work')
              ? 'Work'
              : a.addressType?.toLowerCase().includes('home')
              ? 'Home'
              : 'Other') as any,
            line1: a.addressLine1 ?? '',
            line2: a.addressLine2 ?? '',
            city: a.city ?? 'Mumbai',
            pincode: a.pincode ?? '',
            phone: localStorage.getItem('UserMobile') ?? '',
            primary: !!a.isDefault,
          }))
          setAddresses(mapped)
          if (mapped.length > 0) {
            const primary = mapped.find((a: any) => a.primary) ?? mapped[0]
            setSelectedAddressId(primary?.id ?? null)
            localStorage.setItem('customer_addresses_v2', JSON.stringify(mapped))
          }
        }
      })
      .catch(() => {})
  }, [isSignedIn])

  const total = useMemo(() => {
    const subtotal = items.reduce((acc, l) => {
      const d = catalog.dishes.find((x) => x.id === l.id) ?? DISHES.find((x) => x.id === l.id)
      return d ? acc + d.price * l.qty : acc
    }, 0)
    const gst = Math.round(subtotal * 0.05)
    return subtotal + gst
  }, [items, catalog.dishes])

  const stripeClientSecret = '' // Stripe server client secret fallback

  const handleAddAddress = async () => {
    if (!newAddress.line1.trim() || !newAddress.pincode.trim() || !/^\d{6}$/.test(newAddress.pincode)) {
      toast.warning('Please enter valid address details and a 6-digit pincode')
      return
    }

    const item: Address = {
      id: Date.now(),
      label: newAddress.label,
      line1: newAddress.line1,
      line2: newAddress.line2,
      city: newAddress.city,
      pincode: newAddress.pincode,
      phone: newAddress.phone || localStorage.getItem('UserMobile') || '',
      primary: addresses.length === 0,
    }

    const updated = [...addresses, item]
    setAddresses(updated)
    setSelectedAddressId(item.id)
    localStorage.setItem('customer_addresses_v2', JSON.stringify(updated))
    setShowAddForm(false)
    toast.success('Address added successfully')

    if (navigator.onLine) {
      try {
        await addCustomerAddress({
          addressType: item.label.toUpperCase(),
          addressLine1: item.line1,
          addressLine2: item.line2 ?? '',
          city: item.city,
          pincode: item.pincode,
          isDefault: item.primary,
          deliveryInstructions: item.phone,
        })
      } catch {}
    }
  }

  const persistAndFinish = async (paymentMethod: PaymentMethod, msg: string) => {
    // Address validation for Delivery
    if (orderType === 'DELIVERY' && !selectedAddressId) {
      toast.warning('Please select or add a delivery address.')
      return
    }

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId)
    const formattedInstructions = selectedAddr
      ? `Deliver to ${selectedAddr.label}: ${selectedAddr.line1}, ${selectedAddr.line2 ? selectedAddr.line2 + ', ' : ''}${selectedAddr.city} - ${selectedAddr.pincode}. Phone: ${selectedAddr.phone}`
      : 'Pickup from Branch'

    const lineDetails = items
      .map((l) => {
        const d = catalog.dishes.find((x) => x.id === l.id) ?? DISHES.find((x) => x.id === l.id)
        return d ? { dishId: d.id, name: d.name, price: d.price, qty: l.qty, img: d.img } : null
      })
      .filter((v): v is QueuedOrder['items'][number] => v !== null)
      
    const localOrder: QueuedOrder = {
      id: `KOT-${Date.now().toString().slice(-6)}`,
      placedAt: new Date().toISOString(),
      branchId,
      items: lineDetails,
      total,
      paymentMethod,
      status: 'queued',
    }
    enqueueOrder(localOrder)

    const userName = (typeof window !== 'undefined' ? localStorage.getItem('UserName') : null) ?? 'Guest'
    const userMobile = (typeof window !== 'undefined' ? localStorage.getItem('UserMobile') : null) ?? ''
    const apiMethod: 'STRIPE' | 'PAYPAL' | 'CASH' =
      paymentMethod === 'card' ? 'STRIPE' : paymentMethod === 'paypal' ? 'PAYPAL' : 'CASH'
      
    const apiPayload = {
      branchId,
      orderType: orderType,
      items: lineDetails.map((l) => ({ menuItemId: l.dishId, quantity: l.qty })),
      customerName: userName,
      customerPhone: userMobile,
      paymentMethod: apiMethod,
      deliveryInstructions: orderType === 'DELIVERY' ? formattedInstructions : 'Takeaway Order',
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      try {
        await enqueueOfflineApiOrder({
          clientId: localOrder.id,
          submittedAt: localOrder.placedAt,
          payload: apiPayload,
        })
        toast.info(`${msg} — saved offline · will sync when online`)
      } catch {
        toast.warning(`${msg} — saved locally · offline queue unavailable`)
      }
      writeCart([])
      navigate('/orders')
      return
    }

    try {
      const result = await placeOrder.mutateAsync(apiPayload)
      if (result.ok) {
        const queue = readOrdersQueue()
        const updated = queue.map((q) =>
          q.id === localOrder.id ? { ...q, status: 'synced' as const, serverOrderId: result.data.orderId } : q,
        )
        if (typeof window !== 'undefined') {
          localStorage.setItem('customer_orders_queue', JSON.stringify(updated))
        }
        toast.success(`${msg} — synced #${result.data.orderId}`)
      } else {
        toast.info(`${msg} — saved locally · backend pending`)
      }
    } catch {
      toast.info(`${msg} — saved locally · backend pending`)
    }
    writeCart([])
    navigate('/orders')
  }

  const finishOrder = (msg: string) => {
    void persistAndFinish(method, msg)
  }

  // Redirect to login if not signed in
  if (!isSignedIn) {
    return (
      <CustomerLayout>
        <DocumentTitle title="Checkout — Spice Garden" />
        <section className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="backdrop-blur-xl bg-neutral-900/40 border border-white/10 p-8 rounded-2xl shadow-xl flex flex-col items-center">
            <div className="size-16 rounded-full bg-[--c-accent]/15 flex items-center justify-center mb-6">
              <Lock className="size-8 text-[--c-accent]" />
            </div>
            <h2 className="display text-2xl mb-2">Sign In Required</h2>
            <p className="text-sm text-[--c-text-soft] mb-6 max-w-sm">
              Please sign in to complete your checkout. This enables secure payments, automatic address synchronization, and live order tracking.
            </p>
            <button
              className="c-button-primary w-full rounded-full cursor-pointer py-3"
              onClick={() => {
                ;(window as any).shouldRedirectToCheckoutAfterLogin = true
                window.dispatchEvent(new CustomEvent('trigger-customer-login'))
              }}
            >
              SIGN IN TO CONTINUE
            </button>
          </div>
        </section>
      </CustomerLayout>
    )
  }

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <DocumentTitle title="Checkout — Spice Garden" />
        <section className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="c-card p-8 rounded-2xl bg-[--c-bg-elev]">
            <h2 className="display text-2xl mb-2">Cart is Empty</h2>
            <p className="text-sm text-[--c-text-soft] mb-6">You need items in your cart to proceed to checkout.</p>
            <button className="c-button-primary rounded-full cursor-pointer" onClick={() => navigate('/menu')}>
              EXPLORE MENU
            </button>
          </div>
        </section>
      </CustomerLayout>
    )
  }

  const selectedAddr = addresses.find((a) => a.id === selectedAddressId)
  const isPlaceDisabled = orderType === 'DELIVERY' && !selectedAddressId

  return (
    <CustomerLayout>
      <DocumentTitle title="Checkout — Spice Garden" />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="subtitle">FINAL STEP</p>
        <div className="c-divider !ml-0" />
        <h1 className="display text-3xl sm:text-4xl mb-8">Checkout</h1>

        {/* Offline / Sync Banner */}
        {!offlineStatus.online || offlineStatus.pending > 0 ? (
          <div
            role="status"
            aria-live="polite"
            className="p-4 mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 flex items-center gap-3"
          >
            <span className="bg-amber-500 text-black font-bold text-[9px] px-1.5 py-0.5 rounded tracking-wider uppercase">
              {offlineStatus.online ? 'Syncing' : 'Offline'}
            </span>
            <span className="text-sm font-medium">
              {offlineStatus.online
                ? `${offlineStatus.pending} pending order${offlineStatus.pending === 1 ? '' : 's'} syncing to cloud…`
                : 'Device is offline. Your order will be stored locally and synced automatically when online.'}
            </span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Type Selector */}
            <div className="bg-neutral-900/35 border border-white/10 rounded-2xl p-1.5 flex gap-2">
              <button
                type="button"
                className={cn(
                  'flex-1 py-3 text-xs font-bold tracking-widest uppercase rounded-xl transition-all cursor-pointer',
                  orderType === 'DELIVERY'
                    ? 'bg-[--c-accent] text-black shadow-md'
                    : 'text-[--c-text-soft] hover:text-white hover:bg-white/5'
                )}
                onClick={() => setOrderType('DELIVERY')}
              >
                Doorstep Delivery
              </button>
              <button
                type="button"
                className={cn(
                  'flex-1 py-3 text-xs font-bold tracking-widest uppercase rounded-xl transition-all cursor-pointer',
                  orderType === 'TAKEAWAY'
                    ? 'bg-[--c-accent] text-black shadow-md'
                    : 'text-[--c-text-soft] hover:text-white hover:bg-white/5'
                )}
                onClick={() => setOrderType('TAKEAWAY')}
              >
                Self Takeaway
              </button>
            </div>

            {/* Destination / Address Block */}
            {orderType === 'DELIVERY' ? (
              <div className="backdrop-blur-lg bg-neutral-900/25 border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-white">Delivery Destination</h3>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(true)}
                      className="text-xs text-[--c-accent] font-bold hover:underline cursor-pointer"
                    >
                      Change Address
                    </button>
                  )}
                </div>

                {selectedAddr ? (
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-950/40 border border-white/5">
                    <div className="p-2.5 rounded-lg bg-[--c-accent]/10 text-[--c-accent] shrink-0">
                      {selectedAddr.label === 'Home' ? <Home className="size-5" /> : selectedAddr.label === 'Work' ? <Briefcase className="size-5" /> : <MapPin className="size-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                        {selectedAddr.label}
                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[--c-text-muted]">Selected</span>
                      </h4>
                      <p className="text-xs text-[--c-text-soft] mt-1 font-medium leading-relaxed">
                        {selectedAddr.line1}{selectedAddr.line2 ? `, ${selectedAddr.line2}` : ''}
                      </p>
                      <p className="text-xs text-[--c-text-muted] mt-0.5 font-mono">
                        {selectedAddr.city} · {selectedAddr.pincode}
                      </p>
                      <p className="text-xs text-[--c-text-soft] mt-1.5 font-medium">
                        Mobile: {selectedAddr.phone}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 border border-dashed border-white/10 rounded-xl bg-neutral-950/20 text-center space-y-3">
                    <AlertTriangle className="size-8 mx-auto text-amber-500" />
                    <p className="text-xs text-[--c-text-soft]">No delivery addresses registered. Add one below to continue.</p>
                  </div>
                )}

                {/* Add Address Form Toggle Button */}
                {!showAddForm ? (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="w-full py-3 border border-dashed border-white/10 hover:border-[--c-accent]/50 hover:bg-white/5 rounded-xl text-xs font-bold tracking-widest text-[--c-text-soft] hover:text-white uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="size-4" /> Add Delivery Address
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-950/30 border border-white/5 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-white">Add Delivery Destination</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <span className="text-[10px] font-bold text-[--c-text-muted] uppercase tracking-wider">Address Label</span>
                        <div className="flex gap-2 mt-1">
                          {(['Home', 'Work', 'Other'] as const).map((lbl) => (
                            <button
                              key={lbl}
                              type="button"
                              onClick={() => setNewAddress({ ...newAddress, label: lbl })}
                              className={cn(
                                'flex-1 py-1.5 text-[10px] font-bold tracking-wider uppercase rounded-lg border transition-all cursor-pointer',
                                newAddress.label === lbl
                                  ? 'bg-[--c-accent] text-black border-[--c-accent]'
                                  : 'bg-neutral-900/35 border-white/10 text-[--c-text-soft]'
                              )}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <input
                          className="c-input text-xs"
                          placeholder="Flat, House No., Building, Area"
                          value={newAddress.line1}
                          onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          className="c-input text-xs"
                          placeholder="Road, Landmark, Colony (Optional)"
                          value={newAddress.line2}
                          onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                        />
                      </div>
                      <div>
                        <input
                          className="c-input text-xs"
                          placeholder="6-digit pincode"
                          maxLength={6}
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '') })}
                        />
                      </div>
                      <div>
                        <input
                          className="c-input text-xs"
                          placeholder="Contact phone (10-digit)"
                          maxLength={10}
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, '') })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 py-2 text-xs font-bold rounded-lg border border-white/10 hover:bg-white/5 text-[--c-text-soft] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddAddress}
                        className="flex-1 py-2 text-xs font-bold rounded-lg bg-[--c-accent] text-black shadow-md cursor-pointer"
                      >
                        Save & Select
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="backdrop-blur-lg bg-neutral-900/25 border border-white/10 rounded-2xl p-6 space-y-4 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-[--c-accent]/10 text-[--c-accent] shrink-0">
                  <MapPin className="size-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-white">Self Pickup Point</h3>
                  <p className="text-xs text-[--c-text-soft] mt-2 font-semibold">Spice Garden Steakhouse (Main Branch)</p>
                  <p className="text-xs text-[--c-text-muted] mt-1 leading-relaxed">
                    Opposite Bandra Fort, Land's End, Bandra West, Mumbai - 400050
                  </p>
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-2.5 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 inline-block">
                    Ready in 25-30 mins
                  </p>
                </div>
              </div>
            )}

            {/* Address Selection Modal / Drawer */}
            <AnimatePresence>
              {showAddressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowAddressModal(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md bg-neutral-950 border border-white/10 p-6 rounded-2xl shadow-xl z-10 max-h-[80vh] overflow-y-auto"
                  >
                    <h3 className="font-bold text-sm uppercase tracking-wider text-white mb-4">Choose Shipping Address</h3>
                    <ul className="space-y-3">
                      {addresses.map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAddressId(a.id)
                              setShowAddressModal(false)
                              toast.info(`Switched to ${a.label}`)
                            }}
                            className={cn(
                              'w-full text-left p-4 rounded-xl border flex items-start gap-3.5 transition-all cursor-pointer',
                              selectedAddressId === a.id
                                ? 'border-[--c-accent] bg-[--c-accent]/5'
                                : 'border-white/5 bg-neutral-900/25 hover:border-white/20'
                            )}
                          >
                            <div className={cn(
                              'p-2 rounded-lg shrink-0',
                              selectedAddressId === a.id ? 'bg-[--c-accent]/15 text-[--c-accent]' : 'bg-white/5 text-[--c-text-soft]'
                            )}>
                              {a.label === 'Home' ? <Home className="size-4.5" /> : a.label === 'Work' ? <Briefcase className="size-4.5" /> : <MapPin className="size-4.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs text-white uppercase tracking-wider">{a.label}</h4>
                              <p className="text-xs text-[--c-text-soft] mt-1 font-medium truncate">{a.line1}</p>
                              <p className="text-[10px] text-[--c-text-muted] font-mono mt-0.5">{a.city} - {a.pincode}</p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(false)}
                      className="w-full mt-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-[--c-text-soft] hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                    >
                      Close Window
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Payment Selector */}
            <div className="c-card p-5 rounded-2xl bg-[--c-bg-elev] border border-[--c-border] space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-white">Select Payment Method</h3>
              <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-1 gap-2.5">
                {(
                  [
                    { id: 'card', label: 'Credit / Debit Card', desc: 'Secure payment via Stripe' },
                    { id: 'paypal', label: 'PayPal Gateway', desc: 'Express check out with PayPal account' },
                    { id: 'cod', label: 'Cash on Delivery', desc: 'Pay with cash at your doorstep' },
                  ] satisfies { id: PaymentMethod; label: string; desc: string }[]
                ).map((opt) => (
                  <label
                    key={opt.id}
                    className={cn(
                      'flex items-center justify-between p-4 cursor-pointer rounded-xl border transition-all duration-300 min-h-[56px]',
                      method === opt.id
                        ? 'border-[--c-accent] bg-[--c-border]/10 shadow-[var(--c-shadow-primary-sm)]'
                        : 'border-[--c-border] hover:bg-[--c-bg-elev-2]'
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{opt.label}</span>
                      <span className="text-xs text-[--c-text-muted] mt-0.5">{opt.desc}</span>
                    </div>
                    <input
                      type="radio"
                      name="pay"
                      value={opt.id}
                      checked={method === opt.id}
                      onChange={() => setMethod(opt.id)}
                      className="accent-[--c-accent] size-4.5 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Sub-Blocks Stripe / PayPal / COD */}
            <div className="overflow-hidden">
              {isPlaceDisabled && (
                <div className="p-4 mb-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 flex items-center gap-2.5 text-xs font-semibold">
                  <AlertTriangle className="size-4 shrink-0 text-red-400" />
                  <span>Please save and select a delivery destination address to place your order.</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {method === 'card' && (
                  <motion.div
                    key="stripe"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Suspense fallback={<div className="h-20 animate-pulse bg-[--c-border] rounded-xl" />}>
                      <StripePaymentElement
                        clientSecret={stripeClientSecret}
                        amount={total}
                        currency="INR"
                        onSuccess={(pi) => finishOrder(`Order placed · ${pi.id}`)}
                        onError={(msg) => toast.error(msg)}
                      />
                    </Suspense>
                  </motion.div>
                )}

                {method === 'paypal' && (
                  <motion.div
                    key="paypal"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="c-card p-5 rounded-2xl bg-[--c-bg-elev] border border-[--c-border]"
                  >
                    <Suspense fallback={<div className="h-12 animate-pulse bg-[--c-border] rounded-xl" />}>
                      <PayPalCheckoutButton
                        amount={total}
                        currency="INR"
                        onSuccess={(orderId) => finishOrder(`Order placed · PayPal ${orderId}`)}
                        onError={(msg) => toast.error(msg)}
                        disabled={total <= 0 || isPlaceDisabled}
                      />
                    </Suspense>
                  </motion.div>
                )}

                {method === 'cod' && (
                  <motion.div
                    key="cod"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      className={cn(
                        'w-full py-4 rounded-xl font-bold tracking-wider transition-all inline-flex items-center justify-center gap-2 uppercase',
                        isPlaceDisabled
                          ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
                          : 'c-button-primary hover:shadow-[var(--c-shadow-primary)] cursor-pointer'
                      )}
                      disabled={isPlaceDisabled}
                      onClick={() => finishOrder('Order placed · ETA 28 minutes')}
                    >
                      PLACE ORDER · CASH ON DELIVERY
                      <ChevronRight className="size-4.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Pricing Summary Sidebar */}
          <div className="space-y-4">
            <div className="c-card p-5 rounded-2xl bg-[--c-bg-elev] border border-[--c-border] space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-white">Order Summary</h3>
              <div className="divide-y divide-[--c-border] max-h-48 overflow-y-auto pr-1">
                {items.map((item) => {
                  const d = catalog.dishes.find((x) => x.id === item.id) ?? DISHES.find((x) => x.id === item.id)
                  if (!d) return null
                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs font-medium">
                      <div className="truncate pr-4 flex-1">
                        <span className="text-[--c-text] font-semibold">{item.qty}x</span> {d.name}
                      </div>
                      <span className="font-mono text-[--c-text-soft] shrink-0">₹{(d.price * item.qty).toLocaleString('en-IN')}</span>
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-[--c-border] pt-3.5 space-y-2.5 text-xs font-semibold text-[--c-text-soft]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{items.reduce((acc, l) => {
                    const d = catalog.dishes.find((x) => x.id === l.id) ?? DISHES.find((x) => x.id === l.id)
                    return d ? acc + d.price * l.qty : acc
                  }, 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax & GST (5%)</span>
                  <span className="font-mono">₹{Math.round(items.reduce((acc, l) => {
                    const d = catalog.dishes.find((x) => x.id === l.id) ?? DISHES.find((x) => x.id === l.id)
                    return d ? acc + d.price * l.qty : acc
                  }, 0) * 0.05).toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-[--c-border] pt-3 flex justify-between text-sm font-bold text-[--c-text]">
                  <span>Total Amount</span>
                  <span className="font-mono gold-text text-base">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-[--c-text-muted] font-medium justify-center pt-2">
                <Lock className="size-3" />
                <span>SSL Encrypted Payments</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </CustomerLayout>
  )
}
