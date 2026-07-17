import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, GitBranch, Pencil, Trash2, Eye, RefreshCw, MapPin, Clock, User } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { restaurantBranchCrud } from '@/api/queries/superadmin'
import BranchAddModal from '@/features/superadmin/_shared/BranchAddModal'
import type { AdminEntity } from '@/api/services/superadmin'

/**
 * Branches page — matches reference:
 *   Search + status filter + Add Branch button
 *   Table with Actions (View/Location/Hours/Edit/Delete) + ID + Name + Mobile + Email + Restaurant + Status + Created At
 */
type StatusFilter = 'all' | 'active' | 'inactive'

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all',      label: 'All Status' },
  { key: 'active',   label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
]

export default function SuperadminBranches() {
  const listQ = restaurantBranchCrud.useList()
  const deleteM = restaurantBranchCrud.useDelete()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState<AdminEntity | null>(null)
  const [detailRow, setDetailRow] = useState<AdminEntity | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminEntity | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const rows = useMemo(() => {
    const all = listQ.data ?? []
    if (statusFilter === 'all') return all
    return all.filter((r) => {
      const isActive = r.isActive === true || r.isActive === 1 || r.isActive === '1'
      return statusFilter === 'active' ? isActive : !isActive
    })
  }, [listQ.data, statusFilter])

  const columns = useMemo<ColumnDef<AdminEntity>[]>(() => [
    {
      id: '__actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" title="View users" onClick={() => setDetailRow(row.original)}>
            <User className="size-4 text-info" />
          </Button>
          <Button variant="ghost" size="icon" title="Location" onClick={() => setDetailRow(row.original)}>
            <MapPin className="size-4 text-success" />
          </Button>
          <Button variant="ghost" size="icon" title="Hours" onClick={() => setDetailRow(row.original)}>
            <Clock className="size-4 text-warning" />
          </Button>
          <Button variant="ghost" size="icon" title="Edit" onClick={() => setEditRow(row.original)}>
            <Pencil className="size-4 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" title="Delete" className="hover:text-destructive" onClick={() => setDeleteTarget(row.original)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
    { accessorKey: 'id', header: 'ID', cell: ({ getValue }) => <span className="tabular-nums font-semibold">{String(getValue() ?? '—')}</span> },
    { accessorKey: 'branchName', header: 'Name', cell: ({ getValue }) => <span className="font-semibold">{String(getValue() ?? '—')}</span> },
    { accessorKey: 'phone', header: 'Mobile', cell: ({ getValue }) => <span className="font-mono text-sm">{String(getValue() ?? '—')}</span> },
    { accessorKey: 'email', header: 'Email', cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue() ?? 'N/A')}</span> },
    {
      id: 'restaurant',
      header: 'Restaurant',
      cell: ({ row }) => {
        const r = row.original as AdminEntity & { restaurantId?: { name?: string } | number }
        const name = typeof r.restaurantId === 'object' ? r.restaurantId?.name : undefined
        return <span className="font-medium">{name ?? String(r.restaurantId ?? '—')}</span>
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => {
        const v = getValue()
        const on = v === true || v === 1 || v === '1'
        return on ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ getValue }) => {
        const v = getValue()
        if (!v) return '—'
        try { return <span className="text-xs">{new Date(String(v)).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span> }
        catch { return String(v) }
      },
    },
  ], [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    const id = Number(deleteTarget.id ?? 0)
    if (!id) { toast.error('Missing id'); return }
    const res = await deleteM.mutateAsync(id)
    if (res.ok) { toast.success('Branch deleted'); setDeleteTarget(null) }
    else toast.error(res.message)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="All branches across every restaurant on the platform."
        breadcrumbs={[{ label: 'Superadmin' }, { label: 'User Management' }, { label: 'Branches' }]}
        titleAdornment={<GitBranch className="size-6 text-primary" />}
        actions={
          <>
            <Button variant="outline" onClick={() => void listQ.refetch()}>
              <RefreshCw className={cn('size-4', listQ.isFetching && 'animate-spin')} />
              Refresh
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" /> Add Branch
            </Button>
          </>
        }
      />

      {/* Status pills */}
      <div className="flex flex-wrap gap-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setStatusFilter(t.key)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
              statusFilter === t.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-border',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable<AdminEntity>
        data={rows}
        columns={columns}
        searchKey="branchName"
        searchPlaceholder="Search branches…"
        loading={listQ.isLoading}
        emptyTitle="No branches yet"
        emptyDescription="Click Add Branch to create the first one."
      />

      {/* Add / Edit modal */}
      <BranchAddModal
        open={addOpen || editRow != null}
        onClose={() => { setAddOpen(false); setEditRow(null) }}
        initial={editRow}
        onSaved={() => { void listQ.refetch() }}
      />

      {/* Detail modal */}
      <Dialog open={detailRow != null} onOpenChange={(o) => !o && setDetailRow(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{String(detailRow?.branchName ?? 'Branch')}</DialogTitle>
            <DialogDescription>#{String(detailRow?.id ?? '—')}</DialogDescription>
          </DialogHeader>
          {detailRow ? (
            <div className="space-y-2 text-sm max-h-[55vh] overflow-y-auto themed-scrollbar pr-1">
              <Row label="Restaurant" value={String((detailRow as AdminEntity & { restaurantId?: { name?: string } }).restaurantId?.name ?? '—')} />
              <Row label="Phone"       value={String(detailRow.phone ?? '—')} />
              <Row label="Email"       value={String(detailRow.email ?? '—')} />
              <Row label="Address"     value={String(detailRow.addressLine1 ?? detailRow.address ?? '—')} />
              <Row label="City"        value={String(detailRow.city ?? '—')} />
              <Row label="State"       value={String(detailRow.state ?? '—')} />
              <Row label="Pincode"     value={String(detailRow.pincode ?? '—')} />
              <Row label="Hours"       value={`${detailRow.openTime ?? '—'} – ${detailRow.closeTime ?? '—'}`} />
              <Row label="Lat/Lng"     value={
                detailRow.latitude != null && detailRow.longitude != null
                  ? `${detailRow.latitude}, ${detailRow.longitude}`
                  : '—'
              } />
              <Row label="Status"      value={detailRow.isActive ? 'Active' : 'Inactive'} />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetailRow(null)}>Close</Button>
            <Button onClick={() => { setEditRow(detailRow); setDetailRow(null) }}>
              <Pencil className="size-4" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Branch?</DialogTitle>
            <DialogDescription>
              This permanently removes <span className="font-semibold">{String(deleteTarget?.branchName ?? '')}</span>.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleteM.isPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteM.isPending}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <span className="hidden"><Eye className="size-4" /></span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[100px]">{label}</span>
      <span className="text-right break-words">{value}</span>
    </div>
  )
}
