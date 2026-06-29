/**
 * useBarcodeScanner — HID-style USB / Bluetooth barcode scanner hook.
 *
 * Hardware scanners present as a USB keyboard: they type the decoded barcode
 * very quickly (well under 50 ms between characters) and terminate with a
 * carriage return or newline. This hook detects that pattern by:
 *   1. Buffering characters as they arrive on `document` keypress events.
 *   2. Resetting the buffer if the interval between two keys exceeds the
 *      `inputDebounceMs` threshold (i.e. a human typing).
 *   3. On Enter, flushing the buffer through `onBarcode` if it has the
 *      minimum length.
 *
 * Auto-focuses an invisible <input> when a scanner-shaped key burst is
 * detected so the focus does not get stolen by other inputs in busy POS
 * screens. This is purely defensive — most scanners type into whichever
 * element holds focus regardless.
 */

import { useEffect, useRef } from 'react'

export interface UseBarcodeScannerOptions {
  /** Callback fired once Enter is pressed after a fast-typed sequence. */
  onBarcode: (code: string) => void
  /** Max ms between two keys before we consider it human typing. Default 50. */
  inputDebounceMs?: number
  /** Minimum decoded length to fire onBarcode. Default 4 (EAN-8 baseline). */
  minLength?: number
  /** Whether the hook is active. Disable on screens where it would interfere. */
  enabled?: boolean
}

export interface UseBarcodeScannerReturn {
  /** Manually trigger the callback (useful for tests / manual entry). */
  onBarcode: (code: string) => void
}

const HIDDEN_INPUT_ID = 'rms-barcode-sink'

function ensureHiddenInput(): HTMLInputElement | null {
  if (typeof document === 'undefined') return null
  let el = document.getElementById(HIDDEN_INPUT_ID) as HTMLInputElement | null
  if (!el) {
    el = document.createElement('input')
    el.id = HIDDEN_INPUT_ID
    el.type = 'text'
    el.setAttribute('autocomplete', 'off')
    el.setAttribute('aria-hidden', 'true')
    el.tabIndex = -1
    el.style.position = 'fixed'
    el.style.opacity = '0'
    el.style.pointerEvents = 'none'
    el.style.left = '0'
    el.style.bottom = '0'
    el.style.width = '1px'
    el.style.height = '1px'
    document.body.appendChild(el)
  }
  return el
}

/**
 * Wire a barcode-scanner listener to `document`. Returns the same
 * `onBarcode` callback for manual triggering (e.g. from a "scan" test
 * button on the UI).
 */
export function useBarcodeScanner(opts: UseBarcodeScannerOptions): UseBarcodeScannerReturn {
  const { onBarcode, inputDebounceMs = 50, minLength = 4, enabled = true } = opts

  // Refs so the listener can read the latest values without re-binding.
  const onBarcodeRef = useRef(onBarcode)
  onBarcodeRef.current = onBarcode

  const bufferRef = useRef<string>('')
  const lastTsRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return
    if (typeof document === 'undefined') return

    ensureHiddenInput()

    const handleKey = (e: KeyboardEvent): void => {
      const now = performance.now()
      const delta = now - lastTsRef.current
      lastTsRef.current = now

      // Slow keypress → reset the buffer (this is a human typing).
      if (delta > inputDebounceMs && bufferRef.current.length > 0) {
        bufferRef.current = ''
      }

      if (e.key === 'Enter') {
        const code = bufferRef.current
        bufferRef.current = ''
        if (code.length >= minLength) {
          // Only swallow the event if we actually fired a barcode — leaves
          // normal form Enter behaviour alone for humans.
          e.preventDefault()
          onBarcodeRef.current(code)
        }
        return
      }

      // Only collect printable single characters. Modifier-only events,
      // arrow keys, etc. reset the buffer.
      if (e.key.length === 1) {
        bufferRef.current += e.key
      } else {
        bufferRef.current = ''
      }
    }

    document.addEventListener('keydown', handleKey, true)
    return () => document.removeEventListener('keydown', handleKey, true)
  }, [enabled, inputDebounceMs, minLength])

  return {
    onBarcode: (code) => onBarcodeRef.current(code),
  }
}

export default useBarcodeScanner
