import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Star, ChevronRight, Award, ChefHat, Leaf,
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
import {
  useCustomerSliders, useRestaurantHours,
  useHomeTestimonials, useHomeStats, useHomeInstagram, useHomeWhyDine,
} from '@/api/queries/customer'
import { submitPublicReservation } from '@/api/services/customer'
import DishCardRound, { DishCardRoundGridSkeleton } from '@/features/customer/DishCardRound'
import CategoryChainSection from '@/features/customer/pages/HomePage/CategoryChainSection'
import GallerySlider from '@/features/customer/pages/HomePage/GallerySlider'
import '@/styles/customer.css'

export function HomePage() {
  const navigate = useNavigate()
  const catalog = useCustomerCatalog()
  const { branchId } = useSelectedBranchId()
  const slidersQ = useCustomerSliders(branchId)
  const mounted = useMounted(200)

  const [selectedCat, setSelectedCat] = useState<string | null>(null)

  // Memoized dishes filtered by local category state
  const featuredDishes = useMemo(() => {
    const list = catalog.dishes
    if (!selectedCat) return list.slice(0, 8)
    return list.filter(d => d.category === selectedCat).slice(0, 8)
  }, [catalog.dishes, selectedCat])

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

      {/* Premium Hero Rotator Reveal — with bottom wavy curve into beige section */}
      <HeroSection
        bg={HERO_IMAGES.home}
        subtitle="FRESH & DELICIOUS MEALS"
        titleA="Delicious Food &"
        titleAccent="Great Taste"
        description="Enjoy great food and a wonderful dining atmosphere. Every dish is prepared with fresh, high-quality ingredients."
        primaryCta="ORDER NOW"
        primaryOnClick={() => navigate('/menu')}
        secondaryCta="RESERVE A TABLE"
        secondaryOnClick={() => window.dispatchEvent(new CustomEvent('customer:open-reservation'))}
        showRotator
        heroImages={heroImages}
        withCurve
      />

      <OpenClosedBadge />

      {/* Unified cream section — SVG dome bleeds up into the hero, then a
       * flat body holds:
       *  1. Floating category orbit (nodes ride the SVG dome via CSS var)
       *  2. "CHEF'S SPECIALS" + "Explore by Category" heading
       *  3. Popular Dishes grid with staggered right-to-left entrance */}
      <section className="cream-section">
        {/* Smooth dome — cubic bezier ensures zero corner artifacts.
         * `preserveAspectRatio="none"` stretches to viewport width. */}
        <svg
          className="cream-dome"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M0,200 L0,120 C 480,-40 960,-40 1440,120 L1440,200 Z" />
        </svg>

        <CategoryChainSection
          selected={selectedCat}
          onSelect={(id) => setSelectedCat(id)}
        />

        <div className="dish-grid-header">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="subtitle"
          >
            CHEF'S SIGNATURE
          </motion.p>
          <div className="c-divider" />
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="display text-3xl sm:text-4xl lg:text-5xl"
          >
            Popular <span>Dishes</span>
          </motion.h2>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4">
          {!mounted ? (
            <DishCardRoundGridSkeleton count={8} />
          ) : featuredDishes.length === 0 ? (
            <p className="text-center text-[var(--c-cream-text-soft)] py-12">No dishes match this category. Try exploring the menu!</p>
          ) : (
            <>
              <motion.ul
                layout
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {featuredDishes.map((d, i) => {
                    // Stagger cards in each row for a smooth, premium entrance animation as the user scrolls.
                    const delay = (i % 4) * 0.08
                    return (
                      <motion.li
                        layout
                        initial={{ opacity: 0, y: 40, scale: 0.94 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: false, margin: '-40px' }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          duration: 0.6,
                          delay,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        key={d.id}
                        className="list-none w-full"
                      >
                        <DishCardRound dish={d} />
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </motion.ul>

              <div className="mt-10 flex flex-col items-center gap-3">
                <button
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-extrabold text-[11px] tracking-[0.18em] uppercase text-white cursor-pointer transition-all"
                  style={{
                    background: 'var(--c-teal)',
                    boxShadow: '0 10px 24px var(--c-teal-glow)',
                  }}
                  onClick={() => navigate('/menu')}
                >
                  EXPLORE FULL MENU
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Auto-scrolling gallery strip — horizontal linked to vertical page scroll */}
      <GallerySlider />

      {/* Why Dine with Us — CREAM bg (2026-07-15 user request). White
       * cards on cream with brass icon rings + ink text. */}
      <div style={{ background: 'var(--c-cream, #FAF6F0)' }} className="w-full">
        <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{ color: 'var(--c-accent, #C89B3C)' }}
            >
              Why Dine With Us
            </p>
            <div
              className="mx-auto my-3 h-[1.5px] w-16"
              style={{ background: 'var(--c-accent, #C89B3C)' }}
            />
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                fontWeight: 500,
                color: 'var(--c-text-dark, #1A1210)',
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
              }}
            >
              Crafted with{' '}
              <span
                style={{
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: 'var(--c-accent, #C89B3C)',
                }}
              >
                Heart
              </span>
            </h2>
          </div>
          <WhyDineTiles />
        </ScrollReveal>
      </div>

      <ScrollReveal><TestimonialsSection /></ScrollReveal>
      <StatsSection />
      <ScrollReveal><ReservationCallToActionSection /></ScrollReveal>
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

/**
 * OpenClosedBadge — subtle pill beneath hero showing today's open/close
 * window. Silent when backend has no hours configured.
 */
function OpenClosedBadge() {
  const hoursQ = useRestaurantHours()
  const status = useMemo(() => {
    const list = hoursQ.data ?? []
    if (list.length === 0) return null
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    const now = new Date()
    const today = dayNames[now.getDay()] ?? ''
    const todaysHours = list.find((h) => (h.dayOfWeek ?? '').toUpperCase() === today)
    if (!todaysHours) return null
    if (todaysHours.isClosed) return { isOpen: false, label: 'Closed today', detail: '' }
    if (!todaysHours.openTime || !todaysHours.closeTime) return null
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const toMin = (t: string): number => {
      const [h, m] = t.split(':').map(Number)
      return (h ?? 0) * 60 + (m ?? 0)
    }
    const openMin = toMin(todaysHours.openTime)
    const closeMin = toMin(todaysHours.closeTime)
    const isOpen = nowMin >= openMin && nowMin <= closeMin
    return {
      isOpen,
      label: isOpen ? 'Open now' : 'Closed now',
      detail: `${todaysHours.openTime} – ${todaysHours.closeTime}`,
    }
  }, [hoursQ.data])

  if (!status) return null
  return (
    <div className="flex justify-center -mt-4 mb-4 relative z-10">
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest backdrop-blur-md shadow-lg"
        style={{
          background: status.isOpen ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: status.isOpen ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
          border: `1px solid ${status.isOpen ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
        }}
      >
        <span className="size-2 rounded-full" style={{ background: 'currentColor' }} aria-hidden />
        {status.label}
        {status.detail ? <span className="opacity-70 normal-case font-medium">· {status.detail}</span> : null}
      </div>
    </div>
  )
}

// 2026-07-16: "Why Dine" tiles driven by restaurant_content_blocks
// (page=HOME, section_type=WHY_DINE). Falls back to a safe 3-tile default
// so a tenant that hasn't seeded content still sees a filled section.
function WhyDineTiles() {
  const whyQ = useHomeWhyDine()
  const iconMap: Record<string, typeof ChefHat> = { ChefHat, Leaf, Award }
  const rows = (whyQ.data ?? []).map((b) => ({
    id: b.id,
    Icon: iconMap[b.iconName ?? ''] ?? ChefHat,
    title: b.title ?? '',
    text: b.description ?? b.subtitle ?? '',
  }))
  const fallback = [
    { id: -1, Icon: ChefHat, title: 'Hand-Crafted by Chefs', text: 'Every dish prepared fresh by our experienced kitchen team.' },
    { id: -2, Icon: Leaf, title: 'Farm-Fresh Ingredients', text: 'Sourced daily from trusted local farms for peak flavour.' },
    { id: -3, Icon: Award, title: 'Award-Winning Recipes', text: 'Heritage recipes refined over decades for an unforgettable bite.' },
  ]
  const list = rows.length > 0 ? rows : fallback
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {list.map(({ id, Icon, title, text }, i) => (
        <ScrollReveal
          key={id}
          delay={i * 0.08}
          className="p-8 text-center group hover:-translate-y-1.5 transition-all duration-300 rounded-2xl"
          style={{
            background: 'linear-gradient(180deg, #E8F5F4 0%, #D4EDEB 100%)',
            border: '1px solid rgba(47, 184, 176, 0.28)',
            boxShadow: '0 10px 26px rgba(47, 184, 176, 0.15), 0 2px 6px rgba(47, 184, 176, 0.08)',
          }}
        >
          <div
            className="inline-flex size-16 rounded-full items-center justify-center mb-5 transition-all group-hover:scale-110"
            style={{
              border: '1.5px solid var(--c-accent, #C89B3C)',
              color: 'var(--c-accent, #C89B3C)',
            }}
          >
            <Icon className="size-7" />
          </div>
          <h3
            className="text-xl font-semibold mb-3"
            style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
              color: 'var(--c-text-dark, #1A1210)',
              fontSize: '22px',
            }}
          >
            {title}
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--c-text-dark, #1A1210)', opacity: 0.7 }}
          >
            {text}
          </p>
        </ScrollReveal>
      ))}
    </div>
  )
}

function StatsSection() {
  const statsQ = useHomeStats()
  const stats = (statsQ.data ?? []).map((b) => {
    // Backend stores e.g. title="200+", subtitle="Authentic Dishes". Split
    // the numeric part vs the suffix so we can drive <CountUp>.
    const raw = b.title ?? ''
    const match = raw.match(/^([\d,]+)\s*(.*)$/)
    const value = match ? Number((match[1] ?? '').replace(/,/g, '')) || 0 : 0
    const suffix = match ? (match[2] ?? '') : ''
    return { id: b.id, value, suffix, label: b.subtitle ?? '' }
  })
  if (stats.length === 0) return null
  return (
    <section className="sg-section-dark w-full">
      <ScrollReveal as="div" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
          {stats.map((s, i) => (
            <ScrollReveal key={s.id} delay={i * 0.1} className="sg-tile p-5 sm:p-8 rounded-2xl">
              <p className="display text-3xl sm:text-5xl gold-text leading-none font-bold">
                <CountUp value={s.value} suffix={s.suffix} />
              </p>
              <p className="subtitle text-[10px] sm:text-[11px] mt-3 font-semibold uppercase tracking-wider">{s.label}</p>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>
    </section>
  )
}

function TestimonialsSection() {
  const testimonialsQ = useHomeTestimonials()
  const testimonials = (testimonialsQ.data ?? []).map((b) => ({
    id: b.id,
    quote: b.description ?? '',
    name: b.title ?? '',
    role: b.subtitle ?? '',
    rating: typeof (b.meta as Record<string, unknown> | null)?.rating === 'number'
      ? (b.meta as { rating: number }).rating
      : 5,
  }))
  if (testimonials.length === 0) return null
  // Compact 3-across layout. WRAPPED in a full-width cream section
  // (2026-07-15) so the page reads cream → dark → cream → dark rhythm
  // instead of a monotone all-dark scroll. Text colors overridden inline
  // (ink on cream) so cards read correctly on the new background.
  return (
    <section
      className="relative w-full py-20"
      style={{ background: 'var(--c-cream, #FAF6F0)', color: 'var(--c-text-dark, #1A1210)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-10">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.28em]"
            style={{ color: 'var(--c-accent, #C89B3C)' }}
          >
            What Guests Say
          </p>
          <div
            className="mx-auto my-3 h-[1.5px] w-16"
            style={{ background: 'var(--c-accent, #C89B3C)' }}
          />
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl"
            style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
              fontWeight: 500,
              color: 'var(--c-text-dark, #1A1210)',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            Loved by{' '}
            <span
              style={{
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--c-accent, #C89B3C)',
              }}
            >
              Our Guests
            </span>
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {testimonials.map((t, i) => (
            <motion.article
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="sg-tile relative p-6 md:p-7 rounded-2xl"
              style={{
                background: 'linear-gradient(180deg, #E8F5F4 0%, #D4EDEB 100%)',
                border: '1px solid rgba(47, 184, 176, 0.28)',
                boxShadow: '0 10px 26px rgba(47, 184, 176, 0.15), 0 2px 6px rgba(47, 184, 176, 0.08)',
              }}
            >
              <span
                aria-hidden
                className="absolute top-3 right-4 text-6xl leading-none opacity-15"
                style={{ color: 'var(--c-accent, #C89B3C)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                &ldquo;
              </span>
              <div
                className="inline-flex gap-0.5 mb-3"
                style={{ color: 'var(--c-accent, #C89B3C)' }}
                aria-label={`Rated ${t.rating} stars`}
              >
                {Array.from({ length: t.rating }).map((_, k) => (
                  <Star key={k} className="size-3.5 fill-current" />
                ))}
              </div>
              <p
                className="text-sm leading-relaxed mb-5"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '17px',
                  color: 'var(--c-text-dark, #1A1210)',
                  opacity: 0.85,
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--c-text-dark, #1A1210)' }}
              >
                {t.name}
              </p>
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mt-1"
                style={{ color: 'var(--c-text-dark, #1A1210)', opacity: 0.55 }}
              >
                {t.role}
              </p>
            </motion.article>
          ))}
        </div>
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
    // Real backend submit (was fake toast-only before). Uses the same
    // public reservation endpoint as ContactPage + ReservationModal.
    const res = await submitPublicReservation({
      name: form.name.trim(),
      phone: form.phone,
      date: form.date,
      time: form.time,
      guests: form.guests,
    })
    if (res.ok) {
      toast.success(`Reservation submitted for ${form.guests} guests on ${form.date} at ${formatTimeLabel(form.time)} — we will call to confirm.`)
      setForm({ name: '', phone: '', date: '', time: '', guests: 2 })
    } else {
      toast.warning(res.message)
    }
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
        className="absolute inset-0 sg-reservation-overlay"
      />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="subtitle">RESERVE YOUR TABLE</p>
        <div className="c-divider" />
        <h2 className="display text-3xl sm:text-5xl mb-4">Book a <span className="sg-shimmer-text italic">Memorable</span> Evening</h2>
        <p className="text-sm text-[--c-text-soft] mb-8 max-w-md mx-auto">Walk-ins are welcome but we recommend booking ahead to guarantee your favorite table.</p>
        <div className="sg-form-card p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto rounded-2xl">
          <input className="sg-alt-input px-4 py-3 text-sm" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="sg-alt-input px-4 py-3 text-sm" inputMode="numeric" maxLength={10} placeholder="10-digit mobile" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
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
          <input className="sg-alt-input sm:col-span-2 px-4 py-3 text-sm" type="number" min={1} max={20} placeholder="Number of guests" value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} onWheel={(e) => e.currentTarget.blur()} />
          <button
            className="sm:col-span-2 inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-10px_rgba(200,155,60,0.55)]"
            style={{ background: 'var(--c-accent, #C89B3C)', color: 'var(--c-text-dark, #1A1210)' }}
            onClick={submit}
          >
            <Calendar className="size-4" /> Reserve Table Now
          </button>
        </div>
      </div>
    </section>
  )
}

function InstagramFeedSection() {
  const instagramQ = useHomeInstagram()
  const instagram = (instagramQ.data ?? [])
    .map((b) => b.imageUrl || b.driveImageUrl || '')
    .filter(Boolean) as string[]
  if (instagram.length === 0) return null
  return (
    <div style={{ background: 'var(--c-cream, #FAF6F0)' }} className="w-full">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollReveal className="text-center mb-10">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.28em]"
            style={{ color: 'var(--c-accent, #C89B3C)' }}
          >
            Follow Our Journey
          </p>
          <div
            className="mx-auto my-3 h-[1.5px] w-16"
            style={{ background: 'var(--c-accent, #C89B3C)' }}
          />
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl"
            style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
              fontWeight: 500,
              color: 'var(--c-text-dark, #1A1210)',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            <span
              style={{
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--c-accent, #C89B3C)',
              }}
            >
              @spicegarden
            </span>{' '}
            · Instagram
          </h2>
        </ScrollReveal>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {instagram.map((src, i) => (
            <ScrollReveal
              as="li"
              key={i}
              delay={i * 0.06}
              className="sg-tile relative aspect-square overflow-hidden group cursor-pointer rounded-xl"
            >
              <img
                src={src}
                alt={`Instagram post ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all duration-300 grid place-items-center">
                <Camera className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </ScrollReveal>
          ))}
        </ul>
        <div className="text-center mt-8">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-[11px] tracking-[0.22em] uppercase transition-all hover:scale-105"
            style={{
              background: 'var(--c-text-dark, #1A1210)',
              color: 'var(--c-cream, #FAF6F0)',
              boxShadow: '0 10px 24px -10px rgba(26, 18, 16, 0.4)',
            }}
          >
            Follow @spicegarden
          </a>
        </div>
      </section>
    </div>
  )
}
