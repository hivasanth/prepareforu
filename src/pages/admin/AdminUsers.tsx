import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Search } from 'lucide-react'
import { H1, PageContainer, Stack, SectionReveal, Alert, Label, RetryButton } from '../../components/common/AntigravityUI'
import { AdminText } from '../../components/common/AdminText'
import { ConfirmModal, EmptyState } from '../../components/common/SharedComponents'
import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import { EXAM_TABS } from '../../components/admin/shared/examPresets'
import { UsersActions } from '../../components/admin/users/UsersActions'
import { UsersTable } from '../../components/admin/users/UsersTable'
import { USERS_PAGE_SIZE, useAdminUsers } from '../../components/admin/users/useAdminUsers'

export default function AdminUsers() {
  const h = useAdminUsers()
  const { handleTabChange } = h
  const [, setSearchParams] = useSearchParams()

  const setActiveTab = useCallback((val: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (val === 'all') next.delete('exam')
      else next.set('exam', val)
      return next
    }, { replace: true })
    handleTabChange(val)
  }, [setSearchParams, handleTabChange])

  return (
    <PageContainer>
      <H1 className="sr-only">Manage Users</H1>

      <Stack gap="lg">
        <SectionReveal className="w-full">
          <div className="w-full relative">
            <AdminSelectionTabs
              selectedExam={h.activeTab}
              setSelectedExam={setActiveTab}
              customExamTabs={EXAM_TABS}
              showPapers={false}
              showSubjects={false}
            />
          </div>
        </SectionReveal>

        {h.actionSuccess && (
          <SectionReveal>
            <Alert variant="success" icon={CheckCircle2} title="User updated" className="w-full" onDismiss={h.clearActionSuccess}>
              {h.actionSuccess}
            </Alert>
          </SectionReveal>
        )}

        {h.actionError && (
          <SectionReveal>
            <Alert variant="error" icon={AlertCircle} title="User update failed" className="w-full">
              {h.actionError}
            </Alert>
          </SectionReveal>
        )}

        {h.usersError && (
          <SectionReveal>
            {/* AU-1: the retry control lives on the error surface itself so it
                is available even when stale rows are still displayed. fetchData
                re-runs against current exam/status/search/page state. */}
            <Alert variant="error" icon={AlertCircle} title="Failed to load users" className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="flex-1">{h.usersError}</span>
                <RetryButton
                  label="Retry"
                  onRetry={h.handleRetry}
                  loading={h.isUsersLoading}
                  className="sm:w-auto"
                />
              </div>
            </Alert>
          </SectionReveal>
        )}

        <SectionReveal>
          <UsersActions
            searchQuery={h.searchQuery}
            onSearchChange={h.handleSearchChange}
            statusFilter={h.statusFilter}
            onStatusFilterChange={h.handleStatusFilterChange}
          />
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <div aria-live="polite" aria-label="Users list">
            {h.totalUsers > 0 && (
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">
                Showing {(h.page - 1) * USERS_PAGE_SIZE + 1}–{Math.min(h.page * USERS_PAGE_SIZE, h.totalUsers)} of {h.totalUsers}
              </p>
            )}
            <UsersTable
              users={h.users}
              loading={h.isUsersLoading}
              page={h.page}
              totalPages={h.totalPages}
              onPageChange={h.handlePageChange}
              togglingId={h.togglingId}
              onToggleRequest={h.handleToggleRequest}
            />

            {!h.isUsersLoading && h.users.length === 0 && (
              <EmptyState
                variant="management"
                icon={<Search size={48} />}
                title="No Students Found"
                subtitle="No students match your current filter criteria."
                actionLabel={h.usersError ? 'Try Again' : undefined}
                onAction={h.usersError ? h.handleRetry : undefined}
              />
            )}
          </div>
        </SectionReveal>
      </Stack>

      <ConfirmModal
        open={!!h.confirmToggle}
        title={h.confirmToggle?.is_active ? 'Deactivate User' : 'Activate User'}
        message={
          h.confirmToggle && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Label>User</Label>
                <AdminText as="span" variant="sans" size="body" className="font-semibold text-text-primary">
                  {h.confirmToggle.full_name || 'Unnamed user'}
                </AdminText>
                <AdminText as="span" variant="sans" size="metadata" className="text-text-muted">
                  {h.confirmToggle.email}
                </AdminText>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Current Status</Label>
                <AdminText as="span" variant="sans" size="metadata" className="font-semibold text-text-primary">
                  {h.confirmToggle.is_active ? 'Active' : 'Banned'}
                </AdminText>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Action</Label>
                <AdminText as="span" variant="sans" size="metadata" className="font-semibold text-text-primary">
                  {h.confirmToggle.is_active ? 'Deactivate' : 'Activate'}
                </AdminText>
              </div>
              <p>
                {h.confirmToggle.is_active
                  ? 'This user will no longer be able to access the platform until reactivated. The account can be reactivated at any time.'
                  : 'This user will regain access to the platform immediately.'}
              </p>
            </div>
          )
        }
        confirmLabel={h.confirmToggle?.is_active ? 'Deactivate' : 'Activate'}
        danger={h.confirmToggle?.is_active}
        busy={h.isToggling}
        onConfirm={h.handleConfirmToggle}
        onCancel={() => h.setConfirmToggle(null)}
      />
    </PageContainer>
  )
}
