/**
 * Branch directory — `/locations`.
 *
 * Lightweight port of legacy `LocationPage.jsx`. Full Google-Maps "branch by
 * distance" UX is parked until the backend exposes `/api/customer/branches`
 * with lat/lng — for now this lists curated Mumbai branches with directions
 * and "order from this branch" CTAs. The selected branch is persisted in
 * localStorage so CustomerLayout's branch picker stays in sync.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Phone, Clock, Navigation, Utensils } from 'lucide-react'
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
}

const BRANCHES: Branch[] = [
  {
    id: 1,
    name: 'Spice Garden — Bandra Main',
    address: '123 Sea Breeze Lane, Bandra West, Mumbai · 400050',
    phone: '+91 9876543210',
    hours: 'Mon–Sun · 11:00 AM – 11:30 PM',
    mapsQuery: 'Spice Garden Bandra West Mumbai',
  },
  {
    id: 2,
    name: 'Spice Garden — Andheri',
    address: 'Unit 12, Solitaire Tower, Andheri East, Mumbai · 400069',
    phone: '+91 9876543211',
    hours: 'Mon–Sun · 12:00 PM – 11:00 PM',
    mapsQuery: 'Spice Garden Andheri East Mumbai',
  },
  {
    id: 3,
    name: 'Spice Garden — Powai',
    address: 'Lakeside Promenade, Powai, Mumbai · 400076',
    phone: '+91 9876543212',
    hours: 'Mon–Sun · 12:00 PM – 11:00 PM',
    mapsQuery: 'Spice Garden Powai Mumbai',
  },
]

// Aligned with CustomerLayout's branch selector key so picking a branch here
// updates the header's selection too.
const SELECTED_BRANCH_KEY = 'customer_selected_branch_id'
const DEFAULT_HOURS = 'Mon–Sun · 11:00 AM – 11:30 PM'

export default function LocationsPage() {
  const navigate = useNavigate()
  const brand = useBrand()
  const branchesQuery = useCustomerBranches()
  const branches = useMemo<Branch[]>(() => {
    const live = branchesQuery.data ?? []
    if (live.length > 0) {
      return live.map((b) => {
        const addressParts = [b.addressLine1, b.city, b.pincode].filter(Boolean)
        const address = addressParts.join(', ') || 'Address coming soon'
        return {
          id: b.id,
          name: `${brand.restaurantName} — ${b.branchName}`,
          address,
          phone: b.phone ?? '+91 98765 00000',
          hours: DEFAULT_HOURS,
          mapsQuery: `${brand.restaurantName} ${b.branchName} ${b.city ?? ''}`.trim(),
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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map placeholder */}
          <div className="lg:col-span-1 c-card overflow-hidden h-64 lg:h-auto lg:sticky lg:top-24 self-start">
            <div className="relative w-full h-full min-h-[260px]">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
                alt="Map of Mumbai branches"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-end p-5">
                <p className="subtitle text-[10px]">PIN-DROP MAP</p>
                <p className="display text-2xl">Mumbai</p>
                <p className="text-xs text-[--c-text-soft] mt-1">
                  Live map view ships when the maps API key lands.
                </p>
              </div>
            </div>
          </div>

          {/* Branch list */}
          <ul className="lg:col-span-2 space-y-4">
            {branches.map((b) => {
              const isSelected = selected === b.id
              return (
                <li
                  key={b.id}
                  className={cn(
                    'c-card p-5 sm:p-6 transition-all',
                    isSelected && 'ring-2 ring-[--c-accent]/40 border-[--c-accent]',
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <span className="size-12 rounded-full border border-[--c-accent] grid place-items-center gold-text shrink-0">
                      <Utensils className="size-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="subtitle text-[10px]">BRANCH</p>
                      <h2 className="display text-2xl">{b.name}</h2>
                      <ul className="mt-3 space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <MapPin className="size-4 gold-text mt-0.5 shrink-0" />
                          <span className="text-[--c-text-soft]">{b.address}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Phone className="size-4 gold-text shrink-0" />
                          <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="hover:gold-text">
                            {b.phone}
                          </a>
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock className="size-4 gold-text shrink-0" />
                          <span className="text-[--c-text-soft]">{b.hours}</span>
                        </li>
                      </ul>
                      <div className="flex flex-col sm:flex-row gap-2 mt-5">
                        <button
                          className="c-button-outline inline-flex items-center justify-center gap-2"
                          onClick={() => openDirections(b)}
                        >
                          <Navigation className="size-4" /> GET DIRECTIONS
                        </button>
                        <button
                          className="c-button-primary inline-flex items-center justify-center gap-2 flex-1"
                          onClick={() => pickBranch(b)}
                        >
                          ORDER FROM THIS BRANCH
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </CustomerLayout>
  )
}
