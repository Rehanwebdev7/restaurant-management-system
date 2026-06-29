import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Download, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/**
 * Reusable Orders list shell — same shape used by Branch / Admin / Restaurant / Superadmin.
 * Pass a `title`, `breadcrumbs`, and optional `data` to render.
 */
interface OrderRow {
  id: number
  orderNumber: string
  customer: string
  type: string
  status: 'Completed' | 'Cancelled' | 'Pending' | 'Cooking' | 'Ready'
  amount: number
  when: string
}

const SAMPLE: OrderRow[] = [
  { id: 1, orderNumber: 'KOT-1041', customer: 'Walk-in T-02', type: 'Dine-in', status: 'Completed', amount: 645, when: '03:12 PM' },
  { id: 2, orderNumber: 'KOT-1040', customer: 'Rohan Mehta', type: 'Delivery', status: 'Completed', amount: 320, when: '03:01 PM' },
  { id: 3, orderNumber: 'KOT-1039', customer: 'Priya Sharma', type: 'Takeaway', status: 'Cancelled', amount: 0, when: '02:50 PM' },
  { id: 4, orderNumber: 'KOT-1038', customer: 'Walk-in T-07', type: 'Dine-in', status: 'Completed', amount: 1280, when: '02:35 PM' },
  { id: 5, orderNumber: 'KOT-1037', customer: 'Vikram S.', type: 'Delivery', status: 'Cooking', amount: 480, when: '02:18 PM' },
  { id: 6, orderNumber: 'KOT-1036', customer: 'Sneha P.', type: 'Dine-in', status: 'Ready', amount: 215, when: '01:52 PM' },
]

function statusBadge(s: OrderRow['status']) {
  if (s === 'Completed') return <Badge variant="success">{s}</Badge>
  if (s === 'Cancelled') return <Badge variant="destructive">{s}</Badge>
  if (s === 'Cooking') return <Badge variant="warning">{s}</Badge>
  if (s === 'Ready') return <Badge variant="info">{s}</Badge>
  return <Badge variant="secondary">{s}</Badge>
}

interface OrdersListProps {
  title: string
  description?: string
  breadcrumbs?: { label: string; href?: string }[]
  data?: OrderRow[]
}

export function OrdersList({ title, description, breadcrumbs, data = SAMPLE }: OrdersListProps) {
  const columns = useMemo<ColumnDef<OrderRow>[]>(
    () => [
      { accessorKey: 'orderNumber', header: 'Order', cell: ({ row }) => <span className="font-mono font-semibold">{row.original.orderNumber}</span> },
      { accessorKey: 'customer', header: 'Customer' },
      { accessorKey: 'type', header: 'Type' },
      { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
      { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="tabular-nums font-medium">₹{row.original.amount.toLocaleString('en-IN')}</span> },
      { accessorKey: 'when', header: 'Time' },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description ?? 'Searchable, filterable, exportable.'}
        breadcrumbs={breadcrumbs}
        actions={
          <>
            <Button variant="outline"><Download className="size-4" /> Export</Button>
            <Button><Plus className="size-4" /> New order</Button>
          </>
        }
      />
      <DataTable data={data} columns={columns} searchPlaceholder="Search by order or customer…" />
    </div>
  )
}
