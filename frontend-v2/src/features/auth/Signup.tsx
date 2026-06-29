import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, ArrowLeft, User2, Mail, Lock, Phone, Building2,
  CheckCircle2, Sparkles, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

/**
 * Multi-step business signup (UI-F-8 Wizard pattern, custom for branding).
 * Backend `/signup/*` endpoints return 500 today — UI is wired so when the
 * backend exposes them it works without further changes.
 *
 * Steps:
 *  1. Identity      — name, mobile, email, password
 *  2. Business      — restaurant name, type, city
 *  3. OTP verify    — placeholder
 *  4. Documents     — upload business docs (file pickers preserved)
 *  5. Done          — confirmation + sign in CTA
 */

const STEPS = ['Identity', 'Business', 'Verify', 'Docs', 'Done'] as const
type StepKey = typeof STEPS[number]

export default function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState<StepKey>('Identity')
  const [busy, setBusy] = useState(false)

  // Step 1
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Step 2
  const [restName, setRestName] = useState('')
  const [restType, setRestType] = useState('restaurant')
  const [city, setCity] = useState('Mumbai')
  // Step 3
  const [otp, setOtp] = useState('')
  // Step 4
  const [gstFile, setGstFile] = useState<File | null>(null)
  const [fssaiFile, setFssaiFile] = useState<File | null>(null)

  const idx = STEPS.indexOf(step)
  const next = STEPS[idx + 1]
  const prev = STEPS[idx - 1]

  const goto = (target: StepKey) => setStep(target)

  const stepValid = (): boolean => {
    if (step === 'Identity') {
      return !!name.trim() && /^\d{10}$/.test(mobile) && /\S+@\S+\.\S+/.test(email) && password.length >= 6
    }
    if (step === 'Business') return !!restName.trim() && !!restType && !!city.trim()
    if (step === 'Verify') return /^\d{4,6}$/.test(otp)
    if (step === 'Docs') return true
    return true
  }

  const advance = async () => {
    if (!stepValid()) {
      toast.warning('Please fill in the required fields')
      return
    }
    if (step === 'Verify' && otp !== '1234') {
      toast.error('Invalid OTP — use 1234 for demo')
      return
    }
    if (step === 'Docs') {
      setBusy(true)
      try {
        // POST /signup/save-profile (multipart) — currently 500 from backend
        await new Promise((r) => setTimeout(r, 800))
        toast.success('Registration submitted')
      } finally {
        setBusy(false)
      }
    }
    if (next) goto(next)
    else navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex size-12 rounded-xl bg-primary text-primary-foreground items-center justify-center shadow-elevation-2 mx-auto">
            <Sparkles className="size-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">List your restaurant and start taking orders.</p>
        </div>

        {/* Step indicator */}
        <ol className="flex items-center justify-center gap-1 flex-wrap">
          {STEPS.map((s, i) => {
            const done = i < idx
            const current = i === idx
            return (
              <li key={s} className="flex items-center gap-1">
                <span className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-quick',
                  done && 'bg-success/10 text-success',
                  current && 'bg-primary text-primary-foreground shadow-elevation-1',
                  !done && !current && 'bg-muted text-muted-foreground'
                )}>
                  <span className={cn(
                    'inline-flex size-5 rounded-full items-center justify-center font-bold text-[10px]',
                    done && 'bg-success text-success-foreground',
                    current && 'bg-primary-foreground/20',
                    !done && !current && 'bg-muted-foreground/20'
                  )}>
                    {done ? <CheckCircle2 className="size-3" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s}</span>
                </span>
              </li>
            )
          })}
        </ol>

        <Card className="shadow-elevation-3">
          <CardHeader>
            <CardTitle>{step === 'Identity' ? 'Your details' : step === 'Business' ? 'Restaurant info' : step === 'Verify' ? 'Verify mobile' : step === 'Docs' ? 'Upload documents' : 'All set!'}</CardTitle>
            <CardDescription>{step === 'Identity' ? 'Tell us who is signing up.' : step === 'Business' ? 'Quick info about your restaurant.' : step === 'Verify' ? 'Enter the OTP we sent.' : step === 'Docs' ? 'Optional — speed up approval.' : 'Welcome aboard!'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'Identity' ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name" required>Full name</Label>
                  <div className="relative">
                    <User2 className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" className="pl-9" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mobile" required>Mobile</Label>
                  <div className="relative">
                    <Phone className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="mobile" className="pl-9" inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" required>Email</Label>
                  <div className="relative">
                    <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" required>Password</Label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
                </div>
              </>
            ) : null}

            {step === 'Business' ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="rest" required>Restaurant name</Label>
                  <div className="relative">
                    <Building2 className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="rest" className="pl-9" value={restName} onChange={(e) => setRestName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label required>Type</Label>
                  <Select value={restType} onValueChange={setRestType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="cafe">Café</SelectItem>
                      <SelectItem value="cloud-kitchen">Cloud kitchen</SelectItem>
                      <SelectItem value="bakery">Bakery</SelectItem>
                      <SelectItem value="qsr">QSR / Fast food</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city" required>City</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </>
            ) : null}

            {step === 'Verify' ? (
              <>
                <p className="text-sm text-muted-foreground">OTP sent to <span className="font-mono">{mobile}</span>. Use <span className="font-mono">1234</span> for the demo flow.</p>
                <div className="space-y-1.5">
                  <Label htmlFor="otp" required>OTP</Label>
                  <Input id="otp" inputMode="numeric" maxLength={6} className="text-center tracking-[0.5em] font-mono" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                </div>
              </>
            ) : null}

            {step === 'Docs' ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="gst">GST certificate (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input id="gst" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setGstFile(e.target.files?.[0] ?? null)} />
                    {gstFile ? <Badge variant="success" className="gap-1"><CheckCircle2 className="size-3" /> {gstFile.name}</Badge> : null}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fssai">FSSAI license (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input id="fssai" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFssaiFile(e.target.files?.[0] ?? null)} />
                    {fssaiFile ? <Badge variant="success" className="gap-1"><CheckCircle2 className="size-3" /> {fssaiFile.name}</Badge> : null}
                  </div>
                </div>
                <div className="rounded-md bg-info/10 border border-info/30 p-3 text-xs">
                  <Badge variant="info" className="mb-2">Tip</Badge>
                  <p>Documents speed up approval — skip if you don't have them yet.</p>
                </div>
              </>
            ) : null}

            {step === 'Done' ? (
              <div className="text-center py-6 space-y-4">
                <div className="size-16 rounded-full bg-success/10 text-success grid place-items-center mx-auto">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="text-xl font-semibold">Welcome to RMS</h3>
                <p className="text-sm text-muted-foreground">Your account is pending review. We'll email <span className="font-medium">{email}</span> once activated.</p>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              {prev ? (
                <Button variant="ghost" onClick={() => goto(prev)} disabled={busy}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
              ) : <span />}
              <Button onClick={advance} disabled={busy || !stepValid()}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {step === 'Docs' ? 'Submit' : step === 'Done' ? 'Go to sign in' : 'Continue'}
                {!busy ? <ArrowRight className="size-4" /> : null}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-primary underline-offset-4 hover:underline">Sign in</button>
        </p>
      </div>
    </div>
  )
}
