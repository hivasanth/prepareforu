import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, renderHook, cleanup, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import UserTopicExams from './pages/user/UserTopicExams'
import * as topicTestService from './services/topicTestService'
import { NoAvailableQuestionsError } from './services/errors/NoAvailableQuestionsError'
import { useAppscPaperSelection } from './hooks/useAppscPaperSelection'
import { normalizeError } from './utils/errorClassification'
import type { TopicItem } from './services/topicTestService'

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', role: 'user', exam_selection: 'APPSC_GROUPS', is_active: true },
    loading: false,
  }),
}))

vi.mock('./services/topicTestService', () => ({
  fetchTopicsBySubject: vi.fn(),
  fetchTopicTestQuestions: vi.fn(),
  fetchTopicCounts: vi.fn(),
  fetchAppscPapers: vi.fn(),
  fetchSubjectsByExam: vi.fn(async () => []),
  fetchSubjectsByPaper: vi.fn(),
  mapQuestionsToStandard: vi.fn((q: unknown[]) => q),
  clearTopicTestCache: vi.fn(async () => {}),
  getCachedTopics: vi.fn(() => null),
  getCachedTopicCounts: vi.fn(() => null),
}))

vi.mock('./services/subjectTestService', () => ({
  fetchSubjectsByExam: vi.fn(async () => []),
  clearSubjectTestCache: vi.fn(async () => {}),
  getCachedSubjects: vi.fn(() => null),
  getCachedPapers: vi.fn(() => []),
  getCachedSubjectsByPaper: vi.fn(() => null),
}))

vi.mock('./services/questionAvailabilityService', () => ({
  getDefaultMinQuestions: () => 30,
  getMinQuestions: vi.fn(async () => 30),
}))

const group1 = [
  { id: 'p1', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 1', stage: 1, total_questions: 40, total_marks: 40, duration_minutes: 40, negative_marking: false, negative_mark_value: 0, display_order: 1 },
  { id: 'p2', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 2', stage: 1, total_questions: 40, total_marks: 40, duration_minutes: 40, negative_marking: false, negative_mark_value: 0, display_order: 2 },
]
const group2 = [
  { id: 'p3', exam_id: 'APPSC_GROUP_2', paper_name: 'Paper 3', stage: 1, total_questions: 40, total_marks: 40, duration_minutes: 40, negative_marking: false, negative_mark_value: 0, display_order: 1 },
]

function subjectsFor(paperId: string): string[] {
  if (paperId === 'p1') return ['General Studies', 'Arithmetic']
  if (paperId === 'p2') return ['Telugu']
  if (paperId === 'p3') return ['Paper 3 Subject']
  return []
}

function topicsFor(subject: string): TopicItem[] {
  if (subject === 'General Studies') return [
    { topic_en: 'Topic 1', topic_te: null, display_order: 1 },
    { topic_en: 'Topic 2', topic_te: null, display_order: 2 },
  ]
  if (subject === 'Arithmetic') return [{ topic_en: 'Arithmetic Topic', topic_te: null, display_order: 1 }]
  if (subject === 'Telugu') return [{ topic_en: 'Telugu Topic', topic_te: null, display_order: 1 }]
  return []
}

function countsFor(subject: string): Record<string, number> {
  if (subject === 'General Studies') return { 'Topic 1': 40, 'Topic 2': 35 }
  if (subject === 'Arithmetic') return { 'Arithmetic Topic': 40 }
  if (subject === 'Telugu') return { 'Telugu Topic': 40 }
  return {}
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <UserTopicExams />
      </ThemeProvider>
    </MemoryRouter>,
  )
}

// The page lazy-loads TopicPortalView/TopicConfigView; under a busy shared
// worker the dynamic import can exceed Testing Library's 1s default, so all
// async queries use a generous timeout.
const queryTimeout = { timeout: 8000 }

async function waitForPortal() {
  await screen.findByText('Topic 1', {}, queryTimeout)
}

beforeEach(() => {
  const tsvc = vi.mocked(topicTestService)
  tsvc.fetchAppscPapers.mockResolvedValue([...group1, ...group2])
  tsvc.fetchSubjectsByPaper.mockImplementation(async (paperId: string | undefined) => subjectsFor(paperId ?? ''))
  tsvc.fetchTopicsBySubject.mockImplementation(async (_exam: string | undefined, _paper: string | undefined, subject: string | undefined) => topicsFor(subject ?? ''))
  tsvc.fetchTopicCounts.mockImplementation(async (_exam: string | undefined, _paper: string | undefined, subject: string | undefined) => countsFor(subject ?? ''))
  tsvc.fetchTopicTestQuestions.mockResolvedValue([])
})

afterEach(() => {
  vi.clearAllMocks()
  cleanup()
})

describe('DS-033 topic-exams: remediation regression (retry, paper switch, business empty, classification)', () => {
  it('FIX-4: switching subject clears the previous subject topics before the new ones load', async () => {
    renderPage()
    await waitForPortal()

    let resolveArithmetic: (value: TopicItem[]) => void = () => {}
    const tsvc = vi.mocked(topicTestService)
    tsvc.fetchTopicsBySubject.mockImplementation(async (_exam: string | undefined, _paper: string | undefined, subject: string | undefined) => {
      if (subject === 'Arithmetic') {
        return await new Promise<TopicItem[]>((resolve) => { resolveArithmetic = resolve })
      }
      return topicsFor(subject ?? '')
    })

    fireEvent.click(await screen.findByRole('tab', { name: /arithmetic/i }, queryTimeout))

    await waitFor(() => expect(screen.queryByText('Topic 1')).toBeNull())
    await waitFor(() => expect(screen.getByRole('status', { name: /loading topics/i })).toBeTruthy())

    await act(async () => {
      resolveArithmetic([{ topic_en: 'Arithmetic Topic', topic_te: null, display_order: 1 }])
      await Promise.resolve()
    })

    await screen.findByText('Arithmetic Topic', {}, queryTimeout)
    expect(screen.queryByText('Topic 1')).toBeNull()
  })

  it('FIX-1: topic fetch failure surfaces the error screen (never EmptyState) and retry recovers', async () => {
    const tsvc = vi.mocked(topicTestService)
    tsvc.fetchTopicsBySubject.mockRejectedValueOnce(new Error('Failed to fetch'))

    renderPage()

    const retryButton = await screen.findByRole('button', { name: /try again/i }, queryTimeout)
    expect(screen.queryByText('No topics available')).toBeNull()
    expect(screen.queryByText('Topic 1')).toBeNull()

    fireEvent.click(retryButton)

    await screen.findByText('Topic 1', {}, queryTimeout)
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
  })

  it('FIX-3: no-questions business-empty renders a non-retryable screen with Back to Topic List', async () => {
    const tsvc = vi.mocked(topicTestService)
    tsvc.fetchTopicTestQuestions.mockRejectedValue(new NoAvailableQuestionsError('Topic 1'))

    renderPage()
    await waitForPortal()

    fireEvent.click(screen.getAllByRole('button', { name: /start test/i })[0])
    await screen.findByRole('button', { name: /start session/i }, queryTimeout)
    fireEvent.click(screen.getByRole('button', { name: /start session/i }))

    await screen.findByText(/no questions are currently available/i, {}, queryTimeout)
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
    expect(screen.getByRole('button', { name: /back to topic list/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /back to topic list/i }))
    await screen.findByText('Topic 1', {}, queryTimeout)
  })

  it('FIX-10: paper-switch failure never shows the previous paper topics and retry loads the new paper', async () => {
    renderPage()
    await waitForPortal()

    const tsvc = vi.mocked(topicTestService)
    let failPaper2 = true
    tsvc.fetchSubjectsByPaper.mockImplementation(async (paperId: string | undefined) => {
      if (paperId === 'p2' && failPaper2) throw new Error('Failed to fetch')
      return subjectsFor(paperId ?? '')
    })

    fireEvent.click(await screen.findByRole('tab', { name: /paper 2/i }, queryTimeout))

    await screen.findByRole('button', { name: /try again/i }, queryTimeout)
    expect(screen.queryByText('Topic 1')).toBeNull()

    failPaper2 = false
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    await screen.findByText('Telugu Topic', {}, queryTimeout)
    expect(screen.queryByText('Topic 1')).toBeNull()
  })

  it('FIX-11: network failures are retryable, non-business, and ERROR -> RETRY -> ERROR stays ERROR', async () => {
    const tsvc = vi.mocked(topicTestService)
    tsvc.fetchTopicTestQuestions.mockRejectedValue(new Error('Failed to fetch'))

    renderPage()
    await waitForPortal()

    fireEvent.click(screen.getAllByRole('button', { name: /start test/i })[0])
    await screen.findByRole('button', { name: /start session/i }, queryTimeout)
    fireEvent.click(screen.getByRole('button', { name: /start session/i }))

    const retryButton = await screen.findByRole('button', { name: /try again/i }, queryTimeout)
    expect(screen.queryByRole('button', { name: /back to topic list/i })).toBeNull()

    fireEvent.click(retryButton)
    await screen.findByRole('button', { name: /try again/i }, queryTimeout)
    expect(screen.queryByText('Topic 1')).toBeNull()
  })

  it('T3-RACE: a slow earlier paper response never overwrites the latest paper (isStale current-context guard)', async () => {
    const commits: string[] = []
    let resolveSlow!: () => void
    const fetchPaperData = vi.fn(async (paperId: string, isCurrent: () => boolean) => {
      if (paperId === 'p1') {
        await new Promise<void>((resolve) => { resolveSlow = resolve })
        if (isCurrent()) commits.push(paperId)
        return
      }
      if (isCurrent()) commits.push(paperId)
    })
    const onPaperError = vi.fn()
    const setMinQuestions = vi.fn()

    const { rerender } = renderHook(
      (props: { paperId: string }) =>
        useAppscPaperSelection({
          isAppsc: true,
          selectedPaperId: props.paperId,
          examSelection: 'APPSC_GROUPS',
          setMinQuestions,
          fetchPaperData,
          onPaperError,
        }),
      { initialProps: { paperId: 'p1' } },
    )

    rerender({ paperId: 'p2' })
    await act(async () => { await Promise.resolve() })

    await act(async () => {
      resolveSlow()
      await Promise.resolve()
    })

    expect(commits).toEqual(['p2'])
    expect(setMinQuestions).toHaveBeenCalledTimes(1)
    expect(onPaperError).not.toHaveBeenCalled()
  })

  it('T6: network / server / business error classifications remain distinct', () => {
    const network = normalizeError(new Error('Failed to fetch'))
    expect(network.category).toBe('network')
    expect(network.title).toBe('Connection Lost')
    expect(network.retryable).toBe(true)

    const server = normalizeError(new Error('An internal server error has occurred'))
    expect(server.category).toBe('server')
    expect(server.title).toBe('Server Error')
    expect(server.retryable).toBe(true)

    const business = normalizeError(new NoAvailableQuestionsError('Topic 1'), {
      category: 'business',
      retryable: false,
    })
    expect(business.category).toBe('business')
    expect(business.retryable).toBe(false)
  })
})
