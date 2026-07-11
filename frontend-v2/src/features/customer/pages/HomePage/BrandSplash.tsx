import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useBrand } from '@/components/providers/BrandProvider'

/**
 * BrandSplash — full-screen brand reveal shown ONCE per browser session.
 * On first visit the site fades in from a dark screen with the restaurant
 * name in Cormorant serif + gold hairline. After ~2s the whole overlay
 * fades out and the actual page is revealed underneath.
 *
 * Session-flag (not localStorage) so a normal reload during a session
 * skips it; a fresh session (or new tab that isn't restored) shows it.
 */

const SESSION_KEY = 'customer_brand_splash_seen'
const TOTAL_MS = 2100

export default function BrandSplash() {
  const brand = useBrand()
  const reduce = useReducedMotion()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (reduce) return
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(SESSION_KEY) === '1') return
    sessionStorage.setItem(SESSION_KEY, '1')
    setShow(true)
    const t = window.setTimeout(() => setShow(false), TOTAL_MS)
    return () => window.clearTimeout(t)
  }, [reduce])

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="brand-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, #0f0f0f 0%, #000 90%)' }}
          aria-hidden="true"
        >
          <div className="text-center px-6">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-[9px] sm:text-[10px] font-extrabold tracking-[0.4em] uppercase mb-5"
              style={{ color: 'var(--c-accent, #C9A96E)' }}
            >
              WELCOME TO
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-tight"
            >
              {brand.restaurantName}
            </motion.h1>
            {/* Gold hairline trace */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-6 h-px w-24 sm:w-32 origin-center"
              style={{
                background:
                  'linear-gradient(90deg, transparent, var(--c-accent, #C9A96E), transparent)',
              }}
            />
            {brand.tagline ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.32em] mt-5 text-white/70"
              >
                {brand.tagline}
              </motion.p>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
