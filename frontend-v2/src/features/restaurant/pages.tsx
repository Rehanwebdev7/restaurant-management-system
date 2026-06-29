import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  TrendingUp, Building2, ClipboardList, Users, Wallet, Plus, BarChart3,
  Tag, RefreshCw, Image as ImageIcon, Landmark, CreditCard,
  Trash2, UserX, Pencil,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard, StatCardSkeleton } from '@/components/ui/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/ui/empty-state'
import { BulkActionBar } from '@/components/ui/bulk-action-bar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ExportMenu, type ExportColumn } from '@/components/ui/export-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ImageCell } from '@/components/ui/image-cell'
import { toast } from '@/lib/toast'
import {
  useRestaurantDashboard, useRestaurantMenuItems, useRestaurantCategories,
  useRestaurantUsers, useRestaurantCustomers, useRestaurantPaymentGateways,
  useRestaurantSliders, useRestaurantBankDetails,
  useToggleRestaurantCustomerActive,
  useRestaurantOrders,
  useRestaurantOutstanding,
  useAddRestaurantUser, useUpdateRestaurantUser, useDeleteRestaurantUser,
  useAddRestaurantPaymentGateway, useUpdateRestaurantPaymentGateway,
  useAddRestaurantSlider, useUpdateRestaurantSlider, useDeleteRestaurantSlider,
  useAddRestaurantBankDetail, useUpdateRestaurantBankDetail, useDeleteRestaurantBankDetail,
} from '@/api/queries/restaurant'
import {
  menuItemPrice,
  type RestaurantMenuItem, type RestaurantUser, type RestaurantCustomer,
  type RestaurantPaymentGateway, type RestaurantSlider, type RestaurantBankDetail,
  type RestaurantOrder,
  type UserInput, type PaymentGatewayInput, type SliderInput, type BankDetailInput,
} from '@/api/services/restaurant'
import { OutstandingList } from '@/features/shared/OutstandingList'
import { SettingsShell } from '@/features/shared/SettingsShell'
import { ReportsShell } from '@/features/shared/ReportsShell'
import CashierWalletTopup from '@/features/cashier/WalletTopupRequest'
import WithdrawalRequest from '@/features/delivery/WithdrawalRequest'

const crumb = (last: string) => [{ label: 'Restaurant', href: '/restaurant/dashboard' }, { label: last }]

export function RestaurantDashboard() {
  const dashQ = useRestaurantDashboard()
  const usersQ = useRestaurantUsers()
  const customersQ = useRestaurantCustomers()
  const d = dashQ.data
  const loading = dashQ.isLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurant Dashboard"
        description="Multi-branch snapshot · live from /api/restaurant/dashboard/summary"
        breadcrumbs={[{ label: 'Restaurant' }, { label: 'Dashboard' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => void dashQ.refetch()}>
              <RefreshCw className={dashQ.isFetching ? 'size-4 animate-spin' : 'size-4'} />
              Refresh
            </Button>
            <Button asChild>
              <Link to="/restaurant/branches"><Building2 className="size-4" /> Branches</Link>
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton hero />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard hero label="Today revenue" value={Number(d?.todayRevenue ?? 0)} format={(n) => `₹${Math.round(n).toLocaleString('en-IN')}`} icon={<TrendingUp className="size-5" />} />
            <StatCard label="Today orders" value={d?.todayOrders ?? 0} icon={<ClipboardList className="size-5" />} />
            <StatCard label="Total customers" value={customersQ.data?.length ?? 0} icon={<Users className="size-5" />} />
            <StatCard label="Total staff" value={usersQ.data?.length ?? 0} icon={<Users className="size-5" />} />
          </>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>By status</CardTitle><CardDescription>Live order breakdown.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {d?.ordersByStatus && Object.keys(d.ordersByStatus).length > 0 ? (
              Object.entries(d.ordersByStatus).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <Badge variant="outline">{k}</Badge>
                  <span className="font-mono tabular-nums">{v}</span>
                </div>
              ))
            ) : <p className="text-xs text-muted-foreground">No status data yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick links</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { to: '/restaurant/menu', label: 'Menu', icon: ClipboardList },
              { to: '/restaurant/users', label: 'Staff', icon: Users },
              { to: '/restaurant/customers', label: 'Customers', icon: Users },
              { to: '/restaurant/payment-gateway', label: 'Payments', icon: CreditCard },
              { to: '/restaurant/sliders', label: 'Sliders', icon: ImageIcon },
              { to: '/restaurant/bank', label: 'Bank', icon: Landmark },
              { to: '/restaurant/wallet', label: 'Wallet', icon: Wallet },
              { to: '/restaurant/reports', label: 'Reports', icon: BarChart3 },
            ].map((q) => { const I = q.icon; return (
              <Link key={q.to} to={q.to} className="rounded-md border border-border bg-card hover:border-primary/40 hover:bg-primary/5 p-3 flex items-center gap-2 transition-all duration-quick ease-entrance active:scale-[0.98]">
                <span className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0"><I className="size-4" /></span>
                <span className="text-sm font-medium">{q.label}</span>
              </Link>
            )})}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const EMPTY_BRANCH: UserInput & { id?: number } = {
  name: '', mobile: '', email: '', role: 'branch', password: '',
}
/**
 * Branches are managed as users with `role=branch` — same `/api/restaurant/users/*`
 * endpoints as the staff page, just filtered. Restores legacy parity (the
 * legacy `RestaurantSidebar.js` "Branch Tree" + "Branches" pages used the same
 * underlying endpoint).
 */
export function Branches() {
  const usersQ = useRestaurantUsers()
  const addMut = useAddRestaurantUser()
  const updateMut = useUpdateRestaurantUser()
  const deleteMut = useDeleteRestaurantUser()
  const branches = useMemo(
    () => (usersQ.data ?? []).filter((u) => (u.role ?? '').toLowerCase() === 'branch'),
    [usersQ.data],
  )
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<UserInput & { id?: number }>(EMPTY_BRANCH)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)

  const openCreate = () => { setForm(EMPTY_BRANCH); setOpen(true) }
  const openEdit = (b: RestaurantUser) => {
    setForm({
      id: b.id, name: b.name ?? '', mobile: b.mobile ?? '', email: b.email ?? '',
      role: 'branch', password: '',
    })
    setOpen(true)
  }

  const submit = async () => {
    if (!form.name.trim()) { toast.warning('Branch name is required'); return }
    if (!/^\d{10}$/.test(form.mobile)) { toast.warning('Mobile must be 10 digits'); return }
    if (!form.id && (!form.password || form.password.length < 4)) {
      toast.warning('Password is required (min 4 chars) for new branch'); return
    }
    const payload: UserInput = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      email: form.email?.trim() || undefined,
      role: 'branch',
      ...(form.password ? { password: form.password } : {}),
    }
    if (form.id != null) {
      const res = await updateMut.mutateAsync({ id: form.id, input: payload })
      if (res.ok) { toast.success('Branch updated'); setOpen(false) } else toast.error(res.message)
    } else {
      const res = await addMut.mutateAsync(payload)
      if (res.ok) { toast.success('Branch added'); setOpen(false) } else toast.error(res.message)
    }
  }

  const doDelete = async () => {
    if (!confirmDelete) return
    const res = await deleteMut.mutateAsync(confirmDelete.id)
    if (res.ok) toast.success(`Deleted "${confirmDelete.name}"`)
    else toast.error(res.message)
    setConfirmDelete(null)
  }

  const columns = useMemo<ColumnDef<RestaurantUser>[]>(() => [
    { accessorKey: 'name', header: 'Branch' },
    { accessorKey: 'mobile', header: 'Mobile', cell: ({ row }) => <span className="font-mono">{row.original.mobile ?? '—'}</span> },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => row.original.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Paused</Badge> },
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
      <PageHeader title="Branches" description={`Live · ${branches.length} branches`}
        breadcrumbs={crumb('Branches')}
        actions={<Button onClick={openCreate}><Plus className="size-4 mr-1" /> Add branch</Button>} />
      <DataTable data={branches} columns={columns} loading={usersQ.isLoading} searchPlaceholder="Search branches…" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? 'Edit branch' : 'Add branch'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label required>Branch name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Andheri West" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Mobile</Label>
                <Input value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="10 digits" inputMode="numeric" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email ?? ''} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="branch@restaurant.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{form.id ? 'New login password (leave blank to keep current)' : 'Login password'}</Label>
              <Input type="password" value={form.password ?? ''} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder={form.id ? '••••••' : 'min 4 chars'} />
              <p className="text-xs text-muted-foreground">Branch managers sign in to the panel with this mobile + password.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addMut.isPending || updateMut.isPending}>
              {form.id ? 'Save changes' : 'Add branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete != null}
        onOpenChange={(v) => { if (!v) setConfirmDelete(null) }}
        title={`Delete "${confirmDelete?.name ?? ''}"?`}
        description="Branch + all staff under it will lose panel access. Past orders + revenue remain in your reports."
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
      />
    </div>
  )
}

export function RestaurantMenu() {
  const itemsQ = useRestaurantMenuItems()
  const catsQ = useRestaurantCategories()
  const items = itemsQ.data ?? []
  const cats = catsQ.data ?? []

  const columns = useMemo<ColumnDef<RestaurantMenuItem>[]>(() => [
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
    { accessorKey: 'price', header: 'Price', cell: ({ row }) => <span className="tabular-nums font-medium">₹{menuItemPrice(row.original)}</span> },
    { accessorKey: 'isAvailable', header: 'Available', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Switch checked={row.original.isAvailable} aria-label="Toggle available" />
        {row.original.isAvailable ? <Badge variant="success">In stock</Badge> : <Badge variant="warning">Out</Badge>}
      </div>
    ) },
  ], [cats])

  return (
    <div className="space-y-6">
      <PageHeader title="Menu" description={`Live · ${items.length} items, ${cats.length} categories`} breadcrumbs={crumb('Menu')} actions={
        <>
          <Button variant="outline" onClick={() => { void itemsQ.refetch(); void catsQ.refetch() }}>
            <RefreshCw className={itemsQ.isFetching || catsQ.isFetching ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
          <Button><Plus className="size-4" /> Add item</Button>
        </>
      } />
      <DataTable data={items} columns={columns} loading={itemsQ.isLoading} searchPlaceholder="Search items…" />
    </div>
  )
}

const EMPTY_USER: UserInput & { id?: number } = {
  name: '', mobile: '', email: '', role: 'cashier', password: '',
}
export function RestaurantUsers() {
  const usersQ = useRestaurantUsers()
  const addMut = useAddRestaurantUser()
  const updateMut = useUpdateRestaurantUser()
  const deleteMut = useDeleteRestaurantUser()
  const data = usersQ.data ?? []
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<UserInput & { id?: number }>(EMPTY_USER)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)

  const openCreate = () => { setForm(EMPTY_USER); setOpen(true) }
  const openEdit = (u: RestaurantUser) => {
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
      toast.warning('Password is required (min 4 chars) for new user'); return
    }
    const payload: UserInput = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      email: form.email?.trim() || undefined,
      role: form.role,
      ...(form.password ? { password: form.password } : {}),
    }
    if (form.id != null) {
      const res = await updateMut.mutateAsync({ id: form.id, input: payload })
      if (res.ok) { toast.success('User updated'); setOpen(false) } else toast.error(res.message)
    } else {
      const res = await addMut.mutateAsync(payload)
      if (res.ok) { toast.success('User added'); setOpen(false) } else toast.error(res.message)
    }
  }

  const doDelete = async () => {
    if (!confirmDelete) return
    const res = await deleteMut.mutateAsync(confirmDelete.id)
    if (res.ok) toast.success(`Deleted "${confirmDelete.name}"`)
    else toast.error(res.message)
    setConfirmDelete(null)
  }

  const columns = useMemo<ColumnDef<RestaurantUser>[]>(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'mobile', header: 'Mobile', cell: ({ row }) => <span className="font-mono">{row.original.mobile ?? '—'}</span> },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'role', header: 'Role', cell: ({ row }) => <Badge variant="outline">{row.original.role ?? '—'}</Badge> },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => row.original.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Disabled</Badge> },
    {
      id: 'actions', header: '', cell: ({ row }) => (
        <div className="text-right space-x-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row.original)} aria-label="Edit user">
            <Pencil className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete({ id: row.original.id, name: row.original.name })} aria-label="Delete user">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ], [])
  return (
    <div className="space-y-6">
      <PageHeader title="Users" description={`Live · ${data.length} users`} breadcrumbs={crumb('Users')}
        actions={<Button onClick={openCreate}><Plus className="size-4 mr-1" /> Add user</Button>} />
      <DataTable data={data} columns={columns} loading={usersQ.isLoading} searchPlaceholder="Search users…" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? 'Edit user' : 'Add user'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label required>Full name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Priya Sharma" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Mobile</Label>
                <Input value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="10 digits" inputMode="numeric" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email ?? ''} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="staff@restaurant.com" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch">Branch</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="captain">Captain</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{form.id ? 'New password (leave blank to keep)' : 'Password'}</Label>
                <Input type="password" value={form.password ?? ''} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder={form.id ? '••••••' : 'min 4 chars'} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addMut.isPending || updateMut.isPending}>
              {form.id ? 'Save changes' : 'Create user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete != null}
        onOpenChange={(v) => { if (!v) setConfirmDelete(null) }}
        title={`Delete "${confirmDelete?.name ?? ''}"?`}
        description="The user will lose panel access. Their historical activity stays attributed to them."
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
      />
    </div>
  )
}

/**
 * UI-F-15: Multi-row selection + BulkActionBar wired into the customers list.
 *
 * Backend has no hard-delete endpoint for customers — the legacy "Delete" verb
 * maps to `PUT /api/restaurant/customers/toggle/:id { isActive: false }`. We
 * preserve the user-facing labels (Delete / Mark inactive) because that's what
 * the legacy admin shipped; both run through `toggleRestaurantCustomerActive`.
 */
export function RestaurantCustomers() {
  const q = useRestaurantCustomers()
  const toggleActive = useToggleRestaurantCustomerActive()
  const data = q.data ?? []
  const [selected, setSelected] = useState<Record<number, true>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  const selectedIds = useMemo(() => Object.keys(selected).map(Number), [selected])
  const selectedRows = useMemo(
    () => data.filter((c) => selected[c.id]),
    [data, selected]
  )
  const allOnPageSelected =
    data.length > 0 && data.every((c) => selected[c.id])

  const toggleRow = (id: number) =>
    setSelected((s) => {
      const next = { ...s }
      if (next[id]) delete next[id]
      else next[id] = true
      return next
    })

  const toggleAll = () => {
    if (allOnPageSelected) {
      setSelected({})
    } else {
      const next: Record<number, true> = {}
      data.forEach((c) => {
        next[c.id] = true
      })
      setSelected(next)
    }
  }

  const clearSelection = () => setSelected({})

  const columns = useMemo<ColumnDef<RestaurantCustomer>[]>(() => [
    {
      id: 'select',
      header: () => (
        <input
          type="checkbox"
          aria-label="Select all customers"
          className="size-4 rounded border-border accent-primary cursor-pointer"
          checked={allOnPageSelected}
          onChange={toggleAll}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label={`Select ${row.original.name}`}
          className="size-4 rounded border-border accent-primary cursor-pointer"
          checked={Boolean(selected[row.original.id])}
          onChange={() => toggleRow(row.original.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
    },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'mobileNumber', header: 'Mobile', cell: ({ row }) => <span className="font-mono">{row.original.mobileNumber}</span> },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => row.original.email ?? '—' },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [selected, allOnPageSelected])

  const exportColumns: ExportColumn<RestaurantCustomer & Record<string, unknown>>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'mobileNumber', label: 'Mobile' },
    { key: 'email', label: 'Email' },
  ]

  const bulkInactive = async (verb: 'Deleted' | 'Marked inactive') => {
    // Fire toggles sequentially so the optimistic invalidation can settle once
    // at the end. The mutation hook already invalidates after the last call.
    const results = await Promise.allSettled(
      selectedIds.map((id) => toggleActive.mutateAsync({ id, isActive: false }))
    )
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed === 0) {
      toast.success(`${verb} ${selectedIds.length} customer${selectedIds.length === 1 ? '' : 's'}`)
    } else {
      toast.error(`${failed} of ${selectedIds.length} failed`)
    }
    setSelected({})
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={`Live · ${data.length} customers`}
        breadcrumbs={crumb('Customers')}
        actions={
          <ExportMenu<RestaurantCustomer & Record<string, unknown>>
            rows={data as (RestaurantCustomer & Record<string, unknown>)[]}
            columns={exportColumns}
            filename="customers-all"
          />
        }
      />
      <DataTable data={data} columns={columns} loading={q.isLoading} searchPlaceholder="Search customers…" />

      <BulkActionBar
        selectedCount={selectedIds.length}
        onClear={clearSelection}
        actions={[
          {
            label: 'Delete selected',
            icon: Trash2,
            variant: 'destructive',
            onClick: () => setConfirmOpen(true),
            disabled: toggleActive.isPending,
          },
          {
            label: 'Mark inactive',
            icon: UserX,
            onClick: () => void bulkInactive('Marked inactive'),
            disabled: toggleActive.isPending,
          },
        ]}
      />

      {/* Export-selected via ExportMenu — rendered as part of BulkActionBar would
          force the menu API into the BulkAction shape. Mount a hidden trigger
          alongside that opens the same dropdown for the selected subset. */}
      {selectedIds.length > 0 ? (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
          <ExportMenu<RestaurantCustomer & Record<string, unknown>>
            rows={selectedRows as (RestaurantCustomer & Record<string, unknown>)[]}
            columns={exportColumns}
            filename={`customers-selected-${selectedIds.length}`}
          />
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${selectedIds.length} customer${selectedIds.length === 1 ? '' : 's'}?`}
        description="This soft-deletes by marking each customer inactive. They will no longer appear in lists but their order history is preserved."
        destructive
        confirmLabel="Delete"
        onConfirm={() => bulkInactive('Deleted')}
      />
    </div>
  )
}

const EMPTY_GATEWAY: PaymentGatewayInput & { id?: number } = {
  status: true, allowCod: true,
  stripeEnabled: false, paypalEnabled: false, razorpayEnabled: false, upiEnabled: false,
}
export function RestaurantPaymentGateway() {
  const q = useRestaurantPaymentGateways()
  const addMut = useAddRestaurantPaymentGateway()
  const updateMut = useUpdateRestaurantPaymentGateway()
  const data = q.data ?? []
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<PaymentGatewayInput & { id?: number }>(EMPTY_GATEWAY)

  const openCreate = () => { setForm(EMPTY_GATEWAY); setOpen(true) }
  const openEdit = (g: RestaurantPaymentGateway) => {
    setForm({
      id: g.id,
      status: g.status ?? false,
      allowCod: g.allowCod ?? false,
      stripeEnabled: g.stripeEnabled ?? false,
      paypalEnabled: g.paypalEnabled ?? false,
      razorpayEnabled: g.razorpayEnabled ?? false,
      upiEnabled: g.upiEnabled ?? false,
    })
    setOpen(true)
  }

  const submit = async () => {
    const payload: PaymentGatewayInput = {
      status: form.status,
      allowCod: form.allowCod,
      stripeEnabled: form.stripeEnabled,
      paypalEnabled: form.paypalEnabled,
      razorpayEnabled: form.razorpayEnabled,
      upiEnabled: form.upiEnabled,
    }
    if (form.id != null) {
      const res = await updateMut.mutateAsync({ id: form.id, input: payload })
      if (res.ok) { toast.success('Gateway updated'); setOpen(false) } else toast.error(res.message)
    } else {
      const res = await addMut.mutateAsync(payload)
      if (res.ok) { toast.success('Gateway added'); setOpen(false) } else toast.error(res.message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Payment Gateway" description={`Live · ${data.length} configured`} breadcrumbs={crumb('Payment Gateway')}
        actions={<Button onClick={openCreate}><Plus className="size-4 mr-1" /> Add gateway</Button>} />
      {q.isLoading ? <div className="skeleton-shimmer h-32 rounded-lg" /> : data.length === 0 ? (
        <Card><CardContent className="pt-6"><EmptyState icon={<CreditCard className="size-6" />} title="No gateways configured" /></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((g: RestaurantPaymentGateway) => (
            <Card key={g.id} interactive className="cursor-pointer" onClick={() => openEdit(g)}>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Gateway #{g.id}</p>
                  {g.status ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>COD: {g.allowCod ? '✓' : '×'}</p>
                  <p>Stripe: {g.stripeEnabled ? '✓' : '×'}</p>
                  <p>PayPal: {g.paypalEnabled ? '✓' : '×'}</p>
                  <p>Razorpay: {g.razorpayEnabled ? '✓' : '×'}</p>
                  <p>UPI: {g.upiEnabled ? '✓' : '×'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? `Edit gateway #${form.id}` : 'Add payment gateway'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="g-status" className="m-0">Active</Label>
                <Switch id="g-status" checked={form.status} onCheckedChange={(v) => setForm((p) => ({ ...p, status: !!v }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="g-cod" className="m-0">Allow COD</Label>
                <Switch id="g-cod" checked={form.allowCod} onCheckedChange={(v) => setForm((p) => ({ ...p, allowCod: !!v }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="g-stripe" className="m-0">Stripe</Label>
                <Switch id="g-stripe" checked={form.stripeEnabled ?? false} onCheckedChange={(v) => setForm((p) => ({ ...p, stripeEnabled: !!v }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="g-paypal" className="m-0">PayPal</Label>
                <Switch id="g-paypal" checked={form.paypalEnabled ?? false} onCheckedChange={(v) => setForm((p) => ({ ...p, paypalEnabled: !!v }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="g-razorpay" className="m-0">Razorpay</Label>
                <Switch id="g-razorpay" checked={form.razorpayEnabled ?? false} onCheckedChange={(v) => setForm((p) => ({ ...p, razorpayEnabled: !!v }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="g-upi" className="m-0">UPI</Label>
                <Switch id="g-upi" checked={form.upiEnabled ?? false} onCheckedChange={(v) => setForm((p) => ({ ...p, upiEnabled: !!v }))} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Toggle which checkout methods customers see at order time. Individual provider credentials
              (Stripe/Razorpay/PayPal merchant IDs) live in <span className="font-mono">application.properties</span>.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addMut.isPending || updateMut.isPending}>
              {form.id ? 'Save changes' : 'Add gateway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface SliderFormState extends SliderInput { id?: number; imagePreview: string | null }
const EMPTY_SLIDER: SliderFormState = {
  title: '', description: '', displayOrder: 0, isActive: true, image: null, imageUrl: '', imagePreview: null,
}
export function RestaurantSliders() {
  const q = useRestaurantSliders()
  const addMut = useAddRestaurantSlider()
  const updateMut = useUpdateRestaurantSlider()
  const deleteMut = useDeleteRestaurantSlider()
  const data = q.data ?? []
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<SliderFormState>(EMPTY_SLIDER)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; title: string } | null>(null)

  const openCreate = () => { setForm(EMPTY_SLIDER); setOpen(true) }
  const openEdit = (s: RestaurantSlider) => {
    setForm({
      id: s.id, title: s.title ?? '', description: s.description ?? '',
      displayOrder: s.displayOrder ?? 0, isActive: s.isActive ?? true,
      image: null, imageUrl: s.imageUrl ?? '', imagePreview: s.imageUrl ?? null,
    })
    setOpen(true)
  }

  const handleImage = (file: File | null) => {
    if (!file) { setForm((p) => ({ ...p, image: null, imagePreview: p.imageUrl ?? null })); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    const reader = new FileReader()
    reader.onload = () => setForm((p) => ({ ...p, image: file, imagePreview: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  const submit = async () => {
    if (!form.id && !form.image && !form.imageUrl) {
      toast.warning('Upload an image or paste an image URL'); return
    }
    const payload: SliderInput = {
      title: form.title?.trim() || undefined,
      description: form.description?.trim() || undefined,
      displayOrder: form.displayOrder,
      isActive: form.isActive,
      image: form.image,
      imageUrl: form.imageUrl?.trim() || undefined,
    }
    if (form.id != null) {
      const res = await updateMut.mutateAsync({ id: form.id, input: payload })
      if (res.ok) { toast.success('Slider updated'); setOpen(false) } else toast.error(res.message)
    } else {
      const res = await addMut.mutateAsync(payload)
      if (res.ok) { toast.success('Slider added'); setOpen(false) } else toast.error(res.message)
    }
  }

  const doDelete = async () => {
    if (!confirmDelete) return
    const res = await deleteMut.mutateAsync(confirmDelete.id)
    if (res.ok) toast.success('Slider deleted')
    else toast.error(res.message)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Sliders" description={`Live · ${data.length} sliders`} breadcrumbs={crumb('Sliders')}
        actions={<Button onClick={openCreate}><Plus className="size-4 mr-1" /> Add slider</Button>} />
      {q.isLoading ? <div className="skeleton-shimmer h-48 rounded-lg" /> : data.length === 0 ? (
        <Card><CardContent className="pt-6"><EmptyState icon={<ImageIcon className="size-6" />} title="No sliders" /></CardContent></Card>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((s: RestaurantSlider) => (
            <li key={s.id}>
              <Card interactive className="overflow-hidden group relative">
                <div className="aspect-video bg-muted overflow-hidden">
                  <ImageCell src={s.imageUrl} alt={s.title ?? `Slider ${s.id}`} width={400} height={225} rounded="sm" className="w-full h-full" />
                </div>
                <CardContent className="pt-4 space-y-1">
                  <p className="font-semibold truncate">{s.title ?? `Slider #${s.id}`}</p>
                  {s.description ? <p className="text-xs text-muted-foreground truncate">{s.description}</p> : null}
                  <div className="flex items-center justify-between pt-1">
                    {s.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                    <div className="space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDelete({ id: s.id, title: s.title ?? `Slider #${s.id}` })}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? 'Edit slider' : 'Add slider'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Image</Label>
              <div className="flex items-center gap-3">
                <ImageCell src={form.imagePreview} alt={form.title ?? 'preview'} width={120} height={70} rounded="md" />
                <input type="file" accept="image/*"
                  onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
                  className="flex-1 text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer" />
              </div>
              <p className="text-xs text-muted-foreground">…or paste a CDN URL below.</p>
              <Input value={form.imageUrl ?? ''} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value, imagePreview: e.target.value || p.imagePreview }))} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title ?? ''} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Festival special" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea value={form.description ?? ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional caption shown under the image"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Display order</Label>
                <Input type="number" min={0} value={form.displayOrder ?? 0}
                  onChange={(e) => setForm((p) => ({ ...p, displayOrder: Number(e.target.value) }))} />
              </div>
              <div className="flex items-end gap-2">
                <Switch checked={form.isActive}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: !!v }))} id="slider-active" />
                <Label htmlFor="slider-active" className="m-0">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addMut.isPending || updateMut.isPending}>
              {form.id ? 'Save changes' : 'Add slider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete != null}
        onOpenChange={(v) => { if (!v) setConfirmDelete(null) }}
        title={`Delete "${confirmDelete?.title ?? ''}"?`}
        description="The slider will be removed from your homepage rotation."
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
      />
    </div>
  )
}

const EMPTY_BANK: BankDetailInput & { id?: number } = {
  bankName: '', accountNumber: '', ifsc: '', holderName: '', branchName: '', upi: '', isPrimary: false,
}
export function RestaurantBank() {
  const q = useRestaurantBankDetails()
  const addMut = useAddRestaurantBankDetail()
  const updateMut = useUpdateRestaurantBankDetail()
  const deleteMut = useDeleteRestaurantBankDetail()
  const data = q.data ?? []
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<BankDetailInput & { id?: number }>(EMPTY_BANK)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)

  const openCreate = () => { setForm(EMPTY_BANK); setOpen(true) }
  const openEdit = (b: RestaurantBankDetail) => {
    setForm({
      id: b.id,
      bankName: b.bankName ?? '',
      accountNumber: b.accountNumber ?? '',
      ifsc: b.ifsc ?? '',
      holderName: b.holderName ?? '',
      branchName: '',
      upi: b.upi ?? '',
      isPrimary: false,
    })
    setOpen(true)
  }

  const submit = async () => {
    if (!form.bankName.trim()) { toast.warning('Bank name is required'); return }
    if (!form.holderName.trim()) { toast.warning('Account holder name is required'); return }
    if (!/^\d{9,18}$/.test(form.accountNumber.trim())) { toast.warning('Account number must be 9-18 digits'); return }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifsc.trim())) { toast.warning('IFSC format invalid (e.g. HDFC0001234)'); return }
    const payload: BankDetailInput = {
      bankName: form.bankName.trim(),
      accountNumber: form.accountNumber.trim(),
      ifsc: form.ifsc.trim().toUpperCase(),
      holderName: form.holderName.trim(),
      branchName: form.branchName?.trim() || undefined,
      upi: form.upi?.trim() || undefined,
      isPrimary: form.isPrimary,
    }
    if (form.id != null) {
      const res = await updateMut.mutateAsync({ id: form.id, input: payload })
      if (res.ok) { toast.success('Bank account updated'); setOpen(false) } else toast.error(res.message)
    } else {
      const res = await addMut.mutateAsync(payload)
      if (res.ok) { toast.success('Bank account added'); setOpen(false) } else toast.error(res.message)
    }
  }

  const doDelete = async () => {
    if (!confirmDelete) return
    const res = await deleteMut.mutateAsync(confirmDelete.id)
    if (res.ok) toast.success('Bank account deleted')
    else toast.error(res.message)
    setConfirmDelete(null)
  }

  const columns = useMemo<ColumnDef<RestaurantBankDetail>[]>(() => [
    { accessorKey: 'bankName', header: 'Bank' },
    { accessorKey: 'holderName', header: 'Holder' },
    { accessorKey: 'accountNumber', header: 'Account', cell: ({ row }) => <span className="font-mono">{row.original.accountNumber ?? '—'}</span> },
    { accessorKey: 'ifsc', header: 'IFSC', cell: ({ row }) => <span className="font-mono">{row.original.ifsc ?? '—'}</span> },
    { accessorKey: 'upi', header: 'UPI', cell: ({ row }) => row.original.upi ?? '—' },
    {
      id: 'actions', header: '', cell: ({ row }) => (
        <div className="text-right space-x-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row.original)}><Pencil className="size-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete({ id: row.original.id, name: row.original.bankName ?? 'this account' })}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ], [])
  return (
    <div className="space-y-6">
      <PageHeader title="Bank Details" description={`Live · ${data.length} accounts`} breadcrumbs={crumb('Bank Details')}
        actions={<Button onClick={openCreate}><Plus className="size-4 mr-1" /> Add account</Button>} />
      <DataTable data={data} columns={columns} loading={q.isLoading} searchPlaceholder="Search bank or IFSC…" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? 'Edit bank account' : 'Add bank account'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Bank name</Label>
                <Input value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} placeholder="HDFC Bank" />
              </div>
              <div className="space-y-1.5">
                <Label required>Account holder</Label>
                <Input value={form.holderName} onChange={(e) => setForm((p) => ({ ...p, holderName: e.target.value }))} placeholder="As per bank records" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Account number</Label>
                <Input value={form.accountNumber}
                  onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 18) }))}
                  placeholder="9-18 digits" inputMode="numeric" />
              </div>
              <div className="space-y-1.5">
                <Label required>IFSC</Label>
                <Input value={form.ifsc} onChange={(e) => setForm((p) => ({ ...p, ifsc: e.target.value.toUpperCase().slice(0, 11) }))}
                  placeholder="HDFC0001234" className="font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Input value={form.branchName ?? ''} onChange={(e) => setForm((p) => ({ ...p, branchName: e.target.value }))} placeholder="e.g. Andheri West" />
              </div>
              <div className="space-y-1.5">
                <Label>UPI ID</Label>
                <Input value={form.upi ?? ''} onChange={(e) => setForm((p) => ({ ...p, upi: e.target.value }))} placeholder="restaurant@upi" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="bank-primary" checked={form.isPrimary ?? false}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isPrimary: !!v }))} />
              <Label htmlFor="bank-primary" className="m-0">Set as primary account</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addMut.isPending || updateMut.isPending}>
              {form.id ? 'Save changes' : 'Add account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete != null}
        onOpenChange={(v) => { if (!v) setConfirmDelete(null) }}
        title={`Delete "${confirmDelete?.name ?? ''}"?`}
        description="Payouts routed through this account will need a new destination."
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
      />
    </div>
  )
}

/**
 * Restaurant Orders — wired to `/api/restaurant/orders/history` via
 * `useRestaurantOrders`. When the backend route is unavailable, the service
 * falls back to a local sample list and the page surfaces a "Sample · backend
 * pending" badge so demo viewers can tell what's live vs scaffolded.
 */
export function RestaurantOrders() {
  const ordersQ = useRestaurantOrders()
  const resp = ordersQ.data
  const orders = resp?.orders ?? []
  const sample = resp?.sample !== false
  const columns = useMemo<ColumnDef<RestaurantOrder>[]>(() => [
    { accessorKey: 'orderNumber', header: 'Order', cell: ({ row }) => <span className="font-mono font-semibold">{row.original.orderNumber}</span> },
    { accessorKey: 'customerName', header: 'Customer', cell: ({ row }) => row.original.customerName ?? '—' },
    { accessorKey: 'orderType', header: 'Type', cell: ({ row }) => <Badge variant="secondary">{String(row.original.orderType).toLowerCase()}</Badge> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
      const s = row.original.status
      if (s === 'COMPLETED') return <Badge variant="success">Completed</Badge>
      if (s === 'CANCELLED') return <Badge variant="destructive">Cancelled</Badge>
      if (s === 'PREPARING_ORDER') return <Badge variant="warning">Cooking</Badge>
      if (s === 'READY_FOR_ORDER') return <Badge variant="info">Ready</Badge>
      return <Badge variant="secondary">{s}</Badge>
    } },
    { accessorKey: 'totalAmount', header: 'Amount', cell: ({ row }) => <span className="tabular-nums font-medium">₹{Number(row.original.totalAmount ?? row.original.amount ?? 0).toLocaleString('en-IN')}</span> },
    { accessorKey: 'createdAt', header: 'When', cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) },
  ], [])
  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        titleAdornment={sample ? <Badge variant="warning">Sample · backend pending</Badge> : <Badge variant="success">Live</Badge>}
        description={sample ? 'Backend /api/restaurant/orders/history route pending — showing local sample.' : 'Live · /api/restaurant/orders/history'}
        breadcrumbs={crumb('Orders')}
        actions={
          <>
            <Button variant="outline" onClick={() => void ordersQ.refetch()}><RefreshCw className={ordersQ.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh</Button>
            <Button><Plus className="size-4" /> New order</Button>
          </>
        }
      />
      <DataTable data={orders} columns={columns} loading={ordersQ.isLoading} searchPlaceholder="Search by order or customer…" />
    </div>
  )
}
export const RestaurantSettings = () => <SettingsShell title="Settings" breadcrumbs={crumb('Settings')} />
export const RestaurantReports = () => <ReportsShell title="Reports" breadcrumbs={crumb('Reports')} />
export function RestaurantOutstanding() {
  const q = useRestaurantOutstanding()
  return (
    <OutstandingList
      title="Outstanding"
      breadcrumbs={crumb('Outstanding')}
      data={q.data?.rows}
      loading={q.isLoading}
      sample={q.data?.sample !== false}
    />
  )
}
export const RestaurantWallet = CashierWalletTopup
export const RestaurantWithdrawals = WithdrawalRequest

interface LoanRow { id: number; name: string; amount: number; status: string; balance: number }
const LOAN_SAMPLE: LoanRow[] = [
  { id: 1, name: 'Spice Garden — Andheri', amount: 50000, status: 'Active', balance: 32000 },
  { id: 2, name: 'Spice Garden — Bandra', amount: 25000, status: 'Closed', balance: 0 },
]
export function Loans() {
  const columns = useMemo<ColumnDef<LoanRow>[]>(() => [
    { accessorKey: 'name', header: 'Borrower' },
    { accessorKey: 'amount', header: 'Principal', cell: ({ row }) => <span className="tabular-nums">₹{row.original.amount.toLocaleString('en-IN')}</span> },
    { accessorKey: 'balance', header: 'Balance', cell: ({ row }) => <span className="tabular-nums font-semibold">₹{row.original.balance.toLocaleString('en-IN')}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'Active' ? 'info' : 'secondary'}>{row.original.status}</Badge> },
  ], [])
  return (
    <div className="space-y-6">
      <PageHeader title="Loans" description="Loans across branches. Real /api/restaurant/loans endpoint pending." breadcrumbs={crumb('Loans')} actions={<Button><Plus className="size-4" /> New loan</Button>} />
      <DataTable data={LOAN_SAMPLE} columns={columns} searchPlaceholder="Search borrower…" />
    </div>
  )
}
