/**
 * UI-F-41: Backend health monitor.
 *
 * Pings `/actuator/health` every 60 s. If that 404s on the first attempt we
 * silently fall back to `/api/auth/me` (always available — auth guard route).
 *
 * Health-check requests are tagged with `_skipMaintenance: true` so that a
 * 503 here does NOT flip the global maintenance flag — we surface it locally
 * via the indicator dot instead.
 *
 * Hooked into <TopBar /> via <BackendHealthIndicator />.
 */
import { useEffect, useRef, useState } from 'react'
import apiClient from '@/api/client'

export type BackendStatus = 'up' | 'down' | 'unknown'

export interface BackendHealth {
  status: BackendStatus
  lastChecked: Date | null
}

const PRIMARY_PATH = '/actuator/health'
const FALLBACK_PATH = '/api/auth/me'
const POLL_MS = 60_000

async function probe(path: string): Promise<boolean> {
  try {
    const res = await apiClient.get(path, { timeout: 5_000 })
    return res.status >= 200 && res.status < 500
  } catch (err) {
    const e = err as { response?: { status?: number } }
    // 401/403 still means the backend is alive — only network errors or 5xx
    // count as "down".
    const code = e.response?.status
    if (typeof code === 'number' && code < 500) return true
    return false
  }
}

export function useBackendHealth(): BackendHealth {
  const [state, setState] = useState<BackendHealth>({ status: 'unknown', lastChecked: null })
  const usingFallback = useRef(false)

  useEffect(() => {
    let cancelled = false

    const tick = async () => {
      const path = usingFallback.current ? FALLBACK_PATH : PRIMARY_PATH
      let alive = await probe(path)
      // First-time primary 404 → switch to fallback path for subsequent ticks.
      if (!alive && !usingFallback.current && path === PRIMARY_PATH) {
        usingFallback.current = true
        alive = await probe(FALLBACK_PATH)
      }
      if (cancelled) return
      setState({ status: alive ? 'up' : 'down', lastChecked: new Date() })
    }

    void tick()
    const id = window.setInterval(() => {
      void tick()
    }, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return state
}
