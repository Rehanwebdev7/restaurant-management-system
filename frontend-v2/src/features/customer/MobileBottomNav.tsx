/**
 * MobileBottomNav — Swiggy / Zomato / Uber-Eats style bottom tab bar.
 *
 * Visible only below `lg`. Five tabs: Home, Menu, Wishlist, Cart, Profile.
 *
 * Active tab gets a gold tint + slightly-scaled icon + a `layoutId`-driven
 * underline pill so the indicator slides between tabs (Framer's shared-
 * layout magic). Respects `env(safe-area-inset-bottom)` for iPhone safe area.
 *
 * Wishlist + cart show numeric badges sourced from the shared customer
 * stores (no prop drilling).
 */

import { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { House, UtensilsCrossed, Heart, ShoppingBag, User, type LucideIcon } from 'lucide-react'
import { useWishlist } from '@/features/customer/customer-store'
import { useCart } from '@/features/customer/catalog'
import { useHaptic } from '@/hooks/use-haptic'
import { cn } from '@/lib/utils'

/** Custom-event channel used to open the wishlist drawer in CustomerLayout
 *  from anywhere in the customer app (e.g. the mobile bottom nav). */
export const OPEN_WISHLIST_EVENT = 'customer:open-wishlist'

interface Tab {
  to: string
  label: string
  Icon: LucideIcon
  badge?: number
  ariaLabel: string
  /** When true the tab is a button (not a NavLink). */
  action?: () => void
}

export default function MobileBottomNav() {
  const wishlist = useWishlist()
  const cart = useCart()
  const location = useLocation()
  const haptic = useHaptic()

  const cartCount = useMemo(
    () => cart.items.reduce((a, l) => a + l.qty, 0),
    [cart.items],
  )

  const openWishlist = () => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))
  }

  const tabs: Tab[] = [
    { to: '/', label: 'Home', Icon: House, ariaLabel: 'Home' },
    { to: '/menu', label: 'Menu', Icon: UtensilsCrossed, ariaLabel: 'Menu' },
    {
      to: '#wishlist',
      label: 'Wishlist',
      Icon: Heart,
      badge: wishlist.ids.length,
      ariaLabel: `Wishlist (${wishlist.ids.length})`,
      action: openWishlist,
    },
    {
      to: '/cart',
      label: 'Cart',
      Icon: ShoppingBag,
      badge: cartCount,
      ariaLabel: `Cart (${cartCount})`,
    },
    { to: '/profile', label: 'Profile', Icon: User, ariaLabel: 'Profile' },
  ]

  const isActive = (to: string): boolean => {
    if (to.startsWith('#')) return false
    if (to === '/') return location.pathname === '/'
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'bg-[--c-bg]/95 backdrop-blur-xl border-t border-[--c-border]',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5 h-14">
        {tabs.map((tab) => {
          const active = isActive(tab.to)
          const Icon = tab.Icon
          const innerClass = cn(
            'h-full w-full flex flex-col items-center justify-center gap-0.5',
            'transition-colors duration-150',
            active ? 'text-[--c-accent]' : 'text-[--c-text-muted]',
          )
          const Inner = (
            <>
              <div className="relative">
                <motion.span
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  className="inline-flex"
                >
                  <Icon
                    className={cn(
                      'size-5',
                      tab.label === 'Wishlist' && (tab.badge ?? 0) > 0 && 'fill-current',
                    )}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                </motion.span>
                {typeof tab.badge === 'number' && tab.badge > 0 ? (
                  <span
                    aria-hidden
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center tabular-nums"
                    style={{
                      background: 'var(--c-accent)',
                      color: 'var(--c-button-primary-fg)',
                    }}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-medium tracking-wide leading-none">
                {tab.label}
              </span>
              {active ? (
                <motion.span
                  layoutId="mobile-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-b-full"
                  style={{ background: 'var(--c-accent)' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              ) : null}
            </>
          )

          return (
            <li key={tab.label} className="relative">
              {tab.action ? (
                <button
                  type="button"
                  onClick={() => {
                    haptic.vibrate('light')
                    tab.action?.()
                  }}
                  aria-label={tab.ariaLabel}
                  className={innerClass}
                >
                  {Inner}
                </button>
              ) : (
                <NavLink
                  to={tab.to}
                  onClick={() => haptic.vibrate('light')}
                  aria-label={tab.ariaLabel}
                  aria-current={active ? 'page' : undefined}
                  className={innerClass}
                >
                  {Inner}
                </NavLink>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
