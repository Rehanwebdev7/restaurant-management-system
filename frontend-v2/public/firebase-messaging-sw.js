/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging service worker (UI-F-10).
 *
 * Loaded by /firebase-messaging-sw.js at site root. Registered with a dedicated
 * scope so it does not collide with the vite-plugin-pwa app-shell SW. Handles
 * BACKGROUND push messages: when the app tab is closed or backgrounded, we
 * surface a native notification + a click-through to the relevant route.
 *
 * Firebase web SDK config values are PUBLIC (apiKey is an identifier, not a
 * secret — Firebase backend enforces access via OAuth + Firestore rules). They
 * are read at first install from `/api/auth/fcm-web-config` so the owner can
 * rotate Firebase projects without rebuilding the bundle. If that endpoint is
 * absent, we fall back to env-injected defaults embedded by the build (handled
 * by main `fcm.ts` for the foreground case; the SW gracefully no-ops here).
 */

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js')

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

async function fetchConfig() {
  try {
    const res = await fetch('/api/auth/fcm-web-config', { credentials: 'include' })
    if (!res.ok) return null
    const body = await res.json()
    // ApiResponse envelope: { Status, data: {...} }
    return body && body.data ? body.data : body
  } catch {
    return null
  }
}

async function initMessaging() {
  const cfg = await fetchConfig()
  if (!cfg || !cfg.apiKey || !cfg.projectId || !cfg.appId || !cfg.messagingSenderId) {
    // Config missing — no-op until the owner drops in credentials.
    return null
  }
  firebase.initializeApp({
    apiKey: cfg.apiKey,
    authDomain: cfg.authDomain || '',
    projectId: cfg.projectId,
    appId: cfg.appId,
    messagingSenderId: cfg.messagingSenderId,
  })
  const messaging = firebase.messaging()
  messaging.onBackgroundMessage((payload) => {
    const title = (payload.notification && payload.notification.title) || 'New notification'
    const body = (payload.notification && payload.notification.body) || ''
    const clickUrl =
      (payload.data && payload.data.url) ||
      (payload.data && payload.data.orderId ? `/orders/${payload.data.orderId}` : '/')
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: (payload.data && payload.data.tag) || 'rms-notification',
      data: { url: clickUrl },
    })
  })
  return messaging
}

// Boot — async, errors swallowed (we'd rather no notifications than a broken SW).
initMessaging().catch(() => {})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.endsWith(target)) return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target)
      return undefined
    }),
  )
})
