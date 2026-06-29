import { useEffect, useRef, useState } from 'react'

/**
 * UI-F-10: Kitchen orders WebSocket — augments 15s polling.
 *
 * Backend endpoint: ws://localhost:8091/rms/ws/kitchen-orders
 *
 *  - Auto-reconnect with exponential backoff (1s → 2s → 4s … capped at 30s).
 *  - Gracefully falls back when WS server isn't reachable: returns
 *    `{ connected: false, lastMessage: null }` and the calling component
 *    continues to rely on its polling refetch.
 *  - `onMessage` callback fires for every incoming message so the caller can
 *    invalidate TanStack Query keys + play sounds. We deliberately keep state
 *    minimal here to avoid re-render storms.
 */

export interface KitchenWebSocketMessage {
  type: string
  orderId?: number
  status?: string
  [key: string]: unknown
}

export interface UseKitchenWebSocketOptions {
  /** Full ws:// or wss:// URL. Falls back to a default if omitted. */
  url?: string
  /** Called on every successfully parsed incoming message. */
  onMessage?: (msg: KitchenWebSocketMessage) => void
  /** Master switch — false disables the connection entirely. */
  enabled?: boolean
}

export interface UseKitchenWebSocketResult {
  connected: boolean
  lastMessage: KitchenWebSocketMessage | null
}

const DEFAULT_URL = 'ws://localhost:8091/rms/ws/kitchen-orders'
const MAX_BACKOFF_MS = 30_000
const INITIAL_BACKOFF_MS = 1_000

export function useKitchenWebSocket(opts: UseKitchenWebSocketOptions = {}): UseKitchenWebSocketResult {
  const { url = DEFAULT_URL, onMessage, enabled = true } = opts

  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<KitchenWebSocketMessage | null>(null)

  // Keep latest onMessage in a ref so reconnect loop doesn't restart when the
  // caller passes a new closure each render.
  const onMessageRef = useRef(onMessage)
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return

    let ws: WebSocket | null = null
    let attempt = 0
    let reconnectTimer: number | null = null
    let cancelled = false

    const scheduleReconnect = () => {
      if (cancelled) return
      const backoff = Math.min(MAX_BACKOFF_MS, INITIAL_BACKOFF_MS * 2 ** Math.min(attempt, 5))
      attempt += 1
      reconnectTimer = window.setTimeout(connect, backoff)
    }

    const connect = () => {
      if (cancelled) return
      try {
        ws = new WebSocket(url)
      } catch {
        // URL parse / construction failed — backoff and try again.
        setConnected(false)
        scheduleReconnect()
        return
      }

      ws.onopen = () => {
        if (cancelled) return
        attempt = 0
        setConnected(true)
      }

      ws.onmessage = (ev: MessageEvent<string>) => {
        if (cancelled) return
        try {
          const parsed: unknown = JSON.parse(ev.data)
          if (parsed && typeof parsed === 'object') {
            const msg = parsed as KitchenWebSocketMessage
            setLastMessage(msg)
            onMessageRef.current?.(msg)
          }
        } catch {
          // Non-JSON payloads are ignored — backend should always send JSON.
        }
      }

      ws.onerror = () => {
        // The browser also fires `close` right after; we handle reconnect there.
      }

      ws.onclose = () => {
        setConnected(false)
        if (cancelled) return
        scheduleReconnect()
      }
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer != null) window.clearTimeout(reconnectTimer)
      if (ws) {
        ws.onopen = null
        ws.onmessage = null
        ws.onerror = null
        ws.onclose = null
        try {
          ws.close()
        } catch {
          /* noop */
        }
      }
    }
  }, [url, enabled])

  return { connected, lastMessage }
}
