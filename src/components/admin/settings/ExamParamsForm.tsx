import { memo } from 'react'
import { ToggleLeft } from 'lucide-react'
import { Input, Switch, Label, Stack, Grid } from '../../common/AntigravityUI'
import { motion } from 'framer-motion'
import type { ExamConfig } from '../../../types/exam.types'

export type ParamsFieldErrors = Partial<Record<
  'total_questions' | 'total_marks' | 'duration_minutes' | 'negative_mark_value',
  string
>>

interface ExamParamsFormProps {
  config: ExamConfig
  onConfigChange: (config: ExamConfig) => void
  fieldErrors?: ParamsFieldErrors
  onFieldBlur?: (field: keyof ParamsFieldErrors) => void
}

export const ExamParamsForm = memo(function ExamParamsForm({ config, onConfigChange, fieldErrors = {}, onFieldBlur }: ExamParamsFormProps) {
  return (
    <Stack gap="lg">
      <Grid cols={2} gap={16}>
        <Stack gap="sm">
          <Label htmlFor="config-total-questions">Total Questions</Label>
          <Input
            id="config-total-questions"
            type="number"
            value={config.total_questions}
            onChange={(e) => onConfigChange({...config, total_questions: Number(e.target.value)})}
            onBlur={() => onFieldBlur?.('total_questions')}
            aria-invalid={!!fieldErrors.total_questions}
            aria-describedby={fieldErrors.total_questions ? 'config-total-questions-error' : undefined}
          />
          {fieldErrors.total_questions && (
            <span id="config-total-questions-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">{fieldErrors.total_questions}</span>
          )}
        </Stack>
        <Stack gap="sm">
          <Label htmlFor="config-total-marks">Total Marks</Label>
          <Input
            id="config-total-marks"
            type="number"
            value={config.total_marks}
            onChange={(e) => onConfigChange({...config, total_marks: Number(e.target.value)})}
            onBlur={() => onFieldBlur?.('total_marks')}
            aria-invalid={!!fieldErrors.total_marks}
            aria-describedby={fieldErrors.total_marks ? 'config-total-marks-error' : undefined}
          />
          {fieldErrors.total_marks && (
            <span id="config-total-marks-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">{fieldErrors.total_marks}</span>
          )}
        </Stack>
      </Grid>
      <Stack gap="sm">
        <Label htmlFor="config-duration-minutes">Duration (Minutes)</Label>
        <Input
          id="config-duration-minutes"
          type="number"
          value={config.duration_minutes}
          onChange={(e) => onConfigChange({...config, duration_minutes: Number(e.target.value)})}
          onBlur={() => onFieldBlur?.('duration_minutes')}
          aria-invalid={!!fieldErrors.duration_minutes}
          aria-describedby={fieldErrors.duration_minutes ? 'config-duration-minutes-error' : undefined}
        />
        {fieldErrors.duration_minutes && (
          <span id="config-duration-minutes-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">{fieldErrors.duration_minutes}</span>
        )}
      </Stack>

      <Stack gap="sm">
        <Stack direction="row" align="center" gap="sm" className="p-4 bg-hover-bg/30 rounded-2xl border border-border-subtle/50">
          <ToggleLeft size={18} className="text-primary opacity-60" />
          <Switch label={config.is_published ? "Published (Live)" : "Draft (Hidden)"} checked={config.is_published} onChange={(v) => onConfigChange({...config, is_published: v})} />
        </Stack>
      </Stack>

      <Stack gap="md" className="p-4 bg-hover-bg/30 rounded-2xl border border-border-subtle/50">
        <Switch label="Negative Marking" checked={config.negative_marking} onChange={(v) => onConfigChange({...config, negative_marking: v})} />
        {config.negative_marking && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
            <Label htmlFor="config-negative-mark-value">Penalty Value</Label>
            <Input
              id="config-negative-mark-value"
              type="number"
              className="mt-1"
              value={config.negative_mark_value}
              onChange={(e) => onConfigChange({...config, negative_mark_value: Number(e.target.value)})}
              onBlur={() => onFieldBlur?.('negative_mark_value')}
              aria-invalid={!!fieldErrors.negative_mark_value}
              aria-describedby={fieldErrors.negative_mark_value ? 'config-negative-mark-value-error' : undefined}
            />
            {fieldErrors.negative_mark_value && (
              <span id="config-negative-mark-value-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">{fieldErrors.negative_mark_value}</span>
            )}
          </motion.div>
        )}
      </Stack>

      <Stack gap="sm">
        <div className="p-4 bg-hover-bg/30 rounded-2xl border border-border-subtle/50">
          <Switch label="Multiple Attempts" checked={!!config.allow_multiple_attempts} onChange={(v) => onConfigChange({...config, allow_multiple_attempts: v})} />
        </div>
      </Stack>
    </Stack>
  )
})
