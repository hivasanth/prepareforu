// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock supabase ──────────────────────────────────────────────────────────
// `supabase.rpc()` returns a request object that is awaitable to
// `{ data, error }` and exposes an `.abortSignal(signal)` chain when called.
type RpcRequest<T> = Promise<{ data: T; error: unknown }> & {
  abortSignal(signal?: AbortSignal): RpcRequest<T>
}

const { rpcMock, supabaseMock } = vi.hoisted(() => {
  const rpc = vi.fn(() => {
    const req = Promise.resolve({ data: 'session-123' as string, error: null }) as RpcRequest<string>
    req.abortSignal = () => req
    return req
  })
  return { rpcMock: rpc, supabaseMock: { rpc } }
})
vi.mock('../lib/supabase', () => ({ supabase: supabaseMock }))

import { recordPracticeSession } from './prepareWriteService'
import { recordPracticeSessionRpc } from '../lib/repositories/attempt.repository'
import type { Question } from '../types/exam.types'

function makeQuestion(id: string, correct_option = 'B'): Question {
  return {
    id,
    question_text_en: `Question ${id}`,
    option_a_en: 'A',
    option_b_en: 'B',
    option_c_en: 'C',
    option_d_en: 'D',
    correct_option,
    exam_id: 'APPSC_GROUP_1',
    paper_id: 'paper-1',
    subject_name: 'History',
    topic_en: 'Ancient',
  } as Question
}

interface RecordPracticeSessionArgs {
  p_exam_id: string | null
  p_paper_id: string | null
  p_question_count: number
  p_answered_count: number
  p_correct_count: number
  p_duration_seconds: number | null
}

function lastRecordArgs(): RecordPracticeSessionArgs {
  const calls = rpcMock.mock.calls as unknown as [string, RecordPracticeSessionArgs][]
  return calls[calls.length - 1][1]
}

describe('recordPracticeSession (L-01 service)', () => {
  beforeEach(() => {
    rpcMock.mockClear()
  })

  it('computes answered_count and correct_count from questions + answers and posts the audit record', async () => {
    const questions = [makeQuestion('q1', 'B'), makeQuestion('q2', 'A'), makeQuestion('q3', 'D')]
    const answers = { q1: 'B', q2: 'C', q3: 'D' } // q1 correct (B), q2 wrong (C vs A), q3 correct (D)

    const id = await recordPracticeSession({
      examId: 'APPSC_GROUP_1',
      paperId: 'paper-1',
      questions,
      answers: answers as Record<string, 'A' | 'B' | 'C' | 'D' | null>,
      durationSeconds: 90,
    })

    expect(id).toBe('session-123')
    expect(rpcMock).toHaveBeenCalledTimes(1)
    expect(lastRecordArgs()).toEqual({
      p_exam_id: 'APPSC_GROUP_1',
      p_paper_id: 'paper-1',
      p_question_count: 3,
      p_answered_count: 3,
      p_correct_count: 2,
      p_duration_seconds: 90,
    })
  })

  it('counts only answered questions (skips unanswered)', async () => {
    const questions = [makeQuestion('q1', 'B'), makeQuestion('q2', 'A')]
    const answers = { q1: 'B' } // q2 unanswered

    await recordPracticeSession({
      examId: null,
      paperId: null,
      questions,
      answers: answers as Record<string, 'A' | 'B' | 'C' | 'D' | null>,
      durationSeconds: null,
    })

    const args = lastRecordArgs()
    expect(args.p_answered_count).toBe(1)
    expect(args.p_correct_count).toBe(1)
    expect(args.p_question_count).toBe(2)
    expect(args.p_exam_id).toBeNull()
    expect(args.p_paper_id).toBeNull()
    expect(args.p_duration_seconds).toBeNull()
  })

  it('zero questions posts zero counts', async () => {
    await recordPracticeSession({
      questions: [],
      answers: {},
      durationSeconds: 0,
    })
    const args = lastRecordArgs()
    expect(args.p_question_count).toBe(0)
    expect(args.p_answered_count).toBe(0)
    expect(args.p_correct_count).toBe(0)
  })

  it('repo-level RPC attaches abortSignal when a signal is provided', async () => {
    const controller = new AbortController()
    await recordPracticeSessionRpc(
      { questionCount: 1, answeredCount: 0, correctCount: 0 },
      controller.signal,
    )
    expect(rpcMock).toHaveBeenCalledTimes(1)
  })
})
