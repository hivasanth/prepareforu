import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, renderHook, screen, waitFor, cleanup, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext'
import { useSubAdminDashboard } from '../hooks/useSubAdminDashboard'
import SubAdminDashboard from '../pages/sub-admin/SubAdminDashboard'
import * as teacherExamService from '../services/teacherExamService'
import * as userService from '../services/userService'
import * as teacherExamRepo from '../lib/repositories/teacherExam.repository'
import * as attemptRepo from '../lib/repositories/attempt.repository'
import type { UserProfile } from '../types/auth.types'
import type { TeacherExamWithAttempt } from '../types/exam.types'

// FINAL PRODUCTION REMEDIATION — /sub-admin/dashboard
//   P1 every dashboard stat is an exact server COUNT over the FULL authorized
//      cohort. The 500-row exams list only feeds "Recent"; totals are never
//      derived from `exams.length` and attempts are never counted from the
//      capped list.
//   P3 last-good data survives refresh failures: a refresh error never clears
//      stats/recentExams; only an initial-load failure renders the full error
//      surface. No fake zeros, no skeleton replacing content during refresh.
//   FIX-A the aggregate service rethrows the ORIGINAL transport error so the
//      canonical classifier still sees status/code.

const MOCK_USER = { id: 'sa-1', full_name: 'Test SA', role: 'sub_admin' } as unknown as UserProfile

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: MOCK_USER,
    loading: false,
  }),
}))

vi.mock(import('../services/teacherExamService'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    fetchTeacherExams: vi.fn(),
    fetchTeacherAttemptCount: vi.fn(),
    fetchDashboardAggregates: vi.fn(),
  }
})

vi.mock('../services/userService', () => ({
  findSubAdminProfileSimple: vi.fn(),
  countUsersByEducatorId: vi.fn(),
}))

vi.mock('../lib/repositories/teacherExam.repository', () => ({
  countTeacherExamsBySubAdminId: vi.fn(),
  countActiveTeacherExamsBySubAdminId: vi.fn(),
}))

vi.mock('../lib/repositories/attempt.repository', () => ({
  countAuthorizedAttempts: vi.fn(),
}))

const EXAMS = [
  { id: 'e1', title: 'Exam 1', status: 'published', total_questions: 10, duration_minutes: 30, created_at: '2026-01-01T00:00:00Z', start_time: '2026-01-01T00:00:00Z', end_time: '2099-01-01T00:00:00Z' },
  { id: 'e2', title: 'Exam 2', status: 'draft', total_questions: 5, duration_minutes: 20, created_at: '2026-01-02T00:00:00Z', start_time: '2026-01-01T00:00:00Z', end_time: '2099-01-01T00:00:00Z' },
  { id: 'e3', title: 'Exam 3', status: 'published', total_questions: 8, duration_minutes: 25, created_at: '2026-01-03T00:00:00Z', start_time: '2026-01-01T00:00:00Z', end_time: '2099-01-01T00:00:00Z' },
] as unknown as TeacherExamWithAttempt[]

function makeExams(n: number): TeacherExamWithAttempt[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `e${i}`,
    title: `Exam ${i}`,
    status: i % 2 === 0 ? 'published' : 'draft',
    total_questions: 10,
    duration_minutes: 30,
    created_at: '2026-01-01T00:00:00Z',
    start_time: '2026-01-01T00:00:00Z',
    end_time: '2099-01-01T00:00:00Z',
  })) as unknown as TeacherExamWithAttempt[]
}

const agg = (totalExams: number, activeExams: number, totalAttempts: number) => ({ totalExams, activeExams, totalAttempts })

const svc = () => vi.mocked(teacherExamService)
const usr = () => vi.mocked(userService)

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

beforeEach(() => {
  usr().findSubAdminProfileSimple.mockResolvedValue({ id: 'sa-row-1', coupon_code: 'X' })
  usr().countUsersByEducatorId.mockResolvedValue(7)
  svc().fetchDashboardAggregates.mockResolvedValue(agg(2, 1, 0))
  svc().fetchTeacherExams.mockResolvedValue(EXAMS)
})

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe('P1 — exact server aggregates over the FULL authorized cohort', () => {
  it('small cohort: totals come from the aggregate, not from `exams.length`', async () => {
    svc().fetchDashboardAggregates.mockResolvedValue(agg(3, 2, 5))

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stats?.totalExams).toBe(3)
    expect(result.current.stats?.activeExams).toBe(2)
    expect(result.current.stats?.totalAttempts).toBe(5)
    expect(result.current.stats?.totalStudents).toBe(7)
    expect(svc().fetchDashboardAggregates).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.anything() }),
      'sa-row-1',
    )
  })

  it('500-row list with 501 real exams → totalExams is the exact 501 and Recent shows only 4', async () => {
    svc().fetchTeacherExams.mockResolvedValue(makeExams(500))
    svc().fetchDashboardAggregates.mockResolvedValue(agg(501, 10, 1000))

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stats?.totalExams).toBe(501)
    expect(result.current.recentExams.length).toBe(4)
  })

  it('1000 attempts with a 500-row list → totalAttempts is 1000 (never the capped-list count)', async () => {
    svc().fetchTeacherExams.mockResolvedValue(makeExams(500))
    svc().fetchDashboardAggregates.mockResolvedValue(agg(600, 10, 1000))

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stats?.totalExams).toBe(600)
    expect(result.current.stats?.totalAttempts).toBe(1000)
  })

  it('activeExams is the exact server window count, never a client filter of the capped list', async () => {
    svc().fetchDashboardAggregates.mockResolvedValue(agg(3, 10, 5))

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stats?.activeExams).toBe(10)
  })

  it('legacy list-derived attempt count (fetchTeacherAttemptCount) is never invoked', async () => {
    renderHook(() => useSubAdminDashboard(MOCK_USER))
    await waitFor(() => expect(svc().fetchDashboardAggregates).toHaveBeenCalled())
    expect(svc().fetchTeacherAttemptCount).not.toHaveBeenCalled()
  })

  it('aggregate failure lands in the canonical error branch (no fake zero display)', async () => {
    svc().fetchDashboardAggregates.mockRejectedValue(new Error('Failed to fetch'))

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
    expect(result.current.error?.category).toBe('network')
    expect(result.current.stats).toBeNull()
  })
})

describe('P3 — last-good data survives refresh failures', () => {
  it('A: initial load failure → error set and stats stay null (no fake zeros)', async () => {
    svc().fetchTeacherExams.mockRejectedValue(new Error('Failed to fetch'))

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
    expect(result.current.stats).toBeNull()
    expect(result.current.recentExams).toEqual([])
  })

  it('B: initial load success → real data rendered', async () => {
    svc().fetchDashboardAggregates.mockResolvedValue(agg(3, 2, 5))

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.stats?.totalExams).toBe(3)
    expect(result.current.recentExams.length).toBe(3)
  })

  it('C: refresh failure AFTER success → stats and recentExams are RETAINED and error is set', async () => {
    svc().fetchDashboardAggregates.mockResolvedValue(agg(3, 2, 5))
    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))
    await waitFor(() => expect(result.current.loading).toBe(false))

    svc().fetchTeacherExams.mockRejectedValueOnce(new Error('boom'))
    await act(async () => { await result.current.refresh() })

    expect(result.current.error).not.toBeNull()
    expect(result.current.stats?.totalExams).toBe(3)
    expect(result.current.stats?.activeExams).toBe(2)
    expect(result.current.stats?.totalAttempts).toBe(5)
    expect(result.current.recentExams.length).toBe(3)
    expect(result.current.loading).toBe(false)
  })

  it('D: retry after refresh failure recovers to fresh data and clears the error', async () => {
    svc().fetchDashboardAggregates.mockResolvedValue(agg(3, 2, 5))
    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))
    await waitFor(() => expect(result.current.loading).toBe(false))

    svc().fetchTeacherExams.mockRejectedValueOnce(new Error('boom'))
    await act(async () => { await result.current.refresh() })
    expect(result.current.error).not.toBeNull()

    svc().fetchDashboardAggregates.mockResolvedValue(agg(4, 3, 9))
    await act(async () => { await result.current.refresh() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.stats?.totalExams).toBe(4)
    expect(result.current.stats?.totalAttempts).toBe(9)
    expect(result.current.recentExams.length).toBe(3)
  })

  it('E: refresh IN PROGRESS keeps the last-good data visible (stats never null)', async () => {
    svc().fetchDashboardAggregates.mockResolvedValue(agg(3, 2, 5))
    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const exam = deferred<typeof EXAMS>()
    svc().fetchTeacherExams.mockRejectedValueOnce(new Error('boom'))
    await act(async () => { await result.current.refresh() })

    svc().fetchTeacherExams.mockImplementationOnce(() => exam.promise)
    act(() => { void result.current.refresh() })
    expect(result.current.loading).toBe(true)
    expect(result.current.stats).not.toBeNull()
    expect(result.current.stats?.totalExams).toBe(3)
    expect(result.current.recentExams.length).toBe(3)

    await act(async () => { exam.resolve(EXAMS) })
    await waitFor(() => expect(result.current.loading).toBe(false))
  })
})

describe('P3 — page render', () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <SubAdminDashboard />
        </ThemeProvider>
      </MemoryRouter>,
    )
  }

  it('initial load failure → ErrorContainer + retry, no zeroed stat cards, no skeleton, no status region', async () => {
    svc().fetchTeacherExams.mockRejectedValue(new Error('Failed to fetch'))

    renderPage()

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.queryByText('Total Exams')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText('No exams deployed yet')).not.toBeInTheDocument()
  })

  it('refresh failure with data → content stays visible, inline alert + retry, NO status re-announce', async () => {
    svc().fetchDashboardAggregates.mockResolvedValue(agg(3, 2, 5))
    renderPage()

    await waitFor(() => expect(screen.getByText('Exam 1')).toBeInTheDocument())
    expect(screen.getByText('Total Exams')).toBeInTheDocument()
    expect(screen.getByText('Total Attempts')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    svc().fetchTeacherExams.mockRejectedValueOnce(new Error('boom'))
    await act(async () => {
      screen.getByRole('button', { name: 'Refresh dashboard data' }).click()
    })

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText('Exam 1')).toBeInTheDocument()
    expect(screen.getByText('Total Exams')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})

describe('FIX-A — fetchDashboardAggregates rethrows the ORIGINAL transport error', () => {
  it('raw PostgREST 403 with code survives intact for the canonical classifier', async () => {
    const original = Object.assign(new Error('permission denied for table attempts'), {
      status: 403,
      code: '42501',
    })
    vi.mocked(attemptRepo.countAuthorizedAttempts).mockRejectedValueOnce(original)

    const actual = await vi.importActual<typeof import('../services/teacherExamService')>('../services/teacherExamService')
    const thrown = await actual
      .fetchDashboardAggregates({ user: MOCK_USER, requestId: 'fixa-agg' }, 'sa-1')
      .then(() => null, (e: unknown) => e)

    expect(thrown).toBe(original)
    expect((thrown as { status?: number }).status).toBe(403)
    expect((thrown as { code?: string }).code).toBe('42501')
  })

  it('raw timeout from any of the three counts propagates, not a hardcoded message', async () => {
    const original = Object.assign(new Error('statement timeout'), { code: '57014' })
    vi.mocked(teacherExamRepo.countTeacherExamsBySubAdminId).mockRejectedValueOnce(original)

    const actual = await vi.importActual<typeof import('../services/teacherExamService')>('../services/teacherExamService')
    const thrown = await actual
      .fetchDashboardAggregates({ user: MOCK_USER, requestId: 'fixa-agg2' }, 'sa-1')
      .then(() => null, (e: unknown) => e)

    expect(thrown).toBe(original)
    expect((thrown as { code?: string }).code).toBe('57014')
  })
})