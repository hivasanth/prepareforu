import { useTheme } from '../../../context/ThemeContext'
import { Stack, Button } from '../../common/AntigravityUI'
import { Trash2 } from 'lucide-react'
import { AdminText } from '../../common/AdminText'

interface BulkActionBarProps {
  selectedCount: number
  onDelete: () => void
  onCancel: () => void
}

export function BulkActionBar({ selectedCount, onDelete, onCancel }: BulkActionBarProps) {
  const { isDark } = useTheme()

  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in w-[95vw] max-w-max">
      <div className={`
        ${!isDark ? 'bg-[var(--management-surface)] border-border-subtle' : 'bg-card-bg border-border-subtle'} 
        border rounded-3xl px-4 sm:px-8 py-3 sm:py-4 shadow-2xl flex items-center gap-3 sm:gap-8 backdrop-blur-xl w-full
      `}>
        <Stack gap="xs">
          <AdminText variant="cinzel" className="text-sm font-bold">{selectedCount} Selected</AdminText>
          <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest text-text-muted">
            Questions queued
          </span>
        </Stack>
        <div className="h-8 sm:h-10 w-px bg-border-subtle" />
        <Button variant="danger" onClick={onDelete} className="!h-9 sm:!h-10 px-4 sm:px-6 text-xs sm:text-sm">
          <Trash2 size={16} className="mr-1.5 sm:mr-2" /> Delete
        </Button>
        <Button variant="secondary" onClick={onCancel} className="!bg-transparent !border-none !h-9 sm:!h-10 text-xs sm:text-sm !text-text-secondary hover:!text-text-primary">
          Cancel
        </Button>
      </div>
    </div>
  )
}
