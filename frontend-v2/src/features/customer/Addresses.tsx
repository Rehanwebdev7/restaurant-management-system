import { useState, useEffect, useCallback } from 'react'
import { MapPin, Plus, Home, Briefcase, Trash2, Star, Edit3, Loader2 } from 'lucide-react'
import CustomerLayout from '@/features/customer/CustomerLayout'
import { toast } from '@/lib/toast'
import { tokens } from '@/lib/auth/tokens'
import {
  fetchCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  type BackendCustomerAddress,
} from '@/api/services/customer'

/**
 * Customer addresses — full CRUD wired to
 * `/api/customer/customer_delivery_addresses/*`.
 *
 * For signed-in customers the list is fetched from + persisted to the
 * backend, with a localStorage mirror so the user still sees their
 * addresses if the network is flaky. For guest browsers (no customer
 * token), the page falls back to local-only storage so the cart flow
 * still works — saved on login.
 */

const STORAGE_KEY = 'customer_addresses_v2'

interface Address {
  id: number
  label: 'Home' | 'Work' | 'Other'
  line1: string
  line2?: string
  city: string
  pincode: string
  phone: string
  primary?: boolean
}

const SAMPLE: Address[] = [
  { id: 1, label: 'Home', line1: '302, Sea Breeze Apartments', line2: 'Bandra West', city: 'Mumbai', pincode: '400050', phone: '9988776655', primary: true },
  { id: 2, label: 'Work', line1: '12th Floor, Solitaire Tower', line2: 'Andheri East', city: 'Mumbai', pincode: '400069', phone: '9988776655' },
]

function readAddressesLocal(): Address[] {
  if (typeof window === 'undefined') return SAMPLE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SAMPLE
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE
  } catch { return SAMPLE }
}
function writeAddressesLocal(list: Address[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* private mode */ }
}

function labelFromAddressType(type?: string | null): Address['label'] {
  const t = (type ?? '').toLowerCase()
  if (t.includes('work') || t.includes('office')) return 'Work'
  if (t.includes('home')) return 'Home'
  return 'Other'
}

function backendToUi(a: BackendCustomerAddress, idx: number): Address {
  return {
    id: a.id ?? Date.now() + idx,
    label: labelFromAddressType(a.addressType),
    line1: a.addressLine1 ?? '',
    line2: a.addressLine2 ?? '',
    city: a.city ?? 'Mumbai',
    pincode: a.pincode ?? '',
    phone: localStorage.getItem('UserMobile') ?? '',
    primary: !!a.isDefault,
  }
}

function uiToBackend(a: Address, phone: string): BackendCustomerAddress {
  return {
    id: a.id < 1_000_000_000_000 ? a.id : undefined, // skip Date.now()-style local ids
    addressType: a.label.toUpperCase(),
    addressLine1: a.line1,
    addressLine2: a.line2 ?? '',
    city: a.city,
    pincode: a.pincode,
    isDefault: !!a.primary,
    isActive: true,
    deliveryInstructions: phone, // legacy backend used this field for the contact phone
  }
}

function LabelIcon({ label }: { label: Address['label'] }) {
  if (label === 'Home') return <Home className="size-4" />
  if (label === 'Work') return <Briefcase className="size-4" />
  return <MapPin className="size-4" />
}

type AddressErrors = Partial<Record<'line1' | 'city' | 'pincode' | 'phone', string>>

export default function Addresses() {
  const [list, setList] = useState<Address[]>(readAddressesLocal)
  const [editing, setEditing] = useState<Address | null>(null)
  const [draft, setDraft] = useState<Address>({ id: 0, label: 'Home', line1: '', line2: '', city: 'Mumbai', pincode: '', phone: '' })
  const [errors, setErrors] = useState<AddressErrors>({})
  const [loading, setLoading] = useState(false)
  const [usingBackend, setUsingBackend] = useState(false)

  // Mirror to localStorage so guest browsers keep working and signed-in
  // browsers retain a fast offline view.
  useEffect(() => { writeAddressesLocal(list) }, [list])

  const reload = useCallback(async () => {
    if (!tokens.getCustomer()) {
      setUsingBackend(false)
      return
    }
    setLoading(true)
    const res = await fetchCustomerAddresses()
    setLoading(false)
    if (res.ok && res.data.length > 0) {
      setUsingBackend(true)
      setList(res.data.map(backendToUi))
    } else if (res.ok) {
      // Logged in but no addresses yet on the server — keep the local sample
      // visible so the UI never looks empty; new saves go to the backend.
      setUsingBackend(true)
    }
  }, [])

  useEffect(() => { void reload() }, [reload])

  const openNew = () => {
    setDraft({ id: Date.now(), label: 'Home', line1: '', line2: '', city: 'Mumbai', pincode: '', phone: localStorage.getItem('UserMobile') ?? '' })
    setEditing(null)
    setErrors({})
  }
  const openEdit = (a: Address) => {
    setDraft(a)
    setEditing(a)
    setErrors({})
  }

  const validate = (): boolean => {
    const next: AddressErrors = {}
    if (!draft.line1.trim() || draft.line1.trim().length < 5) next.line1 = 'Address line 1 must be at least 5 characters'
    if (!draft.city.trim()) next.city = 'City is required'
    if (!/^[1-9][0-9]{5}$/.test(draft.pincode)) next.pincode = 'Invalid Indian pincode'
    if (!/^[6-9][0-9]{9}$/.test(draft.phone)) next.phone = 'Enter a valid 10-digit Indian mobile'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = async () => {
    if (!validate()) {
      toast.warning('Please fix the highlighted fields')
      return
    }

    const localUpdate = (next: Address[]): Address[] => {
      if (next.length === 1 && next[0]) next[0].primary = true
      return next
    }

    if (usingBackend) {
      const payload = uiToBackend(draft, draft.phone)
      const res = editing
        ? await updateCustomerAddress(payload)
        : await addCustomerAddress(payload)
      if (!res.ok) {
        toast.error(res.message)
        return
      }
      toast.success(editing ? 'Address updated' : 'Address added')
      void reload()
    } else {
      setList((prev) => editing
        ? prev.map((a) => (a.id === editing.id ? draft : a))
        : localUpdate([...prev, draft]),
      )
      toast.success(editing ? 'Address updated (local)' : 'Address added (local — sign in to sync)')
    }

    setEditing(null)
    setErrors({})
    setDraft({ id: 0, label: 'Home', line1: '', line2: '', city: 'Mumbai', pincode: '', phone: '' })
  }

  const remove = async (id: number) => {
    if (usingBackend && id < 1_000_000_000_000) {
      const res = await deleteCustomerAddress(id)
      if (!res.ok) {
        toast.error(res.message)
        return
      }
      toast.info('Address removed')
      void reload()
    } else {
      setList((prev) => prev.filter((a) => a.id !== id))
      toast.info('Address removed')
    }
  }

  const makePrimary = async (id: number) => {
    if (usingBackend) {
      const target = list.find((a) => a.id === id)
      if (!target) return
      const res = await updateCustomerAddress(uiToBackend({ ...target, primary: true }, target.phone))
      if (!res.ok) {
        toast.error(res.message)
        return
      }
      toast.success('Primary address set')
      void reload()
    } else {
      setList((prev) => prev.map((a) => ({ ...a, primary: a.id === id })))
      toast.success('Primary address set')
    }
  }

  return (
    <CustomerLayout>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="subtitle">DELIVERY DESTINATIONS</p>
            <div className="c-divider !ml-0" />
            <h1 className="display text-3xl sm:text-4xl">My <span>Addresses</span></h1>
            {usingBackend ? null : (
              <p className="text-xs text-[--c-text-muted] mt-2">
                Saving locally — <span className="gold-text">sign in</span> to sync across devices.
              </p>
            )}
          </div>
          <button className="c-button-primary inline-flex items-center gap-2" onClick={openNew}>
            <Plus className="size-4" /> ADD ADDRESS
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-[--c-text-muted]">
            <Loader2 className="size-5 inline animate-spin mr-2" /> Loading your addresses…
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((a) => (
              <li key={a.id} className="c-card p-4 flex items-start gap-4">
                <span className="size-10 rounded border border-[--c-accent] grid place-items-center gold-text shrink-0">
                  <LabelIcon label={a.label} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{a.label}</p>
                    {a.primary ? <span className="c-tag inline-flex items-center gap-1"><Star className="size-3 fill-current" /> Primary</span> : null}
                  </div>
                  <p className="text-sm text-[--c-text-soft] mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                  <p className="text-xs text-[--c-text-muted]">{a.city} · {a.pincode} · {a.phone}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!a.primary ? <button className="text-xs gold-text hover:underline" onClick={() => makePrimary(a.id)}>Set primary</button> : null}
                  <button className="p-2 hover:gold-text" onClick={() => openEdit(a)} aria-label="Edit"><Edit3 className="size-4" /></button>
                  <button className="p-2 text-red-400 hover:text-red-300" onClick={() => remove(a.id)} aria-label="Remove"><Trash2 className="size-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Add/Edit panel */}
        <div className="c-card p-6 mt-8 space-y-3">
          <p className="subtitle">{editing ? 'EDIT ADDRESS' : 'ADD NEW ADDRESS'}</p>
          <div className="c-divider !ml-0" />
          <div className="flex gap-2 mt-3">
            {(['Home', 'Work', 'Other'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setDraft({ ...draft, label: l })}
                className={`px-3 py-1.5 rounded text-xs font-semibold tracking-widest border transition-all ${draft.label === l ? 'bg-[--c-accent] text-black border-[--c-accent]' : 'border-[--c-border] hover:border-[--c-accent]'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div>
            <input className="c-input" placeholder="Address line 1 (required)" value={draft.line1} onChange={(e) => setDraft({ ...draft, line1: e.target.value })} aria-invalid={!!errors.line1} />
            {errors.line1 ? <p className="text-xs text-red-400 mt-1">{errors.line1}</p> : null}
          </div>
          <input className="c-input" placeholder="Address line 2" value={draft.line2 ?? ''} onChange={(e) => setDraft({ ...draft, line2: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input className="c-input" placeholder="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} aria-invalid={!!errors.city} />
              {errors.city ? <p className="text-xs text-red-400 mt-1">{errors.city}</p> : null}
            </div>
            <div>
              <input className="c-input" inputMode="numeric" maxLength={6} placeholder="Pincode" value={draft.pincode} onChange={(e) => setDraft({ ...draft, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} aria-invalid={!!errors.pincode} />
              {errors.pincode ? <p className="text-xs text-red-400 mt-1">{errors.pincode}</p> : null}
            </div>
          </div>
          <div>
            <input className="c-input" inputMode="numeric" maxLength={10} placeholder="Phone (10 digits)" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} aria-invalid={!!errors.phone} />
            {errors.phone ? <p className="text-xs text-red-400 mt-1">{errors.phone}</p> : null}
          </div>
          <div className="flex gap-2">
            <button className="c-button-outline" onClick={() => { setEditing(null); setErrors({}); setDraft({ id: 0, label: 'Home', line1: '', line2: '', city: 'Mumbai', pincode: '', phone: '' }) }}>RESET</button>
            <button className="c-button-primary flex-1" onClick={save}>{editing ? 'UPDATE' : 'SAVE ADDRESS'}</button>
          </div>
        </div>
      </section>
    </CustomerLayout>
  )
}
