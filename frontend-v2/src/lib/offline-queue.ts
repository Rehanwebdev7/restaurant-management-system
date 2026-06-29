/**
 * Offline order queue (UI-F-85).
 *
 * Persists pending checkout orders in IndexedDB so a customer who taps
 * "Place order" while their device is offline does NOT lose the request —
 * we save the serialized payload locally, show a banner, and drain the
 * queue automatically when `navigator.onLine` flips back to true.
 *
 * Implementation notes:
 *   - Raw IndexedDB, no `idb-keyval` dep (smaller bundle, no extra audit).
 *   - One object store: `pendingOrders` keyed by auto-increment id.
 *   - The `drainQueue(syncFn)` caller supplies the actual sync function so
 *     this module stays unaware of the API layer (decoupled).
 */

import { useEffect, useState } from 'react'

const DB_NAME = 'rms-offline-queue'
const DB_VERSION = 1
const STORE = 'pendingOrders'

export interface SerializedOrder {
  /** Stable client-side id — generated at enqueue. */
  clientId?: string
  /** ISO timestamp when the user submitted. */
  submittedAt: string
  /** Free-form payload — exactly what would have been POSTed. */
  payload: unknown
}

/* ---------------------- IndexedDB plumbing ---------------------- */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable in this environment'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Failed to open offline-queue DB'))
  })
}

interface StoredOrder extends SerializedOrder {
  id: number
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => Promise<T> | T): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const store = t.objectStore(STORE)
    let result: T
    Promise.resolve(fn(store))
      .then((r) => {
        result = r
      })
      .catch(reject)
    t.oncomplete = () => resolve(result)
    t.onerror = () => reject(t.error ?? new Error('IDB transaction failed'))
    t.onabort = () => reject(t.error ?? new Error('IDB transaction aborted'))
  })
}

/* ---------------------- public API ---------------------- */

const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach((fn) => {
    try { fn() } catch { /* noop */ }
  })
}

export async function enqueueOrder(order: SerializedOrder): Promise<number> {
  const enriched: SerializedOrder = {
    clientId: order.clientId ?? cryptoId(),
    submittedAt: order.submittedAt ?? new Date().toISOString(),
    payload: order.payload,
  }
  const id = await tx<number>('readwrite', (s) =>
    new Promise<number>((resolve, reject) => {
      const req = s.add(enriched)
      req.onsuccess = () => resolve(Number(req.result))
      req.onerror = () => reject(req.error ?? new Error('add failed'))
    }),
  )
  notify()
  return id
}

export async function listPending(): Promise<StoredOrder[]> {
  try {
    return await tx<StoredOrder[]>('readonly', (s) =>
      new Promise<StoredOrder[]>((resolve, reject) => {
        const req = s.getAll()
        req.onsuccess = () => resolve((req.result as StoredOrder[]) ?? [])
        req.onerror = () => reject(req.error ?? new Error('getAll failed'))
      }),
    )
  } catch {
    return []
  }
}

export async function countPending(): Promise<number> {
  try {
    return await tx<number>('readonly', (s) =>
      new Promise<number>((resolve, reject) => {
        const req = s.count()
        req.onsuccess = () => resolve(Number(req.result))
        req.onerror = () => reject(req.error ?? new Error('count failed'))
      }),
    )
  } catch {
    return 0
  }
}

export async function deleteOrder(id: number): Promise<void> {
  await tx<void>('readwrite', (s) =>
    new Promise<void>((resolve, reject) => {
      const req = s.delete(id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error ?? new Error('delete failed'))
    }),
  )
  notify()
}

/**
 * Drain the queue. Calls `syncFn` for each order in submission order.
 * On success the row is removed; on failure the row stays so the next
 * drain can retry. Returns a summary of synced + failed counts.
 */
export async function drainQueue(
  syncFn: (order: StoredOrder) => Promise<void>,
): Promise<{ synced: number; failed: number }> {
  const pending = await listPending()
  let synced = 0
  let failed = 0
  for (const order of pending) {
    try {
      await syncFn(order)
      await deleteOrder(order.id)
      synced += 1
    } catch {
      failed += 1
    }
  }
  return { synced, failed }
}

/* ---------------------- React hook ---------------------- */

export interface OfflineQueueStatus {
  pending: number
  online: boolean
}

/**
 * Subscribe to queue size + online/offline state. Re-renders on
 *   - `enqueueOrder` / `deleteOrder` / `drainQueue`
 *   - the browser `online` / `offline` events
 */
export function useOfflineQueueStatus(): OfflineQueueStatus {
  const [pending, setPending] = useState(0)
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      const n = await countPending()
      if (!cancelled) setPending(n)
    }
    void refresh()
    listeners.add(refresh)

    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }
    return () => {
      cancelled = true
      listeners.delete(refresh)
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  return { pending, online }
}

/* ---------------------- helpers ---------------------- */

function cryptoId(): string {
  // Stable client-id for dedup. Falls back to time + random if Web Crypto
  // is unavailable (server-render safety).
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try { return crypto.randomUUID() } catch { /* noop */ }
  }
  return `o_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export type { StoredOrder }
