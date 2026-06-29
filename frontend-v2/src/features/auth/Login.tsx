import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Lock, Phone, Sparkles, LogIn, Eye, EyeOff, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { panelLogin } from '@/api/services/auth'
import { tokens } from '@/lib/auth/tokens'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

/**
 * Login page — Phase 3 first feature.
 *  - Mobile: digits only, hard max 10 (UI-F-36 form polish)
 *  - Password: eye-icon visibility toggle (UI-F-31 micro-interaction)
 *  - Sonner toast for backend FAILURE / network errors
 *  - Demo creds drawer from seed_demo_data.sql for dev convenience
 */

interface QuickUser {
  label: string
  mobile: string
  password: string
}

/**
 * Real seeded users from the live DB (`seed_demo_data.sql`).
 * NOT demo / mock — clicking these populates the form with actual
 * working credentials that hit Spring Boot → Supabase Postgres.
 */
const SEEDED_USERS: readonly QuickUser[] = [
  // Platform operator — both 'admin' + 'superadmin' roles land on /superadmin/* (legacy AdminRoutes.js merges them).
  { label: 'Superadmin (platform)', mobile: '9800000007', password: 'super@123' },
  { label: 'Admin (platform)',     mobile: '9800000008', password: 'admin@123' },
  { label: 'Restaurant Owner',     mobile: '9800000001', password: 'spice@123' },
  { label: 'Branch Manager',       mobile: '9800000002', password: 'branch@123' },
  { label: 'Captain',              mobile: '9800000003', password: 'captain@123' },
  { label: 'Kitchen',              mobile: '9800000004', password: 'kitchen@123' },
  { label: 'Delivery',             mobile: '9800000005', password: 'delivery@123' },
  { label: 'Cashier',              mobile: '9800000006', password: 'cashier@123' },
] as const

export default function Login() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  const login = useMutation({
    mutationFn: panelLogin,
    onSuccess: (res) => {
      if ('fail' in res) {
        toast.error(res.fail)
        return
      }
      const data = res.success
      // Real shape verified 2026-06-23: token + userType
      if (data.token) tokens.setAuth(data.token)
      if (data.name) localStorage.setItem('UserName', data.name)
      if (data.mobile) localStorage.setItem('UserMobile', data.mobile)
      if (data.id != null) localStorage.setItem('UserId', String(data.id))
      if (data.userType) localStorage.setItem('UserRole', data.userType)
      toast.success(`Welcome back, ${data.name ?? 'user'}!`)
      // UI-F-10: FCM init (no-op when env vars missing). Never blocks login.
      void import('@/lib/fcm').then((m) => m.initFcm()).catch(() => undefined)
      const role = (data.userType ?? '').toLowerCase()
      if (role.includes('kitchen')) navigate('/kitchen/dashboard')
      else if (role.includes('cashier')) navigate('/cashier/dashboard')
      else if (role.includes('delivery')) navigate('/delivery/dashboard')
      else if (role.includes('branch')) navigate('/branch/dashboard')
      else if (role.includes('captain')) navigate('/restaurant/dashboard')
      else if (role.includes('restaurant')) navigate('/restaurant/dashboard')
      // Legacy AdminRoutes.js merges 'admin' + 'superadmin' into ONE platform panel.
      // Both go to /superadmin/dashboard.
      else if (role.includes('admin') || role.includes('super')) navigate('/superadmin/dashboard')
      else navigate('/kitchen/dashboard')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Login failed')
    },
  })

  // UI-F-36: only digits, max 10. Strip any other chars on paste too.
  const onMobileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10)
    setMobile(cleaned)
  }

  const mobileValid = /^\d{10}$/.test(mobile)
  const canSubmit = mobileValid && password.length > 0 && !login.isPending

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!mobileValid) {
      toast.warning('Enter a 10-digit mobile number')
      return
    }
    if (!password) {
      toast.warning('Enter your password')
      return
    }
    login.mutate({ mobile, password })
  }

  const fillSeeded = (c: QuickUser) => {
    setMobile(c.mobile)
    setPassword(c.password)
    toast.info(`Filled ${c.label} credentials`)
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex size-12 rounded-xl bg-primary text-primary-foreground items-center justify-center shadow-elevation-2 mx-auto">
            <Sparkles className="size-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Restaurant Management</h1>
          <p className="text-sm text-muted-foreground">Sign in to your panel</p>
        </div>

        <Card className="shadow-elevation-3">
          <CardHeader>
            <CardTitle>{t('auth.welcomeBack')}</CardTitle>
            <CardDescription>{t('auth.useCredentials')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              {/* Mobile field — digits only, max 10 */}
              <div className="space-y-1.5">
                <Label htmlFor="mobile" required>
                  {t('auth.mobile')}
                </Label>
                <div className="relative">
                  <Phone className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="10-digit mobile"
                    className={cn(
                      'pl-9 pr-14 tracking-wide tabular-nums',
                      mobile.length > 0 && !mobileValid && 'border-warning focus-visible:ring-warning'
                    )}
                    maxLength={10}
                    pattern="\d{10}"
                    value={mobile}
                    onChange={onMobileChange}
                    aria-required="true"
                    aria-invalid={mobile.length > 0 && !mobileValid}
                    aria-describedby="mobile-help"
                  />
                  <span
                    id="mobile-help"
                    className={cn(
                      'absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono tabular-nums',
                      mobileValid ? 'text-success' : 'text-muted-foreground'
                    )}
                    aria-live="polite"
                  >
                    {mobile.length}/10
                  </span>
                </div>
              </div>

              {/* Password field — eye toggle */}
              <div className="space-y-1.5">
                <Label htmlFor="password" required>
                  {t('auth.password')}
                </Label>
                <div className="relative">
                  <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9 pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className={cn(
                      'absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-md',
                      'inline-flex items-center justify-center',
                      'text-muted-foreground hover:text-foreground hover:bg-accent',
                      'transition-all duration-quick ease-entrance active:scale-[0.92]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    )}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" loading={login.isPending} disabled={!canSubmit}>
                <LogIn className="size-4" /> Sign in
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick-fill helper — real seeded DB users from seed_demo_data.sql */}
        <Card className="shadow-elevation-1">
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium hover:bg-accent rounded-lg transition-colors duration-quick"
            aria-expanded={showDemo}
            aria-controls="seeded-users"
          >
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <KeyRound className="size-4" /> Quick fill — seeded users
            </span>
            <span className="text-xs text-muted-foreground">{showDemo ? 'Hide' : 'Show'}</span>
          </button>
          {showDemo ? (
            <div id="seeded-users" className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SEEDED_USERS.map((c) => (
                <button
                  key={c.mobile}
                  type="button"
                  onClick={() => fillSeeded(c)}
                  className="text-left p-2.5 rounded-md border border-border bg-card hover:bg-accent transition-all duration-quick ease-entrance active:scale-[0.98]"
                >
                  <p className="text-xs font-semibold text-foreground">{c.label}</p>
                  <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
                    {c.mobile} · {c.password}
                  </p>
                </button>
              ))}
            </div>
          ) : null}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Backend: <code className="font-mono">{import.meta.env.VITE_API_BASE_URL}</code>
        </p>
      </div>
    </div>
  )
}
