/**
 * useBodyScrollLock — shared, reference-counted body scroll lock.
 *
 * Each modal/drawer that wants to prevent background scroll calls this hook
 * with `enabled=true`. The hook captures `document.body.style.overflow` on
 * the FIRST lock acquired and only restores it when the LAST lock releases.
 *
 * Why a shared counter instead of per-modal effects:
 *   When two modals each independently capture `prev`, the second one
 *   captures `prev='hidden'` (set by the first). When the second closes
 *   first, it restores `prev='hidden'` — scroll stays locked forever.
 *   Reference counting fixes that.
 *
 * Usage:
 *   useBodyScrollLock(open)
 */
import { useEffect } from 'react'

let lockCount = 0
let savedOverflow: string | null = null

export function useBodyScrollLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return
    if (lockCount === 0) {
      savedOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    lockCount++
    return () => {
      lockCount--
      if (lockCount <= 0) {
        lockCount = 0
        if (savedOverflow !== null) {
          document.body.style.overflow = savedOverflow
          savedOverflow = null
        } else {
          document.body.style.overflow = ''
        }
      }
    }
  }, [enabled])
}
