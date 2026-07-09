import React, { useState } from 'react'
import { ChevronRight, HelpCircle, Code, CheckCircle2, Info, ChevronDown, Globe } from 'lucide-react'
import { Input, Button } from '../../common/AntigravityUI'
import { QuestionVisualizer } from '../../common/QuestionVisualizer'
import { DifficultyBadge } from '../common/DifficultyBadge'
import type { Question } from '../../../types/exam.types'

interface QuestionFormProps {
  formData: Partial<Question>
  setFormData: (data: Partial<Question>) => void
  isReadOnly?: boolean
  displayLang?: 'en' | 'te'
}

// ─── Shared Textarea Styles ───────────────────────────────────────────────────
const textareaClass = "w-full bg-app-bg text-text-primary p-5 rounded-3xl border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary min-h-[140px] text-base outline-none transition-all resize-y font-medium shadow-inner"
const teTextareaClass = "w-full bg-app-bg text-text-primary p-5 rounded-3xl border border-border-subtle focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 min-h-[120px] text-base outline-none transition-all resize-y font-medium shadow-inner"

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ icon: Icon, children, color = 'text-primary' }: { icon: React.ElementType, children: React.ReactNode, color?: string }) {
  return (
    <span className="flex items-center gap-2 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">
      <Icon className={`w-3 h-3 ${color}`} />
      {children}
    </span>
  )
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  formData,
  setFormData,
  isReadOnly = false,
  displayLang = 'en'
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
        <div className="space-y-6 sm:space-y-8 pb-6 border-b border-border-subtle/40 animate-in fade-in slide-in-from-top-2 duration-500">

          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-[13px]">🇬🇧</span>
              </div>
              <div>
                <p className="text-[11px] font-black text-text-primary uppercase tracking-widest">English</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">Required</span>
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
                <textarea
                  value={formData.question_text_en || ''}
                  onChange={(e) => setFormData({ ...formData, question_text_en: e.target.value })}
                  className={textareaClass}
                  placeholder="Enter the main question context here..."
                />

                {/* Visual Metadata Editor */}
                <div className="bg-app-bg p-4 rounded-2xl border border-border-subtle">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-wider flex items-center gap-2">
                      <Code className="w-3 h-3" />
                      Visual Diagram Metadata (JSON)
                    </label>
                    {formData.visual && (
                      <span className="text-[9px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase">
                        {formData.visual.type} Active
                      </span>
                    )}
                  </div>
                  <textarea
                    value={formData.visual ? JSON.stringify(formData.visual, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const val = e.target.value.trim() === '' ? null : JSON.parse(e.target.value)
                        setFormData({ ...formData, visual: val })
                      } catch (err) {
                        // Just let them type
                      }
                    }}
                    className="w-full bg-slate-950 font-mono text-[10px] text-green-400 p-4 rounded-xl border border-border-subtle focus:border-secondary outline-none min-h-[80px]"
                    placeholder='{"type": "geometry", "data": { ... }}'
                  />
                  <p className="mt-2 text-[9px] text-text-muted italic">Format: geometry | chart | venn | table</p>
                </div>

                {formData.visual && (
                  <div className="p-4 border border-dashed border-border-subtle rounded-2xl opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                    <p className="text-[9px] font-black text-text-secondary uppercase mb-2 text-center">Visual Preview</p>
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
                      isCorrect ? 'bg-green-500/5 border-green-500/30' : 'bg-app-bg/30 border-border-subtle/40'
                    }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 font-black text-sm transition-colors ${
                        isCorrect ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20' : 'bg-hover-bg border-border-subtle text-text-secondary'
                      }`}>
                        {opt}
                      </div>
                      <div className={`text-sm sm:text-base font-bold flex-1 ${isCorrect ? 'text-green-500' : 'text-text-primary'}`}>
                        {value || '---'}
                      </div>
                      {isCorrect && (
                        <div className="px-3 py-1 bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-green-500/20">
                          Correct Answer
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <div key={opt} className={`relative p-1 rounded-2xl border transition-all ${isCorrect ? 'border-green-500 bg-green-500/5 shadow-lg shadow-green-500/5' : 'border-border-subtle'}`}>
                    <div className={`absolute top-3 left-3 w-7 h-7 flex items-center justify-center rounded-lg font-black text-xs transition-colors ${
                      isCorrect ? 'bg-green-500 text-white' : 'bg-hover-bg text-text-secondary border border-border-subtle'
                    }`}>
                      {opt}
                    </div>
                    {isCorrect && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-green-500 animate-in zoom-in duration-300" />}
                    <textarea
                      value={value}
                      onChange={(e) => setFormData({ ...formData, [enKey]: e.target.value })}
                      className="w-full bg-transparent text-text-primary text-sm font-bold pt-12 pb-4 px-4 rounded-2xl focus:outline-none min-h-[100px] resize-none"
                      placeholder={`English text for Option ${opt}...`}
                    />
                    {!isCorrect && (
                      <Button
                        variant="secondary"
                        aria-label={`Mark option ${opt} as correct`}
                        onClick={() => setFormData({ ...formData, correct_option: opt })}
                        className="absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-green-500 px-2 py-1 bg-app-bg rounded-lg border border-border-subtle hover:border-green-500 transition-colors !h-auto !px-2 !py-1 !rounded-lg !shadow-none"
                      >
                        Correct?
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Metadata Row */}
          <div className={`grid grid-cols-2 gap-6 ${isReadOnly ? 'bg-hover-bg/30 p-4 rounded-2xl border border-border-subtle/30' : ''}`}>
            <div>
              <label className="block text-[10px] font-black text-text-secondary mb-2 uppercase tracking-[0.2em]">Difficulty Level</label>
              {isReadOnly ? (
                <DifficultyBadge difficulty={formData.difficulty || 'medium'} />
              ) : (
                <div className="flex gap-1.5 p-1 bg-card-bg rounded-xl border border-border-subtle" role="radiogroup" aria-label="Difficulty Level">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <Button
                      key={d}
                      role="radio"
                      aria-checked={formData.difficulty === d}
                      variant="secondary"
                      onClick={() => setFormData({ ...formData, difficulty: d })}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all !h-auto !px-0 !border-none !shadow-none ${
                        formData.difficulty === d
                          ? d === 'easy' ? '!bg-green-500 text-white' : d === 'medium' ? '!bg-amber-500 text-white' : '!bg-red-500 text-white'
                          : 'text-text-muted hover:text-text-primary !bg-transparent'
                      }`}
                    >
                      {d}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-secondary mb-2 uppercase tracking-[0.2em]">Negative Marking</label>
              {isReadOnly ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-text-primary">-{formData.negative_marks || 0}</span>
                  <span className="text-[10px] font-bold text-text-muted uppercase">Points</span>
                </div>
              ) : (
                <Input
                  type="number"
                  step="0.01"
                  value={formData.negative_marks || 0}
                  onChange={(e) => setFormData({ ...formData, negative_marks: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-app-bg text-text-primary p-3.5 rounded-2xl border border-border-subtle focus:border-primary outline-none font-black text-xs sm:text-sm shadow-inner !h-auto"
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
              <textarea
                value={formData.explanation_en || ''}
                onChange={(e) => setFormData({ ...formData, explanation_en: e.target.value })}
                className="w-full bg-app-bg text-text-primary p-5 rounded-3xl border border-border-subtle focus:border-secondary min-h-[120px] text-sm sm:text-base outline-none transition-all resize-y font-medium shadow-inner"
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
        <div className={`pt-4 ${isReadOnly ? 'animate-in fade-in slide-in-from-top-2 duration-500' : ''}`}>

          {isReadOnly && !hasTE ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-amber-400/30 rounded-3xl bg-amber-400/5 mt-4">
              <Globe className="w-12 h-12 text-amber-500/30 mb-4" />
              <h3 className="text-lg font-black text-amber-500 mb-2">Telugu Version Not Available</h3>
              <p className="text-text-muted text-sm font-medium max-w-sm">
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
                    ? 'border-amber-400/30 bg-amber-400/5 hover:bg-amber-400/10'
                    : 'border-border-subtle/40 bg-hover-bg/20 hover:bg-hover-bg/40'
                } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
              >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center justify-center">
                <span className="text-[13px]">🇮🇳</span>
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-text-primary uppercase tracking-widest">Telugu</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasTE ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-400/30 flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" />
                  Translated
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-border-subtle/30 text-text-muted text-[9px] font-black uppercase tracking-widest border border-border-subtle/30">
                  Not Translated
                </span>
              )}
              {!isReadOnly && (
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${showTelugu ? 'rotate-180' : ''}`} />
              )}
            </div>
          </button>

          {/* Telugu Fields (Collapsible) */}
          {(showTelugu || (isReadOnly && hasTE)) && (
            <div id="telugu-section" className="mt-4 space-y-6 p-4 rounded-2xl border border-amber-400/20 bg-amber-400/5">

              {/* Telugu Question Text */}
              <div className="space-y-3">
                <SectionLabel icon={HelpCircle} color="text-amber-500">Question Statement (Telugu)</SectionLabel>
                {isReadOnly ? (
                  <div className="space-y-4">
                    <div className="bg-app-bg/50 border border-amber-400/20 p-6 rounded-3xl text-text-primary text-base font-bold leading-relaxed shadow-inner">
                      {formData.question_text_te || <span className="text-text-muted italic text-sm">No Telugu translation</span>}
                    </div>
                    {formData.visual && <QuestionVisualizer visual={formData.visual} />}
                  </div>
                ) : (
                  <textarea
                    value={formData.question_text_te || ''}
                    onChange={(e) => setFormData({ ...formData, question_text_te: e.target.value || null })}
                    className={teTextareaClass}
                    placeholder="ప్రశ్న పాఠ్యాన్ని ఇక్కడ నమోదు చేయండి... (Enter question in Telugu)"
                  />
                )}
              </div>

              {/* Telugu Options */}
              <div className="space-y-4">
                <SectionLabel icon={ChevronRight} color="text-amber-500">Answer Choices (Telugu)</SectionLabel>
                <div className={`grid grid-cols-1 ${isReadOnly ? 'gap-3' : 'sm:grid-cols-2 gap-4'}`}>
                  {(['A', 'B', 'C', 'D'] as const).map(opt => {
                    const teKey = `option_${opt.toLowerCase()}_te` as keyof Question
                    const isCorrect = formData.correct_option === opt
                    const value = (formData[teKey] as string) || ''

                    if (isReadOnly) {
                      return (
                        <div key={opt} className={`flex items-center gap-4 p-4 rounded-2xl border ${
                          isCorrect ? 'bg-green-500/5 border-green-500/30' : 'bg-app-bg/30 border-amber-400/20'
                        }`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-xs ${
                            isCorrect ? 'bg-green-500 text-white' : 'bg-amber-400/20 text-amber-600 border border-amber-400/30'
                          }`}>{opt}</div>
                          <span className={`text-sm font-medium flex-1 ${isCorrect ? 'text-green-500' : 'text-text-primary'}`}>
                            {value || <span className="text-text-muted italic text-xs">No Telugu text</span>}
                          </span>
                        </div>
                      )
                    }

                    return (
                      <div key={opt} className={`relative p-1 rounded-2xl border transition-all ${isCorrect ? 'border-green-500/50' : 'border-amber-400/20'}`}>
                        <div className={`absolute top-3 left-3 w-7 h-7 flex items-center justify-center rounded-lg font-black text-xs ${
                          isCorrect ? 'bg-green-500 text-white' : 'bg-amber-400/20 text-amber-600 border border-amber-400/30'
                        }`}>{opt}</div>
                        <textarea
                          value={value}
                          onChange={(e) => setFormData({ ...formData, [teKey]: e.target.value || null })}
                          className="w-full bg-transparent text-text-primary text-sm font-medium pt-12 pb-4 px-4 rounded-2xl focus:outline-none min-h-[90px] resize-none placeholder:text-text-muted"
                          placeholder={`Telugu text for Option ${opt}... (ఐచ్ఛికం)`}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Telugu Explanation */}
              <div className="space-y-3">
                <SectionLabel icon={Info} color="text-amber-500">Explanation (Telugu)</SectionLabel>
                {isReadOnly ? (
                  <div className="bg-amber-400/5 border border-amber-400/20 p-6 rounded-3xl">
                    <p className="text-text-primary text-sm font-medium leading-relaxed italic opacity-80">
                      {formData.explanation_te || 'No Telugu explanation provided.'}
                    </p>
                  </div>
                ) : (
                  <textarea
                    value={formData.explanation_te || ''}
                    onChange={(e) => setFormData({ ...formData, explanation_te: e.target.value || null })}
                    className="w-full bg-app-bg text-text-primary p-5 rounded-3xl border border-amber-400/20 focus:border-amber-400 min-h-[100px] text-sm outline-none transition-all resize-y font-medium shadow-inner"
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
