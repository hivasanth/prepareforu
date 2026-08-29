import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import UserTopics from './pages/user/UserTopics'
import { TopicReader } from './components/user/topics/TopicReader'
import {
  fetchTopics,
  getCachedTopics,
  updateTopic,
} from './services/topicsService'
import { queryCache } from './utils/queryCache'
import * as topicRepo from './lib/repositories/topic.repository'
import type { StudyTopic, TopicSection } from './types/exam.types'
import type { UserProfile } from './types/auth.types'

const { authState } = vi.hoisted(() => ({
  authState: {
    user: {
      id: 'u1',
      role: 'user',
      exam_selection: 'APPSC_GROUPS',
      is_active: true,
    } as UserProfile,
    loading: false,
    initialized: true,
  },
}))

vi.mock('./context/AuthContext', () => ({
  useAuth: () => authState,
}))

vi.mock('./hooks/useExamPaperSubjectSelection', () => ({
  APPSC_SUB_TABS: [{ label: 'Group 1', id: 'APPSC_GROUP_1' }],
  useExamPaperSubjectSelection: () => ({
    examTabs: [{ label: 'Group 1', id: 'APPSC_GROUP_1' }],
    isAppscActive: true,
    displayPapers: [{ id: 'p1', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 1' }],
    displaySubjects: [{ subject_name: 'S1' }, { subject_name: 'S2' }],
    paperRowOpen: true,
    subjectRowOpen: true,
  }),
}))

vi.mock('./lib/repositories/topic.repository', () => ({
  fetchPublishedTopics: vi.fn(),
  fetchAllTopics: vi.fn(async () => []),
  findMaxDisplayOrder: vi.fn(async () => null),
  insertTopic: vi.fn(async (p: Record<string, unknown>) => p),
  modifyTopic: vi.fn(async (id: string, p: Record<string, unknown>) => ({ id, ...p })),
  removeTopic: vi.fn(async () => {}),
  setTopicPublishStatus: vi.fn(async () => {}),
}))

const EX = 'APPSC_GROUP_1'
const P = 'p1'

function topic(id: string, title: string, subject: string, overrides: Partial<StudyTopic> = {}): StudyTopic {
  return {
    id,
    exam_id: EX,
    paper_id: P,
    subject_name: subject,
    title_en: title,
    title_te: '',
    summary_en: '',
    summary_te: '',
    content_en: [],
    content_te: [],
    youtube_url: null,
    display_order: 1,
    is_published: true,
    created_by: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

function topicsFor(subject: string): StudyTopic[] {
  if (subject === 'S1') {
    return [
      topic('t1', 'Topic A', 'S1', { display_order: 1 }),
      topic('t2', 'Topic B', 'S1', { display_order: 2 }),
    ]
  }
  if (subject === 'S2') {
    return [topic('t3', 'Topic C', 'S2', { display_order: 1 })]
  }
  return []
}

const repo = vi.mocked(topicRepo)

let router: ReturnType<typeof createBrowserRouter>
const BASE = `/topics?exam=${EX}&paper=${P}&subject=S1`

function renderPage(path: string = BASE) {
  window.history.replaceState(null, '', path)
  router = createBrowserRouter([{ path: '/topics', element: <UserTopics /> }])
  return render(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>,
  )
}

const queryTimeout = { timeout: 8000 }

beforeEach(() => {
  queryCache.clear()
  repo.fetchPublishedTopics.mockReset()
  repo.modifyTopic.mockReset()
  repo.fetchPublishedTopics.mockImplementation(async (_examId: string, _paperId: string, subjectName: string) =>
    topicsFor(subjectName),
  )
  authState.user = {
    id: 'u1',
    role: 'user',
    exam_selection: 'APPSC_GROUPS',
    is_active: true,
  } as UserProfile
  window.scrollTo = vi.fn()
})

afterEach(() => {
  queryCache.clear()
  vi.clearAllMocks()
  cleanup()
})

describe('DS-034 topics page: production remediation regression', () => {
  it('T1-cold-load: no cache → repository fetch → topics render (no false empty state)', async () => {
    renderPage()

    await screen.findByText('Topic A', {}, queryTimeout)
    expect(screen.getByText('Topic B')).toBeTruthy()
    expect(screen.queryByText(/No topics found/)).toBeNull()
    expect(repo.fetchPublishedTopics).toHaveBeenCalled()
  })

  it('T2-warm-cache: cached context renders immediately — NO skeleton, NO false EmptyState, NO refetch', async () => {
    await fetchTopics(EX, P, 'S1')
    repo.fetchPublishedTopics.mockClear()

    renderPage()

    await screen.findByText('Topic A', {}, queryTimeout)
    expect(screen.queryByText(/No topics found/)).toBeNull()
    expect(repo.fetchPublishedTopics).not.toHaveBeenCalled()
  })

  it('T3-cached-switch: switching to another cached subject NEVER shows the old subject topics and does not refetch', async () => {
    await fetchTopics(EX, P, 'S1')
    await fetchTopics(EX, P, 'S2')
    repo.fetchPublishedTopics.mockClear()

    renderPage()
    await screen.findByText('Topic A', {}, queryTimeout)

    fireEvent.click(await screen.findByRole('tab', { name: 'S2' }, queryTimeout))

    await screen.findByText('Topic C', {}, queryTimeout)
    expect(screen.queryByText('Topic A')).toBeNull()
    expect(screen.queryByText('Topic B')).toBeNull()
    expect(repo.fetchPublishedTopics).not.toHaveBeenCalled()
  })

  it('T4-error→context-change: a failed subject load clears its error the moment the user switches subject', async () => {
    repo.fetchPublishedTopics.mockRejectedValueOnce(new Error('boom'))

    renderPage()
    await screen.findByRole('button', { name: /try again/i }, queryTimeout)
    expect(screen.queryByText('Topic A')).toBeNull()

    repo.fetchPublishedTopics.mockResolvedValue(topicsFor('S2'))
    await act(async () => {
      await router.navigate(`/topics?exam=${EX}&paper=${P}&subject=S2`)
    })

    await screen.findByText('Topic C', {}, queryTimeout)
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
    expect(screen.queryByText('Topic A')).toBeNull()
  })

  it('T5-retry→error: retrying a still-failing subject keeps the error screen (ERROR → RETRY → ERROR)', async () => {
    repo.fetchPublishedTopics.mockRejectedValueOnce(new Error('boom'))
    repo.fetchPublishedTopics.mockRejectedValueOnce(new Error('boom again'))

    renderPage()
    await screen.findByRole('button', { name: /try again/i }, queryTimeout)

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    await screen.findByRole('button', { name: /try again/i }, queryTimeout)
    expect(screen.queryByText('Topic A')).toBeNull()
  })

  it('T6-retry→success: retrying a recovered subject loads the topics and clears the error', async () => {
    repo.fetchPublishedTopics.mockRejectedValueOnce(new Error('boom'))

    renderPage()
    await screen.findByRole('button', { name: /try again/i }, queryTimeout)

    repo.fetchPublishedTopics.mockResolvedValue(topicsFor('S1'))
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    await screen.findByText('Topic A', {}, queryTimeout)
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
  })

  it('T7-prefix-isolation: topicTestService invalidation ("topics_") can never touch the study-topics cache and vice-versa', () => {
    queryCache.set('topics_data_A_p_S', ['legacy'], 300000)
    queryCache.set('study_topics_data_A_p_S', ['topics'], 300000)

    // clearTopicTestCache semantics: invalidateByPrefix('topics_') — must NOT
    // match 'study_topics_data_*'
    queryCache.invalidateByPrefix('topics_')
    expect(queryCache.get('topics_data_A_p_S')).toBeNull()
    expect(queryCache.get('study_topics_data_A_p_S')).toEqual(['topics'])

    // Reverse direction: admin topic invalidation never touches the topic-test
    // exam cache family.
    queryCache.set('topics_data_A_p_S', ['legacy'], 300000)
    queryCache.set('study_topics_data_A_p_S', ['topics'], 300000)
    queryCache.invalidateByPrefix('study_topics_data_')
    expect(queryCache.get('topics_data_A_p_S')).toEqual(['legacy'])
    expect(queryCache.get('study_topics_data_A_p_S')).toBeNull()
  })

  it('T8-empty-not-cached: a successful-but-empty fetch is never cached — the next load re-queries the backend', async () => {
    repo.fetchPublishedTopics.mockResolvedValueOnce([])

    const first = await fetchTopics(EX, P, 'S1')
    expect(first).toEqual([])
    expect(queryCache.get('study_topics_data_APPSC_GROUP_1_p1_S1')).toBeNull()

    repo.fetchPublishedTopics.mockResolvedValueOnce(topicsFor('S1'))
    const second = await fetchTopics(EX, P, 'S1')
    expect(second).toEqual(topicsFor('S1'))
    expect(repo.fetchPublishedTopics).toHaveBeenCalledTimes(2)
  })

  it('T9-admin-invalidation: successful mutation invalidates its context cache; a failed mutation leaves the cache intact', async () => {
    repo.fetchPublishedTopics.mockResolvedValue(topicsFor('S1'))
    await fetchTopics(EX, P, 'S1')
    expect(getCachedTopics(EX, P, 'S1')).toEqual(topicsFor('S1'))

    const admin = { id: 'a1', role: 'admin' } as UserProfile
    repo.modifyTopic.mockResolvedValue({ id: 't1' } as never)
    await updateTopic('t1', { title_en: 'X' }, admin, { exam_id: EX, paper_id: P, subject_name: 'S1' })
    expect(getCachedTopics(EX, P, 'S1')).toBeNull()

    // Re-seed and verify a FAILED mutation never invalidates the cache.
    await fetchTopics(EX, P, 'S1')
    expect(getCachedTopics(EX, P, 'S1')).toEqual(topicsFor('S1'))
    repo.modifyTopic.mockRejectedValueOnce(new Error('db down'))
    await expect(updateTopic('t1', { title_en: 'X' }, admin, { exam_id: EX, paper_id: P, subject_name: 'S1' })).rejects.toThrow()
    expect(getCachedTopics(EX, P, 'S1')).toEqual(topicsFor('S1'))
  })

  it('T10a-reader-deep-link: a direct URL with ?topic=<stable-id> restores the reader after load (refresh-safe)', async () => {
    renderPage(`${BASE}&topic=t1`)

    await screen.findByRole('button', { name: /previous topic/i }, queryTimeout)
    expect(screen.getByText('Topic A')).toBeTruthy()
    expect(screen.getByRole('button', { name: /back to all topics/i })).toBeTruthy()
  })

  it('T10b-reader-navigation: browser Back closes the reader to the list; Forward restores it', async () => {
    renderPage()
    await screen.findByText('Topic A', {}, queryTimeout)

    fireEvent.click(screen.getByText('Topic A'))
    await screen.findByRole('button', { name: /previous topic/i }, queryTimeout)
    expect(router.state.location.search).toContain('topic=t1')

    await act(async () => { window.history.back() })
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /previous topic/i })).toBeNull()
      expect(router.state.location.search).not.toContain('topic=')
    }, queryTimeout)

    await act(async () => { window.history.forward() })
    await screen.findByRole('button', { name: /previous topic/i }, queryTimeout)
    expect(router.state.location.search).toContain('topic=t1')
  })

  it('T10c-reader-invalid-topic: an unknown ?topic= id falls back to the list safely (and the param is cleaned up)', async () => {
    renderPage(`${BASE}&topic=ghost-topic`)

    await screen.findByText('Topic A', {}, queryTimeout)
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /previous topic/i })).toBeNull()
      expect(router.state.location.search).not.toContain('topic=')
    }, queryTimeout)
  })

  it('T11-section-keys: sections sharing label+type render without a duplicate-key error', async () => {
    const sections: TopicSection[] = [
      { type: 'list', label_en: 'Same', label_te: 'Same', items: [{ body_en: 'One' }] },
      { type: 'list', label_en: 'Same', label_te: 'Same', items: [{ body_en: 'Two' }] },
    ]
    const readerTopic = topic('t1', 'Reader Topic', 'S1', { content_en: sections })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ThemeProvider>
        <TopicReader topic={readerTopic} topics={[readerTopic]} currentIndex={0} onBack={() => {}} onNext={() => {}} onPrev={() => {}} />
      </ThemeProvider>,
    )

    await screen.findByText('One', {}, queryTimeout)
    expect(screen.getByText('Two')).toBeTruthy()

    const duplicateKeyWarnings = consoleSpy.mock.calls.filter((call) =>
      String(call[0]).includes('Encountered two children with the same key'),
    )
    expect(duplicateKeyWarnings).toHaveLength(0)
    consoleSpy.mockRestore()
  })

  it('T12-security: a user without the selected exam never triggers a fetch (client guard + URL normalization)', async () => {
    authState.user = { id: 'u1', role: 'user', exam_selection: 'BANK_EXAMS', is_active: true } as UserProfile

    renderPage(`/topics?exam=${EX}&paper=${P}&subject=S1`)

    await screen.findByText(/select a subject/i, {}, queryTimeout)
    expect(repo.fetchPublishedTopics).not.toHaveBeenCalled()
  })
})

// ─── Race-condition remediation (A→B→A return-to-context) ────────────────────
// Regression: while the previous context's (B) topics request is still in
// flight, returning to an already-cached context (A) restored A from cache —
// but B's late response was considered current (request id never advanced) and
// overwrote A with stale/empty data. Every loadTopics invocation must advance
// the request id and every post-await mutation must verify BOTH id currency
// and context identity.

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('DS-034 topics page: race-condition remediation (request-id + context guard)', () => {
  it('R1-stale-empty-overwrite: B returns [] after A is cache-restored → A topics remain (the exact regression)', async () => {
    await fetchTopics(EX, P, 'S1') // warm A
    repo.fetchPublishedTopics.mockClear()

    renderPage()
    await screen.findByText('Topic A', {}, queryTimeout)

    // B: subject S2 fetch stays in flight.
    const b = deferred<StudyTopic[]>()
    repo.fetchPublishedTopics.mockImplementationOnce(() => b.promise)
    await act(async () => { await router.navigate(`/topics?exam=${EX}&paper=${P}&subject=S2`) })
    expect(repo.fetchPublishedTopics).toHaveBeenCalledTimes(1)

    // Return to A → cache-restored, no fetch.
    await act(async () => { await router.navigate(`${BASE}`) })
    await screen.findByText('Topic A', {}, queryTimeout)

    // B's empty response lands late → must be discarded.
    await act(async () => { b.resolve([]) })
    await waitFor(() => expect(repo.fetchPublishedTopics).toHaveBeenCalledTimes(1), queryTimeout)

    expect(screen.getByText('Topic A')).toBeTruthy()
    expect(screen.getByText('Topic B')).toBeTruthy()
    expect(screen.queryByText(/No topics found/)).toBeNull()
    expect(repo.fetchPublishedTopics).toHaveBeenCalledTimes(1)
  })

  it('R2-stale-error: B fails after A is cache-restored → A remains, NO B error surfaces', async () => {
    await fetchTopics(EX, P, 'S1')
    repo.fetchPublishedTopics.mockClear()

    renderPage()
    await screen.findByText('Topic A', {}, queryTimeout)

    const b = deferred<StudyTopic[]>()
    repo.fetchPublishedTopics.mockImplementationOnce(() => b.promise)
    await act(async () => { await router.navigate(`/topics?exam=${EX}&paper=${P}&subject=S2`) })

    await act(async () => { await router.navigate(`${BASE}`) })
    await screen.findByText('Topic A', {}, queryTimeout)

    await act(async () => { b.reject(new Error('boom')) })
    await waitFor(() => expect(repo.fetchPublishedTopics).toHaveBeenCalledTimes(1), queryTimeout)

    expect(screen.getByText('Topic A')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
    expect(screen.queryByText(/No topics found/)).toBeNull()
  })

  it('R3-multi-context: A→B→C→A with overlapping responses → only A mutates the UI', async () => {
    await fetchTopics(EX, P, 'S1')
    repo.fetchPublishedTopics.mockClear()

    renderPage()
    await screen.findByText('Topic A', {}, queryTimeout)

    const b = deferred<StudyTopic[]>()
    const c = deferred<StudyTopic[]>()
    repo.fetchPublishedTopics.mockImplementationOnce(() => b.promise)  // B (S2)
    await act(async () => { await router.navigate(`/topics?exam=${EX}&paper=${P}&subject=S2`) })

    repo.fetchPublishedTopics.mockImplementationOnce(() => c.promise)  // C (S3)
    await act(async () => { await router.navigate(`/topics?exam=${EX}&paper=${P}&subject=S3`) })

    await act(async () => { await router.navigate(`${BASE}`) })         // back to A
    await screen.findByText('Topic A', {}, queryTimeout)

    await act(async () => { c.resolve([]) })                            // C empty lands
    await act(async () => { b.resolve(topicsFor('S2')) })               // B data lands
    await waitFor(() => expect(repo.fetchPublishedTopics).toHaveBeenCalledTimes(2), queryTimeout)

    expect(screen.getByText('Topic A')).toBeTruthy()
    expect(screen.getByText('Topic B')).toBeTruthy()
    expect(screen.queryByText('Topic C')).toBeNull()
    expect(screen.queryByText(/No topics found/)).toBeNull()
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
  })

  it('R4-invalid-context-invalidation: in-flight A response is ignored after the URL becomes invalid', async () => {
    renderPage()
    const a = deferred<StudyTopic[]>()
    repo.fetchPublishedTopics.mockImplementationOnce(() => a.promise)

    // A cold load starts and stays in flight (repo called once).
    await act(async () => { await router.navigate(`/topics?exam=${EX}&paper=${P}&subject=S1`) })
    await waitFor(() => expect(repo.fetchPublishedTopics).toHaveBeenCalledTimes(1), queryTimeout)

    // Context becomes invalid (paper/subject cleared) — must invalidate the in-flight A.
    await act(async () => { await router.navigate(`/topics?exam=${EX}`) })
    await screen.findByText(/select a subject/i, {}, queryTimeout)

    await act(async () => { a.resolve(topicsFor('S1')) })

    expect(screen.queryByText('Topic A')).toBeNull()
    expect(screen.queryByText(/No topics found/)).toBeNull()
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
    expect(repo.fetchPublishedTopics).toHaveBeenCalledTimes(1)
  })

  it('R5-normal-cached-load: a warm cache still renders immediately without a refetch (no warm-cache regression)', async () => {
    await fetchTopics(EX, P, 'S1')
    repo.fetchPublishedTopics.mockClear()

    renderPage()
    await screen.findByText('Topic A', {}, queryTimeout)
    expect(repo.fetchPublishedTopics).not.toHaveBeenCalled()
    expect(screen.queryByText(/No topics found/)).toBeNull()
  })

  it('R6-normal-cold-load: a cache miss still fetches and renders (no fetch regression)', async () => {
    renderPage()
    await screen.findByText('Topic A', {}, queryTimeout)
    expect(repo.fetchPublishedTopics).toHaveBeenCalledTimes(1)
  })
})
