import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import {
  PageContainer,
  H1,
} from '../../components/common/AntigravityUI'
import { fetchAllSubAdmins, onboardSubAdmin, removeSubAdmin, updateSubAdminCommission } from '../../services/userService'
import type { SubAdminRow } from '../../types/subAdmin.types'
import { subAdminOnboardSchema } from '../../validations/authSchemas'
import { normalizeError, mapDomainError } from '../../utils/errorClassification'
import type { DomainErrorInfo } from '../../types/error.types'
import { AdminSubAdminsView } from '../../components/admin/sub-admins/AdminSubAdminsView'
import { newRequestId } from '../../utils/uuid'

type AddSubAdminFieldErrors = Partial<Record<'name' | 'email' | 'couponCode' | 'commissionPercentage', string>>

// The on-the-wire idempotency key MUST be a strict RFC-4122 UUID when it
// reaches the edge function (its UUID_RE rejects anything else). This mirrors
// the server rule so we never ship a malformed value and never send one at
// all if the local lifecycle state is unexpectedly invalid.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function makeRequestId(): string {
  return newRequestId()
}

export default function AdminSubAdmins() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [domainError, setDomainError] = useState<DomainErrorInfo | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [showEditCommissionModal, setShowEditCommissionModal] = useState(false)
  const [saToRemove, setSaToRemove] = useState<SubAdminRow | null>(null)
  const [removingSa, setRemovingSa] = useState<string | null>(null)
  const [commissionEditTarget, setCommissionEditTarget] = useState<SubAdminRow | null>(null)
  const [commissionEditValue, setCommissionEditValue] = useState('')
  const [savingCommission, setSavingCommission] = useState(false)
  const [commissionEditError, setCommissionEditError] = useState<string | null>(null)

  const [newSAName, setNewSAName] = useState('')
  const [newSAEmail, setNewSAEmail] = useState('')
  const [newSACoupon, setNewSACoupon] = useState('')
  const [newSACommission, setNewSACommission] = useState('')
  const [generatedCoupon, setGeneratedCoupon] = useState<string | null>(null)
  const [addingSa, setAddingSa] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [fieldErrors, setFieldErrors] = useState<AddSubAdminFieldErrors>({})
  const submittedRef = useRef(false)
  // Idempotency key (§5): ONE per LOGICAL provisioning operation. Generated at
  // open, reused on a same-operation retry, cleared on success/cancel/close.
  // The server + DB dedupe on this key, so a retry after a success-timeout
  // resolves to the original profile instead of double-provisioning.
  const requestIdRef = useRef<string | null>(null)
  // Level-1 idempotency for REMOVE (AUDIT L2): ONE strict UUID per logical
  // removal operation — minted when the confirm dialog opens, reused unchanged
  // on a retry while that dialog stays open, cleared on cancel/success. The
  // EDGE deploy gates on this key, so a success-timeout retry dedupes instead
  // of reporting a spurious "already removed" failure.
  const removeRequestIdRef = useRef<string | null>(null)

  const { data, loading, error: queryError, refetch } = useSupabaseQuery(async () => {
    try {
      const rows = await fetchAllSubAdmins()
      return { data: rows, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }, ['sub_admins'])

  const allSAs = ((data || []) as unknown as SubAdminRow[])
  const filteredSAs: SubAdminRow[] = allSAs.filter((sa: SubAdminRow) =>
    sa.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sa.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sa.coupon_code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const runValidation = useCallback(() => {
    const result = subAdminOnboardSchema.safeParse({
      name: newSAName,
      email: newSAEmail,
      couponCode: newSACoupon,
      commissionPercentage: newSACommission,
    })
    const nextFieldErrors: AddSubAdminFieldErrors = {}
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof AddSubAdminFieldErrors | undefined
        if (field) nextFieldErrors[field] = issue.message
      })
    }
    return { result, fieldErrors: nextFieldErrors }
  }, [newSAName, newSAEmail, newSACoupon, newSACommission])

  const handleAddOpen = useCallback(() => {
    requestIdRef.current = makeRequestId()
    setSuccessMessage(null)
    setDomainError(null)
    setError(null)
    setGeneratedCoupon(null)
    setFieldErrors({})
    submittedRef.current = false
    setShowAddModal(true)
  }, [])

  const handleAddClose = useCallback(() => {
    requestIdRef.current = null
    setDomainError(null)
    setError(null)
    setShowAddModal(false)
    setFieldErrors({})
    submittedRef.current = false
    setNewSAName('')
    setNewSAEmail('')
    setNewSACoupon('')
    setNewSACommission('')
    setGeneratedCoupon(null)
  }, [])

  const handleAddSubAdmin = useCallback(async () => {
    submittedRef.current = true
    const { result, fieldErrors } = runValidation()
    setFieldErrors(fieldErrors)
    if (!result.success) return

    // Idempotency: reuse the SAME request_id when retrying a failed operation,
    // so the server/db resolves a success-timeout retry to the original
    // profile rather than double-provisioning. Cleared on success/close.
    //
    // Contract guard (§4/§9): never ship a missing/invalid key. This is an
    // internal lifecycle failure — NOT a user-data error, so it must not be
    // rendered as "Check Your Details". If the current ref is null or not a
    // strict UUID, DO NOT call the edge function: show a clear recoverable
    // error, regenerate EXACTLY ONE fresh valid key for the current attempt
    // (so the user's next click succeeds), and keep all form values intact.
    const requestId = requestIdRef.current
    if (!requestId || !UUID_RE.test(requestId)) {
      setDomainError(mapDomainError('REQUEST_ID_INVALID', undefined))
      setError('Your onboarding session expired. Please try again.')
      requestIdRef.current = makeRequestId()
      return
    }

    setAddingSa(true)
    setDomainError(null)
    setError(null)
    try {
      const res = await onboardSubAdmin({
        email: result.data.email,
        fullName: result.data.name,
        couponCode: result.data.couponCode.trim().toUpperCase(),
        commissionPercentage: result.data.commissionPercentage === '' ? null : Number(result.data.commissionPercentage),
        requestId,
      })
      if (!res.success) {
        throw new Error(res.error?.message || res.data?.message || 'Failed to onboard educator.')
      }
      // If the admin left the coupon blank, the server auto-generated one —
      // surface it so it can be shared with the new educator.
      setGeneratedCoupon(res.coupon_code ?? null)
      setSuccessMessage('Invitation sent to educator successfully!')
      requestIdRef.current = null
      setShowAddModal(false)
      setFieldErrors({})
      submittedRef.current = false
      setNewSAName('')
      setNewSAEmail('')
      setNewSACoupon('')
      setNewSACommission('')
      refetch()
    } catch (err: unknown) {
      const normalized = normalizeError(err)
      // Prefer the backend `code` carried on the thrown Error (.code/.status)
      // for canonical domain UX + navigation.
      const code = (err as { code?: string })?.code
      const status = (err as { status?: number })?.status
      const rawMessage = normalized.debugMessage ?? normalized.message
      const domainInfo = mapDomainError(code, rawMessage, status)
      setDomainError(domainInfo)
      setError(normalized.message)
      if (domainInfo.navigateTo) {
        navigate(domainInfo.navigateTo)
      }
    } finally {
      setAddingSa(false)
    }
  }, [runValidation, refetch, navigate])

  const handleFieldBlur = useCallback((field: keyof AddSubAdminFieldErrors) => {
    if (!submittedRef.current) return
    const { fieldErrors } = runValidation()
    setFieldErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
  }, [runValidation])

  const handleRemoveSubAdmin = useCallback(async () => {
    if (!saToRemove) return
    setRemovingSa(saToRemove.id)
    setError(null)
    setSuccessMessage(null)
    setGeneratedCoupon(null)
    try {
      // Reuse the dialog-scoped idempotency key (minted at open, L2); fall back
      // to a fresh UUID only if the lifecycle state was somehow cleared.
      const requestId = removeRequestIdRef.current ?? makeRequestId()
      const result = await removeSubAdmin({ user, requestId }, saToRemove.id)
      if (!result.success) throw new Error(result.error?.message)
      removeRequestIdRef.current = null
      setSuccessMessage('Educator removed.')
      refetch()
      setShowRemoveModal(false)
      setSaToRemove(null)
    } catch (err: unknown) {
      setError(normalizeError(err).message)
    } finally {
      setRemovingSa(null)
    }
  }, [saToRemove, user, refetch])

  const handleEditCommissionOpen = useCallback((sa: SubAdminRow) => {
    setCommissionEditTarget(sa)
    setCommissionEditValue(sa.commission_percentage != null ? String(sa.commission_percentage) : '0')
    setCommissionEditError(null)
    setShowEditCommissionModal(true)
  }, [])

  const handleEditCommissionClose = useCallback(() => {
    setCommissionEditTarget(null)
    setCommissionEditValue('')
    setCommissionEditError(null)
    setShowEditCommissionModal(false)
  }, [])

  const handleEditCommissionSave = useCallback(async () => {
    if (!commissionEditTarget) return
    // Local validation before hitting the RPC (same rule as the create form).
    const raw = commissionEditValue.trim()
    if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
      setCommissionEditError('Commission must be a valid number up to 2 decimals.')
      return
    }
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      setCommissionEditError('Commission must be between 0 and 100.')
      return
    }

    setSavingCommission(true)
    setCommissionEditError(null)
    setSuccessMessage(null)
    setGeneratedCoupon(null)
    try {
      const result = await updateSubAdminCommission(
        commissionEditTarget.id,
        parsed,
        commissionEditTarget.updated_at,
      )
      if (!result.success) throw new Error(result.error?.message || 'Failed to update commission.')
      setSuccessMessage('Commission updated.')
      refetch()
      setShowEditCommissionModal(false)
      setCommissionEditTarget(null)
      setCommissionEditValue('')
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      const status = (err as { status?: number })?.status
      const domainInfo = mapDomainError(code, normalizeError(err).debugMessage ?? normalizeError(err).message, status)
      setCommissionEditError(domainInfo.message)
      if (domainInfo.navigateTo) {
        navigate(domainInfo.navigateTo)
      }
    } finally {
      setSavingCommission(false)
    }
  }, [commissionEditTarget, commissionEditValue, refetch, navigate])

  return (
    <PageContainer>
      <H1 className="sr-only">Manage Educators</H1>

      <AdminSubAdminsView
        filteredSAs={filteredSAs}
        totalCount={allSAs.length}
        loading={loading}
        error={queryError}
        actionError={error}
        domainError={domainError}
        successMessage={successMessage}
        onDismissSuccess={() => { setSuccessMessage(null); setGeneratedCoupon(null) }}
        searchQuery={searchQuery}
        showAddModal={showAddModal}
        showRemoveModal={showRemoveModal}
        showEditCommissionModal={showEditCommissionModal}
        saToRemove={saToRemove}
        removingSa={removingSa}
        newSAName={newSAName}
        newSAEmail={newSAEmail}
        newSACoupon={newSACoupon}
        newSACommission={newSACommission}
        generatedCoupon={generatedCoupon}
        addingSa={addingSa}
        commissionEditTarget={commissionEditTarget}
        commissionEditValue={commissionEditValue}
        savingCommission={savingCommission}
        commissionEditError={commissionEditError}
        fieldErrors={fieldErrors}
        onFieldBlur={handleFieldBlur}
        onSearchChange={setSearchQuery}
        onAddOpen={handleAddOpen}
        onAddClose={handleAddClose}
        onAddSubmit={handleAddSubAdmin}
        onRemoveRequest={(sa) => { setError(null); setSuccessMessage(null); setGeneratedCoupon(null); setSaToRemove(sa); setShowRemoveModal(true); removeRequestIdRef.current = makeRequestId() }}
        onRemoveConfirm={handleRemoveSubAdmin}
        onRemoveCancel={() => { setError(null); setShowRemoveModal(false); setSaToRemove(null); removeRequestIdRef.current = null }}
        onNewSANameChange={setNewSAName}
        onNewSAEmailChange={setNewSAEmail}
        onNewSACouponChange={setNewSACoupon}
        onNewSACommissionChange={setNewSACommission}
        onEditCommissionOpen={handleEditCommissionOpen}
        onEditCommissionClose={handleEditCommissionClose}
        onEditCommissionSave={handleEditCommissionSave}
        onCommissionEditValueChange={setCommissionEditValue}
        onRetry={refetch}
      />
    </PageContainer>
  )
}
