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
      // DARK default (2026-07-10 v5, final). Every card was built dark-first
      // (ChefSignatures, BrandStory highlight tiles, SignatureExperience, etc.)
      // and the tenant category is fine-dining / steakhouse — labrochette /
      // Ruth's Chris / Nobu are all dark. Light-mode overrides removed; if a
      // fast-casual tenant ships later, revive the toggle then.
      mode: 'dark',
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
      name: 'customer_theme_mode_v5',
    }
  )
)
