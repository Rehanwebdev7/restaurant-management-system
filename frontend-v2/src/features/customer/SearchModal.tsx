/**
 * Global search dialog — opened from the search icon in CustomerLayout.
 *
 * Filters the existing DISHES list (legacy parity until backend search lands).
 * Remembers the last 5 queries in localStorage `customer_search_history`.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Search, X, History, Sparkles, Plus } from 'lucide-react'
import { DISHES, CATEGORIES, useCart } from '@/features/customer/catalog'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useBodyScrollLock } from '@/lib/useBodyScrollLock'

const MODAL_EASING: [number, number, number, number] = [0.16, 1, 0.3, 1]

const HISTORY_KEY = 'customer_search_history'
const HISTORY_MAX = 5

function readHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, HISTORY_MAX)
  } catch {
    return []
  }
}

function writeHistory(list: string[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)))
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function SearchModal({ open, onClose }: Props) {
  const navigate = useNavigate()
  const cart = useCart()
  const reduceMotion = useReducedMotion()
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<string[]>(readHistory)

  // Close on ESC + lock body scroll while open
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useBodyScrollLock(open)

  // Reset query whenever the modal closes
  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return [] as typeof DISHES
    return DISHES.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q),
    )
  }, [query])

  const commitHistory = (term: string): void => {
    const t = term.trim()
    if (!t) return
    const next = [t, ...history.filter((h) => h.toLowerCase() !== t.toLowerCase())].slice(0, HISTORY_MAX)
    setHistory(next)
    writeHistory(next)
  }

  const onPick = (term: string): void => {
    setQuery(term)
    commitHistory(term)
  }

  const clearHistory = (): void => {
    setHistory([])
    writeHistory([])
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="search-modal"
          className="fixed inset-0 z-[70]"
          role="dialog"
          aria-label="Search menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-x-0 top-0 mx-auto max-w-2xl mt-16 px-4"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: MODAL_EASING }}
          >
            <div className="c-card overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 p-3 border-b border-[--c-border]">
            <Search className="size-4 gold-text ml-1" />
            <input
              autoFocus
              className="c-input border-0 !p-2 flex-1 bg-transparent"
              placeholder="Search for dishes, categories…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitHistory(query)
              }}
            />
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-[--c-bg-elev-2]"
              aria-label="Close search"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {/* Quick categories */}
            <div>
              <p className="subtitle text-[10px] mb-2">QUICK PICKS</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                      query.toLowerCase() === c.name.toLowerCase()
                        ? 'bg-[--c-accent] text-black border-[--c-accent]'
                        : 'border-[--c-border] hover:border-[--c-accent]',
                    )}
                    onClick={() => onPick(c.name)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && !query ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="subtitle text-[10px] inline-flex items-center gap-1">
                    <History className="size-3" /> RECENT
                  </p>
                  <button
                    onClick={clearHistory}
                    className="text-[10px] text-[--c-text-muted] hover:gold-text uppercase tracking-widest"
                  >
                    Clear
                  </button>
                </div>
                <ul className="space-y-1">
                  {history.map((h) => (
                    <li key={h}>
                      <button
                        className="w-full text-left px-3 py-2 rounded hover:bg-[--c-bg-elev-2] text-sm"
                        onClick={() => onPick(h)}
                      >
                        {h}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Results */}
            {query ? (
              <div>
                <p className="subtitle text-[10px] mb-2">
                  {results.length} RESULT{results.length === 1 ? '' : 'S'}
                </p>
                {results.length === 0 ? (
                  <p className="text-sm text-[--c-text-muted] text-center py-6">
                    No matches. Try a different word.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {results.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center gap-3 p-2 rounded border border-[--c-border] hover:border-[--c-accent] transition-colors"
                      >
                        <img src={d.img} alt={d.name} className="size-12 rounded object-cover shrink-0" />
                        <button
                          className="flex-1 min-w-0 text-left"
                          onClick={() => {
                            commitHistory(query)
                            onClose()
                            navigate('/menu')
                          }}
                        >
                          <p className="font-semibold text-sm truncate inline-flex items-center gap-1">
                            <span className={d.veg ? 'veg-icon' : 'nonveg-icon'} />
                            {d.name}
                            {d.signature ? <Sparkles className="size-3 gold-text" /> : null}
                          </p>
                          <p className="text-xs gold-text font-semibold">₹{d.price}</p>
                        </button>
                        <button
                          className="c-button-outline !py-1 !px-2 !text-[10px] inline-flex items-center gap-1"
                          onClick={() => {
                            cart.add(d.id, 1)
                            toast.success(`${d.name} added`)
                          }}
                        >
                          <Plus className="size-3" /> ADD
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
