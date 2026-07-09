import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown, Sparkles, ShoppingCart, Calendar, ArrowUp } from 'lucide-react'
import CustomerLayout from '@/features/customer/CustomerLayout'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { useMounted } from '@/hooks/use-mounted'
import { DocumentTitle } from '@/lib/seo/document-title'
import { useCustomerCatalog } from '@/features/customer/catalog'
import CustomerFilterBar, { useCustomerFilters } from '@/features/customer/CustomerFilterBar'
import DishCardRound, { DishCardRoundGridSkeleton } from '@/features/customer/DishCardRound'
import CategoryChainSection from '@/features/customer/pages/HomePage/CategoryChainSection'
import { cn } from '@/lib/utils'
import '@/styles/customer.css'

const HEADER_STICKY_OFFSET = 72 // Site header height — sticky cluster anchors here

/**
 * MenuPage — mirrors HomePage's dome+scrolling category behavior but with
 * the curve flipped VERTICALLY (upward valley instead of downward dome):
 *
 *   Home:  dome ∩  — cream peaks UP into hero, edges drop, center on peak.
 *   Menu:  valley ∪ — cream dips DOWN into filter, edges rise, center in bowl.
 *
 * "Browse Our Delicious Dishes" heading scrolls away with the page.
 * Filter + valley curve + category orbit stick as one cluster below the
 * site header. Products scroll below.
 */
export function MenuPage() {
  const navigate = useNavigate()
  const catalog = useCustomerCatalog()
  const filters = useCustomerFilters(catalog.dishes)
  const { filtered, cat, setCat } = filters
  const mounted = useMounted(200)

  // Infinite scroll batch rendering
  const PAGE_SIZE = 12
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Shutter collapse logic for desktop screen widths
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  const clusterRef = useRef<HTMLDivElement | null>(null)
  const productsContentRef = useRef<HTMLDivElement | null>(null)
  // Cached UNCOLLAPSED cluster height (measured only while shutter is open).
  const expandedClusterHeightRef = useRef<number>(0)
  // window.scrollY value at which products' top would touch the fully-expanded
  // cluster's bottom edge (72 + expanded height). Fixed reference so hysteresis
  // works and collapse doesn't oscillate as the cluster's height changes.
  const collapseThresholdRef = useRef<number>(0)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Measure expanded cluster height + scroll threshold. ResizeObserver on
  // the cluster catches every real size change (image load, font swap, chip
  // wrap on narrow desktop) — replaces the fragile setTimeout(120/400) pair.
  useLayoutEffect(() => {
    const measure = () => {
      const cluster = clusterRef.current
      const products = productsContentRef.current
      if (!cluster || !products) return

      // Only refresh the cached expanded height while shutter is OPEN — during
      // a collapse animation cluster.offsetHeight would report the mid/shrunk
      // value and poison the threshold.
      if (!isCollapsed) {
        const h = cluster.offsetHeight
        if (h > 100) expandedClusterHeightRef.current = h
      }
      // Fallback so threshold is never nonsensical (trimmer cluster after fix)
      if (expandedClusterHeightRef.current < 100) {
        expandedClusterHeightRef.current = 200
      }

      const productsDocTop =
        products.getBoundingClientRect().top + window.scrollY
      collapseThresholdRef.current =
        productsDocTop - HEADER_STICKY_OFFSET - expandedClusterHeightRef.current
    }

    // Initial measure after next paint so layout/CSS is settled.
    const rafId = requestAnimationFrame(measure)

    // ResizeObserver watches cluster for real size changes (images, fonts,
    // viewport). Also observe products since its top-y is what threshold uses.
    const ro = new ResizeObserver(measure)
    if (clusterRef.current) ro.observe(clusterRef.current)
    if (productsContentRef.current) ro.observe(productsContentRef.current)
    window.addEventListener('resize', measure)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [mounted, isCollapsed])

  // rAF-throttled scroll listener with hysteresis. Only runs on desktop.
  useEffect(() => {
    if (!isDesktop) {
      setIsCollapsed(false)
      setIsHovered(false)
      return
    }
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const y = window.scrollY
        const t = collapseThresholdRef.current
        if (t <= 0) return
        // Hysteresis: collapse a hair past touch-point, uncollapse only after
        // scrolling clearly back into safe zone.
        if (y > t + 6) setIsCollapsed(true)
        else if (y < t - 24) setIsCollapsed(false)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [isDesktop])

  // Reset hover whenever we uncollapse — keeps hover state clean between cycles
  useEffect(() => {
    if (!isCollapsed) setIsHovered(false)
  }, [isCollapsed])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filters.cat, filters.diet, filters.q])

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      const e = entries[0]
      if (e && e.isIntersecting) {
        setVisibleCount((n) => Math.min(n + PAGE_SIZE, filtered.length))
      }
    }, { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [filtered.length])

  const visibleDishes = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  return (
    <CustomerLayout>
      <DocumentTitle
        title="Menu — Spice Garden Steakhouse"
        description="Browse the full Spice Garden menu — starters, mains, breads, drinks and desserts. Order online or reserve a table at any of our three Mumbai branches."
      />

      {/* ─── Section 1 — Non-sticky heading. Scrolls away with the page. ─── */}
      <div className="menu-page-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[var(--c-primary)] mb-3"
          >
            OUR FULL MENU
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="display text-4xl sm:text-5xl lg:text-6xl font-bold text-white"
          >
            Browse Our <span className="gold-text">Delicious</span> Dishes
          </motion.h1>
        </div>
      </div>

      {/* ─── Wrapper to constrain sticky boundary and prevent footer overlap ─── */}
      <div className="menu-main-content-flow relative">
        {/* ─── Section 2 — STICKY cluster: filter + valley curve + orbit. ─── */}
        <div
          ref={clusterRef}
          className={cn(
            "menu-sticky-cluster",
            isDesktop && isCollapsed && "shutter-collapsed",
            isDesktop && isCollapsed && isHovered && "shutter-hovered"
          )}
          // Only reset hover when the cursor actually leaves the entire cluster
          // (filter bar + revealed shutter + trigger). Hovering the always-visible
          // filter bar must NEVER expand the shutter — only the trigger button
          // handles that below.
          onMouseLeave={() => isDesktop && setIsHovered(false)}
        >
          {/* Filter bar sits inside the dark half of the cluster. */}
          <div className="menu-sticky-filterbar">
            <div className="max-w-3xl mx-auto px-4">
              <CustomerFilterBar filters={filters} hideCategoryPills stickyTop={0} />
            </div>
          </div>

          {/* Collapsible shutter container — state driven by classes on the
           * .menu-sticky-cluster parent (.shutter-collapsed / .shutter-hovered) */}
          <div className="menu-shutter-container">
            <div className="menu-shutter-content">
              {/* Valley curve + orbit. The SVG cuts a bowl-shape DOWNWARD out of
               * the dark cluster: cream fill at wings (sides), transparent at the
               * center dip. Category orbit is absolutely positioned inside this
               * container and its arc math (variant='valley') pushes center-
               * nodes DOWN into the dip and edge-nodes UP into the wings. */}
              <div className="menu-valley-band">
                <svg
                  className="menu-valley-svg"
                  viewBox="0 0 1440 200"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M0,0 C 260,180 1180,180 1440,0 Z" />
                </svg>
                <CategoryChainSection
                  selected={cat}
                  onSelect={setCat}
                  variant="valley"
                />
              </div>

              {/* Bottom curve SVG to round the bottom of the sticky category banner — matches top curve exactly */}
              <svg
                className="menu-sticky-bottom-svg"
                viewBox="0 0 1440 200"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M0,0 C 260,180 1180,180 1440,0 Z" />
              </svg>
            </div>
          </div>

          {/* Downward pull-down trigger button (desktop only, shown when collapsed and not hovered) */}
          {isDesktop && isCollapsed && (
            <div
              className={cn(
                "menu-shutter-trigger-wrap",
                isHovered && "opacity-0 pointer-events-none"
              )}
              onMouseEnter={() => setIsHovered(true)}
            >
              <button
                type="button"
                className="menu-shutter-trigger-btn"
                aria-label="Show filters and categories"
              >
                <ChevronDown className="size-4" />
                <span className="text-[9px] font-bold tracking-wider uppercase ml-1">Categories</span>
              </button>
            </div>
          )}
        </div>

        {/* ─── Section 3 — Products grid. Scrolls below the sticky cluster. ─── */}
        <main className="menu-products-section">
          <div ref={productsContentRef}>
            <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
              {catalog.isLoading || !mounted ? (
                <DishCardRoundGridSkeleton count={12} />
              ) : filtered.length === 0 ? (
                <p className="text-center text-[--c-cream-text-soft] py-16">
                  No dishes match your filters. Try a different combination.
                </p>
              ) : (
                <>
                  <motion.ul
                    layout
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
                  >
                    <AnimatePresence mode="popLayout">
                      {visibleDishes.map((d, i) => {
                        const cols = 4
                        const row = Math.floor(i / cols)
                        const col = i % cols
                        const delay = row * 0.5 + (cols - 1 - col) * 0.1
                        return (
                          <motion.li
                            layout
                            initial={{ opacity: 0, x: 100, y: 24, scale: 0.9, rotate: -1.5 }}
                            whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
                            viewport={{ once: false, margin: '-40px' }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{
                              duration: 0.65,
                              delay,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            key={d.id}
                            className="list-none w-full"
                          >
                            <DishCardRound dish={d} />
                          </motion.li>
                        )
                      })}
                    </AnimatePresence>
                  </motion.ul>

                  <div ref={sentinelRef} className="h-4 mt-8" aria-hidden="true" />

                  <div className="mt-8 flex flex-col items-center gap-2 text-center pb-12">
                    {hasMore ? (
                      <div className="inline-flex items-center gap-2 text-sm text-[--c-cream-text-soft]">
                        <span className="size-4 rounded-full border-2 border-[--c-primary] border-t-transparent animate-spin" aria-hidden="true" />
                        Loading more dishes…
                      </div>
                    ) : filtered.length > PAGE_SIZE ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 32 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="menu-end-card"
                      >
                        <div className="menu-end-icon-wrap">
                          <Sparkles className="size-6" />
                        </div>
                        <h3 className="menu-end-title">You've Explored the Full Menu</h3>
                        <p className="menu-end-text">
                          Our culinary team prepares every single dish fresh to your exact taste. Ready to experience the Spice Garden difference?
                        </p>
                        
                        <div className="menu-end-divider" aria-hidden="true">
                          <div className="menu-end-divider-line" />
                          <span className="menu-end-divider-star">★</span>
                          <div className="menu-end-divider-line" />
                        </div>

                        <div className="menu-end-actions">
                          <button
                            type="button"
                            className="menu-end-btn-primary"
                            onClick={() => navigate('/cart')}
                          >
                            <ShoppingCart className="size-4" />
                            VIEW YOUR CART
                            <ChevronRight className="size-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            className="menu-end-btn-secondary"
                            onClick={() => navigate('/reserve')}
                          >
                            <Calendar className="size-4" />
                            RESERVE A TABLE
                          </button>
                        </div>

                        <button
                          type="button"
                          className="menu-end-backtop"
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                          <ArrowUp className="size-3.5" />
                          BACK TO TOP
                        </button>
                      </motion.div>
                    ) : null}
                  </div>
                </>
              )}
            </ScrollReveal>
          </div>
        </main>
      </div>
    </CustomerLayout>
  )
}
