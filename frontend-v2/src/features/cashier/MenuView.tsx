import { useMemo, useState } from 'react'
import { Search, Tag, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useCashierMenu, useCashierMenuCategories, menuItemPrice } from '@/api/queries/cashier'
import { cn } from '@/lib/utils'

export default function MenuView() {
  const itemsQ = useCashierMenu()
  const catsQ = useCashierMenuCategories()
  const items = itemsQ.data ?? []
  const cats = catsQ.data ?? []
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const categoryName = (it: { categoryId?: { id?: number; name?: string } | null }) =>
    cats.find((c) => c.id === it.categoryId?.id)?.name ?? '—'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((m) => {
      if (categoryId !== null && m.categoryId?.id !== categoryId) return false
      if (!q) return true
      return m.name.toLowerCase().includes(q)
    })
  }, [items, categoryId, search])

  const loading = itemsQ.isLoading || catsQ.isLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu"
        description={`Live from backend · ${items.length} items across ${cats.length} categories`}
        breadcrumbs={[{ label: 'Cashier', href: '/cashier/dashboard' }, { label: 'Menu' }]}
        actions={
          <Button variant="outline" onClick={() => { void itemsQ.refetch(); void catsQ.refetch() }}>
            <RefreshCw className={itemsQ.isFetching || catsQ.isFetching ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input placeholder="Search menu…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoryId(null)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-quick ease-entrance active:scale-[0.97]',
                categoryId === null ? 'bg-primary text-primary-foreground shadow-elevation-1' : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              All
            </button>
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-quick ease-entrance active:scale-[0.97]',
                  categoryId === c.id ? 'bg-primary text-primary-foreground shadow-elevation-1' : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <div className="rounded-lg border border-border bg-card p-5 space-y-2">
                <div className="skeleton-shimmer h-4 w-2/3 rounded" />
                <div className="skeleton-shimmer h-3 w-1/3 rounded" />
                <div className="skeleton-shimmer h-6 w-1/4 rounded" />
              </div>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="pt-6"><EmptyState icon={<Tag className="size-6" />} title="No items match" description="Try a different category or search term." /></CardContent></Card>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => (
            <li key={m.id}>
              <Card interactive className={cn(!m.isAvailable && 'opacity-60')}>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Tag className="size-3" /> {categoryName(m)}
                      </p>
                    </div>
                    <p className="text-lg font-bold tabular-nums">₹{menuItemPrice(m).toLocaleString('en-IN')}</p>
                  </div>
                  {!m.isAvailable ? <Badge variant="warning">Out of stock</Badge> : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
