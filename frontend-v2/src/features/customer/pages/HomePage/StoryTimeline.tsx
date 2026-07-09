/**
 * StoryTimeline — brand milestones as an alternating photo-quote layout.
 * Seed content only (content/seed/story.ts). Hidden for real tenants.
 */
import { motion } from 'framer-motion'
import { STORY_SEED } from '@/features/customer/content/seed/story'
import { SeedBadge } from '@/features/customer/content/SeedBadge'
import { useSeedMode } from '@/features/customer/content/useSeedMode'

export default function StoryTimeline() {
  const showSeed = useSeedMode()
  if (!showSeed) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-14">
        <div className="flex items-center justify-center gap-3">
          <p className="subtitle">OUR JOURNEY</p>
          <SeedBadge />
        </div>
        <div className="c-divider" />
        <h2 className="display text-3xl sm:text-4xl lg:text-5xl">Two decades of <span>flavour</span></h2>
      </div>

      <div className="space-y-16 lg:space-y-24">
        {STORY_SEED.map((s, i) => {
          const flip = i % 2 === 1
          return (
            <motion.div
              key={s.year}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className={`grid md:grid-cols-2 gap-8 lg:gap-14 items-center ${flip ? 'md:[direction:rtl]' : ''}`}
            >
              <div className="rounded-3xl overflow-hidden aspect-[4/3] shadow-xl md:[direction:ltr]">
                <img
                  src={s.imageUrl}
                  alt={s.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="md:[direction:ltr]">
                <p className="display text-6xl lg:text-7xl font-bold gold-text opacity-40 leading-none mb-4">{s.year}</p>
                <h3 className="display text-2xl lg:text-3xl mb-4">{s.title}</h3>
                <p className="text-base text-[--c-text-soft] leading-relaxed">{s.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
