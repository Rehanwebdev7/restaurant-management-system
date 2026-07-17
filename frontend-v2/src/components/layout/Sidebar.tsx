import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut, Sparkles, Command as CommandIcon, Search as SearchIcon } from 'lucide-react'
import { sidebarConfig, type NavItem, type Role } from '@/components/layout/sidebarConfig'
import { tokens } from '@/lib/auth/tokens'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/dialog'

/**
 * Config-driven sidebar. 2026-07-16 refresh:
 *  - Brand chip (logo square + role label) at top
 *  - User card below (avatar + name + role)
 *  - MENU divider before nav
 *  - Expandable groups (User Management, Billing, System) via NavGroup
 *  - Sign Out at bottom
 *  - ⌘K quick-nav dialog wired here so it lives with the nav config
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

/** Flatten every leaf route in a config so the ⌘K palette can search all of them. */
function collectLeaves(items: NavItem[]): { to: string; label: string; icon: NavItem['icon']; parent?: string }[] {
  const out: { to: string; label: string; icon: NavItem['icon']; parent?: string }[] = []
  for (const item of items) {
    if (item.to) out.push({ to: item.to, label: item.label, icon: item.icon })
    if (item.children) {
      for (const child of item.children) {
        if (child.to) out.push({ to: child.to, label: child.label, icon: child.icon, parent: item.label })
      }
    }
  }
  return out
}

/** Role-specific display metadata for the brand chip. */
function roleMeta(role: Role): { title: string; subtitle: string } {
  switch (role) {
    case 'superadmin': return { title: 'Super Admin', subtitle: 'Platform Panel' }
    case 'admin':      return { title: 'Super Admin', subtitle: 'Platform Panel' }
    case 'restaurant': return { title: 'Restaurant',  subtitle: 'Owner Panel' }
    case 'branch':     return { title: 'Branch',      subtitle: 'Manager Panel' }
    case 'cashier':    return { title: 'Cashier',     subtitle: 'POS Panel' }
    case 'kitchen':    return { title: 'Kitchen',     subtitle: 'KDS Panel' }
    case 'delivery':   return { title: 'Delivery',    subtitle: 'Rider Panel' }
    case 'customer':   return { title: 'Customer',    subtitle: 'App' }
  }
}

export function Sidebar({ role }: SidebarProps) {
  const sections = sidebarConfig[role] ?? []
  const location = useLocation()
  const navigate = useNavigate()
  const storageKey = `sidebar-open-${role}`
  const meta = roleMeta(role)

  // Identity — pulled fresh from localStorage on every render (cheap) so a
  // profile update elsewhere reflects immediately without a global store.
  const userName = typeof window !== 'undefined' ? (localStorage.getItem('UserName') ?? 'Admin User') : 'Admin User'
  const userRoleTag = typeof window !== 'undefined'
    ? (localStorage.getItem('UserRole') ?? role).toString().toUpperCase()
    : role.toUpperCase()
  const initial = (userName.trim()[0] ?? 'A').toUpperCase()

  // ⌘K quick-nav dialog state.
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const leaves = useMemo(
    () => sections.flatMap((s) => collectLeaves(s.items)),
    [sections],
  )
  const filteredLeaves = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase()
    if (!q) return leaves.slice(0, 12)
    return leaves.filter((l) =>
      l.label.toLowerCase().includes(q) ||
      (l.parent && l.parent.toLowerCase().includes(q)) ||
      l.to.toLowerCase().includes(q),
    ).slice(0, 12)
  }, [leaves, paletteQuery])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!paletteOpen) setPaletteQuery('')
  }, [paletteOpen])

  // Nav group open state — persisted per role.
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    let persisted: Record<string, boolean> = {}
    try {
      persisted = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    } catch {
      persisted = {}
    }
    const initialState: Record<string, boolean> = { ...persisted }
    for (const section of sections) {
      for (const item of section.items) {
        if (item.children && isGroupActive(item, location.pathname)) {
          initialState[item.label] = true
        }
      }
    }
    return initialState
  })

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

  const handleSignOut = () => {
    tokens.clearAll()
    toast.info('Signed out')
    navigate('/login')
  }

  const runPaletteAction = (to: string) => {
    setPaletteOpen(false)
    navigate(to)
  }

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen border-r border-border bg-card/40">
        {/* Brand chip */}
        <div className="flex items-center gap-3 px-4 h-17 shrink-0 border-b border-border">
          <div className="size-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center shadow-elevation-1 shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-none truncate">{meta.title}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mt-1 truncate">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* User card */}
        <div className="px-3 pt-3 shrink-0">
          <div className="rounded-lg border border-border bg-card/60 p-3 flex items-center gap-3">
            <div
              className="size-10 rounded-full bg-primary/20 text-primary grid place-items-center shrink-0 font-bold text-sm"
              aria-hidden
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight truncate">{userName}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-0.5 truncate">
                {userRoleTag}
              </p>
            </div>
          </div>
        </div>

        {/* ⌘K trigger — clickable + hint */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background/40 hover:bg-accent hover:border-primary/30 text-xs text-muted-foreground transition-colors"
        >
          <SearchIcon className="size-3.5" />
          <span className="flex-1 text-left">Quick nav…</span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-mono">
            <CommandIcon className="size-2.5" />K
          </kbd>
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto themed-scrollbar py-4 px-3 space-y-6 mt-2">
          {sections.map((section, sectionIdx) => (
            <div key={section.title ?? `section-${sectionIdx}`} className="space-y-1">
              {section.title ? (
                <div className="px-3 mb-2 flex items-center gap-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                    {section.title}
                  </p>
                  <div className="flex-1 h-px bg-border" aria-hidden />
                </div>
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

        {/* Sign Out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="mx-3 mb-2 flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Sign Out</span>
        </button>

        {/* Version */}
        <div className="px-4 py-2 shrink-0 border-t border-border text-[10px] text-muted-foreground">
          v{import.meta.env.VITE_APP_VERSION ?? '1.0.0'}
        </div>
      </aside>

      {/* ⌘K quick-nav palette */}
      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <SearchIcon className="size-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={paletteQuery}
              onChange={(e) => setPaletteQuery(e.target.value)}
              placeholder="Type to filter routes…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredLeaves[0]) {
                  runPaletteAction(filteredLeaves[0].to)
                }
              }}
            />
            <kbd className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
              esc
            </kbd>
          </div>
          <ul className="max-h-80 overflow-y-auto themed-scrollbar p-1">
            {filteredLeaves.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matches for &ldquo;{paletteQuery}&rdquo;
              </li>
            ) : (
              filteredLeaves.map((l) => {
                const Icon = l.icon
                return (
                  <li key={l.to}>
                    <button
                      type="button"
                      onClick={() => runPaletteAction(l.to)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-accent transition-colors text-left"
                    >
                      <Icon className="size-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{l.label}</span>
                      {l.parent ? (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                          {l.parent}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  )
}
