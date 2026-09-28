import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, renderHook, screen, waitFor, cleanup, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { useSubAdminDashboard } from './hooks/useSubAdminDashboard'
import SubAdminDashboard from './pages/sub-admin/SubAdminDashboard'
import * as teacherExamService from './services/teacherExamService'
import * as userService from './services/userService'
import * as teacherExamRepo from './lib/repositories/teacherExam.repository'
import * as attemptRepo from './lib/repositories/attempt.repository'
import type { UserProfile } from './types/auth.types'
import type { TeacherExamWithAttempt } from './types/exam.types'

// Sub-admin dashboard remediation:
//   BUG-1 exact totalAttempts (never derived from a limited list)
//   BUG-2 cohort-count failure → ERROR (never "0" as success)
//   BUG-3 profile technical failure ≠ profile not found
//   BUG-4 superseded request cannot clear the loading flag
//   BUG-5 refresh bypasses the exam cache
//   BUG-6 attempts list query eliminated (Last Engagements removed)
//   BUG-7 exactly one role="status" loading region
//   BUG-8 canonical error classification
//   FIX-A original transport error object preserved through the shared
//         service layer so structured status/code drive canonical categories

// Stable identity is REQUIRED: the hook depends on `user`, and the real
// AuthContext provides a referentially-stable profile from useState.
const MOCK_USER = { id: 'sa-1', full_name: 'Test SA', role: 'sub_admin' } as unknown as UserProfile

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: MOCK_USER,
    loading: false,
  }),
}))

vi.mock(import('./services/teacherExamService'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    fetchTeacherExams: vi.fn(),
    fetchTeacherAttemptCount: vi.fn(),
    fetchDashboardAggregates: vi.fn(),
  }
})

vi.mock('./services/userService', () => ({
  findSubAdminProfileSimple: vi.fn(),
  countUsersByEducatorId: vi.fn(),
}))

// Repository mocks — used ONLY by the FIX-A service-layer identity tests;
// all other tests replace the whole service module.
vi.mock('./lib/repositories/teacherExam.repository', () => ({
  fetchTeacherExamsWithAttempts: vi.fn(),
}))
vi.mock('./lib/repositories/attempt.repository', () => ({
  countAttemptsByTeacherExamIds: vi.fn(),
}))

const EXAMS = [
{ id: 'e1', title: 'Exam 1', status: 'published', total_questions: 10, total_marks: 100, duration_minutes: 30, created_at: '2026-01-01T00:00:00Z', start_time: '2026-01-01T00:00:00Z', end_time: '2099-01-01T00:00:00Z' },
{ id: 'e2', title: 'Exam 2', status: 'draft', total_questions: 5, total_marks: 50, duration_minutes: 20, created_at: '2026-01-02T00:00:00Z', start_time: '2026-01-01T00:00:00Z', end_time: '2099-01-01T00:00:00Z' },
] as unknown as TeacherExamWithAttempt[]

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

const svc = () => vi.mocked(teacherExamService)
const usr = () => vi.mocked(userService)

beforeEach(() => {
  usr().findSubAdminProfileSimple.mockResolvedValue({ id: 'sa-row-1', coupon_code: 'X' })
  usr().countUsersByEducatorId.mockResolvedValue(7)
  svc().fetchDashboardAggregates.mockResolvedValue({ totalExams: 2, activeExams: 1, totalAttempts: 0 })
})

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe('Sub-admin dashboard remediation — hook', () => {
  it('BUG-1: totalAttempts comes from the exact backend aggregate, never a capped list', async () => {
    svc().fetchTeacherExams.mockResolvedValue(EXAMS)
    svc().fetchDashboardAggregates.mockResolvedValue({ totalExams: 2, activeExams: 1, totalAttempts: 75 })

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stats?.totalAttempts).toBe(75)
    expect(svc().fetchDashboardAggregates).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.anything() }),
      'sa-row-1',
    )
    expect(svc().fetchTeacherAttemptCount).not.toHaveBeenCalled()
  })

  it('BUG-1: the exam list shape never gates totalAttempts — the aggregate is independent', async () => {
    svc().fetchTeacherExams.mockResolvedValue(EXAMS)
    svc().fetchDashboardAggregates.mockResolvedValue({ totalExams: 2, activeExams: 1, totalAttempts: 37 })

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stats?.totalAttempts).toBe(37)
    expect(svc().fetchDashboardAggregates).toHaveBeenCalled()
    expect(svc().fetchTeacherAttemptCount).not.toHaveBeenCalled()
  })

  it('BUG-2: cohort-count failure enters ERROR state and never renders 0 as success', async () => {
    svc().fetchTeacherExams.mockResolvedValue(EXAMS)
    usr().countUsersByEducatorId.mockRejectedValue(new Error('Failed to fetch'))

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
    expect(result.current.error?.category).toBe('network')
    expect(result.current.stats).toBeNull()
  })

  it('BUG-2 + retry: successful retry after failure shows the real cohort count', async () => {
    svc().fetchTeacherExams.mockResolvedValue(EXAMS)
    usr().countUsersByEducatorId
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce(12)

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.error).not.toBeNull())

    await act(async () => { await result.current.refresh() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.stats?.totalStudents).toBe(12)
  })

  it('BUG-3 case B: genuine no-profile-row renders the setup-required business message', async () => {
    usr().findSubAdminProfileSimple.mockResolvedValue(null)

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error?.category).toBe('business')
    expect(result.current.error?.message).toBe('Educator profile not found. Please contact admin.')
  })

  it('BUG-3 case C: network failure on profile lookup is classified network, NOT "profile not found"', async () => {
    usr().findSubAdminProfileSimple.mockRejectedValue(new Error('Failed to fetch'))

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
    expect(result.current.error?.category).toBe('network')
    expect(result.current.error?.message).not.toContain('profile not found')
  })

  it('BUG-3 case D: RLS/authorization failure is classified authorization', async () => {
    usr().findSubAdminProfileSimple.mockRejectedValue(new Error('new row violates row-level security policy'))

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error?.category).toBe('authorization')
  })

  it('BUG-4: superseded refresh cannot clear loading while the newer request is in flight', async () => {
    const examA = deferred<typeof EXAMS>()
    const examB = deferred<typeof EXAMS>()
    let call = 0
    svc().fetchTeacherExams.mockImplementation(() => {
      call += 1
      return call === 1 ? examA.promise : examB.promise
    })

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    // A is in flight
    await waitFor(() => expect(svc().fetchTeacherExams).toHaveBeenCalledTimes(1))

    // B starts while A unresolved — do NOT await its completion here
    act(() => { void result.current.refresh() })
    await waitFor(() => expect(svc().fetchTeacherExams).toHaveBeenCalledTimes(2))
    expect(result.current.loading).toBe(true)

    // A resolves late — must NOT clear loading or set stale data
    await act(async () => { examA.resolve(EXAMS) })
    expect(result.current.loading).toBe(true)
    expect(result.current.stats).toBeNull()

    // B resolves — loading legitimately clears with fresh data
    await act(async () => { examB.resolve(EXAMS) })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.stats?.totalExams).toBe(2)
  })

  it('BUG-4b: superseded FAILURE cannot force an error state over a healthy in-flight request', async () => {
    const examA = deferred<typeof EXAMS>()
    const examB = deferred<typeof EXAMS>()
    let call = 0
    svc().fetchTeacherExams.mockImplementation(() => {
      call += 1
      return call === 1 ? examA.promise : examB.promise
    })

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))
    await waitFor(() => expect(svc().fetchTeacherExams).toHaveBeenCalledTimes(1))

    act(() => { void result.current.refresh() })
    await waitFor(() => expect(svc().fetchTeacherExams).toHaveBeenCalledTimes(2))

    // A fails late; B is still healthy and in flight
    await act(async () => { examA.reject(new Error('Failed to fetch')) })
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()

    await act(async () => { examB.resolve(EXAMS) })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.stats?.totalExams).toBe(2)
  })

  it('BUG-5: explicit refresh bypasses the exam cache; initial load does not', async () => {
    svc().fetchTeacherExams.mockResolvedValue(EXAMS)

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(svc().fetchTeacherExams.mock.calls[0][2]).toBe(false)

    await act(async () => { await result.current.refresh() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(svc().fetchTeacherExams).toHaveBeenCalledTimes(2)
    expect(svc().fetchTeacherExams.mock.calls[1][2]).toBe(true)
  })

  it('BUG-6: the limited recent-attempts list query no longer exists in the service module', async () => {
    const actual = await vi.importActual('./services/teacherExamService') as Record<string, unknown>
    expect(actual.fetchAttemptsByTeacherExamIds).toBeUndefined()
    expect(actual.fetchTeacherAttemptCount).toBeDefined()
  })
})

describe('Sub-admin dashboard remediation — page', () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <SubAdminDashboard />
        </ThemeProvider>
      </MemoryRouter>,
    )
  }

  it('BUG-7: exactly ONE role="status" region while loading, none after success', async () => {
    svc().fetchTeacherExams.mockImplementation(() => deferred<typeof EXAMS>().promise)

    renderPage()

    await waitFor(() => expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(1))
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading dashboard')
  })

  it('BUG-7b: after success no status region remains and content renders', async () => {
    svc().fetchTeacherExams.mockResolvedValue(EXAMS)

    renderPage()

    await waitFor(() => expect(screen.getByText('Recent Deployments')).toBeInTheDocument())
    // Wait for DATA, not just the always-rendered section heading
    await waitFor(() => expect(screen.getByText('Exam 1')).toBeInTheDocument())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Total Attempts')).toBeInTheDocument()
    expect(screen.getByText('Cohort Size')).toBeInTheDocument()
  })

  it('Last Engagements section is fully removed from the rendered page', async () => {
    svc().fetchTeacherExams.mockResolvedValue(EXAMS)

    renderPage()

    await waitFor(() => expect(screen.getByText('Recent Deployments')).toBeInTheDocument())
    expect(screen.queryByText('Last Engagements')).not.toBeInTheDocument()
  })

  it('BUG-8: error surface uses canonical category/title, not hardcoded network/critical copy', async () => {
    usr().findSubAdminProfileSimple.mockRejectedValue(new Error('Failed to fetch'))

    renderPage()

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText('Connection Lost')).toBeInTheDocument()
    expect(screen.queryByText('Failed to load dashboard')).not.toBeInTheDocument()
  })

  // NOTE: modal-open behavior is intentionally NOT asserted in jsdom —
  // focus-trap-react cannot compute tabbability for the skeleton-only loading
  // state in jsdom (works in real browsers; covered by the targeted Playwright
  // spec instead).
})

// ─── FIX-A — original transport error object preserved at the shared layer ──

describe('FIX-A — shared service rethrows the ORIGINAL error object', () => {
  it('fetchTeacherExams rethrows the raw PostgREST error with status/code intact', async () => {
    const original = Object.assign(new Error('JWS signature verification failed'), {
      status: 401,
      code: 'PGRST301',
      details: null,
      hint: 'Verify your session',
    })
    vi.mocked(teacherExamRepo.fetchTeacherExamsWithAttempts).mockRejectedValueOnce(original)

    const actual = await vi.importActual<typeof import('./services/teacherExamService')>('./services/teacherExamService')
    const thrown = await actual
      .fetchTeacherExams({ user: MOCK_USER, requestId: 'fixa-1' }, 'sa-1', true)
      .then(() => null, (e: unknown) => e)

    expect(thrown).toBe(original)
    expect((thrown as { status?: number }).status).toBe(401)
    expect((thrown as { code?: string }).code).toBe('PGRST301')
    expect((thrown as { hint?: string }).hint).toBe('Verify your session')
    // No generic wrapper text replaced the original message.
    expect((thrown as Error).message).toBe('JWS signature verification failed')
  })

  it('fetchTeacherAttemptCount rethrows the raw error with structured metadata intact', async () => {
    const original = Object.assign(new Error('statement timeout'), { code: '57014' })
    vi.mocked(attemptRepo.countAttemptsByTeacherExamIds).mockRejectedValueOnce(original)

    const actual = await vi.importActual<typeof import('./services/teacherExamService')>('./services/teacherExamService')
    const thrown = await actual
      .fetchTeacherAttemptCount({ user: MOCK_USER, requestId: 'fixa-2' }, ['e1'])
      .then(() => null, (e: unknown) => e)

    expect(thrown).toBe(original)
    expect((thrown as { code?: string }).code).toBe('57014')
  })
})

describe('FIX-A — canonical classification of preserved metadata (hook end-to-end)', () => {
  const CASES: Array<[string, Error, 'authentication' | 'authorization' | 'network' | 'timeout' | 'server']> = [
    ['structured 401 → authentication', Object.assign(new Error('Invalid JWT'), { status: 401 }), 'authentication'],
    ['PGRST301 code → authentication', Object.assign(new Error('JWT expired'), { code: 'PGRST301' }), 'authentication'],
    ['structured 403 → authorization', Object.assign(new Error('Forbidden'), { status: 403 }), 'authorization'],
    ['42501 SQLSTATE → authorization', Object.assign(new Error('new row violates row-level security policy'), { code: '42501' }), 'authorization'],
    ['network failure → network', new TypeError('Failed to fetch'), 'network'],
    ['timeout → timeout', new Error('Request timed out after 30s'), 'timeout'],
    ['structured 500 → server', Object.assign(new Error('Internal error'), { status: 500 }), 'server'],
  ]

  it.each(CASES)('%s', async (_label, rejection, expectedCategory) => {
    svc().fetchTeacherExams.mockRejectedValue(rejection)

    const { result } = renderHook(() => useSubAdminDashboard(MOCK_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error?.category).toBe(expectedCategory)
    // Original message preserved for diagnostics…
    expect(result.current.error?.debugMessage).toBe(rejection.message)
    // …while user-facing copy stays sanitized (no SQL/transport internals).
    expect(result.current.error?.title).not.toMatch(/SQL|PGRST|postgres/i)
    expect(result.current.error?.message).not.toMatch(/SQLSTATE|\b42501\b|\b57014\b|jwt|postgres/i)
    expect(result.current.error?.retryable).toBe(true)
  })
})
