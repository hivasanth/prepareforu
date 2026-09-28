import { describe, it, expect, afterEach } from 'vitest'
import { sha256 } from 'js-sha256'
import { generateQuestionHash, sha256Hex } from './hashUtils'

const base = {
  question_text_en: 'What is the capital of France?',
  option_a_en: 'London',
  option_b_en: 'Paris',
  option_c_en: 'Berlin',
  option_d_en: 'Madrid',
  correct_option: 'B',
  exam_id: 'APPSC_GROUP_1',
}

describe('generateQuestionHash', () => {
  it('returns a 64-char hex string', async () => {
    const hash = await generateQuestionHash(base)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is deterministic for same input', async () => {
    const h1 = await generateQuestionHash(base)
    const h2 = await generateQuestionHash(base)
    expect(h1).toBe(h2)
  })

  it('differs when paper_id changes (DEF-3)', async () => {
    const h1 = await generateQuestionHash({ ...base, paper_id: 'paper-A' })
    const h2 = await generateQuestionHash({ ...base, paper_id: 'paper-B' })
    expect(h1).not.toBe(h2)
  })

  it('differs when subject_name changes (DEF-3)', async () => {
    const h1 = await generateQuestionHash({ ...base, subject_name: 'History' })
    const h2 = await generateQuestionHash({ ...base, subject_name: 'Geography' })
    expect(h1).not.toBe(h2)
  })

  it('same hash when paper_id and subject_name are both null', async () => {
    const h1 = await generateQuestionHash({ ...base, paper_id: null, subject_name: null })
    const h2 = await generateQuestionHash({ ...base, paper_id: null, subject_name: null })
    expect(h1).toBe(h2)
  })

  it('differs when question text differs', async () => {
    const h1 = await generateQuestionHash(base)
    const h2 = await generateQuestionHash({ ...base, question_text_en: 'What is the capital of Germany?' })
    expect(h1).not.toBe(h2)
  })

  it('differs when correct_option differs', async () => {
    const h1 = await generateQuestionHash(base)
    const h2 = await generateQuestionHash({ ...base, correct_option: 'A' })
    expect(h1).not.toBe(h2)
  })

  it('is case-insensitive after normalization', async () => {
    const h1 = await generateQuestionHash(base)
    const h2 = await generateQuestionHash({
      ...base,
      question_text_en: '  WHAT IS THE CAPITAL OF FRANCE?  ',
      option_a_en: 'london',
    })
    expect(h1).toBe(h2)
  })

  it('collapses whitespace during normalization', async () => {
    const h1 = await generateQuestionHash(base)
    const h2 = await generateQuestionHash({
      ...base,
      question_text_en: 'What   is   the   capital   of   France?',
    })
    expect(h1).toBe(h2)
  })

  it('same question in different exam contexts produces different hash', async () => {
    const h1 = await generateQuestionHash({ ...base, exam_id: 'APPSC_GROUP_1' })
    const h2 = await generateQuestionHash({ ...base, exam_id: 'APPSC_GROUP_2' })
    expect(h1).not.toBe(h2)
  })

  it('undefined optional fields produce same hash as null', async () => {
    const h1 = await generateQuestionHash({ ...base, paper_id: undefined, subject_name: undefined })
    const h2 = await generateQuestionHash({ ...base, paper_id: null, subject_name: null })
    expect(h1).toBe(h2)
  })

  it('same question in different topics produces different hash (M-06)', async () => {
    const h1 = await generateQuestionHash({ ...base, topic_en: 'Rivers of India' })
    const h2 = await generateQuestionHash({ ...base, topic_en: 'Geography' })
    expect(h1).not.toBe(h2)
  })

  it('same topic is deterministic (M-06)', async () => {
    const h1 = await generateQuestionHash({ ...base, topic_en: 'Rivers of India' })
    const h2 = await generateQuestionHash({ ...base, topic_en: 'Rivers of India' })
    expect(h1).toBe(h2)
  })
})

// ─── sha256Hex — Web Crypto preferred, js-sha256 fallback on non-secure origins ─
// LAN-ORIGIN FIX: hashing must be byte-identical on plain-HTTP LAN addresses
// where crypto.subtle is absent. These tests pin that BOTH paths produce the
// exact same lowercase hex digest as the vetted reference implementation.

const realCrypto = globalThis.crypto

const DIGEST_INPUTS = [
  '',
  'hello',
  'What is the capital of France?',
  'తెలుగు పరీక్ష model scripting పరీక్ష',
  '🚀 emoji 🌟 unicode',
  'a'.repeat(100_000),
  '!@#$%^&*()_+|~<>?,./:;"\'\\{}[]=-  spaces  👨\u200d💻',
]

function forceNoWebCrypto<T>(fn: () => Promise<T>): Promise<T> {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: { subtle: undefined } as unknown as typeof realCrypto,
  })
  return fn().finally(() => {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: realCrypto })
  })
}

afterEach(() => {
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: realCrypto })
})

describe('sha256Hex — Web Crypto and js-sha256 fallback are interchangeable', () => {
  it.each(DIGEST_INPUTS)('primary path matches the js-sha256 reference for %j', async (input) => {
    expect(await sha256Hex(input)).toBe(sha256(input))
  })

  it.each(DIGEST_INPUTS)('forced fallback (no crypto.subtle) matches the reference for %j', async (input) => {
    await expect(forceNoWebCrypto(() => sha256Hex(input))).resolves.toBe(sha256(input))
  })

  it.each(DIGEST_INPUTS)('fallback and primary digests are identical for %j', async (input) => {
    const fallbackDigest = await forceNoWebCrypto(() => sha256Hex(input))
    const primaryDigest = await sha256Hex(input)
    expect(fallbackDigest).toBe(primaryDigest)
  })

  it('falls back when the Web Crypto digest call itself rejects', async () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        subtle: {
          digest: async () => { throw new DOMException('not supported', 'OperationError') },
        },
      },
    })
    await expect(sha256Hex('reject-then-fallback')).resolves.toBe(sha256('reject-then-fallback'))
  })

  it('resolves a 64-char lowercase hex digest on the fallback path', async () => {
    await expect(forceNoWebCrypto(() => sha256Hex(base.question_text_en)))
      .resolves.toMatch(/^[a-f0-9]{64}$/)
  })
})
