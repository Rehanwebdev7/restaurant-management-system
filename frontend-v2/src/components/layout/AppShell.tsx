import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import type { Role } from '@/components/layout/sidebarConfig'

/**
 * Single layout shell — replaces 7 legacy layouts.
 * UI-F-2: viewport-locked. Only `<main>` scrolls; sidebar + topbar stay fixed.
 * Mobile (< lg): `<BottomTabBar>` shows as primary nav.
 */
interface AppShellProps {
  role: Role
  children?: ReactNode
}

export function AppShell({ role, children }: AppShellProps) {
  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <TopBar />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden themed-scrollbar p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8"
          id="app-main-scroll"
        >
          {children ?? <Outlet />}
        </main>
      </div>
      <BottomTabBar role={role} />
    </div>
  )
}
