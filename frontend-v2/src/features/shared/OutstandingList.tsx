import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { IndianRupee, Receipt, BadgeCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from '@/lib/toast'

interface Row { id: number; orderNumber: string; customer: string; mobile: string; amount: number; daysOverdue: number }

const SAMPLE: Row[] = [
  { id: 1, orderNumber: 'INV-2034', customer: 'Spice Garden — Andheri', mobile: '9988001122', amount: 4280, daysOverdue: 12 },
  { id: 2, orderNumber: 'KOT-1028', customer: 'Walk-in T-04', mobile: '—', amount: 620, daysOverdue: 3 },
  { id: 3, orderNumber: 'INV-2031', customer: 'Ananya Verma', mobile: '9988776655', amount: 1280, daysOverdue: 6 },
]

interface Props {
  title: string
  breadcrumbs?: { label: string; href?: string }[]
  /** External data (e.g. from `useRestaurantOutstanding`). If omitted the local SAMPLE is used. */
  data?: Row[]
  loading?: boolean
  /** True when `data` is a sample fallback (backend route not live yet). */
  sample?: boolean
}

export function OutstandingList({ title, breadcrumbs, data, loading, sample }: Props) {
  const [rows, setRows] = useState<Row[]>(data ?? SAMPLE)
  // When external data arrives, sync into local state so the "settle" mutation
  // still works as an optimistic remove from the visible list.
  useEffect(() => {
    if (data) setRows(data)
  }, [data])
  const [pending, setPending] = useState<Row | null>(null)
  const total = rows.reduce((a, r) => a + r.amount, 0)

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { accessorKey: 'orderNumber', header: 'Invoice', cell: ({ row }) => <span className="font-mono font-semibold">{row.original.orderNumber}</span> },
      { accessorKey: 'customer', header: 'Customer' },
      { accessorKey: 'mobile', header: 'Mobile' },
      { accessorKey: 'daysOverdue', header: 'Overdue', cell: ({ row }) => {
        const d = row.original.daysOverdue
        if (d >= 10) return <Badge variant="destructive">{d} days</Badge>
        if (d >= 5) return <Badge variant="warning">{d} days</Badge>
        return <Badge variant="secondary">{d} days</Badge>
      }},
      { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="tabular-nums font-semibold">₹{row.original.amount.toLocaleString('en-IN')}</span> },
      { id: 'actions', header: '', cell: ({ row }) => <Button size="sm" onClick={() => setPending(row.original)}><BadgeCheck className="size-4" /> Settle</Button> },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        titleAdornment={sample ? <Badge variant="warning">Sample · backend pending</Badge> : data ? <Badge variant="success">Live</Badge> : undefined}
        description={sample ? 'Backend route pending — showing local sample.' : 'Invoices and orders awaiting settlement.'}
        breadcrumbs={breadcrumbs}
        actions={<Button variant="outline"><Receipt className="size-4" /> Generate report</Button>}
      />
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Total outstanding</p>
        <p className="text-3xl font-bold tabular-nums mt-1"><IndianRupee className="size-6 inline -mt-1" />{total.toLocaleString('en-IN')}</p>
      </div>
      <DataTable data={rows} columns={columns} loading={loading} searchPlaceholder="Search invoice or customer…" />
      <ConfirmDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)} title={`Settle ${pending?.orderNumber ?? ''}?`} description={`Marks ₹${pending?.amount.toLocaleString('en-IN')} as paid.`} confirmLabel="Mark as paid" onConfirm={() => { if (pending) { setRows((p) => p.filter((r) => r.id !== pending.id)); toast.success(`Settled ${pending.orderNumber}`) } }} />
    </div>
  )
}
