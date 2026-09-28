/// <reference types="node" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import UserTeacherExams from '../pages/user/UserTeacherExams'
import { ThemeProvider } from '../context/ThemeContext'

// ─── Hoisted state + module mocks ────────────────────────────────────────────
// M-3 contract: a refresh/start failure with last-good data must NEVER replace
// the exam grid. Contents: data + error → inline warning banner above the grid;
// data-less error → full-page ErrorContainer; EmptyState only when genuinely
// empty AND not in a full-error state.

const ctl = vi.hoisted(() => ({
  state: {
    user: { id: 'user-1', coupon_code_used: true },
    authLoading: false,
    activeTab: 'live',
    setActiveTab: () => {},
    filteredExams: [],
    loading: false,
    errorState: 'idle',
    pageError: null,
    retryError: () => {},
    selectedMonth: '2026-09',
    setSelectedMonth: () => {},
    monthsList: [{ id: '2026-09', name: 'September 2026' }],
    selectedLeaderboardExam: null,
    setSelectedLeaderboardExam: () => {},
    isStarting: false,
    handleStartTeacherExam: async () => true,
  } as Record<string, unknown>,
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: ctl.state.user, loading: ctl.state.authLoading }),
}))

vi.mock('../components/user/educator-exams', async () => {
  const React = await import('react')
  const barrel = {
    useTeacherExams: () => ctl.state,
    TeacherExamCard: ({ exam }: { exam?: { title?: string } }) =>
      React.createElement('div', null, exam?.title),
    TeacherExamFilterBar: () => React.createElement('div'),
    EducatorLinkCard: () => React.createElement('div'),
  }
  return barrel as unknown as typeof import('../components/user/educator-exams')
})

function ui() {
  return (
    <ThemeProvider>
      <MemoryRouter>
        <UserTeacherExams />
      </MemoryRouter>
    </ThemeProvider>
  )
}

const errorState = {
  errorState: 'error',
  pageError: {
    code: 'SERVER_ERROR',
    title: 'Server Error',
    message: 'Refresh failed. Please retry.',
    category: 'server',
    retryable: true,
  },
} as const

const mockExams = [{ id: 'EXAM_1', title: 'Math Midterm' }]

describe('M-3: last-good data survives a failed refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ctl.state.errorState = 'idle'
    ctl.state.pageError = null
    ctl.state.filteredExams = []
    ctl.state.loading = false
  })

  it('shows an inline non-destructive banner while keeping the grid visible', () => {
    ctl.state.errorState = 'error'
    ctl.state.pageError = errorState.pageError
    ctl.state.filteredExams = mockExams

    render(ui())

    // Grid + data still visible (never replaced).
    expect(screen.getByText('Math Midterm')).toBeInTheDocument()
    // The failure is surfaced as an inline banner, not a full-page takeover.
    expect(screen.getByText('Refresh failed. Please retry.')).toBeInTheDocument()
    expect(screen.queryByText('Server Error')).toBeNull()
    expect(screen.queryByText(/No live Exams/i)).toBeNull()
    cleanup()
  })

  it('renders the full ErrorContainer only when there is no last-good data', () => {
    ctl.state.errorState = 'error'
    ctl.state.pageError = errorState.pageError
    ctl.state.filteredExams = []

    render(ui())

    expect(screen.getByText('Server Error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeEnabled()
    expect(screen.queryByText('Refresh failed. Please retry.')).toBeInTheDocument()
    cleanup()
  })

  it('renders EmptyState only when there is no data and no full-page error', () => {
    ctl.state.filteredExams = []

    render(ui())

    expect(screen.getByText(/No live Exams/i)).toBeInTheDocument()
    expect(screen.queryByText('Server Error')).toBeNull()
    cleanup()
  })
})