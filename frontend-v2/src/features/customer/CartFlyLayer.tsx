/**
 * CartFlyLayer — global portal that renders flying add-to-cart coins.
 *
 * Mounted once inside <CustomerLayout>. Listens for `customer:cart-fly`
 * events (see fly-to-cart.ts), spawns a motion.div with the dish image
 * inside a gold-bordered circle, and animates it with spring physics
 * from the origin card to the header cart icon.
 *
 * Cart icon must carry `data-cart-icon="1"` so we can locate it.
 * The header cart button gets a small keyframed "pulse" on receive.
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { CART_FLY_EVENT, type FlyToCartDetail } from '@/features/customer/fly-to-cart'

interface FlyingCoin {
  id: number
  from: { x: number; y: number; w: number; h: number }
  to: { x: number; y: number }
  img: string
}

const COIN_SIZE = 44

export default function CartFlyLayer() {
  const [coins, setCoins] = useState<FlyingCoin[]>([])
  const idRef = useRef(0)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<FlyToCartDetail>).detail
      if (!detail) return
      const cartIcon = document.querySelector<HTMLElement>('[data-cart-icon="1"]')
      if (!cartIcon) return
      const dest = cartIcon.getBoundingClientRect()
      const to = {
        x: dest.left + dest.width / 2 - COIN_SIZE / 2,
        y: dest.top + dest.height / 2 - COIN_SIZE / 2,
      }
      const id = ++idRef.current
      setCoins((prev) => [...prev, { id, from: detail.origin, to, img: detail.img }])
      // Kick the cart icon so the user sees a receive pulse.
      cartIcon.setAttribute('data-cart-receive', String(Date.now()))
      cartIcon.classList.remove('c-cart-receive')
      // Force a reflow so the animation restarts even on rapid taps.
      void cartIcon.offsetWidth
      cartIcon.classList.add('c-cart-receive')
      // Auto-remove the coin from state after the animation finishes.
      window.setTimeout(() => {
        setCoins((prev) => prev.filter((c) => c.id !== id))
      }, 850)
    }
    document.addEventListener(CART_FLY_EVENT, handler)
    return () => document.removeEventListener(CART_FLY_EVENT, handler)
  }, [reduce])

  if (reduce) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <AnimatePresence>
        {coins.map((c) => {
          // Land the coin at the cart icon centre. Start at the origin's
          // centre-top so the "coin" looks like it lifts off the dish image.
          const startX = c.from.x + c.from.w / 2 - COIN_SIZE / 2
          const startY = c.from.y + c.from.h / 2 - COIN_SIZE / 2
          return (
            <motion.div
              key={c.id}
              initial={{
                x: startX,
                y: startY,
                scale: 0.6,
                opacity: 0,
              }}
              animate={{
                x: [startX, startX + (c.to.x - startX) * 0.5, c.to.x],
                y: [startY, Math.min(startY, c.to.y) - 120, c.to.y],
                scale: [0.6, 1, 0.4],
                opacity: [0, 1, 0.9],
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: 0.75,
                ease: [0.22, 0.61, 0.36, 1],
                times: [0, 0.55, 1],
              }}
              style={{
                position: 'absolute',
                width: COIN_SIZE,
                height: COIN_SIZE,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #F5E5B8 0%, #C9A96E 100%)',
                boxShadow: '0 6px 18px rgba(201, 169, 110, 0.55), 0 0 0 2px rgba(255, 252, 246, 0.6)',
                padding: 2,
              }}
            >
              <img
                src={c.img}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%',
                }}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
