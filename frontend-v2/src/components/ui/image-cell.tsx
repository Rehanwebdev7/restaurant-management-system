import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Thumbnail renderer for image columns inside DataTable / list rows.
 *
 * Legacy tables (Sliders 80×45, MenuItems 40×40, addon items 32×32, …) all
 * rendered raw `<img>` tags with hand-rolled fallback text. v2 collapses
 * that into one primitive with lazy-loading, blur placeholder, ring border,
 * and a graceful broken-image icon.
 *
 * Click handler optional — pass `onClick` to make the thumbnail open a
 * lightbox / detail view.
 */
export interface ImageCellProps {
  src?: string | null
  alt: string
  /** Square: width === height. For non-square use width + height directly. */
  size?: number
  width?: number
  height?: number
  rounded?: 'sm' | 'md' | 'lg' | 'full'
  onClick?: () => void
  className?: string
}

const ROUND_CLS: Record<NonNullable<ImageCellProps['rounded']>, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

export function ImageCell({
  src,
  alt,
  size = 40,
  width,
  height,
  rounded = 'md',
  onClick,
  className,
}: ImageCellProps) {
  const [broken, setBroken] = useState(false)
  const w = width ?? size
  const h = height ?? size

  if (!src || broken) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground ring-1 ring-border',
          ROUND_CLS[rounded],
          className,
        )}
        style={{ width: w, height: h }}
        title={broken ? 'Image failed to load' : 'No image'}
      >
        <ImageOff className="size-4 opacity-60" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onClick={onClick}
      onError={() => setBroken(true)}
      className={cn(
        'object-cover ring-1 ring-border bg-muted',
        ROUND_CLS[rounded],
        onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : '',
        className,
      )}
      style={{ width: w, height: h }}
    />
  )
}
