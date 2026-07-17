import { useState, useEffect } from 'react'
import {
  Building2, ShieldCheck, FileText, ImageIcon as ImageLucide, CheckCircle2,
  User, Check, X, Upload, Palette,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useCreateUser } from '@/api/queries/superadmin'
import type { CreateUserBody } from '@/api/services/superadmin'

/**
 * 6-step Restaurant Onboarding wizard.
 * Matches reference UI: Basic Info → KYC → Business → Documents → Photos → Done.
 *
 * Backend save: POST /api/admin/users/add (JSON only). File uploads are collected
 * client-side; if a follow-up multipart endpoint ships we'll wire it later.
 * All doc + photo fields are OPTIONAL per reference.
 */

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: (userId: number) => void
}

type StepKey = 'basic' | 'kyc' | 'business' | 'documents' | 'photos' | 'done'

const STEPS: Array<{ key: StepKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'basic',     label: 'Basic Info', icon: User },
  { key: 'kyc',       label: 'KYC',        icon: ShieldCheck },
  { key: 'business',  label: 'Business',   icon: Building2 },
  { key: 'documents', label: 'Documents',  icon: FileText },
  { key: 'photos',    label: 'Photos',     icon: ImageLucide },
  { key: 'done',      label: 'Done',       icon: CheckCircle2 },
]

const BRAND_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#14B8A6', '#0EA5E9', '#64748B']

const COUNTRIES = [
  { code: 'IN', flag: '🇮🇳', name: 'India',         tz: 'Asia/Kolkata',      currency: 'INR' },
  { code: 'US', flag: '🇺🇸', name: 'United States', tz: 'America/New_York',  currency: 'USD' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom', tz: 'Europe/London',    currency: 'GBP' },
  { code: 'AE', flag: '🇦🇪', name: 'UAE',           tz: 'Asia/Dubai',        currency: 'AED' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore',     tz: 'Asia/Singapore',    currency: 'SGD' },
]

const ENTITY_TYPES = ['Sole Proprietor', 'Partnership', 'Private Limited', 'LLP', 'Public Limited']
const RESTAURANT_TYPES: Array<{ value: string; label: string; dot: string }> = [
  { value: 'veg',    label: '● Veg',        dot: '🟢' },
  { value: 'nonveg', label: '● Non-Veg',    dot: '🔴' },
  { value: 'both',   label: '● Both',       dot: '🟡' },
]

interface FormState {
  // Basic
  name: string; mobile: string; email: string; password: string
  // KYC
  gstNumber: string
  // Business
  restaurantName: string; shortCode: string
  address: string; city: string; state: string; pincode: string
  country: string; timezone: string; currency: string
  entityType: string; restaurantType: string
  logoDataUrl: string | null; brandColor: string
  // Docs (filenames only, files kept client-side for now)
  docEinProof: string | null; docBusinessReg: string | null
  docFoodLicense: string | null; docFoodProtection: string | null
  docAddressProof: string | null; docFireSafety: string | null
  docLiquorLicense: string | null
  // Photos
  photoFront: string | null; photoInside: string | null
  photoNameBoard: string | null; photoOwnerSelfie: string | null
  photoVisitingCard: string | null; photoOther: string | null
}

const INITIAL: FormState = {
  name: '', mobile: '', email: '', password: '',
  gstNumber: '',
  restaurantName: '', shortCode: '',
  address: '', city: '', state: '', pincode: '',
  country: 'IN', timezone: 'Asia/Kolkata', currency: 'INR',
  entityType: 'Sole Proprietor', restaurantType: 'both',
  logoDataUrl: null, brandColor: '#3B82F6',
  docEinProof: null, docBusinessReg: null,
  docFoodLicense: null, docFoodProtection: null,
  docAddressProof: null, docFireSafety: null,
  docLiquorLicense: null,
  photoFront: null, photoInside: null,
  photoNameBoard: null, photoOwnerSelfie: null,
  photoVisitingCard: null, photoOther: null,
}

export default function RestaurantOnboardingModal({ open, onClose, onCreated }: Props) {
  const create = useCreateUser()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [step, setStep] = useState<StepKey>('basic')

  useEffect(() => {
    if (open) { setForm(INITIAL); setStep('basic') }
  }, [open])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }))

  const stepIdx = STEPS.findIndex((s) => s.key === step)

  const basicValid =
    form.name.trim().length >= 2 &&
    /^[0-9]{7,15}$/.test(form.mobile) &&
    form.password.length >= 6 &&
    (!form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
  const kycValid = true  // GST optional
  const businessValid =
    form.restaurantName.trim().length >= 2 &&
    form.address.trim().length >= 3 &&
    !!form.country

  const canProceedFrom: Record<StepKey, boolean> = {
    basic: basicValid,
    kyc: kycValid,
    business: businessValid,
    documents: true,
    photos: true,
    done: true,
  }

  const goNext = async () => {
    const curIdx = STEPS.findIndex((s) => s.key === step)
    if (!canProceedFrom[step]) {
      toast.warning('Please complete required fields')
      return
    }
    if (step === 'photos') {
      // Photos is the last data step — submit now, then advance to Done.
      await submit()
      return
    }
    setStep(STEPS[curIdx + 1]!.key)
  }
  const goBack = () => {
    const curIdx = STEPS.findIndex((s) => s.key === step)
    if (curIdx > 0) setStep(STEPS[curIdx - 1]!.key)
  }

  const submit = async () => {
    const body: CreateUserBody = {
      name: form.name.trim(),
      mobile: form.mobile,
      email: form.email.trim() || undefined,
      password: form.password,
      role: 'restaurant',
      parentId: null,
      isActive: true,
      approvalStatus: 'APPROVED',
      gstNumber: form.gstNumber.trim() || undefined,
      city:     form.city.trim() || undefined,
      state:    form.state.trim() || undefined,
      pincode:  form.pincode.trim() || undefined,
    }
    const res = await create.mutateAsync(body)
    if (res.ok) {
      toast.success(`Restaurant "${form.restaurantName || form.name}" onboarded`)
      onCreated?.(Number(res.data?.id ?? 0))
      setStep('done')
    } else {
      toast.error(res.message)
    }
  }

  const onCountryChange = (code: string) => {
    const c = COUNTRIES.find((x) => x.code === code) ?? COUNTRIES[0]!
    setForm((s) => ({ ...s, country: c.code, timezone: c.tz, currency: c.currency }))
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" /> Add New Restaurant
          </DialogTitle>
          <DialogDescription className="sr-only">Multi-step restaurant onboarding</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="px-5 pt-4 pb-3 border-b border-border">
          <ol className="flex items-center gap-1.5 flex-wrap">
            {STEPS.map((s, i) => {
              const done = i < stepIdx
              const current = i === stepIdx
              const StepIcon = s.icon
              return (
                <li key={s.key} className="flex items-center gap-1.5">
                  <div className={cn(
                    'flex flex-col items-center gap-1 min-w-[64px]',
                  )}>
                    <div className={cn(
                      'size-9 rounded-full grid place-items-center transition-all',
                      done && 'bg-success text-success-foreground',
                      current && 'bg-primary text-primary-foreground shadow-elevation-1 ring-4 ring-primary/20',
                      !done && !current && 'bg-muted text-muted-foreground',
                    )}>
                      {done ? <Check className="size-4" /> : <StepIcon className="size-4" />}
                    </div>
                    <span className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap',
                      current ? 'text-primary' : done ? 'text-success' : 'text-muted-foreground',
                    )}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 ? (
                    <div className={cn(
                      'h-[2px] w-6 rounded transition-colors mt-[-14px]',
                      done ? 'bg-success' : 'bg-border',
                    )} />
                  ) : null}
                </li>
              )
            })}
          </ol>
        </div>

        {/* Step body — scrollable */}
        <div className="p-5 max-h-[60vh] overflow-y-auto themed-scrollbar">
          {step === 'basic'     ? <StepBasic form={form} set={set} /> : null}
          {step === 'kyc'       ? <StepKyc form={form} set={set} /> : null}
          {step === 'business'  ? <StepBusiness form={form} set={set} onCountryChange={onCountryChange} /> : null}
          {step === 'documents' ? <StepDocuments form={form} set={set} /> : null}
          {step === 'photos'    ? <StepPhotos form={form} set={set} /> : null}
          {step === 'done'      ? <StepDone form={form} /> : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-3 bg-card/50">
          {step === 'done' ? (
            <>
              <span className="text-xs text-muted-foreground">Onboarded successfully.</span>
              <Button onClick={onClose}>Close</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={goBack} disabled={stepIdx === 0 || create.isPending}>
                ← Back
              </Button>
              <Button onClick={goNext} disabled={create.isPending || !canProceedFrom[step]}>
                {create.isPending ? 'Creating…' : step === 'photos' ? 'Create Restaurant ✓' : 'Next →'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════════════════════════════
 * Step components
 * ═══════════════════════════════════════════════════════════════════ */

type Setter = <K extends keyof FormState>(k: K, v: FormState[K]) => void

function StepBasic({ form, set }: { form: FormState; set: Setter }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">Owner & Login Details</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Primary owner account — they will use these credentials to log in.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Owner Name" required>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name of owner" />
        </Field>
        <Field label="Mobile Number" required>
          <Input
            type="tel"
            inputMode="numeric"
            maxLength={15}
            value={form.mobile}
            onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 15))}
            placeholder="10-digit mobile"
          />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="owner@restaurant.com" />
        </Field>
        <Field label="Password (Login ke liye)" required>
          <Input type="text" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Set login password" />
        </Field>
      </div>
    </div>
  )
}

function StepKyc({ form, set }: { form: FormState; set: Setter }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">Business Tax ID</h3>
        <p className="text-xs text-muted-foreground mt-0.5">GST / EIN / VAT — whichever your country uses.</p>
      </div>
      <Field label="GST / Tax ID Number" hint="Format varies by country (e.g. India GSTIN: 27AAAAA0000A1Z5, US EIN: 12-3456789)">
        <Input
          value={form.gstNumber}
          onChange={(e) => set('gstNumber', e.target.value.toUpperCase())}
          placeholder="e.g. 27AAAAA0000A1Z5"
          className="tracking-wider font-mono"
        />
      </Field>
      <div className="rounded-md bg-info/10 border border-info/30 p-3 text-xs">
        <span className="font-semibold text-info">Optional:</span>
        <span className="text-muted-foreground ml-1">You can skip and add later from Business Settings.</span>
      </div>
    </div>
  )
}

function StepBusiness({
  form, set, onCountryChange,
}: { form: FormState; set: Setter; onCountryChange: (code: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">Business Details</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Public restaurant identity + location + branding.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Field label="Restaurant Name" required>
            <Input value={form.restaurantName} onChange={(e) => set('restaurantName', e.target.value)} placeholder="Full restaurant name" />
          </Field>
        </div>
        <Field label="Short Code" hint="e.g. RMS001">
          <Input value={form.shortCode} onChange={(e) => set('shortCode', e.target.value.toUpperCase())} placeholder="e.g. RMS001" />
        </Field>
      </div>

      <Field label="Address" required>
        <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Full address" />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="City">
          <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City" />
        </Field>
        <Field label="State">
          <Input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="State" />
        </Field>
        <Field label="Pincode / ZIP" required>
          <Input
            inputMode="numeric"
            maxLength={10}
            value={form.pincode}
            onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="6-digit pincode"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Country" required>
          <select
            className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
            value={form.country}
            onChange={(e) => onCountryChange(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Timezone" hint="Auto-set based on country">
          <Input value={form.timezone} onChange={(e) => set('timezone', e.target.value)} />
        </Field>
        <Field label="Currency" hint="Auto-set based on country">
          <Input value={form.currency} onChange={(e) => set('currency', e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Entity Type">
          <select
            className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
            value={form.entityType}
            onChange={(e) => set('entityType', e.target.value)}
          >
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Restaurant Type">
          <select
            className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
            value={form.restaurantType}
            onChange={(e) => set('restaurantType', e.target.value)}
          >
            {RESTAURANT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.dot} {t.label.replace(/^● /, '')}</option>)}
          </select>
        </Field>
      </div>

      {/* Branding block */}
      <div className="rounded-md border border-border p-4 space-y-4 bg-muted/20">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          <p className="text-sm font-semibold">Branding <span className="text-muted-foreground font-normal text-xs">(optional)</span></p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Restaurant Logo</p>
            <FileDrop
              label="Upload Logo"
              helper="PNG, JPG • Max 2MB"
              accept="image/png,image/jpeg"
              preview={form.logoDataUrl}
              onFile={(dataUrl) => set('logoDataUrl', dataUrl)}
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Brand / Theme Color</p>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('brandColor', c)}
                  className={cn(
                    'aspect-square rounded-full border-2 transition-transform hover:scale-110',
                    form.brandColor === c ? 'border-foreground ring-2 ring-primary/30' : 'border-transparent',
                  )}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.brandColor}
                onChange={(e) => set('brandColor', e.target.value)}
                className="size-9 rounded-md border border-border cursor-pointer bg-transparent"
              />
              <code className="px-2 py-1.5 rounded bg-primary text-primary-foreground text-xs font-mono">
                {form.brandColor}
              </code>
              <span className="text-[10px] text-muted-foreground">Preview</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepDocuments({ form, set }: { form: FormState; set: Setter }) {
  const docs: Array<{ key: keyof FormState; label: string }> = [
    { key: 'docEinProof',       label: 'EIN / GST Proof' },
    { key: 'docBusinessReg',    label: 'Business Registration Proof' },
    { key: 'docFoodLicense',    label: 'Food License' },
    { key: 'docFoodProtection', label: 'Food Protection Certificate' },
    { key: 'docAddressProof',   label: 'Address Proof (Lease)' },
    { key: 'docFireSafety',     label: 'Fire Safety Certificate' },
    { key: 'docLiquorLicense',  label: 'Liquor License' },
  ]
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">Business Documents Upload</h3>
        <p className="text-xs text-muted-foreground mt-0.5">All documents are optional. You can continue without uploading any files.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {docs.map((d) => (
          <div key={d.key}>
            <p className="text-xs font-semibold text-foreground mb-1.5">{d.label}</p>
            <FileDrop
              label={`Upload ${d.label}`}
              helper="JPG, PNG, PDF • Max 5MB"
              accept="image/*,application/pdf"
              preview={form[d.key] as string | null}
              onFile={(name) => set(d.key, name as never)}
              nameOnly
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function StepPhotos({ form, set }: { form: FormState; set: Setter }) {
  const photos: Array<{ key: keyof FormState; label: string }> = [
    { key: 'photoFront',        label: 'Restaurant Front' },
    { key: 'photoInside',       label: 'Restaurant Inside' },
    { key: 'photoNameBoard',    label: 'Name Board' },
    { key: 'photoOwnerSelfie',  label: 'Owner Selfie' },
    { key: 'photoVisitingCard', label: 'Visiting Card' },
    { key: 'photoOther',        label: 'Other Document' },
  ]
  const uploaded = photos.filter((p) => form[p.key]).length
  const pct = Math.round((uploaded / photos.length) * 100)
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">Restaurant Photos <span className="text-muted-foreground font-normal text-xs">(all optional)</span></h3>
        <p className="text-xs text-muted-foreground mt-0.5">Add photos to make the restaurant profile look polished. You can skip and add later.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {photos.map((p) => (
          <div key={p.key}>
            <p className="text-xs font-semibold text-foreground mb-1.5">{p.label}</p>
            <FileDrop
              label={`Upload ${p.label}`}
              helper={p.label.includes('Card') ? 'JPG, PNG, PDF • Max 5MB' : 'JPG, PNG • Max 5MB'}
              accept={p.label.includes('Card') ? 'image/*,application/pdf' : 'image/*'}
              preview={form[p.key] as string | null}
              onFile={(name) => set(p.key, name as never)}
              nameOnly
            />
          </div>
        ))}
      </div>
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Uploaded photos: {uploaded}/{photos.length}</span>
          <span className="font-semibold tabular-nums">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

function StepDone({ form }: { form: FormState }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto size-16 rounded-full bg-success/10 text-success grid place-items-center mb-4">
        <CheckCircle2 className="size-8" />
      </div>
      <h3 className="text-xl font-semibold mb-1">Restaurant Onboarded</h3>
      <p className="text-sm text-muted-foreground">
        {form.restaurantName || form.name} is now live on the platform.
      </p>
      <div className="mt-4 flex justify-center">
        <Badge variant="success">Role: RESTAURANT · Auto-approved</Badge>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
 * FileDrop — click / drag zone that either stores a data URL (for logo)
 * or just the filename (for docs/photos where backend upload is pending).
 * ═══════════════════════════════════════════════════════════════════ */

function FileDrop({
  label, helper, accept, preview, onFile, nameOnly = false,
}: {
  label: string
  helper: string
  accept: string
  preview: string | null
  onFile: (value: string) => void
  nameOnly?: boolean
}) {
  const [hover, setHover] = useState(false)

  const handleFile = (file: File | null) => {
    if (!file) return
    if (nameOnly) {
      onFile(file.name)
      return
    }
    const reader = new FileReader()
    reader.onload = () => onFile(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFile('')
  }

  const isImageDataUrl = preview && preview.startsWith('data:image/')

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setHover(true) }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault(); setHover(false)
        handleFile(e.dataTransfer.files?.[0] ?? null)
      }}
      className={cn(
        'group flex flex-col items-center justify-center gap-1.5 min-h-[110px] rounded-md border-2 border-dashed cursor-pointer transition-all p-3 text-center',
        hover ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-accent/30',
        preview ? 'border-solid border-success/40 bg-success/5' : '',
      )}
    >
      <input
        type="file"
        accept={accept}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        className="hidden"
      />
      {isImageDataUrl ? (
        <div className="relative">
          <img src={preview!} alt="preview" className="size-16 rounded object-cover" />
          <button
            type="button"
            onClick={clear}
            className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground grid place-items-center hover:scale-110 transition-transform"
            aria-label="Remove"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : preview ? (
        <div className="flex flex-col items-center gap-1">
          <CheckCircle2 className="size-6 text-success" />
          <span className="text-xs font-medium truncate max-w-[180px]">{preview}</span>
          <button
            type="button"
            onClick={clear}
            className="text-[10px] text-destructive hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <Upload className="size-5 text-muted-foreground" />
          <p className="text-xs font-semibold">{label}</p>
          <p className="text-[10px] text-muted-foreground">{helper}</p>
        </>
      )}
    </label>
  )
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label} {required ? <span className="text-destructive">*</span> : null}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
