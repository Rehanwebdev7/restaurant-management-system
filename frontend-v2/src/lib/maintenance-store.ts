/**
 * UI-F-82: Global maintenance flag.
 *
 * The axios response interceptor flips `isMaintenance` to `true` whenever the
 * backend replies with HTTP 503 OR the custom `X-Maintenance: true` header.
 *
 * `App.tsx` reads this flag and renders <MaintenanceMode /> full-screen
 * instead of the regular router tree.
 *
 * Dev helper: `?maintenance=1` in the URL bar forces the flag on at boot for
 * visual QA without needing to coerce the backend.
 */
import { create } from 'zustand'

interface MaintenanceState {
  isMaintenance: boolean
  eta?: string
  enable: (eta?: string) => void
  disable: () => void
}

function initialFlag(): boolean {
  if (typeof window === 'undefined') return false
  if (!import.meta.env.DEV) return false
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get('maintenance') === '1'
  } catch {
    return false
  }
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  isMaintenance: initialFlag(),
  eta: undefined,
  enable: (eta) => set({ isMaintenance: true, eta }),
  disable: () => set({ isMaintenance: false, eta: undefined }),
}))

/** Non-hook accessor for use from non-React modules (e.g. axios interceptor). */
export const maintenanceStore = {
  enable: (eta?: string) => useMaintenanceStore.getState().enable(eta),
  disable: () => useMaintenanceStore.getState().disable(),
  get isMaintenance() {
    return useMaintenanceStore.getState().isMaintenance
  },
}
