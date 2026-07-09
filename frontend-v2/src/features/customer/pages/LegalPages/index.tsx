import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Phone, Mail, Clock, Calendar, ChefHat, Leaf,
  Loader2, Soup, Plus, Minus, ChevronRight, FileText,
  ShieldCheck, RotateCcw, Users
} from 'lucide-react'
import CustomerLayout, { HeroSection } from '@/features/customer/CustomerLayout'
import { toast } from '@/lib/toast'
import { DocumentTitle } from '@/lib/seo/document-title'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import {
  HERO_IMAGES, GALLERY, useCart, useCustomerCatalog,
  DISHES
} from '@/features/customer/catalog'
import { submitPublicReservation } from '@/api/services/customer'
import DishCard from '@/features/customer/DishCard'
import { cn } from '@/lib/utils'
import { tokens } from '@/lib/auth/tokens'
import '@/styles/customer.css'

/* ====================================================================== */
/* 1. CART PAGE                                                           */
/* ====================================================================== */
export function CartPage() {
  const navigate = useNavigate()
  const { items, setQty } = useCart()
  const { dishes } = useCustomerCatalog()

  const lines = useMemo(() => {
    return items.map((l) => {
      const d = dishes.find((x) => x.id === l.id) ?? DISHES.find((x) => x.id === l.id)
      if (!d) return null
      return { ...d, qty: l.qty, subtotal: d.price * l.qty }
    }).filter((x): x is typeof dishes[0] & { qty: number; subtotal: number } => x !== null)
  }, [items, dishes])

  const subtotal = useMemo(() => lines.reduce((a, l) => a + l.subtotal, 0), [lines])
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
          <div className="c-card p-12 text-center rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
            <Soup className="size-16 gold-text mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Your cart is empty</h3>
            <p className="text-sm text-[--c-text-soft] mb-6">Browse our delicious menu categories and add your items.</p>
            <button className="c-button-primary px-8 rounded-full cursor-pointer" onClick={() => navigate('/menu')}>
              BROWSE MENU
            </button>
          </div>
        ) : (
          <div className="c-card overflow-hidden rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
            <ul className="divide-y divide-[--c-border]">
              {lines.map((l) => (
                <li key={l.id} className="p-4 sm:p-5 flex items-center gap-4 text-sm">
                  <img src={l.img} alt={l.name} loading="lazy" decoding="async" className="size-16 sm:size-20 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold flex items-center gap-1.5">
                      <span className={l.veg ? 'veg-icon' : 'nonveg-icon'} />
                      <span className="truncate">{l.name}</span>
                    </p>
                    <p className="text-xs text-[--c-text-muted] mt-1 font-medium">${l.price} each</p>
                  </div>
                  <div className="flex items-center gap-1.5 border border-[--c-accent] rounded-lg bg-black/20 shrink-0">
                    <button className="px-2.5 py-1.5 cursor-pointer text-[--c-text-soft] hover:text-white" onClick={() => setQty(l.id, -1)} aria-label="Decrease quantity"><Minus className="size-3.5" /></button>
                    <span className="text-sm font-bold font-mono w-6 text-center tabular-nums">{l.qty}</span>
                    <button className="px-2.5 py-1.5 cursor-pointer text-[--c-text-soft] hover:text-white" onClick={() => setQty(l.id, 1)} aria-label="Increase quantity"><Plus className="size-3.5" /></button>
                  </div>
                  <p className="font-mono tabular-nums w-20 sm:w-28 text-right gold-text font-bold shrink-0">
                    ${l.subtotal.toLocaleString('en-US')}
                  </p>
                </li>
              ))}
            </ul>
            <div className="p-5 space-y-3.5 border-t border-[--c-border] bg-black/10">
              <div className="flex items-center justify-between text-sm font-semibold text-[--c-text-soft]">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal.toLocaleString('en-US')}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-[--c-text-soft]">
                <span>GST (5%)</span>
                <span className="font-mono">${gst.toLocaleString('en-US')}</span>
              </div>
              <div className="flex items-center justify-between pt-3.5 border-t border-[--c-border] text-base font-bold text-[--c-text]">
                <span>Total Amount</span>
                <span className="display text-2xl gold-text font-mono font-bold">${total.toLocaleString('en-US')}</span>
              </div>
              <button
                className="c-button-primary w-full mt-4 py-4 rounded-xl cursor-pointer font-bold tracking-wider inline-flex items-center justify-center gap-2 hover:shadow-[var(--c-shadow-primary)] transition-shadow"
                onClick={() => {
                  if (tokens.getCustomer()) {
                    navigate('/checkout')
                  } else {
                    ; (window as any).shouldRedirectToCheckoutAfterLogin = true
                    window.dispatchEvent(new CustomEvent('trigger-customer-login'))
                  }
                }}
              >
                PROCEED TO CHECKOUT
                <ChevronRight className="size-4.5" />
              </button>
            </div>
          </div>
        )}
      </section>
    </CustomerLayout>
  )
}

/* ====================================================================== */
/* 2. CONTACT / RESERVATIONS PAGE                                         */
/* ====================================================================== */
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
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

export function ContactPage() {
  const initialForm = { name: '', email: '', phone: '', date: '', time: '', guests: 2, notes: '' }
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialForm, string>>>({})
  const [history, setHistory] = useState<StoredReservation[]>(readReservations)
  const [loading, setLoading] = useState(false)

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Name must be at least 2 characters'
    if (!/^[6-9][0-9]{9}$/.test(form.phone)) next.phone = 'Enter a valid 10-digit Indian mobile number'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Invalid email address'
    if (!form.date) next.date = 'Pick a reservation date'
    if (!form.time) next.time = 'Pick a reservation time'
    if (!form.guests || form.guests < 1) next.guests = 'At least one guest required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (!validate()) {
      toast.warning('Please fix the highlighted fields')
      return
    }

    setLoading(true)
    const backendRes = await submitPublicReservation({
      name: form.name.trim(),
      phone: form.phone,
      email: form.email,
      date: form.date,
      time: form.time,
      guests: form.guests,
      notes: form.notes,
    })
    setLoading(false)

    const localId = backendRes.ok && backendRes.data.reservationId
      ? `RSV-${backendRes.data.reservationId}`
      : `RSV-${Date.now()}`

    const record: StoredReservation = {
      id: localId,
      submittedAt: new Date().toLocaleString('en-US'),
      ...form,
      status: 'requested',
    }

    const next = [record, ...history].slice(0, 10)
    setHistory(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(next))
    }

    if (backendRes.ok) {
      toast.success("Reservation submitted — we will call to confirm your table shortly.")
    } else {
      toast.warning('Saved locally — couldn’t reach the server. We will retry on next connection.')
    }
    setForm(initialForm)
    setErrors({})
  }

  return (
    <CustomerLayout>
      <DocumentTitle title="Contact & Reservations — Spice Garden" />
      <HeroSection
        bg={HERO_IMAGES.contact}
        subtitle="EASY TABLE BOOKING & LOCATIONS"
        titleA="Book Your"
        titleAccent="Table Online"
        description="Reserve your table for a smooth visit. We are ready to serve you with warm hospitality."
      />
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <p className="subtitle">VISIT US</p>
              <div className="c-divider !ml-0" />
              <h2 className="display text-3xl">Reach the <span>Restaurant</span></h2>
            </div>
            <ul className="space-y-4 text-sm font-medium text-[--c-text-soft]">
              <li className="flex items-start gap-3"><MapPin className="size-5 gold-text mt-0.5 shrink-0" /><span>123 Sea Breeze Lane, Bandra West, Mumbai · 400050</span></li>
              <li className="flex items-start gap-3"><Phone className="size-5 gold-text mt-0.5 shrink-0" />+91 9876543210</li>
              <li className="flex items-start gap-3"><Mail className="size-5 gold-text mt-0.5 shrink-0" />hello@spicegarden.com</li>
              <li className="flex items-start gap-3"><Clock className="size-5 gold-text mt-0.5 shrink-0" /><span>Mon–Sun · 11:00 AM – 11:30 PM</span></li>
            </ul>
            <img src={HERO_IMAGES.contact} alt="Bandra Location Map" loading="lazy" decoding="async" className="w-full rounded-2xl c-card object-cover" />
          </div>

          <div className="c-card p-6 sm:p-8 space-y-4 rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
            <p className="subtitle">RESERVE A TABLE</p>
            <div className="c-divider !ml-0" />
            <h3 className="display text-2xl">Book Online</h3>

            <div className="space-y-3">
              <div>
                <input className="c-input" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input className="c-input" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} />
                  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <input className="c-input" placeholder="10-digit Phone Number" inputMode="tel" maxLength={10} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} aria-invalid={!!errors.phone} />
                  {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input className="c-input text-xs" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-invalid={!!errors.date} />
                  {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
                </div>
                <div>
                  <input className="c-input text-xs" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} aria-invalid={!!errors.time} />
                  {errors.time && <p className="text-xs text-red-400 mt-1">{errors.time}</p>}
                </div>
                <div>
                  <input className="c-input" type="number" min={1} max={25} placeholder="Guests" value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} aria-invalid={!!errors.guests} />
                  {errors.guests && <p className="text-xs text-red-400 mt-1">{errors.guests}</p>}
                </div>
              </div>

              <textarea className="c-input" rows={3} placeholder="Special instructions / notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

              <button
                disabled={loading}
                className="c-button-primary w-full py-3.5 rounded-xl cursor-pointer inline-flex items-center justify-center gap-2 hover:shadow-[var(--c-shadow-primary)] transition-shadow"
                onClick={submit}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Calendar className="size-4" />}
                RESERVE TABLE
              </button>
            </div>

            {history.length > 0 && (
              <div className="pt-4 border-t border-[--c-border] mt-4">
                <p className="subtitle text-[10px] tracking-wider mb-3">YOUR RECENT REQUESTS</p>
                <ul className="space-y-2">
                  {history.slice(0, 3).map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-xs p-3 rounded-xl border border-[--c-border] bg-black/10">
                      <div className="min-w-0 pr-2">
                        <p className="font-mono gold-text font-bold truncate">{r.id}</p>
                        <p className="text-[--c-text-muted] mt-0.5">{r.date} · {r.time} · {r.guests} guests</p>
                      </div>
                      <span className="c-tag shrink-0 !text-amber-400 !border-amber-500/40">Requested</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </ScrollReveal>
    </CustomerLayout>
  )
}

/* ====================================================================== */
/* 3. ABOUT PAGE & TEAM MEMBERS                                           */
/* ====================================================================== */
const TEAM = [
  { name: 'Chef Aarav Kapoor', role: 'Executive Chef', img: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=600&q=80' },
  { name: 'Riya Mehta', role: 'Sommelier', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80' },
  { name: 'Daniel Pinto', role: 'Maître d\'', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sneha Iyer', role: 'Pastry Chef', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80' },
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
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80" alt="Our Dining Area" className="rounded-2xl c-card object-cover w-full h-full" />
          <div className="space-y-5">
            <p className="subtitle">OUR ROOTS</p>
            <div className="c-divider !ml-0" />
            <h2 className="display text-3xl sm:text-4xl">From a Small Kitchen to a <span>Beloved Steakhouse</span></h2>
            <p className="text-sm text-[--c-text-soft] leading-relaxed">
              Spice Garden began in 2012 as a small neighbourhood eatery in Bandra. Word of our slow-cooked butter chicken and char-grilled kebabs travelled fast, and one branch grew to three. We have never compromised on the things that matter — fresh ingredients, classical techniques, and warm, attentive hospitality.
            </p>
            <p className="text-sm text-[--c-text-soft] leading-relaxed">
              Today our kitchens are led by Chef Aarav Kapoor and a team of seasoned cooks who treat every plate as a personal signature. Whether you join us in our dining room or order delivery at home, you are tasting more than a decade of craft.
            </p>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { Icon: Leaf, title: 'Honest Ingredients', text: 'Sourced daily from trusted farms, butchers, and spice merchants. Nothing frozen, no shortcuts.' },
            { Icon: ChefHat, title: 'Classical Craft', text: 'Slow gravies, hand-rolled breads, and recipes refined over a decade by chefs who care.' },
            { Icon: Users, title: 'Warm Hospitality', text: 'Every guest treated like family. Every visit memorable, whether for two or twenty.' },
          ].map(({ Icon, title, text }, i) => (
            <ScrollReveal key={title} delay={i * 0.08} className="c-card p-6 text-center rounded-2xl bg-[--c-bg-elev]">
              <div className="inline-flex size-14 rounded-full border border-[--c-accent] items-center justify-center gold-text mb-4">
                <Icon className="size-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{title}</h3>
              <p className="text-sm text-[--c-text-soft]">{text}</p>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="subtitle">THE PEOPLE BEHIND THE PLATE</p>
          <div className="c-divider" />
          <h2 className="display text-3xl sm:text-4xl">Meet Our <span>Team</span></h2>
        </div>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {TEAM.map((m, i) => (
            <ScrollReveal as="li" key={m.name} delay={i * 0.08} className="c-card overflow-hidden rounded-2xl bg-[--c-bg-elev]">
              <div className="aspect-square overflow-hidden">
                <img src={m.img} alt={m.name} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>
              <div className="p-4 text-center">
                <p className="display text-lg font-bold">{m.name}</p>
                <p className="subtitle text-[9px] mt-1">{m.role}</p>
              </div>
            </ScrollReveal>
          ))}
        </ul>
      </ScrollReveal>
    </CustomerLayout>
  )
}

/* ====================================================================== */
/* 4. WHY US PAGE                                                         */
/* ====================================================================== */
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
          <img src={HERO_IMAGES.whyUs} alt="Heritage Cooking" loading="lazy" decoding="async" className="rounded-2xl c-card object-cover w-full h-full" />
          <div className="space-y-4">
            <p className="subtitle">OUR PHILOSOPHY</p>
            <h2 className="display text-3xl sm:text-4xl">Crafting Memories <span>One Dish at a Time</span></h2>
            <p className="text-sm text-[--c-text-soft] leading-relaxed">From a humble single-branch kitchen to a beloved multi-city steakhouse, our promise has stayed the same — fresh ingredients, time-honoured recipes, and warm service.</p>
            <ul className="space-y-2.5 text-sm font-semibold text-[--c-text-soft]">
              <li className="flex items-start gap-2.5"><Soup className="size-4 gold-text mt-0.5" /> 200+ recipes refined over a decade</li>
              <li className="flex items-start gap-2.5"><ChefHat className="size-4 gold-text mt-0.5" /> Award-winning culinary team</li>
              <li className="flex items-start gap-2.5"><Leaf className="size-4 gold-text mt-0.5" /> 100% farm-fresh, locally-sourced</li>
            </ul>
          </div>
        </div>
      </ScrollReveal>
    </CustomerLayout>
  )
}

/* ====================================================================== */
/* 5. GALLERY PAGE                                                        */
/* ====================================================================== */
export function GalleryPage() {
  return (
    <CustomerLayout>
      <DocumentTitle title="Gallery — Spice Garden Steakhouse" />
      <HeroSection
        bg={HERO_IMAGES.gallery}
        subtitle="OUR RESTAURANT & FOOD PHOTOS"
        titleA="A Photo"
        titleAccent="Gallery"
        description="Browse photos of our delicious dishes, beautiful dining area, and happy moments of our customers."
      />
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {GALLERY.map((src, i) => (
            <ScrollReveal as="li" key={i} delay={i * 0.05} className="aspect-square overflow-hidden c-card group rounded-2xl">
              <img src={src} alt={`Gallery Photo ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </ScrollReveal>
          ))}
        </ul>
      </ScrollReveal>
    </CustomerLayout>
  )
}

/* ====================================================================== */
/* 6. SIGNATURE PAGE                                                      */
/* ====================================================================== */
export function SignaturePage() {
  const dishes = useMemo(() => DISHES.filter((d) => d.signature), [])
  return (
    <CustomerLayout>
      <DocumentTitle title="Chef's Signature Dishes — Spice Garden" />
      <HeroSection
        bg={HERO_IMAGES.signature}
        subtitle="OUR SPECIAL SIGNATURE DISHES"
        titleA="Chef's Special"
        titleAccent="Dishes"
        description="Enjoy our delicious food made by our best chefs to give you a wonderful dining experience."
      />

      {/* Responsive unified grid display */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {dishes.map((d) => (
            <li key={d.id} className="contents">
              <DishCard dish={d} />
            </li>
          ))}
        </ul>
      </ScrollReveal>
    </CustomerLayout>
  )
}

/* ====================================================================== */
/* 7. GENERAL MY ORDERS LIST PAGE                                         */
/* ====================================================================== */
export function MyOrdersPage() {
  const navigate = useNavigate()
  const [localQueue, setLocalQueue] = useState<any[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem('customer_orders_queue')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'customer_orders_queue') {
        try { setLocalQueue(e.newValue ? JSON.parse(e.newValue) : []) } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <CustomerLayout>
      <DocumentTitle title="My Orders — Spice Garden" />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="subtitle">YOUR HISTORY</p>
        <div className="c-divider !ml-0" />
        <h1 className="display text-3xl sm:text-4xl mb-8">My <span>Orders</span></h1>

        {localQueue.length === 0 ? (
          <div className="c-card p-12 text-center rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
            <Soup className="size-16 gold-text mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No orders placed yet</h3>
            <p className="text-sm text-[--c-text-soft] mb-6">When you place an order it will appear in your account history list.</p>
            <button className="c-button-primary px-8 rounded-full cursor-pointer" onClick={() => navigate('/menu')}>
              BROWSE MENU
            </button>
          </div>
        ) : (
          <ul className="space-y-3.5">
            {localQueue.map((o) => (
              <li key={o.id} className="c-card p-5 flex items-center justify-between gap-4 rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
                <div className="min-w-0">
                  <p className="font-mono font-bold text-sm tracking-wider">{o.serverOrderId ? `#${o.serverOrderId}` : o.id}</p>
                  <p className="text-xs text-[--c-text-muted] mt-1 font-medium">
                    {new Date(o.placedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {o.items?.length || 0} items · {String(o.paymentMethod).toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'c-tag shrink-0 !py-1 !px-2 rounded-lg font-bold text-[10px]',
                    o.status === 'synced' ? '!text-green-400 !border-green-500/35 bg-green-500/5' : '!text-amber-300 !border-amber-500/35 bg-amber-500/5',
                  )}>
                    {o.status === 'synced' ? 'Confirmed' : 'Pending sync'}
                  </span>
                  <p className="font-mono gold-text font-bold text-base shrink-0">${o.total?.toLocaleString('en-US')}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </CustomerLayout>
  )
}

/* ====================================================================== */
/* 8. LEGAL POLICY SUB-PAGES CONFIGS                                      */
/* ====================================================================== */
function LegalHeader({ icon: Icon, eyebrow, titleA, titleAccent, intro }: {
  icon: any
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
      <p className="text-sm text-[--c-text-soft] mt-5 max-w-xl mx-auto leading-relaxed">{intro}</p>
      <p className="text-xs text-[--c-text-muted] mt-3">Last updated: 1 January 2026</p>
    </section>
  )
}

function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="display text-xl sm:text-2xl mb-2 font-bold">{heading}</h2>
      <div className="c-divider !ml-0 !mt-0" />
      <div className="text-sm text-[--c-text-soft] leading-relaxed space-y-3.5 mt-3">
        {children}
      </div>
    </section>
  )
}

export function TermsPage() {
  return (
    <CustomerLayout>
      <DocumentTitle title="Terms of Service — Spice Garden" />
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
            By accessing or using the Spice Garden website, mobile site, or any of our digital ordering interfaces (collectively, the "Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
          </p>
        </LegalSection>
        <LegalSection heading="2. Eligibility">
          <p>
            You must be at least 18 years old to place an order or make a reservation. By using the Service you confirm that the information you provide is accurate and that you have the legal authority to enter into this agreement.
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
      </article>
    </CustomerLayout>
  )
}

export function PrivacyPage() {
  return (
    <CustomerLayout>
      <DocumentTitle title="Privacy Policy — Spice Garden" />
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
            <li><strong>Account details</strong> — name, mobile number, email address, and password (encrypted).</li>
            <li><strong>Order details</strong> — delivery addresses, special instructions, and order history.</li>
            <li><strong>Payment information</strong> — payment is processed by our PCI-DSS compliant partners. We do not store card details.</li>
          </ul>
        </LegalSection>
      </article>
    </CustomerLayout>
  )
}

export function RefundPage() {
  return (
    <CustomerLayout>
      <DocumentTitle title="Refund & Cancellation Policy — Spice Garden" />
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
            <li><strong>Within 2 minutes of placing order</strong> — full refund. Cancel from "My Orders" or call the branch.</li>
            <li><strong>After preparation has started</strong> — cancellation is not possible.</li>
          </ul>
        </LegalSection>
      </article>
    </CustomerLayout>
  )
}
