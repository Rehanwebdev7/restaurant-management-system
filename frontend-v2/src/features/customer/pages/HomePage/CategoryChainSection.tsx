import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useReducedMotion, useMotionValue } from 'framer-motion'
import { Soup } from 'lucide-react'
import { CATEGORIES } from '@/features/customer/catalog'
import { cn } from '@/lib/utils'

export interface OrbitItem {
  id: string | null
  label: string
  img?: string
  /** Backend-supplied description — shown as tooltip on hover. */
  description?: string | null
  /** Client-computed count of items in this category. */
  itemCount?: number
}

const DEFAULT_ORBIT_ITEMS: OrbitItem[] = [
  { id: null, label: 'ALL' },
  ...CATEGORIES.map((c) => ({ id: c.id, label: c.name, img: c.img })),
]

type OrbitVariant = 'dome' | 'valley'

interface Props {
  selected: string | null
  onSelect: (id: string | null) => void
  /**
   * 'dome' (default, HomePage) — center nodes at PEAK, edges drop DOWN.
   * 'valley' (MenuPage) — center nodes at BOTTOM of valley, edges rise UP.
   */
  variant?: OrbitVariant
  /**
   * Backend-driven category list (with item counts + descriptions). When
   * absent or empty, falls back to hardcoded CATEGORIES so demo mode still
   * renders. Always prepend an "ALL" node in the caller when using this.
   */
  items?: OrbitItem[]
}

interface OrbitNodeWrapperProps {
  index: number
  trackX: any
  dimensions: { vw: number; nodeWidth: number; gap: number; paddingLeft: number }
  reduce: boolean
  variant: OrbitVariant
  children: React.ReactNode
}

function OrbitNodeWrapper({ index, trackX, dimensions, reduce, variant, children }: OrbitNodeWrapperProps) {
  const y = useTransform(trackX, (xVal: number) => {
    if (reduce) return 0

    // Position of node relative to the track's content start
    const nodeCenterRel = dimensions.paddingLeft + index * (dimensions.nodeWidth + dimensions.gap) + dimensions.nodeWidth / 2

    // Viewport X position is: LeftPaddingOfStrip + NodeCenterRel + current track transform xVal
    const nodeCenterX = 0.04 * dimensions.vw + nodeCenterRel + xVal

    const norm = nodeCenterX / dimensions.vw
    const dist = Math.min(1, Math.abs(norm - 0.5) * 2)

    if (variant === 'valley') {
      // Band height matches CSS clamp(70px, 6.5vw, 85px) desktop, 65px mobile.
      const bandHeight = dimensions.vw < 640 ? 65 : Math.min(85, Math.max(70, dimensions.vw * 0.065))
      // SVG curve dips ~55% into band.
      const arcHeight = bandHeight * 0.55
      const nodeCenterAdj = dimensions.nodeWidth / 2
      // KEY: clamp to >= 0 so edge circles NEVER rise above the band top into
      // the dark filter bar. Only center circles dip DOWN into the valley.
      return Math.max(0, (1 - dist * dist) * arcHeight - nodeCenterAdj)
    } else {
      const arcHeight = dimensions.vw < 640 ? 70 : Math.min(110, Math.max(80, dimensions.vw * 0.07))
      const magnitude = dist * dist * arcHeight
      return magnitude
    }
  })

  return (
    <motion.div
      className="orbit-node-wrap"
      style={{ y }}
    >
      {children}
    </motion.div>
  )
}

export default function CategoryChainSection({ selected, onSelect, variant = 'dome', items }: Props) {
  const reduce = useReducedMotion()
  const stripRef = useRef<HTMLDivElement | null>(null)
  const isDragging = useRef(false)

  // Prefer caller-supplied backend-driven items; fall back to hardcoded
  // list when demo mode / offline / not yet resolved. This keeps SaaS
  // tenants seeing THEIR real categories while dev demos still render.
  const ORBIT_ITEMS = useMemo<OrbitItem[]>(
    () => (items && items.length > 1 ? items : DEFAULT_ORBIT_ITEMS),
    [items],
  )

  const [dimensions, setDimensions] = useState(() => {
    if (typeof window === 'undefined') return { vw: 1024, nodeWidth: 76, gap: 40, paddingLeft: 60 }
    const vw = window.innerWidth
    const isMobile = vw < 640
    const nodeWidth = isMobile ? 60 : Math.min(76, Math.max(60, vw * 0.075))
    const gap = isMobile ? 20 : Math.min(48, Math.max(24, vw * 0.03))
    const paddingLeft = vw * 0.06
    return { vw, nodeWidth, gap, paddingLeft }
  })

  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth
      const isMobile = vw < 640
      const nodeWidth = isMobile ? 60 : Math.min(76, Math.max(60, vw * 0.075))
      const gap = isMobile ? 20 : Math.min(48, Math.max(24, vw * 0.03))
      const paddingLeft = vw * 0.06
      setDimensions({ vw, nodeWidth, gap, paddingLeft })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const numItems = ORBIT_ITEMS.length
  const trackWidth = useMemo(() => {
    return 2 * dimensions.paddingLeft + numItems * dimensions.nodeWidth + (numItems - 1) * dimensions.gap
  }, [dimensions, numItems])

  // Center alignment scroll range boundary coordinates
  const startX = useMemo(() => {
    return reduce ? 0 : (dimensions.vw - trackWidth) / 2 + dimensions.vw * 0.22
  }, [dimensions.vw, trackWidth, reduce])

  const endX = useMemo(() => {
    return reduce ? 0 : (dimensions.vw - trackWidth) / 2 - dimensions.vw * 0.22
  }, [dimensions.vw, trackWidth, reduce])

  const trackX = useMotionValue(startX)

  // Sync dimensions update with MotionValue position
  useEffect(() => {
    trackX.set(startX)
  }, [startX, trackX])

  const { scrollYProgress } = useScroll({
    target: stripRef,
    offset: ['start end', 'end start'],
  })

  // Synchronize page vertical scroll to trackX
  useEffect(() => {
    if (reduce) return
    const unsubscribe = scrollYProgress.onChange((p) => {
      // Do not fight with user horizontal drag
      if (isDragging.current) return
      
      const targetX = startX + p * (endX - startX)
      trackX.set(targetX)
    })
    return () => unsubscribe()
  }, [scrollYProgress, startX, endX, trackX, reduce])

  const activeIdx = ORBIT_ITEMS.findIndex((n) => n.id === selected)

  return (
    <div ref={stripRef} className="orbit-strip" data-variant={variant} aria-label="Category filter">
      <motion.div 
        className="orbit-track" 
        drag="x"
        dragConstraints={{
          left: Math.min(0, dimensions.vw - trackWidth - 100),
          right: Math.max(100, dimensions.vw * 0.6)
        }}
        onDragStart={() => { isDragging.current = true }}
        onDragEnd={() => { isDragging.current = false }}
        style={{ x: trackX, cursor: 'grab' }}
        whileTap={{ cursor: 'grabbing' }}
      >
        {ORBIT_ITEMS.map((item, i) => {
          const isActive = item.id === selected
          const isAll = item.id === null
          return (
            <OrbitNodeWrapper
              key={item.label}
              index={i}
              trackX={trackX}
              dimensions={dimensions}
              reduce={!!reduce}
              variant={variant}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-pressed={isActive}
                aria-label={
                  item.itemCount != null
                    ? `Filter by ${item.label} (${item.itemCount} dishes)`
                    : `Filter by ${item.label}`
                }
                title={item.description ?? undefined}
                className={cn(
                  'orbit-node',
                  isAll && 'orbit-node--all',
                  isActive && 'orbit-node--active',
                )}
              >
                {isAll ? (
                  <Soup aria-hidden="true" />
                ) : (
                  <img
                    src={item.img}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                )}
                {/* Item-count pill — only shown when caller supplied a real
                 * count (backend-driven). Zero-count is still rendered as a
                 * factual signal ("no dishes right now"). */}
                {item.itemCount != null ? (
                  <span className="orbit-node-count" aria-hidden="true">
                    {item.itemCount}
                  </span>
                ) : null}
              </button>
              <span className="orbit-label">{item.label}</span>
            </OrbitNodeWrapper>
          )
        })}
      </motion.div>
      <div className="orbit-dots" role="tablist" aria-label="Category pagination">
        {ORBIT_ITEMS.map((item, i) => {
          const isActive = activeIdx === -1 ? i === 0 : i === activeIdx
          return (
            <button
              key={`dot-${item.label}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Show ${item.label}`}
              onClick={() => onSelect(item.id)}
              className={cn('orbit-dot', isActive && 'orbit-dot--active')}
            />
          )
        })}
      </div>
    </div>
  )
}
