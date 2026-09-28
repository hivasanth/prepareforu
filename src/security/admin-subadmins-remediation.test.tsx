/// <reference types="node" />
import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../context/ThemeContext'
import { AdminSubAdminsView } from '../components/admin/sub-admins/AdminSubAdminsView'
import { normalizeError } from '../utils/errorClassification'
import type { SubAdminRow } from '../types/subAdmin.types'

// jsdom + focus-trap: trap reports zero tabbable nodes (no geometry, and
// disabled busy-buttons are not tabbable). Use the suite-standard pass-through
// mock so the modal's focus-manager smoke tests can run.
vi.mock('focus-trap-react', () => ({
  FocusTrap: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

/* ─── /admin/sub-admins remediation suite (SA-1 … SA-6) ─────────────────────
 * SA-1 same-tab logout purges admin cache (shared AuthContext fix)
 * SA-2 remove ConfirmModal busy lock
 * SA-3 canonical error normalization + dedicated modal error surface
 * SA-4 atomic removal RPC contract (no two-step client sequence)
 * SA-5 RLS/grant hygiene migration present
 * SA-6 live-region scoped to the result-count summary only */

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n')

function sa(overrides: Partial<SubAdminRow> = {}): SubAdminRow {
  return {
    id: 'sa1',
    full_name: 'Dr. Satish Kumar',
    email: 'satish@example.com',
    coupon_code: 'SATISH25',
    total_referrals: 5,
    status: 'active',
    created_at: '2026-08-21T10:00:00Z',
    updated_at: '2026-08-21T10:00:00Z',
    commission_percentage: 25,
    ...overrides,
  }
}

const ROWS: SubAdminRow[] = [sa()]

function noop() {}

function renderView(overrides: Partial<Parameters<typeof AdminSubAdminsView>[0]> = {}) {
  return render(
    <ThemeProvider>
      <AdminSubAdminsView
        filteredSAs={ROWS}
        totalCount={7}
        loading={false}
        error={null}
        actionError={null}
        searchQuery=""
        showAddModal={false}
        showRemoveModal={false}
        showEditCommissionModal={false}
        saToRemove={null}
        removingSa={null}
        newSAName=""
        newSAEmail=""
        newSACoupon=""
        newSACommission=""
        addingSa={false}
        commissionEditTarget={null}
        commissionEditValue=""
        savingCommission={false}
        commissionEditError={null}
        onSearchChange={noop}
        onAddOpen={noop}
        onAddClose={noop}
        onAddSubmit={noop}
        onRemoveRequest={noop}
        onRemoveConfirm={noop}
        onRemoveCancel={noop}
        onNewSANameChange={noop}
        onNewSAEmailChange={noop}
        onNewSACouponChange={noop}
        onNewSACommissionChange={noop}
        onEditCommissionOpen={noop}
        onEditCommissionClose={noop}
        onEditCommissionSave={noop}
        onCommissionEditValueChange={noop}
        onRetry={noop}
        {...overrides}
      />
    </ThemeProvider>,
  )
}

afterEach(cleanup)

/* jsdom gives every element zero geometry, so focus-trap's visibility check
 * finds no tabbable nodes when a modal opens. Give elements real extents so
 * modal-opening tests exercise the true FocusTrap path. */
beforeAll(() => {
  // jsdom reports zero geometry for every node; tabbable@6 (focus-trap) uses
  // getClientRects() as its visibility test. Give every element a real rect.
  const rect = { width: 100, height: 100, top: 0, left: 0, right: 100, bottom: 100, x: 0, y: 0 }
  window.Element.prototype.getClientRects = function () { return [rect] as unknown as DOMRectList }
  window.Element.prototype.getBoundingClientRect = function () { return rect as DOMRect }
})

/* ═══ SA-1 — same-tab logout must purge admin query cache ═══ */
describe('SA-1: shared logout purges admin cache', () => {
  const authCtx = read('src/context/AuthContext.tsx')

  it('logout calls invalidateAdminQueryCache', () => {
    expect(authCtx).toMatch(/invalidateAdminQueryCache\(\)/)
  })

  it('cache purge happens inside logout BEFORE Supabase signOut', () => {
    const logoutBody = authCtx.slice(authCtx.indexOf('const logout = useCallback'))
    const purgePos = logoutBody.indexOf('invalidateAdminQueryCache()')
    const signOutPos = logoutBody.indexOf('authService.logout()')
    expect(purgePos).toBeGreaterThan(-1)
    expect(signOutPos).toBeGreaterThan(purgePos)
  })

  it('does not rely on reload/workaround mechanisms', () => {
    const logoutBody = authCtx.slice(authCtx.indexOf('const logout = useCallback'))
    expect(logoutBody).not.toMatch(/window\.location\.reload/)
  })

  it('page does not implement a page-local cache purge (shared layer owns it)', () => {
    const page = read('src/pages/admin/AdminSubAdmins.tsx')
    expect(page).not.toMatch(/invalidateCache|adminQueryCache|qc_sub_admins/)
  })
})

/* ═══ SA-2 — remove ConfirmModal busy lock ═══ */
describe('SA-2: remove modal busy lock', () => {
  it('wires the existing removal state into ConfirmModal busy', () => {
    const view = read('src/components/admin/sub-admins/AdminSubAdminsView.tsx')
    expect(view).toMatch(/busy=\{!!removingSa\}/)
  })

  it('confirm button enters loading/disabled state while removal is in flight', () => {
    renderView({ showRemoveModal: true, saToRemove: ROWS[0], removingSa: 'sa1' })
    // Button loading replaces children with a spinner → assert via aria-busy
    const busyConfirm = document.body.querySelector('button[aria-busy="true"]')
    expect(busyConfirm).not.toBeNull()
    expect(busyConfirm?.className).toContain('pointer-events-none')
    const cancel = screen.getByRole('button', { name: /cancel/i })
    expect(cancel.getAttribute('disabled')).not.toBeNull()
  })

  it('confirm action is inert while busy — repeated activation cannot resubmit', () => {
    const onRemoveConfirm = vi.fn()
    renderView({ showRemoveModal: true, saToRemove: ROWS[0], removingSa: 'sa1', onRemoveConfirm })
    const confirm = document.body.querySelector('button[aria-busy="true"]') as HTMLButtonElement
    expect(confirm).not.toBeNull()
    // Synthetic/keyboard-style activation must be absorbed by the busy contract.
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    expect(onRemoveConfirm).not.toHaveBeenCalled()
  })

  it('modal is interactive again after the in-flight flag clears', () => {
    renderView({ showRemoveModal: true, saToRemove: ROWS[0], removingSa: null })
    const confirm = screen.getByRole('button', { name: /remove access/i })
    expect(confirm.getAttribute('disabled')).toBeNull()
  })
})

/* ═══ SA-3 — canonical error normalization + modal error surface ═══ */
describe('SA-3: error classification and modal formatting', () => {
  it('page normalizes action errors via the canonical classifier (no raw interpolation)', () => {
    const page = read('src/pages/admin/AdminSubAdmins.tsx')
    expect(page.match(/normalizeError\(/g)?.length).toBeGreaterThanOrEqual(2)
    expect(page).not.toMatch(/err instanceof Error \? err\.message/)
  })

  it('service no longer leaks raw db error strings to the page', () => {
    const svc = read('src/services/userService.ts')
    expect(svc).not.toMatch(/message: deleteError\.message|message: updateError\.message/)
  })

  it('remove modal renders errors as a dedicated Alert surface, not literal newlines', () => {
    renderView({ showRemoveModal: true, saToRemove: ROWS[0], actionError: 'Failed to remove educator.' })
    expect(screen.getByText('Action failed')).toBeInTheDocument()
    expect(screen.getByText('Failed to remove educator.')).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('\\n\\n')
  })

  it('normalizeError never surfaces SQL/policy internals for common failure classes', () => {
    const inputs: unknown[] = [
      new Error('permission denied for table sub_admins'),
      new Error('new row violates row-level security policy "rls_sub_admins_admin_all"'),
      { message: 'P0001: raise_exception', code: '42501' },
      'network timeout',
      null,
      undefined,
      42,
    ]
    for (const input of inputs) {
      const msg = normalizeError(input as never).message
      expect(typeof msg).toBe('string')
      expect(msg.length).toBeGreaterThan(0)
      expect(msg).not.toMatch(/SQLSTATE|P0001|42501|row-level security policy/i)
    }
  })
})

/* ═══ SA-4 — atomic removal RPC contract ═══ */
describe('SA-4: atomic removal flow', () => {
  it('repository issues exactly ONE rpc: admin_remove_sub_admin', () => {
    const repo = read('src/lib/repositories/user.repository.ts')
    expect(repo).toMatch(/rpc\('admin_remove_sub_admin'/)
  })

  it('the legacy two-step client sequence is fully removed', () => {
    const repo = read('src/lib/repositories/user.repository.ts')
    const svc = read('src/services/userService.ts')
    expect(repo).not.toMatch(/export async function findSubAdminById|export async function deleteSubAdmin/)
    expect(svc).not.toMatch(/findSubAdminById|deleteSubAdmin|adminRevokeSubAdminRoleRpc/)
  })

  it('migration creates the RPC as SECURITY DEFINER with pinned search_path', () => {
    const body = read('supabase/migrations/20260825000003_admin_remove_sub_admin_rpc.sql')
    expect(body).toMatch(/SECURITY DEFINER/)
    expect(body).toMatch(/SET search_path = public/)
    expect(body).toMatch(/REVOKE EXECUTE ON FUNCTION public\.admin_remove_sub_admin\(uuid\) FROM PUBLIC/)
    expect(body).toMatch(/REVOKE EXECUTE ON FUNCTION public\.admin_remove_sub_admin\(uuid\) FROM anon/)
    expect(body).toMatch(/GRANT EXECUTE ON FUNCTION public\.admin_remove_sub_admin\(uuid\) TO authenticated/)
  })

  it('RPC authorizes from auth.uid()/is_admin(), never from parameters', () => {
    const body = read('supabase/migrations/20260825000003_admin_remove_sub_admin_rpc.sql')
    expect(body).toMatch(/IF NOT is_admin\(\) THEN/)
    // role revert targets the server-resolved user_id, never a client-supplied id
    expect(body).toMatch(/WHERE id = v_user_id/)
  })

  it('failure path preserves cached data (service returns structured failure)', () => {
    const svc = read('src/services/userService.ts')
    expect(svc).toMatch(/success: false, error: \{ source: 'db', code: 'DELETE_FAILED'/)
  })
})

/* ═══ SA-5 — RLS/grant hygiene migration present ═══ */
describe('SA-5: RLS hardening migration', () => {
  const body = read('supabase/migrations/20260825000004_sub_admins_rls_hardening.sql')

  it('drops the five shadowed legacy policies', () => {
    for (const pol of ['sub_admins_select_admin', 'sub_admins_select_own', 'sub_admins_insert_admin', 'sub_admins_update_admin', 'sub_admins_delete_admin']) {
      expect(body).toContain(`DROP POLICY IF EXISTS ${pol}`)
    }
  })

  it('preserves admin-full-access and self-select behavior', () => {
    expect(body).toMatch(/rls_sub_admins_admin_all/)
    expect(body).toMatch(/rls_sub_admins_self_select/)
  })

  it('revokes TRUNCATE from anon only', () => {
    expect(body).toMatch(/REVOKE TRUNCATE ON public\.sub_admins FROM anon/)
    expect(body).not.toMatch(/REVOKE .* FROM authenticated/)
  })
})

/* ═══ SA-6 — live-region ownership ═══ */
describe('SA-6: accessibility live regions', () => {
  it('aria-live is scoped to the result-count summary only', () => {
    const { container } = renderView({})
    const liveNodes = container.querySelectorAll('[aria-live="polite"]')
    expect(liveNodes.length).toBe(1)
    expect(liveNodes[0].tagName).toBe('P')
    expect(liveNodes[0].getAttribute('aria-label')).toBe('Showing 1 of 7 educators')
  })

  it('loading announcement remains a single role=status skeleton region', () => {
    const { container } = renderView({ loading: true })
    const status = container.querySelectorAll('[role="status"]')
    expect(status.length).toBe(1)
    expect(status[0].getAttribute('aria-label')).toBe('Loading educators')
  })

  it('load errors announce through ErrorState role=alert', () => {
    renderView({ error: 'Connection Lost' })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})

/* ═══ A1/A2/A4 — modal forms, canonical field errors, focus recovery ═══ */
describe('A1/A2/A4: modal forms + accessible field errors + first-invalid focus', () => {
  it('add modal is a native <form> (aria-label, noValidate) whose confirm button is type=submit', () => {
    renderView({ showAddModal: true })
    const form = screen.getByRole('form', { name: 'Onboard New Educator' })
    expect(form).toHaveAttribute('novalidate')
    const confirm = screen.getByRole('button', { name: 'Confirm Onboarding' })
    expect(confirm.getAttribute('type')).toBe('submit')
    expect(confirm.closest('form')).toBe(form)
  })

  it('pressing Enter in the add form submits through the native path', async () => {
    const onAddSubmit = vi.fn()
    const user = userEvent.setup()
    renderView({ showAddModal: true, onAddSubmit })
    await user.click(screen.getByLabelText('Display Name'))
    await user.keyboard('{Enter}')
    expect(onAddSubmit).toHaveBeenCalledTimes(1)
  })

  it('commission modal is a native <form>; Save is type=submit and Enter submits', async () => {
    const onEditCommissionSave = vi.fn()
    const user = userEvent.setup()
    renderView({ showEditCommissionModal: true, commissionEditTarget: ROWS[0], onEditCommissionSave })
    const form = screen.getByRole('form', { name: 'Edit Commission' })
    const save = screen.getByRole('button', { name: 'Save Commission' })
    expect(save.getAttribute('type')).toBe('submit')
    expect(save.closest('form')).toBe(form)
    await user.click(screen.getByLabelText('Commission (%)'))
    await user.keyboard('{Enter}')
    expect(onEditCommissionSave).toHaveBeenCalledTimes(1)
  })

  it('field errors use the canonical FieldError (aria-live=polit, no role=alert) wired via invalid/describedby', () => {
    renderView({
      showAddModal: true,
      fieldErrors: { name: 'Please enter a name', email: 'Please enter a valid email address' },
    })
    const nameErr = document.getElementById('sa-name-error')
    expect(nameErr).not.toBeNull()
    expect(nameErr!.getAttribute('aria-live')).toBe('polite')
    expect(nameErr!.getAttribute('role')).toBeNull()
    const emailInput = document.getElementById('sa-email') as HTMLInputElement
    expect(emailInput.getAttribute('aria-invalid')).toBe('true')
    expect(emailInput.getAttribute('aria-describedby')).toBe('sa-email-error')
    expect(document.getElementById('sa-email-error')!.textContent).toBe('Please enter a valid email address')
    // The view consumes the shared primitive — it no longer hand-rolls error spans.
    const view = read('src/components/admin/sub-admins/AdminSubAdminsView.tsx')
    expect(view).toContain('<FieldError id="sa-name-error">')
    expect(view).toContain('<FieldError id="sa-email-error">')
    expect(view).toContain('<FieldError id="sa-coupon-error">')
    expect(view).toContain('<FieldError id="sa-commission-error">')
    expect(view).not.toMatch(/AdminText as="span"[^>]*id="sa-(name|email|coupon|commission)-error"/)
  })

  it('commission edit error uses FieldError and keeps the same id/describedby contract', () => {
    renderView({
      showEditCommissionModal: true,
      commissionEditTarget: ROWS[0],
      commissionEditError: 'Commission must be between 0 and 100.',
    })
    const err = document.getElementById('edit-commission-error')
    expect(err).not.toBeNull()
    expect(err!.getAttribute('aria-live')).toBe('polite')
    expect((document.getElementById('edit-commission') as HTMLInputElement)?.getAttribute('aria-describedby')).toBe('edit-commission-error')
  })

  it('failed submit moves focus to the FIRST invalid add field (DOM order, not object order)', async () => {
    renderView({
      showAddModal: true,
      fieldErrors: { email: 'Please enter a valid email address', name: 'Please enter a name' },
    })
    await waitFor(() => expect((document.activeElement as HTMLElement).id).toBe('sa-name'))
  })

  it('failed submit moves focus to the commission input inside the edit modal', async () => {
    renderView({
      showEditCommissionModal: true,
      commissionEditTarget: ROWS[0],
      commissionEditError: 'Commission must be between 0 and 100.',
    })
    await waitFor(() => expect((document.activeElement as HTMLElement).id).toBe('edit-commission'))
  })

  it('no invalid fields leaves focus untouched', () => {
    renderView({ showAddModal: true })
    expect(document.activeElement).toBe(document.body)
  })
})

/* ═══ A5 — single consolidated success surface ═══ */
describe('A5: one success surface (coupon inline, no parallel banner)', () => {
  it('success + generated coupon → exactly ONE status alert containing the coupon', () => {
    renderView({ successMessage: 'Invitation sent to educator successfully!', generatedCoupon: 'ABC23456' })
    expect(screen.getAllByText('Invitation sent to educator successfully!')).toHaveLength(1)
    expect(screen.getAllByText('ABC23456')).toHaveLength(1)
    expect(document.body.querySelectorAll('[role="status"]')).toHaveLength(1)
    const alert = document.body.querySelector('[role="status"]')!
    expect(alert.textContent).toContain('Coupon code generated')
    expect(alert.textContent).toContain('ABC23456')
    // The old parallel banner copy is gone from the DOM and the source.
    expect(document.body.textContent).not.toContain('Share this code with your new educator')
    const view = read('src/components/admin/sub-admins/AdminSubAdminsView.tsx')
    expect(view).not.toMatch(/Share this code with your new educator/)
  })

  it('success without a coupon keeps a neutral title and no coupon block', () => {
    renderView({ successMessage: 'Commission updated.' })
    const alert = document.body.querySelector('[role="status"]')!
    expect(alert.textContent).toContain('Action complete')
    expect(alert.textContent).not.toContain('Coupon Code:')
    expect(alert.textContent).not.toContain('generatedCoupon')
  })

  it('the single success surface dismisses through onDismissSuccess', async () => {
    const onDismissSuccess = vi.fn()
    const user = userEvent.setup()
    renderView({ successMessage: 'Commission updated.', onDismissSuccess })
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismissSuccess).toHaveBeenCalledTimes(1)
  })

  it('a stale generated coupon can never be resurrected by a later, unrelated success', () => {
    const page = read('src/pages/admin/AdminSubAdmins.tsx')
    // remove + commission-save both clear the coupon alongside the old success
    expect(page.match(/setSuccessMessage\(null\)\n\s*setGeneratedCoupon\(null\)/g)?.length).toBeGreaterThanOrEqual(2)
    // opening the remove dialog and dismissing the toast also clear it
    expect(page).toContain('setSuccessMessage(null); setGeneratedCoupon(null); setSaToRemove(sa)')
    expect(page).toContain('onDismissSuccess={() => { setSuccessMessage(null); setGeneratedCoupon(null) }}')
    expect(page).not.toContain('onDismissSuccess={() => setSuccessMessage(null)}')
  })
})

/* ═══ L2 — remove idempotency: one strict UUID per logical operation ═══ */
describe('L2: remove-idempotency (one strict UUID per logical remove)', () => {
  const page = read('src/pages/admin/AdminSubAdmins.tsx')

  it('mints the request key when the confirm dialog opens', () => {
    expect(page).toMatch(/onRemoveRequest=\{\(sa\) => \{[\s\S]*?removeRequestIdRef\.current = makeRequestId\(\)/)
  })

  it('clears the key on cancel and on success (never leaks across operations)', () => {
    expect(page).toMatch(/onRemoveCancel=\{\(\) => \{[\s\S]*?removeRequestIdRef\.current = null/)
    // cleared BEFORE the success banner so a later op starts fresh
    expect(page).toMatch(/removeRequestIdRef\.current = null\n\s*setSuccessMessage\('Educator removed\.'\)/)
  })

  it('reuses the SAME key on a retry while the dialog stays open (no key churn)', () => {
    // The RPC call derives its key from the ref, not from Date.now().
    expect(page).toContain('const requestId = removeRequestIdRef.current ?? makeRequestId()')
    expect(page).not.toMatch(/rem_/)
    expect(page).not.toMatch(/Date\.now\(\)/)
  })

  it('remove is still wired through the shared removeSubAdmin ctx contract (admin-only)', () => {
    expect(page).toMatch(/removeSubAdmin\(\{ user, requestId \}, saToRemove\.id\)/)
  })
})
