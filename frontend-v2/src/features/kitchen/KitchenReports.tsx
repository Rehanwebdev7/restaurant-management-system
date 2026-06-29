import { useMemo, useState } from 'react'
import {
  BarChart3,
  Calendar,
  ChefHat,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard, StatCardSkeleton } from '@/components/ui/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DateRangeField } from '@/components/ui/date-field'
import { ExportMenu, type ExportColumn } from '@/components/ui/export-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { useKitchenDashboard, useKitchenHistory } from '@/api/queries/kitchen'
import { cn } from '@/lib/utils'

/**
 * Kitchen Reports — date-range filter + summary stat cards + recent orders.
 * Wires `/api/kitchen/dashboard/summary` via useKitchenDashboard.
 * Presets (Today / Yesterday / Week / Month) compute the from/to dates and
 * feed the same hook. ExportMenu spits orders to Excel / CSV.
 */

type RangeKey = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM'

interface RangeBounds {
  fromDate: string
  toDate: string
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function startOfWeek(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay() // 0=Sun
  const diff = (day + 6) % 7 // shift so Monday=0
  x.setDate(x.getDate() - diff)
  return x
}

function presetBounds(key: Exclude<RangeKey, 'CUSTOM'>): RangeBounds {
  const today = new Date()
  if (key === 'TODAY') return { fromDate: toIsoDate(today), toDate: toIsoDate(today) }
  if (key === 'YESTERDAY') {
    const y = new Date(today)
    y.setDate(today.getDate() - 1)
    return { fromDate: toIsoDate(y), toDate: toIsoDate(y) }
  }
  if (key === 'WEEK') {
    return { fromDate: toIsoDate(startOfWeek(today)), toDate: toIsoDate(today) }
  }
  // MONTH
  const first = new Date(today.getFullYear(), today.getMonth(), 1)
  return { fromDate: toIsoDate(first), toDate: toIsoDate(today) }
}

const RANGES: { key: Exclude<RangeKey, 'CUSTOM'>; label: string }[] = [
  { key: 'TODAY', label: 'Today' },
  { key: 'YESTERDAY', label: 'Yesterday' },
  { key: 'WEEK', label: 'This week' },
  { key: 'MONTH', label: 'This month' },
]

function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

interface KitchenExportRow extends Record<string, unknown> {
  orderNumber: string
  customer: string
  type: string
  status: string
  total: number
  createdAt: string
}

const EXPORT_COLUMNS: ExportColumn<KitchenExportRow>[] = [
  { key: 'orderNumber', label: 'Order #' },
  { key: 'customer', label: 'Customer' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total (INR)' },
  { key: 'createdAt', label: 'Created at' },
]

export default function KitchenReports() {
  const [rangeKey, setRangeKey] = useState<RangeKey>('TODAY')
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined)

  const bounds: RangeBounds = useMemo(() => {
    if (rangeKey === 'CUSTOM' && customRange?.from && customRange?.to) {
      return { fromDate: toIsoDate(customRange.from), toDate: toIsoDate(customRange.to) }
    }
    if (rangeKey === 'CUSTOM' && customRange?.from) {
      return { fromDate: toIsoDate(customRange.from), toDate: toIsoDate(customRange.from) }
    }
    return presetBounds(rangeKey === 'CUSTOM' ? 'TODAY' : rangeKey)
  }, [rangeKey, customRange])

  const dashQ = useKitchenDashboard(bounds)
  const ordersQ = useKitchenHistory({ page: 1, pageSize: 50 })

  const d = dashQ.data
  const orders = ordersQ.data?.records ?? []

  const completed = useMemo(() => {
    if (!d?.ordersByStatus) return 0
    return Object.entries(d.ordersByStatus)
      .filter(([k]) => /ready|served|complete|delivered/i.test(k))
      .reduce((sum, [, v]) => sum + Number(v ?? 0), 0)
  }, [d])
  const cancelled = useMemo(() => {
    if (!d?.ordersByStatus) return 0
    return Object.entries(d.ordersByStatus)
      .filter(([k]) => /cancel/i.test(k))
      .reduce((sum, [, v]) => sum + Number(v ?? 0), 0)
  }, [d])

  const completionRate = d && d.totalOrders > 0 ? completed / d.totalOrders : 0
  const loading = dashQ.isLoading

  // Build top items by counting orderItemsCount per orderType bucket — proxy
  // top-items list until backend ships per-item rollups.
  const topByType = useMemo(() => {
    const m = new Map<string, number>()
    for (const o of orders) {
      const k = String(o.orderType ?? 'UNKNOWN').replace(/_/g, ' ')
      m.set(k, (m.get(k) ?? 0) + (o.orderItemsCount ?? 1))
    }
    return Array.from(m.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [orders])
  const maxItemCount = useMemo(
    () => Math.max(...topByType.map((i) => i.count), 1),
    [topByType]
  )

  const exportRows: KitchenExportRow[] = orders.map((o) => ({
    orderNumber: String(o.orderNumber ?? ''),
    customer: String(o.customerName ?? o.tableNumber ?? 'Walk-in'),
    type: String(o.orderType ?? ''),
    status: String(o.status ?? ''),
    total: Math.round(Number(o.totalAmount ?? 0)),
    createdAt: String(o.createdAt ?? ''),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kitchen Reports"
        description={
          d
            ? `${d.branchName} · ${d.fromDate} → ${d.toDate}`
            : 'Performance snapshot for your kitchen across selectable date ranges.'
        }
        breadcrumbs={[{ label: 'Kitchen', href: '/kitchen/dashboard' }, { label: 'Reports' }]}
        actions={
          <ExportMenu
            rows={exportRows}
            columns={EXPORT_COLUMNS}
            filename={`kitchen-orders-${bounds.fromDate}_to_${bounds.toDate}`}
          />
        }
      />

      {/* Range selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground mr-2">
              <Calendar className="size-3.5" /> Range
            </span>
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => {
                  setRangeKey(r.key)
                  setCustomRange(undefined)
                }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-quick ease-entrance active:scale-[0.97]',
                  rangeKey === r.key
                    ? 'bg-primary text-primary-foreground shadow-elevation-1'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {r.label}
              </button>
            ))}
            <div className="ml-auto w-full sm:w-72">
              <DateRangeField
                value={customRange}
                onChange={(r) => {
                  setCustomRange(r)
                  if (r?.from) setRangeKey('CUSTOM')
                }}
                placeholder="Custom range"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hero + secondary stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton hero />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              hero
              label="Total revenue"
              value={Number(d?.totalRevenue ?? 0)}
              format={(n) => formatINR(n)}
              icon={<TrendingUp className="size-5" />}
            />
            <StatCard
              label="Total orders"
              value={Number(d?.totalOrders ?? 0)}
              icon={<BarChart3 className="size-5" />}
            />
            <StatCard
              label="Completed"
              value={completed}
              icon={<CheckCircle2 className="size-5" />}
            />
            <StatCard
              label="Pending"
              value={Number(d?.pendingOrders ?? 0)}
              icon={<Clock className="size-5" />}
            />
          </>
        )}
      </section>

      {/* Top types + ops snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Orders by type</CardTitle>
            <CardDescription>Counted from the recent orders window.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton-shimmer h-6 rounded-md" />
                ))}
              </div>
            ) : topByType.length === 0 ? (
              <EmptyState
                icon={<ChefHat className="size-6" />}
                title="No orders in this window"
                description="Once orders flow in, breakdown by type will appear here."
              />
            ) : (
              <ul className="space-y-3">
                {topByType.map((item, i) => {
                  const pct = (item.count / maxItemCount) * 100
                  return (
                    <li key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2">
                          <Badge variant={i === 0 ? 'default' : 'secondary'} className="font-mono">
                            #{i + 1}
                          </Badge>
                          <span className="font-medium">{item.name}</span>
                        </span>
                        <span className="font-mono tabular-nums text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-[width] duration-slow ease-entrance"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ops snapshot</CardTitle>
            <CardDescription>Performance signals for the selected range.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Completion rate</p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-2xl font-bold tabular-nums">
                  {(completionRate * 100).toFixed(1)}%
                </p>
                <Badge variant={completionRate >= 0.85 ? 'success' : 'warning'} className="gap-1">
                  <CheckCircle2 className="size-3" /> {completionRate >= 0.85 ? 'Healthy' : 'Watch'}
                </Badge>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-success transition-[width] duration-slow ease-entrance"
                  style={{ width: `${completionRate * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Cancelled</p>
                <p className="text-xl font-bold tabular-nums mt-1">{cancelled}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Preparing</p>
                <p className="text-xl font-bold tabular-nums mt-1">{d?.preparingOrders ?? 0}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-border text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
              <ChefHat className="size-3" /> Live · /api/kitchen/dashboard/summary
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
