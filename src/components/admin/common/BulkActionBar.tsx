import { useTheme } from '../../../context/ThemeContext'
import { Stack, Button } from '../../common/AntigravityUI'
import { Trash2 } from 'lucide-react'
import { AdminText } from './AdminText'

interface BulkActionBarProps {
  selectedCount: number
  onDelete: () => void
  onCancel: () => void
}

export function BulkActionBar({ selectedCount, onDelete, onCancel }: BulkActionBarProps) {
  const { isDark } = useTheme()

  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-6 w-[95vw] max-w-max">
      <div className={`
        ${!isDark ? 'ancient-card border-[var(--ancient-gold)]/40 bg-[var(--ancient-cream)]' : 'bg-slate-900 border-white/10'} 
        border rounded-3xl px-4 sm:px-8 py-3 sm:py-4 shadow-2xl flex items-center gap-3 sm:gap-8 backdrop-blur-xl w-full
      `}>
        <Stack gap="xs">
          <AdminText variant="cinzel" className="text-sm font-black">{selectedCount} Selected</AdminText>
          <span className={`hidden sm:block text-[9px] font-bold uppercase tracking-widest ${!isDark ? 'text-[var(--ancient-brown)] opacity-60' : 'text-white/40'}`}>
            Questions queued
          </span>
        </Stack>
        <div className={`h-8 sm:h-10 w-px ${!isDark ? 'bg-[var(--ancient-gold)]/20' : 'bg-white/10'}`} />
        <Button variant="danger" onClick={onDelete} className="!h-9 sm:!h-10 px-4 sm:px-6 text-xs sm:text-sm">
          <Trash2 size={16} className="mr-1.5 sm:mr-2" /> Delete
        </Button>
        <Button variant="secondary" onClick={onCancel} className={`!bg-transparent !border-none !h-9 sm:!h-10 text-xs sm:text-sm ${!isDark ? '!text-[var(--ancient-brown)] hover:!text-[var(--ancient-brown-deep)]' : '!text-white/40 hover:!text-white'}`}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
