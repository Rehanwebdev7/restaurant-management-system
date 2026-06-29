/**
 * Sonner toast wrapper.
 * Keeps an API surface close to the existing `frontend/src/utils/toast.js`
 * so component porting is muscle-memory compatible.
 */
import { toast as sonner } from 'sonner'

export const toast = {
  success: (message: string, opts?: Parameters<typeof sonner.success>[1]) =>
    sonner.success(message, opts),
  error: (message: string, opts?: Parameters<typeof sonner.error>[1]) =>
    sonner.error(message, opts),
  info: (message: string, opts?: Parameters<typeof sonner.info>[1]) =>
    sonner.info(message, opts),
  warning: (message: string, opts?: Parameters<typeof sonner.warning>[1]) =>
    sonner.warning(message, opts),
  loading: (message: string, opts?: Parameters<typeof sonner.loading>[1]) =>
    sonner.loading(message, opts),
  dismiss: sonner.dismiss,
}
