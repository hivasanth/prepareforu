/// <reference types="node" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, cleanup } from '@testing-library/react'
import { ThemeProvider } from './context/ThemeContext'
import { LeaderboardView } from './components/admin/leaderboard/LeaderboardView'
import { LEADERBOARD_GRID } from './components/admin/leaderboard/leaderboardGrid'
import AdminLeaderboardPage from './pages/admin/AdminLeaderboard'
import { fetchAdminLeaderboard } from './services/leaderboardService'
import * as leaderboardRepo from './lib/repositories/leaderboard.repository'
import { useAdminLeaderboard } from './components/admin/leaderboard/useAdminLeaderboard'
import type { AdminLeaderboardEntry } from './types/leaderboard.types'

/* ─── AL-01…AL-10 regression suite ──────────────────────────────────────────
 * Structural + data tests for the /admin/leaderboard remediation. Each test
 * names the audit finding it locks in. LIVE security/data verification for
 * S-1/S-2/B-1 is documented in the final remediation report (requires admin
 * database access; the migration carries idempotent REVOKE/GUARD statements).
 * AL-08/AL-09 assert the migration source statically here. */

const here = dirname(fileURLToPath(import.meta.url))

vi.mock('./lib/repositories/leaderboard.repository', () => ({
  fetchAdminLeaderboardPage: vi.fn(),
  LEADERBOARD_TOP_LIMIT: 50,
}))

vi.mock('./components/admin/leaderboard/useAdminLeaderboard', () => ({
  useAdminLeaderboard: vi.fn(),
}))

vi.mock('./components/admin/shared/AdminSelectionTabs', () => ({
  AdminSelectionTabs: () => <div data-testid="selection-tabs" />,
}))

function entry(overrides: Partial<AdminLeaderboardEntry> = {}): AdminLeaderboardEntry {
  return {
    user_id: 'u1',
    user_name: 'Alice',
    exam_id: 'APPSC_GROUP_1',
    exam_selection: 'APPSC_GROUPS',
    paper_id: null,
    best_score: 100,
    best_accuracy: 95,
    best_time_secs: 600,
    last_attempt_date: '2026-01-15T10:00:00Z',
    total_attempts: 3,
    rank: 1,
    ...overrides,
  }
}

function renderView(data: AdminLeaderboardEntry[]) {
  return render(
    <ThemeProvider>
      <LeaderboardView data={data} />
    </ThemeProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

const viewSource = readFileSync(join(here, 'components/admin/leaderboard/LeaderboardView.tsx'), 'utf-8')
const serviceSource = readFileSync(join(here, 'services/leaderboardService.ts'), 'utf-8')
const migrationSource = readFileSync(
  join(here, '../supabase/migrations/20260821000000_admin_leaderboard_security_rank.sql'),
  'utf-8',
)

describe('AL-01/U-1 — header and rows share one content origin', () => {
  it('header renders with padding="none" and the shared px-1 grid inset', () => {
    const { container } = renderView([entry()])
    const headerGrid = container.querySelector('.grid')!
    expect(headerGrid.className).toContain('px-1')
    // SelectionContainer must contribute no padding (p-0), only its material.
    const selection = headerGrid.closest('[class*="rounded-2xl"]')!
    expect(selection.className).toMatch(/p-0/)
    expect(selection.className).not.toMatch(/\bp-3\b/)
  })

  it('row grids use the identical LEADERBOARD_GRID class string as the header', () => {
    const { container } = renderView([entry(), entry({ user_id: 'u2' })])
    const grids = Array.from(container.querySelectorAll('.grid'))
    expect(grids.length).toBeGreaterThanOrEqual(3)
    for (const g of grids) {
      expect(g.className).toContain(LEADERBOARD_GRID)
      expect(g.className).toContain('px-1')
    }
  })
})

describe('AL-02/U-3 — deterministic responsive tracks', () => {
  it('grid template uses fixed metric tracks + flexible participant (no auto/max-content)', () => {
    expect(LEADERBOARD_GRID).toContain('grid-cols-[56px_minmax(0,1fr)_96px]')
    expect(LEADERBOARD_GRID).toContain('lg:grid-cols-[64px_minmax(0,1fr)_112px_112px_96px_144px]')
    expect(LEADERBOARD_GRID).not.toMatch(/auto|max-content/)
  })

  it('metric columns are lg-only in header and rows', () => {
    const { container } = renderView([entry()])
    const grids = Array.from(container.querySelectorAll('.grid'))
    for (const g of grids) {
      const cells = Array.from(g.children)
      expect(cells[0].className).not.toContain('hidden')
      expect(cells[1].className).not.toContain('hidden')
      expect(cells[2].className).not.toContain('hidden')
      expect(cells[3].className).toContain('hidden lg:block')
      expect(cells[4].className).toContain('hidden lg:block')
      expect(cells[5].className).toContain('hidden lg:block')
    }
  })
})

describe('AL-03/B-1 — rank is database-authoritative', () => {
  it('service passes the RPC rank through untouched (page 2 keeps global ranks)', async () => {
    vi.mocked(leaderboardRepo.fetchAdminLeaderboardPage).mockResolvedValue({
      entries: [
        { user_id: 'u51', user_name: 'Fifty First', exam_id: 'e1', rank: 51, best_score: 50, best_accuracy: 40, best_time_secs: 900, total_attempts: 1, last_attempt_date: '2026-02-01T00:00:00Z' },
        { user_id: 'u52', user_name: 'Fifty Second', exam_id: 'e1', rank: 52, best_score: 49, best_accuracy: 40, best_time_secs: 900, total_attempts: 1, last_attempt_date: '2026-02-01T00:00:00Z' },
      ],
      count: 100,
    })

    const { entries } = await fetchAdminLeaderboard('APPSC_GROUP_1', 'all', 1, 50)
    expect(entries.map((e) => e.rank)).toEqual([51, 52])
  })

  it('client-side assignRanks no longer exists anywhere in the admin path', () => {
    expect(serviceSource).not.toContain('assignRanks')
    expect(viewSource).not.toContain('assignRanks')
  })
})

describe('AL-04/B-2 — deterministic ordering parameters', () => {
  it('repository delegates to the ranked RPC with pagination args', async () => {
    vi.mocked(leaderboardRepo.fetchAdminLeaderboardPage).mockResolvedValue({ entries: [], count: 0 })
    await fetchAdminLeaderboard('APPSC_GROUP_1', 'paper-1', 2, 50)
    expect(leaderboardRepo.fetchAdminLeaderboardPage).toHaveBeenCalledWith({
      examIds: ['APPSC_GROUP_1'],
      paperId: 'paper-1',
      limit: 50,
      offset: 100,
    })
  })

  it('migration orders by score DESC, accuracy DESC, time ASC with submitted_at/user_id tiebreakers', () => {
    expect(migrationSource).toMatch(/ORDER BY l\.best_score DESC, l\.best_accuracy DESC,\s+l\.best_time_secs ASC, l\.best_submitted_at ASC,\s+l\.user_id ASC/)
    expect(migrationSource).toMatch(/ORDER BY v\.best_score DESC, v\.best_accuracy DESC,\s+v\.best_time_secs ASC, v\.last_attempt_date ASC,\s+v\.user_id ASC/)
  })
})

describe('AL-05/U-5 — null-safe participant names', () => {
  it('normalizes null/empty names to "Unknown" at the service boundary', async () => {
    vi.mocked(leaderboardRepo.fetchAdminLeaderboardPage).mockResolvedValue({
      entries: [
        { user_id: 'u1', user_name: null, exam_id: 'e1', rank: 1, best_score: 10, best_accuracy: 10, best_time_secs: 60, total_attempts: 1, last_attempt_date: '2026-02-01T00:00:00Z' },
        { user_id: 'u2', user_name: '   ', exam_id: 'e1', rank: 2, best_score: 9, best_accuracy: 10, best_time_secs: 60, total_attempts: 1, last_attempt_date: '2026-02-01T00:00:00Z' },
      ],
      count: 2,
    })
    const { entries } = await fetchAdminLeaderboard('APPSC_GROUP_1', 'all', 0, 50)
    expect(entries.map((e) => e.user_name)).toEqual(['Unknown', 'Unknown'])
  })

  it('view never indexes user_name directly', () => {
    expect(viewSource).not.toContain('user_name[')
  })
})

describe('AL-06/U-2 — neutral semantic component', () => {
  it('attempts cell renders a neutral Pill, not Badge', () => {
    const { container } = renderView([entry()])
    const grids = Array.from(container.querySelectorAll('.grid'))
    const attemptsCell = grids[1].children[4] // first row, attempts column
    expect(attemptsCell.querySelector('[data-role="information"]')!.className).toContain('bg-hover-bg')
    expect(viewSource).not.toContain('<Badge')
    // The only variant="neutral" usage must be on Pill:
    expect(viewSource.match(/variant="neutral"/g)?.length).toBe(1)
  })
})

describe('AL-07/P-1/S-2 — no client-triggered MV refresh', () => {
  it('service no longer exports refreshLeaderboardView and the read path calls only the ranked RPC', async () => {
    expect(serviceSource).not.toContain('refreshLeaderboardView')
    await fetchAdminLeaderboard('APPSC_GROUP_1', 'all', 0, 50)
    expect(leaderboardRepo.fetchAdminLeaderboardPage).toHaveBeenCalledTimes(1)
  })

  it('migration guards refresh_leaderboard_view with is_admin()', () => {
    expect(migrationSource).toMatch(/CREATE OR REPLACE FUNCTION public\.refresh_leaderboard_view\(\)[\s\S]*IF NOT public\.is_admin\(\) THEN[\s\S]*REFRESH MATERIALIZED VIEW public\.admin_leaderboard_view;/)
    expect(migrationSource).toContain("REVOKE EXECUTE ON FUNCTION public.refresh_leaderboard_view()")
  })
})

describe('AL-08/S-1 — materialized view locked at the database level', () => {
  it('migration revokes direct SELECT from PUBLIC, anon, and authenticated', () => {
    expect(migrationSource).toContain('REVOKE SELECT ON public.admin_leaderboard_view FROM PUBLIC;')
    expect(migrationSource).toContain('REVOKE SELECT ON public.admin_leaderboard_view FROM anon;')
    expect(migrationSource).toContain('REVOKE SELECT ON public.admin_leaderboard_view FROM authenticated;')
  })

  it('get_admin_leaderboard is SECURITY DEFINER with an is_admin() guard and pinned search_path', () => {
    expect(migrationSource).toMatch(/CREATE OR REPLACE FUNCTION public\.get_admin_leaderboard\([\s\S]*SECURITY DEFINER\s+SET search_path = ''[\s\S]*IF NOT public\.is_admin\(\) THEN/)
    expect(migrationSource).toContain('GRANT EXECUTE ON FUNCTION public.get_admin_leaderboard(text[], uuid, integer, integer)')
  })
})

describe('AL-09/U-4 — canonical Avatar replaces raw inline avatar', () => {
  it('rows render Avatar and carry no raw elevation/color utilities', () => {
    const { container } = renderView([entry()])
    const avatar = container.querySelector('[aria-hidden="true"] > div[class*="w-9 h-9"]')
    expect(avatar).toBeTruthy()
    expect(viewSource).not.toContain('shadow-primary/20')
    expect(viewSource).not.toContain('bg-primary text-white')
  })
})

describe('AL-10/U-7/U-8/U-9 — layout, skeleton, and heading', () => {
  it('FloatingListItem no longer uses the vestigial stacked layout', () => {
    expect(viewSource).not.toContain('layout="stacked"')
  })

  it('loading state renders the shape-matched skeleton (no Spinner card)', () => {
    vi.mocked(useAdminLeaderboard).mockReturnValue({
      entries: [], count: 0, loading: true, error: null, refetch: vi.fn(),
      page: 0, setPage: vi.fn(), hasMore: false,
      selectedExam: 'APPSC_GROUPS', selectedPaper: 'all',
      setSelectedExam: vi.fn(), setSelectedPaper: vi.fn(),
    })

    const { container } = render(
      <ThemeProvider>
        <AdminLeaderboardPage />
      </ThemeProvider>,
    )
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(container.textContent).not.toContain('Syncing rankings')
    // Skeleton reuses the ONE shared grid contract:
    const skeletonGrids = Array.from(container.querySelectorAll('.grid')).filter((g) =>
      g.className.includes(LEADERBOARD_GRID),
    )
    expect(skeletonGrids.length).toBeGreaterThanOrEqual(2)
  })

  it('page exposes an sr-only h1', () => {
    vi.mocked(useAdminLeaderboard).mockReturnValue({
      entries: [], count: 0, loading: false, error: null, refetch: vi.fn(),
      page: 0, setPage: vi.fn(), hasMore: false,
      selectedExam: 'APPSC_GROUPS', selectedPaper: 'all',
      setSelectedExam: vi.fn(), setSelectedPaper: vi.fn(),
    })

    const { container } = render(
      <ThemeProvider>
        <AdminLeaderboardPage />
      </ThemeProvider>,
    )
    const h1 = container.querySelector('h1')!
    expect(h1.className).toContain('sr-only')
    expect(h1.textContent).toBe('Admin Leaderboard')
  })
})
