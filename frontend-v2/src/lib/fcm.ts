/**
 * UI-F-10: Firebase Cloud Messaging frontend scaffold.
 *
 * Boots silently when any Firebase env var is missing — so the build keeps
 * working without secrets. When the owner ships the Firebase web SDK keys
 * (console.firebase.google.com → project restms-86a5d → Settings → Web app),
 * notifications light up with zero further changes.
 *
 * Wire-up: call `void initFcm()` after a successful panel login (Login.tsx).
 * Foreground messages play the kitchen alert sound + show a sonner toast.
 * Background messages are handled by the service worker registered by
 * vite-plugin-pwa.
 */
import { env } from '@/config/env'
import apiClient from '@/api/client'
import { playSound } from '@/lib/audio/sound-manager'
import { toast } from '@/lib/toast'

interface FirebaseModules {
  initializeApp: (config: Record<string, string>) => unknown
  getMessaging: (app: unknown) => unknown
  getToken: (messaging: unknown, options: { vapidKey: string }) => Promise<string | null>
  onMessage: (messaging: unknown, handler: (payload: { notification?: { title?: string; body?: string } }) => void) => void
}

interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  messagingSenderId: string
  vapidKey: string
}

function hasFirebaseEnv(): boolean {
  return Boolean(
    env.VITE_FIREBASE_API_KEY &&
    env.VITE_FIREBASE_PROJECT_ID &&
    env.VITE_FIREBASE_APP_ID &&
    env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
    env.VITE_FIREBASE_VAPID_KEY,
  )
}

async function fetchBackendFcmConfig(): Promise<FirebaseWebConfig | null> {
  try {
    const r = await apiClient.get('/api/auth/fcm-web-config')
    // ApiResponse envelope: { Status, data: { apiKey, authDomain, projectId, appId, messagingSenderId, vapidKey, ready } }
    const data = (r.data as { data?: FirebaseWebConfig & { ready?: boolean } }).data
    if (!data) return null
    if (!data.apiKey || !data.projectId || !data.appId || !data.messagingSenderId || !data.vapidKey) return null
    return data
  } catch {
    return null
  }
}

async function resolveFirebaseConfig(): Promise<FirebaseWebConfig | null> {
  if (hasFirebaseEnv()) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY!,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
      projectId: env.VITE_FIREBASE_PROJECT_ID!,
      appId: env.VITE_FIREBASE_APP_ID!,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
      vapidKey: env.VITE_FIREBASE_VAPID_KEY!,
    }
  }
  return fetchBackendFcmConfig()
}

async function loadFirebase(): Promise<FirebaseModules | null> {
  try {
    // Firebase is an OPTIONAL peer dep — package may or may not be installed.
    // We resolve the specifier through a variable so rolldown does NOT try to
    // statically resolve `firebase/app` at build time (which would fail when
    // the dep is absent, blocking the entire production build).
    /* @vite-ignore */
    const appMod = 'firebase/app'
    /* @vite-ignore */
    const msgMod = 'firebase/messaging'
    const [app, messaging] = await Promise.all([
      import(/* @vite-ignore */ appMod),
      import(/* @vite-ignore */ msgMod),
    ])
    return {
      initializeApp: app.initializeApp,
      getMessaging: messaging.getMessaging,
      getToken: messaging.getToken,
      onMessage: messaging.onMessage,
    }
  } catch {
    // firebase package not installed in this build — no-op.
    return null
  }
}

const TOKEN_CACHE_KEY = 'fcmToken'

function detectPlatform(): 'web' | 'android' | 'ios' {
  if (typeof navigator === 'undefined') return 'web'
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  return 'web'
}

async function registerFcmToken(token: string): Promise<void> {
  const cached = (() => { try { return localStorage.getItem(TOKEN_CACHE_KEY) } catch { return null } })()
  if (cached === token) return
  try {
    await apiClient.post('/api/auth/register-fcm-token', { token, platform: detectPlatform() })
    try { localStorage.setItem(TOKEN_CACHE_KEY, token) } catch { /* private mode */ }
  } catch {
    // backend unreachable — silently ignore so login is never blocked.
  }
}

async function registerFirebaseSw(): Promise<ServiceWorkerRegistration | undefined> {
  // The PWA service worker registered by vite-plugin-pwa handles the app shell.
  // Firebase needs a dedicated `firebase-messaging-sw.js` at the site root for
  // background pushes; we register it under a distinct scope so it does not
  // collide with the PWA SW.
  try {
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope',
    })
  } catch {
    return undefined
  }
}

/** Idempotent. Safe to call on every login. */
let initialized = false
export async function initFcm(): Promise<void> {
  if (initialized) return
  if (typeof window === 'undefined') return
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return

  const cfg = await resolveFirebaseConfig()
  if (!cfg) return // No env vars AND backend config not populated yet — no-op.

  const modules = await loadFirebase()
  if (!modules) return

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const firebaseConfig = {
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      appId: cfg.appId,
      messagingSenderId: cfg.messagingSenderId,
    }
    const app = modules.initializeApp(firebaseConfig)
    const messaging = modules.getMessaging(app)

    // Wait for the Firebase SW so getToken can hand it the registration.
    const swReg = await registerFirebaseSw()

    const tokenOpts: { vapidKey: string; serviceWorkerRegistration?: ServiceWorkerRegistration } = {
      vapidKey: cfg.vapidKey,
    }
    if (swReg) tokenOpts.serviceWorkerRegistration = swReg

    const token = await (modules.getToken as (m: unknown, o: typeof tokenOpts) => Promise<string | null>)(messaging, tokenOpts)
    if (token) await registerFcmToken(token)

    modules.onMessage(messaging, (payload) => {
      playSound('order-received')
      const title = payload.notification?.title ?? 'New notification'
      const body = payload.notification?.body
      toast.info(title, { description: body })
    })

    initialized = true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[fcm] init failed', err)
  }
}
