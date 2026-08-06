import { memo } from 'react'
import { PenSquare, Eye, Trash2 } from 'lucide-react'
import { IconButton } from '../../common/AntigravityUI'
import type { Question } from '../../../types/exam.types'

export const ActionsCell = memo(function ActionsCell({ q, onView, onEdit, onDelete }: { q: Question; onView: (q: Question) => void; onEdit: (q: Question) => void; onDelete: (q: Question) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 opacity-100 transition-opacity">
      <IconButton
        type="button"
        variant="ghost"
        size="sm"
        focusRing
        onClick={() => onView(q)}
        aria-label="View question"
        className="!w-8 !h-8 !bg-app-bg !border !border-border-subtle !rounded-xl hover:!bg-app-bg hover:!border-primary hover:!text-primary"
      >
        <Eye className="w-4 h-4" />
      </IconButton>
      <IconButton
        type="button"
        variant="ghost"
        size="sm"
        focusRing
        onClick={() => onEdit(q)}
        aria-label="Edit question"
        className="!w-8 !h-8 !bg-app-bg !border !border-border-subtle !rounded-xl hover:!bg-app-bg hover:!border-secondary hover:!text-secondary"
      >
        <PenSquare className="w-4 h-4" />
      </IconButton>
      <IconButton
        type="button"
        variant="ghost"
        size="sm"
        focusRing
        onClick={() => onDelete(q)}
        aria-label="Delete question"
        className="!w-8 !h-8 !bg-app-bg !border !border-border-subtle !rounded-xl hover:!bg-danger/5 hover:!border-danger hover:!text-danger"
      >
        <Trash2 className="w-4 h-4" />
      </IconButton>
    </div>
  )
})
