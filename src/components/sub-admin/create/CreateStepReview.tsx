import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button, Alert } from '../../common/AntigravityUI'
import { QuestionCard } from './QuestionCard'
import { getDimension, getTypo } from './types'
import { EXAM_NO_QUESTIONS_MESSAGE } from '../../../validations/securitySchemas'
import type { QuestionData } from './types'

interface CreateStepReviewProps {
  questions: QuestionData[]
  setQuestions: (v: QuestionData[]) => void
  onConfirm: () => void
  onBack: () => void
  breakpoint: string
}

export function CreateStepReview({ questions, setQuestions, onConfirm, onBack, breakpoint }: CreateStepReviewProps) {
  const [error, setError] = useState<string | null>(null)
  const handleEdit = (idx: number, patch: Partial<QuestionData>) => {
    setQuestions(questions.map((q, i) => i === idx ? { ...q, ...patch } : q))
  }

  const handleDelete = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, display_order: i + 1 })))
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between bg-card-bg/40 p-4 rounded-2xl border border-border-subtle/20">
        <div>
          <h2 className="font-black text-text-primary tracking-tight" style={{ fontSize: getTypo(breakpoint, 'title') }}>Review Questions</h2>
          <p className="text-text-secondary font-medium text-xs opacity-60">
            {questions.length} questions loaded — edit or delete as needed
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="w-full">
          {error}
        </Alert>
      )}

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <QuestionCard
            key={idx}
            q={q}
            idx={idx}
            getTypo={(k) => getTypo(breakpoint, k)}
            getDimension={(k) => getDimension(breakpoint, k)}
            onDelete={() => handleDelete(idx)}
            onUpdate={(upd) => handleEdit(idx, upd)}
          />
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-app-bg/95 backdrop-blur-xl border-t border-border-subtle/20 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Button variant="secondary" onClick={onBack}>
            <ChevronLeft size={16} /> Back
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setQuestions([...questions, {
                question_text_en: 'New Question Scenario',
                option_a_en: '', option_b_en: '', option_c_en: '', option_d_en: '',
                correct_option: 'A',
                explanation_en: '',
                display_order: questions.length + 1
              }])}
            >
              <Plus size={16} /> Add Question
            </Button>
            <Button
              onClick={() => {
                if (questions.length === 0) {
                  setError(EXAM_NO_QUESTIONS_MESSAGE)
                } else {
                  onConfirm()
                }
              }}
            >
              Configure Exam <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
