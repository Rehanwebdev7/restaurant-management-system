import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { RefreshCw, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ordersCrud } from '@/api/queries/superadmin'
import { cn } from '@/lib/utils'
import type { AdminEntity } from '@/api/services/superadmin'
import type { ColumnDef } from '@tanstack/react-table'

/**
 * Single Orders page mounted at 5 URLs:
 *   /superadmin/orders/all
 *   /superadmin/orders/new
 *   /superadmin/orders/preparing
 *   /superadmin/orders/delivered
 *   /superadmin/orders/cancelled
 *
 * The route param `:filter` drives a client-side status filter over one
 * fetched list. Also exposes tabs at the top for switching without touching
 * the sidebar.
 */

type FilterKey = 'all' | 'new' | 'preparing' | 'delivered' | 'cancelled'

const TABS: { key: FilterKey; label: string; matches: (status: string) => boolean }[] = [
  { key: 'all',        label: 'All Orders',  matches: () => true },
  { key: 'new',        label: 'New',         matches: (s) => ['NEW', 'PENDING', 'PLACED'].includes(s) },
  { key: 'preparing',  label: 'Preparing',   matches: (s) => ['PREPARING', 'ACCEPTED', 'CONFIRMED', 'IN_KITCHEN'].includes(s) },
  { key: 'delivered',  label: 'Delivered',   matches: (s) => ['DELIVERED', 'COMPLETED'].includes(s) },
  { key: 'cancelled',  label: 'Cancelled',   matches: (s) => ['CANCELLED', 'REJECTED', 'FAILED'].includes(s) },
]

function statusVariant(status: string): 'success' | 'warning' | 'destructive' | 'info' | 'secondary' {
  const s = status.toUpperCase()
  if (['DELIVERED', 'COMPLETED'].includes(s)) return 'success'
  if (['PREPARING', 'ACCEPTED', 'CONFIRMED', 'IN_KITCHEN'].includes(s)) return 'info'
  if (['CANCELLED', 'REJECTED', 'FAILED'].includes(s)) return 'destructive'
  if (['NEW', 'PENDING', 'PLACED'].includes(s)) return 'warning'
  return 'secondary'
}

export default function SuperadminOrders() {
  const params = useParams()
  const navigate = useNavigate()
  const active = ((params.filter ?? 'all') as FilterKey)
  const activeTab = TABS.find((t) => t.key === active) ?? TABS[0]!

  const q = ordersCrud.useList()
  const [detail, setDetail] = useState<AdminEntity | null>(null)

  const rows = useMemo(() => {
    const all = q.data ?? []
    return all.filter((o) => activeTab.matches(String(o.status ?? '').toUpperCase()))
  }, [q.data, activeTab])

  const tabCounts = useMemo(() => {
    const all = q.data ?? []
    return TABS.map((t) => ({
      key: t.key,
      label: t.label,
      count: all.filter((o) => t.matches(String(o.status ?? '').toUpperCase())).length,
    }))
  }, [q.data])

  const columns: ColumnDef<AdminEntity>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Order #',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-sm">
          #{String(row.original.orderNumber ?? row.original.id ?? '?')}
        </span>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <span className="text-sm">
          {String((row.original as { customerName?: string }).customerName ?? (row.original as { customer?: { name?: string } }).customer?.name ?? '—')}
        </span>
      ),
    },
    {
      id: 'branch',
      header: 'Branch',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {String((row.original as { branchName?: string }).branchName ?? (row.original as { branchId?: { name?: string } }).branchId?.name ?? '—')}
        </span>
      ),
    },
    {
      accessorKey: 'orderType',
      header: 'Type',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="uppercase text-[10px]">
          {String(getValue() ?? '—')}
        </Badge>
      ),
    },
    {
      accessorKey: 'itemCount',
      header: 'Items',
      cell: ({ getValue }) => <span className="tabular-nums">{String(getValue() ?? '—')}</span>,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ getValue }) => (
        <span className="font-semibold tabular-nums">
          ₹{Number(getValue() ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = String(getValue() ?? '—')
        return <Badge variant={statusVariant(s)}>{s}</Badge>
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Placed',
      cell: ({ getValue }) => {
        const v = getValue()
        if (!v) return '—'
        try { return <span className="text-xs text-muted-foreground">{new Date(String(v)).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span> }
        catch { return String(v) }
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Platform-wide orders across every restaurant + branch."
        breadcrumbs={[{ label: 'Superadmin' }, { label: 'Orders' }, { label: activeTab.label }]}
        actions={
          <Button variant="outline" onClick={() => void q.refetch()}>
            <RefreshCw className={cn('size-4', q.isFetching && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      {/* Tabs */}
      <Card className="p-2">
        <div className="flex flex-wrap gap-1">
          {tabCounts.map((t) => (
            <button
              key={t.key}
              onClick={() => navigate(`/superadmin/orders/${t.key}`)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                active === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {t.label} <span className="opacity-70 ml-1">({t.count})</span>
            </button>
          ))}
        </div>
      </Card>

      <DataTable<AdminEntity>
        data={rows}
        columns={columns}
        searchKey="orderNumber"
        searchPlaceholder="Search order number…"
        loading={q.isLoading}
        emptyTitle={`No ${activeTab.label.toLowerCase()}`}
        onRowClick={(row) => setDetail(row)}
      />

      {/* Detail modal */}
      <Dialog open={detail != null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Order #{String(detail?.orderNumber ?? detail?.id ?? '?')}
            </DialogTitle>
            <DialogDescription>
              {detail?.status ? <Badge variant={statusVariant(String(detail.status))}>{String(detail.status)}</Badge> : null}
              {detail?.orderType ? <> · {String(detail.orderType)}</> : null}
            </DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto themed-scrollbar pr-1">
              <Row label="Customer"    value={String((detail as { customerName?: string }).customerName ?? '—')} />
              <Row label="Mobile"      value={String((detail as { customerMobile?: string }).customerMobile ?? '—')} />
              <Row label="Branch"      value={String((detail as { branchName?: string }).branchName ?? (detail as { branchId?: { name?: string } }).branchId?.name ?? '—')} />
              <Row label="Type"        value={String(detail.orderType ?? '—')} />
              <Row label="Items"       value={String(detail.itemCount ?? '—')} />
              <Row label="Subtotal"    value={`₹${Number(detail.subtotal ?? 0).toLocaleString('en-IN')}`} />
              <Row label="Tax"         value={`₹${Number(detail.taxAmount ?? 0).toLocaleString('en-IN')}`} />
              <Row label="Delivery"    value={`₹${Number(detail.deliveryCharge ?? 0).toLocaleString('en-IN')}`} />
              <Row label="Discount"    value={`-₹${Number(detail.discountAmount ?? 0).toLocaleString('en-IN')}`} />
              <Row label="Total"       value={`₹${Number(detail.totalAmount ?? 0).toLocaleString('en-IN')}`} />
              <Row label="Payment"     value={String(detail.paymentMethod ?? '—')} />
              <Row label="Placed"      value={detail.createdAt ? new Date(String(detail.createdAt)).toLocaleString('en-IN') : '—'} />
              {detail.notes ? <Row label="Notes" value={String(detail.notes)} /> : null}
            </div>
          ) : null}
          <div className="flex justify-end pt-3 border-t border-border">
            <Link
              to={`/superadmin/orders/all`}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              All orders <ChevronRight className="size-3" />
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
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
