// @vitest-environment node
/// <reference types="node" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock supabase ──────────────────────────────────────────────────────────
// H-1 contract: teacher-exam question delivery MUST go through the SECURITY
// DEFINER RPCs, never a direct REST table read. `from()` must never be called
// for teacher_exam_questions (the student RLS SELECT policy is dropped, and a
// table read would silently return zero rows — or, if a policy regresses,
// leak the answer columns).

const supabaseMock = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    rpc: vi.fn(async () => ({ data: [], error: null })),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(async () => ({ data: [], error: null })),
        })),
      })),
    })),
  }
  return chain
})

vi.mock('../lib/supabase', () => ({ supabase: supabaseMock }))

import {
  fetchTeacherExamQuestions,
  fetchTeacherExamReviewQuestionsRpc,
  fetchTeacherExamLeaderboardRpc,
} from '../lib/repositories/teacherExam.repository'

beforeEach(() => {
  vi.clearAllMocks()
  supabaseMock.rpc.mockResolvedValue({ data: [], error: null })
})

describe('H-1: fetchTeacherExamQuestions is RPC-only (no direct REST read)', () => {
  it('calls get_teacher_exam_questions with the correct RPC contract', async () => {
    const rows = [{ id: 'Q1', question_text_en: 'What is 2+2?' }]
    supabaseMock.rpc.mockResolvedValueOnce({ data: rows, error: null })

    const out = await fetchTeacherExamQuestions('EXAM_1')

    expect(supabaseMock.rpc).toHaveBeenCalledWith('get_teacher_exam_questions', {
      p_teacher_exam_id: 'EXAM_1',
    })
    expect(out).toBe(rows)
  })

  it('NEVER reads teacher_exam_questions through the REST table API', async () => {
    await fetchTeacherExamQuestions('EXAM_1')
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it('propagates RPC errors instead of swallowing them', async () => {
    supabaseMock.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'UNAUTHORIZED_ACCESS' },
    })
    await expect(fetchTeacherExamQuestions('oops')).rejects.toMatchObject({
      message: 'UNAUTHORIZED_ACCESS',
    })
  })

  it('rethrows transport rejections', async () => {
    supabaseMock.rpc.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(fetchTeacherExamQuestions('EXAM_1')).rejects.toThrow('Failed to fetch')
  })
})

describe('H-1: fetchTeacherExamReviewQuestionsRpc (post-exam answer restore)', () => {
  it('calls get_teacher_exam_review_questions with the attempt id', async () => {
    const rows = [{ id: 'Q1', correct_option: 'A', explanation_en: '…' }]
    supabaseMock.rpc.mockResolvedValueOnce({ data: rows, error: null })

    const out = await fetchTeacherExamReviewQuestionsRpc('ATTEMPT_1')

    expect(supabaseMock.rpc).toHaveBeenCalledWith('get_teacher_exam_review_questions', {
      p_attempt_id: 'ATTEMPT_1',
    })
    expect(out).toBe(rows)
  })

  it('returns [] when the RPC returns null data', async () => {
    supabaseMock.rpc.mockResolvedValueOnce({ data: null, error: null })
    await expect(fetchTeacherExamReviewQuestionsRpc('ATTEMPT_1')).resolves.toBeNull()
  })
})

describe('M-1: fetchTeacherExamLeaderboardRpc is RPC-based', () => {
  it('calls get_teacher_exam_leaderboard with the exam id and returns typed rows', async () => {
    const rows = [{ rank: 1, name: 'Ada', score: 90, accuracy: 0.9, duration_seconds: 120 }]
    supabaseMock.rpc.mockResolvedValueOnce({ data: rows, error: null })

    const out = await fetchTeacherExamLeaderboardRpc('EXAM_1')

    expect(supabaseMock.rpc).toHaveBeenCalledWith('get_teacher_exam_leaderboard', {
      p_teacher_exam_id: 'EXAM_1',
    })
    expect(out?.[0]).toMatchObject({ rank: 1, name: 'Ada', score: 90, accuracy: 0.9 })
  })
})