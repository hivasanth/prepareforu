/// <reference types="node" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, renderHook, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '../context/ThemeContext'
import { useAdminLeaderboard } from '../components/admin/leaderboard/useAdminLeaderboard'
import { useExamPaperSubjectSelection } from '../hooks/useExamPaperSubjectSelection'
import { AdminSelectionTabs } from '../components/admin/shared/AdminSelectionTabs'
import { fetchAdminLeaderboard } from '../services/leaderboardService'
import * as leaderboardRepo from '../lib/repositories/leaderboard.repository'

/* ─── ALB remediation suite (BUG-001 / BUG-003 / BUG-005) ────────────────────
 * BUG-001: every exam id the selection tabs render — including non-APPSC exams
 *          such as BANK_EXAMS — must reach the admin-guarded RPC; an unknown
 *          URL value is normalized through the filter system and NEVER answered
 *          with a client-fabricated successful empty response.
 * BUG-003: a failed paper-list load surfaces an explicit error + retry surface.
 * BUG-005: skeleton header vertical geometry matches the final header. */

const here = dirname(fileURLToPath(import.meta.url))

vi.mock('../lib/repositories/leaderboard.repository', () => ({
  LEADERBOARD_TOP_LIMIT: 50,
  fetchUserRankRpc: vi.fn(),
  fetchLeaderboardTopRpc: vi.fn(),
  fetchAdminLeaderboardPage: vi.fn(),
}))

vi.mock('../services/examService', () => ({
  fetchActiveExams: vi.fn(),
}))

import { fetchActiveExams } from '../services/examService'

vi.mock('../hooks/useAdminFilters', () => ({
  useAdminFilters: vi.fn(),
}))

import { useAdminFilters } from '../hooks/useAdminFilters'

vi.mock('../hooks/useSupabaseQuery', () => ({
  useSupabaseQuery: vi.fn((): never => {
    throw new Error('useSupabaseQuery implementation not configured for this test')
  }),
}))

import { useSupabaseQuery } from '../hooks/useSupabaseQuery'

vi.mock('../services/adminService', () => ({
  adminService: {
    fetchPapersByExam: vi.fn(),
    fetchSubjectsByPaper: vi.fn(),
  },
}))

/** Shared mutable outcome for the papers query — lets tests drive the REAL
 *  selection hook through success → failure sequences via rerender. */
const papersQueryOutcome = vi.hoisted(() => ({ current: 'success' as 'success' | 'failure' }))
/** Stable spy handed to every papers query as its refetch. */
const papersRefetch = vi.hoisted(() => ({ fn: undefined as unknown as ReturnType<typeof vi.fn> }))

/* STABLE payload references — REQUIRED. The real useSupabaseQuery keeps `data`
 * referentially stable across renders (it lives in useState); a mock returning
 * fresh arrays would retrigger the hook's `useEffect([papers])` every render
 * and loop forever. */
const STABLE_PAPERS_SUCCESS = [{ id: 'p1', paper_name: 'Paper 1' }] as const
const STABLE_EMPTY: readonly unknown[] = Object.freeze([])

vi.mock('../context/AuthContext', () => {
  // Stable references are REQUIRED: the real selection hook lists `user` in
  // effect dependency arrays, so a fresh object per call would loop forever.
  const stableUser = { id: 'admin-1', role: 'admin', exam_selection: null }
  const authValue = { user: stableUser, loading: false, initialized: true }
  return { useAuth: vi.fn(() => authValue) }
})

function mockFilters(selectedExam: string, selectedPaper = 'all') {
  vi.mocked(useAdminFilters).mockReturnValue({
    selectedExam,
    selectedPaper,
    selectedSubject: 'all',
    selectedTopic: '',
    setSelectedExam: vi.fn(),
    setSelectedPaper: vi.fn(),
    setSelectedSubject: vi.fn(),
    setSelectedTopic: vi.fn(),
  })
}

/** Grabs the queryFn handed to useSupabaseQuery by the hook under test. */
function capturedFetcher(): () => Promise<unknown> {
  const calls = vi.mocked(useSupabaseQuery).mock.calls
  expect(calls.length).toBeGreaterThan(0)
  return calls[calls.length - 1][0]
}

async function flushMicrotasks(times = 5) {
  for (let i = 0; i < times; i++) await Promise.resolve()
}

beforeEach(() => {
  vi.clearAllMocks()
  papersQueryOutcome.current = 'success'
  papersRefetch.fn = vi.fn()
  vi.mocked(fetchActiveExams).mockResolvedValue([] as never)
  // Default shared-query behavior: papers follow the mutable outcome, every
  // other namespace resolves empty-success. Individual tests override.
  vi.mocked(useSupabaseQuery).mockImplementation(((_fn: unknown, _deps: unknown[], ns?: string) => {
    if (ns === 'selection_papers') {
      if (papersQueryOutcome.current === 'failure') {
        return {
          data: null,
          loading: false,
          error: 'Connection lost. Please check your internet connection and try again.',
          category: 'network',
          refetch: papersRefetch.fn,
        }
      }
      return { data: STABLE_PAPERS_SUCCESS, loading: false, error: null, category: 'unknown', refetch: papersRefetch.fn }
    }
    return { data: STABLE_EMPTY, loading: false, error: null, category: 'unknown', refetch: () => {} }
  }) as never)
})

afterEach(cleanup)

describe('BUG-001 — BANK_EXAMS reaches the authoritative RPC path', () => {
  it('passes BANK_EXAMS through to fetchAdminLeaderboardPage (real rows or real empty)', async () => {
    vi.mocked(fetchActiveExams).mockResolvedValue([
      { exam_id: 'APPSC_GROUP_1', name: 'APPSC Group 1', exam_selection: 'APPSC_GROUPS' },
      { exam_id: 'BANK_EXAMS', name: 'Bank Exams', exam_selection: 'BANK_EXAMS' },
    ] as never)
    vi.mocked(leaderboardRepo.fetchAdminLeaderboardPage).mockResolvedValue({ entries: [], count: 0 })
    mockFilters('BANK_EXAMS')

    renderHook(() => useAdminLeaderboard())
    const result = (await capturedFetcher()()) as { data: { entries: unknown[]; count: number }; error: null }

    expect(leaderboardRepo.fetchAdminLeaderboardPage).toHaveBeenCalledWith({
      examIds: ['BANK_EXAMS'],
      paperId: null,
      limit: 50,
      offset: 0,
    })
    // Real backend answer (genuine zero rows here) — not a fabricated guard value.
    expect(result).toEqual({ data: { entries: [], count: 0 }, error: null })
  })

  it('service maps BANK_EXAMS to its own exam id (no APPSC-only rewriting)', async () => {
    vi.mocked(leaderboardRepo.fetchAdminLeaderboardPage).mockResolvedValue({ entries: [], count: 0 })
    await fetchAdminLeaderboard('BANK_EXAMS', 'all', 0, 50)
    expect(leaderboardRepo.fetchAdminLeaderboardPage).toHaveBeenCalledWith(
      expect.objectContaining({ examIds: ['BANK_EXAMS'] }),
    )
  })

  it('APPSC_GROUP_1 mapping is unchanged', async () => {
    vi.mocked(fetchActiveExams).mockResolvedValue([
      { exam_id: 'APPSC_GROUP_1', name: 'APPSC Group 1', exam_selection: 'APPSC_GROUPS' },
    ] as never)
    vi.mocked(leaderboardRepo.fetchAdminLeaderboardPage).mockResolvedValue({ entries: [], count: 0 })
    mockFilters('APPSC_GROUP_1')
    renderHook(() => useAdminLeaderboard())
    await capturedFetcher()()
    expect(leaderboardRepo.fetchAdminLeaderboardPage).toHaveBeenCalledWith(
      expect.objectContaining({ examIds: ['APPSC_GROUP_1'] }),
    )
  })

  it('APPSC_GROUPS aggregate mapping is unchanged (four group exams)', async () => {
    vi.mocked(fetchActiveExams).mockResolvedValue([] as never)
    vi.mocked(leaderboardRepo.fetchAdminLeaderboardPage).mockResolvedValue({ entries: [], count: 0 })
    mockFilters('APPSC_GROUPS')
    renderHook(() => useAdminLeaderboard())
    await capturedFetcher()()
    expect(leaderboardRepo.fetchAdminLeaderboardPage).toHaveBeenCalledWith(
      expect.objectContaining({
        examIds: ['APPSC_GROUP_1', 'APPSC_GROUP_2', 'APPSC_GROUP_3', 'APPSC_GROUP_4'],
      }),
    )
  })

  it("'all' keeps the no-exam-filter mapping", async () => {
    vi.mocked(fetchActiveExams).mockResolvedValue([] as never)
    vi.mocked(leaderboardRepo.fetchAdminLeaderboardPage).mockResolvedValue({ entries: [], count: 0 })
    mockFilters('all')
    renderHook(() => useAdminLeaderboard())
    await capturedFetcher()()
    expect(leaderboardRepo.fetchAdminLeaderboardPage).toHaveBeenCalledWith(
      expect.objectContaining({ examIds: [] }),
    )
  })

  it('an unknown URL exam normalizes to the platform default and NEVER fabricates success-empty', async () => {
    vi.mocked(fetchActiveExams).mockResolvedValue([
      { exam_id: 'APPSC_GROUP_1', name: 'APPSC Group 1', exam_selection: 'APPSC_GROUPS' },
      { exam_id: 'BANK_EXAMS', name: 'Bank Exams', exam_selection: 'BANK_EXAMS' },
    ] as never)
    vi.mocked(leaderboardRepo.fetchAdminLeaderboardPage).mockResolvedValue({ entries: [], count: 0 })
    mockFilters('garbage_exam')
    renderHook(() => useAdminLeaderboard())

    let settled = false
    void capturedFetcher()().then(() => {
      settled = true
    })
    await flushMicrotasks()

    // Normalized through the existing filter system…
    const filters = vi.mocked(useAdminFilters).mock.results[0].value
    expect(filters.setSelectedExam).toHaveBeenCalledWith('APPSC_GROUP_1')
    // …the backend was NOT consulted for garbage…
    expect(leaderboardRepo.fetchAdminLeaderboardPage).not.toHaveBeenCalled()
    // …and the abandoned request never resolves into a success-empty render.
    expect(settled).toBe(false)
  })

  it('when the exam list itself fails, the RPC remains the sole authority', async () => {
    vi.mocked(fetchActiveExams).mockRejectedValue(new Error('network down'))
    vi.mocked(leaderboardRepo.fetchAdminLeaderboardPage).mockResolvedValue({ entries: [], count: 0 })
    mockFilters('BANK_EXAMS')
    renderHook(() => useAdminLeaderboard())
    await capturedFetcher()()
    expect(leaderboardRepo.fetchAdminLeaderboardPage).toHaveBeenCalled()
  })

  it('the stale APPSC-only allowlist no longer exists in the hook source', () => {
    const hookSource = readFileSync(
      join(here, '../components/admin/leaderboard/useAdminLeaderboard.ts'),
      'utf-8',
    )
    expect(hookSource).not.toContain("startsWith('APPSC_GROUP_')")
    expect(hookSource).not.toContain('entries: [], count: 0 } as LeaderboardResult, error: null')
  })
})

describe('BUG-003 — failed paper load surfaces error + retry', () => {
  const baseInput = {
    selectedExam: 'APPSC_GROUP_1',
    setSelectedExam: vi.fn(),
    selectedPaper: 'all',
    setSelectedPaper: vi.fn(),
    hideAll: true,
    showPapers: true,
    showSubjects: false,
  }

  it('hook exposes papersError and refetchPapers from the shared query contract', async () => {
    papersQueryOutcome.current = 'failure'
    const { result } = renderHook(() => useExamPaperSubjectSelection(baseInput))
    await waitFor(() => expect(result.current.papersError).toContain('Connection lost'))
    expect(typeof result.current.refetchPapers).toBe('function')
    result.current.refetchPapers()
    expect(papersRefetch.fn).toHaveBeenCalledTimes(1)
  })

  it('renders the canonical error + retry surface instead of a silent empty row', async () => {
    papersQueryOutcome.current = 'failure'
    const { container } = render(
      <ThemeProvider>
        <AdminSelectionTabs {...baseInput} />
      </ThemeProvider>,
    )
    await waitFor(() => expect(container.textContent).toContain('Failed to load papers'))
    expect(container.textContent).toContain('Connection lost.')
    const retry = container.querySelector('[aria-label="Try Again"]')
    expect(retry).toBeTruthy()
    fireEvent.click(retry!)
    expect(papersRefetch.fn).toHaveBeenCalled()
  })

  it('a successful paper load renders tabs and no error surface', async () => {
    const { container } = render(
      <ThemeProvider>
        <AdminSelectionTabs {...baseInput} />
      </ThemeProvider>,
    )
    await waitFor(() => expect(container.textContent).toContain('PAPER 1'))
    expect(container.textContent).not.toContain('Failed to load papers')
  })

  it('retained papers keep rendering while a refetch fails (flicker prevention)', async () => {
    const view = render(
      <ThemeProvider>
        <AdminSelectionTabs {...baseInput} />
      </ThemeProvider>,
    )
    await waitFor(() => expect(view.container.textContent).toContain('PAPER 1'))

    papersQueryOutcome.current = 'failure'
    view.rerender(
      <ThemeProvider>
        <AdminSelectionTabs {...baseInput} />
      </ThemeProvider>,
    )
    // Retained data wins over the new failure (matches exam-tab gating); no
    // false empty row and no premature error surface.
    expect(view.container.textContent).toContain('PAPER 1')
    expect(view.container.textContent).not.toContain('Failed to load papers')
  })
})

describe('BUG-005 — skeleton header matches final header geometry', () => {
  const pageSource = readFileSync(join(here, '../pages/admin/AdminLeaderboard.tsx'), 'utf-8')

  it('skeleton header padding equals the LeaderboardView header padding (py-4)', () => {
    const viewSource = readFileSync(join(here, '../components/admin/leaderboard/LeaderboardView.tsx'), 'utf-8')
    expect(pageSource).toContain('LEADERBOARD_GRID_INSET')
    expect(pageSource).toContain('py-4')
    expect(viewSource).toContain('py-4')
    expect(pageSource).not.toContain('py-3.5')
  })
})

describe('warm-cache typed payload restore (BUG-004 support)', () => {
  it('namespace-qualified keys restore the leaderboard payload after remount', async () => {
    // Real cache layer (no mocks): two consumers, identical deps, distinct
    // namespaces/domains must never hydrate each other's payloads.
    sessionStorage.clear()
    const { useSupabaseQuery: realUseSupabaseQuery } = await vi.importActual<
      typeof import('../hooks/useSupabaseQuery')
    >('../hooks/useSupabaseQuery')

    function DomainA() {
      const { data, loading } = realUseSupabaseQuery(
        async () => ({ data: { domain: 'admin_leaderboard', rows: [1, 2, 3] }, error: null }),
        ['shared', 'deps'],
        'admin_leaderboard',
      )
      if (loading) return <p>loading-a</p>
      return <p>a:{JSON.stringify(data)}</p>
    }
    function DomainB() {
      const { data, loading } = realUseSupabaseQuery(
        async () => ({ data: { domain: 'other', rows: [9] }, error: null }),
        ['shared', 'deps'],
        'other_domain',
      )
      if (loading) return <p>loading-b</p>
      return <p>b:{JSON.stringify(data)}</p>
    }

    const first = render(
      <>
        <DomainA />
        <DomainB />
      </>,
    )
    await waitFor(() => expect(first.container.textContent).toContain('a:{"domain":"admin_leaderboard","rows":[1,2,3]}'))
    await waitFor(() => expect(first.container.textContent).toContain('b:{"domain":"other","rows":[9]}'))
    first.unmount()

    // Warm cache remount: hydrated payloads stay domain-correct.
    const second = render(<DomainA />)
    await waitFor(() =>
      expect(second.container.textContent).toContain('a:{"domain":"admin_leaderboard","rows":[1,2,3]}'),
    )
    expect(second.container.textContent).not.toContain('"domain":"other"')
    second.unmount()
    sessionStorage.clear()
  })
})
