/**
 * ReservationModal — dedicated table-booking dialog.
 *
 * Wires the Reserve button in the header (and any other Reserve CTA) to a
 * clean modal that focuses only on the booking form. Contact page is left
 * for pure contact information; reservations are a distinct UX moment.
 *
 * Open flow:
 *   - Any Reserve button dispatches `customer:open-reservation` on document.
 *   - `CustomerLayout` mounts this modal + listens for the event.
 *
 * The form itself is the existing `ReservationWizard` (simple 5-field
 * layout) so we don't duplicate reservation logic.
 */

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, CalendarHeart } from 'lucide-react'
import ReservationWizard from '@/features/customer/pages/HomePage/ReservationWizard'
import { useBrand } from '@/components/providers/BrandProvider'
import { useBodyScrollLock } from '@/lib/useBodyScrollLock'

export const OPEN_RESERVATION_EVENT = 'customer:open-reservation'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ReservationModal({ open, onClose }: Props) {
  const brand = useBrand()
  const reduce = useReducedMotion()
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.25 }}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Reserve a table"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close reservation"
            onClick={onClose}
            className="absolute inset-0 w-full h-full bg-[rgba(15,10,5,0.55)] backdrop-blur-sm cursor-default"
          />

          {/* Dialog card */}
          <motion.div
            initial={{ y: reduce ? 0 : 60, opacity: 0, scale: reduce ? 1 : 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: reduce ? 0 : 40, opacity: 0, scale: reduce ? 1 : 0.98 }}
            transition={{
              type: reduce ? 'tween' : 'spring',
              stiffness: 260,
              damping: 30,
              duration: reduce ? 0 : undefined,
            }}
            className="customer-shell customer-shell--light c-reserve-modal relative w-full sm:w-[560px] max-w-full max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
            style={{
              background: 'var(--c-bg-elev, #FFFCF6)',
              border: '1px solid rgba(201, 169, 110, 0.35)',
            }}
          >
            {/* Close button — floats top-right, doesn't compete with title */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-[2] inline-flex items-center justify-center size-9 rounded-full hover:opacity-80 transition-opacity"
              style={{ background: 'rgba(26,26,26,0.06)', color: 'var(--c-text)' }}
            >
              <X className="size-4" />
            </button>

            {/* Header — centered editorial title, no truncation */}
            <div className="px-6 pt-8 pb-3 text-center relative">
              <span
                className="inline-flex items-center justify-center size-12 rounded-full mb-3"
                style={{
                  background: 'linear-gradient(135deg, #F5E5B8, #C9A96E)',
                  boxShadow: '0 8px 22px -6px rgba(201,169,110,0.5)',
                }}
                aria-hidden
              >
                <CalendarHeart className="size-6" style={{ color: '#1A1A1A' }} />
              </span>
              <p className="subtitle text-[10px] tracking-[0.28em] mb-1" style={{ color: 'var(--c-terracotta)' }}>
                RESERVE A TABLE
              </p>
              <h2 className="display text-2xl sm:text-3xl leading-tight" style={{ color: 'var(--c-text)' }}>
                Reserve Your <span style={{ color: 'var(--c-accent)' }}>Table</span>
              </h2>
              <p className="text-[13px] mt-2 max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--c-text-soft)' }}>
                A few details and your seat is set at{' '}
                <span className="font-semibold" style={{ color: 'var(--c-text)' }}>{brand.restaurantName}</span>.
              </p>
              {/* Gold hairline separator */}
              <div className="mt-5 mx-auto h-px w-24" style={{ background: 'linear-gradient(90deg, transparent, var(--c-accent, #C9A96E), transparent)' }} />
            </div>

            {/* Form body */}
            <div className="px-5 sm:px-6 pb-6">
              <ReservationWizard />
            </div>

            {/* Footnote */}
            <div className="px-6 pb-6 -mt-2 text-[11px] text-center" style={{ color: 'var(--c-text-muted)' }}>
              We'll call you to confirm your table shortly.
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

/** Convenience opener — any Reserve CTA calls this. */
export function openReservation(): void {
  if (typeof document === 'undefined') return
  document.dispatchEvent(new CustomEvent(OPEN_RESERVATION_EVENT))
}
