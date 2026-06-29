import { useEffect, useMemo, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * UI-F-90: Inline file preview.
 * PDF -> iframe. Image -> img. Excel/CSV -> first 100 rows in a table.
 * Anything else -> download link.
 */

interface FilePreviewProps {
  file?: File
  url?: string
  filename?: string
  className?: string
}

type Kind = 'pdf' | 'image' | 'excel' | 'csv' | 'other'

function detectKind(name: string): Kind {
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (/\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(lower)) return 'image'
  if (/\.(xlsx|xls)$/i.test(lower)) return 'excel'
  if (lower.endsWith('.csv')) return 'csv'
  return 'other'
}

function useObjectUrl(file?: File, url?: string): string | undefined {
  const [created, setCreated] = useState<string | undefined>()
  useEffect(() => {
    if (!file) return
    const next = URL.createObjectURL(file)
    setCreated(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return file ? created : url
}

function TabularPreview({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Empty file.</p>
  const headers = Object.keys(rows[0] ?? {})
  return (
    <div className="overflow-x-auto themed-scrollbar border border-border rounded-md">
      <table className="w-full text-xs">
        <thead className="bg-muted/50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left font-semibold px-3 py-2 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 100).map((r, i) => (
            <tr key={i} className="border-t border-border">
              {headers.map((h) => (
                <td key={h} className="px-3 py-1.5 whitespace-nowrap">{String(r[h] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FilePreview({ file, url, filename, className }: FilePreviewProps) {
  const name = file?.name ?? filename ?? url ?? ''
  const kind = useMemo(() => detectKind(name), [name])
  const src = useObjectUrl(file, url)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    if (!file || (kind !== 'excel' && kind !== 'csv')) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (kind === 'csv' && typeof result === 'string') {
        const parsed = Papa.parse<Record<string, unknown>>(result, { header: true, skipEmptyLines: true })
        setRows(parsed.data)
      } else if (kind === 'excel' && result instanceof ArrayBuffer) {
        const wb = XLSX.read(result, { type: 'array' })
        const first = wb.SheetNames[0]
        const ws = first ? wb.Sheets[first] : undefined
        setRows(ws ? XLSX.utils.sheet_to_json<Record<string, unknown>>(ws) : [])
      }
    }
    if (kind === 'csv') reader.readAsText(file)
    else reader.readAsArrayBuffer(file)
  }, [file, kind])

  if (!src) return <p className="text-sm text-muted-foreground">No file selected.</p>

  return (
    <div className={cn('space-y-3', className)}>
      {kind === 'pdf' ? (
        <iframe src={src} title={name} className="w-full h-[600px] rounded-md border border-border" />
      ) : kind === 'image' ? (
        <img src={src} alt={name} className="max-w-full rounded-md border border-border" />
      ) : kind === 'excel' || kind === 'csv' ? (
        <TabularPreview rows={rows} />
      ) : (
        <div className="inline-flex items-center gap-3 rounded-md border border-border p-3">
          <FileText className="size-5 text-muted-foreground" />
          <span className="text-sm">{name}</span>
          <Button asChild size="sm" variant="outline">
            <a href={src} download={name}>
              <Download className="size-4" /> Download
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}
