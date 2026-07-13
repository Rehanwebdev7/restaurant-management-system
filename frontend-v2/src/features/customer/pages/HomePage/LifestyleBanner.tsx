import { useMemo, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { handleImageError } from '@/features/customer/image-fallback'
import ImageRotator from '@/features/customer/pages/HomePage/ImageRotator'
import { useCustomerGallery } from '@/api/queries/customer'
import { useSeedMode } from '@/features/customer/content/useSeedMode'
import { SeedBadge } from '@/features/customer/content/SeedBadge'

/**
 * LifestyleBanner — full-bleed cinematic separator with slow Ken Burns
 * effect and an editorial quote overlay. Sits between sections to reset
 * the visual pace and give the page depth.
 *
 * The image + quote can be swapped later per-tenant. Content is neutral
 * hospitality wording (safe for any restaurant style).
 */

interface Props {
  image?: string
  images?: string[]
  eyebrow?: string
  quote?: string
  attribution?: string
  height?: 'md' | 'lg' | 'xl'
}

/** Seed fallback — BRIGHT ambient photos (cream light theme friendly).
 * Used only when caller passes nothing AND backend gallery has < 2
 * ambience rows. Real tenants with tagged ambience photos see their own. */
const SEED_AMBIENCE = [
  'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1800&q=80',
]

export default function LifestyleBanner({
  image,
  images,
  eyebrow = 'THE ART OF HOSPITALITY',
  quote = 'Great food is memory in the making — cooked with intention, served with warmth, and shared without hurry.',
  attribution = 'Our Kitchen Philosophy',
  height = 'lg',
}: Props) {
  const seedMode = useSeedMode()
  const ambienceGallery = useCustomerGallery('ambience')
  // Precedence: explicit `images` prop > single `image` prop > backend
  // gallery (ambience-tagged) > seed fallback.
  const { activeImages, usingSeed } = useMemo(() => {
    if (images && images.length > 0) return { activeImages: images, usingSeed: false }
    if (image) return { activeImages: [image], usingSeed: false }
    const live = ambienceGallery.filtered.map((g) => g.imageUrl)
    if (live.length >= 2) return { activeImages: live, usingSeed: false }
    return { activeImages: SEED_AMBIENCE, usingSeed: true }
  }, [images, image, ambienceGallery.filtered])
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement | null>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  // Ken Burns: slow y drift + gentle scale as user scrolls past
  const yRaw = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])
  const scaleRaw = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1.02, 1.08])
  const y = reduce ? '0%' : yRaw
  const scale = reduce ? 1 : scaleRaw

  const heightClass =
    height === 'md'
      ? 'h-[420px] sm:h-[500px]'
      : height === 'xl'
        ? 'h-[520px] sm:h-[640px] lg:h-[720px]'
        : 'h-[460px] sm:h-[560px] lg:h-[620px]'

  return (
    <section
      ref={sectionRef}
      className={`c-lifestyle-banner relative overflow-hidden my-16 sm:my-24 ${heightClass}`}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          y,
          scale,
          filter: 'blur(4px) brightness(0.85)',
          WebkitFilter: 'blur(4px) brightness(0.85)',
        }}
      >
        {activeImages.length > 1 ? (
          <ImageRotator
            images={activeImages}
            interval={7000}
            kind="ambience"
            alt=""
            showDots={false}
          />
        ) : (
          <img
            src={activeImages[0]}
            alt=""
            loading="lazy"
            decoding="async"
            onError={handleImageError('ambience')}
            className="w-full h-full object-cover"
          />
        )}
      </motion.div>
      {/* Editorial overlay — darker so the blurred image reads as textured
       * atmosphere and the quote text pops. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/70"
      />

      {seedMode && usingSeed ? (
        <div className="absolute top-4 right-4 z-[2]">
          <SeedBadge label="Sample photos" />
        </div>
      ) : null}

      <div className="relative z-[1] h-full flex items-center justify-center px-6 sm:px-12 lg:px-24 text-center text-white">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.32em] opacity-85 mb-6"
          >
            {eyebrow}
          </motion.p>
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="display italic text-2xl sm:text-3xl lg:text-4xl leading-snug mb-6"
          >
            &ldquo;{quote}&rdquo;
          </motion.blockquote>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-[11px] sm:text-xs uppercase tracking-[0.28em] opacity-80"
          >
            — {attribution}
          </motion.p>
        </div>
      </div>
    </section>
  )
}
