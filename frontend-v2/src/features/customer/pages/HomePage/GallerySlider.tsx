import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * GallerySlider — an auto-scrolling horizontal gallery strip that sits
 * between the products grid and testimonials. Scroll behavior:
 *  - Horizontal offset of the photo track is driven by vertical page scroll
 *    (linked via framer-motion `useScroll` on the section's scrollYProgress).
 *  - Downward page scroll → strip moves right-to-left (photos flow past).
 *  - Upward scroll auto-reverses.
 * Photos have subtle vertical stagger + slight rotation (alternating) for a
 * dynamic gallery-wall feel — not a flat conveyor belt. `prefers-reduced-motion`
 * disables the scroll-linked shift + flame-flicker animation.
 *
 * Zig-zag flame divider at the top separates the cream products section
 * from the dark gallery — dark flames "lick" upward into the cream section.
 * Two layered SVG paths drift in opposite directions at different speeds to
 * give a subtle animated flicker.
 */

interface GalleryItem {
  src: string
  caption: string
}

const GALLERY: GalleryItem[] = [
  { src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80', caption: 'The Chef\'s Kitchen' },
  { src: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80', caption: 'Dining Room · Bandra' },
  { src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80', caption: 'Ambient Evenings' },
  { src: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=900&q=80', caption: 'Signature Plating' },
  { src: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80', caption: 'Tandoor Traditions' },
  { src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80', caption: 'Bar Craft' },
  { src: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80', caption: 'Chef\'s Table' },
  { src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80', caption: 'Every Bite Handcrafted' },
]

// Two flame silhouettes tuned as wavy quadratic paths — back layer is fatter
// and lower opacity for depth, front layer is sharper and full opacity.
const FLAME_PATH_BACK =
  'M0,90 L0,50 Q60,10 120,45 Q180,65 240,32 Q300,5 360,42 Q420,60 480,28 Q540,8 600,44 Q660,62 720,30 Q780,4 840,42 Q900,62 960,32 Q1020,8 1080,44 Q1140,60 1200,30 Q1260,10 1320,44 Q1380,60 1440,36 L1440,90 Z'
const FLAME_PATH_FRONT =
  'M0,90 L0,58 Q40,20 82,52 Q124,74 168,40 Q212,14 256,48 Q300,72 344,36 Q388,10 432,48 Q476,70 520,34 Q564,10 608,46 Q652,72 696,36 Q740,10 784,48 Q828,72 872,36 Q916,10 960,46 Q1004,70 1048,34 Q1092,10 1136,48 Q1180,74 1224,40 Q1268,14 1312,48 Q1356,72 1400,36 Q1420,20 1440,42 L1440,90 Z'

export default function GallerySlider() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const trackX = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ['0%', '0%'] : ['5%', '-45%'],
  )

  return (
    <section ref={sectionRef} className="gallery-strip">
      {/* Zig-zag flame divider — dark flames rise from gallery into the
          cream section above. Two SVG layers flicker via CSS keyframes. */}
      <div className="flame-divider" aria-hidden="true">
        <svg
          className="flame-svg flame-svg--back"
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={FLAME_PATH_BACK} />
        </svg>
        <svg
          className="flame-svg flame-svg--front"
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={FLAME_PATH_FRONT} />
        </svg>
      </div>

      <div className="gallery-strip-header">
        <p className="subtitle">A GLIMPSE INSIDE</p>
        <div className="c-divider" />
        <h2 className="display text-3xl sm:text-4xl lg:text-5xl">
          Crafting Every <span>Moment</span>, Every Bite
        </h2>
        <p className="text-sm text-[--c-text-soft] mt-4 max-w-md mx-auto">
          A restaurant is more than a menu — it's the room, the flame, the plate,
          the hand that seasons it. Every corner of Spice Garden is composed with
          intent. Scroll on to peek inside.
        </p>
      </div>

      <div className="gallery-viewport" aria-label="Restaurant gallery">
        <motion.div className="gallery-track" style={{ x: trackX }}>
          {GALLERY.map((g, i) => (
            <figure key={i} className="gallery-card">
              <img src={g.src} alt={g.caption} loading="lazy" decoding="async" />
              <figcaption className="gallery-caption">{g.caption}</figcaption>
            </figure>
          ))}
        </motion.div>
      </div>

      <div className="gallery-cta">
        <Link
          to="/gallery"
          className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full font-extrabold text-[10px] tracking-[0.2em] uppercase text-white cursor-pointer transition-all"
          style={{ background: 'var(--c-teal)', boxShadow: '0 10px 22px var(--c-teal-glow)' }}
        >
          Explore Full Gallery
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </section>
  )
}
