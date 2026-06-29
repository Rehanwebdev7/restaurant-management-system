import { Building2, Users, Receipt, TrendingUp, ShieldCheck, Bell, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard, StatCardSkeleton } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSuperadminDashboard, useSuperadminSubscriptions } from '@/api/queries/superadmin'

/**
 * Superadmin Dashboard — LIVE Spring Boot data.
 *  - /api/superadmin/dashboard/summary  (platform totals + top tenants)
 *  - /api/admin/subscriptions           (open subscriptions count)
 */
export default function SuperadminDashboard() {
  const dashQ = useSuperadminDashboard()
  const subsQ = useSuperadminSubscriptions()

  const d = dashQ.data
  const loading = dashQ.isLoading
  const totalRevenue = Number(d?.summary?.totalRevenue ?? 0)
  const openSubs = (subsQ.data ?? []).filter(
    (s) => (s.status ?? '').toLowerCase() === 'active'
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Superadmin Dashboard"
        description={d?.summary?.period ? `Window: ${d.summary.period.fromDate} → ${d.summary.period.toDate}` : 'Platform overview across all tenants.'}
        breadcrumbs={[{ label: 'Superadmin' }, { label: 'Dashboard' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => { void dashQ.refetch(); void subsQ.refetch() }}>
              <RefreshCw className={dashQ.isFetching || subsQ.isFetching ? 'size-4 animate-spin' : 'size-4'} />
              Refresh
            </Button>
            <Button asChild>
              <Link to="/superadmin/restaurants">Manage tenants</Link>
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
              label="Platform revenue"
              value={totalRevenue}
              format={(n) => `₹${Math.round(n).toLocaleString('en-IN')}`}
              icon={<TrendingUp className="size-5" />}
            />
            <StatCard
              label="Active tenants"
              value={d?.totalRestaurants ?? 0}
              icon={<Building2 className="size-5" />}
            />
            <StatCard
              label="Total customers"
              value={d?.totalCustomers ?? 0}
              icon={<Users className="size-5" />}
            />
            <StatCard
              label="Open subscriptions"
              value={openSubs}
              icon={<Receipt className="size-5" />}
            />
          </>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top restaurants</CardTitle>
            <CardDescription>By order volume in the current window.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton-shimmer h-10 rounded-md" />
                ))}
              </div>
            ) : (d?.topRestaurants ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No order activity in this window.</p>
            ) : (
              <ul className="space-y-2">
                {(d?.topRestaurants ?? []).slice(0, 5).map((r) => (
                  <li key={r.restaurantId} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate min-w-0">{r.restaurantName}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="tabular-nums text-muted-foreground">{r.totalOrders} orders</span>
                      {r.pendingOrders > 0 ? (
                        <Badge variant="warning">{r.pendingOrders} pending</Badge>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick admin</CardTitle>
            <CardDescription>
              {typeof d?.pendingApprovals === 'number' ? (
                <>
                  <span>{d.pendingApprovals} pending approval{d.pendingApprovals === 1 ? '' : 's'}.</span>
                </>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { to: '/superadmin/restaurants', label: 'Restaurants', icon: Building2 },
              { to: '/superadmin/users', label: 'Users', icon: Users },
              { to: '/superadmin/user-approvals', label: 'Approvals', icon: ShieldCheck },
              { to: '/superadmin/notifications', label: 'Notifications', icon: Bell },
            ].map((q) => {
              const I = q.icon
              return (
                <Link
                  key={q.to}
                  to={q.to}
                  className="rounded-md border border-border bg-card hover:border-primary/40 hover:bg-primary/5 p-3 flex items-center gap-2 transition-all duration-quick ease-entrance active:scale-[0.98]"
                >
                  <span className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                    <I className="size-4" />
                  </span>
                  <span className="text-sm font-medium">{q.label}</span>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
