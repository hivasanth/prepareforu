import { supabase } from '../lib/supabase'
import { safeSupabaseCall } from '../utils/safeSupabase'
import type { AuthError, ServiceResult } from '../types/auth.types'
import { logError } from '../utils/logger'

/**
 * Permanently deletes the signed-in user's account (public data + auth.users).
 *
 * SECURITY MODEL:
 *   - The backend RPC `delete_own_account()` authorizes via auth.uid() inside
 *     the SECURITY DEFINER function. NO user id is accepted from the client, so
 *     a compromised caller can never delete another user's data (no IDOR/BOLA).
 *   - The frontend never touches service_role; the call rides the signed-in
 *     session's JWT through the public Data API.
 *
 * Returns the canonical ServiceResult shape. Raw Supabase/PG errors are mapped
 * to a user-safe message and are never surfaced verbatim to the UI.
 */
export async function deleteOwnAccount(): Promise<ServiceResult> {
  try {
    const { error } = await safeSupabaseCall(supabase.rpc('delete_own_account'))
    if (error) return { success: false, error: mapDeleteError(error) }
    return { success: true, data: null }
  } catch (err: unknown) {
    logError('accountService.deleteOwnAccount.exception', {
      message: err instanceof Error ? err.message : 'Unknown error'
    })
    return { success: false, error: mapDeleteError(err) }
  }
}

function mapDeleteError(error: unknown): AuthError {
  const err = error as { message?: string; status?: number } | null | undefined
  const msg = err?.message?.toLowerCase() || ''
  if (msg.includes('access denied')) {
    return {
      source: 'auth',
      code: 'ACTION_FORBIDDEN',
      message: 'You are not signed in. Please sign in and try again.',
      field: 'general'
    }
  }
  if (err?.status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
    return {
      source: 'auth',
      code: 'RATE_LIMIT',
      message: 'Too many attempts. Please wait a few minutes and try again.',
      field: 'general'
    }
  }
  logError('accountService.deleteOwnAccount.error', {
    message: err?.message || 'Unknown error'
  })
  return {
    source: 'db',
    code: 'DELETE_FAILED',
    message: err?.message && !msg.includes('undefined') && !msg.includes('failed to fetch')
      ? 'We could not delete your account. Please try again.'
      : 'We could not delete your account. Please check your connection and try again.',
    field: 'general'
  }
}
