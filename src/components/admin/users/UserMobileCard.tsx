import { useTheme } from '../../common/AntigravityUI'
import { Badge, Button } from '../../common/AntigravityUI'
import { formatDate } from '../../../utils/dateUtils'
import type { UserRow } from '../../../types/user.types'

interface UserMobileCardProps {
  user: UserRow
  onToggleStatus: (id: string, currentStatus: boolean) => void
}

export function UserMobileCard({ user, onToggleStatus }: UserMobileCardProps) {
  const { isDark } = useTheme()

  return (
    <div className={`rounded-2xl p-4 space-y-3 border ${!isDark ? 'bg-[var(--ancient-cream)] border-[var(--ancient-gold)]/20' : 'bg-card-bg border-border-subtle/80'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-black text-sm ${!isDark ? 'bg-[var(--ancient-gold)] text-white' : 'bg-primary/10 text-primary'}`}>
            {user.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className={`font-black text-sm uppercase tracking-tight truncate ${!isDark ? 'text-[var(--ancient-brown-deep)] font-garamond' : 'text-text-primary'}`}>{user.full_name || 'Unknown'}</p>
            <p className="text-xs text-text-secondary truncate">{user.email}</p>
          </div>
        </div>
        <Badge variant={user.is_active ? 'success' : 'danger'} className="shrink-0">{user.is_active ? 'Active' : 'Banned'}</Badge>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">Exam: <span className="font-medium text-text-primary capitalize">{user.exam_selection?.replace(/_/g, ' ') || 'None'}</span></span>
        <span className="text-text-secondary">{user.total_exams || 0} attempts</span>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle/20">
        <span className="text-xs text-text-secondary">Joined {formatDate(user.created_at)}</span>
        <Button variant={user.is_active ? 'danger' : 'success'} className="h-8 px-3 text-[10px]" onClick={() => onToggleStatus(user.id, user.is_active)}>
          {user.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </div>
  )
}
