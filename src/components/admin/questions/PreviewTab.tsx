import { AlertTriangle, Clock } from 'lucide-react'
import { DifficultyBadge } from '../common/DifficultyBadge'
import type { ParsedDataItem } from '../../../hooks/useBulkUpload'

interface PreviewTabProps {
  parsedData: ParsedDataItem[]
  validationSummary: { total: number; easy: number; medium: number; hard: number } | null
  duplicateCount: number
}

export function PreviewTab({ parsedData, validationSummary, duplicateCount }: PreviewTabProps) {
  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      {validationSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Questions', value: validationSummary.total, color: 'text-primary' },
            { label: 'Easy', value: validationSummary.easy, color: 'text-success' },
            { label: 'Medium', value: validationSummary.medium, color: 'text-warning' },
            { label: 'Hard', value: validationSummary.hard, color: 'text-danger' },
          ].map(stat => (
            <div key={stat.label} className="p-4 rounded-2xl border text-center bg-hover-bg/20 border-border-subtle/30">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {duplicateCount > 0 && (
        <div role="alert" className="p-4 rounded-2xl border flex items-center gap-3 bg-amber-500/5 border-amber-500/20">
          <AlertTriangle size={18} className="text-amber-500 shrink-0" />
          <p className="text-xs font-medium text-text-secondary">
            <span className="font-bold text-amber-600">{duplicateCount}</span> duplicate{duplicateCount > 1 ? 's' : ''} auto-filtered out.
          </p>
        </div>
      )}

      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {parsedData.map((item, i) => (
          <div key={i} className="p-4 rounded-2xl border transition-all bg-hover-bg/20 border-border-subtle/30 hover:border-primary/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <DifficultyBadge difficulty={item.difficulty || 'medium'} />
                <span className="text-warning">
                  <Clock size={14} className="animate-pulse" />
                </span>
              </div>
            </div>
            <p className="text-xs font-medium text-text-primary mt-2 line-clamp-1">{item.question || 'No question text'}</p>
            {item.options && (
              <div className="flex gap-4 mt-1">
                <span className="text-[10px] text-text-secondary truncate">{item.options[0]}</span>
                <span className="text-[10px] text-text-secondary truncate">{item.options[1]}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
