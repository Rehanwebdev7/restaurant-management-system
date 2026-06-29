import { NavLink } from 'react-router-dom'
import { sidebarConfig, type Role } from '@/components/layout/sidebarConfig'
import { cn } from '@/lib/utils'

/**
 * UI-F-2: Mobile bottom navigation.
 * Visible on screens < lg; uses same config as desktop Sidebar but caps at 5 items.
 */
interface BottomTabBarProps {
  role: Role
}

export function BottomTabBar({ role }: BottomTabBarProps) {
  const items = (sidebarConfig[role]?.[0]?.items ?? []).slice(0, 5)
  if (items.length === 0) return null
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border pb-safe">
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.to ?? item.label} className="flex-1">
              <NavLink
                to={item.to ?? '#'}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium',
                    'transition-all duration-quick ease-entrance active:scale-95',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('size-5 transition-transform duration-quick', isActive && 'scale-110')} />
                    <span className="truncate w-full text-center px-1">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
