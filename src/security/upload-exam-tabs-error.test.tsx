// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, renderHook, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { ThemeProvider } from '../context/ThemeContext'

/* ─────────────────────────────────────────────────────────────────────────────
   BUG-002 — EXAM-TAB LOAD FAILURE MUST SURFACE ERROR + RETRY

   Contract (remediation §12–§19):
     - fetchActiveExams() rejection → examTabsError != null
     - AdminSelectionTabs renders ErrorContainer + RetryButton
       (NOT a silent empty tab strip)
     - retry resolves → exam tabs appear, error disappears
     - failure must not silently replace valid data with []
   ────────────────────────────────────────────────────────────────────────── */

vi.mock('../services/examService', () => ({
  fetchActiveExams: vi.fn(),
}))

vi.mock('../services/adminService', () => ({
  adminService: {
    fetchPapersByExam: vi.fn(async () => [{ id: 'p1', name: 'Paper 1' }]),
    fetchSubjectsByPaper: vi.fn(async () => []),
  },
}))

vi.mock('../lib/supabase', () => ({ supabase: {} }))

// Stable identity — a fresh object per useAuth() call would re-trigger the
// hook's [user]-dependent effect on every render and consume queued mocks.
const ADMIN_USER = { id: 'admin-1', role: 'admin', exam_selection: 'APPSC' }

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: ADMIN_USER }),
}))

import { useExamPaperSubjectSelection } from '../hooks/useExamPaperSubjectSelection'
import { AdminSelectionTabs } from '../components/admin/shared/AdminSelectionTabs'
import { fetchActiveExams } from '../services/examService'
import type { ExamConfig } from '../types/exam.types'

const fetchActiveExamsMock = vi.mocked(fetchActiveExams)

function examConfig(exam_id: string, name: string): ExamConfig {
  return {
    id: exam_id,
    exam_id,
    name,
    exam_selection: 'APPSC',
    total_questions: 40,
    total_marks: 40,
    duration_minutes: 40,
    negative_marking: false,
    negative_mark_value: 0,
    is_published: true,
  }
}

const ACTIVE_EXAMS = [
  examConfig('APPSC_GROUP_1', 'APPSC GROUP 1'),
  examConfig('BANK_EXAMS_PO', 'BANK EXAMS PO'),
]

function ui(node: ReactNode) {
  return render(<ThemeProvider>{node}</ThemeProvider>)
}

function setupHook() {
  return renderHook(() =>
    useExamPaperSubjectSelection({
      selectedExam: 'all',
      setSelectedExam: () => {},
      showPapers: false,
      showSubjects: false,
      hideAll: false,
    })
  )
}

beforeEach(() => {
  // mockReset (not clearAllMocks): implementations must never leak between
  // tests — a stale resolved impl would swallow queued rejections.
  fetchActiveExamsMock.mockReset()
})

afterEach(cleanup)

describe('BUG-002 — exam-tab failure surfaces canonical error + retry', () => {
  it('hook exposes examTabsError when fetchActiveExams rejects', async () => {
    fetchActiveExamsMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = setupHook()

    await waitFor(() => expect(result.current.examTabsError).toBeTruthy())
    // Safe classified copy only — never the raw network error string.
    expect(result.current.examTabsError).not.toContain('Failed to fetch')
  })

  it('component renders ErrorContainer + RetryButton instead of an empty tab strip', async () => {
    fetchActiveExamsMock.mockRejectedValue(new TypeError('Failed to fetch'))
    ui(<AdminSelectionTabs selectedExam="all" setSelectedExam={() => {}} showPapers={false} showSubjects={false} />)

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    // No empty tab strip masquerading as success.
    expect(screen.queryByLabelText('Select exam')).not.toBeInTheDocument()
  })

  it('retry clears the error and restores exam tabs on success', async () => {
    fetchActiveExamsMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { result } = setupHook()

    await waitFor(() => expect(result.current.examTabsError).toBeTruthy())

    fetchActiveExamsMock.mockResolvedValue(ACTIVE_EXAMS)
    result.current.retryExamTabs()

    await waitFor(() => {
      expect(result.current.examTabsError).toBeNull()
      // APPSC_GROUP_* ids collapse into the parent APPSC_GROUPS tab.
      expect(result.current.examTabs.map(t => t.id)).toContain('APPSC_GROUPS')
    })
  })

  it('component retry recovers: tabs appear and the alert disappears', async () => {
    fetchActiveExamsMock.mockReset()
    fetchActiveExamsMock.mockRejectedValue(new TypeError('Failed to fetch'))
    ui(
      <AdminSelectionTabs
        selectedExam="all"
        setSelectedExam={() => {}}
        showPapers={false}
        showSubjects={false}
      />
    )

    const retry = await screen.findByRole('button', { name: /try again/i })
    expect(screen.getByRole('alert')).toBeInTheDocument()

    fetchActiveExamsMock.mockImplementation(async () => ACTIVE_EXAMS)
    fireEvent.click(retry)

    // Await the TAB CONTENT, not merely the alert's removal: clearing the
    // error happens one commit before the fetched tabs land.
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /^APPSC$/i })).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  it('failure does not wipe previously loaded valid tabs', async () => {
    fetchActiveExamsMock.mockResolvedValue(ACTIVE_EXAMS)
    const { result } = setupHook()
    await waitFor(() => expect(result.current.examTabs.length).toBeGreaterThan(0))

    fetchActiveExamsMock.mockRejectedValueOnce(new Error('DB down'))
    result.current.retryExamTabs()

    await waitFor(() => expect(result.current.examTabsError).toBeTruthy())
    // Existing valid data preserved — UI gates its error surface on empty tabs.
    expect(result.current.examTabs.length).toBeGreaterThan(0)
  })
})
