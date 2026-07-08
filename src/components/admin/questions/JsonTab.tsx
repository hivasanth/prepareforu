import { AlertTriangle } from 'lucide-react'
import { Button } from '../../common/AntigravityUI'

interface JsonTabProps {
  jsonText: string
  onJsonChange: (text: string) => void
  errors: { row: number; message: string }[]
  isUploading: boolean
  onValidate: () => void
  onSkipRow: (row: number) => void
}

export function JsonTab({ jsonText, onJsonChange, errors, isUploading, onValidate, onSkipRow }: JsonTabProps) {
  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
      <div className="relative group">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <div className="px-3 py-1 bg-card-bg/90 backdrop-blur-md rounded-lg border border-border-subtle text-[10px] font-mono text-text-secondary">
            application/json
          </div>
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => onJsonChange(e.target.value)}
          className="w-full h-[350px] bg-card-bg text-text-primary font-mono text-xs p-6 rounded-3xl border-2 border-border-subtle focus:border-primary outline-none transition-all shadow-2xl"
          placeholder='[ { "question": "...", "options": [...], "correct": "A" } ]'
        />
      </div>

      {errors.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-3 animate-in shake duration-500" role="alert">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider">Validation Errors</span>
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
            {errors.map((err, i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-2 bg-red-500/5 rounded-xl border border-red-500/10">
                <p className="text-[11px] text-red-500/80 font-bold flex items-start gap-2">
                   <span className="opacity-40">→</span> {err.message}
                </p>
                {err.row > 0 && (
                  <button
                    onClick={() => onSkipRow(err.row)}
                    className="shrink-0 px-3 py-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                  >
                    Skip Row
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        id="validate-btn"
        onClick={onValidate}
        disabled={!jsonText.trim() || isUploading}
        className="w-full py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all !h-auto"
      >
        Validate Questions
      </Button>
    </div>
  )
}
