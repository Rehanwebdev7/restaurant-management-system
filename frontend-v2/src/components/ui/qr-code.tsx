import * as React from 'react'
import QRCode from 'qrcode'
import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * UI-F-6 — QR code primitive.
 * Renders SVG (sharp at any size, prints cleanly) and offers PNG export by
 * rasterising the SVG through an Image → canvas pipeline.
 */

export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export interface QrCodeProps {
  value: string
  size?: number
  bgColor?: string
  fgColor?: string
  errorCorrectionLevel?: QrErrorCorrectionLevel
  margin?: number
  className?: string
  /** Filename (without extension) used by the PNG download button. */
  downloadFileName?: string
  /** Hide the action toolbar — useful when embedding inside a printable grid. */
  hideActions?: boolean
}

export function QrCode({
  value,
  size = 200,
  bgColor = '#ffffff',
  fgColor = '#000000',
  errorCorrectionLevel = 'M',
  margin = 1,
  className,
  downloadFileName = 'qr-code',
  hideActions = false,
}: QrCodeProps) {
  const [svg, setSvg] = React.useState<string>('')
  const [error, setError] = React.useState<string | null>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let cancelled = false
    QRCode.toString(value, {
      type: 'svg',
      errorCorrectionLevel,
      margin,
      color: { dark: fgColor, light: bgColor },
      width: size,
    })
      .then((s) => {
        if (!cancelled) {
          setSvg(s)
          setError(null)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to generate QR code')
        }
      })
    return () => {
      cancelled = true
    }
  }, [value, size, bgColor, fgColor, errorCorrectionLevel, margin])

  const handleDownload = async () => {
    if (!svg) return
    try {
      const blob = await svgToPngBlob(svg, size)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${downloadFileName}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export PNG')
    }
  }

  const handlePrint = () => {
    // Bare window.print is the safe default; a wider PrintLayout primitive would
    // shadow this if/when introduced.
    window.print()
  }

  if (error) {
    return (
      <p role="alert" className={cn('text-xs text-destructive', className)}>
        {error}
      </p>
    )
  }

  return (
    <div className={cn('inline-flex flex-col gap-2', className)}>
      <div
        ref={wrapperRef}
        className="bg-white p-2 rounded border border-border inline-block leading-none"
        style={{ width: size + 16, height: size + 16 }}
        // Inlined SVG — qrcode library produces a sanitised SVG string from the
        // numeric grid, so it is safe to inject directly.
        dangerouslySetInnerHTML={{ __html: svg }}
        aria-label={`QR code for ${value}`}
        role="img"
      />
      {hideActions ? null : (
        <div className="flex items-center gap-2 print:hidden">
          <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
            <Download className="size-4" /> PNG
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="size-4" /> Print
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Rasterise an SVG string to a PNG Blob by drawing it onto a canvas via an
 * Image element. The output is upscaled 2× for crisp print quality.
 */
async function svgToPngBlob(svg: string, size: number): Promise<Blob> {
  const scale = 2
  const out = size * scale
  // Use a Blob URL rather than a data URL — Safari has issues rendering large
  // SVG data URLs onto a canvas.
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Failed to load SVG'))
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = out
    canvas.height = out
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, out, out)
    ctx.drawImage(img, 0, 0, out, out)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob returned null'))),
        'image/png'
      )
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}
