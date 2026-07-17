import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layers, X } from 'lucide-react'
import AdminCrudPage, { textColumn, boolColumn, numberColumn } from '@/features/superadmin/_shared/AdminCrudPage'
import { menuItemsCrud, menuCategoryCrud, menuSubcategoryCrud } from '@/api/queries/superadmin'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import type { AdminEntity } from '@/api/services/superadmin'

/**
 * Menu Items page + Bulk Update modal.
 * The sidebar has TWO entries: "Menu Items" (list) + "Bulk Update" (?bulk=1).
 * Both routes render this same component; ?bulk=1 auto-opens the bulk modal.
 */
export default function SuperadminMenuItems() {
  const [searchParams, setSearchParams] = useSearchParams()
  const bulkAutoOpen = searchParams.has('bulk') || window.location.pathname.endsWith('/bulk')

  const catsQ = menuCategoryCrud.useList()
  const subsQ = menuSubcategoryCrud.useList()
  const itemsQ = menuItemsCrud.useList()
  const updateM = menuItemsCrud.useUpdate()

  const categoryOptions = (catsQ.data ?? []).map((c) => ({
    label: String(c.categoryName ?? c.name ?? `#${c.id}`),
    value: Number(c.id ?? 0),
  }))
  const subcategoryOptions = (subsQ.data ?? []).map((s) => ({
    label: String(s.subcategoryName ?? s.name ?? `#${s.id}`),
    value: Number(s.id ?? 0),
  }))

  const [bulkOpen, setBulkOpen] = useState(false)
  useEffect(() => {
    if (bulkAutoOpen) setBulkOpen(true)
  }, [bulkAutoOpen])

  return (
    <>
      <AdminCrudPage<AdminEntity>
        title="Menu Items"
        description="All menu items across restaurants — price, veg/non-veg, availability."
        crud={menuItemsCrud}
        columns={[
          textColumn('name', 'Item'),
          textColumn('categoryName', 'Category'),
          numberColumn('price', 'Price (₹)'),
          boolColumn('isVeg', 'Veg', { yes: 'Veg', no: 'Non-Veg' }),
          boolColumn('signature', 'Signature', { yes: 'Chef Pick', no: '—' }),
          boolColumn('isActive', 'Status'),
        ]}
        searchKey="name"
        formFields={[
          { key: 'name',              label: 'Name',          kind: 'text',     required: true, placeholder: 'Dish name' },
          { key: 'categoryId',        label: 'Category',      kind: 'select',   required: true, options: categoryOptions },
          { key: 'subcategoryId',     label: 'Subcategory',   kind: 'select',   options: subcategoryOptions },
          { key: 'description',       label: 'Description',   kind: 'textarea', placeholder: 'Short menu description' },
          { key: 'price',             label: 'Price (₹)',     kind: 'number',   required: true, placeholder: '0' },
          { key: 'halfPrice',         label: 'Half Price (₹)', kind: 'number' },
          { key: 'qtrPrice',          label: 'Quarter Price (₹)', kind: 'number' },
          { key: 'preparationMinutes', label: 'Prep Time (min)', kind: 'number', placeholder: '15' },
          { key: 'spiceLevel',        label: 'Spice Level',   kind: 'select',   options: [
            { label: 'Mild', value: 'MILD' },
            { label: 'Medium', value: 'MEDIUM' },
            { label: 'Hot', value: 'HOT' },
            { label: 'Very Hot', value: 'VERY_HOT' },
          ]},
          { key: 'imageUrl',          label: 'Image URL',     kind: 'text' },
          { key: 'isVeg',             label: 'Veg',           kind: 'checkbox', placeholder: 'Vegetarian item' },
          { key: 'signature',         label: 'Signature Dish', kind: 'checkbox', placeholder: "Chef's pick" },
          { key: 'isActive',          label: 'Active',        kind: 'checkbox', placeholder: 'Available on menu' },
        ]}
        extraHeaderActions={
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Layers className="size-4" /> Bulk Update
          </Button>
        }
      />

      <BulkUpdateDialog
        open={bulkOpen}
        items={itemsQ.data ?? []}
        onClose={() => {
          setBulkOpen(false)
          if (searchParams.has('bulk')) {
            searchParams.delete('bulk')
            setSearchParams(searchParams)
          }
        }}
        onApply={async (ids, changes) => {
          let ok = 0, fail = 0
          for (const id of ids) {
            const original = (itemsQ.data ?? []).find((i) => Number(i.id) === id)
            if (!original) { fail++; continue }
            const body = { ...original, ...changes, id } as Partial<AdminEntity> & { id: number }
            const res = await updateM.mutateAsync(body)
            if (res.ok) ok++
            else fail++
          }
          if (ok > 0) toast.success(`Updated ${ok} items`)
          if (fail > 0) toast.error(`${fail} items failed to update`)
        }}
      />
    </>
  )
}

/* ────────────── Bulk Update dialog ────────────── */

interface BulkChanges {
  price?: number
  isActive?: boolean
  signature?: boolean
  isVeg?: boolean
}

function BulkUpdateDialog({
  open, items, onClose, onApply,
}: {
  open: boolean
  items: AdminEntity[]
  onClose: () => void
  onApply: (ids: number[], changes: BulkChanges) => Promise<void>
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [changes, setChanges] = useState<BulkChanges>({})
  const [applying, setApplying] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) {
      setSelected(new Set())
      setChanges({})
      setQuery('')
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => String(i.name ?? '').toLowerCase().includes(q))
  }, [items, query])

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((i) => Number(i.id ?? 0)).filter(Boolean)))
  }

  const hasChanges = Object.values(changes).some((v) => v !== undefined && v !== '')

  const apply = async () => {
    if (selected.size === 0 || !hasChanges) return
    setApplying(true)
    try {
      await onApply(Array.from(selected), changes)
      onClose()
    } finally {
      setApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk Update Menu Items</DialogTitle>
          <DialogDescription>
            Select rows, choose the fields to change, apply once. Fields left empty are unchanged.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4 min-h-0">
          {/* Item picker */}
          <div className="border border-border rounded-md flex flex-col min-h-0 max-h-[55vh]">
            <div className="p-2 border-b border-border flex items-center gap-2">
              <Input
                placeholder="Search items…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9"
              />
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selected.size === filtered.length && filtered.length > 0 ? 'Clear' : 'Select all'}
              </Button>
            </div>
            <ul className="overflow-y-auto themed-scrollbar flex-1 divide-y divide-border">
              {filtered.length === 0 ? (
                <li className="p-6 text-center text-sm text-muted-foreground">No items match.</li>
              ) : filtered.map((i) => {
                const id = Number(i.id ?? 0)
                const on = selected.has(id)
                return (
                  <li key={id}>
                    <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(id)}
                        className="size-4"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{String(i.name ?? '—')}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {String(i.categoryName ?? '—')} · ₹{String(i.price ?? '—')}
                        </span>
                      </span>
                      {Boolean(i.isVeg) ? <Badge variant="success" className="text-[9px]">Veg</Badge> : <Badge variant="destructive" className="text-[9px]">Non-Veg</Badge>}
                    </label>
                  </li>
                )
              })}
            </ul>
            <div className="p-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
              {selected.size} of {items.length} selected
            </div>
          </div>

          {/* Change fields */}
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Changes to apply
            </p>
            <div className="space-y-1.5">
              <Label>Price (₹)</Label>
              <Input
                type="number"
                placeholder="Leave blank to skip"
                value={changes.price ?? ''}
                onChange={(e) => setChanges((c) => ({ ...c, price: e.target.value === '' ? undefined : Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Available on menu</Label>
              <select
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                value={changes.isActive === undefined ? '' : String(changes.isActive)}
                onChange={(e) => setChanges((c) => ({ ...c, isActive: e.target.value === '' ? undefined : e.target.value === 'true' }))}
              >
                <option value="">— No change —</option>
                <option value="true">Yes — Available</option>
                <option value="false">No — Hidden</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Signature (Chef's Pick)</Label>
              <select
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                value={changes.signature === undefined ? '' : String(changes.signature)}
                onChange={(e) => setChanges((c) => ({ ...c, signature: e.target.value === '' ? undefined : e.target.value === 'true' }))}
              >
                <option value="">— No change —</option>
                <option value="true">Mark as signature</option>
                <option value="false">Unmark signature</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Veg flag</Label>
              <select
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                value={changes.isVeg === undefined ? '' : String(changes.isVeg)}
                onChange={(e) => setChanges((c) => ({ ...c, isVeg: e.target.value === '' ? undefined : e.target.value === 'true' }))}
              >
                <option value="">— No change —</option>
                <option value="true">Veg</option>
                <option value="false">Non-Veg</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={applying}>
            <X className="size-4" /> Cancel
          </Button>
          <Button
            onClick={apply}
            disabled={applying || selected.size === 0 || !hasChanges}
          >
            {applying ? 'Applying…' : `Apply to ${selected.size} item${selected.size === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
