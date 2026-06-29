/**
 * Lightweight shimmer skeleton placeholders, scoped to the customer theme.
 *
 * Three exported pieces:
 *   - <Skeleton />              base block
 *   - <CategoryGridSkeleton />  matches HomePage 5-up category grid
 *   - <DishGridSkeleton />      matches the menu/showcase grids
 */
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded bg-[--c-bg-elev] border border-[--c-border]',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:bg-gradient-to-r before:from-transparent before:via-white/8 before:to-transparent',
        'before:animate-[shimmer_1.4s_infinite] motion-reduce:before:hidden',
        className,
      )}
    />
  )
}

export function CategoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square" />
      ))}
    </div>
  )
}

export function DishGridSkeleton({
  count = 8,
  columns = 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}: {
  count?: number
  columns?: string
}) {
  return (
    <ul className={cn('grid grid-cols-1 gap-5', columns)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="c-card overflow-hidden">
          <Skeleton className="aspect-video !rounded-none !border-0" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4 !rounded" />
            <Skeleton className="h-3 w-full !rounded" />
            <Skeleton className="h-3 w-2/3 !rounded" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-6 w-16 !rounded" />
              <Skeleton className="h-7 w-20 !rounded" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
