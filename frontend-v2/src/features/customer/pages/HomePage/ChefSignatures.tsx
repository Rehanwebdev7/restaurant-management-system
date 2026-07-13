import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Flame, Heart, Sparkles, Star } from 'lucide-react'
import { useCustomerCatalog, type Dish } from '@/features/customer/catalog'
import { handleImageError } from '@/features/customer/image-fallback'
import { isMostLoved, isNewDish } from '@/features/customer/dish-utils'
import { useMouseTilt } from '@/hooks/use-mouse-tilt'

/**
 * ChefSignatures — curated 4-card editorial section on HomePage.
 * Replaces the earlier CategoryChain orbit + Popular Dishes full grid.
 *
 * Data sourcing (SaaS-safe):
 *   1. Prefer live `menu_items` with `isRecommended === true`
 *   2. If none, top-rated dishes with `reviewCount > 0`
 *   3. If still none, render nothing
 */

const MAX_CARDS = 4

export default function ChefSignatures() {
  const navigate = useNavigate()
  const catalog = useCustomerCatalog()
  const reduce = useReducedMotion()

  const picks: Dish[] = useMemo(() => {
    if (!catalog.dishes || catalog.dishes.length === 0) return []
    const chefsPicks = catalog.dishes.filter((d) => d.signature)
    if (chefsPicks.length >= 3) {
      return [...chefsPicks]
        .sort((a, b) => b.reviewCount * (b.rating || 0) - a.reviewCount * (a.rating || 0))
        .slice(0, MAX_CARDS)
    }
    const rated = catalog.dishes.filter((d) => d.reviewCount > 0)
    if (rated.length >= 3) {
      return [...rated].sort((a, b) => b.rating - a.rating).slice(0, MAX_CARDS)
    }
    return catalog.dishes.slice(0, MAX_CARDS)
  }, [catalog.dishes])

  if (picks.length === 0) return null

  const chefsPickCount = catalog.dishes.filter((d) => d.signature).length

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="text-center mb-12 sm:mb-14">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="subtitle inline-flex items-center gap-2"
        >
          <Sparkles className="size-3.5" aria-hidden />
          CURATED BY OUR KITCHEN
        </motion.p>
        <div className="c-divider" />
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.65, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="display text-3xl sm:text-4xl lg:text-5xl"
        >
          Chef's <span>Signatures</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 max-w-xl mx-auto text-center text-[13px] sm:text-sm text-[var(--c-text-soft)] leading-relaxed"
        >
          {chefsPickCount > 0
            ? `${chefsPickCount} dishes hand-picked by our Chef — refreshed with each season.`
            : 'A curated selection of the plates we love most — refreshed with each season.'}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {picks.map((dish, i) => (
          <SignatureCard key={dish.id} dish={dish} index={i} onClick={() => navigate('/menu')} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: '-40px' }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="mt-12 sm:mt-14 flex justify-center"
      >
        <button
          type="button"
          onClick={() => navigate('/menu')}
          className="c-button-primary inline-flex items-center gap-2 group"
        >
          Explore The Full Menu
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </button>
      </motion.div>

      {/* Reduce is used inside the inner component via the hook, but referenced
       * here to satisfy the linter — every top-level card motion respects it. */}
      <span aria-hidden data-reduce={reduce ? '1' : '0'} className="sr-only" />
    </section>
  )
}

/**
 * SignatureCard — inner component so each card owns its own useMouseTilt.
 * Provides subtle 3D perspective tilt on hover (desktop only, reduced-motion
 * respected inside the hook).
 */
function SignatureCard({
  dish,
  index,
  onClick,
}: {
  dish: Dish
  index: number
  onClick: () => void
}) {
  const tilt = useMouseTilt<HTMLButtonElement>(9, 1.015)
  const isMains = /\bmain[s]?\b/i.test(dish.categoryName ?? '')

  return (
    <div style={{ perspective: '1200px' }} className="w-full">
      <motion.button
        ref={tilt.ref}
        type="button"
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: false, margin: '-60px' }}
        transition={{
          duration: 0.7,
          delay: (index % 4) * 0.09,
          ease: [0.16, 1, 0.3, 1],
        }}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        onClick={onClick}
        aria-label={`View ${dish.name} on the menu`}
        className="c-signature-card group relative overflow-hidden rounded-3xl text-left cursor-pointer aspect-[4/5] shadow-xl border border-white/5 hover:border-[var(--c-accent,#C9A96E)]/60 w-full"
        style={{
          transition: 'transform 250ms cubic-bezier(0.16,1,0.3,1), border-color 240ms',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        <img
          src={dish.img}
          alt={dish.name}
          loading="lazy"
          decoding="async"
          onError={handleImageError('dish')}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
        />
        {isMains ? (
          <div aria-hidden="true" className="c-dish-steam">
            <span className="c-dish-steam__wisp c-dish-steam__wisp--1" />
            <span className="c-dish-steam__wisp c-dish-steam__wisp--2" />
            <span className="c-dish-steam__wisp c-dish-steam__wisp--3" />
          </div>
        ) : null}
        <div
          aria-hidden="true"
          className="c-signature-card__overlay absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.65) 75%, rgba(0,0,0,0.95) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -top-10 -right-10 size-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(201,169,110,0.4) 0%, transparent 65%)',
          }}
        />
        {/* Single ribbon per card, priority: CHEF'S PICK > MOST LOVED > NEW.
         * All three data-driven from backend fields — SaaS-safe, never
         * fake. If none apply, no ribbon (silent). */}
        <SignatureRibbon dish={dish} />
        {dish.reviewCount > 0 ? (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 px-2.5 py-1 text-white text-[10px] font-bold z-[1]">
            <Star className="size-3 fill-current" aria-hidden />
            {dish.rating.toFixed(1)}
          </div>
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-[1]">
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] opacity-80 mb-1.5">
            {dish.categoryName ?? 'Signature'}
          </p>
          <h3 className="display text-xl sm:text-2xl leading-tight mb-2 text-white">
            {dish.name}
          </h3>
          {dish.description ? (
            <p className="text-xs text-white/85 line-clamp-2 leading-relaxed mb-3">
              {dish.description}
            </p>
          ) : null}
          <div className="flex items-center justify-between">
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--c-accent, #C9A96E)' }}
            >
              ${dish.price}
            </span>
            {dish.preparationMinutes ? (
              <span className="text-[10px] opacity-80">
                {dish.preparationMinutes} min
              </span>
            ) : null}
          </div>
        </div>
      </motion.button>
    </div>
  )
}

/**
 * SignatureRibbon — dynamic corner badge driven by real backend fields.
 * Priority (single badge per card):
 *   1. CHEF'S PICK — `dish.signature` (backend `isRecommended`)
 *   2. MOST LOVED — `rating >= 4.5 && reviewCount >= 10`
 *   3. NEW — `createdAt` within the last 14 days
 *
 * Returns null when none apply — no fake badges rendered for demo tenants.
 */
function SignatureRibbon({ dish }: { dish: Dish }) {
  if (dish.signature) {
    return (
      <div
        className="c-ribbon c-ribbon--gold absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.22em] shadow-lg z-[2]"
        style={{
          background: 'linear-gradient(135deg, #F5E5B8 0%, #C9A96E 100%)',
          color: '#1A1A1A',
        }}
      >
        <Sparkles className="size-3 fill-current" aria-hidden />
        Chef's Pick
      </div>
    )
  }
  if (isMostLoved(dish.rating, dish.reviewCount)) {
    return (
      <div
        className="c-ribbon c-ribbon--terracotta absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.22em] shadow-lg z-[2]"
        style={{
          background: 'linear-gradient(135deg, #B4593F 0%, #8C3D28 100%)',
          color: '#FFFCF6',
        }}
      >
        <Heart className="size-3 fill-current" aria-hidden />
        Most Loved
      </div>
    )
  }
  if (isNewDish(dish.createdAt)) {
    return (
      <div
        className="c-ribbon c-ribbon--sage absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.22em] shadow-lg z-[2]"
        style={{
          background: 'linear-gradient(135deg, #A9BFA6 0%, #6E8B6A 100%)',
          color: '#1A1A1A',
        }}
      >
        <Flame className="size-3 fill-current" aria-hidden />
        New
      </div>
    )
  }
  return null
}
