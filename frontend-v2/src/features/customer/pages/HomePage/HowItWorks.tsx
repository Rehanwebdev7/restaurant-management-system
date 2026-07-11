import { motion, useReducedMotion } from 'framer-motion'
import { UtensilsCrossed, ShoppingBag, Sparkles } from 'lucide-react'

/**
 * How It Works — 3-step process with animated icons + connecting line.
 * Neutral copy that reads for both dine-in and delivery orders.
 * All content is generic hospitality — no per-tenant data required.
 */

interface Step {
  eyebrow: string
  title: string
  description: string
  Icon: typeof UtensilsCrossed
}

const STEPS: Step[] = [
  {
    eyebrow: 'STEP ONE',
    title: 'Choose',
    description:
      'Browse the menu, save favourites, and let the kitchen know exactly how you like your plates.',
    Icon: UtensilsCrossed,
  },
  {
    eyebrow: 'STEP TWO',
    title: 'Order',
    description:
      'Reserve a table or send your basket to the kitchen — pay securely and receive live updates.',
    Icon: ShoppingBag,
  },
  {
    eyebrow: 'STEP THREE',
    title: 'Enjoy',
    description:
      'Dishes arrive fresh — at your table or your doorstep — the way our Chef intended them.',
    Icon: Sparkles,
  },
]

export default function HowItWorks() {
  const reduce = useReducedMotion()

  return (
    <section className="c-section-tinted relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12 sm:mb-16">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="subtitle"
        >
          A SIMPLE, CONSIDERED PROCESS
        </motion.p>
        <div className="c-divider" />
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.65, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="display text-3xl sm:text-4xl lg:text-5xl"
        >
          How it <span>works</span>
        </motion.h2>
      </div>

      <div className="relative">
        {/* Horizontal connector line — desktop only, subtle */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute top-14 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-[var(--c-accent,#C9A96E)] to-transparent opacity-40"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-14 relative">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-60px' }}
              transition={{
                duration: 0.75,
                delay: i * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-center group"
            >
              {/* Icon circle with hover animation — icon rotates + number
               * badge pops. Two coordinated motions read as intentional
               * (not busy) and reward hover interaction. */}
              <motion.div
                whileHover={reduce ? undefined : { scale: 1.06 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="mx-auto inline-flex size-24 sm:size-28 items-center justify-center rounded-full border border-[var(--c-accent,#C9A96E)] bg-white/85 backdrop-blur-sm shadow-lg mb-6 relative z-[1]"
                style={{ color: 'var(--c-accent, #C9A96E)' }}
              >
                <motion.div
                  whileHover={reduce ? undefined : { rotate: -8 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                  className="pointer-events-none"
                >
                  <step.Icon className="size-10 sm:size-12" aria-hidden="true" />
                </motion.div>
                {/* Number badge — pops on direct hover so any pointer over
                 * the badge or its parent circle triggers the animation. */}
                <motion.span
                  aria-hidden="true"
                  className="absolute -bottom-2 -right-2 size-8 rounded-full bg-[var(--c-accent,#C9A96E)] text-white font-extrabold text-sm flex items-center justify-center shadow-md"
                  whileHover={reduce ? undefined : { scale: 1.18 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 12 }}
                >
                  {i + 1}
                </motion.span>
              </motion.div>
              <p className="subtitle text-[10px] tracking-[0.24em] mb-2">{step.eyebrow}</p>
              <h3 className="display text-2xl sm:text-3xl mb-3">{step.title}</h3>
              <p className="text-sm text-[var(--c-cream-text-soft,#6B5B45)] leading-relaxed max-w-[26ch] mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      </div>
    </section>
  )
}
