import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Star, Award, ChefHat, Leaf,
  Calendar, ShoppingBag, Clock, ChevronDown, MapPin
} from 'lucide-react'
import { DateField } from '@/components/ui/date-field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import CustomerLayout, { HeroSection } from '@/features/customer/CustomerLayout'
import { cn } from '@/lib/utils'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { CountUp } from '@/components/ui/count-up'
import { useMounted } from '@/hooks/use-mounted'
import { toast } from '@/lib/toast'
import { DocumentTitle } from '@/lib/seo/document-title'
import { useBrand } from '@/components/providers/BrandProvider'
import {
  HERO_IMAGES, useCart, useCustomerCatalog,
  useSelectedBranchId,
} from '@/features/customer/catalog'
import { useCustomerBranches, useCustomerSliders } from '@/api/queries/customer'
import { submitPublicReservation } from '@/api/services/customer'
import ReservationWizard from '@/features/customer/pages/HomePage/ReservationWizard'
import GallerySlider from '@/features/customer/pages/HomePage/GallerySlider'
import ChefSignatures from '@/features/customer/pages/HomePage/ChefSignatures'
import AwardsTimeline from '@/features/customer/pages/HomePage/AwardsTimeline'
import PressMarquee from '@/features/customer/pages/HomePage/PressMarquee'
import StoryTimeline from '@/features/customer/pages/HomePage/StoryTimeline'
import FAQAccordion from '@/features/customer/pages/HomePage/FAQAccordion'
import NewsletterSection from '@/features/customer/pages/HomePage/NewsletterSection'
import SignatureExperience from '@/features/customer/pages/HomePage/SignatureExperience'
import HowItWorks from '@/features/customer/pages/HomePage/HowItWorks'
import BrandStoryShowcase from '@/features/customer/pages/HomePage/BrandStoryShowcase'
import LifestyleBanner from '@/features/customer/pages/HomePage/LifestyleBanner'
import BranchLocator from '@/features/customer/pages/HomePage/BranchLocator'
import { TESTIMONIALS_SEED } from '@/features/customer/content/seed/testimonials'
import { SeedBadge } from '@/features/customer/content/SeedBadge'
import { useSeedMode } from '@/features/customer/content/useSeedMode'
import '@/styles/customer.css'

export function HomePage() {
  const navigate = useNavigate()
  const brand = useBrand()
  const catalog = useCustomerCatalog()
  const { branchId } = useSelectedBranchId()
  const slidersQ = useCustomerSliders(branchId)
  const mounted = useMounted(200)

  // Preload hero fallback image so it's ready before framer motion needs it.
  // Backend sliders (when present) win, but the fallback is always the LCP
  // candidate for a fresh tenant with no slider content.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = HERO_IMAGES.home
    link.fetchPriority = 'high'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])
  // Silence "unused var" — some downstream sections still gate on `catalog`
  // via useCustomerCatalog() calls internally; the ref here is only for
  // consistency with prior code and future additions.
  void catalog
  void mounted

  const heroImages = useMemo(
    () => (slidersQ.data && slidersQ.data.length > 0 ? slidersQ.data.map((s) => s.imageUrl) : []),
    [slidersQ.data],
  )

  const cart = useCart()
  const cartTotalQty = useMemo(() => cart.items.reduce((a, c) => a + c.qty, 0), [cart.items])

  return (
    <CustomerLayout transparent>
      <DocumentTitle
        title={`${brand.restaurantName} — ${brand.tagline || 'Reserve a Table or Order Online'}`}
        description={brand.aboutUs || `Reserve a table or order online from ${brand.restaurantName}.`}
      />

      {/* Premium Hero Rotator Reveal — image cycling only (video removed
       * per user feedback). Backend sliders take precedence via heroImages. */}
      <HeroSection
        bg={HERO_IMAGES.home}
        subtitle="CURATED · CHEF-CRAFTED · UNFORGETTABLE"
        titleA="A Table Set For"
        titleAccent="Timeless Craft"
        description="Every plate tells a story — of craft, of care, of moments savored slowly. Welcome to your table."
        primaryCta="ORDER NOW"
        primaryOnClick={() => navigate('/menu')}
        secondaryCta="RESERVE A TABLE"
        secondaryOnClick={() => navigate('/contact')}
        showRotator
        heroImages={heroImages}
        withCurve
      />

      {/* Trust signals strip (P4.30/31/32) — aggregate rating, branch
       * count, FSSAI. Renders only when the underlying data is real. */}
      <TrustSignalsStrip />

      {/* Chef's Signatures — replaces the cream section + CategoryChain orbit
       * + full Popular Dishes grid (2026-07-10, per user request).
       * Real backend `isRecommended` items with editorial 4-card layout +
       * "Explore The Full Menu" CTA. Full menu still lives on /menu. */}
      <ChefSignatures />

      {/* Auto-scrolling gallery strip — horizontal linked to vertical page scroll.
       * Paper wash — subtle editorial texture, no color shift. */}
      <div className="c-wash-paper">
        <ScrollReveal><GallerySlider /></ScrollReveal>
      </div>

      {/* Brand story showcase — editorial restaurant identity anchor.
       * Sage wash — soft freshness for the story chapter. */}
      <div className="c-wash-sage">
        <BrandStoryShowcase />
      </div>

      {/* Three ways to enjoy — Dine / Delivery / Reserve
       * Espresso wrap removed 2026-07-13 — Lazy Dog reference commits
       * to all-cream flow. Rhythm driven by warm wash tints
       * (sage/paper/terracotta), not dark chapter breaks. */}
      <SignatureExperience />

      {/* Cinematic Ken Burns lifestyle separator (full-bleed image, no wash) */}
      <LifestyleBanner
        eyebrow="THE ART OF HOSPITALITY"
        quote="Great food is memory in the making — cooked with intention, served with warmth, and shared without hurry."
        attribution="Our Kitchen Philosophy"
      />

      {/* How It Works — 3-step editorial. Terracotta wash for warm handoff. */}
      <div className="c-wash-terracotta">
        <HowItWorks />
      </div>

      {/* Why Dine with Us Segment */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[--c-border]">
        <div className="text-center mb-12">
          <p className="subtitle">WHY DINE WITH US</p>
          <div className="c-divider" />
          <h2 className="display text-3xl sm:text-4xl">Crafted with <span>Heart</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            /* Copy neutralized 2026-07-13 (P1.10) — earlier claims
             * ("Award-Winning Recipes") would be a lie for a fresh tenant
             * with no such credential. These lines are safe hospitality
             * language applicable to any restaurant. */
            { Icon: ChefHat, title: 'Made With Care', text: 'Every plate prepared fresh by our kitchen team, order after order.' },
            { Icon: Leaf, title: 'Ingredients That Matter', text: 'Sourced with intention — because good food starts with good ingredients.' },
            { Icon: Award, title: 'Warm Hospitality', text: 'Come as a guest, leave feeling looked after. That is the promise at the table.' },
          ].map(({ Icon, title, text }, i) => (
            <ScrollReveal key={title} delay={i * 0.08} className="c-card p-8 text-center group hover:-translate-y-1.5 transition-transform duration-300 rounded-2xl bg-[--c-bg-elev]">
              <div className="inline-flex size-16 rounded-full border border-[--c-accent] items-center justify-center gold-text mb-5 group-hover:bg-[--c-accent] group-hover:text-black transition-colors">
                <Icon className="size-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">{title}</h3>
              <p className="text-sm text-[--c-text-soft] leading-relaxed">{text}</p>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* Editorial content stack — new sections lower on the page, each
       * self-gates on `useSeedMode()` so real tenants see only their own data.
       * ChefStorySection removed 2026-07-13 (user: hardcoded chef bio hard to
       * maintain per-tenant, prefer removing over faking). */}
      <div className="c-wash-paper">
        <ScrollReveal><AwardsTimeline /></ScrollReveal>
      </div>
      <PressMarquee />
      <div className="c-wash-sage">
        <ScrollReveal><StoryTimeline /></ScrollReveal>
      </div>
      <div className="c-wash-terracotta">
        <ScrollReveal><TestimonialsSection /></ScrollReveal>
      </div>
      <StatsSection />
      <ScrollReveal><FAQAccordion /></ScrollReveal>
      <ScrollReveal><ReservationCallToActionSection /></ScrollReveal>
      <BranchLocator />
      <ScrollReveal><NewsletterSection /></ScrollReveal>
      {/* Follow-Us card (replaces the deleted Instagram grid). Renders only
       * when the tenant has at least one social link on their branding.
       * Zero-lie SaaS-safe. */}
      <FollowUsCard />

      {/* Animated Floating Cart Action Bubble */}
      <AnimatePresence>
        {cartTotalQty > 0 && (
          <motion.button
            initial={{ scale: 0, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, y: 50, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/cart')}
            className="fixed bottom-20 right-6 z-50 bg-[var(--c-accent)] text-[var(--c-button-primary-fg)] p-4 rounded-full shadow-2xl flex items-center gap-2 cursor-pointer md:bottom-8"
            aria-label={`View your shopping cart with ${cartTotalQty} items`}
          >
            <div className="relative">
              <ShoppingBag className="size-6" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartTotalQty}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Checkout</span>
          </motion.button>
        )}
      </AnimatePresence>
    </CustomerLayout>
  )
}

/**
 * TrustSignalsStrip — three signal-of-legitimacy pills that a real customer
 * scans for in the first 5 seconds. Every pill is derived from ACTUAL
 * backend data, so nothing fake ships:
 *   • Aggregate rating (avg dish rating × total review count)
 *   • Branch count ("3 branches in Mumbai")
 *   • FSSAI Lic. verified
 * Any pill with missing data silently hides. If all hide, the strip
 * returns null so we don't leave an awkward empty band.
 */
function TrustSignalsStrip() {
  const brand = useBrand()
  const catalog = useCustomerCatalog()
  const { data: branches } = useCustomerBranches()

  const aggRating = useMemo(() => {
    const rated = catalog.dishes.filter((d) => d.reviewCount > 0)
    if (rated.length === 0) return null
    const totalReviews = rated.reduce((s, d) => s + d.reviewCount, 0)
    const weighted = rated.reduce((s, d) => s + d.rating * d.reviewCount, 0)
    if (totalReviews === 0) return null
    return { avg: weighted / totalReviews, count: totalReviews }
  }, [catalog.dishes])

  const branchCount = (branches ?? []).length
  const firstCity = (branches ?? [])[0]?.city ?? null
  const showFssai = Boolean(brand.fssaiNumber)

  // Delivery ETA approximation — max prep across dishes + 25 min average
  // rider time. Approximation acceptable per audit (P4.33) until backend
  // ships a real ETA endpoint. Hides when no prep data available.
  const eta = useMemo(() => {
    const preps = catalog.dishes
      .map((d) => d.preparationMinutes ?? 0)
      .filter((n) => n > 0)
    if (preps.length === 0) return null
    const maxPrep = Math.max(...preps)
    return { min: maxPrep + 20, max: maxPrep + 30 }
  }, [catalog.dishes])

  if (!aggRating && branchCount === 0 && !showFssai && !eta) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-6 relative z-[3]">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {aggRating ? (
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 border shadow-sm text-[12px]" style={{ background: 'var(--c-bg-elev, #FFFCF6)', borderColor: 'rgba(201, 169, 110, 0.4)' }}>
            <span aria-hidden style={{ color: 'var(--c-accent)' }}>★</span>
            <span className="font-bold" style={{ color: 'var(--c-text)' }}>{aggRating.avg.toFixed(1)}</span>
            <span className="text-[--c-text-soft]">· {aggRating.count.toLocaleString('en-IN')} ratings</span>
          </div>
        ) : null}
        {branchCount > 0 ? (
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 border shadow-sm text-[12px]" style={{ background: 'var(--c-bg-elev, #FFFCF6)', borderColor: 'rgba(201, 169, 110, 0.4)' }}>
            <MapPin className="size-3.5" style={{ color: 'var(--c-terracotta)' }} aria-hidden />
            <span className="font-bold" style={{ color: 'var(--c-text)' }}>{branchCount}</span>
            <span className="text-[--c-text-soft]">{branchCount === 1 ? 'branch' : 'branches'}{firstCity ? ` in ${firstCity}` : ''}</span>
          </div>
        ) : null}
        {showFssai ? (
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 border shadow-sm text-[12px]" style={{ background: 'var(--c-bg-elev, #FFFCF6)', borderColor: 'rgba(169, 191, 166, 0.55)' }} title={`FSSAI Lic. ${brand.fssaiNumber}`}>
            <span aria-hidden className="inline-flex items-center justify-center size-4 rounded-full font-bold text-white text-[10px]" style={{ background: '#6E8B6A' }}>✓</span>
            <span className="font-bold" style={{ color: 'var(--c-text)' }}>FSSAI</span>
            <span className="text-[--c-text-soft] font-mono text-[11px]">{brand.fssaiNumber}</span>
          </div>
        ) : null}
        {eta ? (
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 border shadow-sm text-[12px]" style={{ background: 'var(--c-bg-elev, #FFFCF6)', borderColor: 'rgba(201, 169, 110, 0.4)' }} title="Estimated delivery time — includes prep + rider">
            <Clock className="size-3.5" style={{ color: 'var(--c-accent)' }} aria-hidden />
            <span className="font-bold" style={{ color: 'var(--c-text)' }}>{eta.min}–{eta.max} min</span>
            <span className="text-[--c-text-soft]">delivery</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function FollowUsCard() {
  const brand = useBrand()
  const links = brand.socialLinks
  const items = [
    { key: 'facebook', label: 'Facebook', href: links.facebook, Icon: null },
    { key: 'instagram', label: 'Instagram', href: links.instagram, Icon: null },
    { key: 'twitter', label: 'Twitter', href: links.twitter, Icon: null },
    { key: 'youtube', label: 'YouTube', href: links.youtube, Icon: null },
  ].filter((i) => Boolean(i.href))
  if (items.length === 0) return null
  return (
    <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <p className="subtitle">STAY IN THE LOOP</p>
        <div className="c-divider" />
        <h2 className="display text-3xl sm:text-4xl mb-3">Follow <span>{brand.restaurantName}</span></h2>
        <p className="text-sm text-[--c-text-soft] max-w-lg mx-auto leading-relaxed mb-8">
          New dishes, chef's specials, and behind-the-scenes moments — first on our socials.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {items.map(({ key, label, href }) => (
            <a
              key={key}
              href={href!}
              target="_blank"
              rel="noopener noreferrer"
              className="c-button-outline inline-flex items-center gap-2 !py-2.5 !px-5 rounded-full"
              aria-label={`Open ${brand.restaurantName} on ${label}`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </ScrollReveal>
  )
}

function StatsSection() {
  // Hardcoded 200+/10000+/20+ numbers are placeholder — would be a lie for
  // every real tenant. Gate behind seedMode; real tenants hide it entirely
  // until a backend stats endpoint ships.
  const showSeed = useSeedMode()
  if (!showSeed) return null
  const STATS = [
    { value: 200, suffix: '+', label: 'Authentic Dishes' },
    { value: 10000, suffix: '+', label: 'Happy Customers' },
    { value: 20, suffix: '+', label: 'Years of Service' },
  ]
  return (
    <ScrollReveal as="section" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-center mb-4">
        <SeedBadge />
      </div>
      <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
        {STATS.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 0.1} className="c-card p-5 sm:p-8 rounded-2xl bg-[--c-bg-elev]">
            <p className="display text-3xl sm:text-5xl gold-text leading-none font-bold">
              <CountUp value={s.value} suffix={s.suffix} />
            </p>
            <p className="subtitle text-[10px] sm:text-[11px] mt-3 font-semibold uppercase tracking-wider">{s.label}</p>
          </ScrollReveal>
        ))}
      </div>
    </ScrollReveal>
  )
}

function TestimonialsSection() {
  // Seed content — 3 large avatar+quote cards. Hidden for real tenants
  // until the testimonials endpoint ships (see BACKEND_TODO.md).
  const showSeed = useSeedMode()
  if (!showSeed) return null
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <ScrollReveal className="text-center mb-8">
        <div className="flex items-center justify-center gap-3">
          <p className="subtitle">WHAT GUESTS SAY</p>
          <SeedBadge />
        </div>
        <div className="c-divider" />
        <h2 className="display text-2xl sm:text-3xl">Loved by <span>Our Guests</span></h2>
      </ScrollReveal>
      <div className="testimonial-grid">
        {TESTIMONIALS_SEED.map((t, i) => (
          <motion.article
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="testimonial-compact"
          >
            <span className="t-quote-mark" aria-hidden>"</span>
            <div className="t-stars" aria-label={`Rated ${t.rating} stars`}>
              {Array.from({ length: t.rating }).map((_, k) => (
                <Star key={k} className="size-3.5 fill-current" />
              ))}
            </div>
            <p className="t-quote">"{t.quote}"</p>
            <div className="flex items-center gap-3 mt-4">
              <img
                src={t.avatarUrl}
                alt={t.name}
                loading="lazy"
                decoding="async"
                className="size-10 rounded-full object-cover ring-2 ring-[--c-accent]/40"
              />
              <div className="text-left">
                <p className="t-name">{t.name}</p>
                <p className="t-role">{t.role}</p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

const TIME_SLOTS = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'
]

const formatTimeLabel = (timeStr: string) => {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  const hr = Number(h)
  const ampm = hr >= 12 ? 'PM' : 'AM'
  const displayHr = hr % 12 === 0 ? 12 : hr % 12
  return `${displayHr}:${m} ${ampm}`
}

function ReservationCallToActionSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['15%', '-25%'])

  return (
    <section ref={sectionRef} className="c-section-espresso relative py-24 my-16 overflow-hidden">
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 -top-[20%] -bottom-[20%] bg-cover bg-center opacity-[0.18]"
        style={{
          y: bgY,
          backgroundImage: 'url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1280&q=75)',
          mixBlendMode: 'overlay',
        }}
      />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="subtitle">RESERVE YOUR TABLE</p>
        <div className="c-divider" />
        <h2 className="display text-3xl sm:text-5xl mb-4">Book a <span>Memorable</span> Evening</h2>
        <p className="text-sm mb-8 max-w-md mx-auto opacity-80">Walk-ins are welcome but we recommend booking ahead to guarantee your favorite table.</p>
        <div className="c-glass-card p-6 sm:p-8 max-w-xl mx-auto">
          <ReservationWizard />
        </div>
      </div>
    </section>
  )
}

