import { memo } from 'react'
import { PenSquare, Eye, Trash2 } from 'lucide-react'
import { IconButton } from '../../common/AntigravityUI'
import type { Question } from '../../../types/exam.types'

export const ActionsCell = memo(function ActionsCell({ q, onView, onEdit, onDelete }: { q: Question; onView: (q: Question) => void; onEdit: (q: Question) => void; onDelete: (q: Question) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 opacity-100 transition-opacity">
      <IconButton
        type="button"
        variant="action"
        intent="view"
        size="sm"
        focusRing
        onClick={() => onView(q)}
        aria-label="View question"
      >
        <Eye className="w-4 h-4" />
      </IconButton>
      <IconButton
        type="button"
        variant="action"
        intent="edit"
        size="sm"
        focusRing
        onClick={() => onEdit(q)}
        aria-label="Edit question"
      >
        <PenSquare className="w-4 h-4" />
      </IconButton>
      <IconButton
        type="button"
        variant="action"
        intent="delete"
        size="sm"
        focusRing
        onClick={() => onDelete(q)}
        aria-label="Delete question"
      >
        <Trash2 className="w-4 h-4" />
      </IconButton>
    </div>
  )
})
