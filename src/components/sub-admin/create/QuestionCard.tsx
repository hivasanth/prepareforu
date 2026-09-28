import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Check, Edit3 } from 'lucide-react'
import { DiagramRenderer } from '../../../components/common/DiagramRenderer'
import { Card } from '../../common/AntigravityCard'
import { PremiumSelect } from '../../common/PremiumSelect'
import { QuestionCardHeader } from '../../exam/QuestionCardHeader'
import { QuestionCardOption } from '../../exam/QuestionCardOption'
import { BulkQuestionSchema } from '../../../validations/questionSchema'
import { FieldError } from '../../common/SharedComponents'
import type { QuestionData } from './types'

type QuestionEditField = 'question_text_en' | 'option_a_en' | 'option_b_en' | 'option_c_en' | 'option_d_en' | 'explanation_en'
type QuestionEditErrors = Partial<Record<QuestionEditField, string>>

interface QuestionCardProps {
  q: QuestionData
  idx: number
  /** 1-based index for the canonical header badge. */
  index: number
  /** Denominator for the canonical "of {total}" line. */
  total: number
  /** Open the card in edit mode on mount (used by "Add Question"). */
  autoEdit?: boolean
  onDelete: () => void
  onUpdate: (upd: Partial<QuestionData>) => void
}

const DIFFICULTY_OPTIONS = [
  { id: 'easy', name: 'Easy' },
  { id: 'medium', name: 'Medium' },
  { id: 'hard', name: 'Hard' },
]

export function QuestionCard({ q, idx, index, total, autoEdit = false, onDelete, onUpdate }: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(autoEdit)
  const [prevQ, setPrevQ] = useState(q)
  const [localQ, setLocalQ] = useState(q)
  const [fieldErrors, setFieldErrors] = useState<QuestionEditErrors>({})

  if (prevQ !== q) {
    setPrevQ(q)
    setLocalQ(q)
    setFieldErrors({})
  }

  const handleSave = () => {
    const result = BulkQuestionSchema.safeParse(localQ)
    const nextErrors: QuestionEditErrors = {}
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as QuestionEditField | undefined
        if (field) nextErrors[field] = issue.message
      })
    }
    setFieldErrors(nextErrors)
    if (!result.success) return
    onUpdate(localQ)
    setIsEditing(false)
    setFieldErrors({})
  }

  const updateLocalField = (field: QuestionEditField, value: string) => {
    setLocalQ({ ...localQ, [field]: value })
    setFieldErrors(prev => ({ ...prev, [field]: undefined }))
  }

  return (
    <motion.div
      layout
      className="w-full"
      initial={false}
    >
      <Card variant={isEditing ? 'elevated' : 'static'} padding={0} className="relative overflow-hidden">
        <QuestionCardHeader
          index={index}
          total={total}
          difficulty={isEditing ? undefined : (q.difficulty ?? 'medium')}
          difficultySlot={isEditing ? (
            <PremiumSelect
              value={localQ.difficulty ?? 'medium'}
              onChange={(d) => setLocalQ({ ...localQ, difficulty: d as QuestionData['difficulty'] })}
              options={DIFFICULTY_OPTIONS}
              label="Difficulty level"
              maxVisible={3}
            />
          ) : undefined}
          actions={
            !isEditing ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  aria-label={`Edit question ${index}`}
                  className="p-2 rounded-lg hover:bg-primary/10 text-text-secondary hover:text-primary transition-interaction duration-fast ease-standard focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label={`Delete question ${index}`}
                  className="p-2 rounded-lg hover:bg-danger/10 text-text-secondary hover:text-danger transition-interaction duration-fast ease-standard focus:outline-none focus:ring-2 focus:ring-danger/30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm shadow-primary/20 transition-interaction duration-fast ease-standard focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <Check size={12} /> Save
              </button>
            )
          }
        />

        <div className="p-5 md:p-6 space-y-5">
          {q.diagram && <DiagramRenderer diagram={q.diagram} className="mb-1" />}

          {!isEditing ? (
            <h3 className="font-semibold text-text-primary leading-relaxed text-[clamp(14px,1.8vw,17px)] max-w-[780px]">
              {q.question_text_en || 'Untitled Question'}
            </h3>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 opacity-70">
                Question Text
              </label>
              <textarea
                id={`q-${idx}-question`}
                value={localQ.question_text_en || ''}
                onChange={(e) => updateLocalField('question_text_en', e.target.value)}
                aria-label="Question text"
                aria-invalid={!!fieldErrors.question_text_en}
                aria-describedby={fieldErrors.question_text_en ? `q-${idx}-question-error` : undefined}
                className="w-full bg-hover-bg border border-border-subtle/40 rounded-xl p-3 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary resize-none"
                rows={3}
              />
              {fieldErrors.question_text_en && (
                <FieldError id={`q-${idx}-question-error`}>{fieldErrors.question_text_en}</FieldError>
              )}
            </div>
          )}

          <div role="group" aria-label="Answer options" className="flex flex-col gap-3.5">
            {(['a', 'b', 'c', 'd'] as const).map(opt => {
              const isCorrect = q.correct_option === opt.toUpperCase()
              const editingCorrect = localQ.correct_option === opt.toUpperCase()
              const enKey = `option_${opt}_en` as QuestionEditField
              const error = fieldErrors[enKey]

              return (
                <QuestionCardOption
                  key={opt}
                  label={opt.toUpperCase()}
                  state={isEditing
                    ? (editingCorrect ? 'correct' : 'neutral')
                    : (isCorrect ? 'correct' : 'neutral')}
                >
                  {!isEditing ? (
                    <span className={`font-medium flex-1 leading-relaxed ${isCorrect ? 'text-success' : 'text-text-primary'}`}>
                      {String(q[enKey] ?? '') || <span className="text-text-hint italic text-xs">Empty option</span>}
                    </span>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <textarea
                        id={`q-${idx}-opt-${opt}`}
                        value={String(localQ[enKey] ?? '')}
                        onChange={(e) => updateLocalField(enKey, e.target.value)}
                        aria-label={`Option ${opt.toUpperCase()}`}
                        aria-invalid={!!error}
                        aria-describedby={error ? `q-${idx}-opt-${opt}-error` : undefined}
                        rows={2}
                        className="w-full bg-transparent border-none p-0 font-medium text-xs md:text-sm leading-relaxed focus:ring-0 text-text-primary min-w-0 resize-none focus:outline-none"
                      />
                      {error && (
                        <FieldError id={`q-${idx}-opt-${opt}-error`}>{error}</FieldError>
                      )}
                    </div>
                  )}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setLocalQ({ ...localQ, correct_option: opt.toUpperCase() as 'A' | 'B' | 'C' | 'D' })}
                      aria-label={`Mark option ${opt.toUpperCase()} as correct`}
                      aria-pressed={editingCorrect}
                      title="Mark as correct"
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-interaction duration-fast ease-standard shrink-0 ${
                        editingCorrect
                          ? 'bg-success border-success'
                          : 'border-border-subtle hover:border-success/50'
                      }`}
                    />
                  )}
                </QuestionCardOption>
              )
            })}
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 space-y-1.5">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Explanation</span>
            {!isEditing ? (
              <p className="font-medium text-text-secondary leading-relaxed italic text-xs">
                &ldquo;{q.explanation_en || 'No explanation provided.'}&rdquo;
              </p>
            ) : (
              <textarea
                id={`q-${idx}-explanation`}
                value={localQ.explanation_en || ''}
                onChange={(e) => updateLocalField('explanation_en', e.target.value)}
                aria-label="Explanation"
                className="w-full bg-transparent border border-primary/10 rounded-lg p-2 font-medium text-xs focus:ring-0 text-text-primary resize-none focus:outline-none"
                rows={2}
              />
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}