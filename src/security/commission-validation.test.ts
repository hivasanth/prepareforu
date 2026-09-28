/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { subAdminOnboardSchema } from '../validations/authSchemas'
import { mapDomainError } from '../utils/errorClassification'

/* ─── Commission validation + domain-error mapping regression suite ─────────
 * Locks in the master commission business rules:
 *   - [0,100] inclusive, both bounds valid, decimals supported (≤2 places)
 *   - blank field is VALID (means default 0)
 *   - negative / >100 / non-numeric / >2-decimals are REJECTED (never clamped)
 *   - domain codes map to specific, actionable UX + any navigation target
 * ──────────────────────────────────────────────────────────────────────────- */

const schema = subAdminOnboardSchema

function commissionOk(value: string): boolean {
  const r = schema.safeParse({ name: 'Dr A', email: 'a@b.co', couponCode: 'ABC123', commissionPercentage: value })
  return r.success
}

function commissionErr(value: string): string | undefined {
  const r = schema.safeParse({ name: 'Dr A', email: 'a@b.co', couponCode: 'ABC123', commissionPercentage: value })
  if (r.success) return undefined
  return r.error.issues[0]?.message
}

describe('commission create-form validation (business rules)', () => {
  it('blank (optional, unset) is valid → defaults to 0', () => {
    expect(commissionOk('')).toBe(true)
    expect(commissionOk('   ')).toBe(true)
  })

  it('accepts 0 and 100 (inclusive bounds)', () => {
    expect(commissionOk('0')).toBe(true)
    expect(commissionOk('100')).toBe(true)
  })

  it('accepts integer and decimal in range', () => {
    expect(commissionOk('25')).toBe(true)
    expect(commissionOk('25.5')).toBe(true)
    expect(commissionOk('99.99')).toBe(true)
    expect(commissionOk('0.01')).toBe(true)
  })

  it('rejects out-of-range — never clamps', () => {
    expect(commissionOk('-1')).toBe(false)
    expect(commissionOk('100.01')).toBe(false)
    expect(commissionOk('101')).toBe(false)
    expect(commissionOk('999')).toBe(false)
  })

  it('rejects non-numeric and malformed input', () => {
    expect(commissionOk('abc')).toBe(false)
    expect(commissionOk('-')).toBe(false)
    expect(commissionOk('.')).toBe(false)
  })

  it('rejects more than 2 decimal places', () => {
    expect(commissionOk('25.123')).toBe(false)
  })

  it('surfaces the canonical out-of-range message on out-of-range commission', () => {
    expect(commissionErr('101')).toBe('Commission must be between 0 and 100')
    expect(commissionErr('100.01')).toBe('Commission must be between 0 and 100')
  })

  it('rejects malformed commission (surfaced generically by the union branch)', () => {
    expect(commissionOk('abc')).toBe(false)
    expect(commissionOk('-1')).toBe(false)
    expect(commissionOk('25.123')).toBe(false)
    expect(commissionOk('-1')).toBe(false)
    // The numeric-format message lives inside the union branch; the top-level
    // issue is the generic union message, so asserting exact text here would be
    // over-fitting. Rejection is the contract that matters.
    expect(commissionErr('abc')).toBe('Invalid input')
  })

  it('returns no message for valid commission', () => {
    expect(commissionErr('25')).toBeUndefined()
    expect(commissionErr('')).toBeUndefined()
  })
})

describe('mapDomainError — canonical domain UX', () => {
  it('maps UNAUTHENTICATED to an authentication error that navigates to /login', () => {
    const info = mapDomainError('UNAUTHENTICATED', 'Invalid session')
    expect(info.category).toBe('authentication')
    expect(info.navigateTo).toBe('/login')
    expect(info.retryable).toBe(false)
  })

  it('maps COUPON_TAKEN and EDUCATOR_EXISTS to non-retryable business errors', () => {
    expect(mapDomainError('COUPON_TAKEN', '').retryable).toBe(false)
    expect(mapDomainError('EDUCATOR_EXISTS', '').retryable).toBe(false)
    expect(mapDomainError('COUPON_TAKEN', '').category).toBe('business')
  })

  it('maps INVALID_COMMISSION and VALIDATION_FAILED to retryable validation errors', () => {
    const ci = mapDomainError('INVALID_COMMISSION', '')
    expect(ci.category).toBe('validation')
    expect(ci.retryable).toBe(true)
    const vf = mapDomainError('VALIDATION_FAILED', 'Some details are wrong')
    expect(vf.category).toBe('validation')
    expect(vf.retryable).toBe(true)
    expect(vf.message).toBe('Some details are wrong')
  })

  it('maps CONCURRENT_UPDATE_CONFLICT to a retryable stale-changes message', () => {
    const info = mapDomainError('CONCURRENT_UPDATE_CONFLICT', '')
    expect(info.retryable).toBe(true)
    expect(info.title).toBe('Stale Changes Detected')
  })

  it('maps transport status fallback for unknown codes (403 → authorization)', () => {
    const info = mapDomainError('SOME_UNKNOWN_CODE', 'denied', 403)
    expect(info.category).toBe('authorization')
    expect(info.code).toBe('UNKNOWN_DOMAIN')
  })

  it('case-insensitive: lowercased backend codes are normalized', () => {
    expect(mapDomainError('unauthorized', '').category).toBe('authorization')
  })
})
