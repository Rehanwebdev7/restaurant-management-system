import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartLine {
  id: number
  qty: number
}

interface CartState {
  items: CartLine[]
  setQty: (id: number, delta: number) => void
  add: (id: number, qty?: number) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      setQty: (id, delta) =>
        set((state) => {
          const idx = state.items.findIndex((l) => l.id === id)
          let next: CartLine[]
          if (idx === -1) {
            if (delta <= 0) return {}
            next = [...state.items, { id, qty: delta }]
          } else {
            const cur = state.items[idx]?.qty ?? 0
            const updated = cur + delta
            next = [...state.items]
            if (updated <= 0) {
              next.splice(idx, 1)
            } else {
              next[idx] = { id, qty: updated }
            }
          }
          return { items: next }
        }),
      add: (id, qty = 1) =>
        set((state) => {
          const idx = state.items.findIndex((l) => l.id === id)
          let next: CartLine[]
          if (idx === -1) {
            next = [...state.items, { id, qty }]
          } else {
            const cur = state.items[idx]?.qty ?? 0
            next = [...state.items]
            next[idx] = { id, qty: cur + qty }
          }
          return { items: next }
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'customer_cart_v2',
    }
  )
)
