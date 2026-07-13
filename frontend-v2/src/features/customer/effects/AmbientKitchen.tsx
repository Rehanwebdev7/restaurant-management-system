import { useMediaQuery } from '@/hooks/use-media-query'
import { useReducedMotion } from 'framer-motion'

/**
 * AmbientKitchen — fixed-layer floating atmosphere for the customer surface.
 * Three particle types, pure CSS driven:
 *  • 8 gold "bokeh" candle-glow orbs drifting slowly (restaurant candle-light)
 *  • 5 warm steam wisps rising from the bottom viewport edge
 *  • 24 gold sparkle particles falling top → bottom with sway
 *    (luxury candlelit-sparkle atmosphere)
 *
 * Mounts once in CustomerLayout. Desktop-only, reduced-motion respected.
 */

// Size classes cycled per particle for depth variety
const SIZE_CLASSES = ['', 'c-gold-particle--sm', 'c-gold-particle--md', 'c-gold-particle--lg']

export default function AmbientKitchen() {
  const isCoarse = useMediaQuery('(pointer: coarse)')
  const reduce = useReducedMotion()
  if (isCoarse || reduce) return null

  return (
    <>
      <div className="c-ambient-kitchen" aria-hidden="true">
        {/* Gold candle-glow bokeh */}
        <span className="c-ambient-bokeh c-ambient-bokeh--1" />
        <span className="c-ambient-bokeh c-ambient-bokeh--2" />
        <span className="c-ambient-bokeh c-ambient-bokeh--3" />
        <span className="c-ambient-bokeh c-ambient-bokeh--4" />
        <span className="c-ambient-bokeh c-ambient-bokeh--5" />
        <span className="c-ambient-bokeh c-ambient-bokeh--6" />
        <span className="c-ambient-bokeh c-ambient-bokeh--7" />
        <span className="c-ambient-bokeh c-ambient-bokeh--8" />
        {/* Kitchen steam wisps rising */}
        <span className="c-ambient-steam c-ambient-steam--1" />
        <span className="c-ambient-steam c-ambient-steam--2" />
        <span className="c-ambient-steam c-ambient-steam--3" />
        <span className="c-ambient-steam c-ambient-steam--4" />
        <span className="c-ambient-steam c-ambient-steam--5" />
      </div>
      {/* Falling gold sparkle particles — luxury candlelit atmosphere */}
      <div className="c-gold-dust" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className={`c-gold-particle ${SIZE_CLASSES[i % SIZE_CLASSES.length]}`}
          />
        ))}
      </div>
    </>
  )
}
