import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { IndianRupee, Receipt, BadgeCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from '@/lib/toast'

interface OutstandingRow {
  id: number
  customer: string
  mobile: string
  orderNumber: string
  amount: number
  daysOverdue: number
}

const SAMPLE: OutstandingRow[] = [
  { id: 1, customer: 'Spice Garden — Andheri', mobile: '9988001122', orderNumber: 'INV-2034', amount: 4280, daysOverdue: 12 },
  { id: 2, customer: 'Walk-in T-04', mobile: '—', orderNumber: 'KOT-1028', amount: 620, daysOverdue: 3 },
  { id: 3, customer: 'Ananya Verma', mobile: '9988776655', orderNumber: 'INV-2031', amount: 1280, daysOverdue: 6 },
]

export default function Outstanding() {
  const [pending, setPending] = useState<OutstandingRow | null>(null)
  const [rows, setRows] = useState(SAMPLE)

  const columns = useMemo<ColumnDef<OutstandingRow>[]>(
    () => [
      { accessorKey: 'orderNumber', header: 'Invoice', cell: ({ row }) => (
        <span className="font-mono font-semibold">{row.original.orderNumber}</span>
      ) },
      { accessorKey: 'customer', header: 'Customer' },
      { accessorKey: 'mobile', header: 'Mobile' },
      {
        accessorKey: 'daysOverdue',
        header: 'Overdue',
        cell: ({ row }) => {
          const d = row.original.daysOverdue
          if (d >= 10) return <Badge variant="destructive">{d} days</Badge>
          if (d >= 5) return <Badge variant="warning">{d} days</Badge>
          return <Badge variant="secondary">{d} days</Badge>
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="tabular-nums font-semibold">₹{row.original.amount.toLocaleString('en-IN')}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button size="sm" onClick={() => setPending(row.original)}>
            <BadgeCheck className="size-4" /> Settle
          </Button>
        ),
      },
    ],
    []
  )

  const settle = (row: OutstandingRow) => {
    setRows((prev) => prev.filter((r) => r.id !== row.id))
    toast.success(`Settled ${row.orderNumber} · ₹${row.amount.toLocaleString('en-IN')}`)
  }

  const totalOutstanding = rows.reduce((acc, r) => acc + r.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outstanding"
        description="Invoices and orders awaiting settlement."
        breadcrumbs={[{ label: 'Cashier', href: '/cashier/dashboard' }, { label: 'Outstanding' }]}
        actions={
          <Button variant="outline">
            <Receipt className="size-4" /> Generate report
          </Button>
        }
      />

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Total outstanding</p>
        <p className="text-3xl font-bold tabular-nums mt-1">
          <IndianRupee className="size-6 inline -mt-1" />
          {totalOutstanding.toLocaleString('en-IN')}
        </p>
      </div>

      <DataTable data={rows} columns={columns} searchPlaceholder="Search invoice or customer…" />

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title={`Settle ${pending?.orderNumber ?? ''}?`}
        description={`This marks ₹${pending?.amount.toLocaleString('en-IN')} as paid. You can attach the payment slip later.`}
        confirmLabel="Mark as paid"
        onConfirm={() => { if (pending) settle(pending) }}
      />
    </div>
  )
}
