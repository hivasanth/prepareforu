// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

/* ─────────────────────────────────────────────────────────────────────────────
   M2 — MANUAL ENTRY TOPIC AUTHORITY (canonical topic_id chain)

   Contract (remediation §14–§17):
     topicId → fetchTopicById → canonical exam/paper/subject/topic_en/topic_te
     - UI display strings are NEVER trusted as identity.
     - Cross-segment / missing topics are rejected BEFORE the question write.
     - No silent registerTopicIfNeeded on the canonical path.
     - Legacy path (no topicId) keeps DEF-1 registration for derived topics.
   ────────────────────────────────────────────────────────────────────────── */

const { supabaseMock } = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.from = vi.fn(() => chain)
  chain.select = vi.fn(async () => ({ data: [{ id: 'new-id' }], error: null }))
  return { supabaseMock: chain }
})

vi.mock('../lib/supabase', () => ({ supabase: supabaseMock }))

vi.mock('../lib/repositories/question.repository', () => ({
  upsertQuestion: vi.fn(async () => ({ inserted: true })),
  updateQuestion: vi.fn(async () => {}),
}))

vi.mock('../lib/repositories/exam.repository', () => ({
  upsertTopic: vi.fn(async () => {}),
  fetchTopicById: vi.fn(async () => null),
}))

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

import { adminQuestionService } from '../services/adminQuestionService'
import * as questionRepo from '../lib/repositories/question.repository'
import * as examRepo from '../lib/repositories/exam.repository'
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
    // UI-supplied display strings (drifted on purpose in the tests below).
    topic_en: 'Modern History ',
    topic_te: 'Stale Telugu Label',
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
  id: 'topic-uuid-m2',
  exam_id: 'APPSC_GROUP_1',
  paper_id: 'paper-1',
  subject_name: 'History',
  topic_en: 'Modern History',
  topic_te: 'ఆధునిక చరిత్ర',
}

beforeEach(() => {
  vi.mocked(questionRepo.upsertQuestion).mockReset()
  vi.mocked(questionRepo.upsertQuestion).mockResolvedValue({ inserted: true })
  vi.mocked(examRepo.upsertTopic).mockReset()
  vi.mocked(examRepo.fetchTopicById).mockReset()
})

describe('M2 — manual creation resolves identity through LIVE exam_topics', () => {
  it('valid topicId → canonical topic_en/topic_te are persisted, UI strings discarded', async () => {
    vi.mocked(examRepo.fetchTopicById).mockResolvedValue({ ...CANONICAL_TOPIC } as any)

    const result = await adminQuestionService.createQuestion(
      makePayload(), // drifted trailing-space EN + stale TE
      { requestId: 'req-m2', user: adminUser, topicId: CANONICAL_TOPIC.id }
    )

    expect(result.success).toBe(true)
    expect(vi.mocked(examRepo.fetchTopicById)).toHaveBeenCalledWith(CANONICAL_TOPIC.id)
    const written = vi.mocked(questionRepo.upsertQuestion).mock.calls[0][0] as Record<string, unknown>
    expect(written.topic_en).toBe('Modern History')
    expect(written.topic_te).toBe('ఆధునిక చరిత్ర')
  })

  it('valid topicId → NO silent topic registration (upsertTopic never called)', async () => {
    vi.mocked(examRepo.fetchTopicById).mockResolvedValue({ ...CANONICAL_TOPIC } as any)

    await adminQuestionService.createQuestion(
      makePayload({ topic_en: 'Brand New Topic From UI' }),
      { requestId: 'req-m2b', user: adminUser, topicId: CANONICAL_TOPIC.id }
    )

    expect(vi.mocked(examRepo.upsertTopic)).not.toHaveBeenCalled()
    const written = vi.mocked(questionRepo.upsertQuestion).mock.calls[0][0] as Record<string, unknown>
    expect(written.topic_en).toBe('Modern History') // fabricated name overwritten
  })

  it('nonexistent topicId → rejected BEFORE the write with a friendly message', async () => {
    vi.mocked(examRepo.fetchTopicById).mockResolvedValue(null as any)

    const result = await adminQuestionService.createQuestion(
      makePayload(),
      { requestId: 'req-m2c', user: adminUser, topicId: 'missing-topic' }
    )

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('could not be found')
    expect(vi.mocked(questionRepo.upsertQuestion)).not.toHaveBeenCalled()
    expect(vi.mocked(examRepo.upsertTopic)).not.toHaveBeenCalled()
  })

  it('cross-segment topicId → rejected BEFORE the write (no SQL leakage)', async () => {
    vi.mocked(examRepo.fetchTopicById).mockResolvedValue({
      ...CANONICAL_TOPIC,
      subject_name: 'Geography',
    } as any)

    const result = await adminQuestionService.createQuestion(
      makePayload(),
      { requestId: 'req-m2d', user: adminUser, topicId: CANONICAL_TOPIC.id }
    )

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('does not belong to this exam, paper and subject')
    expect(vi.mocked(questionRepo.upsertQuestion)).not.toHaveBeenCalled()
  })
})

describe('M2 — legacy non-canonical path preserved (id-less derived topics)', () => {
  it('without topicId, DEF-1 auto-registration still applies', async () => {
    await adminQuestionService.createQuestion(
      makePayload(),
      { requestId: 'req-m2e', user: adminUser }
    )

    expect(vi.mocked(examRepo.upsertTopic)).toHaveBeenCalled()
    expect(vi.mocked(questionRepo.upsertQuestion)).toHaveBeenCalled()
  })
})
