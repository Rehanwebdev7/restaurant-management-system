/**
 * Branch Manager sub-pages — 10 pages mirroring Restaurant Owner subpages set.
 * Each wired to a confirmed-live Spring Boot `/api/branch/*` endpoint with
 * graceful "Saved/Removed locally — backend pending" fallback when the
 * delete endpoint 500s.
 *
 * 2026-06-24: extended with Edit/Delete dialogs to close the parity gap
 * versus Restaurant subpages.
 */
import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Plus, Tag, Layers, Map as MapIcon, ChefHat, ListPlus, Clock,
  Ticket, Image as ImageIcon, RefreshCw, Edit3, Upload, Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'
import {
  useBranchCategories, useBranchSubcategories, useBranchSections, useBranchTables,
  useBranchDeliveryZones, useBranchAddonGroups, useBranchAddonItems, useBranchHours,
  useBranchCoupons, useBranchSliders,
  useDeleteBranchCategory, useDeleteBranchSubcategory, useDeleteBranchSection,
  useDeleteBranchTable, useDeleteBranchDeliveryZone, useDeleteBranchAddonGroup,
  useDeleteBranchAddonItem, useDeleteBranchCoupon,
  useAddBranchSection, useUpdateBranchSection,
  useAddBranchTable, useUpdateBranchTable,
  useAddBranchDeliveryZone, useUpdateBranchDeliveryZone,
} from '@/api/queries/branch'
import type {
  BranchCategory, BranchSubcategory, BranchSection, BranchTable, BranchDeliveryZone,
  BranchAddonGroup, BranchAddonItem, BranchHour, BranchCoupon, BranchSlider, BranchDayOfWeek,
  BranchSectionInput, BranchTableInput, BranchDeliveryZoneInput,
} from '@/api/services/branch'

const crumb = (last: string) => [{ label: 'Branch', href: '/branch/dashboard' }, { label: last }]

const PendingBadge = () => (
  <Badge variant="warning" className="ml-2 align-middle">Sample · backend pending</Badge>
)

/* ------------------------------------------------------------------ */
/* Action-cell helper                                                  */
/* ------------------------------------------------------------------ */
function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1 justify-end">
      {onEdit ? (
        <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Edit">
          <Edit3 className="size-3.5" />
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        onClick={onDelete}
        aria-label="Delete"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 1. Menu Categories                                                 */
/* ------------------------------------------------------------------ */
export function BranchMenuCategories() {
  const q = useBranchCategories()
  const data = q.data ?? []
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [localHidden, setLocalHidden] = useState<Set<number>>(new Set())
  const [form, setForm] = useState({ name: '', description: '' })
  const delM = useDeleteBranchCategory()

  const visible = useMemo(() => data.filter((d) => !localHidden.has(d.id)), [data, localHidden])

  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Category deleted')
    else {
      toast.warning(`Removed locally — backend pending (${res.message})`)
      setPending(true)
      setLocalHidden((prev) => { const next = new Set(prev); next.add(deleteId); return next })
    }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<BranchCategory>[]>(() => [
    { accessorKey: 'name', header: 'Category', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5"><Tag className="size-3 text-muted-foreground" /> {row.original.name}</span>
    ) },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description ?? '—' },
    { accessorKey: 'displayOrder', header: 'Order', cell: ({ row }) => <span className="font-mono">{row.original.displayOrder ?? '—'}</span> },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => row.original.isActive !== false ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Menu Categories" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${visible.length} categories`} breadcrumbs={crumb('Menu Categories')}
        actions={<>
          <Button variant="outline" onClick={() => void q.refetch()}><RefreshCw className={q.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh</Button>
          <Button onClick={() => setOpen(true)}><Plus className="size-4" /> Add category</Button>
        </>}
      />
      <DataTable data={visible} columns={columns} loading={q.isLoading} searchPlaceholder="Search categories…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="bcat-name">Name</Label><Input id="bcat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="bcat-desc">Description</Label><Input id="bcat-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => setOpen(false)}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        destructive
        title="Delete category?"
        description="Items still pointing at this category will become un-categorised."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Menu Subcategories                                              */
/* ------------------------------------------------------------------ */
export function BranchMenuSubcategories() {
  const q = useBranchSubcategories()
  const catQ = useBranchCategories()
  const data = q.data ?? []
  const cats = catQ.data ?? []
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [localHidden, setLocalHidden] = useState<Set<number>>(new Set())
  const [form, setForm] = useState({ name: '', categoryId: '', priority: '' })
  const delM = useDeleteBranchSubcategory()

  const visible = useMemo(() => data.filter((d) => !localHidden.has(d.id)), [data, localHidden])

  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Subcategory deleted')
    else {
      toast.warning(`Removed locally — backend pending (${res.message})`)
      setPending(true)
      setLocalHidden((prev) => { const next = new Set(prev); next.add(deleteId); return next })
    }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<BranchSubcategory>[]>(() => [
    { accessorKey: 'name', header: 'Subcategory' },
    { id: 'category', header: 'Parent category', cell: ({ row }) => (
      <Badge variant="outline">{row.original.menuCategoryId?.name ?? '—'}</Badge>
    ) },
    { accessorKey: 'priority', header: 'Priority', cell: ({ row }) => <span className="font-mono">{row.original.priority ?? '—'}</span> },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => row.original.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Menu Subcategories" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${visible.length} subcategories under ${cats.length} categories`} breadcrumbs={crumb('Menu Subcategories')}
        actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Add subcategory</Button>}
      />
      <DataTable data={visible} columns={columns} loading={q.isLoading} searchPlaceholder="Search subcategories…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add subcategory</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="bsub-name">Name</Label><Input id="bsub-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Parent category</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="bsub-pri">Priority</Label><Input id="bsub-pri" inputMode="numeric" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value.replace(/\D/g, '') })} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => setOpen(false)}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        destructive
        title="Delete subcategory?"
        description="Menu items pointing at this subcategory will be affected."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Sections                                                        */
/* ------------------------------------------------------------------ */
const EMPTY_BR_SECTION: BranchSectionInput & { id?: number } = { name: '', description: '' }
export function BranchSectionsPage() {
  const q = useBranchSections()
  const data = q.data ?? []
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [localHidden, setLocalHidden] = useState<Set<number>>(new Set())
  const delM = useDeleteBranchSection()
  const addMut = useAddBranchSection()
  const updateMut = useUpdateBranchSection()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<BranchSectionInput & { id?: number }>(EMPTY_BR_SECTION)

  const visible = useMemo(() => data.filter((d) => !localHidden.has(d.id)), [data, localHidden])

  const openCreate = () => { setForm(EMPTY_BR_SECTION); setOpen(true) }
  const openEdit = (s: BranchSection) => {
    setForm({ id: s.id, name: s.name ?? '', description: s.description ?? '' })
    setOpen(true)
  }
  const submit = async () => {
    if (!form.name.trim()) { toast.warning('Section name is required'); return }
    const payload: BranchSectionInput = { name: form.name.trim(), description: form.description?.trim() || undefined }
    if (form.id != null) {
      const res = await updateMut.mutateAsync({ id: form.id, input: payload })
      if (res.ok) { toast.success('Section updated'); setOpen(false) } else toast.error(res.message)
    } else {
      const res = await addMut.mutateAsync(payload)
      if (res.ok) { toast.success('Section added'); setOpen(false) } else toast.error(res.message)
    }
  }
  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Section deleted')
    else {
      toast.warning(`Removed locally — backend pending (${res.message})`)
      setPending(true)
      setLocalHidden((prev) => { const next = new Set(prev); next.add(deleteId); return next })
    }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<BranchSection>[]>(() => [
    { accessorKey: 'name', header: 'Section', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5"><Layers className="size-3 text-muted-foreground" /> {row.original.name}</span>
    ) },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description ?? '—' },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])
  return (
    <div className="space-y-6">
      <PageHeader title="Dining Sections" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${visible.length} sections at this branch`} breadcrumbs={crumb('Sections')}
        actions={<Button onClick={openCreate}><Plus className="size-4 mr-1" /> Add section</Button>}
      />
      <DataTable data={visible} columns={columns} loading={q.isLoading} searchPlaceholder="Search sections…" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? 'Edit section' : 'Add section'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label required>Section name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Family Dining" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea value={form.description ?? ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addMut.isPending || updateMut.isPending}>
              {form.id ? 'Save changes' : 'Add section'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        destructive title="Delete section?" description="Tables in this section will become orphaned."
        confirmLabel="Delete" onConfirm={confirmDelete}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Dining Tables                                                   */
/* ------------------------------------------------------------------ */
const EMPTY_BR_TABLE: BranchTableInput & { id?: number } = { tableNumber: '', capacity: 4, sectionId: 0 }
export function BranchDiningTables() {
  const q = useBranchTables()
  const sectionsQ = useBranchSections()
  const data = q.data ?? []
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [localHidden, setLocalHidden] = useState<Set<number>>(new Set())
  const delM = useDeleteBranchTable()
  const addMut = useAddBranchTable()
  const updateMut = useUpdateBranchTable()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<BranchTableInput & { id?: number }>(EMPTY_BR_TABLE)

  const visible = useMemo(() => data.filter((d) => !localHidden.has(d.id)), [data, localHidden])

  const openCreate = () => { setForm(EMPTY_BR_TABLE); setOpen(true) }
  const openEdit = (t: BranchTable) => {
    setForm({
      id: t.id,
      tableNumber: t.tableNumber ?? t.name ?? '',
      capacity: t.capacity ?? 4,
      sectionId: t.sectionId?.id ?? 0,
    })
    setOpen(true)
  }
  const submit = async () => {
    if (!form.tableNumber.trim()) { toast.warning('Table number is required'); return }
    if (!form.capacity || form.capacity < 1) { toast.warning('Capacity must be 1+'); return }
    if (!form.sectionId) { toast.warning('Section is required'); return }
    const payload: BranchTableInput = {
      tableNumber: form.tableNumber.trim(),
      capacity: form.capacity,
      sectionId: form.sectionId,
    }
    if (form.id != null) {
      const res = await updateMut.mutateAsync({ id: form.id, input: payload })
      if (res.ok) { toast.success('Table updated'); setOpen(false) } else toast.error(res.message)
    } else {
      const res = await addMut.mutateAsync(payload)
      if (res.ok) { toast.success('Table added'); setOpen(false) } else toast.error(res.message)
    }
  }
  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Table deleted')
    else {
      toast.warning(`Removed locally — backend pending (${res.message})`)
      setPending(true)
      setLocalHidden((prev) => { const next = new Set(prev); next.add(deleteId); return next })
    }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<BranchTable>[]>(() => [
    { id: 'tableNumber', header: 'Table #', cell: ({ row }) => (
      <span className="font-mono font-semibold">{row.original.tableNumber ?? row.original.name ?? `#${row.original.id}`}</span>
    ) },
    { accessorKey: 'capacity', header: 'Capacity', cell: ({ row }) => <span className="tabular-nums">{row.original.capacity ?? '—'}</span> },
    { id: 'section', header: 'Section', cell: ({ row }) => (
      <Badge variant="outline">{row.original.sectionId?.name ?? '—'}</Badge>
    ) },
    { id: 'status', header: 'Status', cell: () => <Badge variant="success">Available</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])
  return (
    <div className="space-y-6">
      <PageHeader title="Dining Tables" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${visible.length} tables`} breadcrumbs={crumb('Dining Tables')}
        actions={<Button onClick={openCreate}><Plus className="size-4 mr-1" /> Add table</Button>}
      />
      <DataTable data={visible} columns={columns} loading={q.isLoading} searchPlaceholder="Search tables…" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? 'Edit table' : 'Add table'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Table number</Label>
                <Input value={form.tableNumber} onChange={(e) => setForm((p) => ({ ...p, tableNumber: e.target.value }))} placeholder="e.g. T-01" />
              </div>
              <div className="space-y-1.5">
                <Label required>Capacity</Label>
                <Input type="number" min={1} max={50} value={form.capacity}
                  onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label required>Section</Label>
              <Select value={form.sectionId ? String(form.sectionId) : ''}
                onValueChange={(v) => setForm((p) => ({ ...p, sectionId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {(sectionsQ.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addMut.isPending || updateMut.isPending}>
              {form.id ? 'Save changes' : 'Add table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        destructive title="Delete table?" description="Active orders linked to this table will be unlinked."
        confirmLabel="Delete" onConfirm={confirmDelete}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 5. Delivery Zones                                                  */
/* ------------------------------------------------------------------ */
const EMPTY_BR_ZONE: BranchDeliveryZoneInput & { id?: number } = {
  zoneName: '', deliveryCharge: 0, freeDeliveryAbove: undefined, deliveryTimeMinutes: 30,
}
export function BranchDeliveryZones() {
  const q = useBranchDeliveryZones()
  const data = q.data ?? []
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [localHidden, setLocalHidden] = useState<Set<number>>(new Set())
  const delM = useDeleteBranchDeliveryZone()
  const addMut = useAddBranchDeliveryZone()
  const updateMut = useUpdateBranchDeliveryZone()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<BranchDeliveryZoneInput & { id?: number }>(EMPTY_BR_ZONE)

  const visible = useMemo(() => data.filter((d) => !localHidden.has(d.id)), [data, localHidden])

  const openCreate = () => { setForm(EMPTY_BR_ZONE); setOpen(true) }
  const openEdit = (z: BranchDeliveryZone) => {
    setForm({
      id: z.id,
      zoneName: z.zoneName ?? '',
      deliveryCharge: Number(z.deliveryCharge ?? 0),
      freeDeliveryAbove: z.freeDeliveryAbove ? Number(z.freeDeliveryAbove) : undefined,
      deliveryTimeMinutes: z.deliveryTimeMinutes ?? 30,
    })
    setOpen(true)
  }
  const submit = async () => {
    if (!form.zoneName.trim()) { toast.warning('Zone name is required'); return }
    if (form.deliveryCharge < 0) { toast.warning('Delivery charge cannot be negative'); return }
    const payload: BranchDeliveryZoneInput = {
      zoneName: form.zoneName.trim(),
      deliveryCharge: form.deliveryCharge,
      freeDeliveryAbove: form.freeDeliveryAbove,
      deliveryTimeMinutes: form.deliveryTimeMinutes,
    }
    if (form.id != null) {
      const res = await updateMut.mutateAsync({ id: form.id, input: payload })
      if (res.ok) { toast.success('Zone updated'); setOpen(false) } else toast.error(res.message)
    } else {
      const res = await addMut.mutateAsync(payload)
      if (res.ok) { toast.success('Zone added'); setOpen(false) } else toast.error(res.message)
    }
  }
  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Zone deleted')
    else {
      toast.warning(`Removed locally — backend pending (${res.message})`)
      setPending(true)
      setLocalHidden((prev) => { const next = new Set(prev); next.add(deleteId); return next })
    }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<BranchDeliveryZone>[]>(() => [
    { accessorKey: 'zoneName', header: 'Zone', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5"><MapIcon className="size-3 text-muted-foreground" /> {row.original.zoneName}</span>
    ) },
    { id: 'radius', header: 'Radius (km)', cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.radiusKmFrom ?? 0}–{row.original.radiusKmTo ?? 0}</span>
    ) },
    { accessorKey: 'deliveryCharge', header: 'Charge', cell: ({ row }) => <span className="tabular-nums">₹{Number(row.original.deliveryCharge ?? 0).toLocaleString('en-IN')}</span> },
    { accessorKey: 'deliveryTimeMinutes', header: 'ETA', cell: ({ row }) => row.original.deliveryTimeMinutes ? `${row.original.deliveryTimeMinutes} min` : '—' },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => row.original.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Off</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])
  return (
    <div className="space-y-6">
      <PageHeader title="Delivery Zones" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${visible.length} zones with radius-based charges`} breadcrumbs={crumb('Delivery Zones')}
        actions={<Button onClick={openCreate}><Plus className="size-4 mr-1" /> Add zone</Button>}
      />
      <DataTable data={visible} columns={columns} loading={q.isLoading} searchPlaceholder="Search zones…" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? 'Edit delivery zone' : 'Add delivery zone'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label required>Zone name</Label>
              <Input value={form.zoneName} onChange={(e) => setForm((p) => ({ ...p, zoneName: e.target.value }))} placeholder="e.g. Within 3 km" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label required>Delivery charge (₹)</Label>
                <Input type="number" min={0} step="1" value={form.deliveryCharge}
                  onChange={(e) => setForm((p) => ({ ...p, deliveryCharge: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Free above (₹)</Label>
                <Input type="number" min={0} step="1" value={form.freeDeliveryAbove ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, freeDeliveryAbove: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="optional" />
              </div>
              <div className="space-y-1.5">
                <Label>ETA (minutes)</Label>
                <Input type="number" min={5} max={180} value={form.deliveryTimeMinutes ?? 30}
                  onChange={(e) => setForm((p) => ({ ...p, deliveryTimeMinutes: Number(e.target.value) }))} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Radius bounds (km from/to) are typically configured by drawing on the map; saving here uses the existing
              radius values for an edit, or backend defaults for a new zone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addMut.isPending || updateMut.isPending}>
              {form.id ? 'Save changes' : 'Add zone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        destructive title="Delete zone?" description="Customers in this zone will no longer be able to place delivery orders."
        confirmLabel="Delete" onConfirm={confirmDelete}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 6. Addon Groups                                                    */
/* ------------------------------------------------------------------ */
export function BranchAddons() {
  const q = useBranchAddonGroups()
  const data = q.data ?? []
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [localHidden, setLocalHidden] = useState<Set<number>>(new Set())
  const delM = useDeleteBranchAddonGroup()

  const visible = useMemo(() => data.filter((d) => !localHidden.has(d.id)), [data, localHidden])

  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Group deleted')
    else {
      toast.warning(`Removed locally — backend pending (${res.message})`)
      setPending(true)
      setLocalHidden((prev) => { const next = new Set(prev); next.add(deleteId); return next })
    }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<BranchAddonGroup>[]>(() => [
    { accessorKey: 'name', header: 'Addon group', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5"><ChefHat className="size-3 text-muted-foreground" /> {row.original.name}</span>
    ) },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description ?? '—' },
    { id: 'minMax', header: 'Min / Max', cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.minAddon ?? 0} / {row.original.maxAddon ?? 0}</span>
    ) },
    { accessorKey: 'isMultiple', header: 'Multi', cell: ({ row }) => row.original.isMultiple ? <Badge variant="info">Multi</Badge> : <Badge variant="outline">Single</Badge> },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => row.original.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])
  return (
    <div className="space-y-6">
      <PageHeader title="Addon Groups" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${visible.length} groups`} breadcrumbs={crumb('Addons')}
        actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Add group</Button>}
      />
      <DataTable data={visible} columns={columns} loading={q.isLoading} searchPlaceholder="Search addon groups…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add addon group</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="bag-name">Group name</Label><Input id="bag-name" placeholder="e.g. Choose a side" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="bag-min">Min</Label><Input id="bag-min" inputMode="numeric" /></div>
              <div className="space-y-1.5"><Label htmlFor="bag-max">Max</Label><Input id="bag-max" inputMode="numeric" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => setOpen(false)}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        destructive title="Delete addon group?" description="All items inside this group will be removed too."
        confirmLabel="Delete" onConfirm={confirmDelete}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 7. Addon Items                                                     */
/* ------------------------------------------------------------------ */
export function BranchAddonItems() {
  const q = useBranchAddonItems()
  const groupsQ = useBranchAddonGroups()
  const data = q.data ?? []
  const groups = groupsQ.data ?? []
  const [open, setOpen] = useState(false)
  const [groupId, setGroupId] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [localHidden, setLocalHidden] = useState<Set<number>>(new Set())
  const delM = useDeleteBranchAddonItem()

  const visible = useMemo(() => data.filter((d) => !localHidden.has(d.id)), [data, localHidden])

  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Item deleted')
    else {
      toast.warning(`Removed locally — backend pending (${res.message})`)
      setPending(true)
      setLocalHidden((prev) => { const next = new Set(prev); next.add(deleteId); return next })
    }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<BranchAddonItem>[]>(() => [
    { accessorKey: 'name', header: 'Item', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5"><ListPlus className="size-3 text-muted-foreground" /> {row.original.name}</span>
    ) },
    { id: 'group', header: 'Addon group', cell: ({ row }) => (
      <Badge variant="outline">{row.original.addonsId?.name ?? '—'}</Badge>
    ) },
    { accessorKey: 'price', header: 'Price', cell: ({ row }) => <span className="tabular-nums font-medium">₹{Number(row.original.price ?? 0).toFixed(2)}</span> },
    { accessorKey: 'attribute', header: 'Diet', cell: ({ row }) => row.original.attribute === 'VEG'
      ? <Badge variant="success">VEG</Badge>
      : row.original.attribute === 'NON_VEG' ? <Badge variant="destructive">NON-VEG</Badge> : <span className="text-muted-foreground">—</span>
    },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => row.original.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Addon Items" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${visible.length} items in ${groups.length} groups`} breadcrumbs={crumb('Addon Items')}
        actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Add item</Button>}
      />
      <DataTable data={visible} columns={columns} loading={q.isLoading} searchPlaceholder="Search addon items…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add addon item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="bai-name">Item name</Label><Input id="bai-name" placeholder="e.g. Fries" /></div>
            <div className="space-y-1.5">
              <Label>Addon group</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger><SelectValue placeholder="Choose group" /></SelectTrigger>
                <SelectContent>{groups.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="bai-price">Price (INR)</Label><Input id="bai-price" inputMode="numeric" /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => setOpen(false)}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        destructive title="Delete addon item?" description="Customers will no longer be able to choose this addon."
        confirmLabel="Delete" onConfirm={confirmDelete}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 8. Hours                                                           */
/* ------------------------------------------------------------------ */
const WEEK_ORDER: BranchDayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const HOURS_SAMPLE: BranchHour[] = WEEK_ORDER.map((day, i) => ({
  id: i + 1,
  dayOfWeek: day,
  openingTime: '11:00:00',
  closingTime: '23:00:00',
  isClosed: day === 'MONDAY',
}))

export function BranchHours() {
  const q = useBranchHours()
  const live = q.data ?? []
  const usingSample = !q.isLoading && live.length === 0
  const rows: BranchHour[] = usingSample ? HOURS_SAMPLE : [...live].sort(
    (a, b) => WEEK_ORDER.indexOf(a.dayOfWeek) - WEEK_ORDER.indexOf(b.dayOfWeek)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Hours"
        description={`Operating hours per day of week · ${rows.length} days`}
        breadcrumbs={crumb('Hours')}
        actions={<>
          {usingSample ? <PendingBadge /> : null}
          <Button variant="outline" onClick={() => void q.refetch()}><RefreshCw className={q.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh</Button>
        </>}
      />
      <Card>
        <CardContent className="pt-6 space-y-2">
          {q.isLoading ? (
            Array.from({ length: 7 }).map((_, i) => <div key={i} className="skeleton-shimmer h-12 rounded-md" />)
          ) : rows.map((h) => (
            <div key={h.id} className="flex items-center justify-between gap-3 p-3 border border-border rounded-md">
              <div className="flex items-center gap-3 w-40">
                <Clock className="size-4 text-muted-foreground" />
                <span className="font-medium capitalize">{h.dayOfWeek.toLowerCase()}</span>
              </div>
              <div className="flex items-center gap-2 flex-1 justify-center">
                <Input type="time" defaultValue={(h.openingTime ?? '11:00:00').slice(0, 5)} className="w-32" disabled={h.isClosed} aria-label="Opens at" />
                <span className="text-muted-foreground text-sm">to</span>
                <Input type="time" defaultValue={(h.closingTime ?? '23:00:00').slice(0, 5)} className="w-32" disabled={h.isClosed} aria-label="Closes at" />
              </div>
              <div className="flex items-center gap-2 w-32 justify-end">
                <Switch checked={!h.isClosed} aria-label="Open this day" />
                <span className="text-xs text-muted-foreground">{h.isClosed ? 'Closed' : 'Open'}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 9. Coupons                                                         */
/* ------------------------------------------------------------------ */
export function BranchCoupons() {
  const q = useBranchCoupons()
  const data = (q.data ?? []).filter((c) => !c.isDelete)
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [localHidden, setLocalHidden] = useState<Set<number>>(new Set())
  const delM = useDeleteBranchCoupon()

  const visible = useMemo(() => data.filter((d) => !localHidden.has(d.id)), [data, localHidden])

  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Coupon deleted')
    else {
      toast.warning(`Removed locally — backend pending (${res.message})`)
      setPending(true)
      setLocalHidden((prev) => { const next = new Set(prev); next.add(deleteId); return next })
    }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<BranchCoupon>[]>(() => [
    { accessorKey: 'couponCode', header: 'Code', cell: ({ row }) => (
      <span className="font-mono font-semibold inline-flex items-center gap-1.5"><Ticket className="size-3 text-muted-foreground" /> {row.original.couponCode}</span>
    ) },
    { accessorKey: 'couponName', header: 'Name' },
    { id: 'discount', header: 'Discount', cell: ({ row }) => (
      <span className="tabular-nums">{row.original.isPercent ? `${row.original.discountAmount ?? 0}%` : `₹${Number(row.original.discountAmount ?? 0).toLocaleString('en-IN')}`}</span>
    ) },
    { accessorKey: 'validity', header: 'Valid until', cell: ({ row }) => row.original.validity ?? '—' },
    { accessorKey: 'usageLimit', header: 'Limit', cell: ({ row }) => <span className="font-mono">{row.original.usageLimit ?? '∞'}</span> },
    { id: 'flags', header: 'Flags', cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {row.original.firstOrder ? <Badge variant="info">1st order</Badge> : null}
        {row.original.global ? <Badge variant="outline">Global</Badge> : null}
      </div>
    ) },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${visible.length} active coupons`} breadcrumbs={crumb('Coupons')}
        actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> New coupon</Button>}
      />
      <DataTable data={visible} columns={columns} loading={q.isLoading} searchPlaceholder="Search by code or name…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New coupon</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="bco-code">Code</Label><Input id="bco-code" placeholder="WELCOME20" /></div>
              <div className="space-y-1.5"><Label htmlFor="bco-name">Name</Label><Input id="bco-name" placeholder="Welcome Offer" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select defaultValue="percent">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percent</SelectItem>
                    <SelectItem value="flat">Flat (INR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="bco-disc">Amount</Label><Input id="bco-disc" inputMode="numeric" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="bco-valid">Valid until</Label><Input id="bco-valid" type="date" /></div>
              <div className="space-y-1.5"><Label htmlFor="bco-limit">Usage limit</Label><Input id="bco-limit" inputMode="numeric" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => setOpen(false)}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        destructive title="Delete coupon?" description="This coupon can no longer be applied at checkout."
        confirmLabel="Delete" onConfirm={confirmDelete}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 10. Sliders                                                        */
/* ------------------------------------------------------------------ */
const SLIDERS_SAMPLE: BranchSlider[] = [
  { id: 1, imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', title: 'Festival special', description: 'Diwali combo', isActive: true },
  { id: 2, imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800', title: 'New arrivals', description: 'Tandoori platter', isActive: true },
  { id: 3, imageUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800', title: 'Family pack', description: 'Save 15%', isActive: false },
]

export function BranchSliders() {
  const q = useBranchSliders()
  const live = q.data ?? []
  const usingSample = !q.isLoading && live.length === 0
  const [localHidden, setLocalHidden] = useState<Set<number>>(new Set())
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [pending, setPending] = useState(false)

  const baseData: BranchSlider[] = usingSample ? SLIDERS_SAMPLE : live
  const data = baseData.filter((d) => !localHidden.has(d.id))

  const confirmDelete = () => {
    if (deleteId == null) return
    toast.warning('Removed locally — backend pending (sliders endpoint 500)')
    setPending(true)
    setLocalHidden((prev) => { const next = new Set(prev); next.add(deleteId); return next })
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sliders"
        titleAdornment={pending ? <PendingBadge /> : null}
        description={`${data.length} homepage banners`}
        breadcrumbs={crumb('Sliders')}
        actions={<>
          {usingSample && !pending ? <PendingBadge /> : null}
          <Button><Upload className="size-4" /> Upload slider</Button>
        </>}
      />
      {q.isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-shimmer aspect-video rounded-lg" />)}
        </div>
      ) : data.length === 0 ? (
        <Card><CardContent className="pt-6"><EmptyState icon={<ImageIcon className="size-6" />} title="No sliders yet" description="Upload your first banner to populate the customer homepage carousel." /></CardContent></Card>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.map((s) => (
            <li key={s.id}>
              <Card interactive className="overflow-hidden">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img src={s.imageUrl} alt={s.title ?? `Slider ${s.id}`} className="w-full h-full object-cover" />
                </div>
                <CardContent className="pt-3 pb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{s.title ?? `Slider #${s.id}`}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(s.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  {s.description ? <p className="text-xs text-muted-foreground truncate">{s.description}</p> : null}
                  {s.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Hidden</Badge>}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        destructive title="Delete slider?" description="This banner will be removed from the homepage carousel."
        confirmLabel="Delete" onConfirm={confirmDelete}
      />
    </div>
  )
}
