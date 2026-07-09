import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  toggle: () => void
  setMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // First-visit default is LIGHT — SaaS restaurant sites read as brighter,
      // more editorial (Sweetgreen / Cava vibe). Users who toggled to dark
      // are honoured by the persist middleware — only fresh sessions with no
      // saved preference land on light.
      mode: 'light',
      toggle: () =>
        set((state) => ({
          mode: state.mode === 'dark' ? 'light' : 'dark',
        })),
      setMode: (mode) => set({ mode }),
    }),
    {
      // Persist key bumped to v2 on 2026-07-10 so old localStorage entries
      // (defaulted to 'dark' before the bright-first UX shift) are invalidated.
      // Users see the new bright default on next visit; anyone who wants dark
      // can toggle again and their choice persists on the new v2 key.
      name: 'customer_theme_mode_v2',
    }
  )
)
