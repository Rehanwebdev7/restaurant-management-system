import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMouseTilt } from '@/hooks/use-mouse-tilt'
import { handleImageError } from '@/features/customer/image-fallback'

/**
 * GallerySlider — paginated editorial grid (6 photos at a time).
 * Rebuilt 2026-07-10 per user request:
 *   • Manual pagination with prev/next arrows + "1 / N" counter
 *   • Keyboard arrow-key nav
 *   • Per-figure 3D tilt on hover (via useMouseTilt)
 *   • Staggered entrance on page swap (0.06s per index)
 *   • Cross-fade + Ken-Burns-lite between pages
 */

interface GalleryItem {
  src: string
  caption: string
}

const GALLERY: GalleryItem[] = [
  { src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1100&q=80', caption: "The Chef's Kitchen" },
  { src: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1100&q=80', caption: 'Dining Room' },
  { src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1100&q=80', caption: 'Ambient Evenings' },
  { src: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1100&q=80', caption: 'Signature Plating' },
  { src: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1100&q=80', caption: 'Tandoor Traditions' },
  { src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1100&q=80', caption: 'Bar Craft' },
  { src: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1100&q=80', caption: "Chef's Table" },
  { src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1100&q=80', caption: 'Every Bite Handcrafted' },
  { src: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=1100&q=80', caption: 'From The Fire' },
  { src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1100&q=80', caption: 'Warmth In Every Corner' },
  { src: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1100&q=80', caption: 'Where Guests Linger' },
  { src: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1100&q=80', caption: 'A La Minute' },
]

const PER_PAGE = 6

export default function GallerySlider() {
  const reduce = useReducedMotion()
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(GALLERY.length / PER_PAGE)
  const currentSlice = useMemo(
    () => GALLERY.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE),
    [page],
  )

  const goPrev = () => setPage((p) => (p - 1 + totalPages) % totalPages)
  const goNext = () => setPage((p) => (p + 1) % totalPages)

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages])

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 sm:mb-10 gap-4">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="subtitle"
          >
            A GLIMPSE INSIDE
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="display text-3xl sm:text-4xl lg:text-5xl leading-tight"
          >
            Crafting Every <span>Moment</span>
          </motion.h2>
        </div>
        {/* Pagination controls */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] opacity-70">
            {String(page + 1).padStart(2, '0')} <span className="opacity-50">/</span>{' '}
            {String(totalPages).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={goPrev}
            className="c-picks-arrow"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="c-picks-arrow"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Grid — cross-fade on page swap */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5"
          >
            {currentSlice.map((item, i) => (
              <GalleryTile
                key={`${page}-${i}`}
                item={item}
                index={i}
                reduce={!!reduce}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA to full page */}
      <div className="mt-10 flex justify-center">
        <Link
          to="/gallery"
          className="c-button-primary inline-flex items-center gap-2 group"
        >
          Explore Full Gallery
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>
    </section>
  )
}

function GalleryTile({
  item,
  index,
  reduce,
}: {
  item: GalleryItem
  index: number
  reduce: boolean
}) {
  const tilt = useMouseTilt<HTMLDivElement>(8, 1.02)

  // Alternate aspect ratios for editorial gallery-wall rhythm.
  // 0,3 → tall; 1,4 → wide; 2,5 → square
  const aspect = index % 3 === 0 ? 'aspect-[3/4]' : index % 3 === 1 ? 'aspect-[4/3]' : 'aspect-square'

  return (
    <motion.figure
      initial={{ opacity: 0, y: 32, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.65,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ perspective: '1200px' }}
      className={`relative overflow-hidden rounded-2xl group cursor-pointer ${aspect}`}
    >
      <div
        ref={tilt.ref}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl border border-white/5 hover:border-[var(--c-accent,#C9A96E)]/60"
        style={{
          transition: 'transform 250ms cubic-bezier(0.16,1,0.3,1), border-color 260ms',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        <img
          src={item.src}
          alt={item.caption}
          loading="lazy"
          decoding="async"
          onError={handleImageError('gallery')}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08] group-hover:brightness-[1.05]"
        />
        {/* Bottom fade for caption legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 92%, rgba(0,0,0,0.92) 100%)',
          }}
        />
        {/* Gold corner accent on hover */}
        <div
          aria-hidden="true"
          className="absolute -top-8 -right-8 size-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(201,169,110,0.4) 0%, transparent 65%)',
          }}
        />
        {/* Caption */}
        <figcaption className="absolute bottom-3 left-3 right-3 text-white text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] leading-tight opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
          {item.caption}
        </figcaption>
      </div>
      {reduce ? null : null}
    </motion.figure>
  )
}
