import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { UtensilsCrossed, Bike, CalendarHeart, ArrowRight, Check } from 'lucide-react'
import ImageRotator from '@/features/customer/pages/HomePage/ImageRotator'
import { useCustomerGallery } from '@/api/queries/customer'
import { useSeedMode } from '@/features/customer/content/useSeedMode'
import { SeedBadge } from '@/features/customer/content/SeedBadge'
import { cn } from '@/lib/utils'

/**
 * Signature Experience — three editorial ZIGZAG rows showcasing the primary
 * ways a guest can interact with the restaurant. Each row alternates image
 * position (left/right/left) so the eye travels down the page in a natural
 * S-curve — a classic editorial move used by premium hospitality sites.
 *
 * Image side has a soft brand-tinted blur so text always reads clean.
 * Text side is on the ambient page background (not a hard card) so the
 * layout breathes and each row feels like its own chapter of the story.
 */

interface Experience {
  title: string
  eyebrow: string
  description: string
  cta: string
  route: string
  seed: string[]
  category: string
  Icon: typeof UtensilsCrossed
  features: string[]
}

/** Seed image sets — only used when backend gallery has < 2 rows tagged
 * with the matching category. Real tenants who upload category-tagged
 * photos (DINING / DELIVERY / RESERVATION) see their own. */
const EXPERIENCES: Experience[] = [
  {
    title: 'Dine With Us',
    eyebrow: 'IN-HOUSE EXPERIENCE',
    description:
      'Warm interiors, considered lighting, and plates prepared à la minute — an evening built for lingering.',
    cta: 'Explore The Room',
    route: '/gallery',
    category: 'dining',
    seed: [
      'https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1400&q=80',
    ],
    Icon: UtensilsCrossed,
    features: ['Candle-lit tables', 'Private booths for occasions', 'Chef specials refreshed daily'],
  },
  {
    title: 'Delivery & Takeaway',
    eyebrow: 'AT YOUR DOORSTEP',
    description:
      'The same kitchen craft, packed with care and dispatched fresh. Order in a few taps, track it in real time.',
    cta: 'Browse The Menu',
    route: '/menu',
    category: 'delivery',
    seed: [
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1400&q=80',
    ],
    Icon: Bike,
    features: ['Kitchen-fresh, packed hot', 'Live order tracking', 'Sealed for hygiene'],
  },
  {
    title: 'Reserve A Table',
    eyebrow: 'PLAN YOUR EVENING',
    description:
      'Whether it is a quiet dinner for two or a table of ten, our team will hold the room for you.',
    cta: 'Book Now',
    route: '/contact',
    category: 'reservation',
    seed: [
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1543007629-4a04b5ad1156?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1400&q=80',
    ],
    Icon: CalendarHeart,
    features: ['Priority seating', 'Custom occasions & set menus', 'Complimentary bread service'],
  },
]

export default function SignatureExperience() {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const seedMode = useSeedMode()
  const diningGallery = useCustomerGallery('dining')
  const deliveryGallery = useCustomerGallery('delivery')
  const reservationGallery = useCustomerGallery('reservation')

  const resolved = useMemo(() => {
    return EXPERIENCES.map((exp) => {
      const pool =
        exp.category === 'dining'
          ? diningGallery.filtered
          : exp.category === 'delivery'
            ? deliveryGallery.filtered
            : reservationGallery.filtered
      const live = pool.map((g) => g.imageUrl)
      const usingSeed = live.length < 2
      return { exp, images: usingSeed ? exp.seed : live, usingSeed }
    })
  }, [
    diningGallery.filtered,
    deliveryGallery.filtered,
    reservationGallery.filtered,
  ])

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="text-center mb-16 sm:mb-20">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="subtitle"
        >
          THE SIGNATURE EXPERIENCE
        </motion.p>
        <div className="c-divider" />
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.65, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="display text-3xl sm:text-4xl lg:text-5xl"
        >
          Three ways to <span>enjoy</span> the kitchen
        </motion.h2>
      </div>

      <div className="space-y-20 sm:space-y-28">
        {resolved.map(({ exp, images, usingSeed }, i) => {
          const imageLeft = i % 2 === 0 // 0, 2 → image left; 1 → image right
          return (
            <div
              key={exp.title}
              className={cn(
                'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center',
                !imageLeft && 'lg:[direction:rtl]',
              )}
            >
              {/* Image side — soft brand-tinted blur behind + crisp focal photo.
               * Uses two layers: a heavier blurred backdrop that leaks brand
               * color, then the crisp photo scaled slightly. The gap between
               * the two makes the image feel embedded in the page instead of
               * boxed. */}
              <motion.div
                initial={{ opacity: 0, x: imageLeft ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: '-80px' }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] lg:[direction:ltr]"
              >
                {/* Backdrop wash — subtle blur + gold tint, offset behind */}
                <div
                  aria-hidden="true"
                  className="absolute -inset-4 sm:-inset-6 rounded-[2.5rem] pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse at 40% 30%, rgba(201,169,110,0.25), transparent 65%), radial-gradient(ellipse at 70% 80%, rgba(31,139,133,0.18), transparent 60%)',
                    filter: 'blur(30px)',
                    opacity: 0.9,
                  }}
                />
                {/* The actual photo — rounded, subtle border, spring hover.
                 * `filter: brightness` slightly boosts the food shot without
                 * over-saturating it. */}
                <motion.div
                  whileHover={reduce ? undefined : { scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.45)] border border-white/10"
                  style={{ filter: 'brightness(1.02) contrast(1.02)' }}
                >
                  <ImageRotator
                    images={images}
                    interval={6000}
                    kind="ambience"
                    alt={exp.title}
                  />
                  {seedMode && usingSeed ? (
                    <div className="absolute top-3 right-3 z-[4]">
                      <SeedBadge label="Sample" />
                    </div>
                  ) : null}
                  {/* Faint corner label — subtle, doesn't cover the photo */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none z-[2]"
                    style={{
                      background:
                        'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.55) 100%)',
                    }}
                  />
                  <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-black/50 backdrop-blur-md border border-white/15 text-white text-[10px] font-extrabold uppercase tracking-[0.24em] z-[3]">
                    <exp.Icon className="size-3.5" aria-hidden="true" />
                    <span>{exp.eyebrow}</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Text side — editorial column on the page background.
               * `[direction:ltr]` resets the RTL trick used for zigzag layout. */}
              <motion.div
                initial={{ opacity: 0, x: imageLeft ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: '-80px' }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="lg:[direction:ltr]"
              >
                <p
                  className="text-[11px] font-extrabold uppercase tracking-[0.32em] mb-4"
                  style={{ color: 'var(--c-accent, #C9A96E)' }}
                >
                  {exp.eyebrow}
                </p>
                <h3 className="display text-3xl sm:text-4xl lg:text-5xl leading-tight mb-5">
                  {exp.title}
                </h3>
                <p className="text-sm sm:text-base text-[var(--c-text-soft)] leading-relaxed mb-7 max-w-xl">
                  {exp.description}
                </p>

                {/* Feature list — each row a check + bullet copy. Reads as
                 * curated hospitality not marketing bullets. */}
                <ul className="space-y-3 mb-9 max-w-md">
                  {exp.features.map((feature, fi) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: false, margin: '-60px' }}
                      transition={{
                        duration: 0.5,
                        delay: 0.2 + fi * 0.08,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="flex items-start gap-3 text-[13px] sm:text-sm text-[var(--c-text)]"
                    >
                      <span
                        className="inline-flex items-center justify-center size-5 rounded-full shrink-0 mt-0.5"
                        style={{
                          background: 'rgba(201,169,110,0.18)',
                          color: 'var(--c-accent, #C9A96E)',
                        }}
                      >
                        <Check className="size-3" aria-hidden="true" />
                      </span>
                      <span className="leading-relaxed">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => navigate(exp.route)}
                  className="c-button-primary inline-flex items-center gap-2 group"
                >
                  {exp.cta}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </button>
              </motion.div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
