import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, RefreshCw, Tag, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ImageCell } from '@/components/ui/image-cell'
import { toast } from '@/lib/toast'
import {
  useBranchMenuItems, useBranchCategories, useBranchSubcategories,
  useBranchUsers, useBranchCustomers,
  useAddBranchMenuItem, useUpdateBranchMenuItem, useDeleteBranchMenuItem,
  useAddBranchUser, useUpdateBranchUser, useDeleteBranchUser,
} from '@/api/queries/branch'
import {
  branchMenuItemPrice,
  type BranchMenuItem, type BranchUser, type BranchCustomer,
  type BranchMenuItemInput, type BranchUserInput,
} from '@/api/services/branch'
import { OrdersList } from '@/features/shared/OrdersList'
import { SettingsShell } from '@/features/shared/SettingsShell'
import { OutstandingList } from '@/features/shared/OutstandingList'
import CashierWalletTopup from '@/features/cashier/WalletTopupRequest'

const crumb = (last: string) => [{ label: 'Branch', href: '/branch/dashboard' }, { label: last }]

export const BranchOrders = () => <OrdersList title="Orders" breadcrumbs={crumb('Orders')} />
export const BranchSettings = () => <SettingsShell title="Settings" breadcrumbs={crumb('Settings')} defaultName="Spice Garden — Main Branch" />
export const BranchOutstanding = () => <OutstandingList title="Outstanding" breadcrumbs={crumb('Outstanding')} />
export const BranchWalletTopup = CashierWalletTopup

const EMPTY_BR_ITEM: BranchMenuItemInput & { id?: number } = {
  name: '', description: '', price: 0, categoryId: 0, subcategoryId: undefined,
  isVeg: true, isAvailable: true,
}
export function BranchMenu() {
  const itemsQ = useBranchMenuItems()
  const catsQ = useBranchCategories()
  const subsQ = useBranchSubcategories()
  const addMut = useAddBranchMenuItem()
  const updateMut = useUpdateBranchMenuItem()
  const deleteMut = useDeleteBranchMenuItem()
  const items = itemsQ.data ?? []
  const cats = catsQ.data ?? []

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<BranchMenuItemInput & { id?: number }>(EMPTY_BR_ITEM)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)

  const openCreate = () => { setForm(EMPTY_BR_ITEM); setOpen(true) }
  const openEdit = (it: BranchMenuItem) => {
    // BranchMenuItem doesn't expose every field the input form supports
    // (e.g. subcategoryId, isVeg) — fall back to the loose backend shape
    // when present, otherwise let the form defaults apply.
    const loose = it as BranchMenuItem & {
      subcategoryId?: { id: number } | null
      isVeg?: boolean
    }
    setForm({
      id: it.id,
      name: it.name ?? '',
      description: it.description ?? '',
      price: branchMenuItemPrice(it),
      categoryId: it.categoryId?.id ?? 0,
      subcategoryId: loose.subcategoryId?.id,
      isVeg: loose.isVeg ?? true,
      isAvailable: it.isAvailable ?? true,
    })
    setOpen(true)
  }
  const filteredSubs = useMemo(() => {
    if (!form.categoryId) return subsQ.data ?? []
    return (subsQ.data ?? []).filter((s) => {
      const cid = (s as { categoryId?: { id?: number } | number | null }).categoryId
      const idVal = typeof cid === 'object' && cid ? cid.id : cid
      return idVal === form.categoryId
    })
  }, [subsQ.data, form.categoryId])

  const submit = async () => {
    if (!form.name.trim()) { toast.warning('Item name is required'); return }
    if (!form.categoryId) { toast.warning('Category is required'); return }
    if (!Number.isFinite(form.price) || form.price <= 0) { toast.warning('Price must be positive'); return }
    const payload: BranchMenuItemInput = {
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      price: form.price,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId,
      isVeg: form.isVeg,
      isAvailable: form.isAvailable,
    }
    if (form.id != null) {
      const res = await updateMut.mutateAsync({ id: form.id, input: payload })
      if (res.ok) { toast.success('Item updated'); setOpen(false) } else toast.error(res.message)
    } else {
      const res = await addMut.mutateAsync(payload)
      if (res.ok) { toast.success('Item added'); setOpen(false) } else toast.error(res.message)
    }
  }
  const doDelete = async () => {
    if (!confirmDelete) return
    const res = await deleteMut.mutateAsync(confirmDelete.id)
    if (res.ok) toast.success(`Deleted "${confirmDelete.name}"`)
    else toast.error(res.message)
    setConfirmDelete(null)
  }

  const columns = useMemo<ColumnDef<BranchMenuItem>[]>(() => [
    {
      id: 'image', header: '', cell: ({ row }) => (
        <ImageCell src={(row.original as { imageUrl?: string }).imageUrl ?? null} alt={row.original.name} size={36} />
      ),
    },
    { accessorKey: 'name', header: 'Item' },
    {
      accessorKey: 'categoryId',
      header: 'Category',
      cell: ({ row }) => {
        const id = row.original.categoryId?.id
        const c = cats.find((x) => x.id === id)
        return <span className="inline-flex items-center gap-1.5"><Tag className="size-3 text-muted-foreground" /> {c?.name ?? '—'}</span>
      },
    },
    { accessorKey: 'price', header: 'Price', cell: ({ row }) => <span className="tabular-nums font-medium">₹{branchMenuItemPrice(row.original)}</span> },
    { accessorKey: 'isAvailable', header: 'Available', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Switch checked={row.original.isAvailable} aria-label="Toggle available" />
        {row.original.isAvailable ? <Badge variant="success">In stock</Badge> : <Badge variant="warning">Out</Badge>}
      </div>
    ) },
    {
      id: 'actions', header: '', cell: ({ row }) => (
        <div className="text-right space-x-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row.original)}><Pencil className="size-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete({ id: row.original.id, name: row.original.name })}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ], [cats])

  return (
    <div className="space-y-6">
      <PageHeader title="Menu" description={`Live · ${items.length} items, ${cats.length} categories`} breadcrumbs={crumb('Menu')} actions={
        <>
          <Button variant="outline" onClick={() => { void itemsQ.refetch(); void catsQ.refetch() }}>
            <RefreshCw className={itemsQ.isFetching || catsQ.isFetching ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
          <Button onClick={openCreate}><Plus className="size-4 mr-1" /> Add item</Button>
        </>
      } />
      <DataTable data={items} columns={columns} loading={itemsQ.isLoading} searchPlaceholder="Search items…" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? 'Edit item' : 'Add item'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label required>Item name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Category</Label>
                <Select value={form.categoryId ? String(form.categoryId) : ''} onValueChange={(v) => setForm((p) => ({ ...p, categoryId: Number(v), subcategoryId: undefined }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subcategory</Label>
                <Select value={form.subcategoryId ? String(form.subcategoryId) : ''}
                  onValueChange={(v) => setForm((p) => ({ ...p, subcategoryId: Number(v) }))}
                  disabled={!form.categoryId}>
                  <SelectTrigger><SelectValue placeholder={form.categoryId ? 'Select' : 'Pick a category first'} /></SelectTrigger>
                  <SelectContent>
                    {filteredSubs.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea value={form.description ?? ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5">
                <Label required>Price (₹)</Label>
                <Input type="number" min={0} step="0.01" value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border p-3">
                <Switch id="br-isveg" checked={form.isVeg ?? true} onCheckedChange={(v) => setForm((p) => ({ ...p, isVeg: !!v }))} />
                <Label htmlFor="br-isveg" className="m-0">Veg</Label>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border p-3">
                <Switch id="br-isavail" checked={form.isAvailable} onCheckedChange={(v) => setForm((p) => ({ ...p, isAvailable: !!v }))} />
                <Label htmlFor="br-isavail" className="m-0">Available</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addMut.isPending || updateMut.isPending}>
              {form.id ? 'Save changes' : 'Add item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete != null}
        onOpenChange={(v) => { if (!v) setConfirmDelete(null) }}
        title={`Delete "${confirmDelete?.name ?? ''}"?`}
        description="The item disappears from this branch's menu immediately."
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
      />
    </div>
  )
}

const EMPTY_BR_USER: BranchUserInput & { id?: number } = {
  name: '', mobile: '', email: '', role: 'cashier', password: '',
}
export function BranchUsers() {
  const q = useBranchUsers()
  const addMut = useAddBranchUser()
  const updateMut = useUpdateBranchUser()
  const deleteMut = useDeleteBranchUser()
  const data = q.data ?? []
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<BranchUserInput & { id?: number }>(EMPTY_BR_USER)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)

  const openCreate = () => { setForm(EMPTY_BR_USER); setOpen(true) }
  const openEdit = (u: BranchUser) => {
    setForm({
      id: u.id, name: u.name ?? '', mobile: u.mobile ?? '', email: u.email ?? '',
      role: u.role ?? 'cashier', password: '',
    })
    setOpen(true)
  }
  const submit = async () => {
    if (!form.name.trim()) { toast.warning('Name is required'); return }
    if (!/^\d{10}$/.test(form.mobile)) { toast.warning('Mobile must be 10 digits'); return }
    if (!form.id && (!form.password || form.password.length < 4)) {
      toast.warning('Password is required (min 4 chars)'); return
    }
    const payload: BranchUserInput = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      email: form.email?.trim() || undefined,
      role: form.role,
      ...(form.password ? { password: form.password } : {}),
    }
    if (form.id != null) {
      const res = await updateMut.mutateAsync({ id: form.id, input: payload })
      if (res.ok) { toast.success('Staff updated'); setOpen(false) } else toast.error(res.message)
    } else {
      const res = await addMut.mutateAsync(payload)
      if (res.ok) { toast.success('Staff added'); setOpen(false) } else toast.error(res.message)
    }
  }
  const doDelete = async () => {
    if (!confirmDelete) return
    const res = await deleteMut.mutateAsync(confirmDelete.id)
    if (res.ok) toast.success(`Removed "${confirmDelete.name}"`)
    else toast.error(res.message)
    setConfirmDelete(null)
  }

  const columns = useMemo<ColumnDef<BranchUser>[]>(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'mobile', header: 'Mobile', cell: ({ row }) => <span className="font-mono">{row.original.mobile ?? '—'}</span> },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'role', header: 'Role', cell: ({ row }) => <Badge variant="outline">{row.original.role ?? '—'}</Badge> },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => row.original.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Disabled</Badge> },
    {
      id: 'actions', header: '', cell: ({ row }) => (
        <div className="text-right space-x-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row.original)}><Pencil className="size-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete({ id: row.original.id, name: row.original.name })}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ], [])
  return (
    <div className="space-y-6">
      <PageHeader title="Staff" description={`Live · ${data.length} staff`} breadcrumbs={crumb('Staff')}
        actions={<Button onClick={openCreate}><Plus className="size-4 mr-1" /> Add staff</Button>} />
      <DataTable data={data} columns={columns} loading={q.isLoading} searchPlaceholder="Search staff…" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? 'Edit staff' : 'Add staff'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label required>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Mobile</Label>
                <Input value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} inputMode="numeric" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email ?? ''} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="captain">Captain</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{form.id ? 'New password (leave blank)' : 'Password'}</Label>
                <Input type="password" value={form.password ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder={form.id ? '••••••' : 'min 4 chars'} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addMut.isPending || updateMut.isPending}>
              {form.id ? 'Save changes' : 'Add staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete != null}
        onOpenChange={(v) => { if (!v) setConfirmDelete(null) }}
        title={`Remove "${confirmDelete?.name ?? ''}"?`}
        description="They will lose panel access immediately. Historical activity stays attributed."
        confirmLabel="Remove"
        destructive
        onConfirm={doDelete}
      />
    </div>
  )
}

export function BranchCustomers() {
  const q = useBranchCustomers()
  const data = q.data ?? []
  const columns = useMemo<ColumnDef<BranchCustomer>[]>(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'mobileNumber', header: 'Mobile', cell: ({ row }) => <span className="font-mono">{row.original.mobileNumber}</span> },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => row.original.email ?? '—' },
  ], [])
  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description={`Live · ${data.length} customers`} breadcrumbs={crumb('Customers')} />
      <DataTable data={data} columns={columns} loading={q.isLoading} searchPlaceholder="Search customers…" />
    </div>
  )
}
