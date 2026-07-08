import { useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { isAdmin } from '../../utils/authUtils'
import { supabase } from '../../lib/supabase'
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
  Label,
  Body,
  FilterBar,
  useTheme
} from '../../components/common/AntigravityUI'
import { 
  Plus, 
  Trash2, 
  Mail, 
  Shield, 
  Search, 
  Tag 
} from 'lucide-react'
import { ConfirmModal, ErrorState, EmptyState, LoadingSkeleton } from '../../components/common/SharedComponents'
import { AdminModal } from '../../components/admin/common/AdminModal'
import { removeSubAdmin } from '../../services/userService'
import { GuardLoader } from '../../guards/Guards'
import { formatDate } from '../../utils/dateUtils'
import type { SubAdminRow } from '../../types/subAdmin.types'
import { SubAdminMobileCard } from '../../components/admin/sub-admins/SubAdminMobileCard'

export default function AdminSubAdmins() {
  const { user, loading: authLoading } = useAuth()
  const { isDark } = useTheme()
  const { toasts, showSuccess, showError } = useToast()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [saToRemove, setSaToRemove] = useState<SubAdminRow | null>(null)
  const [removingSa, setRemovingSa] = useState<string | null>(null)
  
  const [newSAName, setNewSAName] = useState('')
  const [newSAEmail, setNewSAEmail] = useState('')
  const [newSACoupon, setNewSACoupon] = useState('')
  const [addingSa, setAddingSa] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data, loading, error: queryError, refetch } = useSupabaseQuery(async () => {
    return await supabase
      .from('sub_admins')
      .select('id, full_name, email, coupon_code, total_referrals, status, created_at')
      .order('created_at', { ascending: false })
  }, [])

  const filteredSAs: SubAdminRow[] = (data || []).filter((sa: SubAdminRow) => 
    sa.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sa.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sa.coupon_code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddSubAdmin = useCallback(async () => {
    if (!newSAName || !newSAEmail || !newSACoupon) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newSAEmail)) {
      showError('Please enter a valid email address.')
      return
    }
    setAddingSa(true)
    try {
      const { data: res, error: functionError } = await supabase.functions.invoke('onboard-sub-admin', {
        body: { 
          email: newSAEmail, 
          full_name: newSAName, 
          coupon_code: newSACoupon.trim().toUpperCase() 
        }
      })
      if (functionError || res?.error) throw new Error(res?.message || 'Failed to onboard educator.')
      showSuccess('Invitation sent to educator successfully!')
      setShowAddModal(false)
      setNewSAName('')
      setNewSAEmail('')
      setNewSACoupon('')
      refetch()
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to onboard educator.')
    } finally {
      setAddingSa(false)
    }
  }, [newSAName, newSAEmail, newSACoupon, refetch, showSuccess, showError])

  const handleRemoveSubAdmin = useCallback(async () => {
    if (!saToRemove) return
    setRemovingSa(saToRemove.id)
    try {
      const result = await removeSubAdmin({ user, requestId: `rem_${Date.now()}` }, saToRemove.id)
      if (!result.success) throw new Error(result.error?.message)
      showSuccess('Educator removed.')
      refetch()
      setShowRemoveModal(false)
      setSaToRemove(null)
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to remove educator.')
    } finally {
      setRemovingSa(null)
    }
  }, [saToRemove, user, refetch, showSuccess, showError])

  const columns = [
    {
      key: 'full_name',
      label: 'Educator',
      render: (_: unknown, sa: SubAdminRow) => (
        <Stack direction="row" align="center" gap="sm">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${!isDark ? 'ancient-icon-badge !bg-[var(--ancient-gold)] text-white' : 'bg-primary/10 text-primary'}`}>
            {sa.full_name.charAt(0).toUpperCase()}
          </div>
          <Stack gap="xs">
            <span className={`font-black uppercase tracking-tight leading-tight ${!isDark ? 'font-garamond text-base text-[var(--ancient-brown-deep)]' : 'text-text-primary'}`}>{sa.full_name}</span>
            <span className={`text-xs flex items-center gap-1 ${!isDark ? 'text-[var(--ancient-brown)] font-bold opacity-60' : 'text-text-secondary opacity-60'}`}>
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
        <Badge 
          variant="primary" 
          icon={Tag}
          className={!isDark ? '!bg-[var(--ancient-badge-bg)] !text-[var(--ancient-brown)] !border-[var(--ancient-badge-border)] shadow-sm' : ''}
        >
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
          className={!isDark ? 'text-[var(--ancient-danger)] hover:bg-[var(--ancient-danger-hover)]' : 'text-danger hover:bg-danger/10'}
          onClick={() => { setSaToRemove(sa); setShowRemoveModal(true); }} 
          disabled={removingSa === sa.id}
        >
          <Trash2 size={16} />
        </IconButton>
      )
    }
  ]

  if (authLoading) return <GuardLoader />
  if (!isAdmin(user)) return <Navigate to="/unauthorized" replace />

  const emptyState = (
    <EmptyState
      icon={<Shield size={48} />}
      title="No Results"
      subtitle="No educators found matching your search."
    />
  )

  const loadingSkeleton = (
    <div className="space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <LoadingSkeleton key={i} height={64} borderRadius={16} />
      ))}
    </div>
  )

  return (
    <PageContainer>
      <ToastContainer toasts={toasts} />
      <h1 className="sr-only">Manage Educators</h1>
      <div className="flex items-center justify-end mb-6">
        <Button onClick={() => setShowAddModal(true)}>
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
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Body secondary className="hidden sm:block">
              {filteredSAs.length} Educators
            </Body>
          </div>
        </FilterBar>

        <Card variant="default" className={`overflow-hidden p-0 ${!isDark ? 'ancient-card shadow-xl border-[var(--ancient-gold)]/20' : ''}`}>
          {queryError ? (
            <ErrorState message={queryError} onRetry={refetch} />
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
                    onRemove={(s) => { setSaToRemove(s); setShowRemoveModal(true); }}
                    removingSa={removingSa}
                    isDark={isDark}
                  />
                )) : null}
              </div>

              {filteredSAs.length === 0 && !loading && emptyState}
            </>
          )}
        </Card>
      </Stack>

      <AdminModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Onboard New Educator"
      >
        <Stack gap="lg">
          <Stack gap="sm">
            <Label>Display Name</Label>
            <Input 
              placeholder="e.g. Dr. Satish Kumar"
              value={newSAName}
              onChange={(e) => setNewSAName(e.target.value)}
            />
          </Stack>
          <Stack gap="sm">
            <Label>Email Address</Label>
            <Input 
              type="email"
              placeholder="e.g. satish@example.com"
              value={newSAEmail}
              onChange={(e) => setNewSAEmail(e.target.value)}
            />
          </Stack>
          <Stack gap="sm">
            <Label>Coupon Code</Label>
            <Input 
              placeholder="e.g. SATISH25"
              value={newSACoupon}
              onChange={(e) => setNewSACoupon(e.target.value.toUpperCase())}
            />
          </Stack>
          <Button fullWidth onClick={handleAddSubAdmin} loading={addingSa}>
            Confirm Onboarding
          </Button>
        </Stack>
      </AdminModal>

      <ConfirmModal
        open={showRemoveModal}
        onCancel={() => { setShowRemoveModal(false); setSaToRemove(null); }}
        onConfirm={handleRemoveSubAdmin}
        title="Remove Educator?"
        message={`Are you sure you want to remove ${saToRemove?.full_name}? This action is permanent.`}
        confirmLabel="Remove Access"
        danger={true}
      />
    </PageContainer>
  )
}
