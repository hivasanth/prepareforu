import { useState, useCallback } from 'react'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { useToast } from '../../../hooks/useToast'
import { adminQuestionService } from '../../../services/adminQuestionService'

export function useAdminUpload(
  selectedExam: string,
  selectedPaper: string,
  selectedSubject: string
) {
  const { toasts, showToast } = useToast()
  const [uploadType, setUploadType] = useState<'single' | 'bulk' | null>(null)
  const [activeModal, setActiveModal] = useState<'single' | 'bulk' | null>(null)
  const [labels, setLabels] = useState({ exam: '', paper: '' })

  const isContextValid =
    selectedExam !== 'all' &&
    selectedExam !== 'APPSC_GROUPS' &&
    selectedPaper !== 'all' &&
    selectedSubject !== 'all'

  const { data: questionCount, refetch: refetchCount } = useSupabaseQuery<number>(async () => {
    if (!isContextValid) return { data: 0, error: null }
    try {
      const count = await adminQuestionService.countQuestions({
        examId: selectedExam,
        paperId: selectedPaper,
        subjectName: selectedSubject,
      })
      return { data: count, error: null }
    } catch (error: any) {
      return { data: 0, error: error.message || 'Failed to count questions.' }
    }
  }, [selectedExam, selectedPaper, selectedSubject, isContextValid])

  const handleMethodSelect = useCallback((type: 'single' | 'bulk') => {
    setUploadType(type)
  }, [])

  const handleBack = useCallback(() => {
    setUploadType(null)
  }, [])

  const handleLaunch = useCallback(() => {
    if (uploadType) setActiveModal(uploadType)
  }, [uploadType])

  const handleModalClose = useCallback(() => {
    setActiveModal(null)
  }, [])

  const handleSuccess = useCallback(() => {
    setActiveModal(null)
    showToast(
      uploadType === 'single'
        ? 'Question added successfully!'
        : 'Bulk upload completed successfully!',
      'success'
    )
    refetchCount()
  }, [uploadType, showToast, refetchCount])

  return {
    toasts,
    showToast,
    uploadType,
    activeModal,
    labels,
    isContextValid,
    questionCount,
    handleMethodSelect,
    handleBack,
    handleLaunch,
    handleModalClose,
    handleSuccess,
    setUploadType,
    setActiveModal,
    setLabels,
  }
}
