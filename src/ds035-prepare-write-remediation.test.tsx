import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup, waitFor } from '@testing-library/react'
import { usePrepareWrite } from './components/user/prepare-write/usePrepareWrite'
import { queryCache } from './utils/queryCache'
import * as attemptRepo from './lib/repositories/attempt.repository'
import type { ExamPaper, ExamConfig, ExamSubject, Question } from './types/exam.types'
import type { UserProfile } from './types/auth.types'

const { authState, supabaseMock } = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.from = vi.fn(() => chain)
  chain.select = vi.fn(() => chain)
  chain.in = vi.fn(async (_col: string, values: string[]) => ({
    data: values.map((id, i) => ({ question_id: `answered-${id}-${i}` })),
    error: null,
  }))
  return {
    authState: {
      user: {
        id: 'u1',
        role: 'user',
        exam_selection: 'APPSC_GROUPS',
        is_active: true,
      } as UserProfile,
      loading: false,
      initialized: true,
    },
    supabaseMock: chain,
  }
})

vi.mock('./context/AuthContext', () => ({
  useAuth: () => authState,
}))

vi.mock('./lib/supabase', () => ({
  supabase: supabaseMock,
}))

vi.mock('./components/common/AntigravityCard', () => ({
  GOLD_LIGHT_MATERIAL: '',
}))

const { pwService, examSvc } = vi.hoisted(() => ({
  pwService: {
    fetchExams: vi.fn(),
    fetchPapers: vi.fn(),
    fetchPaperDistribution: vi.fn(),
    fetchPrepareQuestions: vi.fn(),
  },
  examSvc: {
    batchCheckAvailability: vi.fn(),
  },
}))

vi.mock('./services/prepareWriteService', () => pwService)
vi.mock('./services/examService', () => examSvc)

// ─── Fixtures ───────────────────────────────────────────────────────────────

const G1 = 'APPSC_GROUP_1'

function exam(id: string): ExamConfig {
  return { exam_id: id, name: id, exam_selection: 'APPSC_GROUPS' } as ExamConfig
}

function paper(id: string, examId: string = G1): ExamPaper {
  return {
    id,
    exam_id: examId,
    paper_name: `Paper ${id}`,
    stage: 'PRELIMS',
    total_questions: 3,
    total_marks: 3,
    duration_minutes: 30,
    negative_marking: false,
    negative_mark_value: 0,
    display_order: 1,
    start_time: null,
    end_time: null,
  }
}

function subject(name: string, count: number): ExamSubject {
  return { id: `s-${name}`, exam_id: G1, paper_id: 'p', subject_name: name, question_count: count, marks_per_question: 1, display_order: 1 }
}

function question(id: string, paperId: string): Question {
  return {
    id,
    exam_id: G1,
    paper_id: paperId,
    subject_name: 'S1',
    correct_option: 'A',
    difficulty: 'easy',
    negative_marks: 0,
    question_text_en: `Question ${id}`,
    option_a_en: 'A',
    option_b_en: 'B',
    option_c_en: 'C',
    option_d_en: 'D',
  }
}

const DIST = { subjects: [subject('S1', 3)], totalRequired: 3 }
const THREE_QS = [question('q1', 'pA'), question('q2', 'pA'), question('q3', 'pA')]

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function configureSelection(paperIds: string[] = ['pA'], valid = true) {
  pwService.fetchExams.mockResolvedValue([exam(G1)])
  pwService.fetchPapers.mockResolvedValue(paperIds.map(id => paper(id)))
  examSvc.batchCheckAvailability.mockResolvedValue(
    Object.fromEntries(paperIds.map(id => [id, { valid, message: valid ? undefined : 'Not Enough Questions' }]))
  )
}

beforeEach(() => {
  sessionStorage.clear()
  queryCache.clear()
  pwService.fetchExams.mockReset()
  pwService.fetchPapers.mockReset()
  pwService.fetchPaperDistribution.mockReset()
  pwService.fetchPrepareQuestions.mockReset()
  examSvc.batchCheckAvailability.mockReset()
  supabaseMock.in.mockClear()
  pwService.fetchExams.mockResolvedValue([])
  pwService.fetchPapers.mockResolvedValue([])
  examSvc.batchCheckAvailability.mockResolvedValue({})
  pwService.fetchPaperDistribution.mockResolvedValue(DIST)
  pwService.fetchPrepareQuestions.mockResolvedValue(THREE_QS)
})

afterEach(() => {
  cleanup()
})

describe('P-S1 — clicked paper is authoritative for the fetch', () => {
  it('fetches the clicked paper, never the previously selected paper', async () => {
    configureSelection(['pA', 'pB'])
    pwService.fetchPrepareQuestions.mockResolvedValue([question('qb1', 'pB'), question('qb2', 'pB'), question('qb3', 'pB')])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const paperB = paper('pB')

    await act(async () => {
      await result.current.startPreparation(paperB)
    })

    expect(pwService.fetchPaperDistribution).toHaveBeenLastCalledWith('pB')
    expect(pwService.fetchPrepareQuestions).toHaveBeenLastCalledWith('pB', expect.anything(), 'u1')
    expect(pwService.fetchPrepareQuestions.mock.calls.every(call => call[0] === 'pB')).toBe(true)
    expect(result.current.state.selectedPaper?.id).toBe('pB')
    expect(result.current.state.view).toBe('PREPARATION')
    expect(result.current.state.questions.every(q => q.paper_id === 'pB')).toBe(true)
  })
})

describe('P-S5 — overlapping paper action is blocked', () => {
  it('returns false and does not refetch when a second paper is clicked while the first is loading', async () => {
    configureSelection(['pA', 'pB'])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const d = deferred<typeof DIST>()

    pwService.fetchPaperDistribution.mockImplementationOnce(() => d.promise)

    act(() => { void result.current.startPreparation(paper('pA')) })
    await waitFor(() => expect(result.current.actionLoading).toBe(true))

    let second: boolean | undefined
    await act(async () => { second = await result.current.startPreparation(paper('pB')) })
    expect(second).toBe(false)
    expect(pwService.fetchPaperDistribution).toHaveBeenCalledTimes(1)

    await act(async () => { d.resolve(DIST) })
    await waitFor(() => expect(result.current.state.view).toBe('PREPARATION'))
    expect(result.current.state.selectedPaper?.id).toBe('pA')
    expect(pwService.fetchPrepareQuestions).toHaveBeenCalledWith('pA', expect.anything(), 'u1')
    expect(pwService.fetchPrepareQuestions).not.toHaveBeenCalledWith('pB', expect.anything(), expect.anything())
  })
})

describe('P-S4 — stale exam-switch errors are ignored', () => {
  it('keeps the newer exam content when an older request fails late', async () => {
    pwService.fetchExams.mockResolvedValue([exam(G1)])
    const dA = deferred<ExamPaper[]>()
    pwService.fetchPapers.mockImplementation((examId: string) =>
      examId === 'GA' ? dA.promise : Promise.resolve([paper('pB', 'GB')])
    )
    examSvc.batchCheckAvailability.mockResolvedValue({ pB: { valid: true } })

    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { void result.current.handleExamChange('GA') })

    await act(async () => { await result.current.handleExamChange('GB') })
    expect(result.current.papers[0]?.id).toBe('pB')
    expect(result.current.errorState).toBe('idle')

    await act(async () => { dA.reject(new Error('late failure from exam A')) })
    await waitFor(() => expect(result.current.papers[0]?.id).toBe('pB'))
    expect(result.current.errorState).toBe('idle')
    expect(result.current.pageError).toBeNull()
  })
})

describe('P-S2 — visited question tracking', () => {
  it('tracks only the questions the user actually navigates to', async () => {
    configureSelection(['pA'])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))
    pwService.fetchPrepareQuestions.mockResolvedValue(THREE_QS)

    await act(async () => { await result.current.startPreparation(paper('pA')) })
    expect(result.current.state.visitedQuestions).toEqual([])

    act(() => { result.current.startExam() })
    expect(result.current.state.visitedQuestions).toEqual(['q1'])

    act(() => { result.current.handleJumpToQuestion(2) })
    expect(result.current.state.visitedQuestions).toEqual(['q1', 'q3'])

    act(() => { result.current.handlePrev() })
    expect(result.current.state.visitedQuestions).toEqual(['q1', 'q3', 'q2'])

    act(() => { result.current.handleNextOrSubmit() })
    expect(result.current.state.visitedQuestions).toEqual(['q1', 'q3', 'q2'])

    act(() => { result.current.handleJumpToQuestion(2) })
    expect(result.current.state.visitedQuestions).toEqual(['q1', 'q3', 'q2'])
    expect(result.current.state.visitedQuestions).toHaveLength(3)
  })

  it('never marks every question visited at exam start', async () => {
    configureSelection(['pA'])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))
    pwService.fetchPrepareQuestions.mockResolvedValue([question('q1', 'pA'), question('q2', 'pA')])

    await act(async () => { await result.current.startPreparation(paper('pA')) })
    act(() => { result.current.startExam() })

    expect(result.current.state.visitedQuestions).toEqual(['q1'])
    expect(result.current.state.visitedQuestions).toHaveLength(1)
  })
})

describe('P-S3 — session ownership', () => {
  it('discards a session persisted by a different account', () => {
    sessionStorage.setItem('prepare_write_active_session', JSON.stringify({
      view: 'EXAM', questions: [], answers: {}, markedForReview: {}, visitedQuestions: [],
      selectedPaper: null, selectedExamId: G1, userId: 'other-user', startTime: 1, endTime: null, currentIndex: 0,
    }))

    const { result } = renderHook(() => usePrepareWrite())
    expect(result.current.state.view).toBe('SELECTION')
  })

  it('discards a legacy session that has no userId', () => {
    sessionStorage.setItem('prepare_write_active_session', JSON.stringify({
      view: 'EXAM', questions: [], answers: {}, markedForReview: {},
      selectedPaper: null, selectedExamId: G1, startTime: 1, endTime: null, currentIndex: 0,
    }))

    const { result } = renderHook(() => usePrepareWrite())
    expect(result.current.state.view).toBe('SELECTION')
  })
})

describe('P-S6 — shared availability error contract', () => {
  it('surfaces a backend availability failure as a page-level error, not a disabled map', async () => {
    pwService.fetchExams.mockResolvedValue([exam(G1)])
    pwService.fetchPapers.mockResolvedValue([paper('pA')])
    examSvc.batchCheckAvailability.mockRejectedValue(new Error('availability backend down'))

    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.errorState).toBe('error'))
    expect(result.current.availabilityMap).toEqual({})
    expect(result.current.pageError).not.toBeNull()
  })

  it('keeps the real insufficient-content contract (Not Enough Questions)', async () => {
    pwService.fetchExams.mockResolvedValue([exam(G1)])
    pwService.fetchPapers.mockResolvedValue([paper('pA')])
    examSvc.batchCheckAvailability.mockResolvedValue({ pA: { valid: false, message: 'Not Enough Questions' } })

    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.availabilityMap['pA']).toEqual({ valid: false, message: 'Not Enough Questions' })
    expect(result.current.errorState).toBe('idle')
  })
})

describe('P-S7 — bounded exclusion query', () => {
  it('chunks attempt ids into bounded .in() batches and merges identical results', async () => {
    const ids = Array.from({ length: 450 }, (_, i) => `att-${i}`)
    const rows = (await attemptRepo.findAnsweredQuestionIds(ids)) || []

    expect(supabaseMock.in).toHaveBeenCalledTimes(3)
    const batchSizes = supabaseMock.in.mock.calls.map(call => (call[1] as string[]).length)
    expect(batchSizes).toEqual([200, 200, 50])
    expect(rows).toHaveLength(450)
    expect(new Set(rows.map(r => r.question_id)).size).toBe(450)
  })
})

describe('P-S9 — practice result copy', () => {
  it('announces local practice completion only when the practice is actually finished', async () => {
    configureSelection(['pA'])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))
    pwService.fetchPrepareQuestions.mockResolvedValue([question('q1', 'pA'), question('q2', 'pA')])

    await act(async () => { await result.current.startPreparation(paper('pA')) })
    act(() => { result.current.startExam() })

    act(() => { result.current.handleNextOrSubmit() })
    const toastsAfterNext = result.current.toasts.map(t => t.message)
    expect(toastsAfterNext).not.toContain('Practice completed. Results are saved locally.')

    act(() => { result.current.handleNextOrSubmit() })
    expect(result.current.state.view).toBe('RESULT')
    expect(result.current.toasts.some(t => t.message === 'Practice completed. Results are saved locally.')).toBe(true)
  })

  it('uses practice-local wording on submit', async () => {
    configureSelection(['pA'])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.startPreparation(paper('pA')) })
    act(() => { result.current.submitExam() })

    expect(result.current.state.view).toBe('RESULT')
    expect(result.current.toasts.some(t => t.message === 'Practice completed. Results are saved locally.')).toBe(true)
  })
})

describe('P-REM1 — last-question submit uses authoritative state (no stale closure)', () => {
  it('navigates forward on second-to-last question without triggering RESULT', async () => {
    configureSelection(['pA'])
    pwService.fetchPrepareQuestions.mockResolvedValue([question('q1', 'pA'), question('q2', 'pA'), question('q3', 'pA')])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.startPreparation(paper('pA')) })
    act(() => { result.current.startExam() })
    // At question 0 (q1) — next should go to question 1
    act(() => { result.current.handleNextOrSubmit() })
    expect(result.current.state.view).toBe('EXAM')
    expect(result.current.state.currentIndex).toBe(1)

    // At question 1 (q2) — next should go to question 2 (last)
    act(() => { result.current.handleNextOrSubmit() })
    expect(result.current.state.view).toBe('EXAM')
    expect(result.current.state.currentIndex).toBe(2)

    // At question 2 (q3, last) — next should transition to RESULT
    act(() => { result.current.handleNextOrSubmit() })
    expect(result.current.state.view).toBe('RESULT')
    expect(result.current.state.endTime).toBeGreaterThan(0)
  })

  it('transitions to RESULT exactly once on last question', async () => {
    configureSelection(['pA'])
    pwService.fetchPrepareQuestions.mockResolvedValue([question('q1', 'pA'), question('q2', 'pA')])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.startPreparation(paper('pA')) })
    act(() => { result.current.startExam() })

    // Question 0 → next → question 1
    act(() => { result.current.handleNextOrSubmit() })
    expect(result.current.state.view).toBe('EXAM')
    expect(result.current.state.currentIndex).toBe(1)

    // Question 1 (last) → next → RESULT
    act(() => { result.current.handleNextOrSubmit() })
    expect(result.current.state.view).toBe('RESULT')

    // Calling again should not crash (already in RESULT)
    act(() => { result.current.handleNextOrSubmit() })
    expect(result.current.state.view).toBe('RESULT')
  })
})

describe('P-REM2 — exitSession uses synchronized view ref', () => {
  it('does not require confirmation when exiting from SELECTION', async () => {
    configureSelection(['pA'])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Should not prompt confirmation — just clears session
    act(() => { result.current.exitSession() })
    expect(result.current.state.view).toBe('SELECTION')
    expect(result.current.state.questions).toEqual([])
  })

  it('does not require confirmation when exiting from RESULT', async () => {
    configureSelection(['pA'])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.startPreparation(paper('pA')) })
    act(() => { result.current.submitExam() })
    expect(result.current.state.view).toBe('RESULT')

    // Exiting from RESULT should not confirm
    act(() => { result.current.exitSession() })
    expect(result.current.state.view).toBe('SELECTION')
  })

  it('requires confirmation when exiting from PREPARATION', async () => {
    configureSelection(['pA'])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.startPreparation(paper('pA')) })
    expect(result.current.state.view).toBe('PREPARATION')

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    act(() => { result.current.exitSession() })
    expect(result.current.state.view).toBe('PREPARATION')
    confirmSpy.mockRestore()
  })

  it('requires confirmation when exiting from EXAM', async () => {
    configureSelection(['pA'])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.startPreparation(paper('pA')) })
    act(() => { result.current.startExam() })
    expect(result.current.state.view).toBe('EXAM')

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    act(() => { result.current.exitSession() })
    expect(result.current.state.view).toBe('EXAM')
    confirmSpy.mockRestore()
  })
})
