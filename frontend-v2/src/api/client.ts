/**
 * Axios HTTP client — preserves legacy `access_token` header convention + dual-token logic.
 *
 * Response interceptor adds:
 *   - 401 → clear tokens + redirect to /login (no infinite redirect from login page itself)
 *   - 401-on-customer-route → clear customerToken specifically
 */
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { tokens } from '@/lib/auth/tokens'
import { maintenanceStore } from '@/lib/maintenance-store'

const apiClient: AxiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 15_000,
})

apiClient.defaults.headers.post['Content-Type'] = 'application/json'
apiClient.defaults.headers.put['Content-Type'] = 'application/json'

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  const token = tokens.getForUrl(config.url ?? '')
  if (token) {
    config.headers.set('access_token', token)
  }
  return config
})

apiClient.interceptors.response.use(
  (r) => {
    // UI-F-82: A successful response means the backend is reachable — if the
    // store had latched into maintenance from a prior 503/X-Maintenance event,
    // clear it now so the regular app reappears on next render.
    const maint = r.headers?.['x-maintenance']
    if (typeof maint === 'string' && /^true$/i.test(maint)) {
      maintenanceStore.enable()
    } else if (maintenanceStore.isMaintenance) {
      maintenanceStore.disable()
    }
    return r
  },
  (error) => {
    const status = error?.response?.status
    const msg = error?.response?.data?.message ?? ''
    const url: string = error?.config?.url ?? ''
    const maintHeader = error?.response?.headers?.['x-maintenance']

    // UI-F-82: Maintenance latch — HTTP 503 OR custom `X-Maintenance: true`
    // header. Triggers full-screen <MaintenanceMode /> via Zustand store.
    if (status === 503 || (typeof maintHeader === 'string' && /^true$/i.test(maintHeader))) {
      maintenanceStore.enable()
      return Promise.reject(error)
    }

    // Real backend returns 200 + envelope { Status: "FAILURE", StatusCode: 401, ... } for auth.
    // It can also send a true HTTP 401. Cover both.
    const envCode = error?.response?.data?.StatusCode
    const isAuthFailure =
      status === 401 ||
      envCode === 401 ||
      /unauthorized person/i.test(msg)

    if (isAuthFailure && typeof window !== 'undefined') {
      const onLoginPage = window.location.pathname.startsWith('/login')
      if (!onLoginPage) {
        // Customer route → only clear customer creds
        if (url.includes('/api/customer/')) {
          localStorage.removeItem('customerToken')
        } else {
          tokens.clearAll()
        }
        window.location.href = '/login?reason=session_expired'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
