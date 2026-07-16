/**
 * NotificationsPanel — dropdown surfaced from the header Bell icon.
 *
 * Lists the customer's notifications with mark-as-read + mark-all-read.
 * Backed by `/api/customer/notifications` (paginated) + `/unread-count`
 * (polled every 60s by the parent hook).
 *
 * Auth-gated: if no customer token, the Bell click in header opens the
 * login modal instead of rendering this panel.
 */

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Check, CheckCheck, Loader2, X } from 'lucide-react'
import { useCustomerNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/api/queries/customer'
import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'

interface Props {
  open: boolean
  onClose: () => void
}

function relativeTime(iso?: string): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const diffSec = Math.round((then - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  if (abs < 60) return diffSec < 0 ? `${abs}s ago` : 'just now'
  if (abs < 3600) return `${Math.round(abs / 60)}m ago`
  if (abs < 86400) return `${Math.round(abs / 3600)}h ago`
  return `${Math.round(abs / 86400)}d ago`
}

export default function NotificationsPanel({ open, onClose }: Props) {
  const { data, isLoading, isError, refetch } = useCustomerNotifications(0, 20)
  const markOneMut = useMarkNotificationRead()
  const markAllMut = useMarkAllNotificationsRead()

  // ESC to close + prevent body scroll behind the panel (mobile sheet).
  useBodyScrollLock(open)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const notifs = data?.records ?? []
  const unreadCount = notifs.filter((n) => !n.isRead).length

  const handleMarkOne = (id: number) => {
    markOneMut.mutate(id, {
      onError: () => toast.warning('Could not mark as read — try again'),
    })
  }

  const handleMarkAll = () => {
    if (unreadCount === 0) return
    markAllMut.mutate(undefined, {
      onSuccess: () => toast.success('All notifications marked as read'),
      onError: () => toast.warning('Could not mark all — try again'),
    })
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          {/* Backdrop — click closes */}
          <motion.div
            key="notif-backdrop"
            className="fixed inset-0 z-[68] bg-black/20"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          {/* Panel — anchored top-right on desktop, bottom-sheet on mobile */}
          <motion.div
            key="notif-panel"
            className={cn(
              'fixed z-[69] c-card overflow-hidden flex flex-col',
              // Desktop
              'sm:top-[calc(var(--c-header-h,72px)+10px)] sm:right-4 sm:w-[380px] sm:max-h-[70vh] sm:rounded-2xl sm:border sm:border-[--c-border]',
              // Mobile bottom sheet
              'inset-x-0 bottom-0 sm:inset-auto rounded-t-2xl sm:rounded-t-2xl max-h-[85vh]',
            )}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.7 }}
            role="dialog"
            aria-label="Notifications"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[--c-border]">
              <div className="flex items-center gap-2">
                <Bell className="size-4" style={{ color: 'var(--c-accent)' }} />
                <p className="subtitle text-[10px]">NOTIFICATIONS</p>
                {unreadCount > 0 ? (
                  <span
                    className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                    style={{ background: 'var(--c-accent)', color: 'var(--c-button-primary-fg, #111)' }}
                  >
                    {unreadCount}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded hover:bg-[--c-bg-elev-2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                  onClick={handleMarkAll}
                  disabled={unreadCount === 0 || markAllMut.isPending}
                  style={{ color: 'var(--c-accent)' }}
                  aria-label="Mark all as read"
                >
                  <CheckCheck className="size-3.5" /> Read all
                </button>
                <button
                  className="p-1.5 rounded hover:bg-[--c-bg-elev-2]"
                  onClick={onClose}
                  aria-label="Close notifications"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-5 animate-spin opacity-60" />
                </div>
              ) : isError ? (
                <div className="text-center py-12 px-4">
                  <p className="text-sm text-[--c-text-soft] mb-3">Could not load notifications</p>
                  <button
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--c-accent)' }}
                    onClick={() => { void refetch() }}
                  >
                    Retry
                  </button>
                </div>
              ) : notifs.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <Bell className="size-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-semibold">You're all caught up</p>
                  <p className="text-xs text-[--c-text-muted] mt-1">
                    Order updates and offers will show up here.
                  </p>
                </div>
              ) : (
                <ul>
                  {notifs.map((n) => (
                    <li
                      key={n.id}
                      className={cn(
                        'px-4 py-3 border-b border-[--c-border] last:border-b-0 transition-colors',
                        !n.isRead && 'bg-[rgba(var(--c-accent-rgb),0.05)]',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'shrink-0 mt-1 size-2 rounded-full',
                            !n.isRead ? 'bg-[--c-accent]' : 'bg-transparent',
                          )}
                          aria-hidden
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm', !n.isRead && 'font-semibold')}>{n.title}</p>
                          {n.message ? (
                            <p className="text-xs text-[--c-text-soft] mt-0.5 leading-relaxed">{n.message}</p>
                          ) : null}
                          <p className="text-[10px] text-[--c-text-muted] mt-1.5 uppercase tracking-wider">
                            {relativeTime(n.createdAt)}
                          </p>
                        </div>
                        {!n.isRead ? (
                          <button
                            className="shrink-0 p-1.5 rounded hover:bg-[--c-bg-elev-2] transition-colors"
                            onClick={() => handleMarkOne(n.id)}
                            disabled={markOneMut.isPending}
                            aria-label={`Mark "${n.title}" as read`}
                            title="Mark as read"
                            style={{ color: 'var(--c-accent)' }}
                          >
                            <Check className="size-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
