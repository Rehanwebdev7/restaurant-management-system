import { useEffect, useState } from 'react'

/**
 * UI-F-10: Sound manager + audio-unlock hook.
 *
 * Browsers block `Audio.play()` until a user gesture happens. We unlock by
 * playing a silent buffer on the first click, then queue real sounds after.
 * Volume / muted preferences persist in localStorage as `sound_*`.
 */

export type SoundName = 'order-received' | 'success' | 'error' | 'warning'

const LS_VOLUME = 'sound_volume'
const LS_MUTED = 'sound_muted'

let unlocked = false
const cache = new Map<SoundName, HTMLAudioElement>()

function readVolume(): number {
  if (typeof window === 'undefined') return 0.6
  const raw = window.localStorage.getItem(LS_VOLUME)
  const n = raw == null ? 0.6 : Number(raw)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.6
}

function readMuted(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(LS_MUTED) === '1'
}

export function setVolume(value: number): void {
  const clamped = Math.min(1, Math.max(0, value))
  if (typeof window !== 'undefined') window.localStorage.setItem(LS_VOLUME, String(clamped))
}

export function setMuted(muted: boolean): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(LS_MUTED, muted ? '1' : '0')
}

export function isMuted(): boolean {
  return readMuted()
}

function getAudio(name: SoundName): HTMLAudioElement {
  let a = cache.get(name)
  if (!a) {
    a = new Audio(`/sounds/${name}.mp3`)
    a.preload = 'auto'
    cache.set(name, a)
  }
  return a
}

export function playSound(name: SoundName): void {
  if (typeof window === 'undefined') return
  if (readMuted()) return
  const audio = getAudio(name)
  audio.volume = readVolume()
  audio.currentTime = 0
  void audio.play().catch(() => {
    /* Browser blocked playback — needs another user gesture. */
  })
}

export function useAudioUnlock(): { unlocked: boolean } {
  const [state, setState] = useState(unlocked)

  useEffect(() => {
    if (unlocked) return
    const handler = () => {
      const a = new Audio()
      a.muted = true
      void a
        .play()
        .then(() => a.pause())
        .catch(() => {
          /* silent buffer failed — sounds will retry on real play */
        })
      unlocked = true
      setState(true)
      window.removeEventListener('click', handler)
      window.removeEventListener('keydown', handler)
      window.removeEventListener('touchstart', handler)
    }
    window.addEventListener('click', handler, { once: true })
    window.addEventListener('keydown', handler, { once: true })
    window.addEventListener('touchstart', handler, { once: true })
    return () => {
      window.removeEventListener('click', handler)
      window.removeEventListener('keydown', handler)
      window.removeEventListener('touchstart', handler)
    }
  }, [])

  return { unlocked: state }
}
