import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { tokens } from '@/lib/auth/tokens'

/**
 * Route gate — redirects unauthenticated users to /login while
 * remembering the intended destination.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const location = useLocation()
  const token = tokens.getAuth()
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
