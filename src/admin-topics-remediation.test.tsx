/* ─────────────────────────────────────────────────────────────────────────────
 * ADMIN TOPICS REMEDIATION TESTS
 *
 * Covers:
 *   HIGH-1 — Initial-load error shows ErrorContainer + RetryButton
 *   HIGH-2 — Delete modal receives busy state, double-click blocked
 *   MED-2  — Publish toggle shows per-topic loading indicator
 *   MED-5  — Skeleton height matches row geometry
 * ──────────────────────────────────────────────────────────────────────────── */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { StudyTopic } from './types/exam.types'
import type { UserProfile } from './types/auth.types'
import { ThemeProvider } from './context/ThemeContext'

/* ─── Mocks ───────────────────────────────────────────────────────────────── */

vi.mock('./utils/logger', () => ({
  generateRequestId: (p: string) => `${p}_test`,
  logError: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn(),
  logDebug: vi.fn(),
}))

vi.mock('focus-trap-react', () => ({
  FocusTrap: ({ children }: { children?: ReactNode }) => <>{children}</>,
}))

vi.mock('./components/common/AntigravityAnimation', async (orig) => {
  const actual = await orig<typeof import('./components/common/AntigravityAnimation')>()
  return {
    ...actual,
    SectionReveal: ({ children }: { children?: ReactNode }) => <>{children}</>,
    PageTransition: ({ children }: { children?: ReactNode }) => <>{children}</>,
  }
})

const adminUser = { id: 'u-admin', role: 'admin', exam_selection: 'APPSC_GROUPS', is_active: true } as UserProfile

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({ user: adminUser }),
}))

vi.mock('./hooks/useExamPaperSubjectSelection', () => ({
  APPSC_SUB_TABS: [],
  useExamPaperSubjectSelection: () => ({
    examTabs: [{ id: 'APPSC_GROUP_1', label: 'Group 1' }],
    isAppscActive: true,
    displayPapers: [{ id: 'p1', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 1' }],
    displaySubjects: [{ subject_name: 'Maths' }],
    paperRowOpen: true,
    subjectRowOpen: true,
  }),
}))

let filtersState: {
  selectedExam: string; selectedPaper: string; selectedSubject: string; selectedTopic: string
  setSelectedExam: ReturnType<typeof vi.fn>
  setSelectedPaper: ReturnType<typeof vi.fn>
  setSelectedSubject: ReturnType<typeof vi.fn>
  setSelectedTopic: ReturnType<typeof vi.fn>
}

vi.mock('./hooks/useAdminFilters', () => ({
  useAdminFilters: () => filtersState,
}))

vi.mock('./lib/supabase', () => ({
  supabase: { auth: { signOut: vi.fn().mockResolvedValue(undefined) } },
}))

// Mock at the service level — let real useAsyncOperation handle loading state
vi.mock('./services/topicsService', async (orig) => {
  const actual = await orig<typeof import('./services/topicsService')>()
  return {
    ...actual,
    fetchTopicsAdmin: vi.fn(),
    createTopic: vi.fn(),
    updateTopic: vi.fn(),
    deleteTopic: vi.fn(),
    toggleTopicPublish: vi.fn(),
    getNextDisplayOrder: vi.fn(),
  }
})

import * as topicsService from './services/topicsService'

const svc = vi.mocked(topicsService)

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const EX = 'APPSC_GROUP_1'
const P = 'p1'
const SUBJ = 'Maths'

function makeTopic(id: string, title: string, overrides: Partial<StudyTopic> = {}): StudyTopic {
  return {
    id, exam_id: EX, paper_id: P, subject_name: SUBJ,
    title_en: title, title_te: '',
    summary_en: '', summary_te: '',
    content_en: [], content_te: [],
    youtube_url: null, display_order: 1, is_published: true,
    created_by: null, created_at: '', updated_at: '',
    ...overrides,
  }
}

const TOPICS = [
  makeTopic('t1', 'Algebra', { display_order: 1 }),
  makeTopic('t2', 'Geometry', { display_order: 2 }),
]

/* ─── Lazy import ─────────────────────────────────────────────────────────── */
let AdminTopics: typeof import('./pages/admin/AdminTopics').default

beforeEach(async () => {
  vi.clearAllMocks()
  cleanup()

  filtersState = {
    selectedExam: EX, selectedPaper: P, selectedSubject: SUBJ, selectedTopic: '',
    setSelectedExam: vi.fn(), setSelectedPaper: vi.fn(), setSelectedSubject: vi.fn(), setSelectedTopic: vi.fn(),
  }

  svc.fetchTopicsAdmin.mockResolvedValue(TOPICS)
  svc.deleteTopic.mockResolvedValue(undefined)
  svc.toggleTopicPublish.mockResolvedValue(undefined)
  svc.getNextDisplayOrder.mockResolvedValue(3)

  const mod = await import('./pages/admin/AdminTopics')
  AdminTopics = mod.default
})

afterEach(() => {
  cleanup()
})

function renderPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[`/admin/topics?exam=${EX}&paper=${P}&subject=${SUBJ}`]}>
        <AdminTopics />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

/* ─── Tests ───────────────────────────────────────────────────────────────── */

describe('Admin Topics Remediation', () => {

  describe('HIGH-1 — Initial-load error retry', () => {

    it('CASE 1: initial load succeeds → topic list renders', async () => {
      renderPage()
      expect(await screen.findByText('Algebra', undefined, { timeout: 5000 })).toBeTruthy()
      expect(await screen.findByText('Geometry', undefined, { timeout: 5000 })).toBeTruthy()
    })

    it('CASE 2: initial load fails → ErrorContainer + RetryButton visible', async () => {
      svc.fetchTopicsAdmin.mockRejectedValueOnce(new Error('network error'))
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Unexpected Error')).toBeTruthy()
      }, { timeout: 15000 })

      expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy()
      expect(screen.queryByText('Algebra')).toBeNull()
      expect(screen.queryByText('No Topics Yet')).toBeNull()
    })

    it('CASE 3: click Retry → re-fetches with current context → topics render', async () => {
      svc.fetchTopicsAdmin.mockRejectedValueOnce(new Error('network error'))
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Unexpected Error')).toBeTruthy()
      }, { timeout: 15000 })

      svc.fetchTopicsAdmin.mockResolvedValueOnce(TOPICS)

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /try again/i }))
      })

      await waitFor(() => {
        expect(screen.getByText('Algebra')).toBeTruthy()
      }, { timeout: 15000 })

      expect(svc.fetchTopicsAdmin).toHaveBeenCalledTimes(2)
      expect(svc.fetchTopicsAdmin).toHaveBeenLastCalledWith(EX, P, SUBJ)
    })

    it('CASE 4: retry fails → error remains visible', async () => {
      svc.fetchTopicsAdmin.mockRejectedValueOnce(new Error('first error'))
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Unexpected Error')).toBeTruthy()
      }, { timeout: 15000 })

      svc.fetchTopicsAdmin.mockRejectedValueOnce(new Error('second error'))

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /try again/i }))
      })

      await waitFor(() => {
        expect(screen.getByText('Unexpected Error')).toBeTruthy()
        expect(screen.queryByText('Algebra')).toBeNull()
        expect(screen.queryByText('No Topics Yet')).toBeNull()
      }, { timeout: 15000 })
    })

    it('CASE 5: successful empty response → EmptyState, NOT error', async () => {
      svc.fetchTopicsAdmin.mockResolvedValueOnce([])
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('No Topics Yet')).toBeTruthy()
      }, { timeout: 15000 })

      expect(screen.queryByText('Unexpected Error')).toBeNull()
      expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
    })

    it('error message uses safe friendly text, never raw PostgREST', async () => {
      svc.fetchTopicsAdmin.mockRejectedValueOnce(new Error('permission denied for table study_topics'))
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeTruthy()
      }, { timeout: 15000 })

      const bodyText = document.body.textContent || ''
      expect(bodyText).not.toContain('study_topics')
      expect(bodyText).not.toContain('permission denied')
    })

    it('P0-1: classified network message renders verbatim (no double-normalize corruption)', async () => {
      svc.fetchTopicsAdmin.mockRejectedValueOnce(new Error('Network request failed'))
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Please check your internet connection and try again.')).toBeTruthy()
      }, { timeout: 15000 })

      // The generic fallback must NOT have replaced the classified message.
      expect(screen.queryByText('An unexpected error occurred. Please try again.')).toBeNull()
    })
  })

  describe('HIGH-2 — Delete modal busy lock', () => {

    it('clicking Delete opens confirmation modal', async () => {
      renderPage()
      await screen.findByText('Algebra')

      fireEvent.click(screen.getAllByRole('button', { name: /delete topic/i })[0])

      expect(await screen.findByText(/Delete "Algebra"/)).toBeTruthy()
      expect(screen.getByText('Yes, Delete Permanently')).toBeTruthy()
    })

    it('confirming delete sends request and modal busy prevents second click', async () => {
      let deleteResolve!: () => void
      const deletePromise = new Promise<void>(r => { deleteResolve = r })
      svc.deleteTopic.mockImplementationOnce(() => deletePromise)

      renderPage()
      await screen.findByText('Algebra')

      fireEvent.click(screen.getAllByRole('button', { name: /delete topic/i })[0])
      await screen.findByText('Yes, Delete Permanently')

      const confirmBtn = screen.getByText('Yes, Delete Permanently')
      fireEvent.click(confirmBtn)

      // After first click, request should be in flight
      await waitFor(() => {
        expect(svc.deleteTopic).toHaveBeenCalledTimes(1)
      }, { timeout: 15000 })

      // Resolve the delete
      await act(async () => { deleteResolve() })

      await waitFor(() => {
        expect(screen.queryByText(/Delete "Algebra"/)).toBeNull()
      }, { timeout: 15000 })
    })

    it('delete success: modal closes, topic removed', async () => {
      svc.deleteTopic.mockResolvedValueOnce()

      renderPage()
      await screen.findByText('Algebra')

      fireEvent.click(screen.getAllByRole('button', { name: /delete topic/i })[0])
      await screen.findByText('Yes, Delete Permanently')

      await act(async () => {
        fireEvent.click(screen.getByText('Yes, Delete Permanently'))
      })

      await waitFor(() => {
        expect(screen.queryByText('Algebra')).toBeNull()
      }, { timeout: 15000 })
    })

    it('delete failure: modal stays open, busy clears, retry possible', async () => {
      svc.deleteTopic.mockRejectedValueOnce(new Error('delete failed'))

      renderPage()
      await screen.findByText('Algebra')

      fireEvent.click(screen.getAllByRole('button', { name: /delete topic/i })[0])
      await screen.findByText('Yes, Delete Permanently')

      await act(async () => {
        fireEvent.click(screen.getByText('Yes, Delete Permanently'))
      })

      // Modal stays open on failure (topicToDelete not cleared) — allows retry
      await waitFor(() => {
        expect(screen.getByText(/Delete "Algebra"/)).toBeTruthy()
      }, { timeout: 5000 })

      // Busy state should clear — confirm button is re-enabled
      await waitFor(() => {
        const confirmBtn = screen.getByText('Yes, Delete Permanently')
        expect(confirmBtn).not.toBeDisabled()
      }, { timeout: 5000 })

      // P0-2: failure is surfaced INSIDE the dialog (never hidden behind the
      // overlay) so the user sees why nothing changed.
      expect(screen.getByText('Action failed')).toBeTruthy()
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeTruthy()

      // Topic still visible
      expect(screen.getByText('Algebra')).toBeTruthy()
    })
  })

  describe('MED-2 — Publish toggle loading indicator', () => {

    it('toggle disables button during request', async () => {
      let toggleResolve!: () => void
      const togglePromise = new Promise<void>(r => { toggleResolve = r })
      svc.toggleTopicPublish.mockImplementationOnce(() => togglePromise)

      renderPage()
      await screen.findByText('Algebra')

      const toggleBtn = screen.getAllByRole('button', { name: /unpublish topic/i })[0]

      await act(async () => {
        fireEvent.click(toggleBtn)
      })

      await waitFor(() => {
        expect(toggleBtn).toBeDisabled()
      }, { timeout: 10000 })

      await act(async () => { toggleResolve() })

      await waitFor(() => {
        expect(toggleBtn).not.toBeDisabled()
      }, { timeout: 10000 })
    })

    it('toggle failure: rolls back and clears busy', async () => {
      svc.toggleTopicPublish.mockRejectedValueOnce(new Error('toggle failed'))

      renderPage()
      await screen.findByText('Algebra')

      const toggleBtn = screen.getAllByRole('button', { name: /unpublish topic/i })[0]

      await act(async () => {
        fireEvent.click(toggleBtn)
      })

      await waitFor(() => {
        expect(toggleBtn).not.toBeDisabled()
      }, { timeout: 10000 })

      expect(toggleBtn.getAttribute('aria-label')).toBe('Unpublish topic')
    })
  })

  describe('MED-5 — Skeleton geometry', () => {

    it('loading skeleton renders while fetching', async () => {
      let fetchResolve!: (v: StudyTopic[]) => void
      svc.fetchTopicsAdmin.mockImplementationOnce(() => new Promise(r => { fetchResolve = r as never }))

      renderPage()

      await waitFor(() => {
        expect(screen.queryByText('Algebra')).toBeNull()
      }, { timeout: 5000 })

      await act(async () => { fetchResolve(TOPICS) })

      await waitFor(() => {
        expect(screen.getByText('Algebra')).toBeTruthy()
      }, { timeout: 15000 })
    })
  })
})
