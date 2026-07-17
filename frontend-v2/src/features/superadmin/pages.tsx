import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, ShieldCheck, X, Bell, Building2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { SettingsShell } from '@/features/shared/SettingsShell'
import { ReportsShell } from '@/features/shared/ReportsShell'
import { toast } from '@/lib/toast'
import {
  useSuperadminRestaurants,
  useSuperadminSubscriptions,
  useSuperadminPlans,
  useSuperadminUserApprovals,
  useSuperadminNotifications,
  useUpdateUserApproval,
  useSuperadminUsers,
  useGrantSubscriptionGrace,
} from '@/api/queries/superadmin'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type {
  SuperadminBranch,
  SuperadminSubscription,
  SuperadminPlanRow,
  SuperadminUserApproval,
  SuperadminNotification,
  SuperadminUser,
} from '@/api/services/superadmin'

const crumb = (last: string) => [{ label: 'Superadmin', href: '/superadmin/dashboard' }, { label: last }]

/* ---------- Restaurants (live tenants list) ---------- */

export function Restaurants() {
  const query = useSuperadminRestaurants()
  const rows: SuperadminBranch[] = query.data ?? []

  const columns = useMemo<ColumnDef<SuperadminBranch>[]>(() => [
    { accessorKey: 'branchName', header: 'Branch' },
    {
      id: 'restaurant',
      header: 'Restaurant',
      accessorFn: (r) => r.restaurantId?.name ?? '—',
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorFn: (r) => r.phone ?? r.restaurantId?.mobile ?? '—',
    },
    {
      id: 'city',
      header: 'City',
      accessorFn: (r) => r.pincodeId?.cityId?.name ?? '—',
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="destructive">Inactive</Badge>
        ),
    },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurants"
        description="All tenants on the platform."
        breadcrumbs={crumb('Restaurants')}
        actions={<Button><Plus className="size-4" /> New tenant</Button>}
      />
      <DataTable
        data={rows}
        columns={columns}
        loading={query.isLoading}
        searchPlaceholder="Search tenants…"
        emptyTitle="No restaurants yet"
        emptyDescription={query.isError ? 'Could not load restaurants from the backend.' : 'Tenants will appear here once onboarded.'}
      />
    </div>
  )
}

/* ---------- Users / Settings / Reports (delegates) ---------- */

export function SuperUsers() {
  const q = useSuperadminUsers()
  const rows: SuperadminUser[] = q.data ?? []
  const columns = useMemo<ColumnDef<SuperadminUser>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'mobile', header: 'Mobile', cell: ({ row }) => <span className="font-mono">{row.original.mobile ?? '—'}</span> },
      { accessorKey: 'email', header: 'Email', cell: ({ row }) => row.original.email ?? '—' },
      { accessorKey: 'role', header: 'Role', cell: ({ row }) => <Badge variant="outline">{row.original.role ?? '—'}</Badge> },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (row.original.isActive
          ? <Badge variant="success">Active</Badge>
          : <Badge variant="secondary">Disabled</Badge>),
      },
    ],
    [],
  )
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description={`Platform-wide users across all tenants · ${rows.length} live`}
        breadcrumbs={crumb('Users')}
      />
      <DataTable data={rows} columns={columns} loading={q.isLoading} searchPlaceholder="Search users…" />
    </div>
  )
}
export const SuperSettings = () => <SettingsShell title="Settings" breadcrumbs={crumb('Settings')} />
export const SuperReports = () => <ReportsShell title="Platform Reports" breadcrumbs={crumb('Reports')} />

/* ---------- Subscription plans ---------- */

export function SubscriptionPlans() {
  const query = useSuperadminPlans()
  const rows: SuperadminPlanRow[] = query.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        description="Manage public-facing subscription tiers."
        breadcrumbs={crumb('Subscription Plans')}
        actions={<Button><Plus className="size-4" /> New plan</Button>}
      />

      {query.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6 space-y-3">
              <div className="skeleton-shimmer h-5 w-1/3 rounded" />
              <div className="skeleton-shimmer h-10 w-2/3 rounded" />
              <div className="skeleton-shimmer h-3 w-full rounded" />
              <div className="skeleton-shimmer h-3 w-3/4 rounded" />
            </CardContent></Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-6" />}
          title="No plans yet"
          description={query.isError ? 'Backend did not return plans.' : 'Create your first subscription plan to onboard tenants.'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {rows.map(({ plan, active_subscribers }) => {
            const features = (plan.features ?? '').split(/[|,]/).map((s) => s.trim()).filter(Boolean)
            return (
              <Card key={plan.planId} interactive>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold">{plan.planName}</p>
                      <p className="text-3xl font-bold tabular-nums">
                        ₹{Number(plan.price ?? 0).toLocaleString('en-IN')}
                        <span className="text-sm font-normal text-muted-foreground">/{plan.durationDays}d</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{active_subscribers} active subscriber{active_subscribers === 1 ? '' : 's'}</p>
                    </div>
                    {plan.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-success" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full">Edit</Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ---------- Subscriptions ---------- */

const SUBSCRIPTION_FILTERS: Array<{ key: string; label: string; match: (s: string) => boolean }> = [
  { key: 'all',       label: 'All',        match: () => true },
  { key: 'active',    label: 'Active',     match: (s) => s === 'active' },
  { key: 'expired',   label: 'Expired',    match: (s) => s === 'expired' || s === 'past_due' || s === 'pastdue' },
  { key: 'cancelled', label: 'Cancelled',  match: (s) => s === 'cancelled' || s === 'rejected' },
  { key: 'grace',     label: 'Grace',      match: (s) => s === 'grace' },
]

export function Subscriptions() {
  const query = useSuperadminSubscriptions()
  const raw: SuperadminSubscription[] = query.data ?? []
  const [filter, setFilter] = useState('all')
  const [detail, setDetail] = useState<SuperadminSubscription | null>(null)
  const [graceOpen, setGraceOpen] = useState(false)
  const [graceDays, setGraceDays] = useState<number>(7)
  const [graceNotes, setGraceNotes] = useState('')
  const grant = useGrantSubscriptionGrace()

  const rows = useMemo(() => {
    const cfg = SUBSCRIPTION_FILTERS.find((f) => f.key === filter)!
    return raw.filter((r) => cfg.match(String(r.status ?? '').toLowerCase()))
  }, [raw, filter])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const f of SUBSCRIPTION_FILTERS) {
      c[f.key] = raw.filter((r) => f.match(String(r.status ?? '').toLowerCase())).length
    }
    return c
  }, [raw])

  const columns = useMemo<ColumnDef<SuperadminSubscription>[]>(() => [
    {
      id: 'tenant',
      header: 'Tenant',
      accessorFn: (r) => r.user?.name ?? '—',
      cell: ({ row }) => <span className="font-medium">{row.original.user?.name ?? '—'}</span>,
    },
    {
      id: 'plan',
      header: 'Plan',
      cell: ({ row }) => <Badge variant="outline">{row.original.plan?.planName ?? '—'}</Badge>,
    },
    {
      accessorKey: 'endDate',
      header: 'Renews on',
      cell: ({ row }) => row.original.endDate ?? '—',
    },
    {
      accessorKey: 'amountPaid',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="tabular-nums">₹{Number(row.original.amountPaid ?? 0).toLocaleString('en-IN')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = String(row.original.status ?? '').toLowerCase()
        if (s === 'active') return <Badge variant="success">Active</Badge>
        if (s === 'grace') return <Badge variant="warning">Grace</Badge>
        if (s === 'past_due' || s === 'pastdue' || s === 'expired') return <Badge variant="destructive">Expired</Badge>
        if (s === 'cancelled') return <Badge variant="destructive">Cancelled</Badge>
        return <Badge variant="secondary">{row.original.status ?? '—'}</Badge>
      },
    },
  ], [])

  const openGrace = () => { setGraceDays(7); setGraceNotes(''); setGraceOpen(true) }

  const submitGrace = async () => {
    if (!detail?.subscriptionId || graceDays <= 0) { toast.warning('Enter valid grace days'); return }
    const res = await grant.mutateAsync({ id: detail.subscriptionId, days: graceDays, notes: graceNotes || undefined })
    if (res.ok) {
      toast.success(`Granted ${graceDays} days grace`)
      setGraceOpen(false); setDetail(null)
    } else {
      toast.error(res.message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Active and overdue subscriptions across tenants."
        breadcrumbs={crumb('Subscriptions')}
      />

      {/* Filter pills */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-1">
            {SUBSCRIPTION_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                  filter === f.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {f.label} <span className="opacity-70 ml-1">({counts[f.key] ?? 0})</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <DataTable
        data={rows}
        columns={columns}
        loading={query.isLoading}
        searchPlaceholder="Search by tenant or plan…"
        emptyTitle="No subscriptions"
        emptyDescription={query.isError ? 'Backend returned an error.' : 'Subscriptions will appear here once tenants subscribe.'}
        onRowClick={(row) => setDetail(row)}
      />

      {/* Detail dialog */}
      <Dialog open={detail != null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.user?.name ?? 'Subscription'}</DialogTitle>
            <DialogDescription>
              #{detail?.subscriptionId} · {detail?.plan?.planName ?? '—'}
            </DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="space-y-2 text-sm max-h-[55vh] overflow-y-auto themed-scrollbar pr-1">
              <DetailRow label="Tenant"       value={detail.user?.name ?? '—'} />
              <DetailRow label="Email"        value={detail.user?.email ?? '—'} />
              <DetailRow label="Mobile"       value={detail.user?.mobile ?? '—'} />
              <DetailRow label="Plan"         value={detail.plan?.planName ?? '—'} />
              <DetailRow label="Amount Paid"  value={`₹${Number(detail.amountPaid ?? 0).toLocaleString('en-IN')}`} />
              <DetailRow label="Discount"     value={`₹${Number(detail.discountAmount ?? 0).toLocaleString('en-IN')}`} />
              <DetailRow label="Start"        value={detail.startDate ?? '—'} />
              <DetailRow label="End"          value={detail.endDate ?? '—'} />
              <DetailRow label="Grace ends"   value={detail.graceEndDate ?? '—'} />
              <DetailRow label="Status"       value={detail.status ?? '—'} />
              <DetailRow label="Coupon"       value={detail.couponCode ?? '—'} />
              <DetailRow label="Reference"    value={detail.paymentReference ?? '—'} />
              {detail.notes ? <DetailRow label="Notes" value={detail.notes} /> : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetail(null)}>Close</Button>
            <Button onClick={openGrace} disabled={detail == null}>
              <ShieldCheck className="size-4" /> Grant Grace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant grace dialog */}
      <Dialog open={graceOpen} onOpenChange={(o) => !o && setGraceOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Grace Period</DialogTitle>
            <DialogDescription>
              Extend {detail?.user?.name ?? 'this subscription'} for a defined number of days.
              This calls <code className="text-[10px]">/api/admin/subscriptions/{`{id}`}/grant-grace</code>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Grace Days <span className="text-destructive">*</span></Label>
              <input
                type="number"
                min={1}
                value={graceDays}
                onChange={(e) => setGraceDays(Number(e.target.value) || 0)}
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <textarea
                value={graceNotes}
                onChange={(e) => setGraceNotes(e.target.value)}
                placeholder="Reason for grace period…"
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGraceOpen(false)} disabled={grant.isPending}>Cancel</Button>
            <Button onClick={submitGrace} disabled={grant.isPending || graceDays <= 0}>
              {grant.isPending ? 'Granting…' : `Grant ${graceDays} days`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[110px]">{label}</span>
      <span className="text-right break-words">{value}</span>
    </div>
  )
}

/* ---------- User approvals ---------- */

const APPROVAL_TABS: Array<{ key: 'PENDING' | 'APPROVED' | 'REJECTED'; label: string }> = [
  { key: 'PENDING',  label: 'Pending'  },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
]

export function UserApprovals() {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [query, setQuery] = useState('')
  const listQ = useSuperadminUserApprovals(status)
  const update = useUpdateUserApproval()
  const raw: SuperadminUserApproval[] = listQ.data ?? []
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return raw
    return raw.filter((a) =>
      (a.name ?? '').toLowerCase().includes(q) ||
      (a.email ?? '').toLowerCase().includes(q) ||
      (a.mobile ?? '').includes(q),
    )
  }, [raw, query])

  const handle = (id: number, approvalStatus: 'APPROVED' | 'REJECTED') => {
    update.mutate(
      { id, approvalStatus },
      {
        onSuccess: (res) => {
          if (res.ok) toast.success(approvalStatus === 'APPROVED' ? 'Approved' : 'Rejected')
          else toast.error(res.message)
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Action failed'),
      }
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Approvals"
        description="Review pending signups, edit details, and approve access from one place."
        breadcrumbs={crumb('Approvals')}
      />

      {/* Toolbar — tabs + search */}
      <Card>
        <CardContent className="pt-4 pb-3 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex flex-wrap gap-1">
            {APPROVAL_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatus(t.key)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                  status === t.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-md md:ml-auto">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, email, mobile…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {listQ.isLoading ? (
        <ul className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i}><Card><CardContent className="pt-6"><div className="skeleton-shimmer h-10 rounded" /></CardContent></Card></li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<ShieldCheck className="size-6" />}
              title={query ? 'No matching users' : `No ${status.toLowerCase()} approvals`}
              description={query ? 'Try adjusting your search.' : (listQ.isError ? 'Backend returned an error.' : 'All caught up — new items will appear here.')}
            />
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((a) => (
            <li key={a.id}>
              <Card interactive>
                <CardContent className="pt-6 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{a.name ?? a.email ?? `User #${a.id}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {(a.role ?? 'User')} · {a.mobile ?? '—'}{a.createdAt ? ` · ${a.createdAt.slice(0, 10)}` : ''}
                    </p>
                  </div>
                  {status === 'PENDING' ? (
                    <>
                      <Button variant="ghost" onClick={() => handle(a.id, 'REJECTED')} disabled={update.isPending}>
                        <X className="size-4" /> Reject
                      </Button>
                      <Button onClick={() => handle(a.id, 'APPROVED')} disabled={update.isPending}>
                        <ShieldCheck className="size-4" /> Approve
                      </Button>
                    </>
                  ) : status === 'APPROVED' ? (
                    <Badge variant="success">Approved</Badge>
                  ) : (
                    <Badge variant="destructive">Rejected</Badge>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------- Notifications ---------- */

const NOTIFICATIONS_FALLBACK: SuperadminNotification[] = [
  { id: 1, title: 'Payout failed for Tandoor Bay', createdAt: '5 min ago', severity: 'warning' },
  { id: 2, title: 'New tenant Saffron Kitchen submitted KYC', createdAt: '2 hours ago', severity: 'info' },
  { id: 3, title: 'System maintenance window scheduled Sunday 03:00 IST', createdAt: '1 day ago', severity: 'secondary' },
]

export function Notifications() {
  const query = useSuperadminNotifications()
  const live = query.data ?? []
  const usingFallback = query.isError || (!query.isLoading && live.length === 0 && !query.isFetching)
  const rows: SuperadminNotification[] = usingFallback ? NOTIFICATIONS_FALLBACK : live

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Platform-wide alerts and announcements."
        breadcrumbs={crumb('Notifications')}
        actions={
          <div className="flex items-center gap-2">
            {usingFallback ? <Badge variant="warning">Sample (backend pending)</Badge> : null}
            <Button variant="outline">Mark all read</Button>
          </div>
        }
      />
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Today" value={rows.length} icon={<Bell className="size-5" />} />
        <StatCard
          label="Open alerts"
          value={rows.filter((n) => n.severity === 'warning' || n.severity === 'destructive').length}
          icon={<Bell className="size-5" />}
        />
        <StatCard label="This week" value={rows.length} icon={<Bell className="size-5" />} />
      </section>
      {query.isLoading ? (
        <ul className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i}><Card><CardContent className="pt-6"><div className="skeleton-shimmer h-10 rounded" /></CardContent></Card></li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-6" />}
          title="No notifications"
          description="Platform alerts will appear here."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((n) => (
            <li key={n.id}>
              <Card interactive>
                <CardContent className="pt-6 flex items-center gap-3">
                  <span className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Bell className="size-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.createdAt ?? ''}</p>
                  </div>
                  <Badge variant={n.severity ?? 'secondary'}>{n.severity ?? 'info'}</Badge>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
