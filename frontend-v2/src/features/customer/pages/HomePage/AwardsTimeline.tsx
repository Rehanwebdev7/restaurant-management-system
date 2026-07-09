/**
 * AwardsTimeline — horizontal card strip of restaurant awards with year + event.
 * Seed content only (content/seed/awards.ts). Hidden for real tenants.
 */
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { AWARDS_SEED } from '@/features/customer/content/seed/awards'
import { SeedBadge } from '@/features/customer/content/SeedBadge'
import { useSeedMode } from '@/features/customer/content/useSeedMode'

export default function AwardsTimeline() {
  const showSeed = useSeedMode()
  if (!showSeed) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <p className="subtitle">RECOGNITION</p>
          <SeedBadge />
        </div>
        <div className="c-divider" />
        <h2 className="display text-3xl sm:text-4xl">Awards &amp; <span>Accolades</span></h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {AWARDS_SEED.map((a, i) => (
          <motion.article
            key={`${a.year}-${a.event}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="c-card p-5 text-center rounded-2xl bg-[--c-bg-elev] hover:-translate-y-1.5 transition-transform"
          >
            <div className="inline-flex size-14 rounded-full border border-[--c-accent] items-center justify-center gold-text mb-3">
              <Trophy className="size-6" />
            </div>
            <p className="display text-2xl leading-none font-bold gold-text mb-2">{a.year}</p>
            <p className="text-xs font-semibold text-[--c-text] leading-snug">{a.event}</p>
            <p className="text-[10px] uppercase tracking-widest text-[--c-text-muted] mt-2">{a.category}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
