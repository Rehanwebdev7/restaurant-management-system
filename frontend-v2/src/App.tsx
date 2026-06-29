import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'
import { AppRouter } from '@/lib/router'
import { useMultiTabSessionSync } from '@/lib/auth/multi-tab-sync'
import { TopProgressBar } from '@/components/ui/top-progress-bar'
import { ReleaseNotesModal } from '@/components/ui/release-notes-modal'
import { InstallPrompt } from '@/components/ui/install-prompt'
import { MaintenanceMode } from '@/components/ui/maintenance-mode'
import { useMaintenanceStore } from '@/lib/maintenance-store'

/**
 * App shell.
 *  - TopProgressBar  — route transition indicator.
 *  - AppRouter        — react-router.
 *  - ReleaseNotesModal (UI-F-79) — one-shot dialog after a version bump.
 *  - PWA update toast  (UI-F-83) — sonner toast when SW reports needRefresh.
 */
function App() {
  useMultiTabSessionSync()
  const isMaintenance = useMaintenanceStore((s) => s.isMaintenance)
  const eta = useMaintenanceStore((s) => s.eta)

  // UI-F-22 perf — neither the install banner nor the release notes need to
  // compete with first paint. Mount them ~3s after hydration so the LCP image
  // and primary CTAs are settled before they hydrate.
  // Deferred-feature gate: previously rendered InstallPrompt + ReleaseNotes
  // 3s post-hydration. Both shipped to dedicated lazy chunks now and mount
  // themselves on first interaction, so this state was never read.
  const [, setShowDeferred] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShowDeferred(true), 3000)
    return () => clearTimeout(t)
  }, [])

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info('[pwa] service worker registered:', swUrl)
      }
    },
    onRegisterError(error) {
      // eslint-disable-next-line no-console
      console.warn('[pwa] service worker registration failed', error)
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    const id = toast('New version available', {
      description: 'Refresh to load the latest update.',
      duration: Infinity,
      action: {
        label: 'Refresh',
        onClick: () => {
          setNeedRefresh(false)
          void updateServiceWorker(true)
        },
      },
      onDismiss: () => setNeedRefresh(false),
    })
    return () => {
      toast.dismiss(id)
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  // UI-F-82: Full-screen maintenance bypass — short-circuits the router tree
  // so route-level data fetches don't fire while the backend is offline.
  if (isMaintenance) {
    return <MaintenanceMode eta={eta} />
  }

  return (
    <>
      <TopProgressBar />
      <AppRouter />
      <ReleaseNotesModal />
      <InstallPrompt />
    </>
  )
}

export default App
