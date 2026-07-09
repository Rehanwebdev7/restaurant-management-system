import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  ids: number[]
  has: (id: number) => boolean
  toggle: (id: number) => void
  remove: (id: number) => void
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      has: (id) => get().ids.includes(id),
      toggle: (id) =>
        set((state) => {
          const ids = state.ids.includes(id)
            ? state.ids.filter((x) => x !== id)
            : [...state.ids, id]
          return { ids }
        }),
      remove: (id) =>
        set((state) => ({
          ids: state.ids.filter((x) => x !== id),
        })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: 'customer_wishlist_v2',
    }
  )
)
