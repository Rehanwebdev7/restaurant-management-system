import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * UI-F-17: Export menu. Renders Excel / CSV / PDF (print) options.
 * Excel uses `xlsx`; CSV uses `papaparse`; PDF is `window.print()` (the
 * caller's PrintLayout decides what stays visible on print).
 */
export interface ExportColumn<TRow> {
  key: keyof TRow & string
  label: string
}

interface ExportMenuProps<TRow extends Record<string, unknown>> {
  rows: TRow[]
  columns: ExportColumn<TRow>[]
  filename: string
  className?: string
}

function buildRecord<TRow extends Record<string, unknown>>(
  row: TRow,
  columns: ExportColumn<TRow>[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  columns.forEach((c) => {
    out[c.label] = row[c.key]
  })
  return out
}

export function ExportMenu<TRow extends Record<string, unknown>>({
  rows,
  columns,
  filename,
  className,
}: ExportMenuProps<TRow>) {
  const data = rows.map((r) => buildRecord(r, columns))

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  const exportCsv = () => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => window.print()

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Download className="size-4" /> Export
        </Button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          sideOffset={6}
          align="end"
          className={cn(
            'z-50 min-w-[10rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-elevation-3',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95'
          )}
        >
          <DropdownMenuPrimitive.Item
            onSelect={exportExcel}
            className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
          >
            <FileSpreadsheet className="size-4" /> Excel
          </DropdownMenuPrimitive.Item>
          <DropdownMenuPrimitive.Item
            onSelect={exportCsv}
            className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
          >
            <FileText className="size-4" /> CSV
          </DropdownMenuPrimitive.Item>
          <DropdownMenuPrimitive.Item
            onSelect={exportPdf}
            className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
          >
            <Printer className="size-4" /> PDF (print)
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}
