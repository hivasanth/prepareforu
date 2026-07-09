import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GuardLoader } from '../../guards/Guards'
import { isSubAdmin } from '../../utils/authUtils'
import { 
  FileText, 
  Copy, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Trash2,
  Edit3,
  Settings2,
  Rocket,
  Plus,
  BookOpen,
  Clock,
  BarChart3,
  CalendarDays,
  ExternalLink,
  ShieldCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useToast } from '../../hooks/useToast'
import { DiagramRenderer } from '../../components/common/DiagramRenderer'
import {
  PageContainer,
  Tabs, 
  Badge, 
  SectionReveal,
  Stack,
  Card,
  Button,
  IconBadge,
} from '../../components/common/AntigravityUI'
import { createTeacherExamAtomic } from '../../services/teacherExamService'

// ─── Types ──────────────────────────────────────────────────────────────────
type DiagramData = 
  | { type: "pie_chart"; metadata: { labels: string[]; values: number[] } }
  | { type: "bar_chart"; metadata: { x: string[]; y: number[] } }
  | { type: "line_graph"; metadata: { x: string[]; y: number[] } }
  | { type: "table"; metadata: { columns: string[]; rows: any[][] } }
  | { type: "venn_diagram"; metadata: { sets: string[]; intersections: Record<string, any[]> } }
  | null;

interface QuestionData {
  question_text_en?: string
  question_text_te?: string
  option_a_en?: string
  option_a_te?: string
  option_b_en?: string
  option_b_te?: string
  option_c_en?: string
  option_c_te?: string
  option_d_en?: string
  option_d_te?: string
  explanation_en?: string
  explanation_te?: string
  correct_option: 'A' | 'B' | 'C' | 'D'
  display_order: number
  diagram?: DiagramData
}

interface ExamConfig {
  title: string
  start_time: string
  end_time: string
  duration_minutes: number
  marks_per_question: number
  negative_mark_value: number
}

// ─── Step Metadata ───────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: 'Prompt' },
  { n: 2, label: 'Paste JSON' },
  { n: 3, label: 'Review' },
  { n: 4, label: 'Setup' },
  { n: 5, label: 'Publish' }
]
// ─── Compact 12-Hour Date Time Picker ───────────────────────────────────────
function CompactDateTimePicker({ value, onChange, minStr, getTypo }: { value: string, onChange: (v: string) => void, minStr: string, getTypo: (k: string) => string }) {
  const parts = value ? value.split('T') : ['', '00:00']
  const dateVal = parts[0] || minStr.split('T')[0]
  const [hStr, mStr] = (parts[1] || '00:00').split(':')
  const h24 = parseInt(hStr || '0', 10)
  
  const initialAmPm = h24 >= 12 ? 'PM' : 'AM'
  let initialH12 = h24 % 12
  if (initialH12 === 0) initialH12 = 12

  const [hour, setHour] = useState(String(initialH12).padStart(2, '0'))
  const [minute, setMinute] = useState((mStr || '00').padStart(2, '0'))
  const [period, setPeriod] = useState(initialAmPm)
  
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
     if (!value) return
     const t = value.split('T')[1] || '00:00'
     const [extH, extM] = t.split(':')
     const extH24 = parseInt(extH || '0', 10)
     const extP = extH24 >= 12 ? 'PM' : 'AM'
     let extH12 = extH24 % 12
     if (extH12 === 0) extH12 = 12
     
     if (parseInt(hour, 10) !== extH12 || parseInt(minute,10) !== parseInt(extM||'0', 10) || period !== extP) {
       setHour(String(extH12).padStart(2, '0'))
       setMinute((extM || '00').padStart(2, '0'))
       setPeriod(extP)
     }
  }, [value])

  const applyTime = (h: string, m: string, p: string, date: string) => {
    let hh = parseInt(h, 10)
    let mm = parseInt(m, 10)
    
    if (isNaN(hh) || hh < 1) hh = 1
    if (hh > 12) hh = 12
    if (isNaN(mm) || mm < 0) mm = 0
    if (mm > 59) mm = 59
    if (!p) p = 'AM'

    let h24Val = hh
    if (p === 'PM' && hh !== 12) h24Val += 12
    if (p === 'AM' && hh === 12) h24Val = 0

    const finalTime = `${h24Val.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
    onChange(`${date}T${finalTime}`)
  }

  const handleHourBlur = () => {
    let hh = parseInt(hour, 10)
    if (isNaN(hh) || hh < 1 || hh > 12) {
      setError('Invalid hour')
      return;
    }
    setError(null)
    const fmt = String(hh).padStart(2, '0')
    setHour(fmt)
    applyTime(fmt, minute, period, dateVal)
  }

  const handleMinuteBlur = () => {
    let mm = parseInt(minute, 10)
    if (isNaN(mm) || mm < 0 || mm > 59) {
      setError('Invalid minute')
      return;
    }
    setError(null)
    const fmt = String(mm).padStart(2, '0')
    setMinute(fmt)
    applyTime(hour, fmt, period, dateVal)
  }

  const handleHourChange = (e: ChangeEvent<HTMLInputElement>) => {
    setHour(e.target.value.replace(/\D/g, '').slice(0, 2))
    setError(null)
  }

  const handleMinuteChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMinute(e.target.value.replace(/\D/g, '').slice(0, 2))
    setError(null)
  }

  const handlePeriodChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPeriod(e.target.value)
    applyTime(hour, minute, e.target.value, dateVal)
  }

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    applyTime(hour, minute, period, e.target.value || minStr.split('T')[0])
  }

  const inputClasses = `
    w-[40px] h-[32px] text-[12px]
    sm:w-[45px] sm:h-[34px] sm:text-[13px]
    md:w-[50px] md:h-[36px] md:text-[14px]
    lg:w-[55px] lg:h-[38px] lg:text-[15px]
    bg-card-bg border border-border-subtle/30 rounded-lg text-center font-bold text-text-primary 
    focus:outline-none focus:border-primary/50 hover:border-primary/40 transition-colors shadow-sm
  `
  
  const containerSize = "w-full sm:w-auto min-w-max"

  return (
    <div className="w-full flex flex-col md:flex-row md:items-center gap-4 lg:gap-5 mt-1">
      {/* Date */}
      <div className="flex-1 flex items-center gap-3 bg-hover-bg/60 border-2 border-border-subtle/20 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 px-4 py-3 sm:py-3.5 rounded-xl transition-all shadow-sm">
        <CalendarDays size={18} className="text-primary/70 shrink-0" />
        <input 
          type="date"
          min={minStr.split('T')[0]}
          value={dateVal}
          onChange={handleDateChange}
          className="bg-transparent border-none outline-none font-bold text-text-primary focus:ring-0 w-full p-0 cursor-pointer tracking-wide"
          style={{ fontSize: getTypo('body') }}
        />
      </div>
      
      {/* Time Group */}
      <div className={`relative ${containerSize} shrink-0 bg-hover-bg/60 border-2 border-border-subtle/20 px-3.5 py-2.5 sm:py-3 rounded-xl transition-all flex items-center shadow-sm`}>
        <div className="flex items-center justify-between sm:justify-start gap-[6px] sm:gap-[8px] w-full">
          <div className="flex items-center gap-[6px] sm:gap-[8px]">
            <Clock size={16} className="text-primary/70 shrink-0 hidden sm:block delay-150" />
            <input 
              type="text" 
              inputMode="numeric"
              value={hour}
              onChange={handleHourChange}
              onBlur={handleHourBlur}
              placeholder="HH"
              className={inputClasses}
            />
            <span className="font-bold text-text-secondary opacity-50 px-0.5">:</span>
            <input 
              type="text" 
              inputMode="numeric"
              value={minute}
              onChange={handleMinuteChange}
              onBlur={handleMinuteBlur}
              placeholder="MM"
              className={inputClasses}
            />
          </div>
          <select 
            value={period}
            onChange={handlePeriodChange}
            className={`${inputClasses} bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 cursor-pointer appearance-none px-0 ml-auto sm:ml-0`}
          >
            <option className="bg-card-bg text-text-primary" value="AM">AM</option>
            <option className="bg-card-bg text-text-primary" value="PM">PM</option>
          </select>
        </div>
        {error && (
          <div className="absolute top-full mt-1.5 left-0 text-red-500 font-bold text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px]">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function SubAdminCreate() {
  const { user, loading: authLoading } = useAuth()
  if (authLoading) return <GuardLoader />
  if (!isSubAdmin(user)) return <Navigate to="/unauthorized" replace />
  const { breakpoint } = useBreakpoint()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  // ── Step State
  const [step, setStep] = useState(1)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  // ── Form Data
  const [targetCount, setTargetCount] = useState<number>(30)
  const [customCount, setCustomCount] = useState('')
  const [promptPhase, setPromptPhase] = useState<'count' | 'copy' | 'launch'>('count')

  const [rawJson, setRawJson] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeAICopy, setActiveAICopy] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const getLocalISOTime = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  const [examConfig, setExamConfig] = useState<ExamConfig>({
    title: '',
    start_time: getLocalISOTime(),
    end_time: getLocalISOTime(),
    duration_minutes: 60,
    marks_per_question: 1,
    negative_mark_value: 0
  })

  // ── Validation Errors
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [configErrors, setConfigErrors] = useState<string[]>([])

  // ── Responsive Scales
  const getTypo = (element: string) => {
    const scales: Record<string, any> = {
      title:     { xs: 18, sm: 20, md: 22, lg: 24, xl: 26 },
      stepLabel: { xs: 10, sm: 11, md: 12, lg: 12, xl: 13 },
      body:      { xs: 12, sm: 13, md: 14, lg: 15, xl: 15 },
      json:      { xs: 11, sm: 13, md: 14, lg: 14, xl: 14 },
      cardQ:     { xs: 12, sm: 14, md: 15, lg: 16, xl: 16 },
      cardOpt:   { xs: 11, sm: 13, md: 14, lg: 15, xl: 15 },
      cardExpl:  { xs: 10, sm: 12, md: 13, lg: 14, xl: 14 }
    }
    return `${scales[element][breakpoint] || scales[element].xs}px`
  }

  const getDimension = (element: string) => {
    const scales: Record<string, any> = {
      buttonH:  { xs: 36, sm: 38, md: 40, lg: 42, xl: 42 },
      jsonH:    { xs: 200, sm: 250, md: 280, lg: 300, xl: 300 },
      cardPadding: { xs: 10, sm: 12, md: 14, lg: 16, xl: 16 }
    }
    return scales[element][breakpoint] || scales[element].xs
  }

  // ── HELPERS
  const validateConfig = () => {
    const errs = []
    
    // Title Validation
    const cleanTitle = examConfig.title.trim()
    if (!cleanTitle) {
      errs.push('Exam Title: Required field cannot be empty.')
    } else if (cleanTitle.length < 5) {
      errs.push('Exam Title: Must be at least 5 characters long for clarity.')
    } else if (cleanTitle.length > 120) {
      errs.push('Exam Title: Too long (limit 120 chars).')
    }

    // Schedule Validation
    if (!examConfig.start_time) {
      errs.push('Start Time: Missing date/time parameter.')
    }
    if (!examConfig.end_time) {
      errs.push('End Time: Missing date/time parameter.')
    }
    
    if (examConfig.start_time && examConfig.end_time) {
      const start = new Date(examConfig.start_time).getTime()
      const end = new Date(examConfig.end_time).getTime()
      const now = Date.now()

      // Allow 5 min buffer for clock drift/form filling time
      if (start < now - 5 * 60000) {
        errs.push('Schedule Conflict: Start time cannot be in the past.')
      }
      
      if (end <= start) {
        errs.push('Schedule Conflict: End time must be strictly after the start time.')
      } else {
        const windowMinutes = (end - start) / 60000
        
        if (examConfig.duration_minutes > windowMinutes) {
          errs.push(`Logic Failure: Exam duration (${examConfig.duration_minutes}m) exceeds the available window (${Math.floor(windowMinutes)}m).`)
        }

        if (windowMinutes > 24 * 60 * 30) {
          errs.push('Security Limit: Exam window cannot exceed 30 days.')
        }
      }
    }
    
    // Duration Validation
    if (examConfig.duration_minutes <= 0) {
      errs.push('Duration Logic: Value must be a positive integer.')
    } else if (examConfig.duration_minutes > 1440) {
      errs.push('Duration Limit: Maximum allowed is 24 hours (1440m).')
    }
    
    // Scoring Validation
    if (examConfig.marks_per_question <= 0) {
      errs.push('Scoring Logic: Marks per question must be positive.')
    } else if (examConfig.marks_per_question > 100) {
      errs.push('Scoring Limit: Marks per question cannot exceed 100.')
    }
    
    if (examConfig.negative_mark_value < 0) {
      errs.push('Negative Marking: Cannot be a negative value (it is a penalty amount).')
    } else if (examConfig.negative_mark_value > examConfig.marks_per_question) {
      errs.push('Negative Marking: Penalty cannot exceed the base marks awarded.')
    }
    
    setConfigErrors(errs)
    return errs.length === 0
  }

  const handleStepChange = (targetStep: number) => {
    if (isPublishing) return

    // Guard Logic
    if (targetStep > 2 && questions.length === 0) {
      showError('Please paste and parse your JSON questions in Step 2 first.')
      setStep(2)
      return
    }

    if (targetStep === 5 && !validateConfig()) {
      showError('Please resolve the configuration errors in Step 4.')
      setStep(4)
      return
    }

    setStep(targetStep)
  }

  const nextStep = () => handleStepChange(Math.min(step + 1, 5))
  const prevStep = () => handleStepChange(Math.max(step - 1, 1))

  const getPromptText = (count: number) => {
    return `You are a strict JSON generator for a production exam system. Your task is to generate high-quality bilingual (English + Telugu) multiple-choice questions for competitive exams like APPSC and UPSC. Generate EXACTLY ${count} questions.
      
Each question must follow this JSON schema:
{
"question_text_en": "string",
"question_text_te": "string",
"option_a_en": "string",
"option_a_te": "string",
"option_b_en": "string",
"option_b_te": "string",
"option_c_en": "string",
"option_c_te": "string",
"option_d_en": "string",
"option_d_te": "string",
"correct_option": "A",
"explanation_en": "string",
"explanation_te": "string"
}

Return ONLY the JSON array. Do not include markdown blocks or any other text.`
  }

  const handleCopyPrompt = async () => {
    try {
      const finalCount = targetCount === 0 ? parseInt(customCount) || 10 : targetCount
      const prompt = getPromptText(finalCount)
      await navigator.clipboard.writeText(prompt)
      if (!mountedRef.current) return
      setCopied(true)
      setPromptPhase('launch')
      showSuccess('Prompt copied to clipboard!')
      setTimeout(() => { if (mountedRef.current) setCopied(false) }, 2000)
    } catch (err) {
      showError('Failed to copy prompt')
    }
  }

  const launchAI = async (model: string) => {
    const finalCount = targetCount === 0 ? parseInt(customCount) || 10 : targetCount
    const prompt = getPromptText(finalCount)
    
    try {
      await navigator.clipboard.writeText(prompt)
      if (!mountedRef.current) return
      setActiveAICopy(model)
      setTimeout(() => { if (mountedRef.current) setActiveAICopy(null) }, 2000)
    } catch {
      showError('Clipboard copy failed')
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
  }

  const resetWizard = () => {
    setStep(1)
    setPromptPhase('count')
    setTargetCount(30)
    setCustomCount('')
    setRawJson('')
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
  }

  const safeParse = (str: string) => {
    const trimmed = str.trim()
    try {
      return JSON.parse(trimmed)
    } catch (e) {
      // Attempt to extract JSON array from text if direct parse fails
      // This handles cases where AI adds conversational text around the JSON block
      const jsonRegex = /\[\s*\{[\s\S]*\}\s*\]/
      const match = trimmed.match(jsonRegex)
      
      if (match) {
        try {
          return JSON.parse(match[0])
        } catch (e2) {
          // Fallback to cleaning markdown blocks
          const cleaned = trimmed.replace(/```json/gi, '').replace(/```/g, '').trim()
          try {
            return JSON.parse(cleaned)
          } catch (e3) {
            throw new Error('JSON structure is corrupted. Please ensure the AI output follows the requested format exactly.')
          }
        }
      }
      
      throw new Error('No valid JSON array found. Make sure you copied the entire code block from the AI.')
    }
  }

  const handlePasteJson = () => {
    setJsonError(null)
    const content = rawJson.trim()
    
    if (!content) {
      setJsonError('The input field is empty. Please paste your JSON output.')
      return
    }

    // Security: Prevent extremely large inputs that might crash the browser
    if (content.length > 500000) { 
      setJsonError('Input size exceeds safety limits. Please process questions in smaller batches.')
      return
    }

    try {
      const parsed = safeParse(content)
      if (!Array.isArray(parsed)) throw new Error('Root must be a JSON array.')
      if (parsed.length === 0) throw new Error('The JSON array is empty.')
      if (parsed.length > 200) throw new Error('Batch size limited to 200 questions for stability.')

      const validated: QuestionData[] = parsed.map((q: any, idx: number) => {
        // Strict Validation
        if (!q.question_text_en || !q.option_a_en || !q.correct_option) {
          throw new Error(`Question ${idx + 1} is missing essential data (Question text, Option A, or Correct Option).`)
        }
        
        const validOptions = ['A', 'B', 'C', 'D']
        if (!validOptions.includes(String(q.correct_option).toUpperCase())) {
          throw new Error(`Question ${idx + 1} has an invalid correct option: "${q.correct_option}". Use A, B, C, or D.`)
        }

        // Sanitization
        return {
          question_text_en: String(q.question_text_en).trim().slice(0, 2000),
          question_text_te: q.question_text_te ? String(q.question_text_te).trim().slice(0, 2000) : undefined,
          option_a_en: String(q.option_a_en).trim().slice(0, 1000),
          option_a_te: q.option_a_te ? String(q.option_a_te).trim().slice(0, 1000) : undefined,
          option_b_en: String(q.option_b_en).trim().slice(0, 1000),
          option_b_te: q.option_b_te ? String(q.option_b_te).trim().slice(0, 1000) : undefined,
          option_c_en: String(q.option_c_en).trim().slice(0, 1000),
          option_c_te: q.option_c_te ? String(q.option_c_te).trim().slice(0, 1000) : undefined,
          option_d_en: String(q.option_d_en).trim().slice(0, 1000),
          option_d_te: q.option_d_te ? String(q.option_d_te).trim().slice(0, 1000) : undefined,
          explanation_en: q.explanation_en ? String(q.explanation_en).trim().slice(0, 3000) : undefined,
          explanation_te: q.explanation_te ? String(q.explanation_te).trim().slice(0, 3000) : undefined,
          correct_option: String(q.correct_option).toUpperCase() as 'A' | 'B' | 'C' | 'D',
          display_order: idx + 1,
          diagram: null
        }
      })

      setQuestions(validated)
      setStep(3)
      showSuccess(`${validated.length} questions parsed and validated successfully.`)
    } catch (err: any) {
      setJsonError(err.message)
      showError('Parsing failed. Review the error message below.')
    }
  }

  // ── STEP 4 Logic: Editing
  const deleteQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, display_order: i + 1 })))
  }

  const updateQuestion = (idx: number, updates: Partial<QuestionData>) => {
    setQuestions(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], ...updates }
      return next
    })
  }


  // ── STEP 5 Logic: Publish
  const handlePublish = async () => {
    if (isPublishing) return
    setPublishError(null)

    if (!validateConfig()) {
      showError('Validation Failure: Check your exam configurations in Step 4.')
      return
    }

    if (!questions.length) {
      const msg = 'No questions available. Please go back and add questions.'
      setPublishError(msg)
      showError(msg)
      return
    }

    if (!user?.id) {
      showError('Authentication Protocol Missing: Please re-login.')
      return
    }

    setIsPublishing(true)
    try {
      await createTeacherExamAtomic({
        title: examConfig.title,
        subAdminId: user.id,
        startTime: examConfig.start_time,
        endTime: examConfig.end_time,
        durationMinutes: examConfig.duration_minutes,
        marksPerQuestion: examConfig.marks_per_question,
        negativeMarkValue: examConfig.negative_mark_value,
        questions: questions
      })

      setIsPublished(true)
      showSuccess(`Exam "${examConfig.title}" published successfully!`)
    } catch (err: any) {
      const errMsg = err.message || 'Failed to publish exam. Please try again.'
      setPublishError(errMsg)
      showError(errMsg)
    } finally {
      setIsPublishing(false)
    }
  }

  const getSimpleInstruction = () => {
    switch(step) {
      case 1: return "→ Configure how many questions you need and copy the generation prompt."
      case 2: return "→ Paste the JSON text you copied from the AI model into the box below."
      case 3: return "→ Review the generated questions, you can edit or delete them if needed."
      case 4: return "→ Configure your exam settings like title, duration, and scheduling."
      case 5: return "→ Review the final summary and click Publish to launch your exam."
      default: return "→ SubAdmin Create"
    }
  }


  // ── RENDER
  return (
    <PageContainer>
      <Stack gap="lg" className="overflow-x-hidden">

      {/* ── SUCCESS STATE ── */}
      {isPublished ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-8"
        >
          {/* Glow orb */}
          <div className="relative">
            <div className="absolute inset-0 blur-[60px] rounded-full scale-[2] animate-pulse pointer-events-none bg-primary/20" />
            <div className="relative w-36 h-36 rounded-full border-2 flex items-center justify-center shadow-2xl backdrop-blur-sm bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
              <Rocket size={64} className="text-primary drop-shadow-lg" style={{ animation: 'bounce 2s infinite' }} />
            </div>
            {/* Ring decorations */}
            <div className="absolute inset-[-12px] rounded-full border border-primary/10 animate-ping duration-[3s]" />
            <div className="absolute inset-[-24px] rounded-full border border-primary/5" />
          </div>

          <div className="space-y-3 max-w-md">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-2">
              <Check size={12} />
              Published Successfully
            </div>
            <h1 className="text-4xl font-black text-text-primary tracking-tighter">Mission Accomplished</h1>
            <p className="text-text-secondary font-medium leading-relaxed text-sm">
              Your exam <span className="text-primary font-black">"{examConfig.title}"</span> is now live and accessible to your students.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-2">
            <button
              onClick={() => navigate('/sub-admin/my-exams')}
              className="flex-1 font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 bg-primary text-white shadow-md"
            >
              <BookOpen size={15} /> View My Exams
            </button>
            <button
              onClick={resetWizard}
              className="flex-1 bg-card-bg border-2 border-border-subtle text-text-primary font-black uppercase tracking-widest text-xs py-4 rounded-2xl hover:bg-hover-bg hover:border-primary/30 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={15} /> Create Another
            </button>
          </div>
        </motion.div>
      ) : (
        <>
        <Stack gap="xl">
          <SectionReveal>
            <Stack gap="md" className="pb-4 border-b border-border-subtle/30">
              <div className="w-full">
                <Tabs
                  options={STEPS.map(s => ({ id: s.n.toString(), label: `${s.n}. ${s.label}` }))}
                  activeId={step.toString()}
                  onChange={(id) => handleStepChange(parseInt(id))}
                />
              </div>
              <div className="flex-1">
                <p className="!text-sm sm:!text-base font-bold tracking-wide text-text-primary opacity-90 transition-all duration-300">
                  {getSimpleInstruction()}
                </p>
              </div>
            </Stack>
          </SectionReveal>

          <AnimatePresence mode="wait">

            {/* ── STEP 1: PROMPT GENERATION ── */}
            {step === 1 && (
              <SectionReveal key="s1">
                <Stack gap="xl">
                  <Card padding={24}>
                    <Stack gap="lg">
                      {/* Part 1: Question Count */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block opacity-60">
                          1. Select Question Count
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {[10, 30, 50, 100].map(c => (
                            <button
                              key={c}
                              onClick={() => {
                                setTargetCount(c)
                                setPromptPhase('copy')
                              }}
                              className={`px-6 py-3 rounded-xl font-black transition-all ${
                                targetCount === c && promptPhase !== 'count'
                                  ? 'bg-primary text-white shadow-lg'
                                  : 'bg-hover-bg/50 text-text-secondary border-2 border-border-subtle/10'
                              }`}
                              style={{ fontSize: getTypo('stepLabel') }}
                            >
                              {c} MCQs
                            </button>
                          ))}
                          <div className="relative flex-1 min-w-[120px]">
                            <input
                              type="number"
                              placeholder="Custom"
                              value={customCount}
                              onChange={e => {
                                setCustomCount(e.target.value)
                                setTargetCount(0)
                                if (e.target.value) setPromptPhase('copy')
                              }}
                              className={`w-full bg-hover-bg/50 border-2 rounded-xl px-4 py-3 text-xs font-black transition-all outline-none ${
                                targetCount === 0 && promptPhase !== 'count' ? 'border-primary ring-2 ring-primary/10' : 'border-border-subtle/10 focus:border-primary/30'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Part 2: Copy Prompt (Only visible after count is selected) */}
                      {promptPhase !== 'count' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }}
                          className="pt-6 border-t border-border-subtle/10 space-y-4"
                        >
                          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block opacity-60">
                            2. Copy Generation Prompt
                          </label>
                          <Button
                            onClick={handleCopyPrompt}
                            className={`w-full h-14 shadow-lg transition-all ${copied ? 'bg-green-500 shadow-green-500/20' : 'shadow-primary/20'}`}
                          >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? 'Prompt Copied!' : 'Copy Prompt to Clipboard'}
                          </Button>
                        </motion.div>
                      )}

                      {/* Part 3: AI Model Selection (Only visible after copy) */}
                      {promptPhase === 'launch' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }}
                          className="pt-6 border-t border-border-subtle/10 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block opacity-60">
                              3. Launch AI Model & Paste
                            </label>
                            <span className="text-[9px] font-bold text-primary animate-pulse">
                              Click to open & switch to Paste JSON tab
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { id: 'chatgpt', label: 'ChatGPT', color: 'hover:bg-primary/10 hover:text-primary' },
                              { id: 'claude',  label: 'Claude',  color: 'hover:bg-primary/10 hover:text-primary' },
                              { id: 'gemini',  label: 'Gemini',  color: 'hover:bg-primary/10 hover:text-primary' },
                              { id: 'notebooklm', label: 'NotebookLM', color: 'hover:bg-primary/10 hover:text-primary' }
                            ].map(ai => (
                              <button
                                key={ai.id}
                                onClick={() => launchAI(ai.id)}
                                className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-border-subtle/20 bg-hover-bg/30 transition-all font-black uppercase tracking-tighter text-[10px] ${ai.color}`}
                              >
                                {activeAICopy === ai.id ? (
                                  <Check size={16} className="text-primary" />
                                ) : (
                                  <ExternalLink size={16} />
                                )}
                                {activeAICopy === ai.id ? 'Copied!' : ai.label}
                                {ai.id === 'chatgpt' && (
                                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </Stack>
                  </Card>
                </Stack>
              </SectionReveal>
            )}

            {/* ── STEP 2: PASTE JSON ── */}
            {step === 2 && (
              <SectionReveal key="s2">
                <Stack gap="xl">
                  <Card padding={24}>
                    <Stack gap="lg">
                      <textarea
                        value={rawJson}
                        onChange={e => { setRawJson(e.target.value); setJsonError(null); }}
                        placeholder="Paste the JSON output here..."
                        className="w-full bg-card-bg border-2 border-border-subtle/20 rounded-2xl p-4 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-y shadow-sm"
                        style={{ height: getDimension('jsonH') }}
                      />
                      {jsonError && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3"
                        >
                          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                          <span className="text-xs font-bold text-red-500 leading-tight">{jsonError}</span>
                        </motion.div>
                      )}
                    </Stack>
                  </Card>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="secondary"
                      onClick={prevStep}
                    >
                      <ChevronLeft size={16} /> Back
                    </Button>
                    <Button
                      onClick={handlePasteJson}
                    >
                      Parse JSON <Sparkles size={16} />
                    </Button>
                  </div>
                </Stack>
              </SectionReveal>
            )}

            {/* ── STEP 3: PREVIEW & EDIT ── */}
            {step === 3 && (
              <SectionReveal key="s3">
                <Stack gap="lg" className="pb-24">
                  <div className="flex items-center justify-between bg-card-bg/40 p-4 rounded-2xl border border-border-subtle/20">
                    <Stack gap={0}>
                      <h2 className="font-black text-text-primary tracking-tight" style={{ fontSize: getTypo('title') }}>Review Questions</h2>
                      <p className="text-text-secondary font-medium text-xs opacity-60">
                        {questions.length} questions loaded — edit or delete as needed
                      </p>
                    </Stack>
                    <Badge variant="primary">{questions.length} MCQs</Badge>
                  </div>

                  <div className="space-y-4">
                    {questions.map((q, idx) => (
                      <QuestionCard
                        key={idx}
                        q={q}
                        idx={idx}
                        getTypo={getTypo}
                        getDimension={getDimension}
                        onDelete={() => deleteQuestion(idx)}
                        onUpdate={(upd: Partial<QuestionData>) => updateQuestion(idx, upd)}
                      />
                    ))}
                  </div>

                  {/* Sticky bottom bar */}
                  <div className="fixed bottom-0 left-0 right-0 p-4 bg-app-bg/95 backdrop-blur-xl border-t border-border-subtle/20 z-50">
                    <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                      <Button
                        variant="secondary"
                        onClick={prevStep}
                      >
                        <ChevronLeft size={16} /> Back
                      </Button>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => setQuestions(prev => [...prev, {
                            question_text_en: 'New Question Scenario',
                            option_a_en: '', option_b_en: '', option_c_en: '', option_d_en: '',
                            correct_option: 'A',
                            explanation_en: '',
                            display_order: prev.length + 1
                          }])}
                        >
                          <Plus size={16} /> Add Question
                        </Button>
                        <Button
                          onClick={() => {
                            if (questions.length === 0) {
                              showError('You must have at least one question to proceed.')
                            } else {
                              nextStep()
                            }
                          }}
                        >
                          Configure Exam <ChevronRight size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Stack>
              </SectionReveal>
            )}

            {/* ── STEP 4: EXAM SETUP ── */}
            {step === 4 && (
              <SectionReveal key="s4">
                <Stack gap="xl">
                  <Card padding={24}>
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Title */}
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5 opacity-70">
                          <FileText size={11} /> Exam Title
                        </label>
                        <input
                          type="text"
                          value={examConfig.title}
                          onChange={(e) => setExamConfig(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g. APPSC Group 1 Mock Test — Paper I"
                          className="w-full bg-hover-bg/60 border-2 border-border-subtle/20 rounded-xl px-4 py-3.5 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-text-primary placeholder:text-text-secondary/30"
                          style={{ fontSize: getTypo('body') }}
                        />
                      </div>

                      {/* Duration */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5 opacity-70">
                          <Clock size={11} /> Duration (Minutes)
                        </label>
                        <div className="relative">
                          <Settings2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" />
                          <input
                            type="number"
                            value={examConfig.duration_minutes}
                            onChange={(e) => setExamConfig(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-hover-bg/60 border-2 border-border-subtle/20 rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-text-primary"
                            style={{ fontSize: getTypo('body') }}
                          />
                        </div>
                      </div>

                      {/* Marks per Q */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5 opacity-70">
                          <BarChart3 size={11} /> Marks / Question
                        </label>
                        <div className="relative">
                          <BarChart3 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" />
                          <input
                            type="number"
                            value={examConfig.marks_per_question}
                            onChange={(e) => setExamConfig(prev => ({ ...prev, marks_per_question: parseFloat(e.target.value) || 1 }))}
                            className="w-full bg-hover-bg/60 border-2 border-border-subtle/20 rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-text-primary"
                            style={{ fontSize: getTypo('body') }}
                            step="0.25"
                            min="0.25"
                          />
                        </div>
                      </div>

                      {/* Start time */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5 opacity-70">
                          <CalendarDays size={11} /> Start Date & Time
                        </label>
                          <CompactDateTimePicker
                            minStr={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                            value={examConfig.start_time}
                            onChange={(v) => setExamConfig(prev => ({ ...prev, start_time: v }))}
                            getTypo={getTypo}
                          />
                      </div>

                      {/* End time */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5 opacity-70">
                          <CalendarDays size={11} /> End Date & Time
                        </label>
                          <CompactDateTimePicker
                            minStr={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                            value={examConfig.end_time}
                            onChange={(v) => setExamConfig(prev => ({ ...prev, end_time: v }))}
                            getTypo={getTypo}
                          />
                      </div>
                    </div>
                  </Card>

                  {/* Errors */}
                  <AnimatePresence>
                    {configErrors.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-500/8 border border-red-500/20 rounded-2xl p-4 space-y-1.5"
                      >
                        {configErrors.map((err, i) => (
                          <div key={i} className="flex items-center gap-2 text-red-500 text-xs font-bold">
                            <AlertCircle size={13} className="shrink-0" /> {err}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="secondary"
                      onClick={prevStep}
                    >
                      <ChevronLeft size={16} /> Back
                    </Button>
                    <Button
                      onClick={() => { if(validateConfig()) nextStep(); }}
                    >
                      Final Review <ChevronRight size={16} />
                    </Button>
                  </div>
                </Stack>
              </SectionReveal>
            )}

            {/* ── STEP 5: REVIEW & PUBLISH ── */}
            {step === 5 && (
              <SectionReveal key="s6">
                <Stack gap="xl">
                  {/* Removed centered header */}

                  <Card padding={24}>
                    <Stack gap="lg">
                      {/* Stats row */}
                      <div className="grid gap-3 grid-cols-3">
                        {[
                          { icon: BookOpen,     label: 'Questions',  value: `${questions.length}` },
                          { icon: Clock,        label: 'Duration',   value: `${examConfig.duration_minutes}m` },
                          { icon: BarChart3,    label: 'Total Marks',value: `${questions.length * examConfig.marks_per_question}` }
                        ].map((stat, i) => (
                          <div key={i} className="bg-card-bg border border-border-subtle/20 rounded-2xl p-4 text-center flex flex-col items-center gap-2">
                            <IconBadge
                              icon={stat.icon}
                              size="md"
                              className="bg-primary/10 text-primary"
                              darkClassName="rounded-xl bg-primary/10 text-primary"
                            />
                            <span className="text-lg font-black text-text-primary leading-none">{stat.value}</span>
                            <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-50">{stat.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Detail card */}
                      <div className="bg-primary/5 border border-primary/15 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-primary/10 flex items-center gap-3">
                          <ShieldCheck size={16} className="text-primary" />
                          <span className="font-black text-primary text-sm tracking-tight truncate">{examConfig.title || 'Untitled Exam'}</span>
                          <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">Verified</span>
                        </div>
                        <div className="divide-y divide-primary/8">
                          {[
                            { label: 'Start Time',  value: examConfig.start_time ? new Date(examConfig.start_time).toLocaleString() : '—' },
                            { label: 'End Time',    value: examConfig.end_time ? new Date(examConfig.end_time).toLocaleString() : '—' },
                            { label: 'Status',      value: 'Will be Published' },
                          ].map((row, i) => (
                            <div key={i} className="px-5 py-3 flex justify-between items-center">
                              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">{row.label}</span>
                              <span className="text-xs font-bold text-text-primary">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Stack>
                  </Card>

                  {/* Error banner */}
                  {publishError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3"
                    >
                      <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1.5">
                        <p className="text-xs font-bold text-red-500 leading-tight">{publishError}</p>
                        <button
                          onClick={handlePublish}
                          disabled={isPublishing}
                          className="text-[10px] font-black uppercase tracking-widest text-red-500 underline underline-offset-2 hover:no-underline disabled:opacity-40"
                        >
                          Retry
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Publish button */}
                  <Button
                    onClick={handlePublish}
                    loading={isPublishing}
                    disabled={isPublishing}
                    className="w-full shadow-xl shadow-primary/30 h-[58px]"
                  >
                    <Rocket size={18} /> Publish Exam
                  </Button>

                  <div className="flex justify-center">
                    <Button
                      variant="secondary"
                      onClick={prevStep}
                      disabled={isPublishing}
                      className="h-10"
                    >
                      <ChevronLeft size={16} /> Go Back
                    </Button>
                  </div>
                </Stack>
              </SectionReveal>
            )}

          </AnimatePresence>
        </Stack>
      </>
      )}
    </Stack>
    </PageContainer>
  )
}

// ─── QuestionCard ─────────────────────────────────────────────────────────
interface QuestionCardProps {
  q: QuestionData
  idx: number
  getTypo: (k: string) => string
  getDimension: (k: string) => number
  onDelete: () => void
  onUpdate: (upd: Partial<QuestionData>) => void
}

function QuestionCard({ q, idx, getTypo, getDimension, onDelete, onUpdate }: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localQ, setLocalQ] = useState(q)

  useEffect(() => {
    setLocalQ(q)
  }, [q])

  const handleSave = () => {
    onUpdate(localQ)
    setIsEditing(false)
  }

  return (
    <motion.div
      layout
      className="bg-card-bg border border-border-subtle/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
      style={{ padding: getDimension('cardPadding') }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border border-primary/20">
            {idx + 1}
          </div>
          {!isEditing ? (
            <div className="space-y-3 flex-1 min-w-0">
               {q.diagram && <DiagramRenderer diagram={q.diagram} className="mb-4" />}
               <h3 className="font-bold text-text-primary leading-snug" style={{ fontSize: getTypo('cardQ') }}>
                 {q.question_text_en || 'Untitled Question'}
               </h3>
            </div>
          ) : (
            <textarea
              value={localQ.question_text_en || ''}
              onChange={(e) => setLocalQ({ ...localQ, question_text_en: e.target.value })}
              className="flex-1 bg-hover-bg border border-border-subtle/40 rounded-xl p-3 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary resize-none"
              rows={3}
            />
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)} className="p-2 rounded-lg hover:bg-primary/10 text-text-secondary hover:text-primary transition-all">
                <Edit3 size={14} />
              </button>
              <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-500 transition-all">
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <button onClick={handleSave} className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm shadow-primary/20">
              <Check size={12} /> Save
            </button>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {['a', 'b', 'c', 'd'].map(opt => {
          const isCorrect = q.correct_option === opt.toUpperCase()
          const enKey = `option_${opt}_en`
          return (
            <div
              key={opt}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${
                isCorrect
                  ? 'bg-green-500/8 border-green-500/25 text-green-500'
                  : 'bg-hover-bg/30 border-border-subtle/10 text-text-secondary'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 ${
                isCorrect ? 'bg-green-500/20 text-green-500' : 'bg-card-bg border border-border-subtle/40 text-text-secondary'
              }`}>
                {opt.toUpperCase()}
              </div>
              {!isEditing ? (
                <span className="font-medium flex-1 truncate text-xs">
                  {String(q[enKey as keyof QuestionData] ?? '')}
                </span>
              ) : (
                <input
                  onChange={(e) => setLocalQ({ ...localQ, [`option_${opt}_en`]: e.target.value })}
                  className="flex-1 bg-transparent border-none p-0 font-medium text-xs focus:ring-0 text-text-primary min-w-0"
                />
              )}
              {isEditing && (
                <button
                  onClick={() => setLocalQ({ ...localQ, correct_option: opt.toUpperCase() as 'A' | 'B' | 'C' | 'D' })}
                  title="Mark as correct"
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all shrink-0 ${
                    localQ.correct_option === opt.toUpperCase()
                      ? 'bg-primary border-primary'
                      : 'border-border-subtle hover:border-primary/50'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Explanation */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles size={10} className="text-primary opacity-60" />
          <span className="text-[9px] font-black uppercase tracking-widest text-primary opacity-60">Explanation</span>
        </div>
        {!isEditing ? (
          <p className="font-medium text-text-secondary leading-relaxed italic" style={{ fontSize: getTypo('cardExpl') }}>
            {/* Phase 5: English exclusively from _en fields */}
            {q.explanation_en || 'No explanation provided.'}
          </p>
        ) : (
          <textarea
            value={localQ.explanation_en || ''}
            onChange={(e) => setLocalQ({ ...localQ, explanation_en: e.target.value })}
            className="w-full bg-transparent border border-primary/10 rounded-lg p-2 font-medium text-xs focus:ring-0 text-text-primary resize-none"
            rows={2}
          />
        )}
      </div>
    </motion.div>
  )
}
