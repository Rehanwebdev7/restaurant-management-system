/**
 * POS thermal printer adapter (UI-F-65).
 *
 * Two-phase rollout:
 *   1. Today: fall back to `window.print()` with a print stylesheet that
 *      constrains output to 80 mm thermal width (standard ESC/POS roll).
 *      Works on every browser, no driver setup, ships immediately.
 *   2. Hardware phase: integrate WebUSB to talk ESC/POS bytes directly to a
 *      paired thermal printer (Epson TM-T20II, Bixolon SRP-330II, etc.).
 *      The hook below is structured so the WebUSB path can be swapped in
 *      without touching call sites.
 *
 * Usage:
 *   await printReceipt(receiptHtml)
 *
 * The receipt HTML can include normal `<p>` / `<h1>` / `<table>` — the
 * injected stylesheet handles the 80 mm column, monospace font, and
 * tear-line margin.
 */

const PRINT_CSS = `
@media print {
  @page {
    /* 80 mm thermal roll. Most drivers crop to ~72 mm printable, so we
     * give a touch of horizontal padding inside .pos-receipt itself. */
    size: 80mm auto;
    margin: 0;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body * {
    visibility: hidden;
  }
  .pos-receipt, .pos-receipt * {
    visibility: visible;
  }
  .pos-receipt {
    position: absolute;
    inset: 0;
    width: 80mm;
    padding: 4mm 3mm 8mm;
    font-family: 'Courier New', 'Consolas', monospace;
    font-size: 11px;
    line-height: 1.35;
    color: #000;
  }
  .pos-receipt h1, .pos-receipt h2, .pos-receipt h3 {
    margin: 0 0 2mm;
    text-align: center;
    font-size: 13px;
  }
  .pos-receipt table {
    width: 100%;
    border-collapse: collapse;
  }
  .pos-receipt td {
    padding: 1px 0;
    vertical-align: top;
  }
  .pos-receipt .divider {
    border-top: 1px dashed #000;
    margin: 2mm 0;
  }
}
`

const STYLE_ID = 'pos-printer-style'
const HOST_ID = 'pos-printer-host'

function ensureStyle(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.appendChild(document.createTextNode(PRINT_CSS))
  document.head.appendChild(style)
}

function getHost(): HTMLDivElement | null {
  if (typeof document === 'undefined') return null
  let host = document.getElementById(HOST_ID) as HTMLDivElement | null
  if (!host) {
    host = document.createElement('div')
    host.id = HOST_ID
    host.className = 'pos-receipt'
    host.setAttribute('aria-hidden', 'true')
    // Off-screen on screen; the @media print rule reveals it.
    host.style.position = 'absolute'
    host.style.left = '-9999px'
    host.style.top = '-9999px'
    document.body.appendChild(host)
  }
  return host
}

export interface PrintReceiptOptions {
  /** Wait for resources (e.g. logo image) before triggering print. */
  waitForImages?: boolean
  /** Override default `window.print()` (useful for tests). */
  trigger?: () => void
}

/**
 * Print the supplied HTML as a thermal receipt.
 *
 * Today this routes through the browser print dialog with a tight 80 mm
 * stylesheet. When a WebUSB-paired thermal printer is detected (see
 * `TODO` below) the implementation will switch to direct ESC/POS bytes
 * so cashiers do not see a dialog at all.
 *
 * @param content Raw HTML for the receipt body.
 */
export async function printReceipt(
  content: string,
  options: PrintReceiptOptions = {},
): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  ensureStyle()
  const host = getHost()
  if (!host) return

  host.innerHTML = content

  if (options.waitForImages) {
    const images = Array.from(host.querySelectorAll('img'))
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve()
            img.addEventListener('load', () => resolve(), { once: true })
            img.addEventListener('error', () => resolve(), { once: true })
          }),
      ),
    )
  }

  // TODO(UI-F-65): when WebUSB / Web Serial connection is established for
  // a paired thermal printer, encode `content` to ESC/POS bytes
  // (escpos-buffer / receiptline) and call `device.transferOut()` instead
  // of falling through to window.print(). Keep this fallback in place for
  // the "browser-only" deployment lane (web POS, no driver setup).
  const fire = options.trigger ?? (() => window.print())
  fire()
}

// Structural shape for the subset of WebUSB we touch — avoids requiring
// `@types/w3c-web-usb` for what's still a scaffold (UI-F-65 hardware phase).
interface ThermalUsbDevice {
  deviceClass: number
  productName?: string
  vendorId?: number
  productId?: number
}

/**
 * Probe for a WebUSB-paired thermal printer.
 * Today: returns null — wired up in UI-F-65 hardware phase.
 */
export async function detectThermalPrinter(): Promise<ThermalUsbDevice | null> {
  if (typeof navigator === 'undefined' || !('usb' in navigator)) return null
  try {
    // Common ESC/POS class code: 7 (Printer). vendorId list will grow with
    // each printer the team certifies (Epson 0x04b8, Bixolon 0x1504, etc.).
    const devices = await (navigator as Navigator & { usb: { getDevices: () => Promise<ThermalUsbDevice[]> } })
      .usb.getDevices()
    return devices.find((d) => d.deviceClass === 7) ?? null
  } catch {
    return null
  }
}

export default { printReceipt, detectThermalPrinter }
