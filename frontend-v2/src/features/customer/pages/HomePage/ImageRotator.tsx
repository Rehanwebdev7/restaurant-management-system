import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { handleImageError, type ImageKind } from '@/features/customer/image-fallback'
import { cn } from '@/lib/utils'

/**
 * ImageRotator — reusable cross-fading image carousel used by
 * BrandStoryShowcase, SignatureExperience, and LifestyleBanner.
 *
 * Auto-advances through `images` every `interval` ms with an 800ms opacity
 * cross-fade and a subtle Ken Burns zoom per slide. Pauses on hover. Falls
 * back to a static first image when the user prefers reduced motion.
 */
interface Props {
  images: string[]
  interval?: number
  kind?: ImageKind
  alt?: string
  className?: string
  imgClassName?: string
  showDots?: boolean
}

export default function ImageRotator({
  images,
  interval = 5000,
  kind = 'ambience',
  alt = '',
  className,
  imgClassName,
  showDots = true,
}: Props) {
  const reduce = useReducedMotion()
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (reduce || paused || images.length < 2) return
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % images.length)
    }, interval)
    return () => window.clearInterval(t)
  }, [reduce, paused, images.length, interval])

  if (images.length === 0) return null
  const active = images[idx % images.length]!

  return (
    <div
      className={cn('relative w-full h-full overflow-hidden', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="img"
      aria-label={alt}
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        <motion.img
          key={active}
          src={active}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={handleImageError(kind)}
          initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
          animate={reduce ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 1 } : { opacity: 0, scale: 1.02 }}
          transition={{
            opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
            scale: { duration: reduce ? 0 : (interval / 1000) + 1.2, ease: 'linear' },
          }}
          className={cn(
            'absolute inset-0 w-full h-full object-cover',
            imgClassName,
          )}
        />
      </AnimatePresence>

      {showDots && images.length > 1 ? (
        <div className="hidden md:flex absolute bottom-3 right-3 gap-1.5 z-10 rounded-full px-2 py-1.5 bg-black/35 backdrop-blur-md border border-white/10">
          {images.map((_, i) => {
            const isActive = i === idx % images.length
            return (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setIdx(i) }}
                aria-label={`Show image ${i + 1}`}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: isActive ? 18 : 5,
                  height: 5,
                  background: isActive ? 'var(--c-accent, #C9A96E)' : 'rgba(255,255,255,0.55)',
                }}
              />
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
