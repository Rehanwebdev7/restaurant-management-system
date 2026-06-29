import { lazy, Suspense, useMemo, useRef } from 'react'
import { Download, Printer, QrCode as QrCodeIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardSkeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
// UI-F-22 perf — qrcode lib is ~50 KB and only used on this single route.
const QrCode = lazy(() =>
  import('@/components/ui/qr-code').then((m) => ({ default: m.QrCode })),
)
import { useCashierTables } from '@/api/queries/cashier'
import type { CashierTable } from '@/api/services/cashier'
import { toast } from '@/lib/toast'

/**
 * UI-F-6 consumer — printable QR codes for every dining table.
 * Each QR encodes `https://restaurant.example/table/${id}` (the customer
 * scans it to open the menu pinned to that table).
 */

function tableUrl(t: CashierTable): string {
  return `https://restaurant.example/table/${t.id}`
}

function tableLabel(t: CashierTable): string {
  return t.tableNumber ?? t.name ?? `Table ${t.id}`
}

export default function TableQrCodes() {
  const tablesQ = useCashierTables()
  const printRef = useRef<HTMLDivElement>(null)

  const tables = useMemo(() => tablesQ.data ?? [], [tablesQ.data])

  const handlePrintAll = () => {
    window.print()
  }

  const handleDownloadAll = async () => {
    if (tables.length === 0) {
      toast.warning('No tables to download')
      return
    }
    // We trigger one PNG download per table by re-using the per-card download
    // path. Browsers throttle if invoked synchronously, so we space them out.
    toast.info(`Preparing ${tables.length} QR codes…`)
    const links = printRef.current?.querySelectorAll<HTMLButtonElement>(
      'button[data-qr-download]'
    )
    if (!links || links.length === 0) return
    for (let i = 0; i < links.length; i++) {
      links[i]?.click()
      // 150 ms gap keeps Chrome from rejecting subsequent downloads as a popup burst
      await new Promise((r) => setTimeout(r, 150))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Table QR Codes"
        description="Printable QR codes that route diners to their table’s digital menu."
        breadcrumbs={[{ label: 'Cashier' }, { label: 'Table QR Codes' }]}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadAll}
              disabled={tables.length === 0}
            >
              <Download className="size-4" /> Download all
            </Button>
            <Button type="button" onClick={handlePrintAll} disabled={tables.length === 0}>
              <Printer className="size-4" /> Print all
            </Button>
          </div>
        }
      />

      {tablesQ.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <EmptyState
          icon={<QrCodeIcon className="size-7" />}
          title="No dining tables yet"
          description="Add tables in your branch settings to generate QR codes for each one."
        />
      ) : (
        <div
          ref={printRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2"
        >
          {tables.map((t) => (
            <Card key={t.id} className="print:break-inside-avoid print:shadow-none">
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg font-semibold tracking-tight">{tableLabel(t)}</span>
                  {t.capacity ? (
                    <Badge variant="outline">{t.capacity} seats</Badge>
                  ) : null}
                </div>
                <Suspense fallback={<div className="size-[180px]" aria-hidden />}>
                  <QrCode
                    value={tableUrl(t)}
                    size={180}
                    errorCorrectionLevel="M"
                    downloadFileName={`table-${tableLabel(t).toLowerCase().replace(/\s+/g, '-')}`}
                    hideActions
                  />
                </Suspense>
                <p className="text-[10px] font-mono text-muted-foreground break-all leading-tight">
                  {tableUrl(t)}
                </p>
                <div className="print:hidden">
                  {/*
                    Hidden trigger surface that `handleDownloadAll` clicks in bulk.
                    Rendering the actions inline would duplicate buttons; this keeps
                    the card visually clean while preserving per-card download.
                  */}
                  <PerCardActions value={tableUrl(t)} label={tableLabel(t)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Per-card download/print actions. We render a fresh QrCode just to expose its
 * built-in toolbar — but with `hideActions` toggled off — so the bulk handler
 * can synthesise a click on the download button via the `data-qr-download` attr.
 */
function PerCardActions({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <button
        type="button"
        data-qr-download
        onClick={async () => {
          // Mirrors QrCode internal — kept here so the bulk handler can fire it.
          const QRCode = (await import('qrcode')).default
          const svg = await QRCode.toString(value, {
            type: 'svg',
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 360,
          })
          const blob = await svgStringToPng(svg, 360)
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `table-${label.toLowerCase().replace(/\s+/g, '-')}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }}
        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-input hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Download className="size-3" /> PNG
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-input hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Printer className="size-3" /> Print
      </button>
    </div>
  )
}

async function svgStringToPng(svg: string, size: number): Promise<Blob> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('SVG load failed'))
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D unavailable')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(img, 0, 0, size, size)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
        'image/png'
      )
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}
