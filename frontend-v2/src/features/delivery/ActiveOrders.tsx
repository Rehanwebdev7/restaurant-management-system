import { Bike, MapPin, Phone, CheckCircle2, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from '@/lib/toast'
import { useDeliveryActiveOrders } from '@/api/queries/delivery'
import type { DeliveryActiveOrder } from '@/api/services/delivery'

/**
 * Active deliveries — wired to `/api/delivery/orders/active`. The legacy
 * sample payload shape was preserved on the backend (orderNumber, customer,
 * phone, address, amount, distance, eta), so the row renderer is unchanged.
 * When the backend route is unavailable the hook resolves to an empty array
 * and we show the EmptyState — no more mock rows masquerading as live data.
 */
export default function ActiveOrders() {
  const q = useDeliveryActiveOrders()
  const orders = (q.data ?? []) as Array<DeliveryActiveOrder & {
    phone?: string; address?: string
  }>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Orders"
        description="Live deliveries in progress."
        breadcrumbs={[{ label: 'Delivery', href: '/delivery/dashboard' }, { label: 'Active Orders' }]}
        actions={
          <Button variant="outline" size="sm" onClick={() => void q.refetch()}>
            <RefreshCw className={q.isFetching ? 'size-4 animate-spin' : 'size-4'} />
            Refresh
          </Button>
        }
      />

      {q.isLoading ? (
        <Card><CardContent className="pt-6"><div className="skeleton-shimmer h-28 rounded-md" /></CardContent></Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<Bike className="size-6" />}
              title="No active deliveries"
              description="New orders assigned to you will appear here in real time."
            />
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Card interactive>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono font-bold">{o.orderNumber ?? `#${o.id}`}</p>
                      <p className="text-base font-semibold mt-0.5">{o.customer ?? '—'}</p>
                      {o.address ? (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          <MapPin className="size-3 inline mr-1" /> {o.address}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums">
                        ₹{Number(o.amount ?? 0).toLocaleString('en-IN')}
                      </p>
                      {o.distance || o.eta ? (
                        <Badge variant="info" className="mt-1">
                          {o.distance ?? ''}{o.distance && o.eta ? ' · ' : ''}{o.eta ? `ETA ${o.eta}` : ''}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1"
                      onClick={() => o.phone ? (window.location.href = `tel:${o.phone}`) : toast.info('Customer phone not on file')}>
                      <Phone className="size-4" /> Call
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1"
                      onClick={() => o.address ? window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(o.address)}`, '_blank') : toast.info('No address provided')}>
                      <MapPin className="size-4" /> Navigate
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => toast.success(`${o.orderNumber ?? '#' + o.id} marked delivered`)}
                    >
                      <CheckCircle2 className="size-4" /> Delivered
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
