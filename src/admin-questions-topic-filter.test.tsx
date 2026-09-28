/* ─────────────────────────────────────────────────────────────────────────────
 * ADMIN QUESTIONS — LIVE TOPIC FILTER TESTS (no 'all topics')
 *
 * Locks the Exam -> Paper -> Subject -> Topic -> Questions behaviour on the
 * Admin Questions page:
 *   TF-1  NO 'ALL TOPICS' tab — the topic row lists live exam_topics only
 *   TF-2  while no topic is selected the RPC is NEVER called (no unfiltered
 *         list); selecting a topic scopes the request + resets page
 *   TF-3  deep-linked topic id is active and drives a topic-aware empty state
 *   TF-4  invalid deep-linked topic is never offered as a selectable option
 *   TF-5  empty topics list renders the explicit "no topics" empty state (row
 *         AND question area) and still performs no unfiltered request
 *   TF-6  topic load failure surfaces the canonical error + retry surface and
 *         a no-topic empty state in the question area
 *   TF-7  while topics are loading the row shows the topic skeleton (never a
 *         stale tab strip, never "no topics available")
 *   TF-8  topic + search combine into one scoped request
 *   TF-9  topic + pagination: page changes keep the topic, offset advances
 *   TF-10 URL cascade: ancestor changes reset the topic to "" (not 'all')
 * ──────────────────────────────────────────────────────────────────────────── */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { render, screen, waitFor, renderHook, act, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ComponentType, ReactNode } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import type { Question } from './types/exam.types'

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

/* Mutable selection-tab pipeline. Real `useAdminFilters` stays LIVE (URL-param
 * backed) so selector changes exercise the real router store; only the child
 * selection-hook data is substituted, mirroring its own dedicated suites. */
let tabsState: {
  examTabs: { label: string; id: string }[]
  isAppscActive: boolean
  displayPapers: { id: string; exam_id: string; paper_name: string }[]
  displaySubjects: { subject_name: string }[]
  displayTopics: { id: string | null; topic_en: string; topic_te: string | null; display_order: number }[]
  topicsLoading: boolean
  topicsError: string | null
  refetchTopics: ReturnType<typeof vi.fn>
  paperRowOpen: boolean
  subjectRowOpen: boolean
  topicsRowOpen: boolean
}

vi.mock('./hooks/useExamPaperSubjectSelection', () => ({
  APPSC_SUB_TABS: [],
  useExamPaperSubjectSelection: () => ({
    examTabs: tabsState.examTabs,
    examTabsError: null,
    retryExamTabs: vi.fn(),
    papersError: null,
    refetchPapers: vi.fn(),
    isAppscActive: tabsState.isAppscActive,
    displayPapers: tabsState.displayPapers,
    displaySubjects: tabsState.displaySubjects,
    displayTopics: tabsState.displayTopics,
    topicsLoading: tabsState.topicsLoading,
    topicsError: tabsState.topicsError,
    refetchTopics: tabsState.refetchTopics,
    paperRowOpen: tabsState.paperRowOpen,
    subjectRowOpen: tabsState.subjectRowOpen,
    topicsRowOpen: tabsState.topicsRowOpen,
  }),
}))

import { useAdminFilters } from './hooks/useAdminFilters'
import { adminQuestionService } from './services/adminQuestionService'

const listQ = vi.mocked(adminQuestionService.listQuestions)

const TOPIC_1_ID = '63768d25-491f-4f95-acf4-b5b4e2e0b30d'
const TOPIC_2_ID = '3f0a0123-4567-489a-bcde-f01234567890'
const TOPICS = [
  { id: TOPIC_1_ID, topic_en: 'Indus Valley Civilization & Early Historic India', topic_te: null, display_order: 1 },
  { id: TOPIC_2_ID, topic_en: 'Vedic Age', topic_te: null, display_order: 2 },
]

const DEFAULT_PATH = '/admin/questions?exam=APPSC_GROUP_1&paper=p1&subject=History'

function makeQuestions(ids: string[]): Question[] {
  return ids.map(id => ({
    id,
    exam_id: 'APPSC_GROUP_1',
    paper_id: 'p1',
    subject_name: 'History',
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

/* The page module is resolved lazily + via its DEFAULT export (mirrors the
 * router which mounts the default export). Pre-warm the (expensive) lazy import
 * OUTSIDE the timed test bodies so heavy parallel workers can't starve them. */
let AdminQuestionsComponent: ComponentType | null = null
async function getPage() {
  if (!AdminQuestionsComponent) {
    AdminQuestionsComponent = (await import('./pages/admin/AdminQuestions')).default as unknown as ComponentType
  }
  return AdminQuestionsComponent
}

/* Generous assertion budget — these suites stay green under starved parallel
 * workers (the full suite imports 400+s of modules in the same run). */
const BOOT_TIMEOUT = 8000

function waitForCalled(assertion: () => void, options?: { timeout?: number }) {
  return waitFor(assertion, options ?? { timeout: BOOT_TIMEOUT })
}

beforeAll(async () => { await getPage() })

async function renderPageAsync(path = DEFAULT_PATH) {
  const Page = await getPage()
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Page />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

function topicTablist() {
  return screen.getByRole('tablist', { name: 'Select topic' })
}

function topicTab(label: string) {
  return within(topicTablist()).getByRole('tab', { name: label })
}

function lastCall() {
  const calls = listQ.mock.calls
  return calls[calls.length - 1][0] as { selectedTopic: string; selectedSubject: string; searchQuery: string; offset: number; selectedExam: string; selectedPaper: string }
}

afterEach(() => { cleanup(); AdminQuestionsComponent = null })

beforeEach(() => {
  vi.clearAllMocks()
  listQ.mockReset()
  tabsState = {
    examTabs: [{ id: 'APPSC_GROUP_1', label: 'APPSC' }],
    isAppscActive: true,
    displayPapers: [{ id: 'p1', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 1' }],
    displaySubjects: [{ subject_name: 'History' }],
    displayTopics: TOPICS,
    topicsLoading: false,
    topicsError: null,
    refetchTopics: vi.fn(),
    paperRowOpen: true,
    subjectRowOpen: true,
    topicsRowOpen: true,
  }
})

describe('TF-1/TF-2 — topic row wiring on the Admin Questions page', () => {
  it('lists NO "ALL TOPICS" tab and never lists questions while no topic is selected', async () => {
    const user = userEvent.setup()
    listQ.mockResolvedValue(okList(['a1'], 40))

    await renderPageAsync()
    await waitForCalled(() => expect(topicTablist()).toBeInTheDocument())

    // NO 'all topics' identity: only the LIVE exam_topics options render.
    expect(within(topicTablist()).queryByRole('tab', { name: 'ALL TOPICS' })).toBeNull()
    expect(topicTab('INDUS VALLEY CIVILIZATION & EARLY HISTORIC INDIA')).toBeInTheDocument()
    expect(topicTab('VEDIC AGE')).toBeInTheDocument()

    // While no topic is selected the RPC must NEVER run unfiltered (A9).
    await new Promise(r => setTimeout(r, 120))
    expect(listQ).not.toHaveBeenCalled()

    // Selecting a topic scopes the request (and resets the page to 0).
    await user.click(topicTab('VEDIC AGE'))
    await waitForCalled(() => expect(lastCall()).toMatchObject({ selectedTopic: TOPIC_2_ID, offset: 0 }))
  })

  it('switching topic after paginating resets the page back to 0 and keeps the topic', async () => {
    const user = userEvent.setup()
    listQ.mockResolvedValue(okList(['a1'], 40)) // hasMore=true on page 0

    await renderPageAsync(`${DEFAULT_PATH}&topic=${TOPIC_2_ID}`)
    await waitForCalled(() => expect(lastCall()).toMatchObject({ selectedTopic: TOPIC_2_ID, offset: 0 }))

    await user.click(screen.getByRole('button', { name: /next page/i }))
    await waitForCalled(() => expect(lastCall()).toMatchObject({ selectedTopic: TOPIC_2_ID, offset: 30 }))

    await user.click(topicTab('INDUS VALLEY CIVILIZATION & EARLY HISTORIC INDIA'))
    // Filter change while page>0 emits the documented intermediate RPC (old
    // offset) then the page-reset fetch — assert the FINAL scoped request.
    await waitForCalled(() => expect(lastCall()).toMatchObject({ selectedTopic: TOPIC_1_ID, offset: 0 }))
    expect(lastCall()).toMatchObject({ selectedTopic: TOPIC_1_ID, offset: 0 })
  }, 40000)
})

describe('TF-3/TF-4 — deep links', () => {
  it('a deep-linked topic id renders the ACTIVE topic tab and a topic-aware empty state', async () => {
    listQ.mockResolvedValue(okList([]))

    await renderPageAsync(`${DEFAULT_PATH}&topic=${TOPIC_1_ID}`)
    await waitForCalled(() => expect(screen.getByText('No Questions Found')).toBeInTheDocument())

    expect(topicTab('INDUS VALLEY CIVILIZATION & EARLY HISTORIC INDIA')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/No questions available for this topic\./)).toBeInTheDocument()
    expect(listQ.mock.calls[0][0]).toMatchObject({ selectedTopic: TOPIC_1_ID })
  })

  it('an invalid deep-linked topic value is NEVER offered as an option and no topic tab is selected', async () => {
    listQ.mockResolvedValue(okList(['x1'], 2))

    await renderPageAsync(`${DEFAULT_PATH}&topic=deadbeef-dead-beef-4bad-deadbeefdead`)
    await waitForCalled(() => expect(screen.getByText('Q-x1')).toBeInTheDocument())

    const tl = topicTablist()
    expect(within(tl).queryByText(/DEADBEEF/i)).toBeNull()
    // The value is passed through to the request; only the live topic list can
    // legitimise it (the selection hook/service clear unverified values).
    expect(listQ.mock.calls[0][0]).toMatchObject({ selectedTopic: 'deadbeef-dead-beef-4bad-deadbeefdead' })
    expect(within(tl).queryAllByRole('tab').filter(t => t.getAttribute('aria-selected') === 'true')).toHaveLength(0)
  }, 40000)
})

describe('TF-5/TF-6/TF-7 — topic row states', () => {
  it('an empty resolved topic list renders the "no topics" empty state (row + question area) with NO unfiltered request', async () => {
    listQ.mockResolvedValue(okList(['x1']))
    tabsState.displayTopics = []
    tabsState.topicsRowOpen = true

    await renderPageAsync()
    await waitForCalled(() => expect(screen.getByText('No topics available for this subject.')).toBeInTheDocument())
    expect(screen.getByText('No Topics Selected')).toBeInTheDocument()
    await new Promise(r => setTimeout(r, 120))
    expect(listQ).not.toHaveBeenCalled()
  })

  it('a failed topic load surfaces the canonical error + RETRY and a no-topic question empty state', async () => {
    const user = userEvent.setup()
    listQ.mockResolvedValue(okList(['x1']))
    tabsState.displayTopics = []
    tabsState.topicsError = 'Failed to load topics. Please try again.'
    tabsState.topicsRowOpen = true

    await renderPageAsync()
    await waitForCalled(() => expect(screen.getByText('Failed to load topics')).toBeInTheDocument())

    // The question area is never stuck: a no-topic empty state (never a spin).
    expect(screen.getByText('No Topics Selected')).toBeInTheDocument()
    expect(screen.getByText(/Unable to load topics for this subject/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(tabsState.refetchTopics).toHaveBeenCalled()
  })

  it('shows the topic skeleton while the segment topics are loading (never a stale tab strip)', async () => {
    listQ.mockResolvedValue(okList(['x1']))
    tabsState.topicsLoading = true

    await renderPageAsync()
    await waitForCalled(() => expect(screen.getByRole('status', { name: 'Loading topics' })).toBeInTheDocument())

    // Loading and "no topics available" are mutually exclusive — NEVER both.
    expect(screen.queryByText('No topics available for this subject.')).toBeNull()
    expect(screen.queryByRole('tablist', { name: 'Select topic' })).toBeNull()
    // And no unfiltered request fires while the topics are still loading.
    await new Promise(r => setTimeout(r, 120))
    expect(listQ).not.toHaveBeenCalled()
  }, 40000)
})

describe('TF-8/TF-9 — topic + search, topic + pagination', () => {
  it('topic + search combine into a single scoped request', async () => {
    const user = userEvent.setup()
    listQ.mockResolvedValue(okList(['s1']))

    await renderPageAsync(`${DEFAULT_PATH}&topic=${TOPIC_1_ID}`)
    await waitForCalled(() => expect(listQ).toHaveBeenCalled())
    expect(lastCall()).toMatchObject({ selectedTopic: TOPIC_1_ID, searchQuery: '' })

    await user.type(screen.getByRole('textbox', { name: 'Search questions' }), 'ASOKA')
    await waitForCalled(() => expect(lastCall().searchQuery).toBe('ASOKA'), { timeout: 3000 })
    expect(lastCall()).toMatchObject({ selectedTopic: TOPIC_1_ID })
  })

  it('next page advances the offset while preserving the topic', async () => {
    const user = userEvent.setup()
    listQ.mockResolvedValue(okList(['p1'], 40)) // total > 30 -> hasMore

    await renderPageAsync(`${DEFAULT_PATH}&topic=${TOPIC_1_ID}`)
    await waitForCalled(() => expect(listQ).toHaveBeenCalled())
    expect(lastCall()).toMatchObject({ selectedTopic: TOPIC_1_ID, offset: 0 })

    await user.click(screen.getByRole('button', { name: /next page/i }))
    await waitForCalled(() => expect(lastCall()).toMatchObject({ selectedTopic: TOPIC_1_ID, offset: 30 }))
  }, 40000)
})

describe('useAdminFilters real hook — URL cascade for the topic (no "all topics")', () => {
  function setup(initialPath: string) {
    return renderHook(() => useAdminFilters(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
      ),
    })
  }

  it('parses a deep-linked topic param', () => {
    const { result } = setup('/admin/questions?exam=APPSC_GROUP_1&paper=p1&subject=History&topic=abc-123')
    expect(result.current.selectedTopic).toBe('abc-123')
  })

  it('a missing topic param sanitizes to "" (the no-topic sentinel)', () => {
    const { result } = setup('/admin/questions?exam=APPSC_GROUP_1&paper=p1&subject=History')
    expect(result.current.selectedTopic).toBe('')
  })

  it('changing the paper clears the topic (cascade reset to ""), subject resets to all', async () => {
    const { result } = setup('/admin/questions?exam=APPSC_GROUP_1&paper=p1&subject=History&topic=abc-123')
    expect(result.current.selectedSubject).toBe('History')
    expect(result.current.selectedTopic).toBe('abc-123')

    act(() => result.current.setSelectedPaper('p2'))
    expect(result.current.selectedTopic).toBe('')
    expect(result.current.selectedSubject).toBe('all')
  })

  it('changing the subject clears the topic only', async () => {
    const { result } = setup('/admin/questions?exam=APPSC_GROUP_1&paper=p1&subject=History&topic=abc-123')
    act(() => result.current.setSelectedSubject('Economic & Social Issues'))
    expect(result.current.selectedTopic).toBe('')
    expect(result.current.selectedPaper).toBe('p1')
  })

  it('clears the topic when the exam changes', async () => {
    const { result } = setup('/admin/questions?exam=APPSC_GROUP_1&paper=p1&subject=History&topic=abc-123')
    act(() => result.current.setSelectedExam('APPSC_GROUP_2'))
    expect(result.current.selectedTopic).toBe('')
  })
})