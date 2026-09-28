import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useUserExams } from '../useUserExams'
import type { ExamPaper } from '../../../../types/exam.types'

/* ── useUserExams ─ FUNC-1 regression suite ─────────────────────────────────
 * Locks the /exams data hook contract:
 *   F-a  initial loading state while auth resolves is truthy
 *   F-b  successful fetch → papers + availability + loading:false
 *   F-c  APPSC tab filter: displayedPapers scoped to activeGroup, groupOptions derived
 *   F-d  availability gating: zero/short question count → valid:false
 *   F-e  error → captureNetworkError; retry re-fetches and recovers
 *   F-f  non-APPSC (BANK_EXAMS) → no tabs, all papers displayed
 * Guards: no production code is touched; only the service + auth layers are
 *         mocked. No `any` types.
 * ──────────────────────────────────────────────────────────────────────────── */

const auth = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))
const svc = vi.hoisted(() => ({
  fetchUserPapers: vi.fn(),
  batchCheckAvailability: vi.fn(),
}))

vi.mock('../../../../context/AuthContext', () => auth)
vi.mock('../../../../services/examService', () => svc)

const user = {
  id: 'user-1',
  exam_selection: 'APPSC_GROUPS',
}

function paper(id: string, examId: string, name: string, total = 120): ExamPaper {
  return {
    id,
    exam_id: examId,
    paper_name: name,
    stage: 'PRELIMS',
    total_questions: total,
    total_marks: 120,
    duration_minutes: 120,
    negative_marking: true,
    negative_mark_value: 0.33,
    display_order: 0,
    start_time: null,
    end_time: null,
  }
}

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  auth.useAuth.mockReturnValue({ user, loading: false })
})

afterEach(() => {
  cleanup()
})

describe('useUserExams — FUNC-1', () => {
  it('F-a: exposes loading:true while auth is still resolving', () => {
    auth.useAuth.mockReturnValue({ user: null, loading: true })
    const { result } = renderHook(() => useUserExams(), { wrapper })
    expect(result.current.loading).toBe(true)
    expect(svc.fetchUserPapers).not.toHaveBeenCalled()
  })

  it('F-b: loads papers and availability then clears loading', async () => {
    const p1 = paper('p-id-1', 'APPSC_GROUP_1', 'General Studies')
    const p2 = paper('p-id-2', 'APPSC_GROUP_1', 'General Aptitude')
    svc.fetchUserPapers.mockResolvedValue([p1, p2])
    svc.batchCheckAvailability.mockResolvedValue({
      'p-id-1': { valid: true },
      'p-id-2': { valid: false, message: 'Not Enough Questions' },
    })

    const { result } = renderHook(() => useUserExams(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.displayedPapers).toHaveLength(2)
    expect(result.current.availabilityMap['p-id-1']).toEqual({ valid: true })
    expect(result.current.availabilityMap['p-id-2']).toEqual({ valid: false, message: 'Not Enough Questions' })
    expect(result.current.errorState).not.toBe('error')
    expect(result.current.pageError).toBeNull()
  })

  it('F-c: APPSC groups derive tab options and filter displayedPapers to the active group', async () => {
    const g1Papers = [
      paper('a', 'APPSC_GROUP_1', 'Group One A'),
      paper('b', 'APPSC_GROUP_1', 'Group One B'),
    ]
    const g2Paper = paper('c', 'APPSC_GROUP_2', 'Group Two A')
    svc.fetchUserPapers.mockResolvedValue([...g1Papers, g2Paper])
    svc.batchCheckAvailability.mockResolvedValue({
      a: { valid: true },
      b: { valid: true },
      c: { valid: true },
    })

    const { result } = renderHook(() => useUserExams(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isAppsc).toBe(true)
    expect(result.current.groupOptions.map((g) => g.id)).toEqual(['APPSC_GROUP_1', 'APPSC_GROUP_2'])
    // Default active group is the first sorted group (GROUP 1).
    expect(result.current.activeGroup).toBe('APPSC_GROUP_1')
    expect(result.current.displayedPapers.map((p) => p.id)).toEqual(['a', 'b'])

    act(() => result.current.handleGroupChange('APPSC_GROUP_2'))
    expect(result.current.activeGroup).toBe('APPSC_GROUP_2')
    expect(result.current.displayedPapers.map((p) => p.id)).toEqual(['c'])
  })

  it('F-d: a paper with insufficient questions is reported unavailable', async () => {
    const p = paper('p-low', 'APPSC_GROUP_1', 'Under-Filled', 120)
    svc.fetchUserPapers.mockResolvedValue([p])
    svc.batchCheckAvailability.mockResolvedValue({ 'p-low': { valid: false, message: 'Not Enough Questions' } })

    const { result } = renderHook(() => useUserExams(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.availabilityMap['p-low'].valid).toBe(false)
    expect(result.current.availabilityMap['p-low'].message).toBe('Not Enough Questions')
    expect(svc.batchCheckAvailability).toHaveBeenCalledWith(['p-low'])
  })

  it('F-e: captures an error on fetch failure, then retry re-fetches and recovers', async () => {
    const p = paper('ok', 'APPSC_GROUP_1', 'Recovered')
    svc.fetchUserPapers.mockRejectedValueOnce(new Error('network down'))
    svc.batchCheckAvailability.mockResolvedValue({ ok: { valid: true } })

    const { result } = renderHook(() => useUserExams(), { wrapper })
    await waitFor(() => expect(result.current.errorState).toBe('error'))
    expect(result.current.pageError).not.toBeNull()

    // Retry: service recovers on the second call.
    svc.fetchUserPapers.mockResolvedValue([p])
    await act(async () => {
      await result.current.retryError()
    })
    await waitFor(() => expect(result.current.errorState).not.toBe('error'))
    expect(result.current.pageError).toBeNull()
    expect(result.current.displayedPapers.map((x) => x.id)).toEqual(['ok'])
  })

  it('F-f: non-APPSC selection (BANK_EXAMS) renders all papers with no tab grouping', async () => {
    auth.useAuth.mockReturnValue({ user: { id: 'user-2', exam_selection: 'BANK_EXAMS' }, loading: false })
    const p1 = paper('b1', 'BANK_EXAMS', 'Bank Paper 1')
    const p2 = paper('b2', 'BANK_EXAMS', 'Bank Paper 2')
    svc.fetchUserPapers.mockResolvedValue([p1, p2])
    svc.batchCheckAvailability.mockResolvedValue({ b1: { valid: true }, b2: { valid: true } })

    const { result } = renderHook(() => useUserExams(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isAppsc).toBe(false)
    // groupOptions is derived from the papers' exam_ids; the KEY invariant is
    // that a non-APPSC user is NOT tab-filtered and sees every paper.
    expect(result.current.activeGroup).toBe('DEFAULT')
    expect(result.current.displayedPapers).toHaveLength(2)
  })
})
