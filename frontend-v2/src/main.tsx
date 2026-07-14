import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './styles/globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { BrandProvider } from '@/components/providers/BrandProvider'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { initSentry } from '@/lib/sentry'
import { runStorageMigration } from '@/lib/storage/migrate'
import '@/i18n'
import App from './App.tsx'

// UI-F-11: Sentry first
initSentry()
// UI-F-23: localStorage migration
runStorageMigration()
// UI-F-86: i18n init happens via side-effect import above.

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root element not found in index.html')

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <BrandProvider>
            <App />
            <Toaster
              closeButton
              position="top-right"
              theme="light"
              toastOptions={{
                classNames: {
                  toast: 'c-toast',
                  success: 'c-toast--success',
                  error: 'c-toast--error',
                  warning: 'c-toast--warning',
                  info: 'c-toast--info',
                  title: 'c-toast__title',
                  description: 'c-toast__desc',
                  actionButton: 'c-toast__btn',
                  cancelButton: 'c-toast__btn c-toast__btn--cancel',
                  closeButton: 'c-toast__close',
                },
              }}
            />
          </BrandProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
)
