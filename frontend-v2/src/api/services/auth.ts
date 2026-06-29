/**
 * Auth API service — POST /login/panelLogin via ported apiClient.
 *
 * Shape verified live 2026-06-23:
 *   { Status: "SUCCESS", StatusCode: 200, message: "Login successful",
 *     data: { id, name, mobile, userType, token } }
 *
 * So payload lives at `data.data` and field names are `token` + `userType`.
 */
import apiClient from '@/api/client'
import { unwrapLegacy, type LegacyResult } from '@/api/normalize'

export interface PanelLoginRequest {
  mobile: string
  password: string
}

export interface PanelLoginPayload {
  id: number
  name: string
  mobile: string
  userType: string
  token: string
}

export async function panelLogin(req: PanelLoginRequest): Promise<LegacyResult<PanelLoginPayload>> {
  try {
    const response = await apiClient.post('/login/panelLogin', req)
    return unwrapLegacy<PanelLoginPayload>(response, 'data.data')
  } catch (err) {
    const message =
      (err as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message ??
      (err as { message?: string }).message ??
      'Login request failed'
    return { fail: message }
  }
}
