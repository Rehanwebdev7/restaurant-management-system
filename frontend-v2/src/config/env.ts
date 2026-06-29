/**
 * UI-F-74: Environment configuration with Zod validation.
 * Fails fast at build/runtime if required vars are missing.
 */
import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default('http://localhost:8091/rms'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_PLATFORM: z.enum(['web', 'mobile']).default('web'),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_SENTRY_AUTH_TOKEN: z.string().optional(),
  VITE_SENTRY_ORG: z.string().optional(),
  VITE_SENTRY_PROJECT: z.string().optional(),
  VITE_FIREBASE_VAPID_KEY: z.string().optional(),
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_GOOGLE_MAPS_KEY: z.string().optional(),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  VITE_PAYPAL_CLIENT_ID: z.string().optional(),
  VITE_CCAVENUE_MERCHANT_ID: z.string().optional(),
  VITE_ENABLE_MOCK: z
    .union([z.literal('true'), z.literal('false')])
    .default('false')
    .transform((v) => v === 'true'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables — check .env file')
}

export const env = parsed.data
export type Env = typeof env
