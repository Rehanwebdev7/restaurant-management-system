import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Star, Sparkles, ArrowRight } from 'lucide-react'
import { useCustomerCatalog } from '@/features/customer/catalog'
import { spiceCount, isNewDish } from '@/features/customer/dish-utils'
import { formatPrice } from '@/features/customer/format'
import { Flame, Clock } from 'lucide-react'

/**
 * FeaturedSpotlight — full-width editorial hero for a single dish. Picks
 * the first `isRecommended` dish (Chef's Pick) from the live catalog. When
 * the tenant has no recommended dishes, falls back to the highest-rated
 * dish. Renders nothing if the catalog is empty — no lies.
 *
 * SaaS-safe: all copy/metadata comes from menu_items backend fields already
 * surfaced in Phase 2A (rating, reviewCount, isRecommended, spiceLevel,
 * preparationMinutes, createdAt). Zero seed content.
 */

export default function FeaturedSpotlight() {
  const navigate = useNavigate()
  const catalog = useCustomerCatalog()
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement | null>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const imageYRaw = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  const imageY = reduce ? '0%' : imageYRaw

  const featured = useMemo(() => {
    if (!catalog.dishes || catalog.dishes.length === 0) return null
    // Prefer Chef's Pick with the highest review count / rating
    const picks = catalog.dishes.filter((d) => d.signature)
    if (picks.length > 0) {
      return [...picks].sort((a, b) => {
        const aScore = a.reviewCount * (a.rating || 0)
        const bScore = b.reviewCount * (b.rating || 0)
        return bScore - aScore
      })[0]
    }
    // Fallback: highest rated (only when at least one review exists)
    const rated = catalog.dishes.filter((d) => d.reviewCount > 0)
    if (rated.length > 0) {
      return [...rated].sort((a, b) => b.rating - a.rating)[0]
    }
    // Last-resort: first dish
    return catalog.dishes[0] ?? null
  }, [catalog.dishes])

  if (!featured) return null

  const spice = spiceCount(featured.spiceLevel)
  const isNew = isNewDish(featured.createdAt)

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-16 sm:py-24 my-8"
    >
      {/* Ambient gradient bar underneath — signature editorial cue */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[60%] max-h-[520px] pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(201,169,110,0.10) 0%, rgba(139,94,60,0.05) 60%, transparent 100%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="subtitle inline-flex items-center gap-2"
          >
            <Sparkles className="size-3.5" aria-hidden />
            FEATURED THIS WEEK
          </motion.p>
          <div className="c-divider" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-center">
          {/* Image — full parallax on scroll */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl aspect-[4/5] shadow-2xl"
          >
            <motion.img
              src={featured.img}
              alt={featured.name}
              loading="lazy"
              decoding="async"
              style={{ y: imageY }}
              className="absolute inset-0 w-full h-[115%] object-cover"
            />
            {/* Subtle vignette */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
            />
            {/* Floating badges — Chef's Pick + New */}
            <div className="absolute top-5 left-5 flex flex-col gap-2">
              {featured.signature ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--c-accent,#C9A96E)] text-black px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] shadow-md">
                  <Sparkles className="size-3 fill-current" aria-hidden />
                  Chef's Pick
                </span>
              ) : null}
              {isNew ? (
                <span className="inline-flex items-center rounded-full bg-emerald-500 text-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em] shadow-md">
                  New This Week
                </span>
              ) : null}
            </div>
          </motion.div>

          {/* Copy — editorial layout */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center md:text-left"
          >
            <p className="subtitle text-[10px] tracking-[0.24em] mb-3">
              {featured.categoryName ?? 'CHEF SELECTION'}
            </p>
            <h3 className="display text-3xl sm:text-4xl lg:text-5xl mb-5 leading-tight">
              {featured.name}
            </h3>
            <p className="text-sm sm:text-base text-[var(--c-cream-text-soft,#6B5B45)] leading-relaxed mb-6 max-w-lg mx-auto md:mx-0">
              {featured.description}
            </p>

            {/* Meta row — only shows fields backend supplies */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 mb-8 text-[13px] text-[var(--c-cream-text-soft,#6B5B45)]">
              {featured.reviewCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Star className="size-4 fill-current" style={{ color: 'var(--c-accent, #C9A96E)' }} aria-hidden />
                  {featured.rating.toFixed(1)} <span className="opacity-70 font-normal">({featured.reviewCount})</span>
                </span>
              ) : null}
              {spice > 0 ? (
                <span className="inline-flex items-center gap-1" aria-label={`Spice ${featured.spiceLevel}`}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Flame
                      key={i}
                      className={`size-4 ${i < spice ? 'text-orange-500 fill-orange-500' : 'text-orange-500/25'}`}
                      aria-hidden
                    />
                  ))}
                </span>
              ) : null}
              {featured.preparationMinutes ? (
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Clock className="size-4" aria-hidden />
                  {featured.preparationMinutes} min
                </span>
              ) : null}
            </div>

            {/* Price + CTA */}
            <div className="flex flex-col sm:flex-row items-center md:items-start sm:items-center gap-4 sm:gap-6 justify-center md:justify-start">
              <p className="display text-3xl sm:text-4xl gold-text font-bold leading-none">
                {formatPrice(featured.price)}
              </p>
              <button
                type="button"
                onClick={() => navigate('/menu')}
                className="c-button-primary inline-flex items-center gap-2 group"
              >
                Order Now
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
