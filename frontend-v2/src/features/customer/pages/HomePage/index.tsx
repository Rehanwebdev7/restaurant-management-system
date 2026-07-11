import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Star, Award, ChefHat, Leaf,
  Calendar, Camera, ShoppingBag, Clock, ChevronDown
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
import {
  HERO_IMAGES, useCart, useCustomerCatalog,
  useSelectedBranchId,
} from '@/features/customer/catalog'
import { useCustomerSliders } from '@/api/queries/customer'
import { submitPublicReservation } from '@/api/services/customer'
import GallerySlider from '@/features/customer/pages/HomePage/GallerySlider'
import ChefSignatures from '@/features/customer/pages/HomePage/ChefSignatures'
import ChefStorySection from '@/features/customer/pages/HomePage/ChefStorySection'
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
  const catalog = useCustomerCatalog()
  const { branchId } = useSelectedBranchId()
  const slidersQ = useCustomerSliders(branchId)
  const mounted = useMounted(200)
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
        title="Spice Garden Steakhouse — Hand-Crafted Indian Dining"
        description="Reserve a table or order online from Spice Garden — chef-crafted Indian cuisine, signature kebabs, butter chicken, and more. Three branches across Mumbai."
      />

      {/* Premium Hero Rotator Reveal — image cycling only (video removed
       * per user feedback). Backend sliders take precedence via heroImages. */}
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
        withCurve
      />

      {/* Chef's Signatures — replaces the cream section + CategoryChain orbit
       * + full Popular Dishes grid (2026-07-10, per user request).
       * Real backend `isRecommended` items with editorial 4-card layout +
       * "Explore The Full Menu" CTA. Full menu still lives on /menu. */}
      <ChefSignatures />

      {/* Auto-scrolling gallery strip — horizontal linked to vertical page scroll */}
      <ScrollReveal><GallerySlider /></ScrollReveal>

      {/* Brand story showcase — editorial restaurant identity anchor.
       * Replaces the earlier FeaturedSpotlight (broken dish images) with
       * a warm brand-story block using real backend `aboutUs` + derivable
       * highlights. MenuCategoriesGrid removed per user feedback ("home
       * page br menu ki jarurat nahi"). */}
      <BrandStoryShowcase />

      {/* Three ways to enjoy — Dine / Delivery / Reserve */}
      <SignatureExperience />

      {/* Cinematic Ken Burns lifestyle separator */}
      <LifestyleBanner
        eyebrow="THE ART OF HOSPITALITY"
        quote="Great food is memory in the making — cooked with intention, served with warmth, and shared without hurry."
        attribution="Our Kitchen Philosophy"
      />

      {/* How It Works — 3-step editorial */}
      <HowItWorks />

      {/* Why Dine with Us Segment */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[--c-border]">
        <div className="text-center mb-12">
          <p className="subtitle">WHY DINE WITH US</p>
          <div className="c-divider" />
          <h2 className="display text-3xl sm:text-4xl">Crafted with <span>Heart</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { Icon: ChefHat, title: 'Hand-Crafted by Chefs', text: 'Every dish prepared fresh by our experienced kitchen team.' },
            { Icon: Leaf, title: 'Farm-Fresh Ingredients', text: 'Sourced daily from trusted local farms for peak flavour.' },
            { Icon: Award, title: 'Award-Winning Recipes', text: 'Heritage recipes refined over decades for an unforgettable bite.' },
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
       * self-gates on `useSeedMode()` so real tenants see only their own data. */}
      <ScrollReveal><ChefStorySection /></ScrollReveal>
      <ScrollReveal><AwardsTimeline /></ScrollReveal>
      <PressMarquee />
      <ScrollReveal><StoryTimeline /></ScrollReveal>
      <ScrollReveal><TestimonialsSection /></ScrollReveal>
      <StatsSection />
      <ScrollReveal><FAQAccordion /></ScrollReveal>
      <ScrollReveal><ReservationCallToActionSection /></ScrollReveal>
      <BranchLocator />
      <ScrollReveal><NewsletterSection /></ScrollReveal>
      <ScrollReveal><InstagramFeedSection /></ScrollReveal>

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
            viewport={{ once: false, margin: '-60px' }}
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
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '', guests: 2 })
  const [submitting, setSubmitting] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['15%', '-25%'])

  const handleDateChange = (d: Date | undefined) => {
    if (!d) {
      setForm({ ...form, date: '' })
      return
    }
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setForm({ ...form, date: `${yyyy}-${mm}-${dd}` })
  }

  const submit = async () => {
    if (!form.name || !/^[6-9]\d{9}$/.test(form.phone) || !form.date || !form.time) {
      toast.warning('Please enter your name, valid 10-digit mobile, date and time')
      return
    }
    setSubmitting(true)
    // Wire real backend POST /api/customer/table_booking/public/add.
    // Note (verified in backend audit): `guests` and `notes` are silently
    // dropped by the current TableBookingEntity — user-approved trade-off
    // until backend columns are added. Restaurant team receives name+phone+date+time.
    const result = await submitPublicReservation({
      name: form.name.trim(),
      phone: form.phone,
      date: form.date,
      time: form.time,
      guests: form.guests,
    })
    setSubmitting(false)
    if (!result.ok) {
      toast.error(result.message || 'Reservation failed — please try again or call us directly.')
      return
    }
    toast.success(
      `Table request received — booking #${result.data.reservationId}. We'll call to confirm shortly.`,
    )
    setForm({ name: '', phone: '', date: '', time: '', guests: 2 })
  }
  return (
    <section ref={sectionRef} className="relative py-24 my-16 overflow-hidden">
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 -top-[20%] -bottom-[20%] bg-cover bg-center"
        style={{
          y: bgY,
          backgroundImage: 'url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1280&q=75)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/90 to-black/95"
      />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="subtitle">RESERVE YOUR TABLE</p>
        <div className="c-divider" />
        <h2 className="display text-3xl sm:text-5xl mb-4">Book a <span>Memorable</span> Evening</h2>
        <p className="text-sm text-[--c-text-soft] mb-8 max-w-md mx-auto">Walk-ins are welcome but we recommend booking ahead to guarantee your favorite table.</p>
        <div className="c-card p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto rounded-2xl bg-black/50 backdrop-blur-md border border-[--c-border]">
          <input className="c-input bg-white/5 border-white/10" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="c-input bg-white/5 border-white/10" inputMode="numeric" maxLength={10} placeholder="10-digit mobile" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
          <div className="relative">
            <span className="absolute left-3 top-[6px] text-[--c-text-muted] text-[9px] font-bold tracking-wider uppercase z-10">Date</span>
            <DateField
              value={form.date ? new Date(form.date) : undefined}
              onChange={handleDateChange}
              placeholder="Select date"
              className="c-input-selector font-normal"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-[6px] text-[--c-text-muted] text-[9px] font-bold tracking-wider uppercase z-10">Time</span>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="c-input-selector font-normal cursor-pointer"
                >
                  <Clock className="size-4 text-[--c-text-muted] absolute left-4 bottom-[8px]" />
                  <span>{form.time ? formatTimeLabel(form.time) : 'Select time'}</span>
                  <ChevronDown className="size-4 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 bg-black/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl text-white z-50">
                <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
                  <p className="text-[10px] font-bold text-[--c-accent] uppercase tracking-wider mb-2">Lunch Slots</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TIME_SLOTS.slice(0, 7).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, time: t })}
                        className={cn(
                          "text-[10px] py-1.5 px-1 rounded-lg text-center cursor-pointer transition-colors border",
                          form.time === t 
                            ? "bg-[var(--c-primary)] border-[var(--c-primary)] text-white font-bold" 
                            : "bg-white/5 border-white/10 text-[--c-text-soft] hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {formatTimeLabel(t)}
                      </button>
                    ))}
                  </div>
                  <div className="h-px bg-white/10 my-3" />
                  <p className="text-[10px] font-bold text-[--c-accent] uppercase tracking-wider mb-2">Dinner Slots</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TIME_SLOTS.slice(7).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, time: t })}
                        className={cn(
                          "text-[10px] py-1.5 px-1 rounded-lg text-center cursor-pointer transition-colors border",
                          form.time === t 
                            ? "bg-[var(--c-primary)] border-[var(--c-primary)] text-white font-bold" 
                            : "bg-white/5 border-white/10 text-[--c-text-soft] hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {formatTimeLabel(t)}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <input className="c-input sm:col-span-2 bg-white/5 border-white/10" type="number" min={1} max={20} placeholder="Number of guests" value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} onWheel={(e) => e.currentTarget.blur()} />
          <button
            className="c-button-primary sm:col-span-2 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={submit}
            disabled={submitting}
          >
            <Calendar className="size-4" />
            {submitting ? 'RESERVING…' : 'RESERVE TABLE NOW'}
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[--c-border]">
      <ScrollReveal className="text-center mb-10">
        <p className="subtitle">FOLLOW OUR JOURNEY</p>
        <div className="c-divider" />
        <h2 className="display text-3xl sm:text-4xl"><span>@spicegarden</span> · Instagram</h2>
      </ScrollReveal>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {INSTAGRAM_FEED.map((src, i) => (
          <ScrollReveal as="li" key={i} delay={i * 0.06} className="relative aspect-square overflow-hidden group cursor-pointer rounded-xl">
            <img src={src} alt={`Instagram post ${i + 1}`} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all duration-300 grid place-items-center">
              <Camera className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </ScrollReveal>
        ))}
      </ul>
      <div className="text-center mt-8">
        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="c-button-outline inline-flex items-center gap-2 px-6 py-2.5 rounded-full">
          FOLLOW @SPICEGARDEN
        </a>
      </div>
    </section>
  )
}
