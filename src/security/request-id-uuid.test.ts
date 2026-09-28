import { describe, it, expect } from 'vitest'
import { newRequestId } from '../utils/uuid'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

describe('request-id idempotency key (RFC-4122 UUID v4)', () => {
  it('always returns a valid UUID format accepted by the edge function UUID_RE', () => {
    for (let i = 0; i < 200; i++) {
      expect(newRequestId()).toMatch(UUID_RE)
    }
  })

  it('is a version-4 / variant UUID (4xxx / 8xy - 0x8-0xb Node)', () => {
    const id = newRequestId()
    const [, , v, varPart] = id.split('-')
    expect(v.startsWith('4')).toBe(true)
    expect('89abAB'.includes(varPart[0])).toBe(true)
  })

  it('produces distinct values across calls (idempotency key uniqueness)', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 2000; i++) seen.add(newRequestId())
    expect(seen.size).toBe(2000)
  })

  it('produces a valid UUID even when crypto.randomUUID is unavailable (the root-cause fallback path)', () => {
    const original = (globalThis as { crypto?: Crypto }).crypto
    try {
      // Simulate a non-secure / older runtime without randomUUID.
      Object.defineProperty(globalThis, 'crypto', {
        value: { randomUUID: undefined },
        configurable: true,
        writable: true,
      })
      for (let i = 0; i < 200; i++) {
        expect(newRequestId()).toMatch(UUID_RE)
      }
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: original,
        configurable: true,
        writable: true,
      })
    }
  })
})
