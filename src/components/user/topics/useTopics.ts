import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchTopics, getCachedTopics } from '../../../services/topicsService'
import type { StudyTopic } from '../../../types/exam.types'
import { useAuth } from '../../../context/AuthContext'
import { isExamAllowed, getAllowedExamIds } from '../../../utils/examUtils'
import { usePageError } from '../../../hooks/usePageError'
import { useStableFetch } from '../../../hooks/useStableFetch'

// Canonical, deterministic identity of a topics request context. Used by
// loadTopics as the context-at-call snapshot and compared against the live URL
// context before every post-await state mutation, so a late response from a
// previous context can never write into a newer one.
function getTopicsContextKey(examId: string, paperId: string, subjectName: string): string {
  return `${examId}|${paperId}|${subjectName}`
}

export function useTopics() {
  const { user } = useAuth()
  const { state: errorState, error: pageError, captureNetworkError, retry: retryError, reset: resetError } = usePageError()
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedExam = searchParams.get('exam') || 'all'
  const selectedPaper = searchParams.get('paper') || 'all'
  const selectedSubject = searchParams.get('subject') || 'all'

  const isContextValid =
    selectedExam !== 'all' && selectedExam !== 'APPSC_GROUPS' &&
    selectedPaper !== 'all' && selectedSubject !== 'all'

  // T-H1: hydrate from the exact current-context cache key on a cold mount so a
  // warm cache renders immediately — never a false EmptyState, never a skeleton
  // flash. The key embeds the full (exam, paper, subject) tuple, so a cached
  // value can never be confused with another context.
  const [topics, setTopics] = useState<StudyTopic[]>(() => {
    if (!isContextValid) return []
    return getCachedTopics(selectedExam, selectedPaper, selectedSubject) ?? []
  })
  const [isLoading, setIsLoading] = useState(false)

  const { nextId, isStale } = useStableFetch()

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      let changed = false
      Object.entries(updates).forEach(([key, value]) => {
        const current = prev.get(key) || 'all'
        if (value === null || value === 'all') {
          if (current !== 'all') {
            changed = true
            next.delete(key)
          }
        } else if (current !== value) {
          changed = true
          next.set(key, value)
        }
      })
      return changed ? next : prev
    }, { replace: true })
  }, [setSearchParams])

  useEffect(() => {
    if (!user) return;
    const isUser = user.role === 'user';
    if (isUser) {
      const allowedExams = getAllowedExamIds(user.exam_selection);
      const isAllowed = isExamAllowed(user.exam_selection, selectedExam);
      if (!isAllowed || selectedExam === 'all') {
        const defaultExam = allowedExams[0] || 'APPSC_GROUP_1';
        updateParams({ exam: defaultExam, paper: 'all', subject: 'all', topic: null });
      }
    } else {
      if (selectedExam === 'all') {
        updateParams({ exam: 'APPSC_GROUP_1', paper: 'all', subject: 'all', topic: null });
      }
    }
  }, [selectedExam, user, updateParams])

  // ─── Selection changes (T-H2 + T-H1 context safety) ────────────────────────
  // Changing exam/paper/subject must: (1) clear any stale page error so an old
  // context's failure can never block a new context's success; (2) drop the
  // reader topic (a topic from another context is invalid); (3) hydrate the new
  // context's cache synchronously when present, otherwise clear + raise the
  // loading gate so no previous-context content ever renders under a new header.
  const setSelectedExam = useCallback((v: string) => {
    resetError()
    const cached = getCachedTopics(v, 'all', 'all')
    if (cached !== null) setTopics(cached)
    else { setTopics([]); setIsLoading(true) }
    updateParams({ exam: v, paper: 'all', subject: 'all', topic: null })
  }, [updateParams, resetError])

  const setSelectedPaper = useCallback((v: string) => {
    resetError()
    const cached = getCachedTopics(selectedExam, v, 'all')
    if (cached !== null) setTopics(cached)
    else { setTopics([]); setIsLoading(true) }
    updateParams({ paper: v, subject: 'all', topic: null })
  }, [selectedExam, updateParams, resetError])

  const setSelectedSubject = useCallback((v: string) => {
    resetError()
    const cached = getCachedTopics(selectedExam, selectedPaper, v)
    if (cached !== null) setTopics(cached)
    else { setTopics([]); setIsLoading(true) }
    updateParams({ subject: v, topic: null })
  }, [selectedExam, selectedPaper, updateParams, resetError])

  // ─── Context change guard (T-H2 robust + T-H1 consequence #2) ─────────────
  // Catches context changes that arrive through ANY path (tab clicks already
  // handle this synchronously in the setSelected* callbacks; this covers URL
  // navigation / deep links). On a new context tuple it: clears any stale page
  // error, then either hydrates the new context's cache synchronously or clears
  // topics + raises the loading gate so previous-context content can never
  // render under a new header. `lastContextKey` only triggers on an actual
  // tuple change, so this never loops.
  const contextKey = `${selectedExam}|${selectedPaper}|${selectedSubject}`
  const lastContextKey = useRef(contextKey)
  useEffect(() => {
    if (lastContextKey.current === contextKey) return
    lastContextKey.current = contextKey
    resetError()
    const cached = getCachedTopics(selectedExam, selectedPaper, selectedSubject)
    if (cached !== null) setTopics(cached)
    else { setTopics([]); setIsLoading(true) }
  }, [contextKey, selectedExam, selectedPaper, selectedSubject, resetError])

  // ─── Data load (T-M1: deps are the request context only) ───────────────────
  // Race-condition fix: EVERY invocation — including invalid-context and
  // cache-hit runs — advances the request id FIRST, so a request still in
  // flight from a PREVIOUS context is stale the instant the context changes
  // away from it. The context-at-call snapshot is the second (identity) guard
  // applied to every post-await mutation, so a late response can never
  // overwrite a newer context's state. This closes the A→B→A regression where
  // B's in-flight response used to clobber A's cache-restored topics.
  const loadTopics = useCallback(async (force = false): Promise<boolean> => {
    const id = nextId()
    const contextAtCall = getTopicsContextKey(selectedExam, selectedPaper, selectedSubject)

    if (!isContextValid) { return false }

    // The URL-normalization useEffect above runs *after* the render that
    // calls loadTopics. Between a bad URL state and the normalization
    // useEffect firing, this guard prevents a stray fetch with an exam
    // the user is not allowed to see. The double-check is load-bearing
    // for the URL-state race window — kept intentionally.
    if (user && user.role === 'user') {
      const isAllowed = isExamAllowed(user.exam_selection, selectedExam);
      if (!isAllowed) {
        return false;
      }
    }

    // T-H1: warm-cache path — hydrate state from the exact current-context key
    // and return (no network call, no skeleton). Cached data is guaranteed to
    // belong to the current context because the key is the full tuple. This
    // path advances the request id (above) so any still-in-flight request from
    // an older context becomes stale the moment the cache restores this one.
    if (!force) {
      const cached = getCachedTopics(selectedExam, selectedPaper, selectedSubject);
      if (cached !== null) {
        setTopics(cached)
        return true
      }
    }

    setIsLoading(true)
    try {
      const data = await fetchTopics(selectedExam, selectedPaper, selectedSubject, force)
      if (isStale(id) || contextAtCall !== getTopicsContextKey(selectedExam, selectedPaper, selectedSubject)) {
        return false
      }
      setTopics(data)
      return true
    } catch (err: unknown) {
      if (isStale(id) || contextAtCall !== getTopicsContextKey(selectedExam, selectedPaper, selectedSubject)) {
        return false
      }
      setTopics([])
      captureNetworkError(err, { retryFn: () => loadTopics(true) })
      return false
    } finally {
      if (!isStale(id) && contextAtCall === getTopicsContextKey(selectedExam, selectedPaper, selectedSubject)) {
        setIsLoading(false)
      }
    }
  }, [selectedExam, selectedPaper, selectedSubject, isContextValid, user, nextId, isStale, captureNetworkError])

  useEffect(() => { loadTopics() }, [loadTopics])

  // ─── Reader state (T-M5): `?topic=<stable-id>` is the single source of truth ─
  // The reader is URL-addressable: browser Back closes it (openTopic pushes),
  // Forward reopens it, refresh restores it when the topic still belongs to the
  // current context. Invalid/foreign topic ids fall back to the list safely.
  const topicParam = searchParams.get('topic')
  const activeIndex = topicParam ? topics.findIndex(t => t.id === topicParam) : -1
  const activeTopic = activeIndex >= 0 ? topics[activeIndex] : null

  const openTopic = useCallback((topic: StudyTopic) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('topic', topic.id)
      return next
    }, { replace: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setSearchParams])

  const closeReader = useCallback(() => {
    setSearchParams(prev => {
      if (!prev.get('topic')) return prev
      const next = new URLSearchParams(prev)
      next.delete('topic')
      return next
    }, { replace: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setSearchParams])

  const goNext = useCallback(() => {
    if (activeIndex < 0 || activeIndex + 1 >= topics.length) return
    const nextTopic = topics[activeIndex + 1]
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('topic', nextTopic.id)
      return next
    }, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeIndex, topics, setSearchParams])

  const goPrev = useCallback(() => {
    if (activeIndex <= 0) return
    const prevTopic = topics[activeIndex - 1]
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('topic', prevTopic.id)
      return next
    }, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeIndex, topics, setSearchParams])

  // Clean up a dangling/invalid `?topic=` once topics are loaded so a foreign
  // or deleted topic id can never keep a reader state alive (falls back to list).
  useEffect(() => {
    const tp = searchParams.get('topic')
    if (!tp) return
    if (topics.length > 0 && !topics.some(t => t.id === tp)) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.delete('topic')
        return next
      }, { replace: true })
    }
  }, [searchParams, topics, setSearchParams])

  return {
    topics,
    isLoading,
    activeTopic,
    activeIndex,
    errorState,
    pageError,
    retryError,
    selectedExam,
    selectedPaper,
    selectedSubject,
    isContextValid,
    setSelectedExam,
    setSelectedPaper,
    setSelectedSubject,
    openTopic,
    goNext,
    goPrev,
    closeReader,
  }
}
