/**
 * UI-F-23: localStorage migration on first load of frontend-v2.
 * Preserves existing legacy keys so users don't get logged out on cutover.
 * Sets `migrated_v2: 'true'` flag so this only runs once.
 */
const MIGRATION_FLAG = 'rms_migrated_v2'

const LEGACY_KEYS = [
  'authToken',
  'customerToken',
  'refreshToken',
  'UserRole',
  'UserName',
  'UserMobile',
  'UserId',
  'user',
  'dark-mode',
  'host',
] as const

export function runStorageMigration(): void {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') return

  // Currently keys are 1:1 — placeholder for any future renames.
  let touched = 0
  for (const key of LEGACY_KEYS) {
    if (localStorage.getItem(key) !== null) touched++
  }

  localStorage.setItem(MIGRATION_FLAG, 'true')
  if (import.meta.env.DEV && touched > 0) {
    // eslint-disable-next-line no-console
    console.info(`[storage-migrate] Preserved ${touched} legacy key(s) on v2 first load.`)
  }
}
