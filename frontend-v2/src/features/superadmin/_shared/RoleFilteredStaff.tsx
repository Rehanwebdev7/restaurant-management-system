import { useMemo, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useSuperadminUsers } from '@/api/queries/superadmin'
import { cn } from '@/lib/utils'
import type { SuperadminUser } from '@/api/services/superadmin'
import type { ColumnDef } from '@tanstack/react-table'

/**
 * Shared page for Kitchen / Delivery / Cashier staff lists.
 * Client-side filters the platform-wide user list by role (backend supports
 * ?role= filter but this reuses the already-loaded useSuperadminUsers() cache
 * so switching sidebar entries is instant, no network refetch).
 */
interface Props {
  title: string
  role: string
  description?: string
  breadcrumbTrail?: Array<{ label: string; href?: string }>
}

export default function RoleFilteredStaff({ title, role, description, breadcrumbTrail }: Props) {
  const q = useSuperadminUsers()
  const [detail, setDetail] = useState<SuperadminUser | null>(null)

  const rows = useMemo(
    () => (q.data ?? []).filter((u) => String(u.role ?? '').toLowerCase() === role.toLowerCase()),
    [q.data, role],
  )

  const columns: ColumnDef<SuperadminUser>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ getValue }) => <span className="font-medium">{String(getValue() ?? '—')}</span> },
    { accessorKey: 'mobile', header: 'Mobile' },
    { accessorKey: 'email', header: 'Email', cell: ({ getValue }) => (
      <span className="text-muted-foreground">{String(getValue() ?? '—')}</span>
    ) },
    { id: 'branchOrParent', header: 'Branch / Owner', cell: ({ row }) => (
      <span className="text-xs">
        {row.original.branchId?.name ?? row.original.parentId?.name ?? '—'}
      </span>
    ) },
    { accessorKey: 'isActive', header: 'Status', cell: ({ getValue }) => (
      Boolean(getValue()) ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>
    ) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description ?? `All ${role.toLowerCase()} staff across every restaurant.`}
        breadcrumbs={breadcrumbTrail ?? [{ label: 'Superadmin' }, { label: 'User Management' }, { label: title }]}
        actions={
          <Button variant="outline" onClick={() => void q.refetch()}>
            <RefreshCw className={cn('size-4', q.isFetching && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      {rows.length === 0 && !q.isLoading ? (
        <Card className="p-6">
          <EmptyState
            icon={<Search className="size-8" />}
            title={`No ${role.toLowerCase()} staff yet`}
            description="They will appear here once restaurants onboard staff for this role."
          />
        </Card>
      ) : (
        <DataTable<SuperadminUser>
          data={rows}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search by name…"
          loading={q.isLoading}
          onRowClick={(row) => setDetail(row)}
        />
      )}

      <Dialog open={detail != null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.name ?? 'Staff'}</DialogTitle>
            <DialogDescription>{detail?.role ?? '—'} · #{detail?.id}</DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="space-y-2 text-sm">
              <Row label="Mobile"       value={detail.mobile ?? '—'} />
              <Row label="Email"        value={detail.email ?? '—'} />
              <Row label="Branch"       value={detail.branchId?.name ?? '—'} />
              <Row label="Restaurant"   value={detail.parentId?.name ?? '—'} />
              <Row label="Status"       value={detail.isActive ? 'Active' : 'Inactive'} />
              <Row label="Approval"     value={detail.approvalStatus ?? '—'} />
              <Row label="Created"      value={detail.createdAt ? new Date(detail.createdAt).toLocaleString('en-IN') : '—'} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-right break-words">{value}</span>
    </div>
  )
}
