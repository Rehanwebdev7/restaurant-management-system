import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, KeyRound, Lock, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/lib/toast'

/**
 * Forgot / reset password. Backend OTP endpoints currently return 500
 * (no static resource). UI is fully wired — when backend ships these
 * routes the flow works without further changes.
 */
export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'mobile' | 'otp' | 'done'>('mobile')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(mobile)) { toast.warning('Enter a 10-digit mobile'); return }
    setBusy(true)
    try {
      // await apiClient.post('/login/sendOtp', { mobile })
      await new Promise((r) => setTimeout(r, 500))
      toast.info('OTP sent (backend pending — use 1234 for demo)')
      setStep('otp')
    } finally { setBusy(false) }
  }

  const submit = async () => {
    if (!/^\d{4,6}$/.test(otp)) { toast.warning('Enter the OTP'); return }
    if (pw1.length < 6) { toast.warning('Password must be at least 6 chars'); return }
    if (pw1 !== pw2) { toast.warning('Passwords do not match'); return }
    if (otp !== '1234') { toast.error('Invalid OTP — use 1234 for demo'); return }
    setBusy(true)
    try {
      // await apiClient.post('/login/resetPassword', { mobile, otp, password: pw1 })
      await new Promise((r) => setTimeout(r, 800))
      setStep('done')
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <button onClick={() => navigate('/login')} className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="size-3" /> Back to sign in
        </button>
        <div className="text-center space-y-2">
          <div className="inline-flex size-12 rounded-xl bg-primary text-primary-foreground items-center justify-center shadow-elevation-2 mx-auto">
            <KeyRound className="size-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reset password</h1>
          <p className="text-sm text-muted-foreground">We'll send an OTP to your registered mobile.</p>
        </div>

        <Card className="shadow-elevation-3">
          <CardHeader>
            <CardTitle>{step === 'mobile' ? 'Verify mobile' : step === 'otp' ? 'New password' : 'All done'}</CardTitle>
            <CardDescription>{step === 'mobile' ? 'Where should we send the OTP?' : step === 'otp' ? 'Enter OTP and choose a new password.' : 'You can sign in with your new password now.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'mobile' ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="mob" required>Mobile</Label>
                  <div className="relative">
                    <Phone className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="mob" className="pl-9" inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  </div>
                </div>
                <Button className="w-full" onClick={sendOtp} loading={busy}>Send OTP</Button>
              </>
            ) : step === 'otp' ? (
              <>
                <p className="text-sm text-muted-foreground">OTP sent to <span className="font-mono">{mobile}</span>. Use <span className="font-mono">1234</span> for demo.</p>
                <div className="space-y-1.5">
                  <Label htmlFor="otp" required>OTP</Label>
                  <Input id="otp" inputMode="numeric" maxLength={6} className="text-center tracking-[0.5em] font-mono" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw1" required>New password</Label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="pw1" type="password" className="pl-9" value={pw1} onChange={(e) => setPw1(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw2" required>Confirm new password</Label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="pw2" type="password" className="pl-9" value={pw2} onChange={(e) => setPw2(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full" onClick={submit} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  Reset password
                </Button>
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="size-16 rounded-full bg-success/10 text-success grid place-items-center mx-auto">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="text-lg font-semibold">Password updated</h3>
                <p className="text-sm text-muted-foreground">Sign in with your new password to continue.</p>
                <Button onClick={() => navigate('/login')}>Go to sign in</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
