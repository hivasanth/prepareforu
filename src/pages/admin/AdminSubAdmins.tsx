import { useState, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { useToast, ToastContainer } from '../../hooks/useToast'
import {
  PageContainer,
  H1,
} from '../../components/common/AntigravityUI'
import { fetchAllSubAdmins, onboardSubAdmin, removeSubAdmin } from '../../services/userService'
import type { SubAdminRow } from '../../types/subAdmin.types'
import { subAdminOnboardSchema } from '../../validations/authSchemas'
import { AdminSubAdminsView } from '../../components/admin/sub-admins/AdminSubAdminsView'

type AddSubAdminFieldErrors = Partial<Record<'name' | 'email' | 'couponCode', string>>

export default function AdminSubAdmins() {
  const { user } = useAuth()
  const { toasts, showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [saToRemove, setSaToRemove] = useState<SubAdminRow | null>(null)
  const [removingSa, setRemovingSa] = useState<string | null>(null)

  const [newSAName, setNewSAName] = useState('')
  const [newSAEmail, setNewSAEmail] = useState('')
  const [newSACoupon, setNewSACoupon] = useState('')
  const [addingSa, setAddingSa] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [fieldErrors, setFieldErrors] = useState<AddSubAdminFieldErrors>({})
  const submittedRef = useRef(false)

  const { data, loading, error: queryError, refetch } = useSupabaseQuery(async () => {
    const rows = await fetchAllSubAdmins()
    return { data: rows, error: null }
  }, [])

  const filteredSAs: SubAdminRow[] = ((data || []) as unknown as SubAdminRow[]).filter((sa: SubAdminRow) =>
    sa.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sa.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sa.coupon_code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const runValidation = useCallback(() => {
    const result = subAdminOnboardSchema.safeParse({
      name: newSAName,
      email: newSAEmail,
      couponCode: newSACoupon,
    })
    const nextFieldErrors: AddSubAdminFieldErrors = {}
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof AddSubAdminFieldErrors | undefined
        if (field) nextFieldErrors[field] = issue.message
      })
    }
    return { result, fieldErrors: nextFieldErrors }
  }, [newSAName, newSAEmail, newSACoupon])

  const handleAddSubAdmin = useCallback(async () => {
    submittedRef.current = true
    const { result, fieldErrors } = runValidation()
    setFieldErrors(fieldErrors)
    if (!result.success) return

    setAddingSa(true)
    setError(null)
    try {
      await onboardSubAdmin(result.data.email, result.data.name, result.data.couponCode.trim().toUpperCase())
      showSuccess('Invitation sent to educator successfully!')
      setShowAddModal(false)
      setFieldErrors({})
      submittedRef.current = false
      setNewSAName('')
      setNewSAEmail('')
      setNewSACoupon('')
      refetch()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to onboard educator.')
    } finally {
      setAddingSa(false)
    }
  }, [runValidation, refetch, showSuccess])

  const handleFieldBlur = useCallback((field: keyof AddSubAdminFieldErrors) => {
    if (!submittedRef.current) return
    const { fieldErrors } = runValidation()
    setFieldErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
  }, [runValidation])

  const handleRemoveSubAdmin = useCallback(async () => {
    if (!saToRemove) return
    setRemovingSa(saToRemove.id)
    setError(null)
    try {
      const result = await removeSubAdmin({ user, requestId: `rem_${Date.now()}` }, saToRemove.id)
      if (!result.success) throw new Error(result.error?.message)
      showSuccess('Educator removed.')
      refetch()
      setShowRemoveModal(false)
      setSaToRemove(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove educator.')
    } finally {
      setRemovingSa(null)
    }
  }, [saToRemove, user, refetch, showSuccess])

  return (
    <PageContainer>
      <ToastContainer toasts={toasts} />
      <H1 className="sr-only">Manage Educators</H1>

      <AdminSubAdminsView
        filteredSAs={filteredSAs}
        loading={loading}
        error={queryError}
        actionError={error}
        searchQuery={searchQuery}
        showAddModal={showAddModal}
        showRemoveModal={showRemoveModal}
        saToRemove={saToRemove}
        removingSa={removingSa}
        newSAName={newSAName}
        newSAEmail={newSAEmail}
        newSACoupon={newSACoupon}
        addingSa={addingSa}
        fieldErrors={fieldErrors}
        onFieldBlur={handleFieldBlur}
        onSearchChange={setSearchQuery}
        onAddOpen={() => { setError(null); setShowAddModal(true) }}
        onAddClose={() => { setError(null); setShowAddModal(false); setFieldErrors({}); submittedRef.current = false }}
        onAddSubmit={handleAddSubAdmin}
        onRemoveRequest={(sa) => { setError(null); setSaToRemove(sa); setShowRemoveModal(true) }}
        onRemoveConfirm={handleRemoveSubAdmin}
        onRemoveCancel={() => { setError(null); setShowRemoveModal(false); setSaToRemove(null) }}
        onNewSANameChange={setNewSAName}
        onNewSAEmailChange={setNewSAEmail}
        onNewSACouponChange={setNewSACoupon}
      />
    </PageContainer>
  )
}
