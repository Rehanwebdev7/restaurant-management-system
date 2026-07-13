import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { handleImageError } from '@/features/customer/image-fallback'
import { useCustomerGallery } from '@/api/queries/customer'
import { useSeedMode } from '@/features/customer/content/useSeedMode'
import { SeedBadge } from '@/features/customer/content/SeedBadge'

/**
 * GallerySlider — paginated editorial grid.
 * Backend-first (2026-07-11): consumes `useCustomerGallery()` for the tenant's
 * real photos. When backend returns fewer than MIN_LIVE items, falls back to
 * SEED_GALLERY so demo tenants never show a blank strip. Real tenants who
 * upload at least MIN_LIVE gallery rows never see seeds.
 */

interface GalleryItem {
  src: string
  caption: string
}

/** Seed fallback — only used when backend gallery has fewer than MIN_LIVE
 * rows. Curated BRIGHT restaurant photos so cream light theme feels
 * appetizing (dark-interior shots washed out on ivory). Marked visually
 * with <SeedBadge> whenever seed mode is on. */
const SEED_GALLERY: GalleryItem[] = [
  { src: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1100&q=80', caption: 'Sunlit Dining Room' },
  { src: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1100&q=80', caption: 'The Chef Plates' },
  { src: 'https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=1100&q=80', caption: 'Warm Wood & Light' },
  { src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1100&q=80', caption: 'Fresh, On A Plate' },
  { src: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1100&q=80', caption: 'Table Set For You' },
  { src: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1100&q=80', caption: 'Morning Ingredients' },
  { src: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=1100&q=80', caption: 'The Elegant Room' },
  { src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1100&q=80', caption: 'Every Bite Handcrafted' },
  { src: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=1100&q=80', caption: 'From The Kitchen' },
  { src: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1100&q=80', caption: 'Room With A View' },
  { src: 'https://images.unsplash.com/photo-1543007629-4a04b5ad1156?auto=format&fit=crop&w=1100&q=80', caption: 'Where Guests Linger' },
  { src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1100&q=80', caption: 'À La Minute' },
]

const PER_PAGE = 6
const MIN_LIVE = 4

export default function GallerySlider() {
  const reduce = useReducedMotion()
  const [page, setPage] = useState(0)
  const gallery = useCustomerGallery()
  const seedMode = useSeedMode()

  const items: GalleryItem[] = useMemo(() => {
    const live = gallery.all
    if (live.length >= MIN_LIVE) {
      return live.map((g) => ({
        src: g.imageUrl,
        caption: g.title ?? g.category ?? 'A moment',
      }))
    }
    return SEED_GALLERY
  }, [gallery.all])

  const usingSeed = items === SEED_GALLERY

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE))
  const currentSlice = useMemo(
    () => items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE),
    [page, items],
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
          {seedMode && usingSeed ? (
            <div className="mt-3">
              <SeedBadge label="Sample photos" />
            </div>
          ) : null}
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
      className={`c-flip-card relative rounded-2xl ${aspect}`}
    >
      <div className="c-flip-card__inner">
        {/* Front — photo + gold hover accent */}
        <div className="c-flip-card__face c-flip-card__front group border border-[var(--c-border)] shadow-xl">
          <img
            src={item.src}
            alt={item.caption}
            loading="lazy"
            decoding="async"
            onError={handleImageError('gallery')}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 95%, rgba(0,0,0,0.75) 100%)',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute -top-8 -right-8 size-24 rounded-full opacity-40 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(201,169,110,0.5) 0%, transparent 65%)',
            }}
          />
          <figcaption className="absolute bottom-3 left-3 right-3 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] leading-tight">
            {item.caption}
          </figcaption>
        </div>
        {/* Back — cream editorial card revealing full caption on flip */}
        <div className="c-flip-card__face c-flip-card__back">
          <div className="text-[9px] font-extrabold uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--c-terracotta, #B4593F)' }}>
            #{String(index + 1).padStart(2, '0')} · A Moment
          </div>
          <h4 className="display text-xl sm:text-2xl leading-tight mb-3">
            {item.caption}
          </h4>
          <p className="text-[11px] sm:text-xs text-[var(--c-text-soft)] leading-relaxed">
            Every photograph is a fragment of our story — the plates, the light, the guests who linger.
          </p>
          <div
            aria-hidden="true"
            className="mt-4 h-px w-12 mx-auto"
            style={{ background: 'linear-gradient(90deg, transparent, var(--c-accent,#C9A96E), transparent)' }}
          />
        </div>
      </div>
      {reduce ? null : null}
    </motion.figure>
  )
}
