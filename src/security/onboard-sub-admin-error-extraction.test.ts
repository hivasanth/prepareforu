// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock supabase ──────────────────────────────────────────────────────────
// Replicates the REAL supabase-js `functions.invoke` contract for a non-2xx:
//   { data: null, error: FunctionsHttpError, response: error.context }
// where FunctionsHttpError.message is the generic "non-2xx" string and the
// actual HTTP status + JSON body live on `.context` (also `response`).
const { invokeMock, supabaseMock } = vi.hoisted(() => {
  const invoke = vi.fn()
  return { invokeMock: invoke, supabaseMock: { functions: { invoke } } }
})
vi.mock('../lib/supabase', () => ({ supabase: supabaseMock }))

vi.mock('../utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

import { onboardSubAdmin } from '../services/userService'

function httpError(status: number, body: { error?: string; message?: string }) {
  const context = {
    status,
    json: async () => body,
  }
  const error = new Error('Edge Function returned a non-2xx status code') as Error & {
    context?: unknown
    name: string
  }
  error.name = 'FunctionsHttpError'
  error.context = context
  return { error, context }
}

describe('onboardSubAdmin — error extraction (master bug: "non-2xx" swallowed the real status/body)', () => {
  beforeEach(() => {
    invokeMock.mockReset()
  })

  it('surfaces the real backend `code` + `message` + `status` from the HTTP context', async () => {
    invokeMock.mockResolvedValue(httpError(503, {
      error: 'RATE_LIMIT_UNAVAILABLE',
      message: 'Security layer unavailable. Try again later.',
    }))
    const err = await onboardSubAdmin({
      email: 'a@b.co',
      fullName: 'Dr A',
      couponCode: 'ABC123',
      commissionPercentage: 20,
      requestId: '00000000-0000-4000-8000-000000000001',
    }).then(() => null, (e) => e) as Error & { code?: string; status?: number }

    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe('RATE_LIMIT_UNAVAILABLE')
    expect(err.status).toBe(503)
    expect(err.message).toBe('Security layer unavailable. Try again later.')
  })

  it('does NOT leak the generic "non-2xx" SDK message as the surface error', async () => {
    invokeMock.mockResolvedValue(httpError(400, {
      error: 'VALIDATION_FAILED',
      message: 'A valid request_id is required for provisioning.',
    }))
    const err = await onboardSubAdmin({
      email: 'a@b.co',
      fullName: 'Dr A',
      couponCode: 'ABC123',
      commissionPercentage: 20,
      requestId: 'not-a-uuid',
    }).then(() => null, (e) => e) as Error & { code?: string; status?: number }

    expect(err.message).toContain('request_id is required')
    expect(err.message).not.toContain('non-2xx')
    expect(err.code).toBe('VALIDATION_FAILED')
    expect(err.status).toBe(400)
  })

  it('falls back to a stable message when the body has no message, but keeps status', async () => {
    invokeMock.mockResolvedValue(httpError(500, { error: 'INTERNAL_ERROR' }))
    const err = await onboardSubAdmin({
      email: 'a@b.co',
      fullName: 'Dr A',
      couponCode: 'ABC123',
      commissionPercentage: 20,
      requestId: '00000000-0000-4000-8000-000000000002',
    }).then(() => null, (e) => e) as Error & { code?: string; status?: number }

    expect(err.code).toBe('INTERNAL_ERROR')
    expect(err.status).toBe(500)
    expect(err.message).toBeTruthy()
  })
})

describe('onboardSubAdmin — exact on-the-wire payload contract (idempotency key)', () => {
  beforeEach(() => {
    invokeMock.mockReset()
  })

  it('sends `request_id` (NOT `requestId`) as a strict UUID, plus email/full_name/coupon_code/commission_percentage', async () => {
    invokeMock.mockResolvedValue({ data: { success: true, sub_admin_id: 'sa-1' }, error: null })
    const requestId = '3f2b0a1e-9c7d-4f1e-8b2a-1a2b3c4d5e6f'
    await onboardSubAdmin({
      email: 'educator@example.com',
      fullName: 'Educator One',
      couponCode: 'SAVE20',
      commissionPercentage: 20,
      requestId,
    })

    const call = invokeMock.mock.calls[0]
    expect(call[0]).toBe('onboard-sub-admin')
    const body = call[1].body
    // Canonical contract — snake_case keys the Edge Function validates.
    expect(body).toMatchObject({
      email: 'educator@example.com',
      full_name: 'Educator One',
      coupon_code: 'SAVE20',
      commission_percentage: 20,
    })
    // request_id must exist, match the passed value, and be a valid UUID.
    expect(body.request_id).toBe(requestId)
    expect(body.request_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    // The camelCase key must never reach the wire (the Edge Function reads request_id).
    expect('requestId' in body).toBe(false)
  })

  it('passes commission_percentage = null for a blank commission (defaults to 0 server-side)', async () => {
    invokeMock.mockResolvedValue({ data: { success: true, sub_admin_id: 'sa-2' }, error: null })
    await onboardSubAdmin({
      email: 'educator2@example.com',
      fullName: 'Educator Two',
      couponCode: 'SAVE0',
      commissionPercentage: null,
      requestId: '7a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d',
    })
    const body = invokeMock.mock.calls[0][1].body
    expect(body.commission_percentage).toBeNull()
    expect(body.request_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  })
})

describe('INVITE_FAILED — invitation email failure surfaces the real backend code + actionable UX', () => {
  beforeEach(() => {
    invokeMock.mockReset()
  })

  it('surfaces the INVITE_FAILED code + 502 status from the edge function', async () => {
    invokeMock.mockResolvedValue(httpError(502, {
      error: 'INVITE_FAILED',
      message: 'Failed to send the invitation email.',
    }))
    const err = await onboardSubAdmin({
      email: 'educator@example.com',
      fullName: 'Educator One',
      couponCode: 'SAVE20',
      commissionPercentage: 20,
      requestId: '3f2b0a1e-9c7d-4f1e-8b2a-1a2b3c4d5e6f',
    }).then(() => null, (e) => e) as Error & { code?: string; status?: number }

    expect(err.code).toBe('INVITE_FAILED')
    expect(err.status).toBe(502)
    expect(err.message).toBe('Failed to send the invitation email.')
  })

  it('maps INVITE_FAILED to the canonical "Invitation Not Sent" UX (retryable, no raw internals)', async () => {
    const { mapDomainError } = await import('../utils/errorClassification')
    const info = mapDomainError('INVITE_FAILED', 'Failed to send the invitation email.', 502)
    expect(info.title).toBe('Invitation Not Sent')
    expect(info.message).toBe('We could not send the invitation email. Please try again shortly.')
    expect(info.retryable).toBe(true)
    expect(info.category).toBe('server')
    expect(info.code).toBe('INVITE_FAILED')
  })

  it('does not emit a generic Validation-Failed UX for an invite-failure backend code', async () => {
    const { mapDomainError } = await import('../utils/errorClassification')
    const info = mapDomainError('INVITE_FAILED', 'Failed to send the invitation email.', 502)
    expect(info.code).not.toBe('VALIDATION_FAILED')
    expect(info.title).not.toBe('Check Your Details')
  })
})
