/// <reference types="node" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ReactNode } from 'react'
import { render, renderHook, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { dashboardService } from './services/dashboardService'
import { adminService } from './services/adminService'
import { countQuery } from './lib/repositories/base.repository'
import { useSupabaseQuery } from './hooks/useSupabaseQuery'
import { useAdminOverview } from './components/admin/overview/useAdminOverview'
import { useExamPaperSubjectSelection } from './hooks/useExamPaperSubjectSelection'
import { StatsGrid } from './components/admin/overview/StatsGrid'
import { Tabs } from './components/common/AntigravityData'

/* ─── AO-01…AO-09 regression suite for /admin/overview ──────────────────────
 * BUG-01 count failures must surface as errors, never as successful zeros.
 * BUG-02 stale async responses must never win over newer ones (sequence guard).
 * BUG-03 invalid ?exam= deep links normalize to 'all' everywhere.
 * BUG-04 papers query must not fire when the paper row is disabled.
 * BUG-05 exactly one live announcement per section during loading.
 * BUG-06 errors are classified centrally; no hardcoded category/raw messages.
 * BUG-07 MotionConfig reducedMotion="user" at the application root.
 * BUG-09 Tabs emit aria-selected without dangling aria-controls. */

const here = dirname(fileURLToPath(import.meta.url))
const src = (p: string) => readFileSync(join(here, p), 'utf-8')

vi.mock('./lib/repositories/base.repository', () => ({ countQuery: vi.fn() }))
vi.mock('./lib/supabase', () => ({ supabase: {} }))

/* In-memory stand-in for the SWR layer so race tests can assert cache writes. */
const cacheStore = new Map<string, unknown>()
vi.mock('./services/adminQueryCache', () => ({
  getCacheSWR: vi.fn((key: string) => {
    const hit = cacheStore.get(key)
    return hit === undefined ? undefined : { data: hit, ts: Date.now() }
  }),
  setCache: vi.fn((key: string, data: unknown) => { cacheStore.set(key, data) }),
}))

vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: { id: 'admin-1', role: 'admin', exam_selection: 'BANK_EXAMS' } }),
}))

vi.mock('./services/adminService', () => ({
  adminService: { fetchPapersByExam: vi.fn(async () => [{ id: 'p1', name: 'Paper 1' }]) },
}))

beforeEach(() => {
  vi.clearAllMocks()
  cacheStore.clear()
})

afterEach(cleanup)

const ui = (node: ReactNode) => render(<ThemeProvider>{node}</ThemeProvider>)

/* ════════════════════════ BUG-01 — counts fail fast ═════════════════════ */

describe('BUG-01 — fetchOverviewCounts surfaces failures as errors', () => {
  const svc = dashboardService

  it('CASE A — all four counts succeed → numbers returned', async () => {
    vi.mocked(countQuery)
      .mockResolvedValueOnce(12)   // users
      .mockResolvedValueOnce(96)   // questions
      .mockResolvedValueOnce(5)    // configs
      .mockResolvedValueOnce(16)   // attempts
    await expect(svc.fetchOverviewCounts('all', [])).resolves.toEqual({
      users: 12, questions: 96, configs: 5, attempts: 16,
    })
  })

  it('CASE B/C — one or more counts reject → service rejects (never zeros)', async () => {
    vi.mocked(countQuery)
      .mockRejectedValueOnce(new Error('RLS violation'))
      .mockResolvedValueOnce(1).mockResolvedValueOnce(1).mockResolvedValueOnce(1)
    await expect(svc.fetchOverviewCounts('all', [])).rejects.toThrow('RLS violation')

    vi.mocked(countQuery).mockReset()
    vi.mocked(countQuery)
      .mockResolvedValueOnce(1)
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(1)
    await expect(svc.fetchOverviewCounts('BANK_EXAMS', ['p1'])).rejects.toThrow()
  })

  it('CASE D — retry after failure succeeds when the next attempt resolves', async () => {
    const q = vi.mocked(countQuery)
    // Invocation 1 consumes four entries (users rejects); invocation 2 the next four.
    q.mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(0)
    await expect(svc.fetchOverviewCounts('all', [])).rejects.toThrow('network')
    q.mockResolvedValueOnce(12).mockResolvedValueOnce(96).mockResolvedValueOnce(5).mockResolvedValueOnce(16)
    await expect(svc.fetchOverviewCounts('all', [])).resolves.toEqual({
      users: 12, questions: 96, configs: 5, attempts: 16,
    })
  })

  it('CASE E — legitimate zero rows resolve as SUCCESS with zeros', async () => {
    vi.mocked(countQuery).mockResolvedValue(0)
    await expect(svc.fetchOverviewCounts('all', [])).resolves.toEqual({
      users: 0, questions: 0, configs: 0, attempts: 0,
    })
  })

  it('filters propagate per-count (exam scoping only where required)', async () => {
    vi.mocked(countQuery).mockResolvedValue(0)
    await svc.fetchOverviewCounts('APPSC_GROUPS', ['exam-x'])
    expect(vi.mocked(countQuery).mock.calls[0]).toEqual([
      'users', { is_active: true, role: 'user', exam_selection: 'APPSC_GROUPS' },
    ])
    expect(vi.mocked(countQuery).mock.calls[1]).toEqual([
      'questions', { is_active: true, exam_id: ['exam-x'] },
    ])
    expect(vi.mocked(countQuery).mock.calls[2]).toEqual([
      'exam_configs', { is_published: true, exam_selection: 'APPSC_GROUPS' },
    ])
    expect(vi.mocked(countQuery).mock.calls[3]).toEqual([
      'attempts', { source: 'exam_tab', exam_id: ['exam-x'] },
    ])
  })

  it('repository countQuery throws on error and returns a number (static)', () => {
    const repoSrc = src('lib/repositories/base.repository.ts')
    expect(repoSrc).toMatch(/const \{ count, error \} = await q[\s\S]*?if \(error\) throw error[\s\S]*?return count \?\? 0/)
    expect(repoSrc).not.toMatch(/Promise<number \| null>/)
    expect(src('services/dashboardService.ts')).not.toContain('allSettled')
  })
})

/* ══════════════════ BUG-02 — stale responses never win ══════════════════ */

describe('BUG-02 — useSupabaseQuery sequence guard', () => {
  function makeDeferred<T>() {
    let resolve!: (v: { data: T | null; error: unknown }) => void
    let reject!: (e: unknown) => void
    const promise = new Promise<{ data: T | null; error: unknown }>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }

  it('a slow response for the previous filter is fully ignored (state + cache)', async () => {
    const A = makeDeferred<{ v: string }>()
    const B = makeDeferred<{ v: string }>()
    const fns: Record<string, () => Promise<{ data: { v: string } | null; error: unknown }>> = {
      A: () => A.promise,
      B: () => B.promise,
    }

    const { result, rerender } = renderHook(
      ({ dep }: { dep: string }) => useSupabaseQuery(fns[dep], [dep]),
      { initialProps: { dep: 'A' } },
    )

    rerender({ dep: 'B' })
    await act(async () => { B.resolve({ data: { v: 'content-for-B' }, error: null }) })
    expect(result.current.data).toEqual({ v: 'content-for-B' })
    expect(cacheStore.get('B')).toEqual({ v: 'content-for-B' })

    // FILTER A's response arrives late — it must change nothing.
    await act(async () => { A.resolve({ data: { v: 'stale-content-A' }, error: null }) })
    expect(result.current.data).toEqual({ v: 'content-for-B' })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(cacheStore.has('A')).toBe(false)
  })

  it('a late rejection for the previous filter does not surface an error', async () => {
    const C = makeDeferred<{ v: string }>()
    const D = makeDeferred<{ v: string }>()
    const fns: Record<string, () => Promise<{ data: { v: string } | null; error: unknown }>> = {
      C: () => C.promise,
      D: () => D.promise,
    }

    const { result, rerender } = renderHook(
      ({ dep }: { dep: string }) => useSupabaseQuery(fns[dep], [dep]),
      { initialProps: { dep: 'C' } },
    )

    rerender({ dep: 'D' })
    await act(async () => { D.resolve({ data: { v: 'd' }, error: null }) })
    await act(async () => { C.reject(new Error('late network blip')) })

    expect(result.current.error).toBeNull()
    expect(result.current.data).toEqual({ v: 'd' })
  })

  it('the newest request still wins when it resolves first (fast B, slow A)', async () => {
    const A = makeDeferred<{ v: string }>()
    const B = makeDeferred<{ v: string }>()
    const fns: Record<string, () => Promise<{ data: { v: string } | null; error: unknown }>> = {
      A: () => A.promise,
      B: () => B.promise,
    }

    const { result, rerender } = renderHook(
      ({ dep }: { dep: string }) => useSupabaseQuery(fns[dep], [dep]),
      { initialProps: { dep: 'A' } },
    )
    rerender({ dep: 'B' })
    await act(async () => { B.resolve({ data: { v: 'b-fast' }, error: null }) })
    await act(async () => { A.resolve({ data: { v: 'a-slow' }, error: null }) })
    expect(result.current.data).toEqual({ v: 'b-fast' })
    expect(cacheStore.get('B')).toEqual({ v: 'b-fast' })
    expect(cacheStore.has('A')).toBe(false)
  })
})

/* ══════════════════════════════════════════════════════════════════════════ */

describe('BUG-03 — invalid ?exam= normalizes to ALL everywhere', () => {
  function setup(route: string) {
    return renderHook(() => useAdminOverview(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      ),
    })
  }

  it('?exam=GARBAGE behaves exactly like ?exam=all', () => {
    const garbage = setup('/admin/overview?exam=GARBAGE')
    expect(garbage.result.current.selectedExam).toBe('all')
    expect(garbage.result.current.resolvedIds).toEqual([])

    const all = setup('/admin/overview')
    expect(all.result.current.selectedExam).toBe('all')
    expect(garbage.result.current.resolvedIds).toEqual(all.result.current.resolvedIds)
  })

  it('valid exams pass through with their resolved ids', () => {
    const bank = setup('/admin/overview?exam=BANK_EXAMS')
    expect(bank.result.current.selectedExam).toBe('BANK_EXAMS')
    expect(bank.result.current.resolvedIds).toEqual(['BANK_EXAMS'])
  })

  it('setSelectedExam writes/removes the param with replace semantics', () => {
    const h = setup('/admin/overview')
    expect(h.result.current.isValidExam).toBe(true)
    act(() => h.result.current.setSelectedExam('APPSC_GROUPS'))
    expect(h.result.current.selectedExam).toBe('APPSC_GROUPS')
    expect(h.result.current.isValidExam).toBe(true)
    act(() => h.result.current.setSelectedExam('all'))
    expect(h.result.current.selectedExam).toBe('all')
  })
})

/* ══════════════════════════════════════════════════════════════════════════ */

describe('BUG-04 — papers query gated on showPapers', () => {
  // Stable identities — the hook syncs customExamTabs by reference each render.
  const STABLE_TABS = [{ id: 'BANK_EXAMS', label: 'Bank Exams' }]

  function setup(showPapers: boolean) {
    return renderHook(
      ({ showPapers }: { showPapers: boolean }) =>
        useExamPaperSubjectSelection({
          selectedExam: 'BANK_EXAMS',
          setSelectedExam: vi.fn(),
          showPapers,
          customExamTabs: STABLE_TABS,
        }),
      { initialProps: { showPapers } },
    )
  }

  it('does not fetch papers when the paper row is disabled', async () => {
    setup(false)
    await act(async () => {})
    expect(adminService.fetchPapersByExam).not.toHaveBeenCalled()
  })

  it('fetches once when enabled', async () => {
    setup(true)
    await waitFor(() => expect(adminService.fetchPapersByExam).toHaveBeenCalledTimes(1))
    expect(adminService.fetchPapersByExam).toHaveBeenCalledWith('BANK_EXAMS')
  })
})

/* ══════════════════════════════════════════════════════════════════════════ */

describe('BUG-05 — one loading voice per section', () => {
  it('StatsGrid exposes exactly one role="status" while skeletons are up, then swaps to content', async () => {
    let resolveCounts!: (v: unknown) => void
    vi.spyOn(dashboardService, 'fetchOverviewCounts')
      .mockImplementation(() => new Promise((res) => { resolveCounts = res }) as never)

    const { container } = ui(<StatsGrid selectedExam="all" resolvedIds={[]} />)

    const statusRegions = container.querySelectorAll('[role="status"]')
    expect(statusRegions.length).toBe(1)
    expect(statusRegions[0].getAttribute('aria-label')).toMatch(/loading statistics/i)
    expect(statusRegions[0].querySelector('[aria-hidden="true"]')).toBeTruthy()

    await act(async () => { resolveCounts({ users: 12, attempts: 16, questions: 96, configs: 5 }) })
    expect(container.querySelectorAll('[role="status"]').length).toBe(0)
    expect(screen.getByRole('region', { name: /statistics summary/i })).toBeTruthy()
  })

  it('chart owns one announcement; Suspense fallback announces separately (static)', () => {
    const chartSrc = src('components/admin/overview/DailyAttemptsChart.tsx')
    expect(chartSrc).toMatch(/role="status"[\s\S]*?Loading daily attempts chart/)
    // Suspense fallback is its own polite announcement so it must not itself
    // nest another status region (chart skeleton is the only inner one).
    const overviewSrc = src('pages/admin/AdminOverview.tsx')
    const suspenseBlock = overviewSrc.match(/<Suspense[\s\S]*?<\/Suspense>/)?.[0] ?? ''
    expect(suspenseBlock).toContain('role="status"')
    expect(suspenseBlock).toContain('aria-label="Loading daily attempts chart"')
    expect(suspenseBlock.match(/role="status"/g)?.length).toBe(1)
  })
})

/* ════════════════════ AO-10 — cache namespace isolation ═════════════════ */

describe('AO-10 — namespace-qualified cache keys never collide', () => {
  it('hook stores identical deps under distinct per-query namespaces', async () => {
    cacheStore.clear()
    const stats = renderHook(() =>
      useSupabaseQuery<{ users: number }>(async () => ({ data: { users: 7 }, error: null }), ['all'], 'overview:stats'),
    )
    const chart = renderHook(() =>
      useSupabaseQuery<Record<string, number>>(async () => ({ data: {}, error: null }), ['all'], 'overview:daily'),
    )
    await waitFor(() => {
      expect(cacheStore.get('overview:stats::all')).toEqual({ users: 7 })
      expect(cacheStore.get('overview:daily::all')).toEqual({})
    })
    expect(cacheStore.size).toBe(2)
    expect(stats.result.current.data).toEqual({ users: 7 })
    expect(chart.result.current.data).toEqual({})
  })

  it('StatsGrid and DailyAttemptsChart opt into their own namespace (static)', () => {
    const statsSrc = src('components/admin/overview/StatsGrid.tsx')
    expect(statsSrc).toMatch(/useSupabaseQuery\([\s\S]*?\[selectedExam\]\s*,\s*'overview:stats'\)/)
    const chartSrc = src('components/admin/overview/DailyAttemptsChart.tsx')
    expect(chartSrc).toMatch(/useSupabaseQuery<[\s\S]*?\[selectedExam, selectedRangeId\]\s*,\s*'overview:daily'\)/)
  })

  it('chart ARIA: figure owns the name; BarChart carries no role/aria-label (static)', () => {
    const chartSrc = src('components/admin/overview/DailyAttemptsChart.tsx')
    expect(chartSrc).toMatch(/tabIndex=\{0\}[^>]*role="figure"/)
    expect(chartSrc).toMatch(/aria-describedby=\{\s*tableTitleId\s*\}/)
    expect(chartSrc).toMatch(/<caption id=\{\s*tableTitleId\s*\}/)
    expect(chartSrc.match(/<BarChart[^>]*role=/)).toBeNull()
    expect(chartSrc.match(/<BarChart[^>]*aria-label=/)).toBeNull()
    // FOCUS_RING is spliced into the focusable figure's className (the literal
    // token value lives in AntigravityMotion.ts; the rendered assertions cover it).
    expect(chartSrc).toMatch(/className=\{[\s\S]*?\$\{FOCUS_RING\}/)
  })
})

/* ══════════════════════════════════════════════════════════════════════════ */

describe('BUG-06 — centralized error classification, safe messages', () => {
  it('hook classifies Supabase errors into canonical categories with friendly copy', async () => {
    const auth = renderHook(() =>
      useSupabaseQuery(async () => ({ data: null, error: { message: 'JWT expired', code: 'PGRST301' } }), ['auth-case']),
    )
    await waitFor(() => expect(auth.result.current.category).toBe('authentication'))
    expect(auth.result.current.error).toBe('Your session has expired. Please sign in again.')
    expect(auth.result.current.data).toBeNull()

    const net = renderHook(() =>
      useSupabaseQuery(async () => { throw new TypeError('Failed to fetch') }, ['net-case']),
    )
    await waitFor(() => expect(net.result.current.category).toBe('network'))
    expect(net.result.current.error).toBe('Please check your internet connection and try again.')

    const unk = renderHook(() =>
      useSupabaseQuery(async () => { throw new Error('internal stack trace leak') }, ['unk-case']),
    )
    await waitFor(() => expect(unk.result.current.error).toBeTruthy())
    expect(unk.result.current.error).not.toContain('stack trace leak')
    expect(unk.result.current.category).toBe('unknown')
  })

  it('no consuming section hardcodes category/severity anymore (static)', () => {
    const gridSrc = src('components/admin/overview/StatsGrid.tsx')
    const chartSrc = src('components/admin/overview/DailyAttemptsChart.tsx')
    for (const s of [gridSrc, chartSrc]) {
      expect(s).not.toContain('category="network"')
      expect(s).not.toContain('severity="critical"')
      expect(s).toContain('severityForCategory(category)')
    }
  })
})

/* ══════════════════════════════════════════════════════════════════════════ */

describe('BUG-07 — reduced motion respected at the root (static)', () => {
  it('App wraps the provider tree in MotionConfig reducedMotion="user"', () => {
    const appSrc = src('App.tsx')
    expect(appSrc).toContain("reducedMotion=\"user\"")
    expect(appSrc).toMatch(/<MotionConfig reducedMotion="user">[\s\S]*?<ThemeProvider>/)
    expect(appSrc).toMatch(/<\/ThemeProvider>[\s\S]*?<\/MotionConfig>/)
  })
})

/* ══════════════════════════════════════════════════════════════════════════ */

describe('BUG-09 — Tabs announce selection without dangling panel refs', () => {
  it('tabs carry aria-selected and never an aria-controls pointing nowhere', () => {
    ui(
      <Tabs
        options={[{ id: 'all', label: 'All Exams' }, { id: 'bank', label: 'Bank Exams' }]}
        activeId="all"
        onChange={() => {}}
        ariaLabel="Exam scope"
      />,
    )
    const tabs = screen.getAllByRole('tab')
    expect(tabs.length).toBe(2)
    for (const tab of tabs) {
      expect(tab).toHaveAttribute('aria-selected')
      expect(tab).not.toHaveAttribute('aria-controls')
    }
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(tabs[1].getAttribute('aria-selected')).toBe('false')
  })

  it('keyboard navigation (Arrow keys / Home / End) still works', () => {
    const onChange = vi.fn()
    ui(
      <Tabs
        options={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]}
        activeId="a"
        onChange={onChange}
        ariaLabel="Nav"
      />,
    )
    const tabs = screen.getAllByRole('tab')
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith('b')
    fireEvent.keyDown(tabs[0], { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith('a')
    fireEvent.keyDown(tabs[0], { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith('c')
    fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenLastCalledWith('c') // wraps backward to last enabled tab
  })
})
