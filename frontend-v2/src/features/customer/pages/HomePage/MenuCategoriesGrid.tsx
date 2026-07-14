import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useCustomerCatalog } from '@/features/customer/catalog'

/**
 * MenuCategoriesGrid — big editorial category tiles with per-category
 * preview image (first dish in that category) + item count. Everything
 * driven by backend `menu_category` + `menu_items`. Renders nothing when
 * the tenant hasn't set up categories yet — no lies, no placeholder tiles.
 *
 * SaaS-safe: category name, description, priority, count all come from
 * backend fields we already surface (Phase 2A + 2C). Zero seed content.
 */

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80'

interface CategoryTile {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  itemCount: number
}

export default function MenuCategoriesGrid() {
  const catalog = useCustomerCatalog()
  const navigate = useNavigate()
  const reduce = useReducedMotion()

  const tiles = useMemo<CategoryTile[]>(() => {
    if (!catalog.categories || catalog.categories.length === 0) return []
    const sorted = [...catalog.categories].sort(
      (a, b) => (a.priority ?? 0) - (b.priority ?? 0),
    )
    return sorted.map((c) => {
      const inCategory = catalog.dishes.filter((d) => d.categoryId === c.id)
      const firstImage =
        inCategory.find((d) => d.img && !d.img.includes('unsplash'))?.img ??
        inCategory[0]?.img ??
        c.imageUrl ??
        null
      return {
        id: c.id,
        name: c.name,
        description: c.description ?? null,
        imageUrl: firstImage,
        itemCount: inCategory.length,
      }
    })
  }, [catalog.categories, catalog.dishes])

  // Nothing to show — return null so the page doesn't render an empty section.
  // No skeleton because this section is optional / additive.
  if (tiles.length === 0) return null

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="text-center mb-12 sm:mb-14">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="subtitle"
        >
          BROWSE BY COURSE
        </motion.p>
        <div className="c-divider" />
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="display text-3xl sm:text-4xl lg:text-5xl"
        >
          The <span>Menu</span>, curated
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 max-w-xl mx-auto text-center text-[13px] sm:text-sm text-[var(--c-cream-text-soft,#6B5B45)] leading-relaxed"
        >
          Each course tells its own story. Start where your appetite leads you.
        </motion.p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {tiles.map((tile, i) => (
          <motion.button
            key={tile.id}
            type="button"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{
              duration: 0.7,
              delay: (i % 3) * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={reduce ? undefined : { y: -6 }}
            onClick={() => navigate('/menu')}
            className="group relative overflow-hidden rounded-2xl text-left cursor-pointer aspect-square sm:aspect-[4/5] shadow-lg"
            aria-label={`Browse ${tile.name} — ${tile.itemCount} dishes`}
          >
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={tile.imageUrl ?? FALLBACK_IMG}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-500 group-hover:from-black/95" />
            <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 lg:p-6 text-white">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="display text-xl sm:text-2xl lg:text-3xl leading-tight text-white">
                  {tile.name}
                </h3>
                <ArrowUpRight className="size-4 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" aria-hidden />
              </div>
              {tile.description ? (
                <p className="text-xs text-white/80 line-clamp-2 mb-3 leading-relaxed">
                  {tile.description}
                </p>
              ) : null}
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] opacity-90">
                {tile.itemCount} {tile.itemCount === 1 ? 'dish' : 'dishes'}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
