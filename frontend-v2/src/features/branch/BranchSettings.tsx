/**
 * Branch-scoped settings page. Branch managers control open/close status,
 * delivery radius, branch contact info — restaurant-wide settings remain
 * the owner's responsibility.
 *
 * Backend probe (2026-06-24): /api/branch/settings not yet wired —
 * page renders with sample + PendingBadge and a "Saved locally" toast.
 */
import { useEffect, useState } from 'react'
import { Save, Settings as SettingsIcon, MapPin, Phone, Mail, Power } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import apiClient from '@/api/client'
import { unwrap } from '@/api/normalize'
import { toast } from '@/lib/toast'

const crumb = [
  { label: 'Branch', href: '/branch/dashboard' },
  { label: 'Settings' },
]

const PendingBadge = () => (
  <Badge variant="warning" className="ml-2 align-middle">Sample · backend pending</Badge>
)

interface BranchSettingsState {
  branchName: string
  contactPhone: string
  contactEmail: string
  address: string
  deliveryRadiusKm: string
  isOpen: boolean
  acceptingOrders: boolean
  dineInEnabled: boolean
  takeawayEnabled: boolean
  deliveryEnabled: boolean
  preparationTimeMinutes: string
}

const DEFAULT: BranchSettingsState = {
  branchName: 'Spice Garden — Main Branch',
  contactPhone: '',
  contactEmail: '',
  address: '',
  deliveryRadiusKm: '5',
  isOpen: true,
  acceptingOrders: true,
  dineInEnabled: true,
  takeawayEnabled: true,
  deliveryEnabled: true,
  preparationTimeMinutes: '20',
}

interface BranchSettingsDTO {
  branchName?: string
  phone?: string
  email?: string
  address?: string
  deliveryRadiusKm?: number
  isOpen?: boolean
  acceptingOrders?: boolean
  dineInEnabled?: boolean
  takeawayEnabled?: boolean
  deliveryEnabled?: boolean
  preparationTimeMinutes?: number
}

async function fetchBranchSettings(): Promise<BranchSettingsDTO | null> {
  try {
    const r = await apiClient.get('/api/branch/settings')
    return unwrap<BranchSettingsDTO>(r, 'data.data')
  } catch {
    return null
  }
}

export default function BranchSettings() {
  const q = useQuery({
    queryKey: ['branch', 'settings'],
    queryFn: fetchBranchSettings,
    staleTime: 60_000,
    retry: false,
  })
  const [form, setForm] = useState<BranchSettingsState>(DEFAULT)
  const [pending, setPending] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!q.data) return
    const d = q.data
    setForm((f) => ({
      ...f,
      branchName: d.branchName ?? f.branchName,
      contactPhone: d.phone ?? f.contactPhone,
      contactEmail: d.email ?? f.contactEmail,
      address: d.address ?? f.address,
      deliveryRadiusKm: d.deliveryRadiusKm != null ? String(d.deliveryRadiusKm) : f.deliveryRadiusKm,
      isOpen: d.isOpen ?? f.isOpen,
      acceptingOrders: d.acceptingOrders ?? f.acceptingOrders,
      dineInEnabled: d.dineInEnabled ?? f.dineInEnabled,
      takeawayEnabled: d.takeawayEnabled ?? f.takeawayEnabled,
      deliveryEnabled: d.deliveryEnabled ?? f.deliveryEnabled,
      preparationTimeMinutes: d.preparationTimeMinutes != null ? String(d.preparationTimeMinutes) : f.preparationTimeMinutes,
    }))
  }, [q.data])

  useEffect(() => {
    if (q.isError || (!q.isLoading && !q.data)) setPending(true)
  }, [q.isError, q.isLoading, q.data])

  const save = async () => {
    setSaving(true)
    try {
      await apiClient.post('/api/branch/settings', {
        branchName: form.branchName,
        phone: form.contactPhone,
        email: form.contactEmail,
        address: form.address,
        deliveryRadiusKm: Number(form.deliveryRadiusKm),
        isOpen: form.isOpen,
        acceptingOrders: form.acceptingOrders,
        dineInEnabled: form.dineInEnabled,
        takeawayEnabled: form.takeawayEnabled,
        deliveryEnabled: form.deliveryEnabled,
        preparationTimeMinutes: Number(form.preparationTimeMinutes),
      })
      toast.success('Settings saved')
    } catch {
      setPending(true)
      toast.warning('Saved locally — backend pending')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Settings"
        titleAdornment={pending ? <PendingBadge /> : null}
        description="Open/close, delivery radius, branch-level contact details."
        breadcrumbs={crumb}
        actions={
          <Button onClick={save} loading={saving}>
            <Save className="size-4" /> Save changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Branch profile</CardTitle>
            <CardDescription>Public-facing branch contact details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bs-name" required>Branch name</Label>
              <Input id="bs-name" value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bs-phone">Contact phone</Label>
                <div className="relative">
                  <Phone className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="bs-phone" className="pl-9" inputMode="tel" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bs-email">Contact email</Label>
                <div className="relative">
                  <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="bs-email" className="pl-9" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bs-addr">Address</Label>
              <div className="relative">
                <MapPin className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="bs-addr" className="pl-9" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live status</CardTitle>
            <CardDescription>Pause incoming orders without changing hours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 p-3 border border-border rounded-md">
              <div>
                <p className="text-sm font-medium inline-flex items-center gap-1.5">
                  <Power className="size-3.5" /> Branch open
                </p>
                <p className="text-xs text-muted-foreground">Master switch — customer site shows "Closed" when off.</p>
              </div>
              <Switch checked={form.isOpen} onCheckedChange={(v) => setForm({ ...form, isOpen: v })} />
            </div>
            <div className="flex items-center justify-between gap-3 p-3 border border-border rounded-md">
              <div>
                <p className="text-sm font-medium">Accepting new orders</p>
                <p className="text-xs text-muted-foreground">Pause briefly during rush.</p>
              </div>
              <Switch checked={form.acceptingOrders} onCheckedChange={(v) => setForm({ ...form, acceptingOrders: v })} />
            </div>
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground inline-flex items-center gap-2">
              <SettingsIcon className="size-4" /> Working hours are managed at <span className="font-medium">Branch &gt; Hours</span>.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery</CardTitle>
          <CardDescription>Radius limits this branch's delivery footprint regardless of zones.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="bs-radius">Delivery radius (km)</Label>
            <Input id="bs-radius" inputMode="decimal" value={form.deliveryRadiusKm} onChange={(e) => setForm({ ...form, deliveryRadiusKm: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-prep">Average preparation time (minutes)</Label>
            <Input id="bs-prep" inputMode="numeric" value={form.preparationTimeMinutes} onChange={(e) => setForm({ ...form, preparationTimeMinutes: e.target.value.replace(/\D/g, '') })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order channels</CardTitle>
          <CardDescription>Disable a channel only for this branch.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SwitchRow title="Dine-in" subtitle="Table-side orders." checked={form.dineInEnabled} onChange={(v) => setForm({ ...form, dineInEnabled: v })} />
          <SwitchRow title="Takeaway" subtitle="Pickup orders." checked={form.takeawayEnabled} onChange={(v) => setForm({ ...form, takeawayEnabled: v })} />
          <SwitchRow title="Delivery" subtitle="Home delivery." checked={form.deliveryEnabled} onChange={(v) => setForm({ ...form, deliveryEnabled: v })} />
        </CardContent>
      </Card>
    </div>
  )
}

function SwitchRow({
  title, subtitle, checked, onChange,
}: { title: string; subtitle: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 border border-border rounded-md">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
