import { useState, useCallback } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import { isAdmin } from '../../utils/authUtils'
import { KNOWN_EXAM_IDS } from '../../lib/examUtils'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { useToast, ToastContainer } from '../../hooks/useToast'
import {
  PageContainer, Stack
} from '../../components/common/AntigravityUI'
import { ConfirmModal } from '../../components/common/SharedComponents'
import { GuardLoader } from '../../guards/Guards'
import { toggleUserStatus, fetchUsersPaginated } from '../../services/userService'
import type { UserRow } from '../../types/user.types'
import { AdminUsersView } from '../../components/admin/users/AdminUsersView'

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth()
  const { toasts, showSuccess, showError } = useToast()
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('exam') || 'all'

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

    try {
      const result = await fetchUsersPaginated({
        activeTab,
        statusFilter,
        searchQuery,
        page,
        pageSize: PAGE_SIZE,
      })
      return { data: { rows: result.rows as unknown as UserRow[], total: result.total }, error: null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to load users.' }
    }
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

  if (authLoading) return <GuardLoader />
  if (!isAdmin(user)) return <Navigate to="/unauthorized" replace />

  return (
    <PageContainer>
      <ToastContainer toasts={toasts} />
      <h1 className="sr-only">Manage Users</h1>

      <Stack gap="lg">
        <AdminUsersView
          users={users}
          totalUsers={totalUsers}
          loading={isUsersLoading}
          error={usersError}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          page={page}
          totalPages={totalPages}
          activeTab={activeTab}
          onSearchChange={(val) => { setSearchQuery(val); setPage(1) }}
          onStatusFilterChange={(val) => { setStatusFilter(val); setPage(1) }}
          onTabChange={() => setPage(1)}
          onPageChange={setPage}
          onToggleRequest={(id, currentStatus) => setConfirmToggle({ id, currentStatus })}
        />
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
