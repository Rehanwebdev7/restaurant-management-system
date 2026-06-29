import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/**
 * UI-F primitive: Page header pattern repeated across 263 pages.
 * `title`, `description`, `breadcrumbs`, `actions` props.
 */
interface Crumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Crumb[]
  actions?: ReactNode
  /** Renders inline next to the title (e.g. a "Sample · backend pending" badge). */
  titleAdornment?: ReactNode
  className?: string
}

export function PageHeader({ title, description, breadcrumbs, actions, titleAdornment, className }: PageHeaderProps) {
  return (
    <header className={cn('space-y-3 pb-6 border-b border-border', className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {breadcrumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
              {c.href ? (
                <Link to={c.href} className="hover:text-foreground transition-colors duration-quick">
                  {c.label}
                </Link>
              ) : (
                <span>{c.label}</span>
              )}
              {i < breadcrumbs.length - 1 ? <ChevronRight className="size-3" /> : null}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
            {titleAdornment}
          </div>
          {description ? <p className="text-muted-foreground text-sm sm:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
      </div>
    </header>
  )
}
