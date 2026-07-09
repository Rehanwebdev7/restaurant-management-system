/**
 * `<SeedBadge>` — small pill rendered on any section powered by seed
 * placeholder content. Signals to demo viewers that the section is a
 * sample; a real tenant will never see this because `useSeedMode()`
 * hides seed sections entirely for resolved domains.
 */
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  label?: string
}

export function SeedBadge({ className, label = 'Sample data' }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full',
        'bg-amber-500/15 border border-amber-500/40 text-amber-800',
        'px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest',
        'dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30',
        className,
      )}
      title="This section shows placeholder content — will render tenant-specific data once the backend endpoint ships."
    >
      <Info className="size-2.5" aria-hidden />
      {label}
    </span>
  )
}
