import type { ReactNode } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * UI-F-16: Print-friendly wrapper.
 * - Hides sidebar/header via `print:hidden` on existing layout chrome
 *   (callers should mark their chrome with the `print-hide` class too).
 * - Adds a screen-only Print button that triggers `window.print()`.
 * - Uses Tailwind's `print:` modifiers — no custom CSS needed.
 */
interface PrintLayoutProps {
  children: ReactNode
  title?: string
  className?: string
  hideButton?: boolean
}

export function PrintLayout({ children, title, className, hideButton }: PrintLayoutProps) {
  return (
    <div className={cn('print:bg-white print:text-black', className)}>
      <style>{`
        @media print {
          .print-hide, aside, nav, header[role="banner"] { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      {hideButton ? null : (
        <div className="flex justify-end mb-4 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
        </div>
      )}
      {title ? (
        <h1 className="hidden print:block text-2xl font-bold mb-4">{title}</h1>
      ) : null}
      <div className="print:p-0">{children}</div>
    </div>
  )
}
