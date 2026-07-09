/**
 * FAQAccordion — expandable Q&A list.
 * Seed content only (content/seed/faq.ts). Hidden for real tenants.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { FAQ_SEED } from '@/features/customer/content/seed/faq'
import { SeedBadge } from '@/features/customer/content/SeedBadge'
import { useSeedMode } from '@/features/customer/content/useSeedMode'
import { cn } from '@/lib/utils'

export default function FAQAccordion() {
  const showSeed = useSeedMode()
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  if (!showSeed) return null

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3">
          <p className="subtitle">GOOD TO KNOW</p>
          <SeedBadge />
        </div>
        <div className="c-divider" />
        <h2 className="display text-3xl sm:text-4xl">Frequently Asked <span>Questions</span></h2>
      </div>

      <div className="space-y-3">
        {FAQ_SEED.map((f, i) => {
          const isOpen = openIdx === i
          return (
            <motion.div
              key={f.question}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="border border-[--c-border] rounded-2xl bg-[--c-bg-elev] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-[--c-accent]/5 transition-colors"
              >
                <span className="text-sm sm:text-base font-semibold text-[--c-text]">{f.question}</span>
                <Plus
                  className={cn(
                    'size-5 shrink-0 gold-text transition-transform duration-300',
                    isOpen && 'rotate-45',
                  )}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-[--c-text-soft] leading-relaxed">{f.answer}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
