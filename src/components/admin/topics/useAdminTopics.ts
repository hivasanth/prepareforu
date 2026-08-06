import { useState, useCallback, useEffect, useRef } from 'react'
import { useAsyncOperation } from '../../../hooks/useAsyncOperation'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../hooks/useToast'
import { useAdminFilters } from '../../../hooks/useAdminFilters'
import {
  fetchTopicsAdmin, createTopic, updateTopic,
  deleteTopic, toggleTopicPublish, getNextDisplayOrder
} from '../../../services/topicsService'
import type { StudyTopic, TopicSection } from '../../../types/exam.types'
import { AI_PROMPT_TEMPLATE } from '../../../constants/aiPromptTemplate'
import { parseOutlineText, reconstructOutlineText } from '../../../utils/parseOutlineText'
import { topicMetadataSchema } from '../../../validations/adminSchemas'

type TopicFieldErrors = Partial<Record<
  'title_en' | 'content_en' | 'title_te' | 'content_te' | 'youtube_url' | 'display_order',
  string
>>

export function useAdminTopics() {
  const { user } = useAuth()
  const { toasts, showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)
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

  const isContextValid =
    selectedExam !== 'all' && selectedExam !== 'APPSC_GROUPS' &&
    selectedPaper !== 'all' && selectedSubject !== 'all'

  const loadTopics = useCallback(async () => {
    if (!isContextValid) { setTopics([]); return }
    try {
      await execute(async () => {
        setTopics(await fetchTopicsAdmin(selectedExam, selectedPaper, selectedSubject))
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load topics')
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
    const nextOrder = await getNextDisplayOrder(selectedExam, selectedPaper, selectedSubject)
    setEditingTopic(null)
    resetForm(undefined, nextOrder)
    setIsModalOpen(true)
  }

  const openEdit = (topic: StudyTopic) => {
    setEditingTopic(topic)
    resetForm(topic)
    setIsModalOpen(true)
  }

  const closeModal = () => { setIsModalOpen(false); setEditingTopic(null); setError(null); setFieldErrors({}); submittedRef.current = false }

  const handleCopyAiPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE)
      showSuccess('AI Prompt Template copied to clipboard!')
    } catch {
      setError('Failed to copy prompt')
    }
  }

  const handleParseEn = () => {
    const result = parseOutlineText(rawEn, 'en')
    setParsedEn(result)
    if (result.length > 0) showSuccess(`Parsed ${result.length} English sections`)
  }

  const handleParseTe = () => {
    const result = parseOutlineText(rawTe, 'te')
    setParsedTe(result)
    if (result.length > 0) showSuccess(`Parsed ${result.length} Telugu sections`)
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

      if (editingTopic) {
        const updated = await updateTopic(editingTopic.id, payload, user)
        setTopics(prev => prev.map(t => t.id === updated.id ? updated : t))
        showSuccess('Topic updated!')
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
        showSuccess('Topic created!')
      }
      setError(null)
      closeModal()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed.')
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
    setTopicToDelete(topic)
  }

  const handleConfirmDelete = async () => {
    if (!topicToDelete) return
    try {
      await deleteTopic(topicToDelete.id, user)
      setTopics(prev => prev.filter(t => t.id !== topicToDelete.id))
      setTopicToDelete(null)
      showSuccess('Topic deleted.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
      setTopicToDelete(null)
    }
  }

  const handleTogglePublish = async (topic: StudyTopic) => {
    const newPublished = !topic.is_published
    const prevTopics = topics
    setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, is_published: newPublished } : t))
    try {
      await toggleTopicPublish(topic.id, newPublished, user)
    } catch (err: unknown) {
      setTopics(prevTopics)
      setError(err instanceof Error ? err.message : 'Failed to update.')
    }
  }

  const handleMove = async (idx: number, dir: 'up' | 'down') => {
    const arr = [...topics]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= arr.length) return
    ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
    const updated = arr.map((t, i) => ({ ...t, display_order: i + 1 }))
    setTopics(updated)
    try {
      await Promise.all(updated.map(t => updateTopic(t.id, { display_order: t.display_order }, user)))
    } catch {
      setError('Failed to save order.'); loadTopics()
    }
  }

  return {
    user, toasts, error, clearError: () => setError(null),
    topics, isLoading, isContextValid,
    selectedExam, selectedPaper, selectedSubject,
    setSelectedExam, setSelectedPaper, setSelectedSubject,
    isModalOpen, editingTopic, isSaving,
    previewTopic, setPreviewTopic,
    topicToDelete,
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
    handleDelete, handleConfirmDelete, cancelDelete: () => setTopicToDelete(null),
    handleTogglePublish, handleMove,
    loadTopics,
  }
}
