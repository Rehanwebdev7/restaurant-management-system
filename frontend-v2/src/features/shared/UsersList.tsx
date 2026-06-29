import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/toast'

interface UserRow {
  id: number
  name: string
  mobile: string
  email?: string
  role: string
  active: boolean
}

const SAMPLE: UserRow[] = [
  { id: 1, name: 'Chef Mohan', mobile: '9800000004', email: 'chefmohan@demo.com', role: 'Kitchen', active: true },
  { id: 2, name: 'Priya Sharma', mobile: '9800000006', email: 'priyacashier@demo.com', role: 'Cashier', active: true },
  { id: 3, name: 'Vikram Singh', mobile: '9800000005', email: 'vikram@demo.com', role: 'Delivery', active: true },
  { id: 4, name: 'Raj Kumar', mobile: '9800000003', email: 'raj@demo.com', role: 'Captain', active: false },
]

interface UsersListProps {
  title: string
  description?: string
  breadcrumbs?: { label: string; href?: string }[]
  availableRoles?: string[]
}

export function UsersList({
  title,
  description = 'Manage staff accounts, roles, and access.',
  breadcrumbs,
  availableRoles = ['Kitchen', 'Cashier', 'Delivery', 'Captain', 'Branch', 'Restaurant'],
}: UsersListProps) {
  const [rows, setRows] = useState(SAMPLE)
  const [adding, setAdding] = useState(false)
  const [toDelete, setToDelete] = useState<UserRow | null>(null)
  const [form, setForm] = useState({ name: '', mobile: '', email: '', role: availableRoles[0] ?? '' })

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'mobile', header: 'Mobile', cell: ({ row }) => <span className="font-mono">{row.original.mobile}</span> },
      { accessorKey: 'email', header: 'Email', cell: ({ row }) => row.original.email ?? '—' },
      { accessorKey: 'role', header: 'Role', cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge> },
      {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ row }) => row.original.active ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Disabled</Badge>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button size="sm" variant="ghost" onClick={() => setToDelete(row.original)} aria-label="Delete">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        ),
      },
    ],
    []
  )

  const submit = () => {
    if (!form.name.trim() || !/^\d{10}$/.test(form.mobile)) {
      toast.warning('Name + 10-digit mobile required')
      return
    }
    const next: UserRow = {
      id: Date.now(),
      name: form.name,
      mobile: form.mobile,
      email: form.email,
      role: form.role,
      active: true,
    }
    setRows([next, ...rows])
    toast.success(`${form.name} added`)
    setForm({ name: '', mobile: '', email: '', role: availableRoles[0] ?? '' })
    setAdding(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        actions={<Button onClick={() => setAdding(true)}><Plus className="size-4" /> Add user</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search by name, mobile, role…" />

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add user</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="uname" required>Name</Label><Input id="uname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="umob" required>Mobile</Label><Input id="umob" inputMode="numeric" maxLength={10} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></div>
            <div className="space-y-1.5"><Label htmlFor="uemail">Email</Label><Input id="uemail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label required>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{availableRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={submit}>Save user</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} destructive title={`Remove ${toDelete?.name ?? 'user'}?`} description="This disables their account immediately." confirmLabel="Remove" onConfirm={() => { if (toDelete) { setRows((p) => p.filter((r) => r.id !== toDelete.id)); toast.info(`${toDelete.name} removed`) } }} />
    </div>
  )
}
