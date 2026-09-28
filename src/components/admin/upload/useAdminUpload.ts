import { useState, useCallback, useEffect, useRef } from 'react'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { adminQuestionService } from '../../../services/adminQuestionService'
import { fetchTopicCounts, fetchTopicsBySubject } from '../../../services/topicTestService'
import type { UploadMethod } from '../../../lib/utils/uploadMethodParam'

/**
 * ONE topic identity object for the manual-entry flow.
 * The clicked card yields exactly this object; consumers derive
 * topicId / topicEnglish / topicTelugu from it so identity and
 * labels can never drift apart.
 */
export interface ManualEntryTopic {
  /** Canonical exam_topics.id (LIVE). Null only for questions-derived topics with no exam_topics row. */
  id: string | null
  name_en: string
  name_te: string | null
}

export interface AdminUploadFeedback {
  type: 'success' | 'error'
  message: string
}

export function useAdminUpload(
  selectedExam: string,
  selectedPaper: string,
  selectedSubject: string,
  uploadType: UploadMethod | null = null,
  onUploadTypeChange?: (type: UploadMethod | null) => void,
  /** BulkB parser arrival flag — forces ONE fresh topic-count fetch on the
   *  post-sync remount so the cards never hydrate a stale cached count. Held
   *  in a ref (not a dep) so it never churns the query cache key. */
  forceRefreshCounts = false
) {
  const [feedback, setFeedback] = useState<AdminUploadFeedback | null>(null)
  // Force-refresh flag for the per-topic count query. Held in a ref (not a
  // dep) so it never churns the query cache key, and synced in an effect
  // declared BEFORE the queries below — so on mount the count query's own
  // fetch effect observes the bulk-arrival force flag.
  const forceTopicCountsRef = useRef(forceRefreshCounts)
  useEffect(() => {
    forceTopicCountsRef.current = forceRefreshCounts
  }, [forceRefreshCounts])
  // uploadType is CONTROLLED by the page (URL-driven via
  // uploadMethodParam). When no callback is wired (legacy/test callers), the
  // hook falls back to its own state so behavior is unchanged.
  const [internalUploadType, setInternalUploadType] = useState<UploadMethod | null>(null)
  const effectiveUploadType = onUploadTypeChange ? uploadType : internalUploadType
  // Bulk no longer opens a multi-topic modal here — its topic cards navigate to
  // the topic-specific Bulk Parser page, so only the manual modal is hosted.
  const [activeModal, setActiveModal] = useState<'single' | null>(null)
  const [labels, setLabels] = useState({ exam: '', paper: '' })
  const [selectedTopic, setSelectedTopic] = useState<ManualEntryTopic | null>(null)

  const isContextValid =
    selectedExam !== 'all' &&
    selectedExam !== 'APPSC_GROUPS' &&
    selectedPaper !== 'all' &&
    selectedSubject !== 'all'

  const { data: questionCount, loading: countLoading, error: countError, category: countCategory, refetch: refetchCount } = useSupabaseQuery<number>(async () => {
    if (!isContextValid) return { data: 0, error: null }
    try {
      const count = await adminQuestionService.countQuestions({
        examId: selectedExam,
        paperId: selectedPaper,
        subjectName: selectedSubject,
      })
      return { data: count, error: null }
    } catch (error) {
      // H1: a failed count must surface as an ERROR state in the UI, never
      // as the success value 0. data stays null so no fake zero renders.
      return { data: null, error: error instanceof Error ? error : 'Failed to count questions.' }
    }
    // Namespace 'admin_upload_count': count (number) and topics (ManualEntryTopic[])
    // share identical deps — distinct namespaces keep their cache entries separate.
  }, [selectedExam, selectedPaper, selectedSubject, isContextValid], 'admin_upload_count')

  // Live topic list — SAME authoritative service/query path as User Panel
  // Topic Exams (topicTestService.fetchTopicsBySubject → exam_topics, with a
  // distinct-topics fallback inside the service). Both upload flows render
  // their cards from this single source.
  const topicsEnabled = isContextValid && effectiveUploadType !== null
  const { data: topics, loading: topicsLoading, error: topicsError, refetch: refetchTopics } = useSupabaseQuery<ManualEntryTopic[]>(async () => {
    if (!topicsEnabled) return { data: [], error: null }
    try {
      const items = await fetchTopicsBySubject(selectedExam, selectedPaper, selectedSubject)
      return {
        data: items.map(t => ({ id: t.id ?? null, name_en: t.topic_en, name_te: t.topic_te })),
        error: null,
      }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to load topics.' }
    }
  }, [selectedExam, selectedPaper, selectedSubject, topicsEnabled], 'admin_upload_topics')

  // LIVE per-topic question counts — ONE db-side aggregate query
  // (public.topic_counts view, GROUP BY topic_en) reused from the User Panel
  // Topic Exams flow. One Request for the whole grid → no N+1 per card.
  // Mapped in the grid by topic.name_en (the canonical segment-unique key).
  const { data: topicCountsData, loading: topicCountsLoading, error: topicCountsError, refetch: refetchTopicCounts } = useSupabaseQuery<Record<string, number>>(async () => {
    if (!topicsEnabled) return { data: {}, error: null }
    try {
      const counts = await fetchTopicCounts(selectedExam, selectedPaper, selectedSubject, forceTopicCountsRef.current)
      return { data: counts, error: null }
    } catch (error) {
      // H1 applies per-topic too: a failed count must surface as an ERROR
      // state, never as a valid-looking 0. data stays null.
      return { data: null, error: error instanceof Error ? error.message : 'Failed to load topic question counts.' }
    }
  }, [selectedExam, selectedPaper, selectedSubject, topicsEnabled], 'admin_upload_topic_counts')

  // Context change invalidates the clicked topic — a topic from Subject A can
  // never stay selected once Subject B becomes active. Reset during render
  // (React "adjusting state when props change" pattern — no effect cascade).
  const contextKey = `${selectedExam}|${selectedPaper}|${selectedSubject}`
  const [lastContextKey, setLastContextKey] = useState(contextKey)
  if (contextKey !== lastContextKey) {
    setLastContextKey(contextKey)
    setSelectedTopic(null)
  }

  const handleMethodSelect = useCallback((type: UploadMethod) => {
    if (onUploadTypeChange) onUploadTypeChange(type)
    else setInternalUploadType(type)
  }, [onUploadTypeChange])

  const handleBack = useCallback(() => {
    if (onUploadTypeChange) onUploadTypeChange(null)
    else setInternalUploadType(null)
  }, [onUploadTypeChange])

  const handleOpenManualForTopic = useCallback((topic: ManualEntryTopic) => {
    setSelectedTopic(topic)
    setActiveModal('single')
  }, [])

  const handleModalClose = useCallback(() => {
    setActiveModal(null)
    setSelectedTopic(null)
  }, [])

  // Reached ONLY by the manual-entry modal (bulk navigates to its own page and
  // hosts no modal here), so the success copy is unconditionally the single one.
  const handleSuccess = useCallback(() => {
    setActiveModal(null)
    setSelectedTopic(null)
    setFeedback({ type: 'success', message: 'Question added successfully!' })
    refetchCount()
    refetchTopicCounts()
  }, [refetchCount, refetchTopicCounts])

  return {
    feedback,
    clearFeedback: () => setFeedback(null),
    uploadType: effectiveUploadType,
    activeModal,
    labels,
    isContextValid,
    questionCount,
    countLoading,
    countError,
    countCategory,
    refetchCount,
    topics: topics ?? [],
    topicsLoading,
    topicsError,
    refetchTopics,
    topicCounts: topicCountsData ?? {},
    topicCountsLoading,
    topicCountsError,
    refetchTopicCounts,
    selectedTopic,
    handleMethodSelect,
    handleBack,
    handleOpenManualForTopic,
    handleModalClose,
    handleSuccess,
    setLabels,
  }
}
