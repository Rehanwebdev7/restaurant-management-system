import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { handleImageError } from '@/features/customer/image-fallback'
import ImageRotator from '@/features/customer/pages/HomePage/ImageRotator'

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

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1800&q=80',
]

export default function LifestyleBanner({
  image,
  images,
  eyebrow = 'THE ART OF HOSPITALITY',
  quote = 'Great food is memory in the making — cooked with intention, served with warmth, and shared without hurry.',
  attribution = 'Our Kitchen Philosophy',
  height = 'lg',
}: Props) {
  // Precedence: explicit `images` array > single `image` prop > defaults set.
  const activeImages = images && images.length > 0
    ? images
    : image
      ? [image]
      : DEFAULT_IMAGES
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
      className={`relative overflow-hidden my-16 sm:my-24 ${heightClass}`}
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
