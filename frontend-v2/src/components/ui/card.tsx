import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * UI-F-31 polish + UI-F-34 micro-interaction:
 *  - All cards get a subtle hover (one elevation up + tiny border tint) by default
 *  - `interactive` adds full hover-lift + cursor-pointer (for clickable cards)
 *  - Hover never breaks layout — only shadow + 1px translate-y
 */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  flat?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, flat = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card text-card-foreground transition-all duration-standard ease-entrance',
        flat ? 'shadow-none' : 'shadow-elevation-1',
        // subtle hover for ALL cards — feels alive without being clicky
        !flat && 'hover:shadow-elevation-2 hover:border-border/80',
        // strong hover only for clickable cards
        interactive &&
          'cursor-pointer hover:shadow-elevation-3 hover:-translate-y-0.5 hover:border-primary/40 active:translate-y-0 active:scale-[0.998]',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-xl font-semibold leading-tight tracking-tight', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

const CardSkeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card shadow-elevation-1 p-6 space-y-3',
        className
      )}
      {...props}
    >
      <div className="skeleton-shimmer h-5 w-1/3 rounded" />
      <div className="skeleton-shimmer h-4 w-2/3 rounded" />
      <div className="skeleton-shimmer h-24 w-full rounded" />
    </div>
  )
)
CardSkeleton.displayName = 'CardSkeleton'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardSkeleton }
