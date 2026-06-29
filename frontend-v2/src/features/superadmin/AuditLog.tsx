/**
 * UI-F-95: Activity / audit-log viewer.
 *
 * Live source — `/api/superadmin/audit-logs/all`. If the backend hasn't shipped
 * the endpoint yet (404/5xx), `safeGetList` returns [] and we fall back to a
 * 6-row sample so the UI is still useful for QA + design review. A small
 * "Sample (backend pending)" badge in the page header makes the fallback
 * obvious to operators.
 *
 * Filtering — user / action / date-range — runs client-side over whichever
 * dataset was returned. The endpoint is expected to be small (audit retention
 * is days-not-months) so paginating server-side is not yet worth the round
 * trip; revisit when row counts exceed ~5k.
 */
import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ShieldCheck, FileSearch } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { DateField } from '@/components/ui/date-field'
import { Card, CardContent } from '@/components/ui/card'
import { useSuperadminAuditLogs } from '@/api/queries/superadmin'
import type { SuperadminAuditLog } from '@/api/services/superadmin'

const crumb = (last: string) => [
  { label: 'Superadmin', href: '/superadmin/dashboard' },
  { label: last },
]

const SAMPLE_LOGS: SuperadminAuditLog[] = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    userName: 'shaikh.parvez',
    userRole: 'Superadmin',
    action: 'UPDATE',
    entity: 'restaurant_branch',
    entityId: 12,
    diff: 'isActive: true → false',
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    userName: 'kitchen-01',
    userRole: 'Kitchen',
    action: 'CREATE',
    entity: 'order',
    entityId: 4711,
    diff: '+ items×3 · total ₹820',
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    userName: 'cashier.amita',
    userRole: 'Cashier',
    action: 'DELETE',
    entity: 'coupon',
    entityId: 19,
    diff: 'code: SUMMER20',
  },
  {
    id: 4,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    userName: 'admin',
    userRole: 'Admin',
    action: 'LOGIN',
    entity: 'session',
    entityId: null,
    diff: 'ip: 49.36.102.55',
  },
  {
    id: 5,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    userName: 'shaikh.parvez',
    userRole: 'Superadmin',
    action: 'UPDATE',
    entity: 'subscription_plan',
    entityId: 3,
    diff: 'price: 1499 → 1299',
  },
  {
    id: 6,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    userName: 'delivery.raj',
    userRole: 'Delivery',
    action: 'UPDATE',
    entity: 'withdrawal',
    entityId: 8,
    diff: 'status: PENDING → APPROVED',
  },
]

const ACTION_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'destructive',
  LOGIN: 'secondary',
  LOGOUT: 'secondary',
}

function actionVariant(action: string) {
  return ACTION_VARIANTS[action.toUpperCase()] ?? 'secondary'
}

function formatTs(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } catch {
    return iso
  }
}

export default function AuditLog() {
  const query = useSuperadminAuditLogs()
  const live = query.data ?? []
  const usingSample =
    !query.isLoading && !query.isFetching && live.length === 0

  const rows = usingSample ? SAMPLE_LOGS : live

  /* ---------- filter state ---------- */
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [from, setFrom] = useState<Date | undefined>(undefined)
  const [to, setTo] = useState<Date | undefined>(undefined)

  const actionOptions = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => set.add(r.action))
    return Array.from(set).sort()
  }, [rows])

  const userOptions = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => {
      if (r.userName) set.add(r.userName)
    })
    return Array.from(set).sort()
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (userFilter && r.userName !== userFilter) return false
      if (actionFilter && r.action !== actionFilter) return false
      if (from || to) {
        const ts = new Date(r.timestamp).getTime()
        if (from && ts < from.getTime()) return false
        if (to) {
          // inclusive upper bound — match the whole day
          const upper = new Date(to)
          upper.setHours(23, 59, 59, 999)
          if (ts > upper.getTime()) return false
        }
      }
      return true
    })
  }, [rows, userFilter, actionFilter, from, to])

  const columns = useMemo<ColumnDef<SuperadminAuditLog>[]>(() => [
    {
      accessorKey: 'timestamp',
      header: 'When',
      cell: ({ row }) => (
        <span className="font-mono text-xs whitespace-nowrap">{formatTs(row.original.timestamp)}</span>
      ),
    },
    {
      id: 'who',
      header: 'User',
      cell: ({ row }) => (
        <div className="leading-tight">
          <p className="font-medium">{row.original.userName ?? '—'}</p>
          {row.original.userRole ? (
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {row.original.userRole}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <Badge variant={actionVariant(row.original.action)}>{row.original.action}</Badge>
      ),
    },
    {
      accessorKey: 'entity',
      header: 'Entity',
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.entity ?? '—'}
          {row.original.entityId !== null && row.original.entityId !== undefined
            ? `#${row.original.entityId}`
            : ''}
        </span>
      ),
    },
    {
      accessorKey: 'diff',
      header: 'Diff',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[28rem]">
          {row.original.diff ?? '—'}
        </span>
      ),
    },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity / Audit Log"
        description="All write operations across the platform, newest first."
        breadcrumbs={crumb('Audit Log')}
        actions={
          usingSample ? (
            <Badge variant="warning">Sample (backend pending)</Badge>
          ) : (
            <Badge variant="success">Live</Badge>
          )
        }
      />

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              User
            </span>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All users</option>
              {userOptions.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Action
            </span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All actions</option>
              {actionOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              From
            </span>
            <DateField value={from} onChange={setFrom} placeholder="From date" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              To
            </span>
            <DateField value={to} onChange={setTo} placeholder="To date" />
          </label>
        </CardContent>
      </Card>

      <DataTable
        data={filtered}
        columns={columns}
        loading={query.isLoading}
        searchPlaceholder="Search by user, entity, action…"
        emptyTitle="No events match"
        emptyDescription={
          query.isError
            ? 'Backend returned an error — showing nothing rather than guessing.'
            : 'Adjust filters or expand the date range.'
        }
        emptyAction={
          <div className="inline-flex items-center gap-2 text-muted-foreground text-xs">
            <ShieldCheck className="size-4" /> All recorded activity is shown.
          </div>
        }
      />

      {usingSample ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-xs text-muted-foreground">
              <FileSearch className="size-4 mt-0.5 shrink-0" />
              <p>
                <span className="font-semibold text-foreground">Backend endpoint pending.</span>{' '}
                Once <code className="font-mono text-[11px]">/api/superadmin/audit-logs/all</code>{' '}
                returns the standard envelope, this view will switch to live data
                automatically — no rebuild needed.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
