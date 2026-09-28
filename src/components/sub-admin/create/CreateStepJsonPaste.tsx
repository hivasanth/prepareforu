import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'
import { Button, Card } from '../../common/AntigravityUI'
import { RowLevelError } from '../../common/SharedComponents'
import { BulkQuestionSchema } from '../../../validations/questionSchema'
import { computeDuplicateRedundancy, getDimension, newQuestionClientId, safeParse, MAX_QUESTIONS } from './types'
import type { ParseReport, QuestionData } from './types'

interface CreateStepJsonPasteProps {
  questions: QuestionData[]
  setQuestions: (v: QuestionData[]) => void
  requestCount: number
  parseReport: ParseReport | null
  setParseReport: (r: ParseReport | null) => void
  onConfirm: () => void
  breakpoint: string
}

export function CreateStepJsonPaste({ questions, setQuestions, requestCount, parseReport, setParseReport, onConfirm, breakpoint }: CreateStepJsonPasteProps) {
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
      if (parsed.length > MAX_QUESTIONS) throw new Error(`Batch size limited to ${MAX_QUESTIONS} questions for stability.`)

      // Validate EVERY row and collect ALL issues (never throw-first).
      // Duplicate rows are dropped first so a repeated (valid) question is
      // reported once as a duplicate instead of repeated in the review list.
      const duplicateOf = computeDuplicateRedundancy(parsed)
      let duplicateRows = 0
      let invalidRows = 0
      const invalidSamples: string[] = []
      const accepted: Array<Omit<QuestionData, 'display_order'>> = []

      parsed.forEach((raw, i) => {
        if (duplicateOf.has(i)) {
          duplicateRows += 1
          return
        }
        const result = BulkQuestionSchema.safeParse(raw)
        if (!result.success) {
          invalidRows += 1
          if (invalidSamples.length < 3) {
            invalidSamples.push(`Question ${i + 1}: ${result.error.issues[0]?.message || 'invalid question data'}`)
          }
          return
        }
        const v = result.data
        accepted.push({
          client_id: newQuestionClientId(),
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
          difficulty: v.difficulty,
          diagram: null
        })
      })

      const finalList = accepted.map((q, idx) => ({ ...q, display_order: idx + 1 }))

      setQuestions(finalList)
      setParseReport({
        requested: requestCount,
        received: parsed.length,
        accepted: finalList.length,
        duplicateRows,
        invalidRows,
        invalidSamples
      })
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : String(err))
      setParseReport(null)
    }
  }

  const handleClear = () => {
    setRawJson('')
    setJsonError(null)
    setQuestions([])
    setParseReport(null)
  }

  const report = parseReport
  const underRequested = report !== null && report.accepted < report.requested
  const hadIssues = report !== null && (report.invalidRows > 0 || report.duplicateRows > 0)

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <div className="space-y-4">
          <textarea
            id="json-paste"
            value={rawJson}
            onChange={e => { setRawJson(e.target.value); setJsonError(null) }}
            placeholder="Paste the JSON output here..."
            aria-label="JSON questions input"
            aria-invalid={!!jsonError}
            aria-describedby={jsonError ? 'json-paste-error' : undefined}
            className="w-full bg-card-bg border-2 border-border-subtle/20 rounded-2xl p-4 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-interaction duration-fast ease-standard resize-y shadow-sm"
            style={{ height: getDimension(breakpoint, 'jsonH') }}
          />
          {jsonError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <RowLevelError id="json-paste-error">{jsonError}</RowLevelError>
            </motion.div>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between pt-1">
        <Button variant="secondary" onClick={handleClear}>
          Clear
        </Button>
        <Button onClick={handleParse}>
          Parse & Validate <Sparkles size={16} />
        </Button>
      </div>

      {report && questions.length > 0 && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 flex flex-col gap-3 border"
          style={{
            background: report.accepted >= report.requested ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
            borderColor: report.accepted >= report.requested ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'
          }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className={report.accepted >= report.requested ? 'text-green-600' : 'text-amber-500'} />
              <span className={`text-xs font-bold ${report.accepted >= report.requested ? 'text-green-700' : 'text-amber-600'}`}>
                {report.accepted} of {report.requested} requested questions ready
              </span>
            </div>
            <Button variant="soft" size="sm" onClick={onConfirm}>
              Confirm & Continue
            </Button>
          </div>

          {hadIssues && (
            <div className="flex items-start gap-2 border-t pt-3 border-border-subtle/20">
              <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs font-bold text-text-secondary leading-relaxed space-y-1">
                <p>
                  {report.received} received — {report.duplicateRows > 0 && <span>{report.duplicateRows} duplicate{report.duplicateRows > 1 ? 's' : ''} removed</span>}
                  {report.duplicateRows > 0 && report.invalidRows > 0 && ' · '}
                  {report.invalidRows > 0 && <span>{report.invalidRows} invalid question{report.invalidRows > 1 ? 's' : ''} excluded</span>}
                </p>
                {report.invalidSamples.map((sample, i) => (
                  <p key={i} className="text-xs text-danger font-bold">{sample}</p>
                ))}
                {underRequested && (
                  <p>Fewer than requested — add more from the AI or adjust the count at Review.</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}