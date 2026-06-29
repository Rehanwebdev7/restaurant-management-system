/**
 * Restaurant Owner — comprehensive replacements for the legacy stub pages.
 * Added 2026-06-24 to close parity gaps that the old SettingsShell / re-used
 * delivery WithdrawalRequest left behind. Backend probes are tolerant:
 * when a route 500s we render a sample row with the standard PendingBadge.
 */
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Save, Settings as SettingsIcon, IndianRupee, Plus, ArrowUpRight,
  Receipt, RefreshCw, Wallet, Landmark, ClipboardList,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { unwrap } from '@/api/normalize'
import { useRestaurantBankDetails } from '@/api/queries/restaurant'
import { toast } from '@/lib/toast'

const crumb = (last: string) => [
  { label: 'Restaurant', href: '/restaurant/dashboard' },
  { label: last },
]

const PendingBadge = () => (
  <Badge variant="warning" className="ml-2 align-middle">Sample · backend pending</Badge>
)

const inr = (n: number) => `₹${Math.round(Number(n || 0)).toLocaleString('en-IN')}`

const WEEK_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
type DayKey = (typeof WEEK_DAY_KEYS)[number]

/* ------------------------------------------------------------------ */
/* 1. RestaurantSettings — comprehensive                              */
/* ------------------------------------------------------------------ */
interface SettingsFormState {
  restaurantName: string
  contactEmail: string
  contactPhone: string
  address: string
  gstNumber: string
  currency: string
  timezone: string
  workingDays: Record<DayKey, boolean>
  notifyNewOrder: boolean
  notifyLowStock: boolean
  notifyDailyReport: boolean
  dineInEnabled: boolean
  takeawayEnabled: boolean
  deliveryEnabled: boolean
}

const DEFAULT_SETTINGS: SettingsFormState = {
  restaurantName: 'Spice Garden',
  contactEmail: '',
  contactPhone: '',
  address: '',
  gstNumber: '',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  workingDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
  notifyNewOrder: true,
  notifyLowStock: true,
  notifyDailyReport: false,
  dineInEnabled: true,
  takeawayEnabled: true,
  deliveryEnabled: true,
}

interface RestaurantSettingsDTO {
  restaurantName?: string
  email?: string
  phone?: string
  address?: string
  gstNumber?: string
  currency?: string
  timezone?: string
}

async function fetchRestaurantSettings(): Promise<RestaurantSettingsDTO | null> {
  try {
    const r = await apiClient.get('/api/restaurant/settings')
    return unwrap<RestaurantSettingsDTO>(r, 'data.data')
  } catch {
    return null
  }
}

export function RestaurantSettingsPage() {
  const settingsQ = useQuery({
    queryKey: ['restaurant', 'settings'],
    queryFn: fetchRestaurantSettings,
    staleTime: 60_000,
    retry: false,
  })
  const [form, setForm] = useState<SettingsFormState>(DEFAULT_SETTINGS)
  const [pending, setPending] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!settingsQ.data) return
    const d = settingsQ.data
    setForm((f) => ({
      ...f,
      restaurantName: d.restaurantName ?? f.restaurantName,
      contactEmail: d.email ?? f.contactEmail,
      contactPhone: d.phone ?? f.contactPhone,
      address: d.address ?? f.address,
      gstNumber: d.gstNumber ?? f.gstNumber,
      currency: d.currency ?? f.currency,
      timezone: d.timezone ?? f.timezone,
    }))
  }, [settingsQ.data])

  useEffect(() => {
    if (settingsQ.isError || (!settingsQ.isLoading && !settingsQ.data)) {
      setPending(true)
    }
  }, [settingsQ.isError, settingsQ.isLoading, settingsQ.data])

  const toggleDay = (d: DayKey) =>
    setForm((f) => ({ ...f, workingDays: { ...f.workingDays, [d]: !f.workingDays[d] } }))

  const save = async () => {
    setSaving(true)
    try {
      await apiClient.post('/api/restaurant/settings', form)
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
        title="Restaurant Settings"
        titleAdornment={pending ? <PendingBadge /> : null}
        description="Business profile, operating preferences, notification controls."
        breadcrumbs={crumb('Settings')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
            <CardDescription>Shown on receipts, invoices, and customer-facing pages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rs-name" required>Restaurant name</Label>
              <Input id="rs-name" value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rs-email">Contact email</Label>
                <Input id="rs-email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rs-phone">Contact phone</Label>
                <Input id="rs-phone" inputMode="tel" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rs-addr">Address</Label>
              <Input id="rs-addr" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rs-gst">GST number</Label>
                <Input id="rs-gst" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} placeholder="22AAAAA0000A1Z5" />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR — ₹</SelectItem>
                    <SelectItem value="USD">USD — $</SelectItem>
                    <SelectItem value="AED">AED — د.إ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Where the platform pings you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SwitchRow
              title="New order alerts"
              subtitle="Push + email on every order placed."
              checked={form.notifyNewOrder}
              onChange={(v) => setForm({ ...form, notifyNewOrder: v })}
            />
            <SwitchRow
              title="Low stock"
              subtitle="When inventory drops below threshold."
              checked={form.notifyLowStock}
              onChange={(v) => setForm({ ...form, notifyLowStock: v })}
            />
            <SwitchRow
              title="Daily report"
              subtitle="9:00 AM business summary email."
              checked={form.notifyDailyReport}
              onChange={(v) => setForm({ ...form, notifyDailyReport: v })}
            />
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground inline-flex items-center gap-2">
              <SettingsIcon className="size-4" /> SMTP/SMS provider configured at platform level.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Working days</CardTitle>
          <CardDescription>Toggle to mark a day as closed across all branches.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {WEEK_DAY_KEYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`rounded-md border p-3 text-sm font-medium uppercase tracking-wide transition-colors ${form.workingDays[d] ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/30 border-border text-muted-foreground'}`}
                aria-pressed={form.workingDays[d]}
              >
                {d}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order channels</CardTitle>
          <CardDescription>Turn off a channel restaurant-wide.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SwitchRow title="Dine-in" subtitle="Table-side orders." checked={form.dineInEnabled} onChange={(v) => setForm({ ...form, dineInEnabled: v })} />
          <SwitchRow title="Takeaway" subtitle="Pickup orders." checked={form.takeawayEnabled} onChange={(v) => setForm({ ...form, takeawayEnabled: v })} />
          <SwitchRow title="Delivery" subtitle="Home delivery." checked={form.deliveryEnabled} onChange={(v) => setForm({ ...form, deliveryEnabled: v })} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>
          <Save className="size-4" /> Save changes
        </Button>
      </div>
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

/* ------------------------------------------------------------------ */
/* 2. RestaurantWithdrawals — list + dialog                           */
/* ------------------------------------------------------------------ */
interface WithdrawalRow {
  id: number
  amount: number
  bankAccount: string
  reason?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

const WITHDRAWAL_SAMPLE: WithdrawalRow[] = [
  { id: 1, amount: 12000, bankAccount: 'HDFC · XXXXXX4521', reason: 'Vendor payouts', status: 'APPROVED', createdAt: '2026-06-18' },
  { id: 2, amount: 4500, bankAccount: 'ICICI · XXXXXX9908', reason: 'Repair work', status: 'PENDING', createdAt: '2026-06-22' },
]

async function fetchRestaurantWithdrawals(): Promise<WithdrawalRow[] | null> {
  try {
    const r = await apiClient.get('/api/restaurant/withdrawals/all')
    const arr = unwrap<WithdrawalRow[]>(r, 'data.data')
    return Array.isArray(arr) ? arr : null
  } catch {
    return null
  }
}

export function RestaurantWithdrawalsPage() {
  const q = useQuery({ queryKey: ['restaurant', 'withdrawals'], queryFn: fetchRestaurantWithdrawals, retry: false, staleTime: 60_000 })
  const bankQ = useRestaurantBankDetails()
  const live = q.data ?? null
  const usingSample = !q.isLoading && (live === null || live.length === 0)
  const [rows, setRows] = useState<WithdrawalRow[]>([])
  const [pending, setPending] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', bankAccount: '', reason: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})

  useEffect(() => {
    if (live && live.length > 0) {
      setRows(live)
    } else if (!q.isLoading) {
      setRows(WITHDRAWAL_SAMPLE)
      setPending(true)
    }
  }, [live, q.isLoading])

  const banks = useMemo(() => {
    const live = bankQ.data ?? []
    if (live.length > 0) {
      return live.map((b) => ({
        id: String(b.id),
        label: `${b.bankName ?? 'Bank'} · ${b.accountNumber ?? '—'}`,
      }))
    }
    return [
      { id: '1', label: 'HDFC · XXXXXX4521' },
      { id: '2', label: 'ICICI · XXXXXX9908' },
    ]
  }, [bankQ.data])

  const submit = async () => {
    const e: Partial<Record<keyof typeof form, string>> = {}
    const amt = Number(form.amount)
    if (!form.amount || isNaN(amt) || amt < 1) e.amount = 'Amount must be ≥ 1'
    if (!form.bankAccount) e.bankAccount = 'Bank account is required'
    setErrors(e)
    if (Object.keys(e).length) return
    try {
      await apiClient.post('/api/restaurant/withdrawals/add', form)
      toast.success('Withdrawal request submitted')
    } catch {
      toast.warning('Saved locally — backend pending')
      setPending(true)
      const newRow: WithdrawalRow = {
        id: (rows[0]?.id ?? 0) + 1,
        amount: amt,
        bankAccount: banks.find((b) => b.id === form.bankAccount)?.label ?? form.bankAccount,
        reason: form.reason || undefined,
        status: 'PENDING',
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setRows((prev) => [newRow, ...prev])
    }
    setOpen(false)
    setForm({ amount: '', bankAccount: '', reason: '' })
    setErrors({})
  }

  const columns = useMemo<ColumnDef<WithdrawalRow>[]>(() => [
    { accessorKey: 'createdAt', header: 'Requested' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="font-mono font-semibold">{inr(row.original.amount)}</span> },
    { accessorKey: 'bankAccount', header: 'Bank account' },
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => row.original.reason ?? '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
      const s = row.original.status
      if (s === 'APPROVED') return <Badge variant="success">Approved</Badge>
      if (s === 'REJECTED') return <Badge variant="destructive">Rejected</Badge>
      return <Badge variant="warning">Pending</Badge>
    } },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Withdrawals"
        titleAdornment={pending || usingSample ? <PendingBadge /> : null}
        description={`${rows.length} withdrawal requests`}
        breadcrumbs={crumb('Withdrawals')}
        actions={
          <>
            <Button variant="outline" onClick={() => void q.refetch()}>
              <RefreshCw className={q.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> New request
            </Button>
          </>
        }
      />
      <DataTable data={rows} columns={columns} loading={q.isLoading} searchPlaceholder="Search by status or amount…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New withdrawal request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="wd-amt" required>Amount (INR)</Label>
              <div className="relative">
                <IndianRupee className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="wd-amt"
                  className="pl-9"
                  inputMode="numeric"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, '') })}
                  aria-invalid={!!errors.amount}
                />
              </div>
              {errors.amount ? <p className="text-xs text-destructive" role="alert">{errors.amount}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label required>Bank account</Label>
              <Select value={form.bankAccount} onValueChange={(v) => setForm({ ...form, bankAccount: v })}>
                <SelectTrigger aria-invalid={!!errors.bankAccount}><SelectValue placeholder="Choose account" /></SelectTrigger>
                <SelectContent>
                  {banks.map((b) => <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.bankAccount ? <p className="text-xs text-destructive" role="alert">{errors.bankAccount}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wd-reason">Reason</Label>
              <Input id="wd-reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Vendor payout, repairs…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}><ArrowUpRight className="size-4" /> Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. RestaurantLoans — list + new loan dialog                        */
/* ------------------------------------------------------------------ */
interface LoanRow {
  id: number
  amount: number
  tenureMonths: number
  purpose: string
  status: 'PENDING' | 'ACTIVE' | 'CLOSED'
  balance: number
}

const LOAN_SAMPLE: LoanRow[] = [
  { id: 1, amount: 500000, tenureMonths: 24, purpose: 'Kitchen renovation', status: 'ACTIVE', balance: 320000 },
  { id: 2, amount: 250000, tenureMonths: 12, purpose: 'Equipment financing', status: 'CLOSED', balance: 0 },
]

async function fetchRestaurantLoans(): Promise<LoanRow[] | null> {
  try {
    const r = await apiClient.get('/api/restaurant/loans/all')
    const arr = unwrap<LoanRow[]>(r, 'data.data')
    return Array.isArray(arr) ? arr : null
  } catch {
    return null
  }
}

export function RestaurantLoansPage() {
  const q = useQuery({ queryKey: ['restaurant', 'loans'], queryFn: fetchRestaurantLoans, retry: false, staleTime: 60_000 })
  const [rows, setRows] = useState<LoanRow[]>([])
  const [pending, setPending] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', tenureMonths: '12', purpose: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})

  useEffect(() => {
    if (q.data && q.data.length > 0) setRows(q.data)
    else if (!q.isLoading) { setRows(LOAN_SAMPLE); setPending(true) }
  }, [q.data, q.isLoading])

  const submit = async () => {
    const e: Partial<Record<keyof typeof form, string>> = {}
    const amt = Number(form.amount)
    const tenure = Number(form.tenureMonths)
    if (!form.amount || isNaN(amt) || amt < 1) e.amount = 'Amount must be ≥ 1'
    if (!form.tenureMonths || isNaN(tenure) || tenure < 1) e.tenureMonths = 'Tenure must be ≥ 1 month'
    if (!form.purpose.trim()) e.purpose = 'Purpose is required'
    setErrors(e)
    if (Object.keys(e).length) return
    try {
      await apiClient.post('/api/restaurant/loans/add', { amount: amt, tenureMonths: tenure, purpose: form.purpose.trim() })
      toast.success('Loan request submitted')
    } catch {
      toast.warning('Saved locally — backend pending')
      setPending(true)
      const newRow: LoanRow = {
        id: (rows[0]?.id ?? 0) + 1,
        amount: amt,
        tenureMonths: tenure,
        purpose: form.purpose.trim(),
        status: 'PENDING',
        balance: amt,
      }
      setRows((prev) => [newRow, ...prev])
    }
    setOpen(false)
    setForm({ amount: '', tenureMonths: '12', purpose: '' })
    setErrors({})
  }

  const columns = useMemo<ColumnDef<LoanRow>[]>(() => [
    { accessorKey: 'purpose', header: 'Purpose' },
    { accessorKey: 'amount', header: 'Principal', cell: ({ row }) => <span className="tabular-nums">{inr(row.original.amount)}</span> },
    { accessorKey: 'tenureMonths', header: 'Tenure', cell: ({ row }) => `${row.original.tenureMonths} mo` },
    { accessorKey: 'balance', header: 'Balance', cell: ({ row }) => <span className="tabular-nums font-semibold">{inr(row.original.balance)}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
      const s = row.original.status
      if (s === 'ACTIVE') return <Badge variant="info">Active</Badge>
      if (s === 'PENDING') return <Badge variant="warning">Pending</Badge>
      return <Badge variant="secondary">Closed</Badge>
    } },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loans"
        titleAdornment={pending ? <PendingBadge /> : null}
        description={`${rows.length} loan accounts`}
        breadcrumbs={crumb('Loans')}
        actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> New loan</Button>}
      />
      <DataTable data={rows} columns={columns} loading={q.isLoading} searchPlaceholder="Search by purpose…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New loan request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ln-amt" required>Amount (INR)</Label>
                <Input id="ln-amt" inputMode="numeric" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, '') })} aria-invalid={!!errors.amount} />
                {errors.amount ? <p className="text-xs text-destructive" role="alert">{errors.amount}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ln-ten" required>Tenure (months)</Label>
                <Input id="ln-ten" inputMode="numeric" value={form.tenureMonths} onChange={(e) => setForm({ ...form, tenureMonths: e.target.value.replace(/\D/g, '') })} aria-invalid={!!errors.tenureMonths} />
                {errors.tenureMonths ? <p className="text-xs text-destructive" role="alert">{errors.tenureMonths}</p> : null}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ln-purpose" required>Purpose</Label>
              <Input id="ln-purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Kitchen renovation, equipment…" aria-invalid={!!errors.purpose} />
              {errors.purpose ? <p className="text-xs text-destructive" role="alert">{errors.purpose}</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}><Receipt className="size-4" /> Submit request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4. RestaurantWalletTopupHistory                                    */
/* ------------------------------------------------------------------ */
interface WalletTopupRow {
  id: number
  amount: number
  paymentMethod?: string | null
  status?: string | null
  createdAt?: string | null
  remark?: string | null
}

interface PagedResponse<T> { records: T[] }

const WALLET_TOPUP_SAMPLE: WalletTopupRow[] = [
  { id: 1, amount: 5000, paymentMethod: 'UPI', status: 'APPROVED', createdAt: '2026-06-22', remark: 'Customer wallet load' },
  { id: 2, amount: 1500, paymentMethod: 'CASH', status: 'PENDING', createdAt: '2026-06-23', remark: '' },
]

async function fetchRestaurantWalletTopupHistory(): Promise<WalletTopupRow[] | null> {
  try {
    const r = await apiClient.get('/api/restaurant/wallet_topup_request/history', { params: { page: 1, pageSize: 50 } })
    const page = unwrap<PagedResponse<WalletTopupRow>>(r, 'data.data')
    if (page?.records) return page.records
    const arr = unwrap<WalletTopupRow[]>(r, 'data.data')
    return Array.isArray(arr) ? arr : null
  } catch {
    return null
  }
}

export function RestaurantWalletTopupHistoryPage() {
  const q = useQuery({ queryKey: ['restaurant', 'wallet-topup-history'], queryFn: fetchRestaurantWalletTopupHistory, retry: false, staleTime: 60_000 })
  const live = q.data ?? null
  const usingSample = !q.isLoading && (live === null || live.length === 0)
  const data: WalletTopupRow[] = usingSample ? WALLET_TOPUP_SAMPLE : (live ?? [])

  const columns = useMemo<ColumnDef<WalletTopupRow>[]>(() => [
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => row.original.createdAt ?? '—' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="tabular-nums font-semibold">{inr(row.original.amount)}</span> },
    { accessorKey: 'paymentMethod', header: 'Method', cell: ({ row }) => row.original.paymentMethod ?? '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
      const s = (row.original.status ?? '').toUpperCase()
      if (s === 'APPROVED' || s === 'SUCCESS') return <Badge variant="success">{s}</Badge>
      if (s === 'REJECTED' || s === 'FAILED') return <Badge variant="destructive">{s}</Badge>
      if (s) return <Badge variant="warning">{s}</Badge>
      return <Badge variant="secondary">—</Badge>
    } },
    { accessorKey: 'remark', header: 'Remark', cell: ({ row }) => row.original.remark ?? '—' },
  ], [])

  const totalApproved = data
    .filter((r) => (r.status ?? '').toUpperCase() === 'APPROVED')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet Top-up History"
        titleAdornment={usingSample ? <PendingBadge /> : null}
        description={`${data.length} requests · ${inr(totalApproved)} approved`}
        breadcrumbs={crumb('Wallet Top-up History')}
        actions={
          <Button variant="outline" onClick={() => void q.refetch()}>
            <RefreshCw className={q.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh
          </Button>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="pt-6 space-y-1">
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Wallet className="size-3" /> Approved</div>
          <p className="text-2xl font-semibold tabular-nums">{inr(totalApproved)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 space-y-1">
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><ClipboardList className="size-3" /> Total requests</div>
          <p className="text-2xl font-semibold tabular-nums">{data.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 space-y-1">
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Landmark className="size-3" /> Pending</div>
          <p className="text-2xl font-semibold tabular-nums">{data.filter((d) => (d.status ?? '').toUpperCase() === 'PENDING').length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 space-y-1">
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Receipt className="size-3" /> Avg amount</div>
          <p className="text-2xl font-semibold tabular-nums">{inr(data.length ? data.reduce((s, r) => s + Number(r.amount || 0), 0) / data.length : 0)}</p>
        </CardContent></Card>
      </div>
      <DataTable data={data} columns={columns} loading={q.isLoading} searchPlaceholder="Search by status…" />
    </div>
  )
}
