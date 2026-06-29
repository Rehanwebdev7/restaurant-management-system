import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChefHat, ClipboardList, Clock, CheckCircle2, BarChart3, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard, StatCardSkeleton } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { OnboardingTour, type OnboardingStep } from '@/components/ui/onboarding-tour'
import { useKitchenDashboard, useKitchenHistory } from '@/api/queries/kitchen'
import { playSound, useAudioUnlock } from '@/lib/audio/sound-manager'
import { cn } from '@/lib/utils'

/**
 * Kitchen Dashboard — LIVE Spring Boot.
 *  - /api/kitchen/dashboard/summary (totals, by-status, by-type)
 *  - /api/kitchen/orders/history    (recent feed, paginated)
 *  - 15-second polling per UI-F-10.
 *  - New-order flash: when a fresh order id arrives between polls, play the
 *    `order-received` sound and pulse a 2-second accent ring around Pending.
 */
export default function KitchenDashboard() {
  const { t } = useTranslation()
  const dashQ = useKitchenDashboard()
  const historyQ = useKitchenHistory({ page: 1, pageSize: 6 })
  const recent = historyQ.data?.records ?? []
  const d = dashQ.data
  const loading = dashQ.isLoading || historyQ.isLoading

  // UI-F-52: Onboarding tour — runs once per role, persists in localStorage.
  const tourSteps = useMemo<OnboardingStep[]>(
    () => [
      {
        target: '[data-tour="kitchen-dashboard-overview"]',
        title: t('tour.kitchenDashboardOverviewTitle'),
        body: t('tour.kitchenDashboardOverviewBody'),
      },
      {
        target: '[data-tour="kitchen-kds-link"]',
        title: t('tour.kdsLinkTitle'),
        body: t('tour.kdsLinkBody'),
      },
      {
        target: '[data-tour="kitchen-refresh"]',
        title: t('tour.refreshButtonTitle'),
        body: t('tour.refreshButtonBody'),
      },
    ],
    [t]
  )

  useAudioUnlock()
  const [pendingFlash, setPendingFlash] = useState(false)
  const seenIds = useRef<Set<number>>(new Set())
  const firstRun = useRef(true)

  useEffect(() => {
    if (firstRun.current) {
      recent.forEach((o) => seenIds.current.add(o.id))
      firstRun.current = false
      return
    }
    const fresh = recent.filter((o) => !seenIds.current.has(o.id))
    if (fresh.length > 0) {
      fresh.forEach((o) => seenIds.current.add(o.id))
      playSound('order-received')
      setPendingFlash(true)
      const t = window.setTimeout(() => setPendingFlash(false), 2000)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [recent])

  return (
    <div className="space-y-6">
      <div data-tour="kitchen-dashboard-overview">
        <PageHeader
          title="Kitchen Dashboard"
          description={d ? `${d.branchName} · ${d.fromDate} → ${d.toDate}` : 'Live polling every 15 s.'}
          breadcrumbs={[{ label: 'Kitchen' }, { label: 'Dashboard' }]}
          actions={
            <>
              <Button
                data-tour="kitchen-refresh"
                variant="outline"
                onClick={() => {
                  void dashQ.refetch()
                  void historyQ.refetch()
                }}
              >
                <RefreshCw className={dashQ.isFetching || historyQ.isFetching ? 'size-4 animate-spin' : 'size-4'} />
                Refresh
              </Button>
              <Button asChild data-tour="kitchen-kds-link">
                <Link to="/kitchen/display">
                  <ChefHat className="size-4" /> Open KDS Display
                </Link>
              </Button>
            </>
          }
        />
      </div>

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
              label="Active queue"
              value={(d?.pendingOrders ?? 0) + (d?.preparingOrders ?? 0)}
              icon={<ClipboardList className="size-5" />}
            />
            <StatCard
              label="Pending"
              value={d?.pendingOrders ?? 0}
              icon={<Clock className="size-5" />}
              className={cn(
                'transition-shadow duration-quick',
                pendingFlash && 'ring-2 ring-primary/70 ring-offset-2 ring-offset-background animate-pulse'
              )}
            />
            <StatCard label="Cooking" value={d?.preparingOrders ?? 0} icon={<ChefHat className="size-5" />} />
            <StatCard label="Ready" value={d?.readyOrders ?? 0} icon={<CheckCircle2 className="size-5" />} />
          </>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div className="space-y-1">
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Latest from /api/kitchen/orders/history.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/kitchen/orders">View all <BarChart3 className="size-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton-shimmer h-12 rounded-md" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                icon={<ChefHat className="size-6" />}
                title="No orders in this window"
                description="When orders arrive they'll appear here. Polling continues every 15 s."
              />
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((o) => (
                  <li key={String(o.id)} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono font-semibold truncate">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {o.tableNumber ? `Table ${o.tableNumber}` : o.customerName ?? '—'} · {o.orderType}
                      </p>
                    </div>
                    <Badge variant="outline">{o.status}</Badge>
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
            <CardTitle>By status</CardTitle>
            <CardDescription>Live breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {d?.ordersByStatus && Object.keys(d.ordersByStatus).length > 0 ? (
              Object.entries(d.ordersByStatus).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <Badge variant="outline">{k}</Badge>
                  <span className="font-mono tabular-nums">{v}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No status counts yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <OnboardingTour role="kitchen" steps={tourSteps} />
    </div>
  )
}
