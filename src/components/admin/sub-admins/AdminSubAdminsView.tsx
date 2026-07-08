import { Mail, Shield, Search, Tag, Trash2, Plus } from 'lucide-react'
import {
  Button, IconButton, Input, Badge, DataGrid, Stack,
  Body, FilterBar, Label
} from '../../common/AntigravityUI'
import { AdminCard } from '../common/AdminCard'
import { AdminIconWrap } from '../common/AdminIconWrap'
import { AdminText } from '../common/AdminText'
import { ErrorState, EmptyState, LoadingSkeleton } from '../../common/SharedComponents'
import { ConfirmModal } from '../../common/SharedComponents'
import { AdminModal } from '../../admin/common/AdminModal'
import { SubAdminMobileCard } from './SubAdminMobileCard'
import { formatDate } from '../../../utils/dateUtils'
import type { SubAdminRow } from '../../../types/subAdmin.types'

interface AdminSubAdminsViewProps {
  filteredSAs: SubAdminRow[]
  loading: boolean
  error: string | null
  searchQuery: string
  showAddModal: boolean
  showRemoveModal: boolean
  saToRemove: SubAdminRow | null
  removingSa: string | null
  newSAName: string
  newSAEmail: string
  newSACoupon: string
  addingSa: boolean
  onSearchChange: (val: string) => void
  onAddOpen: () => void
  onAddClose: () => void
  onAddSubmit: () => void
  onRemoveRequest: (sa: SubAdminRow) => void
  onRemoveConfirm: () => void
  onRemoveCancel: () => void
  onNewSANameChange: (val: string) => void
  onNewSAEmailChange: (val: string) => void
  onNewSACouponChange: (val: string) => void
}

export function AdminSubAdminsView({
  filteredSAs, loading, error, searchQuery,
  showAddModal, showRemoveModal, saToRemove, removingSa,
  newSAName, newSAEmail, newSACoupon, addingSa,
  onSearchChange, onAddOpen, onAddClose, onAddSubmit,
  onRemoveRequest, onRemoveConfirm, onRemoveCancel,
  onNewSANameChange, onNewSAEmailChange, onNewSACouponChange
}: AdminSubAdminsViewProps) {

  const columns = [
    {
      key: 'full_name',
      label: 'Educator',
      render: (_: unknown, sa: SubAdminRow) => (
        <Stack direction="row" align="center" gap="sm">
          <AdminIconWrap size="md" rounded="full">
            {sa.full_name.charAt(0).toUpperCase()}
          </AdminIconWrap>
          <Stack gap="xs">
            <AdminText as="span" variant="garamond" className="font-black uppercase tracking-tight leading-tight text-base">
              {sa.full_name}
            </AdminText>
            <span className="text-xs flex items-center gap-1 text-text-secondary opacity-60">
              <Mail size={12} /> {sa.email}
            </span>
          </Stack>
        </Stack>
      )
    },
    {
      key: 'coupon_code',
      label: 'Coupon',
      render: (code: string) => (
        <Badge variant="primary" icon={Tag}>
          {code}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (val: string) => <span className="text-xs font-medium text-text-secondary">{formatDate(val)}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center' as const,
      render: (_: unknown, sa: SubAdminRow) => (
        <IconButton
          aria-label="Remove sub-admin"
          className="text-danger hover:bg-danger/10"
          onClick={() => onRemoveRequest(sa)}
          disabled={removingSa === sa.id}
        >
          <Trash2 size={16} />
        </IconButton>
      )
    }
  ]

  const loadingSkeleton = (
    <div className="space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <LoadingSkeleton key={i} height={64} borderRadius={16} />
      ))}
    </div>
  )

  const emptyState = (
    <EmptyState
      icon={<Shield size={48} />}
      title="No Results"
      subtitle="No educators found matching your search."
    />
  )

  return (
    <>
      <div className="flex items-center justify-end mb-6">
        <Button onClick={onAddOpen}>
          <Plus size={18} className="mr-1" /> Add Educator
        </Button>
      </div>

      <Stack gap="lg">
        <FilterBar>
          <div className="flex-1 min-w-0 max-w-md">
            <Input
              leftIcon={Search}
              placeholder="Search educators by name, email or coupon..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Body secondary className="hidden sm:block">
              {filteredSAs.length} Educators
            </Body>
          </div>
        </FilterBar>

        <AdminCard className="overflow-hidden p-0">
          {error ? (
            <ErrorState message={error} onRetry={() => {}} />
          ) : loading ? (
            loadingSkeleton
          ) : (
            <>
              <div className="hidden md:block">
                <DataGrid
                  columns={columns}
                  rows={filteredSAs}
                  rowKey="id"
                />
              </div>

              <div className="block md:hidden p-4 space-y-3">
                {filteredSAs.length > 0 ? filteredSAs.map((sa: SubAdminRow) => (
                  <SubAdminMobileCard
                    key={sa.id}
                    sa={sa}
                    onRemove={(s) => onRemoveRequest(s)}
                    removingSa={removingSa}
                  />
                )) : null}
              </div>

              {filteredSAs.length === 0 && !loading && emptyState}
            </>
          )}
        </AdminCard>
      </Stack>

      <AdminModal
        isOpen={showAddModal}
        onClose={onAddClose}
        title="Onboard New Educator"
      >
        <Stack gap="lg">
          <Stack gap="sm">
            <Label>Display Name</Label>
            <Input
              placeholder="e.g. Dr. Satish Kumar"
              value={newSAName}
              onChange={(e) => onNewSANameChange(e.target.value)}
            />
          </Stack>
          <Stack gap="sm">
            <Label>Email Address</Label>
            <Input
              type="email"
              placeholder="e.g. satish@example.com"
              value={newSAEmail}
              onChange={(e) => onNewSAEmailChange(e.target.value)}
            />
          </Stack>
          <Stack gap="sm">
            <Label>Coupon Code</Label>
            <Input
              placeholder="e.g. SATISH25"
              value={newSACoupon}
              onChange={(e) => onNewSACouponChange(e.target.value.toUpperCase())}
            />
          </Stack>
          <Button fullWidth onClick={onAddSubmit} loading={addingSa}>
            Confirm Onboarding
          </Button>
        </Stack>
      </AdminModal>

      <ConfirmModal
        open={showRemoveModal}
        onCancel={onRemoveCancel}
        onConfirm={onRemoveConfirm}
        title="Remove Educator?"
        message={`Are you sure you want to remove ${saToRemove?.full_name}? This action is permanent.`}
        confirmLabel="Remove Access"
        danger={true}
      />
    </>
  )
}
