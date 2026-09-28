import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ThemeProvider } from '../../../context/ThemeContext'
import { DailyAttemptsChart } from './DailyAttemptsChart'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { useDateRange } from '../../../hooks/useDateRange'
import { useBreakpoint } from '../../../hooks/useBreakpoint'

/* AO-10 regression suite for the DailyAttemptsChart accessibility remediation:
   single ARIA model (figure name, no duplicate BarChart label), FOCUS_RING on
   the focusable wrapper, zero-filled sr-only data table wired via
   aria-describedby, exam-aware accessible name, overview:daily cache namespace,
   and clean loading/error states that never leave a stale figure mounted. */

vi.mock('../../../hooks/useSupabaseQuery', () => ({ useSupabaseQuery: vi.fn() }))
vi.mock('../../../hooks/useDateRange', () => ({ useDateRange: vi.fn() }))
vi.mock('../../../hooks/useBreakpoint', () => ({ useBreakpoint: vi.fn() }))

const RANGES = [
  { id: 'w1', name: 'Sep 1\u20132', start: new Date(2026, 8, 1), end: new Date(2026, 8, 2) },
]

const hook = vi.mocked(useSupabaseQuery)
const range = vi.mocked(useDateRange)
const bp = vi.mocked(useBreakpoint)

const ui = (node: ReactNode) => render(<ThemeProvider>{node}</ThemeProvider>)

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
  bp.mockReturnValue({ breakpoint: 'lg', isXs: false, isSm: false, isMd: true, isLg: true, isXl: false })
  range.mockReturnValue({
    ranges: RANGES,
    selectedRangeId: 'w1',
    setSelectedRangeId: vi.fn(),
    selectedRange: RANGES[0],
  })
  hook.mockReturnValue({
    data: { '2026-09-01': 2, '2026-09-02': 0 },
    loading: false,
    error: null,
    category: 'unknown',
    refetch: vi.fn(),
  })
})

describe('DailyAttemptsChart accessibility remediation', () => {
  it('exposes ONE accessible name on the figure; BarChart sheds its duplicate label', () => {
    ui(<DailyAttemptsChart selectedExam="all" resolvedIds={[]} />)
    const figure = screen.getByRole('figure', { name: /Daily exam attempt counts/ })
    expect(figure).toHaveAttribute('tabindex', '0')
    // Exactly one element carries the chart name — the old BarChart aria-label is gone.
    expect(screen.queryAllByLabelText(/Daily exam attempt counts/)).toHaveLength(1)
  })

  it('renders the FOCUS_RING tokens so keyboard focus is visible without layout shift', () => {
    ui(<DailyAttemptsChart selectedExam="all" resolvedIds={[]} />)
    const figure = screen.getByRole('figure')
    expect(figure.className).toContain('focus-visible:outline-none')
    expect(figure.className).toContain('focus-visible:ring-primary/50')
    expect(figure.className).toContain('focus-visible:ring-offset-2')
  })

  it('exposes zero-filled per-date values in an sr-only table wired via aria-describedby', () => {
    ui(<DailyAttemptsChart selectedExam="APPSC_GROUPS" resolvedIds={['g1']} />)
    const table = screen.getByLabelText('Daily attempt counts by date')
    expect(table.className).toContain('sr-only')
    const rows = Array.from(table.querySelectorAll('tbody tr'))
    expect(rows).toHaveLength(2)
    expect(rows[0].textContent).toContain('Sep 1, 2026')
    expect(rows[0].textContent).toContain('2')
    expect(rows[1].textContent).toContain('Sep 2, 2026')
    expect(rows[1].textContent).toContain('0')
    // Figure -> description -> caption id association.
    const caption = table.querySelector('caption')
    expect(screen.getByRole('figure')).toHaveAttribute('aria-describedby', caption?.id)
  })

  it('makes the accessible name exam-aware', () => {
    ui(<DailyAttemptsChart selectedExam="BANK_EXAMS" resolvedIds={[]} />)
    expect(screen.getByRole('figure').getAttribute('aria-label')).toContain('Bank exams')
  })

  it('queries through the overview:daily cache namespace', () => {
    ui(<DailyAttemptsChart selectedExam="all" resolvedIds={[]} />)
    expect(hook).toHaveBeenCalledWith(expect.any(Function), ['all', 'w1'], 'overview:daily')
  })

  it('announces loading through a labelled status region without a stale table', () => {
    hook.mockReturnValue({ data: null, loading: true, error: null, category: 'unknown', refetch: vi.fn() })
    ui(<DailyAttemptsChart selectedExam="all" resolvedIds={[]} />)
    expect(screen.getByRole('status', { name: 'Loading daily attempts chart' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Daily attempt counts by date')).not.toBeInTheDocument()
  })

  it('renders the classified error state with no stale table or status region', () => {
    hook.mockReturnValue({ data: null, loading: false, error: 'Request timed out', category: 'timeout', refetch: vi.fn() })
    ui(<DailyAttemptsChart selectedExam="all" resolvedIds={[]} />)
    expect(screen.getByText(/Failed to load daily attempts/)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByLabelText('Daily attempt counts by date')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})