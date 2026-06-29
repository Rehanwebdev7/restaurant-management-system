/**
 * DriverTrackingMap — live driver location panel for the order-tracking
 * screen (UI-F-94).
 *
 * Polls `/api/customer/orders/{id}/driver-location` every 15s for the
 * driver's latest lat/lng. While the backend endpoint is not live, the
 * poll falls back to sample coordinates so the UI can be reviewed
 * end-to-end without flipping any feature flags.
 *
 * Renders two pins via the shared `<MapPicker>` primitive (lazy-loaded
 * to keep the customer landing chunk small):
 *   • Driver pin   — moves on each poll tick.
 *   • Destination  — static text below the map (the map primitive itself
 *                    only supports a single draggable pin; a follow-up
 *                    UI-F-94.2 will swap to a dedicated two-marker map).
 */

import { lazy, Suspense, useEffect, useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'

const MapPicker = lazy(() =>
  import('@/components/ui/map-picker').then((m) => ({ default: m.MapPicker })),
)

export interface DriverLocation {
  lat: number
  lng: number
}

export interface DriverTrackingMapProps {
  orderId: number
  driverLocation: DriverLocation | null
  /** Optional customer destination — rendered below the map as text today. */
  destination?: DriverLocation
  /** Override poll interval (ms). Default 15_000. */
  pollIntervalMs?: number
}

// Spice Garden Bandra — used as the sample fallback so the map is always
// pointing somewhere reasonable while the backend is offline.
const SAMPLE_FALLBACK: DriverLocation = { lat: 19.0596, lng: 72.8295 }

async function fetchDriverLocation(orderId: number): Promise<DriverLocation | null> {
  try {
    const res = await fetch(`/api/customer/orders/${orderId}/driver-location`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json() as { lat?: unknown; lng?: unknown }
    if (typeof data.lat === 'number' && typeof data.lng === 'number') {
      return { lat: data.lat, lng: data.lng }
    }
    return null
  } catch {
    return null
  }
}

export default function DriverTrackingMap({
  orderId,
  driverLocation,
  destination,
  pollIntervalMs = 15_000,
}: DriverTrackingMapProps) {
  const [current, setCurrent] = useState<DriverLocation | null>(driverLocation)
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    setCurrent(driverLocation)
  }, [driverLocation])

  useEffect(() => {
    let cancelled = false

    const tick = async () => {
      const fresh = await fetchDriverLocation(orderId)
      if (cancelled) return
      // Fall back to the last known coords or the SAMPLE point so the
      // marker never disappears mid-tracking.
      setCurrent((prev) => fresh ?? prev ?? SAMPLE_FALLBACK)
    }

    void tick()
    const id = window.setInterval(() => { void tick() }, pollIntervalMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [orderId, pollIntervalMs])

  const pin = current ?? SAMPLE_FALLBACK

  return (
    <div className="c-card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-[--c-border] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="size-4 gold-text" />
          <p className="font-semibold text-sm">Live driver location</p>
        </div>
        <button
          type="button"
          onClick={() => setPolling((v) => !v)}
          className="text-[10px] uppercase tracking-wider text-[--c-text-muted] hover:gold-text"
          aria-pressed={polling}
        >
          {polling ? 'Pause' : 'Resume'}
        </button>
      </div>

      <Suspense
        fallback={
          <div className="h-[280px] grid place-items-center">
            <p className="text-xs text-[--c-text-muted]">Loading map…</p>
          </div>
        }
      >
        <MapPicker
          mode="pin"
          value={pin}
          onChange={() => { /* read-only on the customer side */ }}
          defaultCenter={pin}
          defaultZoom={14}
          height={280}
        />
      </Suspense>

      <div className="px-4 py-3 border-t border-[--c-border] flex items-start gap-2 text-xs">
        <MapPin className="size-4 gold-text shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold">
            {destination ? 'Delivering to' : 'Destination pending'}
          </p>
          <p className="text-[--c-text-muted] truncate">
            {destination
              ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`
              : 'Customer destination loads when the order moves to out-for-delivery.'}
          </p>
        </div>
      </div>
    </div>
  )
}
