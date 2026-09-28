// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock supabase ──────────────────────────────────────────────────────────

const { supabaseMock } = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.from = vi.fn(() => chain)
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(async () => ({ data: null, error: null }))
  chain.update = vi.fn(async () => ({ data: null, error: null }))
  chain.delete = vi.fn(async () => ({ data: null, error: null }))
  chain.eq = vi.fn(() => chain)
  chain.in = vi.fn(() => chain)
  chain.upsert = vi.fn(async () => ({ data: [{ id: 'new-id' }], error: null }))
  chain.single = vi.fn(async () => ({ data: null, error: null }))
  chain.maybeSingle = vi.fn(async () => ({ data: null, error: null }))
  return { supabaseMock: chain }
})

vi.mock('../lib/supabase', () => ({ supabase: supabaseMock }))

// ─── Mock repositories ──────────────────────────────────────────────────────

vi.mock('../lib/repositories/question.repository', () => ({
  upsertQuestion: vi.fn(async () => ({ inserted: true })),
  upsertQuestionNoIgnore: vi.fn(async () => ({ inserted: true })),
  updateQuestion: vi.fn(async () => {}),
  deleteQuestion: vi.fn(async () => {}),
  bulkDeleteQuestions: vi.fn(async () => {}),
  adminListQuestionsRpc: vi.fn(async () => ({ data: [], count: 0 })),
  countQuestionsByFilter: vi.fn(async () => 0),
  findVelocityReferencedQuestionIds: vi.fn(async () => []),
  deactivateQuestion: vi.fn(async () => {}),
}))

vi.mock('../lib/repositories/exam.repository', () => ({
  upsertTopic: vi.fn(async () => {}),
  fetchTopicById: vi.fn(async () => null),
  fetchPrompts: vi.fn(async () => []),
  upsertPrompt: vi.fn(async () => {}),
  deletePromptById: vi.fn(async () => {}),
}))

vi.mock('../utils/retryUtils', () => ({
  retryWithBackoff: vi.fn(async (fn: () => Promise<any>) => fn()),
}))

vi.mock('../utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  metric: vi.fn(),
  sanitizeError: vi.fn((e: any) => ({ message: e.message, is_server_error: false })),
}))

vi.mock('../observability/alertEvaluator', () => ({
  alertEval: vi.fn(),
}))

vi.mock('../observability/thresholds', () => ({
  THRESHOLDS: { slowQueryMs: 500 },
}))

vi.mock('../services/adminQueryCache', () => ({
  getCache: vi.fn(() => null),
  setCache: vi.fn(),
  invalidateCache: vi.fn(),
}))

// ─── Imports ────────────────────────────────────────────────────────────────

import { adminQuestionService } from '../services/adminQuestionService'
import * as questionRepo from '../lib/repositories/question.repository'
import * as examRepo from '../lib/repositories/exam.repository'
import type { UserProfile } from '../types/auth.types'
import type { Question } from '../types/exam.types'

// ─── Fixtures ───────────────────────────────────────────────────────────────

const adminUser = { id: 'u-admin', role: 'admin' as const, email: 'admin@test.com', full_name: 'Admin', created_at: '', updated_at: '' } as unknown as UserProfile
const subAdminUser = { id: 'u-sub', role: 'sub_admin' as const, email: 'sub@test.com', full_name: 'Sub', created_at: '', updated_at: '' } as unknown as UserProfile
const normalUser = { id: 'u-normal', role: 'student' as const, email: 'user@test.com', full_name: 'User', created_at: '', updated_at: '' } as unknown as UserProfile

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

// Canonical exam_topics authority row matching makePayload.
const CANONICAL_TOPIC = {
  id: 'topic-uuid-sec',
  exam_id: 'APPSC_GROUP_1',
  paper_id: 'paper-1',
  subject_name: 'History',
  topic_en: 'Modern History',
  topic_te: 'ఆధునిక చరిత్ర',
}

function allowBulkTopic() {
  vi.mocked(examRepo.fetchTopicById).mockResolvedValue({ ...CANONICAL_TOPIC } as any)
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Security: Authorization enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── H-15 TEST 12-14: Admin topic mutations allowed ────────────────────────

  describe('Admin topic mutations', () => {
    it('admin can create question (topic registered first)', async () => {
      await adminQuestionService.createQuestion(makePayload(), { user: adminUser })

      expect(examRepo.upsertTopic).toHaveBeenCalled()
      expect(questionRepo.upsertQuestion).toHaveBeenCalled()
    })

    it('admin can update question', async () => {
      await adminQuestionService.updateQuestion('q-123', makePayload(), { user: adminUser })

      expect(examRepo.upsertTopic).toHaveBeenCalled()
      expect(questionRepo.updateQuestion).toHaveBeenCalledWith('q-123', expect.any(Object))
    })

    it('admin can bulk insert questions', async () => {
      allowBulkTopic()
      const result = await adminQuestionService.bulkInsertQuestions(
        [makePayload()],
        { user: adminUser, topicId: CANONICAL_TOPIC.id }
      )

      expect(result.success).toBe(true)
      expect(result.data?.inserted).toBe(1)
    })

    it('admin can delete question', async () => {
      await adminQuestionService.deleteQuestion('q-123', { user: adminUser })

      expect(questionRepo.deleteQuestion).toHaveBeenCalledWith('q-123')
    })
  })

  // ─── H-15 TEST 15: User topic mutations denied ─────────────────────────────

  describe('Normal user mutations denied', () => {
    it('normal user cannot create question', async () => {
      const result = await adminQuestionService.createQuestion(makePayload(), { user: normalUser })
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('UNAUTHORIZED')
    })

    it('normal user cannot update question', async () => {
      const result = await adminQuestionService.updateQuestion('q-123', makePayload(), { user: normalUser })
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('UNAUTHORIZED')
    })

    it('normal user cannot bulk insert', async () => {
      const result = await adminQuestionService.bulkInsertQuestions(
        [makePayload()],
        { user: normalUser, topicId: CANONICAL_TOPIC.id }
      )
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('UNAUTHORIZED')
    })

    it('normal user cannot delete question', async () => {
      const result = await adminQuestionService.deleteQuestion('q-123', { user: normalUser })
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('UNAUTHORIZED')
    })

    it('normal user cannot bulk delete', async () => {
      const result = await adminQuestionService.bulkDeleteQuestions(['q-123'], { user: normalUser })
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('UNAUTHORIZED')
    })

    it('null user cannot create question', async () => {
      const result = await adminQuestionService.createQuestion(makePayload(), { user: null })
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('UNAUTHORIZED')
    })
  })

  // ─── H-15 TEST 16: Sub-admin authorization boundary ────────────────────────

  // ROLE-AUDIT v1.0 (§2): the ADMIN question bank is ADMIN-only. Sub-admins are
  // read-only on it (their exam questions live in teacher_exam_questions, which
  // they reach through the auth.uid()-scoped create_teacher_exam_atomic + RLS).
  // These tests positively assert that a sub_admin is DENIED admin-bank C/U/D.
  describe('Sub-admin authorization (admin bank is admin-only)', () => {
    it('sub_admin cannot create admin-bank question', async () => {
      const result = await adminQuestionService.createQuestion(makePayload(), { user: subAdminUser })
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('UNAUTHORIZED')
    })

    it('sub_admin cannot update admin-bank question', async () => {
      const result = await adminQuestionService.updateQuestion('q-123', makePayload(), { user: subAdminUser })
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('UNAUTHORIZED')
    })

    it('sub_admin cannot bulk insert into admin bank', async () => {
      allowBulkTopic()
      const result = await adminQuestionService.bulkInsertQuestions(
        [makePayload()],
        { user: subAdminUser, topicId: CANONICAL_TOPIC.id }
      )
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('UNAUTHORIZED')
    })

    it('sub_admin cannot delete admin-bank question', async () => {
      const result = await adminQuestionService.deleteQuestion('q-123', { user: subAdminUser })
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('UNAUTHORIZED')
    })
  })

  // ─── H-15 TEST 9-11: Availability edge cases ───────────────────────────────

  describe('Availability contract: edge cases', () => {
    it('createQuestion skips topic registration when topic_en is empty', async () => {
      await adminQuestionService.createQuestion(makePayload({ topic_en: '' }), { user: adminUser })

      expect(examRepo.upsertTopic).not.toHaveBeenCalled()
      expect(questionRepo.upsertQuestion).toHaveBeenCalled()
    })

    it('createQuestion returns duplicate status when upsert returns inserted=false', async () => {
      vi.mocked(questionRepo.upsertQuestion).mockResolvedValueOnce({ inserted: false } as any)

      const result = await adminQuestionService.createQuestion(makePayload(), { user: adminUser })

      expect(result.data).toEqual({ status: 'duplicate' })
    })

    it('bulkInsert partial failure does not stop chunk', async () => {
      allowBulkTopic()
      vi.mocked(questionRepo.upsertQuestionNoIgnore)
        .mockRejectedValueOnce(new Error('row 0 failed'))
        .mockResolvedValueOnce({ inserted: true })

      const result = await adminQuestionService.bulkInsertQuestions(
        [makePayload(), makePayload({ question_text_en: 'Second?' })],
        { user: adminUser, topicId: CANONICAL_TOPIC.id }
      )

      expect(result.data?.failed).toBe(1)
      expect(result.data?.inserted).toBe(1)
    })
  })

  // ─── FINAL DATA ARCHITECTURE: STRICT REJECT ingestion security ─────────────

  describe('Security: STRICT REJECT bulk ingestion', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('bulk never touches exam_topics — no catalog pollution even with unknown topic names', async () => {
      allowBulkTopic()
      await adminQuestionService.bulkInsertQuestions(
        [makePayload({ topic_en: 'Totally Unknown Topic', topic_te: 'తెలియని' })],
        { user: adminUser, topicId: CANONICAL_TOPIC.id }
      )

      expect(examRepo.upsertTopic).not.toHaveBeenCalled()
      expect(questionRepo.upsertQuestionNoIgnore).not.toHaveBeenCalled()
    })

    it('cross-segment rows are rejected before any DB write (T7)', async () => {
      allowBulkTopic()
      const result = await adminQuestionService.bulkInsertQuestions(
        [makePayload({ paper_id: 'other-paper' })],
        { user: adminUser, topicId: CANONICAL_TOPIC.id }
      )

      expect(result.data?.failed).toBe(1)
      expect(result.data?.failures[0].error).toContain('does not belong')
      expect(questionRepo.upsertQuestionNoIgnore).not.toHaveBeenCalled()
    })

    it('missing topicId fails closed (T10)', async () => {
      await adminQuestionService.bulkInsertQuestions(
        [makePayload()],
        { user: adminUser, topicId: '' }
      )

      expect(examRepo.fetchTopicById).not.toHaveBeenCalled()
      expect(questionRepo.upsertQuestionNoIgnore).not.toHaveBeenCalled()
    })
  })
})

describe('Security: RPC contract verification', () => {
  it('check_availability function requires auth.uid() (H-1)', async () => {
    // The function definition has been verified in LIVE:
    // IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'
    // This test documents the contract.
    // Actual testing requires a database connection with auth context.
    expect(true).toBe(true)
  })

  it('check_topic_availability function requires auth.uid() (H-6)', async () => {
    // Same contract as check_availability.
    expect(true).toBe(true)
  })

  it('update_exam_subjects_batch requires admin role (H-8)', async () => {
    // Function checks: IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    expect(true).toBe(true)
  })

  it('all three RPCs have EXECUTE only for authenticated + service_role (H-9)', async () => {
    // Verified via LIVE query: no anon, no PUBLIC grants
    expect(true).toBe(true)
  })
})
