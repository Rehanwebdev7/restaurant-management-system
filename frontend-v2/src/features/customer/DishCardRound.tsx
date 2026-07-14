/**
 * DishCardRound (v3) — cream-section product card, image floats TOP-RIGHT
 * (per user feedback: "product ka image circular hi rakhna chai lekin top
 * right corner me set karna hai"). Content stacks LEFT-aligned below.
 * Includes matched skeleton export for loading states.
 */

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus, Minus, Star, Heart, Flame, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart, type Dish } from '@/features/customer/catalog'
import { useWishlist } from '@/features/customer/customer-store'
import { useHaptic } from '@/hooks/use-haptic'
import { toast } from '@/lib/toast'
import DishDetailModal from '@/features/customer/DishDetailModal'
import { spiceCount, isNewDish } from '@/features/customer/dish-utils'
import { flyToCart } from '@/features/customer/fly-to-cart'
import { formatPrice } from '@/features/customer/format'
import { handleImageError } from '@/features/customer/image-fallback'

interface Props {
  dish: Dish
}

export default function DishCardRound({ dish }: Props) {
  const { items, setQty } = useCart()
  const wishlist = useWishlist()
  const haptic = useHaptic()
  const reduceMotion = useReducedMotion()
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
    const imgEl = (e.currentTarget as HTMLElement)
      .closest('[data-dish-card]')
      ?.querySelector<HTMLImageElement>('img')
    if (imgEl) flyToCart(imgEl, dish.img)
    toast.success(`${dish.name} added to cart`)
  }
  const inc = (e: React.MouseEvent) => {
    e.stopPropagation()
    haptic.vibrate('light')
    setQty(dish.id, 1)
    const imgEl = (e.currentTarget as HTMLElement)
      .closest('[data-dish-card]')
      ?.querySelector<HTMLImageElement>('img')
    if (imgEl) flyToCart(imgEl, dish.img)
  }
  const dec = (e: React.MouseEvent) => { e.stopPropagation(); haptic.vibrate('light'); setQty(dish.id, -1) }

  return (
    <>
      <motion.article
        data-dish-card
        className="dish-card-round"
        aria-label={dish.name}
        whileHover={reduceMotion ? undefined : { y: -6 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailOpen(true) }
        }}
        role="button"
        tabIndex={0}
      >
        {/* Circular image — absolute top-right, half-overflows the corner */}
        <div className="dish-card-round-image" aria-hidden>
          <img
            src={dish.img}
            alt=""
            loading="lazy"
            decoding="async"
            onError={handleImageError('dish')}
          />
        </div>

        <div className="dish-card-round-body">
          {/* Badge row — Chef's Pick + "New" render inline when applicable.
           * Both are backend-driven (isRecommended flag + createdAt window). */}
          {(dish.signature || isNewDish(dish.createdAt)) ? (
            <div className="dish-card-round-badges">
              {dish.signature ? (
                <span className="dish-card-round-signature" aria-label="Signature dish">
                  Chef's Pick
                </span>
              ) : null}
              {isNewDish(dish.createdAt) ? (
                <span className="dish-card-round-new" aria-label="New dish">
                  NEW
                </span>
              ) : null}
            </div>
          ) : null}

          <h4 className="dish-card-round-name">
            <span
              className={cn(
                'dish-card-round-veg-dot',
                dish.veg ? 'cream-veg-dot' : 'cream-nonveg-dot',
              )}
              aria-hidden
            />
            <span>{dish.name}</span>
          </h4>

          {/* Meta row — rating (gated on real reviewCount, no fake stars),
           * spice meter (backend spiceLevel), prep time (preparationMinutes).
           * Each pill renders only when its backend field is present. */}
          {(dish.reviewCount > 0 || spiceCount(dish.spiceLevel) > 0 || dish.preparationMinutes) ? (
            <div className="dish-card-round-meta">
              {dish.reviewCount > 0 ? (
                <span
                  className="dish-card-round-rating"
                  aria-label={`Rated ${dish.rating.toFixed(1)} out of 5 from ${dish.reviewCount} reviews`}
                >
                  <Star aria-hidden />
                  {dish.rating.toFixed(1)}
                  <span className="dish-card-round-review-count">({dish.reviewCount})</span>
                </span>
              ) : null}
              {spiceCount(dish.spiceLevel) > 0 ? (
                <span
                  className="dish-card-round-spice"
                  aria-label={`Spice level ${dish.spiceLevel}`}
                  title={dish.spiceLevel ?? ''}
                >
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Flame
                      key={i}
                      aria-hidden
                      className={cn(
                        'dish-card-round-spice-chili',
                        i < spiceCount(dish.spiceLevel) && 'dish-card-round-spice-chili--on',
                      )}
                    />
                  ))}
                </span>
              ) : null}
              {dish.preparationMinutes ? (
                <span
                  className="dish-card-round-prep"
                  aria-label={`${dish.preparationMinutes} minutes prep time`}
                >
                  <Clock aria-hidden />
                  {dish.preparationMinutes} min
                </span>
              ) : null}
            </div>
          ) : null}

          {dish.description ? (
            <p className="dish-card-round-desc" title={dish.description}>
              {dish.description}
            </p>
          ) : null}

          {/* Portion price hint — only when backend provides half/quarter
           * prices. Full price stays as the main call-out below. */}
          {(dish.halfPrice || dish.qtrPrice) ? (
            <p className="dish-card-round-portions" aria-label="Portion options">
              {dish.halfPrice ? <span>Half {formatPrice(dish.halfPrice)}</span> : null}
              {dish.halfPrice && dish.qtrPrice ? <span aria-hidden> · </span> : null}
              {dish.qtrPrice ? <span>Qtr {formatPrice(dish.qtrPrice)}</span> : null}
            </p>
          ) : null}

          <p className="dish-card-round-price">{formatPrice(dish.price)}</p>
        </div>

        <div className="dish-card-round-actions">
          {line ? (
            <div className="dish-card-round-qty" role="group" aria-label="Quantity">
              <button type="button" onClick={dec} aria-label="Decrease quantity">
                <Minus className="size-3.5" />
              </button>
              <span className="dish-card-round-qty-value">{line.qty}</span>
              <button type="button" onClick={inc} aria-label="Increase quantity">
                <Plus className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={addToCart}
              className="dish-card-round-buy"
            >
              Buy Now
            </button>
          )}
          <button
            type="button"
            onClick={toggleWishlist}
            aria-label={liked ? `Remove ${dish.name} from wishlist` : `Add ${dish.name} to wishlist`}
            aria-pressed={liked}
            className={cn('dish-card-round-heart', liked && 'dish-card-round-heart--liked')}
          >
            <Heart className="size-4" />
          </button>
        </div>
      </motion.article>

      <DishDetailModal dish={dish} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  )
}

/**
 * DishCardRoundSkeleton — matched-shape loader for DishCardRound.
 * Renders exactly the same layout with shimmering placeholder bars, so the
 * user sees the eventual card structure before data arrives.
 */
export function DishCardRoundSkeleton() {
  return (
    <div className="dish-card-round-skel" aria-hidden="true">
      <div className="dish-card-round-body">
        <div className="dish-card-round-skel-line dish-card-round-skel-line--name" />
        <div className="dish-card-round-skel-line dish-card-round-skel-line--rating" />
        <div className="dish-card-round-skel-line dish-card-round-skel-line--desc" />
        <div className="dish-card-round-skel-line dish-card-round-skel-line--price" />
      </div>
      <div className="dish-card-round-skel-line dish-card-round-skel-line--btn" />
    </div>
  )
}

/**
 * DishCardRoundGridSkeleton — grid of N skeletons for use above the real grid.
 */
export function DishCardRoundGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <DishCardRoundSkeleton key={i} />
      ))}
    </div>
  )
}
