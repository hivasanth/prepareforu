import { useCallback, useEffect, useRef } from 'react'
import { Shield, Search, Tag, Trash2, Plus, AlertCircle, ShieldCheck, Pencil, CheckCircle2 } from 'lucide-react'
import {
  Button, IconButton, Input, Badge, Stack, Card,
  Label, Alert, Body, H2, ErrorContainer, RetryButton,
  FloatingList, FloatingListHeader, FloatingListItem,
  CollectionToolbar,
} from '../../common/AntigravityUI'
import { AdminText } from '../../common/AdminText'
import { EmptyState, LoadingSkeleton, ConfirmModal, FieldError } from '../../common/SharedComponents'
import { AdminModal } from '../../common/AdminModal'
import { UserIdentity } from '../users/UserIdentity'
import { formatDate } from '../../../utils/dateUtils'
import { SUB_ADMIN_TABLE_GRID, HEADER_CELL } from './subAdminTableGrid'
import type { SubAdminRow } from '../../../types/subAdmin.types'
import type { DomainErrorInfo } from '../../../types/error.types'

function formatCommission(value: number | null | undefined): string {
  if (value == null) return '0%'
  const n = Number(value)
  const safe = Number.isFinite(n) ? n : 0
  return `${safe}%`
}

/* A2: heuristic-free focus order for the add form — DOM order, stable. */
type AddFieldKey = 'name' | 'email' | 'couponCode' | 'commissionPercentage'
const ADD_FIELD_ORDER: Array<AddFieldKey> = ['name', 'email', 'couponCode', 'commissionPercentage']
const ADD_FIELD_IDS: Record<AddFieldKey, string> = {
  name: 'sa-name',
  email: 'sa-email',
  couponCode: 'sa-coupon',
  commissionPercentage: 'sa-commission',
}

interface AdminSubAdminsViewProps {
  filteredSAs: SubAdminRow[]
  /** Total educators before client-side search filtering. */
  totalCount: number
  loading: boolean
  error: string | null
  actionError: string | null
  /** Page-level mutation success message rendered as a success Alert. */
  successMessage?: string | null
  onDismissSuccess?: () => void
  domainError?: DomainErrorInfo | null
  searchQuery: string
  showAddModal: boolean
  showRemoveModal: boolean
  showEditCommissionModal: boolean
  saToRemove: SubAdminRow | null
  removingSa: string | null
  newSAName: string
  newSAEmail: string
  newSACoupon: string
  newSACommission: string
  generatedCoupon?: string | null
  addingSa: boolean
  commissionEditTarget: SubAdminRow | null
  commissionEditValue: string
  savingCommission: boolean
  commissionEditError: string | null
  fieldErrors?: Partial<Record<'name' | 'email' | 'couponCode' | 'commissionPercentage', string>>
  onFieldBlur?: (field: 'name' | 'email' | 'couponCode' | 'commissionPercentage') => void
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
  onNewSACommissionChange: (val: string) => void
  onEditCommissionOpen: (sa: SubAdminRow) => void
  onEditCommissionClose: () => void
  onEditCommissionSave: () => void
  onCommissionEditValueChange: (val: string) => void
  onRetry: () => void
}

export function AdminSubAdminsView({
  filteredSAs, totalCount, loading, error, actionError, successMessage = null, onDismissSuccess, domainError = null, searchQuery,
  showAddModal, showRemoveModal, showEditCommissionModal,
  saToRemove, removingSa,
  newSAName, newSAEmail, newSACoupon, newSACommission, addingSa,
  generatedCoupon = null,
  commissionEditTarget, commissionEditValue, savingCommission, commissionEditError,
  fieldErrors = {}, onFieldBlur,
  onSearchChange, onAddOpen, onAddClose, onAddSubmit,
  onRemoveRequest, onRemoveConfirm, onRemoveCancel,
  onNewSANameChange, onNewSAEmailChange, onNewSACouponChange, onNewSACommissionChange,
  onEditCommissionOpen, onEditCommissionClose, onEditCommissionSave, onCommissionEditValueChange,
  onRetry
}: AdminSubAdminsViewProps) {

  /* ═══ A2: focus management on submit. The generic modal trap only honours
     [data-modal-initial-focus] at OPEN time, so a failed re-submit while the
     modal stays open must recover focus onto the first invalid field here.
     First invalid field (DOM order) wins; Enter/gamepad free. */
  const addFormRef = useRef<HTMLFormElement | null>(null)
  const commissionFormRef = useRef<HTMLFormElement | null>(null)

  const focusFirstInvalid = useCallback((
    formRef: { current: HTMLFormElement | null },
    order: Array<AddFieldKey>,
    errors: Partial<Record<AddFieldKey, string>>,
  ) => {
    const form = formRef.current
    if (!form) return
    const first = order.find((field) => Boolean(errors[field]))
    if (!first) return
    const node = form.querySelector<HTMLElement>(`#${ADD_FIELD_IDS[first]}`)
    if (!node) return
    node.focus({ preventScroll: true })
    node.scrollIntoView({ block: 'nearest' })
  }, [])

  useEffect(() => {
    if (!Object.values(fieldErrors).some(Boolean)) return
    focusFirstInvalid(addFormRef, ADD_FIELD_ORDER, fieldErrors)
  }, [fieldErrors, focusFirstInvalid])

  useEffect(() => {
    if (!commissionEditError) return
    const node = commissionFormRef.current?.querySelector<HTMLElement>('#edit-commission')
    if (!node) return
    node.focus({ preventScroll: true })
    node.scrollIntoView({ block: 'nearest' })
  }, [commissionEditError])

  /* ═══ Row — SAME grid contract as the header (header ↔ row alignment) ═══ */
  const renderEducatorItem = (sa: SubAdminRow) => (
    <FloatingListItem
      key={sa.id}
      padding="md"
      innerClassName={`${SUB_ADMIN_TABLE_GRID} w-full`}
      role="row"
    >
      {/* EDUCATOR */}
      <div className="flex items-center gap-3 min-w-0" role="cell">
        <UserIdentity name={sa.full_name} email={sa.email} truncate />
      </div>

      {/* COUPON */}
      <div className="flex justify-center min-w-0" role="cell">
        <Badge
          variant="primary"
          icon={Tag}
          className="max-w-full overflow-hidden"
          title={sa.coupon_code}
        >
          {sa.coupon_code}
        </Badge>
      </div>

      {/* JOINED */}
      <div className="hidden md:flex justify-center min-w-0" role="cell">
        <AdminText as="span" variant="sans" size="metadata" className="text-text-primary truncate">
          {formatDate(sa.created_at)}
        </AdminText>
      </div>

      {/* REFERRALS */}
      <div className="hidden lg:flex justify-center" role="cell">
        <AdminText as="span" variant="sans" size="metadata" className="font-medium text-text-primary">
          {sa.total_referrals ?? 0}
        </AdminText>
      </div>

      {/* STATUS */}
      <div className="hidden lg:flex justify-center" role="cell">
        {sa.status === 'active' ? (
          <Badge variant="success" icon={ShieldCheck}>
            Active
          </Badge>
        ) : (
          <AdminText as="span" variant="sans" size="metadata" className="text-text-muted">
            —
          </AdminText>
        )}
      </div>

      {/* COMMISSION */}
      <div className="flex justify-center min-w-0" role="cell">
        <AdminText as="span" variant="sans" size="metadata" className="font-semibold text-text-primary truncate">
          {formatCommission(sa.commission_percentage)}
        </AdminText>
      </div>

      {/* ACTIONS: Edit (commission) + Remove */}
      <div className="flex justify-center gap-1" role="cell">
        <IconButton
          aria-label={`Edit commission for ${sa.full_name}`}
          variant="ghost"
          onClick={() => onEditCommissionOpen(sa)}
        >
          <Pencil size={16} />
        </IconButton>
        <IconButton
          aria-label={`Remove ${sa.full_name}`}
          variant="danger-soft"
          onClick={() => onRemoveRequest(sa)}
          disabled={removingSa === sa.id}
        >
          <Trash2 size={16} />
        </IconButton>
      </div>
    </FloatingListItem>
  )

  /* ═══ Skeleton — shape-matched chrome: count bar → elevated Card →
         header skeleton → row skeletons on the SAME grid ═══ */
  const loadingSkeleton = (
    <Card variant="elevated">
      <div role="status" aria-label="Loading educators">
        <LoadingSkeleton height={10} width={140} borderRadius={4} className="mb-3" decorative />
        <FloatingList gap="md">
          <FloatingListHeader padding="md">
            <div className={SUB_ADMIN_TABLE_GRID}>
              <div><LoadingSkeleton height={12} width={56} borderRadius={4} decorative /></div>
              <div className="flex justify-center"><LoadingSkeleton height={12} width={44} borderRadius={4} decorative /></div>
              <div className="hidden md:flex justify-center"><LoadingSkeleton height={12} width={44} borderRadius={4} decorative /></div>
              <div className="hidden lg:flex justify-center"><LoadingSkeleton height={12} width={56} borderRadius={4} decorative /></div>
              <div className="hidden lg:flex justify-center"><LoadingSkeleton height={12} width={40} borderRadius={4} decorative /></div>
              <div className="flex justify-center"><LoadingSkeleton height={12} width={40} borderRadius={4} decorative /></div>
              <div className="flex justify-center"><LoadingSkeleton height={12} width={72} borderRadius={4} decorative /></div>
            </div>
          </FloatingListHeader>
          {Array.from({ length: 5 }).map((_, i) => (
            <FloatingListItem key={i} padding="md" innerClassName={`${SUB_ADMIN_TABLE_GRID} w-full`}>
              <div className="flex items-center gap-3 min-w-0">
                <LoadingSkeleton height={40} width={40} borderRadius={9999} decorative />
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <LoadingSkeleton height={12} width="70%" borderRadius={4} decorative />
                  <LoadingSkeleton height={10} width="50%" borderRadius={4} decorative />
                </div>
              </div>
              <div className="flex justify-center"><LoadingSkeleton height={28} width={72} borderRadius={14} decorative /></div>
              <div className="hidden md:flex justify-center"><LoadingSkeleton height={12} width={56} borderRadius={4} decorative /></div>
              <div className="hidden lg:flex justify-center"><LoadingSkeleton height={12} width={24} borderRadius={4} decorative /></div>
              <div className="hidden lg:flex justify-center"><LoadingSkeleton height={28} width={64} borderRadius={14} decorative /></div>
              <div className="flex justify-center"><LoadingSkeleton height={12} width={32} borderRadius={4} decorative /></div>
              <div className="flex justify-center gap-1">
                <LoadingSkeleton height={44} width={44} borderRadius={12} decorative />
                <LoadingSkeleton height={44} width={44} borderRadius={12} decorative />
              </div>
            </FloatingListItem>
          ))}
        </FloatingList>
      </div>
    </Card>
  )

  /* ═══ Empty — differentiated: no data vs no search matches ═══ */
  const hasSearch = searchQuery.trim().length > 0
  const emptyState = hasSearch ? (
    <EmptyState
      variant="management"
      icon={<Search size={48} />}
      title="No Matches"
      subtitle="No educators match your current search."
    />
  ) : (
    <EmptyState
      variant="management"
      icon={<Shield size={48} />}
      title="No Educators Yet"
      subtitle="Onboard your first educator to get started."
      actionLabel="Add Educator"
      onAction={onAddOpen}
    />
  )

  return (
    <>
      <Stack gap="lg">
        {/* ═══ Toolbar — management family: search + Add Educator ═══ */}
        <CollectionToolbar variant="management">
          <div className="flex-1 min-w-0">
            <Input
              variant="management"
              leftIcon={Search}
              placeholder="Search educators by name, email or coupon..."
              aria-label="Search educators"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
          <Button variant="primary" onClick={onAddOpen} className="shrink-0">
            <Plus size={16} />
            <span className="hidden sm:inline">Add Educator</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </CollectionToolbar>

        {successMessage && (
          <Alert
            variant="success"
            icon={CheckCircle2}
            title={generatedCoupon ? 'Coupon code generated' : 'Action complete'}
            className="w-full"
            onDismiss={onDismissSuccess}
          >
            {successMessage}
            {generatedCoupon && (
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold inline-flex items-center gap-1.5">
                  <Tag size={14} className="shrink-0" /> Coupon Code:
                </span>
                <span className="font-mono text-[15px] font-black tracking-wide">{generatedCoupon}</span>
              </div>
            )}
          </Alert>
        )}

        {error ? (
          <ErrorContainer category="unknown" variant="page">
            <H2>Failed to load educators</H2>
            <Body>{error}</Body>
            <RetryButton onRetry={onRetry} />
          </ErrorContainer>
        ) : loading ? (
          loadingSkeleton
        ) : filteredSAs.length > 0 ? (
          <div>
            {/* Result count — above the list container, canonical micro-caps.
                SA-6: the live region is scoped to the count text alone so
                filter changes announce one meaningful summary instead of the
                entire interactive list. Loading is announced by the skeleton's
                role="status"; errors by the alert surface's role="alert". */}
            <p
              aria-live="polite"
              aria-label={`Showing ${filteredSAs.length} of ${totalCount} educators`}
              className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3"
            >
              Showing {filteredSAs.length} of {totalCount} {totalCount === 1 ? 'Educator' : 'Educators'}
            </p>
            <Card variant="elevated">
              {/* A3: presentational grid → ARIA table. role=table (NOT grid):
                  rows are not navigable widgets. Roles only — the DOM shape and
                  grid alignment contract are untouched, so header ↔ row CSS
                  alignment tests remain valid. overflow-x-auto + min-w-0 (L1):
                  below ~350px the fixed tracks (104/72/96 + gaps) overflow the
                  card, so scroll the table surface locally instead of letting
                  the page overflow horizontally (page-level overflow stays 0 —
                  e2e asserts documentElement overflow at 390px). */}
              <div role="table" aria-label="Educators" className="min-w-0 overflow-x-auto">
                <FloatingList gap="md">
                  {/* ═══ Header — SAME grid contract as every row ══════════ */}
                  <FloatingListHeader padding="md">
                    <div role="row" className={`${SUB_ADMIN_TABLE_GRID} text-text-muted light:text-[var(--gold-300)]`}>
                      <span role="columnheader" className={`${HEADER_CELL} text-left`}>Educator</span>
                      <span role="columnheader" className={`${HEADER_CELL} text-center`}>Coupon</span>
                      <span role="columnheader" className={`${HEADER_CELL} hidden md:block text-center`}>Joined</span>
                      <span role="columnheader" className={`${HEADER_CELL} hidden lg:block text-center`}>Referrals</span>
                      <span role="columnheader" className={`${HEADER_CELL} hidden lg:block text-center`}>Status</span>
                      <span role="columnheader" className={`${HEADER_CELL} text-center`}>Commission</span>
                      <span role="columnheader" className={`${HEADER_CELL} text-center`}>Actions</span>
                    </div>
                  </FloatingListHeader>

                  {/* ═══ Rows ══════════════════════════════════════════════ */}
                  {filteredSAs.map(renderEducatorItem)}
                </FloatingList>
              </div>
            </Card>
          </div>
        ) : (
          emptyState
        )}
      </Stack>

      <AdminModal
        isOpen={showAddModal}
        onClose={onAddClose}
        title="Onboard New Educator"
        variant="management"
      >
        <form
          ref={addFormRef}
          aria-label="Onboard New Educator"
          noValidate
          onSubmit={(e) => { e.preventDefault(); onAddSubmit() }}
        >
        <Stack gap="lg">
          {(actionError || domainError) && (
            <Alert variant="error" icon={AlertCircle} title={domainError?.title ?? 'Action failed'}>
              {domainError?.message ?? actionError}
            </Alert>
          )}
          <Stack gap="sm">
            <Label htmlFor="sa-name">Display Name</Label>
            <Input
              id="sa-name"
              placeholder="e.g. Dr. Satish Kumar"
              value={newSAName}
              onChange={(e) => onNewSANameChange(e.target.value)}
              onBlur={() => onFieldBlur?.('name')}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'sa-name-error' : undefined}
            />
            {fieldErrors.name && (
              <FieldError id="sa-name-error">{fieldErrors.name}</FieldError>
            )}
          </Stack>
          <Stack gap="sm">
            <Label htmlFor="sa-email">Email Address</Label>
            <Input
              id="sa-email"
              type="email"
              placeholder="e.g. satish@example.com"
              value={newSAEmail}
              onChange={(e) => onNewSAEmailChange(e.target.value)}
              onBlur={() => onFieldBlur?.('email')}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'sa-email-error' : undefined}
            />
            {fieldErrors.email && (
              <FieldError id="sa-email-error">{fieldErrors.email}</FieldError>
            )}
          </Stack>
          <Stack gap="sm">
            <Label htmlFor="sa-coupon">Coupon Code (optional)</Label>
            <Input
              id="sa-coupon"
              placeholder="Leave blank to auto-generate"
              value={newSACoupon}
              onChange={(e) => onNewSACouponChange(e.target.value)}
              onBlur={() => onFieldBlur?.('couponCode')}
              aria-invalid={!!fieldErrors.couponCode}
              aria-describedby={fieldErrors.couponCode ? 'sa-coupon-error' : undefined}
            />
            {fieldErrors.couponCode ? (
              <FieldError id="sa-coupon-error">{fieldErrors.couponCode}</FieldError>
            ) : (
              <AdminText as="span" variant="sans" size="metadata" className="text-text-muted mt-1">
                Leave blank and a unique code is generated for you.
              </AdminText>
            )}
          </Stack>
          <Stack gap="sm">
            <Label htmlFor="sa-commission">Commission (%) — optional</Label>
            <Input
              id="sa-commission"
              inputMode="decimal"
              placeholder="e.g. 20"
              value={newSACommission}
              onChange={(e) => onNewSACommissionChange(e.target.value)}
              onBlur={() => onFieldBlur?.('commissionPercentage')}
              aria-invalid={!!fieldErrors.commissionPercentage}
              aria-describedby={fieldErrors.commissionPercentage ? 'sa-commission-error' : undefined}
            />
            {fieldErrors.commissionPercentage && (
              <FieldError id="sa-commission-error">{fieldErrors.commissionPercentage}</FieldError>
            )}
          </Stack>
          <Button fullWidth type="submit" loading={addingSa}>
            Confirm Onboarding
          </Button>
        </Stack>
        </form>
      </AdminModal>

      <AdminModal
        isOpen={showEditCommissionModal}
        onClose={onEditCommissionClose}
        title={`Set Commission — ${commissionEditTarget?.full_name ?? ''}`}
        variant="management"
      >
        <form
          ref={commissionFormRef}
          aria-label="Edit Commission"
          noValidate
          onSubmit={(e) => { e.preventDefault(); onEditCommissionSave() }}
        >
        <Stack gap="md">
          {commissionEditError && (
            <Alert variant="error" icon={AlertCircle} title="Could not save">
              {commissionEditError}
            </Alert>
          )}
          <AdminText as="p" variant="sans" size="body" className="text-text-secondary">
            Enter the commission percentage (0–100) this educator earns. This is applied to their referrals.
          </AdminText>
          <Stack gap="sm">
            <Label htmlFor="edit-commission">Commission (%)</Label>
            <Input
              id="edit-commission"
              data-modal-initial-focus
              inputMode="decimal"
              value={commissionEditValue}
              onChange={(e) => onCommissionEditValueChange(e.target.value)}
              aria-invalid={!!commissionEditError}
              aria-describedby={commissionEditError ? 'edit-commission-error' : undefined}
            />
            {commissionEditError && (
              <FieldError id="edit-commission-error">{commissionEditError}</FieldError>
            )}
          </Stack>
          <Button fullWidth type="submit" loading={savingCommission}>
            Save Commission
          </Button>
        </Stack>
        </form>
      </AdminModal>

      <ConfirmModal
        open={showRemoveModal}
        onCancel={onRemoveCancel}
        onConfirm={onRemoveConfirm}
        title="Remove Educator?"
        message={
          <>
            Are you sure you want to remove {saToRemove?.full_name}? This action is permanent.
            {actionError && (
              <div className="mt-3">
                <Alert variant="error" icon={AlertCircle} title="Action failed">
                  {actionError}
                </Alert>
              </div>
            )}
          </>
        }
        confirmLabel="Remove Access"
        danger={true}
        busy={!!removingSa}
      />
    </>
  )
}
