import { useEffect, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * UI-F-52: Minimal onboarding tour.
 *
 *  - `steps[]` are { target, title, body }. `target` is a CSS selector.
 *  - Renders a fixed-position popover anchored to the target's bounding rect
 *    (with a dim backdrop).
 *  - Persists completion to `localStorage` keyed by role so each panel only
 *    auto-runs once per role.
 *  - Re-triggerable: callers can flip `open=true` from a Settings page CTA.
 */

export interface OnboardingStep {
  target: string
  title: string
  body: string
}

interface OnboardingTourProps {
  steps: OnboardingStep[]
  /** Stable role identifier — used to scope the "completed" flag. */
  role: string
  /** Controlled open state. Defaults to "auto" — show iff not yet completed. */
  open?: boolean
  onClose?: () => void
}

const LS_PREFIX = 'onboarding_tour_'
const LS_SUFFIX = '_completed'

export function isOnboardingComplete(role: string): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(`${LS_PREFIX}${role}${LS_SUFFIX}`) === '1'
}

export function resetOnboarding(role: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(`${LS_PREFIX}${role}${LS_SUFFIX}`)
}

function markOnboardingComplete(role: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(`${LS_PREFIX}${role}${LS_SUFFIX}`, '1')
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

export function OnboardingTour({ steps, role, open, onClose }: OnboardingTourProps) {
  const { t } = useTranslation()
  const [autoOpen, setAutoOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  const isOpen = open ?? autoOpen

  // Auto-open once per role if no `open` prop is supplied.
  useEffect(() => {
    if (open !== undefined) return
    if (typeof window === 'undefined') return
    if (!isOnboardingComplete(role) && steps.length > 0) {
      // Defer by a tick so the target elements have mounted.
      const tid = window.setTimeout(() => setAutoOpen(true), 250)
      return () => window.clearTimeout(tid)
    }
    return undefined
  }, [open, role, steps.length])

  // Track the target's bounding rect; recompute on resize/scroll.
  useLayoutEffect(() => {
    if (!isOpen) {
      setRect(null)
      return
    }
    const step = steps[index]
    if (!step) {
      setRect(null)
      return
    }
    const computeRect = () => {
      const el = document.querySelector(step.target)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    computeRect()
    window.addEventListener('resize', computeRect)
    window.addEventListener('scroll', computeRect, true)
    return () => {
      window.removeEventListener('resize', computeRect)
      window.removeEventListener('scroll', computeRect, true)
    }
  }, [isOpen, steps, index])

  if (!isOpen || steps.length === 0) return null

  const step = steps[index]
  if (!step) return null

  const finish = () => {
    markOnboardingComplete(role)
    setAutoOpen(false)
    setIndex(0)
    onClose?.()
  }

  const skip = () => {
    finish()
  }

  const next = () => {
    if (index < steps.length - 1) setIndex((i) => i + 1)
    else finish()
  }

  const back = () => {
    if (index > 0) setIndex((i) => i - 1)
  }

  // Position popover beneath the target if it has a rect; otherwise center it.
  const popoverStyle = rect
    ? {
        top: Math.min(window.innerHeight - 220, rect.top + rect.height + 12),
        left: Math.max(12, Math.min(window.innerWidth - 320, rect.left)),
      }
    : { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 160 }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={step.title}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={skip} />
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-md ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse"
          style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }}
        />
      ) : null}
      <div
        className={cn(
          'absolute w-[320px] max-w-[calc(100vw-24px)] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-elevation-3',
          'animate-in fade-in-0 zoom-in-95'
        )}
        style={popoverStyle}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold">{step.title}</p>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {index + 1} / {steps.length}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={skip}>
            {t('tour.skip')}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={index === 0} onClick={back}>
              {t('tour.back')}
            </Button>
            <Button size="sm" onClick={next}>
              {index === steps.length - 1 ? t('tour.done') : t('tour.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
