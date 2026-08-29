import { memo } from 'react'
import { BarChart3, Hash } from 'lucide-react'
import { Card, Stack, Input, Switch, Label } from '../../common/AntigravityUI'
import { SectionReveal } from '../../common/AntigravityAnimation'
import { SubjectPieChart } from './SubjectPieChart'
import { SubjectContainerCard } from './SubjectContainerCard'
import type { ExamConfig, ExamSubject, ExamTopicConfig } from '../../../types/exam.types'
import type { ParamsFieldErrors } from './useAdminSettings'

interface ExamModePanelProps {
  config: ExamConfig
  subjects: ExamSubject[]
  topicConfigs: Record<string, ExamTopicConfig[]>
  topicLoading: Record<string, boolean>
  subjectsError?: string | null
  paramsFieldErrors: ParamsFieldErrors
  onConfigChange: (config: ExamConfig) => void
  onQuestionCountChange: (index: number, value: number) => void
  onTopicThresholdChange: (subjectName: string, topicId: string, value: number) => void
  onFieldBlur?: (field: keyof ParamsFieldErrors) => void
  onSubjectBlur?: () => void
}

export const ExamModePanel = memo(function ExamModePanel({
  config, subjects, topicConfigs, topicLoading,
  subjectsError, paramsFieldErrors,
  onConfigChange, onQuestionCountChange, onTopicThresholdChange,
  onFieldBlur, onSubjectBlur,
}: ExamModePanelProps) {
  const subjectSum = subjects.reduce((sum, s) => sum + (Number(s.question_count) || 0), 0)
  const isSubjectSumValid = subjectSum === Number(config.total_questions)

  return (
    <>
      <SectionReveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card variant="default" padding={0} className="overflow-hidden">
            <div className="p-4 border-b border-border-subtle/30 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-text-muted" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Subject Distribution</span>
            </div>
            <div className="p-5">
              <SubjectPieChart data={subjects} />
              <div className="mt-4 space-y-1.5">
                {subjects.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between py-1 border-b border-border-subtle/10 last:border-0">
                    <span className="text-[11px] text-text-primary truncate flex-1">{sub.subject_name}</span>
                    <span className="text-[11px] font-bold text-text-secondary tabular-nums ml-2">{sub.question_count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border-subtle/30 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Paper Total</span>
                <span className={`text-[11px] font-bold tabular-nums ${isSubjectSumValid ? 'text-text-primary' : 'text-danger'}`}>
                  {subjectSum} / {config.total_questions}
                </span>
              </div>
              {subjectsError && (
                <span role="alert" aria-live="polite" className="block text-danger text-[10px] font-bold mt-2">
                  {subjectsError}
                </span>
              )}
            </div>
          </Card>

          <Card variant="default" padding={0} className="overflow-hidden">
            <div className="p-4 border-b border-border-subtle/30 flex items-center gap-2">
              <Hash className="w-4 h-4 text-text-muted" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Paper Details</span>
            </div>
            <div className="p-5">
              <Stack gap="md">
                <Stack gap="xs">
                  <Label htmlFor="cfg-total-q">Total Questions</Label>
                  <Input
                    id="cfg-total-q"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={config.total_questions}
                    onChange={(e) => onConfigChange({ ...config, total_questions: Number(e.target.value) })}
                    onBlur={() => onFieldBlur?.('total_questions')}
                    aria-invalid={!!paramsFieldErrors.total_questions}
                    aria-describedby={paramsFieldErrors.total_questions ? 'cfg-total-q-error' : undefined}
                  />
                  {paramsFieldErrors.total_questions && (
                    <span id="cfg-total-q-error" role="alert" className="text-[10px] text-danger">{paramsFieldErrors.total_questions}</span>
                  )}
                </Stack>
                <Stack gap="xs">
                  <Label htmlFor="cfg-total-m">Total Marks</Label>
                  <Input
                    id="cfg-total-m"
                    type="number"
                    inputMode="decimal"
                    min={1}
                    value={config.total_marks}
                    onChange={(e) => onConfigChange({ ...config, total_marks: Number(e.target.value) })}
                    onBlur={() => onFieldBlur?.('total_marks')}
                    aria-invalid={!!paramsFieldErrors.total_marks}
                    aria-describedby={paramsFieldErrors.total_marks ? 'cfg-total-m-error' : undefined}
                  />
                  {paramsFieldErrors.total_marks && (
                    <span id="cfg-total-m-error" role="alert" className="text-[10px] text-danger">{paramsFieldErrors.total_marks}</span>
                  )}
                </Stack>
                <Stack gap="xs">
                  <Label htmlFor="cfg-duration">Duration (Minutes)</Label>
                  <Input
                    id="cfg-duration"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={config.duration_minutes}
                    onChange={(e) => onConfigChange({ ...config, duration_minutes: Number(e.target.value) })}
                    onBlur={() => onFieldBlur?.('duration_minutes')}
                    aria-invalid={!!paramsFieldErrors.duration_minutes}
                    aria-describedby={paramsFieldErrors.duration_minutes ? 'cfg-duration-error' : undefined}
                  />
                  {paramsFieldErrors.duration_minutes && (
                    <span id="cfg-duration-error" role="alert" className="text-[10px] text-danger">{paramsFieldErrors.duration_minutes}</span>
                  )}
                </Stack>

                <div className="h-px bg-border-subtle/20" />

                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="cfg-published" className="!mb-0">{config.is_published ? "Published (Live)" : "Draft (Hidden)"}</Label>
                  <Switch
                    id="cfg-published"
                    checked={config.is_published}
                    onChange={(v) => onConfigChange({ ...config, is_published: v })}
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="cfg-neg-marking" className="!mb-0">Negative Marking</Label>
                  <Switch
                    id="cfg-neg-marking"
                    checked={config.negative_marking}
                    onChange={(v) => onConfigChange({ ...config, negative_marking: v })}
                  />
                </div>
                {config.negative_marking && (
                  <Stack gap="xs">
                    <Label htmlFor="cfg-neg-val">Penalty Value</Label>
                    <Input
                      id="cfg-neg-val"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      value={config.negative_mark_value}
                      onChange={(e) => onConfigChange({ ...config, negative_mark_value: Number(e.target.value) })}
                      onBlur={() => onFieldBlur?.('negative_mark_value')}
                      aria-invalid={!!paramsFieldErrors.negative_mark_value}
                      aria-describedby={paramsFieldErrors.negative_mark_value ? 'cfg-neg-val-error' : undefined}
                    />
                    {paramsFieldErrors.negative_mark_value && (
                      <span id="cfg-neg-val-error" role="alert" className="text-[10px] text-danger">{paramsFieldErrors.negative_mark_value}</span>
                    )}
                  </Stack>
                )}
                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="cfg-multi" className="!mb-0">Multiple Attempts</Label>
                  <Switch
                    id="cfg-multi"
                    checked={!!config.allow_multiple_attempts}
                    onChange={(v) => onConfigChange({ ...config, allow_multiple_attempts: v })}
                  />
                </div>
              </Stack>
            </div>
          </Card>
        </div>
      </SectionReveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {subjects.map((sub, idx) => (
          <div key={sub.id} id={`subject-${sub.subject_name}`}>
              <SubjectContainerCard
                subject={sub}
                topics={topicConfigs[sub.subject_name] ?? null}
                topicLoading={topicLoading[sub.subject_name] ?? false}
                onTopicThresholdChange={(topicId, value) => onTopicThresholdChange(sub.subject_name, topicId, value)}
                onQuestionCountChange={(value) => onQuestionCountChange(idx, value)}
                onBlur={onSubjectBlur}
              />
          </div>
        ))}
      </div>
    </>
  )
})
