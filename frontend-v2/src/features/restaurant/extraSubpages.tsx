/**
 * Restaurant Owner extra sub-pages — added 2026-06-25.
 *
 * Closes the next-10 legacy-parity gap (variants, addon mappings, inventory,
 * vendors, POs, expenses, P&L, audit trail, API keys, notification prefs).
 *
 * Probe results (2026-06-25, backend offline locally — treated as 500):
 *   • GET /api/restaurant/menu_item_variants/all     — pending
 *   • GET /api/restaurant/menu_item_addons/all       — pending
 *   • GET /api/restaurant/audit-logs/all             — pending
 *
 * All 10 pages render with sample data + "Sample · backend pending" badge.
 * Each page kept under ~120 LOC by reusing the shared CRUD pattern + helpers
 * from `subpages.tsx` (RowActions, PendingBadge re-implemented locally to keep
 * this file standalone-importable by the lazy router).
 */
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { DateRange } from 'react-day-picker'
import {
  Plus, Edit3, Trash2, Layers, Package, Truck, FileText, Wallet,
  TrendingUp, ShieldAlert, Key, Bell, Copy,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DateRangeField } from '@/components/ui/date-field'
import { StatCard } from '@/components/ui/stat-card'
import { toast } from '@/lib/toast'
import {
  useRestaurantMenuItems, useRestaurantAddonGroups,
} from '@/api/queries/restaurant'

const crumb = (last: string) => [
  { label: 'Restaurant', href: '/restaurant/dashboard' },
  { label: last },
]

const PendingBadge = () => (
  <Badge variant="warning" className="ml-2 align-middle">Sample · backend pending</Badge>
)

function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-1 justify-end">
      {onEdit ? (
        <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Edit"><Edit3 className="size-3.5" /></Button>
      ) : null}
      {onDelete ? (
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete} aria-label="Delete"><Trash2 className="size-3.5" /></Button>
      ) : null}
    </div>
  )
}

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const fmtDate = (iso: string) => iso.slice(0, 10)
const newId = () => Math.floor(Math.random() * 9_000_000) + 1_000_000

/* ============================================================== */
/* 1. Menu Variants                                                */
/* ============================================================== */
interface Variant { id: number; menuItemId: number; menuItemName: string; basePrice: number; halfPrice: number | null; qtrPrice: number | null }
const VARIANT_SAMPLE: Variant[] = [
  { id: 1, menuItemId: 101, menuItemName: 'Paneer Butter Masala', basePrice: 320, halfPrice: 180, qtrPrice: null },
  { id: 2, menuItemId: 102, menuItemName: 'Dal Makhani', basePrice: 240, halfPrice: 140, qtrPrice: 80 },
  { id: 3, menuItemId: 103, menuItemName: 'Chicken Tikka', basePrice: 380, halfPrice: 220, qtrPrice: null },
  { id: 4, menuItemId: 104, menuItemName: 'Butter Naan', basePrice: 60, halfPrice: null, qtrPrice: null },
]

interface VariantForm { menuItemId: string; menuItemName: string; basePrice: string; halfPrice: string; qtrPrice: string }
const EMPTY_VARIANT: VariantForm = { menuItemId: '', menuItemName: '', basePrice: '', halfPrice: '', qtrPrice: '' }

export function RestaurantMenuVariants() {
  const itemsQ = useRestaurantMenuItems()
  const items = itemsQ.data ?? []
  const [rows, setRows] = useState<Variant[]>(VARIANT_SAMPLE)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<VariantForm>(EMPTY_VARIANT)

  const openAdd = () => { setEditId(null); setForm(EMPTY_VARIANT); setOpen(true) }
  const openEdit = (v: Variant) => {
    setEditId(v.id)
    setForm({
      menuItemId: String(v.menuItemId), menuItemName: v.menuItemName,
      basePrice: String(v.basePrice), halfPrice: v.halfPrice == null ? '' : String(v.halfPrice),
      qtrPrice: v.qtrPrice == null ? '' : String(v.qtrPrice),
    })
    setOpen(true)
  }

  const submit = () => {
    if (!form.menuItemId || !form.basePrice) { toast.warning('Pick item + base price'); return }
    const picked = items.find((i) => String(i.id) === form.menuItemId)
    const next: Variant = {
      id: editId ?? newId(),
      menuItemId: Number(form.menuItemId),
      menuItemName: picked?.name ?? form.menuItemName ?? `Item #${form.menuItemId}`,
      basePrice: Number(form.basePrice),
      halfPrice: form.halfPrice ? Number(form.halfPrice) : null,
      qtrPrice: form.qtrPrice ? Number(form.qtrPrice) : null,
    }
    setRows((prev) => editId ? prev.map((r) => r.id === editId ? next : r) : [next, ...prev])
    toast.warning('Saved locally — backend pending')
    setOpen(false)
  }

  const columns = useMemo<ColumnDef<Variant>[]>(() => [
    { accessorKey: 'menuItemName', header: 'Menu item', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5"><Layers className="size-3 text-muted-foreground" /> {row.original.menuItemName}</span>
    ) },
    { accessorKey: 'basePrice', header: 'Base (full)', cell: ({ row }) => <span className="tabular-nums font-medium">{fmtINR(row.original.basePrice)}</span> },
    { accessorKey: 'halfPrice', header: 'Half', cell: ({ row }) => row.original.halfPrice != null ? <span className="tabular-nums">{fmtINR(row.original.halfPrice)}</span> : <span className="text-muted-foreground">—</span> },
    { accessorKey: 'qtrPrice', header: 'Quarter', cell: ({ row }) => row.original.qtrPrice != null ? <span className="tabular-nums">{fmtINR(row.original.qtrPrice)}</span> : <span className="text-muted-foreground">—</span> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [items])

  return (
    <div className="space-y-6">
      <PageHeader title="Menu Variants" titleAdornment={<PendingBadge />} description={`${rows.length} variants across ${items.length || 'sample'} menu items`} breadcrumbs={crumb('Menu Variants')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Add variant</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search variants…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit variant' : 'Add variant'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label required>Menu item</Label>
              <Select value={form.menuItemId} onValueChange={(v) => setForm({ ...form, menuItemId: v })}>
                <SelectTrigger><SelectValue placeholder="Choose item" /></SelectTrigger>
                <SelectContent>
                  {items.length === 0 ? (
                    VARIANT_SAMPLE.map((v) => <SelectItem key={v.menuItemId} value={String(v.menuItemId)}>{v.menuItemName}</SelectItem>)
                  ) : items.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label required>Base ₹</Label>
                <Input inputMode="decimal" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Half ₹</Label>
                <Input inputMode="decimal" value={form.halfPrice} onChange={(e) => setForm({ ...form, halfPrice: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Quarter ₹</Label>
                <Input inputMode="decimal" value={form.qtrPrice} onChange={(e) => setForm({ ...form, qtrPrice: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteId != null} onOpenChange={(o) => { if (!o) setDeleteId(null) }} destructive
        title="Delete variant?" description="Customers will only see base price after this." confirmLabel="Delete"
        onConfirm={() => { setRows((r) => r.filter((v) => v.id !== deleteId)); toast.warning('Removed locally — backend pending'); setDeleteId(null) }} />
    </div>
  )
}

/* ============================================================== */
/* 2. Item ↔ Addon Group mappings                                  */
/* ============================================================== */
interface ItemAddon { id: number; menuItemId: number; menuItemName: string; addonGroupIds: number[]; addonGroupNames: string[] }
const ITEM_ADDON_SAMPLE: ItemAddon[] = [
  { id: 1, menuItemId: 101, menuItemName: 'Paneer Butter Masala', addonGroupIds: [1, 2], addonGroupNames: ['Extra sauce', 'Spice level'] },
  { id: 2, menuItemId: 103, menuItemName: 'Chicken Tikka', addonGroupIds: [2, 3], addonGroupNames: ['Spice level', 'Side choice'] },
  { id: 3, menuItemId: 104, menuItemName: 'Butter Naan', addonGroupIds: [4], addonGroupNames: ['Extra butter'] },
]

export function RestaurantItemAddons() {
  const itemsQ = useRestaurantMenuItems()
  const groupsQ = useRestaurantAddonGroups()
  const items = itemsQ.data ?? []
  const groups = groupsQ.data ?? []
  const [rows, setRows] = useState<ItemAddon[]>(ITEM_ADDON_SAMPLE)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [pickedItem, setPickedItem] = useState<string>('')
  const [pickedGroups, setPickedGroups] = useState<Set<number>>(new Set())

  const openAdd = () => { setEditId(null); setPickedItem(''); setPickedGroups(new Set()); setOpen(true) }
  const openEdit = (m: ItemAddon) => {
    setEditId(m.id); setPickedItem(String(m.menuItemId)); setPickedGroups(new Set(m.addonGroupIds)); setOpen(true)
  }

  const submit = () => {
    if (!pickedItem || pickedGroups.size === 0) { toast.warning('Pick item + at least one group'); return }
    const itemRec = items.find((i) => String(i.id) === pickedItem)
    const ids = Array.from(pickedGroups)
    const names = ids.map((id) => groups.find((g) => g.id === id)?.name ?? ITEM_ADDON_SAMPLE.flatMap((s) => s.addonGroupNames.map((n, i) => ({ id: s.addonGroupIds[i], n }))).find((x) => x.id === id)?.n ?? `Group #${id}`)
    const next: ItemAddon = {
      id: editId ?? newId(),
      menuItemId: Number(pickedItem),
      menuItemName: itemRec?.name ?? ITEM_ADDON_SAMPLE.find((s) => s.menuItemId === Number(pickedItem))?.menuItemName ?? `Item #${pickedItem}`,
      addonGroupIds: ids,
      addonGroupNames: names,
    }
    setRows((prev) => editId ? prev.map((r) => r.id === editId ? next : r) : [next, ...prev])
    toast.warning('Saved locally — backend pending')
    setOpen(false)
  }

  const toggleGroup = (id: number) => {
    setPickedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const columns = useMemo<ColumnDef<ItemAddon>[]>(() => [
    { accessorKey: 'menuItemName', header: 'Menu item' },
    { id: 'groups', header: 'Addon groups', cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.addonGroupNames.map((n) => <Badge key={n} variant="outline">{n}</Badge>)}
      </div>
    ) },
    { id: 'count', header: 'Count', cell: ({ row }) => <span className="font-mono">{row.original.addonGroupIds.length}</span> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  const itemOptions = items.length > 0
    ? items.map((i) => ({ id: i.id, name: i.name }))
    : ITEM_ADDON_SAMPLE.map((s) => ({ id: s.menuItemId, name: s.menuItemName }))
  const groupOptions = groups.length > 0
    ? groups.map((g) => ({ id: g.id, name: g.name }))
    : [{ id: 1, name: 'Extra sauce' }, { id: 2, name: 'Spice level' }, { id: 3, name: 'Side choice' }, { id: 4, name: 'Extra butter' }]

  return (
    <div className="space-y-6">
      <PageHeader title="Item Addons" titleAdornment={<PendingBadge />} description={`${rows.length} mappings · ${itemOptions.length} items × ${groupOptions.length} groups`} breadcrumbs={crumb('Item Addons')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Map item</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search items…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editId ? 'Edit mapping' : 'Map item to addon groups'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Menu item</Label>
              <div className="border border-border rounded-md max-h-72 overflow-y-auto">
                {itemOptions.map((i) => (
                  <button key={i.id} type="button" onClick={() => setPickedItem(String(i.id))}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 ${pickedItem === String(i.id) ? 'bg-primary/10 font-medium' : ''}`}>
                    {i.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Addon groups</Label>
              <div className="border border-border rounded-md max-h-72 overflow-y-auto p-2 space-y-1">
                {groupOptions.map((g) => (
                  <label key={g.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer">
                    <span className="text-sm">{g.name}</span>
                    <Switch checked={pickedGroups.has(g.id)} onCheckedChange={() => toggleGroup(g.id)} />
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editId ? 'Save' : 'Map'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteId != null} onOpenChange={(o) => { if (!o) setDeleteId(null) }} destructive
        title="Remove mapping?" description="Customers will no longer see these addon options for this item." confirmLabel="Remove"
        onConfirm={() => { setRows((r) => r.filter((m) => m.id !== deleteId)); toast.warning('Removed locally — backend pending'); setDeleteId(null) }} />
    </div>
  )
}

/* ============================================================== */
/* 3. Inventory                                                    */
/* ============================================================== */
interface Inv { id: number; name: string; stock: number; threshold: number; unit: string; updatedAt: string }
const INV_SAMPLE: Inv[] = [
  { id: 1, name: 'Paneer (kg)', stock: 18, threshold: 5, unit: 'kg', updatedAt: new Date(Date.now() - 2 * 3600_000).toISOString() },
  { id: 2, name: 'Tomatoes (kg)', stock: 4, threshold: 8, unit: 'kg', updatedAt: new Date(Date.now() - 5 * 3600_000).toISOString() },
  { id: 3, name: 'Chicken (kg)', stock: 0, threshold: 6, unit: 'kg', updatedAt: new Date(Date.now() - 24 * 3600_000).toISOString() },
  { id: 4, name: 'Wheat flour (kg)', stock: 42, threshold: 10, unit: 'kg', updatedAt: new Date(Date.now() - 6 * 3600_000).toISOString() },
  { id: 5, name: 'Cooking oil (L)', stock: 15, threshold: 5, unit: 'L', updatedAt: new Date(Date.now() - 12 * 3600_000).toISOString() },
]

interface InvForm { name: string; stock: string; threshold: string; unit: string }
const EMPTY_INV: InvForm = { name: '', stock: '', threshold: '', unit: 'kg' }

function invStatus(i: Inv) {
  if (i.stock <= 0) return { variant: 'destructive' as const, label: 'Out of stock' }
  if (i.stock <= i.threshold) return { variant: 'warning' as const, label: 'Low stock' }
  return { variant: 'success' as const, label: 'In stock' }
}

export function RestaurantInventory() {
  const [rows, setRows] = useState<Inv[]>(INV_SAMPLE)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<InvForm>(EMPTY_INV)

  const openAdd = () => { setEditId(null); setForm(EMPTY_INV); setOpen(true) }
  const openEdit = (i: Inv) => {
    setEditId(i.id); setForm({ name: i.name, stock: String(i.stock), threshold: String(i.threshold), unit: i.unit }); setOpen(true)
  }

  const submit = () => {
    if (!form.name.trim() || form.stock === '' || form.threshold === '') { toast.warning('Fill all required fields'); return }
    const next: Inv = {
      id: editId ?? newId(),
      name: form.name.trim(), stock: Number(form.stock), threshold: Number(form.threshold),
      unit: form.unit || 'kg', updatedAt: new Date().toISOString(),
    }
    setRows((prev) => editId ? prev.map((r) => r.id === editId ? next : r) : [next, ...prev])
    toast.warning('Saved locally — backend pending')
    setOpen(false)
  }

  const columns = useMemo<ColumnDef<Inv>[]>(() => [
    { accessorKey: 'name', header: 'Item', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5"><Package className="size-3 text-muted-foreground" /> {row.original.name}</span>
    ) },
    { id: 'stock', header: 'Stock', cell: ({ row }) => <span className="tabular-nums font-medium">{row.original.stock} {row.original.unit}</span> },
    { accessorKey: 'threshold', header: 'Low at', cell: ({ row }) => <span className="font-mono">{row.original.threshold} {row.original.unit}</span> },
    { accessorKey: 'updatedAt', header: 'Updated', cell: ({ row }) => <span className="text-xs text-muted-foreground">{fmtDate(row.original.updatedAt)}</span> },
    { id: 'status', header: 'Status', cell: ({ row }) => { const s = invStatus(row.original); return <Badge variant={s.variant}>{s.label}</Badge> } },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" titleAdornment={<PendingBadge />} description={`${rows.length} tracked items · ${rows.filter((r) => r.stock <= r.threshold).length} need restock`} breadcrumbs={crumb('Inventory')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Add item</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search inventory…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit inventory item' : 'Add inventory item'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label required>Item name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Paneer" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label required>Stock</Label>
                <Input inputMode="decimal" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label required>Low at</Label>
                <Input inputMode="decimal" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="pcs">pcs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteId != null} onOpenChange={(o) => { if (!o) setDeleteId(null) }} destructive
        title="Delete inventory item?" description="Stock history for this item is lost." confirmLabel="Delete"
        onConfirm={() => { setRows((r) => r.filter((i) => i.id !== deleteId)); toast.warning('Removed locally — backend pending'); setDeleteId(null) }} />
    </div>
  )
}

/* ============================================================== */
/* 4. Vendors                                                      */
/* ============================================================== */
interface Vendor { id: number; name: string; contact: string; category: string; lastOrderAt: string }
const VENDOR_SAMPLE: Vendor[] = [
  { id: 1, name: 'Mahesh Dairy', contact: '+91 98123 45678', category: 'Dairy', lastOrderAt: new Date(Date.now() - 2 * 86400_000).toISOString() },
  { id: 2, name: 'Fresh Farm Veg', contact: '+91 99876 54321', category: 'Vegetables', lastOrderAt: new Date(Date.now() - 1 * 86400_000).toISOString() },
  { id: 3, name: 'Coastal Poultry', contact: '+91 98000 11111', category: 'Meat', lastOrderAt: new Date(Date.now() - 5 * 86400_000).toISOString() },
  { id: 4, name: 'Spice Bazaar', contact: '+91 99111 22222', category: 'Spices', lastOrderAt: new Date(Date.now() - 14 * 86400_000).toISOString() },
]

interface VendorForm { name: string; contact: string; category: string }
const EMPTY_VENDOR: VendorForm = { name: '', contact: '', category: '' }

export function RestaurantVendors() {
  const [rows, setRows] = useState<Vendor[]>(VENDOR_SAMPLE)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<VendorForm>(EMPTY_VENDOR)

  const openAdd = () => { setEditId(null); setForm(EMPTY_VENDOR); setOpen(true) }
  const openEdit = (v: Vendor) => {
    setEditId(v.id); setForm({ name: v.name, contact: v.contact, category: v.category }); setOpen(true)
  }

  const submit = () => {
    if (!form.name.trim() || !form.contact.trim()) { toast.warning('Name + contact required'); return }
    const next: Vendor = {
      id: editId ?? newId(), name: form.name.trim(), contact: form.contact.trim(),
      category: form.category.trim() || 'General',
      lastOrderAt: rows.find((r) => r.id === editId)?.lastOrderAt ?? new Date().toISOString(),
    }
    setRows((prev) => editId ? prev.map((r) => r.id === editId ? next : r) : [next, ...prev])
    toast.warning('Saved locally — backend pending')
    setOpen(false)
  }

  const columns = useMemo<ColumnDef<Vendor>[]>(() => [
    { accessorKey: 'name', header: 'Vendor', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5"><Truck className="size-3 text-muted-foreground" /> {row.original.name}</span>
    ) },
    { accessorKey: 'contact', header: 'Contact' },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge> },
    { accessorKey: 'lastOrderAt', header: 'Last order', cell: ({ row }) => <span className="text-xs text-muted-foreground">{fmtDate(row.original.lastOrderAt)}</span> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Vendors" titleAdornment={<PendingBadge />} description={`${rows.length} suppliers across ${new Set(rows.map((r) => r.category)).size} categories`} breadcrumbs={crumb('Vendors')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Add vendor</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search vendors…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit vendor' : 'Add vendor'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label required>Vendor name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Contact</Label>
                <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="+91 …" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Dairy, Veg, …" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteId != null} onOpenChange={(o) => { if (!o) setDeleteId(null) }} destructive
        title="Delete vendor?" description="Purchase orders pointing here will be orphaned." confirmLabel="Delete"
        onConfirm={() => { setRows((r) => r.filter((v) => v.id !== deleteId)); toast.warning('Removed locally — backend pending'); setDeleteId(null) }} />
    </div>
  )
}

/* ============================================================== */
/* 5. Purchase Orders                                              */
/* ============================================================== */
type POStatus = 'Draft' | 'Sent' | 'Received' | 'Cancelled'
interface PO { id: number; poNumber: string; vendor: string; total: number; status: POStatus; date: string }
const PO_SAMPLE: PO[] = [
  { id: 1, poNumber: 'PO-2026-0042', vendor: 'Mahesh Dairy', total: 18500, status: 'Received', date: new Date(Date.now() - 1 * 86400_000).toISOString() },
  { id: 2, poNumber: 'PO-2026-0041', vendor: 'Fresh Farm Veg', total: 6400, status: 'Sent', date: new Date(Date.now() - 2 * 86400_000).toISOString() },
  { id: 3, poNumber: 'PO-2026-0040', vendor: 'Coastal Poultry', total: 12800, status: 'Draft', date: new Date(Date.now() - 3 * 86400_000).toISOString() },
  { id: 4, poNumber: 'PO-2026-0039', vendor: 'Spice Bazaar', total: 4200, status: 'Cancelled', date: new Date(Date.now() - 7 * 86400_000).toISOString() },
]

interface POForm { vendor: string; total: string; lineItems: string; status: POStatus }
const EMPTY_PO: POForm = { vendor: '', total: '', lineItems: '', status: 'Draft' }

function poBadge(s: POStatus) {
  switch (s) {
    case 'Received': return <Badge variant="success">{s}</Badge>
    case 'Sent': return <Badge variant="info">{s}</Badge>
    case 'Cancelled': return <Badge variant="destructive">{s}</Badge>
    default: return <Badge variant="secondary">{s}</Badge>
  }
}

export function RestaurantPurchaseOrders() {
  const [rows, setRows] = useState<PO[]>(PO_SAMPLE)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<POForm>(EMPTY_PO)
  const vendors = useMemo(() => Array.from(new Set([...VENDOR_SAMPLE.map((v) => v.name), ...rows.map((r) => r.vendor)])), [rows])

  const openAdd = () => { setForm(EMPTY_PO); setOpen(true) }

  const submit = () => {
    if (!form.vendor || !form.total) { toast.warning('Vendor + total required'); return }
    const seq = rows.length + 1
    const next: PO = {
      id: newId(), poNumber: `PO-2026-${String(42 + seq).padStart(4, '0')}`,
      vendor: form.vendor, total: Number(form.total), status: form.status,
      date: new Date().toISOString(),
    }
    setRows((prev) => [next, ...prev])
    toast.warning('Saved locally — backend pending')
    setOpen(false)
  }

  const columns = useMemo<ColumnDef<PO>[]>(() => [
    { accessorKey: 'poNumber', header: 'PO #', cell: ({ row }) => <span className="font-mono font-semibold">{row.original.poNumber}</span> },
    { accessorKey: 'vendor', header: 'Vendor' },
    { accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="tabular-nums font-medium">{fmtINR(row.original.total)}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => poBadge(row.original.status) },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => fmtDate(row.original.date) },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Orders" titleAdornment={<PendingBadge />} description={`${rows.length} POs · ${fmtINR(rows.filter((r) => r.status !== 'Cancelled').reduce((a, b) => a + b.total, 0))} committed`} breadcrumbs={crumb('Purchase Orders')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> New PO</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search POs…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New purchase order</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label required>Vendor</Label>
              <Select value={form.vendor} onValueChange={(v) => setForm({ ...form, vendor: v })}>
                <SelectTrigger><SelectValue placeholder="Pick a vendor" /></SelectTrigger>
                <SelectContent>{vendors.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Line items (one per line)</Label>
              <textarea value={form.lineItems} onChange={(e) => setForm({ ...form, lineItems: e.target.value })}
                rows={3} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                placeholder="Paneer 10kg @180&#10;Tomatoes 20kg @30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Total ₹</Label>
                <Input inputMode="decimal" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as POStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Create PO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ============================================================== */
/* 6. Expenses                                                     */
/* ============================================================== */
interface Expense { id: number; date: string; category: string; amount: number; vendor: string; paidVia: string }
const EXP_SAMPLE: Expense[] = [
  { id: 1, date: new Date(Date.now() - 1 * 86400_000).toISOString(), category: 'Groceries', amount: 18500, vendor: 'Mahesh Dairy', paidVia: 'Bank transfer' },
  { id: 2, date: new Date(Date.now() - 2 * 86400_000).toISOString(), category: 'Electricity', amount: 8400, vendor: 'BEST', paidVia: 'UPI' },
  { id: 3, date: new Date(Date.now() - 3 * 86400_000).toISOString(), category: 'Rent', amount: 65000, vendor: 'Landlord', paidVia: 'Cheque' },
  { id: 4, date: new Date(Date.now() - 5 * 86400_000).toISOString(), category: 'Salaries', amount: 142000, vendor: 'Staff', paidVia: 'Bank transfer' },
  { id: 5, date: new Date(Date.now() - 6 * 86400_000).toISOString(), category: 'Marketing', amount: 5800, vendor: 'Zomato Ads', paidVia: 'Credit card' },
]

const EXP_CATS = ['Groceries', 'Electricity', 'Rent', 'Salaries', 'Marketing', 'Maintenance', 'Other']
const EXP_PAY = ['Cash', 'UPI', 'Bank transfer', 'Cheque', 'Credit card']

interface ExpForm { date: string; category: string; amount: string; vendor: string; paidVia: string }
const EMPTY_EXP: ExpForm = { date: new Date().toISOString().slice(0, 10), category: 'Groceries', amount: '', vendor: '', paidVia: 'UPI' }

export function RestaurantExpenses() {
  const [rows, setRows] = useState<Expense[]>(EXP_SAMPLE)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<ExpForm>(EMPTY_EXP)

  const openAdd = () => { setEditId(null); setForm(EMPTY_EXP); setOpen(true) }
  const openEdit = (e: Expense) => {
    setEditId(e.id); setForm({ date: fmtDate(e.date), category: e.category, amount: String(e.amount), vendor: e.vendor, paidVia: e.paidVia }); setOpen(true)
  }

  const submit = () => {
    if (!form.amount || !form.vendor.trim()) { toast.warning('Amount + vendor required'); return }
    const next: Expense = {
      id: editId ?? newId(),
      date: new Date(form.date).toISOString(),
      category: form.category, amount: Number(form.amount),
      vendor: form.vendor.trim(), paidVia: form.paidVia,
    }
    setRows((prev) => editId ? prev.map((r) => r.id === editId ? next : r) : [next, ...prev])
    toast.warning('Saved locally — backend pending')
    setOpen(false)
  }

  const columns = useMemo<ColumnDef<Expense>[]>(() => [
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => fmtDate(row.original.date) },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="tabular-nums font-medium">{fmtINR(row.original.amount)}</span> },
    { accessorKey: 'vendor', header: 'Vendor' },
    { accessorKey: 'paidVia', header: 'Paid via', cell: ({ row }) => <span className="text-xs">{row.original.paidVia}</span> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" titleAdornment={<PendingBadge />} description={`${rows.length} entries · ${fmtINR(rows.reduce((a, b) => a + b.amount, 0))} total this month`} breadcrumbs={crumb('Expenses')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Add expense</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search expenses…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit expense' : 'Add expense'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label required>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EXP_CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Amount ₹</Label>
                <Input inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Paid via</Label>
                <Select value={form.paidVia} onValueChange={(v) => setForm({ ...form, paidVia: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EXP_PAY.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label required>Vendor / payee</Label>
              <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ============================================================== */
/* 7. Profit & Loss Report                                         */
/* ============================================================== */
export function RestaurantPLReport() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 86400_000),
    to: new Date(),
  })

  // Sample numbers — would normally come from an aggregated endpoint.
  const breakdown = [
    { category: 'Food sales', amount: 487_200, type: 'income' as const },
    { category: 'Delivery fees collected', amount: 24_800, type: 'income' as const },
    { category: 'Groceries', amount: 132_400, type: 'expense' as const },
    { category: 'Electricity', amount: 18_900, type: 'expense' as const },
    { category: 'Rent', amount: 65_000, type: 'expense' as const },
    { category: 'Salaries', amount: 142_000, type: 'expense' as const },
    { category: 'Marketing', amount: 8_400, type: 'expense' as const },
  ]
  const revenue = breakdown.filter((b) => b.type === 'income').reduce((a, b) => a + b.amount, 0)
  const expenses = breakdown.filter((b) => b.type === 'expense').reduce((a, b) => a + b.amount, 0)
  const profit = revenue - expenses

  const columns = useMemo<ColumnDef<typeof breakdown[number]>[]>(() => [
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => row.original.type === 'income'
      ? <Badge variant="success">Income</Badge> : <Badge variant="warning">Expense</Badge> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => (
      <span className={`tabular-nums font-medium ${row.original.type === 'income' ? 'text-success' : 'text-destructive'}`}>
        {row.original.type === 'income' ? '+' : '−'}{fmtINR(row.original.amount)}
      </span>
    ) },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Profit & Loss" titleAdornment={<PendingBadge />} description="Revenue vs expenses for the selected period" breadcrumbs={crumb('P&L Report')}
        actions={<div className="w-72"><DateRangeField value={range} onChange={setRange} /></div>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Revenue" value={revenue} icon={<TrendingUp className="size-5" />} format={fmtINR} hero />
        <StatCard label="Expenses" value={expenses} icon={<Wallet className="size-5" />} format={fmtINR} />
        <StatCard label="Net profit" value={profit} icon={<TrendingUp className="size-5" />} format={fmtINR} delta={profit / revenue} />
      </div>
      <DataTable data={breakdown} columns={columns} searchPlaceholder="Search categories…" />
    </div>
  )
}

/* ============================================================== */
/* 8. Audit Trail                                                  */
/* ============================================================== */
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT'
interface Audit { id: number; ts: string; user: string; action: AuditAction; entity: string; details: string }
const AUDIT_SAMPLE: Audit[] = [
  { id: 1, ts: new Date(Date.now() - 5 * 60_000).toISOString(), user: 'owner@spice', action: 'UPDATE', entity: 'MenuItem #103', details: 'Price 380 → 400' },
  { id: 2, ts: new Date(Date.now() - 22 * 60_000).toISOString(), user: 'cashier01', action: 'CREATE', entity: 'Order KOT-9041', details: 'Table T-02, ₹645' },
  { id: 3, ts: new Date(Date.now() - 90 * 60_000).toISOString(), user: 'owner@spice', action: 'LOGIN', entity: 'Session', details: 'IP 122.171.X.X' },
  { id: 4, ts: new Date(Date.now() - 3 * 3600_000).toISOString(), user: 'manager01', action: 'DELETE', entity: 'Coupon DIWALI20', details: 'Soft-deleted' },
  { id: 5, ts: new Date(Date.now() - 6 * 3600_000).toISOString(), user: 'owner@spice', action: 'EXPORT', entity: 'Reports', details: 'orders_2026-06.csv' },
  { id: 6, ts: new Date(Date.now() - 24 * 3600_000).toISOString(), user: 'manager01', action: 'UPDATE', entity: 'Restaurant hours', details: 'Mon closed → open' },
]

function auditBadge(a: AuditAction) {
  switch (a) {
    case 'CREATE': return <Badge variant="success">{a}</Badge>
    case 'UPDATE': return <Badge variant="info">{a}</Badge>
    case 'DELETE': return <Badge variant="destructive">{a}</Badge>
    case 'LOGIN': return <Badge variant="outline">{a}</Badge>
    default: return <Badge variant="secondary">{a}</Badge>
  }
}

export function RestaurantAuditTrail() {
  const [filter, setFilter] = useState<string>('ALL')
  const rows = useMemo(() => filter === 'ALL' ? AUDIT_SAMPLE : AUDIT_SAMPLE.filter((a) => a.action === filter), [filter])

  const columns = useMemo<ColumnDef<Audit>[]>(() => [
    { accessorKey: 'ts', header: 'Timestamp', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.ts).toLocaleString('en-IN')}</span> },
    { accessorKey: 'user', header: 'User', cell: ({ row }) => <span className="font-mono text-xs">{row.original.user}</span> },
    { accessorKey: 'action', header: 'Action', cell: ({ row }) => auditBadge(row.original.action) },
    { accessorKey: 'entity', header: 'Entity' },
    { accessorKey: 'details', header: 'Details', cell: ({ row }) => <span className="text-xs">{row.original.details}</span> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Trail" titleAdornment={<PendingBadge />} description={`${rows.length} recent events · who did what, when`} breadcrumbs={crumb('Audit Trail')}
        actions={
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44"><ShieldAlert className="size-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All actions</SelectItem>
              <SelectItem value="CREATE">Create</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="EXPORT">Export</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search audit log…" />
    </div>
  )
}

/* ============================================================== */
/* 9. API Keys                                                     */
/* ============================================================== */
interface ApiKeyRow { id: number; name: string; key: string; createdAt: string; lastUsedAt: string | null; active: boolean }
const API_SAMPLE: ApiKeyRow[] = [
  { id: 1, name: 'POS integration', key: 'sk_live_a1b2c3d4e5f6g7h8i9j0k1l2', createdAt: new Date(Date.now() - 30 * 86400_000).toISOString(), lastUsedAt: new Date(Date.now() - 1 * 3600_000).toISOString(), active: true },
  { id: 2, name: 'Mobile app', key: 'sk_live_m9n8o7p6q5r4s3t2u1v0w9x8', createdAt: new Date(Date.now() - 90 * 86400_000).toISOString(), lastUsedAt: new Date(Date.now() - 5 * 86400_000).toISOString(), active: true },
  { id: 3, name: 'Legacy report sync', key: 'sk_live_y7z6a5b4c3d2e1f0g9h8i7j6', createdAt: new Date(Date.now() - 180 * 86400_000).toISOString(), lastUsedAt: null, active: false },
]

function maskKey(k: string): string {
  if (k.length < 12) return k
  return `${k.slice(0, 7)}${'•'.repeat(16)}${k.slice(-4)}`
}
function randomKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = 'sk_live_'
  for (let i = 0; i < 24; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export function RestaurantApiKeys() {
  const [rows, setRows] = useState<ApiKeyRow[]>(API_SAMPLE)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [created, setCreated] = useState<ApiKeyRow | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const openAdd = () => { setName(''); setCreated(null); setOpen(true) }
  const submit = () => {
    if (!name.trim()) { toast.warning('Give the key a name'); return }
    const next: ApiKeyRow = {
      id: newId(), name: name.trim(), key: randomKey(),
      createdAt: new Date().toISOString(), lastUsedAt: null, active: true,
    }
    setRows((prev) => [next, ...prev])
    setCreated(next)
    toast.warning('Saved locally — backend pending')
  }
  const copyKey = (k: string) => { navigator.clipboard.writeText(k).then(() => toast.success('Key copied')) }

  const columns = useMemo<ColumnDef<ApiKeyRow>[]>(() => [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5"><Key className="size-3 text-muted-foreground" /> {row.original.name}</span>
    ) },
    { accessorKey: 'key', header: 'Key', cell: ({ row }) => (
      <span className="font-mono text-xs inline-flex items-center gap-1.5">
        {maskKey(row.original.key)}
        <Button size="sm" variant="ghost" onClick={() => copyKey(row.original.key)} aria-label="Copy key"><Copy className="size-3" /></Button>
      </span>
    ) },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => fmtDate(row.original.createdAt) },
    { accessorKey: 'lastUsedAt', header: 'Last used', cell: ({ row }) => row.original.lastUsedAt ? fmtDate(row.original.lastUsedAt) : <span className="text-muted-foreground">never</span> },
    { accessorKey: 'active', header: 'Status', cell: ({ row }) => row.original.active ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Revoked</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="API Keys" titleAdornment={<PendingBadge />} description={`${rows.filter((r) => r.active).length} active · ${rows.length} total`} breadcrumbs={crumb('API Keys')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> New API key</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search keys…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{created ? 'Save your new key' : 'Generate API key'}</DialogTitle></DialogHeader>
          {created ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Copy it now — you won't see the full key again.</p>
              <div className="font-mono text-sm break-all p-3 bg-muted rounded-md">{created.key}</div>
              <Button variant="outline" onClick={() => copyKey(created.key)}><Copy className="size-4" /> Copy key</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label required>Key name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Inventory sync" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>{created ? 'Done' : 'Cancel'}</Button>
            {!created ? <Button onClick={submit}>Generate</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteId != null} onOpenChange={(o) => { if (!o) setDeleteId(null) }} destructive
        title="Revoke API key?" description="Any integration using this key will start failing immediately." confirmLabel="Revoke"
        onConfirm={() => { setRows((r) => r.map((k) => k.id === deleteId ? { ...k, active: false } : k)); toast.warning('Revoked locally — backend pending'); setDeleteId(null) }} />
    </div>
  )
}

/* ============================================================== */
/* 10. Notification Preferences                                    */
/* ============================================================== */
type Channel = 'email' | 'sms' | 'push'
type Event = 'orderReceived' | 'paymentConfirmed' | 'refundIssued' | 'staffInvited' | 'lowStock' | 'dailySummary'
const EVENTS: { key: Event; label: string; description: string }[] = [
  { key: 'orderReceived', label: 'Order received', description: 'Every new order from any channel.' },
  { key: 'paymentConfirmed', label: 'Payment confirmed', description: 'Successful payment captured.' },
  { key: 'refundIssued', label: 'Refund issued', description: 'A cashier or owner issued a refund.' },
  { key: 'staffInvited', label: 'Staff invited', description: 'New staff member added or invited.' },
  { key: 'lowStock', label: 'Low stock', description: 'Inventory falls below threshold.' },
  { key: 'dailySummary', label: 'Daily summary', description: 'End-of-day revenue + orders digest.' },
]
type Prefs = Record<Event, Record<Channel, boolean>>
const DEFAULT_PREFS: Prefs = EVENTS.reduce((acc, e) => {
  acc[e.key] = { email: true, sms: false, push: e.key === 'orderReceived' || e.key === 'lowStock' }
  return acc
}, {} as Prefs)
const LS_KEY = 'restaurant.notificationPrefs.v1'

export function RestaurantNotificationPrefs() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) })
    } catch { /* ignore */ }
  }, [])

  const toggle = (e: Event, c: Channel) => {
    setPrefs((prev) => {
      const next = { ...prev, [e]: { ...prev[e], [c]: !prev[e][c] } }
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }
  const resetAll = () => {
    setPrefs(DEFAULT_PREFS)
    try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
    toast.success('Reset to defaults')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Notification Preferences" titleAdornment={<PendingBadge />} description="Choose which events alert you, and how" breadcrumbs={crumb('Notifications')}
        actions={<Button variant="outline" onClick={resetAll}><Bell className="size-4" /> Reset to defaults</Button>}
      />
      <Card>
        <CardContent className="pt-6 divide-y divide-border">
          <div className="hidden sm:grid grid-cols-12 pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <div className="col-span-6">Event</div>
            <div className="col-span-2 text-center">Email</div>
            <div className="col-span-2 text-center">SMS</div>
            <div className="col-span-2 text-center">Push</div>
          </div>
          {EVENTS.map((ev) => (
            <div key={ev.key} className="grid grid-cols-1 sm:grid-cols-12 gap-3 py-4 items-center">
              <div className="sm:col-span-6">
                <p className="font-medium text-sm">{ev.label}</p>
                <p className="text-xs text-muted-foreground">{ev.description}</p>
              </div>
              {(['email', 'sms', 'push'] as Channel[]).map((c) => (
                <div key={c} className="sm:col-span-2 flex items-center sm:justify-center gap-2">
                  <span className="sm:hidden text-xs uppercase text-muted-foreground w-12">{c}</span>
                  <Switch checked={prefs[ev.key][c]} onCheckedChange={() => toggle(ev.key, c)} aria-label={`${ev.label} via ${c}`} />
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5"><FileText className="size-3" /> Saved to this browser. Backend sync arrives with the notification service rollout.</p>
    </div>
  )
}
