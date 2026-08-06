import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '../../common/AntigravityUI'
import { BulkQuestionSchema } from '../../../validations/questionSchema'
import { getDimension, safeParse } from './types'
import type { QuestionData } from './types'

interface CreateStepJsonPasteProps {
  questions: QuestionData[]
  setQuestions: (v: QuestionData[]) => void
  onConfirm: () => void
  breakpoint: string
}

export function CreateStepJsonPaste({ questions, setQuestions, onConfirm, breakpoint }: CreateStepJsonPasteProps) {
  const [rawJson, setRawJson] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)

  const handleParse = () => {
    setJsonError(null)
    const content = rawJson.trim()

    if (!content) {
      setJsonError('The input field is empty. Please paste your JSON output.')
      return
    }

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
        const result = BulkQuestionSchema.safeParse(q)
        if (!result.success) {
          const message = result.error.issues[0]?.message || 'Invalid question data.'
          throw new Error(`Question ${idx + 1}: ${message}`)
        }
        const v = result.data
        return {
          question_text_en: v.question_text_en.trim().slice(0, 2000),
          question_text_te: v.question_text_te ? String(v.question_text_te).trim().slice(0, 2000) : undefined,
          option_a_en: v.option_a_en.trim().slice(0, 1000),
          option_a_te: v.option_a_te ? String(v.option_a_te).trim().slice(0, 1000) : undefined,
          option_b_en: v.option_b_en.trim().slice(0, 1000),
          option_b_te: v.option_b_te ? String(v.option_b_te).trim().slice(0, 1000) : undefined,
          option_c_en: v.option_c_en.trim().slice(0, 1000),
          option_c_te: v.option_c_te ? String(v.option_c_te).trim().slice(0, 1000) : undefined,
          option_d_en: v.option_d_en.trim().slice(0, 1000),
          option_d_te: v.option_d_te ? String(v.option_d_te).trim().slice(0, 1000) : undefined,
          explanation_en: v.explanation_en ? String(v.explanation_en).trim().slice(0, 3000) : undefined,
          explanation_te: v.explanation_te ? String(v.explanation_te).trim().slice(0, 3000) : undefined,
          correct_option: v.correct_option,
          display_order: idx + 1,
          diagram: null
        }
      })

      setQuestions(validated)
    } catch (err: any) {
      setJsonError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card-bg border border-border-subtle/20 rounded-2xl p-5">
        <div className="space-y-4">
          <textarea
            id="json-paste"
            value={rawJson}
            onChange={e => { setRawJson(e.target.value); setJsonError(null) }}
            placeholder="Paste the JSON output here..."
            aria-label="JSON questions input"
            aria-invalid={!!jsonError}
            aria-describedby={jsonError ? 'json-paste-error' : undefined}
            className="w-full bg-card-bg border-2 border-border-subtle/20 rounded-2xl p-4 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-y shadow-sm"
            style={{ height: getDimension(breakpoint, 'jsonH') }}
          />
          {jsonError && (
            <motion.div
              id="json-paste-error"
              role="alert"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3"
            >
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <span className="text-xs font-bold text-red-500 leading-tight">{jsonError}</span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button variant="secondary" onClick={() => setQuestions([])}>
          Clear
        </Button>
        <Button onClick={handleParse}>
          Parse & Validate <Sparkles size={16} />
        </Button>
      </div>

      {questions.length > 0 && (
        <div role="status" className="bg-green-500/8 border border-green-500/20 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-xs font-bold text-green-600">
            {questions.length} questions parsed and validated successfully.
          </span>
          <Button onClick={onConfirm}>
            Confirm & Continue
          </Button>
        </div>
      )}
    </div>
  )
}
