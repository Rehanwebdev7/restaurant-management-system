import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-media-query'

/**
 * UI-F-2: PWA install prompt.
 *
 *  - Captures the `beforeinstallprompt` event so we can call `.prompt()` later.
 *  - Renders a bottom sheet banner ONLY on mobile viewports (≤ 768px).
 *  - "Later" persists for 7 days in localStorage so we don't nag the user.
 *  - Hides itself permanently once the app is installed (`appinstalled` event)
 *    or the prompt was accepted.
 */

const LS_DISMISSED_AT = 'pwa_install_dismissed_at'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/** Matches the spec but typed locally to avoid lib.dom drift. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt: () => Promise<void>
}

function dismissedRecently(): boolean {
  if (typeof window === 'undefined') return false
  const raw = window.localStorage.getItem(LS_DISMISSED_AT)
  if (!raw) return false
  const ts = Number(raw)
  if (!Number.isFinite(ts)) return false
  return Date.now() - ts < SEVEN_DAYS_MS
}

export function InstallPrompt() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (dismissedRecently()) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const onInstalled = () => {
      setDeferred(null)
      setVisible(false)
      window.localStorage.removeItem(LS_DISMISSED_AT)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!visible || !isMobile || !deferred) return null

  const handleInstall = async () => {
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') {
        setVisible(false)
        setDeferred(null)
      } else {
        window.localStorage.setItem(LS_DISMISSED_AT, String(Date.now()))
        setVisible(false)
      }
    } catch {
      setVisible(false)
    }
  }

  const handleLater = () => {
    window.localStorage.setItem(LS_DISMISSED_AT, String(Date.now()))
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label={t('install.title')}
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md p-3 pb-safe md:hidden"
    >
      <div className="rounded-t-2xl border border-border bg-card shadow-elevation-3 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start gap-3 p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
            <Download className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t('install.title')}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('install.description')}</p>
          </div>
          <button
            type="button"
            onClick={handleLater}
            aria-label={t('actions.close')}
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="ghost" size="sm" onClick={handleLater}>
            {t('install.later')}
          </Button>
          <Button size="sm" onClick={() => void handleInstall()}>
            <Download className="size-4" /> {t('install.install')}
          </Button>
        </div>
      </div>
    </div>
  )
}
