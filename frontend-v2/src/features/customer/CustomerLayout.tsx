import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform, type Variants } from 'framer-motion'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import {
  Menu, Search, MapPin, Sun, Moon, ShoppingBag, User, ChevronDown, Heart, X, Trash2, Plus,
  Phone, Mail, ChevronRight, Edit3, ClipboardList, MapPinned, LogOut,
} from 'lucide-react'
import { tokens } from '@/lib/auth/tokens'

// Brand icons (Facebook/Instagram/Twitter removed in newer lucide-react).
const Facebook = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.99 22 12z" />
  </svg>
)
const Instagram = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)
const Twitter = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)
import { useWishlist, useCustomerTheme } from '@/features/customer/customer-store'
import { DISHES, useCart, setSelectedBranchId as catalogSetSelectedBranchId } from '@/features/customer/catalog'
import { useBrand } from '@/components/providers/BrandProvider'
import { useCustomerBranches, useCustomerSendOtp, useCustomerVerifyOtp } from '@/api/queries/customer'
import { Phone as PhoneIcon, KeyRound, UserCircle2, ChevronLeft } from 'lucide-react'
import { CustomerScrollProgress } from '@/components/ui/customer-scroll-progress'
import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import SearchModal from '@/features/customer/SearchModal'
import CartDrawer from '@/features/customer/CartDrawer'
import MobileBottomNav, { OPEN_WISHLIST_EVENT } from '@/features/customer/MobileBottomNav'
import { PageTransition } from '@/components/ui/page-transition'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

// Branch list — when the backend `/api/customer/restaurant_branch/all` route
// is live, the picker is driven from real data. Until then we fall back to
// the two DB branches verified to have menu items
// (branchId=4 → 33 items Spice Garden Bandra; branchId=6 → 9 items Biryani House).
interface DisplayBranch { id: number; name: string; address: string }

// Last-resort offline-only fallback. Used ONLY when both the network and
// localStorage are unavailable so the page can still render. Real branch
// data always comes from `/api/customer/restaurant_branch/public/all`,
// which is tenant-scoped by the request Host header.
const BRANCHES: DisplayBranch[] = [
  { id: 0, name: 'Loading…', address: 'Resolving branch from your domain…' },
]

const SELECTED_BRANCH_KEY = 'customer_selected_branch_id'

function readSelectedBranchId(): number {
  // 0 means "no branch selected yet — auto-pick the first one returned
  // from the backend once `useCustomerBranches` resolves". Hardcoded
  // ids broke multi-tenant (a branch id from tenant A doesn't exist on
  // tenant B's domain).
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(SELECTED_BRANCH_KEY)
    if (!raw) return 0
    const id = Number(raw)
    return Number.isFinite(id) && id > 0 ? id : 0
  } catch {
    return 0
  }
}

interface Props { children: ReactNode }

export default function CustomerLayout({ children }: Props) {
  const navigate = useNavigate()
  const [showMobile, setShowMobile] = useState(false)
  const [showBranch, setShowBranch] = useState(false)
  // Brand logo load state. Default to text-only ('failed') so the header
  // shows a clean wordmark instantly — the <img> mounts in the background
  // and flips us to 'loaded' iff it actually decodes. Any 404 / CORS / mime
  // failure stays in 'failed' so we never render a broken-image placeholder
  // next to the name. Resets whenever the logoUrl changes (e.g. tenant
  // switch via Host header).
  const [logoState, setLogoState] = useState<'loading' | 'loaded' | 'failed'>('loading')
  // Ref on the branch picker subtree so a mousedown outside it closes the
  // dropdown — better than a fixed-inset backdrop that fails when the header
  // owns a higher stacking context.
  const branchPickerRef = useRef<HTMLDivElement | null>(null)
  // Inline sign-in popover (no more full-screen route hop for OTP). Same
  // close-on-outside-click pattern as the branch picker.
  const [showLogin, setShowLogin] = useState(false)
  const loginPopoverRef = useRef<HTMLDivElement | null>(null)
  const [loginStep, setLoginStep] = useState<'mobile' | 'otp'>('mobile')
  const [loginMobile, setLoginMobile] = useState('')
  const [loginOtp, setLoginOtp] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [loginDemoMode, setLoginDemoMode] = useState(false)
  const sendOtpMutation = useCustomerSendOtp()
  const verifyOtpMutation = useCustomerVerifyOtp()
  const [showWishlist, setShowWishlist] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [selectedBranchId, setSelectedBranchId] = useState<number>(readSelectedBranchId)

  const theme = useCustomerTheme()
  const wishlist = useWishlist()
  const cart = useCart()
  const brand = useBrand()
  // Live branch list from `/api/customer/restaurant_branch/public/all`.
  // The backend resolves the tenant from the Host header and only returns
  // branches that belong to that restaurant. We pass no args — the host
  // header takes care of scoping.
  const branchesQuery = useCustomerBranches()
  const branches = useMemo<DisplayBranch[]>(() => {
    const live = branchesQuery.data ?? []
    if (live.length > 0) {
      return live.map((b) => ({
        id: b.id,
        name: `${brand.restaurantName} — ${b.branchName}`,
        address: [b.addressLine1, b.city].filter(Boolean).join(', '),
      }))
    }
    return BRANCHES
  }, [branchesQuery.data, brand.restaurantName])

  // Reset logo load state whenever the brand URL changes so the new tenant's
  // logo gets a fresh attempt instead of being stuck in the previous tenant's
  // failed state.
  useEffect(() => {
    setLogoState(brand.logoUrl ? 'loading' : 'failed')
  }, [brand.logoUrl])

  // Branch dropdown close-on-outside-click + Escape. The old fixed-inset
  // backdrop sat at z-40 but the header lives in its own stacking context,
  // so clicks on the header (or anywhere above z-40) never reached the
  // backdrop. Mousedown listener on document is the bulletproof pattern.
  useEffect(() => {
    if (!showBranch) return
    const onDocMouseDown = (e: MouseEvent) => {
      const node = branchPickerRef.current
      if (node && !node.contains(e.target as Node)) {
        setShowBranch(false)
      }
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowBranch(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [showBranch])

  // Login modal — backdrop click closes; this only handles Escape.
  useEffect(() => {
    if (!showLogin) return
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowLogin(false) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [showLogin])

  // Lock body scroll while ANY layout-owned modal/drawer is open. The
  // wishlist drawer and mobile menu sheet didn't have their own lock so
  // background scroll bled through under them. Centralising it here also
  // means CustomerLayout owns the lock and DishDetailModal (portaled
  // elsewhere) gets a separate, independent lock without conflict.
  useBodyScrollLock(showLogin || showWishlist || showMobile)

  // Safety net: when the user navigates between routes, force any stale
  // body-overflow lock back to empty. This guards against the case where a
  // modal in a now-unmounted view forgot to clean up (HMR, abrupt close,
  // browser back button mid-animation, etc.).
  const navLocation = useLocation()
  useEffect(() => {
    document.body.style.overflow = ''
  }, [navLocation.pathname])

  // Reset login state every time the popover closes so reopening it
  // doesn't show stale digits / OTP step.
  useEffect(() => {
    if (!showLogin) {
      setLoginStep('mobile'); setLoginMobile(''); setLoginOtp('')
      setLoginDemoMode(false); setLoginBusy(false)
    }
  }, [showLogin])

  const handleSendLoginOtp = async () => {
    if (!/^\d{10}$/.test(loginMobile)) { toast.warning('Enter a 10-digit mobile number'); return }
    setLoginBusy(true)
    try {
      const result = await sendOtpMutation.mutateAsync(loginMobile)
      if (result.ok) {
        setLoginDemoMode(result.data.demoMode)
        toast.info(result.data.demoMode ? 'Demo mode — use OTP 1234' : 'OTP sent to your mobile')
        setLoginStep('otp')
      } else if (/no static resource|not found|404/i.test(result.message)) {
        setLoginDemoMode(true)
        toast.info('Backend unreachable — demo OTP 1234')
        setLoginStep('otp')
      } else {
        toast.error(result.message)
      }
    } finally { setLoginBusy(false) }
  }

  const handleVerifyLoginOtp = async () => {
    if (!/^\d{4,6}$/.test(loginOtp)) { toast.warning('Enter the OTP you received'); return }
    setLoginBusy(true)
    try {
      const result = await verifyOtpMutation.mutateAsync({ mobile: loginMobile, otp: loginOtp })
      if (result.ok) {
        tokens.setCustomer(result.data.token)
        localStorage.setItem('UserName', result.data.name ?? `Guest ${loginMobile.slice(-4)}`)
        localStorage.setItem('UserMobile', loginMobile)
        if (result.data.email) localStorage.setItem('UserEmail', result.data.email)
        if (result.data.customerId != null) localStorage.setItem('UserId', String(result.data.customerId))
        void import('@/lib/fcm').then((m) => m.initFcm())
        toast.success('Welcome back!')
        setShowLogin(false)
        setAuthTick((t) => t + 1)
        return
      }
      if (/no static resource|not found|404/i.test(result.message) && loginDemoMode && loginOtp === '1234') {
        tokens.setCustomer(`customer_${loginMobile}_${Date.now()}`)
        localStorage.setItem('UserName', `Guest ${loginMobile.slice(-4)}`)
        localStorage.setItem('UserMobile', loginMobile)
        toast.success('Signed in (demo mode)')
        setShowLogin(false)
        setAuthTick((t) => t + 1)
        return
      }
      toast.error(result.message)
    } finally { setLoginBusy(false) }
  }

  // Auto-select the first branch once branches arrive. Handles two cases:
  //   1. First-ever visit — localStorage is empty (selectedBranchId === 0).
  //   2. Persisted id no longer exists for this tenant (e.g. you used to
  //      browse Spice Garden but the localStorage id belongs to another
  //      tenant or has been deleted).
  // Without this, the menu page would silently render zero items because
  // `useCustomerMenuItems(staleId)` returns an empty list.
  useEffect(() => {
    const live = branchesQuery.data
    if (!live || live.length === 0) return
    const firstId = live[0]?.id
    if (firstId == null) return
    const isValid = live.some((b) => b.id === selectedBranchId)
    if (!isValid) {
      setSelectedBranchId(firstId)
      // Also notify the catalog-level subscribers (useCustomerCatalog reads
      // the same key via its own setSelectedBranchId helper which notifies
      // listeners + writes localStorage atomically).
      catalogSetSelectedBranchId(firstId)
    }
  }, [branchesQuery.data, selectedBranchId])

  const branch = useMemo<DisplayBranch>(
    () => branches.find((b) => b.id === selectedBranchId) ?? branches[0] ?? BRANCHES[0]!,
    [branches, selectedBranchId],
  )
  const reduceMotionLayout = useReducedMotion()
  // Softer spring + slightly lower stiffness gives a smoother glide on
  // open/close — closer to native iOS sheets than the previous slightly
  // mechanical snap. Mass tuned so the sheet doesn't overshoot.
  const drawerSpringTransition = reduceMotionLayout
    ? { duration: 0 }
    : ({ type: 'spring', stiffness: 260, damping: 30, mass: 0.8 } as const)

  // Customer auth — recomputed when the dropdown opens / on storage events
  // so the header reflects login state without a full reload.
  const [authTick, setAuthTick] = useState(0)
  const customerToken = typeof window !== 'undefined' ? tokens.getCustomer() : null
  const userName = typeof window !== 'undefined' ? localStorage.getItem('UserName') : null
  const userMobile = typeof window !== 'undefined' ? localStorage.getItem('UserMobile') : null
  const isSignedIn = Boolean(customerToken)
  // authTick is a soft dependency for the inputs above — used so storage
  // changes from other tabs re-render this header.
  void authTick
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'customerToken' || e.key === 'UserName' || e.key === 'UserMobile') {
        setAuthTick((t) => t + 1)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Mobile bottom-nav dispatches OPEN_WISHLIST_EVENT to flip the drawer.
  useEffect(() => {
    const open = () => setShowWishlist(true)
    window.addEventListener(OPEN_WISHLIST_EVENT, open)
    return () => window.removeEventListener(OPEN_WISHLIST_EVENT, open)
  }, [])

  const handleCustomerLogout = (): void => {
    // Preserve customer_wishlist_v2; clear tokens + identity + cart.
    if (typeof window !== 'undefined') {
      localStorage.removeItem('customerToken')
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('UserName')
      localStorage.removeItem('UserMobile')
      localStorage.removeItem('UserId')
      localStorage.removeItem('UserRole')
      localStorage.removeItem('user')
      localStorage.removeItem('customer_cart_v2')
    }
    setAuthTick((t) => t + 1)
    toast.success('Signed out')
    navigate('/')
  }

  // Cmd/Ctrl+D toggles theme (browser bookmark shortcut shares the chord —
  // we preventDefault so we win in our viewport).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        theme.toggle()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [theme])

  const pickBranch = (b: DisplayBranch): void => {
    setSelectedBranchId(b.id)
    setShowBranch(false)
    if (typeof window !== 'undefined') localStorage.setItem(SELECTED_BRANCH_KEY, String(b.id))
  }

  return (
    <div className={cn('customer-shell', theme.mode === 'light' && 'customer-shell--light')}>
      <CustomerScrollProgress />
      {/* Marquee */}
      <div className="marquee-bar">
        <span className="marquee-track">
          ✦ Order before 9 PM for next-day delivery ✦ Free delivery on orders above ₹499 ✦ New menu launched — Try our Chef's Signature dishes ✦ Reserve your table — Book online &nbsp;&nbsp;
          ✦ Order before 9 PM for next-day delivery ✦ Free delivery on orders above ₹499 ✦ New menu launched — Try our Chef's Signature dishes ✦ Reserve your table — Book online &nbsp;&nbsp;
        </span>
      </div>

      {/* Header — compact, single row, brand from DB */}
      <header className="c-header relative">
        <div className="max-w-7xl mx-auto h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Logo (compact, never wraps) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
            <button onClick={() => setShowMobile(true)} className="lg:hidden p-1.5 -ml-1.5" aria-label="Menu" style={{ color: 'var(--c-text)' }}>
              <Menu className="size-5" />
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-left min-w-0">
              {/*
               * Logo-vs-wordmark rule (senior fix, requested):
               *   - Both render at the same time would produce the ugly
               *     "broken image icon + name" header glitch seen when the
               *     CDN logo 404s or the URL is bad. So we pick ONE:
               *   - If brand.logoUrl is present AND the image actually loads
               *     → show only the logo image.
               *   - Otherwise (no URL OR onError fired OR still loading)
               *     → show only the wordmark (restaurant name + tagline).
               *   - We still mount a hidden <img> when a URL exists so the
               *     browser still attempts the fetch and can flip us to
               *     'loaded' state if successful.
               */}
              {brand.logoUrl && logoState !== 'failed' ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.restaurantName}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onLoad={() => setLogoState('loaded')}
                  onError={() => setLogoState('failed')}
                  className={
                    'h-9 sm:h-10 w-auto object-contain shrink-0 ' +
                    (logoState === 'loading' ? 'invisible w-0 h-0' : '')
                  }
                />
              ) : null}
              {logoState !== 'loaded' ? (
                <span className="flex flex-col leading-none min-w-0">
                  <span className="display logo-compact whitespace-nowrap truncate">{brand.restaurantName}</span>
                  <span className="subtitle text-[9px] mt-0.5 truncate">{brand.tagline}</span>
                </span>
              ) : null}
            </button>
          </div>

          {/* Center: nav (only on xl+ to leave room for branch + actions) */}
          <nav className="hidden xl:flex items-center gap-0.5 flex-1 justify-center">
            {[
              { to: '/', label: 'HOME' },
              { to: '/menu', label: 'MENU' },
              { to: '/signature', label: 'SIGNATURE' },
              { to: '/gallery', label: 'GALLERY' },
              { to: '/locations', label: 'LOCATIONS' },
              { to: '/contact', label: 'CONTACT' },
            ].map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `px-2.5 py-2 text-[11px] font-semibold tracking-[0.18em] transition-colors whitespace-nowrap ${isActive ? 'gold-text' : 'hover:text-[--c-accent]'}`
                }
                style={({ isActive }) => (isActive ? undefined : { color: 'var(--c-text)' })}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: branch + actions (compact) */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0" style={{ color: 'var(--c-text)' }}>
            {/* Branch selector — moved right, only on lg+ */}
            <div className="hidden lg:block relative" ref={branchPickerRef}>
              <button
                onClick={() => setShowBranch(!showBranch)}
                className="flex items-center gap-1.5 px-2 py-1.5 border border-[--c-border] rounded text-[11px] hover:border-[--c-accent] transition-colors max-w-[160px]"
              >
                <MapPin className="size-3 shrink-0" style={{ color: 'var(--c-accent)' }} />
                <span className="font-medium truncate">{branch?.name?.replace(`${brand.restaurantName} — `, '') ?? 'Branch'}</span>
                <ChevronDown className="size-3 opacity-60 shrink-0" />
              </button>
              {showBranch ? (
                  <div className="absolute top-full right-0 mt-2 w-72 c-card p-2 z-50 shadow-2xl">
                    <p className="subtitle text-[10px] px-2 py-1.5">Select Branch</p>
                    {branches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => pickBranch(b)}
                        className={`w-full text-left p-2.5 rounded hover:bg-[--c-bg-elev-2] transition-colors ${branch?.id === b.id ? 'border border-[--c-accent]' : ''}`}
                      >
                        <p className="text-sm font-semibold">{b.name}</p>
                        <p className="text-[11px] text-[--c-text-muted]">{b.address}</p>
                      </button>
                    ))}
                    <button
                      onClick={() => { setShowBranch(false); navigate('/locations') }}
                      className="w-full text-left px-2.5 py-2 mt-1 border-t border-[--c-border] text-[11px] gold-text hover:underline inline-flex items-center gap-1"
                    >
                      See all branches <ChevronRight className="size-3" />
                    </button>
                  </div>
              ) : null}
            </div>

            {/* Reserve CTA — hidden on smaller, compact on md+ */}
            <button
              className="hidden md:inline-flex items-center justify-center !text-[10px] !px-3 !py-2 c-button-outline"
              onClick={() => navigate('/contact')}
            >
              RESERVE
            </button>

            {/* Icon row */}
            <button className="p-1.5 hover:text-[--c-accent] transition-colors" aria-label="Search" onClick={() => setShowSearch(true)}>
              <Search className="size-[18px]" />
            </button>
            <button
              className="p-1.5 hover:text-[--c-accent] transition-colors hidden sm:inline-flex"
              aria-label={`Toggle ${theme.mode === 'dark' ? 'light' : 'dark'} mode`}
              onClick={theme.toggle}
              title={`${theme.mode === 'dark' ? 'Switch to light' : 'Switch to dark'} · Ctrl/Cmd+D`}
            >
              {theme.mode === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </button>
            <button
              className="p-1.5 hover:text-[--c-accent] transition-colors hidden sm:inline-flex relative"
              aria-label={`Wishlist (${wishlist.ids.length})`}
              onClick={() => setShowWishlist(true)}
            >
              <Heart className={cn('size-[18px]', wishlist.ids.length > 0 && 'fill-current gold-text')} />
              {wishlist.ids.length > 0 ? (
                <span
                  className="absolute -top-0.5 -right-0.5 text-[9px] font-bold rounded-full size-3.5 flex items-center justify-center"
                  style={{ background: 'var(--c-accent)', color: 'var(--c-button-primary-fg)' }}
                >
                  {wishlist.ids.length}
                </span>
              ) : null}
            </button>
            <button
              className="p-1.5 hover:text-[--c-accent] transition-colors relative"
              onClick={() => setShowCart(true)}
              aria-label="Cart"
            >
              <ShoppingBag className="size-5" />
              {cart.items.length > 0 ? (
                <span
                  className="absolute -top-0.5 -right-0.5 text-[10px] font-bold rounded-full size-4 flex items-center justify-center"
                  style={{ background: 'var(--c-accent)', color: 'var(--c-button-primary-fg)' }}
                >
                  {cart.items.reduce((a, l) => a + l.qty, 0)}
                </span>
              ) : null}
            </button>
            {isSignedIn ? (
              <DropdownMenuPrimitive.Root>
                <DropdownMenuPrimitive.Trigger asChild>
                  <button
                    className="p-1.5 hover:text-[--c-accent] transition-colors"
                    aria-label="Account menu"
                  >
                    <User className="size-[18px]" />
                  </button>
                </DropdownMenuPrimitive.Trigger>
                <DropdownMenuPrimitive.Portal>
                  <DropdownMenuPrimitive.Content
                    sideOffset={10}
                    align="end"
                    className={cn(
                      'z-[70] min-w-[15rem] overflow-hidden rounded-md shadow-2xl',
                      'data-[state=open]:animate-in data-[state=closed]:animate-out',
                      'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
                      'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
                    )}
                    style={{
                      background: 'var(--c-bg-elev)',
                      border: '1px solid var(--c-border)',
                      color: 'var(--c-text)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{userName ?? 'Guest'}</p>
                        <p className="text-[11px] text-[--c-text-muted] truncate">{userMobile ?? '—'}</p>
                      </div>
                      <button
                        onClick={() => navigate('/profile')}
                        className="p-1.5 rounded hover:bg-[--c-bg-elev-2] transition-colors shrink-0"
                        aria-label="Edit profile"
                        title="Edit profile"
                        style={{ color: 'var(--c-accent)' }}
                      >
                        <Edit3 className="size-4" />
                      </button>
                    </div>
                    <div className="mx-3 my-1 h-px" style={{ background: 'var(--c-border)' }} />
                    <DropdownMenuPrimitive.Item
                      onSelect={() => navigate('/orders')}
                      className="flex items-center gap-2 cursor-pointer px-3 py-2 text-sm outline-none focus:bg-[--c-bg-elev-2] hover:bg-[--c-bg-elev-2] transition-colors"
                    >
                      <ClipboardList className="size-4" style={{ color: 'var(--c-accent)' }} />
                      My Orders
                    </DropdownMenuPrimitive.Item>
                    <DropdownMenuPrimitive.Item
                      onSelect={() => navigate('/addresses')}
                      className="flex items-center gap-2 cursor-pointer px-3 py-2 text-sm outline-none focus:bg-[--c-bg-elev-2] hover:bg-[--c-bg-elev-2] transition-colors"
                    >
                      <MapPinned className="size-4" style={{ color: 'var(--c-accent)' }} />
                      My Addresses
                    </DropdownMenuPrimitive.Item>
                    <div className="mx-3 my-1 h-px" style={{ background: 'var(--c-border)' }} />
                    <DropdownMenuPrimitive.Item
                      onSelect={handleCustomerLogout}
                      className="flex items-center gap-2 cursor-pointer px-3 py-2 text-sm text-red-400 outline-none focus:bg-red-500/10 hover:bg-red-500/10 focus:text-red-300 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="size-4" />
                      Logout
                    </DropdownMenuPrimitive.Item>
                  </DropdownMenuPrimitive.Content>
                </DropdownMenuPrimitive.Portal>
              </DropdownMenuPrimitive.Root>
            ) : (
              <button
                className="p-1.5 hover:text-[--c-accent] transition-colors inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.18em]"
                onClick={() => setShowLogin(true)}
                aria-label="Sign in"
                aria-expanded={showLogin}
              >
                <User className="size-[18px]" />
                <span className="hidden md:inline">SIGN IN</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile menu drawer — slide-in via Framer Motion (spring) */}
      <AnimatePresence>
        {showMobile ? (
          <motion.div
            key="mobile-menu"
            className="fixed inset-0 z-[60] lg:hidden"
            role="dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotionLayout ? 0 : 0.2, ease: 'easeOut' }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowMobile(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotionLayout ? 0 : 0.2, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute top-0 left-0 bottom-0 w-72 c-card border-r p-6 space-y-1 overflow-y-auto"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={drawerSpringTransition}
            >
              <p className="display text-2xl">{brand.restaurantName}</p>
              <p className="subtitle text-[10px]">{brand.tagline}</p>
              <div className="c-divider !ml-0" />
              {[
                { to: '/', label: 'Home' },
                { to: '/menu', label: 'Menu' },
                { to: '/signature', label: 'Signature' },
                { to: '/why-us', label: 'Why Us' },
                { to: '/gallery', label: 'Gallery' },
                { to: '/locations', label: 'Locations' },
                { to: '/contact', label: 'Contact' },
                { to: '/orders', label: 'My Orders' },
                { to: '/profile', label: 'Profile' },
                { to: '/about', label: 'About Us' },
                { to: '/terms', label: 'Terms of Service' },
                { to: '/privacy', label: 'Privacy Policy' },
                { to: '/refund', label: 'Refund Policy' },
              ].map((m) => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  end={m.to === '/'}
                  onClick={() => setShowMobile(false)}
                  className={({ isActive }) =>
                    `block py-2.5 px-3 text-sm font-medium rounded transition-colors ${isActive ? 'bg-[--c-accent] nav-active-pill' : 'hover:bg-[--c-bg-elev-2]'}`
                  }
                  style={({ isActive }) => (isActive ? { color: 'var(--c-button-primary-fg)' } : { color: 'var(--c-text)' })}
                >
                  {m.label}
                </NavLink>
              ))}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Search modal */}
      <SearchModal open={showSearch} onClose={() => setShowSearch(false)} />

      {/* Cart drawer */}
      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />

      {/* Sign-in centred modal — proper dialog with backdrop blur instead
       * of an off-axis dropdown. Pattern matches Notion / Linear / Stripe
       * auth-sheet: dim everything, focus the form, escape closes. */}
      <AnimatePresence>
        {showLogin ? (
          <motion.div
            key="login-modal"
            className="fixed inset-0 z-[80] flex items-center justify-center px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Sign in"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => setShowLogin(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            <motion.div
              ref={loginPopoverRef}
              className="relative c-card w-full max-w-sm p-8 shadow-2xl"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[--c-bg-elev-2] transition-colors"
                onClick={() => setShowLogin(false)}
                aria-label="Close sign in"
                type="button"
              >
                <X className="size-4 text-[--c-text-soft]" />
              </button>
              <p className="subtitle text-[10px]">SIGN IN TO CONTINUE</p>
              <h3 className="display text-3xl mt-1 mb-1">
                Welcome <span>Back</span>
              </h3>
              <p className="text-sm text-[--c-text-soft] mb-6">
                {loginStep === 'mobile' ? 'Enter your mobile to receive an OTP.' : `Verify the OTP sent to ${loginMobile}.`}
              </p>
              {loginStep === 'mobile' ? (
                <div className="space-y-4">
                  <label className="block">
                    <span className="subtitle text-[10px]">MOBILE</span>
                    <div className="relative mt-2">
                      <PhoneIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 gold-text pointer-events-none z-10" />
                      <input
                        className="c-input !pl-11"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10-digit mobile"
                        value={loginMobile}
                        onChange={(e) => setLoginMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') void handleSendLoginOtp() }}
                      />
                    </div>
                  </label>
                  <button className="c-button-primary w-full" onClick={() => void handleSendLoginOtp()} disabled={loginBusy}>
                    {loginBusy ? 'SENDING…' : 'SEND OTP'}
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[--c-border]" />
                    <span className="text-[10px] subtitle text-[--c-text-muted]">OR</span>
                    <div className="flex-1 h-px bg-[--c-border]" />
                  </div>
                  <button
                    type="button"
                    className="c-button-outline w-full inline-flex items-center justify-center gap-2"
                    onClick={() => { setShowLogin(false); navigate('/menu') }}
                  >
                    <UserCircle2 className="size-4" />
                    CONTINUE AS GUEST
                  </button>
                  <p className="text-center text-[10px] text-[--c-text-muted] pt-2">
                    By signing in you agree to our <span className="gold-text cursor-pointer">Terms</span> &amp; <span className="gold-text cursor-pointer">Privacy</span>.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loginDemoMode ? (
                    <div className="rounded-md border border-[--c-accent]/40 bg-[--c-accent]/10 px-3 py-2 text-xs text-[--c-text-soft]">
                      <span className="gold-text font-semibold">Demo mode</span> — SMS gateway not yet configured. Use OTP <span className="font-mono gold-text">1234</span>.
                    </div>
                  ) : null}
                  <label className="block">
                    <span className="subtitle text-[10px]">OTP</span>
                    <div className="relative mt-2">
                      <KeyRound className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 gold-text pointer-events-none z-10" />
                      <input
                        className="c-input !pl-11 tracking-[0.5em] font-mono text-center text-lg"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="••••"
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') void handleVerifyLoginOtp() }}
                      />
                    </div>
                  </label>
                  <button className="c-button-primary w-full" onClick={() => void handleVerifyLoginOtp()} disabled={loginBusy}>
                    {loginBusy ? 'VERIFYING…' : 'VERIFY & SIGN IN'}
                  </button>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      className="text-[--c-text-muted] hover:gold-text inline-flex items-center gap-1 transition-colors"
                      onClick={() => setLoginStep('mobile')}
                      type="button"
                    >
                      <ChevronLeft className="size-3" /> Change mobile
                    </button>
                    <button
                      className="text-[--c-text-muted] hover:gold-text transition-colors"
                      onClick={() => void handleSendLoginOtp()}
                      disabled={loginBusy}
                      type="button"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Wishlist side drawer — spring + drag-to-dismiss on mobile */}
      <AnimatePresence>
        {showWishlist ? (
          <motion.div
            key="wishlist-drawer"
            className="fixed inset-0 z-[60]"
            role="dialog"
            aria-label="Wishlist"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotionLayout ? 0 : 0.2, ease: 'easeOut' }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowWishlist(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotionLayout ? 0 : 0.2, ease: 'easeOut' }}
            />
            {/* Desktop right rail */}
            <motion.div
              className="absolute top-0 right-0 bottom-0 w-96 c-card border-l p-0 overflow-hidden flex-col hidden sm:flex"
              initial={{ x: 384 }}
              animate={{ x: 0 }}
              exit={{ x: 384 }}
              transition={drawerSpringTransition}
            >
              <WishlistContents
                wishlist={wishlist}
                cart={cart}
                onClose={() => setShowWishlist(false)}
                navigate={navigate}
              />
            </motion.div>
            {/* Mobile bottom sheet with drag */}
            <motion.div
              className="absolute left-0 right-0 bottom-0 c-card border-t p-0 overflow-hidden flex flex-col sm:hidden rounded-t-2xl"
              style={{ maxHeight: '85vh' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={drawerSpringTransition}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) setShowWishlist(false)
              }}
            >
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[--c-border] cursor-grab active:cursor-grabbing" aria-hidden="true" />
              <WishlistContents
                wishlist={wishlist}
                cart={cart}
                onClose={() => setShowWishlist(false)}
                navigate={navigate}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Body — adds bottom padding so MobileBottomNav doesn't cover content */}
      <main className="relative z-[1] pb-20 lg:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Mobile bottom navigation — Swiggy/Zomato-style */}
      <MobileBottomNav />

      {/* Footer — hidden on mobile because BottomTabBar provides primary
       * navigation. Show only on lg+ so the layout feels like a mobile app
       * on phones (no long marketing footer) and a full website on desktop. */}
      <footer className="hidden lg:block relative z-[1] mt-20 border-t border-[--c-border] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <p className="display text-3xl">{brand.restaurantName}</p>
            <p className="subtitle text-[10px] mt-1">{brand.tagline}</p>
            <p className="text-sm text-[--c-text-soft] mt-4">Hand-crafted dishes, warm hospitality, and an unforgettable dining experience.</p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="hover:gold-text"><Facebook className="size-4" /></a>
              <a href="#" className="hover:gold-text"><Instagram className="size-4" /></a>
              <a href="#" className="hover:gold-text"><Twitter className="size-4" /></a>
            </div>
          </div>
          <div>
            <p className="subtitle">Explore</p>
            <div className="c-divider !ml-0" />
            <ul className="space-y-2 text-sm">
              <li><NavLink to="/menu" className="hover:gold-text">Menu</NavLink></li>
              <li><NavLink to="/signature" className="hover:gold-text">Signature Dishes</NavLink></li>
              <li><NavLink to="/gallery" className="hover:gold-text">Gallery</NavLink></li>
              <li><NavLink to="/why-us" className="hover:gold-text">Why Us</NavLink></li>
              <li><NavLink to="/locations" className="hover:gold-text">Locations</NavLink></li>
              <li><NavLink to="/about" className="hover:gold-text">About Us</NavLink></li>
            </ul>
          </div>
          <div>
            <p className="subtitle">Legal</p>
            <div className="c-divider !ml-0" />
            <ul className="space-y-2 text-sm">
              <li><NavLink to="/terms" className="hover:gold-text">Terms of Service</NavLink></li>
              <li><NavLink to="/privacy" className="hover:gold-text">Privacy Policy</NavLink></li>
              <li><NavLink to="/refund" className="hover:gold-text">Refund & Cancellation</NavLink></li>
              <li><NavLink to="/contact" className="hover:gold-text">Book a Table</NavLink></li>
            </ul>
          </div>
          <div>
            <p className="subtitle">Reach Us</p>
            <div className="c-divider !ml-0" />
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><MapPin className="size-4 gold-text" /> {branch?.address}</li>
              <li className="flex items-center gap-2"><Phone className="size-4 gold-text" /> +91 9876543210</li>
              <li className="flex items-center gap-2"><Mail className="size-4 gold-text" /> hello@spicegarden.com</li>
            </ul>
          </div>
        </div>
        <p className="text-center text-xs text-[--c-text-muted] mt-10 border-t border-[--c-border] pt-6">© 2026 {brand.restaurantName} {brand.tagline} · Powered by RMS</p>
      </footer>
    </div>
  )
}

/* Hero entrance choreography — variants drive the subtitle → divider → title
 * words → description → CTAs sequence. Container `staggerChildren` is 0 so
 * each child uses its own `delay`. */
const heroContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0 } },
}

const heroSubtitleVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 } },
}

const heroTitleVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.6 } },
}

const heroWordVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

const heroDescriptionVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 1.1 } },
}

const heroCtaVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 1.35 } },
}

function HeroAnimatedWords({ text, accent = false }: { text: string; accent?: boolean }) {
  const words = text.split(' ')
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={heroWordVariants}
          className="inline-block"
          style={{ marginRight: '0.25em' }}
        >
          {accent ? <span>{word}</span> : word}
        </motion.span>
      ))}
    </>
  )
}

interface WishlistContentsProps {
  wishlist: ReturnType<typeof useWishlist>
  cart: ReturnType<typeof useCart>
  onClose: () => void
  navigate: ReturnType<typeof useNavigate>
}

function WishlistContents({ wishlist, cart, onClose, navigate }: WishlistContentsProps) {
  return (
    <>
      <div className="flex items-center justify-between p-5 border-b border-[--c-border]">
        <div>
          <p className="subtitle text-[10px]">YOUR FAVOURITES</p>
          <h3 className="display text-2xl">Wishlist</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-[--c-bg-elev-2]"
          aria-label="Close wishlist"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {wishlist.ids.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="size-12 mx-auto mb-4 opacity-30" />
            <p className="font-semibold mb-1">No favourites yet</p>
            <p className="text-xs text-[--c-text-muted] mb-5">Tap the heart on any dish to save it here.</p>
            <button
              className="c-button-outline"
              onClick={() => { onClose(); navigate('/menu') }}
            >
              BROWSE MENU
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {wishlist.ids.map((id) => {
              const dish = DISHES.find((d) => d.id === id)
              if (!dish) return null
              return (
                <li key={id} className="flex items-center gap-3 p-2 rounded border border-[--c-border]">
                  <img src={dish.img} alt={dish.name} loading="lazy" decoding="async" className="size-16 rounded object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      <span className={dish.veg ? 'veg-icon' : 'nonveg-icon'} />
                      {dish.name}
                    </p>
                    <p className="text-xs gold-text font-semibold">₹{dish.price}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      className="c-button-outline !py-1 !px-2 !text-[10px] inline-flex items-center gap-1"
                      onClick={() => {
                        cart.add(dish.id, 1)
                        toast.success(`${dish.name} added to cart`)
                      }}
                      aria-label={`Add ${dish.name} to cart`}
                    >
                      <Plus className="size-3" /> CART
                    </button>
                    <button
                      className="!py-1 !px-2 text-[10px] inline-flex items-center gap-1 rounded border border-[--c-border] hover:border-red-500/60 hover:text-red-400 transition-colors"
                      onClick={() => { wishlist.remove(dish.id); toast.info(`${dish.name} removed`) }}
                      aria-label={`Remove ${dish.name} from wishlist`}
                    >
                      <Trash2 className="size-3" /> REMOVE
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {wishlist.ids.length > 0 ? (
        <div className="p-5 border-t border-[--c-border] space-y-2">
          <button
            className="c-button-primary w-full"
            onClick={() => {
              wishlist.ids.forEach((id) => cart.add(id, 1))
              toast.success('All wishlist items added to cart')
            }}
          >
            ADD ALL TO CART
          </button>
          <button
            className="w-full text-xs text-[--c-text-muted] hover:gold-text transition-colors py-1"
            onClick={() => { wishlist.clear(); toast.info('Wishlist cleared') }}
          >
            Clear wishlist
          </button>
        </div>
      ) : null}
    </>
  )
}

export function HeroSection({
  bg, subtitle, titleA, titleAccent, description, primaryCta, primaryOnClick, secondaryCta, secondaryOnClick,
  showRotator = false, heroImages,
}: {
  bg: string
  subtitle: string
  titleA: string
  titleAccent: string
  description: string
  primaryCta?: string
  primaryOnClick?: () => void
  secondaryCta?: string
  secondaryOnClick?: () => void
  showRotator?: boolean
  /**
   * Live slider images sourced from `useCustomerSliders(branchId)`. When
   * provided + non-empty, the rotator uses these; otherwise it falls back to
   * the default Unsplash trio so the hero still feels alive without backend.
   */
  heroImages?: string[]
}) {
  const ROTATE_IMAGES =
    heroImages && heroImages.length > 0
      ? heroImages
      : [
          bg,
          'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80',
        ]
  const [idx, setIdx] = useState(0)
  const current = showRotator ? ROTATE_IMAGES[idx % ROTATE_IMAGES.length]! : bg
  // Auto-rotate hero every 5s when rotator is enabled. Pauses if the user
  // prefers reduced motion (respects accessibility).
  const reduceHero = useReducedMotion()
  useEffect(() => {
    if (!showRotator || reduceHero) return
    const t = window.setInterval(() => setIdx((i) => i + 1), 5000)
    return () => window.clearInterval(t)
  }, [showRotator, reduceHero])

  // Cursor-follow gold blob — desktop only. Writing CSS custom props directly
  // on the section element keeps mouse-move off the React render path.
  const sectionRef = useRef<HTMLElement | null>(null)
  const reduce = useReducedMotion()
  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduce) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * 100
    const py = ((e.clientY - rect.top) / rect.height) * 100
    e.currentTarget.style.setProperty('--blob-x', `${px}%`)
    e.currentTarget.style.setProperty('--blob-y', `${py}%`)
  }

  // Parallax on the hero background — image drifts down a touch as the user
  // scrolls past, and the text content fades + lifts. Standard premium-site
  // pattern (Apple, Linear, Stripe). Gated on `prefers-reduced-motion`.
  const { scrollY } = useScroll()
  const bgYRaw = useTransform(scrollY, [0, 600], [0, 150])
  const bgY = reduce ? 0 : bgYRaw
  const contentOpacityRaw = useTransform(scrollY, [0, 400], [1, 0.3])
  const contentOpacity = reduce ? 1 : contentOpacityRaw
  const contentYRaw = useTransform(scrollY, [0, 400], [0, -40])
  const contentY = reduce ? 0 : contentYRaw

  return (
    <motion.section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      className="hero-bg relative overflow-hidden"
      style={{ backgroundImage: `url(${current})` }}
      initial="hidden"
      animate="visible"
      variants={heroContainerVariants}
    >
      {showRotator ? (
        <>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={current}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${current})`, y: bgY }}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              aria-hidden
            />
          </AnimatePresence>
          {/* Dot indicators — bottom-right corner of the slider.
           * NOTE: `.customer-shell .hero-bg > *` forces `position: relative`
           * on every direct child. We win specificity with inline styles so
           * the dots actually sit in the corner instead of getting flexed
           * back into the centre column. */}
          <div
            className="z-[3] flex gap-2 items-center bg-black/40 backdrop-blur-md rounded-full px-3 py-2 border border-white/15 shadow-lg"
            style={{
              position: 'absolute',
              bottom: '1.5rem',
              right: '2rem',
              left: 'auto',
            }}
          >
            {ROTATE_IMAGES.map((_, i) => {
              const active = i === idx % ROTATE_IMAGES.length
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Go to hero image ${i + 1}`}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: active ? 24 : 6,
                    height: 6,
                    background: active ? 'var(--c-accent)' : 'rgba(255, 255, 255, 0.45)',
                  }}
                />
              )
            })}
          </div>
        </>
      ) : null}
      {/* Cursor-follow gold blob — hidden via CSS on touch / reduced motion */}
      <div className="hero-cursor-blob" aria-hidden="true" />
      <motion.div
        className="max-w-3xl mx-auto relative z-[2]"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <motion.p className="subtitle" variants={heroSubtitleVariants}>
          {subtitle}
        </motion.p>
        {/*
         * Decorative gold divider used to sit BETWEEN the subtitle and the
         * title, smack in the centre of the hero slider. That made the slider
         * look like it had a stray accent line over the food photo. Moved
         * the divider to the bottom of the hero text block (after the CTAs,
         * near the dot indicators) so the slider feels clean from the top
         * down + the brand accent still anchors the section visually.
         */}
        <motion.h1 className="display" variants={heroTitleVariants}>
          <HeroAnimatedWords text={titleA} />
          <HeroAnimatedWords text={titleAccent} accent />
        </motion.h1>
        <motion.p
          className="text-base sm:text-lg text-[--c-text-soft] mt-6 max-w-xl mx-auto"
          variants={heroDescriptionVariants}
        >
          {description}
        </motion.p>
        {(primaryCta || secondaryCta) ? (
          <motion.div
            className="mt-8 flex items-center justify-center gap-3 flex-wrap"
            variants={heroCtaVariants}
          >
            {primaryCta ? <button className="c-button-primary" onClick={primaryOnClick}>{primaryCta}</button> : null}
            {secondaryCta ? <button className="c-button-outline" onClick={secondaryOnClick}>{secondaryCta}</button> : null}
          </motion.div>
        ) : null}
        {/* No decorative divider inside the hero text — the bottom-right
         * slider dots now anchor the section visually (request 2026-06-27). */}
      </motion.div>
    </motion.section>
  )
}
