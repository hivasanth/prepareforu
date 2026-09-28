import { memo } from 'react'
import { Mail } from 'lucide-react'
import { Avatar, Stack } from '../../common/AntigravityUI'
import { AdminText } from '../../common/AdminText'

interface UserIdentityProps {
  /** Display name — null/empty falls back to 'Unknown' (Avatar derives its own fallback). */
  name?: string | null
  /** Email line — rendered when present. */
  email?: string | null
  truncate?: boolean
}

/* Generalized identity cell: accepts primitive name/email so any row type
 * (UserRow, SubAdminRow, …) reuses the ONE identity pattern — no per-page
 * clones. Consumers pass their row's fields explicitly. */
export const UserIdentity = memo(function UserIdentity({ name, email, truncate = false }: UserIdentityProps) {
  return (
    <Stack direction="row" align="center" gap="sm" className="min-w-0">
      <Avatar name={name} email={email} size="md" shape="circle" />
      <Stack gap="xs" className="min-w-0">
        <AdminText
          as="span"
          variant="garamond"
          size="heading"
          className={`font-bold leading-tight uppercase tracking-tight${truncate ? ' truncate' : ''}`}
        >
          {name || 'Unknown'}
        </AdminText>
        {email && (
          <span className="flex items-center gap-1 min-w-0">
            <Mail size={12} aria-hidden="true" className="shrink-0" />
            <AdminText
              as="span"
              variant="sans"
              size="metadata"
              className={`text-text-secondary${truncate ? ' truncate' : ''}`}
            >
              {email}
            </AdminText>
          </span>
        )}
      </Stack>
    </Stack>
  )
})
