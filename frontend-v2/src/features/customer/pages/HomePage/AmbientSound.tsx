import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

/**
 * AmbientSound — small toggle button that plays a soft looped kitchen
 * ambience track. Default OFF; user's choice persists in localStorage so
 * once they enable it they don't have to re-toggle on every visit.
 *
 * Browsers block autoplay of audio without user gesture — that's why we
 * default to OFF and only start on click. Simpler than an unlock dance.
 */

const STORAGE_KEY = 'customer_ambient_sound'
// Restaurant kitchen ambience loop from Pixabay (royalty-free, no attribution required).
const AMBIENCE_URL = 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_942de4a25f.mp3'

export default function AmbientSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    // Create the audio element lazily; volume kept low so it's ambient, not intrusive.
    const audio = new Audio(AMBIENCE_URL)
    audio.loop = true
    audio.volume = 0.18
    audio.preload = 'none'
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      try { localStorage.setItem(STORAGE_KEY, 'off') } catch {
        /* ignore quota */
      }
    } else {
      const p = audio.play()
      if (p && typeof p.then === 'function') {
        p.then(() => {
          setPlaying(true)
          try { localStorage.setItem(STORAGE_KEY, 'on') } catch {
            /* ignore quota */
          }
        }).catch(() => {
          // Autoplay may be blocked despite user gesture on some tabs.
          setPlaying(false)
        })
      }
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-1.5 hover:text-[--c-accent] transition-colors hidden sm:inline-flex"
      aria-label={playing ? 'Mute ambient sound' : 'Play ambient kitchen sound'}
      title={playing ? 'Mute kitchen ambience' : 'Play kitchen ambience'}
    >
      {playing ? <Volume2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}
    </button>
  )
}
