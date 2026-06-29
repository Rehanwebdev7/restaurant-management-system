import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Download, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useKitchenHistory } from '@/api/queries/kitchen'
import type { KitchenOrder } from '@/api/services/kitchen'

function statusBadge(s: string) {
  const v = s.toUpperCase()
  if (v.includes('COMPLETE') || v === 'DELIVERED' || v === 'SERVED') return <Badge variant="success">{v}</Badge>
  if (v === 'CANCELLED') return <Badge variant="destructive">{v}</Badge>
  if (v.includes('COOK') || v.includes('PREPAR')) return <Badge variant="warning">{v}</Badge>
  if (v.includes('READY')) return <Badge variant="info">{v}</Badge>
  return <Badge variant="secondary">{v || '—'}</Badge>
}

export default function KitchenOrderHistory() {
  const [page, setPage] = useState(1)
  const pageSize = 25
  const historyQ = useKitchenHistory({ page, pageSize })
  const data = historyQ.data?.records ?? []
  const total = historyQ.data?.totalRecords ?? 0
  const totalPages = historyQ.data?.totalPages ?? 0

  const columns = useMemo<ColumnDef<KitchenOrder>[]>(
    () => [
      {
        accessorKey: 'orderNumber', header: 'Order',
        cell: ({ row }) => <span className="font-mono font-semibold">{row.original.orderNumber}</span>,
      },
      {
        accessorKey: 'customerName', header: 'Customer',
        cell: ({ row }) => row.original.customerName ?? (row.original.tableNumber ? `Table ${row.original.tableNumber}` : <span className="text-muted-foreground">Walk-in</span>),
      },
      { accessorKey: 'orderType', header: 'Type' },
      { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
      {
        accessorKey: 'totalAmount', header: 'Amount',
        cell: ({ row }) => <span className="tabular-nums font-medium">₹{Math.round(Number(row.original.totalAmount ?? 0)).toLocaleString('en-IN')}</span>,
      },
      {
        accessorKey: 'createdAt', header: 'When',
        cell: ({ row }) => {
          try {
            return new Date(row.original.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
          } catch { return row.original.createdAt }
        },
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order History"
        description={`Live · ${total} orders · page ${page} of ${totalPages || 1}`}
        breadcrumbs={[{ label: 'Kitchen', href: '/kitchen/dashboard' }, { label: 'Order History' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => void historyQ.refetch()}>
              <RefreshCw className={historyQ.isFetching ? 'size-4 animate-spin' : 'size-4'} />
              Refresh
            </Button>
            <Button variant="outline"><Download className="size-4" /> Export</Button>
          </>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        loading={historyQ.isLoading}
        searchPlaceholder="Search order or customer…"
        pageSize={pageSize}
        emptyTitle="No orders for this page"
      />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Server-side page <span className="font-mono">{page}</span> of <span className="font-mono">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
