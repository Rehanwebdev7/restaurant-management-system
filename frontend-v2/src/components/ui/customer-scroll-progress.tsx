import { motion, useScroll, useSpring } from 'framer-motion'

/**
 * Top-of-viewport scroll progress bar styled for the customer site
 * (gold accent over the dark steakhouse theme). Same visual idiom as
 * Apple / Stripe / Linear sites — gives the page a real "scroll-tracked"
 * feel and signals depth without competing with content.
 *
 * Uses framer-motion's reactive scrollYProgress + spring smoothing so the
 * bar glides instead of jittering on every wheel tick.
 */
export function CustomerScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  })

  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 right-0 top-0 z-[100] h-[3px] origin-left pointer-events-none"
      style={{
        scaleX,
        background:
          'linear-gradient(90deg, transparent, var(--c-accent) 25%, var(--c-accent) 75%, transparent)',
      }}
    />
  )
}

export default CustomerScrollProgress
