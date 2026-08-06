import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, FileText, Settings2, BarChart3, CalendarDays, Clock } from 'lucide-react'
import { Button } from '../../common/AntigravityUI'
import { CompactDateTimePicker } from './CompactDateTimePicker'
import { getLocalISOTime, getTypo } from './types'
import { examConfigSchema } from '../../../validations/securitySchemas'
import type { ExamConfig } from './types'

type SetupField = 'title' | 'start_time' | 'end_time' | 'duration_minutes' | 'marks_per_question' | 'negative_mark_value'
type SetupFieldErrors = Partial<Record<SetupField, string>>

interface CreateStepSetupProps {
  examConfig: ExamConfig
  setExamConfig: (v: ExamConfig) => void
  onConfirm: () => void
  onBack: () => void
  breakpoint: string
}

export function CreateStepSetup({ examConfig, setExamConfig, onConfirm, onBack, breakpoint }: CreateStepSetupProps) {
  const [fieldErrors, setFieldErrors] = useState<SetupFieldErrors>({})
  const submittedRef = useRef(false)

  const runValidation = () => {
    const result = examConfigSchema.safeParse(examConfig)
    const nextErrors: SetupFieldErrors = {}
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as SetupField | undefined
        if (field) nextErrors[field] = issue.message
      })
    }
    return { result, fieldErrors: nextErrors }
  }

  const handleValidateAndNext = () => {
    submittedRef.current = true
    const { result, fieldErrors } = runValidation()
    setFieldErrors(fieldErrors)
    if (result.success) onConfirm()
  }

  const handleFieldBlur = (field: SetupField) => {
    if (!submittedRef.current) return
    const { fieldErrors } = runValidation()
    setFieldErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
  }

  const updateField = (field: SetupField, value: ExamConfig[SetupField]) => {
    setExamConfig({ ...examConfig, [field]: value })
    setFieldErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const typo = (element: string) => getTypo(breakpoint, element)
  const errorId = (field: string) => `${field}-error`

  const errorSpan = (id: string, message?: string) =>
    message ? (
      <span id={`${id}-error`} aria-live="polite" className="text-xs font-bold text-danger mt-1 block">{message}</span>
    ) : null

  return (
    <div className="space-y-6">
      <div className="bg-card-bg border border-border-subtle/20 rounded-2xl p-5">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="exam-title" className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5 opacity-70">
              <FileText size={11} /> Exam Title
            </label>
            <input
              id="exam-title"
              type="text"
              value={examConfig.title}
              onChange={(e) => updateField('title', e.target.value)}
              onBlur={() => handleFieldBlur('title')}
              aria-invalid={!!fieldErrors.title}
              aria-describedby={fieldErrors.title ? errorId('exam-title') : undefined}
              placeholder="e.g. APPSC Group 1 Mock Test — Paper I"
              className="w-full bg-hover-bg/60 border-2 border-border-subtle/20 rounded-xl px-4 py-3.5 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-text-primary placeholder:text-text-secondary/30"
              style={{ fontSize: typo('body') }}
            />
            {errorSpan('exam-title', fieldErrors.title)}
          </div>

          <div className="space-y-2">
            <label htmlFor="exam-duration" className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5 opacity-70">
              <Clock size={11} /> Duration (Minutes)
            </label>
            <div className="relative">
              <Settings2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" />
              <input
                id="exam-duration"
                type="number"
                value={examConfig.duration_minutes}
                onChange={(e) => updateField('duration_minutes', parseInt(e.target.value) || 0)}
                onBlur={() => handleFieldBlur('duration_minutes')}
                aria-invalid={!!fieldErrors.duration_minutes}
                aria-describedby={fieldErrors.duration_minutes ? errorId('exam-duration') : undefined}
                className="w-full bg-hover-bg/60 border-2 border-border-subtle/20 rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-text-primary"
                style={{ fontSize: typo('body') }}
              />
            </div>
            {errorSpan('exam-duration', fieldErrors.duration_minutes)}
          </div>

          <div className="space-y-2">
            <label htmlFor="exam-marks" className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5 opacity-70">
              <BarChart3 size={11} /> Marks / Question
            </label>
            <div className="relative">
              <BarChart3 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" />
              <input
                id="exam-marks"
                type="number"
                value={examConfig.marks_per_question}
                onChange={(e) => updateField('marks_per_question', parseFloat(e.target.value) || 1)}
                onBlur={() => handleFieldBlur('marks_per_question')}
                aria-invalid={!!fieldErrors.marks_per_question}
                aria-describedby={fieldErrors.marks_per_question ? errorId('exam-marks') : undefined}
                className="w-full bg-hover-bg/60 border-2 border-border-subtle/20 rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-text-primary"
                style={{ fontSize: typo('body') }}
                step="0.25"
                min="0.25"
              />
            </div>
            {errorSpan('exam-marks', fieldErrors.marks_per_question)}
          </div>

          <div className="space-y-2">
            <label htmlFor="exam-negative" className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5 opacity-70">
              <BarChart3 size={11} /> Negative Mark
            </label>
            <div className="relative">
              <BarChart3 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" />
              <input
                id="exam-negative"
                type="number"
                value={examConfig.negative_mark_value}
                onChange={(e) => updateField('negative_mark_value', parseInt(e.target.value) || 0)}
                onBlur={() => handleFieldBlur('negative_mark_value')}
                aria-invalid={!!fieldErrors.negative_mark_value}
                aria-describedby={fieldErrors.negative_mark_value ? errorId('exam-negative') : undefined}
                className="w-full bg-hover-bg/60 border-2 border-border-subtle/20 rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-text-primary"
                style={{ fontSize: typo('body') }}
                min="0"
              />
            </div>
            {errorSpan('exam-negative', fieldErrors.negative_mark_value)}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="exam-start" className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5 opacity-70">
              <CalendarDays size={11} /> Start Date & Time
            </label>
            <CompactDateTimePicker
              id="exam-start"
              minStr={getLocalISOTime()}
              value={examConfig.start_time}
              onChange={(v) => updateField('start_time', v)}
              getTypo={(element) => getTypo(breakpoint, element)}
            />
            {errorSpan('exam-start', fieldErrors.start_time)}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="exam-end" className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5 opacity-70">
              <CalendarDays size={11} /> End Date & Time
            </label>
            <CompactDateTimePicker
              id="exam-end"
              minStr={getLocalISOTime()}
              value={examConfig.end_time}
              onChange={(v) => updateField('end_time', v)}
              getTypo={(element) => getTypo(breakpoint, element)}
            />
            {errorSpan('exam-end', fieldErrors.end_time)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button variant="secondary" onClick={onBack}>
          <ChevronLeft size={16} /> Back
        </Button>
        <Button onClick={handleValidateAndNext}>
          Final Review <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
