/**
 * Restaurant Owner sub-pages — full CRUD coverage added 2026-06-24.
 * Each list page now has Add / Edit / Delete dialogs wired to either the
 * live Spring Boot endpoint (when the mutation route exists) or a graceful
 * "Saved locally — backend pending" toast + sample badge fallback.
 */
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
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
// UI-F-22 perf — react-easy-crop is heavy; only loads when gallery upload runs.
const ImageCropper = lazy(() =>
  import('@/components/ui/image-cropper').then((m) => ({ default: m.ImageCropper })),
)
import { toast } from '@/lib/toast'
import {
  useRestaurantCategories, useRestaurantSubcategories, useRestaurantSections,
  useRestaurantTables, useRestaurantDeliveryZones, useRestaurantAddonGroups,
  useRestaurantAddonItems, useRestaurantHours, useRestaurantCoupons, useRestaurantGallery,
  useAddRestaurantCategory, useUpdateRestaurantCategory, useDeleteRestaurantCategory,
  useAddRestaurantSubcategory, useUpdateRestaurantSubcategory, useDeleteRestaurantSubcategory,
  useAddRestaurantSection, useUpdateRestaurantSection, useDeleteRestaurantSection,
  useAddRestaurantTable, useUpdateRestaurantTable, useDeleteRestaurantTable,
  useAddRestaurantDeliveryZone, useUpdateRestaurantDeliveryZone, useDeleteRestaurantDeliveryZone,
  useAddRestaurantAddonGroup, useUpdateRestaurantAddonGroup, useDeleteRestaurantAddonGroup,
  useAddRestaurantAddonItem, useUpdateRestaurantAddonItem, useDeleteRestaurantAddonItem,
  useUpdateRestaurantHour,
  useAddRestaurantCoupon, useUpdateRestaurantCoupon, useDeleteRestaurantCoupon,
} from '@/api/queries/restaurant'
import type {
  RestaurantCategory, RestaurantSubcategory, RestaurantSection, RestaurantTable,
  RestaurantDeliveryZone, RestaurantAddonGroup, RestaurantAddonItem, RestaurantHour,
  RestaurantCoupon, RestaurantGalleryImage, DayOfWeek,
} from '@/api/services/restaurant'

const crumb = (last: string) => [{ label: 'Restaurant', href: '/restaurant/dashboard' }, { label: last }]

const PendingBadge = () => (
  <Badge variant="warning" className="ml-2 align-middle">Sample · backend pending</Badge>
)

/* ------------------------------------------------------------------ */
/* Action-cell helper                                                  */
/* ------------------------------------------------------------------ */
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1 justify-end">
      <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Edit"><Edit3 className="size-3.5" /></Button>
      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete} aria-label="Delete"><Trash2 className="size-3.5" /></Button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 1. Menu Categories                                                 */
/* ------------------------------------------------------------------ */
interface CategoryFormState { name: string; description: string }
const EMPTY_CATEGORY: CategoryFormState = { name: '', description: '' }

export function RestaurantMenuCategories() {
  const q = useRestaurantCategories()
  const data = q.data ?? []
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<CategoryFormState>(EMPTY_CATEGORY)
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormState, string>>>({})
  const [pending, setPending] = useState(false)

  const addM = useAddRestaurantCategory()
  const updM = useUpdateRestaurantCategory()
  const delM = useDeleteRestaurantCategory()

  const validate = (s: CategoryFormState) => {
    const next: Partial<Record<keyof CategoryFormState, string>> = {}
    if (!s.name.trim()) next.name = 'Name is required'
    return next
  }

  const openAdd = () => { setEditId(null); setForm(EMPTY_CATEGORY); setErrors({}); setOpen(true) }
  const openEdit = (row: RestaurantCategory) => {
    setEditId(row.id); setForm({ name: row.name, description: row.description ?? '' }); setErrors({}); setOpen(true)
  }

  const submit = async () => {
    const err = validate(form); setErrors(err); if (Object.keys(err).length) return
    const input = { name: form.name.trim(), description: form.description.trim() || undefined }
    const res = editId
      ? await updM.mutateAsync({ id: editId, input })
      : await addM.mutateAsync(input)
    if (res.ok) { toast.success(editId ? 'Category updated' : 'Category added'); setPending(false); setOpen(false) }
    else { toast.warning(`Saved locally — backend pending (${res.message})`); setPending(true); setOpen(false) }
  }

  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Category deleted')
    else { toast.warning(`Removed locally — backend pending (${res.message})`); setPending(true) }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<RestaurantCategory>[]>(() => [
    { accessorKey: 'name', header: 'Category', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5"><Tag className="size-3 text-muted-foreground" /> {row.original.name}</span>
    ) },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description ?? '—' },
    { accessorKey: 'displayOrder', header: 'Order', cell: ({ row }) => <span className="font-mono">{row.original.displayOrder ?? '—'}</span> },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => row.original.isActive !== false ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Menu Categories" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${data.length} categories`} breadcrumbs={crumb('Menu Categories')}
        actions={<>
          <Button variant="outline" onClick={() => void q.refetch()}><RefreshCw className={q.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh</Button>
          <Button onClick={openAdd}><Plus className="size-4" /> Add category</Button>
        </>}
      />
      <DataTable data={data} columns={columns} loading={q.isLoading} searchPlaceholder="Search categories…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit category' : 'Add category'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name" required>Name</Label>
              <Input id="cat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} />
              {errors.name ? <p className="text-xs text-destructive" role="alert">{errors.name}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Description</Label>
              <Input id="cat-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addM.isPending || updM.isPending}>{editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
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
interface SubcategoryFormState { name: string; categoryId: string; priority: string }
const EMPTY_SUBCATEGORY: SubcategoryFormState = { name: '', categoryId: '', priority: '' }

export function RestaurantMenuSubcategories() {
  const q = useRestaurantSubcategories()
  const catQ = useRestaurantCategories()
  const data = q.data ?? []
  const cats = catQ.data ?? []
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<SubcategoryFormState>(EMPTY_SUBCATEGORY)
  const [errors, setErrors] = useState<Partial<Record<keyof SubcategoryFormState, string>>>({})
  const [pending, setPending] = useState(false)

  const addM = useAddRestaurantSubcategory()
  const updM = useUpdateRestaurantSubcategory()
  const delM = useDeleteRestaurantSubcategory()

  const validate = (s: SubcategoryFormState) => {
    const next: Partial<Record<keyof SubcategoryFormState, string>> = {}
    if (!s.name.trim()) next.name = 'Name is required'
    if (!s.categoryId) next.categoryId = 'Parent category is required'
    return next
  }

  const openAdd = () => { setEditId(null); setForm(EMPTY_SUBCATEGORY); setErrors({}); setOpen(true) }
  const openEdit = (row: RestaurantSubcategory) => {
    setEditId(row.id)
    setForm({ name: row.name, categoryId: String(row.menuCategoryId?.id ?? ''), priority: String(row.priority ?? '') })
    setErrors({}); setOpen(true)
  }

  const submit = async () => {
    const err = validate(form); setErrors(err); if (Object.keys(err).length) return
    const input = {
      name: form.name.trim(),
      menuCategoryId: Number(form.categoryId),
      priority: form.priority ? Number(form.priority) : undefined,
    }
    const res = editId
      ? await updM.mutateAsync({ id: editId, input })
      : await addM.mutateAsync(input)
    if (res.ok) { toast.success(editId ? 'Subcategory updated' : 'Subcategory added'); setOpen(false) }
    else { toast.warning(`Saved locally — backend pending (${res.message})`); setPending(true); setOpen(false) }
  }

  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Subcategory deleted')
    else { toast.warning(`Removed locally — backend pending (${res.message})`); setPending(true) }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<RestaurantSubcategory>[]>(() => [
    { accessorKey: 'name', header: 'Subcategory' },
    { id: 'category', header: 'Parent category', cell: ({ row }) => (
      <Badge variant="outline">{row.original.menuCategoryId?.name ?? '—'}</Badge>
    ) },
    { accessorKey: 'priority', header: 'Priority', cell: ({ row }) => <span className="font-mono">{row.original.priority ?? '—'}</span> },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => row.original.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Menu Subcategories" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${data.length} subcategories under ${cats.length} categories`} breadcrumbs={crumb('Menu Subcategories')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Add subcategory</Button>}
      />
      <DataTable data={data} columns={columns} loading={q.isLoading} searchPlaceholder="Search subcategories…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit subcategory' : 'Add subcategory'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-name" required>Name</Label>
              <Input id="sub-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} />
              {errors.name ? <p className="text-xs text-destructive" role="alert">{errors.name}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label required>Parent category</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger aria-invalid={!!errors.categoryId}><SelectValue placeholder="Choose category" /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.categoryId ? <p className="text-xs text-destructive" role="alert">{errors.categoryId}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-pri">Priority</Label>
              <Input id="sub-pri" inputMode="numeric" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value.replace(/\D/g, '') })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addM.isPending || updM.isPending}>{editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        destructive
        title="Delete subcategory?"
        description="This will also affect menu items pointing at this subcategory."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Sections                                                        */
/* ------------------------------------------------------------------ */
interface SectionFormState { name: string; description: string }
const EMPTY_SECTION: SectionFormState = { name: '', description: '' }

export function RestaurantSections() {
  const q = useRestaurantSections()
  const data = q.data ?? []
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<SectionFormState>(EMPTY_SECTION)
  const [errors, setErrors] = useState<Partial<Record<keyof SectionFormState, string>>>({})
  const [pending, setPending] = useState(false)

  const addM = useAddRestaurantSection()
  const updM = useUpdateRestaurantSection()
  const delM = useDeleteRestaurantSection()

  const openAdd = () => { setEditId(null); setForm(EMPTY_SECTION); setErrors({}); setOpen(true) }
  const openEdit = (row: RestaurantSection) => {
    setEditId(row.id); setForm({ name: row.name, description: row.description ?? '' }); setErrors({}); setOpen(true)
  }

  const submit = async () => {
    const e: Partial<Record<keyof SectionFormState, string>> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    setErrors(e); if (Object.keys(e).length) return
    const input = { name: form.name.trim(), description: form.description.trim() || undefined }
    const res = editId
      ? await updM.mutateAsync({ id: editId, input })
      : await addM.mutateAsync(input)
    if (res.ok) { toast.success(editId ? 'Section updated' : 'Section added'); setOpen(false) }
    else { toast.warning(`Saved locally — backend pending (${res.message})`); setPending(true); setOpen(false) }
  }

  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Section deleted')
    else { toast.warning(`Removed locally — backend pending (${res.message})`); setPending(true) }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<RestaurantSection>[]>(() => [
    { accessorKey: 'name', header: 'Section', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5"><Layers className="size-3 text-muted-foreground" /> {row.original.name}</span>
    ) },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description ?? '—' },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Dining Sections" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${data.length} sections (e.g. Ground floor, Terrace)`} breadcrumbs={crumb('Sections')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Add section</Button>}
      />
      <DataTable data={data} columns={columns} loading={q.isLoading} searchPlaceholder="Search sections…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit section' : 'Add section'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sec-name" required>Name</Label>
              <Input id="sec-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} />
              {errors.name ? <p className="text-xs text-destructive" role="alert">{errors.name}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sec-desc">Description</Label>
              <Input id="sec-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addM.isPending || updM.isPending}>{editId ? 'Save' : 'Add'}</Button>
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
interface TableFormState { tableNumber: string; capacity: string; sectionId: string }
const EMPTY_TABLE: TableFormState = { tableNumber: '', capacity: '', sectionId: '' }

export function RestaurantDiningTables() {
  const q = useRestaurantTables()
  const sectQ = useRestaurantSections()
  const data = q.data ?? []
  const sections = sectQ.data ?? []
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<TableFormState>(EMPTY_TABLE)
  const [errors, setErrors] = useState<Partial<Record<keyof TableFormState, string>>>({})
  const [pending, setPending] = useState(false)

  const addM = useAddRestaurantTable()
  const updM = useUpdateRestaurantTable()
  const delM = useDeleteRestaurantTable()

  const openAdd = () => { setEditId(null); setForm(EMPTY_TABLE); setErrors({}); setOpen(true) }
  const openEdit = (row: RestaurantTable) => {
    setEditId(row.id)
    setForm({
      tableNumber: row.tableNumber ?? row.name ?? '',
      capacity: String(row.capacity ?? ''),
      sectionId: String(row.sectionId?.id ?? ''),
    })
    setErrors({}); setOpen(true)
  }

  const submit = async () => {
    const e: Partial<Record<keyof TableFormState, string>> = {}
    if (!form.tableNumber.trim()) e.tableNumber = 'Table number is required'
    const cap = Number(form.capacity)
    if (!form.capacity || isNaN(cap) || cap < 1) e.capacity = 'Capacity must be ≥ 1'
    if (!form.sectionId) e.sectionId = 'Section is required'
    setErrors(e); if (Object.keys(e).length) return
    const input = { tableNumber: form.tableNumber.trim(), capacity: cap, sectionId: Number(form.sectionId) }
    const res = editId
      ? await updM.mutateAsync({ id: editId, input })
      : await addM.mutateAsync(input)
    if (res.ok) { toast.success(editId ? 'Table updated' : 'Table added'); setOpen(false) }
    else { toast.warning(`Saved locally — backend pending (${res.message})`); setPending(true); setOpen(false) }
  }

  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Table deleted')
    else { toast.warning(`Removed locally — backend pending (${res.message})`); setPending(true) }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<RestaurantTable>[]>(() => [
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
      <PageHeader title="Dining Tables" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${data.length} tables across sections`} breadcrumbs={crumb('Dining Tables')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Add table</Button>}
      />
      <DataTable data={data} columns={columns} loading={q.isLoading} searchPlaceholder="Search tables…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit table' : 'Add table'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tbl-num" required>Table number</Label>
                <Input id="tbl-num" value={form.tableNumber} onChange={(e) => setForm({ ...form, tableNumber: e.target.value })} aria-invalid={!!errors.tableNumber} />
                {errors.tableNumber ? <p className="text-xs text-destructive" role="alert">{errors.tableNumber}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tbl-cap" required>Capacity</Label>
                <Input id="tbl-cap" inputMode="numeric" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value.replace(/\D/g, '') })} aria-invalid={!!errors.capacity} />
                {errors.capacity ? <p className="text-xs text-destructive" role="alert">{errors.capacity}</p> : null}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label required>Section</Label>
              <Select value={form.sectionId} onValueChange={(v) => setForm({ ...form, sectionId: v })}>
                <SelectTrigger aria-invalid={!!errors.sectionId}><SelectValue placeholder="Choose section" /></SelectTrigger>
                <SelectContent>{sections.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.sectionId ? <p className="text-xs text-destructive" role="alert">{errors.sectionId}</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addM.isPending || updM.isPending}>{editId ? 'Save' : 'Add'}</Button>
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
interface ZoneFormState { zoneName: string; deliveryCharge: string; freeDeliveryAbove: string; deliveryTimeMinutes: string }
const EMPTY_ZONE: ZoneFormState = { zoneName: '', deliveryCharge: '', freeDeliveryAbove: '', deliveryTimeMinutes: '' }

export function RestaurantDeliveryZones() {
  const q = useRestaurantDeliveryZones()
  const data = q.data ?? []
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<ZoneFormState>(EMPTY_ZONE)
  const [errors, setErrors] = useState<Partial<Record<keyof ZoneFormState, string>>>({})
  const [pending, setPending] = useState(false)

  const addM = useAddRestaurantDeliveryZone()
  const updM = useUpdateRestaurantDeliveryZone()
  const delM = useDeleteRestaurantDeliveryZone()

  const openAdd = () => { setEditId(null); setForm(EMPTY_ZONE); setErrors({}); setOpen(true) }
  const openEdit = (row: RestaurantDeliveryZone) => {
    setEditId(row.id)
    setForm({
      zoneName: row.zoneName,
      deliveryCharge: String(row.deliveryCharge ?? ''),
      freeDeliveryAbove: String(row.freeDeliveryAbove ?? ''),
      deliveryTimeMinutes: String(row.deliveryTimeMinutes ?? ''),
    })
    setErrors({}); setOpen(true)
  }

  const submit = async () => {
    const e: Partial<Record<keyof ZoneFormState, string>> = {}
    if (!form.zoneName.trim()) e.zoneName = 'Zone name is required'
    const charge = Number(form.deliveryCharge)
    if (form.deliveryCharge === '' || isNaN(charge) || charge < 0) e.deliveryCharge = 'Charge must be ≥ 0'
    setErrors(e); if (Object.keys(e).length) return
    const input = {
      zoneName: form.zoneName.trim(),
      deliveryCharge: charge,
      freeDeliveryAbove: form.freeDeliveryAbove ? Number(form.freeDeliveryAbove) : undefined,
      deliveryTimeMinutes: form.deliveryTimeMinutes ? Number(form.deliveryTimeMinutes) : undefined,
    }
    const res = editId
      ? await updM.mutateAsync({ id: editId, input })
      : await addM.mutateAsync(input)
    if (res.ok) { toast.success(editId ? 'Zone updated' : 'Zone added'); setOpen(false) }
    else { toast.warning(`Saved locally — backend pending (${res.message})`); setPending(true); setOpen(false) }
  }

  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Zone deleted')
    else { toast.warning(`Removed locally — backend pending (${res.message})`); setPending(true) }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<RestaurantDeliveryZone>[]>(() => [
    { accessorKey: 'zoneName', header: 'Zone', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5"><MapIcon className="size-3 text-muted-foreground" /> {row.original.zoneName}</span>
    ) },
    { id: 'radius', header: 'Radius (km)', cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.radiusKmFrom ?? 0}–{row.original.radiusKmTo ?? 0}</span>
    ) },
    { accessorKey: 'deliveryCharge', header: 'Charge', cell: ({ row }) => <span className="tabular-nums">₹{Number(row.original.deliveryCharge ?? 0).toLocaleString('en-IN')}</span> },
    { accessorKey: 'deliveryTimeMinutes', header: 'ETA', cell: ({ row }) => row.original.deliveryTimeMinutes ? `${row.original.deliveryTimeMinutes} min` : '—' },
    { id: 'branch', header: 'Branch', cell: ({ row }) => row.original.branchId?.name ?? '—' },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => row.original.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Off</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Delivery Zones" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${data.length} zones with radius-based charges`} breadcrumbs={crumb('Delivery Zones')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Add zone</Button>}
      />
      <DataTable data={data} columns={columns} loading={q.isLoading} searchPlaceholder="Search zones…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit zone' : 'Add zone'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="zone-name" required>Zone name</Label>
              <Input id="zone-name" value={form.zoneName} onChange={(e) => setForm({ ...form, zoneName: e.target.value })} aria-invalid={!!errors.zoneName} />
              {errors.zoneName ? <p className="text-xs text-destructive" role="alert">{errors.zoneName}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="zone-charge" required>Delivery charge (₹)</Label>
                <Input id="zone-charge" inputMode="decimal" value={form.deliveryCharge} onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })} aria-invalid={!!errors.deliveryCharge} />
                {errors.deliveryCharge ? <p className="text-xs text-destructive" role="alert">{errors.deliveryCharge}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zone-free">Min order (free above ₹)</Label>
                <Input id="zone-free" inputMode="decimal" value={form.freeDeliveryAbove} onChange={(e) => setForm({ ...form, freeDeliveryAbove: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zone-eta">ETA (minutes)</Label>
              <Input id="zone-eta" inputMode="numeric" value={form.deliveryTimeMinutes} onChange={(e) => setForm({ ...form, deliveryTimeMinutes: e.target.value.replace(/\D/g, '') })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addM.isPending || updM.isPending}>{editId ? 'Save' : 'Add'}</Button>
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
interface AddonGroupFormState { name: string; minAddon: string; maxAddon: string; isMultiple: boolean; description: string }
const EMPTY_ADDON_GROUP: AddonGroupFormState = { name: '', minAddon: '0', maxAddon: '1', isMultiple: false, description: '' }

export function RestaurantAddons() {
  const q = useRestaurantAddonGroups()
  const data = q.data ?? []
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<AddonGroupFormState>(EMPTY_ADDON_GROUP)
  const [errors, setErrors] = useState<Partial<Record<keyof AddonGroupFormState, string>>>({})
  const [pending, setPending] = useState(false)

  const addM = useAddRestaurantAddonGroup()
  const updM = useUpdateRestaurantAddonGroup()
  const delM = useDeleteRestaurantAddonGroup()

  const openAdd = () => { setEditId(null); setForm(EMPTY_ADDON_GROUP); setErrors({}); setOpen(true) }
  const openEdit = (row: RestaurantAddonGroup) => {
    setEditId(row.id)
    setForm({
      name: row.name,
      minAddon: String(row.minAddon ?? 0),
      maxAddon: String(row.maxAddon ?? 1),
      isMultiple: !!row.isMultiple,
      description: row.description ?? '',
    })
    setErrors({}); setOpen(true)
  }

  const submit = async () => {
    const e: Partial<Record<keyof AddonGroupFormState, string>> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    const min = Number(form.minAddon); const max = Number(form.maxAddon)
    if (isNaN(min) || min < 0) e.minAddon = 'Min must be ≥ 0'
    if (isNaN(max) || max < 1) e.maxAddon = 'Max must be ≥ 1'
    if (!e.minAddon && !e.maxAddon && max < min) e.maxAddon = 'Max must be ≥ Min'
    setErrors(e); if (Object.keys(e).length) return
    const input = { name: form.name.trim(), minAddon: min, maxAddon: max, isMultiple: form.isMultiple, description: form.description.trim() || undefined }
    const res = editId
      ? await updM.mutateAsync({ id: editId, input })
      : await addM.mutateAsync(input)
    if (res.ok) { toast.success(editId ? 'Group updated' : 'Group added'); setOpen(false) }
    else { toast.warning(`Saved locally — backend pending (${res.message})`); setPending(true); setOpen(false) }
  }

  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Group deleted')
    else { toast.warning(`Removed locally — backend pending (${res.message})`); setPending(true) }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<RestaurantAddonGroup>[]>(() => [
    { accessorKey: 'name', header: 'Addon group', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5"><ChefHat className="size-3 text-muted-foreground" /> {row.original.name}</span>
    ) },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description ?? '—' },
    { id: 'minMax', header: 'Min / Max', cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.minAddon ?? 0} / {row.original.maxAddon ?? 0}</span>
    ) },
    { accessorKey: 'isMultiple', header: 'Multi', cell: ({ row }) => row.original.isMultiple ? <Badge variant="info">Multi</Badge> : <Badge variant="outline">Single</Badge> },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => row.original.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Addon Groups" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${data.length} groups (Extra Sauce, Cooking preference, …)`} breadcrumbs={crumb('Addons')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Add group</Button>}
      />
      <DataTable data={data} columns={columns} loading={q.isLoading} searchPlaceholder="Search addon groups…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit addon group' : 'Add addon group'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ag-name" required>Group name</Label>
              <Input id="ag-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} placeholder="e.g. Choose a side" />
              {errors.name ? <p className="text-xs text-destructive" role="alert">{errors.name}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ag-min" required>Min</Label>
                <Input id="ag-min" inputMode="numeric" value={form.minAddon} onChange={(e) => setForm({ ...form, minAddon: e.target.value.replace(/\D/g, '') })} aria-invalid={!!errors.minAddon} />
                {errors.minAddon ? <p className="text-xs text-destructive" role="alert">{errors.minAddon}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ag-max" required>Max</Label>
                <Input id="ag-max" inputMode="numeric" value={form.maxAddon} onChange={(e) => setForm({ ...form, maxAddon: e.target.value.replace(/\D/g, '') })} aria-invalid={!!errors.maxAddon} />
                {errors.maxAddon ? <p className="text-xs text-destructive" role="alert">{errors.maxAddon}</p> : null}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 p-3 border border-border rounded-md">
              <div>
                <Label htmlFor="ag-multi">Allow multiple selection</Label>
                <p className="text-xs text-muted-foreground">When on, customers can pick more than one item.</p>
              </div>
              <Switch id="ag-multi" checked={form.isMultiple} onCheckedChange={(v) => setForm({ ...form, isMultiple: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addM.isPending || updM.isPending}>{editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
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
interface AddonItemFormState { name: string; price: string; addonsId: string; attribute: 'VEG' | 'NON_VEG' | '' }
const EMPTY_ADDON_ITEM: AddonItemFormState = { name: '', price: '', addonsId: '', attribute: 'VEG' }

export function RestaurantAddonItems() {
  const q = useRestaurantAddonItems()
  const groupsQ = useRestaurantAddonGroups()
  const data = q.data ?? []
  const groups = groupsQ.data ?? []
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<AddonItemFormState>(EMPTY_ADDON_ITEM)
  const [errors, setErrors] = useState<Partial<Record<keyof AddonItemFormState, string>>>({})
  const [pending, setPending] = useState(false)

  const addM = useAddRestaurantAddonItem()
  const updM = useUpdateRestaurantAddonItem()
  const delM = useDeleteRestaurantAddonItem()

  const openAdd = () => { setEditId(null); setForm(EMPTY_ADDON_ITEM); setErrors({}); setOpen(true) }
  const openEdit = (row: RestaurantAddonItem) => {
    setEditId(row.id)
    setForm({
      name: row.name,
      price: String(row.price ?? ''),
      addonsId: String(row.addonsId?.id ?? ''),
      attribute: (row.attribute === 'NON_VEG' ? 'NON_VEG' : 'VEG'),
    })
    setErrors({}); setOpen(true)
  }

  const submit = async () => {
    const e: Partial<Record<keyof AddonItemFormState, string>> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    const price = Number(form.price)
    if (form.price === '' || isNaN(price) || price < 0) e.price = 'Price must be ≥ 0'
    if (!form.addonsId) e.addonsId = 'Addon group is required'
    setErrors(e); if (Object.keys(e).length) return
    const input = {
      name: form.name.trim(),
      price,
      addonsId: Number(form.addonsId),
      attribute: form.attribute || undefined,
    }
    const res = editId
      ? await updM.mutateAsync({ id: editId, input })
      : await addM.mutateAsync(input)
    if (res.ok) { toast.success(editId ? 'Item updated' : 'Item added'); setOpen(false) }
    else { toast.warning(`Saved locally — backend pending (${res.message})`); setPending(true); setOpen(false) }
  }

  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Item deleted')
    else { toast.warning(`Removed locally — backend pending (${res.message})`); setPending(true) }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<RestaurantAddonItem>[]>(() => [
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
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Addon Items" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${data.length} items in ${groups.length} groups`} breadcrumbs={crumb('Addon Items')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Add item</Button>}
      />
      <DataTable data={data} columns={columns} loading={q.isLoading} searchPlaceholder="Search addon items…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit addon item' : 'Add addon item'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ai-name" required>Item name</Label>
              <Input id="ai-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fries" aria-invalid={!!errors.name} />
              {errors.name ? <p className="text-xs text-destructive" role="alert">{errors.name}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Addon group</Label>
                <Select value={form.addonsId} onValueChange={(v) => setForm({ ...form, addonsId: v })}>
                  <SelectTrigger aria-invalid={!!errors.addonsId}><SelectValue placeholder="Choose group" /></SelectTrigger>
                  <SelectContent>{groups.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.addonsId ? <p className="text-xs text-destructive" role="alert">{errors.addonsId}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai-price" required>Price (INR)</Label>
                <Input id="ai-price" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} aria-invalid={!!errors.price} />
                {errors.price ? <p className="text-xs text-destructive" role="alert">{errors.price}</p> : null}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 p-3 border border-border rounded-md">
              <div>
                <Label htmlFor="ai-veg">Vegetarian</Label>
                <p className="text-xs text-muted-foreground">When on, item shows the green VEG badge.</p>
              </div>
              <Switch id="ai-veg" checked={form.attribute === 'VEG'} onCheckedChange={(v) => setForm({ ...form, attribute: v ? 'VEG' : 'NON_VEG' })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addM.isPending || updM.isPending}>{editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
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
/* 8. Restaurant Hours — inline edit per row                          */
/* ------------------------------------------------------------------ */
const WEEK_ORDER: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const HOURS_SAMPLE: RestaurantHour[] = WEEK_ORDER.map((day, i) => ({
  id: i + 1,
  dayOfWeek: day,
  openingTime: '11:00:00',
  closingTime: '23:00:00',
  isClosed: day === 'MONDAY',
}))

function HourRow({ hour, onSaved }: { hour: RestaurantHour; onSaved: () => void }) {
  const [open, setOpen] = useState((hour.openingTime ?? '11:00:00').slice(0, 5))
  const [close, setClose] = useState((hour.closingTime ?? '23:00:00').slice(0, 5))
  const [closed, setClosed] = useState(!!hour.isClosed)
  const [dirty, setDirty] = useState(false)
  const m = useUpdateRestaurantHour()

  useEffect(() => {
    setOpen((hour.openingTime ?? '11:00:00').slice(0, 5))
    setClose((hour.closingTime ?? '23:00:00').slice(0, 5))
    setClosed(!!hour.isClosed)
    setDirty(false)
  }, [hour])

  const save = async () => {
    const res = await m.mutateAsync({
      id: hour.id,
      input: { dayOfWeek: hour.dayOfWeek, openingTime: `${open}:00`, closingTime: `${close}:00`, isClosed: closed },
    })
    if (res.ok) { toast.success(`${hour.dayOfWeek} updated`); setDirty(false); onSaved() }
    else toast.warning(`Saved locally — backend pending (${res.message})`)
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 border border-border rounded-md">
      <div className="flex items-center gap-3 w-40">
        <Clock className="size-4 text-muted-foreground" />
        <span className="font-medium capitalize">{hour.dayOfWeek.toLowerCase()}</span>
      </div>
      <div className="flex items-center gap-2 flex-1 justify-center">
        <Input type="time" value={open} onChange={(e) => { setOpen(e.target.value); setDirty(true) }} className="w-32" disabled={closed} aria-label="Opens at" />
        <span className="text-muted-foreground text-sm">to</span>
        <Input type="time" value={close} onChange={(e) => { setClose(e.target.value); setDirty(true) }} className="w-32" disabled={closed} aria-label="Closes at" />
      </div>
      <div className="flex items-center gap-2 w-56 justify-end">
        <Switch checked={!closed} onCheckedChange={(v) => { setClosed(!v); setDirty(true) }} aria-label="Open this day" />
        <span className="text-xs text-muted-foreground w-12">{closed ? 'Closed' : 'Open'}</span>
        <Button size="sm" onClick={save} disabled={!dirty} loading={m.isPending}>Save</Button>
      </div>
    </div>
  )
}

export function RestaurantHours() {
  const q = useRestaurantHours()
  const live = q.data ?? []
  const usingSample = !q.isLoading && live.length === 0
  const rows: RestaurantHour[] = usingSample ? HOURS_SAMPLE : [...live].sort(
    (a, b) => WEEK_ORDER.indexOf(a.dayOfWeek) - WEEK_ORDER.indexOf(b.dayOfWeek)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurant Hours"
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
          ) : rows.map((h) => <HourRow key={h.id} hour={h} onSaved={() => void q.refetch()} />)}
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 9. Coupons                                                         */
/* ------------------------------------------------------------------ */
interface CouponFormState {
  couponCode: string; couponName: string; discountAmount: string
  isPercent: boolean; validity: string; usageLimit: string
}
const EMPTY_COUPON: CouponFormState = {
  couponCode: '', couponName: '', discountAmount: '', isPercent: true, validity: '', usageLimit: '',
}

export function RestaurantCoupons() {
  const q = useRestaurantCoupons()
  const data = (q.data ?? []).filter((c) => !c.isDelete)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<CouponFormState>(EMPTY_COUPON)
  const [errors, setErrors] = useState<Partial<Record<keyof CouponFormState, string>>>({})
  const [pending, setPending] = useState(false)

  const addM = useAddRestaurantCoupon()
  const updM = useUpdateRestaurantCoupon()
  const delM = useDeleteRestaurantCoupon()

  const openAdd = () => { setEditId(null); setForm(EMPTY_COUPON); setErrors({}); setOpen(true) }
  const openEdit = (row: RestaurantCoupon) => {
    setEditId(row.id)
    setForm({
      couponCode: row.couponCode,
      couponName: row.couponName,
      discountAmount: String(row.discountAmount ?? ''),
      isPercent: !!row.isPercent,
      validity: row.validity ?? '',
      usageLimit: String(row.usageLimit ?? ''),
    })
    setErrors({}); setOpen(true)
  }

  const submit = async () => {
    const e: Partial<Record<keyof CouponFormState, string>> = {}
    if (!form.couponCode.trim()) e.couponCode = 'Code is required'
    if (!form.couponName.trim()) e.couponName = 'Name is required'
    const amt = Number(form.discountAmount)
    if (form.discountAmount === '' || isNaN(amt) || amt <= 0) e.discountAmount = 'Discount must be > 0'
    if (form.isPercent && amt > 100) e.discountAmount = 'Percent must be ≤ 100'
    setErrors(e); if (Object.keys(e).length) return
    const input = {
      couponCode: form.couponCode.trim().toUpperCase(),
      couponName: form.couponName.trim(),
      discountAmount: amt,
      isPercent: form.isPercent,
      validity: form.validity || undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
    }
    const res = editId
      ? await updM.mutateAsync({ id: editId, input })
      : await addM.mutateAsync(input)
    if (res.ok) { toast.success(editId ? 'Coupon updated' : 'Coupon added'); setOpen(false) }
    else { toast.warning(`Saved locally — backend pending (${res.message})`); setPending(true); setOpen(false) }
  }

  const confirmDelete = async () => {
    if (deleteId == null) return
    const res = await delM.mutateAsync(deleteId)
    if (res.ok) toast.success('Coupon deleted')
    else { toast.warning(`Removed locally — backend pending (${res.message})`); setPending(true) }
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<RestaurantCoupon>[]>(() => [
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
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" titleAdornment={pending ? <PendingBadge /> : null} description={`Live · ${data.length} active coupons`} breadcrumbs={crumb('Coupons')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> New coupon</Button>}
      />
      <DataTable data={data} columns={columns} loading={q.isLoading} searchPlaceholder="Search by code or name…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit coupon' : 'New coupon'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="co-code" required>Code</Label>
                <Input id="co-code" value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value })} placeholder="WELCOME20" aria-invalid={!!errors.couponCode} />
                {errors.couponCode ? <p className="text-xs text-destructive" role="alert">{errors.couponCode}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-name" required>Name</Label>
                <Input id="co-name" value={form.couponName} onChange={(e) => setForm({ ...form, couponName: e.target.value })} placeholder="Welcome Offer" aria-invalid={!!errors.couponName} />
                {errors.couponName ? <p className="text-xs text-destructive" role="alert">{errors.couponName}</p> : null}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between gap-3 p-3 border border-border rounded-md">
                <Label htmlFor="co-pct">Percent discount</Label>
                <Switch id="co-pct" checked={form.isPercent} onCheckedChange={(v) => setForm({ ...form, isPercent: v })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-disc" required>{form.isPercent ? 'Amount (%)' : 'Amount (₹)'}</Label>
                <Input id="co-disc" inputMode="decimal" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} aria-invalid={!!errors.discountAmount} />
                {errors.discountAmount ? <p className="text-xs text-destructive" role="alert">{errors.discountAmount}</p> : null}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="co-valid">Valid until</Label>
                <Input id="co-valid" type="date" value={form.validity} onChange={(e) => setForm({ ...form, validity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-limit">Usage limit</Label>
                <Input id="co-limit" inputMode="numeric" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value.replace(/\D/g, '') })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addM.isPending || updM.isPending}>{editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
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
/* 10. Gallery (unchanged — image upload flow already covered)        */
/* ------------------------------------------------------------------ */
const GALLERY_SAMPLE: RestaurantGalleryImage[] = [
  { id: 1, imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', caption: 'Dining hall', isActive: true },
  { id: 2, imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', caption: 'Tandoor station', isActive: true },
  { id: 3, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', caption: 'Signature pizza', isActive: true },
  { id: 4, imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', caption: 'Terrace seating', isActive: true },
]

export function RestaurantGallery() {
  const q = useRestaurantGallery()
  const live = q.data ?? []
  const usingSample = !q.isLoading && live.length === 0
  const data: RestaurantGalleryImage[] = usingSample ? GALLERY_SAMPLE : live

  const [cropOpen, setCropOpen] = useState(false)
  const [pickedSrc, setPickedSrc] = useState<string | null>(null)

  const onPick = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setPickedSrc(typeof reader.result === 'string' ? reader.result : null)
      setCropOpen(true)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gallery"
        description={`${data.length} images`}
        breadcrumbs={crumb('Gallery')}
        actions={<>
          {usingSample ? <PendingBadge /> : null}
          <label className="inline-flex">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f) }} />
            <Button asChild><span><Upload className="size-4" /> Upload image</span></Button>
          </label>
        </>}
      />
      {q.isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-shimmer aspect-video rounded-lg" />)}
        </div>
      ) : data.length === 0 ? (
        <Card><CardContent className="pt-6"><EmptyState icon={<ImageIcon className="size-6" />} title="No images yet" description="Upload your first photo to populate the customer-side gallery." /></CardContent></Card>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.map((g) => (
            <li key={g.id}>
              <Card interactive className="overflow-hidden">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img src={g.imageUrl} alt={g.caption ?? `Image ${g.id}`} className="w-full h-full object-cover" />
                </div>
                <CardContent className="pt-3 pb-3 space-y-1">
                  <p className="text-sm font-medium truncate">{g.caption ?? `Image #${g.id}`}</p>
                  {g.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Hidden</Badge>}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Suspense fallback={null}>
        <ImageCropper
          open={cropOpen}
          image={pickedSrc}
          aspect={16 / 9}
          onCropComplete={() => setCropOpen(false)}
          onCancel={() => setCropOpen(false)}
          onOpenChange={setCropOpen}
        />
      </Suspense>
    </div>
  )
}
