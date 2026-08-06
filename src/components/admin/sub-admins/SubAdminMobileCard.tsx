import { IconButton, Badge, Card } from '../../common/AntigravityUI'
import { Trash2 } from 'lucide-react'
import { formatDate } from '../../../utils/dateUtils'
import type { SubAdminRow } from '../../../types/subAdmin.types'

interface SubAdminMobileCardProps {
  sa: SubAdminRow
  onRemove: (sa: SubAdminRow) => void
  removingSa: string | null
}

export function SubAdminMobileCard({ sa, onRemove, removingSa }: SubAdminMobileCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-black text-sm bg-primary/10 text-primary">
            {sa.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm uppercase tracking-tight truncate text-text-primary">{sa.full_name}</p>
            <p className="text-xs text-text-secondary truncate">{sa.email}</p>
          </div>
        </div>
        <IconButton
          variant="danger-soft"
          className="shrink-0"
          onClick={() => onRemove(sa)}
          disabled={removingSa === sa.id}
        >
          <Trash2 size={16} />
        </IconButton>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">Coupon:</span>
        <Badge variant="primary">{sa.coupon_code}</Badge>
      </div>
      <div className="pt-2 border-t border-border-subtle/20">
        <span className="text-xs text-text-muted">Joined {formatDate(sa.created_at)}</span>
      </div>
    </Card>
  )
}
