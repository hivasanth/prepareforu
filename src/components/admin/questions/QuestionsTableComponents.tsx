import { PenSquare, Eye, Trash2 } from 'lucide-react'
import type { Question } from '../../../types/exam.types'
import { IconButton } from '../../common/AntigravityUI'
import { DifficultyBadge } from '../common/DifficultyBadge'

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

export function SrNumber({ num, isDark }: { num: number; isDark: boolean }) {
  return (
    <span className={`text-[10px] font-black ${!isDark ? 'text-[var(--ancient-forest)] opacity-80' : 'text-text-secondary opacity-40'}`}>
      {num}
    </span>
  )
}

export function QuestionCell({ text, isDark }: { text: string; isDark: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!isDark ? 'ancient-icon-badge !bg-transparent border-primary/20' : 'bg-primary/10'}`}>
         <span className="text-xs font-black text-primary">Q</span>
      </div>
      <div className={`line-clamp-2 text-sm font-medium ${!isDark ? 'font-garamond text-base text-[var(--ancient-brown-deep)]' : 'text-text-primary'}`} title={text}>
        {text || 'Untitled Question'}
      </div>
    </div>
  )
}

export function SubjectBadge({ subject, isDark }: { subject: string; isDark: boolean }) {
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight whitespace-nowrap border ${
      !isDark
        ? 'bg-primary/5 text-primary border-primary/20'
        : 'bg-secondary/10 text-secondary border-secondary/20'
    }`}>
      {subject || 'N/A'}
    </span>
  )
}

export function ActionsCell({ q, isDark, onView, onEdit, onDelete }: { q: Question; isDark: boolean; onView: (q: Question) => void; onEdit: (q: Question) => void; onDelete: (q: Question) => void }) {
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
        className={`p-2 bg-app-bg border border-border-subtle hover:border-danger hover:text-danger hover:bg-danger/5 rounded-xl transition-colors !w-auto !h-auto ${!isDark ? 'text-danger' : 'text-text-secondary'}`}
        title="Delete Question"
      >
        <Trash2 className="w-4 h-4" />
      </IconButton>
    </div>
  )
}
