/// <reference types="node" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useExamData } from '../components/sub-admin/exams/useExamData'
import { SegmentedFilter } from '../components/common/SegmentedFilter'
import { ThemeProvider } from '../context/ThemeContext'
import * as teacherExamService from '../services/teacherExamService'

/* ── SUB-ADMIN MY-EXAMS — LIVE / UPCOMING / PUBLISHED SEGMENTED FILTER SUITE ─
 * Locks the time-window classification that powers the LIVE | UPCOMING |
 * PUBLISHED segmented view:
 *   • default (no ?filter=) resolves to 'live'
 *   • unknown ?filter= values fall back to 'live'
 *   • activeFilter is read from the URL
 *   • handleFilterChange reflects the choice in the URL (filter=upcoming /
 *     filter=published; live clears the param)
 *   • activeFilterResults / filterCounts classify exams by start_time/end_time
 *     against the current instant (upcoming before start, live in window,
 *     published after end)
 * Security note: this is a view filter only — authorization is already
 * enforced server-side (sub_admin_id + ensureRole + RLS).
 * ─────────────────────────────────────────────────────────────────────────── */

const mockUser = { id: 'sa-user-1', sub_admin_id: 'sa-row-1', role: 'sub_admin' } as never

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('../lib/repositories/teacherExam.repository', () => ({
  fetchTeacherExamsWithAttempts: vi.fn(),
  findTeacherExamById: vi.fn(),
  fetchTeacherExamQuestions: vi.fn(),
  fetchTeacherExamsWithFullFields: vi.fn(),
  fetchTeacherExamsBySubAdminId: vi.fn(),
  fetchAllTeacherExamsBySubAdminId: vi.fn(),
  createTeacherExamAtomicRpc: vi.fn(),
  fetchSubAdminIdByUserId: vi.fn(),
}))

vi.mock('../lib/repositories/attempt.repository', () => ({
  fetchCompletedAttemptsByTeacherExam: vi.fn(),
  fetchAttemptsWithUsersByTeacherExam: vi.fn(),
  fetchAttemptAnswersByAttemptIds: vi.fn(),
  fetchTeacherExamAttempts: vi.fn(),
  countAttemptsByTeacherExamIds: vi.fn(),
}))

function ui(node: ReactNode, entries: string[] = ['/sub-admin/my-exams']) {
  return (
    <ThemeProvider>
      <MemoryRouter initialEntries={entries}>{node}</MemoryRouter>
    </ThemeProvider>
  )
}

function exam(overrides: Partial<{
  id: string
  title: string
  start_time: string
  end_time: string
  created_at: string
  total_questions: number
  total_marks: number
}> = {}) {
  return {
    id: 'e-' + Math.random().toString(36).slice(2, 8),
    title: 'Exam',
    total_questions: 5,
    total_marks: 100,
    marks_per_question: 20,
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600_000).toISOString(),
    created_at: new Date().toISOString(),
    status: 'published',
    ...overrides,
  }
}

function HookProbe({ onState }: { onState: (s: ReturnType<typeof useExamData>) => void }) {
  const state = useExamData()
  onState(state)
  return null
}

let latest: ReturnType<typeof useExamData> | null = null

async function renderProbe(entries: string[]) {
  latest = null
  vi.spyOn(teacherExamService, 'fetchSubAdminIdByUserId').mockResolvedValue({ id: 'sa-row-1' } as never)
  vi.spyOn(teacherExamService, 'fetchTeacherExamsWithFullFields').mockResolvedValue([] as never)
  render(ui(<HookProbe onState={(s) => { latest = s }} />, entries))
  await waitFor(() => {
    expect(latest!.examsLoading).toBe(false)
  }, { timeout: 3000 })
}

beforeEach(() => {
  vi.clearAllMocks()
  latest = null
})

afterEach(() => {
  cleanup()
})

describe('LIVE / UPCOMING / PUBLISHED classification', () => {
  it('defaults to live and classifies exams by time window', async () => {
    const upcoming = exam({
      start_time: new Date(Date.now() + 2 * 3600_000).toISOString(),
      end_time: new Date(Date.now() + 3 * 3600_000).toISOString(),
    })
    const live = exam({}) // in-window by default (start now, end +1h)
    const published = exam({
      start_time: new Date(Date.now() - 2 * 3600_000).toISOString(),
      end_time: new Date(Date.now() - 3600_000).toISOString(),
    })
    latest = null
    vi.spyOn(teacherExamService, 'fetchSubAdminIdByUserId').mockResolvedValue({ id: 'sa-row-1' } as never)
    vi.spyOn(teacherExamService, 'fetchTeacherExamsWithFullFields').mockResolvedValue([upcoming, live, published] as never)
    render(ui(<HookProbe onState={(s) => { latest = s }} />))
    await waitFor(() => {
      expect(latest!.examsLoading).toBe(false)
    }, { timeout: 3000 })

    expect(latest!.activeFilter).toBe('live')
    expect(latest!.activeFilterResults.map(e => e.id)).toContain(live.id)
    expect(latest!.activeFilterResults.map(e => e.id)).not.toContain(upcoming.id)
    expect(latest!.activeFilterResults.map(e => e.id)).not.toContain(published.id)
    expect(latest!.filterCounts).toEqual({
      live: 1, upcoming: 1, published: 1,
    })
  })

  it('reads the filter from the URL', async () => {
    await renderProbe(['/sub-admin/my-exams?filter=upcoming'])
    expect(latest!.activeFilter).toBe('upcoming')
  })

  it('falls back to live for an unknown filter value', async () => {
    await renderProbe(['/sub-admin/my-exams?filter=hacked'])
    expect(latest!.activeFilter).toBe('live')
  })

  it('handleFilterChange updates activeFilter and reflects in the URL', async () => {
    await renderProbe(['/sub-admin/my-exams'])
    expect(latest!.activeFilter).toBe('live')

    latest!.handleFilterChange('upcoming')
    await waitFor(() => {
      expect(latest!.activeFilter).toBe('upcoming')
    })

    latest!.handleFilterChange('published')
    await waitFor(() => {
      expect(latest!.activeFilter).toBe('published')
    })
  })

  it('classifies an invalid/missing schedule as never live', async () => {
    const malformed = exam({ start_time: null as never, end_time: new Date(Date.now() + 3600_000).toISOString() })
    latest = null
    vi.spyOn(teacherExamService, 'fetchSubAdminIdByUserId').mockResolvedValue({ id: 'sa-row-1' } as never)
    vi.spyOn(teacherExamService, 'fetchTeacherExamsWithFullFields').mockResolvedValue([malformed] as never)
    render(ui(<HookProbe onState={(s) => { latest = s }} />))
    await waitFor(() => {
      expect(latest!.examsLoading).toBe(false)
    }, { timeout: 3000 })

    expect(latest!.filterCounts).toEqual({ live: 0, upcoming: 0, published: 1 })
  })

  it('live/upcoming show all exams regardless of year/month; published respects it', async () => {
    const liveNow = exam({}) // in-window, created this month
    const upcomingOld = exam({
      start_time: new Date(Date.now() + 2 * 3600_000).toISOString(),
      end_time: new Date(Date.now() + 3 * 3600_000).toISOString(),
      created_at: '2020-01-01T00:00:00Z', // deliberately outside current year/month
    })
    latest = null
    vi.spyOn(teacherExamService, 'fetchSubAdminIdByUserId').mockResolvedValue({ id: 'sa-row-1' } as never)
    vi.spyOn(teacherExamService, 'fetchTeacherExamsWithFullFields').mockResolvedValue([liveNow, upcomingOld] as never)
    render(ui(<HookProbe onState={(s) => { latest = s }} />))
    await waitFor(() => {
      expect(latest!.examsLoading).toBe(false)
    }, { timeout: 3000 })

    // LIVE ignores the year/month filter: upcomingOld (created 2020) is excluded
    // from filteredExams, but LIVE still shows the live exam and UPCOMING still
    // shows the old-schedule exam.
    expect(latest!.activeFilterResults.map(e => e.id)).toContain(liveNow.id)

    latest!.handleFilterChange('upcoming')
    await waitFor(() => {
      expect(latest!.activeFilterResults.map(e => e.id)).toContain(upcomingOld.id)
    })

    // PUBLISHED falls back to the year/month-scoped list, so a live exam (this
    // month) counts but the 2020 exam does not appear in the published bucket.
    latest!.handleFilterChange('published')
    await waitFor(() => {
      expect(latest!.filterCounts.published).toBe(0)
    })
  })
})

describe('LIST FILTER A11Y — SegmentedFilter never emits an orphaned aria-controls', () => {
  // Aligns with the established BUG-09 policy (admin-overview-remediation):
  // tablist tabs must announce selection via aria-selected and must NOT carry
  // an aria-controls pointing at a tabpanel that does not exist.
  it('renders tabs with aria-selected and no dangling aria-controls', () => {
    render(
      <MemoryRouter>
        <SegmentedFilter
          ariaLabel="Filter exams by status"
          options={[{ id: 'live', label: 'Live' }, { id: 'upcoming', label: 'Upcoming' }, { id: 'published', label: 'Published' }]}
          value="live"
          onChange={() => {}}
        />
      </MemoryRouter>,
    )
    const tabs = screen.getAllByRole('tab')
    expect(tabs.length).toBe(3)
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(tabs[1].getAttribute('aria-selected')).toBe('false')
    for (const tab of tabs) {
      expect(tab).toHaveAttribute('aria-selected')
      expect(tab).not.toHaveAttribute('aria-controls')
    }
  })
})
