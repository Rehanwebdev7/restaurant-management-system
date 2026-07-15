/**
 * Branch directory — `/locations`.
 *
 * Cream + ink alternating sections (2026-07-15) — hero (dark) → rich branch
 * cards (cream) → facilities strip (dark) → private events (cream) → how to
 * reach (dark) → awards + CTA (cream). Extended per-branch metadata is a
 * design layer; live API branches fall back to sensible defaults so the page
 * never looks empty when data widens.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Phone, Clock, Navigation, Utensils, Users, Car, Wifi, Accessibility,
  ChefHat, PartyPopper, Wine, Cake, Building2, Train, Sparkles, Calendar,
  Star, Award, ShieldCheck,
} from 'lucide-react'
import CustomerLayout, { HeroSection } from '@/features/customer/CustomerLayout'
import { DocumentTitle } from '@/lib/seo/document-title'
import { HERO_IMAGES } from '@/features/customer/catalog'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useCustomerBranches } from '@/api/queries/customer'
import { useBrand } from '@/components/providers/BrandProvider'

interface Branch {
  id: number
  name: string
  address: string
  phone: string
  hours: string
  mapsQuery: string
  photo: string
  specialty: string
  bestFor: string[]
  seating: string
  features: string[]
  chefNote: string
}

const BRANCH_PHOTOS = [
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
]

const DEFAULT_FEATURES = ['Valet Parking', 'Private Dining', 'Live Kitchen', 'Family Friendly']
const DEFAULT_BEST_FOR = ['Date Nights', 'Family Dinners', 'Business Lunches']

const BRANCHES: Branch[] = [
  {
    id: 1,
    name: 'Spice Garden — Bandra Main',
    address: '123 Sea Breeze Lane, Bandra West, Mumbai · 400050',
    phone: '+91 9876543210',
    hours: 'Mon–Sun · 11:00 AM – 11:30 PM',
    mapsQuery: 'Spice Garden Bandra West Mumbai',
    photo: BRANCH_PHOTOS[0]!,
    specialty: 'Slow-cooked Awadhi kebabs & tandoor',
    bestFor: ['Anniversaries', 'Rooftop Dining', 'Wine Pairings'],
    seating: '120 covers · 2 private rooms',
    features: ['Rooftop', 'Valet Parking', 'Live Ghazal Fri–Sat', "Chef's Table", 'Sommelier'],
    chefNote: 'Our flagship kitchen — everything we serve across Mumbai is first perfected here.',
  },
  {
    id: 2,
    name: 'Spice Garden — Andheri',
    address: 'Unit 12, Solitaire Tower, Andheri East, Mumbai · 400069',
    phone: '+91 9876543211',
    hours: 'Mon–Sun · 12:00 PM – 11:00 PM',
    mapsQuery: 'Spice Garden Andheri East Mumbai',
    photo: BRANCH_PHOTOS[1]!,
    specialty: 'Coastal seafood & Konkan classics',
    bestFor: ['Business Lunches', 'Team Dinners', 'Solo Diners'],
    seating: '90 covers · Bar seating available',
    features: ['Full Bar', 'Valet Parking', 'Live Kitchen', 'Metro 200m', 'Wheelchair Access'],
    chefNote: 'Weekday express lunch menu — full three-course thali served in under 25 minutes.',
  },
  {
    id: 3,
    name: 'Spice Garden — Powai',
    address: 'Lakeside Promenade, Powai, Mumbai · 400076',
    phone: '+91 9876543212',
    hours: 'Mon–Sun · 12:00 PM – 11:00 PM',
    mapsQuery: 'Spice Garden Powai Mumbai',
    photo: BRANCH_PHOTOS[2]!,
    specialty: 'Modern Indian small plates & lakeside dining',
    bestFor: ['Sunday Brunch', 'Kids Welcome', 'Lake Views'],
    seating: '150 covers · Outdoor deck · Play area',
    features: ['Lake View', 'Kids Menu', 'Weekend Brunch', 'Pet Friendly Deck', 'Free Parking'],
    chefNote: 'Sunday jazz brunch (11 AM – 3 PM) with live acoustic sets and a bottomless mimosa option.',
  },
]

const SELECTED_BRANCH_KEY = 'customer_selected_branch_id'
const DEFAULT_HOURS = 'Mon–Sun · 11:00 AM – 11:30 PM'

const CREAM = 'var(--c-cream, #FAF6F0)'
const INK = 'var(--c-text-dark, #1A1210)'
const BRASS = 'var(--c-accent, #C89B3C)'

const FACILITIES = [
  { Icon: Car, label: 'Valet Parking', note: 'Complimentary at all branches' },
  { Icon: Wine, label: 'Full Bar & Sommelier', note: 'Curated Indian & imported labels' },
  { Icon: ChefHat, label: 'Live Kitchen', note: 'Watch the chefs at work' },
  { Icon: Accessibility, label: 'Wheelchair Access', note: 'Ramps + accessible restrooms' },
  { Icon: Wifi, label: 'Free High-Speed Wi-Fi', note: 'For work-lunches or catch-ups' },
  { Icon: PartyPopper, label: 'Private Dining Rooms', note: 'Seating 8–40 · projector on request' },
  { Icon: Users, label: 'Family & Kids Menu', note: 'High-chairs + colouring kits' },
  { Icon: ShieldCheck, label: 'FSSAI Certified', note: 'Kitchen audited every quarter' },
]

const EVENTS = [
  {
    Icon: Cake,
    title: 'Birthdays & Anniversaries',
    text: 'A dedicated host, custom cake table setup, and a curated tasting menu that fits your budget.',
    accent: 'From ₹1,200/head',
  },
  {
    Icon: Building2,
    title: 'Corporate & Team Dinners',
    text: 'Private dining rooms with AV support, semi-buffet options, and GST invoices for reimbursements.',
    accent: 'Groups of 12–60',
  },
  {
    Icon: Sparkles,
    title: 'Weddings & Sangeets',
    text: 'Full-restaurant buyouts, off-site catering, live counters — mehendi, sangeet, cocktail evenings.',
    accent: 'Full-venue buyouts',
  },
]

const REACH = [
  { Icon: Train, title: 'By Metro & Local', text: 'Andheri branch is a 3-min walk from Metro Line 1; Bandra is 10 min from Bandra Station (W).' },
  { Icon: Car, title: 'By Car', text: 'All branches offer complimentary valet. Powai has a free surface lot for 40 cars.' },
  { Icon: MapPin, title: 'Nearby Landmarks', text: 'Bandra — opposite Turner Rd Church. Andheri — behind Solitaire Corporate Park. Powai — next to Hiranandani Central Park.' },
  { Icon: Clock, title: 'Peak-time Waits', text: 'Fri–Sat 8 PM onwards: expect 20–30 min without a reservation. Reserve online to skip the queue.' },
]

const AWARDS = [
  { Icon: Award, label: 'Times Food Awards 2024', note: 'Best North Indian — Bandra' },
  { Icon: Star, label: 'Zomato Gold Rated', note: '4.6★ across three branches' },
  { Icon: ChefHat, label: 'Featured in Conde Nast', note: "Mumbai's 20 must-visit kitchens" },
]

export default function LocationsPage() {
  const navigate = useNavigate()
  const brand = useBrand()
  const branchesQuery = useCustomerBranches()

  const branches = useMemo<Branch[]>(() => {
    const live = branchesQuery.data ?? []
    if (live.length > 0) {
      return live.map((b, i) => {
        const fallback = BRANCHES[i % BRANCHES.length]!
        const addressParts = [b.addressLine1, b.city, b.pincode].filter(Boolean)
        const address = addressParts.join(', ') || 'Address coming soon'
        return {
          id: b.id,
          name: `${brand.restaurantName} — ${b.branchName}`,
          address,
          phone: b.phone ?? '+91 98765 00000',
          hours: DEFAULT_HOURS,
          mapsQuery: `${brand.restaurantName} ${b.branchName} ${b.city ?? ''}`.trim(),
          photo: fallback.photo,
          specialty: fallback.specialty,
          bestFor: fallback.bestFor ?? DEFAULT_BEST_FOR,
          seating: fallback.seating,
          features: fallback.features ?? DEFAULT_FEATURES,
          chefNote: fallback.chefNote,
        }
      })
    }
    return BRANCHES
  }, [branchesQuery.data, brand.restaurantName])

  const [selected, setSelected] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(SELECTED_BRANCH_KEY)
    return raw ? Number(raw) : null
  })

  const openDirections = (b: Branch): void => {
    const url = `https://maps.google.com/?q=${encodeURIComponent(b.mapsQuery)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const pickBranch = (b: Branch): void => {
    setSelected(b.id)
    localStorage.setItem(SELECTED_BRANCH_KEY, String(b.id))
    toast.success(`Ordering from ${b.name}`)
    navigate('/menu')
  }

  return (
    <CustomerLayout>
      <DocumentTitle
        title="Locations — Spice Garden Steakhouse"
        description="Find your nearest Spice Garden branch in Mumbai — addresses, opening hours and directions."
      />
      <HeroSection
        bg={HERO_IMAGES.contact}
        subtitle="OUR BRANCHES"
        titleA="Find Our"
        titleAccent="Restaurant"
        description="Three Mumbai branches, one promise — fresh ingredients, classical recipes, warm hospitality. Pick your nearest and order in or reserve a table."
      />

      {/* SECTION 1 — Cream · Rich branch showcase */}
      <section style={{ background: CREAM, color: INK }} className="w-full sg-section-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: BRASS }}>
              Our Restaurants
            </p>
            <div className="h-px w-16 mx-auto mb-4" style={{ background: BRASS }} />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Three Kitchens.
              <span className="italic ml-2" style={{ color: BRASS, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                One Story.
              </span>
            </h2>
            <p className="mt-4 text-sm sm:text-base max-w-2xl mx-auto opacity-70">
              Each branch has its own personality — pick the one that fits your evening. Or come to all three and taste the difference.
            </p>
          </div>

          <ul className="space-y-6 lg:space-y-8">
            {branches.map((b, idx) => {
              const isSelected = selected === b.id
              const reverse = idx % 2 === 1
              return (
                <motion.li
                  key={b.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: idx * 0.05 }}
                  className={cn(
                    'grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-30px_rgba(26,18,16,0.35)] border transition-all',
                    reverse && 'lg:[&>*:first-child]:order-2',
                  )}
                  style={{ borderColor: isSelected ? BRASS : 'rgba(200,155,60,0.25)' }}
                >
                  <div className="relative aspect-[4/3] lg:aspect-auto overflow-hidden">
                    <img
                      src={b.photo}
                      alt={b.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-[8000ms] hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md" style={{ background: 'rgba(26,18,16,0.75)' }}>
                        <MapPin className="size-3" /> Branch {idx + 1}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ background: BRASS, color: INK }}>
                        Selected
                      </div>
                    )}
                  </div>

                  <div className="p-6 sm:p-8 lg:p-10 flex flex-col">
                    <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-2" style={{ color: BRASS }}>
                      Signature
                    </p>
                    <h3 className="text-2xl sm:text-3xl leading-tight mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: INK }}>
                      {b.name}
                    </h3>
                    <p className="italic text-sm sm:text-base mb-5" style={{ color: BRASS, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      "{b.specialty}"
                    </p>

                    <ul className="space-y-2.5 text-sm mb-5" style={{ color: INK }}>
                      <li className="flex items-start gap-2.5">
                        <MapPin className="size-4 mt-0.5 shrink-0" style={{ color: BRASS }} />
                        <span className="opacity-80">{b.address}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Phone className="size-4 shrink-0" style={{ color: BRASS }} />
                        <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="opacity-80 hover:opacity-100 hover:underline">{b.phone}</a>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Clock className="size-4 shrink-0" style={{ color: BRASS }} />
                        <span className="opacity-80">{b.hours}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Users className="size-4 shrink-0" style={{ color: BRASS }} />
                        <span className="opacity-80">{b.seating}</span>
                      </li>
                    </ul>

                    <div className="mb-4">
                      <p className="text-[10px] font-bold tracking-[0.24em] uppercase mb-2 opacity-60">Best For</p>
                      <div className="flex flex-wrap gap-1.5">
                        {b.bestFor.map((tag) => (
                          <span key={tag} className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(200,155,60,0.12)', color: INK, border: `1px solid ${BRASS}` }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-5">
                      <p className="text-[10px] font-bold tracking-[0.24em] uppercase mb-2 opacity-60">Amenities</p>
                      <div className="flex flex-wrap gap-1.5">
                        {b.features.map((f) => (
                          <span key={f} className="px-2.5 py-1 rounded text-[10px] font-medium opacity-70" style={{ background: 'rgba(26,18,16,0.05)', color: INK }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg p-3 mb-5 text-xs italic" style={{ background: 'rgba(200,155,60,0.08)', color: INK, borderLeft: `3px solid ${BRASS}` }}>
                      <ChefHat className="size-3.5 inline mr-1.5" style={{ color: BRASS }} />
                      Chef's note — {b.chefNote}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                      <button
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5"
                        style={{ background: 'transparent', color: INK, border: `1.5px solid ${INK}` }}
                        onClick={() => openDirections(b)}
                      >
                        <Navigation className="size-4" /> Directions
                      </button>
                      <button
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_rgba(26,18,16,0.5)]"
                        style={{ background: INK }}
                        onClick={() => pickBranch(b)}
                      >
                        <Utensils className="size-4" /> Order From This Branch
                      </button>
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* SECTION 2 — Dark · Facilities strip */}
      <section className="w-full sg-section-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: BRASS }}>
              What to Expect
            </p>
            <div className="h-px w-16 mx-auto mb-4" style={{ background: BRASS }} />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Facilities Across
              <span className="italic ml-2" style={{ color: BRASS }}>All Branches</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base max-w-2xl mx-auto opacity-70">
              Every Spice Garden is built to the same standard — no matter which branch you pick, these are guaranteed.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {FACILITIES.map(({ Icon, label, note }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="sg-tile p-5 sm:p-6 rounded-xl text-center"
              >
                <div className="sg-icon-ring inline-flex size-12 sm:size-14 items-center justify-center mb-3">
                  <Icon className="size-5 sm:size-6" style={{ color: BRASS }} />
                </div>
                <h3 className="text-sm font-bold mb-1">{label}</h3>
                <p className="text-xs opacity-60">{note}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — Cream · Private Dining & Events */}
      <section style={{ background: CREAM, color: INK }} className="w-full sg-section-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: BRASS }}>
              Group Bookings
            </p>
            <div className="h-px w-16 mx-auto mb-4" style={{ background: BRASS }} />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Private Dining &
              <span className="italic ml-2" style={{ color: BRASS }}>Special Events</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base max-w-2xl mx-auto opacity-70">
              From an intimate anniversary to a 200-guest sangeet — we host the moments that matter. A dedicated event manager walks you through everything.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EVENTS.map(({ Icon, title, text, accent }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="sg-tile p-8 rounded-2xl"
              >
                <div className="sg-icon-ring inline-flex size-14 items-center justify-center mb-5">
                  <Icon className="size-6" style={{ color: BRASS }} />
                </div>
                <h3 className="text-xl mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {title}
                </h3>
                <p className="text-sm mb-4 leading-relaxed opacity-75">{text}</p>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: BRASS }}>
                  {accent}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('customer:open-reservation'))}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-10px_rgba(26,18,16,0.5)]"
              style={{ background: INK }}
            >
              <Calendar className="size-4" /> Enquire About Your Event
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Dark · How to reach us */}
      <section className="w-full sg-section-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: BRASS }}>
                Getting Here
              </p>
              <div className="h-px w-16 mb-4" style={{ background: BRASS }} />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight mb-5" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                How to Reach
                <span className="italic ml-2" style={{ color: BRASS }}>Our Restaurants</span>
              </h2>
              <p className="text-sm sm:text-base opacity-70 mb-8">
                Whether you're driving in from the suburbs or hopping off the metro, all our branches are easy to find and easier to enter.
              </p>

              <div className="relative overflow-hidden rounded-2xl aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
                  alt="Map of Mumbai branches"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 flex flex-col justify-end p-6">
                  <p className="text-[10px] font-bold tracking-[0.24em] uppercase" style={{ color: BRASS }}>Live Map Coming Soon</p>
                  <p className="text-2xl mt-1" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Mumbai</p>
                  <p className="text-xs mt-1 opacity-70">Live map view ships when the maps API key lands. Meanwhile, tap "Directions" on any branch card above.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {REACH.map(({ Icon, title, text }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="sg-tile flex gap-4 p-5 rounded-xl"
                >
                  <div className="sg-icon-ring shrink-0 inline-flex size-12 items-center justify-center">
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
      </section>

      {/* SECTION 5 — Cream · Awards + CTA */}
      <section style={{ background: CREAM, color: INK }} className="w-full sg-section-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: BRASS }}>
            Recognition
          </p>
          <div className="h-px w-16 mx-auto mb-4" style={{ background: BRASS }} />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight mb-10" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            A Little
            <span className="italic ml-2" style={{ color: BRASS }}>Applause</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {AWARDS.map(({ Icon, label, note }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="sg-tile p-6 rounded-xl"
              >
                <Icon className="size-8 mx-auto mb-3" style={{ color: BRASS }} />
                <p className="text-sm font-bold mb-1">{label}</p>
                <p className="text-xs opacity-60">{note}</p>
              </motion.div>
            ))}
          </div>

          <div className="sg-cta-panel rounded-2xl p-10 sm:p-14">
            <h3 className="text-3xl sm:text-4xl mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Ready to
              <span className="italic ml-2" style={{ color: BRASS }}>visit us?</span>
            </h3>
            <p className="text-sm sm:text-base opacity-70 mb-6 max-w-xl mx-auto">
              Reserve a table at any of our three branches — takes less than a minute.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('customer:open-reservation'))}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5"
                style={{ background: BRASS, color: INK }}
              >
                <Calendar className="size-4" /> Reserve a Table
              </button>
              <button
                onClick={() => navigate('/menu')}
                className="sg-outline-btn inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5"
              >
                <Utensils className="size-4" /> Explore the Menu
              </button>
            </div>
          </div>
        </div>
      </section>
    </CustomerLayout>
  )
}
