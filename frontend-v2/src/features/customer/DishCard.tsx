/**
 * DishCard — a single, unified dish tile used by HomePage, MenuPage, and
 * SignaturePage at every breakpoint.
 *
 * Senior design decision: ONE visual identity, only sizes scale.
 *  - 4:3 image at all breakpoints (no aspect swap)
 *  - Veg/non-veg dot inline before the name
 *  - Description (1-line truncate) always visible
 *  - Rating pill always visible
 *  - Price in Cormorant Garamond gold
 *  - Outlined-gold pill "+ ADD" button (compact text)
 *  - Wishlist heart (absolute, top-right)
 *  - Signature badge (absolute, top-left)
 *  - Click body opens DishDetailModal; button clicks add to cart / step qty
 *
 * Mobile/desktop differ only in font sizes and padding via Tailwind classes.
 * No `lg:hidden` / `hidden lg:block` variant duplication.
 */

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus, Minus, Sparkles, Star, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart, type Dish } from '@/features/customer/catalog'
import { useWishlist } from '@/features/customer/customer-store'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useHaptic } from '@/hooks/use-haptic'
import { toast } from '@/lib/toast'
import DishDetailModal from '@/features/customer/DishDetailModal'

interface Props {
  dish: Dish
}

export default function DishCard({ dish }: Props) {
  const { items, setQty } = useCart()
  const wishlist = useWishlist()
  const haptic = useHaptic()
  const reduceMotion = useReducedMotion()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [detailOpen, setDetailOpen] = useState(false)

  const line = items.find((l) => l.id === dish.id)
  const liked = wishlist.has(dish.id)

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation()
    haptic.vibrate('light')
    wishlist.toggle(dish.id)
    toast.info(liked ? `${dish.name} removed from wishlist` : `${dish.name} added to wishlist`)
  }

  const addToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    haptic.vibrate('light')
    setQty(dish.id, 1)
    toast.success(`${dish.name} added to cart`)
  }

  const inc = (e: React.MouseEvent) => {
    e.stopPropagation()
    haptic.vibrate('light')
    setQty(dish.id, 1)
  }
  const dec = (e: React.MouseEvent) => {
    e.stopPropagation()
    haptic.vibrate('light')
    setQty(dish.id, -1)
  }

  const openDetail = () => setDetailOpen(true)
  const onKeyOpen = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openDetail()
    }
  }

  // Hover lift on desktop; tap squish on touch. Skip both when reduced motion.
  const hover = !reduceMotion && isDesktop
    ? { y: -4, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } }
    : undefined
  const tap = !reduceMotion ? { scale: 0.97 } : undefined

  return (
    <>
      <motion.article
        className="c-card overflow-hidden group relative flex flex-col cursor-pointer"
        aria-label={dish.name}
        whileHover={hover}
        whileTap={tap}
        onClick={openDetail}
        onKeyDown={onKeyOpen}
        role="button"
        tabIndex={0}
      >
        {/* Media — uniform 4:3 across all breakpoints */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={dish.img}
            alt={dish.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
          />

          {/* Signature badge — small gold pill, top-left */}
          {dish.signature ? (
            <span
              className="absolute top-1.5 left-1.5 lg:top-2 lg:left-2 inline-flex items-center gap-1 rounded-full bg-[--c-accent] text-[--c-button-primary-fg] px-1.5 py-0.5 lg:px-2 lg:py-1 text-[9px] lg:text-[10px] font-semibold uppercase tracking-wider shadow-md"
              aria-label="Signature dish"
            >
              <Sparkles className="size-2.5 lg:size-3" aria-hidden />
              <span className="hidden sm:inline">Signature</span>
            </span>
          ) : null}

          {/* Wishlist heart — small circle, top-right */}
          <button
            type="button"
            onClick={toggleWishlist}
            aria-label={liked ? `Remove ${dish.name} from wishlist` : `Add ${dish.name} to wishlist`}
            aria-pressed={liked}
            className="absolute top-1.5 right-1.5 lg:top-2 lg:right-2 size-7 lg:size-8 rounded-full backdrop-blur-md bg-black/45 border border-white/20 flex items-center justify-center hover:bg-black/65 transition-colors"
          >
            <Heart
              className={cn(
                'size-3.5 lg:size-4 text-white transition-colors',
                liked && 'fill-[--c-accent] text-[--c-accent]',
              )}
            />
          </button>
        </div>

        {/* Body — same layout, sizes scale with breakpoint */}
        <div className="p-2.5 lg:p-3.5 flex flex-col gap-1 lg:gap-1.5 flex-1">
          {/* Name + rating row */}
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-tight truncate flex items-center gap-1.5 text-sm lg:text-base min-w-0">
              <span
                className={cn(
                  'inline-block size-2 shrink-0',
                  dish.veg
                    ? 'bg-[#4caf50] border border-[#4caf50] rounded-[1px]'
                    : 'bg-[#d32f2f] border border-[#d32f2f] rounded-full',
                )}
                aria-hidden
              />
              <span className="truncate">{dish.name}</span>
            </p>
            <span className="inline-flex items-center gap-0.5 text-[10px] lg:text-xs font-semibold gold-text shrink-0 leading-none pt-0.5">
              <Star className="size-3 fill-current" /> {dish.rating}
            </span>
          </div>

          {/* Description — always visible, 1-line truncate */}
          <p className="text-[10px] lg:text-xs text-[--c-text-muted] truncate">
            {dish.description}
          </p>

          {/* Price + Add/Stepper row — uniform style */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-1.5 lg:pt-2">
            <p className="font-[Cormorant_Garamond,Georgia,serif] font-bold gold-text text-lg lg:text-xl leading-none tabular-nums">
              ₹{dish.price}
            </p>

            {line ? (
              <div
                className="inline-flex items-center border border-[--c-accent] rounded-full overflow-hidden h-7 lg:h-8"
                role="group"
                aria-label="Quantity"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={dec}
                  aria-label={`Decrease ${dish.name}`}
                  className="px-2 h-full inline-flex items-center justify-center hover:bg-[--c-bg-elev-2] transition-colors text-[--c-accent]"
                >
                  <Minus className="size-3" />
                </button>
                <span className="text-[10px] lg:text-xs font-mono tabular-nums min-w-[20px] text-center text-[--c-accent] font-semibold">
                  {line.qty}
                </span>
                <button
                  type="button"
                  onClick={inc}
                  aria-label={`Increase ${dish.name}`}
                  className="px-2 h-full inline-flex items-center justify-center hover:bg-[--c-bg-elev-2] transition-colors text-[--c-accent]"
                >
                  <Plus className="size-3 add-plus" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={addToCart}
                aria-label={`Add ${dish.name} to cart`}
                className="c-button-outline !py-1 !px-2.5 lg:!px-3 inline-flex items-center gap-1 !text-[10px] lg:!text-xs h-7 lg:h-8"
              >
                <Plus className="size-3 add-plus" /> ADD
              </button>
            )}
          </div>
        </div>
      </motion.article>

      <DishDetailModal dish={dish} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  )
}
