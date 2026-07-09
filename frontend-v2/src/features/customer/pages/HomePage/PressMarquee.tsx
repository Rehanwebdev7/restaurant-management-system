/**
 * PressMarquee — infinite scroll of press mentions with quote.
 * Seed content only (content/seed/press.ts). Hidden for real tenants.
 */
import { PRESS_SEED } from '@/features/customer/content/seed/press'
import { SeedBadge } from '@/features/customer/content/SeedBadge'
import { useSeedMode } from '@/features/customer/content/useSeedMode'

export default function PressMarquee() {
  const showSeed = useSeedMode()
  if (!showSeed) return null

  // Duplicate items so the scroll animation loops seamlessly.
  const items = [...PRESS_SEED, ...PRESS_SEED]

  return (
    <section className="py-10 border-y border-[--c-border] bg-[--c-bg-elev]/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-center gap-3">
          <p className="subtitle text-center">FEATURED IN</p>
          <SeedBadge />
        </div>
      </div>
      <div className="press-marquee-track flex gap-10 whitespace-nowrap animate-marquee hover:[animation-play-state:paused]">
        {items.map((p, i) => (
          <div key={`${p.publication}-${i}`} className="inline-flex items-center gap-3 shrink-0">
            <span className="display text-lg lg:text-xl font-bold gold-text tracking-wide">{p.publication}</span>
            <span className="text-sm text-[--c-text-soft] italic hidden md:inline">&ldquo;{p.quote}&rdquo;</span>
            <span aria-hidden className="text-[--c-accent] text-2xl">✦</span>
          </div>
        ))}
      </div>
    </section>
  )
}
