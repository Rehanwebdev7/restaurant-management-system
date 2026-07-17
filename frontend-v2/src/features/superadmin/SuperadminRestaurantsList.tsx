import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Building2, Eye, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useRestaurantTree, useRestaurantDetail } from '@/api/queries/superadmin'
import RestaurantOnboardingModal from '@/features/superadmin/_shared/RestaurantOnboardingModal'
import type { RestaurantTreeNode } from '@/api/services/superadmin'

/**
 * All Restaurants page.
 * Uses /api/admin/users/tree (super-admin scoped) — replaces the older token-
 * scoped /restaurant_branch/all call that was causing "Network Error" for
 * super-admins whose token didn't own a specific admin's branches.
 */
export default function SuperadminRestaurantsList() {
  const q = useRestaurantTree()
  const [onboarding, setOnboarding] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const rows = q.data ?? []

  const columns = useMemo<ColumnDef<RestaurantTreeNode>[]>(() => [
    {
      accessorKey: 'fullName',
      header: 'Restaurant',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-8 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
            <Building2 className="size-4" />
          </div>
          <span className="font-semibold truncate">{row.original.fullName || `#${row.original.userId}`}</span>
        </div>
      ),
    },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email ?? '—'}</span>
    ) },
    { accessorKey: 'mobile', header: 'Mobile' },
    {
      id: 'counts',
      header: 'Staff',
      cell: ({ row }) => {
        const r = row.original
        const total = r.branchCount + r.kitchenCount + r.deliveryCount + r.cashierCount
        return (
          <span className="inline-flex items-center gap-1.5 text-xs">
            <Badge variant="outline">{r.branchCount} branch</Badge>
            <Badge variant="outline">{r.kitchenCount} kitchen</Badge>
            <Badge variant="outline">{r.deliveryCount} delivery</Badge>
            <span className="text-muted-foreground">· {total} total</span>
          </span>
        )
      },
    },
    {
      accessorKey: 'approvalStatus',
      header: 'Approval',
      cell: ({ row }) => {
        const s = row.original.approvalStatus
        if (s === 'APPROVED')  return <Badge variant="success">Approved</Badge>
        if (s === 'REJECTED')  return <Badge variant="destructive">Rejected</Badge>
        return <Badge variant="warning">{s ?? 'Pending'}</Badge>
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => row.original.isActive
        ? <Badge variant="success">Active</Badge>
        : <Badge variant="secondary">Inactive</Badge>,
    },
    {
      id: '__actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" aria-label="View detail" onClick={() => setDetailId(row.original.userId)}>
            <Eye className="size-4" />
          </Button>
        </div>
      ),
    },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Restaurants"
        description="Every restaurant tenant on the platform. Onboard new tenants + drill into any restaurant's staff via the User Directory."
        breadcrumbs={[{ label: 'Superadmin' }, { label: 'User Management' }, { label: 'All Restaurants' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => void q.refetch()}>
              <RefreshCw className={cn('size-4', q.isFetching && 'animate-spin')} />
              Refresh
            </Button>
            <Button onClick={() => setOnboarding(true)}>
              <Plus className="size-4" /> Add Restaurant
            </Button>
          </>
        }
      />

      <DataTable<RestaurantTreeNode>
        data={rows}
        columns={columns}
        searchKey="fullName"
        searchPlaceholder="Search by restaurant name…"
        loading={q.isLoading}
        emptyTitle="No restaurants yet"
        emptyDescription="Click Add Restaurant to onboard the first tenant."
        onRowClick={(row) => setDetailId(row.userId)}
      />

      <RestaurantOnboardingModal
        open={onboarding}
        onClose={() => setOnboarding(false)}
        onCreated={() => { void q.refetch() }}
      />

      <Dialog open={detailId != null} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-xl">
          <DetailContent id={detailId} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailContent({ id }: { id: number | null }) {
  const q = useRestaurantDetail(id)
  const d = q.data
  return (
    <>
      <DialogHeader>
        <DialogTitle>{d?.fullName || 'Restaurant'}</DialogTitle>
        <DialogDescription>{d?.role ?? '—'} · #{d?.userId ?? id}</DialogDescription>
      </DialogHeader>
      {q.isLoading ? (
        <div className="space-y-2 py-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-shimmer h-6 rounded" />)}
        </div>
      ) : !d ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Detail not available.</p>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto themed-scrollbar pr-1">
          <Row label="Email"     value={d.email ?? '—'} />
          <Row label="Mobile"    value={d.mobile ?? '—'} />
          <Row label="City"      value={d.city ?? '—'} />
          <Row label="State"     value={d.state ?? '—'} />
          <Row label="Pincode"   value={d.pincode ?? '—'} />
          <Row label="GST"       value={d.gstNumber ?? '—'} />
          <Row label="Approval"  value={d.approvalStatus ?? '—'} />
          <Row label="Status"    value={d.isActive ? 'Active' : 'Inactive'} />
          <Row label="Created"   value={d.createdAt ? new Date(d.createdAt).toLocaleString('en-IN') : '—'} />
          <div className="grid grid-cols-4 gap-2 pt-2">
            <MiniStat label="Branch"   value={d.branch.length} />
            <MiniStat label="Kitchen"  value={d.kitchen.length} />
            <MiniStat label="Delivery" value={d.delivery.length} />
            <MiniStat label="Cashier"  value={d.cashier.length} />
          </div>
        </div>
      )}
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 text-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[100px]">{label}</span>
      <span className="text-right break-words">{value}</span>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border p-2 text-center">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}
