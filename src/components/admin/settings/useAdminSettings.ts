import { useState, useEffect, useCallback, useRef } from 'react'
import { useAsyncOperation } from '../../../hooks/useAsyncOperation'
import { useAdminFilters } from '../../../hooks/useAdminFilters'
import { isAdmin } from '../../../utils/authUtils'
import { adminService } from '../../../services/adminService'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../hooks/useToast'
import { generateRequestId } from '../../../utils/logger'
import type { ExamConfig } from '../../../types/exam.types'
import { examParamsSchema, EXAM_SUBJECTS_SUM_MESSAGE } from '../../../validations/securitySchemas'
import type { ParamsFieldErrors } from './ExamParamsForm'

export function useAdminSettings() {
  const { user } = useAuth()
  const { selectedExam, selectedPaper, selectedSubject, setSelectedExam, setSelectedPaper, setSelectedSubject } = useAdminFilters()
  const { toasts, showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)

  const [config, setConfig] = useState<ExamConfig | null>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const { loading: isLoading, execute } = useAsyncOperation(true)
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tabsKey, setTabsKey] = useState(0)
  const [paramsFieldErrors, setParamsFieldErrors] = useState<ParamsFieldErrors>({})
  const [subjectsError, setSubjectsError] = useState<string | undefined>(undefined)
  const submittedRef = useRef(false)

  const fetchData = useCallback(async () => {
    try {
      await execute(async () => {
        const requestId = generateRequestId('fetch_admin_settings')
        if (selectedExam === 'all' || selectedExam === 'APPSC_GROUPS') return

        const targetExamId = selectedExam
        const paperData = await adminService.fetchExamPapers({ user, requestId }, targetExamId)

        let currentPaperId = selectedPaper
        if (paperData?.length > 0 && (currentPaperId === 'all' || !paperData.find(p => p.id === currentPaperId))) {
          currentPaperId = paperData[0].id
        }

        const configData = await adminService.fetchExamConfig({ user, requestId }, targetExamId)
        if (currentPaperId !== 'all') {
          const paper = paperData?.find(p => p.id === currentPaperId)
          if (paper && configData) {
            setConfig({
              ...configData,
              total_questions: paper.total_questions,
              total_marks: paper.total_marks,
              duration_minutes: paper.duration_minutes,
              negative_marking: paper.negative_marking,
              negative_mark_value: Number(paper.negative_mark_value)
            })
          } else {
            setConfig(configData)
          }
        } else {
          setConfig(configData)
        }

        const subjectData = await adminService.fetchExamSubjects({ user, requestId }, targetExamId, currentPaperId === 'all' ? null : currentPaperId)
        setSubjects(subjectData || [])
        setParamsFieldErrors({})
        setSubjectsError(undefined)
        submittedRef.current = false
      })
    } catch {
      setError('Failed to load settings data')
    }
  }, [selectedExam, selectedPaper, user, execute])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (selectedSubject !== 'all' && !isLoading) {
      const el = document.getElementById(`subject-${selectedSubject}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedSubject, isLoading])

  const handleSave = useCallback(async (key: string, fn: () => Promise<void | false>) => {
    if (!isAdmin(user)) return setError('Unauthorized')
    setError(null)
    setIsSaving(p => ({ ...p, [key]: true }))
    try {
      const ok = await fn()
      if (ok === false) return
      showSuccess('Settings updated successfully')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setIsSaving(p => ({ ...p, [key]: false }))
    }
  }, [user, showSuccess])

  const validateParams = useCallback((cfg: ExamConfig) => {
    const result = examParamsSchema.safeParse({
      total_questions: cfg.total_questions,
      total_marks: cfg.total_marks,
      duration_minutes: cfg.duration_minutes,
      negative_marking: cfg.negative_marking,
      negative_mark_value: cfg.negative_mark_value,
    })
    const fieldErrors: ParamsFieldErrors = {}
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof ParamsFieldErrors | undefined
        if (field) fieldErrors[field] = issue.message
      })
    }
    return { ok: result.success, fieldErrors }
  }, [])

  const saveConfig = useCallback(async (): Promise<void | false> => {
    if (!config) return false
    submittedRef.current = true

    const { ok, fieldErrors } = validateParams(config)
    setParamsFieldErrors(fieldErrors)
    if (!ok) return false

    const requestId = generateRequestId('save_config')
    const currentPaperId = selectedPaper
    const paperFields = {
      total_questions: config.total_questions,
      total_marks: config.total_marks,
      duration_minutes: config.duration_minutes,
      negative_marking: config.negative_marking,
      negative_mark_value: config.negative_mark_value,
    }
    if (currentPaperId !== 'all') {
      await adminService.updateExamPaper({ user, requestId }, currentPaperId, paperFields)
    } else {
      await adminService.updateExamConfig({ user, requestId }, selectedExam, {
        ...paperFields,
        is_published: config.is_published,
        allow_multiple_attempts: config.allow_multiple_attempts,
      })
      await adminService.syncExamPapersFromConfig({ user, requestId }, selectedExam, paperFields)
    }
  }, [config, selectedPaper, selectedExam, user, validateParams])

  const saveSubjects = useCallback(async (): Promise<void | false> => {
    if (!config) return false
    submittedRef.current = true

    const totalQ = subjects.reduce((sum, s) => sum + (Number(s.question_count) || 0), 0)
    if (totalQ !== Number(config.total_questions)) {
      setSubjectsError(EXAM_SUBJECTS_SUM_MESSAGE)
      return false
    }
    setSubjectsError(undefined)
    await adminService.updateExamSubjects({ user, requestId: generateRequestId('save_subjects') }, subjects)
  }, [subjects, config, user])

  const handleParamsBlur = useCallback((field: keyof ParamsFieldErrors) => {
    if (!submittedRef.current || !config) return
    const { fieldErrors } = validateParams(config)
    setParamsFieldErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
  }, [config, validateParams])

  const handleSubjectBlur = useCallback(() => {
    if (!submittedRef.current || !config) return
    const totalQ = subjects.reduce((sum, s) => sum + (Number(s.question_count) || 0), 0)
    setSubjectsError(totalQ !== Number(config.total_questions) ? EXAM_SUBJECTS_SUM_MESSAGE : undefined)
  }, [subjects, config])

  return {
    user, toasts, error, clearError: () => setError(null), selectedExam, selectedPaper, selectedSubject,
    setSelectedExam, setSelectedPaper, setSelectedSubject,
    config, setConfig, subjects, setSubjects,
    isLoading, isSaving, isModalOpen, setIsModalOpen,
    tabsKey, setTabsKey,
    fetchData,
    paramsFieldErrors, subjectsError,
    handleSave, saveConfig, saveSubjects, handleParamsBlur, handleSubjectBlur,
  }
}
