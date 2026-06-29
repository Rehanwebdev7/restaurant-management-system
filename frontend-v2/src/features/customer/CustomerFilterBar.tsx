/**
 * CustomerFilterBar — shared filter strip for HomePage's popular section
 * and the full MenuPage.
 *
 * Surfaces:
 *   • Category pills (ALL + every entry in CATEGORIES) with horizontal
 *     scroll-snap on mobile.
 *   • VEG / NON-VEG / ALL diet toggle.
 *   • Search input (gold-bordered) that already lives in the customer theme.
 *   • Live result count "Showing N of M dishes".
 *
 * State is persisted in URL search params (`?cat=mains&veg=true&q=paneer`)
 * so back / forward / share-this-link all behave naturally.
 *
 * The bar sticks just under the steakhouse header (72 px tall) via
 * `position: sticky; top: 72px;` so it stays visible while users browse.
 *
 * Filtering itself is exposed through `useCustomerFilters()` — the page
 * calls it once to read state + the filtered list, then renders this bar.
 */

import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Leaf, Drumstick, X, Utensils } from 'lucide-react'
import { CATEGORIES, DISHES, type Dish } from '@/features/customer/catalog'
import { cn } from '@/lib/utils'

export type DietFilter = 'all' | 'veg' | 'nonveg'

export interface CustomerFilters {
  cat: string | null
  diet: DietFilter
  q: string
  setCat: (id: string | null) => void
  setDiet: (d: DietFilter) => void
  setQ: (q: string) => void
  reset: () => void
  filtered: Dish[]
  total: number
}

/**
 * Hook backing the filter bar. Owns URL search params (`cat`, `veg`, `q`).
 */
export function useCustomerFilters(source: readonly Dish[] = DISHES): CustomerFilters {
  const [params, setParams] = useSearchParams()
  const cat = params.get('cat')
  const dietRaw = params.get('veg')
  const diet: DietFilter = dietRaw === 'true' ? 'veg' : dietRaw === 'false' ? 'nonveg' : 'all'
  const q = params.get('q') ?? ''

  const update = (patch: Record<string, string | null>): void => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
  }

  const filtered = useMemo<Dish[]>(() => {
    const needle = q.trim().toLowerCase()
    return source.filter((d) => {
      if (cat && d.category !== cat) return false
      if (diet === 'veg' && !d.veg) return false
      if (diet === 'nonveg' && d.veg) return false
      if (!needle) return true
      return (
        d.name.toLowerCase().includes(needle) ||
        d.description.toLowerCase().includes(needle) ||
        d.category.toLowerCase().includes(needle)
      )
    })
  }, [source, cat, diet, q])

  return {
    cat,
    diet,
    q,
    setCat: (id) => update({ cat: id }),
    setDiet: (d) => update({ veg: d === 'veg' ? 'true' : d === 'nonveg' ? 'false' : null }),
    setQ: (next) => update({ q: next }),
    reset: () => update({ cat: null, veg: null, q: null }),
    filtered,
    total: source.length,
  }
}

interface CustomerFilterBarProps {
  filters: CustomerFilters
  /**
   * Sticky offset from the top of the viewport. Defaults to the customer
   * header height (72 px). Pass 0 if you're rendering inline.
   */
  stickyTop?: number
  /** Hide the search input (HomePage hero may already render it). */
  hideSearch?: boolean
  /** Hide the result count footer. */
  hideCount?: boolean
  /** Hide category pills row when the page already shows image tiles for category selection. */
  hideCategoryPills?: boolean
  /** Optional id used by sr-only label. */
  searchPlaceholder?: string
}

const CAT_OPTIONS: { id: string | null; label: string }[] = [
  { id: null, label: 'All' },
  ...CATEGORIES.map((c) => ({ id: c.id as string, label: c.name })),
]

const DIET_OPTIONS: { id: DietFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'veg', label: 'Veg' },
  { id: 'nonveg', label: 'Non-veg' },
]

export function CustomerFilterBar({
  filters,
  stickyTop = 72,
  hideSearch = false,
  hideCount = false,
  hideCategoryPills = false,
  searchPlaceholder = 'Search dishes…',
}: CustomerFilterBarProps) {
  const { cat, diet, q, setCat, setDiet, setQ, reset, filtered, total } = filters
  const showingCount = filtered.length
  const hasActive = cat !== null || diet !== 'all' || q.trim().length > 0

  return (
    <div
      className="relative z-20 backdrop-blur"
      style={{
        position: 'sticky',
        top: stickyTop,
        background: 'color-mix(in srgb, var(--c-bg) 88%, transparent)',
        borderBottom: '1px solid var(--c-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 space-y-2.5">
        {/* Row 1 — category pills (horizontal scroll on mobile). Hidden when
         * the host page renders its own image-tile category selector. */}
        {!hideCategoryPills ? (
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
            style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
          >
            {CAT_OPTIONS.map((opt) => {
              const isActive = cat === opt.id
              return (
                <button
                  key={opt.id ?? 'all'}
                  onClick={() => setCat(opt.id)}
                  className={cn(
                    'shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em]',
                    'border transition-all duration-200',
                  )}
                  style={{
                    scrollSnapAlign: 'start',
                    background: isActive ? 'var(--c-accent)' : 'transparent',
                    color: isActive ? 'var(--c-button-primary-fg)' : 'var(--c-text)',
                    borderColor: isActive ? 'var(--c-accent)' : 'var(--c-border)',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        ) : null}

        {/* Row 2 — diet toggle + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Diet group */}
          <div
            className="inline-flex rounded-md overflow-hidden shrink-0"
            style={{ border: '1px solid var(--c-border)' }}
            role="group"
            aria-label="Dietary filter"
          >
            {DIET_OPTIONS.map((opt, i) => {
              const isActive = diet === opt.id
              const Icon = opt.id === 'veg' ? Leaf : opt.id === 'nonveg' ? Drumstick : Utensils
              return (
                <button
                  key={opt.id}
                  onClick={() => setDiet(opt.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors',
                  )}
                  aria-pressed={isActive}
                  style={{
                    background: isActive ? 'var(--c-accent)' : 'transparent',
                    color: isActive
                      ? 'var(--c-button-primary-fg)'
                      : opt.id === 'veg'
                        ? '#4caf50'
                        : opt.id === 'nonveg'
                          ? '#d32f2f'
                          : 'var(--c-text)',
                    borderLeft: i === 0 ? 'none' : '1px solid var(--c-border)',
                  }}
                >
                  <Icon className="size-3" />
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Search */}
          {!hideSearch ? (
            <div className="relative flex-1">
              <input
                className="c-input pl-3 pr-9 text-sm w-full"
                placeholder={searchPlaceholder}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search dishes"
              />
              {q ? (
                <button
                  onClick={() => setQ('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[--c-bg-elev-2]"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
          ) : null}

          {hasActive ? (
            <button
              onClick={reset}
              className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-[--c-text-muted] hover:gold-text transition-colors"
            >
              Reset
            </button>
          ) : null}
        </div>

        {/* Row 3 — result count */}
        {!hideCount ? (
          <p
            className="text-[11px]"
            style={{ color: 'var(--c-text-muted)', letterSpacing: '0.04em' }}
            aria-live="polite"
          >
            Showing <span className="gold-text font-semibold">{showingCount}</span> of {total} dishes
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default CustomerFilterBar
