import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Question } from '../types/exam.types'

// ─── Mock all dependencies ─────────────────────────────────────────────────

vi.mock('../lib/repositories/question.repository', () => ({
  upsertQuestion: vi.fn(),
  upsertQuestionNoIgnore: vi.fn(),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(async () => {}),
  bulkDeleteQuestions: vi.fn(async () => {}),
  adminListQuestionsRpc: vi.fn(async () => ({ data: [], count: 0 })),
  countQuestionsByFilter: vi.fn(async () => 0),
  findVelocityReferencedQuestionIds: vi.fn(async () => []),
  deactivateQuestion: vi.fn(async () => {}),
}))

vi.mock('../lib/repositories/exam.repository', () => ({
  upsertTopic: vi.fn(),
  fetchTopicById: vi.fn(),
  fetchTopicsBySubject: vi.fn(),
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

// ─── Imports after mocking ─────────────────────────────────────────────────

import { adminQuestionService } from '../services/adminQuestionService'
import * as questionRepo from '../lib/repositories/question.repository'
import * as examRepo from '../lib/repositories/exam.repository'
import type { UserProfile } from '../types/auth.types'

const adminUser = { id: 'u1', role: 'admin' as const, email: 'admin@test.com', full_name: 'Admin', created_at: '', updated_at: '' } as unknown as UserProfile

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
const CANONICAL_TOPIC: {
  id: string
  exam_id: string
  paper_id: string
  subject_name: string
  topic_en: string
  topic_te: string | null
} = {
  id: 'e8c2f1a4-6b3d-4e5f-9a8b-1d2c3e4f5a6b',
  exam_id: 'APPSC_GROUP_1',
  paper_id: 'paper-1',
  subject_name: 'History',
  topic_en: 'Modern History',
  topic_te: 'ఆధునిక చరిత్ర',
}
const TOPIC_CTX = { user: adminUser, topicId: CANONICAL_TOPIC.id }

function mockCanonicalTopic(overrides: Partial<typeof CANONICAL_TOPIC> = {}) {
  vi.mocked(examRepo.fetchTopicById).mockResolvedValue({ ...CANONICAL_TOPIC, ...overrides } as any)
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('adminQuestionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // clearAllMocks keeps once-queues and implementations — a leftover
    // mockRejectedValueOnce from one test can poison the next. Reset the
    // insert mock fully; every test declares the behavior it needs.
    vi.mocked(questionRepo.upsertQuestionNoIgnore).mockReset()
    vi.mocked(examRepo.fetchTopicById).mockReset()
  })

  // ─── DEF-1: Topic registration BEFORE question insert ──────────────────────

  describe('DEF-1: createQuestion registers topic before insert', () => {
    it('calls registerTopicIfNeeded before upsertQuestion', async () => {
      vi.mocked(questionRepo.upsertQuestion).mockResolvedValue({ inserted: true } as any)
      vi.mocked(examRepo.upsertTopic).mockResolvedValue(undefined as any)

      const payload = makePayload()
      await adminQuestionService.createQuestion(payload, { user: adminUser })

      const topicCallOrder = vi.mocked(examRepo.upsertTopic).mock.invocationCallOrder[0]
      const insertCallOrder = vi.mocked(questionRepo.upsertQuestion).mock.invocationCallOrder[0]
      expect(topicCallOrder).toBeLessThan(insertCallOrder)
    })

    it('passes correct topic fields to upsertTopic', async () => {
      vi.mocked(questionRepo.upsertQuestion).mockResolvedValue({ inserted: true } as any)
      vi.mocked(examRepo.upsertTopic).mockResolvedValue(undefined as any)

      const payload = makePayload()
      await adminQuestionService.createQuestion(payload, { user: adminUser })

      expect(examRepo.upsertTopic).toHaveBeenCalledWith({
        exam_id: 'APPSC_GROUP_1',
        paper_id: 'paper-1',
        subject_name: 'History',
        topic_en: 'Modern History',
        topic_te: 'ఆధునిక చరిత్ర',
      })
    })

    it('skips topic registration when topic_en is empty', async () => {
      vi.mocked(questionRepo.upsertQuestion).mockResolvedValue({ inserted: true } as any)

      await adminQuestionService.createQuestion(makePayload({ topic_en: '' }), { user: adminUser })

      expect(examRepo.upsertTopic).not.toHaveBeenCalled()
    })
  })

  // ─── DEF-5: Explicit duplicate status ─────────────────────────────────────

  describe('DEF-5: createQuestion returns explicit status', () => {
    it('returns status=inserted when upsert inserts', async () => {
      vi.mocked(questionRepo.upsertQuestion).mockResolvedValue({ inserted: true } as any)

      const result = await adminQuestionService.createQuestion(makePayload(), { user: adminUser })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ status: 'inserted' })
    })

    it('returns status=duplicate when upsert does not insert', async () => {
      vi.mocked(questionRepo.upsertQuestion).mockResolvedValue({ inserted: false } as any)

      const result = await adminQuestionService.createQuestion(makePayload(), { user: adminUser })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ status: 'duplicate' })
    })
  })

  // ─── DEF-2: Topic registration BEFORE question update ──────────────────────

  describe('DEF-2: updateQuestion registers topic before update', () => {
    it('calls registerTopicIfNeeded before updateQuestion', async () => {
      vi.mocked(questionRepo.updateQuestion).mockResolvedValue(undefined as any)
      vi.mocked(examRepo.upsertTopic).mockResolvedValue(undefined as any)

      const payload = makePayload()
      await adminQuestionService.updateQuestion('q-123', payload, { user: adminUser })

      const topicCallOrder = vi.mocked(examRepo.upsertTopic).mock.invocationCallOrder[0]
      const updateCallOrder = vi.mocked(questionRepo.updateQuestion).mock.invocationCallOrder[0]
      expect(topicCallOrder).toBeLessThan(updateCallOrder)
    })

    it('passes target payload topic fields (not old record)', async () => {
      vi.mocked(questionRepo.updateQuestion).mockResolvedValue(undefined as any)
      vi.mocked(examRepo.upsertTopic).mockResolvedValue(undefined as any)

      const payload = makePayload({
        exam_id: 'APPSC_GROUP_2',
        paper_id: 'paper-new',
        subject_name: 'Geography',
        topic_en: 'Climate Zones',
        topic_te: 'శీతోష్ణస్థితి మండలాలు',
      })

      await adminQuestionService.updateQuestion('q-123', payload, { user: adminUser })

      expect(examRepo.upsertTopic).toHaveBeenCalledWith({
        exam_id: 'APPSC_GROUP_2',
        paper_id: 'paper-new',
        subject_name: 'Geography',
        topic_en: 'Climate Zones',
        topic_te: 'శీతోష్ణస్థితి మండలాలు',
      })
    })

    it('skips topic registration when topic_en is empty', async () => {
      vi.mocked(questionRepo.updateQuestion).mockResolvedValue(undefined as any)

      await adminQuestionService.updateQuestion('q-123', makePayload({ topic_en: '' }), { user: adminUser })

      expect(examRepo.upsertTopic).not.toHaveBeenCalled()
    })
  })

  // ─── STRICT REJECT: bulkInsertQuestions (FINAL DATA ARCHITECTURE) ──────────

  describe('bulkInsertQuestions — STRICT REJECT ingestion policy', () => {
    it('never auto-registers topics; the selected topic is the only authority', async () => {
      mockCanonicalTopic()
      vi.mocked(questionRepo.upsertQuestionNoIgnore).mockResolvedValue({ inserted: true })

      // Even an unknown topic name in the payload must NOT create catalog rows.
      const questions = [makePayload({ topic_en: 'Brand New Topic' })]
      await adminQuestionService.bulkInsertQuestions(questions, TOPIC_CTX)

      expect(examRepo.upsertTopic).not.toHaveBeenCalled()
      expect(questionRepo.upsertQuestionNoIgnore).not.toHaveBeenCalled()
      expect(examRepo.fetchTopicById).toHaveBeenCalledWith(CANONICAL_TOPIC.id)
    })

    it('rejects the whole chunk when ctx.topicId is missing', async () => {
      const result = await adminQuestionService.bulkInsertQuestions([makePayload()], { user: adminUser, topicId: '' })

      expect(result.success).toBe(false)
      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Select a topic')
      expect(questionRepo.upsertQuestionNoIgnore).not.toHaveBeenCalled()
    })

    it('rejects the whole chunk when the selected topic does not exist', async () => {
      vi.mocked(examRepo.fetchTopicById).mockResolvedValue(null as any)

      const result = await adminQuestionService.bulkInsertQuestions([makePayload()], TOPIC_CTX)

      expect(result.success).toBe(false)
      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('could not be found')
      expect(questionRepo.upsertQuestionNoIgnore).not.toHaveBeenCalled()
    })

    it('rejects rows whose segment (exam/paper/subject) differs from the topic (T7-T9)', async () => {
      mockCanonicalTopic()
      vi.mocked(questionRepo.upsertQuestionNoIgnore).mockResolvedValue({ inserted: true })

      const result = await adminQuestionService.bulkInsertQuestions([
        makePayload({ exam_id: 'APPSC_GROUP_2' }),   // cross-exam
        makePayload({ paper_id: 'paper-evil' }),     // cross-paper
        makePayload({ subject_name: 'Geography' }),  // cross-subject
      ], TOPIC_CTX)

      expect(result.data?.failed).toBe(3)
      expect(result.data?.failures.every(f => f.error.includes('does not belong'))).toBe(true)
      expect(questionRepo.upsertQuestionNoIgnore).not.toHaveBeenCalled()
    })

    it('rejects fabricated topic_en byte-exactly, including injection attempts (T1/T2)', async () => {
      mockCanonicalTopic()
      vi.mocked(questionRepo.upsertQuestionNoIgnore).mockResolvedValue({ inserted: true })

      const result = await adminQuestionService.bulkInsertQuestions([
        makePayload({ topic_en: 'Modern History ' }),                    // trailing space drift
        makePayload({ topic_en: 'Polity"; DROP TABLE exam_topics;--' }), // injection-shaped
        makePayload(),                                                   // exact canonical → allowed
      ], TOPIC_CTX)

      expect(result.data?.inserted).toBe(1)
      expect(result.data?.failed).toBe(2)
      expect(result.data?.failures[0].error).toContain('"Modern History"')
      expect(result.data?.failures[1].index).toBe(1)
    })

    it('rejects missing topic_en entirely (T4)', async () => {
      mockCanonicalTopic()
      vi.mocked(questionRepo.upsertQuestionNoIgnore).mockResolvedValue({ inserted: true })

      const result = await adminQuestionService.bulkInsertQuestions([makePayload({ topic_en: null })], TOPIC_CTX)

      expect(result.data?.failed).toBe(1)
      expect(result.data?.failures[0].error).toContain('Topic mismatch')
    })

    it('rejects fabricated Telugu for a null-canonical Telugu topic (T5)', async () => {
      mockCanonicalTopic({ topic_te: null })
      vi.mocked(questionRepo.upsertQuestionNoIgnore).mockResolvedValue({ inserted: true })

      const result = await adminQuestionService.bulkInsertQuestions([makePayload({ topic_te: 'కల్పిత తెలుగు' })], TOPIC_CTX)

      expect(result.data?.failed).toBe(1)
      expect(result.data?.failures[0].error).toContain('Telugu topic mismatch')
    })

    it('accepts absent/empty Telugu for a null-canonical Telugu topic (§42)', async () => {
      mockCanonicalTopic({ topic_te: null })
      vi.mocked(questionRepo.upsertQuestionNoIgnore)
        .mockResolvedValueOnce({ inserted: true })
        .mockResolvedValueOnce({ inserted: true })

      const result = await adminQuestionService.bulkInsertQuestions([
        makePayload({ topic_te: null }),
        makePayload({ topic_te: '' }),
      ], TOPIC_CTX)

      expect(result.success).toBe(true)
      expect(result.data?.inserted).toBe(2)
    })

    it('rejects wrong Telugu when a canonical Telugu exists (T6)', async () => {
      mockCanonicalTopic()
      vi.mocked(questionRepo.upsertQuestionNoIgnore).mockResolvedValue({ inserted: true })

      const result = await adminQuestionService.bulkInsertQuestions([makePayload({ topic_te: 'తేడా' })], TOPIC_CTX)

      expect(result.data?.failed).toBe(1)
      expect(result.data?.failures[0].error).toContain('ఆధునిక చరిత్ర')
    })

    it('aggregates results correctly (inserted + duplicated + failed) with validation failures (DEF-4/5)', async () => {
      mockCanonicalTopic()
      vi.mocked(questionRepo.upsertQuestionNoIgnore)
        .mockResolvedValueOnce({ inserted: true })
        .mockResolvedValueOnce({ inserted: false })
        .mockRejectedValueOnce(new Error('DB constraint violation'))

      const questions = [
        makePayload(),
        makePayload({ question_text_en: 'Second?' }),
        makePayload({ question_text_en: 'Third?', topic_en: 'Wrong' }),
      ]
      const result = await adminQuestionService.bulkInsertQuestions(questions, TOPIC_CTX)

      expect(result.data).toEqual({
        inserted: 1,
        duplicated: 1,
        failed: 1,
        failures: [{ index: 2, error: expect.stringContaining('Topic mismatch') }],
      })
    })

    it('failure on one row does not prevent subsequent inserts (DEF-4)', async () => {
      mockCanonicalTopic()
      vi.mocked(questionRepo.upsertQuestionNoIgnore)
        .mockRejectedValueOnce(new Error('Row 0 failed'))
        .mockResolvedValueOnce({ inserted: true })

      const questions = [makePayload(), makePayload({ question_text_en: 'Second?' })]
      const result = await adminQuestionService.bulkInsertQuestions(questions, TOPIC_CTX)

      expect(result.data?.inserted).toBe(1)
      expect(result.data?.failed).toBe(1)
      expect(result.data?.failures).toHaveLength(1)
    })

    it('returns success=true when all rows insert successfully', async () => {
      mockCanonicalTopic()
      vi.mocked(questionRepo.upsertQuestionNoIgnore).mockResolvedValue({ inserted: true })

      const result = await adminQuestionService.bulkInsertQuestions([makePayload()], TOPIC_CTX)

      expect(result.success).toBe(true)
      expect(result.data?.inserted).toBe(1)
      expect(result.data?.failed).toBe(0)
    })

    it('friendly failure when the authority lookup itself errors (no SQL leakage)', async () => {
      vi.mocked(examRepo.fetchTopicById).mockRejectedValue(new Error('PGRST301 JWT expired at row "secret_col"'))

      const result = await adminQuestionService.bulkInsertQuestions([makePayload()], TOPIC_CTX)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Could not verify the selected topic. Please try again.')
      expect(result.error?.message).not.toContain('JWT')
      expect(questionRepo.upsertQuestionNoIgnore).not.toHaveBeenCalled()
    })
  })

  // ─── TOPIC FILTER: listQuestions live-topic resolution ─────────────────────

  describe('listQuestions topic filter', () => {
    const listParams = (overrides: Partial<Parameters<typeof adminQuestionService.listQuestions>[0]> = {}): Parameters<typeof adminQuestionService.listQuestions>[0] => ({
      selectedExam: 'APPSC_GROUP_1',
      selectedPaper: 'paper-1',
      selectedSubject: 'History',
      selectedTopic: '',
      difficultyFilter: 'all',
      visualFilter: 'all',
      searchQuery: '',
      offset: 0,
      pageSize: 30,
      ...overrides,
    })

    beforeEach(() => {
      vi.mocked(questionRepo.adminListQuestionsRpc).mockResolvedValue({ data: [], count: 0 })
      vi.mocked(examRepo.fetchTopicsBySubject).mockReset()
    })

    it('no topic selected -> RPC receives a null p_topic_en (no topic filter)', async () => {
      const result = await adminQuestionService.listQuestions(listParams(), { user: adminUser })

      expect(result.success).toBe(true)
      expect(questionRepo.adminListQuestionsRpc).toHaveBeenCalledWith(expect.objectContaining({ selectedTopic: null }))
    })

    it('resolves a canonical UUID topic id to its live topic_en and scopes the RPC', async () => {
      mockCanonicalTopic()

      await adminQuestionService.listQuestions(listParams({ selectedTopic: CANONICAL_TOPIC.id }), { user: adminUser })

      expect(examRepo.fetchTopicById).toHaveBeenCalledWith(CANONICAL_TOPIC.id)
      expect(questionRepo.adminListQuestionsRpc).toHaveBeenCalledWith(
        expect.objectContaining({ selectedTopic: 'Modern History' }),
      )
    })

    it('rejects a topic whose paper segment differs from the selection', async () => {
      mockCanonicalTopic()

      const result = await adminQuestionService.listQuestions(
        listParams({ selectedTopic: CANONICAL_TOPIC.id, selectedPaper: 'paper-EVIL' }),
        { user: adminUser },
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('does not belong to this exam, paper and subject')
      expect(questionRepo.adminListQuestionsRpc).not.toHaveBeenCalled()
    })

    it('rejects a topic resolver miss (not present in live exam_topics)', async () => {
      vi.mocked(examRepo.fetchTopicById).mockResolvedValue(null as any)

      const result = await adminQuestionService.listQuestions(
        listParams({ selectedTopic: 'deadbeef-dead-beef-4bad-deadbeefdead' }),
        { user: adminUser },
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('could not be found')
      expect(questionRepo.adminListQuestionsRpc).not.toHaveBeenCalled()
    })

    it('friendly failure when the topic authority lookup errors (no SQL leakage)', async () => {
      vi.mocked(examRepo.fetchTopicById).mockRejectedValue(new Error('PGRST301 JWT expired at row "secret_col"'))

      const result = await adminQuestionService.listQuestions(
        listParams({ selectedTopic: CANONICAL_TOPIC.id }),
        { user: adminUser },
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Could not verify the selected topic. Please try again.')
      expect(result.error?.message).not.toContain('JWT')
      expect(questionRepo.adminListQuestionsRpc).not.toHaveBeenCalled()
    })

    it('passes through a legacy id-less topic name that IS verified in the segment topics', async () => {
      vi.mocked(examRepo.fetchTopicsBySubject).mockResolvedValue([
        { id: 't-legacy', topic_en: 'Legacy Topic', topic_te: null, display_order: 1 } as any,
      ])

      const result = await adminQuestionService.listQuestions(
        listParams({ selectedTopic: 'Legacy Topic' }),
        { user: adminUser },
      )

      expect(result.success).toBe(true)
      expect(examRepo.fetchTopicsBySubject).toHaveBeenCalledWith(
        ['APPSC_GROUP_1'], 'History', 'paper-1',
      )
      expect(questionRepo.adminListQuestionsRpc).toHaveBeenCalledWith(
        expect.objectContaining({ selectedTopic: 'Legacy Topic' }),
      )
    })

    it('rejects a legacy topic name that is NOT in the segment topics', async () => {
      vi.mocked(examRepo.fetchTopicsBySubject).mockResolvedValue([
        { id: 't1', topic_en: 'Real Topic', topic_te: null, display_order: 1 } as any,
      ])

      const result = await adminQuestionService.listQuestions(
        listParams({ selectedTopic: 'Fabricated Name' }),
        { user: adminUser },
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('could not be found')
      expect(questionRepo.adminListQuestionsRpc).not.toHaveBeenCalled()
    })

    it('rejects a legacy topic name when no concrete subject can validate it', async () => {
      const result = await adminQuestionService.listQuestions(
        listParams({ selectedSubject: 'all', selectedTopic: 'Suspicious Name' }),
        { user: adminUser },
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('does not belong to this exam, paper and subject')
      expect(questionRepo.adminListQuestionsRpc).not.toHaveBeenCalled()
    })
  })

  // ─── VISUAL FILTER: service → repository visualOnly mapping ───────────────

  describe('listQuestions visual filter mapping', () => {
    const listParams = (overrides: Partial<Parameters<typeof adminQuestionService.listQuestions>[0]> = {}): Parameters<typeof adminQuestionService.listQuestions>[0] => ({
      selectedExam: 'APPSC_GROUP_1',
      selectedPaper: 'paper-1',
      selectedSubject: 'History',
      selectedTopic: '',
      difficultyFilter: 'all',
      visualFilter: 'all',
      searchQuery: '',
      offset: 0,
      pageSize: 30,
      ...overrides,
    })

    beforeEach(() => {
      vi.mocked(questionRepo.adminListQuestionsRpc).mockResolvedValue({ data: [], count: 0 })
    })

    it('visualFilter "all" -> repository receives visualOnly:false', async () => {
      await adminQuestionService.listQuestions(listParams(), { user: adminUser })
      expect(questionRepo.adminListQuestionsRpc).toHaveBeenCalledWith(expect.objectContaining({ visualOnly: false }))
    })

    it('visualFilter "visuals" -> repository receives visualOnly:true', async () => {
      await adminQuestionService.listQuestions(
        listParams({ visualFilter: 'visuals' }),
        { user: adminUser },
      )
      expect(questionRepo.adminListQuestionsRpc).toHaveBeenCalledWith(expect.objectContaining({ visualOnly: true }))
    })

    it('visualFilter "visuals" AND a difficulty passed through (hook enforces exclusivity upstream)', async () => {
      await adminQuestionService.listQuestions(
        listParams({ difficultyFilter: 'hard', visualFilter: 'visuals' }),
        { user: adminUser },
      )
      expect(questionRepo.adminListQuestionsRpc).toHaveBeenCalledWith(expect.objectContaining({
        visualOnly: true,
        difficultyFilter: 'hard',
      }))
    })
  })
})
