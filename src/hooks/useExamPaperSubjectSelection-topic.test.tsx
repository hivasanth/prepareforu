/* ─────────────────────────────────────────────────────────────────────────────
 * useExamPaperSubjectSelection — TOPIC selection authority (no 'all topics')
 *
 *   SD-1  a topic_en keyed deep link is normalised to the live topic's id once
 *         the segment topics resolve (URL identity becomes canonical)
 *   SD-2  an UNKNOWN deep-linked / missing topic value auto-selects the FIRST
 *         live topic (initial load, ancestor cascades, invalid deep links)
 *   SD-3  an EXPLICITLY selectable live topic id is left untouched (an admin's
 *         pick is never overwritten — no render/state loop)
 *   SD-4  an EMPTY resolved topic list clears the selection to '' (no-topic
 *         state) and still opens the Topic row
 *   SD-5  a failed topic load surfaces a classified error + keeps the row open
 *         while displayTopics stays null (no stale topics from another segment)
 * ──────────────────────────────────────────────────────────────────────────── */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { useExamPaperSubjectSelection } from './useExamPaperSubjectSelection'
import type { TopicItem } from '../services/topicTestService'

const adminUser = { id: 'u-admin', role: 'admin', email: 'a@b.c' }

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: adminUser }),
}))

const STABLE_EXAMS = [{ exam_id: 'APPSC_GROUP_1', name: 'APPSC Group 1' }]
const STABLE_PAPERS = [{ id: 'p1', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 1' }]
const STABLE_SUBJECTS = [{ subject_name: 'History' }]

vi.mock('../services/examService', () => ({
  fetchActiveExams: vi.fn(async () => STABLE_EXAMS),
}))

vi.mock('../services/adminService', () => ({
  adminService: {
    fetchPapersByExam: vi.fn(async () => STABLE_PAPERS),
    fetchSubjectsByPaper: vi.fn(async () => STABLE_SUBJECTS),
  },
}))

/* Mutable per-test topic payload for the real topics query. */
let topicsResult: TopicItem[] = []
let topicsReject = false

vi.mock('../services/topicTestService', () => ({
  fetchTopicsBySubject: vi.fn(async () => {
    if (topicsReject) throw new Error('boom')
    return topicsResult
  }),
}))

const TOPIC_NAME = 'Indus Valley Civilization & Early Historic India'
const TOPICS: TopicItem[] = [
  { id: '63768d25-491f-4f95-acf4-b5b4e2e0b30d', topic_en: TOPIC_NAME, topic_te: null, display_order: 1 },
  { id: '3f0a0123-4567-489a-bcde-f01234567890', topic_en: 'Vedic Age', topic_te: null, display_order: 2 },
]

const BASE_PROPS = {
  selectedExam: 'APPSC_GROUP_1',
  setSelectedExam: vi.fn(),
  selectedPaper: 'p1',
  setSelectedPaper: vi.fn(),
  selectedSubject: 'History',
  setSelectedSubject: vi.fn(),
  showTopics: true,
  showPapers: true,
  showSubjects: true,
}

beforeEach(() => {
  topicsResult = TOPICS
  topicsReject = false
})

afterEach(() => cleanup())

describe('topic selection authority (SD-1/SD-2/SD-3)', () => {
  it('normalises a topic_en-keyed deep link to the live topic id once topics resolve', async () => {
    const setSelectedTopic = vi.fn()
    renderHook(() => useExamPaperSubjectSelection({
      ...BASE_PROPS,
      selectedTopic: TOPIC_NAME,
      setSelectedTopic,
    }))

    await waitFor(() => expect(setSelectedTopic).toHaveBeenCalledWith(TOPICS[0].id!))
    // never clears a value that DID resolve to a live topic
    expect(setSelectedTopic).not.toHaveBeenCalledWith('')
  })

  it('auto-selects the FIRST live topic when the deep link is unknown', async () => {
    const setSelectedTopic = vi.fn()
    renderHook(() => useExamPaperSubjectSelection({
      ...BASE_PROPS,
      selectedTopic: 'stale-topic-id',
      setSelectedTopic,
    }))

    await waitFor(() => expect(setSelectedTopic).toHaveBeenCalledWith(TOPICS[0].id!))
  })

  it('auto-selects the FIRST live topic when there is no topic value yet (initial load / cascade)', async () => {
    const setSelectedTopic = vi.fn()
    renderHook(() => useExamPaperSubjectSelection({
      ...BASE_PROPS,
      selectedTopic: '',
      setSelectedTopic,
    }))

    await waitFor(() => expect(setSelectedTopic).toHaveBeenCalledWith(TOPICS[0].id!))
  })

  it('leaves an explicitly selected LIVE topic id untouched (admin pick preserved — no loop)', async () => {
    const setSelectedTopic = vi.fn()
    renderHook(() => useExamPaperSubjectSelection({
      ...BASE_PROPS,
      selectedTopic: TOPICS[1].id!,
      setSelectedTopic,
    }))

    await new Promise(r => setTimeout(r, 80))
    expect(setSelectedTopic).not.toHaveBeenCalled()
  })
})

describe('topic row state (SD-4/SD-5)', () => {
  it('an EMPTY resolved list clears the selection to "" and still opens the topic row', async () => {
    topicsResult = []
    const setSelectedTopic = vi.fn()
    const { result } = renderHook(() => useExamPaperSubjectSelection({
      ...BASE_PROPS,
      selectedTopic: 'stale-topic-id',
      setSelectedTopic,
    }))

    await waitFor(() => expect(result.current.displayTopics).toEqual([]))
    // the no-topic empty state owns the row — the stale value is cleared
    await waitFor(() => expect(setSelectedTopic).toHaveBeenCalledWith(''))
    expect(result.current.topicsRowOpen).toBe(true)
    expect(result.current.topicsLoading).toBe(false)
  })

  it('keeps the row open on a failed topic load, surfaces a classified error and retains no stale topics', async () => {
    topicsReject = true
    const { result } = renderHook(() => useExamPaperSubjectSelection({
      ...BASE_PROPS,
      selectedTopic: '',
      setSelectedTopic: vi.fn(),
    }))

    await waitFor(() => expect(result.current.topicsError).toBeTruthy(), { timeout: 8000 })
    expect(result.current.topicsRowOpen).toBe(true)
    // No stale topics from IT topics leak into the failed segment.
    expect(result.current.displayTopics).not.toEqual(TOPICS)
  })
})