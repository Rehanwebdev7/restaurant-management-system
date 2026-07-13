import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Check, Clock, User } from 'lucide-react'
import { toast } from 'sonner'
import { submitPublicReservation } from '@/api/services/customer'
import { cn } from '@/lib/utils'

/**
 * ReservationWizard — simple clean 5-field reservation form.
 * Name · Mobile · Date · Time · Guests · Reserve.
 * Nothing fancy, nothing over-designed. Renders inside the glass card
 * on the espresso reservation section.
 */

const TIME_SLOTS = [
  '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
]

function formatTimeLabel(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export default function ReservationWizard() {
  const [submitting, setSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
  })

  const canSubmit =
    form.name.trim().length > 1 &&
    /^[6-9]\d{9}$/.test(form.phone) &&
    form.date.length > 0 &&
    form.time.length > 0

  const submit = async () => {
    if (!canSubmit) {
      toast.warning('Please fill name, valid mobile, date and time.')
      return
    }
    setSubmitting(true)
    const result = await submitPublicReservation({
      name: form.name.trim(),
      phone: form.phone,
      date: form.date,
      time: form.time,
      guests: form.guests,
    })
    setSubmitting(false)
    if (!result.ok) {
      toast.error(result.message || 'Reservation failed — please try again or call us directly.')
      return
    }
    setBookingId(result.data.reservationId)
  }

  const reset = () => {
    setBookingId(null)
    setForm({ name: '', phone: '', date: '', time: '', guests: 2 })
  }

  // Compute a min date string (today) for the native date input
  const today = new Date()
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  if (bookingId != null) {
    return (
      <div className="text-center py-6 max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          className="mx-auto mb-5 size-16 rounded-full flex items-center justify-center"
          style={{ background: 'var(--c-accent, #C9A96E)', boxShadow: '0 0 0 6px rgba(201,169,110,0.20)' }}
        >
          <Check className="size-8 text-[#14100C]" strokeWidth={3} />
        </motion.div>
        <h3 className="display text-2xl mb-2">Table Confirmed</h3>
        <p className="text-sm mb-4 opacity-85">
          Booking <span className="font-bold" style={{ color: 'var(--c-accent, #C9A96E)' }}>#{bookingId}</span> received. We'll call to confirm shortly.
        </p>
        <div className="inline-flex flex-col gap-1 text-xs bg-white/6 border border-white/15 rounded-lg px-4 py-3 mb-5 opacity-90">
          <span><CalendarIcon className="inline size-3 mr-1.5 opacity-70" />{form.date} · <Clock className="inline size-3 mx-1.5 opacity-70" />{formatTimeLabel(form.time)}</span>
          <span><User className="inline size-3 mr-1.5 opacity-70" />{form.name} · {form.guests} guest{form.guests > 1 ? 's' : ''}</span>
        </div>
        <div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 py-2 px-5 rounded-lg border border-white/25 hover:bg-white/10 text-[#FFFCF6] transition-colors text-xs font-semibold uppercase tracking-widest"
          >
            Book Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
      <input
        className="c-input sm:col-span-2"
        placeholder="Your name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <input
        className="c-input"
        inputMode="numeric"
        maxLength={10}
        placeholder="10-digit mobile"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
      />
      <input
        className="c-input"
        type="number"
        min={1}
        max={20}
        placeholder="Guests"
        value={form.guests}
        onChange={(e) => setForm((f) => ({ ...f, guests: Math.max(1, Math.min(20, Number(e.target.value) || 1)) }))}
        onWheel={(e) => e.currentTarget.blur()}
      />
      <input
        className="c-input"
        type="date"
        min={minDate}
        value={form.date}
        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
      />
      <select
        className="c-input"
        value={form.time}
        onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
      >
        <option value="">Select time</option>
        {TIME_SLOTS.map((t) => (
          <option key={t} value={t}>{formatTimeLabel(t)}</option>
        ))}
      </select>

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit || submitting}
        className={cn(
          'sm:col-span-2 py-3.5 rounded-xl font-bold uppercase tracking-[0.24em] text-sm transition-all mt-2',
          canSubmit && !submitting
            ? 'bg-gradient-to-r from-[var(--c-accent,#C9A96E)] to-[var(--c-terracotta,#B4593F)] text-[#14100C] shadow-[0_10px_28px_rgba(201,169,110,0.30)] hover:shadow-[0_14px_36px_rgba(180,89,63,0.35)] hover:scale-[1.01]'
            : 'bg-white/10 text-white/40 cursor-not-allowed',
        )}
      >
        {submitting ? 'Reserving…' : 'Reserve Table'}
      </button>
    </div>
  )
}
