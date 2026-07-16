import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Phone, Mail, Clock, Calendar, ChefHat, Leaf,
  Loader2, Soup, Plus, Minus, ChevronLeft, ChevronRight, FileText,
  ShieldCheck, RotateCcw, X, ZoomIn,
  Building2, Sparkles, HelpCircle, Newspaper, MessageCircle, ChevronDown, Send, Utensils,
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
import {
  useCustomerOrders, useCustomerGallery, useRestaurantHours,
  useContactHelpCategories, useContactDepartments, useContactHoursNotes, useContactFaqs,
  useAboutTeam, useCustomerBranches,
} from '@/api/queries/customer'
import { useBrand } from '@/components/providers/BrandProvider'
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
                    <p className="text-xs text-[--c-text-muted] mt-1 font-medium">₹{l.price} each</p>
                  </div>
                  <div className="flex items-center gap-1.5 border border-[--c-accent] rounded-lg bg-black/20 shrink-0">
                    <button className="px-2.5 py-1.5 cursor-pointer text-[--c-text-soft] hover:text-white" onClick={() => setQty(l.id, -1)} aria-label="Decrease quantity"><Minus className="size-3.5" /></button>
                    <span className="text-sm font-bold font-mono w-6 text-center tabular-nums">{l.qty}</span>
                    <button className="px-2.5 py-1.5 cursor-pointer text-[--c-text-soft] hover:text-white" onClick={() => setQty(l.id, 1)} aria-label="Increase quantity"><Plus className="size-3.5" /></button>
                  </div>
                  <p className="font-mono tabular-nums w-20 sm:w-28 text-right gold-text font-bold shrink-0">
                    ₹{l.subtotal.toLocaleString('en-IN')}
                  </p>
                </li>
              ))}
            </ul>
            <div className="p-5 space-y-3.5 border-t border-[--c-border] bg-black/10">
              <div className="flex items-center justify-between text-sm font-semibold text-[--c-text-soft]">
                <span>Subtotal</span>
                <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-[--c-text-soft]">
                <span>GST (5%)</span>
                <span className="font-mono">₹{gst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between pt-3.5 border-t border-[--c-border] text-base font-bold text-[--c-text]">
                <span>Total Amount</span>
                <span className="display text-2xl gold-text font-mono font-bold">₹{total.toLocaleString('en-IN')}</span>
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
      submittedAt: new Date().toLocaleString('en-IN'),
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

  // Cream + ink theme tokens (aligned with HomePage cream sections)
  const CREAM = 'var(--c-cream, #FAF6F0)'
  const INK = 'var(--c-text-dark, #1A1210)'
  const BRASS = 'var(--c-accent, #C89B3C)'

  // Icon-name → component map. Backend content_blocks store lucide icon
  // keys as strings; we resolve them to actual components here.
  const CONTACT_ICON_MAP: Record<string, typeof HelpCircle> = {
    HelpCircle, Calendar, Sparkles, Newspaper, Clock, Utensils, ChefHat,
    MessageCircle, Building2, Mail, Phone,
  }
  const resolveContactIcon = (name?: string) => (name && CONTACT_ICON_MAP[name]) || HelpCircle

  // Real content from backend (2026-07-16 dummy → real refactor).
  const helpCategoriesQ = useContactHelpCategories()
  const departmentsQ    = useContactDepartments()
  const hoursNotesQ     = useContactHoursNotes()
  const faqsQ           = useContactFaqs()
  const restaurantHoursQ = useRestaurantHours()
  const branchesQ        = useCustomerBranches()
  const brand            = useBrand()

  // Visit-Us card — first branch (usually flagship) drives address + city.
  // Fallback stack: branch address → brand.address → nothing.
  const firstBranch = branchesQ.data?.[0]
  const contactBranchName = firstBranch?.branchName ?? null
  const contactCity = firstBranch?.city ?? null
  const contactAddress = firstBranch
    ? [firstBranch.addressLine1, firstBranch.city, firstBranch.pincode].filter(Boolean).join(', ')
    : brand.address
  // "Mon–Sun · 11:00 AM – 11:30 PM" style line from today's row when hours exist.
  const contactHoursLine = (() => {
    const rows = restaurantHoursQ.data ?? []
    if (rows.length === 0) return null
    const openRows = rows.filter((h) => !h.isClosed && h.openTime && h.closeTime)
    if (openRows.length === 0) return null
    const sample = openRows[0]!
    return `Mon–Sun · ${sample.openTime} – ${sample.closeTime}`
  })()

  const HELP_CATEGORIES = (helpCategoriesQ.data ?? []).map((b) => {
    const meta = (b.meta as Record<string, unknown> | null) ?? {}
    return {
      id: b.id,
      Icon: resolveContactIcon(b.iconName),
      title: b.title ?? '',
      text: b.description ?? '',
      cta: (typeof meta.cta === 'string' ? meta.cta : '') as string,
      href: (typeof meta.href === 'string' ? meta.href : '#') as string,
    }
  })

  const DEPT_LINES = (departmentsQ.data ?? []).map((b) => {
    const meta = (b.meta as Record<string, unknown> | null) ?? {}
    return {
      id: b.id,
      title: b.title ?? '',
      phone: (typeof meta.phone === 'string' ? meta.phone : '') as string,
      email: (typeof meta.email === 'string' ? meta.email : '') as string,
      hours: b.subtitle ?? '',
      note: b.description ?? '',
    }
  })

  // Weekly Business Hours — from restaurant_hours table (already existed).
  // Map to { day, lunch, dinner } for the schedule table.
  const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  const SCHEDULE = (restaurantHoursQ.data ?? [])
    .slice()
    .sort((a, b) => DAY_ORDER.indexOf((a.dayOfWeek || '').toUpperCase()) -
                    DAY_ORDER.indexOf((b.dayOfWeek || '').toUpperCase()))
    .map((h) => ({
      day: (h.dayOfWeek || '').charAt(0) + (h.dayOfWeek || '').slice(1).toLowerCase(),
      lunch: h.isClosed ? 'Closed' : (h.openTime && h.closeTime ? `${h.openTime} – ${h.closeTime}` : '—'),
      dinner: h.isClosed ? 'Closed' : '',
    }))

  const HOURS_NOTES = (hoursNotesQ.data ?? []).map((b) => ({
    id: b.id,
    Icon: resolveContactIcon(b.iconName),
    title: b.title ?? '',
    text: b.description ?? '',
  }))

  const FAQS = (faqsQ.data ?? []).map((b) => ({
    id: b.id,
    q: b.title ?? '',
    a: b.description ?? '',
  }))

  const nextBookingId = history[0]?.id

  return (
    <CustomerLayout>
      <DocumentTitle title="Contact & Reservations — Spice Garden" />
      <HeroSection
        bg={HERO_IMAGES.contact}
        subtitle="WE'RE HERE TO HELP"
        titleA="Contact &"
        titleAccent="Reservations"
        description="Reserve a table, book a private event, or ask us anything. Our team responds fast — most enquiries answered within four hours."
      />

      {/* SECTION 1 — Cream · Reservation form + Visit us */}
      <section style={{ background: CREAM, color: INK }} className="w-full sg-section-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: BRASS }}>
              Reserve Your Table
            </p>
            <div className="h-px w-16 mx-auto mb-4" style={{ background: BRASS }} />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              A Table Awaits
              <span className="italic ml-2" style={{ color: BRASS }}>Your Story</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base max-w-2xl mx-auto opacity-70">
              Fill in a few details and we'll confirm within minutes — usually with a quick call to check any special requests.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Visit us column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl overflow-hidden aspect-[4/3] relative">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
                  alt="Spice Garden interior"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <p className="text-[10px] font-bold tracking-[0.28em] uppercase" style={{ color: BRASS }}>Flagship Branch</p>
                  <p className="text-2xl mt-1" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{contactCity ?? contactBranchName ?? brand.restaurantName}</p>
                </div>
              </div>

              <div className="rounded-2xl p-6 sm:p-7 bg-white" style={{ border: `1px solid rgba(200,155,60,0.3)` }}>
                <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-4" style={{ color: BRASS }}>Visit Us — Flagship</p>
                <ul className="space-y-3.5 text-sm">
                  {contactAddress ? (
                    <li className="flex items-start gap-3">
                      <MapPin className="size-5 mt-0.5 shrink-0" style={{ color: BRASS }} />
                      <span className="opacity-80" style={{ color: INK }}>{contactAddress}</span>
                    </li>
                  ) : null}
                  {brand.phone ? (
                    <li className="flex items-start gap-3">
                      <Phone className="size-5 mt-0.5 shrink-0" style={{ color: BRASS }} />
                      <a href={`tel:${brand.phone}`} className="opacity-80 hover:opacity-100 hover:underline" style={{ color: INK }}>{brand.phone}</a>
                    </li>
                  ) : null}
                  {brand.email ? (
                    <li className="flex items-start gap-3">
                      <Mail className="size-5 mt-0.5 shrink-0" style={{ color: BRASS }} />
                      <a href={`mailto:${brand.email}`} className="opacity-80 hover:opacity-100 hover:underline" style={{ color: INK }}>{brand.email}</a>
                    </li>
                  ) : null}
                  {brand.whatsappNumber ? (
                    <li className="flex items-start gap-3">
                      <MessageCircle className="size-5 mt-0.5 shrink-0" style={{ color: BRASS }} />
                      <a href={`https://wa.me/${brand.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 hover:underline" style={{ color: INK }}>WhatsApp us — quick replies</a>
                    </li>
                  ) : null}
                  {contactHoursLine ? (
                    <li className="flex items-start gap-3">
                      <Clock className="size-5 mt-0.5 shrink-0" style={{ color: BRASS }} />
                      <span className="opacity-80" style={{ color: INK }}>{contactHoursLine}</span>
                    </li>
                  ) : null}
                </ul>

                <div className="mt-5 pt-5 border-t" style={{ borderColor: 'rgba(200,155,60,0.25)' }}>
                  <p className="text-[11px] italic leading-relaxed opacity-70" style={{ color: INK }}>
                    Also at <b>Andheri East</b> and <b>Powai</b> — see the{' '}
                    <a href="/locations" className="underline font-semibold" style={{ color: BRASS }}>Locations page</a>{' '}
                    for full details.
                  </p>
                </div>
              </div>
            </div>

            {/* Booking form column */}
            <div className="sg-form-card lg:col-span-3 rounded-2xl p-6 sm:p-8 lg:p-10">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-2" style={{ color: BRASS }}>Book Online</p>
                  <h3 className="text-2xl sm:text-3xl leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: INK }}>
                    Reserve <span className="italic" style={{ color: BRASS }}>Your Table</span>
                  </h3>
                </div>
                <Calendar className="size-8 shrink-0" style={{ color: BRASS }} />
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1 block" style={{ color: INK }}>Your Name</label>
                  <input
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors focus:border-[--c-accent]"
                    style={{ background: CREAM, border: `1.5px solid rgba(200,155,60,0.35)`, color: INK }}
                    placeholder="e.g. Aarav Kapoor"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1 block" style={{ color: INK }}>Email (optional)</label>
                    <input
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                      style={{ background: CREAM, border: `1.5px solid rgba(200,155,60,0.35)`, color: INK }}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1 block" style={{ color: INK }}>Phone</label>
                    <input
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                      style={{ background: CREAM, border: `1.5px solid rgba(200,155,60,0.35)`, color: INK }}
                      placeholder="10-digit mobile"
                      inputMode="tel"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1 block" style={{ color: INK }}>Date</label>
                    <input
                      className="w-full px-3 py-3 rounded-lg text-xs outline-none"
                      style={{ background: CREAM, border: `1.5px solid rgba(200,155,60,0.35)`, color: INK }}
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      aria-invalid={!!errors.date}
                    />
                    {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1 block" style={{ color: INK }}>Time</label>
                    <input
                      className="w-full px-3 py-3 rounded-lg text-xs outline-none"
                      style={{ background: CREAM, border: `1.5px solid rgba(200,155,60,0.35)`, color: INK }}
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      aria-invalid={!!errors.time}
                    />
                    {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1 block" style={{ color: INK }}>Guests</label>
                    <input
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                      style={{ background: CREAM, border: `1.5px solid rgba(200,155,60,0.35)`, color: INK }}
                      type="number"
                      min={1}
                      max={25}
                      placeholder="2"
                      value={form.guests}
                      onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                      aria-invalid={!!errors.guests}
                    />
                    {errors.guests && <p className="text-xs text-red-500 mt-1">{errors.guests}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1 block" style={{ color: INK }}>Special Requests (optional)</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                    style={{ background: CREAM, border: `1.5px solid rgba(200,155,60,0.35)`, color: INK }}
                    rows={3}
                    placeholder="e.g. window seat, birthday cake setup, high-chair for baby, gluten-free options…"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full py-4 rounded-full inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: INK }}
                  onClick={submit}
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Calendar className="size-4" />}
                  Reserve Table Now
                </button>

                <p className="text-[11px] text-center opacity-60 pt-1" style={{ color: INK }}>
                  We'll confirm via SMS + call. Free to cancel up to 2 hours before.
                </p>
              </div>

              {history.length > 0 && (
                <div className="pt-6 border-t mt-6" style={{ borderColor: 'rgba(200,155,60,0.25)' }}>
                  <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: BRASS }}>
                    Your Recent Requests
                    {nextBookingId ? <span className="opacity-60 ml-2 normal-case font-normal">· latest {nextBookingId}</span> : null}
                  </p>
                  <ul className="space-y-2">
                    {history.slice(0, 3).map((r) => (
                      <li key={r.id} className="flex items-center justify-between text-xs p-3 rounded-xl" style={{ background: 'rgba(200,155,60,0.06)', border: '1px solid rgba(200,155,60,0.2)' }}>
                        <div className="min-w-0 pr-2">
                          <p className="font-mono font-bold truncate" style={{ color: BRASS }}>{r.id}</p>
                          <p className="opacity-70 mt-0.5" style={{ color: INK }}>{r.date} · {r.time} · {r.guests} guests</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: BRASS, color: INK }}>Requested</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — Dark · How Can We Help */}
      <section className="w-full sg-section-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: BRASS }}>
              Get in Touch
            </p>
            <div className="h-px w-16 mx-auto mb-4" style={{ background: BRASS }} />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              How Can
              <span className="italic ml-2" style={{ color: BRASS }}>We Help?</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base max-w-2xl mx-auto opacity-70">
              Pick the right desk and get a faster response. Every message is read by a real person.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HELP_CATEGORIES.map(({ id, Icon, title, text, cta, href }, i) => (
              <motion.a
                key={id}
                href={href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="sg-tile p-6 rounded-xl block"
              >
                <div className="sg-icon-ring inline-flex size-14 items-center justify-center mb-4">
                  <Icon className="size-6" style={{ color: BRASS }} />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm opacity-70 leading-relaxed mb-4">{text}</p>
                <p className="text-xs font-bold uppercase tracking-widest break-all" style={{ color: BRASS }}>{cta}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — Cream · Direct Department Lines */}
      <section style={{ background: CREAM, color: INK }} className="w-full sg-section-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: BRASS }}>
              Direct Lines
            </p>
            <div className="h-px w-16 mx-auto mb-4" style={{ background: BRASS }} />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Talk to the
              <span className="italic ml-2" style={{ color: BRASS }}>Right Desk</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base max-w-2xl mx-auto opacity-70">
              Skip the switchboard — dial straight through to the team who can help.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEPT_LINES.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="sg-tile p-6 rounded-2xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold mb-1">{d.title}</h3>
                    <p className="text-xs opacity-60">{d.hours}</p>
                  </div>
                  <Building2 className="size-6 shrink-0" style={{ color: BRASS }} />
                </div>

                <div className="space-y-2 text-sm">
                  <a href={`tel:${d.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 opacity-80 hover:opacity-100 hover:underline">
                    <Phone className="size-4 shrink-0" style={{ color: BRASS }} />
                    <span className="font-mono">{d.phone}</span>
                  </a>
                  <a href={`mailto:${d.email}`} className="flex items-center gap-2 opacity-80 hover:opacity-100 hover:underline break-all">
                    <Mail className="size-4 shrink-0" style={{ color: BRASS }} />
                    {d.email}
                  </a>
                </div>

                <p className="text-[11px] italic mt-4 pt-4 border-t opacity-70" style={{ borderColor: 'rgba(200,155,60,0.2)' }}>
                  {d.note}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — Dark · Business Hours + What to Know */}
      <section className="w-full sg-section-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: BRASS }}>
                When We're Open
              </p>
              <div className="h-px w-16 mb-4" style={{ background: BRASS }} />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Business
                <span className="italic ml-2" style={{ color: BRASS }}>Hours</span>
              </h2>

              <div className="sg-table rounded-2xl">
                <div className="sg-table-head grid grid-cols-3 px-5 py-3 text-[10px] font-bold uppercase tracking-widest">
                  <span>Day</span>
                  <span>Lunch</span>
                  <span>Dinner</span>
                </div>
                {SCHEDULE.map((s) => (
                  <div key={s.day} className="sg-table-row grid grid-cols-3 px-5 py-4 text-sm">
                    <span className="font-bold">{s.day}</span>
                    <span className="opacity-80">{s.lunch}</span>
                    <span className="opacity-80">{s.dinner}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: BRASS }}>
                Good to Know
              </p>
              <div className="h-px w-16 mb-4" style={{ background: BRASS }} />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Special
                <span className="italic ml-2" style={{ color: BRASS }}>Timings</span>
              </h2>

              <div className="space-y-3">
                {HOURS_NOTES.map(({ id, Icon, title, text }, i) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="sg-tile flex gap-4 p-5 rounded-xl"
                  >
                    <div className="sg-icon-ring shrink-0 inline-flex size-11 items-center justify-center">
                      <Icon className="size-5" style={{ color: BRASS }} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold mb-1">{title}</h3>
                      <p className="text-sm opacity-70 leading-relaxed">{text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — Cream · FAQs */}
      <section style={{ background: CREAM, color: INK }} className="w-full sg-section-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-10">
            <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: BRASS }}>
              Common Questions
            </p>
            <div className="h-px w-16 mx-auto mb-4" style={{ background: BRASS }} />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Frequently Asked
              <span className="italic ml-2" style={{ color: BRASS }}>Questions</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base max-w-xl mx-auto opacity-70">
              Everything guests ask us most. Still stuck? Drop a note above.
            </p>
          </div>

          <ul className="space-y-3">
            {FAQS.map((f, i) => (
              <motion.li
                key={f.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <details className="group rounded-xl bg-white overflow-hidden transition-all" style={{ border: `1px solid rgba(200,155,60,0.3)` }}>
                  <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none">
                    <span className="text-sm sm:text-base font-bold" style={{ color: INK }}>{f.q}</span>
                    <ChevronDown className="size-5 shrink-0 transition-transform duration-300 group-open:rotate-180" style={{ color: BRASS }} />
                  </summary>
                  <div className="px-5 pb-5 text-sm leading-relaxed opacity-75" style={{ color: INK }}>
                    {f.a}
                  </div>
                </details>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* SECTION 6 — Dark · Follow us + Newsletter */}
      <section className="w-full sg-section-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: BRASS }}>
                Stay in Touch
              </p>
              <div className="h-px w-16 mb-4" style={{ background: BRASS }} />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Never Miss a
                <span className="italic ml-2" style={{ color: BRASS }}>Chef's Special</span>
              </h2>
              <p className="text-sm sm:text-base opacity-70 mb-6">
                One email a month — new menu drops, seasonal tastings, festival specials. No spam, unsubscribe with one click.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  toast.success('Subscribed — welcome to the family!')
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  className="sg-alt-input flex-1 px-4 py-3.5 text-sm"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5"
                  style={{ background: BRASS, color: INK }}
                >
                  <Send className="size-4" /> Subscribe
                </button>
              </form>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: BRASS }}>
                Follow Along
              </p>
              <div className="h-px w-16 mb-4" style={{ background: BRASS }} />
              <h3 className="text-2xl sm:text-3xl leading-tight mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Behind the
                <span className="italic ml-2" style={{ color: BRASS }}>Kitchen</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const links: { label: string; handle: string; href: string }[] = []
                  if (brand.socialLinks.instagram) links.push({ label: 'Instagram', handle: brand.socialLinks.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '@').replace(/\/$/, ''), href: brand.socialLinks.instagram })
                  if (brand.socialLinks.facebook)  links.push({ label: 'Facebook',  handle: brand.socialLinks.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//i, '').replace(/\/$/, ''),      href: brand.socialLinks.facebook })
                  if (brand.socialLinks.whatsapp || brand.whatsappNumber) {
                    const wa = brand.socialLinks.whatsapp ?? `https://wa.me/${(brand.whatsappNumber ?? '').replace(/\D/g, '')}`
                    links.push({ label: 'WhatsApp', handle: brand.whatsappNumber ?? 'Chat with us', href: wa })
                  }
                  if (brand.socialLinks.youtube)   links.push({ label: 'YouTube',   handle: brand.socialLinks.youtube.replace(/^https?:\/\/(www\.)?youtube\.com\//i, '').replace(/\/$/, ''),        href: brand.socialLinks.youtube })
                  if (brand.socialLinks.twitter)   links.push({ label: 'Twitter',   handle: brand.socialLinks.twitter.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '@').replace(/\/$/, ''),   href: brand.socialLinks.twitter })
                  if (brand.socialLinks.linkedin)  links.push({ label: 'LinkedIn',  handle: brand.socialLinks.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\//i, '').replace(/\/$/, ''),      href: brand.socialLinks.linkedin })
                  return links.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sg-tile p-4 rounded-xl block"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{s.label}</p>
                      <p className="text-sm font-bold truncate" style={{ color: BRASS }}>{s.handle}</p>
                    </a>
                  ))
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>
    </CustomerLayout>
  )
}

/* ====================================================================== */
/* 3. ABOUT PAGE & TEAM MEMBERS                                           */
/* ====================================================================== */
export function AboutPage() {
  // 2026-07-16: story + values from business_settings (via useBrand),
  // team from restaurant_content_blocks (section_type=TEAM_MEMBER).
  const brand = useBrand()
  const teamQ = useAboutTeam()
  const team = (teamQ.data ?? []).map((b) => ({
    id: b.id,
    name: b.title ?? '',
    role: b.subtitle ?? '',
    img: b.imageUrl || b.driveImageUrl || '',
  }))

  return (
    <CustomerLayout>
      <DocumentTitle
        title={`About ${brand.restaurantName} — Our Story`}
        description={brand.aboutUs ?? `Learn the story behind ${brand.restaurantName}.`}
      />
      <HeroSection
        bg={HERO_IMAGES.about}
        subtitle="HERITAGE & PASSION"
        titleA="The Story of"
        titleAccent={brand.restaurantName}
        description={brand.aboutUs ?? 'Founded on the simple belief that great food brings people together.'}
      />
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80" alt="Our Dining Area" className="rounded-2xl c-card object-cover w-full h-full" />
          <div className="space-y-5">
            <p className="subtitle">OUR ROOTS</p>
            <div className="c-divider !ml-0" />
            <h2 className="display text-3xl sm:text-4xl">Our <span>Journey</span></h2>
            {brand.aboutUs ? (
              <p className="text-sm text-[--c-text-soft] leading-relaxed whitespace-pre-line">
                {brand.aboutUs}
              </p>
            ) : null}
            {brand.ourMission ? (
              <p className="text-sm text-[--c-text-soft] leading-relaxed whitespace-pre-line">
                <b>Our Mission:</b> {brand.ourMission}
              </p>
            ) : null}
            {brand.ourVision ? (
              <p className="text-sm text-[--c-text-soft] leading-relaxed whitespace-pre-line">
                <b>Our Vision:</b> {brand.ourVision}
              </p>
            ) : null}
          </div>
        </div>
      </ScrollReveal>

      {team.length > 0 ? (
        <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <p className="subtitle">THE PEOPLE BEHIND THE PLATE</p>
            <div className="c-divider" />
            <h2 className="display text-3xl sm:text-4xl">Meet Our <span>Team</span></h2>
          </div>
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map((m, i) => (
              <ScrollReveal as="li" key={m.id} delay={i * 0.08} className="c-card overflow-hidden rounded-2xl bg-[--c-bg-elev]">
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
      ) : null}
    </CustomerLayout>
  )
}

/* ====================================================================== */
/* 4. WHY US PAGE                                                         */
/* ====================================================================== */
export function WhyUsPage() {
  // 2026-07-16: hero + philosophy copy from business_settings via useBrand()
  // (about_us, our_mission, our_vision). Falls back to safe generic copy
  // when a tenant hasn't filled a given field, so UI never breaks.
  const brand = useBrand()
  return (
    <CustomerLayout>
      <DocumentTitle
        title={`Why Choose Us — ${brand.restaurantName}`}
        description={brand.ourMission ?? brand.aboutUs ?? undefined}
      />
      <HeroSection
        bg={HERO_IMAGES.whyUs}
        subtitle="GREAT FOOD & FRIENDLY SERVICE"
        titleA="Our Story of"
        titleAccent="Great Taste"
        description={brand.ourMission ?? 'We use high-quality fresh ingredients, follow strict hygiene standards, and offer warm hospitality to make your visit special.'}
      />
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <img src={HERO_IMAGES.whyUs} alt="Heritage Cooking" loading="lazy" decoding="async" className="rounded-2xl c-card object-cover w-full h-full" />
          <div className="space-y-4">
            <p className="subtitle">OUR PHILOSOPHY</p>
            <h2 className="display text-3xl sm:text-4xl">Crafting Memories <span>One Dish at a Time</span></h2>
            {brand.aboutUs ? (
              <p className="text-sm text-[--c-text-soft] leading-relaxed whitespace-pre-line">{brand.aboutUs}</p>
            ) : (
              <p className="text-sm text-[--c-text-soft] leading-relaxed">From a humble single-branch kitchen to a beloved multi-city steakhouse, our promise has stayed the same — fresh ingredients, time-honoured recipes, and warm service.</p>
            )}
            {brand.ourVision ? (
              <p className="text-sm text-[--c-text-soft] leading-relaxed whitespace-pre-line">
                <b>Our Vision:</b> {brand.ourVision}
              </p>
            ) : null}
            <ul className="space-y-2.5 text-sm font-semibold text-[--c-text-soft]">
              <li className="flex items-start gap-2.5"><Soup className="size-4 gold-text mt-0.5" /> Recipes refined over years of craft</li>
              <li className="flex items-start gap-2.5"><ChefHat className="size-4 gold-text mt-0.5" /> Passionate culinary team</li>
              <li className="flex items-start gap-2.5"><Leaf className="size-4 gold-text mt-0.5" /> Farm-fresh, locally-sourced ingredients</li>
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

// Extended gallery pool — base GALLERY (8) + 22 curated Unsplash food +
// restaurant photos. 30 total. Enables meaningful pagination (2 pages of
// 15 each). User request 2026-07-15: 15 per page.
const GALLERY_EXTENDED = [
  ...GALLERY,
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1633478062482-790a3d211915?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1541544181051-e46607bc22a4?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
]

const GALLERY_PAGE_SIZE = 15

export function GalleryPage() {
  const [page, setPage] = useState(0)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  // Backend-first: use `useCustomerGallery()` real photos. Fall back to
  // hardcoded GALLERY_EXTENDED (30 Unsplash URLs) when backend empty so
  // demo tenants + guest visitors still see a rich grid.
  const galleryQ = useCustomerGallery()
  const backendImages = galleryQ.filtered.map((g) => g.imageUrl).filter(Boolean) as string[]
  const allImages = backendImages.length > 0 ? backendImages : GALLERY_EXTENDED

  const totalPages = Math.ceil(allImages.length / GALLERY_PAGE_SIZE)
  const visibleImages = useMemo(
    () => allImages.slice(page * GALLERY_PAGE_SIZE, (page + 1) * GALLERY_PAGE_SIZE),
    [page, allImages]
  )

  // Scroll to top of grid when page changes
  const gridTopRef = useRef<HTMLDivElement | null>(null)
  const changePage = useCallback((newPage: number) => {
    setPage(newPage)
    if (gridTopRef.current) {
      const y = gridTopRef.current.getBoundingClientRect().top + window.scrollY - 90
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }, [])

  // Lightbox keyboard nav
  useEffect(() => {
    if (lightboxIdx === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null)
      if (e.key === 'ArrowRight') setLightboxIdx((i) => (i === null ? 0 : (i + 1) % visibleImages.length))
      if (e.key === 'ArrowLeft') setLightboxIdx((i) => (i === null ? 0 : (i - 1 + visibleImages.length) % visibleImages.length))
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [lightboxIdx, visibleImages.length])

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

      {/* Cream grid section — 2026-07-15 user request. Full-width cream bg
       * with animated page transitions + brass pagination + brass hover
       * rings + lightbox on click. */}
      <div style={{ background: 'var(--c-cream, #FAF6F0)' }} className="w-full" ref={gridTopRef}>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          {/* Header — subtle intro */}
          <div className="text-center mb-10 md:mb-12">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{ color: 'var(--c-accent, #C89B3C)' }}
            >
              Every Frame · A Story
            </p>
            <div
              className="mx-auto my-3 h-[1.5px] w-16"
              style={{ background: 'var(--c-accent, #C89B3C)' }}
            />
            <p
              className="text-sm max-w-xl mx-auto"
              style={{ color: 'var(--c-text-dark, #1A1210)', opacity: 0.65, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '18px' }}
            >
              Showing {page * GALLERY_PAGE_SIZE + 1}–{Math.min((page + 1) * GALLERY_PAGE_SIZE, GALLERY_EXTENDED.length)} of {GALLERY_EXTENDED.length} photographs
            </p>
          </div>

          {/* Animated grid — cards fade/slide as page changes */}
          <AnimatePresence mode="wait">
            <motion.ul
              key={page}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {visibleImages.map((src, i) => (
                <motion.li
                  key={`${page}-${i}`}
                  initial={{ opacity: 0, scale: 0.94, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: Math.min(i * 0.04, 0.4),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="group relative aspect-square overflow-hidden rounded-2xl cursor-pointer"
                  style={{
                    background: '#fff',
                    boxShadow: '0 10px 26px -12px rgba(26, 18, 16, 0.2)',
                    border: '1px solid rgba(200, 155, 60, 0.15)',
                  }}
                  onClick={() => setLightboxIdx(i)}
                  whileHover={{ y: -6 }}
                >
                  <img
                    src={src}
                    alt={`Gallery photo ${page * GALLERY_PAGE_SIZE + i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                  />
                  {/* Brass ring on hover */}
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: 'inset 0 0 0 2px var(--c-accent, #C89B3C)' }}
                  />
                  {/* Dark overlay on hover + zoom icon */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-500 grid place-items-center"
                  >
                    <ZoomIn className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>

          {/* Pagination controls — brass style */}
          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2 mt-12 md:mt-16">
              <button
                type="button"
                onClick={() => page > 0 && changePage(page - 1)}
                disabled={page === 0}
                aria-label="Previous page"
                className="size-11 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  border: '1.5px solid var(--c-accent, #C89B3C)',
                  color: page === 0 ? 'var(--c-text-dark, #1A1210)' : 'var(--c-accent, #C89B3C)',
                }}
                onMouseEnter={(e) => {
                  if (page !== 0) {
                    e.currentTarget.style.background = 'var(--c-accent, #C89B3C)'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = page === 0 ? 'var(--c-text-dark, #1A1210)' : 'var(--c-accent, #C89B3C)'
                }}
              >
                <ChevronLeft className="size-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => changePage(i)}
                  aria-label={`Page ${i + 1}`}
                  aria-current={page === i ? 'page' : undefined}
                  className="size-11 rounded-full font-bold text-sm tracking-wider transition-all"
                  style={{
                    background: page === i ? 'var(--c-accent, #C89B3C)' : 'transparent',
                    color: page === i ? '#fff' : 'var(--c-text-dark, #1A1210)',
                    border: `1.5px solid ${page === i ? 'var(--c-accent, #C89B3C)' : 'rgba(200, 155, 60, 0.3)'}`,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </button>
              ))}

              <button
                type="button"
                onClick={() => page < totalPages - 1 && changePage(page + 1)}
                disabled={page === totalPages - 1}
                aria-label="Next page"
                className="size-11 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  border: '1.5px solid var(--c-accent, #C89B3C)',
                  color: page === totalPages - 1 ? 'var(--c-text-dark, #1A1210)' : 'var(--c-accent, #C89B3C)',
                }}
                onMouseEnter={(e) => {
                  if (page !== totalPages - 1) {
                    e.currentTarget.style.background = 'var(--c-accent, #C89B3C)'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = page === totalPages - 1 ? 'var(--c-text-dark, #1A1210)' : 'var(--c-accent, #C89B3C)'
                }}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : null}
        </section>
      </div>

      {/* Lightbox — fullscreen photo viewer with keyboard nav */}
      <AnimatePresence>
        {lightboxIdx !== null ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[90] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.96)' }}
            role="dialog"
            aria-modal="true"
            onClick={() => setLightboxIdx(null)}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(null) }}
              className="absolute top-6 right-6 size-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => i === null ? 0 : (i - 1 + visibleImages.length) % visibleImages.length) }}
              className="absolute left-6 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
              aria-label="Previous"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => i === null ? 0 : (i + 1) % visibleImages.length) }}
              className="absolute right-6 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
              aria-label="Next"
            >
              <ChevronRight className="size-5" />
            </button>
            <motion.img
              key={lightboxIdx}
              src={visibleImages[lightboxIdx]}
              alt=""
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <p
              className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.24em] font-bold"
              style={{ color: 'var(--c-accent, #C89B3C)' }}
            >
              {String((lightboxIdx ?? 0) + 1).padStart(2, '0')} / {String(visibleImages.length).padStart(2, '0')} · Page {page + 1}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </CustomerLayout>
  )
}

/* ====================================================================== */
/* 6. SIGNATURE PAGE                                                      */
/* ====================================================================== */
export function SignaturePage() {
  // 2026-07-16: pull real live catalog from backend (tenant-resolved via host)
  // and filter to owner-flagged `signature` items only. `useCustomerCatalog`
  // already returns [] for tenants without a menu and seed DISHES in demo
  // mode, so this stays SaaS-safe.
  const brand = useBrand()
  const { dishes, isLoading } = useCustomerCatalog()
  const signatureDishes = useMemo(() => dishes.filter((d) => d.signature), [dishes])

  return (
    <CustomerLayout>
      <DocumentTitle title={`Chef's Signature Dishes — ${brand.restaurantName}`} />
      <HeroSection
        bg={HERO_IMAGES.signature}
        subtitle="OUR SPECIAL SIGNATURE DISHES"
        titleA="Chef's Special"
        titleAccent="Dishes"
        description="Enjoy our delicious food made by our best chefs to give you a wonderful dining experience."
      />

      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {isLoading ? (
          <div className="c-card p-12 text-center rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
            <Loader2 className="size-8 gold-text mx-auto mb-3 animate-spin" />
            <p className="text-sm text-[--c-text-soft]">Loading signature dishes…</p>
          </div>
        ) : signatureDishes.length === 0 ? (
          <div className="c-card p-12 text-center rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
            <ChefHat className="size-16 gold-text mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No signature dishes yet</h3>
            <p className="text-sm text-[--c-text-soft]">Our chefs are curating something special — check back soon.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {signatureDishes.map((d) => (
              <li key={d.id} className="contents">
                <DishCard dish={d} />
              </li>
            ))}
          </ul>
        )}
      </ScrollReveal>
    </CustomerLayout>
  )
}

/* ====================================================================== */
/* 7. GENERAL MY ORDERS LIST PAGE                                         */
/* ====================================================================== */
function statusColorClasses(status: string): string {
  const s = status.toUpperCase()
  if (s === 'DELIVERED' || s === 'COMPLETED') return '!text-green-400 !border-green-500/35 bg-green-500/5'
  if (s === 'CANCELLED' || s === 'REJECTED' || s === 'FAILED') return '!text-red-400 !border-red-500/35 bg-red-500/5'
  if (s === 'OUT_FOR_DELIVERY' || s.includes('OUT')) return '!text-blue-300 !border-blue-500/35 bg-blue-500/5'
  return '!text-amber-300 !border-amber-500/35 bg-amber-500/5'
}

function statusLabel(status: string): string {
  const s = status.toUpperCase().replace(/_/g, ' ')
  return s.charAt(0) + s.slice(1).toLowerCase()
}

export function MyOrdersPage() {
  const navigate = useNavigate()
  const isSignedIn = typeof window !== 'undefined' && Boolean(tokens.getCustomer())
  const backendOrdersQ = useCustomerOrders()
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

  const backendOrders = backendOrdersQ.data ?? []
  const isBackendLoading = isSignedIn && backendOrdersQ.isLoading
  // Show pending-sync (offline) items on top; backend orders below.
  const pendingSyncOrders = localQueue.filter((o) => o.status !== 'synced')

  const hasAnyOrder = backendOrders.length > 0 || pendingSyncOrders.length > 0

  return (
    <CustomerLayout>
      <DocumentTitle title="My Orders — Spice Garden" />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="subtitle">YOUR HISTORY</p>
        <div className="c-divider !ml-0" />
        <h1 className="display text-3xl sm:text-4xl mb-8">My <span>Orders</span></h1>

        {isBackendLoading ? (
          <div className="c-card p-12 text-center rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
            <Loader2 className="size-8 gold-text mx-auto mb-3 animate-spin" />
            <p className="text-sm text-[--c-text-soft]">Loading your orders…</p>
          </div>
        ) : !hasAnyOrder ? (
          <div className="c-card p-12 text-center rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
            <Soup className="size-16 gold-text mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No orders placed yet</h3>
            <p className="text-sm text-[--c-text-soft] mb-6">
              {isSignedIn
                ? 'When you place an order it will appear in your account history list.'
                : 'Sign in to see your order history across devices.'}
            </p>
            <button className="c-button-primary px-8 rounded-full cursor-pointer" onClick={() => navigate('/menu')}>
              BROWSE MENU
            </button>
          </div>
        ) : (
          <ul className="space-y-3.5">
            {/* Pending-sync (offline) orders first */}
            {pendingSyncOrders.map((o) => (
              <li key={`local-${o.id}`} className="c-card p-5 flex items-center justify-between gap-4 rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
                <div className="min-w-0">
                  <p className="font-mono font-bold text-sm tracking-wider">{o.id}</p>
                  <p className="text-xs text-[--c-text-muted] mt-1 font-medium">
                    {new Date(o.placedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {o.items?.length || 0} items · {String(o.paymentMethod).toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="c-tag shrink-0 !py-1 !px-2 rounded-lg font-bold text-[10px] !text-amber-300 !border-amber-500/35 bg-amber-500/5">
                    Pending sync
                  </span>
                  <p className="font-mono gold-text font-bold text-base shrink-0">₹{o.total?.toLocaleString('en-IN')}</p>
                </div>
              </li>
            ))}
            {/* Backend orders (real order history) */}
            {backendOrders.map((o) => (
              <li
                key={`backend-${o.id}`}
                className="c-card p-5 flex items-center justify-between gap-4 rounded-2xl bg-[--c-bg-elev] border border-[--c-border] hover:border-[--c-accent] transition-colors cursor-pointer"
                onClick={() => navigate(`/orders/${o.id}`)}
              >
                <div className="min-w-0">
                  <p className="font-mono font-bold text-sm tracking-wider">{o.orderNumber ? `#${o.orderNumber}` : `#${o.id}`}</p>
                  <p className="text-xs text-[--c-text-muted] mt-1 font-medium">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                    {o.itemCount != null ? ` · ${o.itemCount} items` : ''}
                    {o.paymentMethod ? ` · ${o.paymentMethod}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('c-tag shrink-0 !py-1 !px-2 rounded-lg font-bold text-[10px]', statusColorClasses(o.status))}>
                    {statusLabel(o.status)}
                  </span>
                  <p className="font-mono gold-text font-bold text-base shrink-0">₹{o.totalAmount.toLocaleString('en-IN')}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {isSignedIn && backendOrdersQ.isError ? (
          <p className="text-xs text-red-400 text-center mt-4">
            Couldn't reach the server. Showing offline-queued orders only.
          </p>
        ) : null}
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
