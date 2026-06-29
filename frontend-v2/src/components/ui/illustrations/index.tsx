/**
 * UI-F-32 / UI-F-53: Inline-SVG illustrations.
 * Tree-shakeable named exports. `color="currentColor"` so they inherit
 * `text-*` tokens; gold accent (`#C5A572`) is the steakhouse brand cue.
 */
interface IllustrationProps {
  size?: number
  color?: string
  className?: string
}

const ACCENT = '#C5A572'

export function EmptyOrders({ size = 200, color = 'currentColor', className }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={className} aria-hidden>
      <rect x="58" y="30" width="84" height="140" rx="4" stroke={color} strokeWidth="2" />
      <path d="M58 50h84M58 70h84M58 90h60M58 110h70M58 130h50" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <circle cx="142" cy="50" r="6" fill={ACCENT} />
      <path d="M68 168l-6 12M132 168l6 12M100 170v14" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

export function EmptyMenu({ size = 200, color = 'currentColor', className }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={className} aria-hidden>
      <ellipse cx="100" cy="140" rx="60" ry="14" stroke={color} strokeWidth="2" />
      <ellipse cx="100" cy="140" rx="44" ry="10" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <path d="M70 90c0-18 14-32 30-32s30 14 30 32v8H70v-8z" stroke={color} strokeWidth="2" />
      <path d="M60 110h80v8a6 6 0 01-6 6H66a6 6 0 01-6-6v-8z" stroke={color} strokeWidth="2" />
      <circle cx="86" cy="78" r="3" fill={ACCENT} />
      <circle cx="100" cy="72" r="3" fill={ACCENT} />
      <circle cx="114" cy="78" r="3" fill={ACCENT} />
    </svg>
  )
}

export function EmptyCustomers({ size = 200, color = 'currentColor', className }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={className} aria-hidden>
      <circle cx="100" cy="74" r="26" stroke={color} strokeWidth="2" />
      <path d="M50 160c0-26 22-44 50-44s50 18 50 44" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M100 100v6" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="74" r="6" fill={ACCENT} opacity="0.3" />
    </svg>
  )
}

export function NotFound404({ size = 200, color = 'currentColor', className }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={className} aria-hidden>
      <circle cx="100" cy="100" r="70" stroke={color} strokeWidth="2" opacity="0.2" />
      <path d="M50 130V90l24 32V90" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="100" cy="110" r="18" stroke={ACCENT} strokeWidth="3" />
      <path d="M126 130V90l24 32V90" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="40" y="50" width="14" height="14" rx="2" fill={ACCENT} opacity="0.6" />
      <rect x="148" y="140" width="10" height="10" rx="2" fill={color} opacity="0.3" />
    </svg>
  )
}

export function NetworkOffline({ size = 200, color = 'currentColor', className }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={className} aria-hidden>
      <path d="M40 90a90 90 0 01120 0" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
      <path d="M60 110a60 60 0 0180 0" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      <path d="M80 130a30 30 0 0140 0" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="100" cy="150" r="4" fill={color} />
      <path d="M40 40l120 120" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function EmptySearch({ size = 200, color = 'currentColor', className }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={className} aria-hidden>
      <circle cx="86" cy="86" r="40" stroke={color} strokeWidth="3" />
      <path d="M116 116l30 30" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M70 86h32M86 70v32" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}
