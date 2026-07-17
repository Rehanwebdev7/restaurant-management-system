import { useMemo, useState } from 'react'
import {
  Building2, Users, ChefHat, Bike, Wallet, ChevronDown, ChevronRight,
  UserPlus, Eye, RefreshCw, Search, LogIn, Phone, Mail, Calendar,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  useRestaurantTree, useRestaurantChildren, useRestaurantDetail, useImpersonateUser,
} from '@/api/queries/superadmin'
import CreateStaffModal from '@/features/superadmin/_shared/CreateStaffModal'
import { toast } from '@/lib/toast'
import type { RestaurantTreeNode, TreeChildNode } from '@/api/services/superadmin'

/** Compact date "DD/MM/YYYY" — reference uses this format on the tree card. */
function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch { return iso }
}

/**
 * Restaurant User Tree — parent restaurant list, expand row to load children.
 * Backend: /api/admin/users/tree → parents, /tree/{id} → children, /{id}/detail → drawer.
 * Each row: + Add Staff (opens CreateStaffModal), View Detail (opens Detail dialog).
 * Each child: View / Impersonate.
 */
export default function SuperadminUserDirectory() {
  const treeQ = useRestaurantTree()
  const impersonate = useImpersonateUser()
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [detailId, setDetailId] = useState<number | null>(null)
  const [addStaffFor, setAddStaffFor] = useState<{ id: number; name: string } | null>(null)
  const [query, setQuery] = useState('')

  const handleLogin = async (id: number, name: string) => {
    const res = await impersonate.mutateAsync(id)
    if (res.ok) toast.success(`Impersonation token issued for ${name}`)
    else toast.error(res.message)
  }

  const rows = treeQ.data ?? []
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      r.fullName.toLowerCase().includes(q) ||
      (r.email ?? '').toLowerCase().includes(q) ||
      (r.mobile ?? '').includes(q),
    )
  }, [rows, query])

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Directory"
        description="Click a restaurant to expand and see its branches, kitchen, delivery, and cashier staff."
        breadcrumbs={[{ label: 'Superadmin' }, { label: 'User Management' }, { label: 'User Directory' }]}
        actions={
          <Button variant="outline" onClick={() => void treeQ.refetch()}>
            <RefreshCw className={cn('size-4', treeQ.isFetching && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <Card>
        <div className="p-3 border-b border-border">
          <div className="relative max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search restaurants by name, email, or mobile…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {treeQ.isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-14 rounded-md" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Building2 className="size-8" />}
              title="No restaurants found"
              description={query ? 'Try adjusting your search.' : 'Onboard a restaurant to see it here.'}
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((r) => (
              <TreeRow
                key={r.userId}
                row={r}
                open={expanded.has(r.userId)}
                onToggle={() => toggle(r.userId)}
                onDetail={() => setDetailId(r.userId)}
                onAddStaff={() => setAddStaffFor({ id: r.userId, name: r.fullName })}
                onLogin={() => handleLogin(r.userId, r.fullName)}
                impersonating={impersonate.isPending}
              />
            ))}
          </ul>
        )}
      </Card>

      {/* Detail dialog */}
      <Dialog open={detailId != null} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-2xl">
          <RestaurantDetailContent id={detailId} />
        </DialogContent>
      </Dialog>

      {/* Create staff modal */}
      <CreateStaffModal
        open={addStaffFor != null}
        onClose={() => setAddStaffFor(null)}
        parentId={addStaffFor?.id ?? null}
        parentName={addStaffFor?.name}
      />
    </div>
  )
}

/* ────────────── Tree Row ────────────── */

function TreeRow({
  row, open, onToggle, onDetail, onAddStaff, onLogin, impersonating,
}: {
  row: RestaurantTreeNode
  open: boolean
  onToggle: () => void
  onDetail: () => void
  onAddStaff: () => void
  onLogin: () => void
  impersonating: boolean
}) {
  const childrenQ = useRestaurantChildren(open ? row.userId : null)

  const totalChildren = row.branchCount + row.kitchenCount + row.deliveryCount + row.cashierCount
  const initial = (row.fullName?.[0] ?? '?').toUpperCase()

  return (
    <li>
      <div className="p-4 hover:bg-accent/30 transition-colors">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded hover:bg-muted mt-1"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>

          {/* Big brand-letter avatar */}
          <div className="size-11 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary grid place-items-center shrink-0 font-bold text-lg border border-primary/20">
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            {/* Row 1 — name + ID chip + status */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-base truncate">{row.fullName || 'Unnamed'}</p>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                ID: {row.userId}
              </span>
              {row.isActive ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
                  <span className="size-1.5 rounded-full bg-success" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-muted-foreground" /> Inactive
                </span>
              )}
              {row.approvalStatus === 'APPROVED' ? null
                : row.approvalStatus === 'REJECTED' ? <Badge variant="destructive" className="text-[9px]">Rejected</Badge>
                : <Badge variant="warning" className="text-[9px]">{row.approvalStatus ?? 'Pending'}</Badge>}
            </div>

            {/* Row 2 — contact + join date icons */}
            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
              {row.mobile ? (
                <span className="inline-flex items-center gap-1.5"><Phone className="size-3" /> {row.mobile}</span>
              ) : null}
              {row.email ? (
                <span className="inline-flex items-center gap-1.5"><Mail className="size-3" /> {row.email}</span>
              ) : null}
              {row.createdAt ? (
                <span className="inline-flex items-center gap-1.5"><Calendar className="size-3" /> {fmtDate(row.createdAt)}</span>
              ) : null}
            </div>
          </div>

          {/* Staff count icon pills — matches reference layout (color per role) */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {row.branchCount > 0 ? (
              <RolePill color="var(--info, hsl(199 89% 48%))" icon={<Users className="size-3" />} value={row.branchCount} title={`${row.branchCount} branches`} />
            ) : null}
            {row.kitchenCount > 0 ? (
              <RolePill color="hsl(24 95% 53%)" icon={<ChefHat className="size-3" />} value={row.kitchenCount} title={`${row.kitchenCount} kitchen`} />
            ) : null}
            {row.deliveryCount > 0 ? (
              <RolePill color="hsl(142 71% 45%)" icon={<Bike className="size-3" />} value={row.deliveryCount} title={`${row.deliveryCount} delivery`} />
            ) : null}
            {row.cashierCount > 0 ? (
              <RolePill color="hsl(271 91% 65%)" icon={<Wallet className="size-3" />} value={row.cashierCount} title={`${row.cashierCount} cashier`} />
            ) : null}
          </div>

          {/* USERS total counter */}
          <div className="hidden md:flex flex-col items-center shrink-0 px-3">
            <p className="text-xl font-bold tabular-nums leading-none">{totalChildren}</p>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">Users</p>
          </div>

          {/* Actions — View Users / Login / Add */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="outline" size="sm" onClick={onToggle} title="View users">
              <Users className="size-4" /> <span className="hidden lg:inline">View Users</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogin}
              disabled={impersonating}
              title="Impersonate this restaurant owner"
            >
              <LogIn className="size-4" /> <span className="hidden lg:inline">Login</span>
            </Button>
            <Button size="sm" onClick={onAddStaff} title="Add staff under this restaurant">
              <UserPlus className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDetail} title="Detail">
              <Eye className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="pl-14 pr-3 pb-4 bg-muted/20">
          {childrenQ.isLoading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-9 rounded-md" />
              ))}
            </div>
          ) : (childrenQ.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No staff yet. Click <span className="font-semibold">Add Staff</span> to onboard branch / kitchen / delivery / cashier users under this restaurant.
            </p>
          ) : (
            <ChildrenGrouped rows={childrenQ.data ?? []} parentUserId={row.userId} />
          )}
          {totalChildren !== ((childrenQ.data ?? []).length) && childrenQ.data ? (
            <p className="text-[10px] text-muted-foreground pt-2">
              Tip: reported counts ({totalChildren}) may include grandchildren; loaded direct children = {childrenQ.data.length}.
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

function RolePill({ color, icon, value, title }: { color: string; icon: React.ReactNode; value: number; title: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
      style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
    >
      {icon}
      {value}
    </span>
  )
}

/* ────────────── Grouped children (branch/kitchen/delivery/cashier) ────────────── */

function ChildrenGrouped({ rows, parentUserId }: { rows: TreeChildNode[]; parentUserId: number }) {
  const groups: Record<string, TreeChildNode[]> = { branch: [], kitchen: [], delivery: [], cashier: [], other: [] }
  for (const c of rows) {
    const key = ['branch', 'kitchen', 'delivery', 'cashier'].includes(c.role.toLowerCase()) ? c.role.toLowerCase() : 'other'
    groups[key]!.push(c)
  }
  const impersonate = useImpersonateUser()

  const handleImpersonate = async (id: number, name: string) => {
    const res = await impersonate.mutateAsync(id)
    if (res.ok) toast.success(`Impersonation token issued for ${name}`)
    else toast.error(res.message)
  }

  const groupOrder: Array<{ key: keyof typeof groups; label: string; icon: React.ReactNode }> = [
    { key: 'branch',   label: 'Branch',   icon: <Building2 className="size-3.5" /> },
    { key: 'kitchen',  label: 'Kitchen',  icon: <ChefHat className="size-3.5" /> },
    { key: 'delivery', label: 'Delivery', icon: <Bike className="size-3.5" /> },
    { key: 'cashier',  label: 'Cashier',  icon: <Wallet className="size-3.5" /> },
  ]

  return (
    <div className="space-y-3 py-2">
      {groupOrder.map(({ key, label, icon }) => {
        const list = groups[key] ?? []
        if (list.length === 0) return null
        return (
          <div key={key}>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1 flex items-center gap-1">
              {icon} {label} ({list.length})
            </p>
            <ul className="space-y-1">
              {list.map((c) => (
                <li key={c.userId} className="flex items-center gap-3 p-2 rounded-md border border-border bg-card">
                  <div className="size-7 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0 text-xs font-bold">
                    {(c.fullName?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.fullName || 'Unnamed'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{c.mobile ?? c.email ?? '—'}</p>
                  </div>
                  {c.isActive ? <Badge variant="success" className="text-[9px]">Active</Badge> : <Badge variant="secondary" className="text-[9px]">Off</Badge>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleImpersonate(c.userId, c.fullName)}
                    disabled={impersonate.isPending}
                    title="Impersonate this user"
                  >
                    <Users className="size-3.5" /> <span className="hidden md:inline text-[10px]">Impersonate</span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      {groups.other!.length > 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Unclassified role rows: {groups.other!.length} (parent #{parentUserId})
        </p>
      ) : null}
    </div>
  )
}

/* ────────────── Detail dialog content ────────────── */

function RestaurantDetailContent({ id }: { id: number | null }) {
  const q = useRestaurantDetail(id)
  const d = q.data
  return (
    <>
      <DialogHeader>
        <DialogTitle>{d?.fullName || 'Restaurant Detail'}</DialogTitle>
        <DialogDescription>
          {d?.role ?? '—'} · #{d?.userId ?? id}
        </DialogDescription>
      </DialogHeader>
      {q.isLoading ? (
        <div className="space-y-2 py-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-shimmer h-6 rounded" />)}
        </div>
      ) : !d ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Detail not available.</p>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto themed-scrollbar pr-1">
          <Row label="Email"           value={d.email ?? '—'} />
          <Row label="Mobile"          value={d.mobile ?? '—'} />
          <Row label="City"            value={d.city ?? '—'} />
          <Row label="State"           value={d.state ?? '—'} />
          <Row label="Pincode"         value={d.pincode ?? '—'} />
          <Row label="GST"             value={d.gstNumber ?? '—'} />
          <Row label="Approval"        value={d.approvalStatus ?? '—'} />
          <Row label="Status"          value={d.isActive ? 'Active' : 'Inactive'} />
          <Row label="Created"         value={d.createdAt ? new Date(d.createdAt).toLocaleString('en-IN') : '—'} />
          <div className="grid grid-cols-4 gap-2 pt-2">
            <MiniStat label="Branch" value={d.branch.length} />
            <MiniStat label="Kitchen" value={d.kitchen.length} />
            <MiniStat label="Delivery" value={d.delivery.length} />
            <MiniStat label="Cashier" value={d.cashier.length} />
          </div>
        </div>
      )}
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 text-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[100px]">{label}</span>
      <span className="text-right break-words">{value}</span>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border p-2 text-center">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}

/* Card wrap for the whole page (unused import shim guard) */
void CardContent
