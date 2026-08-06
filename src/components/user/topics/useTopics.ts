import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchTopics } from '../../../services/topicsService'
import type { StudyTopic } from '../../../types/exam.types'
import { useAuth } from '../../../context/AuthContext'
import { isExamAllowed, getAllowedExamIds } from '../../../utils/examUtils'
import { usePageError } from '../../../hooks/usePageError'
import { useStableFetch } from '../../../hooks/useStableFetch'

export function useTopics() {
  const { user } = useAuth()
  const { state: errorState, error: pageError, captureNetworkError, retry: retryError } = usePageError()
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedExam = searchParams.get('exam') || 'all'
  const selectedPaper = searchParams.get('paper') || 'all'
  const selectedSubject = searchParams.get('subject') || 'all'

  const [topics, setTopics] = useState<StudyTopic[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTopic, setActiveTopic] = useState<StudyTopic | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const { nextId, isStale } = useStableFetch()

  const isContextValid =
    selectedExam !== 'all' && selectedExam !== 'APPSC_GROUPS' &&
    selectedPaper !== 'all' && selectedSubject !== 'all'

  const updateParams = useCallback((updates: Record<string, string>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      let changed = false
      Object.entries(updates).forEach(([key, value]) => {
        const current = prev.get(key) || 'all'
        if (current !== value) {
          changed = true
          if (value === 'all') next.delete(key)
          else next.set(key, value)
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
        updateParams({ exam: defaultExam, paper: 'all', subject: 'all' });
      }
    } else {
      if (selectedExam === 'all') {
        updateParams({ exam: 'APPSC_GROUP_1', paper: 'all', subject: 'all' });
      }
    }
  }, [selectedExam, user, updateParams])

  const setSelectedExam = useCallback((v: string) => { updateParams({ exam: v, paper: 'all', subject: 'all' }); setActiveTopic(null) }, [updateParams])
  const setSelectedPaper = useCallback((v: string) => { updateParams({ paper: v, subject: 'all' }); setActiveTopic(null) }, [updateParams])
  const setSelectedSubject = useCallback((v: string) => { updateParams({ subject: v }); setActiveTopic(null) }, [updateParams])

  const loadTopics = useCallback(async () => {
    if (!isContextValid) { return }

    if (user && user.role === 'user') {
      const isAllowed = isExamAllowed(user.exam_selection, selectedExam);
      if (!isAllowed) {
        return;
      }
    }

    const id = nextId()
    const isInitial = topics.length === 0 && !activeTopic
    if (isInitial) setIsLoading(true)
    try {
      const data = await fetchTopics(selectedExam, selectedPaper, selectedSubject)
      if (isStale(id)) return
      setTopics(data)
      setActiveTopic(null)
    } catch (err: unknown) {
      if (isStale(id)) return
      setTopics([])
      captureNetworkError(err, { retryFn: loadTopics })
    } finally {
      if (!isStale(id)) {
        setIsLoading(false)
      }
    }
  }, [selectedExam, selectedPaper, selectedSubject, isContextValid, user])

  useEffect(() => { loadTopics() }, [loadTopics])

  const openTopic = (topic: StudyTopic) => {
    const idx = topics.findIndex(t => t.id === topic.id)
    setActiveTopic(topic)
    setActiveIndex(idx)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goNext = () => {
    const next = activeIndex + 1
    if (next < topics.length) { setActiveTopic(topics[next]); setActiveIndex(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  const goPrev = () => {
    const prev = activeIndex - 1
    if (prev >= 0) { setActiveTopic(topics[prev]); setActiveIndex(prev); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

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
    setActiveTopic,
  }
}
