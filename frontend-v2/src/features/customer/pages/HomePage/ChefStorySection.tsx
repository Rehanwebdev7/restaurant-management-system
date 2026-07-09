/**
 * ChefStorySection — 2-column editorial: chef photo left + quote + badge right.
 * Seed content only (see content/seed/chef.ts). Hidden for real tenants.
 */
import { motion, useReducedMotion } from 'framer-motion'
import { Award } from 'lucide-react'
import { CHEF_SEED } from '@/features/customer/content/seed/chef'
import { SeedBadge } from '@/features/customer/content/SeedBadge'
import { useSeedMode } from '@/features/customer/content/useSeedMode'

export default function ChefStorySection() {
  const showSeed = useSeedMode()
  const reduce = useReducedMotion()

  if (!showSeed) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[--c-border]">
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Photo — subtle parallax hover */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5]"
        >
          <img
            src={CHEF_SEED.photoUrl}
            alt={CHEF_SEED.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div>
              <p className="text-white/90 text-xs uppercase tracking-widest font-semibold drop-shadow">{CHEF_SEED.title}</p>
              <p className="text-white text-2xl font-bold drop-shadow-lg">{CHEF_SEED.name}</p>
            </div>
            <span className="inline-flex items-center gap-1 bg-[--c-accent] text-black px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-lg">
              <Award className="size-3" /> {CHEF_SEED.yearsOfExperience}+ yrs
            </span>
          </div>
        </motion.div>

        {/* Editorial quote */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <p className="subtitle">A WORD FROM OUR KITCHEN</p>
            <SeedBadge />
          </div>
          <div className="c-divider" />
          <h2 className="display text-3xl sm:text-4xl lg:text-5xl mb-8">
            Every plate carries <span>a memory</span>
          </h2>
          <blockquote className="text-lg lg:text-xl leading-relaxed text-[--c-text-soft] font-serif italic border-l-2 border-[--c-accent] pl-6">
            &ldquo;{CHEF_SEED.quote}&rdquo;
          </blockquote>
          <p className="mt-6 text-sm text-[--c-text-muted]">
            Signature: <span className="font-semibold text-[--c-text]">{CHEF_SEED.signatureDish}</span>
          </p>
        </motion.div>
      </div>
      {reduce ? null : null /* reduced-motion respected via `initial/animate` skip when framer detects it */}
    </section>
  )
}
