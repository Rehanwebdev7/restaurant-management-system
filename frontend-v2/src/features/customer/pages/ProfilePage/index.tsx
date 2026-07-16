import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  MapPin, Plus, Home, Briefcase, Trash2, Star, Edit3, Loader2, Camera, User, Mail, Smartphone,
  Wallet, Gift, Share2, Copy, Check, ArrowUpRight, ArrowDownLeft, TrendingUp, Users as UsersIcon,
} from 'lucide-react'
import CustomerLayout from '@/features/customer/CustomerLayout'
import { toast } from '@/lib/toast'
import { tokens } from '@/lib/auth/tokens'
import { DocumentTitle } from '@/lib/seo/document-title'
import { useBrand } from '@/components/providers/BrandProvider'
import {
  useWalletBalance,
  useWalletTransactions,
  useReferralCode,
  useReferralStats,
  useReferralUsers,
  useApplyReferralCode,
} from '@/api/queries/customer'
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
  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'wallet' | 'referral'>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search
      const params = new URLSearchParams(search)
      const tabParam = params.get('tab')
      if (tabParam === 'addresses' || window.location.pathname.includes('/addresses')) return 'addresses'
      if (tabParam === 'wallet') return 'wallet'
      if (tabParam === 'referral') return 'referral'
      return 'info'
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
        <div className="flex gap-1 sm:gap-2 border-b border-[--c-border] pb-px mb-8 overflow-x-auto scrollbar-hide">
          {[
            { key: 'info' as const, label: 'PROFILE INFO' },
            { key: 'addresses' as const, label: 'ADDRESSES' },
            { key: 'wallet' as const, label: 'WALLET' },
            { key: 'referral' as const, label: 'REFERRAL' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold border-b-2 tracking-wider transition-all cursor-pointer whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-[--c-accent] gold-text'
                  : 'border-transparent text-[--c-text-soft] hover:text-[--c-text]',
              )}
            >
              {tab.label}
            </button>
          ))}
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
          ) : null}
          {activeTab === 'addresses' ? (
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
          ) : null}
          {activeTab === 'wallet' ? (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <WalletTab />
            </motion.div>
          ) : null}
          {activeTab === 'referral' ? (
            <motion.div
              key="referral"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <ReferralTab />
            </motion.div>
          ) : null}
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

/* ==================================================================
 * WalletTab — Batch 2 wire-up
 * Shows balance card + transaction history. Pay-with-wallet at
 * checkout is deferred (needs `paymentMethod: 'WALLET'` UI in
 * CheckoutPage — future addition, contract already supports it).
 * ================================================================== */
function WalletTab() {
  const balanceQ = useWalletBalance()
  const txQ = useWalletTransactions()
  const isSignedIn = Boolean(tokens.getCustomer())

  if (!isSignedIn) {
    return (
      <div className="c-card p-10 text-center rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
        <Wallet className="size-12 gold-text mx-auto mb-3" />
        <p className="text-sm font-bold mb-1">Sign in to view your wallet</p>
        <p className="text-xs text-[--c-text-soft]">Earn cashback on every order + refunds land here instantly.</p>
      </div>
    )
  }

  const balance = balanceQ.data?.balance ?? 0
  const currency = balanceQ.data?.currency ?? 'INR'
  const pending = balanceQ.data?.pendingWithdrawal ?? 0
  const txs = txQ.data ?? []

  return (
    <div className="space-y-6">
      {/* Balance hero card */}
      <div
        className="c-card p-6 sm:p-8 rounded-2xl border border-[--c-accent]/40 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(var(--c-accent-rgb), 0.12) 0%, rgba(var(--c-accent-rgb), 0.04) 100%)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="subtitle text-[10px]">CURRENT BALANCE</p>
            <p className="display text-4xl sm:text-5xl gold-text font-bold mt-2 font-mono">
              {balanceQ.isLoading ? <Loader2 className="size-8 animate-spin inline" /> : `₹${balance.toLocaleString('en-IN')}`}
            </p>
            {currency !== 'INR' ? (
              <p className="text-xs text-[--c-text-muted] mt-1">{currency}</p>
            ) : null}
          </div>
          <div
            className="inline-flex size-14 rounded-full items-center justify-center shrink-0"
            style={{ background: 'rgba(var(--c-accent-rgb), 0.15)', border: '1.5px solid var(--c-accent)' }}
          >
            <Wallet className="size-6 gold-text" />
          </div>
        </div>
        {pending > 0 ? (
          <p className="text-xs text-[--c-text-soft] font-medium">
            <span className="opacity-70">Pending withdrawal:</span>{' '}
            <span className="gold-text font-bold">₹{pending.toLocaleString('en-IN')}</span>
          </p>
        ) : null}
        {balanceQ.isError ? (
          <p className="text-xs text-red-400 mt-2">Couldn't load balance — try refreshing.</p>
        ) : null}
      </div>

      {/* Transactions list */}
      <div className="c-card rounded-2xl bg-[--c-bg-elev] border border-[--c-border] overflow-hidden">
        <div className="p-5 border-b border-[--c-border]">
          <p className="subtitle text-[10px]">RECENT ACTIVITY</p>
          <h3 className="display text-lg font-bold mt-1">Transactions</h3>
        </div>
        {txQ.isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="size-6 animate-spin mx-auto opacity-60" />
          </div>
        ) : txs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[--c-text-soft]">No wallet activity yet.</p>
            <p className="text-xs text-[--c-text-muted] mt-1">Cashback and refunds show up here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[--c-border]">
            {txs.slice(0, 20).map((t) => {
              const isCredit = t.type.toUpperCase().includes('CREDIT') || t.type.toUpperCase() === 'REFUND'
              return (
                <li key={t.id} className="p-4 flex items-center gap-3">
                  <div
                    className={cn(
                      'shrink-0 size-10 rounded-full inline-flex items-center justify-center',
                      isCredit ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10',
                    )}
                  >
                    {isCredit ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{t.description ?? t.type}</p>
                    <p className="text-[10px] text-[--c-text-muted] mt-0.5">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                      {t.status ? ` · ${t.status}` : ''}
                    </p>
                  </div>
                  <p className={cn('font-mono font-bold text-sm shrink-0', isCredit ? 'text-green-400' : 'text-red-400')}>
                    {isCredit ? '+' : '−'} ₹{t.amount.toLocaleString('en-IN')}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="text-[10px] text-[--c-text-muted] text-center px-4">
        To withdraw funds to your bank, add bank details from settings. Withdrawals process in 3–5 business days.
      </p>
    </div>
  )
}

/* ==================================================================
 * ReferralTab — Batch 2 wire-up
 * Share code + stats + list of friends who joined via your code.
 * ================================================================== */
function ReferralTab() {
  const codeQ = useReferralCode()
  const statsQ = useReferralStats()
  const usersQ = useReferralUsers()
  const applyMut = useApplyReferralCode()
  const [copied, setCopied] = useState(false)
  const [applyInput, setApplyInput] = useState('')
  const isSignedIn = Boolean(tokens.getCustomer())

  if (!isSignedIn) {
    return (
      <div className="c-card p-10 text-center rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
        <Gift className="size-12 gold-text mx-auto mb-3" />
        <p className="text-sm font-bold mb-1">Sign in to unlock referrals</p>
        <p className="text-xs text-[--c-text-soft]">Invite friends, earn wallet cashback every time they order.</p>
      </div>
    )
  }

  const code = codeQ.data?.code ?? '—'
  const shareUrl = codeQ.data?.shareUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}/?ref=${code}` : '')
  const shareMessage = codeQ.data?.message ?? `Try ${document.title.split('—')[1]?.trim() ?? 'this restaurant'} — use my code ${code} for a treat on your first order!`
  const stats = statsQ.data
  const users = usersQ.data ?? []

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Code copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.warning('Copy failed — try manually')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join me here', text: shareMessage, url: shareUrl })
      } catch { /* user cancelled */ }
    } else {
      const wa = `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${shareUrl}`)}`
      window.open(wa, '_blank', 'noopener,noreferrer')
    }
  }

  const handleApply = () => {
    const trimmed = applyInput.trim().toUpperCase()
    if (!trimmed) {
      toast.warning('Enter a friend\'s code')
      return
    }
    applyMut.mutate(trimmed, {
      onSuccess: (res) => {
        if (res.ok) {
          toast.success(res.data.message ?? 'Referral applied — cashback added to your wallet')
          setApplyInput('')
        } else {
          toast.warning(res.message)
        }
      },
      onError: () => toast.warning('Could not apply referral code'),
    })
  }

  return (
    <div className="space-y-6">
      {/* Share code hero card */}
      <div
        className="c-card p-6 sm:p-8 rounded-2xl border border-[--c-accent]/40 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(var(--c-accent-rgb), 0.12) 0%, rgba(var(--c-accent-rgb), 0.04) 100%)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="subtitle text-[10px]">YOUR REFERRAL CODE</p>
            <p className="display text-3xl sm:text-4xl gold-text font-bold mt-2 font-mono tracking-widest">
              {codeQ.isLoading ? <Loader2 className="size-6 animate-spin inline" /> : code}
            </p>
            <p className="text-xs text-[--c-text-soft] mt-2">Share with friends. They get a treat, you get cashback.</p>
          </div>
          <div
            className="inline-flex size-14 rounded-full items-center justify-center shrink-0"
            style={{ background: 'rgba(var(--c-accent-rgb), 0.15)', border: '1.5px solid var(--c-accent)' }}
          >
            <Gift className="size-6 gold-text" />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="c-button-outline flex-1 !py-2.5 rounded-full inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer"
            onClick={handleCopy}
            disabled={codeQ.isLoading}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy Code'}
          </button>
          <button
            className="c-button-primary flex-1 !py-2.5 rounded-full inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer"
            onClick={handleShare}
            disabled={codeQ.isLoading}
          >
            <Share2 className="size-4" /> Share
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="c-card p-4 rounded-xl bg-[--c-bg-elev] border border-[--c-border] text-center">
          <UsersIcon className="size-5 mx-auto mb-2 gold-text" />
          <p className="display text-2xl gold-text font-bold font-mono">
            {statsQ.isLoading ? '—' : stats?.totalReferrals ?? 0}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[--c-text-soft] mt-1 font-semibold">Total</p>
        </div>
        <div className="c-card p-4 rounded-xl bg-[--c-bg-elev] border border-[--c-border] text-center">
          <Check className="size-5 mx-auto mb-2 text-green-400" />
          <p className="display text-2xl text-green-400 font-bold font-mono">
            {statsQ.isLoading ? '—' : stats?.successfulReferrals ?? 0}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[--c-text-soft] mt-1 font-semibold">Successful</p>
        </div>
        <div className="c-card p-4 rounded-xl bg-[--c-bg-elev] border border-[--c-border] text-center col-span-2 sm:col-span-1">
          <TrendingUp className="size-5 mx-auto mb-2 gold-text" />
          <p className="display text-2xl gold-text font-bold font-mono">
            {statsQ.isLoading ? '—' : `₹${(stats?.totalEarned ?? 0).toLocaleString('en-IN')}`}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[--c-text-soft] mt-1 font-semibold">Earned</p>
        </div>
      </div>

      {/* Apply someone else's code */}
      <div className="c-card p-5 rounded-2xl bg-[--c-bg-elev] border border-[--c-border]">
        <p className="subtitle text-[10px]">GOT A CODE?</p>
        <p className="text-sm font-bold mt-1 mb-3">Apply your friend's referral code</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter code"
            className="c-input flex-1 uppercase tracking-widest text-sm font-mono"
            value={applyInput}
            onChange={(e) => setApplyInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApply() } }}
          />
          <button
            className="c-button-primary !py-2 px-5 rounded-full text-xs font-bold uppercase tracking-widest cursor-pointer disabled:opacity-60"
            onClick={handleApply}
            disabled={applyMut.isPending || !applyInput.trim()}
          >
            {applyMut.isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'Apply'}
          </button>
        </div>
      </div>

      {/* Referred users list */}
      <div className="c-card rounded-2xl bg-[--c-bg-elev] border border-[--c-border] overflow-hidden">
        <div className="p-5 border-b border-[--c-border]">
          <p className="subtitle text-[10px]">FRIENDS WHO JOINED</p>
          <h3 className="display text-lg font-bold mt-1">Your Referrals</h3>
        </div>
        {usersQ.isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="size-6 animate-spin mx-auto opacity-60" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[--c-text-soft]">No one has used your code yet.</p>
            <p className="text-xs text-[--c-text-muted] mt-1">Share it to start earning.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[--c-border]">
            {users.map((u) => (
              <li key={u.id} className="p-4 flex items-center gap-3">
                <div className="shrink-0 size-10 rounded-full inline-flex items-center justify-center bg-[--c-border] gold-text">
                  <User className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{u.name ?? 'New friend'}</p>
                  <p className="text-[10px] text-[--c-text-muted] mt-0.5">
                    {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                    {u.status ? ` · ${u.status}` : ''}
                  </p>
                </div>
                {u.earnedAmount ? (
                  <p className="text-xs font-bold gold-text shrink-0">+ ₹{u.earnedAmount.toLocaleString('en-IN')}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

