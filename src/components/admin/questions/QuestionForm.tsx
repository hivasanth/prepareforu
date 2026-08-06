import React, { useState } from 'react'
import { ChevronRight, HelpCircle, Code, CheckCircle2, Info, ChevronDown, Globe } from 'lucide-react'
import { Input, TextArea, Badge, RadioGroup } from '../../common/AntigravityUI'
import { QuestionVisualizer } from '../../common/QuestionVisualizer'
import { DifficultyBadge } from '../common/DifficultyBadge'
import type { Question } from '../../../types/exam.types'

type QuestionFieldErrorKey = 'question_text_en' | 'option_a_en' | 'option_b_en' | 'option_c_en' | 'option_d_en'

interface QuestionFormProps {
  formData: Partial<Question>
  setFormData: (data: Partial<Question>) => void
  isReadOnly?: boolean
  displayLang?: 'en' | 'te'
  fieldErrors?: Partial<Record<QuestionFieldErrorKey, string>>
  onFieldBlur?: (field: QuestionFieldErrorKey) => void
}

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
  fieldErrors = {},
  onFieldBlur,
}) => {
  const [showTelugu, setShowTelugu] = useState(
    // Auto-expand if existing Telugu data is present
    !!(formData.question_text_te?.trim())
  )
  const hasTE = !!(
    formData.question_text_te?.trim() || 
    formData.option_a_te?.trim() || 
    formData.option_b_te?.trim() || 
    formData.option_c_te?.trim() || 
    formData.option_d_te?.trim()
  )

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════════
          ENGLISH SECTION (Required)
      ═══════════════════════════════════════════════════════════════════════ */}
      {(!isReadOnly || displayLang === 'en') && (
        <div className="space-y-6 sm:space-y-8 pb-6 border-b border-border-subtle/40 animate-in">

          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-[13px]">🇬🇧</span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-primary uppercase tracking-widest">English</p>
              </div>
            </div>
            <Badge variant="primary" size="sm">Required</Badge>
          </div>

          {/* Question Text (EN) */}
          <div className="space-y-3">
            <SectionLabel icon={HelpCircle}>Question Statement</SectionLabel>
            {isReadOnly ? (
              <div className="space-y-4">
                <div className="bg-app-bg/50 border border-border-subtle/50 p-6 rounded-3xl text-text-primary text-base sm:text-lg font-bold leading-relaxed shadow-inner">
                  {/* Phase 5: English exclusively from _en fields */}
                  {formData.question_text_en}
                </div>
                {formData.visual && <QuestionVisualizer visual={formData.visual} />}
              </div>
            ) : (
              <div className="space-y-4">
                <TextArea
                  id="question-text-en"
                  value={formData.question_text_en || ''}
                  onChange={(e) => setFormData({ ...formData, question_text_en: e.target.value })}
                  onBlur={() => onFieldBlur?.('question_text_en')}
                  aria-invalid={!!fieldErrors.question_text_en}
                  aria-describedby={fieldErrors.question_text_en ? 'question-text-en-error' : undefined}
                  placeholder="Enter the main question context here..."
                />
                {fieldErrors.question_text_en && (
                  <span id="question-text-en-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">{fieldErrors.question_text_en}</span>
                )}

                {/* Visual Metadata Editor */}
                <div className="bg-app-bg p-4 rounded-2xl border border-border-subtle">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[9px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                      <Code className="w-3 h-3" />
                      Visual Diagram Metadata (JSON)
                    </label>
                    {formData.visual && (
                        <Badge variant="secondary" size="sm">{formData.visual.type} Active</Badge>
                    )}
                  </div>
                  <TextArea
                    value={formData.visual ? JSON.stringify(formData.visual, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const val = e.target.value.trim() === '' ? null : JSON.parse(e.target.value)
                        setFormData({ ...formData, visual: val })
                      } catch (err) {
                        // Just let them type
                      }
                    }}
                    className="font-mono text-[10px]"
                    placeholder='{"type": "geometry", "data": { ... }}'
                  />
                  <p className="mt-2 text-[9px] text-text-muted italic">Format: geometry | chart | venn | table</p>
                </div>

                {formData.visual && (
                  <div className="p-4 border border-dashed border-border-subtle rounded-2xl opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                    <p className="text-[9px] font-semibold text-text-muted uppercase mb-2 text-center">Visual Preview</p>
                    <QuestionVisualizer visual={formData.visual} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Options (EN) */}
          <div className="space-y-4">
            <SectionLabel icon={ChevronRight} color="text-secondary">Answer Choices</SectionLabel>
            <div className={`grid grid-cols-1 ${isReadOnly ? 'sm:grid-cols-1 gap-3' : 'sm:grid-cols-2 gap-4'}`}>
              {(['A', 'B', 'C', 'D'] as const).map(opt => {
                const enKey = `option_${opt.toLowerCase()}_en` as keyof Question
                const isCorrect = formData.correct_option === opt
                // Phase 5: English exclusively from _en fields
                const value = (formData[enKey] as string) || ''

                if (isReadOnly) {
                  return (
                    <div key={opt} className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      isCorrect ? 'bg-success/5 border-success/30' : 'bg-app-bg/30 border-border-subtle/40'
                    }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 font-bold text-sm transition-colors ${
                        isCorrect ? 'bg-success text-white border-success shadow-lg shadow-success/20' : 'bg-hover-bg border-border-subtle text-text-secondary'
                      }`}>
                        {opt}
                      </div>
                      <div className={`text-sm sm:text-base font-bold flex-1 ${isCorrect ? 'text-success' : 'text-text-primary'}`}>
                        {value || '---'}
                      </div>
                      {isCorrect && (
                        <div className="px-3 py-1 bg-success/10 text-success text-[9px] font-semibold uppercase tracking-widest rounded-full border border-success/20">
                          Correct Answer
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <div key={opt}>
                    <div className={`relative p-1 rounded-2xl border transition-all ${isCorrect ? 'border-success bg-success/5 shadow-lg shadow-success/5' : 'border-border-subtle'}`}>
                        <div className={`absolute top-3 left-3 w-7 h-7 flex items-center justify-center rounded-lg font-bold text-xs transition-colors ${
                        isCorrect ? 'bg-success text-white' : 'bg-hover-bg text-text-secondary border border-border-subtle'
                      }`}>
                        {opt}
                      </div>
                      {isCorrect && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-success animate-in" />}
                      <TextArea
                        id={`option-${opt.toLowerCase()}-en`}
                        value={value}
                        onChange={(e) => setFormData({ ...formData, [enKey]: e.target.value })}
                        onBlur={() => onFieldBlur?.(`option_${opt.toLowerCase()}_en` as QuestionFieldErrorKey)}
                        aria-invalid={!!(fieldErrors as Record<string, string | undefined>)[enKey]}
                        aria-describedby={(fieldErrors as Record<string, string | undefined>)[enKey] ? `option-${opt.toLowerCase()}-en-error` : undefined}
                        placeholder={`English text for Option ${opt}...`}
                      />
                      {!isCorrect && (
                        <button
                          type="button"
                          aria-label={`Mark option ${opt} as correct`}
                          onClick={() => setFormData({ ...formData, correct_option: opt })}
                          className="absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-success px-2 py-1 bg-app-bg rounded-lg border border-border-subtle hover:border-success transition-colors"
                        >
                          Correct?
                        </button>
                      )}
                    </div>
                    {(fieldErrors as Record<string, string | undefined>)[enKey] && (
                      <span id={`option-${opt.toLowerCase()}-en-error`} aria-live="polite" className="block text-xs font-bold text-danger mt-1 ml-1">
                        {(fieldErrors as Record<string, string | undefined>)[enKey]}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Metadata Row */}
          <div className={`grid grid-cols-2 gap-6 ${isReadOnly ? 'bg-hover-bg/30 p-4 rounded-2xl border border-border-subtle/30' : ''}`}>
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary mb-2 uppercase tracking-wide">Difficulty Level</label>
              {isReadOnly ? (
                <DifficultyBadge difficulty={formData.difficulty || 'medium'} />
              ) : (
                <RadioGroup<'easy' | 'medium' | 'hard'>
                  value={formData.difficulty as 'easy' | 'medium' | 'hard' || 'medium'}
                  onChange={(d) => setFormData({ ...formData, difficulty: d })}
                  options={[
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' },
                  ]}
                />
              )}
            </div>
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
          </div>

          {/* Explanation (EN) */}
          <div className="space-y-3">
            <SectionLabel icon={Info} color="text-secondary">Explanation</SectionLabel>
            {isReadOnly ? (
              <div className="bg-secondary/5 border border-secondary/10 p-6 rounded-3xl">
                <p className="text-text-primary text-sm sm:text-base font-medium leading-relaxed italic opacity-80">
                  {/* Phase 5: English exclusively from _en fields */}
                  {formData.explanation_en || 'No explanation provided for this question.'}
                </p>
              </div>
            ) : (
              <TextArea
                value={formData.explanation_en || ''}
                onChange={(e) => setFormData({ ...formData, explanation_en: e.target.value })}
                placeholder="Explain why the correct option is the right answer..."
              />
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TELUGU SECTION (Optional)
      ═══════════════════════════════════════════════════════════════════════ */}
      {(!isReadOnly || displayLang === 'te') && (
        <div className={`pt-4 ${isReadOnly ? 'animate-in' : ''}`}>

          {isReadOnly && !hasTE ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-warning/30 rounded-3xl bg-warning/5 mt-4">
              <Globe className="w-12 h-12 text-warning/30 mb-4" />
              <h3 className="text-lg font-bold text-warning mb-2">Telugu Version Not Available</h3>
              <p className="text-text-hint text-sm font-medium max-w-sm">
                This question has not been translated into Telugu yet. Switch to Edit mode to add the translation.
              </p>
            </div>
          ) : (
            <>
              {/* Telugu Section Header / Toggle */}
              <button
                type="button"
                onClick={() => !isReadOnly && setShowTelugu(p => !p)}
                aria-expanded={showTelugu}
                aria-controls="telugu-section"
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  hasTE
                    ? 'border-warning/30 bg-warning/5 hover:bg-warning/10'
                    : 'border-border-subtle/40 bg-hover-bg/20 hover:bg-hover-bg/40'
                } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
              >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center">
                <span className="text-[13px]">🇮🇳</span>
              </div>
              <div className="text-left">
                <p className="text-[11px] font-semibold text-text-primary uppercase tracking-widest">Telugu</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasTE ? (
                  <span className="px-2.5 py-1 rounded-full bg-warning/20 text-warning text-[9px] font-semibold uppercase tracking-widest border border-warning/30 flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" />
                  Translated
                </span>
              ) : (
                  <Badge variant="default" size="sm">Not Translated</Badge>
              )}
              {!isReadOnly && (
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${showTelugu ? 'rotate-180' : ''}`} />
              )}
            </div>
          </button>

          {/* Telugu Fields (Collapsible) */}
          {(showTelugu || (isReadOnly && hasTE)) && (
            <div id="telugu-section" className="mt-4 space-y-6 p-4 rounded-2xl border border-warning/20 bg-warning/5">

              {/* Telugu Question Text */}
              <div className="space-y-3">
                <SectionLabel icon={HelpCircle} color="text-warning">Question Statement (Telugu)</SectionLabel>
                {isReadOnly ? (
                  <div className="space-y-4">
                    <div className="bg-app-bg/50 border border-warning/20 p-6 rounded-3xl text-text-primary text-base font-bold leading-relaxed shadow-inner">
                      {formData.question_text_te || <span className="text-text-hint italic text-sm">No Telugu translation</span>}
                    </div>
                    {formData.visual && <QuestionVisualizer visual={formData.visual} />}
                  </div>
                ) : (
                  <TextArea
                    value={formData.question_text_te || ''}
                    onChange={(e) => setFormData({ ...formData, question_text_te: e.target.value || null })}
                    placeholder="ప్రశ్న పాఠ్యాన్ని ఇక్కడ నమోదు చేయండి... (Enter question in Telugu)"
                  />
                )}
              </div>

              {/* Telugu Options */}
              <div className="space-y-4">
                <SectionLabel icon={ChevronRight} color="text-warning">Answer Choices (Telugu)</SectionLabel>
                <div className={`grid grid-cols-1 ${isReadOnly ? 'gap-3' : 'sm:grid-cols-2 gap-4'}`}>
                  {(['A', 'B', 'C', 'D'] as const).map(opt => {
                    const teKey = `option_${opt.toLowerCase()}_te` as keyof Question
                    const isCorrect = formData.correct_option === opt
                    const value = (formData[teKey] as string) || ''

                    if (isReadOnly) {
                      return (
                        <div key={opt} className={`flex items-center gap-4 p-4 rounded-2xl border ${
                          isCorrect ? 'bg-success/5 border-success/30' : 'bg-app-bg/30 border-warning/20'
                        }`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                            isCorrect ? 'bg-success text-white' : 'bg-warning/20 text-warning border border-warning/30'
                          }`}>{opt}</div>
                          <span className={`text-sm font-medium flex-1 ${isCorrect ? 'text-success' : 'text-text-primary'}`}>
                            {value || <span className="text-text-hint italic text-xs">No Telugu text</span>}
                          </span>
                        </div>
                      )
                    }

                    return (
                      <div key={opt} className={`relative p-1 rounded-2xl border transition-all ${isCorrect ? 'border-success/50' : 'border-warning/20'}`}>
                          <div className={`absolute top-3 left-3 w-7 h-7 flex items-center justify-center rounded-lg font-bold text-xs ${
                          isCorrect ? 'bg-success text-white' : 'bg-warning/20 text-warning border border-warning/30'
                        }`}>{opt}</div>
                          <TextArea
                            value={value}
                            onChange={(e) => setFormData({ ...formData, [teKey]: e.target.value || null })}
                            placeholder={`Telugu text for Option ${opt}... (ఐచ్ఛికం)`}
                          />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Telugu Explanation */}
              <div className="space-y-3">
                <SectionLabel icon={Info} color="text-warning">Explanation (Telugu)</SectionLabel>
                {isReadOnly ? (
                  <div className="bg-warning/5 border border-warning/20 p-6 rounded-3xl">
                    <p className="text-text-primary text-sm font-medium leading-relaxed italic opacity-80">
                      {formData.explanation_te || 'No Telugu explanation provided.'}
                    </p>
                  </div>
                ) : (
                  <TextArea
                    value={formData.explanation_te || ''}
                    onChange={(e) => setFormData({ ...formData, explanation_te: e.target.value || null })}
                    placeholder="వివరణను Telugu లో నమోదు చేయండి... (Optional)"
                  />
                )}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
