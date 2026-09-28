import { describe, it, expect, vi, beforeEach } from 'vitest'
import { examConfigSchema } from '../validations/securitySchemas'
import { toRpcQuestion, openExternalWindow, newQuestionClientId, MAX_QUESTIONS } from '../components/sub-admin/create/types'
import type { QuestionData } from '../components/sub-admin/create/types'
import { createTeacherExamAtomic } from '../services/teacherExamService'
import type { UserProfile } from '../types/auth.types'

interface CreateRpcParams {
  p_title: string
  p_sub_admin_id: string
  p_start_time: string
  p_end_time: string
  p_duration_minutes: number
  p_marks_per_question: number
  p_negative_mark_value: number
  p_source_type: string
  p_request_key: string
  p_questions: Array<Record<string, unknown>>
}

const { createRpcMock, fetchSubAdminMock } = vi.hoisted(() => {
  return {
    createRpcMock: vi.fn(async (_params: CreateRpcParams) => { void _params }),
    fetchSubAdminMock: vi.fn(async (_userId: string) => { void _userId; return { id: 'sub-admin-row-id' } }),
  }
})

vi.mock('../lib/repositories/teacherExam.repository', () => ({
  createTeacherExamAtomicRpc: createRpcMock,
  fetchSubAdminIdByUserId: fetchSubAdminMock,
}))

const baseQuestion: QuestionData = {
  client_id: 'client-ui-id-123',
  question_text_en: 'Capital of AP?',
  question_text_te: 'రాజధాని?',
  option_a_en: 'Visakhapatnam',
  option_b_en: 'Amaravati',
  option_c_en: 'Vijayawada',
  option_d_en: 'Kurnool',
  option_a_te: 'విశాఖ',
  correct_option: 'B',
  explanation_en: 'Amaravati is the capital.',
  explanation_te: 'అమరావతి',
  display_order: 1,
  difficulty: 'medium',
  diagram: null,
}

const user: UserProfile = {
  id: 'auth-user-id',
  role: 'sub_admin',
  sub_admin_id: 'sub-admin-row-id',
  educator_id: undefined,
} as unknown as UserProfile

beforeEach(() => {
  createRpcMock.mockClear()
  fetchSubAdminMock.mockClear()
})

describe('M3: client question identity is stripped before the RPC payload', () => {
  it('toRpcQuestion removes the transient client_id and keeps business fields', () => {
    const safe = toRpcQuestion(baseQuestion)
    expect('client_id' in safe).toBe(false)
    expect(safe.question_text_en).toBe('Capital of AP?')
    expect(safe.correct_option).toBe('B')
    expect(safe.display_order).toBe(1)
    expect(safe.question_text_te).toBe('రాజధాని?')
  })

  it('generates unique client ids', () => {
    expect(newQuestionClientId()).not.toBe(newQuestionClientId())
  })
})

describe('M1: popup blocking is a hard failure', () => {
  it('returns true when the popup actually opened', () => {
    const spy = vi.spyOn(window, 'open').mockReturnValue({} as Window)
    expect(openExternalWindow('https://example.com')).toBe(true)
    spy.mockRestore()
  })

  it('opens plain _blank (NO noopener/noreferrer feature string, which would force a null handle on success) and severs the opener on the returned handle', () => {
    const handle = {} as Window
    const spy = vi.spyOn(window, 'open').mockReturnValue(handle)
    expect(openExternalWindow('https://example.com')).toBe(true)
    // Two-arg call: no feature string, so the browser CAN return the window.
    expect(spy).toHaveBeenCalledWith('https://example.com', '_blank')
    expect(handle.opener).toBeNull()
    spy.mockRestore()
  })

  it('returns false when the popup is blocked (window.open -> null)', () => {
    const spy = vi.spyOn(window, 'open').mockReturnValue(null)
    expect(openExternalWindow('https://example.com')).toBe(false)
    spy.mockRestore()
  })

  it('returns false when window.open throws', () => {
    const spy = vi.spyOn(window, 'open').mockImplementation(() => { throw new Error('blocked') })
    expect(openExternalWindow('https://example.com')).toBe(false)
    spy.mockRestore()
  })
})

describe('W2: MAX_QUESTIONS is the single shared client cap', () => {
  it('is exactly the server H1 cap (100)', () => {
    expect(MAX_QUESTIONS).toBe(100)
  })
})

describe('CANONICAL: every question field sent to the RPC uses the snake_case contract', () => {
  const CANONICAL = new Set([
    'question_text_en', 'question_text_te',
    'option_a_en', 'option_a_te', 'option_b_en', 'option_b_te',
    'option_c_en', 'option_c_te', 'option_d_en', 'option_d_te',
    'correct_option', 'display_order',
    'explanation_en', 'explanation_te', 'difficulty', 'diagram',
  ])

  it('toRpcQuestion never emits a camelCase field', () => {
    const safe = toRpcQuestion(baseQuestion) as Record<string, unknown>
    for (const key of Object.keys(safe)) {
      expect(CANONICAL.has(key)).toBe(true)
      expect(key).not.toMatch(/[A-Z]/)
    }
  })

  it('the service payload question fields are all canonical snake_case', async () => {
    await createTeacherExamAtomic({ user }, {
      title: 'APPSC Group 1 Mock — Paper I',
      subAdminId: 'auth-user-id',
      startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 60,
      marksPerQuestion: 1,
      negativeMarkValue: 0,
      questions: [baseQuestion],
    })
    const q = createRpcMock.mock.calls[0][0].p_questions[0] as Record<string, unknown>
    for (const key of Object.keys(q)) {
      expect(CANONICAL.has(key)).toBe(true)
      expect(key).not.toMatch(/[A-Z]/)
    }
  })
})

describe('C3: request_key is cryptographically fresh per attempt (no accidental reuse)', () => {
  it('two sequential publishes get different keys >= 32 chars', async () => {
    const payload = {
      title: 'APPSC Group 1 Mock — Paper I',
      subAdminId: 'auth-user-id',
      startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 60,
      marksPerQuestion: 1,
      negativeMarkValue: 0,
      questions: [baseQuestion],
    }
    await createTeacherExamAtomic({ user }, payload)
    await createTeacherExamAtomic({ user }, payload)
    expect(createRpcMock).toHaveBeenCalledTimes(2)
    const k1 = createRpcMock.mock.calls[0][0].p_request_key as string
    const k2 = createRpcMock.mock.calls[1][0].p_request_key as string
    expect(k1.length).toBeGreaterThanOrEqual(32)
    expect(k2.length).toBeGreaterThanOrEqual(32)
    expect(k1).not.toBe(k2)
  })
})

describe('H1: marks-per-question parity (99.99 cap)', () => {
  const valid = () => ({
    title: 'APPSC Group 1 Mock — Paper I',
    start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 60,
    marks_per_question: 1,
    negative_mark_value: 0,
  })

  it('accepts 99.99 (the numeric(4,2) cap)', () => {
    const res = examConfigSchema.safeParse({ ...valid(), marks_per_question: 99.99 })
    expect(res.success).toBe(true)
  })

  it('rejects 100 (would overflow the numeric(4,2) column)', () => {
    const res = examConfigSchema.safeParse({ ...valid(), marks_per_question: 100 })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues.map(i => i.message).join()).toMatch(/99\.99/)
    }
  })

  it('rejects non-positive and non-finite values', () => {
    expect(examConfigSchema.safeParse({ ...valid(), marks_per_question: 0 }).success).toBe(false)
    expect(examConfigSchema.safeParse({ ...valid(), marks_per_question: -1 }).success).toBe(false)
    expect(examConfigSchema.safeParse({ ...valid(), marks_per_question: Number.NaN }).success).toBe(false)
    expect(examConfigSchema.safeParse({ ...valid(), marks_per_question: Infinity }).success).toBe(false)
  })
})

describe('C3/M2: request_key + source_type + client_id stripping through the service', () => {
  it('passes a request_key, source_type "text", resolved sub_admin id, and strips client_id', async () => {
    await createTeacherExamAtomic({ user }, {
      title: 'APPSC Group 1 Mock — Paper I',
      subAdminId: 'auth-user-id',
      startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 60,
      marksPerQuestion: 1,
      negativeMarkValue: 0,
      questions: [baseQuestion],
    })

    expect(fetchSubAdminMock).toHaveBeenCalledWith('auth-user-id')
    expect(createRpcMock).toHaveBeenCalledTimes(1)
    const params = createRpcMock.mock.calls[0][0]

    // p_sub_admin_id is the resolved sub_admins row id (NOT the raw auth user id)
    expect(params.p_sub_admin_id).toBe('sub-admin-row-id')
    expect(params.p_source_type).toBe('text')
    // A cryptographically-strong per-attempt idempotency key is present
    expect(typeof params.p_request_key).toBe('string')
    expect(params.p_request_key.length).toBeGreaterThanOrEqual(32)
    // Every question sent has client_id stripped
    expect(params.p_questions[0]).not.toHaveProperty('client_id')
    expect(params.p_questions[0].question_text_en).toBe('Capital of AP?')
  })
})
