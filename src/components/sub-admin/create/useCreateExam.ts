import { useState, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useBreakpoint } from '../../../hooks/useBreakpoint'
import { useStableFetch } from '../../../hooks/useStableFetch'
import { createTeacherExamAtomic } from '../../../services/teacherExamService'
import { EXAM_NO_QUESTIONS_MESSAGE, examConfigSchema } from '../../../validations/securitySchemas'
import { BulkQuestionSchema } from '../../../validations/questionSchema'
import { addMinutesLocalISO, getLocalISOTime, getPromptText, openExternalWindow, getTypo as typoLookup, getDimension as dimLookup, MAX_QUESTIONS, type ExamConfig, type ParseReport, type QuestionData } from './types'
import { copyText } from '../../../utils/clipboardUtils'

const DEFAULT_DURATION_MINUTES = 60
const DEFAULT_END_OFFSET_MINUTES = 30

export function useCreateExam() {
  const { user } = useAuth()
  const { breakpoint } = useBreakpoint()
  const { mountedRef } = useStableFetch()
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [targetCount, setTargetCount] = useState<number>(30)
  const [customCount, setCustomCount] = useState('')
  const [promptPhase, setPromptPhase] = useState<'count' | 'copy' | 'launch'>('count')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [activeAICopy, setActiveAICopy] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [parseReport, setParseReport] = useState<ParseReport | null>(null)
  const [endTimeManuallyOverridden, setEndTimeManuallyOverridden] = useState(false)
  const [examConfig, setExamConfig] = useState<ExamConfig>({
    title: '',
    start_time: getLocalISOTime(),
    end_time: addMinutesLocalISO(getLocalISOTime(), DEFAULT_END_OFFSET_MINUTES),
    duration_minutes: DEFAULT_DURATION_MINUTES,
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
    // L4: the Publish tab must not be entered with an invalid configuration —
    // bounce to Setup with a specific field so the user knows what to fix.
    // Publish itself still re-validates the final snapshot (authoritative gate).
    if (targetStep === 5) {
      const check = examConfigSchema.safeParse(examConfig)
      if (!check.success) {
        const issue = check.error.issues[0]
        const field = issue?.path?.[0] ? ` (${String(issue.path[0]).replace(/_/g, ' ')})` : ''
        setError(`Complete the exam setup first: ${issue?.message || 'invalid settings'}${field}`)
        setStep(4)
        return
      }
    }
    setError(null)
    setStep(targetStep)
  }, [isPublishing, questions.length, examConfig])

  const handleCopyPrompt = useCallback(async () => {
    setCopyError(null)
    setError(null)
    const finalCount = Math.min(targetCount === 0 ? parseInt(customCount) || 10 : targetCount, MAX_QUESTIONS)
    const prompt = getPromptText(finalCount)
    // LAN-ORIGIN FIX: "Prompt Copied!" only after the write actually succeeded.
    const ok = await copyText(prompt)
    if (!mountedRef.current) return
    if (!ok) {
      setCopied(false)
      setCopyError('Could not copy the prompt to your clipboard. Click “Copy Prompt” again to retry.')
      return
    }
    setCopied(true)
    setPromptPhase('launch')
    setTimeout(() => { if (mountedRef.current) setCopied(false) }, 2000)
  }, [targetCount, customCount, mountedRef])

  const launchAI = useCallback(async (model: string) => {
    const finalCount = Math.min(targetCount === 0 ? parseInt(customCount) || 10 : targetCount, MAX_QUESTIONS)
    const prompt = getPromptText(finalCount)

    setCopyError(null)
    setActiveAICopy(model)

    const urls: Record<string, string> = {
      chatgpt: 'https://chatgpt.com/',
      gemini: 'https://gemini.google.com/app',
      claude: 'https://claude.ai/',
      notebooklm: 'https://notebooklm.google.com/',
    }
    const url = urls[model] || 'https://google.com'

    // M1: open synchronously within the user gesture so the browser does not
    // classify it as a blocked popup; only report success and advance when it
    // actually opened. A blocked popup is a hard failure here (window.open
    // returns null) — never a fake success.
    if (!openExternalWindow(url)) {
      setActiveAICopy(null)
      setCopyError('Your browser blocked the AI chat window. Allow pop-ups for this site, or copy the prompt and open the AI yourself.')
      return
    }

    // Best-effort pre-copy of the prompt; a failure here is non-fatal — the
    // user can still copy manually — so it must not be reported as an open failure.
    await copyText(prompt)
    if (!mountedRef.current) return

    setTimeout(() => { if (mountedRef.current) setActiveAICopy(null) }, 2000)
    setSuccessMessage(`${model} opened! Switch to Step 2 to paste your questions.`)

    setTimeout(() => {
      if (mountedRef.current) setStep(2)
    }, 500)
  }, [targetCount, customCount, mountedRef])

  const resetWizard = useCallback(() => {
    setStep(1)
    setPromptPhase('count')
    setTargetCount(30)
    setCustomCount('')
    setQuestions([])
    setParseReport(null)
    setEndTimeManuallyOverridden(false)
    setExamConfig({
      title: '',
      start_time: getLocalISOTime(),
      end_time: addMinutesLocalISO(getLocalISOTime(), DEFAULT_END_OFFSET_MINUTES),
      duration_minutes: DEFAULT_DURATION_MINUTES,
      marks_per_question: 1,
      negative_mark_value: 0
    })
    setIsPublished(false)
    setPublishError(null)
    setError(null)
    setCopyError(null)
  }, [])

  // ── Scheduling helpers — end defaults to start + 30 min unless the user
  //    explicitly set it (manual override is preserved on start moves). ──────
  const handleStartTimeChange = useCallback((v: string) => {
    setExamConfig(prev => ({
      ...prev,
      start_time: v,
      end_time: endTimeManuallyOverridden ? prev.end_time : addMinutesLocalISO(v, DEFAULT_END_OFFSET_MINUTES)
    }))
  }, [endTimeManuallyOverridden])

  const handleEndTimeChange = useCallback((v: string) => {
    setEndTimeManuallyOverridden(true)
    setExamConfig(prev => ({ ...prev, end_time: v }))
  }, [])

  const handleResetEndToDefault = useCallback(() => {
    setEndTimeManuallyOverridden(false)
    setExamConfig(prev => ({ ...prev, end_time: addMinutesLocalISO(prev.start_time, DEFAULT_END_OFFSET_MINUTES) }))
  }, [])

  const handlePublish = useCallback(async () => {
    if (isPublishing) return
    setPublishError(null)

    if (!questions.length) {
      setPublishError(EXAM_NO_QUESTIONS_MESSAGE)
      return
    }

    // W2: last-line defense — questions can only enter through the capped
    // wizard paths (paste <= MAX_QUESTIONS, custom count <= MAX_QUESTIONS, add
    // blocked at MAX_QUESTIONS), but the final snapshot is re-checked before
    // the RPC call so client and server limits can never drift apart.
    if (questions.length > MAX_QUESTIONS) {
      const extra = questions.length - MAX_QUESTIONS
      setPublishError(`Exams are limited to ${MAX_QUESTIONS} questions. Remove ${extra} question${extra === 1 ? '' : 's'} on Review to continue.`)
      setStep(3)
      return
    }

    if (!user?.id) {
      setPublishError('Authentication Protocol Missing: Please re-login.')
      return
    }

    // ── Publish pre-checks: the Setup screen enforces these while typing, but
    //    questions can be appended/edited on Review, so re-validate the final
    //    snapshot here (server-authoritative validation still runs on write).
    const configCheck = examConfigSchema.safeParse(examConfig)
    if (!configCheck.success) {
      setPublishError(`Fix the configuration before publishing: ${configCheck.error.issues[0]?.message || 'invalid settings'}`)
      setStep(4)
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const questionCheck = BulkQuestionSchema.safeParse(q)
      if (!questionCheck.success) {
        setPublishError(`Question ${i + 1} is incomplete: ${questionCheck.error.issues[0]?.message || 'invalid data'}`)
        setStep(3)
        return
      }
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
    } catch (err: unknown) {
      if (!mountedRef.current) return
      const errMsg = err instanceof Error && err.message ? err.message : 'Failed to publish exam. Please try again.'
      setPublishError(errMsg)
    } finally {
      if (mountedRef.current) setIsPublishing(false)
    }
  }, [isPublishing, questions, user, examConfig, mountedRef])

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
    copyError,
    activeAICopy,
    isPublished,
    questions,
    setQuestions,
    parseReport,
    setParseReport,
    examConfig,
    setExamConfig,
    endTimeManuallyOverridden,
    handleStartTimeChange,
    handleEndTimeChange,
    handleResetEndToDefault,
    getTypo,
    getDimension,
    breakpoint,
    successMessage,
    clearSuccessMessage: () => setSuccessMessage(null),
    getSimpleInstruction,
    handleStepChange,
    handleCopyPrompt,
    launchAI,
    resetWizard,
    handlePublish,
  }
}
