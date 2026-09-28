/// <reference types="node" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Single submission chokepoint for teacher exams (manual submit + time-up
// auto-submit both funnel through useExamSubmission.finalSubmit). M-4 requires
// the cached leaderboard row to be invalidated exactly-on-target right after a
// successful submitAttempt, and only when the attempt is a teacher exam.

const ivMocks = vi.hoisted(() => ({
  invalidate: vi.fn(),
}))

vi.mock('../services/examService', () => ({
  addQuestionTime: vi.fn(async () => {}),
  syncAnswersCache: vi.fn(async () => {}),
  submitAttempt: vi.fn(async () => ({ result: 'submitted' })),
}))

vi.mock('../services/teacherExamService', () => ({
  invalidateTeacherExamLeaderboard: ivMocks.invalidate,
}))

vi.mock('../services/persistenceRetry', () => ({
  executeWithRetry: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}))

vi.mock('../utils/examSessionStore', () => ({
  clearExamSession: vi.fn(),
}))

import { submitAttempt } from '../services/examService'
import { useExamSubmission } from '../pages/exam/hooks/useExamSubmission'

function buildRefs(attempt: unknown) {
  return {
    currentQuestion: undefined,
    navigate: vi.fn(),
    examSource: 'teacher_exam',
    user: { id: 'user-1' },
    onError: vi.fn(),
    setIsSubmitting: vi.fn(),
    setIsSubmitModalOpen: vi.fn(),
    setIsAutoSubmitting: vi.fn(),
    attemptRef: { current: attempt },
    selectedAnswersRef: { current: {} },
    paperRef: { current: null },
    questionEntryTimeRef: { current: 0 },
    questionTimeSpentRef: { current: {} },
    isActuallySubmitted: { current: false },
    isAutoSubmittingRef: { current: false },
  } as unknown as Parameters<typeof useExamSubmission>[0]
}

describe('M-4: finalSubmit invalidates the cached leaderboard for teacher exams', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invalidates the submitting user-exam cache row after a successful submit', async () => {
    const refs = buildRefs({ id: 'ATTEMPT_1', teacher_exam_id: 'EXAM_1' })
    const { result } = renderHook(() => useExamSubmission(refs))

    await result.current.finalSubmit()

    await waitFor(() => {
      expect(submitAttempt).toHaveBeenCalledWith('ATTEMPT_1', 'user-1')
      expect(ivMocks.invalidate).toHaveBeenCalledWith('user-1', 'EXAM_1')
    })
  })

  it('does NOT invalidate any leaderboard for non-teacher attempts', async () => {
    const refs = buildRefs({ id: 'ATTEMPT_2', teacher_exam_id: null })
    const { result } = renderHook(() => useExamSubmission(refs))

    await result.current.finalSubmit()

    await waitFor(() => {
      expect(submitAttempt).toHaveBeenCalled()
    })
    expect(ivMocks.invalidate).not.toHaveBeenCalled()
  })

  it('does not invalidate when no attempt exists (guard clause)', async () => {
    const refs = buildRefs(null)
    const { result } = renderHook(() => useExamSubmission(refs))

    await result.current.finalSubmit()

    expect(submitAttempt).not.toHaveBeenCalled()
    expect(ivMocks.invalidate).not.toHaveBeenCalled()
  })
})