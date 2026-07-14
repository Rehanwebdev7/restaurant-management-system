import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Leaf, ChefHat, Clock, Utensils } from 'lucide-react'
import { useCustomerCatalog } from '@/features/customer/catalog'

/**
 * MenuHighlights — small info-pill row that sits right below the hero.
 * Every pill is derivable from the live catalog + fixed hospitality claims
 * (no fake stats). Renders nothing if the catalog is entirely empty.
 *
 * Pill values:
 *   • Vegetarian availability — computed from `dish.veg` count
 *   • Chef's selections — computed from `dish.signature` (backend `isRecommended`)
 *   • Prep-time range — min–max of `preparationMinutes` across the catalog
 *   • Fresh daily — safe hospitality claim
 */

interface Pill {
  Icon: typeof Leaf
  label: string
  value: string
}

export default function MenuHighlights() {
  const catalog = useCustomerCatalog()

  const pills: Pill[] = useMemo(() => {
    if (!catalog.dishes || catalog.dishes.length === 0) return []

    const list: Pill[] = []

    const vegCount = catalog.dishes.filter((d) => d.veg).length
    if (vegCount > 0) {
      list.push({
        Icon: Leaf,
        label: 'Vegetarian',
        value: `${vegCount} plates`,
      })
    }

    const signatureCount = catalog.dishes.filter((d) => d.signature).length
    if (signatureCount > 0) {
      list.push({
        Icon: ChefHat,
        label: "Chef's Picks",
        value: `${signatureCount} curated`,
      })
    }

    const prepTimes = catalog.dishes
      .map((d) => d.preparationMinutes ?? 0)
      .filter((t) => t > 0)
    if (prepTimes.length > 0) {
      const min = Math.min(...prepTimes)
      const max = Math.max(...prepTimes)
      list.push({
        Icon: Clock,
        label: 'Prepared in',
        value: min === max ? `${min} min` : `${min}–${max} min`,
      })
    }

    // Safe hospitality claim — applies to any kitchen serving real food.
    list.push({
      Icon: Utensils,
      label: 'Kitchen',
      value: 'Cooked to order',
    })

    return list
  }, [catalog.dishes])

  if (pills.length === 0) return null

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10"
    >
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {pills.map((pill, i) => (
          <motion.div
            key={`${pill.label}-${i}`}
            variants={{
              hidden: { opacity: 0, y: 14, scale: 0.96 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="inline-flex items-center gap-3 rounded-full pl-2 pr-4 sm:pl-2.5 sm:pr-5 py-2 border border-[var(--c-border)] bg-[var(--c-bg-elev,rgba(255,255,255,0.04))] backdrop-blur-sm hover:border-[var(--c-accent,#C9A96E)] transition-colors shadow-sm"
          >
            <span
              className="inline-flex items-center justify-center size-8 rounded-full"
              style={{
                background: 'rgba(201,169,110,0.15)',
                color: 'var(--c-accent, #C9A96E)',
              }}
            >
              <pill.Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-tight text-left">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.22em] opacity-70">
                {pill.label}
              </span>
              <span className="text-sm font-semibold">{pill.value}</span>
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
