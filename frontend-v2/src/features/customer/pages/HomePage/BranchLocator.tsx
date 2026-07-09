import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { MapPin, Phone, ArrowRight, Navigation } from 'lucide-react'
import { useCustomerBranches } from '@/api/queries/customer'
import { useBrand } from '@/components/providers/BrandProvider'

/**
 * BranchLocator — showcases every branch the tenant has published. Left
 * column: a light cream map preview embedded via OpenStreetMap (bare
 * iframe, no external SDK weight). Right column: selectable cards with
 * name, address, phone, and directions link.
 *
 * SaaS-safe: entirely powered by `/api/customer/restaurant_branch/public/all`
 * — no seed content. Renders nothing when no branches are known.
 *
 * OSM embed vs Google Maps: OSM has zero API-key setup and loads instantly.
 * When the tenant later ships `googleMapEmbed`, that supersedes.
 */

function osmEmbedUrl(lat: number, lng: number, zoom = 14): string {
  const bbox = `${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}&zoom=${zoom}`
}

function directionsUrl(lat: number, lng: number, name: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`
}

export default function BranchLocator() {
  const navigate = useNavigate()
  const brand = useBrand()
  const branchesQuery = useCustomerBranches()
  const reduce = useReducedMotion()

  const branches = useMemo(() => {
    const list = branchesQuery.data ?? []
    return list.filter((b) => b.latitude != null && b.longitude != null)
  }, [branchesQuery.data])

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const active = branches.find((b) => b.id === selectedId) ?? branches[0]

  // If tenant's branding shipped a Google Maps embed URL, prefer that over OSM.
  const embedUrl = useMemo(() => {
    if (brand.googleMapEmbed) return brand.googleMapEmbed
    if (active && active.latitude != null && active.longitude != null) {
      return osmEmbedUrl(active.latitude, active.longitude)
    }
    return null
  }, [brand.googleMapEmbed, active])

  if (!active) return null

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="text-center mb-12 sm:mb-14">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="subtitle"
        >
          FIND US NEAR YOU
        </motion.p>
        <div className="c-divider" />
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.65, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="display text-3xl sm:text-4xl lg:text-5xl"
        >
          {branches.length > 1 ? (
            <>Our <span>Locations</span></>
          ) : (
            <>Visit <span>Us</span></>
          )}
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Map preview */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, margin: '-60px' }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl shadow-xl aspect-[4/3] lg:aspect-auto lg:min-h-[420px]"
        >
          {embedUrl ? (
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={`Map — ${active.branchName}`}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="w-full h-full bg-[var(--c-bg-elev,#F5EFDA)] flex items-center justify-center text-[var(--c-cream-text-soft,#6B5B45)]">
              <div className="text-center px-6">
                <MapPin className="size-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Location coming soon</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Branch cards */}
        <div className="space-y-3 sm:space-y-4">
          {branches.map((b, i) => {
            const isActive = active?.id === b.id
            return (
              <motion.button
                key={b.id}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={reduce ? undefined : { y: -3 }}
                onClick={() => setSelectedId(b.id)}
                className={`w-full text-left rounded-2xl p-5 sm:p-6 border transition-all ${
                  isActive
                    ? 'border-[var(--c-accent,#C9A96E)] bg-[var(--c-bg-elev,#FFFDF6)] shadow-lg'
                    : 'border-[var(--c-border)] bg-white/60 hover:border-[var(--c-accent,#C9A96E)] hover:shadow-md'
                }`}
                aria-pressed={isActive}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="subtitle text-[10px] mb-1">
                      {b.city ?? 'BRANCH'}
                    </p>
                    <h3 className="display text-lg sm:text-xl leading-tight">
                      {b.branchName}
                    </h3>
                  </div>
                  {isActive ? (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.2em] gold-text">
                      <span className="size-1.5 rounded-full bg-[var(--c-accent,#C9A96E)] animate-pulse" />
                      Selected
                    </span>
                  ) : null}
                </div>

                <div className="space-y-1.5 text-[13px] text-[var(--c-cream-text-soft,#6B5B45)]">
                  {b.addressLine1 ? (
                    <p className="flex items-start gap-2">
                      <MapPin className="size-3.5 mt-0.5 shrink-0 opacity-70" aria-hidden />
                      <span>{b.addressLine1}{b.city ? `, ${b.city}` : ''}</span>
                    </p>
                  ) : null}
                  {b.phone ? (
                    <p className="flex items-center gap-2">
                      <Phone className="size-3.5 shrink-0 opacity-70" aria-hidden />
                      <a
                        href={`tel:${b.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:gold-text"
                      >
                        {b.phone}
                      </a>
                    </p>
                  ) : null}
                </div>

                {isActive ? (
                  <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-[0.2em]">
                    {b.latitude != null && b.longitude != null ? (
                      <a
                        href={directionsUrl(b.latitude, b.longitude, b.branchName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 gold-text hover:underline"
                      >
                        <Navigation className="size-3.5" aria-hidden />
                        Directions
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/contact')
                      }}
                      className="inline-flex items-center gap-1.5 gold-text hover:underline"
                    >
                      Reserve <ArrowRight className="size-3.5" aria-hidden />
                    </button>
                  </div>
                ) : null}
              </motion.button>
            )
          })}

          {branches.length > 2 ? (
            <button
              type="button"
              onClick={() => navigate('/locations')}
              className="w-full text-center pt-3 text-[11px] font-bold uppercase tracking-[0.24em] gold-text hover:underline inline-flex items-center justify-center gap-1"
            >
              View all {branches.length} branches <ArrowRight className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
