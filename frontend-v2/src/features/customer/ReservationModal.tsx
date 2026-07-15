/**
 * ReservationModal — global reservation dialog.
 *
 * Opened by dispatching a `customer:open-reservation` CustomEvent from any
 * page (header Reserve button, marquee, dish-tile CTA, etc.). Mounted once
 * in CustomerLayout so it's available across the whole customer surface.
 *
 * Uses the shared `.sg-form-card`, `.sg-alt-input`, `.c-input-selector`
 * theme-aware primitives so the modal reads correctly in both dark + light
 * modes. Submits via the same `submitPublicReservation` API the /contact
 * page uses so bookings land in one backend queue.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import { X, Calendar, Clock, ChevronDown, Loader2, Sparkles } from 'lucide-react'
import { DateField } from '@/components/ui/date-field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/lib/toast'
import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { submitPublicReservation } from '@/api/services/customer'
import { cn } from '@/lib/utils'

const TIME_SLOTS = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
]

const formatTimeLabel = (timeStr: string) => {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  const hr = Number(h)
  const ampm = hr >= 12 ? 'PM' : 'AM'
  const displayHr = hr % 12 === 0 ? 12 : hr % 12
  return `${displayHr}:${m} ${ampm}`
}

const springIn: Transition = { type: 'spring', stiffness: 240, damping: 26, mass: 0.7 }

interface FormState {
  name: string
  phone: string
  email: string
  date: string
  time: string
  guests: number
  notes: string
}

const INITIAL: FormState = { name: '', phone: '', email: '', date: '', time: '', guests: 2, notes: '' }

export default function ReservationModal() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [loading, setLoading] = useState(false)

  useBodyScrollLock(open)

  // Event bus: `customer:open-reservation` opens the dialog from anywhere.
  useEffect(() => {
    const openHandler = () => setOpen(true)
    window.addEventListener('customer:open-reservation', openHandler)
    return () => window.removeEventListener('customer:open-reservation', openHandler)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const handleDateChange = (d: Date | undefined) => {
    if (!d) {
      setForm({ ...form, date: '' })
      return
    }
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setForm({ ...form, date: `${yyyy}-${mm}-${dd}` })
  }

  const submit = async () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.warning('Please enter your name (at least 2 characters)')
      return
    }
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      toast.warning('Please enter a valid 10-digit Indian mobile number')
      return
    }
    if (!form.date || !form.time) {
      toast.warning('Please pick a date and time')
      return
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.warning('Please enter a valid email address')
      return
    }

    setLoading(true)
    const res = await submitPublicReservation({
      name: form.name.trim(),
      phone: form.phone,
      email: form.email,
      date: form.date,
      time: form.time,
      guests: form.guests,
      notes: form.notes,
    })
    setLoading(false)

    if (res.ok) {
      toast.success(`Table reserved for ${form.guests} guests on ${form.date} at ${formatTimeLabel(form.time)} — we will call to confirm.`)
    } else {
      toast.warning('Saved locally — we could not reach the server. We will retry.')
    }
    setForm(INITIAL)
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="reservation-modal"
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Reserve a table"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          />

          <motion.div
            className="sg-form-card relative w-full max-w-2xl rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            initial={{ y: 30, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.97, opacity: 0 }}
            transition={springIn}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close reservation dialog"
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[rgba(var(--c-accent-rgb),0.15)] transition-colors z-10"
            >
              <X className="size-5" style={{ color: 'var(--c-accent, #C89B3C)' }} />
            </button>

            <div className="text-center mb-6">
              <div
                className="inline-flex size-12 rounded-full items-center justify-center mb-3"
                style={{ background: 'rgba(var(--c-accent-rgb), 0.15)', border: '1.5px solid var(--c-accent, #C89B3C)' }}
              >
                <Sparkles className="size-5" style={{ color: 'var(--c-accent, #C89B3C)' }} />
              </div>
              <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-2" style={{ color: 'var(--c-accent, #C89B3C)' }}>
                Reserve Your Table
              </p>
              <h2 className="text-2xl sm:text-3xl leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Book a <span className="italic sg-shimmer-text">Memorable</span> Evening
              </h2>
              <p className="text-xs sm:text-sm opacity-70 mt-2 max-w-md mx-auto">
                Tell us when you're coming — we'll confirm within minutes with a quick call.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="sg-alt-input px-4 py-3 text-sm sm:col-span-2"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="sg-alt-input px-4 py-3 text-sm"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              />
              <input
                className="sg-alt-input px-4 py-3 text-sm"
                type="email"
                placeholder="Email (optional)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <div className="relative">
                <span className="absolute left-3 top-[6px] text-[9px] font-bold tracking-wider uppercase z-10 opacity-60">Date</span>
                <DateField
                  value={form.date ? new Date(form.date) : undefined}
                  onChange={handleDateChange}
                  placeholder="Select date"
                  className="c-input-selector font-normal"
                />
              </div>

              <div className="relative">
                <span className="absolute left-3 top-[6px] text-[9px] font-bold tracking-wider uppercase z-10 opacity-60">Time</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="c-input-selector font-normal cursor-pointer">
                      <Clock className="size-4 absolute left-4 bottom-[8px] opacity-60" />
                      <span>{form.time ? formatTimeLabel(form.time) : 'Select time'}</span>
                      <ChevronDown className="size-4 opacity-50 ml-auto" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 bg-black/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl text-white z-[90]">
                    <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
                      <p className="text-[10px] font-bold text-[--c-accent] uppercase tracking-wider mb-2">Lunch Slots</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {TIME_SLOTS.slice(0, 7).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setForm({ ...form, time: t })}
                            className={cn(
                              'text-[10px] py-1.5 px-1 rounded-lg text-center cursor-pointer transition-colors border',
                              form.time === t
                                ? 'bg-[var(--c-accent)] border-[var(--c-accent)] text-black font-bold'
                                : 'bg-white/5 border-white/10 text-[--c-text-soft] hover:bg-white/10 hover:text-white',
                            )}
                          >
                            {formatTimeLabel(t)}
                          </button>
                        ))}
                      </div>
                      <div className="h-px bg-white/10 my-3" />
                      <p className="text-[10px] font-bold text-[--c-accent] uppercase tracking-wider mb-2">Dinner Slots</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {TIME_SLOTS.slice(7).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setForm({ ...form, time: t })}
                            className={cn(
                              'text-[10px] py-1.5 px-1 rounded-lg text-center cursor-pointer transition-colors border',
                              form.time === t
                                ? 'bg-[var(--c-accent)] border-[var(--c-accent)] text-black font-bold'
                                : 'bg-white/5 border-white/10 text-[--c-text-soft] hover:bg-white/10 hover:text-white',
                            )}
                          >
                            {formatTimeLabel(t)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <input
                className="sg-alt-input px-4 py-3 text-sm sm:col-span-2"
                type="number"
                min={1}
                max={25}
                placeholder="Number of guests"
                value={form.guests}
                onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                onWheel={(e) => e.currentTarget.blur()}
              />

              <textarea
                className="sg-alt-input px-4 py-3 text-sm sm:col-span-2 resize-none"
                rows={2}
                placeholder="Special requests (optional) — window seat, cake setup, dietary needs…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                style={{ borderRadius: '14px' }}
              />

              <button
                disabled={loading}
                onClick={submit}
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-10px_rgba(200,155,60,0.55)] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'var(--c-accent, #C89B3C)', color: 'var(--c-text-dark, #1A1210)' }}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Calendar className="size-4" />}
                Reserve Table Now
              </button>

              <p className="sm:col-span-2 text-[11px] text-center opacity-60 pt-1">
                Free to cancel up to 2 hours before your slot.
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
