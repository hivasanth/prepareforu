// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

/* ─────────────────────────────────────────────────────────────────────────────
   M1 — BULK DUPLICATE SEMANTICS (Option A: true duplicate detection)

   Chosen contract (documented in question.repository.ts):
     - A content_hash conflict NEVER overwrites the stored question.
     - ignoreDuplicates:true (ON CONFLICT DO NOTHING) is the supported
       PostgREST primitive used to distinguish insert vs duplicate.
     - inserted:false ⇒ duplicate ⇒ service counts duplicated++ and reports.

   Covered cases (remediation §12):
     1. new question        → inserted:true
     2. exact duplicate     → not overwritten, { inserted:false }
     3. mixed batch         → service aggregates inserted/duplicated/failed
     4. retry               → second pass still no overwrite (idempotent)
   ────────────────────────────────────────────────────────────────────────── */

const { supabaseMock } = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.from = vi.fn(() => chain)
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(async () => ({ data: null, error: null }))
  chain.update = vi.fn(async () => ({ data: null, error: null }))
  chain.delete = vi.fn(async () => ({ data: null, error: null }))
  chain.eq = vi.fn(() => chain)
  chain.in = vi.fn(() => chain)
  // supabase-js builder: .upsert(...) is sync (returns the builder); the
  // awaited terminal is .select('id') — configurable per test.
  chain.upsert = vi.fn(() => chain)
  chain.select = vi.fn(async () => ({ data: [{ id: 'new-id' }], error: null }))
  return { supabaseMock: chain }
})

vi.mock('../lib/supabase', () => ({ supabase: supabaseMock }))

vi.mock('../utils/retryUtils', () => ({
  retryWithBackoff: vi.fn(async (fn: () => Promise<any>) => fn()),
}))

vi.mock('../utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  metric: vi.fn(),
  sanitizeError: vi.fn((e: any) => ({ message: e?.message, is_server_error: false })),
}))

vi.mock('../observability/alertEvaluator', () => ({ alertEval: vi.fn() }))
vi.mock('../observability/thresholds', () => ({ THRESHOLDS: { slowQueryMs: 500 } }))

vi.mock('../services/adminQueryCache', () => ({
  getCache: vi.fn(() => null),
  setCache: vi.fn(),
  invalidateCache: vi.fn(),
}))

vi.mock('../lib/repositories/exam.repository', () => ({
  upsertTopic: vi.fn(async () => {}),
  fetchTopicById: vi.fn(async () => null),
  fetchPrompts: vi.fn(async () => []),
  upsertPrompt: vi.fn(async () => {}),
  deletePromptById: vi.fn(async () => {}),
}))

import * as questionRepo from '../lib/repositories/question.repository'
import * as examRepo from '../lib/repositories/exam.repository'
import { adminQuestionService } from '../services/adminQuestionService'
import type { UserProfile } from '../types/auth.types'
import type { Question } from '../types/exam.types'

const adminUser = {
  id: 'u-admin', role: 'admin' as const, email: 'admin@test.com',
  full_name: 'Admin', created_at: '', updated_at: '',
} as unknown as UserProfile

function makePayload(overrides: Partial<Question> = {}): Partial<Question> {
  return {
    exam_id: 'APPSC_GROUP_1',
    paper_id: 'paper-1',
    subject_name: 'History',
    topic_en: 'Modern History',
    topic_te: 'ఆధునిక చరిత్ర',
    question_text_en: 'Who was the first PM?',
    option_a_en: 'Nehru',
    option_b_en: 'Gandhi',
    option_c_en: 'Patel',
    option_d_en: 'Roy',
    correct_option: 'A',
    difficulty: 'easy',
    ...overrides,
  }
}

const CANONICAL_TOPIC = {
  id: 'topic-uuid-m1',
  exam_id: 'APPSC_GROUP_1',
  paper_id: 'paper-1',
  subject_name: 'History',
  topic_en: 'Modern History',
  topic_te: 'ఆధునిక చరిత్ర',
}

const TOPIC_CTX = { requestId: 'req-m1', user: adminUser, topicId: CANONICAL_TOPIC.id }

beforeEach(() => {
  vi.mocked(examRepo.fetchTopicById).mockReset()
  vi.mocked(examRepo.fetchTopicById).mockResolvedValue({ ...CANONICAL_TOPIC } as any)
  supabaseMock.update.mockClear()
  supabaseMock.upsert.mockClear()
  supabaseMock.select.mockReset()
  supabaseMock.select.mockImplementation(async (_columns?: unknown) => ({
    data: [{ id: 'new-id' }],
    error: null,
  }))
})

describe('M1 — repository conflict semantics (no silent overwrite)', () => {
  it('CASE 1 — new row returns rows → { inserted: true }, with ignoreDuplicates:true', async () => {
    let capturedOptions: unknown
    supabaseMock.upsert.mockImplementationOnce((_payload: unknown, options: unknown) => {
      capturedOptions = options
      return supabaseMock
    })
    supabaseMock.select.mockImplementationOnce(async () => ({
      data: [{ id: 'inserted-1' }],
      error: null,
    }))

    const result = await questionRepo.upsertQuestionNoIgnore(makePayload() as Record<string, unknown>)

    expect(result.inserted).toBe(true)
    expect(capturedOptions).toMatchObject({ onConflict: 'content_hash', ignoreDuplicates: true })
  })

  it('CASE 2 — exact duplicate (conflict → empty result) is NOT overwritten → { inserted: false }', async () => {
    supabaseMock.select.mockImplementationOnce(async () => ({
      // ON CONFLICT DO NOTHING returns nothing for conflicting rows.
      data: [],
      error: null,
    }))

    const result = await questionRepo.upsertQuestionNoIgnore(makePayload() as Record<string, unknown>)

    expect(result.inserted).toBe(false)
    expect(supabaseMock.update).not.toHaveBeenCalled()
  })

  it('CASE 3 — surfaces DB errors instead of fabricating success', async () => {
    supabaseMock.select.mockImplementationOnce(async () => ({
      data: null,
      error: { message: 'permission denied', code: '42501' },
    }))

    await expect(
      questionRepo.upsertQuestionNoIgnore(makePayload() as Record<string, unknown>)
    ).rejects.toThrow('permission denied')
  })
})

describe('M1 — bulk sync duplicate accounting (service layer)', () => {
  it('mixed batch reports new vs duplicate accurately and never updates rows', async () => {
    supabaseMock.select
      .mockImplementationOnce(async () => ({ data: [{ id: 'a' }], error: null })) // new
      .mockImplementationOnce(async () => ({ data: [], error: null }))            // duplicate

    const result = await adminQuestionService.bulkInsertQuestions(
      [makePayload(), makePayload({ question_text_en: 'Second question?' })],
      TOPIC_CTX
    )

    expect(result.success).toBe(true)
    expect(result.data?.inserted).toBe(1)
    expect(result.data?.duplicated).toBe(1)
    expect(supabaseMock.update).not.toHaveBeenCalled()
  })

  it('retry of the same batch stays non-destructive: duplicates counted, nothing overwritten', async () => {
    // Pass 1 — all new.
    supabaseMock.select
      .mockImplementationOnce(async () => ({ data: [{ id: 'x1' }], error: null }))
      .mockImplementationOnce(async () => ({ data: [{ id: 'x2' }], error: null }))
    const first = await adminQuestionService.bulkInsertQuestions(
      [makePayload(), makePayload({ question_text_en: 'Second?' })],
      TOPIC_CTX
    )
    expect(first.data?.inserted).toBe(2)

    // Pass 2 (simulated retry after partial failure) — same content hashes now exist.
    supabaseMock.select
      .mockImplementationOnce(async () => ({ data: [], error: null }))
      .mockImplementationOnce(async () => ({ data: [], error: null }))
    const second = await adminQuestionService.bulkInsertQuestions(
      [makePayload(), makePayload({ question_text_en: 'Second?' })],
      TOPIC_CTX
    )

    expect(second.data?.inserted).toBe(0)
    expect(second.data?.duplicated).toBe(2)
    expect(second.success).toBe(true)
    expect(supabaseMock.update).not.toHaveBeenCalled()
  })
})
