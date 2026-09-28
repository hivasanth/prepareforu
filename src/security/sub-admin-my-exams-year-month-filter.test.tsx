/// <reference types="node" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useExamData } from '../components/sub-admin/exams/useExamData'
import { ThemeProvider } from '../context/ThemeContext'
import * as teacherExamService from '../services/teacherExamService'

/* ── SUB-ADMIN MY-EXAMS — YEAR + MONTH FILTER SUITE ──────────────────────────
 * Locks the production filter contract that replaced the rolling 3-month
 * dropdown with independent Year + Month dropdowns:
 *   • monthOptions is exactly 12 months, January first, December last
 *   • yearOptions are descending, deduped, derived from the fetched exams
 *     plus the current year (never hard-coded)
 *   • filteredExams must match the selected year AND month in the LOCAL
 *     calendar domain (no UTC-prefix slicing, no off-by-one)
 *   • null / invalid / out-of-range dates never throw
 *   • search + year + month compose without one resetting another
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

function ui(node: ReactNode) {
  return (
    <ThemeProvider>
      <MemoryRouter initialEntries={['/sub-admin/my-exams']}>{node}</MemoryRouter>
    </ThemeProvider>
  )
}

function exam(overrides: Partial<{
  id: string
  title: string
  created_at: string
  total_questions: number
  total_marks: number
}> ) {
  return {
    id: 'e-' + Math.random().toString(36).slice(2, 8),
    title: 'Exam',
    total_questions: 5,
    total_marks: 100,
    marks_per_question: 20,
    start_time: '2026-01-01T00:00:00Z',
    end_time: '2099-01-01T00:00:00Z',
    created_at: '2026-08-15T10:00:00Z',
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

async function renderWithExams(exams: ReturnType<typeof exam>[]) {
  latest = null
  vi.spyOn(teacherExamService, 'fetchSubAdminIdByUserId').mockResolvedValue({ id: 'sa-row-1' } as never)
  vi.spyOn(teacherExamService, 'fetchTeacherExamsWithFullFields').mockResolvedValue(exams as never)
  const { rerender } = render(ui(<HookProbe onState={(s) => { latest = s }} />))
  await waitFor(() => {
    expect(latest?.examsLoading).toBe(false)
  }, { timeout: 3000 })
  return rerender
}

beforeEach(() => {
  vi.clearAllMocks()
  latest = null
})

afterEach(() => {
  cleanup()
})

describe('MONTH options', () => {
  it('are exactly 12 months, January first, December last, no duplicates', async () => {
    await renderWithExams([exam({})])
    expect(latest?.monthOptions).toHaveLength(12)
    const names = latest!.monthOptions.map(o => o.name)
    expect(names[0]).toBe('January')
    expect(names[11]).toBe('December')
    expect(new Set(names).size).toBe(12)
    // ids are 1..12
    expect(latest!.monthOptions.map(o => o.id)).toEqual(['1','2','3','4','5','6','7','8','9','10','11','12'])
  })
})

describe('YEAR options', () => {
  it('includes the current calendar year even with no older data', async () => {
    await renderWithExams([exam({ created_at: new Date().toISOString() })])
    const currentYear = new Date().getFullYear()
    expect(latest!.yearOptions.map(o => Number(o.id))).toContain(currentYear)
  })

  it('derives every year present in the data, sorted descending, deduped', async () => {
    await renderWithExams([
      exam({ created_at: '2023-05-01T00:00:00Z' }),
      exam({ created_at: '2026-08-01T00:00:00Z' }),
      exam({ created_at: '2024-11-01T00:00:00Z' }),
      exam({ created_at: '2023-12-01T00:00:00Z' }),
      exam({ created_at: new Date().toISOString() }),
    ])
    const years = latest!.yearOptions.map(o => Number(o.id))
    const sorted = [...years].sort((a, b) => b - a)
    expect(years).toEqual(sorted)
    expect(new Set(years).size).toBe(years.length)
    expect(years).toContain(2023)
    expect(years).toContain(2024)
    expect(years).toContain(2026)
  })
})

describe('DATE FILTER', () => {
  it('returns only exams in the selected year + month (local calendar)', async () => {
    const aug2026 = exam({ created_at: '2026-08-15T12:00:00Z' })
    const dec2025 = exam({ created_at: '2025-12-15T12:00:00Z' })
    const jan2026 = exam({ created_at: '2026-01-15T12:00:00Z' })
    await renderWithExams([aug2026, dec2025, jan2026])

    // August 2026 → only aug2026
    latest!.setYearFilter(2026)
    latest!.setMonthFilter(8)
    await waitFor(() => {
      expect(latest!.filteredExams.map(e => e.id)).toContain(aug2026.id)
      expect(latest!.filteredExams.map(e => e.id)).not.toContain(dec2025.id)
      expect(latest!.filteredExams.map(e => e.id)).not.toContain(jan2026.id)
    })

    // December 2025 excludes January 2026 (year boundary)
    latest!.setYearFilter(2025)
    latest!.setMonthFilter(12)
    await waitFor(() => {
      expect(latest!.filteredExams.map(e => e.id)).toContain(dec2025.id)
      expect(latest!.filteredExams.map(e => e.id)).not.toContain(jan2026.id)
    })
  })

  it('handles null / invalid dates without throwing and returns nothing', async () => {
    const bad = exam({ created_at: '' })
    await renderWithExams([bad])
    expect(() => {
      latest!.setYearFilter(2026)
      latest!.setMonthFilter(1)
    }).not.toThrow()
    expect(latest!.filteredExams).toEqual([])
  })

  it('empty selection yields the empty list', async () => {
    await renderWithExams([exam({ created_at: '2026-08-01T00:00:00Z' })])
    latest!.setYearFilter(2024)
    latest!.setMonthFilter(1)
    await waitFor(() => {
      expect(latest!.filteredExams).toEqual([])
    })
  })
})

describe('FILTER INTERACTION', () => {
  it('composes search + year + month', async () => {
    const match = exam({ title: 'APPSC Test', created_at: '2026-08-01T00:00:00Z' })
    const otherTitle = exam({ title: 'Other', created_at: '2026-08-02T00:00:00Z' })
    const otherMonth = exam({ title: 'APPSC Again', created_at: '2026-09-01T00:00:00Z' })
    await renderWithExams([match, otherTitle, otherMonth])

    latest!.setYearFilter(2026)
    latest!.setMonthFilter(8)
    latest!.setSearchTerm('APPSC')
    await waitFor(() => {
      expect(latest!.filteredExams.map(e => e.id)).toEqual([match.id])
    })

    // Clearing search restores year+month results (does not reset filters)
    latest!.setSearchTerm('')
    await waitFor(() => {
      const ids = latest!.filteredExams.map(e => e.id).sort()
      expect(ids).toEqual([match.id, otherTitle.id].sort())
    })
  })

  it('changing year preserves month and changes results', async () => {
    const aug2026 = exam({ created_at: '2026-08-01T00:00:00Z' })
    const aug2025 = exam({ created_at: '2025-08-01T00:00:00Z' })
    await renderWithExams([aug2026, aug2025])

    latest!.setYearFilter(2026)
    latest!.setMonthFilter(8)
    await waitFor(() => {
      expect(latest!.filteredExams.map(e => e.id)).toContain(aug2026.id)
      expect(latest!.filteredExams.map(e => e.id)).not.toContain(aug2025.id)
    })

    latest!.setYearFilter(2025)
    await waitFor(() => {
      expect(latest!.monthFilter).toBe(8) // month preserved
      expect(latest!.filteredExams.map(e => e.id)).toContain(aug2025.id)
      expect(latest!.filteredExams.map(e => e.id)).not.toContain(aug2026.id)
    })
  })
})
