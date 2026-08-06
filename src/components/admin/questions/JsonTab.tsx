import { memo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, Badge, Button, TextArea } from '../../common/AntigravityUI'

interface JsonTabProps {
  jsonText: string
  onJsonChange: (text: string) => void
  errors: { row: number; message: string }[]
  isUploading: boolean
  onValidate: () => void
  onSkipRow: (row: number) => void
}

export const JsonTab = memo(function JsonTab({ jsonText, onJsonChange, errors, isUploading, onValidate, onSkipRow }: JsonTabProps) {
  return (
    <div className="space-y-4 animate-in">
      <div className="relative group">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Badge size="md" className="font-mono">
            application/json
          </Badge>
        </div>
        <TextArea
          aria-label="JSON questions input"
          value={jsonText}
          onChange={(e) => onJsonChange(e.target.value)}
          className="h-[350px] font-mono text-xs"
          placeholder='[ { "question": "...", "options": [...], "correct": "A" } ]'
        />
      </div>

      {errors.length > 0 && (
        <Alert variant="error" icon={AlertTriangle} title="Validation Errors" className="animate-in">
          <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
            {errors.map((err, i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-2 bg-danger/5 rounded-xl border border-danger/10">
                <p className="text-[11px] text-danger/80 font-bold flex items-start gap-2">
                   <span className="opacity-40">→</span> {err.message}
                </p>
                {err.row > 0 && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => onSkipRow(err.row)}
                    className="shrink-0"
                  >
                    Skip Row
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Alert>
      )}

      <Button
        id="validate-btn"
        fullWidth
        onClick={onValidate}
        disabled={!jsonText.trim() || isUploading}
      >
        Validate Questions
      </Button>
    </div>
  )
})
