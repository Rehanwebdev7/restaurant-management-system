import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combine class names with Tailwind merge.
 * Standard shadcn/ui utility — used everywhere.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
