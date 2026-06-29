import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Phone, Mail } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCashierCustomers, useCreateCashierCustomer } from '@/api/queries/cashier'
import type { CashierCustomer } from '@/api/services/cashier'
import { toast } from '@/lib/toast'

export default function Customers() {
  const customersQ = useCashierCustomers()
  const createMut = useCreateCashierCustomer()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', mobileNumber: '', email: '' })

  const data = customersQ.data ?? []

  const columns = useMemo<ColumnDef<CashierCustomer>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'mobileNumber',
        header: 'Mobile',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5">
            <Phone className="size-3 text-muted-foreground" />
            <span className="font-mono">{row.original.mobileNumber}</span>
          </span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) =>
          row.original.email ? (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-3 text-muted-foreground" />
              <span className="text-muted-foreground">{row.original.email}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    []
  )

  const submit = async () => {
    if (!form.name.trim() || !/^\d{10}$/.test(form.mobileNumber)) {
      toast.warning('Name + 10-digit mobile required')
      return
    }
    const res = await createMut.mutateAsync({
      name: form.name.trim(),
      mobileNumber: form.mobileNumber,
      ...(form.email ? { email: form.email } : {}),
    })
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success(`${form.name} added`)
    setForm({ name: '', mobileNumber: '', email: '' })
    setAdding(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={`Live from backend · ${data.length} customers`}
        breadcrumbs={[{ label: 'Cashier', href: '/cashier/dashboard' }, { label: 'Customers' }]}
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Add customer
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        loading={customersQ.isLoading}
        searchPlaceholder="Search name, mobile, email…"
      />

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add customer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cname" required>Name</Label>
              <Input id="cname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cmobile" required>Mobile</Label>
              <Input
                id="cmobile"
                inputMode="numeric"
                maxLength={10}
                value={form.mobileNumber}
                onChange={(e) => setForm({ ...form, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cemail">Email (optional)</Label>
              <Input id="cemail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdding(false)} disabled={createMut.isPending}>Cancel</Button>
            <Button onClick={submit} loading={createMut.isPending}>Save customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
