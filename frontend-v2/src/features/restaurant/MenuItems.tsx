import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ImageCell } from '@/components/ui/image-cell'
import { toast } from '@/lib/toast'
import {
  useRestaurantMenuItems,
  useRestaurantCategories,
  useRestaurantSubcategories,
  useRestaurantAddonGroups,
  useRestaurantUsers,
  useAddRestaurantMenuItem,
  useUpdateRestaurantMenuItem,
  useDeleteRestaurantMenuItem,
} from '@/api/queries/restaurant'
import type { MenuItemInput } from '@/api/services/restaurant'

/**
 * Restaurant Menu Items — full 13-field CRUD parity with legacy MenuItems.jsx.
 *
 * Fields preserved 1:1:
 *   branch · category · subcategory · addon groups · item name · price · MRP
 *   · our cost · dietary type · prep time · image · 4 toggles · description
 *
 * Why this exists: v2 previously had no menu items page (only variants +
 * addon mappings in extraSubpages.tsx). Customer site + cashier POS both
 * source from `/api/restaurant/menu_items/all` — losing the management UI
 * would have meant the whole menu-management flow had to fall back to
 * legacy. This restores parity inside the v2 shell.
 */

interface FormState {
  id?: number
  name: string
  description: string
  price: string
  mrp: string
  ourCost: string
  branchId: string
  categoryId: string
  subcategoryId: string
  dietaryType: 'VEG' | 'NON_VEG' | 'EGG'
  prepTimeMinutes: string
  addonGroupIds: number[]
  isActive: boolean
  isAvailable: boolean
  isOnline: boolean
  isRecommended: boolean
  image: File | null
  imagePreview: string | null
}

const EMPTY: FormState = {
  name: '', description: '', price: '', mrp: '', ourCost: '',
  branchId: '', categoryId: '', subcategoryId: '',
  dietaryType: 'VEG', prepTimeMinutes: '',
  addonGroupIds: [],
  isActive: true, isAvailable: true, isOnline: true, isRecommended: false,
  image: null, imagePreview: null,
}

function inr(n?: number): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function RestaurantMenuItemsPage() {
  const itemsQ = useRestaurantMenuItems()
  const catsQ = useRestaurantCategories()
  const subsQ = useRestaurantSubcategories()
  const addonsQ = useRestaurantAddonGroups()
  const usersQ = useRestaurantUsers()
  const addMut = useAddRestaurantMenuItem()
  const updateMut = useUpdateRestaurantMenuItem()
  const deleteMut = useDeleteRestaurantMenuItem()

  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)

  const branches = useMemo(
    () => (usersQ.data ?? []).filter((u) => (u.role ?? '').toLowerCase() === 'branch'),
    [usersQ.data],
  )

  const filteredSubs = useMemo(() => {
    if (!form.categoryId) return subsQ.data ?? []
    return (subsQ.data ?? []).filter((s) => {
      const cid = (s as { categoryId?: { id?: number } | number | null }).categoryId
      const idVal = typeof cid === 'object' && cid ? cid.id : cid
      return String(idVal ?? '') === form.categoryId
    })
  }, [subsQ.data, form.categoryId])

  const visibleItems = useMemo(() => {
    const all = itemsQ.data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((i) =>
      i.name.toLowerCase().includes(q) ||
      (i.description ?? '').toLowerCase().includes(q),
    )
  }, [itemsQ.data, search])

  const openCreate = () => { setForm(EMPTY); setOpen(true) }
  const openEdit = (id: number) => {
    const item = (itemsQ.data ?? []).find((i) => i.id === id)
    if (!item) return
    setForm({
      ...EMPTY,
      id: item.id,
      name: item.name ?? '',
      description: item.description ?? '',
      price: String(item.price ?? item.itemPrice ?? item.basePrice ?? ''),
      categoryId: item.categoryId?.id != null ? String(item.categoryId.id) : '',
      subcategoryId: item.subcategoryId?.id != null ? String(item.subcategoryId.id) : '',
      isAvailable: item.isAvailable ?? true,
      isActive: true,
      isOnline: true,
      isRecommended: false,
      dietaryType: item.isVeg === false ? 'NON_VEG' : 'VEG',
      imagePreview: item.imageUrl ?? null,
    })
    setOpen(true)
  }

  const handleImage = (file: File | null) => {
    if (!file) {
      setForm((p) => ({ ...p, image: null, imagePreview: null }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm((p) => ({ ...p, image: file, imagePreview: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  const submit = async () => {
    if (!form.name.trim()) { toast.warning('Item name is required'); return }
    if (!form.categoryId) { toast.warning('Category is required'); return }
    const price = Number(form.price)
    if (!Number.isFinite(price) || price <= 0) { toast.warning('Price must be a positive number'); return }

    const input: MenuItemInput = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price,
      mrp: form.mrp ? Number(form.mrp) : undefined,
      ourCost: form.ourCost ? Number(form.ourCost) : undefined,
      categoryId: Number(form.categoryId),
      subcategoryId: form.subcategoryId ? Number(form.subcategoryId) : undefined,
      branchId: form.branchId ? Number(form.branchId) : undefined,
      dietaryType: form.dietaryType,
      isVeg: form.dietaryType === 'VEG',
      prepTimeMinutes: form.prepTimeMinutes ? Number(form.prepTimeMinutes) : undefined,
      addonGroupIds: form.addonGroupIds.length ? form.addonGroupIds : undefined,
      isActive: form.isActive,
      isAvailable: form.isAvailable,
      isOnline: form.isOnline,
      isRecommended: form.isRecommended,
      image: form.image,
    }

    if (form.id != null) {
      const res = await updateMut.mutateAsync({ id: form.id, input })
      if (res.ok) { toast.success('Menu item updated'); setOpen(false) }
      else toast.error(res.message)
    } else {
      const res = await addMut.mutateAsync(input)
      if (res.ok) { toast.success('Menu item added'); setOpen(false) }
      else toast.error(res.message)
    }
  }

  const doDelete = async () => {
    if (!confirmDelete) return
    const res = await deleteMut.mutateAsync(confirmDelete.id)
    if (res.ok) toast.success(`Deleted "${confirmDelete.name}"`)
    else toast.error(res.message)
    setConfirmDelete(null)
  }

  const toggleAddon = (groupId: number) =>
    setForm((p) => ({
      ...p,
      addonGroupIds: p.addonGroupIds.includes(groupId)
        ? p.addonGroupIds.filter((g) => g !== groupId)
        : [...p.addonGroupIds, groupId],
    }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Items"
        description="Manage your full menu — items, prices, dietary tags, addons, images."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4 mr-1" />
            Add Item
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="relative max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description…"
              className="pl-9"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 px-2 w-16">Image</th>
                  <th className="py-2.5 px-2">Name</th>
                  <th className="py-2.5 px-2">Category</th>
                  <th className="py-2.5 px-2 text-right">Price</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">
                    {itemsQ.isLoading ? 'Loading…' : 'No items match your filter.'}
                  </td></tr>
                ) : visibleItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/60 hover:bg-accent/30 transition-colors">
                    <td className="py-2 px-2">
                      <ImageCell src={item.imageUrl ?? null} alt={item.name} size={40} />
                    </td>
                    <td className="py-2 px-2">
                      <p className="font-medium leading-tight">{item.name}</p>
                      {item.description ? (
                        <p className="text-xs text-muted-foreground truncate max-w-[260px]">{item.description}</p>
                      ) : null}
                    </td>
                    <td className="py-2 px-2 text-muted-foreground">{item.categoryId?.name ?? '—'}</td>
                    <td className="py-2 px-2 text-right font-medium">
                      {inr(item.price ?? item.itemPrice ?? item.basePrice)}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={item.isAvailable ? 'success' : 'destructive'}>
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                        {item.isVeg !== undefined && (
                          <Badge variant={item.isVeg ? 'success' : 'destructive'}>
                            {item.isVeg ? 'Veg' : 'Non-veg'}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(item.id)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => setConfirmDelete({ id: item.id, name: item.name })}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit menu item' : 'Add menu item'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Top row: branch + dietary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Select value={form.branchId} onValueChange={(v) => setForm((p) => ({ ...p, branchId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select branch (optional)" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Dietary type</Label>
                <Select value={form.dietaryType} onValueChange={(v) => setForm((p) => ({ ...p, dietaryType: v as FormState['dietaryType'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VEG">Veg</SelectItem>
                    <SelectItem value="NON_VEG">Non-Veg</SelectItem>
                    <SelectItem value="EGG">Egg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cat + Subcat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Category</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm((p) => ({ ...p, categoryId: v, subcategoryId: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {(catsQ.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subcategory</Label>
                <Select value={form.subcategoryId} onValueChange={(v) => setForm((p) => ({ ...p, subcategoryId: v }))}
                  disabled={!form.categoryId}>
                  <SelectTrigger><SelectValue placeholder={form.categoryId ? 'Select subcategory' : 'Pick a category first'} /></SelectTrigger>
                  <SelectContent>
                    {filteredSubs.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Name + Description */}
            <div className="space-y-1.5">
              <Label required>Item name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Paneer Tikka" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional details — preparation, allergens, etc."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[72px] resize-y" />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label required>Price (₹)</Label>
                <Input type="number" min={0} step="0.01" value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>MRP (₹)</Label>
                <Input type="number" min={0} step="0.01" value={form.mrp}
                  onChange={(e) => setForm((p) => ({ ...p, mrp: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Our cost (₹)</Label>
                <Input type="number" min={0} step="0.01" value={form.ourCost}
                  onChange={(e) => setForm((p) => ({ ...p, ourCost: e.target.value }))} />
              </div>
            </div>

            {/* Prep time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preparation time (minutes)</Label>
                <Input type="number" min={0} value={form.prepTimeMinutes}
                  onChange={(e) => setForm((p) => ({ ...p, prepTimeMinutes: e.target.value }))} placeholder="e.g. 20" />
              </div>
              <div className="space-y-1.5">
                <Label>Image</Label>
                <div className="flex items-center gap-3">
                  <ImageCell src={form.imagePreview} alt={form.name || 'preview'} size={56} />
                  <input type="file" accept="image/*"
                    onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
                    className="flex-1 text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Addon groups */}
            <div className="space-y-1.5">
              <Label>Addon groups (optional)</Label>
              <div className="flex flex-wrap gap-2 p-3 rounded-md border border-border bg-muted/40">
                {(addonsQ.data ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No addon groups configured yet.</p>
                ) : (
                  (addonsQ.data ?? []).map((g) => {
                    const selected = form.addonGroupIds.includes(g.id)
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => toggleAddon(g.id)}
                        className={
                          'text-xs px-2.5 py-1 rounded-full border transition-colors ' +
                          (selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground hover:text-foreground border-border')
                        }
                      >
                        {g.name}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="t-active" className="m-0">Active</Label>
                <Switch id="t-active" checked={form.isActive}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: !!v }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="t-avail" className="m-0">Available</Label>
                <Switch id="t-avail" checked={form.isAvailable}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isAvailable: !!v }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="t-online" className="m-0">Online</Label>
                <Switch id="t-online" checked={form.isOnline}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isOnline: !!v }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="t-recom" className="m-0">Recommended</Label>
                <Switch id="t-recom" checked={form.isRecommended}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isRecommended: !!v }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={addMut.isPending || updateMut.isPending}>
              {form.id ? 'Save changes' : 'Create item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete != null}
        onOpenChange={(v) => { if (!v) setConfirmDelete(null) }}
        title={`Delete "${confirmDelete?.name ?? ''}"?`}
        description="This menu item will be removed from your catalog. Existing orders are unaffected."
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
      />
    </div>
  )
}
