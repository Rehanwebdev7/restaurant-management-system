import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  EmptyOrders,
  EmptyMenu,
  EmptyCustomers,
  EmptySearch,
  NetworkOffline,
} from '@/components/ui/illustrations'

/**
 * UI-F-32 / UI-F-53: Empty state primitive.
 * `variant` auto-picks the matching SVG illustration; `icon` is the
 * pre-illustration fallback so existing call sites keep compiling.
 */
type EmptyVariant = 'orders' | 'menu' | 'customers' | 'search' | 'offline'

interface EmptyStateProps {
  icon?: ReactNode
  variant?: EmptyVariant
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

const VARIANT_MAP: Record<EmptyVariant, (p: { size: number }) => ReactNode> = {
  orders: ({ size }) => <EmptyOrders size={size} />,
  menu: ({ size }) => <EmptyMenu size={size} />,
  customers: ({ size }) => <EmptyCustomers size={size} />,
  search: ({ size }) => <EmptySearch size={size} />,
  offline: ({ size }) => <NetworkOffline size={size} />,
}

export function EmptyState({ icon, variant, title, description, action, className }: EmptyStateProps) {
  const illustration = variant ? VARIANT_MAP[variant]({ size: 160 }) : null
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      {illustration ? (
        <div className="mb-4 text-muted-foreground">{illustration}</div>
      ) : icon ? (
        <div className="mb-4 inline-flex size-14 rounded-full bg-muted text-muted-foreground items-center justify-center">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
