import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import {
  ChefHat, CheckCircle2, Clock, Bell, Soup, Flame, PackageCheck, RefreshCw, Pause, Play, Wifi, WifiOff,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useKitchenHistory } from '@/api/queries/kitchen'
import type { KitchenOrder } from '@/api/services/kitchen'
import { advanceKitchenStatus } from '@/api/services/kitchen'
import { useKitchenWebSocket, type KitchenWebSocketMessage } from '@/hooks/use-kitchen-websocket'
import { toast } from '@/lib/toast'
import { playSound, useAudioUnlock } from '@/lib/audio/sound-manager'
import { cn } from '@/lib/utils'

/**
 * KDS Display — REAL backend data via /api/kitchen/orders/history.
 * Polling every 15 s. Tap "Start cooking" / "Mark ready" to advance status
 * via /api/kitchen/orders/update_status (mutation invalidates the cache).
 */

type ColumnKey = 'PENDING' | 'COOKING' | 'READY'

const COLUMNS: { key: ColumnKey; label: string; matcher: (s: string) => boolean; icon: typeof ChefHat; tone: string }[] = [
  { key: 'PENDING', label: 'Pending', matcher: (s) => /pending|new|accepted|placed/i.test(s), icon: Bell,         tone: 'border-warning/40 bg-warning/5' },
  { key: 'COOKING', label: 'Cooking', matcher: (s) => /cook|prepar|in_progress/i.test(s),     icon: Flame,        tone: 'border-primary/40 bg-primary/5' },
  { key: 'READY',   label: 'Ready',   matcher: (s) => /ready|served|complete/i.test(s),       icon: PackageCheck, tone: 'border-success/40 bg-success/5' },
]

function classifyColumn(status: string): ColumnKey {
  for (const c of COLUMNS) if (c.matcher(status ?? '')) return c.key
  return 'PENDING'
}

function nextStatusFor(col: ColumnKey): { value: string; label: string } | null {
  if (col === 'PENDING') return { value: 'PREPARING', label: 'Start cooking' }
  if (col === 'COOKING') return { value: 'READY', label: 'Mark ready' }
  return null
}

function typeBadgeVariant(t: string) {
  if (/DELIVERY/i.test(t)) return 'info' as const
  if (/TAKEAWAY/i.test(t)) return 'warning' as const
  return 'secondary' as const
}

function elapsedMs(iso: string) {
  try { return Date.now() - new Date(iso).getTime() } catch { return 0 }
}

function formatElapsed(ms: number) {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function KitchenDisplay() {
  const ordersQ = useKitchenHistory({ page: 1, pageSize: 50 })
  const qc = useQueryClient()
  const [paused, setPaused] = useState(false)
  const [flash, setFlash] = useState(false)
  useAudioUnlock()
  const orders = ordersQ.data?.records ?? []

  // UI-F-10: WebSocket augments the 15s polling. When a message lands,
  // invalidate the kitchen cache + play the order-received sound.
  const onWsMessage = useCallback(
    (_msg: KitchenWebSocketMessage) => {
      void qc.invalidateQueries({ queryKey: ['kitchen'] })
      playSound('order-received')
    },
    [qc]
  )
  const { connected: wsConnected } = useKitchenWebSocket({ onMessage: onWsMessage })

  // UI-F-2: Pull-to-refresh on mobile re-fetches the current page.
  const handlePullRefresh = useCallback(async () => {
    await ordersQ.refetch()
  }, [ordersQ])

  // UI-F-10: detect new orders since the last poll and trigger sound + flash banner.
  const seenIds = useRef<Set<number>>(new Set())
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      orders.forEach((o) => seenIds.current.add(o.id))
      firstRun.current = false
      return
    }
    const fresh = orders.filter((o) => !seenIds.current.has(o.id))
    if (fresh.length > 0) {
      fresh.forEach((o) => seenIds.current.add(o.id))
      playSound('order-received')
      setFlash(true)
      const t = window.setTimeout(() => setFlash(false), 2000)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [orders])

  // tick every second for live elapsed counters
  const [, force] = useState(0)
  useMemo(() => {
    if (paused) return
    const t = setInterval(() => force((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [paused])

  const grouped = useMemo(() => {
    const m = new Map<ColumnKey, KitchenOrder[]>()
    COLUMNS.forEach((c) => m.set(c.key, []))
    for (const o of orders) m.get(classifyColumn(String(o.status ?? '')))?.push(o)
    return m
  }, [orders])

  const advance = async (id: number, next: string, label: string) => {
    const ok = await advanceKitchenStatus(id, next)
    if (ok) {
      toast.success(`${label} · order #${id}`)
      void ordersQ.refetch()
    } else {
      toast.error('Backend rejected the status update — order keeps current state.')
    }
  }

  const visibleOrders = orders.filter((o) => !/cancel/i.test(String(o.status ?? '')))

  return (
    <PullToRefresh onRefresh={handlePullRefresh} className="space-y-6">
      {flash ? (
        <div className="rounded-md border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary animate-in fade-in slide-in-from-top-2">
          New order received
        </div>
      ) : null}
      <PageHeader
        title="Kitchen Display"
        description={`Live · ${visibleOrders.length} active · ${wsConnected ? 'WS connected' : 'polling 15 s'}`}
        breadcrumbs={[{ label: 'Kitchen', href: '/kitchen/dashboard' }, { label: 'Display' }]}
        actions={
          <>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border',
                wsConnected
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-border bg-muted/40 text-muted-foreground'
              )}
              title={wsConnected ? 'WebSocket live' : 'WebSocket offline — polling only'}
            >
              {wsConnected ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
              {wsConnected ? 'Live' : 'Poll'}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPaused((p) => !p)}>
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              {paused ? 'Resume' : 'Pause'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void ordersQ.refetch()}>
              <RefreshCw className={ordersQ.isFetching ? 'size-4 animate-spin' : 'size-4'} />
              Refresh
            </Button>
          </>
        }
      />

      {ordersQ.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-64 rounded-lg" />
          ))}
        </div>
      ) : visibleOrders.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<ChefHat className="size-6" />}
            title="No active orders"
            description="When orders arrive they'll appear here. Polling continues every 15 s."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const ColIcon = col.icon
            const items = grouped.get(col.key) ?? []
            return (
              <section key={col.key} className={cn('rounded-lg border p-3 min-h-[60vh] flex flex-col', col.tone)}>
                <header className="flex items-center justify-between mb-3 px-1">
                  <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
                    <ColIcon className="size-4" /> {col.label}
                  </h2>
                  <Badge variant="outline" className="font-mono">{items.length}</Badge>
                </header>

                {items.length === 0 ? (
                  <div className="flex-1 grid place-items-center text-xs text-muted-foreground py-8">
                    <span className="inline-flex items-center gap-2"><Soup className="size-4" /> No orders</span>
                  </div>
                ) : (
                  <ul className="space-y-3 flex-1">
                    <AnimatePresence initial={false}>
                      {items.map((o) => {
                        const action = nextStatusFor(col.key)
                        const elapsed = elapsedMs(o.createdAt)
                        const overdue = elapsed > 8 * 60_000
                        return (
                          <motion.li
                            key={o.id}
                            layout
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <Card className={cn('p-3 space-y-3', overdue && col.key !== 'READY' && 'border-destructive/60 ring-1 ring-destructive/30')}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                  <p className="text-sm font-bold tracking-tight truncate font-mono">{o.orderNumber}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {o.tableNumber ? `Table ${o.tableNumber}` : o.customerName ?? 'Walk-in'} · {o.orderItemsCount} items
                                  </p>
                                </div>
                                <Badge variant={typeBadgeVariant(String(o.orderType))}>{String(o.orderType).replace(/_/g, ' ')}</Badge>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                                <span className={cn('inline-flex items-center gap-1 text-xs font-mono tabular-nums', overdue ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
                                  <Clock className="size-3" /> {formatElapsed(elapsed)}
                                </span>
                                <span className="tabular-nums font-semibold text-sm">₹{Math.round(Number(o.totalAmount ?? 0)).toLocaleString('en-IN')}</span>
                                {action ? (
                                  <Button size="xs" onClick={() => advance(o.id, action.value, action.label)}>
                                    {action.label}
                                  </Button>
                                ) : (
                                  <Badge variant="success" className="gap-1"><CheckCircle2 className="size-3" /> Done</Badge>
                                )}
                              </div>
                            </Card>
                          </motion.li>
                        )
                      })}
                    </AnimatePresence>
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </PullToRefresh>
  )
}
