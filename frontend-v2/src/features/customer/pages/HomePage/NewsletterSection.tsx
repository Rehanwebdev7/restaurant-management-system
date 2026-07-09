/**
 * NewsletterSection — email capture with lead magnet copy.
 * Form is UI-only until backend ships (see BACKEND_TODO.md).
 * Currently shows a "coming soon" toast on submit so nothing lies about state.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Sparkles } from 'lucide-react'
import { toast } from '@/lib/toast'
import { SeedBadge } from '@/features/customer/content/SeedBadge'
import { useSeedMode } from '@/features/customer/content/useSeedMode'

export default function NewsletterSection() {
  const showSeed = useSeedMode()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!showSeed) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }
    setSubmitting(true)
    // TODO(backend): POST /api/customer/newsletter/subscribe/public — pending
    window.setTimeout(() => {
      toast.info('Newsletter signups launch soon — we\'ll save your interest.')
      setEmail('')
      setSubmitting(false)
    }, 700)
  }

  return (
    <section className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl mx-auto px-6 sm:px-10 py-14 rounded-3xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--c-bg-elev) 0%, var(--c-bg-elev-2) 100%)',
          border: '1px solid var(--c-border)',
        }}
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="inline-flex size-12 rounded-full border border-[--c-accent] items-center justify-center gold-text">
              <Sparkles className="size-5" />
            </div>
            <SeedBadge />
          </div>
          <h3 className="display text-2xl sm:text-3xl mb-2">Join our <span>table</span></h3>
          <p className="text-sm text-[--c-text-soft] max-w-md mx-auto">
            10% off your first order + weekly signature recipes + first look at new dishes.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <label className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--c-text-muted]" aria-hidden />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={submitting}
              className="w-full pl-10 pr-4 py-3 rounded-full bg-[--c-bg] border border-[--c-border] text-sm text-[--c-text] placeholder-[--c-text-muted] focus:outline-none focus:border-[--c-accent] transition-colors disabled:opacity-60"
              aria-label="Email address"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="c-button-primary disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Subscribe'}
          </button>
        </form>
      </motion.div>
    </section>
  )
}
