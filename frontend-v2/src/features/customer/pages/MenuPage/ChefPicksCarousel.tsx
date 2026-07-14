import { useMemo, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useCustomerCatalog, type Dish } from '@/features/customer/catalog'
import { formatPrice } from '@/features/customer/format'
import { handleImageError } from '@/features/customer/image-fallback'

/**
 * ChefPicksCarousel — horizontal editorial strip highlighting the tenant's
 * `isRecommended` dishes. Only renders when at least 3 signature dishes
 * exist so the strip actually reads as a curated selection, not a padded
 * catalog dump.
 *
 * SaaS-safe: everything backend-driven. Fixed content is limited to
 * hospitality copy ("Straight from the Chef") — no per-tenant lie.
 */

export default function ChefPicksCarousel() {
  const catalog = useCustomerCatalog()
  const reduce = useReducedMotion()
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const picks: Dish[] = useMemo(() => {
    if (!catalog.dishes) return []
    return catalog.dishes.filter((d) => d.signature).slice(0, 12)
  }, [catalog.dishes])

  if (picks.length < 3) return null

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="flex items-end justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="subtitle inline-flex items-center gap-2 mb-2"
          >
            <Sparkles className="size-3.5" aria-hidden />
            STRAIGHT FROM THE CHEF
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="display text-2xl sm:text-3xl lg:text-4xl leading-tight"
          >
            The <span>Signatures</span>
          </motion.h2>
        </div>

        {/* Nav arrows — desktop only, hidden on touch */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollBy(-360)}
            className="c-picks-arrow"
            aria-label="Previous"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(360)}
            className="c-picks-arrow"
            aria-label="Next"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Horizontal scroller — scroll-snap on each card */}
      <div
        ref={scrollerRef}
        className="c-picks-scroller flex gap-4 sm:gap-5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {picks.map((dish, i) => (
          <motion.article
            key={dish.id}
            initial={{ opacity: 0, y: 32, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
              duration: 0.6,
              delay: (i % 4) * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={reduce ? undefined : { y: -6 }}
            className="c-picks-card group shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className="relative overflow-hidden rounded-2xl aspect-[3/4]">
              <img
                src={dish.img}
                alt={dish.name}
                loading="lazy"
                decoding="async"
                onError={handleImageError('dish')}
                className="w-full h-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
              />
              {/* Gradient overlay — bottom fade for text legibility */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.95) 100%)',
                }}
              />
              {/* Chef's Pick chip */}
              <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.22em] shadow-md"
                style={{
                  background: 'var(--c-accent, #C9A96E)',
                  color: 'var(--c-button-primary-fg, #0A0A0A)',
                }}
              >
                <Sparkles className="size-3 fill-current" aria-hidden />
                Chef's Pick
              </div>

              {/* Rating if present */}
              {dish.reviewCount > 0 ? (
                <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 px-2.5 py-1 text-white text-[10px] font-bold">
                  <Star className="size-3 fill-current" aria-hidden />
                  {dish.rating.toFixed(1)}
                </div>
              ) : null}

              {/* Text block bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] opacity-80 mb-1">
                  {dish.categoryName ?? 'Signature'}
                </p>
                <h3 className="display text-lg sm:text-xl leading-tight mb-2 text-white">
                  {dish.name}
                </h3>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--c-accent, #C9A96E)' }}>
                    {formatPrice(dish.price)}
                  </span>
                  {dish.preparationMinutes ? (
                    <span className="text-[10px] opacity-80">
                      {dish.preparationMinutes} min
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
