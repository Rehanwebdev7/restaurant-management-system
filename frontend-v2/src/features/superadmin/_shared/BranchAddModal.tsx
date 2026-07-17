import { useState, useEffect, useMemo } from 'react'
import { GitBranch, MapPin, Clock, Phone, Mail, Save } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import { restaurantBranchCrud, useRestaurantTree } from '@/api/queries/superadmin'
import type { AdminEntity } from '@/api/services/superadmin'

/**
 * Add / Edit Branch modal — used by SuperadminBranches page + tree "+Add Branch"
 * button on User Directory.
 *
 * Backend: POST /api/admin/restaurant_branch/add + PUT /api/admin/restaurant_branch/update
 * Body includes: branchName, phone, email, addressLine1, city, pincode,
 * latitude, longitude, openTime, closeTime, restaurantId {id}, isActive.
 */
interface Props {
  open: boolean
  onClose: () => void
  /** Prefill for editing; omit to create new */
  initial?: AdminEntity | null
  /** Optional preselected restaurant id (from tree click) */
  restaurantId?: number | null
  restaurantName?: string | null
  onSaved?: (entity: AdminEntity) => void
}

interface FormState {
  branchName: string
  shortCode: string
  phone: string
  email: string
  addressLine1: string
  city: string
  state: string
  pincode: string
  latitude: string
  longitude: string
  openTime: string
  closeTime: string
  restaurantId: number | null
  isActive: boolean
}

const INITIAL: FormState = {
  branchName: '', shortCode: '', phone: '', email: '',
  addressLine1: '', city: '', state: '', pincode: '',
  latitude: '', longitude: '',
  openTime: '10:00', closeTime: '23:00',
  restaurantId: null, isActive: true,
}

export default function BranchAddModal({
  open, onClose, initial, restaurantId, restaurantName, onSaved,
}: Props) {
  const treeQ = useRestaurantTree()
  const createM = restaurantBranchCrud.useCreate()
  const updateM = restaurantBranchCrud.useUpdate()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [touched, setTouched] = useState(false)

  const isEdit = initial != null

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        branchName:  String(initial.branchName ?? ''),
        shortCode:   String(initial.shortCode ?? ''),
        phone:       String(initial.phone ?? ''),
        email:       String(initial.email ?? ''),
        addressLine1: String(initial.addressLine1 ?? initial.address ?? ''),
        city:        String(initial.city ?? ''),
        state:       String(initial.state ?? ''),
        pincode:     String(initial.pincode ?? ''),
        latitude:    initial.latitude != null ? String(initial.latitude) : '',
        longitude:   initial.longitude != null ? String(initial.longitude) : '',
        openTime:    String(initial.openTime ?? '10:00'),
        closeTime:   String(initial.closeTime ?? '23:00'),
        restaurantId: (initial.restaurantId as { id?: number } | null)?.id ?? Number(initial.restaurantId ?? 0) ?? null,
        isActive:    initial.isActive === true || initial.isActive === 1 || initial.isActive === '1',
      })
    } else {
      setForm({ ...INITIAL, restaurantId: restaurantId ?? null })
    }
    setTouched(false)
  }, [open, initial, restaurantId])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }))

  const restaurantOptions = useMemo(
    () => (treeQ.data ?? []).map((r) => ({ id: r.userId, name: r.fullName || `#${r.userId}` })),
    [treeQ.data],
  )

  const errors: Partial<Record<'branchName' | 'phone' | 'restaurantId' | 'pincode', string>> = {}
  if (form.branchName.trim().length < 2)      errors.branchName = 'Branch name required'
  if (!/^[0-9]{7,15}$/.test(form.phone))       errors.phone = 'Enter valid 7-15 digit phone'
  if (form.restaurantId == null)               errors.restaurantId = 'Select parent restaurant'
  if (form.pincode && !/^[0-9]{4,10}$/.test(form.pincode)) errors.pincode = 'Enter valid pincode'
  const canSubmit = Object.keys(errors).length === 0

  const submit = async () => {
    setTouched(true)
    if (!canSubmit) { toast.warning('Please fix highlighted fields'); return }
    const body: Record<string, unknown> = {
      branchName: form.branchName.trim(),
      shortCode: form.shortCode.trim() || undefined,
      phone: form.phone,
      email: form.email.trim() || undefined,
      addressLine1: form.addressLine1.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      pincode: form.pincode.trim() || undefined,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      openTime: form.openTime,
      closeTime: form.closeTime,
      restaurantId: form.restaurantId != null ? { id: form.restaurantId } : undefined,
      isActive: form.isActive,
    }
    const res = isEdit
      ? await updateM.mutateAsync({ ...body, id: Number(initial?.id ?? 0) })
      : await createM.mutateAsync(body)
    if (res.ok) {
      toast.success(isEdit ? 'Branch updated' : 'Branch created')
      onSaved?.(res.data as AdminEntity)
      onClose()
    } else {
      toast.error(res.message)
    }
  }

  const saving = createM.isPending || updateM.isPending

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="size-5 text-primary" /> {isEdit ? 'Edit Branch' : 'Add New Branch'}
          </DialogTitle>
          <DialogDescription>
            {restaurantName
              ? <>Under <span className="font-semibold text-foreground">{restaurantName}</span></>
              : 'Create or update a branch under a restaurant.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 max-h-[65vh] overflow-y-auto themed-scrollbar pr-1">
          {/* Parent restaurant */}
          {!restaurantId ? (
            <Field label="Parent Restaurant" required error={touched ? errors.restaurantId : undefined}>
              <select
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                value={form.restaurantId ?? ''}
                onChange={(e) => set('restaurantId', e.target.value === '' ? null : Number(e.target.value))}
              >
                <option value="">Select restaurant…</option>
                {restaurantOptions.map((o) => (
                  <option key={o.id} value={o.id}>#{o.id} — {o.name}</option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Parent Restaurant</p>
              <p className="text-sm font-semibold mt-0.5">
                #{restaurantId} {restaurantName ? `— ${restaurantName}` : ''}
              </p>
            </div>
          )}

          {/* Identity */}
          <SectionTitle>Branch Identity</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Field label="Branch Name" required error={touched ? errors.branchName : undefined}>
                <Input value={form.branchName} onChange={(e) => set('branchName', e.target.value)} placeholder="e.g. Bandra West" />
              </Field>
            </div>
            <Field label="Short Code" hint="e.g. BND01">
              <Input value={form.shortCode} onChange={(e) => set('shortCode', e.target.value.toUpperCase())} placeholder="BND01" />
            </Field>
          </div>

          {/* Contact */}
          <SectionTitle>Contact</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone" required error={touched ? errors.phone : undefined}>
              <div className="relative">
                <Phone className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-9"
                  type="tel"
                  inputMode="numeric"
                  maxLength={15}
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 15))}
                  placeholder="Branch contact number"
                />
              </div>
            </Field>
            <Field label="Email">
              <div className="relative">
                <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input className="pl-9" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="branch@…" />
              </div>
            </Field>
          </div>

          {/* Address */}
          <SectionTitle>Address</SectionTitle>
          <Field label="Address Line">
            <div className="relative">
              <MapPin className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input className="pl-9" value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} placeholder="Street, building, area" />
            </div>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="City">
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Mumbai" />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="Maharashtra" />
            </Field>
            <Field label="Pincode" error={touched ? errors.pincode : undefined}>
              <Input
                inputMode="numeric"
                maxLength={10}
                value={form.pincode}
                onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="6-digit"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Latitude" hint="Optional — for map + delivery zones">
              <Input inputMode="decimal" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="e.g. 19.0596" />
            </Field>
            <Field label="Longitude" hint="Optional">
              <Input inputMode="decimal" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="e.g. 72.8295" />
            </Field>
          </div>

          {/* Hours */}
          <SectionTitle>Operating Hours</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Open Time">
              <div className="relative">
                <Clock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input className="pl-9" type="time" value={form.openTime} onChange={(e) => set('openTime', e.target.value)} />
              </div>
            </Field>
            <Field label="Close Time">
              <div className="relative">
                <Clock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input className="pl-9" type="time" value={form.closeTime} onChange={(e) => set('closeTime', e.target.value)} />
              </div>
            </Field>
          </div>

          {/* Status */}
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer pt-2">
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
            />
            <span>Active — branch is operational</span>
            {form.isActive ? <Badge variant="success" className="text-[9px]">Active</Badge> : <Badge variant="secondary" className="text-[9px]">Inactive</Badge>}
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !canSubmit}>
            <Save className="size-4" />
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Branch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, hint, required, error, children }: { label: string; hint?: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label} {required ? <span className="text-destructive">*</span> : null}</Label>
      {children}
      {error ? <p className="text-[11px] text-destructive">{error}</p> : hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{children}</p>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
