import { Bike, Clock, Wallet, ClipboardList, TrendingUp, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard, StatCardSkeleton } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { useDeliveryDashboard, useDeliveryActiveOrders, useDeliveryWallet } from '@/api/queries/delivery'

/**
 * Delivery dashboard — wired to `/api/delivery/dashboard/summary`,
 * `/orders/active`, and `/wallet`. No more fake "₹4,820 ready to withdraw"
 * teaser: when the wallet hasn't been funded the balance is honestly ₹0
 * and the withdraw button is gated.
 */
export default function DeliveryDashboard() {
  const dashQ = useDeliveryDashboard()
  const activeQ = useDeliveryActiveOrders()
  const walletQ = useDeliveryWallet()

  const today = dashQ.data ?? null
  const activeOrders = activeQ.data ?? []
  const wallet = walletQ.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Dashboard"
        description="Your shift snapshot — earnings, active deliveries, and recent orders."
        breadcrumbs={[{ label: 'Delivery' }, { label: 'Dashboard' }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => { void dashQ.refetch(); void activeQ.refetch(); void walletQ.refetch() }}>
              <RefreshCw className={dashQ.isFetching ? 'size-4 animate-spin' : 'size-4'} />
            </Button>
            <Button asChild>
              <Link to="/delivery/active">
                <Bike className="size-4" /> Active orders
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dashQ.isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              hero
              label="Today earnings"
              value={Number(today?.todayEarnings ?? 0)}
              format={(n) => `₹${Math.round(n).toLocaleString('en-IN')}`}
              icon={<TrendingUp className="size-5" />}
            />
            <StatCard label="Delivered" value={Number(today?.todayDeliveries ?? 0)} icon={<ClipboardList className="size-5" />} />
            <StatCard label="Pending" value={Number(today?.pendingPickups ?? activeOrders.length)} icon={<Clock className="size-5" />} />
            <StatCard
              label="Avg delivery"
              value={Number(today?.['avgMinutes'] ?? 0)}
              format={(n) => n > 0 ? `${Math.round(n)} min` : '—'}
              icon={<Bike className="size-5" />}
            />
          </>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle>Active deliveries</CardTitle>
              <CardDescription>Tap one to navigate.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void activeQ.refetch()}>
              <RefreshCw className={activeQ.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {activeQ.isLoading ? (
              <div className="skeleton-shimmer h-24 rounded-md" />
            ) : activeOrders.length === 0 ? (
              <EmptyState
                icon={<Bike className="size-6" />}
                title="No active deliveries"
                description="When a new order is assigned to you it'll appear here with turn-by-turn navigation."
                action={
                  <Button variant="outline" asChild>
                    <Link to="/delivery/history">View history</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-2">
                {activeOrders.slice(0, 4).map((o) => (
                  <li key={o.id}>
                    <Link to="/delivery/active" className="flex items-center justify-between gap-3 p-3 rounded-md border border-border hover:bg-accent/30 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-semibold">{o.orderNumber ?? `#${o.id}`}</p>
                        <p className="text-xs text-muted-foreground truncate">{(o.customer ?? '—')}</p>
                      </div>
                      <p className="text-sm font-bold tabular-nums">₹{Number(o.amount ?? 0).toLocaleString('en-IN')}</p>
                    </Link>
                  </li>
                ))}
                {activeOrders.length > 4 ? (
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/delivery/active">View all {activeOrders.length} active</Link>
                  </Button>
                ) : null}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
            <CardDescription>Pending payout summary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-primary/5 border border-primary/20 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Available balance</p>
              <p className="text-3xl font-bold tabular-nums mt-1">
                ₹{Number(wallet?.balance ?? 0).toLocaleString('en-IN')}
              </p>
              {Number(wallet?.balance ?? 0) > 0 ? (
                <Badge variant="success" className="mt-2 gap-1">
                  <Wallet className="size-3" /> Ready to withdraw
                </Badge>
              ) : (
                <Badge variant="secondary" className="mt-2 gap-1">
                  <Wallet className="size-3" /> No balance yet
                </Badge>
              )}
            </div>
            <Button className="w-full" asChild disabled={Number(wallet?.balance ?? 0) <= 0}>
              <Link to="/delivery/wallet">Open wallet</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
