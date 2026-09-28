import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Save, PenSquare, AlertCircle } from 'lucide-react'
import { BilingualToggle } from '../../../common/BilingualToggle'
import { AdminModal } from '../../../common/AdminModal'
import { Button, Badge, Alert } from '../../../common/AntigravityUI'
import type { Question, QuestionVisual } from '../../../../types/exam.types'
import { adminQuestionService } from '../../../../services/adminQuestionService'
import { normalizeVisualInput } from '../../../../services/questions/visualNormalizer'
import { useAuth } from '../../../../context/AuthContext'
import { SingleQuestionSchema } from '../../../../validations/questionSchema'
import { isAdmin } from '../../../../utils/authUtils'
import { classifyError } from '../../../../utils/errorClassification'
import { generateRequestId, logError } from '../../../../utils/logger'
import { QuestionForm } from '../QuestionForm'

type ModalMode = 'view' | 'add' | 'edit'

interface SingleQuestionModalProps {
  isOpen: boolean
  onClose: () => void
  mode: ModalMode
  question: Partial<Question> | null
  examId: string
  examLabel?: string
  paperId: string
  paperLabel?: string
  subjectName: string
  /** Manual-entry topic context — identity + bilingual labels of the clicked
   *  LIVE topic card. Seeds the draft so the save persists topic_en/topic_te;
   *  not user-editable (the backend trigger validates the relationship). */
  topicId?: string | null
  topicEnglish?: string | null
  topicTelugu?: string | null
  onSuccess: () => void
  onModeChange?: (mode: ModalMode) => void
  /** LOCAL-ONLY mode (Bulk Preview editor): the canonical SingleQuestionSchema
   *  validates the form exactly as the DB path would, but nothing is ever
   *  written to the database. `onLocalSave` receives the same normalized
   *  payload the DB path would send — the caller merges it into its own local
   *  workspace (parsed preview rows). */
  localOnly?: boolean
  onLocalSave?: (payload: Partial<Question>) => void
}

type SingleQuestionFieldErrors = Partial<Record<
  'question_text_en' | 'option_a_en' | 'option_b_en' | 'option_c_en' | 'option_d_en',
  string
>>

const FIELD_ERROR_KEYS: (keyof SingleQuestionFieldErrors)[] = [
  'question_text_en', 'option_a_en', 'option_b_en', 'option_c_en', 'option_d_en',
]

export function SingleQuestionModal({
  isOpen, onClose, mode, question, examId, examLabel, paperId, paperLabel, subjectName,
  topicId, topicEnglish, topicTelugu, onSuccess, onModeChange, localOnly = false, onLocalSave
}: SingleQuestionModalProps) {
  const { user } = useAuth()
  
  const [formData, setFormData] = useState<Partial<Question>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<SingleQuestionFieldErrors>({})
  const [displayLang, setDisplayLang] = useState<'en' | 'te'>('en')
  const submittedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      if (mode === 'add') {
        setFormData({
          exam_id: examId !== 'all' && examId !== 'APPSC_GROUPS' ? examId : '',
          paper_id: paperId !== 'all' ? paperId : '',
          subject_name: subjectName !== 'all' ? subjectName : '',
          difficulty: 'medium',
          correct_option: 'A',
          negative_marks: 0,
          // Topic context from the clicked live topic card (manual entry).
          // Seeded ONLY when provided so non-topic flows keep the previous
          // untagged draft shape.
          ...(topicEnglish ? { topic_en: topicEnglish, topic_te: topicTelugu ?? null } : {}),
          // Initialize _en fields empty (admin must fill)
          question_text_en: '', option_a_en: '', option_b_en: '', option_c_en: '', option_d_en: '', explanation_en: '',
          // Initialize _te fields null (optional)
          question_text_te: null, option_a_te: null, option_b_te: null, option_c_te: null, option_d_te: null, explanation_te: null,
        })
      } else if (question) {
        let normalizedVisual: QuestionVisual | null | undefined
        try {
          normalizedVisual = normalizeVisualInput(
            question.visual ?? (question as Partial<Question> & { visual_engine?: unknown }).visual_engine ?? null
          )
        } catch {
          normalizedVisual = null
        }

        // Edit/View: populate modern bilingual fields
        setFormData({
          ...question,
          visual: normalizedVisual as QuestionVisual | undefined,
          question_text_en: question.question_text_en || '',
          option_a_en: question.option_a_en || '',
          option_b_en: question.option_b_en || '',
          option_c_en: question.option_c_en || '',
          option_d_en: question.option_d_en || '',
          explanation_en: question.explanation_en || '',
          // Telugu: existing value or null
          question_text_te: question.question_text_te ?? null,
          option_a_te: question.option_a_te ?? null,
          option_b_te: question.option_b_te ?? null,
          option_c_te: question.option_c_te ?? null,
          option_d_te: question.option_d_te ?? null,
          explanation_te: question.explanation_te ?? null,
        })
      }
      setError(null)
      setFieldErrors({})
      submittedRef.current = false
    }
  }, [isOpen, mode, question, examId, paperId, subjectName, topicId, topicEnglish, topicTelugu])

  if (!isOpen) return null
  const isReadOnly = mode === 'view'

  const extractFieldErrors = (result: { success: boolean; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } }): SingleQuestionFieldErrors => {
    const next: SingleQuestionFieldErrors = {}
    if (!result.success) {
      result.error?.issues.forEach(issue => {
        const field = issue.path[0] as keyof SingleQuestionFieldErrors
        if (FIELD_ERROR_KEYS.includes(field)) next[field] = issue.message
      })
    }
    return next
  }

  const handleFieldBlur = (field: keyof SingleQuestionFieldErrors) => {
    if (!submittedRef.current) return
    const result = SingleQuestionSchema.safeParse(formData)
    const next = extractFieldErrors(result as Parameters<typeof extractFieldErrors>[0])
    setFieldErrors(prev => ({ ...prev, [field]: next[field] }))
  }

  const handleSubmit = async () => {
    try {
      if (!localOnly && !isAdmin(user)) throw new Error('Unauthorized: Admin privileges required')
      
      setIsSubmitting(true)
      setError(null)

      // Zod Validation
      const validationResult = SingleQuestionSchema.safeParse(formData)
      if (!validationResult.success) {
        setFieldErrors(extractFieldErrors(validationResult))
        return
      }
      
      const validated = validationResult.data

      // Nullify empty Telugu strings for clean storage
      const teluguNullified = {
        question_text_te: validated.question_text_te?.trim() || null,
        option_a_te: validated.option_a_te?.trim() || null,
        option_b_te: validated.option_b_te?.trim() || null,
        option_c_te: validated.option_c_te?.trim() || null,
        option_d_te: validated.option_d_te?.trim() || null,
        explanation_te: validated.explanation_te?.trim() || null,
      }

      const payload: Partial<Question> & { updated_at: string; created_by?: string } = {
        ...validated,
        ...teluguNullified,
        updated_at: new Date().toISOString()
      }

      /* LOCAL-ONLY mode (Bulk Preview editor): the exact normalized payload the
       * DB path would send is handed back to the caller, which merges it into
       * its own unsynced workspace. NO database read or write ever happens. */
      if (localOnly) {
        onLocalSave?.(payload)
        setError(null)
        onClose()
        return
      }

      if (mode === 'add' && user) {
        payload.created_by = user.id
      }

      const requestId = generateRequestId(mode === 'add' ? 'create_q' : 'update_q')

      if (mode === 'add') {
        const createResult = await adminQuestionService.createQuestion(payload, { requestId, user, topicId: topicId ?? undefined })
        if (!createResult.success) {
          // F-7: raw DB message stays internal; UI receives canonical copy.
          logError('question.create_failed', { requestId, message: createResult.error?.message || 'Unknown error' })
          throw new Error(classifyError(createResult.error ?? 'Failed to insert question').message)
        }
        // DEF-5: explicit duplicate feedback
        if (createResult.data?.status === 'duplicate') {
          setError('Question already exists (duplicate detected).')
          return
        }
      } else if (mode === 'edit' && formData.id) {
        const updateResult = await adminQuestionService.updateQuestion(formData.id, payload, { requestId, user })
        if (!updateResult.success) {
          logError('question.update_failed', { requestId, id: formData.id, message: updateResult.error?.message || 'Unknown error' })
          throw new Error(classifyError(updateResult.error ?? 'Failed to update question').message)
        }
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save question. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isReadOnly ? (
        <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wide">
            <span className="truncate max-w-[200px]">{examLabel || formData.exam_id}</span>
            <ChevronRight className="w-2.5 h-2.5 opacity-40" />
            <span className="truncate max-w-[200px]">{paperLabel || formData.paper_id}</span>
          </div>
            <div className="text-sm font-bold text-text-primary uppercase tracking-tighter">
            {formData.subject_name}
          </div>
        </div>
      ) : (
        mode === 'edit' ? 'Edit Question' : 'Create Question'
      )}
      headerBadge={(
        <Badge variant="primary" size="md" icon={isReadOnly ? ChevronRight : PenSquare}>
          {isReadOnly ? 'Review Mode' : mode === 'edit' ? 'Editor' : 'New Entry'}
        </Badge>
      )}
      headerActions={isReadOnly && (
        <BilingualToggle
          displayLang={displayLang}
          onChange={setDisplayLang}
          showShadow
        />
      )}
      footer={(
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          
          {isReadOnly ? (
            <Button
              variant="secondary"
              onClick={() => onModeChange?.('edit')}
            >
              <PenSquare className="w-4 h-4" />
              <span className="uppercase tracking-widest">Edit Question</span>
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!formData.exam_id || !formData.paper_id || !formData.subject_name}
            >
              <Save className="w-4 h-4" />
              <span className="uppercase tracking-widest">Save Changes</span>
            </Button>
          )}
        </>
      )}
    >
      <div className="space-y-6 sm:space-y-8">
        {error && (
          <Alert variant="error" icon={AlertCircle} title="Unable to save question" className="w-full">
            {error}
          </Alert>
        )}

        <QuestionForm
          formData={formData}
          setFormData={setFormData}
          isReadOnly={isReadOnly}
          displayLang={displayLang}
          onDisplayLangChange={setDisplayLang}
          fieldErrors={fieldErrors}
          onFieldBlur={handleFieldBlur}
        />
      </div>
    </AdminModal>
  )
}
