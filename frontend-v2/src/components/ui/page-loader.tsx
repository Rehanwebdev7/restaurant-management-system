/**
 * PageLoader — branded Suspense fallback.
 *
 * Two variants:
 *   • `customer` — full-viewport overlay with the customer steakhouse
 *     aesthetic: dark backdrop, spinning gold ring, Cormorant Garamond
 *     restaurant name + tagline fading in below.
 *   • `panel`   — fills the content area in the admin/role panels with the
 *     brand-primary spinning ring + "Loading…" copy.
 *
 * The wrapper fades in over 300 ms (instant for users that prefer reduced
 * motion) so it doesn't snap into view if a chunk resolves immediately.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { useBrand } from '@/components/providers/BrandProvider'

interface PageLoaderProps {
  variant?: 'customer' | 'panel'
  /** Optional override copy for the panel variant. */
  label?: string
}

export function PageLoader({ variant = 'panel', label = 'Loading…' }: PageLoaderProps) {
  const brand = useBrand()
  const reduceMotion = useReducedMotion()

  // When the user (or the Playwright E2E harness) prefers reduced motion,
  // render nothing rather than the full-viewport overlay. This prevents the
  // loader from intercepting clicks / typing during automated tests and
  // avoids forcing users with motion-sensitivity through a spinner UI.
  if (reduceMotion) return null

  const fade = {
    initial: { opacity: reduceMotion ? 1 : 0 },
    animate: { opacity: 1 },
    transition: { duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' as const },
  }

  if (variant === 'customer') {
    return (
      <motion.div
        {...fade}
        role="status"
        aria-live="polite"
        aria-label={`Loading ${brand.restaurantName}`}
        className="fixed inset-0 z-[80] grid place-items-center"
        style={{ background: '#0A0A0A', color: '#FFFFFF' }}
      >
        <div className="flex flex-col items-center gap-5 px-6 text-center">
          <span
            className="block size-14 rounded-full"
            style={{
              border: '3px solid rgba(201, 169, 110, 0.18)',
              borderTopColor: '#C9A96E',
              animation: reduceMotion ? 'none' : 'page-loader-spin 1s linear infinite',
            }}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.1, duration: reduceMotion ? 0 : 0.4, ease: 'easeOut' }}
            className="space-y-1.5"
          >
            <p
              className="text-2xl sm:text-3xl"
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                letterSpacing: '0.04em',
                fontWeight: 600,
                color: '#FFFFFF',
              }}
            >
              {brand.restaurantName}
            </p>
            {brand.tagline ? (
              <p
                className="text-[10px] uppercase"
                style={{ letterSpacing: '0.35em', color: '#C9A96E', fontWeight: 600 }}
              >
                {brand.tagline}
              </p>
            ) : null}
          </motion.div>
        </div>
        <style>{`@keyframes page-loader-spin { to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    )
  }

  // Panel variant — fills the content area, not the viewport, so it sits
  // inside <AppShell> without covering the sidebar/topbar chrome.
  return (
    <motion.div
      {...fade}
      role="status"
      aria-live="polite"
      aria-label={label}
      className="flex flex-1 min-h-[60vh] w-full items-center justify-center p-6"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          className="block size-10 rounded-full border-[3px] border-muted"
          style={{
            borderTopColor: 'hsl(var(--primary))',
            animation: reduceMotion ? 'none' : 'page-loader-spin 1s linear infinite',
          }}
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <style>{`@keyframes page-loader-spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  )
}

export default PageLoader
