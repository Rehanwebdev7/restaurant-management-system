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
      // LIGHT default (2026-07-11 v6). User asked for bright cream restaurant
      // premium (Cava / Toast / labrochette-lunch vibe) — dark felt heavy.
      // Palette locked: warm ivory base + gold + soft terracotta secondary.
      // Every dark-first card gets a light-mode CSS variant instead of a
      // lower-opacity dark card, so images stay appetizing on cream.
      mode: 'light',
      toggle: () =>
        set((state) => ({
          mode: state.mode === 'dark' ? 'light' : 'dark',
        })),
      setMode: (mode) => set({ mode }),
    }),
    {
      // Persist key bumped to v6 (2026-07-11) so stale dark preferences from
      // v5 are invalidated. Users land on cream default; toggle to dark still
      // works and persists on v6.
      name: 'customer_theme_mode_v6',
    }
  )
)
