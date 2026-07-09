import { PenSquare, Eye, Trash2 } from 'lucide-react'
import type { Question } from '../../../types/exam.types'
import { IconButton } from '../../common/AntigravityUI'

export function SelectionCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary bg-app-bg cursor-pointer"
    />
  )
}

export function SrNumber({ num }: { num: number }) {
  return (
    <span className="text-[10px] font-black text-text-secondary opacity-40">
      {num}
    </span>
  )
}

export function QuestionCell({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
         <span className="text-xs font-black text-primary">Q</span>
      </div>
      <div className="line-clamp-2 text-sm font-medium text-text-primary" title={text}>
        {text || 'Untitled Question'}
      </div>
    </div>
  )
}

export function SubjectBadge({ subject }: { subject: string | { subject_name: string } }) {
  const display = typeof subject === 'string' ? subject : subject?.subject_name ?? 'N/A';
  return (
    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight whitespace-nowrap border bg-secondary/10 text-secondary border-secondary/20">
      {display}
    </span>
  )
}

export function ActionsCell({ q, onView, onEdit, onDelete }: { q: Question; onView: (q: Question) => void; onEdit: (q: Question) => void; onDelete: (q: Question) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 opacity-100 transition-opacity">
      <IconButton
        onClick={() => onView(q)}
        size="sm"
        className="p-2 bg-app-bg border border-border-subtle hover:border-primary hover:text-primary rounded-xl text-text-secondary transition-colors !w-auto !h-auto"
        title="View Question"
      >
        <Eye className="w-4 h-4" />
      </IconButton>
      <IconButton
        onClick={() => onEdit(q)}
        size="sm"
        className="p-2 bg-app-bg border border-border-subtle hover:border-secondary hover:text-secondary rounded-xl text-text-secondary transition-colors !w-auto !h-auto"
        title="Edit Question"
      >
        <PenSquare className="w-4 h-4" />
      </IconButton>
      <IconButton
        onClick={() => onDelete(q)}
        size="sm"
        className="p-2 bg-app-bg border border-border-subtle hover:border-danger hover:text-danger hover:bg-danger/5 rounded-xl transition-colors !w-auto !h-auto text-text-secondary"
        title="Delete Question"
      >
        <Trash2 className="w-4 h-4" />
      </IconButton>
    </div>
  )
}
