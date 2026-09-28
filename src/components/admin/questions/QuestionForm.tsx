import React from 'react'
import { HelpCircle, Code, Info, ChevronRight, Globe } from 'lucide-react'
import { Card } from '../../common/AntigravityCard'
import { Input, TextArea, Badge } from '../../common/AntigravityUI'
import { BilingualToggle } from '../../common/BilingualToggle'
import { PremiumSelect } from '../../common/PremiumSelect'
import { QuestionVisualizer } from '../../common/QuestionVisualizer'
import { normalizeVisualInput } from '../../../services/questions/visualNormalizer'
import { QuestionCardHeader } from '../../exam/QuestionCardHeader'
import { QuestionCardOption } from '../../exam/QuestionCardOption'
import type { Question } from '../../../types/exam.types'

type QuestionFieldErrorKey = 'question_text_en' | 'option_a_en' | 'option_b_en' | 'option_c_en' | 'option_d_en'

interface QuestionFormProps {
  formData: Partial<Question>
  setFormData: (data: Partial<Question>) => void
  isReadOnly?: boolean
  displayLang?: 'en' | 'te'
  onDisplayLangChange?: (lang: 'en' | 'te') => void
  fieldErrors?: Partial<Record<QuestionFieldErrorKey, string>>
  onFieldBlur?: (field: QuestionFieldErrorKey) => void
  /** 1-based question number for the canonical header badge. */
  questionNumber?: number
  /** Optional denominator ("of N") when the collection size is known. */
  questionTotal?: number
}

const DIFFICULTY_OPTIONS = [
  { id: 'easy', name: 'Easy' },
  { id: 'medium', name: 'Medium' },
  { id: 'hard', name: 'Hard' },
]

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ icon: Icon, children, color = 'text-primary' }: { icon: React.ElementType, children: React.ReactNode, color?: string }) {
  return (
      <span className="flex items-center gap-2 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
      <Icon className={`w-3 h-3 ${color}`} />
      {children}
    </span>
  )
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  formData,
  setFormData,
  isReadOnly = false,
  displayLang = 'en',
  onDisplayLangChange,
  fieldErrors = {},
  onFieldBlur,
  questionNumber = 1,
  questionTotal,
}) => {
  /* ONE form — the language toggle switches which schema fields are bound to
     the shared field renderers. _en and _te values live in the SAME draft. */
  const isTe = displayLang === 'te'
  const suffix = isTe ? '_te' as const : '_en' as const

  const hasTE = !!(
    formData.question_text_te?.trim() ||
    formData.option_a_te?.trim() ||
    formData.option_b_te?.trim() ||
    formData.option_c_te?.trim() ||
    formData.option_d_te?.trim()
  )

  const getFieldValue = (base: string): string =>
    (formData[`${base}${suffix}` as keyof Question] as string | null) || ''

  const setFieldValue = (base: string, value: string) => {
    setFormData({ ...formData, [`${base}${suffix}`]: isTe ? (value || null) : value })
  }

  const enErrorFor = (base: string): string | undefined =>
    (fieldErrors as Record<string, string | undefined>)[`${base}_en`]

  // ── Canonical TE-unavailable strip (same pattern as QuestionCard) ───────────

  const teUnavailableStrip = isTe && !hasTE ? (
    <div className="flex items-center gap-3 p-4 bg-warning/5 border border-warning/10 rounded-2xl mb-6">
      <Globe className="w-4 h-4 text-warning/40" />
      <span className="text-[11px] font-bold text-warning uppercase tracking-widest">Telugu Translation Unavailable</span>
    </div>
  ) : null

  // ── Shared field renderers (language-switched) ──────────────────────────────

  const renderQuestionField = () => (
    <div className={isReadOnly ? 'mb-6' : 'space-y-3'}>
      {!isReadOnly && (
        <SectionLabel icon={HelpCircle} color={isTe ? 'text-warning' : 'text-primary'}>
          Question Statement{isTe ? ' (Telugu)' : ''}
        </SectionLabel>
      )}
      {isReadOnly ? (
        <h2 className="font-semibold text-text-primary leading-relaxed text-[clamp(14px,1.8vw,17px)] max-w-[780px]">
          {getFieldValue('question_text') || '—'}
        </h2>
      ) : (
        <>
          <TextArea
            id={`question-text-${suffix}`}
            value={getFieldValue('question_text')}
            onChange={(e) => setFieldValue('question_text', e.target.value)}
            onBlur={() => !isTe && onFieldBlur?.('question_text_en')}
            aria-invalid={!!(!isTe && enErrorFor('question_text'))}
            aria-describedby={!isTe && enErrorFor('question_text') ? 'question-text-en-error' : undefined}
            placeholder={isTe
              ? 'ప్రశ్న పాఠ్యాన్ని ఇక్కడ నమోదు చేయండి... (Enter question in Telugu)'
              : 'Enter the main question context here...'}
          />
          {!isTe && enErrorFor('question_text') && (
            <span id="question-text-en-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">{enErrorFor('question_text')}</span>
          )}
        </>
      )}
    </div>
  )

  const renderOptions = () => (
    <div role="group" aria-label={`Answer options${isTe ? ' (Telugu)' : ''}`} className={isReadOnly ? '' : 'space-y-3'}>
      {!isReadOnly && (
        <SectionLabel icon={ChevronRight} color="text-secondary">Answer Choices{isTe ? ' (Telugu)' : ''}</SectionLabel>
      )}
      <div className="flex flex-col gap-3.5">
        {(['A', 'B', 'C', 'D'] as const).map(opt => renderOption(opt))}
      </div>
    </div>
  )

  const renderOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    const base = `option_${opt.toLowerCase()}`
    const value = getFieldValue(base)
    const isCorrect = formData.correct_option === opt
    const error = !isTe ? enErrorFor(base) : undefined

    if (isReadOnly) {
      return (
        <QuestionCardOption key={opt} label={opt} state={isCorrect ? 'correct' : 'neutral'}>
          <span className={`text-[13px] sm:text-[13px] md:text-[14px] font-medium flex-1 leading-relaxed ${isCorrect ? 'text-success' : 'text-text-primary'}`}>
            {value || <span className="text-text-hint italic text-xs">{isTe ? 'No Telugu text' : '---'}</span>}
          </span>
        </QuestionCardOption>
      )
    }

    return (
      <div key={opt} className="w-full">
        <QuestionCardOption label={opt} state={isCorrect ? 'correct' : 'neutral'}>
          <div className="flex-1 min-w-0">
            <textarea
              id={`${base}-${suffix}`}
              value={value}
              onChange={(e) => setFieldValue(base, e.target.value)}
              onBlur={() => !isTe && onFieldBlur?.(`${base}_en` as QuestionFieldErrorKey)}
              aria-invalid={!!error}
              aria-describedby={error ? `${base}-en-error` : undefined}
              aria-label={`Option ${opt}${isTe ? ' (Telugu)' : ''}`}
              rows={2}
              placeholder={isTe
                ? `Telugu text for Option ${opt}... (ఐచ్ఛికం)`
                : `English text for Option ${opt}...`}
              className="w-full bg-transparent border-none p-0 text-[13px] md:text-[14px] font-medium leading-relaxed focus:outline-none focus:ring-0 resize-none text-text-primary min-w-0 placeholder:text-text-placeholder placeholder:opacity-40"
            />
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, correct_option: opt })}
            aria-label={`Mark option ${opt} as correct`}
            aria-pressed={isCorrect}
            title="Mark as correct"
            className={`w-3.5 h-3.5 rounded-full border-2 transition-interaction duration-fast ease-standard shrink-0 ${
              isCorrect
                ? 'bg-success border-success'
                : 'border-border-subtle hover:border-success/50'
            }`}
          />
        </QuestionCardOption>
        {error && (
          <span id={`${base}-en-error`} aria-live="polite" className="block text-xs font-bold text-danger mt-1 ml-1">
            {error}
          </span>
        )}
      </div>
    )
  }

  const renderExplanation = () => (
    <div className="space-y-3">
      <SectionLabel icon={Info} color={isTe ? 'text-warning' : 'text-secondary'}>
        Explanation{isTe ? ' (Telugu)' : ''}
      </SectionLabel>
      {isReadOnly ? (
        <p className="font-medium text-text-secondary leading-relaxed italic opacity-80 max-w-[780px]">
          {getFieldValue('explanation') || (isTe
            ? 'No Telugu explanation provided.'
            : 'No explanation provided for this question.')}
        </p>
      ) : (
        <TextArea
          value={getFieldValue('explanation')}
          onChange={(e) => setFieldValue('explanation', e.target.value)}
          placeholder={isTe
            ? 'వివరణను Telugu లో నమోదు చేయండి... (Optional)'
            : 'Explain why the correct option is the right answer...'}
        />
      )}
    </div>
  )

  const renderNegativeMarks = () => (
    <div>
      <label className="block text-[10px] font-semibold text-text-secondary mb-2 uppercase tracking-wide">Negative Marking</label>
      {isReadOnly ? (
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-bold text-text-primary">-{formData.negative_marks || 0}</span>
          <span className="text-[10px] font-bold text-text-muted uppercase">Points</span>
        </div>
      ) : (
        <Input
          type="number"
          step="0.01"
          value={formData.negative_marks || 0}
          onChange={(e) => setFormData({ ...formData, negative_marks: parseFloat(e.target.value) || 0 })}
          variant="compact"
        />
      )}
    </div>
  )

  /* Visual metadata is language-independent schema data — edited once,
     under the English tab, as a secondary form field (no wrapper card). */
  const renderVisualMetadata = () => {
    if (isReadOnly) return formData.visual ? <QuestionVisualizer visual={formData.visual} /> : null
    if (isTe) return null
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel icon={Code} color="text-secondary">
            Visual Diagram Metadata (JSON)
          </SectionLabel>
          {formData.visual && (
            <Badge variant="secondary" size="sm">{formData.visual.type} Active</Badge>
          )}
        </div>
        <TextArea
          value={formData.visual ? JSON.stringify(formData.visual, null, 2) : ''}
          onChange={(e) => {
            try {
              const raw = e.target.value.trim()
              // Single normalization authority: accepts canonical, legacy
              // visual_engine objects, and wrappers; throws on garbage so
              // admins can keep typing.
              const val = raw === '' ? null : normalizeVisualInput(JSON.parse(raw))
              setFormData({ ...formData, visual: val })
            } catch {
              // Just let them type
            }
          }}
          className="font-mono text-[10px]"
          placeholder='{"type": "geometry", "data": { ... }}'
        />
        <p className="text-[9px] text-text-muted italic">Format: geometry | chart | venn | table</p>
        {formData.visual && (
          <QuestionVisualizer visual={formData.visual} />
        )}
      </div>
    )
  }

  // ── ONE QuestionCard-style wrapper shared by every mode ─────────────────────

  return (
    <Card variant="elevated" padding={0} className="relative overflow-hidden">
      <QuestionCardHeader
        index={questionNumber}
        total={questionTotal}
        difficulty={!isReadOnly ? undefined : (formData.difficulty || 'medium')}
        difficultySlot={!isReadOnly ? (
          <PremiumSelect
            value={(formData.difficulty as string) || 'medium'}
            onChange={(d) => setFormData({ ...formData, difficulty: d as Question['difficulty'] })}
            options={DIFFICULTY_OPTIONS}
            label="Difficulty level"
            maxVisible={3}
          />
        ) : undefined}
        actions={
          <BilingualToggle
            displayLang={displayLang}
            onChange={(lang) => onDisplayLangChange?.(lang)}
          />
        }
      />

      <div className="p-5 md:p-6 space-y-6">
        {teUnavailableStrip}

        {renderQuestionField()}
        {renderOptions()}
        {renderExplanation()}
        {renderNegativeMarks()}
        {renderVisualMetadata()}
      </div>
    </Card>
  )
}
