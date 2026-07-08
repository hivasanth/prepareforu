import { useState, useEffect } from 'react'
import { ChevronRight, Save, PenSquare, AlertTriangle } from 'lucide-react'
import { BilingualToggle } from '../../../common/BilingualToggle'
import { Button } from '../../../common/AntigravityUI'
import type { Question } from '../../../../types/exam.types'
import { adminQuestionService } from '../../../../services/adminQuestionService'
import { useAuth } from '../../../../context/AuthContext'
import { SingleQuestionSchema } from '../../../../validations/questionSchema'
import { isAdmin } from '../../../../utils/authUtils'
import { AdminModal } from '../../common/AdminModal'
import { generateRequestId } from '../../../../utils/logger'
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
  onSuccess: () => void
  onModeChange?: (mode: ModalMode) => void
}

export function SingleQuestionModal({
  isOpen, onClose, mode, question, examId, examLabel, paperId, paperLabel, subjectName, onSuccess, onModeChange
}: SingleQuestionModalProps) {
  const { user } = useAuth()
  
  const [formData, setFormData] = useState<Partial<Question>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [displayLang, setDisplayLang] = useState<'en' | 'te'>('en')

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
          // Initialize _en fields empty (admin must fill)
          question_text_en: '', option_a_en: '', option_b_en: '', option_c_en: '', option_d_en: '', explanation_en: '',
          // Initialize _te fields null (optional)
          question_text_te: null, option_a_te: null, option_b_te: null, option_c_te: null, option_d_te: null, explanation_te: null,
        })
      } else if (question) {
        // Normalize visual_engine → visual (handles DB records with either format)
        let normalizedVisual = question.visual || (question as Partial<Question> & { visual_engine?: unknown }).visual_engine || null
        if (normalizedVisual && typeof normalizedVisual === 'object') {
          if (normalizedVisual.render_type && normalizedVisual.metadata !== undefined) {
            normalizedVisual = {
              type: normalizedVisual.render_type,
              title: normalizedVisual.title || undefined,
              data: normalizedVisual.metadata,
            }
          }
        }

        // Edit/View: populate modern bilingual fields
        setFormData({
          ...question,
          visual: normalizedVisual,
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
    }
  }, [isOpen, mode, question, examId, paperId, subjectName])

  if (!isOpen) return null
  const isReadOnly = mode === 'view'

  const handleSubmit = async () => {
    try {
      if (!isAdmin(user)) throw new Error('Unauthorized: Admin privileges required')
      
      setIsSubmitting(true)
      setError(null)
      const requestId = generateRequestId(mode === 'add' ? 'create_q' : 'update_q')

      // Zod Validation
      const validationResult = SingleQuestionSchema.safeParse(formData)
      if (!validationResult.success) {
        throw new Error(validationResult.error.issues[0].message)
      }
      
      const validated = validationResult.data

      // Nullify empty Telugu strings for clean DB storage
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

      if (mode === 'add' && user) {
        payload.created_by = user.id
      }

      if (mode === 'add') {
        const createResult = await adminQuestionService.createQuestion(payload, { requestId, user })
        if (!createResult.success) throw new Error(createResult.error?.message || 'Failed to insert question')
      } else if (mode === 'edit' && formData.id) {
        const updateResult = await adminQuestionService.updateQuestion(formData.id, payload, { requestId, user })
        if (!updateResult.success) throw new Error(updateResult.error?.message || 'Failed to update question')
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
          <div className="flex items-center gap-1.5 text-[10px] font-black text-text-secondary uppercase tracking-[0.15em]">
            <span className="truncate max-w-[200px]">{examLabel || formData.exam_id}</span>
            <ChevronRight className="w-2.5 h-2.5 opacity-40" />
            <span className="truncate max-w-[200px]">{paperLabel || formData.paper_id}</span>
          </div>
          <div className="text-sm font-black text-text-primary uppercase tracking-tighter">
            {formData.subject_name}
          </div>
        </div>
      ) : (
        mode === 'edit' ? 'Edit Question' : 'Create Question'
      )}
      headerBadge={(
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          {isReadOnly ? <ChevronRight className="w-3 h-3 text-primary" /> : <PenSquare className="w-3 h-3 text-primary" />}
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
            {isReadOnly ? 'Review Mode' : mode === 'edit' ? 'Editor' : 'New Entry'}
          </span>
        </div>
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
            className="px-6 py-3 rounded-2xl font-black text-xs sm:text-sm text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors tracking-widest uppercase !h-auto !shadow-none"
          >
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          
          {isReadOnly ? (
            <Button
              variant="secondary"
              onClick={() => onModeChange?.('edit')}
              className="px-6 py-3 rounded-2xl font-black text-xs sm:text-sm text-white bg-secondary hover:bg-secondary-hover shadow-lg shadow-secondary/20 transition-all flex items-center gap-2 active:scale-95 !h-auto"
            >
              <PenSquare className="w-4 h-4" />
              <span className="uppercase tracking-widest">Edit Question</span>
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!formData.exam_id || !formData.paper_id || !formData.subject_name}
              className="px-8 py-3 rounded-2xl font-black text-xs sm:text-sm text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 !h-auto"
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
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold rounded-2xl flex items-center gap-3 animate-in shake duration-300">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        <QuestionForm
          formData={formData}
          setFormData={setFormData}
          isReadOnly={isReadOnly}
          displayLang={displayLang}
        />
      </div>
    </AdminModal>
  )
}
