import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, KeyRound, ChevronLeft, UserCircle2 } from 'lucide-react'
import CustomerLayout from '@/features/customer/CustomerLayout'
import { toast } from '@/lib/toast'
import { tokens } from '@/lib/auth/tokens'
import { useCustomerSendOtp, useCustomerVerifyOtp } from '@/api/queries/customer'

/**
 * Customer login — OTP-based per legacy LoginPage.jsx.
 * Backend endpoints `/login/customerSendOtp` + `/login/customerVerifyOtp`
 * return 500 today (no static resource). UI is wired so when the backend
 * exposes them the flow works without further frontend changes.
 */
export default function CustomerLogin() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  // Backend reports demoMode=true when `sms.provider=none` (no MSG91 keys yet)
  // so the UI can keep showing the "use 1234" hint until the owner drops in
  // real SMS credentials. Once `sms.provider=msg91` is set in
  // application.properties, demoMode flips to false and the hint disappears.
  const [demoMode, setDemoMode] = useState(false)

  const sendOtpMutation = useCustomerSendOtp()
  const verifyOtpMutation = useCustomerVerifyOtp()

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(mobile)) {
      toast.warning('Enter a 10-digit mobile number')
      return
    }
    setBusy(true)
    try {
      const result = await sendOtpMutation.mutateAsync(mobile)
      if (result.ok) {
        setDemoMode(result.data.demoMode)
        if (result.data.demoMode) {
          toast.info('Demo mode — use OTP 1234')
        } else {
          toast.success('OTP sent to your mobile')
        }
        setStep('otp')
      } else if (/no static resource|not found|404/i.test(result.message)) {
        // Backend endpoint truly unreachable (network / proxy) — assume demo
        // for the test flow. Removed once the backend has been stable in prod
        // for 30 days.
        setDemoMode(true)
        toast.info('Backend unreachable — falling back to demo OTP 1234')
        setStep('otp')
      } else {
        toast.error(result.message)
      }
    } finally {
      setBusy(false)
    }
  }

  const verifyOtp = async () => {
    if (!/^\d{4,6}$/.test(otp)) {
      toast.warning('Enter the OTP you received')
      return
    }
    setBusy(true)
    try {
      const result = await verifyOtpMutation.mutateAsync({ mobile, otp })
      if (result.ok) {
        tokens.setCustomer(result.data.token)
        localStorage.setItem('UserName', result.data.name ?? `Guest ${mobile.slice(-4)}`)
        localStorage.setItem('UserMobile', mobile)
        if (result.data.email) localStorage.setItem('UserEmail', result.data.email)
        // Persist customer id so downstream flows (profile update, addresses,
        // orders) can echo it back to the backend without re-decoding the
        // access token client-side.
        if (result.data.customerId != null) {
          localStorage.setItem('UserId', String(result.data.customerId))
        }
        // Init FCM after customer session is in place (no-op if Firebase env missing).
        void import('@/lib/fcm').then((m) => m.initFcm())
        toast.success('Welcome back!')
        navigate('/')
        return
      }
      if (/no static resource|not found|404/i.test(result.message)) {
        // Backend down — only honour the local demo bypass when send-otp also
        // believed it was demo, and only for the canonical 1234 code.
        if (demoMode && otp === '1234') {
          const fakeToken = `customer_${mobile}_${Date.now()}`
          tokens.setCustomer(fakeToken)
          localStorage.setItem('UserName', `Guest ${mobile.slice(-4)}`)
          localStorage.setItem('UserMobile', mobile)
          toast.success('Signed in (demo mode)')
          navigate('/')
          return
        }
        toast.error('Backend unreachable — check your connection and try again')
        return
      }
      toast.error(result.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <CustomerLayout>
      <section className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="subtitle">SIGN IN TO CONTINUE</p>
        <div className="c-divider !ml-0" />
        <h1 className="display text-3xl sm:text-4xl mb-2">Welcome <span>Back</span></h1>
        <p className="text-sm text-[--c-text-soft] mb-8">Use your mobile to sign in.</p>

        <div className="c-card p-6 space-y-4">
          {step === 'mobile' ? (
            <>
              <label className="block">
                <span className="subtitle text-[11px]">MOBILE</span>
                <div className="relative mt-2">
                  <Phone className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 gold-text pointer-events-none z-10" />
                  <input
                    className="c-input !pl-11"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>
              </label>
              <button className="c-button-primary w-full" onClick={sendOtp} disabled={busy}>
                {busy ? 'SENDING…' : 'SEND OTP'}
              </button>
            </>
          ) : (
            <>
              <button className="text-xs text-[--c-text-muted] inline-flex items-center gap-1 hover:gold-text" onClick={() => setStep('mobile')}>
                <ChevronLeft className="size-3" /> Change mobile
              </button>
              <p className="text-sm text-[--c-text-soft]">OTP sent to <span className="font-mono gold-text">{mobile}</span></p>
              {demoMode ? (
                <div className="rounded-md border border-[--c-accent]/40 bg-[--c-accent]/10 px-3 py-2 text-xs text-[--c-text-soft]">
                  <span className="gold-text font-semibold">Demo mode active</span> — SMS gateway not configured yet. Use OTP <span className="font-mono gold-text">1234</span> to sign in.
                </div>
              ) : null}
              <label className="block">
                <span className="subtitle text-[11px]">OTP</span>
                <div className="relative mt-2">
                  <KeyRound className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 gold-text pointer-events-none z-10" />
                  <input
                    className="c-input !pl-11 tracking-[0.5em] font-mono text-center"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
              </label>
              <button className="c-button-primary w-full" onClick={verifyOtp} disabled={busy}>
                {busy ? 'VERIFYING…' : 'VERIFY & SIGN IN'}
              </button>
              <button className="text-xs text-[--c-text-muted] hover:gold-text" onClick={sendOtp}>Resend OTP</button>
            </>
          )}
        </div>

        <button
          type="button"
          className="c-button-outline w-full mt-4 inline-flex items-center justify-center gap-2"
          onClick={() => {
            toast.info('Browsing as guest — sign in any time to save your orders')
            navigate('/menu')
          }}
        >
          <UserCircle2 className="size-4" /> CONTINUE AS GUEST
        </button>

        <p className="text-center text-xs text-[--c-text-muted] mt-6">
          By signing in you agree to our <span className="gold-text">Terms</span> &amp; <span className="gold-text">Privacy</span>.
        </p>
      </section>
    </CustomerLayout>
  )
}
