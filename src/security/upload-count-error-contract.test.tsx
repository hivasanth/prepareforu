// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

/* ─────────────────────────────────────────────────────────────────────────────
   H1 — UPLOAD QUESTION COUNT: FAILURE IS NEVER ZERO

   Contract (remediation §4–§8):
     - valid count = 0        → success zero (badge shows "0 Questions Available")
     - count query failure    → error state (+ Retry); data must NOT be 0
     - retry then success     → actual count displayed
     - retry fails again      → error remains
   ────────────────────────────────────────────────────────────────────────── */

vi.mock('../services/adminQuestionService', () => ({
  adminQuestionService: {
    countQuestions: vi.fn(async () => 0),
  },
}))

// Only reached by the service-contract test below (hook tests mock the service).
vi.mock('../lib/repositories/question.repository', () => ({
  countQuestionsByFilter: vi.fn(async () => 0),
}))

vi.mock('../services/topicTestService', () => ({
  fetchTopicsBySubject: vi.fn(async () => []),
  fetchTopicCounts: vi.fn(async () => ({})),
}))

import { useAdminUpload } from '../components/admin/upload/useAdminUpload'
import { adminQuestionService } from '../services/adminQuestionService'

const countQuestions = vi.mocked(adminQuestionService.countQuestions)

/** Unique context per test so the SWR cache never leaks between cases. */
function setup(subject: string) {
  return renderHook(() => useAdminUpload('APPSC_GROUP_1', 'paper-1', subject))
}

beforeEach(() => {
  countQuestions.mockReset()
})

describe('H1 — upload context panel count contract', () => {
  it('CASE A — successful query returning 0 is a legitimate zero', async () => {
    countQuestions.mockResolvedValue(0)
    const { result } = setup('case-a-subject')

    await waitFor(() => expect(result.current.countLoading).toBe(false))

    expect(result.current.countError).toBeNull()
    expect(result.current.questionCount).toBe(0)
  })

  it('CASE B — count query rejection surfaces an error, NEVER a fabricated 0', async () => {
    countQuestions.mockRejectedValue(new Error('Failed to fetch'))
    const { result } = setup('case-b-subject')

    await waitFor(() => expect(result.current.countLoading).toBe(false))

    expect(result.current.countError).toBeTruthy()
    expect(result.current.countCategory).not.toBe('')
    // The forbidden outcome: error swallowed into a valid-looking zero.
    expect(result.current.questionCount).toBeNull()
  })

  it('CASE C — retry after failure succeeds and displays the actual count', async () => {
    countQuestions
      .mockRejectedValueOnce(new Error('Network unreachable'))
      .mockResolvedValueOnce(7)
    const { result } = setup('case-c-subject')

    await waitFor(() => expect(result.current.countLoading).toBe(false))
    expect(result.current.countError).toBeTruthy()
    expect(result.current.questionCount).toBeNull()

    await act(async () => { result.current.refetchCount() })

    await waitFor(() => {
      expect(result.current.countLoading).toBe(false)
      expect(result.current.countError).toBeNull()
    })
    expect(result.current.questionCount).toBe(7)
  })

  it('CASE D — retry that fails again keeps the error state (still not 0)', async () => {
    countQuestions
      .mockRejectedValueOnce(new Error('Network unreachable'))
      .mockRejectedValueOnce(new Error('Still unreachable'))
    const { result } = setup('case-d-subject')

    await waitFor(() => expect(result.current.countLoading).toBe(false))
    expect(result.current.countError).toBeTruthy()

    await act(async () => { result.current.refetchCount() })

    await waitFor(() => expect(result.current.countLoading).toBe(false))
    expect(result.current.countError).toBeTruthy()
    expect(result.current.questionCount).toBeNull()
  })

  it('service contract — countQuestions propagates repo failure instead of swallowing it', async () => {
    const { countQuestionsByFilter } = await import('../lib/repositories/question.repository')
    vi.mocked(countQuestionsByFilter).mockRejectedValueOnce(new Error('DB down'))

    const { adminQuestionService: realService } = await vi.importActual<typeof import('../services/adminQuestionService')>(
      '../services/adminQuestionService'
    )

    await expect(
      realService.countQuestions({ examId: 'APPSC_GROUP_1', paperId: 'p', subjectName: 's' })
    ).rejects.toThrow('DB down')

    // And a legitimate zero passes straight through.
    vi.mocked(countQuestionsByFilter).mockResolvedValueOnce(0)
    await expect(
      realService.countQuestions({ examId: 'APPSC_GROUP_1', paperId: 'p2', subjectName: 's' })
    ).resolves.toBe(0)
  })
})
