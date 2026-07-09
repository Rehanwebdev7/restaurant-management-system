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
import { Plus, Minus, Sparkles, Star, Heart, Flame, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart, type Dish } from '@/features/customer/catalog'
import { useWishlist } from '@/features/customer/customer-store'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useHaptic } from '@/hooks/use-haptic'
import { toast } from '@/lib/toast'
import DishDetailModal from '@/features/customer/DishDetailModal'
import { spiceCount, isNewDish } from '@/features/customer/dish-utils'
import { handleImageError } from '@/features/customer/image-fallback'

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
        className="backdrop-blur-lg bg-neutral-900/35 border border-white/10 rounded-2xl overflow-hidden group relative flex flex-col cursor-pointer transition-all duration-500 hover:border-[--c-accent]/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-[var(--c-shadow-primary-sm)]"
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
            onError={handleImageError('dish')}
            className="w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08] group-hover:brightness-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />

          {/* Badge column — Chef's Pick + NEW stack vertically on top-left.
           * Both backend-driven (isRecommended + createdAt < 14 days). */}
          <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1 z-10">
            {dish.signature ? (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-[--c-accent] text-black px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest shadow-lg"
                aria-label="Signature dish"
              >
                <Sparkles className="size-3 text-black fill-current" aria-hidden />
                <span>Chef's Choice</span>
              </span>
            ) : null}
            {isNewDish(dish.createdAt) ? (
              <span
                className="inline-flex items-center rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest shadow-md"
                aria-label="New dish"
              >
                NEW
              </span>
            ) : null}
          </div>

          {/* Wishlist heart — small circle, top-right */}
          <button
            type="button"
            onClick={toggleWishlist}
            aria-label={liked ? `Remove ${dish.name} from wishlist` : `Add ${dish.name} to wishlist`}
            aria-pressed={liked}
            className="absolute top-2.5 right-2.5 size-8.5 rounded-full backdrop-blur-md bg-black/45 border border-white/20 flex items-center justify-center hover:bg-black/65 hover:scale-105 active:scale-95 transition-all"
          >
            <Heart
              className={cn(
                'size-4 text-white transition-all',
                liked && 'fill-[--c-accent] text-[--c-accent]',
              )}
            />
          </button>
        </div>

        {/* Body — same layout, sizes scale with breakpoint */}
        <div className="p-3.5 lg:p-4.5 flex flex-col gap-1.5 lg:gap-2 flex-1">
          {/* Name + rating row — rating pill shown only when reviewCount > 0
           * to avoid falsely inflating fresh, unrated items with a system default. */}
          <div className="flex items-start justify-between gap-2.5">
            <h4 className="font-semibold leading-tight truncate flex items-center gap-2 text-sm lg:text-base min-w-0 font-sans tracking-wide">
              <span
                className={cn(
                  'inline-block size-2 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-neutral-900',
                  dish.veg
                    ? 'bg-[#4caf50] ring-[#4caf50]'
                    : 'bg-[#d32f2f] ring-[#d32f2f]',
                )}
                aria-hidden
              />
              <span className="truncate group-hover:text-[--c-accent] transition-colors">{dish.name}</span>
            </h4>
            {dish.reviewCount > 0 ? (
              <div
                className="flex items-center gap-1 bg-[--c-accent]/10 border border-[--c-accent]/20 px-2 py-0.5 rounded-md text-[9px] font-bold text-[--c-accent] shrink-0"
                aria-label={`Rated ${dish.rating.toFixed(1)} of 5 from ${dish.reviewCount} reviews`}
              >
                <Star className="size-3 fill-current text-[--c-accent]" aria-hidden />
                <span>{dish.rating.toFixed(1)}</span>
                <span className="opacity-70 font-medium">({dish.reviewCount})</span>
              </div>
            ) : null}
          </div>

          {/* Meta row — spice meter + prep time. Both backend-driven,
           * each pill renders only when its field is present. */}
          {(spiceCount(dish.spiceLevel) > 0 || dish.preparationMinutes) ? (
            <div className="flex items-center gap-3 text-[10px] text-[--c-text-soft]">
              {spiceCount(dish.spiceLevel) > 0 ? (
                <span
                  className="inline-flex items-center"
                  aria-label={`Spice level ${dish.spiceLevel}`}
                  title={dish.spiceLevel ?? ''}
                >
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Flame
                      key={i}
                      aria-hidden
                      className={cn(
                        'size-3',
                        i < spiceCount(dish.spiceLevel)
                          ? 'text-orange-500 fill-orange-500'
                          : 'text-orange-500/25',
                      )}
                    />
                  ))}
                </span>
              ) : null}
              {dish.preparationMinutes ? (
                <span
                  className="inline-flex items-center gap-1 font-semibold"
                  aria-label={`${dish.preparationMinutes} minutes prep time`}
                >
                  <Clock className="size-3" aria-hidden />
                  <span>{dish.preparationMinutes} min</span>
                </span>
              ) : null}
            </div>
          ) : null}

          {/* 1-line description always visible */}
          <p className="text-xs text-[--c-text-soft] line-clamp-2 min-h-[32px] leading-relaxed">
            {dish.description}
          </p>

          {/* Portion hint — only when backend provides half / quarter prices */}
          {(dish.halfPrice || dish.qtrPrice) ? (
            <p className="text-[10px] font-semibold text-[--c-text-soft] flex gap-1.5">
              {dish.halfPrice ? <span>Half ${dish.halfPrice}</span> : null}
              {dish.halfPrice && dish.qtrPrice ? <span aria-hidden>·</span> : null}
              {dish.qtrPrice ? <span>Qtr ${dish.qtrPrice}</span> : null}
            </p>
          ) : null}

          {/* Price + Button row */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-2.5 border-t border-white/5">
            <p className="display text-lg lg:text-xl leading-none font-bold gold-text shrink-0">
              ${dish.price}
            </p>

            {line ? (
              <div className="flex items-center border border-[--c-accent]/40 bg-[--c-accent]/5 rounded-full overflow-hidden shrink-0 p-0.5">
                <button
                  type="button"
                  onClick={dec}
                  aria-label="Decrease quantity"
                  className="p-1 hover:bg-[--c-accent]/15 rounded-full transition-colors text-[--c-accent]"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-6 text-center font-mono font-bold tabular-nums text-xs text-white">
                  {line.qty}
                </span>
                <button
                  type="button"
                  onClick={inc}
                  aria-label="Increase quantity"
                  className="p-1 hover:bg-[--c-accent]/15 rounded-full transition-colors text-[--c-accent]"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={addToCart}
                className="bg-[--c-accent] text-black border-none hover:bg-white font-extrabold text-[10px] tracking-widest px-4 py-2 rounded-full transition-all duration-300 shadow-md shadow-[--c-accent]/10 hover:shadow-[--c-accent]/25 scale-100 hover:scale-105 active:scale-95 uppercase shrink-0"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </motion.article>

      <DishDetailModal dish={dish} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  )
}
