// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, render, screen, act, fireEvent, cleanup } from '@testing-library/react'
import { readFileSync } from 'fs'
import { join } from 'path'

/* ─────────────────────────────────────────────────────────────────────────────
   ADMIN UPLOAD — PER-TOPIC QUESTION COUNTS

   Contract:
     - the hook exposes LIVE per-topic counts keyed by the canonical topic
       name (topic_en) — mapped by name, never by index
     - ONE aggregate query serves the whole grid (no N+1 per card)
     - the request carries the subject-existence gate (no fetch when topics
       cannot render)
     - zero is a legitimate value; LOADING and FAILURE never render as 0
     - the count query owns its own cache namespace
       (admin_upload_topic_counts) — no collision with the subject count or
       the topics list that share identical deps
     - bulk arrival (forceRefreshCounts) forces a fresh fetch
     - cards wrap long topic names instead of truncating
   ────────────────────────────────────────────────────────────────────────── */

vi.mock('../services/adminQuestionService', () => ({
  adminQuestionService: {
    countQuestions: vi.fn(async () => 96),
  },
}))

type TopicCountsFn = (examId: string, paperId?: string, subjectName?: string, force?: boolean) => Promise<Record<string, number>>
const fetchTopicCounts = vi.fn<TopicCountsFn>(async () => ({}))

vi.mock('../services/topicTestService', () => ({
  fetchTopicsBySubject: vi.fn(async () => []),
  fetchTopicCounts: (examId: string, paperId?: string, subjectName?: string, force = false) =>
    fetchTopicCounts(examId, paperId, subjectName, force),
}))

import { useAdminUpload } from '../components/admin/upload/useAdminUpload'
import { SubjectTopicsGrid } from '../components/admin/upload/SubjectTopicsGrid'
import { invalidateCache } from '../services/adminQueryCache'
import { ThemeProvider } from '../context/ThemeContext'
import type { ManualEntryTopic } from '../components/admin/upload/useAdminUpload'

const TOPICS: ManualEntryTopic[] = [
  { id: 't-1', name_en: 'Mauryan Empire', name_te: null },
  { id: 't-2', name_en: 'Gupta Empire', name_te: 'గుప్త సామ్రాజ్యం' },
]
const COUNTS: Record<string, number> = { 'Mauryan Empire': 12, 'Gupta Empire': 0 }

beforeEach(() => {
  invalidateCache()
  fetchTopicCounts.mockReset()
  fetchTopicCounts.mockResolvedValue(COUNTS)
})

afterEach(() => {
  cleanup()
})

// onUploadTypeChange is wired so topicsEnabled resolves true immediately
// (the topic grid — and its per-topic counts — only render for an active mode).
function setup(subject: string, force = false) {
  return renderHook(() => useAdminUpload('APPSC_GROUP_1', 'paper-1', subject, 'single', () => {}, force))
}

describe('hook — per-topic count data flow', () => {
  it('exposes LIVE counts keyed by the canonical topic name', async () => {
    const { result } = setup('history-a')
    await waitFor(() => expect(result.current.topicCountsLoading).toBe(false))
    expect(result.current.topicCounts).toEqual(COUNTS)
    expect(result.current.topicCountsError).toBeNull()
  })

  it('issues exactly ONE count query for the whole grid — no N+1 per card', async () => {
    const { result } = setup('history-b')
    await waitFor(() => expect(result.current.topicCountsLoading).toBe(false))
    expect(fetchTopicCounts).toHaveBeenCalledTimes(1)
    expect(fetchTopicCounts).toHaveBeenCalledWith('APPSC_GROUP_1', 'paper-1', 'history-b', false)
  })

  it('does not query counts while subjects cannot render (no valid context / no mode)', async () => {
    renderHook(() => useAdminUpload('APPSC_GROUP_1', 'paper-1', 'no-mode'))
    expect(fetchTopicCounts).not.toHaveBeenCalled()
  })

  it('countsLoading true until the query settles — never a premature 0', async () => {
    let resolveCounts!: (v: Record<string, number>) => void
    fetchTopicCounts.mockImplementationOnce(() => new Promise(res => { resolveCounts = res }))
    const { result } = setup('history-c')
    expect(result.current.topicCountsLoading).toBe(true)
    await act(async () => { resolveCounts(COUNTS) })
    await waitFor(() => expect(result.current.topicCountsLoading).toBe(false))
    expect(result.current.topicCounts).toEqual(COUNTS)
  })

  it('failure surfaces an error state (never a fake 0)', async () => {
    fetchTopicCounts.mockRejectedValueOnce(new Error('topic_counts blocked'))
    const { result } = setup('history-d')
    await waitFor(() => expect(result.current.topicCountsLoading).toBe(false))
    // H1: the failure surfaces as an error state (classified copy) — never a 0.
    expect(result.current.topicCountsError).toBeTruthy()
    expect(result.current.topicCounts).toEqual({})
  })

  it('cache namespace is isolated — count (number) never leaks into topicCounts (object)', async () => {
    const { result } = setup('history-e')
    await waitFor(() => {
      expect(result.current.topicCountsLoading).toBe(false)
      expect(result.current.countLoading).toBe(false)
    })
    expect(result.current.questionCount).toBe(96)
    expect(typeof result.current.questionCount).toBe('number')
    expect(typeof result.current.topicCounts).toBe('object')
    expect(Array.isArray(result.current.topicCounts)).toBe(false)
  })

  it('forceRefreshCounts threads a forced fetch through fetchTopicCounts', async () => {
    const { result } = setup('history-f', true)
    await waitFor(() => expect(result.current.topicCountsLoading).toBe(false))
    expect(fetchTopicCounts).toHaveBeenCalledWith('APPSC_GROUP_1', 'paper-1', 'history-f', true)
  })

  it('handleSuccess refreshes both the subject count AND the per-topic counts', async () => {
    const { result } = setup('history-g')
    await waitFor(() => expect(result.current.topicCountsLoading).toBe(false))
    const before = fetchTopicCounts.mock.calls.length
    await act(async () => { result.current.handleSuccess() })
    await waitFor(() => expect(fetchTopicCounts.mock.calls.length).toBeGreaterThan(before))
  })
})

const gridSource = readFileSync(join(__dirname, '..', 'components', 'admin', 'upload', 'SubjectTopicsGrid.tsx'), 'utf8')

function renderGrid(overrides: Partial<Parameters<typeof SubjectTopicsGrid>[0]> = {}) {
  const base: Parameters<typeof SubjectTopicsGrid>[0] = {
    topics: TOPICS,
    loading: false,
    error: null,
    onRetry: () => {},
    actionLabel: 'Upload Manually',
    onTopicAction: () => {},
    topicCounts: COUNTS,
    countsLoading: false,
    countsError: null,
    onRetryCounts: () => {},
  }
  render(
    <ThemeProvider>
      <SubjectTopicsGrid {...base} {...overrides} />
    </ThemeProvider>
  )
}

describe('grid — per-card count slot', () => {
  it('renders one "N QUESTIONS AVAILABLE" pill per topic, keyed by name_en', () => {
    renderGrid()
    expect(screen.getByText('12 Questions Available')).toBeTruthy()
    // Legitimate zero renders as a real 0.
    expect(screen.getByText('0 Questions Available')).toBeTruthy()
    expect(screen.getAllByText(/Questions Available/)).toHaveLength(TOPICS.length)
  })

  it('missing count entry falls back to a legitimate 0 (never blank)', () => {
    renderGrid({ topicCounts: {} })
    expect(screen.getAllByText('0 Questions Available')).toHaveLength(TOPICS.length)
  })

  it('while counts load it renders the count skeleton — never a 0 or a badge', () => {
    renderGrid({ countsLoading: true })
    // ONE live region announces the whole count load (never N per card) and
    // the per-card skeleton bars are decorative; the badges must not exist.
    expect(screen.getAllByRole('status', { name: 'Loading topic question counts' })).toHaveLength(1)
    expect(screen.queryAllByText(/Questions Available/)).toHaveLength(0)
    expect(screen.getByText('Mauryan Empire')).toBeTruthy()
  })

  it('on counts error it renders "Unable to load count" + retry — never a 0', async () => {
    const onRetryCounts = vi.fn()
    renderGrid({ countsError: 'blocked', onRetryCounts })
    expect(screen.getAllByText('Unable to load count')).toHaveLength(TOPICS.length)
    expect(screen.queryAllByText(/Questions Available/)).toHaveLength(0)
    fireEvent.click(screen.getAllByRole('button', { name: 'Try Again' })[0])
    expect(onRetryCounts).toHaveBeenCalledTimes(1)
  })

  it('topic titles wrap fully — truncate must not return', () => {
    expect(gridSource).not.toContain('truncate')
    expect(gridSource).toContain('break-words')
  })

  it('action button is anchored via mt-auto so cards align regardless of count state', () => {
    expect(gridSource).toMatch(/mt-auto/)
  })
})