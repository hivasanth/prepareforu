import { inviteClient } from '../lib/inviteClient'
import type { AuthError, ServiceResult } from '../types/auth.types'
import { passwordSchema } from '../validations/securitySchemas'

/**
 * Invitation/onboarding auth service.
 *
 * ALL operations here run against the ISOLATED invite client
 * (`src/lib/inviteClient.ts`) which uses a THROWAWAY (non-persisted, in-memory)
 * session namespace. This guarantees that accepting an invitation NEVER mutates
 * the persisted session of the Normal app client (e.g. an Admin who remains
 * signed in in another tab of the same browser origin).
 *
 * The invite flow is intentionally kept apart from the normal login flow:
 *
 *     invite callback → invite session (memory-only) → set password
 *       → signOut(local) → /login → normal login → resolve role → dashboard
 *
 * It is NEVER treated as a normal authenticated login, and never auto-redirects
 * into a dashboard.
 */

/** Retrieve the session established by opening the invitation URL (memory-only). */
export async function getInviteSession() {
  return await inviteClient.auth.getSession()
}

/** Retrieve the invited user identity from the invite session. */
export async function getInviteUser() {
  return await inviteClient.auth.getUser()
}

/** Minimal, safe error mapping for the invite password-update step. */
function toAuthError(err: unknown): AuthError {
  const message = (err as { message?: string })?.message || 'Something went wrong. Please try again.'
  const msg = message.toLowerCase()

  if (msg.includes('weak password') || msg.includes('password is too short')) {
    return { source: 'auth', code: 'WEAK_PASSWORD', field: 'password', message: 'Password is too weak. Try a stronger one.' }
  }
  if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
    return { source: 'auth', code: 'EMAIL_NOT_VERIFIED', field: 'general', message: 'Please verify your email before signing in.' }
  }
  return { source: 'auth', code: 'UPDATE_FAILED', field: 'general', message }
}

/**
 * Set the invited educator's password using the authenticated-user API on the
 * isolated invite client. Mirrors `updatePassword` in authService but against
 * the invite client so the change is scoped to the throwaway invite session.
 */
export async function updateInvitePassword(newPassword: string): Promise<ServiceResult> {
  try {
    const validation = passwordSchema.safeParse(newPassword)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return {
        success: false,
        error: { source: 'auth', code: 'VALIDATION_ERROR', field: 'password', message: firstError.message },
      }
    }

    const { error } = await inviteClient.auth.updateUser({ password: newPassword })
    if (error) return { success: false, error: toAuthError(error) }
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: toAuthError(err) }
  }
}

/**
 * Tear down the throwaway invitation session. `scope: 'local'` clears ONLY this
 * client's (in-memory, nothing-persisted) invitation session — it can never
 * sign out the Normal app client of a different tab or the Admin.
 */
export async function endInviteSession(): Promise<void> {
  try {
    await inviteClient.auth.signOut({ scope: 'local' })
  } catch {
    // best-effort; the invite session is memory-only and will die with the tab
  }
}

/**
 * Subscribe to auth events on the isolated invite client. Used by the invitation
 * callback page to know when the invite session is established.
 */
export function onInviteStateChange(callback: (event: string, session: unknown) => void) {
  return inviteClient.auth.onAuthStateChange(callback)
}

/** Read a profile row for a user id (optionally the invited user). */
export async function getInviteProfile(userId: string) {
  const { data, error } = await inviteClient
    .from('users')
    .select('id, email, full_name, role, is_active, exam_selection')
    .eq('id', userId)
    .maybeSingle()
  if (error) return null
  return data
}