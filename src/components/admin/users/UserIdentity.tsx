import { memo } from 'react'
import { Mail } from 'lucide-react'
import { Avatar, Stack } from '../../common/AntigravityUI'
import { AdminText } from '../../common/AdminText'
import type { UserRow } from '../../../types/user.types'

interface UserIdentityProps {
  user: UserRow
  truncate?: boolean
}

export const UserIdentity = memo(function UserIdentity({ user, truncate = false }: UserIdentityProps) {
  return (
    <Stack direction="row" align="center" gap="sm" className="min-w-0">
      <Avatar name={user.full_name} email={user.email} size="md" shape="circle" />
      <Stack gap="xs" className="min-w-0">
        <AdminText
          as="span"
          variant="garamond"
          size="heading"
          className={`font-bold leading-tight uppercase tracking-tight${truncate ? ' truncate' : ''}`}
        >
          {user.full_name || 'Unknown'}
        </AdminText>
        <span className="flex items-center gap-1 min-w-0">
          <Mail size={12} aria-hidden="true" className="shrink-0" />
          <AdminText
            as="span"
            variant="sans"
            size="metadata"
            className={`text-text-secondary${truncate ? ' truncate' : ''}`}
          >
            {user.email}
          </AdminText>
        </span>
      </Stack>
    </Stack>
  )
})
