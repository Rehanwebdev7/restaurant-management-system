import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * UI-F-88: Multi-select combobox.
 * Built on the existing Popover primitive — keeps animation tokens consistent
 * with the rest of the kit. Selected values render as removable chips.
 */
export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectFieldProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelectField({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  className,
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])

  const remove = (v: string) => onChange(value.filter((x) => x !== v))

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  )
  const selected = options.filter((o) => value.includes(o.value))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
          )}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 text-left">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((s) => (
                <Badge key={s.value} variant="secondary" className="gap-1 pr-1">
                  {s.label}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${s.label}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      remove(s.value)
                    }}
                    className="rounded-sm hover:bg-muted/60 px-0.5"
                  >
                    <X className="size-3" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-2">
        <Input
          autoFocus
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-2"
        />
        <ul className="max-h-60 overflow-y-auto themed-scrollbar">
          {filtered.length === 0 ? (
            <li className="px-2 py-3 text-xs text-muted-foreground text-center">No matches</li>
          ) : (
            filtered.map((o) => {
              const checked = value.includes(o.value)
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => toggle(o.value)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <span
                      className={cn(
                        'inline-flex size-4 items-center justify-center rounded border',
                        checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                      )}
                    >
                      {checked ? <Check className="size-3" /> : null}
                    </span>
                    <span className="flex-1 text-left">{o.label}</span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
        {value.length > 0 ? (
          <div className="mt-2 border-t border-border pt-2 flex justify-end">
            <Button size="xs" variant="ghost" onClick={() => onChange([])}>
              Clear all
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
