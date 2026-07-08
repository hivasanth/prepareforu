import { useState, useCallback } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import { isAdmin } from '../../utils/authUtils'
import { ExamTabs } from '../../components/admin/overview/ExamTabs'
import { supabase } from '../../lib/supabase'
import { KNOWN_EXAM_IDS } from '../../lib/examUtils'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { useToast, ToastContainer } from '../../hooks/useToast'
import { 
  Button, 
  IconButton, 
  Input, 
  Badge, 
  Card, 
  DataGrid, 
  PageContainer, 
  Stack,
  SectionReveal,
  Label,
  Body,
  FilterBar,
  FilterSelect,
  useTheme
} from '../../components/common/AntigravityUI'
import { ConfirmModal, ErrorState, EmptyState, LoadingSkeleton } from '../../components/common/SharedComponents'
import { 
  Search, 
  Mail, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert, 
  Users as UsersIcon 
} from 'lucide-react'
import { GuardLoader } from '../../guards/Guards'
import { toggleUserStatus } from '../../services/userService'
import { formatDate } from '../../utils/dateUtils'
import type { UserRow } from '../../types/user.types'
import { UserMobileCard } from '../../components/admin/users/UserMobileCard'

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth()
  const { isDark } = useTheme()
  const { toasts, showSuccess, showError } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('exam') || 'all'

  const setActiveTab = useCallback((val: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (val === 'all') next.delete('exam')
      else next.set('exam', val)
      return next
    }, { replace: true })
  }, [setSearchParams])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [page, setPage] = useState(1)
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, boolean>>({})
  const [confirmToggle, setConfirmToggle] = useState<{ id: string; currentStatus: boolean } | null>(null)
  const PAGE_SIZE = 20

  const { data, loading: isUsersLoading, error: usersError, refetch } = useSupabaseQuery(async () => {
    if (activeTab !== 'all' && !KNOWN_EXAM_IDS.includes(activeTab)) {
      return { data: { rows: [], total: 0 }, error: null }
    }

    const offset = (page - 1) * PAGE_SIZE
    let query = supabase
      .from('users')
      .select('id, full_name, email, exam_selection, is_active, created_at, streak, total_exams', { count: 'exact' })
      .eq('role', 'user')

    if (activeTab !== 'all') query = query.eq('exam_selection', activeTab)
    if (statusFilter === 'active') query = query.eq('is_active', true)
    else if (statusFilter === 'inactive') query = query.eq('is_active', false)

    const q = searchQuery.trim()
    if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)

    const res = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (res.error) return { data: null, error: res.error }
    const rows = (res.data || []) as UserRow[]
    return { data: { rows, total: res.count || 0 }, error: null }
  }, [activeTab, statusFilter, searchQuery, page])

  const users = (data?.rows || []).map(u => ({
    ...u,
    is_active: u.id in optimisticStatus ? optimisticStatus[u.id] : u.is_active
  }))
  const totalUsers = data?.total || 0
  const totalPages = Math.ceil(totalUsers / PAGE_SIZE)

  const handleToggleStatus = useCallback(async () => {
    if (!confirmToggle) return
    const { id, currentStatus } = confirmToggle
    const newStatus = !currentStatus

    setOptimisticStatus(prev => ({ ...prev, [id]: newStatus }))
    setConfirmToggle(null)

    try {
      const result = await toggleUserStatus(
        { user, requestId: `user_toggle_${Date.now()}` },
        id,
        newStatus
      )
      if (!result.success) throw new Error(result.error?.message)
      showSuccess(`User ${newStatus ? 'activated' : 'deactivated'} successfully.`)
      refetch()
    } catch (err: unknown) {
      setOptimisticStatus(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      showError(err instanceof Error ? err.message : 'Failed to update user status.')
    }
  }, [confirmToggle, user, refetch, showSuccess, showError])

  const columns = [
    {
      key: 'name',
      label: 'Student',
      render: (_: unknown, u: UserRow) => (
        <Stack direction="row" align="center" gap="sm">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${!isDark ? 'ancient-icon-badge !bg-[var(--ancient-gold)] text-white' : 'bg-primary/10 text-primary'}`}>
            {u.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <Stack gap="xs">
            <span className={`font-black leading-tight uppercase tracking-tight ${!isDark ? 'font-garamond text-base text-[var(--ancient-brown-deep)]' : 'text-text-primary'}`}>{u.full_name || 'Unknown'}</span>
            <span className={`text-xs flex items-center gap-1 ${!isDark ? 'text-[var(--ancient-brown)] font-bold opacity-60' : 'text-text-secondary opacity-60'}`}>
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
          className={active && !isDark ? '!bg-[#E8F5E9] !text-[#2E7D32] !border-[#C8E6C9] shadow-sm' : ''}
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
          onClick={() => setConfirmToggle({ id: u.id, currentStatus: u.is_active })}
        >
          {u.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      )
    }
  ]

  if (authLoading) return <GuardLoader />
  if (!isAdmin(user)) return <Navigate to="/unauthorized" replace />

  const emptyUsers = (
    <EmptyState
      icon={<UsersIcon size={48} />}
      title="No Students Found"
      subtitle="No students match your current filter criteria."
    />
  )

  const loadingSkeleton = (
    <div className="p-4 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <LoadingSkeleton key={i} height={64} borderRadius={16} />
      ))}
    </div>
  )

  return (
    <PageContainer>
      <ToastContainer toasts={toasts} />
      <h1 className="sr-only">Manage Users</h1>

      <Stack gap="lg">
        <SectionReveal className="flex justify-center lg:justify-start w-full">
          <div className={`w-fit max-w-full overflow-x-auto custom-scrollbar relative p-1 ${!isDark ? 'ancient-tab-track shadow-md' : 'bg-card-bg/50 border border-border-subtle rounded-2xl'}`}>
            <ExamTabs 
              selectedExam={activeTab} 
              setSelectedExam={(val) => { setActiveTab(val); setPage(1) }} 
              className="bg-transparent border-none p-0 w-fit"
            />
          </div>
        </SectionReveal>

        <Card variant="default" role="region" aria-label="Users list" aria-live="polite" className={`p-0 overflow-hidden ${!isDark ? 'ancient-card shadow-xl border-[var(--ancient-gold)]/20' : ''}`}>
          
          <FilterBar className="border-none bg-transparent gap-4">
            <div className="flex-1 min-w-0 max-w-md">
              <Input 
                leftIcon={Search}
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <FilterSelect 
                value={statusFilter}
                onChange={(val) => { setStatusFilter(val); setPage(1) }}
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

          {usersError ? (
            <ErrorState message={usersError} onRetry={refetch} />
          ) : isUsersLoading ? (
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
                  <UserMobileCard key={u.id} user={u} onToggleStatus={(id, currentStatus) => setConfirmToggle({ id, currentStatus })} />
                )) : null}
              </div>

              {users.length === 0 && !isUsersLoading && emptyUsers}

              {totalPages > 1 && (
                <div className="p-4 border-t border-border-subtle/50 flex items-center justify-between">
                  <Body secondary className="text-xs">Page {page} of {totalPages}</Body>
                  <div className="flex gap-2">
                    <IconButton size="sm" className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" onClick={() => setPage(p => p - 1)} disabled={page === 1} aria-label="Previous page">
                      <ChevronLeft size={16} />
                    </IconButton>
                    <IconButton size="sm" className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} aria-label="Next page">
                      <ChevronRight size={16} />
                    </IconButton>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </Stack>

      <ConfirmModal 
        open={!!confirmToggle}
        title={confirmToggle?.currentStatus ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${confirmToggle?.currentStatus ? 'deactivate' : 'activate'} this user account?`}
        confirmLabel={confirmToggle?.currentStatus ? 'Deactivate' : 'Activate'}
        danger={confirmToggle?.currentStatus}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmToggle(null)}
      />
    </PageContainer>
  )
}
