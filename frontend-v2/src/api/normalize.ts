/**
 * UI-F-45 + UI-F-3: Response shape normalizer.
 *
 * Confirmed from live backend smoke test (2026-06-23):
 * Envelope is `{ Status, StatusCode, message, data }`.
 *
 * `Status` values observed:
 *   - 'SUCCESS' on success
 *   - 'FAILURE' on validation failure (HTTP 400)
 *   - 'Internal Server Error' on HTTP 500
 *
 * Payload nesting variants observed:
 *   - `data`              — payload IS response.data
 *   - `data.data`         — payload at response.data.data (entity fetches)
 *   - `data.records`      — payload at response.data.records (some lists)
 *   - `data.data.records` — payload at response.data.data.records (wrapped lists)
 */
import type { AxiosResponse } from 'axios'

export type ShapeVariant =
  | 'data'
  | 'data.data'
  | 'data.records'
  | 'data.data.records'

export interface BackendEnvelope {
  Status?: 'SUCCESS' | 'FAILURE' | string
  StatusCode?: number
  message?: string
  data?: unknown
}

export class BackendFailureError extends Error {
  // Declared explicitly because `erasableSyntaxOnly` forbids parameter
  // properties (the `public readonly` shorthand in constructors).
  readonly statusValue: string
  readonly statusCode: number | undefined
  readonly envelopeMessage: string
  constructor(statusValue: string, statusCode: number | undefined, envelopeMessage: string) {
    super(envelopeMessage)
    this.statusValue = statusValue
    this.statusCode = statusCode
    this.envelopeMessage = envelopeMessage
    this.name = 'BackendFailureError'
  }
}

function readPath(value: unknown, segments: string[]): unknown {
  let current: unknown = value
  for (const seg of segments) {
    if (current && typeof current === 'object' && seg in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[seg]
    } else {
      return undefined
    }
  }
  return current
}

/**
 * Unwrap the Spring Boot envelope.
 *
 * Throws `BackendFailureError` if Status !== 'SUCCESS' so callers (TanStack Query)
 * surface it as a query error and our global error handler can toast it.
 */
export function unwrap<T = unknown>(
  response: AxiosResponse<BackendEnvelope>,
  shape: ShapeVariant = 'data.data'
): T {
  const env = response.data

  if (env?.Status && env.Status !== 'SUCCESS') {
    throw new BackendFailureError(
      env.Status,
      env.StatusCode,
      env.message ?? 'Backend reported failure'
    )
  }

  const segments = shape.split('.')
  const payload = readPath(response, segments)

  if (payload === undefined && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      `[unwrap] Shape "${shape}" did not match for ${response.config.url}.`,
      response.data
    )
  }

  return payload as T
}

/**
 * Helper for code that prefers the legacy `{success, fail}` discriminated shape
 * (matches old ApiServices.js). Useful during port to keep call-site shape compat.
 */
export type LegacyResult<T> = { success: T } | { fail: string }

export function unwrapLegacy<T = unknown>(
  response: AxiosResponse<BackendEnvelope>,
  shape: ShapeVariant = 'data.data'
): LegacyResult<T> {
  try {
    const data = unwrap<T>(response, shape)
    return { success: data }
  } catch (err) {
    const message = err instanceof BackendFailureError ? err.envelopeMessage : 'Request failed'
    return { fail: message }
  }
}
