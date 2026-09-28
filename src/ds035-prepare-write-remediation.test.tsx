import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup, waitFor } from '@testing-library/react'
import { usePrepareWrite } from './components/user/prepare-write/usePrepareWrite'
import { queryCache } from './utils/queryCache'
import * as attemptRepo from './lib/repositories/attempt.repository'
import type { ExamPaper, ExamConfig, Question } from './types/exam.types'
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

const { navigation } = vi.hoisted(() => ({ navigation: { fn: vi.fn() } }))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigation.fn,
}))

const { pwService, examSvc } = vi.hoisted(() => ({
  pwService: {
    fetchExams: vi.fn(),
    fetchPapers: vi.fn(),
    fetchPaperDistribution: vi.fn(),
    prepareExamQuestions: vi.fn(),
    startPreparedExam: vi.fn(),
    recordPracticeSession: vi.fn().mockResolvedValue('session-id'),
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

/** Student-safe question rows as returned by prepare_exam_questions (F-01:
 *  correct_option / explanation_* are NEVER projected by the server). */
function lockedQuestion(id: string, paperId: string): Question {
  return {
    id,
    exam_id: G1,
    paper_id: paperId,
    subject_name: 'S1',
    difficulty: 'easy',
    negative_marks: 0,
    question_text_en: `Question ${id}`,
    option_a_en: 'A',
    option_b_en: 'B',
    option_c_en: 'C',
    option_d_en: 'D',
  } as Question
}

function prepResult(preparationId: string, paperId: string, ids: string[] = ['q1', 'q2', 'q3']) {
  return {
    preparation_id: preparationId,
    exam_id: G1,
    paper_id: paperId,
    question_count: ids.length,
    expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    questions: ids.map(id => lockedQuestion(id, paperId)),
  }
}

function startedResult(preparationId: string, paperId: string, ids: string[] = ['q1', 'q2', 'q3']) {
  return {
    attempt_id: `att-${preparationId}`,
    is_resumed: false,
    exam_id: G1,
    paper_id: paperId,
    question_count: ids.length,
    questions: ids.map(id => lockedQuestion(id, paperId)),
  }
}

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
  navigation.fn.mockReset()
  pwService.fetchExams.mockReset()
  pwService.fetchPapers.mockReset()
  pwService.fetchPaperDistribution.mockReset()
  pwService.prepareExamQuestions.mockReset()
  pwService.startPreparedExam.mockReset()
  pwService.recordPracticeSession.mockReset()
  examSvc.batchCheckAvailability.mockReset()
  supabaseMock.in.mockClear()
  pwService.fetchExams.mockResolvedValue([])
  pwService.fetchPapers.mockResolvedValue([])
  examSvc.batchCheckAvailability.mockResolvedValue({})
  pwService.prepareExamQuestions.mockResolvedValue(prepResult('prep-1', 'pA'))
  pwService.startPreparedExam.mockResolvedValue(startedResult('prep-1', 'pA'))
})

afterEach(() => {
  cleanup()
})

describe('P-S1 — clicked paper is authoritative for the locked fetch', () => {
  it('prepares the clicked paper, never the previously selected paper', async () => {
    configureSelection(['pA', 'pB'])
    const paperB = paper('pB')
    pwService.prepareExamQuestions.mockResolvedValue(prepResult('prep-B', 'pB'))
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.startPreparation(paperB)
    })

    expect(pwService.prepareExamQuestions).toHaveBeenLastCalledWith('pB')
    expect(pwService.prepareExamQuestions.mock.calls.every(call => call[0] === 'pB')).toBe(true)
    expect(result.current.state.selectedPaper?.id).toBe('pB')
    expect(result.current.state.view).toBe('PREPARATION')
    expect(result.current.state.preparationId).toBe('prep-B')
    expect(result.current.state.questions.every(q => q.paper_id === 'pB')).toBe(true)
  })
})

describe('P-S2 — locked preparation never leaks answers pre-exam (F-01)', () => {
  it('maps server rows into Question[] without correct_option/explanation fields', async () => {
    configureSelection(['pA'])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.startPreparation(paper('pA')) })
    expect(result.current.state.view).toBe('PREPARATION')
    expect(result.current.state.questionCount).toBe(3)
    expect(result.current.state.preparationId).toBe('prep-1')
    expect(result.current.state.questions).toHaveLength(3)
    expect(result.current.state.questions.every(q => (q as Question).correct_option === undefined)).toBe(true)
    expect(result.current.state.questions[0].diagram).toBe(null)
  })
})

describe('P-S5 — overlapping paper preparation is blocked', () => {
  it('returns false and does not refetch when a second paper is clicked while the first is loading', async () => {
    configureSelection(['pA', 'pB'])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const d = deferred<ReturnType<typeof prepResult>>()

    pwService.prepareExamQuestions.mockImplementationOnce(() => d.promise)

    act(() => { void result.current.startPreparation(paper('pA')) })
    await waitFor(() => expect(result.current.actionLoading).toBe(true))

    let second: boolean | undefined
    await act(async () => { second = await result.current.startPreparation(paper('pB')) })
    expect(second).toBe(false)
    expect(pwService.prepareExamQuestions).toHaveBeenCalledTimes(1)

    await act(async () => { d.resolve(prepResult('prep-A', 'pA')) })
    await waitFor(() => expect(result.current.state.view).toBe('PREPARATION'))
    expect(result.current.state.selectedPaper?.id).toBe('pA')
    expect(pwService.prepareExamQuestions).toHaveBeenCalledWith('pA')
    expect(pwService.prepareExamQuestions).not.toHaveBeenCalledWith('pB')
  })
})

describe('P-LAUNCH — startRealExam consumes the server-locked preparation', () => {
  it('calls start_prepared_exam(preparationId) and navigates to the real exam with the same IDs', async () => {
    configureSelection(['pA'])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.startPreparation(paper('pA')) })
    expect(result.current.state.view).toBe('PREPARATION')

    await act(async () => { await result.current.startRealExam() })

    expect(pwService.startPreparedExam).toHaveBeenCalledWith('prep-1')
    expect(navigation.fn).toHaveBeenCalledWith('/active-exam/pA', expect.objectContaining({
      state: expect.objectContaining({
        source: 'prepare_write',
        preparationId: 'prep-1',
        attemptId: 'att-prep-1',
      }),
    }))
    // Session is cleared after handing off to the active-exam page.
    expect(result.current.state.view).toBe('SELECTION')
    expect(result.current.state.preparationId).toBeNull()
  })

  it('never trusts a client-supplied question list (server decides the set)', async () => {
    configureSelection(['pA'])
    pwService.startPreparedExam.mockResolvedValue(startedResult('prep-2', 'pA', ['server-q1', 'server-q2']))
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.startPreparation(paper('pA')) })
    await act(async () => { await result.current.startRealExam() })

    const navCall = navigation.fn.mock.calls[0]
    const navState = (navCall[1] as { state: Record<string, unknown> }).state
    expect(navState.questions).toBeUndefined()
    expect(navState.source).toBe('prepare_write')
  })

  it('surfaces a server rejection and keeps the preparation intact', async () => {
    configureSelection(['pA'])
    pwService.startPreparedExam.mockRejectedValue(new Error('PREPARATION_EXPIRED'))
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.startPreparation(paper('pA')) })
    await act(async () => { await result.current.startRealExam() })

    expect(result.current.errorState).toBe('error')
    expect(result.current.state.view).toBe('PREPARATION')
    expect(result.current.state.preparationId).toBe('prep-1')
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

describe('P-S3 — session ownership', () => {
  it('discards a session persisted by a different account', () => {
    sessionStorage.setItem('prepare_write_active_session', JSON.stringify({
      view: 'PREPARATION', questions: [], selectedPaper: null, selectedExamId: G1,
      userId: 'other-user', preparationId: 'prep-x', expiresAt: null, questionCount: 0,
    }))

    const { result } = renderHook(() => usePrepareWrite())
    expect(result.current.state.view).toBe('SELECTION')
  })

  it('discards a session that carries no server preparation id', () => {
    sessionStorage.setItem('prepare_write_active_session', JSON.stringify({
      view: 'PREPARATION', questions: [], selectedPaper: null, selectedExamId: G1,
      userId: 'u1', preparationId: null, expiresAt: null, questionCount: 0,
    }))

    const { result } = renderHook(() => usePrepareWrite())
    expect(result.current.state.view).toBe('SELECTION')
  })

  it('restores a server-locked preparation owned by the current user', () => {
    sessionStorage.setItem('prepare_write_active_session', JSON.stringify({
      view: 'PREPARATION',
      questions: [lockedQuestion('q1', 'pA')],
      selectedPaper: paper('pA'),
      selectedExamId: G1,
      userId: 'u1',
      preparationId: 'prep-9',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      questionCount: 1,
    }))

    const { result } = renderHook(() => usePrepareWrite())
    expect(result.current.state.view).toBe('PREPARATION')
    expect(result.current.state.preparationId).toBe('prep-9')
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

describe('P-REM2 — exitSession uses synchronized view ref', () => {
  it('does not require confirmation when exiting from SELECTION', async () => {
    configureSelection(['pA'])
    const { result } = renderHook(() => usePrepareWrite())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.exitSession() })
    expect(result.current.state.view).toBe('SELECTION')
    expect(result.current.state.questions).toEqual([])
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
})