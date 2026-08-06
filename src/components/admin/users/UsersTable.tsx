import { memo } from 'react'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import {
  Badge, Button, CollectionCard, CollectionHeader, Pagination,
} from '../../common/AntigravityUI'
import { AdminText } from '../../common/AdminText'
import { GridSkeleton } from '../../common/SharedComponents'
import { UserIdentity } from './UserIdentity'
import { formatDate } from '../../../utils/dateUtils'
import type { UserRow } from '../../../types/user.types'

const PAGE_SIZE = 20

const IDENTITY_COL = 'w-[170px] min-[420px]:w-[200px] sm:w-[240px] md:w-[280px] xl:w-[300px] min-w-0'
const EXAM_COL = 'w-[150px] sm:w-[160px]'
const ATTEMPTS_COL = 'w-[100px]'
const JOINED_COL = 'w-[130px] sm:w-[140px]'
const STATUS_COL = 'w-[110px] sm:w-[130px]'
const ACTION_COL = 'w-[104px]'

interface UsersTableProps {
  users: UserRow[]
  totalUsers: number
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  togglingId: string | null
  onToggleRequest: (user: UserRow) => void
}

export const UsersTable = memo(function UsersTable({
  users,
  totalUsers,
  loading,
  page,
  totalPages,
  onPageChange,
  togglingId,
  onToggleRequest,
}: UsersTableProps) {
  if (loading && users.length === 0) {
    return <GridSkeleton variant="management" count={5} height={56} columns="grid-cols-1" />
  }

  if (!loading && users.length === 0) {
    return null
  }

  const rangeStart = (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, totalUsers)

  return (
    <div className="flex flex-col gap-6 animate-in">
      {/* Range summary (shared Foundation CollectionHeader — range-only, no selection) */}
      <CollectionHeader
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        totalCount={totalUsers}
      />

      {/* Premium Student Library — one compact management CollectionCard per user */}
      <div className="flex flex-col gap-3">
        {users.map(u => (
          <CollectionCard
            key={u.id}
            layout="row"
            variant="management"
            padding={16}
            titleAs="h3"
            leading={
              <div className={IDENTITY_COL}>
                <UserIdentity user={u} truncate />
              </div>
            }
            metadata={
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div className={EXAM_COL}>
                  <Badge variant="default" className="capitalize max-w-full">
                    <span className="truncate">{u.exam_selection?.replace(/_/g, ' ') || 'None'}</span>
                  </Badge>
                </div>
                <div className={ATTEMPTS_COL}>
                  <AdminText as="span" variant="sans" size="metadata" className="font-medium text-text-primary">
                    {u.total_exams || 0}
                  </AdminText>
                </div>
                <div className={JOINED_COL}>
                  <AdminText as="span" variant="sans" size="metadata" className="text-text-primary truncate">
                    {formatDate(u.created_at)}
                  </AdminText>
                </div>
              </div>
            }
            trailing={
              <div className={STATUS_COL}>
                <Badge
                  variant={u.is_active ? 'success' : 'danger'}
                  icon={u.is_active ? ShieldCheck : ShieldAlert}
                >
                  {u.is_active ? 'Active' : 'Banned'}
                </Badge>
              </div>
            }
            actions={
              <Button
                variant={u.is_active ? 'danger' : 'success'}
                size="xs"
                className={ACTION_COL}
                loading={togglingId === u.id}
                onClick={() => onToggleRequest(u)}
              >
                {u.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            }
          />
        ))}
      </div>

      <Pagination
        page={page - 1}
        totalPages={totalPages}
        onPageChange={(p) => onPageChange(p + 1)}
      />
    </div>
  )
})
