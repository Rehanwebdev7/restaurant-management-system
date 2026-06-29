import * as React from 'react'
import Cropper, { type Area, type Point } from 'react-easy-crop'
import { RotateCcw, RotateCw, Crop, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * UI-F-4 — Image cropper primitive.
 * Wraps react-easy-crop in a shadcn Dialog. Emits the cropped region as a Blob.
 *
 * Migrated from legacy `frontend/src/components/common/ImageCropperModal.jsx` which
 * hand-rolled crop math + handle dragging in ~580 LOC. react-easy-crop subsumes
 * all of that; this primitive keeps only the canvas extraction + UX shell.
 */

interface ImageCropperProps {
  open: boolean
  image: string | null
  aspect?: number
  cropShape?: 'rect' | 'round'
  /** Output mime type. PNG preserves transparency, JPEG is smaller. */
  outputType?: 'image/jpeg' | 'image/png'
  /** JPEG quality 0–1. Ignored for PNG. */
  outputQuality?: number
  title?: string
  onCropComplete: (blob: Blob) => void
  onCancel?: () => void
  onOpenChange?: (open: boolean) => void
}

/**
 * Extracts the pixel region defined by `pixelCrop` from `imageSrc` and
 * returns a Blob via canvas.toBlob. JPEG output gets a white backfill to
 * avoid black where the source had transparency.
 */
async function cropImageToBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
  type: 'image/jpeg' | 'image/png',
  quality: number
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  // We rotate around the center of a bounding box that fits the rotated image,
  // then crop the requested area out of the unrotated coordinate space.
  const rotRad = (rotation * Math.PI) / 180
  const { width: bBoxWidth, height: bBoxHeight } = rotatedSize(
    image.width,
    image.height,
    rotRad
  )

  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  if (type === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, bBoxWidth, bBoxHeight)
  }

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.translate(-image.width / 2, -image.height / 2)
  ctx.drawImage(image, 0, 0)

  // Snip the crop area out of the rotated canvas
  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height)
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  if (type === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.putImageData(data, 0, 0)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob returned null'))),
      type,
      type === 'image/jpeg' ? quality : undefined
    )
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', (e) => reject(e))
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}

function rotatedSize(width: number, height: number, rotation: number) {
  return {
    width: Math.abs(Math.cos(rotation) * width) + Math.abs(Math.sin(rotation) * height),
    height: Math.abs(Math.sin(rotation) * width) + Math.abs(Math.cos(rotation) * height),
  }
}

export function ImageCropper({
  open,
  image,
  aspect = 1,
  cropShape = 'rect',
  outputType = 'image/jpeg',
  outputQuality = 0.92,
  title = 'Crop image',
  onCropComplete,
  onCancel,
  onOpenChange,
}: ImageCropperProps) {
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)
  const [pixelArea, setPixelArea] = React.useState<Area | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Reset transform state every time the dialog re-opens with a new image
  React.useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      setPixelArea(null)
      setError(null)
      setBusy(false)
    }
  }, [open, image])

  const handleCropComplete = React.useCallback((_area: Area, areaPixels: Area) => {
    setPixelArea(areaPixels)
  }, [])

  const handleReset = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
  }

  const handleConfirm = async () => {
    if (!image || !pixelArea) return
    setBusy(true)
    setError(null)
    try {
      const blob = await cropImageToBlob(image, pixelArea, rotation, outputType, outputQuality)
      onCropComplete(blob)
      onOpenChange?.(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to crop image')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Crop className="size-4" /> {title}
          </DialogTitle>
          <DialogDescription>
            Drag to reposition, scroll or use the slider to zoom, rotate as needed.
          </DialogDescription>
        </DialogHeader>

        {/* Crop surface */}
        <div className="relative bg-neutral-900 h-[400px]">
          {image ? (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              cropShape={cropShape}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={handleCropComplete}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image to crop
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-6 py-4 space-y-4 border-t border-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="cropper-zoom" className="text-xs uppercase tracking-wide text-muted-foreground">
                Zoom
              </Label>
              <span className="text-xs font-mono tabular-nums text-muted-foreground">
                {zoom.toFixed(2)}x
              </span>
            </div>
            <input
              id="cropper-zoom"
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className={cn(
                'w-full h-2 rounded-full bg-muted appearance-none cursor-pointer',
                '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
                '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary',
                '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
                '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full',
                '[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
              aria-label="Zoom level"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
              aria-label="Rotate left 90 degrees"
            >
              <RotateCcw className="size-4" /> -90°
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              aria-label="Rotate right 90 degrees"
            >
              <RotateCw className="size-4" /> +90°
            </Button>
            <span className="text-xs font-mono tabular-nums text-muted-foreground ml-2">
              {rotation}°
            </span>
            <div className="flex-1" />
            <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </div>

          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!image || !pixelArea || busy}
            loading={busy}
          >
            {!busy ? <Check className="size-4" /> : null}
            Crop &amp; Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
