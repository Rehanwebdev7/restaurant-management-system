import { useCallback, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Download, Plus, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useCashierOrders } from '@/api/queries/cashier'
import type { CashierOrder } from '@/api/services/cashier'

function statusBadge(s: string) {
  const v = s.toUpperCase()
  if (v === 'COMPLETED' || v === 'DELIVERED' || v === 'SERVED') return <Badge variant="success">{v}</Badge>
  if (v === 'CANCELLED') return <Badge variant="destructive">{v}</Badge>
  if (v === 'COOKING' || v === 'PREPARING') return <Badge variant="warning">{v}</Badge>
  if (v === 'READY') return <Badge variant="info">{v}</Badge>
  return <Badge variant="secondary">{v || '—'}</Badge>
}

function paymentBadge(s: string) {
  const v = s.toUpperCase()
  if (v === 'PAID') return <Badge variant="success">Paid</Badge>
  if (v === 'FAILED') return <Badge variant="destructive">Failed</Badge>
  return <Badge variant="outline">{v || 'Pending'}</Badge>
}

export default function CashierOrders() {
  const [page, setPage] = useState(1)
  const pageSize = 25
  const ordersQ = useCashierOrders({ page, pageSize })
  const data = ordersQ.data?.records ?? []
  const total = ordersQ.data?.totalRecords ?? 0
  const totalPages = ordersQ.data?.totalPages ?? 0
  const handlePullRefresh = useCallback(async () => {
    await ordersQ.refetch()
  }, [ordersQ])

  const columns = useMemo<ColumnDef<CashierOrder>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: 'Order',
        cell: ({ row }) => <span className="font-mono font-semibold">{row.original.orderNumber}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Customer',
        cell: ({ row }) =>
          row.original.customerName ??
          (row.original.tableNumber ? `Table ${row.original.tableNumber}` : <span className="text-muted-foreground">Walk-in</span>),
      },
      { accessorKey: 'orderType', header: 'Type' },
      { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
      { accessorKey: 'paymentStatus', header: 'Payment', cell: ({ row }) => paymentBadge(row.original.paymentStatus) },
      {
        accessorKey: 'totalAmount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="tabular-nums font-medium">
            ₹{Math.round(Number(row.original.totalAmount ?? 0)).toLocaleString('en-IN')}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'When',
        cell: ({ row }) => {
          try {
            return new Date(row.original.createdAt).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })
          } catch {
            return row.original.createdAt
          }
        },
      },
    ],
    []
  )

  return (
    <PullToRefresh onRefresh={handlePullRefresh} className="space-y-6">
      <PageHeader
        title="Orders"
        description={`Live from backend · ${total} total · page ${page} of ${totalPages}`}
        breadcrumbs={[{ label: 'Cashier', href: '/cashier/dashboard' }, { label: 'Orders' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => void ordersQ.refetch()}>
              <RefreshCw className={ordersQ.isFetching ? 'size-4 animate-spin' : 'size-4'} />
              Refresh
            </Button>
            <Button variant="outline"><Download className="size-4" /> Export</Button>
            <Button asChild>
              <Link to="/cashier/new-order">
                <Plus className="size-4" /> New order
              </Link>
            </Button>
          </>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        loading={ordersQ.isLoading}
        searchPlaceholder="Search order, customer, table…"
        pageSize={pageSize}
        emptyTitle="No orders for this page"
        emptyDescription="Create one to see it appear instantly (TanStack Query invalidates the cache)."
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
    </PullToRefresh>
  )
}
