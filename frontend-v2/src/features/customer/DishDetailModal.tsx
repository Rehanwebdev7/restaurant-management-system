/**
 * Premium DishDetailModal — a luxe full-screen detail view for a single dish.
 *
 * - Left: large image (mobile: top)
 * - Right: name (Cormorant 4xl) + description + ingredients + allergens
 *   + quantity stepper + Add to cart + Add to wishlist
 *
 * Respects `prefers-reduced-motion` (framer-motion handles automatically when
 * we keep transitions short and the `MotionConfig` parent doesn't override).
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Minus, Plus, Sparkles, X, ShoppingBag } from 'lucide-react'
import { useCart, type Dish } from '@/features/customer/catalog'
import { useWishlist } from '@/features/customer/customer-store'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useBodyScrollLock } from '@/lib/useBodyScrollLock'

/* Sample static metadata — in real life this would come from `Dish` itself. */
const INGREDIENTS: Record<string, string[]> = {
  default: ['Chef-selected spices', 'Farm-fresh produce', 'House marinade', 'Slow-cooked technique'],
}

const ALLERGENS: Record<string, string[]> = {
  default: ['Dairy', 'Gluten', 'Tree nuts (may contain)'],
}

interface Props {
  dish: Dish | null
  open: boolean
  onClose: () => void
}

export default function DishDetailModal({ dish, open, onClose }: Props) {
  const cart = useCart()
  const wishlist = useWishlist()
  const [qty, setQty] = useState(1)

  // Reset qty when a new dish opens
  useEffect(() => {
    if (open) setQty(1)
  }, [open, dish?.id])

  // Lock body scroll while open via shared reference-counted hook so
  // multiple stacked modals don't fight over `prev`.
  useBodyScrollLock(open)

  // ESC to close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!dish) return null
  const liked = wishlist.has(dish.id)
  const ingredients = INGREDIENTS.default ?? []
  const allergens = ALLERGENS.default ?? []

  const addToCart = () => {
    cart.add(dish.id, qty)
    toast.success(`${qty}× ${dish.name} added to cart`)
    onClose()
  }

  // CRITICAL: portal to document.body so the modal escapes any ancestor
  // that has `transform`, `filter`, or `will-change` set on it. DishCard
  // uses `motion.article whileHover={{ y: -4 }}` which creates a containing
  // block for `position: fixed` descendants — without this portal the
  // modal renders inside the ~250px grid cell instead of the viewport.
  if (typeof document === 'undefined') return null
  const modal = (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="customer-shell fixed inset-0 z-[80] flex items-center justify-center p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${dish.name} details`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="relative z-[2] w-full sm:max-w-5xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto c-card grid grid-cols-1 md:grid-cols-2 gap-0 shadow-2xl"
            initial={{ scale: 0.96, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 24, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 size-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 grid place-items-center hover:bg-black/80 transition-colors"
            >
              <X className="size-5 text-white" />
            </button>

            {/* Image side */}
            <div className="relative aspect-[4/5] md:aspect-auto md:h-full overflow-hidden">
              <img src={dish.img} alt={dish.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent md:hidden" />
              {dish.signature ? (
                <span className="c-tag absolute top-4 left-4 inline-flex items-center gap-1">
                  <Sparkles className="size-3" /> Signature
                </span>
              ) : null}
            </div>

            {/* Detail side */}
            <div className="p-6 sm:p-8 flex flex-col gap-5">
              <div>
                <p className="subtitle text-[10px]">{dish.category}</p>
                <h2 className="display text-3xl sm:text-4xl mt-1">
                  <span className={dish.veg ? 'veg-icon' : 'nonveg-icon'} />{dish.name}
                </h2>
                <p className="display text-3xl gold-text mt-2">₹{dish.price}</p>
              </div>

              <p className="text-sm text-[--c-text-soft] leading-relaxed">{dish.description}</p>

              <div>
                <p className="subtitle text-[10px] mb-2">INGREDIENTS</p>
                <div className="c-divider !ml-0 !my-2" />
                <ul className="grid grid-cols-2 gap-1.5 text-xs text-[--c-text-soft]">
                  {ingredients.map((i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="size-1.5 rounded-full bg-[--c-accent] mt-1.5 shrink-0" /> {i}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="subtitle text-[10px] mb-2">ALLERGENS</p>
                <div className="c-divider !ml-0 !my-2" />
                <div className="flex flex-wrap gap-1.5">
                  {allergens.map((a) => (
                    <span key={a} className="text-[10px] px-2 py-1 rounded border border-[--c-border] text-[--c-text-muted]">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="dish-modal-sticky-cta mt-auto pt-4 border-t border-[--c-border] space-y-3">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-[--c-text-muted] uppercase tracking-wider">Quantity</p>
                  <div className="inline-flex items-center gap-1 border border-[--c-accent] rounded">
                    <button
                      type="button"
                      className="px-3 py-1.5 hover:bg-[--c-bg-elev-2] transition-colors"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="text-sm font-mono tabular-nums w-7 text-center">{qty}</span>
                    <button
                      type="button"
                      className="px-3 py-1.5 hover:bg-[--c-bg-elev-2] transition-colors"
                      onClick={() => setQty((q) => Math.min(20, q + 1))}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <p className="ml-auto display text-2xl gold-text">₹{(dish.price * qty).toLocaleString('en-IN')}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addToCart}
                    className="c-button-primary flex-1 inline-flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="size-4" /> ADD TO CART
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      wishlist.toggle(dish.id)
                      toast.info(liked ? `${dish.name} removed from wishlist` : `${dish.name} added to wishlist`)
                    }}
                    aria-pressed={liked}
                    aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
                    className={cn(
                      'size-12 rounded border border-[--c-accent] grid place-items-center transition-colors',
                      liked ? 'bg-[--c-accent] text-[--c-button-primary-fg]' : 'hover:bg-[--c-bg-elev-2] gold-text'
                    )}
                  >
                    <Heart className={cn('size-5', liked && 'fill-current')} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
  return createPortal(modal, document.body)
}
