import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button, Alert } from '../../common/AntigravityUI'
import { ConfirmModal } from '../../common/SharedComponents'
import { QuestionCard } from './QuestionCard'
import { getTypo, newQuestionClientId, MAX_QUESTIONS } from './types'
import { EXAM_NO_QUESTIONS_MESSAGE } from '../../../validations/securitySchemas'
import { BulkQuestionSchema } from '../../../validations/questionSchema'
import type { ParseReport, QuestionData } from './types'

interface CreateStepReviewProps {
  questions: QuestionData[]
  setQuestions: (v: QuestionData[]) => void
  parseReport: ParseReport | null
  onConfirm: () => void
  onBack: () => void
  breakpoint: string
}

export function CreateStepReview({ questions, setQuestions, parseReport, onConfirm, onBack, breakpoint }: CreateStepReviewProps) {
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)
  const [autoEditIndex, setAutoEditIndex] = useState<number | null>(null)

  const handleEdit = (idx: number, patch: Partial<QuestionData>) => {
    setQuestions(questions.map((q, i) => i === idx ? { ...q, ...patch } : q))
    setAutoEditIndex(null)
  }

  // L3: leaving Review must never silently carry invalid question state
  // forward. Every question is validated against the shared BulkQuestionSchema
  // (the same rule owner Publish later enforces) and the first invalid row is
  // surfaced + opened for correction. Publish still re-validates the snapshot.
  const handleConfigure = () => {
    if (questions.length === 0) {
      setError(EXAM_NO_QUESTIONS_MESSAGE)
      return
    }
    for (let i = 0; i < questions.length; i++) {
      const check = BulkQuestionSchema.safeParse(questions[i])
      if (!check.success) {
        const msg = check.error.issues[0]?.message || 'invalid question data'
        setAutoEditIndex(i)
        setError(`Question ${i + 1} is incomplete: ${msg}`)
        return
      }
    }
    setError(null)
    onConfirm()
  }

  const handleDeleteConfirmed = () => {
    if (pendingDelete === null) return
    setQuestions(questions.filter((_, i) => i !== pendingDelete).map((q, i) => ({ ...q, display_order: i + 1 })))
    setAutoEditIndex(null)
    setPendingDelete(null)
  }

  const handleAddQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) {
      // W2: never grow the list past the server cap — the paste step is
      // already limited to MAX_QUESTIONS rows, so the add guard keeps the
      // whole wizard inside the same contract.
      setError(`Exams are limited to ${MAX_QUESTIONS} questions. Delete others to add more.`)
      return
    }
    setAutoEditIndex(questions.length)
    setQuestions([...questions, {
      client_id: newQuestionClientId(),
      question_text_en: '',
      question_text_te: undefined,
      option_a_en: '', option_b_en: '', option_c_en: '', option_d_en: '',
      correct_option: 'A',
      explanation_en: '',
      difficulty: 'medium',
      display_order: questions.length + 1
    }])
  }

  const titleTypo = getTypo(breakpoint, 'title')
  const stat: { total: number; invalid: number; duplicates: number } = {
    total: questions.length,
    invalid: parseReport?.invalidRows ?? 0,
    duplicates: parseReport?.duplicateRows ?? 0
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between bg-card-bg/40 p-4 rounded-2xl border border-border-subtle/20">
        <div>
          <h2 className="font-black text-text-primary tracking-tight" style={{ fontSize: titleTypo }}>Review Questions</h2>
          <p className="text-text-secondary font-medium text-xs opacity-60">
            {questions.length} question{questions.length === 1 ? '' : 's'} ready — edit or delete as needed
          </p>
        </div>
      </div>

      {(stat.invalid > 0 || stat.duplicates > 0) && (
        <div role="status" className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold">
          <span className="text-text-secondary">Parse summary:</span>
          <span className="text-text-primary">{stat.total} kept</span>
          {stat.duplicates > 0 && <span className="text-amber-600">{stat.duplicates} duplicate{stat.duplicates > 1 ? 's' : ''} removed</span>}
          {stat.invalid > 0 && <span className="text-danger">{stat.invalid} invalid excluded</span>}
        </div>
      )}

      {error && (
        <Alert variant="error" className="w-full">
          {error}
        </Alert>
      )}

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.client_id}
            q={q}
            idx={idx}
            index={idx + 1}
            total={questions.length}
            autoEdit={idx === autoEditIndex}
            onDelete={() => setPendingDelete(idx)}
            onUpdate={(upd) => handleEdit(idx, upd)}
          />
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-app-bg/95 backdrop-blur-xl border-t border-border-subtle/20 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Button variant="soft" onClick={onBack}>
            <ChevronLeft size={16} /> Back
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleAddQuestion}
            >
              <Plus size={16} /> Add Question
            </Button>
            <Button
              onClick={handleConfigure}
            >
              Configure Exam <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={pendingDelete !== null}
        title="Delete Question"
        message={`Are you sure you want to permanently delete question ${pendingDelete !== null ? pendingDelete + 1 : ''}? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep"
        danger
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}