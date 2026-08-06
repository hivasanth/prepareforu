import { memo } from 'react'
import { Card, Badge, Stack } from '../../common/AntigravityUI'
import { AdminIconWrap } from '../../common/AdminIconWrap'
import { AdminText } from '../../common/AdminText'
import type { SubAdminRecentAttempt } from './types'

interface RecentAttemptItemProps {
  attempt: SubAdminRecentAttempt
}

export default memo(function RecentAttemptItem({ attempt }: RecentAttemptItemProps) {
  return (
    <Card
      variant="premium-neutral"
    >
      <Stack direction="row" gap="md" align="center">
        <AdminIconWrap size="sm" rounded="lg" className="font-bold text-xs">
          {attempt.users?.full_name?.charAt(0) || 'S'}
        </AdminIconWrap>
        <Stack gap={0}>
          <AdminText as="span" variant="cinzel" className="text-xs font-bold text-text-primary uppercase tracking-tight truncate max-w-[150px]">
            {attempt.users?.full_name || 'Anonymous'}
          </AdminText>
          <span className="text-[9px] text-[var(--text-muted)] font-medium uppercase tracking-widest">
            {new Date(attempt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </Stack>
      </Stack>
      <div className="text-right">
        <Badge variant="secondary" size="sm">
          {attempt.score}%
        </Badge>
      </div>
    </Card>
  )
})
