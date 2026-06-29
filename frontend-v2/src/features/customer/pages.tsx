import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Plus, Minus, Star, ChevronRight, Sparkles, Award, ChefHat, Leaf, Soup,
  MapPin, Phone, Mail, Clock, Calendar, Camera, ShieldCheck, FileText, RotateCcw, Users,
} from 'lucide-react'
import CustomerLayout, { HeroSection } from '@/features/customer/CustomerLayout'
// UI-F-22 perf — heavy payment + cropper primitives are only used on Checkout /
// Profile, so we lazy-load them to keep them out of the customer landing bundle.
const ImageCropper = lazy(() =>
  import('@/components/ui/image-cropper').then((m) => ({ default: m.ImageCropper })),
)
const StripePaymentElement = lazy(() =>
  import('@/components/ui/stripe-payment-element').then((m) => ({ default: m.StripePaymentElement })),
)
const PayPalCheckoutButton = lazy(() =>
  import('@/components/ui/paypal-checkout-button').then((m) => ({ default: m.PayPalCheckoutButton })),
)
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { CountUp } from '@/components/ui/count-up'
import { DishGridSkeleton } from '@/components/ui/skeleton'
import { useMounted } from '@/hooks/use-mounted'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { DocumentTitle } from '@/lib/seo/document-title'
import {
  CATEGORIES, DISHES, HERO_IMAGES, GALLERY, useCart, writeCart, useCustomerCatalog,
  enqueueOrder, readOrdersQueue, useSelectedBranchId, type Dish, type QueuedOrder,
} from '@/features/customer/catalog'
// UI-F-85 — IndexedDB-backed offline queue. The local-storage `enqueueOrder`
// above persists the "show in My Orders" UI projection; this queue persists the
// API payload for replay so a true-offline checkout still hits the backend
// later. Drained in CustomerLayout (TBD) on `online` event.
import {
  enqueueOrder as enqueueOfflineApiOrder,
  useOfflineQueueStatus,
} from '@/lib/offline-queue'
import { usePlaceCustomerOrder, useCustomerOrders, useCustomerSliders } from '@/api/queries/customer'
import { updateCustomerProfile, submitPublicReservation } from '@/api/services/customer'
import { tokens } from '@/lib/auth/tokens'
import CustomerFilterBar, { useCustomerFilters } from '@/features/customer/CustomerFilterBar'
import DishCard from '@/features/customer/DishCard'
import '@/styles/customer.css'

/* ---------------- pages ---------------- */

export function HomePage() {
  const navigate = useNavigate()
  const catalog = useCustomerCatalog()
  const filters = useCustomerFilters(catalog.dishes)
  const { filtered, cat, setCat } = filters
  const mounted = useMounted(200)

  // UI-F-86 — hero rotator pulls from `/api/customer/sliders/all?branchId=…`
  // when backend ships. Empty array → HeroSection falls back to its default
  // Unsplash trio so the hero animation still feels alive.
  const { branchId } = useSelectedBranchId()
  const slidersQ = useCustomerSliders(branchId)
  const heroImages = useMemo(
    () => (slidersQ.data && slidersQ.data.length > 0 ? slidersQ.data.map((s) => s.imageUrl) : []),
    [slidersQ.data],
  )

  return (
    <CustomerLayout>
      <DocumentTitle
        title="Spice Garden Steakhouse — Hand-Crafted Indian Dining"
        description="Reserve a table or order online from Spice Garden — chef-crafted Indian cuisine, signature kebabs, butter chicken, and more. Three branches across Mumbai."
      />
      <HeroSection
        bg={HERO_IMAGES.home}
        subtitle="FRESH & DELICIOUS MEALS"
        titleA="Delicious Food &"
        titleAccent="Great Taste"
        description="Enjoy great food and a wonderful dining atmosphere. Every dish is prepared with fresh, high-quality ingredients."
        primaryCta="ORDER NOW"
        primaryOnClick={() => navigate('/menu')}
        secondaryCta="RESERVE A TABLE"
        secondaryOnClick={() => navigate('/contact')}
        showRotator
        heroImages={heroImages}
      />

      {/* Combined: heading + compact image categories + filter bar + products
       * Single source of truth. Clicking an image tile sets the cat filter
       * via the same hook the filter pills use — so the pill row stays in
       * sync and we get instant filtering without duplicate UI. */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-14 pb-6">
        <div className="text-center mb-6">
          <p className="subtitle">CHEF'S SPECIALS</p>
          <div className="c-divider" />
          <h2 className="display text-2xl sm:text-3xl lg:text-4xl">Explore by <span>Category</span></h2>
          <p className="text-sm text-[--c-text-soft] mt-3 max-w-md mx-auto">Tap a tile to filter — or use the bar below to search and refine.</p>
        </div>

        {/* Compact image tiles — horizontally scrollable, small height so
         * products stay above the fold. */}
        <div className="category-strip scrollbar-hide flex gap-2.5 sm:gap-3 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2" style={{ scrollSnapType: 'x mandatory' }}>
          <button
            type="button"
            onClick={() => setCat(null)}
            className={cn(
              'shrink-0 w-20 sm:w-24 h-20 sm:h-24 rounded-lg border-2 grid place-items-center transition-all duration-200',
              cat === null
                ? 'bg-[--c-accent] text-[--c-button-primary-fg] border-[--c-accent] shadow-lg'
                : 'border-[--c-border] hover:border-[--c-accent] text-[--c-text]',
            )}
            style={{ scrollSnapAlign: 'start' }}
            aria-label="Show all categories"
          >
            <div className="flex flex-col items-center gap-1">
              <Soup className="size-5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">All</span>
            </div>
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(cat === c.id ? null : c.id)}
              className={cn(
                'relative shrink-0 w-24 sm:w-28 h-20 sm:h-24 rounded-lg overflow-hidden border-2 group transition-all duration-200',
                cat === c.id
                  ? 'border-[--c-accent] ring-2 ring-[--c-accent]/30 shadow-lg'
                  : 'border-[--c-border] hover:border-[--c-accent]',
              )}
              style={{ scrollSnapAlign: 'start' }}
            >
              <img src={c.img} alt={c.name} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <p className="absolute bottom-1.5 left-0 right-0 text-[10px] sm:text-[11px] font-semibold tracking-wider text-center text-white uppercase">{c.name}</p>
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Filter bar (diet + search + count) — category pills hidden since
       * the image strip above is the canonical category selector. */}
      <CustomerFilterBar filters={filters} hideCategoryPills />

      <ScrollReveal as="section" delay={0.05} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        <div className="text-center mb-6 lg:mb-8">
          <h2 className="display text-2xl sm:text-3xl">Popular <span>Dishes</span></h2>
          <p className="text-sm text-[--c-text-soft] mt-2 max-w-md mx-auto">
            Hand-picked specialties our guests love.
          </p>
        </div>

        {!mounted ? (
          <DishGridSkeleton count={8} columns="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
        ) : filtered.length === 0 ? (
          <p className="text-center text-[--c-text-muted] py-12">No dishes match your filters. Try a different combination.</p>
        ) : (
          <>
            {/*
             * Homepage is a SHOWCASE, not a catalogue. Cap at 8 dishes (2 rows
             * on desktop xl, 4 on mobile) — backend's showOnHome=true filter
             * controls what gets featured. When the owner hasn't promoted any
             * items yet we still show the first 8 so the page never reads as
             * "empty restaurant". The full menu lives on /menu.
             */}
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {filtered.slice(0, 8).map((d) => (
                <li key={d.id} className="contents">
                  <DishCard dish={d} />
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="text-xs text-[--c-text-muted] tracking-wider uppercase">
                {filtered.length > 8
                  ? `Showing 8 of ${filtered.length} dishes`
                  : `${filtered.length} featured dishes`}
              </p>
              <button
                className="c-button-primary inline-flex items-center gap-2 px-8"
                onClick={() => navigate('/menu')}
              >
                EXPLORE FULL MENU
                <ChevronRight className="size-4" />
              </button>
            </div>
          </>
        )}
      </ScrollReveal>

      {/* Why us banner */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="subtitle">WHY DINE WITH US</p>
          <div className="c-divider" />
          <h2 className="display text-3xl sm:text-4xl">Crafted with <span>Heart</span></h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { Icon: ChefHat, title: 'Hand-Crafted by Chefs', text: 'Every dish prepared fresh by our experienced kitchen team.' },
            { Icon: Leaf, title: 'Farm-Fresh Ingredients', text: 'Sourced daily from trusted local farms for peak flavour.' },
            { Icon: Award, title: 'Award-Winning Recipes', text: 'Heritage recipes refined over decades for an unforgettable bite.' },
          ].map(({ Icon, title, text }, i) => (
            <ScrollReveal key={title} delay={i * 0.08} className="c-card p-8 text-center group hover:-translate-y-1 transition-transform duration-300">
              <div className="inline-flex size-16 rounded-full border border-[--c-accent] items-center justify-center gold-text mb-5 group-hover:bg-[--c-accent] group-hover:text-black transition-colors">
                <Icon className="size-7" />
              </div>
              <h3 className="text-2xl mb-3">{title}</h3>
              <p className="text-sm text-[--c-text-soft] leading-relaxed">{text}</p>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal><TestimonialsSection /></ScrollReveal>
      <StatsSection />
      <ScrollReveal><ReservationCallToActionSection /></ScrollReveal>
      <ScrollReveal><InstagramFeedSection /></ScrollReveal>
    </CustomerLayout>
  )
}

/* Stats — 3 count-up tiles between testimonials and reservation CTA. */
function StatsSection() {
  const STATS = [
    { value: 200, suffix: '+', label: 'Authentic Dishes' },
    { value: 10000, suffix: '+', label: 'Happy Customers' },
    { value: 20, suffix: '+', label: 'Years of Service' },
  ]
  return (
    <ScrollReveal as="section" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
        {STATS.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 0.1} className="c-card p-5 sm:p-8">
            <p className="display text-3xl sm:text-5xl gold-text leading-none">
              <CountUp value={s.value} suffix={s.suffix} />
            </p>
            <p className="subtitle text-[10px] sm:text-[11px] mt-3">{s.label}</p>
          </ScrollReveal>
        ))}
      </div>
    </ScrollReveal>
  )
}

/* ---------------- Premium HomePage sections ---------------- */

const TESTIMONIALS = [
  { quote: 'The butter chicken here is otherworldly. Every visit feels like a celebration.', name: 'Ananya Verma', role: 'Food Critic, Mumbai Mirror', rating: 5 },
  { quote: 'Hands down the best Tandoori chicken in the city. The hospitality is unmatched.', name: 'Rahul Mehta', role: 'Regular Patron', rating: 5 },
  { quote: 'Authentic flavours, premium ambience, and warm service. A perfect date-night spot.', name: 'Priya Sharma', role: 'Lifestyle Blogger', rating: 5 },
]

function TestimonialsSection() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % TESTIMONIALS.length), 5500)
    return () => clearInterval(t)
  }, [])
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-10">
        <p className="subtitle">WHAT GUESTS SAY</p>
        <div className="c-divider" />
        <h2 className="display text-3xl sm:text-4xl">Loved by <span>Our Guests</span></h2>
      </div>
      <div className="relative">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={t.name}
            className={cn(
              'c-card p-8 sm:p-12 text-center transition-all duration-700',
              i === active ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
            )}
          >
            <div className="flex justify-center gap-1 mb-5">
              {Array.from({ length: t.rating }).map((_, k) => (
                <Star key={k} className="size-5 fill-current gold-text" />
              ))}
            </div>
            <p className="display italic text-2xl sm:text-3xl mb-6 leading-snug" style={{ fontWeight: 500 }}>
              "{t.quote}"
            </p>
            <p className="font-semibold gold-text">{t.name}</p>
            <p className="text-xs text-[--c-text-muted] mt-1">{t.role}</p>
          </div>
        ))}
        <div className="flex justify-center gap-2 mt-6">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                i === active ? 'w-10 bg-[--c-accent]' : 'w-3 bg-[--c-border-strong]/40 hover:bg-[--c-accent]/60'
              )}
              aria-label={`Show testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function ReservationCallToActionSection() {
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '', guests: 2 })
  // Parallax via framer-motion useScroll — translates the background image
  // upward as the section scrolls past, without the mobile-glitchy
  // `background-attachment: fixed`.
  const sectionRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['10%', '-20%'])

  const submit = () => {
    if (!form.name || !/^[6-9]\d{9}$/.test(form.phone) || !form.date || !form.time) {
      toast.warning('Please fill name, valid mobile, date & time')
      return
    }
    toast.success(`Table requested for ${form.guests} on ${form.date} at ${form.time} — we'll call to confirm.`)
    setForm({ name: '', phone: '', date: '', time: '', guests: 2 })
  }
  return (
    <section ref={sectionRef} className="relative py-24 my-20 overflow-hidden">
      {/* Parallax bg layer — translates with scroll progress; mobile-safe. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 -top-[10%] -bottom-[10%] bg-cover bg-center"
        style={{
          y: bgY,
          backgroundImage: 'url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1280&q=75)',
        }}
      />
      {/* Tint overlay on top of the bg image */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(rgba(10,10,10,0.85), rgba(10,10,10,0.92))' }}
      />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="subtitle">RESERVE YOUR TABLE</p>
        <div className="c-divider" />
        <h2 className="display text-3xl sm:text-5xl mb-4">Book a <span>Memorable</span> Evening</h2>
        <p className="text-sm text-[--c-text-soft] mb-8 max-w-md mx-auto">Walk-ins are welcome but we recommend booking ahead for our signature dishes and premium tables.</p>
        <div className="c-card p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
          <input className="c-input" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="c-input" inputMode="numeric" maxLength={10} placeholder="10-digit mobile" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
          <input className="c-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input className="c-input" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          <input className="c-input sm:col-span-2" type="number" min={1} max={20} placeholder="Number of guests" value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} />
          <button className="c-button-primary sm:col-span-2 inline-flex items-center justify-center gap-2" onClick={submit}>
            <Calendar className="size-4" /> RESERVE TABLE NOW
          </button>
        </div>
      </div>
    </section>
  )
}

const INSTAGRAM_FEED = [
  'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80',
]

function InstagramFeedSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-10">
        <p className="subtitle">FOLLOW OUR JOURNEY</p>
        <div className="c-divider" />
        <h2 className="display text-3xl sm:text-4xl"><span>@spicegarden</span> · Instagram</h2>
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {INSTAGRAM_FEED.map((src, i) => (
          <ScrollReveal as="li" key={i} delay={i * 0.06} className="relative aspect-square overflow-hidden group cursor-pointer">
            <img src={src} alt={`Instagram post ${i + 1}`} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 grid place-items-center">
              <Camera className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </ScrollReveal>
        ))}
      </ul>
      <div className="text-center mt-8">
        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="c-button-outline inline-flex items-center gap-2">
          FOLLOW @SPICEGARDEN
        </a>
      </div>
    </section>
  )
}

export function MenuPage() {
  const navigate = useNavigate()
  const catalog = useCustomerCatalog()
  const filters = useCustomerFilters(catalog.dishes)
  const { filtered, cat, setCat } = filters
  const mounted = useMounted(200)

  // Progressive reveal — render dishes in batches as the user scrolls
  // (Swiggy/Zomato-style infinite scroll, no extra network requests since
  // the full list arrives in one call already). Sentinel at the end of the
  // grid uses IntersectionObserver to ratchet `visibleCount` up by 12.
  const PAGE_SIZE = 12
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  // Reset visible count whenever filters change so a fresh search starts
  // from page 1 rather than scrolling deep into a stale list.
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [filters.cat, filters.diet, filters.q])
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      const e = entries[0]
      if (e && e.isIntersecting) {
        setVisibleCount((n) => Math.min(n + PAGE_SIZE, filtered.length))
      }
    }, { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [filtered.length])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  return (
    <CustomerLayout>
      <DocumentTitle
        title="Menu — Spice Garden Steakhouse"
        description="Browse the full Spice Garden menu — starters, mains, breads, drinks and desserts. Order online or reserve a table at any of our three Mumbai branches."
      />
      <HeroSection
        bg={HERO_IMAGES.home}
        subtitle="OUR FULL MENU"
        titleA="The Complete"
        titleAccent="Carte"
        description="Browse every dish, from starters to desserts, with seasonal additions from our chefs."
      />

      {/* Category strip — same image-tile pattern as HomePage so the menu
       * feels like a continuation of the landing browse, not a different UI. */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="category-strip scrollbar-hide flex gap-2.5 sm:gap-3 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2" style={{ scrollSnapType: 'x mandatory' }}>
          <button
            type="button"
            onClick={() => setCat(null)}
            className={cn(
              'shrink-0 w-20 sm:w-24 h-20 sm:h-24 rounded-lg border-2 grid place-items-center transition-all duration-200',
              cat === null
                ? 'bg-[--c-accent] text-[--c-button-primary-fg] border-[--c-accent] shadow-lg'
                : 'border-[--c-border] hover:border-[--c-accent] text-[--c-text]',
            )}
            style={{ scrollSnapAlign: 'start' }}
            aria-label="Show all categories"
          >
            <div className="flex flex-col items-center gap-1">
              <Soup className="size-5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">All</span>
            </div>
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(cat === c.id ? null : c.id)}
              className={cn(
                'relative shrink-0 w-24 sm:w-28 h-20 sm:h-24 rounded-lg overflow-hidden border-2 group transition-all duration-200',
                cat === c.id
                  ? 'border-[--c-accent] ring-2 ring-[--c-accent]/30 shadow-lg'
                  : 'border-[--c-border] hover:border-[--c-accent]',
              )}
              style={{ scrollSnapAlign: 'start' }}
            >
              <img src={c.img} alt={c.name} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <p className="absolute bottom-1.5 left-0 right-0 text-[10px] sm:text-[11px] font-semibold tracking-wider text-center text-white uppercase">{c.name}</p>
            </button>
          ))}
        </div>
      </ScrollReveal>

      <CustomerFilterBar filters={filters} hideCategoryPills />

      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-[--c-text-muted]">
            Showing <span className="gold-text font-semibold">{visible.length}</span> of {filtered.length} dishes
          </p>
        </div>
        {catalog.isLoading || !mounted ? (
          <DishGridSkeleton count={12} columns="sm:grid-cols-2 lg:grid-cols-3" />
        ) : filtered.length === 0 ? (
          <p className="text-center text-[--c-text-muted] py-12">
            No dishes match your filters. Try a different combination.
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {visible.map((d) => (
                <li key={d.id} className="contents">
                  <DishCard dish={d} />
                </li>
              ))}
            </ul>

            {/* Sentinel + status footer — IntersectionObserver above watches
             * this div and ratchets visibleCount up as it scrolls into view. */}
            <div ref={sentinelRef} className="h-1" aria-hidden="true" />

            <div className="mt-8 flex flex-col items-center gap-2 text-center">
              {hasMore ? (
                <div className="inline-flex items-center gap-2 text-xs text-[--c-text-muted]">
                  <span className="size-3 rounded-full border-2 border-[--c-accent] border-t-transparent animate-spin" aria-hidden="true" />
                  Loading more dishes…
                </div>
              ) : filtered.length > PAGE_SIZE ? (
                <>
                  <p className="display text-xl gold-text">You've reached the end of the menu</p>
                  <p className="text-xs text-[--c-text-muted]">
                    That's everything on offer right now — found something you like?
                  </p>
                  <button
                    className="c-button-outline mt-3 inline-flex items-center gap-2"
                    onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/cart') }}
                  >
                    VIEW YOUR CART
                    <ChevronRight className="size-4" />
                  </button>
                </>
              ) : null}
            </div>
          </>
        )}
      </ScrollReveal>
    </CustomerLayout>
  )
}

export function SignaturePage() {
  const dishes = DISHES.filter((d) => d.signature)
  return (
    <CustomerLayout>
      <DocumentTitle
        title="Chef's Signature Dishes — Spice Garden"
        description="Our chef's signature dishes — slow-cooked classics, char-grilled kebabs and heritage recipes. Reserve a table to experience them in-house."
      />
      <HeroSection
        bg={HERO_IMAGES.signature}
        subtitle="OUR SPECIAL SIGNATURE DISHES"
        titleA="Chef's Special"
        titleAccent="Dishes"
        description="Enjoy our delicious food made by our best chefs to give you a wonderful dining experience."
      />
      {/* Mobile / tablet: compact Swiggy-style dish grid */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:hidden">
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {dishes.map((d) => (
            <li key={d.id} className="contents">
              <DishCard dish={d} />
            </li>
          ))}
        </ul>
      </ScrollReveal>

      {/* Desktop: two-column hero layout */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 hidden lg:block">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dishes.map((d, i) => (
            <ScrollReveal
              as="li"
              key={d.id}
              delay={i * 0.08}
              className="c-card overflow-hidden grid grid-cols-1 sm:grid-cols-2"
            >
              <motion.div
                className="aspect-square sm:aspect-auto overflow-hidden group"
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <img
                  src={d.img}
                  alt={d.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                />
              </motion.div>
              <div className="p-5 space-y-3">
                <span className="c-tag inline-flex items-center gap-1"><Sparkles className="size-3" /> Signature</span>
                <h3 className="text-2xl">{d.name}</h3>
                <p className="text-sm text-[--c-text-soft]">{d.description}</p>
                <p className="display text-3xl gold-text">₹{d.price}</p>
                <button className="c-button-primary">ORDER NOW</button>
              </div>
            </ScrollReveal>
          ))}
        </ul>
      </ScrollReveal>
    </CustomerLayout>
  )
}

export function WhyUsPage() {
  return (
    <CustomerLayout>
      <DocumentTitle
        title="Why Choose Us — Spice Garden Steakhouse"
        description="Heritage recipes, farm-fresh ingredients, and warm hospitality — the Spice Garden promise across all our Mumbai branches."
      />
      <HeroSection
        bg={HERO_IMAGES.whyUs}
        subtitle="GREAT FOOD & FRIENDLY SERVICE"
        titleA="Our Story of"
        titleAccent="Great Taste"
        description="We use high-quality fresh ingredients, follow strict hygiene standards, and offer warm hospitality to make your visit special."
      />
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <img src={HERO_IMAGES.whyUs} alt="Our story" loading="lazy" decoding="async" className="rounded-lg c-card object-cover w-full h-full" />
          <div className="space-y-4">
            <p className="subtitle">OUR JOURNEY</p>
            <h2 className="display text-3xl sm:text-4xl">Crafting Memories <span>One Dish at a Time</span></h2>
            <p className="text-sm text-[--c-text-soft]">From a humble single-branch kitchen to a beloved multi-city steakhouse, our promise has stayed the same — fresh ingredients, time-honoured recipes, and warm service.</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><Soup className="size-4 gold-text mt-0.5" /> 200+ recipes refined over a decade</li>
              <li className="flex items-start gap-2"><ChefHat className="size-4 gold-text mt-0.5" /> Award-winning culinary team</li>
              <li className="flex items-start gap-2"><Leaf className="size-4 gold-text mt-0.5" /> 100% farm-fresh, locally-sourced</li>
            </ul>
          </div>
        </div>
      </ScrollReveal>
    </CustomerLayout>
  )
}

export function GalleryPage() {
  return (
    <CustomerLayout>
      <DocumentTitle
        title="Gallery — Spice Garden Steakhouse"
        description="Photos of our dishes, dining room, and happy guests. Take a look inside Spice Garden before you visit."
      />
      <HeroSection
        bg={HERO_IMAGES.gallery}
        subtitle="OUR RESTAURANT & FOOD PHOTOS"
        titleA="A Photo"
        titleAccent="Gallery"
        description="Browse photos of our delicious dishes, beautiful dining area, and happy moments of our customers."
      />
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {GALLERY.map((src, i) => (
            <ScrollReveal as="li" key={i} delay={i * 0.05} className="aspect-square overflow-hidden c-card group">
              <img src={src} alt={`Gallery ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </ScrollReveal>
          ))}
        </ul>
      </ScrollReveal>
    </CustomerLayout>
  )
}

const RESERVATIONS_KEY = 'customer_reservations'

interface StoredReservation {
  id: string
  submittedAt: string
  name: string
  email: string
  phone: string
  date: string
  time: string
  guests: number
  notes: string
  status: 'requested'
}

function readReservations(): StoredReservation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RESERVATIONS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r): r is StoredReservation =>
        typeof r === 'object' && r !== null && typeof (r as { id?: unknown }).id === 'string',
    )
  } catch {
    return []
  }
}

function writeReservations(list: StoredReservation[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(list))
}

export function ContactPage() {
  const initialForm = { name: '', email: '', phone: '', date: '', time: '', guests: 2, notes: '' }
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialForm, string>>>({})
  const [history, setHistory] = useState<StoredReservation[]>(readReservations)

  const validate = (): boolean => {
    const next: Partial<Record<keyof typeof initialForm, string>> = {}
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Name must be at least 2 characters'
    if (!/^[6-9][0-9]{9}$/.test(form.phone)) next.phone = 'Enter a valid 10-digit Indian mobile'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Invalid email address'
    if (!form.date) next.date = 'Pick a reservation date'
    if (!form.time) next.time = 'Pick a reservation time'
    if (!form.guests || form.guests < 1) next.guests = 'At least one guest required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (): Promise<void> => {
    if (!validate()) {
      toast.warning('Please fix the highlighted fields')
      return
    }
    // Try backend first so the restaurant team can triage incoming bookings.
    // Even when the backend accepts the request, we still mirror the
    // submission locally so the user sees the reservation under "recent" the
    // moment they hit Submit (no spinner / loading state needed).
    const backendRes = await submitPublicReservation({
      name: form.name.trim(),
      phone: form.phone,
      email: form.email,
      date: form.date,
      time: form.time,
      guests: form.guests,
      notes: form.notes,
    })
    const localId = backendRes.ok && backendRes.data.reservationId
      ? `RSV-${backendRes.data.reservationId}`
      : `RSV-${Date.now()}`
    const record: StoredReservation = {
      id: localId,
      submittedAt: new Date().toLocaleString('en-IN'),
      ...form,
      status: 'requested',
    }
    const next = [record, ...history].slice(0, 20)
    setHistory(next)
    writeReservations(next)
    if (backendRes.ok) {
      toast.success("Reservation submitted — we'll call to confirm your table.")
    } else {
      toast.warning('Saved locally — couldn’t reach the restaurant. We’ll retry on next visit.')
    }
    setForm(initialForm)
    setErrors({})
  }
  return (
    <CustomerLayout>
      <DocumentTitle
        title="Contact & Reservations — Spice Garden"
        description="Book a table online at Spice Garden Steakhouse, find our branches, or reach our team for any queries."
      />
      <HeroSection
        bg={HERO_IMAGES.contact}
        subtitle="EASY TABLE BOOKING & LOCATIONS"
        titleA="Book Your"
        titleAccent="Table Online"
        description="Reserve your table for a smooth visit. We're ready to serve you with warm hospitality."
      />
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <p className="subtitle">VISIT US</p>
              <div className="c-divider !ml-0" />
              <h2 className="display text-3xl">Reach the <span>Restaurant</span></h2>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3"><MapPin className="size-5 gold-text mt-0.5" /><span>123 Sea Breeze Lane, Bandra West, Mumbai · 400050</span></li>
              <li className="flex items-start gap-3"><Phone className="size-5 gold-text mt-0.5" />+91 9876543210</li>
              <li className="flex items-start gap-3"><Mail className="size-5 gold-text mt-0.5" />hello@spicegarden.com</li>
              <li className="flex items-start gap-3"><Clock className="size-5 gold-text mt-0.5" /><span>Mon–Sun · 11:00 AM – 11:30 PM</span></li>
            </ul>
            <img src={HERO_IMAGES.contact} alt="Map" loading="lazy" decoding="async" className="w-full rounded-lg c-card" />
          </div>

          <div className="c-card p-6 space-y-4">
            <p className="subtitle">RESERVE A TABLE</p>
            <div className="c-divider !ml-0" />
            <h3 className="display text-2xl">Book Online</h3>

            <div>
              <input className="c-input" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} />
              {errors.name ? <p className="text-xs text-red-400 mt-1">{errors.name}</p> : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input className="c-input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} />
                {errors.email ? <p className="text-xs text-red-400 mt-1">{errors.email}</p> : null}
              </div>
              <div>
                <input className="c-input" placeholder="Phone" inputMode="tel" maxLength={10} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} aria-invalid={!!errors.phone} />
                {errors.phone ? <p className="text-xs text-red-400 mt-1">{errors.phone}</p> : null}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <input className="c-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-invalid={!!errors.date} />
                {errors.date ? <p className="text-xs text-red-400 mt-1">{errors.date}</p> : null}
              </div>
              <div>
                <input className="c-input" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} aria-invalid={!!errors.time} />
                {errors.time ? <p className="text-xs text-red-400 mt-1">{errors.time}</p> : null}
              </div>
              <div>
                <input className="c-input" type="number" min={1} max={20} placeholder="Guests" value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} aria-invalid={!!errors.guests} />
                {errors.guests ? <p className="text-xs text-red-400 mt-1">{errors.guests}</p> : null}
              </div>
            </div>

            <textarea className="c-input" rows={3} placeholder="Special notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <button className="c-button-primary w-full inline-flex items-center justify-center gap-2" onClick={() => { void submit() }}>
              <Calendar className="size-4" /> RESERVE NOW
            </button>

            {history.length > 0 ? (
              <div className="pt-4 border-t border-[--c-border]">
                <p className="subtitle text-[10px] mb-2">YOUR RECENT REQUESTS</p>
                <ul className="space-y-2">
                  {history.slice(0, 3).map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-xs p-2 rounded border border-[--c-border]">
                      <div className="min-w-0">
                        <p className="font-mono gold-text truncate">{r.id}</p>
                        <p className="text-[--c-text-muted]">{r.date} · {r.time} · {r.guests} guests</p>
                      </div>
                      <span className="c-tag !text-amber-400 !border-amber-500/40">Requested</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </ScrollReveal>
    </CustomerLayout>
  )
}

export function CartPage() {
  const navigate = useNavigate()
  const { items, setQty } = useCart()
  const { dishes } = useCustomerCatalog()

  // Resolve cart line ids against the live catalog (live backend menu items
  // OR the sample DISHES fallback — useCustomerCatalog() picks the right
  // one). Earlier this looked up against the static DISHES array only,
  // which broke the cart whenever the backend was healthy (live items have
  // backend-issued ids like 162, not the 1-9 from the sample data).
  const lines = items.map((l) => {
    const d = dishes.find((x) => x.id === l.id) ?? DISHES.find((x) => x.id === l.id)
    if (!d) return null
    return { ...d, qty: l.qty, subtotal: d.price * l.qty }
  }).filter((x): x is Dish & { qty: number; subtotal: number } => x !== null)

  const subtotal = lines.reduce((a, l) => a + l.subtotal, 0)
  const gst = Math.round(subtotal * 0.05)
  const total = subtotal + gst

  return (
    <CustomerLayout>
      <DocumentTitle title="Your Cart — Spice Garden" />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="subtitle">CHECK & PROCEED</p>
        <div className="c-divider !ml-0" />
        <h1 className="display text-3xl sm:text-4xl mb-8">Your <span>Cart</span></h1>

        {lines.length === 0 ? (
          <div className="c-card p-10 text-center">
            <Soup className="size-12 gold-text mx-auto mb-4" />
            <h3 className="text-xl mb-2">Your cart is empty</h3>
            <p className="text-sm text-[--c-text-soft] mb-5">Browse the menu and add your favourites.</p>
            <button className="c-button-primary" onClick={() => navigate('/menu')}>BROWSE MENU</button>
          </div>
        ) : (
          <div className="c-card overflow-hidden">
            <ul className="divide-y divide-[--c-border]">
              {lines.map((l) => (
                <li key={l.id} className="p-4 flex items-center gap-4">
                  <img src={l.img} alt={l.name} loading="lazy" decoding="async" className="size-16 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold"><span className={l.veg ? 'veg-icon' : 'nonveg-icon'} />{l.name}</p>
                    <p className="text-xs text-[--c-text-muted]">₹{l.price} each</p>
                  </div>
                  <div className="flex items-center gap-2 border border-[--c-accent] rounded">
                    <button className="px-2 py-1" onClick={() => setQty(l.id, -1)}><Minus className="size-3" /></button>
                    <span className="text-sm font-mono tabular-nums w-6 text-center">{l.qty}</span>
                    <button className="px-2 py-1" onClick={() => setQty(l.id, 1)}><Plus className="size-3" /></button>
                  </div>
                  <p className="font-mono tabular-nums w-24 text-right gold-text font-semibold">₹{l.subtotal.toLocaleString('en-IN')}</p>
                </li>
              ))}
            </ul>
            <div className="p-5 space-y-2 border-t border-[--c-border]">
              <div className="flex items-center justify-between text-sm"><span className="text-[--c-text-soft]">Subtotal</span><span className="tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-[--c-text-soft]">GST 5%</span><span className="tabular-nums">₹{gst.toLocaleString('en-IN')}</span></div>
              <div className="flex items-center justify-between text-lg pt-3 border-t border-[--c-border]"><span className="font-semibold">Total</span><span className="display text-2xl gold-text">₹{total.toLocaleString('en-IN')}</span></div>
              <button className="c-button-primary w-full mt-3 inline-flex items-center justify-center gap-2" onClick={() => navigate('/checkout')}>
                PROCEED TO CHECKOUT <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </CustomerLayout>
  )
}

type PaymentMethod = 'card' | 'paypal' | 'cod'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items } = useCart()
  const catalog = useCustomerCatalog()
  const { branchId } = useSelectedBranchId()
  const placeOrder = usePlaceCustomerOrder()
  const [method, setMethod] = useState<PaymentMethod>('card')
  // UI-F-85 — offline checkout. Reflects navigator.onLine + how many orders
  // are sitting in the IndexedDB replay queue.
  const offlineStatus = useOfflineQueueStatus()

  const total = useMemo(() => {
    const subtotal = items.reduce((acc, l) => {
      const d = catalog.dishes.find((x) => x.id === l.id) ?? DISHES.find((x) => x.id === l.id)
      return d ? acc + d.price * l.qty : acc
    }, 0)
    const gst = Math.round(subtotal * 0.05)
    return subtotal + gst
  }, [items, catalog.dishes])

  // Stripe needs a clientSecret from the backend. Until UI-F-1 server work lands,
  // we pass empty — the component renders its disabled/configured state honestly.
  const stripeClientSecret = ''

  const persistAndFinish = async (paymentMethod: PaymentMethod, msg: string) => {
    // Build queue entry that always represents the local order so the user
    // can see it under /orders even if the backend is unreachable.
    const lineDetails = items
      .map((l) => {
        const d = catalog.dishes.find((x) => x.id === l.id) ?? DISHES.find((x) => x.id === l.id)
        return d ? { dishId: d.id, name: d.name, price: d.price, qty: l.qty, img: d.img } : null
      })
      .filter((v): v is QueuedOrder['items'][number] => v !== null)
    const localOrder: QueuedOrder = {
      id: `KOT-${Date.now().toString().slice(-6)}`,
      placedAt: new Date().toISOString(),
      branchId,
      items: lineDetails,
      total,
      paymentMethod,
      status: 'queued',
    }
    enqueueOrder(localOrder)

    // Best-effort attempt at posting to the backend. Failure is OK — the
    // queue entry stays as 'queued' and MyOrdersPage shows it inline so the
    // user knows about it; a future sync pass can flip it to 'synced'.
    const userName = (typeof window !== 'undefined' ? localStorage.getItem('UserName') : null) ?? 'Guest'
    const userMobile = (typeof window !== 'undefined' ? localStorage.getItem('UserMobile') : null) ?? ''
    const apiMethod: 'STRIPE' | 'PAYPAL' | 'CASH' =
      paymentMethod === 'card' ? 'STRIPE' : paymentMethod === 'paypal' ? 'PAYPAL' : 'CASH'
    const apiPayload = {
      branchId,
      orderType: 'TAKEAWAY' as const,
      items: lineDetails.map((l) => ({ menuItemId: l.dishId, quantity: l.qty })),
      customerName: userName,
      customerPhone: userMobile,
      paymentMethod: apiMethod,
    }

    // UI-F-85: if the device is offline, skip the doomed network attempt and
    // push the payload straight into the IndexedDB queue. CustomerLayout's
    // `online` listener (or the next page load while online) will drain it.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      try {
        await enqueueOfflineApiOrder({
          clientId: localOrder.id,
          submittedAt: localOrder.placedAt,
          payload: apiPayload,
        })
        toast.info(`${msg} — saved offline · will sync when online`)
      } catch {
        toast.warning(`${msg} — saved locally · offline queue unavailable`)
      }
      writeCart([])
      navigate('/orders')
      return
    }

    try {
      const result = await placeOrder.mutateAsync(apiPayload)
      if (result.ok) {
        const queue = readOrdersQueue()
        const updated = queue.map((q) =>
          q.id === localOrder.id ? { ...q, status: 'synced' as const, serverOrderId: result.data.orderId } : q,
        )
        if (typeof window !== 'undefined') {
          localStorage.setItem('customer_orders_queue', JSON.stringify(updated))
        }
        toast.success(`${msg} — synced #${result.data.orderId}`)
      } else {
        toast.info(`${msg} — saved locally · backend pending`)
      }
    } catch {
      toast.info(`${msg} — saved locally · backend pending`)
    }
    writeCart([])
    navigate('/orders')
  }

  const finishOrder = (msg: string) => {
    void persistAndFinish(method, msg)
  }

  return (
    <CustomerLayout>
      <DocumentTitle title="Checkout — Spice Garden" />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="subtitle">FINAL STEP</p>
        <div className="c-divider !ml-0" />
        <h1 className="display text-3xl sm:text-4xl mb-8">Checkout</h1>

        {/* UI-F-85 offline banner — visible whenever the device is offline OR
         * we have already-queued orders waiting for sync. */}
        {!offlineStatus.online || offlineStatus.pending > 0 ? (
          <div
            role="status"
            aria-live="polite"
            className="c-card p-3 mb-4 border-l-4 border-amber-500 flex items-center gap-3"
            style={{ background: 'var(--c-bg-elev-2)' }}
          >
            <span className="text-amber-500 font-semibold text-xs uppercase tracking-wider">
              {offlineStatus.online ? 'Syncing' : 'Offline'}
            </span>
            <span className="text-sm">
              {offlineStatus.online
                ? `${offlineStatus.pending} order${offlineStatus.pending === 1 ? '' : 's'} waiting to sync…`
                : 'Saved offline · will sync when online'}
            </span>
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="c-card p-4 flex items-center gap-3">
            <MapPin className="size-5 gold-text" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Home · 302, Sea Breeze Apts</p>
              <p className="text-xs text-[--c-text-muted]">Bandra West, Mumbai · 400050</p>
            </div>
            <button className="c-button-outline !py-2 !px-3 text-[11px]">CHANGE</button>
          </div>

          <div className="c-card p-4 space-y-3">
            <p className="font-semibold">PAYMENT METHOD</p>
            <div role="radiogroup" aria-label="Payment method" className="space-y-2">
              {(
                [
                  { id: 'card', label: 'Credit / Debit Card' },
                  { id: 'paypal', label: 'PayPal' },
                  { id: 'cod', label: 'Cash on Delivery' },
                ] satisfies { id: PaymentMethod; label: string }[]
              ).map((opt) => (
                <label
                  key={opt.id}
                  className={cn(
                    'flex items-center justify-between p-3 cursor-pointer rounded border transition-colors min-h-[44px]',
                    method === opt.id
                      ? 'border-[--c-accent] bg-[--c-bg-elev-2]'
                      : 'border-[--c-border] hover:bg-[--c-bg-elev-2]'
                  )}
                >
                  <span className="text-sm">{opt.label}</span>
                  <input
                    type="radio"
                    name="pay"
                    value={opt.id}
                    checked={method === opt.id}
                    onChange={() => setMethod(opt.id)}
                    className="accent-[--c-accent] size-4"
                  />
                </label>
              ))}
            </div>
          </div>

          {method === 'card' ? (
            <Suspense fallback={null}>
              <StripePaymentElement
                clientSecret={stripeClientSecret}
                amount={total}
                currency="INR"
                onSuccess={(pi) => finishOrder(`Order placed · ${pi.id}`)}
                onError={(msg) => toast.error(msg)}
              />
            </Suspense>
          ) : null}

          {method === 'paypal' ? (
            <div className="c-card p-4">
              <Suspense fallback={null}>
                <PayPalCheckoutButton
                  amount={total}
                  currency="INR"
                  onSuccess={(orderId) => finishOrder(`Order placed · PayPal ${orderId}`)}
                  onError={(msg) => toast.error(msg)}
                  disabled={total <= 0}
                />
              </Suspense>
            </div>
          ) : null}

          {method === 'cod' ? (
            <button
              className="c-button-primary w-full"
              onClick={() => finishOrder('Order placed · ETA 28 minutes')}
            >
              PLACE ORDER · CASH ON DELIVERY
            </button>
          ) : null}
        </div>
      </section>
    </CustomerLayout>
  )
}

export function MyOrdersPage() {
  const navigate = useNavigate()
  const backendQ = useCustomerOrders()
  const [localQueue, setLocalQueue] = useState<QueuedOrder[]>(() => readOrdersQueue())

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'customer_orders_queue') setLocalQueue(readOrdersQueue())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Merge: backend orders (if any) + local queue entries the backend has not
  // confirmed yet. Show queued items distinctly so user knows sync state.
  const backendOrders = Array.isArray(backendQ.data) ? (backendQ.data as unknown[]) : []
  const hasBackendOrders = backendOrders.length > 0
  const showEmpty = !hasBackendOrders && localQueue.length === 0

  const relativeTime = (iso: string): string => {
    try {
      const placed = new Date(iso).getTime()
      const diffMin = Math.max(0, Math.round((Date.now() - placed) / 60_000))
      if (diffMin < 1) return 'Just now'
      if (diffMin < 60) return `${diffMin} min ago`
      const hr = Math.floor(diffMin / 60)
      if (hr < 24) return `${hr} h ago`
      const days = Math.floor(hr / 24)
      return `${days} d ago`
    } catch {
      return ''
    }
  }

  return (
    <CustomerLayout>
      <DocumentTitle title="My Orders — Spice Garden" />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="subtitle">YOUR HISTORY</p>
        <div className="c-divider !ml-0" />
        <h1 className="display text-3xl sm:text-4xl mb-8">My <span>Orders</span></h1>

        {showEmpty ? (
          <div className="c-card p-10 text-center">
            <Soup className="size-12 gold-text mx-auto mb-4" />
            <h3 className="text-xl mb-2">No orders yet</h3>
            <p className="text-sm text-[--c-text-soft] mb-5">When you place an order it will appear here.</p>
            <button className="c-button-primary" onClick={() => navigate('/menu')}>BROWSE MENU</button>
          </div>
        ) : (
          <ul className="space-y-3">
            {localQueue.map((o) => (
              <li key={o.id} className="c-card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono font-semibold">{o.serverOrderId ? `#${o.serverOrderId}` : o.id}</p>
                  <p className="text-xs text-[--c-text-muted]">{relativeTime(o.placedAt)} · {o.items.length} item{o.items.length === 1 ? '' : 's'} · {o.paymentMethod.toUpperCase()}</p>
                </div>
                <span className={cn(
                  'c-tag',
                  o.status === 'synced' ? '!text-green-400 !border-green-500/40' : '!text-amber-300 !border-amber-500/40',
                )}>
                  {o.status === 'synced' ? 'Confirmed' : 'Pending sync'}
                </span>
                <p className="display text-xl gold-text">₹{o.total.toLocaleString('en-IN')}</p>
              </li>
            ))}
            {/* Reserved for backend-fetched orders once /api/customer/orders/* lights up.
              * Render them above the local queue, identified by serverOrderId. */}
          </ul>
        )}
      </section>
    </CustomerLayout>
  )
}

const PROFILE_KEY = 'customer_profile_v2'

interface StoredProfile {
  name: string
  email: string
}

function readProfile(): StoredProfile {
  // Read identity from the canonical localStorage keys populated by the
  // CustomerLogin OTP flow (UserName / UserEmail) — falls back to the
  // older customer_profile_v2 cache, and finally to empty strings so a
  // freshly-signed-in user never sees stale sample data like "Ananya".
  if (typeof window === 'undefined') return { name: '', email: '' }
  const liveName = localStorage.getItem('UserName')
  const liveEmail = localStorage.getItem('UserEmail')
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null) {
        const obj = parsed as Partial<StoredProfile>
        return {
          name: liveName ?? (typeof obj.name === 'string' ? obj.name : '') ?? '',
          email: liveEmail ?? (typeof obj.email === 'string' ? obj.email : '') ?? '',
        }
      }
    }
  } catch {
    /* fall through */
  }
  return { name: liveName ?? '', email: liveEmail ?? '' }
}

function writeProfile(p: StoredProfile): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
}

export function ProfilePage() {
  const initial = readProfile()
  const [name, setName] = useState(initial.name)
  const [mobile] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('UserMobile') ?? '' : ''))
  const [email, setEmail] = useState(initial.email)
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Revoke object URLs when they go out of scope so we don't leak Blobs.
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropSource(reader.result)
        setCropperOpen(true)
      }
    }
    reader.readAsDataURL(file)
    // Reset so re-selecting the same file fires onChange again
    e.target.value = ''
  }

  const handleCropDone = (blob: Blob) => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(URL.createObjectURL(blob))
    toast.success('Profile photo updated')
  }

  return (
    <CustomerLayout>
      <DocumentTitle title="My Profile — Spice Garden" />
      <section className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="subtitle">ACCOUNT</p>
        <div className="c-divider !ml-0" />
        <h1 className="display text-3xl sm:text-4xl mb-8">My <span>Profile</span></h1>
        <div className="c-card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-full overflow-hidden border border-[--c-accent] bg-[--c-bg-elev-2] flex items-center justify-center shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              ) : (
                <Camera className="size-7 gold-text" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{name}</p>
              <p className="text-xs text-[--c-text-muted] truncate">{email}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 c-button-outline !py-1.5 !px-3 inline-flex items-center gap-1.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[--c-accent]/60 rounded"
              >
                <Camera className="size-3" /> Change photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChosen}
              />
            </div>
          </div>
          <div>
            <input className="c-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
            {errors.name ? <p className="text-xs text-red-400 mt-1">{errors.name}</p> : null}
          </div>
          <input className="c-input font-mono" value={mobile} disabled />
          <div>
            <input className="c-input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
            {errors.email ? <p className="text-xs text-red-400 mt-1">{errors.email}</p> : null}
          </div>
          <button
            className="c-button-primary w-full"
            onClick={async () => {
              const next: { name?: string; email?: string } = {}
              if (!name.trim() || name.trim().length < 2) next.name = 'Name must be at least 2 characters'
              if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Invalid email address'
              setErrors(next)
              if (Object.keys(next).length > 0) {
                toast.warning('Please fix the highlighted fields')
                return
              }
              // Update localStorage first (instant feedback) — then push to
              // backend if signed in. Backend failure falls back to the
              // local-only save so users never lose work.
              writeProfile({ name: name.trim(), email: email.trim() })
              localStorage.setItem('UserName', name.trim())
              localStorage.setItem('UserEmail', email.trim())
              if (tokens.getCustomer()) {
                const res = await updateCustomerProfile({
                  name: name.trim(),
                  email: email.trim(),
                  mobileNumber: mobile,
                })
                if (res.ok) {
                  toast.success('Profile saved')
                } else {
                  toast.warning('Saved locally — backend sync failed (' + res.message + ')')
                }
              } else {
                toast.success('Profile saved (local — sign in to sync)')
              }
            }}
          >
            SAVE CHANGES
          </button>
        </div>
      </section>
      <Suspense fallback={null}>
        <ImageCropper
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          image={cropSource}
          aspect={1}
          cropShape="round"
          title="Crop profile photo"
          onCropComplete={handleCropDone}
        />
      </Suspense>
    </CustomerLayout>
  )
}

/* ====================================================================== */
/* About / Terms / Privacy / Refund — legacy parity                       */
/* ====================================================================== */

const TEAM = [
  { name: 'Chef Aarav Kapoor', role: 'Executive Chef', img: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=600&q=80' },
  { name: 'Riya Mehta',        role: 'Sommelier',       img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80' },
  { name: 'Daniel Pinto',      role: 'Maître d\'',      img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sneha Iyer',        role: 'Pastry Chef',     img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80' },
]

export function AboutPage() {
  return (
    <CustomerLayout>
      <DocumentTitle
        title="About Spice Garden — Our Story"
        description="Learn the story behind Spice Garden Steakhouse — our heritage, our chefs, and the philosophy that guides every plate we serve."
      />
      <HeroSection
        bg={HERO_IMAGES.about}
        subtitle="HERITAGE & PASSION"
        titleA="The Story of"
        titleAccent="Spice Garden"
        description="Founded on the simple belief that great food brings people together. We have spent over a decade perfecting recipes, sourcing the finest ingredients, and welcoming guests as family."
      />

      {/* Our Story */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <img
            src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80"
            alt="Our restaurant"
            className="rounded-lg c-card object-cover w-full h-full"
          />
          <div className="space-y-5">
            <p className="subtitle">OUR STORY</p>
            <div className="c-divider !ml-0" />
            <h2 className="display text-3xl sm:text-4xl">From a Small Kitchen to a <span>Beloved Steakhouse</span></h2>
            <p className="text-sm text-[--c-text-soft] leading-relaxed">
              Spice Garden began in 2012 as a small neighbourhood eatery in Bandra. Word of our slow-cooked
              butter chicken and char-grilled kebabs travelled fast, and one branch grew to three. We have
              never compromised on the things that matter — fresh ingredients, classical techniques, and
              warm, attentive hospitality.
            </p>
            <p className="text-sm text-[--c-text-soft] leading-relaxed">
              Today our kitchens are led by Chef Aarav Kapoor and a team of seasoned cooks who treat every
              plate as a personal signature. Whether you join us in the dining room or order in, you are
              tasting more than a decade of craft.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Mission */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { Icon: Leaf, title: 'Honest Ingredients', text: 'Sourced daily from trusted farms, butchers, and spice merchants. Nothing frozen, nothing shortcut.' },
            { Icon: ChefHat, title: 'Classical Craft', text: 'Slow gravies, hand-rolled breads, and recipes refined over a decade by chefs who care.' },
            { Icon: Users, title: 'Warm Hospitality', text: 'Every guest treated like family. Every visit memorable, whether for two or twenty.' },
          ].map(({ Icon, title, text }, i) => (
            <ScrollReveal key={title} delay={i * 0.08} className="c-card p-6 text-center">
              <div className="inline-flex size-14 rounded-full border border-[--c-accent] items-center justify-center gold-text mb-4">
                <Icon className="size-6" />
              </div>
              <h3 className="text-xl mb-2">{title}</h3>
              <p className="text-sm text-[--c-text-soft]">{text}</p>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* Team */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="subtitle">THE PEOPLE BEHIND THE PLATE</p>
          <div className="c-divider" />
          <h2 className="display text-3xl sm:text-4xl">Meet Our <span>Team</span></h2>
        </div>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {TEAM.map((m, i) => (
            <ScrollReveal as="li" key={m.name} delay={i * 0.08} className="c-card overflow-hidden">
              <div className="aspect-square overflow-hidden">
                <img src={m.img} alt={m.name} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>
              <div className="p-4 text-center">
                <p className="display text-xl">{m.name}</p>
                <p className="subtitle text-[10px] mt-1">{m.role}</p>
              </div>
            </ScrollReveal>
          ))}
        </ul>
      </ScrollReveal>
    </CustomerLayout>
  )
}

/* ---- Shared legal-page layout helpers ---- */

function LegalHeader({ icon: Icon, eyebrow, titleA, titleAccent, intro }: {
  icon: typeof ShieldCheck
  eyebrow: string
  titleA: string
  titleAccent: string
  intro: string
}) {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10 text-center">
      <div className="inline-flex size-14 rounded-full border border-[--c-accent] items-center justify-center gold-text mb-4">
        <Icon className="size-6" />
      </div>
      <p className="subtitle">{eyebrow}</p>
      <div className="c-divider" />
      <h1 className="display text-4xl sm:text-5xl">{titleA} <span>{titleAccent}</span></h1>
      <p className="text-sm text-[--c-text-soft] mt-5 max-w-xl mx-auto">{intro}</p>
      <p className="text-xs text-[--c-text-muted] mt-2">Last updated: 1 January 2026</p>
    </section>
  )
}

function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="display text-2xl mb-3">{heading}</h2>
      <div className="c-divider !ml-0 !mt-0" />
      <div className="text-sm text-[--c-text-soft] leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  )
}

export function TermsPage() {
  return (
    <CustomerLayout>
      <DocumentTitle
        title="Terms of Service — Spice Garden"
        description="Read the terms and conditions that govern your use of the Spice Garden website, ordering platform, and dine-in reservations."
      />
      <LegalHeader
        icon={FileText}
        eyebrow="THE LEGAL BITS"
        titleA="Terms of"
        titleAccent="Service"
        intro="Please read these terms carefully before using our website or placing an order. By using Spice Garden services, you agree to these terms."
      />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <LegalSection heading="1. Acceptance of Terms">
          <p>
            By accessing or using the Spice Garden website, mobile site, or any of our digital ordering
            interfaces (collectively, the "Service"), you agree to be bound by these Terms of Service.
            If you do not agree, please do not use the Service.
          </p>
        </LegalSection>

        <LegalSection heading="2. Eligibility">
          <p>
            You must be at least 18 years old to place an order or make a reservation. By using the
            Service you confirm that the information you provide is accurate and that you have the legal
            authority to enter into this agreement.
          </p>
        </LegalSection>

        <LegalSection heading="3. Orders and Payment">
          <ul className="list-disc pl-5 space-y-2">
            <li>All prices are listed in INR and are inclusive of applicable taxes unless stated otherwise.</li>
            <li>We accept major credit and debit cards, UPI, net banking, PayPal, and cash on delivery where available.</li>
            <li>An order is confirmed only after our system has accepted it and you have received a confirmation message.</li>
            <li>We reserve the right to refuse or cancel an order at our discretion, for reasons including but not limited to suspected fraud, unavailable items, or delivery-area restrictions.</li>
          </ul>
        </LegalSection>

        <LegalSection heading="4. Delivery">
          <p>
            Delivery times are estimates. Conditions such as weather, traffic, or high demand may cause
            delays. We will make reasonable efforts to inform you of any significant delay. Risk of loss
            for items passes to you on delivery.
          </p>
        </LegalSection>

        <LegalSection heading="5. Reservations">
          <p>
            Tables are held for fifteen (15) minutes past the reserved time. After that, we may release
            the table to walk-in guests. Cancellations should be made at least two hours in advance.
          </p>
        </LegalSection>

        <LegalSection heading="6. User Conduct">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use the Service for unlawful purposes or to violate any laws.</li>
            <li>Impersonate any person or entity, or misrepresent your affiliation with a person or entity.</li>
            <li>Interfere with or disrupt the Service or servers.</li>
            <li>Attempt to gain unauthorized access to any portion of the Service.</li>
          </ul>
        </LegalSection>

        <LegalSection heading="7. Intellectual Property">
          <p>
            All content on the Service — including text, photographs, graphics, logos, and the
            "Spice Garden" name — is owned by us or our licensors and is protected by applicable
            copyright and trademark law. You may not reuse this content without written permission.
          </p>
        </LegalSection>

        <LegalSection heading="8. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, Spice Garden is not liable for any indirect,
            incidental, or consequential damages arising out of your use of the Service. Our total
            liability for any claim related to your order shall not exceed the amount you paid for that
            order.
          </p>
        </LegalSection>

        <LegalSection heading="9. Changes to the Terms">
          <p>
            We may update these terms from time to time. Continued use of the Service after changes are
            posted constitutes acceptance of the updated terms. Material changes will be highlighted on
            this page.
          </p>
        </LegalSection>

        <LegalSection heading="10. Contact">
          <p>
            Questions about these terms? Reach us at <span className="gold-text">hello@spicegarden.com</span>
            {' '}or call <span className="gold-text">+91 9876543210</span>.
          </p>
        </LegalSection>
      </article>
    </CustomerLayout>
  )
}

export function PrivacyPage() {
  return (
    <CustomerLayout>
      <DocumentTitle
        title="Privacy Policy — Spice Garden"
        description="Learn what personal information Spice Garden collects, how we use it, and your rights as a customer."
      />
      <LegalHeader
        icon={ShieldCheck}
        eyebrow="YOUR DATA, RESPECTED"
        titleA="Privacy"
        titleAccent="Policy"
        intro="Your trust matters. This policy explains what data we collect, why we collect it, and the choices you have."
      />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <LegalSection heading="1. Information We Collect">
          <p>We collect information that you provide directly to us, including:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[--c-text]">Account details</strong> — name, mobile number, email address, and password (encrypted).</li>
            <li><strong className="text-[--c-text]">Order details</strong> — delivery addresses, special instructions, and order history.</li>
            <li><strong className="text-[--c-text]">Payment information</strong> — payment is processed by our PCI-DSS compliant partners (Stripe, PayPal, and others). We do not store full card numbers on our servers.</li>
            <li><strong className="text-[--c-text]">Usage data</strong> — device type, IP address, pages visited, and similar diagnostics, collected through cookies and analytics tools.</li>
          </ul>
        </LegalSection>

        <LegalSection heading="2. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-2">
            <li>To process orders, reservations, and payments.</li>
            <li>To send order updates, receipts, and reservation confirmations.</li>
            <li>To improve our menu, pricing, and customer experience.</li>
            <li>To send marketing communications, where you have opted in. You can opt out anytime.</li>
            <li>To prevent fraud, enforce our terms, and comply with applicable law.</li>
          </ul>
        </LegalSection>

        <LegalSection heading="3. Sharing Your Information">
          <p>We share information only when necessary:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>With delivery partners to fulfil your order.</li>
            <li>With payment processors to handle transactions.</li>
            <li>With analytics and infrastructure providers under strict confidentiality.</li>
            <li>When required by law or to protect our legal rights.</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </LegalSection>

        <LegalSection heading="4. Data Retention">
          <p>
            We retain personal information for as long as your account is active or as needed to provide
            services. We may retain certain records longer where required by law (for example, tax or
            accounting records).
          </p>
        </LegalSection>

        <LegalSection heading="5. Security">
          <p>
            We use industry-standard security practices — encrypted connections (TLS), hashed passwords,
            access controls, and regular reviews — to protect your information. No system is perfectly
            secure, but we are committed to safeguarding your data.
          </p>
        </LegalSection>

        <LegalSection heading="6. Cookies">
          <p>
            Our website uses cookies and similar technologies to remember your preferences, keep you
            signed in, and measure how the site is used. You can disable cookies in your browser
            settings, though some features may not work correctly without them.
          </p>
        </LegalSection>

        <LegalSection heading="7. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Access the personal information we hold about you.</li>
            <li>Correct inaccurate or incomplete information.</li>
            <li>Request deletion of your account and associated data, subject to legal retention requirements.</li>
            <li>Opt out of marketing communications.</li>
          </ul>
          <p>To exercise these rights, email <span className="gold-text">privacy@spicegarden.com</span>.</p>
        </LegalSection>

        <LegalSection heading="8. Children's Privacy">
          <p>
            Our Service is not directed to children under 13. We do not knowingly collect personal
            information from children. If you believe a child has provided us with personal information,
            please contact us so we can remove it.
          </p>
        </LegalSection>

        <LegalSection heading="9. Updates to This Policy">
          <p>
            We may update this policy from time to time. The "last updated" date at the top of this
            page reflects the most recent revision. Material changes will be highlighted.
          </p>
        </LegalSection>

        <LegalSection heading="10. Contact">
          <p>
            Questions or concerns? Write to us at <span className="gold-text">privacy@spicegarden.com</span> or
            our registered address: 123 Sea Breeze Lane, Bandra West, Mumbai · 400050.
          </p>
        </LegalSection>
      </article>
    </CustomerLayout>
  )
}

export function RefundPage() {
  return (
    <CustomerLayout>
      <DocumentTitle
        title="Refund & Cancellation Policy — Spice Garden"
        description="Our policy for cancelling orders, requesting refunds, and resolving issues with your Spice Garden experience."
      />
      <LegalHeader
        icon={RotateCcw}
        eyebrow="HOW WE MAKE IT RIGHT"
        titleA="Refund &"
        titleAccent="Cancellation"
        intro="If something is not right with your order, we want to fix it. Here is how we handle cancellations, refunds, and resolutions."
      />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <LegalSection heading="1. Order Cancellation">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[--c-text]">Within 2 minutes of placing the order</strong> — full refund, no questions asked. Cancel from the "My Orders" page or call the branch.</li>
            <li><strong className="text-[--c-text]">After preparation has started</strong> — cancellation may not be possible. If we can cancel, a partial refund covering uncooked items may be offered.</li>
            <li><strong className="text-[--c-text]">After the order is out for delivery</strong> — cancellation is not available.</li>
          </ul>
        </LegalSection>

        <LegalSection heading="2. Reservation Cancellation">
          <p>
            Table reservations can be cancelled or rescheduled free of charge up to two (2) hours before
            the reserved time. No-shows or last-minute cancellations may be charged a nominal fee for
            parties of six or more.
          </p>
        </LegalSection>

        <LegalSection heading="3. Refund Eligibility">
          <p>You may be eligible for a full or partial refund if:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>An item was missing from your delivery.</li>
            <li>The wrong item was delivered.</li>
            <li>The food quality did not meet our standards on arrival.</li>
            <li>Your order arrived more than 60 minutes past the promised time without prior notification.</li>
            <li>A duplicate payment was processed.</li>
          </ul>
        </LegalSection>

        <LegalSection heading="4. How to Request a Refund">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Contact us within 24 hours of receiving the order.</li>
            <li>Provide your order ID (KOT number) and a brief description of the issue.</li>
            <li>Share photos of the issue where possible — this helps us resolve faster.</li>
            <li>Reach us at <span className="gold-text">support@spicegarden.com</span> or call <span className="gold-text">+91 9876543210</span>.</li>
          </ol>
        </LegalSection>

        <LegalSection heading="5. Refund Processing Time">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[--c-text]">Credit / Debit cards</strong> — 5 to 7 business days.</li>
            <li><strong className="text-[--c-text]">UPI / Net banking</strong> — 3 to 5 business days.</li>
            <li><strong className="text-[--c-text]">PayPal</strong> — within 24 hours, subject to PayPal processing.</li>
            <li><strong className="text-[--c-text]">Wallet credits</strong> — instant.</li>
          </ul>
          <p>
            Refunds are issued to the original payment method. Delays beyond these estimates are usually
            on the bank or processor side; please contact them if you do not see the credit.
          </p>
        </LegalSection>

        <LegalSection heading="6. Non-Refundable Situations">
          <p>Refunds are generally not issued when:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>The complaint is raised more than 24 hours after delivery.</li>
            <li>The order was customised against our recommendation (e.g. extra well-done meat).</li>
            <li>The delivery address provided was incorrect.</li>
            <li>The recipient was unavailable at the address and did not respond to delivery calls.</li>
          </ul>
        </LegalSection>

        <LegalSection heading="7. Goodwill Credits">
          <p>
            Where a full refund is not warranted but we agree something fell short, we may issue
            goodwill wallet credit toward a future order. This is at our discretion and is not a
            replacement for a legally owed refund.
          </p>
        </LegalSection>

        <LegalSection heading="8. Dispute Resolution">
          <p>
            If you are not satisfied with the outcome of a refund request, you may escalate by emailing
            <span className="gold-text"> escalations@spicegarden.com</span>. Our customer experience lead
            will review and respond within three business days.
          </p>
        </LegalSection>

        <LegalSection heading="9. Updates">
          <p>
            We may update this policy from time to time. The "last updated" date at the top of this
            page reflects the most recent revision.
          </p>
        </LegalSection>
      </article>
    </CustomerLayout>
  )
}
