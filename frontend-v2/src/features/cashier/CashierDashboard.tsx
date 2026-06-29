import {
  IndianRupee,
  ClipboardList,
  Receipt,
  ChefHat,
  Utensils,
  Bike,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  Plus,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard, StatCardSkeleton } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useCashierDashboard, useCashierOrders } from '@/api/queries/cashier'

/**
 * Cashier Dashboard — LIVE Spring Boot data.
 *  - /api/cashier/dashboard/summary (totals, by-status, by-type, by-payment)
 *  - /api/cashier/orders/history    (recent activity, paginated)
 */
export default function CashierDashboard() {
  const dashboardQ = useCashierDashboard()
  const ordersQ = useCashierOrders({ page: 1, pageSize: 8 })

  const d = dashboardQ.data
  const orders = ordersQ.data?.records ?? []
  const loading = dashboardQ.isLoading || ordersQ.isLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cashier Dashboard"
        description={d ? `${d.cashierName} · ${d.branchName}` : 'Live overview of POS activity.'}
        breadcrumbs={[{ label: 'Cashier' }, { label: 'Dashboard' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => { void dashboardQ.refetch(); void ordersQ.refetch() }}>
              <RefreshCw className={dashboardQ.isFetching || ordersQ.isFetching ? 'size-4 animate-spin' : 'size-4'} />
              Refresh
            </Button>
            <Button asChild>
              <Link to="/cashier/new-order">
                <Plus className="size-4" /> New order
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              label="Revenue (30 days)"
              value={Number(d?.totalRevenue ?? 0)}
              format={(n) => `₹${Math.round(n).toLocaleString('en-IN')}`}
              icon={<TrendingUp className="size-5" />}
            />
            <StatCard label="Total orders" value={d?.totalOrders ?? 0} icon={<ClipboardList className="size-5" />} />
            <StatCard label="Pending" value={d?.pendingOrders ?? 0} icon={<ChefHat className="size-5" />} />
            <StatCard
              label="Avg ticket"
              value={Number(d?.averageOrderValue ?? 0)}
              format={(n) => `₹${Math.round(n).toLocaleString('en-IN')}`}
              icon={<IndianRupee className="size-5" />}
            />
          </>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div className="space-y-1">
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Live from /api/cashier/orders/history · refreshes every 30 s.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/cashier/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton-shimmer h-12 rounded-md" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                icon={<Receipt className="size-6" />}
                title="No orders yet"
                description="Create the first order to see it appear here."
                action={
                  <Button asChild>
                    <Link to="/cashier/new-order">
                      <Plus className="size-4" /> New order
                    </Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {orders.slice(0, 6).map((o) => (
                  <li key={String(o.id)} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-semibold truncate">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {o.customerName ?? (o.tableNumber ? `Table ${o.tableNumber}` : 'Walk-in')} · {o.orderType}
                      </p>
                    </div>
                    <Badge variant={o.status === 'COMPLETED' ? 'success' : o.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                      {o.status}
                    </Badge>
                    <p className="text-sm font-semibold tabular-nums">
                      ₹{Math.round(Number(o.totalAmount ?? 0)).toLocaleString('en-IN')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breakdown</CardTitle>
            <CardDescription>By order type · live.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'DINING', label: 'Dine-in', icon: Utensils },
              { key: 'TAKEAWAY', label: 'Takeaway', icon: ShoppingBag },
              { key: 'DELIVERY', label: 'Delivery', icon: Bike },
            ].map((row) => {
              const Icon = row.icon
              const count = d?.ordersByType?.[row.key] ?? 0
              return (
                <div key={row.key} className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <span className="size-8 rounded-md bg-primary/10 text-primary grid place-items-center"><Icon className="size-4" /></span>
                    {row.label}
                  </span>
                  <span className="font-mono tabular-nums">{count}</span>
                </div>
              )
            })}
            <div className="pt-3 border-t border-border space-y-1.5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Quick links</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" asChild><Link to="/cashier/menu-view">Menu</Link></Button>
                <Button variant="outline" size="sm" asChild><Link to="/cashier/customers">Customers</Link></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
