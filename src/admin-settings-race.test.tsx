/// <reference types="node" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { useEffect } from 'react'
import { useAdminSettings } from './components/admin/settings/useAdminSettings'

/* ── BUG-1 regression suite — request ownership under rapid exam switches ──
 * Deterministic deferred-promise proof that:
 *   R-1  Exam A slow + Exam B fast → final state belongs to B (never A)
 *   R-2  Exam A failing LATE cannot replace B's success state with an error
 * The hook owns ONE monotonic sequence; every state write is gated on it.
 */

vi.mock('./hooks/useAdminFilters', async () => {
  const { useSyncExternalStore, useCallback } = await import('react')
  const state = { exam: 'EXAM_A', paper: 'all', subject: 'all' }
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach(l => l())
  const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
  const snapshot = () => `${state.exam}|${state.paper}|${state.subject}`
  return {
    __resetExam: () => {
      // Module-level singleton — restore the initial exam for each test.
      state.exam = 'EXAM_A'; state.paper = 'all'; state.subject = 'all'
    },
    __setExam: (exam: string) => {
      state.exam = exam; state.paper = 'all'; state.subject = 'all'
      notify()
    },
    useAdminFilters: () => {
      useSyncExternalStore(subscribe, snapshot)
      const update = useCallback((patch: Partial<typeof state>) => {
        Object.assign(state, patch)
        notify()
      }, [])
      return {
        selectedExam: state.exam,
        selectedPaper: state.paper,
        selectedSubject: state.subject,
        setSelectedExam: (v: string) => update({ exam: v, paper: 'all', subject: 'all' }),
        setSelectedPaper: (v: string) => update({ paper: v, subject: 'all' }),
        setSelectedSubject: (v: string) => update({ subject: v }),
      }
    },
  }
})

const serviceMocks = vi.hoisted(() => ({
  fetchExamPapers: vi.fn(),
  fetchExamConfig: vi.fn(),
  fetchExamSubjects: vi.fn(),
  fetchTopicConfiguration: vi.fn(),
}))

const mockUser = vi.hoisted(() => ({ id: 'admin-1', role: 'admin' }))

vi.mock('./services/adminService', () => ({ adminService: serviceMocks }))
vi.mock('./context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }))

const { __setExam, __resetExam } = await import('./hooks/useAdminFilters') as unknown as { __setExam: (e: string) => void; __resetExam: () => void }

type Deferred = {
  promise: Promise<unknown[]>
  resolve: (v: unknown[]) => void
  reject: (e: Error) => void
}

function makeDeferred(): Deferred {
  let resolve!: Deferred['resolve']
  let reject!: Deferred['reject']
  const promise = new Promise<unknown[]>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function makePaper(examId: string) {
  return { id: `paper-${examId}`, paper_name: `Paper ${examId}`, total_questions: 10, total_marks: 10, duration_minutes: 30, negative_marking: false, negative_mark_value: 0 }
}
function makeConfig(examId: string) {
  return { id: `cfg-${examId}`, exam_id: examId, name: examId, exam_selection: 'TEST', total_questions: 10, total_marks: 10, duration_minutes: 30, negative_marking: false, negative_mark_value: 0, is_published: true }
}
function makeSubject(examId: string) {
  return { id: `sub-${examId}`, exam_id: examId, paper_id: `paper-${examId}`, subject_name: `Subject of ${examId}`, question_count: 5, marks_per_question: 1, display_order: 0 }
}

beforeEach(() => {
  // reset (not clear) — each test installs its own deferred implementations
  vi.resetAllMocks()
  serviceMocks.fetchTopicConfiguration.mockResolvedValue([])
  __resetExam()
})

type HookState = ReturnType<typeof useAdminSettings>
const STATE_KEY = '__race_hook_state__'
const getHookState = (): HookState | null =>
  ((globalThis as Record<string, unknown>)[STATE_KEY] as HookState | undefined) ?? null

function Harness() {
  const s = useAdminSettings()
  useEffect(() => { ;(globalThis as Record<string, unknown>)[STATE_KEY] = s })
  return null
}

describe('BUG-1 — rapid exam switch request ownership', () => {
  it('R-1: late Exam A response never overwrites resolved Exam B state', async () => {
    const paperDeferreds: Record<string, Deferred> = {}
    serviceMocks.fetchExamPapers.mockImplementation((_ctx: unknown, examId: string) => {
      const d = makeDeferred()
      paperDeferreds[examId] = d
      return d.promise
    })
    serviceMocks.fetchExamConfig.mockImplementation((_ctx: unknown, examId: string) =>
      Promise.resolve(makeConfig(examId)))
    serviceMocks.fetchExamSubjects.mockImplementation((_ctx: unknown, examId: string) =>
      Promise.resolve([makeSubject(examId)]))

    render(<Harness />)

    // Exam A fetch starts and hangs
    await waitFor(() => expect(paperDeferreds.EXAM_A).toBeDefined())

    // Switch to Exam B — its fetch completes first
    act(() => __setExam('EXAM_B'))
    await waitFor(() => expect(paperDeferreds.EXAM_B).toBeDefined())
    paperDeferreds.EXAM_B.resolve([makePaper('EXAM_B')])

    await waitFor(() => expect(getHookState()?.config?.exam_id).toBe('EXAM_B'))
    await waitFor(() => expect(getHookState()?.isLoading).toBe(false))

    // Exam A resolves LATE with different data
    paperDeferreds.EXAM_A.resolve([makePaper('EXAM_A')])
    await Promise.resolve()

    const s = getHookState()
    expect(s?.config?.exam_id).toBe('EXAM_B')
    expect(s?.subjects[0]?.subject_name).toBe('Subject of EXAM_B')
    expect(s?.pageError).toBeNull()
  })

  it('R-2: a late Exam A FAILURE cannot replace Exam B success with an error', async () => {
    const paperDeferreds: Record<string, Deferred> = {}
    serviceMocks.fetchExamPapers.mockImplementation((_ctx: unknown, examId: string) => {
      const d = makeDeferred()
      paperDeferreds[examId] = d
      return d.promise
    })
    serviceMocks.fetchExamConfig.mockImplementation((_ctx: unknown, examId: string) =>
      Promise.resolve(makeConfig(examId)))
    serviceMocks.fetchExamSubjects.mockImplementation((_ctx: unknown, examId: string) =>
      Promise.resolve([makeSubject(examId)]))

    render(<Harness />)
    await waitFor(() => expect(paperDeferreds.EXAM_A).toBeDefined())

    act(() => __setExam('EXAM_B'))
    await waitFor(() => expect(paperDeferreds.EXAM_B).toBeDefined())
    paperDeferreds.EXAM_B.resolve([makePaper('EXAM_B')])
    await waitFor(() => expect(getHookState()?.config?.exam_id).toBe('EXAM_B'))

    // A fails AFTER B already succeeded
    paperDeferreds.EXAM_A.reject(new Error('Exam A network failure'))
    await Promise.resolve()

    const s = getHookState()
    expect(s?.config?.exam_id).toBe('EXAM_B')
    expect(s?.pageError).toBeNull()
  })
})
