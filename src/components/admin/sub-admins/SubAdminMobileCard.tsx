import { IconButton, Badge } from '../../common/AntigravityUI'
import { Trash2 } from 'lucide-react'
import { formatDate } from '../../../utils/dateUtils'
import type { SubAdminRow } from '../../../types/subAdmin.types'

interface SubAdminMobileCardProps {
  sa: SubAdminRow
  onRemove: (sa: SubAdminRow) => void
  removingSa: string | null
  isDark: boolean
}

export function SubAdminMobileCard({ sa, onRemove, removingSa, isDark }: SubAdminMobileCardProps) {
  return (
    <div className={`rounded-2xl p-4 space-y-3 border ${!isDark ? 'bg-[var(--ancient-cream)] border-[var(--ancient-gold)]/20' : 'bg-card-bg border-border-subtle/80'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-black text-sm ${!isDark ? 'bg-[var(--ancient-gold)] text-white' : 'bg-primary/10 text-primary'}`}>
            {sa.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className={`font-black text-sm uppercase tracking-tight truncate ${!isDark ? 'text-[var(--ancient-brown-deep)] font-garamond' : 'text-text-primary'}`}>{sa.full_name}</p>
            <p className="text-xs text-text-secondary truncate">{sa.email}</p>
          </div>
        </div>
        <IconButton
          className={!isDark ? 'text-[var(--ancient-danger)] hover:bg-[var(--ancient-danger-hover)] shrink-0' : 'text-danger hover:bg-danger/10'}
          onClick={() => onRemove(sa)}
          disabled={removingSa === sa.id}
        >
          <Trash2 size={16} />
        </IconButton>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">Coupon:</span>
        <Badge variant="primary" className={!isDark ? '!bg-[var(--ancient-badge-bg)] !text-[var(--ancient-brown)] !border-[var(--ancient-badge-border)] shadow-sm' : ''}>{sa.coupon_code}</Badge>
      </div>
      <div className="pt-2 border-t border-border-subtle/20">
        <span className="text-xs text-text-secondary">Joined {formatDate(sa.created_at)}</span>
      </div>
    </div>
  )
}
