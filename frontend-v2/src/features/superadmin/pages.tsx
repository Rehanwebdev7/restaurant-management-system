import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, ShieldCheck, X, Bell, Building2 } from 'lucide-react'
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
} from '@/api/queries/superadmin'
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

export function Subscriptions() {
  const query = useSuperadminSubscriptions()
  const rows: SuperadminSubscription[] = query.data ?? []

  const columns = useMemo<ColumnDef<SuperadminSubscription>[]>(() => [
    {
      id: 'tenant',
      header: 'Tenant',
      accessorFn: (r) => r.user?.name ?? '—',
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
        const s = row.original.status?.toLowerCase()
        if (s === 'active') return <Badge variant="success">Active</Badge>
        if (s === 'past_due' || s === 'pastdue' || s === 'grace') return <Badge variant="destructive">Past due</Badge>
        return <Badge variant="secondary">{row.original.status ?? '—'}</Badge>
      },
    },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Active and overdue subscriptions across tenants."
        breadcrumbs={crumb('Subscriptions')}
      />
      <DataTable
        data={rows}
        columns={columns}
        loading={query.isLoading}
        searchPlaceholder="Search by tenant or plan…"
        emptyTitle="No subscriptions"
        emptyDescription={query.isError ? 'Backend returned an error.' : 'Subscriptions will appear here once tenants subscribe.'}
      />
    </div>
  )
}

/* ---------- User approvals ---------- */

export function UserApprovals() {
  const query = useSuperadminUserApprovals('PENDING')
  const update = useUpdateUserApproval()
  const rows: SuperadminUserApproval[] = query.data ?? []

  const handle = (id: number, approvalStatus: 'APPROVED' | 'REJECTED') => {
    update.mutate(
      { id, approvalStatus },
      {
        onSuccess: (res) => {
          if (res.ok) {
            toast.success(approvalStatus === 'APPROVED' ? 'Approved' : 'Rejected')
          } else {
            toast.error(res.message)
          }
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Action failed'),
      }
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Approvals"
        description="Pending registrations awaiting review."
        breadcrumbs={crumb('Approvals')}
      />

      {query.isLoading ? (
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
              title="No pending approvals"
              description={query.isError ? 'Backend returned an error.' : 'All caught up — new registrations will appear here.'}
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
                  <Button
                    variant="ghost"
                    onClick={() => handle(a.id, 'REJECTED')}
                    disabled={update.isPending}
                  >
                    <X className="size-4" /> Reject
                  </Button>
                  <Button onClick={() => handle(a.id, 'APPROVED')} disabled={update.isPending}>
                    <ShieldCheck className="size-4" /> Approve
                  </Button>
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
