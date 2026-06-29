import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Bike, Download, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDeliveryOrderHistory } from '@/api/queries/delivery'
import type { DeliveryHistoryOrder } from '@/api/services/delivery'

/**
 * Delivery history — wired to `/api/delivery/orders/history`. Renders an
 * EmptyState ("No deliveries yet") when the backend returns nothing so a
 * fresh delivery account doesn't see fabricated past orders.
 */
export default function DeliveryOrderHistory() {
  const q = useDeliveryOrderHistory()
  const rows = q.data ?? []

  const columns = useMemo<ColumnDef<DeliveryHistoryOrder>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: 'Order',
        cell: ({ row }) => (
          <span className="font-mono font-semibold">{row.original.orderNumber ?? `#${row.original.id}`}</span>
        ),
      },
      { accessorKey: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer ?? '—' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const s = (row.original as { status?: string }).status ?? ''
          const upper = s.toUpperCase()
          if (upper === 'DELIVERED' || upper === 'COMPLETED') return <Badge variant="success">Delivered</Badge>
          if (upper === 'CANCELLED' || upper === 'FAILED') return <Badge variant="destructive">Cancelled</Badge>
          return <Badge variant="secondary">{s || '—'}</Badge>
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="tabular-nums font-medium">
            ₹{Number(row.original.amount ?? 0).toLocaleString('en-IN')}
          </span>
        ),
      },
      {
        accessorKey: 'earning',
        header: 'Earning',
        cell: ({ row }) => {
          const e = Number((row.original as { earning?: number }).earning ?? 0)
          return (
            <span className="tabular-nums font-semibold text-success">
              +₹{e.toLocaleString('en-IN')}
            </span>
          )
        },
      },
      {
        accessorKey: 'when',
        header: 'Time',
        cell: ({ row }) => (row.original as { when?: string }).when ?? '—',
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery History"
        description={`Every order you've delivered · ${rows.length} entries`}
        breadcrumbs={[{ label: 'Delivery', href: '/delivery/dashboard' }, { label: 'History' }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void q.refetch()}>
              <RefreshCw className={q.isFetching ? 'size-4 animate-spin' : 'size-4'} />
            </Button>
            <Button variant="outline" disabled={rows.length === 0}>
              <Download className="size-4" /> Export
            </Button>
          </>
        }
      />

      <DataTable
        data={rows}
        columns={columns}
        loading={q.isLoading}
        searchKey="orderNumber"
        searchPlaceholder="Search by order or customer…"
        emptyTitle="No deliveries yet"
        emptyDescription="Orders you complete will show up here with earnings, customer, and timestamps."
        emptyAction={
          <Button variant="outline" asChild>
            <a href="/delivery/active"><Bike className="size-4" /> View active</a>
          </Button>
        }
      />
    </div>
  )
}
