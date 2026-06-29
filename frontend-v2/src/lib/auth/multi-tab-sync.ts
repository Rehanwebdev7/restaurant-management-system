/**
 * UI-F-19: Multi-tab session sync.
 * When tab A logs out (clears `authToken` / `customerToken`),
 * tab B detects via `storage` event and reloads to honor logged-out state.
 */
import { useEffect } from 'react'
import { TOKEN_STORAGE_KEYS } from '@/lib/auth/tokens'

const WATCHED = new Set<string>([TOKEN_STORAGE_KEYS.authToken, TOKEN_STORAGE_KEYS.customerToken])

export function useMultiTabSessionSync() {
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (!e.key || !WATCHED.has(e.key)) return
      // Token removed in another tab → reload to surface logged-out state
      if (e.newValue === null) {
        window.location.reload()
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])
}
