import { useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { isAdmin } from '../../utils/authUtils'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { useToast, ToastContainer } from '../../hooks/useToast'
import {
  PageContainer
} from '../../components/common/AntigravityUI'
import { GuardLoader } from '../../guards/Guards'
import { fetchAllSubAdmins, onboardSubAdmin, removeSubAdmin } from '../../services/userService'
import type { SubAdminRow } from '../../types/subAdmin.types'
import { AdminSubAdminsView } from '../../components/admin/sub-admins/AdminSubAdminsView'

export default function AdminSubAdmins() {
  const { user, loading: authLoading } = useAuth()
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
    const rows = await fetchAllSubAdmins()
    return { data: rows, error: null }
  }, [])

  const filteredSAs: SubAdminRow[] = ((data || []) as unknown as SubAdminRow[]).filter((sa: SubAdminRow) =>
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
      await onboardSubAdmin(newSAEmail, newSAName, newSACoupon.trim().toUpperCase())
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

  if (authLoading) return <GuardLoader />
  if (!isAdmin(user)) return <Navigate to="/unauthorized" replace />

  return (
    <PageContainer>
      <ToastContainer toasts={toasts} />
      <h1 className="sr-only">Manage Educators</h1>

      <AdminSubAdminsView
        filteredSAs={filteredSAs}
        loading={loading}
        error={queryError}
        searchQuery={searchQuery}
        showAddModal={showAddModal}
        showRemoveModal={showRemoveModal}
        saToRemove={saToRemove}
        removingSa={removingSa}
        newSAName={newSAName}
        newSAEmail={newSAEmail}
        newSACoupon={newSACoupon}
        addingSa={addingSa}
        onSearchChange={setSearchQuery}
        onAddOpen={() => setShowAddModal(true)}
        onAddClose={() => setShowAddModal(false)}
        onAddSubmit={handleAddSubAdmin}
        onRemoveRequest={(sa) => { setSaToRemove(sa); setShowRemoveModal(true) }}
        onRemoveConfirm={handleRemoveSubAdmin}
        onRemoveCancel={() => { setShowRemoveModal(false); setSaToRemove(null) }}
        onNewSANameChange={setNewSAName}
        onNewSAEmailChange={setNewSAEmail}
        onNewSACouponChange={setNewSACoupon}
      />
    </PageContainer>
  )
}
