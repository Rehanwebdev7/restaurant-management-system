import type { ComponentType, SVGProps } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * UI-F-15: Sticky bulk-action toolbar.
 * Renders only when `selectedCount > 0` so the bottom-of-viewport real estate
 * stays free during normal browsing.
 */
type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>

export interface BulkAction {
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: ButtonProps['variant']
  disabled?: boolean
}

interface BulkActionBarProps {
  selectedCount: number
  actions: BulkAction[]
  onClear?: () => void
  className?: string
}

export function BulkActionBar({ selectedCount, actions, onClear, className }: BulkActionBarProps) {
  if (selectedCount <= 0) return null
  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[95vw]',
        'inline-flex items-center gap-3 rounded-full border border-border bg-card/95 px-4 py-2 shadow-elevation-4 backdrop-blur',
        'animate-in fade-in slide-in-from-bottom-2',
        className
      )}
    >
      <span className="text-sm font-semibold tabular-nums">
        {selectedCount} selected
      </span>
      <span className="h-5 w-px bg-border" aria-hidden />
      <div className="flex items-center gap-1.5">
        {actions.map((a) => {
          const Icon = a.icon
          return (
            <Button
              key={a.label}
              size="sm"
              variant={a.variant ?? 'outline'}
              onClick={a.onClick}
              disabled={a.disabled}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {a.label}
            </Button>
          )
        })}
      </div>
      {onClear ? (
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      ) : null}
    </div>
  )
}
