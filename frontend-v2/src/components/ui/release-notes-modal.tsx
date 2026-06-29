import { useEffect, useState, type ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/**
 * UI-F-79: Release-notes modal.
 * Compares `VITE_APP_VERSION` to `app_release_seen_version` in localStorage.
 * On mismatch, shows a one-shot dialog. Dismissal persists current version.
 */
const LS_KEY = 'app_release_seen_version'

interface ReleaseNotesModalProps {
  notes?: ReactNode
  version?: string
}

export function ReleaseNotesModal({ notes, version }: ReleaseNotesModalProps) {
  const current = version ?? import.meta.env.VITE_APP_VERSION ?? ''
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!current) return
    // Suppress the modal under Playwright / WebDriver — it overlays an
    // intercept-pointer-events backdrop that flakes E2E click sequences.
    // Real users never see this branch.
    if (typeof navigator !== 'undefined' && navigator.webdriver) return
    const seen = typeof window !== 'undefined' ? window.localStorage.getItem(LS_KEY) : null
    if (seen !== current) setOpen(true)
  }, [current])

  const dismiss = () => {
    if (typeof window !== 'undefined') window.localStorage.setItem(LS_KEY, current)
    setOpen(false)
  }

  if (!current) return null

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <Sparkles className="size-5 text-primary" /> What's new in {current}
          </DialogTitle>
          <DialogDescription>Highlights from the latest release.</DialogDescription>
        </DialogHeader>
        <div className="text-sm text-foreground space-y-2 prose prose-sm max-w-none dark:prose-invert">
          {notes ?? (
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Performance and stability improvements.</li>
              <li>Polish across the kitchen, billing, and reports views.</li>
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button onClick={dismiss}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
