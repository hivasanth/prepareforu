import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Mail, Search, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert, Users as UsersIcon } from 'lucide-react'
import {
  Button, IconButton, Input, Badge, DataGrid, Stack,
  Label, Body, FilterBar, FilterSelect
} from '../../common/AntigravityUI'
import { SectionReveal } from '../../common/AntigravityAnimation'
import { AdminCard } from '../common/AdminCard'
import { AdminTabTrack } from '../common/AdminTabTrack'
import { AdminIconWrap } from '../common/AdminIconWrap'
import { AdminText } from '../common/AdminText'
import { ExamTabs } from '../../admin/overview/ExamTabs'
import { ErrorState, EmptyState, LoadingSkeleton } from '../../common/SharedComponents'
import { UserMobileCard } from './UserMobileCard'
import { formatDate } from '../../../utils/dateUtils'
import type { UserRow } from '../../../types/user.types'

interface AdminUsersViewProps {
  users: UserRow[]
  totalUsers: number
  loading: boolean
  error: string | null
  searchQuery: string
  statusFilter: string
  page: number
  totalPages: number
  activeTab: string
  onSearchChange: (val: string) => void
  onStatusFilterChange: (val: string) => void
  onTabChange: (val: string) => void
  onPageChange: (page: number) => void
  onToggleRequest: (id: string, currentStatus: boolean) => void
}

export function AdminUsersView({
  users, totalUsers, loading, error, searchQuery, statusFilter,
  page, totalPages, activeTab, onSearchChange, onStatusFilterChange,
  onTabChange, onPageChange, onToggleRequest
}: AdminUsersViewProps) {
  const [, setSearchParams] = useSearchParams()

  const setActiveTab = useCallback((val: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (val === 'all') next.delete('exam')
      else next.set('exam', val)
      return next
    }, { replace: true })
    onTabChange(val)
  }, [setSearchParams, onTabChange])

  const columns = [
    {
      key: 'name',
      label: 'Student',
      render: (_: unknown, u: UserRow) => (
        <Stack direction="row" align="center" gap="sm">
          <AdminIconWrap size="md" rounded="full">
            {u.full_name?.charAt(0).toUpperCase() || '?'}
          </AdminIconWrap>
          <Stack gap="xs">
            <AdminText as="span" variant="garamond" className="font-black leading-tight uppercase tracking-tight text-base">
              {u.full_name || 'Unknown'}
            </AdminText>
            <span className="text-xs flex items-center gap-1 text-text-secondary opacity-60">
              <Mail size={12} /> {u.email}
            </span>
          </Stack>
        </Stack>
      )
    },
    {
      key: 'exam_selection',
      label: 'Exam Type',
      render: (val: string) => (
        <Badge variant="default" className="capitalize">
          {val?.replace(/_/g, ' ') || 'None'}
        </Badge>
      )
    },
    {
      key: 'total_exams',
      label: 'Attempts',
      align: 'center' as const,
      render: (val: number) => (
        <Stack gap="xs" align="center">
          <span className="text-sm font-black text-text-primary">{val || 0}</span>
          <Label className="text-[8px]">Completed</Label>
        </Stack>
      )
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (val: string) => (
        <span className="text-xs font-medium text-text-secondary">
          {formatDate(val)}
        </span>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (active: boolean) => (
        <Badge
          variant={active ? 'success' : 'danger'}
          icon={active ? ShieldCheck : ShieldAlert}
        >
          {active ? 'Active' : 'Banned'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right' as const,
      render: (_: unknown, u: UserRow) => (
        <Button
          variant={u.is_active ? 'danger' : 'success'}
          className="h-8 px-3 text-[10px]"
          onClick={() => onToggleRequest(u.id, u.is_active)}
        >
          {u.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      )
    }
  ]

  const loadingSkeleton = (
    <div className="p-4 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <LoadingSkeleton key={i} height={64} borderRadius={16} />
      ))}
    </div>
  )

  const emptyUsers = (
    <EmptyState
      icon={<UsersIcon size={48} />}
      title="No Students Found"
      subtitle="No students match your current filter criteria."
    />
  )

  return (
    <>
      <SectionReveal className="flex justify-center lg:justify-start w-full">
        <AdminTabTrack>
          <ExamTabs
            selectedExam={activeTab}
            setSelectedExam={setActiveTab}
            className="bg-transparent border-none p-0 w-fit"
          />
        </AdminTabTrack>
      </SectionReveal>

      <AdminCard className="overflow-hidden p-0" role="region" aria-label="Users list" aria-live="polite">
        <FilterBar className="border-none bg-transparent gap-4">
          <div className="flex-1 min-w-0 max-w-md">
            <Input
              leftIcon={Search}
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <FilterSelect
              value={statusFilter}
              onChange={onStatusFilterChange}
              placeholder="Status"
              options={[
                { id: 'active', name: 'Active Only' },
                { id: 'inactive', name: 'Banned Only' }
              ]}
              className="min-w-[140px]"
            />
            <Badge variant="primary" className="hidden sm:flex">{totalUsers} Users</Badge>
          </div>
        </FilterBar>

        {error ? (
          <ErrorState message={error} onRetry={() => {}} />
        ) : loading ? (
          loadingSkeleton
        ) : (
          <>
            <div className="hidden md:block">
              <DataGrid
                columns={columns}
                rows={users}
                rowKey="id"
              />
            </div>

            <div className="block md:hidden p-4 space-y-3">
              {users.length > 0 ? users.map((u: UserRow) => (
                <UserMobileCard key={u.id} user={u} onToggleStatus={(id, currentStatus) => onToggleRequest(id, currentStatus)} />
              )) : null}
            </div>

            {users.length === 0 && !loading && emptyUsers}

            {totalPages > 1 && (
              <div className="p-4 border-t border-border-subtle/50 flex items-center justify-between">
                <Body secondary className="text-xs">Page {page} of {totalPages}</Body>
                <div className="flex gap-2">
                  <IconButton size="sm" className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page">
                    <ChevronLeft size={16} />
                  </IconButton>
                  <IconButton size="sm" className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Next page">
                    <ChevronRight size={16} />
                  </IconButton>
                </div>
              </div>
            )}
          </>
        )}
      </AdminCard>
    </>
  )
}
