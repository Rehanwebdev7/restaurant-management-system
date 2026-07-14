import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Phone, Mail, Clock, Calendar, ChefHat, Leaf,
  Soup, Plus, Minus, ChevronRight, ChevronLeft, FileText,
  ShieldCheck, RotateCcw, Users, X, ZoomIn,
  MessageCircle, Sparkles, Facebook, Instagram, Twitter,
  UtensilsCrossed, Cake, Briefcase,
} from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import CustomerLayout, { HeroSection } from '@/features/customer/CustomerLayout'
import { toast } from '@/lib/toast'
import { DocumentTitle } from '@/lib/seo/document-title'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { useMouseTilt } from '@/hooks/use-mouse-tilt'
import { handleImageError } from '@/features/customer/image-fallback'
import {
  HERO_IMAGES, GALLERY, useCart, useCustomerCatalog,
  DISHES
} from '@/features/customer/catalog'
import DishCard from '@/features/customer/DishCard'
import { formatPrice } from '@/features/customer/format'
import { openReservation } from '@/features/customer/ReservationModal'
import { useBrand } from '@/components/providers/BrandProvider'
import { useCustomerBranches } from '@/api/queries/customer'
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
                    {formatPrice(l.subtotal)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="p-5 space-y-3.5 border-t border-[--c-border] bg-black/10">
              <div className="flex items-center justify-between text-sm font-semibold text-[--c-text-soft]">
                <span>Subtotal</span>
                <span className="font-mono">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-[--c-text-soft]">
                <span>GST (5%)</span>
                <span className="font-mono">{formatPrice(gst)}</span>
              </div>
              <div className="flex items-center justify-between pt-3.5 border-t border-[--c-border] text-base font-bold text-[--c-text]">
                <span>Total Amount</span>
                <span className="display text-2xl gold-text font-mono font-bold">{formatPrice(total)}</span>
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
/* 2. CONTACT PAGE (booking form moved to header Reserve modal)           */
/* ====================================================================== */

export function ContactPage() {
  // Contact page rewritten 2026-07-13: removed booking form (moved to the
  // Reserve modal on the header CTA). Contact page is now pure contact
  // info — address, phone, email, hours, embedded map, WhatsApp CTA.
  // All data derives from `useBrand()` + first branch; hardcoded Spice
  // Garden literals removed.
  const brand = useBrand()
  const { data: branches } = useCustomerBranches()
  const firstBranch = branches?.[0]
  const address = brand.address || firstBranch?.address
  const phone = brand.phone
  const email = brand.email
  const whatsappNumber = brand.whatsappNumber

  const socialLinks = [
    { key: 'facebook', label: 'Facebook', Icon: Facebook, href: brand.socialLinks.facebook },
    { key: 'instagram', label: 'Instagram', Icon: Instagram, href: brand.socialLinks.instagram },
    { key: 'twitter', label: 'Twitter', Icon: Twitter, href: brand.socialLinks.twitter },
  ].filter((s) => Boolean(s.href))

  const contactCards = [
    phone ? {
      key: 'call',
      Icon: Phone,
      label: 'Call Us',
      value: phone,
      href: `tel:${phone}`,
      accent: 'var(--c-accent, #C9A96E)',
    } : null,
    whatsappNumber ? {
      key: 'wa',
      Icon: MessageCircle,
      label: 'WhatsApp',
      value: 'Chat with us',
      href: `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`,
      accent: '#25D366',
      external: true,
    } : null,
    email ? {
      key: 'email',
      Icon: Mail,
      label: 'Email',
      value: email,
      href: `mailto:${email}`,
      accent: 'var(--c-terracotta, #B4593F)',
    } : null,
    address ? {
      key: 'visit',
      Icon: MapPin,
      label: 'Visit Us',
      value: firstBranch?.name || 'Directions',
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      accent: '#6E8B6A',
      external: true,
    } : null,
  ].filter(Boolean) as { key: string; Icon: typeof Phone; label: string; value: string; href: string; accent: string; external?: boolean }[]

  const reasonsToReach = [
    { Icon: UtensilsCrossed, title: 'Private Dining', body: "Reserve a private space for a milestone dinner, celebration, or an intimate meal that deserves more room." },
    { Icon: Users, title: 'Large Groups', body: 'Planning a get-together? Let us help you seat, plan the menu, and set the perfect table for your party.' },
    { Icon: Cake, title: 'Special Occasions', body: "Birthdays, anniversaries, proposals — tell us what's happening and we'll make it memorable." },
    { Icon: Briefcase, title: 'Media & Partnerships', body: 'Press, collabs, or business questions? Our team will get back to you within one working day.' },
  ]

  return (
    <CustomerLayout>
      <DocumentTitle
        title={`Contact — ${brand.restaurantName}`}
        description={`Get in touch with ${brand.restaurantName}. Address, phone, email, and opening hours.`}
      />
      <HeroSection
        bg={HERO_IMAGES.contact}
        subtitle="WE'RE HERE FOR YOU"
        titleA="Get in"
        titleAccent="Touch"
        description={`Questions, special occasions, or just saying hello — reach ${brand.restaurantName} the way that suits you best.`}
      />

      {/* ── Quick contact chips — 4 pill cards, tappable, high visibility ── */}
      {contactCards.length > 0 ? (
        <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-2">
          <div className={cn(
            'grid gap-4',
            contactCards.length === 1 && 'sm:grid-cols-1',
            contactCards.length === 2 && 'sm:grid-cols-2',
            contactCards.length === 3 && 'sm:grid-cols-3',
            contactCards.length === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
          )}>
            {contactCards.map(({ key, Icon, label, value, href, accent, external }) => (
              <a
                key={key}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="group c-card p-5 rounded-2xl border border-[--c-border] flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all"
                style={{ background: 'var(--c-bg-elev)' }}
              >
                <span
                  className="inline-flex items-center justify-center size-12 rounded-full shrink-0 group-hover:scale-110 transition-transform"
                  style={{ background: `${accent}22`, color: accent }}
                  aria-hidden
                >
                  <Icon className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="subtitle text-[10px] tracking-[0.22em] mb-0.5" style={{ color: 'var(--c-text-soft)' }}>{label}</p>
                  <p className="font-semibold text-[13px] truncate" style={{ color: 'var(--c-text)' }}>{value}</p>
                </div>
                <ChevronRight className="size-4 text-[--c-text-muted] shrink-0 group-hover:translate-x-1 transition-transform" aria-hidden />
              </a>
            ))}
          </div>
        </ScrollReveal>
      ) : null}

      {/* ── Reach the restaurant — details + hero photo ── */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div>
              <p className="subtitle">VISIT US</p>
              <div className="c-divider !ml-0" />
              <h2 className="display text-3xl sm:text-4xl lg:text-5xl leading-tight">Reach the <span>Restaurant</span></h2>
              <p className="mt-4 text-[14px] leading-relaxed" style={{ color: 'var(--c-text-soft)' }}>
                Walk in, call ahead, or drop a note. However you reach us, expect a warm hello and a table set with care.
              </p>
            </div>

            <ul className="space-y-5 text-sm font-medium">
              {address ? (
                <li className="flex items-start gap-4">
                  <span className="inline-flex items-center justify-center size-10 rounded-full shrink-0" style={{ background: 'rgba(201,169,110,0.14)' }}>
                    <MapPin className="size-5" style={{ color: 'var(--c-accent)' }} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] font-bold mb-0.5" style={{ color: 'var(--c-text-soft)' }}>Address</p>
                    <p style={{ color: 'var(--c-text)' }}>{address}</p>
                  </div>
                </li>
              ) : null}
              {phone ? (
                <li className="flex items-start gap-4">
                  <span className="inline-flex items-center justify-center size-10 rounded-full shrink-0" style={{ background: 'rgba(201,169,110,0.14)' }}>
                    <Phone className="size-5" style={{ color: 'var(--c-accent)' }} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] font-bold mb-0.5" style={{ color: 'var(--c-text-soft)' }}>Phone</p>
                    <a href={`tel:${phone}`} className="hover:gold-text transition-colors" style={{ color: 'var(--c-text)' }}>{phone}</a>
                  </div>
                </li>
              ) : null}
              {email ? (
                <li className="flex items-start gap-4">
                  <span className="inline-flex items-center justify-center size-10 rounded-full shrink-0" style={{ background: 'rgba(201,169,110,0.14)' }}>
                    <Mail className="size-5" style={{ color: 'var(--c-accent)' }} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] font-bold mb-0.5" style={{ color: 'var(--c-text-soft)' }}>Email</p>
                    <a href={`mailto:${email}`} className="hover:gold-text transition-colors" style={{ color: 'var(--c-text)' }}>{email}</a>
                  </div>
                </li>
              ) : null}
              <li className="flex items-start gap-4">
                <span className="inline-flex items-center justify-center size-10 rounded-full shrink-0" style={{ background: 'rgba(201,169,110,0.14)' }}>
                  <Clock className="size-5" style={{ color: 'var(--c-accent)' }} />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] font-bold mb-0.5" style={{ color: 'var(--c-text-soft)' }}>Hours</p>
                  <p style={{ color: 'var(--c-text)' }}>Open daily — please call for the day's hours.</p>
                </div>
              </li>
            </ul>

            <div className="flex flex-wrap gap-3 pt-4">
              <button
                type="button"
                onClick={openReservation}
                className="c-button-primary inline-flex items-center gap-2"
              >
                <Calendar className="size-4" />
                Reserve a Table
              </button>
              {whatsappNumber ? (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="c-button-outline inline-flex items-center gap-2"
                >
                  <MessageCircle className="size-4" />
                  Chat on WhatsApp
                </a>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden border border-[--c-border] c-card">
            <img
              src={HERO_IMAGES.contact}
              alt={`${brand.restaurantName} interior`}
              loading="lazy"
              decoding="async"
              className="w-full aspect-[4/3] object-cover"
              onError={handleImageError('ambience')}
            />
            {firstBranch?.address ? (
              <div className="p-5" style={{ background: 'var(--c-bg-elev)' }}>
                <p className="subtitle text-[10px] tracking-[0.22em] mb-1">MAIN BRANCH</p>
                <p className="font-semibold text-base" style={{ color: 'var(--c-text)' }}>{firstBranch.name}</p>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--c-text-soft)' }}>{firstBranch.address}</p>
              </div>
            ) : null}
          </div>
        </div>
      </ScrollReveal>

      {/* ── Reasons to reach out — 4 editorial cards ── */}
      <div className="c-wash-sage">
        <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <p className="subtitle">HOW CAN WE HELP</p>
            <div className="c-divider" />
            <h2 className="display text-3xl sm:text-4xl">Reasons to <span>Reach Out</span></h2>
            <p className="mt-4 max-w-xl mx-auto text-[14px] leading-relaxed" style={{ color: 'var(--c-text-soft)' }}>
              Whatever brings you here, we're glad you did. A quick note about what you're looking for helps us serve you better.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {reasonsToReach.map(({ Icon, title, body }, i) => (
              <ScrollReveal
                key={title}
                delay={i * 0.08}
                as="article"
                className="p-6 rounded-2xl border border-[--c-border] hover:-translate-y-1 transition-transform group"
                style={{ background: 'var(--c-bg-elev)' }}
              >
                <span
                  className="inline-flex items-center justify-center size-12 rounded-full mb-4 group-hover:scale-110 transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, rgba(201,169,110,0.18), rgba(180,89,63,0.14))',
                    color: 'var(--c-accent)',
                  }}
                  aria-hidden
                >
                  <Icon className="size-6" />
                </span>
                <h3 className="display text-xl mb-2" style={{ color: 'var(--c-text)' }}>{title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--c-text-soft)' }}>{body}</p>
              </ScrollReveal>
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* ── All branches grid — only when tenant has multiple ── */}
      {branches && branches.length > 1 ? (
        <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <p className="subtitle">FIND US</p>
            <div className="c-divider" />
            <h2 className="display text-3xl sm:text-4xl">Our <span>Branches</span></h2>
            <p className="mt-3 text-[13px]" style={{ color: 'var(--c-text-soft)' }}>
              {branches.length} location{branches.length === 1 ? '' : 's'} · pick the one closest to you
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches.map((b, i) => (
              <ScrollReveal
                key={b.id}
                delay={i * 0.06}
                as="article"
                className="p-6 rounded-2xl border border-[--c-border] hover:-translate-y-1 transition-transform"
                style={{ background: 'var(--c-bg-elev)' }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="inline-flex items-center justify-center size-10 rounded-full shrink-0" style={{ background: 'rgba(201,169,110,0.14)', color: 'var(--c-accent)' }}>
                    <MapPin className="size-5" />
                  </span>
                  {b.city ? (
                    <span className="text-[10px] uppercase tracking-[0.22em] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(180,89,63,0.12)', color: 'var(--c-terracotta)' }}>
                      {b.city}
                    </span>
                  ) : null}
                </div>
                <h3 className="font-bold text-base mb-1" style={{ color: 'var(--c-text)' }}>{b.name}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--c-text-soft)' }}>{b.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.16em] hover:underline"
                  style={{ color: 'var(--c-accent)' }}
                >
                  Get Directions <ChevronRight className="size-3" />
                </a>
              </ScrollReveal>
            ))}
          </div>
        </ScrollReveal>
      ) : null}

      {/* ── Follow along — social icons row (only if any set) ── */}
      {socialLinks.length > 0 ? (
        <div className="c-wash-terracotta">
          <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
            <p className="subtitle">STAY IN THE LOOP</p>
            <div className="c-divider" />
            <h2 className="display text-2xl sm:text-3xl mb-6">Follow <span>Along</span></h2>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {socialLinks.map(({ key, label, Icon, href }) => (
                <a
                  key={key}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${brand.restaurantName} on ${label}`}
                  className="inline-flex items-center justify-center size-12 rounded-full border border-[--c-border] hover:-translate-y-1 hover:shadow-md transition-all"
                  style={{ background: 'var(--c-bg-elev)', color: 'var(--c-text)' }}
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          </ScrollReveal>
        </div>
      ) : null}

      {/* ── Bottom Reserve CTA card ── */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div
          className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden border border-[--c-border]"
          style={{ background: 'linear-gradient(135deg, rgba(201,169,110,0.14), rgba(180,89,63,0.10))' }}
        >
          <span
            className="inline-flex items-center justify-center size-14 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, #F5E5B8, #C9A96E)' }}
          >
            <Sparkles className="size-6" style={{ color: '#1A1A1A' }} />
          </span>
          <p className="subtitle text-[10px] tracking-[0.28em] mb-2" style={{ color: 'var(--c-terracotta)' }}>THE TABLE IS READY</p>
          <h2 className="display text-3xl sm:text-4xl lg:text-5xl mb-3">Ready to <span>book</span>?</h2>
          <p className="text-[14px] max-w-lg mx-auto mb-6 leading-relaxed" style={{ color: 'var(--c-text-soft)' }}>
            Reserve online in less than a minute — we'll follow up with a call to confirm your table.
          </p>
          <button
            type="button"
            onClick={openReservation}
            className="c-button-primary inline-flex items-center gap-2"
          >
            <Calendar className="size-4" />
            Reserve Your Table
          </button>
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
/* 5. GALLERY PAGE — lightbox + 3D tilt + editorial gallery-wall           */
/* ====================================================================== */
export function GalleryPage() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const reduce = useReducedMotion()

  const closeLightbox = useCallback(() => setLightboxIdx(null), [])
  const nextImage = useCallback(() => {
    setLightboxIdx((i) => (i == null ? null : (i + 1) % GALLERY.length))
  }, [])
  const prevImage = useCallback(() => {
    setLightboxIdx((i) => (i == null ? null : (i - 1 + GALLERY.length) % GALLERY.length))
  }, [])

  useEffect(() => {
    if (lightboxIdx == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      else if (e.key === 'ArrowRight') nextImage()
      else if (e.key === 'ArrowLeft') prevImage()
    }
    window.addEventListener('keydown', onKey)
    // Prevent body scroll while lightbox is open
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightboxIdx, closeLightbox, nextImage, prevImage])

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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Editorial gallery-wall grid — alternating aspect ratios (tall / wide
         * / square) so the eye reads it as intentional composition rather
         * than a uniform tile grid. */}
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {GALLERY.map((src, i) => (
            <GalleryTile
              key={i}
              src={src}
              index={i}
              onClick={() => setLightboxIdx(i)}
              reduce={!!reduce}
            />
          ))}
        </ul>
      </section>

      {/* Lightbox — full-screen dark backdrop with big image + prev/next arrows
       * + close button + counter. Click-outside or ESC also closes. */}
      <AnimatePresence>
        {lightboxIdx != null ? (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md"
            onClick={closeLightbox}
          >
            {/* Close button — top-right */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); closeLightbox() }}
              aria-label="Close"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 size-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors z-10"
            >
              <X className="size-5" />
            </button>

            {/* Counter — top-left */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 text-white/85 text-[11px] font-bold uppercase tracking-[0.24em] z-10">
              {String(lightboxIdx + 1).padStart(2, '0')}{' '}
              <span className="opacity-60">/</span>{' '}
              {String(GALLERY.length).padStart(2, '0')}
            </div>

            {/* Prev arrow */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prevImage() }}
              aria-label="Previous image"
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 size-12 sm:size-14 rounded-full bg-white/10 hover:bg-[var(--c-accent,#C9A96E)] hover:text-black border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 z-10"
            >
              <ChevronLeft className="size-6" />
            </button>
            {/* Next arrow */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextImage() }}
              aria-label="Next image"
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 size-12 sm:size-14 rounded-full bg-white/10 hover:bg-[var(--c-accent,#C9A96E)] hover:text-black border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 z-10"
            >
              <ChevronRight className="size-6" />
            </button>

            {/* Big image — cross-fade between slides */}
            <AnimatePresence mode="wait">
              <motion.img
                key={lightboxIdx}
                src={GALLERY[lightboxIdx]}
                alt={`Gallery photo ${lightboxIdx + 1}`}
                onError={handleImageError('gallery')}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-[92vw] max-h-[85vh] object-contain rounded-xl shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
              />
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </CustomerLayout>
  )
}

/**
 * GalleryTile — inner card with its own useMouseTilt hook so each tile
 * tracks the cursor independently. Alternating aspect ratios give the
 * grid an editorial rhythm.
 */
function GalleryTile({
  src,
  index,
  onClick,
  reduce,
}: {
  src: string
  index: number
  onClick: () => void
  reduce: boolean
}) {
  const tilt = useMouseTilt<HTMLLIElement>(8, 1.02)

  // Editorial aspect rotation — mixes tall/wide/square in a repeatable pattern.
  const aspect =
    index % 4 === 0 ? 'aspect-[3/4]' :
    index % 4 === 1 ? 'aspect-square' :
    index % 4 === 2 ? 'aspect-[4/3]' :
    'aspect-square'

  return (
    <motion.li
      ref={tilt.ref}
      initial={{ opacity: 0, y: 32, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.65,
        delay: reduce ? 0 : index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open gallery photo ${index + 1}`}
      className={`relative overflow-hidden rounded-2xl cursor-zoom-in group shadow-xl border border-white/5 hover:border-[var(--c-accent,#C9A96E)]/60 ${aspect}`}
      style={{
        perspective: '1200px',
        transition: 'transform 250ms cubic-bezier(0.16,1,0.3,1), border-color 260ms',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={handleImageError('gallery')}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.10] group-hover:brightness-[1.05]"
      />
      {/* Bottom fade for hover indicator */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 92%, rgba(0,0,0,0.75) 100%)',
        }}
      />
      {/* Gold corner glow on hover */}
      <div
        aria-hidden="true"
        className="absolute -top-8 -right-8 size-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(201,169,110,0.4) 0%, transparent 65%)',
        }}
      />
      {/* Zoom icon — appears on hover, center of tile */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div
          className="size-12 rounded-full flex items-center justify-center backdrop-blur-md border border-white/25 shadow-lg"
          style={{ background: 'rgba(201, 169, 110, 0.28)' }}
        >
          <ZoomIn className="size-5 text-white" aria-hidden />
        </div>
      </div>
    </motion.li>
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
                  <p className="font-mono gold-text font-bold text-base shrink-0">{formatPrice(o.total)}</p>
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
