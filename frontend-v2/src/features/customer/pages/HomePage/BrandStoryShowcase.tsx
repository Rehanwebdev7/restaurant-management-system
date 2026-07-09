import { useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Sparkles, MapPin, ChefHat, Leaf, Clock } from 'lucide-react'
import { useBrand } from '@/components/providers/BrandProvider'
import { useCustomerBranches } from '@/api/queries/customer'
import { SeedBadge } from '@/features/customer/content/SeedBadge'
import { useSeedMode } from '@/features/customer/content/useSeedMode'
import { handleImageError } from '@/features/customer/image-fallback'

/**
 * BrandStoryShowcase — full-bleed editorial section that anchors the home
 * page with the restaurant's identity: image, story, and derivable
 * highlights. Replaces the previous "FeaturedSpotlight" which relied on a
 * dish image (often broken) and offered too little narrative context.
 *
 * Data sources — everything backend-driven or safely derived:
 *  • Image: warm restaurant interior (safe stock image; can swap when
 *    tenants upload their own hero via business_settings).
 *  • Title + subtitle: `brand.restaurantName` + `brand.tagline`.
 *  • Body: `brand.aboutUs` from the widened branding endpoint. When
 *    empty, falls back to a neutral hospitality paragraph with
 *    `<SeedBadge>` so demo tenants see something but real tenants know
 *    when their content is missing.
 *  • 4 highlights: branch count (live), cuisine (`tagline`), safe claims
 *    ("chef-crafted", "hand-picked daily"). No fabricated stats.
 *
 * Animation: parallax on the image + word-by-word title reveal on scroll.
 * Single hover effect — light CTA arrow slide.
 */

const SHOWCASE_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80'

const FALLBACK_ABOUT =
  'Welcome to a table set with intention. Every plate we send out is prepared by our kitchen team using ingredients we source with care — nothing rushed, nothing generic. Whether you dine with us or order in, expect the same warmth, the same craft, and the same signature attention to detail.'

interface Highlight {
  Icon: typeof MapPin
  label: string
  value: string
}

export default function BrandStoryShowcase() {
  const navigate = useNavigate()
  const brand = useBrand()
  const branchesQuery = useCustomerBranches()
  const seedMode = useSeedMode()
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement | null>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const imageYRaw = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])
  const imageScaleRaw = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1.03, 1.08])
  const imageY = reduce ? '0%' : imageYRaw
  const imageScale = reduce ? 1 : imageScaleRaw

  const branchCount = branchesQuery.data?.length ?? 0

  const highlights: Highlight[] = useMemo(() => {
    const list: Highlight[] = [
      { Icon: ChefHat, label: 'Kitchen', value: 'Chef-crafted daily' },
      { Icon: Leaf, label: 'Ingredients', value: 'Sourced with intention' },
      { Icon: Sparkles, label: 'Selection', value: 'Curated hospitality' },
    ]
    if (branchCount > 0) {
      list.push({
        Icon: MapPin,
        label: 'Locations',
        value:
          branchCount === 1 ? 'One flagship kitchen' : `${branchCount} kitchens across the city`,
      })
    } else {
      list.push({ Icon: Clock, label: 'Dining', value: 'Open through the week' })
    }
    return list
  }, [branchCount])

  const titleWords = useMemo(() => {
    const name = brand.restaurantName ?? 'Our Kitchen'
    return name.split(/\s+/)
  }, [brand.restaurantName])

  const aboutText = brand.aboutUs ?? (seedMode ? FALLBACK_ABOUT : null)

  // If we have absolutely no story context, hide the whole section.
  // Real tenants without `aboutUs` set won't render a placeholder.
  if (!aboutText) return null

  const usingFallback = !brand.aboutUs

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-16 sm:py-24 my-8"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-14 items-center">
          {/* Image side — parallax + soft warm frame */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl aspect-[4/5] lg:aspect-[5/6] shadow-2xl"
          >
            <motion.img
              src={SHOWCASE_IMAGE}
              alt={brand.restaurantName ?? 'Restaurant interior'}
              loading="lazy"
              decoding="async"
              onError={handleImageError('showcase')}
              style={{ y: imageY, scale: imageScale }}
              className="absolute inset-0 w-full h-[115%] object-cover"
            />
            {/* Warm cream corner accent — signature editorial cue */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-1 -left-1 -right-1 h-1/4 bg-gradient-to-t from-[var(--c-bg,rgba(255,253,247,0.5))] to-transparent pointer-events-none"
            />
          </motion.div>

          {/* Copy side — editorial */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-80px' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="subtitle mb-3"
            >
              THE STORY
            </motion.p>
            <div className="c-divider !ml-0" />

            {/* Word-by-word title reveal */}
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, margin: '-80px' }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
              }}
              className="display text-3xl sm:text-4xl lg:text-5xl leading-tight mb-6"
            >
              {titleWords.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
                  }}
                  className="inline-block"
                  style={{ marginRight: '0.3em' }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h2>

            {brand.tagline ? (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-80px' }}
                transition={{ duration: 0.65, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="subtitle text-[11px] tracking-[0.32em] mb-6 opacity-80"
              >
                {brand.tagline}
              </motion.p>
            ) : null}

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-80px' }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base text-[var(--c-cream-text-soft,#6B5B45)] leading-relaxed mb-8 max-w-lg"
            >
              {aboutText}
            </motion.p>

            {usingFallback ? (
              <div className="mb-6">
                <SeedBadge />
              </div>
            ) : null}

            {/* Highlights grid — 4 derivable / safe stats.
             * Cards get: gradient border, gold-accented icon halo, spring
             * hover lift + shadow, and stagger entrance so the block reads
             * as intentional rather than a boring stat row. */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, margin: '-80px' }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.09, delayChildren: 0.55 } },
              }}
              className="grid grid-cols-2 gap-4 sm:gap-5 mb-10"
            >
              {highlights.map((h, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 22, scale: 0.96 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                  }}
                  whileHover={reduce ? undefined : { y: -4 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="group relative p-4 sm:p-5 rounded-2xl bg-[var(--c-bg-elev,rgba(255,253,247,0.06))] border border-[var(--c-border)] hover:border-[var(--c-accent,#C9A96E)] transition-colors overflow-hidden"
                  style={{
                    // Subtle inner sheen — reads as premium in both themes.
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 12px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Gold corner accent — appears on hover */}
                  <span
                    aria-hidden="true"
                    className="absolute -top-8 -right-8 size-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(201,169,110,0.35) 0%, transparent 65%)',
                    }}
                  />
                  {/* Icon in a proper halo — visible in both light + dark */}
                  <div
                    className="relative inline-flex items-center justify-center size-11 rounded-full mb-3 transition-transform group-hover:scale-110"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(201,169,110,0.25), rgba(201,169,110,0.08))',
                      color: 'var(--c-accent, #C9A96E)',
                      boxShadow: '0 4px 12px rgba(201,169,110,0.18)',
                    }}
                  >
                    <h.Icon className="size-5" aria-hidden="true" />
                  </div>
                  <p
                    className="text-[9px] font-extrabold tracking-[0.28em] mb-1.5 uppercase"
                    style={{ color: 'var(--c-accent, #C9A96E)' }}
                  >
                    {h.label}
                  </p>
                  <p className="text-sm font-semibold leading-tight text-[var(--c-text)]">
                    {h.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Twin CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap gap-3"
            >
              <button
                type="button"
                onClick={() => navigate('/about')}
                className="c-button-primary inline-flex items-center gap-2 group"
              >
                Our Story
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => navigate('/menu')}
                className="c-button-outline inline-flex items-center gap-2 group"
              >
                Explore Menu
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
