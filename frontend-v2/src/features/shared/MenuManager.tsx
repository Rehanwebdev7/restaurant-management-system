import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Tag } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/toast'

interface MenuItem {
  id: number
  name: string
  category: string
  price: number
  available: boolean
}

const SAMPLE: MenuItem[] = [
  { id: 1, name: 'Paneer Tikka', category: 'Starters', price: 240, available: true },
  { id: 2, name: 'Butter Chicken', category: 'Mains', price: 320, available: true },
  { id: 3, name: 'Veg Biryani', category: 'Mains', price: 260, available: true },
  { id: 4, name: 'Garlic Naan', category: 'Breads', price: 60, available: true },
  { id: 5, name: 'Mango Lassi', category: 'Drinks', price: 90, available: false },
]

const CATEGORIES = ['Starters', 'Mains', 'Breads', 'Drinks', 'Desserts']

interface MenuManagerProps {
  title?: string
  breadcrumbs?: { label: string; href?: string }[]
}

export function MenuManager({ title = 'Menu', breadcrumbs }: MenuManagerProps) {
  const [rows, setRows] = useState(SAMPLE)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', category: CATEGORIES[0] ?? '', price: '' })

  const toggle = (id: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, available: !r.available } : r)))
  }

  const columns = useMemo<ColumnDef<MenuItem>[]>(
    () => [
      { accessorKey: 'name', header: 'Item' },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5">
            <Tag className="size-3 text-muted-foreground" /> {row.original.category}
          </span>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => <span className="tabular-nums font-medium">₹{row.original.price}</span>,
      },
      {
        accessorKey: 'available',
        header: 'Available',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Switch checked={row.original.available} onCheckedChange={() => toggle(row.original.id)} aria-label="Toggle available" />
            {row.original.available ? (
              <Badge variant="success">In stock</Badge>
            ) : (
              <Badge variant="warning">Out</Badge>
            )}
          </div>
        ),
      },
    ],
    []
  )

  const submit = () => {
    const price = Number(form.price)
    if (!form.name.trim() || !price) {
      toast.warning('Name + price required')
      return
    }
    setRows([{ id: Date.now(), name: form.name, category: form.category, price, available: true }, ...rows])
    toast.success(`${form.name} added`)
    setForm({ name: '', category: CATEGORIES[0] ?? '', price: '' })
    setAdding(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Manage items, prices, and stock availability."
        breadcrumbs={breadcrumbs}
        actions={<Button onClick={() => setAdding(true)}><Plus className="size-4" /> Add item</Button>}
      />
      <DataTable data={rows} columns={columns} searchPlaceholder="Search menu…" />

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add menu item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="mname" required>Name</Label><Input id="mname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label required>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="mprice" required>Price (INR)</Label><Input id="mprice" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, '') })} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={submit}>Save item</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
