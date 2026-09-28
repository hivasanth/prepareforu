import { useState, useCallback, useEffect, useRef } from 'react'
import { useAsyncOperation } from '../../../hooks/useAsyncOperation'
import { useAuth } from '../../../context/AuthContext'
import { useAdminFilters } from '../../../hooks/useAdminFilters'
import {
  fetchTopicsAdmin, createTopic, updateTopic,
  deleteTopic, toggleTopicPublish, getNextDisplayOrder,
  reorderTopics,
} from '../../../services/topicsService'
import type { StudyTopic, TopicSection } from '../../../types/exam.types'
import { AI_PROMPT_TEMPLATE } from '../../../constants/aiPromptTemplate'
import { parseOutlineText, reconstructOutlineText } from '../../../utils/parseOutlineText'
import { topicMetadataSchema } from '../../../validations/adminSchemas'
import { normalizeError } from '../../../utils/errorClassification'
import { copyText } from '../../../utils/clipboardUtils'
import type { PageError } from '../../../types/error.types'

// HIGH-1: retry loading state for the initial-load RetryButton
// MED-2: per-topic set tracking which publish toggles are in flight

type TopicFieldErrors = Partial<Record<
  'title_en' | 'content_en' | 'title_te' | 'content_te' | 'youtube_url' | 'display_order',
  string
>>

export function useAdminTopics() {
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<PageError | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successAlert, setSuccessAlert] = useState<string | null>(null)
  const { selectedExam, selectedPaper, selectedSubject, setSelectedExam, setSelectedPaper, setSelectedSubject } = useAdminFilters()
  const [topics, setTopics] = useState<StudyTopic[]>([])
  const { loading: isLoading, execute } = useAsyncOperation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<StudyTopic | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [previewTopic, setPreviewTopic] = useState<StudyTopic | null>(null)
  const [topicToDelete, setTopicToDelete] = useState<StudyTopic | null>(null)
  const [activeLang, setActiveLang] = useState<'en' | 'te'>('en')
  const [titleEn, setTitleEn] = useState('')
  const [titleTe, setTitleTe] = useState('')
  const [rawEn, setRawEn] = useState('')
  const [rawTe, setRawTe] = useState('')
  const [parsedEn, setParsedEn] = useState<TopicSection[] | null>(null)
  const [parsedTe, setParsedTe] = useState<TopicSection[] | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [displayOrder, setDisplayOrder] = useState(1)
  const [isPublished, setIsPublished] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<TopicFieldErrors>({})
  const submittedRef = useRef(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [togglingTopicIds, setTogglingTopicIds] = useState<Set<string>>(new Set())
  const [isReordering, setIsReordering] = useState(false)
  // MED-4: per-topic publish operation state for safe rollback
  const publishOpsRef = useRef<Map<string, number>>(new Map())
  const publishOpIdRef = useRef(0)

  const isContextValid =
    selectedExam !== 'all' && selectedExam !== 'APPSC_GROUPS' &&
    selectedPaper !== 'all' && selectedSubject !== 'all'

  const loadTopics = useCallback(async () => {
    if (!isContextValid) { setTopics([]); return }
    try {
      setIsRetrying(true)
      await execute(async () => {
        setTopics(await fetchTopicsAdmin(selectedExam, selectedPaper, selectedSubject))
        setLoadError(null)
      })
    } catch (err: unknown) {
      setLoadError(normalizeError(err))
    } finally {
      setIsRetrying(false)
    }
  }, [selectedExam, selectedPaper, selectedSubject, isContextValid, execute])

  useEffect(() => { loadTopics() }, [loadTopics])

  const resetForm = (topic?: StudyTopic, nextOrder?: number) => {
    setTitleEn(topic?.title_en ?? '')
    setTitleTe(topic?.title_te ?? '')
    setRawEn(topic?.content_en?.length ? reconstructOutlineText(topic.content_en, 'en') : '')
    setRawTe(topic?.content_te?.length ? reconstructOutlineText(topic.content_te, 'te') : '')
    setParsedEn(topic?.content_en?.length ? topic.content_en : null)
    setParsedTe(topic?.content_te?.length ? topic.content_te : null)
    setYoutubeUrl(topic?.youtube_url ?? '')
    setDisplayOrder(topic?.display_order ?? nextOrder ?? 1)
    setIsPublished(topic?.is_published ?? true)
    setActiveLang('en')
    setFieldErrors({})
    submittedRef.current = false
  }

  const openAdd = async () => {
    setSuccessAlert(null)
    setActionError(null)
    const nextOrder = await getNextDisplayOrder(selectedExam, selectedPaper, selectedSubject)
    setEditingTopic(null)
    resetForm(undefined, nextOrder)
    setIsModalOpen(true)
  }

  const openEdit = (topic: StudyTopic) => {
    setSuccessAlert(null)
    setActionError(null)
    setEditingTopic(topic)
    resetForm(topic)
    setIsModalOpen(true)
  }

  const closeModal = () => { setIsModalOpen(false); setEditingTopic(null); setError(null); setFieldErrors({}); submittedRef.current = false }

  const handleCopyAiPrompt = async () => {
    const ok = await copyText(AI_PROMPT_TEMPLATE)
    if (!ok) {
      setActionError('Failed to copy prompt')
    }
  }

  const handleParseEn = () => {
    const result = parseOutlineText(rawEn, 'en')
    setParsedEn(result)
  }

  const handleParseTe = () => {
    const result = parseOutlineText(rawTe, 'te')
    setParsedTe(result)
  }

  const computeErrors = (finalParsedEn: TopicSection[] | null): TopicFieldErrors => {
    const next: TopicFieldErrors = {}
    const metaResult = topicMetadataSchema.safeParse({ display_order: displayOrder, youtube_url: youtubeUrl })
    if (!metaResult.success) {
      metaResult.error.issues.forEach(issue => {
        const field = issue.path[0] as 'display_order' | 'youtube_url' | undefined
        if (field === 'display_order' || field === 'youtube_url') next[field] = issue.message
      })
    }
    if (!titleEn.trim()) next.title_en = 'English title is required.'
    if (!finalParsedEn || finalParsedEn.length === 0) next.content_en = 'Please add and parse your English content first.'
    return next
  }

  const handleSave = async () => {
    submittedRef.current = true

    let finalParsedEn = parsedEn
    if (rawEn.trim() && (!finalParsedEn || finalParsedEn.length === 0)) {
      finalParsedEn = parseOutlineText(rawEn, 'en')
    }

    let finalParsedTe = parsedTe
    if (rawTe.trim() && (!finalParsedTe || finalParsedTe.length === 0)) {
      finalParsedTe = parseOutlineText(rawTe, 'te')
    }

    const nextFieldErrors = computeErrors(finalParsedEn)
    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) return

    setIsSaving(true)
    try {
      const payload = {
        title_en:     titleEn.trim(),
        title_te:     titleTe.trim(),
        summary_en:   '',
        summary_te:   '',
        content_en:   finalParsedEn!,
        content_te:   finalParsedTe ?? [],
        youtube_url:  youtubeUrl.trim() || null,
        display_order: displayOrder,
        is_published: isPublished,
      }

      const cacheContext = { exam_id: selectedExam, paper_id: selectedPaper, subject_name: selectedSubject }

      if (editingTopic) {
        const updated = await updateTopic(editingTopic.id, payload, user, cacheContext)
        setTopics(prev => prev.map(t => t.id === updated.id ? updated : t))
        setSuccessAlert('Topic updated!')
      } else {
        if (!user) return setError('Authentication required.')
        const created = await createTopic({
          ...payload,
          exam_id:      selectedExam,
          paper_id:     selectedPaper,
          subject_name: selectedSubject,
          created_by:   user.id,
        }, user)
        setTopics(prev => [...prev, created].sort((a, b) => a.display_order - b.display_order))
        setSuccessAlert('Topic created!')
      }
      setError(null)
      closeModal()
    } catch (err: unknown) {
      setError(normalizeError(err).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTopicFieldBlur = (field: keyof TopicFieldErrors) => {
    if (!submittedRef.current) return
    let finalParsedEn = parsedEn
    if (rawEn.trim() && (!finalParsedEn || finalParsedEn.length === 0)) {
      finalParsedEn = parseOutlineText(rawEn, 'en')
    }
    const nextFieldErrors = computeErrors(finalParsedEn)
    setFieldErrors(prev => ({ ...prev, [field]: nextFieldErrors[field] }))
  }

  const handleDelete = (topic: StudyTopic) => {
    setDeleteError(null)
    setTopicToDelete(topic)
  }

  const handleConfirmDelete = async () => {
    if (!topicToDelete) return
    setIsDeleting(true)
    try {
      await execute(async () => {
        await deleteTopic(topicToDelete.id, user, { exam_id: selectedExam, paper_id: selectedPaper, subject_name: selectedSubject })
        setTopics(prev => prev.filter(t => t.id !== topicToDelete.id))
        setTopicToDelete(null)
        setDeleteError(null)
        setActionError(null)
        setSuccessAlert('Topic deleted.')
      })
    } catch (err: unknown) {
      // P0-2: surface the failure INSIDE the dialog rather than behind it. The
      // modal stays open (topicToDelete not cleared) so the user sees the
      // error and can retry or cancel.
      setDeleteError(normalizeError(err).message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTogglePublish = async (topic: StudyTopic) => {
    const newPublished = !topic.is_published
    const opId = ++publishOpIdRef.current
    publishOpsRef.current.set(topic.id, opId)
    // Optimistic update: flip only this topic
    setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, is_published: newPublished } : t))
    setTogglingTopicIds(prev => new Set(prev).add(topic.id))
    try {
      await toggleTopicPublish(topic.id, newPublished, user, { exam_id: selectedExam, paper_id: selectedPaper, subject_name: selectedSubject })
    } catch (err: unknown) {
      // Only rollback if no newer operation has taken over for this topic
      if (publishOpsRef.current.get(topic.id) === opId) {
        setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, is_published: !newPublished } : t))
      }
      setActionError(normalizeError(err).message)
    } finally {
      if (publishOpsRef.current.get(topic.id) === opId) {
        publishOpsRef.current.delete(topic.id)
      }
      setTogglingTopicIds(prev => { const next = new Set(prev); next.delete(topic.id); return next })
    }
  }

  const handleMove = async (idx: number, dir: 'up' | 'down') => {
    if (isReordering) return
    const arr = [...topics]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= arr.length) return
    ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
    const updated = arr.map((t, i) => ({ ...t, display_order: i + 1 }))
    setTopics(updated)
    setIsReordering(true)
    try {
      await reorderTopics(updated.map(t => ({ id: t.id, display_order: t.display_order })), user, {
        exam_id: selectedExam, paper_id: selectedPaper, subject_name: selectedSubject,
      })
    } catch (err: unknown) {
      setActionError(normalizeError(err).message)
      loadTopics()
    } finally {
      setIsReordering(false)
    }
  }

  return {
    user, error, loadError,
    actionError, successAlert, deleteError,
    clearActionError: () => setActionError(null),
    clearSuccessAlert: () => setSuccessAlert(null),
    topics, isLoading, isContextValid, isRetrying, isReordering,
    selectedExam, selectedPaper, selectedSubject,
    setSelectedExam, setSelectedPaper, setSelectedSubject,
    isModalOpen, editingTopic, isSaving,
    previewTopic, setPreviewTopic,
    topicToDelete, isDeleting,
    activeLang, setActiveLang,
    titleEn, setTitleEn,
    titleTe, setTitleTe,
    rawEn, setRawEn,
    rawTe, setRawTe,
    parsedEn, setParsedEn,
    parsedTe, setParsedTe,
    youtubeUrl, setYoutubeUrl,
    displayOrder, setDisplayOrder,
    isPublished, setIsPublished,
    openAdd, openEdit, closeModal,
    handleCopyAiPrompt,
    handleParseEn, handleParseTe,
    handleSave,
    fieldErrors, handleTopicFieldBlur,
    handleDelete, handleConfirmDelete, cancelDelete: () => { setTopicToDelete(null); setDeleteError(null) },
    handleTogglePublish, handleMove,
    togglingTopicIds,
    loadTopics,
  }
}
