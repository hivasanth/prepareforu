/// <reference types="node" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { ReactNode } from 'react'

import UserTeacherExams from '../pages/user/UserTeacherExams'
import { ThemeProvider } from '../context/ThemeContext'

// ─── Hoisted state + module mocks ────────────────────────────────────────────
// The barrel (educator-exams) is mocked so the component contract under test is
// isolated: H-2 asserts the LINKED redirect target, not the linking flow itself.

const ctl = vi.hoisted(() => ({
  state: {
    user: { id: 'user-1', coupon_code_used: false },
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
  },
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
    EducatorLinkCard: ({ onLinked }: { onLinked: () => void }) =>
      React.createElement('button', { role: 'button', onClick: onLinked }, 'Link my educator'),
  }
  return barrel as unknown as typeof import('../components/user/educator-exams')
})

function ui(node: ReactNode) {
  return (
    <ThemeProvider>
      <MemoryRouter initialEntries={['/stub-start']}>
        <Routes>
          <Route path="/stub-start" element={node} />
          <Route path="/educator-exams" element={<div>REGISTERED DESTINATION</div>} />
          <Route path="/user/educator-exams" element={<div>OLD UNREGISTERED ROUTE</div>} />
          <Route path="/dashboard" element={<div>DASHBOARD STRANDED</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  )
}

describe('H-2: post-link navigation targets the registered /educator-exams route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ctl.state.user = { id: 'user-1', coupon_code_used: false }
  })

  it('navigates to the registered route and never to the unregistered one', async () => {
    const user = userEvent.setup()
    render(ui(<UserTeacherExams />))

    await user.click(screen.getByRole('button', { name: /link my educator/i }))

    expect(screen.getByText('REGISTERED DESTINATION')).toBeInTheDocument()
    expect(screen.queryByText('OLD UNREGISTERED ROUTE')).toBeNull()
    expect(screen.queryByText('DASHBOARD STRANDED')).toBeNull()
    cleanup()
  })
})