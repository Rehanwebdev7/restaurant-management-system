import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { handleImageError } from '@/features/customer/image-fallback'

/**
 * MenuHero — cinematic full-bleed banner that anchors the top of the menu
 * page. Replaces the flat text-only heading with an editorial parallax
 * image + kinetic title. Sits above the existing filter + grid — no
 * change to menu logic, only presentation.
 */

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1800&q=80'

export default function MenuHero() {
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement | null>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const yRaw = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const scaleRaw = useTransform(scrollYProgress, [0, 1], [1.05, 1.18])
  const contentYRaw = useTransform(scrollYProgress, [0, 1], [0, -50])
  const contentOpacityRaw = useTransform(scrollYProgress, [0, 0.7], [1, 0.2])
  const y = reduce ? '0%' : yRaw
  const scale = reduce ? 1 : scaleRaw
  const contentY = reduce ? 0 : contentYRaw
  const contentOpacity = reduce ? 1 : contentOpacityRaw

  return (
    <section
      ref={sectionRef}
      className="menu-hero relative w-full overflow-hidden h-[50vh] min-h-[380px] max-h-[600px]"
    >
      {/* Parallax image */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ y, scale }}
      >
        <img
          src={HERO_IMAGE}
          alt=""
          loading="eager"
          decoding="async"
          onError={handleImageError('showcase')}
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Editorial overlay — subtle dark for readability, warm undertone */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(20,15,10,0.35) 0%, rgba(20,15,10,0.65) 60%, rgba(10,10,10,0.85) 100%)',
        }}
      />

      {/* Content — kinetic entrance */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-[1] h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8"
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.32em] mb-4"
          style={{ color: 'var(--c-accent, #C9A96E)' }}
        >
          OUR FULL MENU
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="display text-4xl sm:text-5xl lg:text-7xl font-bold text-white max-w-4xl leading-[1.05]"
          style={{ textShadow: '0 2px 24px rgba(0,0,0,0.5)' }}
        >
          Browse Our{' '}
          <span
            className="italic"
            style={{ color: 'var(--c-accent, #C9A96E)' }}
          >
            Delicious
          </span>{' '}
          Dishes
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm sm:text-base text-white/85 mt-6 max-w-xl leading-relaxed"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
        >
          A curated selection prepared by our kitchen — sourced with intention,
          cooked with craft, plated with care.
        </motion.p>

        {/* Subtle scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/70">
            Scroll to Explore
          </span>
          <motion.span
            aria-hidden="true"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="size-[3px] rounded-full bg-white/70"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
