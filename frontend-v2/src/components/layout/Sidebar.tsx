import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronRight, Sparkles } from 'lucide-react'
import { sidebarConfig, type NavItem, type Role } from '@/components/layout/sidebarConfig'
import { cn } from '@/lib/utils'

/**
 * Single config-driven sidebar. Replaces 8 hand-coded sidebars.
 * UI-F-38 polish: active state with left border accent + bg tint + icon color shift.
 *
 * Restores the legacy parent → children grouping (User Management, Menu
 * Management, Finance, …) — items with `children` render as collapsible
 * groups, auto-expanded when the current route matches any child. Expanded
 * state is persisted per-role in localStorage so reloads remember preference.
 */
interface SidebarProps {
  role: Role
}

function pathStartsWith(currentPath: string, candidate?: string): boolean {
  if (!candidate) return false
  return currentPath === candidate || currentPath.startsWith(candidate + '/')
}

function isGroupActive(item: NavItem, currentPath: string): boolean {
  if (item.to && pathStartsWith(currentPath, item.to)) return true
  if (!item.children) return false
  return item.children.some((c) => pathStartsWith(currentPath, c.to))
}

function NavLeaf({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to!}
      end={item.exact}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium',
          'transition-all duration-quick ease-entrance group relative',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-0.5',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-primary" aria-hidden />
          ) : null}
          <Icon className="size-4 shrink-0 transition-transform duration-quick group-hover:scale-110" />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge != null ? (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
              {item.badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}

function NavGroup({
  item,
  open,
  onToggle,
  currentPath,
}: {
  item: NavItem
  open: boolean
  onToggle: () => void
  currentPath: string
}) {
  const Icon = item.icon
  const active = isGroupActive(item, currentPath)
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium',
          'transition-all duration-quick ease-entrance group',
          active ? 'text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        <Icon className="size-4 shrink-0 transition-transform duration-quick group-hover:scale-110" />
        <span className="flex-1 truncate text-left">{item.label}</span>
        <ChevronRight
          className={cn(
            'size-3.5 shrink-0 transition-transform duration-quick',
            open ? 'rotate-90' : 'rotate-0',
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-[max-height] duration-standard ease-entrance',
          open ? 'max-h-[1000px]' : 'max-h-0',
        )}
      >
        <div className="ml-3 mt-1 mb-1 pl-3 border-l border-border space-y-0.5">
          {item.children!.map((child) =>
            child.children ? (
              // One-level recursion handles arbitrary depth, but config-wise we
              // only nest one level (legacy parity).
              <NavLeaf key={child.label} item={{ ...child, to: child.to ?? '#' }} />
            ) : (
              <NavLeaf key={child.to ?? child.label} item={child} />
            ),
          )}
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ role }: SidebarProps) {
  const sections = sidebarConfig[role] ?? []
  const location = useLocation()
  const storageKey = `sidebar-open-${role}`

  // Open state per parent label. Initial: auto-expand groups whose children
  // include the current path, plus whatever the user explicitly opened before.
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    let persisted: Record<string, boolean> = {}
    try {
      persisted = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    } catch {
      persisted = {}
    }
    const initial: Record<string, boolean> = { ...persisted }
    for (const section of sections) {
      for (const item of section.items) {
        if (item.children && isGroupActive(item, location.pathname)) {
          initial[item.label] = true
        }
      }
    }
    return initial
  })

  // Whenever the user navigates into a new group, auto-expand it.
  useEffect(() => {
    setOpenMap((prev) => {
      let changed = false
      const next = { ...prev }
      for (const section of sections) {
        for (const item of section.items) {
          if (item.children && isGroupActive(item, location.pathname) && !next[item.label]) {
            next[item.label] = true
            changed = true
          }
        }
      }
      return changed ? next : prev
    })
  }, [location.pathname, sections])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(openMap))
    } catch { /* private mode */ }
  }, [openMap, storageKey])

  const toggle = (label: string) =>
    setOpenMap((prev) => ({ ...prev, [label]: !prev[label] }))

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen border-r border-border bg-card/30">
      <div className="flex items-center gap-2 px-5 h-17 shrink-0 border-b border-border">
        <div className="size-9 rounded-md bg-primary text-primary-foreground grid place-items-center shadow-elevation-1">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">RMS</p>
          <p className="text-xs text-muted-foreground capitalize">{role}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto themed-scrollbar py-4 px-3 space-y-6">
        {sections.map((section, sectionIdx) => (
          <div key={section.title ?? `section-${sectionIdx}`} className="space-y-1">
            {section.title ? (
              <p className="px-3 mb-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {section.title}
              </p>
            ) : null}
            {section.items.map((item) =>
              item.children ? (
                <NavGroup
                  key={item.label}
                  item={item}
                  open={!!openMap[item.label]}
                  onToggle={() => toggle(item.label)}
                  currentPath={location.pathname}
                />
              ) : (
                <NavLeaf key={item.to ?? item.label} item={item} />
              ),
            )}
          </div>
        ))}
      </nav>
      <div className="px-4 py-3 shrink-0 border-t border-border text-xs text-muted-foreground">
        v{import.meta.env.VITE_APP_VERSION ?? '1.0.0'}
      </div>
    </aside>
  )
}
