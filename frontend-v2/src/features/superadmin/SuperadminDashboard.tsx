import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Users, Receipt, TrendingUp, RefreshCw,
  Hourglass, ShoppingBag, Clock, Calendar as CalendarIcon,
  LineChart as LineChartIcon, PieChart as PieChartIcon, Activity, Table as TableIcon,
  ChevronRight, ArrowUpRight,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts'
import { PageHeader } from '@/components/ui/page-header'
import { StatCardSkeleton } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import {
  useSuperadminDashboard, useSuperadminSubscriptions,
} from '@/api/queries/superadmin'
import type {
  SuperadminDashboard, SuperadminSubscription,
} from '@/api/services/superadmin'

/* ═══════════════════════════════════════════════════════════════════════════
 * Superadmin Dashboard — 2026-07-16 redesign
 *
 * 8 KPI cards → 2 charts (revenue line + status donut) → trend + approvals
 * → restaurant performance table. Everything driven by two existing hooks:
 * useSuperadminDashboard() (dashboard summary + trends + top tenants) and
 * useSuperadminSubscriptions() (used for active-subscriptions KPI and to
 * join Plan/Status onto the performance table).
 *
 * All colours from CSS design tokens. Currency stays ₹ (backend is INR).
 * ═══════════════════════════════════════════════════════════════════════ */

const INR = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const INR_SHORT = (n: number) => {
  const v = Math.round(n)
  if (Math.abs(v) >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)}Cr`
  if (Math.abs(v) >= 1_00_000)   return `₹${(v / 1_00_000).toFixed(1)}L`
  if (Math.abs(v) >= 1_000)      return `₹${(v / 1_000).toFixed(1)}k`
  return `₹${v}`
}

/** Today's ISO date (YYYY-MM-DD) in local time. */
const todayIso = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Days between today and an ISO date; negative means past. */
const daysUntil = (iso?: string | null): number => {
  if (!iso) return Number.POSITIVE_INFINITY
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY
  const ms = t - Date.now()
  return Math.round(ms / 86_400_000)
}

/* ────────────────────────────── mini components ────────────────────────── */

interface KpiProps {
  label: string
  value: string | number
  subtext?: string
  icon: ReactNode
  tint?: 'primary' | 'success' | 'warning' | 'destructive' | 'info'
  highlight?: boolean
}

const TINT_CLASSES = {
  primary:     { icon: 'text-primary bg-primary/10',         value: 'text-primary' },
  success:     { icon: 'text-success bg-success/10',         value: 'text-success' },
  warning:     { icon: 'text-warning bg-warning/10',         value: 'text-warning' },
  destructive: { icon: 'text-destructive bg-destructive/10', value: 'text-destructive' },
  info:        { icon: 'text-info bg-info/10',               value: 'text-info' },
} as const

function KpiCard({ label, value, subtext, icon, tint = 'primary', highlight = false }: KpiProps) {
  const t = TINT_CLASSES[tint]
  return (
    <Card
      className={cn(
        'p-5 relative overflow-hidden transition-all duration-quick ease-entrance',
        'hover:-translate-y-0.5 hover:shadow-elevation-2',
        highlight && 'ring-2 ring-primary/40 shadow-primary/10 shadow-lg',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground truncate">
            {label}
          </p>
          <p className={cn('text-3xl sm:text-4xl font-bold tracking-tight tabular-nums', t.value)}>
            {value}
          </p>
          {subtext ? (
            <p className="text-[11px] text-muted-foreground truncate">{subtext}</p>
          ) : null}
        </div>
        <div className={cn('size-10 rounded-lg grid place-items-center shrink-0', t.icon)}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

/** Small tooltip skin reused across the 3 charts. */
function ChartTooltip({ active, payload, label, valueFormatter }: {
  active?: boolean
  payload?: Array<{ value: number; name?: string; color?: string }>
  label?: string
  valueFormatter?: (n: number) => string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border border-border bg-popover text-popover-foreground px-3 py-2 shadow-elevation-2 text-xs">
      {label ? <p className="font-semibold mb-1">{label}</p> : null}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 tabular-nums">
          {p.color ? <span className="size-2 rounded-full" style={{ background: p.color }} /> : null}
          <span className="text-muted-foreground">{p.name ?? 'Value'}:</span>
          <span className="font-semibold">{valueFormatter ? valueFormatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────── main component ─────────────────────── */

export default function SuperadminDashboard() {
  const dashQ = useSuperadminDashboard()
  const subsQ = useSuperadminSubscriptions()

  const d: SuperadminDashboard | null = dashQ.data ?? null
  const loading = dashQ.isLoading

  /* ---------- derived KPI values ---------- */
  const totalRestaurants = d?.totalRestaurants ?? 0
  const totalCustomers   = d?.totalCustomers ?? 0
  const totalOrders      = d?.summary?.totalOrders ?? 0
  const totalRevenue     = Number(d?.summary?.totalRevenue ?? 0)
  const pendingApprovals = d?.pendingApprovals ?? 0

  const activeSubs = useMemo(
    () => (subsQ.data ?? []).filter((s) => (s.status ?? '').toLowerCase() === 'active').length,
    [subsQ.data],
  )
  const expiringSoon = useMemo(
    () => (subsQ.data ?? []).filter((s) => {
      if ((s.status ?? '').toLowerCase() !== 'active') return false
      const iso = s.endDate ?? s.graceEndDate
      const days = daysUntil(iso)
      return days >= 0 && days <= 30
    }).length,
    [subsQ.data],
  )

  const orderByStatus: Record<string, number> = d?.orderByStatus ?? {}
  const pendingOrders =
    (orderByStatus['PENDING'] ?? 0) +
    (orderByStatus['pending'] ?? 0) +
    (orderByStatus['Pending'] ?? 0)

  const todayRevenue = useMemo(() => {
    const t = todayIso()
    return (d?.revenueTrend ?? []).find((r) => r.date === t)?.revenue ?? 0
  }, [d?.revenueTrend])

  /* ---------- chart data ---------- */
  const revenueSeries = useMemo(
    () => (d?.revenueTrend ?? []).map((r) => ({
      date: r.date?.slice(0, 7) ?? r.date, // YYYY-MM for month labels
      revenue: r.revenue ?? 0,
    })),
    [d?.revenueTrend],
  )

  const statusSlices = useMemo(() => {
    const entries = Object.entries(orderByStatus).filter(([, v]) => Number(v) > 0)
    return entries.map(([k, v]) => ({ name: k, value: Number(v) }))
  }, [orderByStatus])

  const orderTrend7d = useMemo(
    () => (d?.dailyOrderTrend ?? []).slice(-7).map((r) => ({
      date: r.date,
      orderCount: r.orderCount ?? 0,
    })),
    [d?.dailyOrderTrend],
  )

  /* ---------- performance table data (joined with subs for plan/status) ---------- */
  const subsByRestaurant = useMemo(() => {
    const map = new Map<number, SuperadminSubscription>()
    for (const s of (subsQ.data ?? [])) {
      const rid = (s.user as { parentId?: { id?: number }; id: number } | null)?.parentId?.id
        ?? s.user?.id
      if (rid != null && !map.has(rid)) map.set(rid, s)
    }
    return map
  }, [subsQ.data])

  const performanceRows = useMemo(
    () => (d?.topRestaurants ?? []).slice(0, 5),
    [d?.topRestaurants],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Platform Overview"
        description={
          d?.summary?.period
            ? `All restaurants combined — window ${d.summary.period.fromDate} → ${d.summary.period.toDate}`
            : 'All restaurants combined — high-level summary.'
        }
        breadcrumbs={[{ label: 'Superadmin' }, { label: 'Dashboard' }]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => { void dashQ.refetch(); void subsQ.refetch() }}
            >
              <RefreshCw className={cn('size-4', (dashQ.isFetching || subsQ.isFetching) && 'animate-spin')} />
              Refresh
            </Button>
            <Button asChild>
              <Link to="/superadmin/restaurants">Manage tenants</Link>
            </Button>
          </>
        }
      />

      {/* ────── Section 1: 8 KPI cards ────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            {Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </>
        ) : (
          <>
            <KpiCard
              label="Total Restaurants"
              value={totalRestaurants}
              subtext={`${totalRestaurants} active`}
              icon={<Building2 className="size-5" />}
              tint="primary"
            />
            <KpiCard
              label="Active Subscriptions"
              value={activeSubs}
              subtext={`${expiringSoon} expiring soon`}
              icon={<Receipt className="size-5" />}
              tint="success"
            />
            <KpiCard
              label="Pending Approvals"
              value={pendingApprovals}
              subtext="Awaiting review"
              icon={<Hourglass className="size-5" />}
              tint="warning"
            />
            <KpiCard
              label="Total Customers"
              value={totalCustomers}
              subtext="Platform-wide"
              icon={<Users className="size-5" />}
              tint="info"
            />
            <KpiCard
              label="Total Orders"
              value={totalOrders}
              subtext="All restaurants"
              icon={<ShoppingBag className="size-5" />}
              tint="primary"
            />
            <KpiCard
              label="Pending Orders"
              value={pendingOrders}
              subtext="Across platform"
              icon={<Clock className="size-5" />}
              tint="warning"
              highlight
            />
            <KpiCard
              label="Total Revenue"
              value={INR(totalRevenue)}
              subtext="Platform total"
              icon={<TrendingUp className="size-5" />}
              tint="success"
            />
            <KpiCard
              label="Today's Revenue"
              value={INR(todayRevenue)}
              subtext="Live"
              icon={<CalendarIcon className="size-5" />}
              tint="info"
            />
          </>
        )}
      </section>

      {/* ────── Section 2: Revenue line + Status donut ────── */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Monthly Revenue Trend */}
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <LineChartIcon className="size-4 text-primary" />
            <CardTitle className="text-base">Monthly Revenue Trend (All Restaurants)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="skeleton-shimmer h-64 rounded-md" />
            ) : revenueSeries.length === 0 ? (
              <EmptyState
                icon={<LineChartIcon className="size-8" />}
                title="No revenue yet"
                description="Once orders come in, this chart will populate."
              />
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={INR_SHORT}
                    />
                    <RTooltip
                      content={<ChartTooltip valueFormatter={INR} />}
                      cursor={{ stroke: 'hsl(var(--primary))', strokeOpacity: 0.15, strokeWidth: 1 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <PieChartIcon className="size-4 text-warning" />
            <CardTitle className="text-base">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="skeleton-shimmer h-64 rounded-md" />
            ) : statusSlices.length === 0 ? (
              <EmptyState
                icon={<PieChartIcon className="size-8" />}
                title="No orders yet"
                description="Order status breakdown appears once orders are placed."
              />
            ) : (
              <StatusDonut slices={statusSlices} />
            )}
          </CardContent>
        </Card>
      </section>

      {/* ────── Section 3: 7-day trend + pending approvals ────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 7-Day Order Trend */}
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Activity className="size-4 text-success" />
            <CardTitle className="text-base">7-Day Order Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="skeleton-shimmer h-40 rounded-md" />
            ) : orderTrend7d.length === 0 ? (
              <EmptyState
                icon={<Activity className="size-8" />}
                title="No orders in the last 7 days"
                description="Recent activity will appear here."
              />
            ) : (
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={orderTrend7d} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="orderTrendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <RTooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--success))', strokeOpacity: 0.2 }} />
                    <Area
                      type="monotone"
                      dataKey="orderCount"
                      name="Orders"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      fill="url(#orderTrendFill)"
                      dot={{ fill: 'hsl(var(--success))', r: 3, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <div className="flex items-center gap-2">
              <Hourglass className="size-4 text-warning" />
              <CardTitle className="text-base">Pending Approvals</CardTitle>
            </div>
            {(d?.pendingApprovalsList?.length ?? 0) > 0 ? (
              <Link
                to="/superadmin/user-approvals"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                View all <ArrowUpRight className="size-3" />
              </Link>
            ) : null}
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton-shimmer h-11 rounded-md" />
                ))}
              </div>
            ) : (d?.pendingApprovalsList?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No pending approvals.</p>
            ) : (
              <ul className="space-y-2 max-h-56 overflow-y-auto themed-scrollbar pr-1">
                {(d!.pendingApprovalsList ?? []).slice(0, 8).map((a) => (
                  <li key={a.id}>
                    <Link
                      to="/superadmin/user-approvals"
                      className="flex items-center gap-3 p-2.5 rounded-md border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0 text-xs font-bold">
                        {(a.name ?? '?').trim()[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{a.name ?? 'Unnamed'}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {a.role ?? '—'} · {a.mobile ?? a.email ?? '—'}
                        </p>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ────── Section 4: Restaurant Performance Summary table ────── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <div className="flex items-center gap-2">
            <TableIcon className="size-4 text-primary" />
            <CardTitle className="text-base">Restaurant Performance Summary</CardTitle>
          </div>
          <Link
            to="/superadmin/restaurants"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            View All <ArrowUpRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-12 rounded-md" />
              ))}
            </div>
          ) : performanceRows.length === 0 ? (
            <EmptyState
              icon={<TableIcon className="size-8" />}
              title="No restaurant activity yet"
              description="Restaurant performance will appear as orders come in."
            />
          ) : (
            <div className="overflow-x-auto themed-scrollbar rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="text-left font-semibold px-3 py-2.5">Restaurant</th>
                    <th className="text-right font-semibold px-3 py-2.5">Total Orders</th>
                    <th className="text-right font-semibold px-3 py-2.5">Pending</th>
                    <th className="text-right font-semibold px-3 py-2.5">Completed</th>
                    <th className="text-right font-semibold px-3 py-2.5">Cancelled</th>
                    <th className="text-right font-semibold px-3 py-2.5">Revenue</th>
                    <th className="text-left font-semibold px-3 py-2.5">Plan</th>
                    <th className="text-left font-semibold px-3 py-2.5">Subscription</th>
                    <th className="text-left font-semibold px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceRows.map((r) => {
                    const sub = subsByRestaurant.get(r.restaurantId)
                    const planName = sub?.plan?.planName ?? '—'
                    const subStatus = (sub?.status ?? '').toLowerCase()
                    const subVariant: 'success' | 'warning' | 'destructive' | 'outline' =
                      subStatus === 'active'    ? 'success' :
                      subStatus === 'expired'   ? 'destructive' :
                      subStatus === 'cancelled' ? 'destructive' :
                      subStatus === 'grace'     ? 'warning' :
                      'outline'
                    const rowActive = subStatus === 'active'
                    return (
                      <tr
                        key={r.restaurantId}
                        className="border-t border-border hover:bg-accent/40 transition-colors"
                      >
                        <td className="px-3 py-2.5 font-medium">{r.restaurantName}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{r.totalOrders}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-warning font-semibold">
                          {r.pendingOrders}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-success">
                          {r.completedOrders}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-destructive">
                          {r.cancelledOrders}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                          {INR(r.totalRevenue)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="secondary">{planName}</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={subVariant}>{sub?.status ?? '—'}</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={rowActive ? 'success' : 'outline'}>
                            {rowActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ─────────────────────────── donut slice sub-component ─────────────────── */

const STATUS_COLOUR: Record<string, string> = {
  PENDING:    'hsl(var(--warning))',
  PREPARING:  'hsl(var(--info))',
  COMPLETED:  'hsl(var(--success))',
  DELIVERED:  'hsl(var(--success))',
  CANCELLED:  'hsl(var(--destructive))',
  REJECTED:   'hsl(var(--destructive))',
  OUT_FOR_DELIVERY: 'hsl(var(--info))',
}

function StatusDonut({ slices }: { slices: { name: string; value: number }[] }) {
  const total = slices.reduce((a, s) => a + s.value, 0)
  const colored = slices.map((s) => ({
    ...s,
    displayName: s.name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase()),
    color: STATUS_COLOUR[s.name.toUpperCase()] ?? 'hsl(var(--muted-foreground))',
  }))
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={colored}
              dataKey="value"
              nameKey="displayName"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {colored.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Pie>
            <RTooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="text-2xl font-bold tabular-nums">{total}</p>
        </div>
      </div>
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
        {colored.map((s) => (
          <li key={s.name} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.displayName}</span>
            <span className="tabular-nums font-semibold">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

