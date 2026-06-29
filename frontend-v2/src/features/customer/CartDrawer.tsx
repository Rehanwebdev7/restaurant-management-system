/**
 * Cart side-drawer — invoked from the cart icon in CustomerLayout.
 *
 * Desktop: slides from the right (≥ sm breakpoint).
 * Mobile: docks at the bottom as a sheet.
 *
 * The `/cart` route still renders the full-page CartPage; this drawer is the
 * "quick view" alternative.
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion, type Transition } from 'framer-motion'
import { ShoppingBag, X, Plus, Minus, ChevronRight, Trash2 } from 'lucide-react'
import { DISHES, useCart, type Dish } from '@/features/customer/catalog'
import { useHaptic } from '@/hooks/use-haptic'
import { toast } from '@/lib/toast'
import { useBodyScrollLock } from '@/lib/useBodyScrollLock'

/**
 * Spring physics tuned for a tactile drawer feel: settles in ~280 ms with a
 * tiny natural overshoot. Tween fallback for `prefers-reduced-motion`.
 */
const drawerSpring: Transition = { type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }
const reducedTransition: Transition = { duration: 0 }

interface Props {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: Props) {
  const navigate = useNavigate()
  const { items, setQty } = useCart()
  const reduceMotion = useReducedMotion()
  const slideTransition = reduceMotion ? reducedTransition : drawerSpring

  // ESC to close — body scroll lock handled by shared hook below.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useBodyScrollLock(open)

  const lines = items
    .map((l) => {
      const d = DISHES.find((x) => x.id === l.id)
      if (!d) return null
      return { ...d, qty: l.qty, subtotal: d.price * l.qty }
    })
    .filter((x): x is Dish & { qty: number; subtotal: number } => x !== null)

  const subtotal = lines.reduce((a, l) => a + l.subtotal, 0)
  const gst = Math.round(subtotal * 0.05)
  const total = subtotal + gst

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="cart-drawer"
          className="fixed inset-0 z-[65]"
          role="dialog"
          aria-label="Cart"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
          {/* Desktop right-rail */}
          <motion.aside
            className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] c-card border-l p-0 overflow-hidden flex-col hidden sm:flex"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={slideTransition}
          >
            <CartContents
              lines={lines}
              subtotal={subtotal}
              gst={gst}
              total={total}
              setQty={setQty}
              onClose={onClose}
              onCheckout={() => {
                onClose()
                navigate('/checkout')
              }}
              onViewFull={() => {
                onClose()
                navigate('/cart')
              }}
            />
          </motion.aside>
          {/* Mobile bottom sheet — supports swipe-down-to-dismiss */}
          <motion.aside
            className="absolute left-0 right-0 bottom-0 c-card border-t p-0 overflow-hidden flex flex-col sm:hidden rounded-t-2xl"
            style={{ maxHeight: '85vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={slideTransition}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose()
            }}
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[--c-border] cursor-grab active:cursor-grabbing" aria-hidden="true" />
            <CartContents
              lines={lines}
              subtotal={subtotal}
              gst={gst}
              total={total}
              setQty={setQty}
              onClose={onClose}
              onCheckout={() => {
                onClose()
                navigate('/checkout')
              }}
              onViewFull={() => {
                onClose()
                navigate('/cart')
              }}
            />
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

interface ContentsProps {
  lines: (Dish & { qty: number; subtotal: number })[]
  subtotal: number
  gst: number
  total: number
  setQty: (id: number, delta: number) => void
  onClose: () => void
  onCheckout: () => void
  onViewFull: () => void
}

function CartContents({
  lines, subtotal, gst, total, setQty, onClose, onCheckout, onViewFull,
}: ContentsProps) {
  const haptic = useHaptic()
  return (
    <>
      <div className="flex items-center justify-between p-5 border-b border-[--c-border]">
        <div>
          <p className="subtitle text-[10px]">YOUR ORDER</p>
          <h3 className="display text-2xl">Cart</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-[--c-bg-elev-2]"
          aria-label="Close cart"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {lines.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="size-12 mx-auto mb-4 opacity-30" />
            <p className="font-semibold mb-1">Your cart is empty</p>
            <p className="text-xs text-[--c-text-muted] mb-5">
              Add a dish from the menu to get started.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {lines.map((l) => (
              <li
                key={l.id}
                className="flex items-center gap-3 p-2 rounded border border-[--c-border]"
              >
                <img src={l.img} alt={l.name} loading="lazy" decoding="async" className="size-16 rounded object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    <span className={l.veg ? 'veg-icon' : 'nonveg-icon'} />
                    {l.name}
                  </p>
                  <p className="text-[11px] text-[--c-text-muted]">
                    ₹{l.price} × {l.qty}
                  </p>
                </div>
                <div className="flex items-center gap-1 border border-[--c-accent] rounded">
                  <button
                    className="px-2 py-1"
                    onClick={() => { haptic.vibrate(l.qty === 1 ? 'heavy' : 'light'); setQty(l.id, -1) }}
                    aria-label={`Decrease ${l.name}`}
                  >
                    {l.qty === 1 ? <Trash2 className="size-3" /> : <Minus className="size-3" />}
                  </button>
                  <span className="text-sm font-mono tabular-nums w-5 text-center">{l.qty}</span>
                  <button
                    className="px-2 py-1"
                    onClick={() => { haptic.vibrate('light'); setQty(l.id, 1) }}
                    aria-label={`Increase ${l.name}`}
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {lines.length > 0 ? (
        <div className="p-5 border-t border-[--c-border] space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[--c-text-soft]">Subtotal</span>
            <span className="tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[--c-text-soft]">GST 5%</span>
            <span className="tabular-nums">₹{gst.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[--c-border]">
            <span className="font-semibold">Total</span>
            <span className="display text-2xl gold-text">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
          <button
            className="c-button-primary w-full inline-flex items-center justify-center gap-2 mt-3"
            onClick={onCheckout}
          >
            CHECKOUT <ChevronRight className="size-4" />
          </button>
          <button
            className="w-full text-xs text-[--c-text-muted] hover:gold-text transition-colors py-1"
            onClick={() => {
              toast.info('Opened full cart view')
              onViewFull()
            }}
          >
            Open full cart
          </button>
        </div>
      ) : null}
    </>
  )
}
