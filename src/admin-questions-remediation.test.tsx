/* ─────────────────────────────────────────────────────────────────────────────
 * ADMIN QUESTIONS REMEDIATION TESTS (F-1 … F-7)
 *
 * Defect matrix from the master audit:
 *   F-1  error never co-renders with EmptyState
 *   F-2  stale list responses are ignored (request sequencing)
 *   F-3  sign-out purges the RLS-scoped admin query cache
 *   F-4  retry affordance retries the current context
 *   F-5  delete failure is visible (modal closes, error surfaces)
 *   F-6  cross-page selection persists within a context, clears on new context
 *   F-7  raw Postgres messages never reach the UI
 * ──────────────────────────────────────────────────────────────────────────── */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, renderHook, act, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ComponentType, ReactNode } from 'react'

vi.mock('./utils/logger', () => ({
  generateRequestId: (p: string) => `${p}_test`,
  logError: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn(),
  logDebug: vi.fn(),
}))

const adminUser = { id: 'u-admin', role: 'admin', email: 'a@b.c' }

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({ user: adminUser }),
}))

vi.mock('./services/adminQuestionService', () => ({
  adminQuestionService: {
    listQuestions: vi.fn(),
    deleteQuestion: vi.fn(),
    bulkDeleteQuestions: vi.fn(),
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    bulkInsertQuestions: vi.fn(),
    countQuestions: vi.fn(),
    listPrompts: vi.fn(),
    upsertPrompt: vi.fn(),
    deletePrompt: vi.fn(),
    registerTopicIfNeeded: vi.fn(),
  },
}))

// Static selection tabs — their data pipeline is covered by its own suites.
// The question list NEVER runs unfiltered (A9), so these suites always drive a
// concrete topic and a resolved topic list (matching the live page contract).
vi.mock('./hooks/useExamPaperSubjectSelection', () => ({
  APPSC_SUB_TABS: [],
  useExamPaperSubjectSelection: () => ({
    examTabs: [{ id: 'EXAM_A', label: 'Exam A' }, { id: 'EXAM_B', label: 'Exam B' }],
    isAppscActive: false,
    displayPapers: [],
    displaySubjects: [],
    displayTopics: [{ id: 'TOPIC-1', topic_en: 'Topic One', topic_te: null, display_order: 1 }],
    topicsLoading: false,
    topicsError: null,
    refetchTopics: vi.fn(),
    paperRowOpen: false,
    subjectRowOpen: false,
    topicsRowOpen: false,
  }),
}))

// Mutable filter store backing the mocked useAdminFilters (hook-level tests).
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

// F-3: real adminQueryCache + queryCache stay LIVE so the sessionStorage purge
// is verified end-to-end; only the remote Supabase client is stubbed.
vi.mock('./lib/supabase', () => ({
  supabase: { auth: { signOut: vi.fn().mockResolvedValue(undefined) } },
}))

// focus-trap's MutationObserver-driven revalidation races RTL's synchronous
// open/close cycles in jsdom ("zero tabbable nodes" on rapid reopen). The real
// trap behaviour is covered by src/ds007-runtime-audit.test.tsx; here we only
// need the modal shell + confirm flow.
vi.mock('focus-trap-react', () => ({
  FocusTrap: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

import { useAdminQuestions } from './components/admin/questions/useAdminQuestions'
import type { Question } from './types/exam.types'
import { adminQuestionService } from './services/adminQuestionService'
import { QuestionsTable } from './components/admin/questions/QuestionsTable'
import { logout } from './services/authService'
import { supabase } from './lib/supabase'
import { getCache, setCache } from './services/adminQueryCache'
import { ThemeProvider } from './context/ThemeContext'

const listQ = vi.mocked(adminQuestionService.listQuestions)
const delQ = vi.mocked(adminQuestionService.deleteQuestion)
const bulkDelQ = vi.mocked(adminQuestionService.bulkDeleteQuestions)

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function makeQuestions(ids: string[]): Question[] {
  return ids.map(id => ({
    id,
    exam_id: 'EXAM_A',
    paper_id: 'P1',
    subject_name: 'S1',
    question_text_en: `Q-${id}`,
    option_a_en: 'a', option_b_en: 'b', option_c_en: 'c', option_d_en: 'd',
    correct_option: 'A',
    difficulty: 'medium',
    negative_marks: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) as unknown as Question[]
}

const okList = (ids: string[], total?: number) => ({
  success: true as const,
  data: makeQuestions(ids),
  meta: { count: total ?? ids.length },
})

function withProviders(ui: ReactNode) {
  return (
    <ThemeProvider>
      <MemoryRouter initialEntries={['/admin/questions?exam=EXAM_A&paper=P1&subject=S1']}>
        {ui}
      </MemoryRouter>
    </ThemeProvider>
  )
}

/* The page module is resolved lazily and via its DEFAULT export — the page
 * component is default-exported only, and resolving it after the module
 * graph has bootstrapped mirrors the browser runtime exactly. */
let AdminQuestionsComponent: ComponentType | null = null
async function getPage() {
  if (!AdminQuestionsComponent) {
    AdminQuestionsComponent = (await import('./pages/admin/AdminQuestions')).default as unknown as ComponentType
  }
  return AdminQuestionsComponent
}

async function renderPageAsync() {
  const Page = await getPage()
  return render(withProviders(<Page />))
}

afterEach(() => { cleanup(); AdminQuestionsComponent = null })

beforeEach(() => {
  vi.clearAllMocks()
  // mockClear does NOT drop queued *Once* implementations — reset explicitly
  // so leftover queues can never leak across tests.
  listQ.mockReset()
  delQ.mockReset()
  bulkDelQ.mockReset()
  filtersState = {
    selectedExam: 'EXAM_A', selectedPaper: 'P1', selectedSubject: 'S1', selectedTopic: 'TOPIC-1',
    setSelectedExam: vi.fn(), setSelectedPaper: vi.fn(), setSelectedSubject: vi.fn(), setSelectedTopic: vi.fn(),
  }
})

describe('F-1 — error/empty state machine (§34 decision tree)', () => {
  it('success with rows → table only', async () => {
    listQ.mockResolvedValue(okList(['a', 'b']))
    await renderPageAsync()
    await waitFor(() => expect(screen.getByText('Q-a')).toBeInTheDocument())
    expect(screen.queryByText('No Questions Found')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('success with zero rows → EmptyState only', async () => {
    listQ.mockResolvedValue(okList([]))
    await renderPageAsync()
    await waitFor(() => expect(screen.getByText('No Questions Found')).toBeInTheDocument())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('failure with zero rows → error + RETRY only, NO EmptyState', async () => {
    listQ.mockResolvedValue({ success: false as const, error: { source: 'db', code: 'UNKNOWN', message: 'boom' } })
    await renderPageAsync()
    await waitFor(() => expect(screen.getByText('Unexpected Error')).toBeInTheDocument(), { timeout: 15000 })
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    expect(screen.queryByText('No Questions Found')).not.toBeInTheDocument()
  })

  it('refetch failure with previous rows → Alert + rows preserved, NO false EmptyState', async () => {
    const user = userEvent.setup()
    listQ.mockResolvedValueOnce(okList(['keep1'], 40))
    await renderPageAsync()
    await waitFor(() => expect(screen.getByText('Q-keep1')).toBeInTheDocument())

    // hasMore=true so Next is enabled; page 2 fetch fails.
    listQ.mockResolvedValueOnce({ success: false as const, error: { source: 'db', code: 'UNKNOWN', message: 'network down' } })
    await user.click(screen.getByRole('button', { name: /next page/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText('Q-keep1')).toBeInTheDocument() // stale rows kept
    expect(screen.queryByText('No Questions Found')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})

describe('F-4 — retry affordance', () => {
  it('RETRY re-issues the request for the current context and recovers', async () => {
    const user = userEvent.setup()
    listQ.mockResolvedValueOnce({ success: false as const, error: { source: 'db', code: 'UNKNOWN', message: 'offline' } })
    await renderPageAsync()
    await waitFor(() => expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument())
    expect(listQ).toHaveBeenCalledTimes(1)
    expect(listQ.mock.calls[0][0]).toMatchObject({ selectedExam: 'EXAM_A', selectedPaper: 'P1', selectedSubject: 'S1' })

    listQ.mockResolvedValueOnce(okList(['r1']))
    await user.click(screen.getByRole('button', { name: /retry/i }))
    await waitFor(() => expect(screen.getByText('Q-r1')).toBeInTheDocument())
    expect(listQ).toHaveBeenCalledTimes(2)
    expect(listQ.mock.calls[1][0]).toMatchObject({ selectedExam: 'EXAM_A', offset: 0 })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('F-5 — delete failure visibility', () => {
  it('failed delete closes modal, surfaces error, keeps row, no success toast', async () => {
    const user = userEvent.setup()
    listQ.mockResolvedValue(okList(['del-me']))
    await renderPageAsync()
    await waitFor(() => expect(screen.getByText('Q-del-me')).toBeInTheDocument())

    await user.click(screen.getByRole('checkbox', { name: /select this question/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.getByText('Delete Operation')).toBeInTheDocument())

    bulkDelQ.mockResolvedValueOnce({ success: false as const, error: { source: 'db', code: 'UNKNOWN', message: 'permission denied for table questions' } })
    await user.click(screen.getByRole('button', { name: /yes, delete permanently/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.queryByText('Delete Operation')).not.toBeInTheDocument() // not trapped behind modal
    expect(screen.getByText('Q-del-me')).toBeInTheDocument()               // row untouched
    expect(screen.queryByText(/Operation completed successfully/i)).not.toBeInTheDocument()
  })
})

describe('F-7 — raw DB messages sanitized at the UI boundary', () => {
  it.each([
    'permission denied for table questions',
    'new row violates row-level security policy for table "questions"',
  ])('%s renders canonical copy only', async (raw) => {
    listQ.mockResolvedValue({ success: false as const, error: { source: 'db', code: 'UNKNOWN', message: raw } })
    await renderPageAsync()
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    const body = document.body.textContent || ''
    expect(body).toContain("You don't have permission")
    expect(body).not.toContain(raw)
  })
})

describe('F-11 — result-count guard', () => {
  it('never shows "of 0" while rows are visible', () => {
    render(
      withProviders(
        <QuestionsTable
          questions={makeQuestions(['x1', 'x2'])}
          isLoading={false}
          page={0}
          setPage={() => {}}
          hasMore={false}
          totalCount={0} // backend omitted meta.count
          pageSize={30}
          selectedIds={[]}
          onSelect={() => {}}
          onSelectAll={() => {}}
          onEdit={() => {}}
          onView={() => {}}
          onDelete={() => {}}
        />
      )
    )
    expect(screen.getByText(/Showing 1–2 of 2/)).toBeInTheDocument()
    expect(screen.queryByText(/of 0/)).not.toBeInTheDocument()
  })
})

describe('F-2 + F-6 — hook: sequence guard & selection lifecycle', () => {
  function setupHook() {
    return renderHook(() => useAdminQuestions(), {
      wrapper: ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>,
    })
  }

  it('stale response cannot overwrite data/totals/error/loading', async () => {
    const a = deferred<ReturnType<typeof okList>>()
    const b = deferred<ReturnType<typeof okList>>()
    listQ.mockImplementationOnce(() => a.promise).mockImplementationOnce(() => b.promise)

    const { result, rerender } = setupHook()
    await act(async () => {}) // mount effects flush; call A in flight

    filtersState.selectedExam = 'EXAM_B' // context switch starts call B
    rerender()
    await act(async () => {})

    await act(async () => { b.resolve(okList(['from-B'])) })       // B wins first
    await act(async () => { a.resolve(okList(['STALE-A'], 999)) }) // A resolves last

    expect(result.current.questions.map((q: Question) => q.id)).toEqual(['from-B'])
    expect(result.current.totalCount).toBe(1)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('late failure of a stale request does not set error or loading', async () => {
    const a = deferred<ReturnType<typeof okList>>()
    const b = deferred<ReturnType<typeof okList>>()
    // Pre-attached noop handler keeps the raw rejection from surfacing as an
    // unhandled rejection while the hook's own catch still receives it.
    a.promise.catch(() => {})
    listQ.mockImplementationOnce(() => a.promise).mockImplementationOnce(() => b.promise)

    const { result, rerender } = setupHook()
    await act(async () => {})
    filtersState.selectedExam = 'EXAM_B'
    rerender()
    await act(async () => {})

    await act(async () => { b.resolve(okList(['good'])) })
    await act(async () => { a.reject(new Error('stale explosion')) })

    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.questions).toHaveLength(1)
  })

  it('selection persists across pages within one context, clears on new context', async () => {
    listQ.mockResolvedValueOnce(okList(['p1a', 'p1b'], 40))
    const { result, rerender } = setupHook()
    await waitFor(() => expect(result.current.questions).toHaveLength(2))

    act(() => { result.current.setSelectedIds(['p1a', 'p1b']) })
    expect(result.current.selectedIds).toEqual(['p1a', 'p1b'])

    // Page 2 — same logical context → PRESERVED.
    listQ.mockResolvedValueOnce(okList(['p2a'], 40))
    await act(async () => { result.current.setPage(1) })
    await waitFor(() => expect(result.current.questions.map((q: Question) => q.id)).toEqual(['p2a']))
    expect(result.current.selectedIds).toEqual(['p1a', 'p1b'])

    // New exam — new logical context → incompatible selection CLEARED.
    // The switch fires twice (filter effect + page-reset effect); a persistent
    // fallback keeps both in-flight requests satisfied with the same dataset.
    listQ.mockResolvedValue(okList(['other'], 1))
    await act(async () => {
      filtersState.selectedExam = 'EXAM_B'
      rerender()
    })
    await waitFor(() => expect(result.current.questions.map((q: Question) => q.id)).toEqual(['other']))
    expect(result.current.selectedIds).toEqual([])
  })
})

describe('F-3 — sign-out purges the RLS-scoped admin query cache', () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.signOut).mockClear()
    vi.mocked(supabase.auth.signOut).mockResolvedValue(undefined as never)
  })

  it('clears qc_* sessionStorage entries on successful sign-out', async () => {
    setCache('list_probe_success', { rows: ['admin-A-data'] })
    expect(sessionStorage.getItem('qc_list_probe_success')).not.toBeNull()

    await logout()

    expect(sessionStorage.getItem('qc_list_probe_success')).toBeNull()
    expect(getCache('list_probe_success')).toBeNull() // SWR memory layer too
  })

  it('purges fail-closed even when the remote sign-out rejects', async () => {
    vi.mocked(supabase.auth.signOut).mockRejectedValueOnce(new Error('network dead'))
    setCache('list_probe_fail', { rows: ['admin-A-data'] })

    await expect(logout()).rejects.toThrow('network dead')
    expect(getCache('list_probe_fail')).toBeNull()
  })
})



