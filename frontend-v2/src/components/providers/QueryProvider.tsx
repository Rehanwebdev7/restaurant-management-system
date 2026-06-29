import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

/**
 * TanStack Query provider.
 * One QueryClient per app instance (created lazily via useState so HMR keeps it).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 401/403/404 — they won't change on retry
              const status = (error as { response?: { status?: number } })?.response?.status
              if (status && [401, 403, 404].includes(status)) return false
              return failureCount < 2
            },
          },
        },
      })
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
