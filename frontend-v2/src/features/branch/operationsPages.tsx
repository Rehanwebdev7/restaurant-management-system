/**
 * Branch Manager operations sub-pages — 10 high-value pages added 2026-06-25.
 *
 * Mirrors `subpages.tsx` style. Each page < 120 LOC, DataTable + Add/Edit dialog +
 * ConfirmDialog deletes where applicable. Sample data for screens with no
 * backend (most of these are operational tools not yet wired to Spring Boot),
 * with localStorage persistence where useful.
 */
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Plus, Edit3, Trash2, Boxes, Users, Wallet, Coins, Trash,
  ShieldCheck, NotebookPen, Wrench, GraduationCap, Star, RefreshCw,
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
import { StatCard } from '@/components/ui/stat-card'
import { toast } from '@/lib/toast'
import { useBranchDashboard } from '@/api/queries/branch'

const crumb = (last: string) => [{ label: 'Branch', href: '/branch/dashboard' }, { label: last }]
const SampleBadge = () => <Badge variant="warning" className="ml-2 align-middle">Sample · local</Badge>

function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-1 justify-end">
      {onEdit ? <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Edit"><Edit3 className="size-3.5" /></Button> : null}
      {onDelete ? <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete} aria-label="Delete"><Trash2 className="size-3.5" /></Button> : null}
    </div>
  )
}

/* localStorage hook — strict-typed */
function useLocalList<T>(key: string, initial: T[]): [T[], (next: T[]) => void] {
  const [list, setList] = useState<T[]>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return initial
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as T[]) : initial
    } catch { return initial }
  })
  const save = (next: T[]) => {
    setList(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* ignore quota */ }
  }
  return [list, save]
}

/* ------------------------------------------------------------------ */
/* 1. Inventory                                                       */
/* ------------------------------------------------------------------ */
interface InventoryRow { id: number; itemName: string; sku: string; stock: number; reorderAt: number; unit: string }
const INV_SEED: InventoryRow[] = [
  { id: 1, itemName: 'Paneer Tikka', sku: 'PNT-001', stock: 24, reorderAt: 10, unit: 'plates' },
  { id: 2, itemName: 'Chicken Biryani', sku: 'BIR-002', stock: 7, reorderAt: 12, unit: 'plates' },
  { id: 3, itemName: 'Coca-Cola 500ml', sku: 'BEV-101', stock: 48, reorderAt: 20, unit: 'bottles' },
  { id: 4, itemName: 'Tandoori Roti', sku: 'BRD-003', stock: 65, reorderAt: 30, unit: 'pieces' },
]

export function BranchInventory() {
  const [rows, setRows] = useLocalList<InventoryRow>('branch.inventory.v1', INV_SEED)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({ itemName: '', sku: '', stock: '', reorderAt: '', unit: '' })

  const openAdd = () => { setEditId(null); setForm({ itemName: '', sku: '', stock: '', reorderAt: '', unit: 'plates' }); setOpen(true) }
  const openEdit = (r: InventoryRow) => {
    setEditId(r.id); setForm({ itemName: r.itemName, sku: r.sku, stock: String(r.stock), reorderAt: String(r.reorderAt), unit: r.unit }); setOpen(true)
  }
  const save = () => {
    if (!form.itemName.trim() || !form.sku.trim()) { toast.error('Item name and SKU required'); return }
    const payload: InventoryRow = {
      id: editId ?? Date.now(), itemName: form.itemName.trim(), sku: form.sku.trim(),
      stock: Number(form.stock) || 0, reorderAt: Number(form.reorderAt) || 0, unit: form.unit.trim() || 'unit',
    }
    setRows(editId ? rows.map((r) => r.id === editId ? payload : r) : [payload, ...rows])
    toast.success(editId ? 'Stock updated' : 'Stock added'); setOpen(false)
  }
  const confirmDelete = () => {
    if (deleteId == null) return
    setRows(rows.filter((r) => r.id !== deleteId)); toast.success('Item removed'); setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<InventoryRow>[]>(() => [
    { accessorKey: 'itemName', header: 'Item', cell: ({ row }) => <span className="inline-flex items-center gap-1.5"><Boxes className="size-3 text-muted-foreground" /> {row.original.itemName}</span> },
    { accessorKey: 'sku', header: 'SKU', cell: ({ row }) => <span className="font-mono text-xs">{row.original.sku}</span> },
    { accessorKey: 'stock', header: 'Stock', cell: ({ row }) => <span className="tabular-nums font-medium">{row.original.stock} {row.original.unit}</span> },
    { id: 'status', header: 'Status', cell: ({ row }) => row.original.stock <= row.original.reorderAt ? <Badge variant="destructive">Reorder</Badge> : <Badge variant="success">OK</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Branch Inventory" titleAdornment={<SampleBadge />} description={`Stock counts per menu item · ${rows.length} items`} breadcrumbs={crumb('Inventory')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Add item</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search inventory…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit stock' : 'Add inventory item'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="inv-name" required>Item name</Label><Input id="inv-name" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="inv-sku" required>SKU</Label><Input id="inv-sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label htmlFor="inv-stk">Stock</Label><Input id="inv-stk" inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/\D/g, '') })} /></div>
              <div className="space-y-1.5"><Label htmlFor="inv-re">Reorder at</Label><Input id="inv-re" inputMode="numeric" value={form.reorderAt} onChange={(e) => setForm({ ...form, reorderAt: e.target.value.replace(/\D/g, '') })} /></div>
              <div className="space-y-1.5"><Label htmlFor="inv-unit">Unit</Label><Input id="inv-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="plates" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editId ? 'Save' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteId != null} onOpenChange={(o) => { if (!o) setDeleteId(null) }} destructive title="Remove inventory item?" confirmLabel="Remove" onConfirm={confirmDelete} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Staff Attendance                                                */
/* ------------------------------------------------------------------ */
type AttStatus = 'Present' | 'Absent' | 'Half-day' | 'Late'
interface AttRow { id: number; staff: string; date: string; checkIn: string; checkOut: string; status: AttStatus }
const todayIso = () => new Date().toISOString().slice(0, 10)
const ATT_SEED: AttRow[] = [
  { id: 1, staff: 'Ramesh Kumar', date: todayIso(), checkIn: '09:05', checkOut: '18:10', status: 'Present' },
  { id: 2, staff: 'Priya Sharma', date: todayIso(), checkIn: '09:30', checkOut: '18:00', status: 'Late' },
  { id: 3, staff: 'Anil Singh', date: todayIso(), checkIn: '', checkOut: '', status: 'Absent' },
]

export function BranchStaffAttendance() {
  const [rows, setRows] = useLocalList<AttRow>('branch.attendance.v1', ATT_SEED)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<{ staff: string; date: string; checkIn: string; checkOut: string; status: AttStatus }>({ staff: '', date: todayIso(), checkIn: '', checkOut: '', status: 'Present' })

  const openAdd = () => { setEditId(null); setForm({ staff: '', date: todayIso(), checkIn: '', checkOut: '', status: 'Present' }); setOpen(true) }
  const openEdit = (r: AttRow) => { setEditId(r.id); setForm({ staff: r.staff, date: r.date, checkIn: r.checkIn, checkOut: r.checkOut, status: r.status }); setOpen(true) }
  const save = () => {
    if (!form.staff.trim()) { toast.error('Staff name required'); return }
    const payload: AttRow = { id: editId ?? Date.now(), staff: form.staff.trim(), date: form.date, checkIn: form.checkIn, checkOut: form.checkOut, status: form.status }
    setRows(editId ? rows.map((r) => r.id === editId ? payload : r) : [payload, ...rows])
    toast.success(editId ? 'Attendance updated' : 'Marked'); setOpen(false)
  }
  const confirmDelete = () => { if (deleteId == null) return; setRows(rows.filter((r) => r.id !== deleteId)); toast.success('Entry removed'); setDeleteId(null) }

  const statusBadge = (s: AttStatus) =>
    s === 'Present' ? <Badge variant="success">{s}</Badge> :
    s === 'Late' ? <Badge variant="warning">{s}</Badge> :
    s === 'Half-day' ? <Badge variant="info">{s}</Badge> : <Badge variant="destructive">{s}</Badge>

  const columns = useMemo<ColumnDef<AttRow>[]>(() => [
    { accessorKey: 'staff', header: 'Staff', cell: ({ row }) => <span className="inline-flex items-center gap-1.5"><Users className="size-3 text-muted-foreground" /> {row.original.staff}</span> },
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'checkIn', header: 'In', cell: ({ row }) => row.original.checkIn || '—' },
    { accessorKey: 'checkOut', header: 'Out', cell: ({ row }) => row.original.checkOut || '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Attendance" titleAdornment={<SampleBadge />} description={`Daily check-in / check-out · ${rows.length} entries`} breadcrumbs={crumb('Staff Attendance')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Mark attendance</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search by staff or date…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit attendance' : 'Mark attendance'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="att-staff" required>Staff name</Label><Input id="att-staff" value={form.staff} onChange={(e) => setForm({ ...form, staff: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="att-date" required>Date</Label><Input id="att-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label htmlFor="att-in">Check-in</Label><Input id="att-in" type="time" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="att-out">Check-out</Label><Input id="att-out" type="time" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AttStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(['Present', 'Absent', 'Half-day', 'Late'] as AttStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editId ? 'Save' : 'Mark'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteId != null} onOpenChange={(o) => { if (!o) setDeleteId(null) }} destructive title="Remove attendance entry?" confirmLabel="Remove" onConfirm={confirmDelete} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Cash Register                                                   */
/* ------------------------------------------------------------------ */
export function BranchCashRegister() {
  const q = useBranchDashboard()
  const dash = q.data
  const [opening, setOpening] = useState<string>(() => localStorage.getItem('branch.till.opening') ?? '5000')
  const [counted, setCounted] = useState<string>('')

  const payments = (dash?.ordersByPayment ?? {}) as Record<string, number>
  const cashSales = Number(payments['CASH'] ?? payments['Cash'] ?? 0)
  const cardSales = Number(payments['CARD'] ?? payments['Card'] ?? 0)
  const upiSales = Number(payments['UPI'] ?? payments['Upi'] ?? 0)
  const refunds = 0 // backend doesn't expose; placeholder

  const expectedClose = Number(opening || 0) + cashSales - refunds
  const variance = counted === '' ? null : Number(counted) - expectedClose

  useEffect(() => { localStorage.setItem('branch.till.opening', opening) }, [opening])

  return (
    <div className="space-y-6">
      <PageHeader title="Cash Register" titleAdornment={!dash ? <SampleBadge /> : null} description="Today's till summary, sales mix and variance" breadcrumbs={crumb('Cash Register')}
        actions={<Button variant="outline" onClick={() => void q.refetch()}><RefreshCw className={q.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh</Button>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Cash sales" value={`₹${cashSales.toLocaleString('en-IN')}`} icon={<Coins className="size-4" />} />
        <StatCard label="Card sales" value={`₹${cardSales.toLocaleString('en-IN')}`} icon={<Wallet className="size-4" />} />
        <StatCard label="UPI sales" value={`₹${upiSales.toLocaleString('en-IN')}`} icon={<Wallet className="size-4" />} />
        <StatCard label="Refunds" value={`₹${refunds.toLocaleString('en-IN')}`} icon={<Wallet className="size-4" />} />
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label htmlFor="til-open">Opening cash (₹)</Label><Input id="til-open" inputMode="decimal" value={opening} onChange={(e) => setOpening(e.target.value.replace(/[^\d.]/g, ''))} /></div>
            <div className="space-y-1.5"><Label>Expected close (₹)</Label><Input value={expectedClose.toFixed(2)} readOnly className="font-mono" /></div>
            <div className="space-y-1.5"><Label htmlFor="til-counted">Counted cash (₹)</Label><Input id="til-counted" inputMode="decimal" value={counted} onChange={(e) => setCounted(e.target.value.replace(/[^\d.]/g, ''))} placeholder="Enter physical count" /></div>
          </div>
          {variance != null ? (
            <div className={`p-3 rounded-md border ${variance === 0 ? 'border-success/40 bg-success/5' : variance > 0 ? 'border-info/40 bg-info/5' : 'border-destructive/40 bg-destructive/5'}`}>
              <p className="text-sm">Variance: <span className="font-mono font-semibold">{variance >= 0 ? '+' : ''}₹{variance.toFixed(2)}</span> {variance === 0 ? '— till tallies' : variance > 0 ? '— overage' : '— shortage'}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Petty Cash                                                      */
/* ------------------------------------------------------------------ */
type PettyCategory = 'Cleaning' | 'Repairs' | 'Stationery' | 'Travel' | 'Misc'
interface PettyRow { id: number; date: string; description: string; amount: number; category: PettyCategory; person: string }
const PETTY_SEED: PettyRow[] = [
  { id: 1, date: todayIso(), description: 'Cleaning supplies', amount: 450, category: 'Cleaning', person: 'Suresh' },
  { id: 2, date: todayIso(), description: 'Stationery — receipt rolls', amount: 280, category: 'Stationery', person: 'Priya' },
]

export function BranchPettyCash() {
  const [rows, setRows] = useLocalList<PettyRow>('branch.petty.v1', PETTY_SEED)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<{ date: string; description: string; amount: string; category: PettyCategory; person: string }>({ date: todayIso(), description: '', amount: '', category: 'Misc', person: '' })

  const openAdd = () => { setEditId(null); setForm({ date: todayIso(), description: '', amount: '', category: 'Misc', person: '' }); setOpen(true) }
  const openEdit = (r: PettyRow) => { setEditId(r.id); setForm({ date: r.date, description: r.description, amount: String(r.amount), category: r.category, person: r.person }); setOpen(true) }
  const save = () => {
    if (!form.description.trim() || !form.amount) { toast.error('Description and amount required'); return }
    const payload: PettyRow = { id: editId ?? Date.now(), date: form.date, description: form.description.trim(), amount: Number(form.amount), category: form.category, person: form.person.trim() }
    setRows(editId ? rows.map((r) => r.id === editId ? payload : r) : [payload, ...rows])
    toast.success(editId ? 'Entry updated' : 'Entry added'); setOpen(false)
  }
  const confirmDelete = () => { if (deleteId == null) return; setRows(rows.filter((r) => r.id !== deleteId)); toast.success('Entry deleted'); setDeleteId(null) }

  const total = rows.reduce((s, r) => s + r.amount, 0)
  const columns = useMemo<ColumnDef<PettyRow>[]>(() => [
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge> },
    { accessorKey: 'person', header: 'Person' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="tabular-nums font-medium">₹{row.original.amount.toLocaleString('en-IN')}</span> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Petty Cash" titleAdornment={<SampleBadge />} description={`Small expenses log · ${rows.length} entries · ₹${total.toLocaleString('en-IN')} total`} breadcrumbs={crumb('Petty Cash')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Add expense</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search expenses…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit expense' : 'Add expense'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="pet-date" required>Date</Label><Input id="pet-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="pet-amt" required>Amount (₹)</Label><Input id="pet-amt" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, '') })} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="pet-desc" required>Description</Label><Input id="pet-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as PettyCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(['Cleaning', 'Repairs', 'Stationery', 'Travel', 'Misc'] as PettyCategory[]).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="pet-per">Person</Label><Input id="pet-per" value={form.person} onChange={(e) => setForm({ ...form, person: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editId ? 'Save' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteId != null} onOpenChange={(o) => { if (!o) setDeleteId(null) }} destructive title="Delete entry?" confirmLabel="Delete" onConfirm={confirmDelete} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 5. Wastage                                                         */
/* ------------------------------------------------------------------ */
type WastageReason = 'Spoilage' | 'Damaged' | 'Returned' | 'Expired'
interface WastageRow { id: number; date: string; item: string; qty: number; reason: WastageReason; costImpact: number }
const WAS_SEED: WastageRow[] = [
  { id: 1, date: todayIso(), item: 'Tomatoes', qty: 2.5, reason: 'Spoilage', costImpact: 125 },
  { id: 2, date: todayIso(), item: 'Chicken Biryani', qty: 1, reason: 'Returned', costImpact: 240 },
]

export function BranchWastage() {
  const [rows, setRows] = useLocalList<WastageRow>('branch.wastage.v1', WAS_SEED)
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<{ date: string; item: string; qty: string; reason: WastageReason; costImpact: string }>({ date: todayIso(), item: '', qty: '', reason: 'Spoilage', costImpact: '' })

  const save = () => {
    if (!form.item.trim()) { toast.error('Item name required'); return }
    const payload: WastageRow = { id: Date.now(), date: form.date, item: form.item.trim(), qty: Number(form.qty) || 0, reason: form.reason, costImpact: Number(form.costImpact) || 0 }
    setRows([payload, ...rows]); toast.success('Wastage logged'); setOpen(false)
    setForm({ date: todayIso(), item: '', qty: '', reason: 'Spoilage', costImpact: '' })
  }
  const confirmDelete = () => { if (deleteId == null) return; setRows(rows.filter((r) => r.id !== deleteId)); toast.success('Entry removed'); setDeleteId(null) }

  const totalCost = rows.reduce((s, r) => s + r.costImpact, 0)
  const columns = useMemo<ColumnDef<WastageRow>[]>(() => [
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'item', header: 'Item', cell: ({ row }) => <span className="inline-flex items-center gap-1.5"><Trash className="size-3 text-muted-foreground" /> {row.original.item}</span> },
    { accessorKey: 'qty', header: 'Qty', cell: ({ row }) => <span className="tabular-nums">{row.original.qty}</span> },
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => <Badge variant="warning">{row.original.reason}</Badge> },
    { accessorKey: 'costImpact', header: 'Cost (₹)', cell: ({ row }) => <span className="tabular-nums">₹{row.original.costImpact.toLocaleString('en-IN')}</span> },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Wastage Log" titleAdornment={<SampleBadge />} description={`${rows.length} entries · ₹${totalCost.toLocaleString('en-IN')} total cost impact`} breadcrumbs={crumb('Wastage')}
        actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Log wastage</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search wastage…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log wastage</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="was-date" required>Date</Label><Input id="was-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="was-item" required>Item</Label><Input id="was-item" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label htmlFor="was-qty">Quantity</Label><Input id="was-qty" inputMode="decimal" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value.replace(/[^\d.]/g, '') })} /></div>
              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v as WastageReason })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(['Spoilage', 'Damaged', 'Returned', 'Expired'] as WastageReason[]).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="was-cost">Cost (₹)</Label><Input id="was-cost" inputMode="decimal" value={form.costImpact} onChange={(e) => setForm({ ...form, costImpact: e.target.value.replace(/[^\d.]/g, '') })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Log</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteId != null} onOpenChange={(o) => { if (!o) setDeleteId(null) }} destructive title="Remove wastage entry?" confirmLabel="Remove" onConfirm={confirmDelete} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 6. Customer Feedback                                               */
/* ------------------------------------------------------------------ */
interface FeedbackRow { id: number; date: string; customer: string; rating: 1 | 2 | 3 | 4 | 5; category: string; comment: string }
const FBK_SEED: FeedbackRow[] = [
  { id: 1, date: todayIso(), customer: 'Aman Verma', rating: 5, category: 'Food', comment: 'Biryani was excellent, will order again.' },
  { id: 2, date: todayIso(), customer: 'Neha Patel', rating: 3, category: 'Service', comment: 'Waiting time was a bit long.' },
  { id: 3, date: todayIso(), customer: 'Vikram Joshi', rating: 4, category: 'Ambience', comment: 'Cozy place, music slightly loud.' },
  { id: 4, date: todayIso(), customer: 'Sneha Iyer', rating: 2, category: 'Food', comment: 'Curry too salty today.' },
]

function Stars({ n }: { n: number }) {
  return <span className="inline-flex items-center gap-0.5">{[1,2,3,4,5].map((i) => <Star key={i} className={`size-3.5 ${i <= n ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />)}</span>
}

export function BranchCustomerFeedback() {
  const [rows] = useLocalList<FeedbackRow>('branch.feedback.v1', FBK_SEED)
  const [filterRating, setFilterRating] = useState<string>('all')
  const visible = useMemo(() => filterRating === 'all' ? rows : rows.filter((r) => r.rating === Number(filterRating)), [rows, filterRating])
  const avg = rows.length ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1) : '—'

  const columns = useMemo<ColumnDef<FeedbackRow>[]>(() => [
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'customer', header: 'Customer' },
    { accessorKey: 'rating', header: 'Rating', cell: ({ row }) => <Stars n={row.original.rating} /> },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge> },
    { accessorKey: 'comment', header: 'Comment' },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Feedback" titleAdornment={<SampleBadge />} description={`${rows.length} reviews · ${avg} avg rating`} breadcrumbs={crumb('Customer Feedback')}
        actions={
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Filter</Label>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ratings</SelectItem>
                {[5,4,3,2,1].map((r) => <SelectItem key={r} value={String(r)}>{r} stars</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <DataTable data={visible} columns={columns} searchPlaceholder="Search feedback…" emptyTitle="No reviews" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 7. Staff Roles & Permissions                                       */
/* ------------------------------------------------------------------ */
interface PermRow { id: number; staff: string; role: string; orders: boolean; refunds: boolean; discount: boolean; menuEdit: boolean; reports: boolean }
const PERM_SEED: PermRow[] = [
  { id: 1, staff: 'Ramesh Kumar', role: 'Senior Cashier', orders: true, refunds: true, discount: true, menuEdit: false, reports: true },
  { id: 2, staff: 'Priya Sharma', role: 'Cashier', orders: true, refunds: false, discount: true, menuEdit: false, reports: false },
  { id: 3, staff: 'Anil Singh', role: 'Floor Manager', orders: true, refunds: true, discount: true, menuEdit: true, reports: true },
]
const CAPS: ReadonlyArray<{ key: keyof Omit<PermRow, 'id' | 'staff' | 'role'>; label: string }> = [
  { key: 'orders', label: 'Orders' }, { key: 'refunds', label: 'Refunds' }, { key: 'discount', label: 'Discounts' }, { key: 'menuEdit', label: 'Menu edit' }, { key: 'reports', label: 'Reports' },
]

export function BranchStaffRoles() {
  const [rows, setRows] = useLocalList<PermRow>('branch.staff_roles.v1', PERM_SEED)
  const toggle = (id: number, key: keyof Omit<PermRow, 'id' | 'staff' | 'role'>) => {
    setRows(rows.map((r) => r.id === id ? { ...r, [key]: !r[key] } : r))
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Roles & Permissions" titleAdornment={<SampleBadge />} description="Capability matrix per staff member" breadcrumbs={crumb('Staff Roles')}
        actions={<Button variant="outline"><ShieldCheck className="size-4" /> Audit log</Button>}
      />
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-medium">Staff</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                {CAPS.map((c) => <th key={c.key} className="py-2 px-2 font-medium text-center">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">{r.staff}</td>
                  <td className="py-2 pr-4"><Badge variant="outline">{r.role}</Badge></td>
                  {CAPS.map((c) => (
                    <td key={c.key} className="py-2 px-2 text-center">
                      <Switch checked={r[c.key]} onCheckedChange={() => toggle(r.id, c.key)} aria-label={`${r.staff} ${c.label}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 8. Shift Handover                                                  */
/* ------------------------------------------------------------------ */
interface HandoverRow { id: number; date: string; outgoing: string; incoming: string; notes: string; cashCount: number; issues: string }

export function BranchShiftHandover() {
  const [rows, setRows] = useLocalList<HandoverRow>('branch.handover.v1', [])
  const [form, setForm] = useState<{ date: string; outgoing: string; incoming: string; notes: string; cashCount: string; issues: string }>({
    date: todayIso(), outgoing: '', incoming: '', notes: '', cashCount: '', issues: '',
  })

  const save = () => {
    if (!form.outgoing.trim() || !form.incoming.trim()) { toast.error('Outgoing and incoming managers required'); return }
    const payload: HandoverRow = {
      id: Date.now(), date: form.date, outgoing: form.outgoing.trim(), incoming: form.incoming.trim(),
      notes: form.notes.trim(), cashCount: Number(form.cashCount) || 0, issues: form.issues.trim(),
    }
    setRows([payload, ...rows]); toast.success('Handover saved')
    setForm({ date: todayIso(), outgoing: '', incoming: '', notes: '', cashCount: '', issues: '' })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Shift Handover" titleAdornment={<SampleBadge />} description={`${rows.length} previous handovers logged`} breadcrumbs={crumb('Shift Handover')} />
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label htmlFor="ho-date" required>Date</Label><Input id="ho-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="ho-out" required>Outgoing manager</Label><Input id="ho-out" value={form.outgoing} onChange={(e) => setForm({ ...form, outgoing: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="ho-in" required>Incoming manager</Label><Input id="ho-in" value={form.incoming} onChange={(e) => setForm({ ...form, incoming: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ho-notes">Notes</Label>
            <textarea id="ho-notes" rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Key updates for the next shift…" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="ho-cash">Cash count (₹)</Label><Input id="ho-cash" inputMode="decimal" value={form.cashCount} onChange={(e) => setForm({ ...form, cashCount: e.target.value.replace(/[^\d.]/g, '') })} /></div>
            <div className="space-y-1.5"><Label htmlFor="ho-iss">Issues to follow up</Label><Input id="ho-iss" value={form.issues} onChange={(e) => setForm({ ...form, issues: e.target.value })} placeholder="e.g. POS printer jam" /></div>
          </div>
          <div className="flex justify-end"><Button onClick={save}><NotebookPen className="size-4" /> Save handover</Button></div>
        </CardContent>
      </Card>
      {rows.length > 0 ? (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm font-medium">Recent handovers</p>
            <ul className="space-y-2">
              {rows.slice(0, 10).map((r) => (
                <li key={r.id} className="border border-border rounded-md p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{r.date} · {r.outgoing} → {r.incoming}</span>
                    <span className="font-mono tabular-nums text-xs">₹{r.cashCount.toLocaleString('en-IN')}</span>
                  </div>
                  {r.notes ? <p className="text-muted-foreground">{r.notes}</p> : null}
                  {r.issues ? <p className="text-xs text-warning mt-1">Issues: {r.issues}</p> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 9. Maintenance Log                                                 */
/* ------------------------------------------------------------------ */
type MaintStatus = 'Reported' | 'In Progress' | 'Resolved'
interface MaintRow { id: number; date: string; equipment: string; issue: string; status: MaintStatus; assignedTo: string }
const MAINT_SEED: MaintRow[] = [
  { id: 1, date: todayIso(), equipment: 'POS Printer #1', issue: 'Paper jam', status: 'Resolved', assignedTo: 'Suresh' },
  { id: 2, date: todayIso(), equipment: 'Walk-in fridge', issue: 'Temperature fluctuating', status: 'In Progress', assignedTo: 'Cool-Tech AMC' },
  { id: 3, date: todayIso(), equipment: 'Dining AC #2', issue: 'Not cooling', status: 'Reported', assignedTo: '' },
]

export function BranchMaintenanceLog() {
  const [rows, setRows] = useLocalList<MaintRow>('branch.maintenance.v1', MAINT_SEED)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<{ date: string; equipment: string; issue: string; status: MaintStatus; assignedTo: string }>({ date: todayIso(), equipment: '', issue: '', status: 'Reported', assignedTo: '' })

  const openAdd = () => { setEditId(null); setForm({ date: todayIso(), equipment: '', issue: '', status: 'Reported', assignedTo: '' }); setOpen(true) }
  const openEdit = (r: MaintRow) => { setEditId(r.id); setForm({ date: r.date, equipment: r.equipment, issue: r.issue, status: r.status, assignedTo: r.assignedTo }); setOpen(true) }
  const save = () => {
    if (!form.equipment.trim() || !form.issue.trim()) { toast.error('Equipment and issue required'); return }
    const payload: MaintRow = { id: editId ?? Date.now(), date: form.date, equipment: form.equipment.trim(), issue: form.issue.trim(), status: form.status, assignedTo: form.assignedTo.trim() }
    setRows(editId ? rows.map((r) => r.id === editId ? payload : r) : [payload, ...rows])
    toast.success(editId ? 'Entry updated' : 'Issue logged'); setOpen(false)
  }
  const confirmDelete = () => { if (deleteId == null) return; setRows(rows.filter((r) => r.id !== deleteId)); toast.success('Entry removed'); setDeleteId(null) }

  const statusBadge = (s: MaintStatus) =>
    s === 'Resolved' ? <Badge variant="success">{s}</Badge> :
    s === 'In Progress' ? <Badge variant="info">{s}</Badge> : <Badge variant="warning">{s}</Badge>

  const columns = useMemo<ColumnDef<MaintRow>[]>(() => [
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'equipment', header: 'Equipment', cell: ({ row }) => <span className="inline-flex items-center gap-1.5"><Wrench className="size-3 text-muted-foreground" /> {row.original.equipment}</span> },
    { accessorKey: 'issue', header: 'Issue' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
    { accessorKey: 'assignedTo', header: 'Assigned to', cell: ({ row }) => row.original.assignedTo || '—' },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance Log" titleAdornment={<SampleBadge />} description={`${rows.length} entries · ${rows.filter((r) => r.status !== 'Resolved').length} open`} breadcrumbs={crumb('Maintenance Log')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Log issue</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search maintenance log…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit maintenance entry' : 'Log maintenance issue'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="m-date" required>Date</Label><Input id="m-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="m-eq" required>Equipment</Label><Input id="m-eq" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="m-iss" required>Issue</Label><Input id="m-iss" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as MaintStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(['Reported', 'In Progress', 'Resolved'] as MaintStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="m-asg">Assigned to</Label><Input id="m-asg" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editId ? 'Save' : 'Log'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteId != null} onOpenChange={(o) => { if (!o) setDeleteId(null) }} destructive title="Delete entry?" confirmLabel="Delete" onConfirm={confirmDelete} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 10. Training Records                                               */
/* ------------------------------------------------------------------ */
type TrainStatus = 'Completed' | 'In Progress' | 'Expired' | 'Scheduled'
interface TrainRow { id: number; staff: string; training: string; completionDate: string; certExpiry: string; status: TrainStatus }
const TRAIN_SEED: TrainRow[] = [
  { id: 1, staff: 'Ramesh Kumar', training: 'Food Safety Level 2', completionDate: '2026-01-15', certExpiry: '2027-01-15', status: 'Completed' },
  { id: 2, staff: 'Priya Sharma', training: 'Fire Safety', completionDate: '2025-11-10', certExpiry: '2026-11-10', status: 'Completed' },
  { id: 3, staff: 'Anil Singh', training: 'POS Operation', completionDate: '2024-03-01', certExpiry: '2026-03-01', status: 'Expired' },
  { id: 4, staff: 'Neha Patel', training: 'Customer Handling', completionDate: '', certExpiry: '', status: 'Scheduled' },
]

export function BranchTrainingRecords() {
  const [rows, setRows] = useLocalList<TrainRow>('branch.training.v1', TRAIN_SEED)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<{ staff: string; training: string; completionDate: string; certExpiry: string; status: TrainStatus }>({ staff: '', training: '', completionDate: '', certExpiry: '', status: 'Scheduled' })

  const openAdd = () => { setEditId(null); setForm({ staff: '', training: '', completionDate: '', certExpiry: '', status: 'Scheduled' }); setOpen(true) }
  const openEdit = (r: TrainRow) => { setEditId(r.id); setForm({ staff: r.staff, training: r.training, completionDate: r.completionDate, certExpiry: r.certExpiry, status: r.status }); setOpen(true) }
  const save = () => {
    if (!form.staff.trim() || !form.training.trim()) { toast.error('Staff and training required'); return }
    const payload: TrainRow = { id: editId ?? Date.now(), staff: form.staff.trim(), training: form.training.trim(), completionDate: form.completionDate, certExpiry: form.certExpiry, status: form.status }
    setRows(editId ? rows.map((r) => r.id === editId ? payload : r) : [payload, ...rows])
    toast.success(editId ? 'Record updated' : 'Record added'); setOpen(false)
  }
  const confirmDelete = () => { if (deleteId == null) return; setRows(rows.filter((r) => r.id !== deleteId)); toast.success('Record removed'); setDeleteId(null) }

  const statusBadge = (s: TrainStatus) =>
    s === 'Completed' ? <Badge variant="success">{s}</Badge> :
    s === 'In Progress' ? <Badge variant="info">{s}</Badge> :
    s === 'Expired' ? <Badge variant="destructive">{s}</Badge> : <Badge variant="warning">{s}</Badge>

  const columns = useMemo<ColumnDef<TrainRow>[]>(() => [
    { accessorKey: 'staff', header: 'Staff', cell: ({ row }) => <span className="inline-flex items-center gap-1.5"><GraduationCap className="size-3 text-muted-foreground" /> {row.original.staff}</span> },
    { accessorKey: 'training', header: 'Training' },
    { accessorKey: 'completionDate', header: 'Completed', cell: ({ row }) => row.original.completionDate || '—' },
    { accessorKey: 'certExpiry', header: 'Cert expiry', cell: ({ row }) => row.original.certExpiry || '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
    { id: 'actions', header: '', cell: ({ row }) => <RowActions onEdit={() => openEdit(row.original)} onDelete={() => setDeleteId(row.original.id)} /> },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader title="Training Records" titleAdornment={<SampleBadge />} description={`${rows.length} records · ${rows.filter((r) => r.status === 'Expired').length} expired`} breadcrumbs={crumb('Training Records')}
        actions={<Button onClick={openAdd}><Plus className="size-4" /> Add record</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search training records…" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit record' : 'Add training record'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="t-staff" required>Staff</Label><Input id="t-staff" value={form.staff} onChange={(e) => setForm({ ...form, staff: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="t-name" required>Training name</Label><Input id="t-name" value={form.training} onChange={(e) => setForm({ ...form, training: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label htmlFor="t-cmp">Completed on</Label><Input id="t-cmp" type="date" value={form.completionDate} onChange={(e) => setForm({ ...form, completionDate: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="t-exp">Cert expiry</Label><Input id="t-exp" type="date" value={form.certExpiry} onChange={(e) => setForm({ ...form, certExpiry: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TrainStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(['Completed', 'In Progress', 'Expired', 'Scheduled'] as TrainStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editId ? 'Save' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteId != null} onOpenChange={(o) => { if (!o) setDeleteId(null) }} destructive title="Delete training record?" confirmLabel="Delete" onConfirm={confirmDelete} />
    </div>
  )
}
