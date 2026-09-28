/**
 * Canonical RFC-4122 UUID v4 generator.
 *
 * The onboarding idempotency `request_id` is validated SERVER-SIDE against a
 * strict UUID format (`UUID_RE` in the edge function). A non-UUID fallback —
 * e.g. the previous `Date.now()-random` string — is deterministically rejected
 * with "A valid request_id is required for provisioning.".
 *
 * This generator ALWAYS returns a valid UUID v4 (a 36-char
 * `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` string): it prefers the platform
 * `crypto.randomUUID()` when available (secure contexts / modern browsers) and
 * otherwise falls back to a hand-rolled RFC-4122 v4 value using the same
 * collision-resistant Math.random entropy the project already relies on in
 * fallback paths. It is the SINGLE canonical request-id source so the
 * on-the-wire value is never a malformed UUID.
 */
export function newRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // RFC-4122 v4 fallback — ALWAYS a valid UUID format (the edge function's
  // UUID_RE accepts it). Not a Date.now-based token (which is NOT a UUID).
  const rnd = (n: number) => Math.floor(Math.random() * n)
  return (
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = rnd(16)
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  )
}
