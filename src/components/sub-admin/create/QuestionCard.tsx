import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Check, Edit3 } from 'lucide-react'
import { DiagramRenderer } from '../../../components/common/DiagramRenderer'
import { BulkQuestionSchema } from '../../../validations/questionSchema'
import type { QuestionData } from './types'

type QuestionEditField = 'question_text_en' | 'option_a_en' | 'option_b_en' | 'option_c_en' | 'option_d_en'
type QuestionEditErrors = Partial<Record<QuestionEditField, string>>

interface QuestionCardProps {
  q: QuestionData
  idx: number
  getTypo: (k: string) => string
  getDimension: (k: string) => number
  onDelete: () => void
  onUpdate: (upd: Partial<QuestionData>) => void
}

export function QuestionCard({ q, idx, getTypo, getDimension, onDelete, onUpdate }: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localQ, setLocalQ] = useState(q)
  const [fieldErrors, setFieldErrors] = useState<QuestionEditErrors>({})

  useEffect(() => {
    setLocalQ(q)
    setFieldErrors({})
  }, [q])

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
      className="bg-card-bg border border-border-subtle/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
      style={{ padding: getDimension('cardPadding') }}
    >
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
            <div className="flex-1 min-w-0">
              <textarea
                id={`q-${idx}-question`}
                value={localQ.question_text_en || ''}
                onChange={(e) => updateLocalField('question_text_en', e.target.value)}
                aria-label="Question text"
                aria-invalid={!!fieldErrors.question_text_en}
                aria-describedby={fieldErrors.question_text_en ? `q-${idx}-question-error` : undefined}
                className="w-full bg-hover-bg border border-border-subtle/40 rounded-xl p-3 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary resize-none"
                rows={3}
              />
              {fieldErrors.question_text_en && (
                <span id={`q-${idx}-question-error`} aria-live="polite" className="text-xs font-bold text-danger mt-1 block">{fieldErrors.question_text_en}</span>
              )}
            </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {(['a', 'b', 'c', 'd'] as const).map(opt => {
          const isCorrect = q.correct_option === opt.toUpperCase()
          const enKey = `option_${opt}_en` as QuestionEditField
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
                  {String(q[enKey] ?? '')}
                </span>
              ) : (
                <div className="flex-1 min-w-0">
                  <input
                    id={`q-${idx}-opt-${opt}`}
                    value={String(localQ[enKey] ?? '')}
                    onChange={(e) => updateLocalField(enKey, e.target.value)}
                    aria-label={`Option ${opt.toUpperCase()}`}
                    aria-invalid={!!fieldErrors[enKey]}
                    aria-describedby={fieldErrors[enKey] ? `q-${idx}-opt-${opt}-error` : undefined}
                    className="w-full bg-transparent border-none p-0 font-medium text-xs focus:ring-0 text-text-primary min-w-0"
                  />
                  {fieldErrors[enKey] && (
                    <span id={`q-${idx}-opt-${opt}-error`} aria-live="polite" className="text-[11px] font-bold text-danger mt-0.5 block">{fieldErrors[enKey]}</span>
                  )}
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => setLocalQ({ ...localQ, correct_option: opt.toUpperCase() as 'A' | 'B' | 'C' | 'D' })}
                  aria-label={`Mark option ${opt.toUpperCase()} as correct`}
                  aria-pressed={localQ.correct_option === opt.toUpperCase()}
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

      <div className="bg-primary/5 border border-primary/10 rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary opacity-60">Explanation</span>
        </div>
        {!isEditing ? (
          <p className="font-medium text-text-secondary leading-relaxed italic" style={{ fontSize: getTypo('cardExpl') }}>
            {q.explanation_en || 'No explanation provided.'}
          </p>
        ) : (
          <textarea
            id={`q-${idx}-explanation`}
            value={localQ.explanation_en || ''}
            onChange={(e) => setLocalQ({ ...localQ, explanation_en: e.target.value })}
            aria-label="Explanation"
            className="w-full bg-transparent border border-primary/10 rounded-lg p-2 font-medium text-xs focus:ring-0 text-text-primary resize-none"
            rows={2}
          />
        )}
      </div>
    </motion.div>
  )
}
