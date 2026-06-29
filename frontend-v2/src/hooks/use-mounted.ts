/**
 * useMounted — flips to true after a short delay post-mount.
 *
 * Used to hide skeleton loaders without flicker on fast hydration.
 * Default delay 200ms aligns with the "perceived instant" budget.
 */
import { useEffect, useState } from 'react'

export function useMounted(delay = 200): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return mounted
}

export default useMounted
