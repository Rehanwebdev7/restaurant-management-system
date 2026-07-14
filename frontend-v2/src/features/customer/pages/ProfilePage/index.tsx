import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  MapPin, Plus, Home, Briefcase, Trash2, Star, Edit3, Loader2, Camera, User, Mail, Smartphone
} from 'lucide-react'
import CustomerLayout from '@/features/customer/CustomerLayout'
import { toast } from '@/lib/toast'
import { tokens } from '@/lib/auth/tokens'
import { DocumentTitle } from '@/lib/seo/document-title'
import { useBrand } from '@/components/providers/BrandProvider'
import {
  fetchCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  updateCustomerProfile,
  type BackendCustomerAddress
} from '@/api/services/customer'
import { ImageCropper } from '@/components/ui/image-cropper'
import '@/styles/customer.css'

const STORAGE_KEY = 'customer_addresses_v2'
const PROFILE_KEY = 'customer_profile_v2'

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

interface StoredProfile {
  name: string
  email: string
}

const SAMPLE_ADDR: Address[] = [
  { id: 1, label: 'Home', line1: '302, Sea Breeze Apartments', line2: 'Bandra West', city: 'Mumbai', pincode: '400050', phone: '9988776655', primary: true },
]

function readAddressesLocal(): Address[] {
  if (typeof window === 'undefined') return SAMPLE_ADDR
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SAMPLE_ADDR
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_ADDR
  } catch { return SAMPLE_ADDR }
}

function writeAddressesLocal(list: Address[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

function readProfile(): StoredProfile {
  if (typeof window === 'undefined') return { name: '', email: '' }
  const liveName = localStorage.getItem('UserName')
  const liveEmail = localStorage.getItem('UserEmail')
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredProfile>
      return {
        name: liveName ?? parsed.name ?? '',
        email: liveEmail ?? parsed.email ?? '',
      }
    }
  } catch { /* ignore */ }
  return { name: liveName ?? '', email: liveEmail ?? '' }
}

function writeProfile(p: StoredProfile): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
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
    id: a.id < 1_000_000_000_000 ? a.id : undefined,
    addressType: a.label.toUpperCase(),
    addressLine1: a.line1,
    addressLine2: a.line2 ?? '',
    city: a.city,
    pincode: a.pincode,
    isDefault: !!a.primary,
    isActive: true,
    deliveryInstructions: phone,
  }
}

function LabelIcon({ label }: { label: Address['label'] }) {
  if (label === 'Home') return <Home className="size-4" />
  if (label === 'Work') return <Briefcase className="size-4" />
  return <MapPin className="size-4" />
}

export function ProfilePage() {
  const brand = useBrand()
  const [activeTab, setActiveTab] = useState<'info' | 'addresses'>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search
      const params = new URLSearchParams(search)
      return params.get('tab') === 'addresses' || window.location.pathname.includes('/addresses') ? 'addresses' : 'info'
    }
    return 'info'
  })

  // Profile fields state
  const initialProfile = readProfile()
  const [profileName, setProfileName] = useState(initialProfile.name)
  const [profileEmail, setProfileEmail] = useState(initialProfile.email)
  const [mobile] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('UserMobile') ?? '' : ''))
  const [profileErrors, setProfileErrors] = useState<{ name?: string; email?: string }>({})
  const [savingProfile, setSavingProfile] = useState(false)

  // Profile photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Address state
  const [addressList, setAddressList] = useState<Address[]>(readAddressesLocal)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressDraft, setAddressDraft] = useState<Address>({ id: 0, label: 'Home', line1: '', line2: '', city: 'Mumbai', pincode: '', phone: '' })
  const [addressErrors, setAddressErrors] = useState<Partial<Record<'line1' | 'city' | 'pincode' | 'phone', string>>>({})
  const [addressLoading, setAddressLoading] = useState(false)
  const [usingAddressBackend, setUsingAddressBackend] = useState(false)

  // Save address mirror
  useEffect(() => { writeAddressesLocal(addressList) }, [addressList])

  const reloadAddresses = useCallback(async () => {
    if (!tokens.getCustomer()) {
      setUsingAddressBackend(false)
      return
    }
    setAddressLoading(true)
    const res = await fetchCustomerAddresses()
    setAddressLoading(false)
    if (res.ok && res.data.length > 0) {
      setUsingAddressBackend(true)
      setAddressList(res.data.map(backendToUi))
    } else if (res.ok) {
      setUsingAddressBackend(true)
    }
  }, [])

  useEffect(() => { 
    void reloadAddresses() 
  }, [reloadAddresses])

  // Profile image revoke url
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
    e.target.value = ''
  }

  const handleCropDone = (blob: Blob) => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(URL.createObjectURL(blob))
    toast.success('Profile photo updated')
  }

  const handleSaveProfile = async () => {
    const nextErrs: { name?: string; email?: string } = {}
    if (!profileName.trim() || profileName.trim().length < 2) nextErrs.name = 'Name must be at least 2 characters'
    if (!profileEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail)) nextErrs.email = 'Invalid email address'
    setProfileErrors(nextErrs)
    if (Object.keys(nextErrs).length > 0) {
      toast.warning('Please fix fields validation errors')
      return
    }

    setSavingProfile(true)
    writeProfile({ name: profileName.trim(), email: profileEmail.trim() })
    localStorage.setItem('UserName', profileName.trim())
    localStorage.setItem('UserEmail', profileEmail.trim())

    if (tokens.getCustomer()) {
      const res = await updateCustomerProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
        mobileNumber: mobile,
      })
      if (res.ok) {
        toast.success('Profile saved successfully')
      } else {
        toast.warning(`Saved locally — sync failed (${res.message})`)
      }
    } else {
      toast.success('Profile saved (locally)')
    }
    setSavingProfile(false)
  }

  // Address CRUD functions
  const openNewAddress = () => {
    setAddressDraft({ id: Date.now(), label: 'Home', line1: '', line2: '', city: 'Mumbai', pincode: '', phone: mobile || localStorage.getItem('UserMobile') || '' })
    setEditingAddress(null)
    setAddressErrors({})
  }

  const openEditAddress = (a: Address) => {
    setAddressDraft(a)
    setEditingAddress(a)
    setAddressErrors({})
  }

  const validateAddress = (): boolean => {
    const nextErrs: typeof addressErrors = {}
    if (!addressDraft.line1.trim() || addressDraft.line1.trim().length < 5) nextErrs.line1 = 'Address line 1 must be at least 5 characters'
    if (!addressDraft.city.trim()) nextErrs.city = 'City is required'
    if (!/^[1-9][0-9]{5}$/.test(addressDraft.pincode)) nextErrs.pincode = 'Invalid 6-digit Indian pincode'
    if (!/^[6-9][0-9]{9}$/.test(addressDraft.phone)) nextErrs.phone = 'Enter a valid 10-digit mobile number'
    setAddressErrors(nextErrs)
    return Object.keys(nextErrs).length === 0
  }

  const handleSaveAddress = async () => {
    if (!validateAddress()) {
      toast.warning('Please fill all address required fields')
      return
    }

    if (usingAddressBackend) {
      const payload = uiToBackend(addressDraft, addressDraft.phone)
      const res = editingAddress
        ? await updateCustomerAddress(payload)
        : await addCustomerAddress(payload)
      if (!res.ok) {
        toast.error(res.message)
        return
      }
      toast.success(editingAddress ? 'Address updated' : 'Address added')
      void reloadAddresses()
    } else {
      setAddressList((prev) => editingAddress
        ? prev.map((a) => (a.id === editingAddress.id ? addressDraft : a))
        : [...prev, { ...addressDraft, primary: prev.length === 0 }]
      )
      toast.success(editingAddress ? 'Address updated (local)' : 'Address added (local)')
    }
    setEditingAddress(null)
    setAddressDraft({ id: 0, label: 'Home', line1: '', line2: '', city: 'Mumbai', pincode: '', phone: '' })
  }

  const handleRemoveAddress = async (id: number) => {
    if (usingAddressBackend && id < 1_000_000_000_000) {
      const res = await deleteCustomerAddress(id)
      if (!res.ok) {
        toast.error(res.message)
        return
      }
      toast.info('Address removed')
      void reloadAddresses()
    } else {
      setAddressList((prev) => prev.filter((a) => a.id !== id))
      toast.info('Address removed')
    }
  }

  const handleSetPrimaryAddress = async (id: number) => {
    if (usingAddressBackend) {
      const target = addressList.find((a) => a.id === id)
      if (!target) return
      const res = await updateCustomerAddress(uiToBackend({ ...target, primary: true }, target.phone))
      if (!res.ok) {
        toast.error(res.message)
        return
      }
      toast.success('Primary address set')
      void reloadAddresses()
    } else {
      setAddressList((prev) => prev.map((a) => ({ ...a, primary: a.id === id })))
      toast.success('Primary address set')
    }
  }

  return (
    <CustomerLayout>
      <DocumentTitle title={`My Account — ${brand.restaurantName}`} />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="subtitle">ACCOUNT PANEL</p>
        <div className="c-divider !ml-0" />
        <h1 className="display text-3xl sm:text-4xl mb-8">My <span>Account</span></h1>

        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-[--c-border] pb-px mb-8">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              'px-6 py-2.5 text-sm font-semibold border-b-2 tracking-wider transition-all cursor-pointer',
              activeTab === 'info'
                ? 'border-[--c-accent] gold-text'
                : 'border-transparent text-[--c-text-soft] hover:text-[--c-text]'
            )}
          >
            PROFILE INFO
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={cn(
              'px-6 py-2.5 text-sm font-semibold border-b-2 tracking-wider transition-all cursor-pointer',
              activeTab === 'addresses'
                ? 'border-[--c-accent] gold-text'
                : 'border-transparent text-[--c-text-soft] hover:text-[--c-text]'
            )}
          >
            SAVED ADDRESSES
          </button>
        </div>

        {/* Tab Content Panels */}
        <AnimatePresence mode="wait">
          {activeTab === 'info' ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Photo Area */}
              <div className="c-card p-6 rounded-2xl bg-[--c-bg-elev] border border-[--c-border] flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="size-24 rounded-full overflow-hidden border-2 border-[--c-accent] bg-black/45 flex items-center justify-center shadow-lg">
                    {photoPreview ? (
                      <img src={photoPreview} alt="User Avatar" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      <User className="size-10 text-[--c-text-soft]" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-[--c-accent] text-black rounded-full shadow-md hover:scale-105 transition-transform cursor-pointer"
                    aria-label="Upload profile image"
                  >
                    <Camera className="size-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileChosen}
                  />
                </div>
                <h3 className="font-bold text-base mt-4">{profileName || 'Customer Account'}</h3>
                <p className="text-xs text-[--c-text-muted] mt-1">{profileEmail || 'No email saved'}</p>
              </div>

              {/* Settings Fields */}
              <div className="md:col-span-2 c-card p-6 rounded-2xl bg-[--c-bg-elev] border border-[--c-border] space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider mb-2">Edit Account Information</h3>
                
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-[--c-text-muted]"><User className="size-4.5" /></span>
                  <input
                    className="c-input pl-10"
                    placeholder="Full Name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    aria-invalid={!!profileErrors.name}
                  />
                  {profileErrors.name && <p className="text-xs text-red-400 mt-1">{profileErrors.name}</p>}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-[--c-text-muted]"><Mail className="size-4.5" /></span>
                  <input
                    className="c-input pl-10"
                    placeholder="Email Address"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    aria-invalid={!!profileErrors.email}
                  />
                  {profileErrors.email && <p className="text-xs text-red-400 mt-1">{profileErrors.email}</p>}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-[--c-text-muted]"><Smartphone className="size-4.5" /></span>
                  <input
                    className="c-input pl-10 opacity-70 font-mono"
                    value={mobile}
                    disabled
                    placeholder="Mobile Number"
                  />
                </div>

                <button
                  disabled={savingProfile}
                  onClick={handleSaveProfile}
                  className="c-button-primary w-full py-3.5 rounded-xl cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> SAVING CHANGES…
                    </>
                  ) : (
                    'SAVE CHANGES'
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="addresses"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-[--c-text-muted] font-medium">
                  {usingAddressBackend ? 'Syncing to your account' : 'Local Storage mode — sign in to sync'}
                </p>
                <button
                  onClick={openNewAddress}
                  className="c-button-outline !py-2 !px-4 text-xs rounded-full inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="size-4" /> ADD NEW ADDRESS
                </button>
              </div>

              {/* Add / Edit draft form */}
              {addressDraft.id > 0 && (
                <div className="c-card p-5 rounded-2xl bg-[--c-bg-elev] border border-[--c-accent]/30 space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider">
                    {editingAddress ? 'Edit Address Details' : 'Add Delivery Destination'}
                  </h3>
                  
                  <div className="flex gap-2">
                    {(['Home', 'Work', 'Other'] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setAddressDraft({ ...addressDraft, label: l })}
                        className={cn(
                          'px-3.5 py-1.5 rounded-lg text-[10px] font-bold tracking-widest border transition-all cursor-pointer',
                          addressDraft.label === l
                            ? 'bg-[--c-accent] text-black border-[--c-accent]'
                            : 'border-[--c-border] hover:border-[--c-accent]'
                        )}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div>
                    <input
                      className="c-input"
                      placeholder="Address line 1 (Flat, House no., Building)"
                      value={addressDraft.line1}
                      onChange={(e) => setAddressDraft({ ...addressDraft, line1: e.target.value })}
                      aria-invalid={!!addressErrors.line1}
                    />
                    {addressErrors.line1 && <p className="text-xs text-red-400 mt-1">{addressErrors.line1}</p>}
                  </div>

                  <input
                    className="c-input"
                    placeholder="Address line 2 (Area, Landmark)"
                    value={addressDraft.line2 || ''}
                    onChange={(e) => setAddressDraft({ ...addressDraft, line2: e.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        className="c-input"
                        placeholder="City"
                        value={addressDraft.city}
                        onChange={(e) => setAddressDraft({ ...addressDraft, city: e.target.value })}
                        aria-invalid={!!addressErrors.city}
                      />
                      {addressErrors.city && <p className="text-xs text-red-400 mt-1">{addressErrors.city}</p>}
                    </div>
                    <div>
                      <input
                        className="c-input"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Pincode"
                        value={addressDraft.pincode}
                        onChange={(e) => setAddressDraft({ ...addressDraft, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        aria-invalid={!!addressErrors.pincode}
                      />
                      {addressErrors.pincode && <p className="text-xs text-red-400 mt-1">{addressErrors.pincode}</p>}
                    </div>
                  </div>

                  <div>
                    <input
                      className="c-input"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Contact Phone Number"
                      value={addressDraft.phone}
                      onChange={(e) => setAddressDraft({ ...addressDraft, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      aria-invalid={!!addressErrors.phone}
                    />
                    {addressErrors.phone && <p className="text-xs text-red-400 mt-1">{addressErrors.phone}</p>}
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => setAddressDraft({ id: 0, label: 'Home', line1: '', line2: '', city: 'Mumbai', pincode: '', phone: '' })}
                      className="c-button-outline px-4 py-2 text-xs rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAddress}
                      className="c-button-primary px-5 py-2 text-xs rounded-lg cursor-pointer"
                    >
                      Save Address
                    </button>
                  </div>
                </div>
              )}

              {/* Saved List */}
              {addressLoading ? (
                <div className="text-center py-12 text-[--c-text-muted]">
                  <Loader2 className="size-6 inline animate-spin mr-2" /> Loading your address book…
                </div>
              ) : addressList.length === 0 ? (
                <div className="text-center py-12 c-card rounded-2xl border border-[--c-border] bg-[--c-bg-elev]">
                  <MapPin className="size-8 mx-auto gold-text mb-3" />
                  <p className="text-sm text-[--c-text-soft]">No saved addresses. Click add to register a destination!</p>
                </div>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addressList.map((addr) => (
                    <li
                      key={addr.id}
                      className="c-card p-5 flex flex-col justify-between rounded-2xl bg-[--c-bg-elev] border border-[--c-border] hover:-translate-y-0.5 transition-transform duration-300 relative overflow-hidden"
                    >
                      <div className="flex items-start gap-3">
                        <span className="size-9 rounded-xl bg-[--c-border] grid place-items-center gold-text shrink-0">
                          <LabelIcon label={addr.label} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm">{addr.label}</h4>
                            {addr.primary && (
                              <span className="c-tag inline-flex items-center gap-1.5"><Star className="size-3 fill-current" /> Primary</span>
                            )}
                          </div>
                          <p className="text-xs text-[--c-text-soft] mt-2 font-medium leading-relaxed">
                            {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                          </p>
                          <p className="text-[10px] text-[--c-text-muted] mt-1">
                            {addr.city} · {addr.pincode} · {addr.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[--c-border] pt-3.5 mt-4 text-xs font-semibold">
                        {!addr.primary ? (
                          <button
                            onClick={() => handleSetPrimaryAddress(addr.id)}
                            className="text-xs gold-text hover:underline cursor-pointer"
                          >
                            Set primary
                          </button>
                        ) : (
                          <span className="text-[--c-text-muted] text-[10px]">Default shipping address</span>
                        )}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditAddress(addr)}
                            className="p-1.5 rounded-lg border border-[--c-border] hover:border-[--c-accent] transition-colors cursor-pointer"
                            aria-label="Edit address"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveAddress(addr.id)}
                            className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-all cursor-pointer"
                            aria-label="Remove address"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Profile Picture Image Cropper */}
      <ImageCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        image={cropSource}
        aspect={1}
        cropShape="round"
        title="Crop Profile Avatar"
        onCropComplete={handleCropDone}
      />
    </CustomerLayout>
  )
}

