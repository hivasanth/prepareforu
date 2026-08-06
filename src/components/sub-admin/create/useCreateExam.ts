import { useState, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useBreakpoint } from '../../../hooks/useBreakpoint'
import { useToast } from '../../../hooks/useToast'
import { useStableFetch } from '../../../hooks/useStableFetch'
import { createTeacherExamAtomic } from '../../../services/teacherExamService'
import { EXAM_NO_QUESTIONS_MESSAGE } from '../../../validations/securitySchemas'
import { getLocalISOTime, getPromptText, getTypo as typoLookup, getDimension as dimLookup, type ExamConfig, type QuestionData } from './types'

export function useCreateExam() {
  const { user } = useAuth()
  const { breakpoint } = useBreakpoint()
  const { toasts, showSuccess } = useToast()
  const { mountedRef } = useStableFetch()
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [targetCount, setTargetCount] = useState<number>(30)
  const [customCount, setCustomCount] = useState('')
  const [promptPhase, setPromptPhase] = useState<'count' | 'copy' | 'launch'>('count')
  const [copied, setCopied] = useState(false)
  const [activeAICopy, setActiveAICopy] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [examConfig, setExamConfig] = useState<ExamConfig>({
    title: '',
    start_time: getLocalISOTime(),
    end_time: getLocalISOTime(),
    duration_minutes: 60,
    marks_per_question: 1,
    negative_mark_value: 0
  })

  const getTypo = useCallback((element: string) => typoLookup(breakpoint, element), [breakpoint])
  const getDimension = useCallback((element: string) => dimLookup(breakpoint, element), [breakpoint])

  const handleStepChange = useCallback((targetStep: number) => {
    if (isPublishing) return
    if (targetStep > 2 && questions.length === 0) {
      setError(EXAM_NO_QUESTIONS_MESSAGE)
      setStep(2)
      return
    }
    setError(null)
    setStep(targetStep)
  }, [isPublishing, questions.length])

  const handleCopyPrompt = useCallback(async () => {
    try {
      const finalCount = targetCount === 0 ? parseInt(customCount) || 10 : targetCount
      const prompt = getPromptText(finalCount)
      await navigator.clipboard.writeText(prompt)
      if (!mountedRef.current) return
      setCopied(true)
      setPromptPhase('launch')
      showSuccess('Prompt copied to clipboard!')
      setTimeout(() => { if (mountedRef.current) setCopied(false) }, 2000)
    } catch {
      setError('Failed to copy prompt')
    }
  }, [targetCount, customCount, mountedRef, showSuccess])

  const launchAI = useCallback(async (model: string) => {
    const finalCount = targetCount === 0 ? parseInt(customCount) || 10 : targetCount
    const prompt = getPromptText(finalCount)

    try {
      await navigator.clipboard.writeText(prompt)
      if (!mountedRef.current) return
      setActiveAICopy(model)
      setTimeout(() => { if (mountedRef.current) setActiveAICopy(null) }, 2000)
    } catch {
      setError('Clipboard copy failed')
      return
    }

    const urls: Record<string, string> = {
      chatgpt: 'https://chatgpt.com/',
      gemini: 'https://gemini.google.com/app',
      claude: 'https://claude.ai/',
      notebooklm: 'https://notebooklm.google.com/',
    }
    const url = urls[model] || 'https://google.com'
    window.open(url, '_blank', 'noopener,noreferrer')
    showSuccess(`${model} opened! Switch to Step 2 to paste your questions.`)

    setTimeout(() => {
      if (mountedRef.current) setStep(2)
    }, 500)
  }, [targetCount, customCount, mountedRef, showSuccess])

  const resetWizard = useCallback(() => {
    setStep(1)
    setPromptPhase('count')
    setTargetCount(30)
    setCustomCount('')
    setQuestions([])
    setExamConfig({
      title: '',
      start_time: getLocalISOTime(),
      end_time: getLocalISOTime(),
      duration_minutes: 60,
      marks_per_question: 1,
      negative_mark_value: 0
    })
    setIsPublished(false)
    setPublishError(null)
    setError(null)
  }, [])

  const handlePublish = useCallback(async () => {
    if (isPublishing) return
    setPublishError(null)

    if (!questions.length) {
      setPublishError(EXAM_NO_QUESTIONS_MESSAGE)
      return
    }

    if (!user?.id) {
      setPublishError('Authentication Protocol Missing: Please re-login.')
      return
    }

    setIsPublishing(true)
    try {
      await createTeacherExamAtomic({ user }, {
        title: examConfig.title,
        subAdminId: user.id,
        startTime: examConfig.start_time,
        endTime: examConfig.end_time,
        durationMinutes: examConfig.duration_minutes,
        marksPerQuestion: examConfig.marks_per_question,
        negativeMarkValue: examConfig.negative_mark_value,
        questions: questions
      })

      if (!mountedRef.current) return
      setIsPublished(true)
      showSuccess(`Exam "${examConfig.title}" published successfully!`)
    } catch (err: any) {
      if (!mountedRef.current) return
      const errMsg = err.message || 'Failed to publish exam. Please try again.'
      setPublishError(errMsg)
    } finally {
      if (mountedRef.current) setIsPublishing(false)
    }
  }, [isPublishing, questions, user, examConfig, mountedRef, showSuccess])

  const getSimpleInstruction = useCallback(() => {
    switch (step) {
      case 1: return "→ Configure how many questions you need and copy the generation prompt."
      case 2: return "→ Paste the JSON text you copied from the AI model into the box below."
      case 3: return "→ Review the generated questions, you can edit or delete them if needed."
      case 4: return "→ Configure your exam settings like title, duration, and scheduling."
      case 5: return "→ Review the final summary and click Publish to launch your exam."
      default: return "→ SubAdmin Create"
    }
  }, [step])

  return {
    step,
    setStep,
    error,
    isPublishing,
    publishError,
    targetCount,
    setTargetCount,
    customCount,
    setCustomCount,
    promptPhase,
    setPromptPhase,
    copied,
    activeAICopy,
    isPublished,
    questions,
    setQuestions,
    examConfig,
    setExamConfig,
    getTypo,
    getDimension,
    breakpoint,
    toasts,
    getSimpleInstruction,
    handleStepChange,
    handleCopyPrompt,
    launchAI,
    resetWizard,
    handlePublish,
  }
}
