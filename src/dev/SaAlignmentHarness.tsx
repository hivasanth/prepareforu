import { ThemeProvider } from '../context/ThemeContext'
import { H1, PageContainer } from '../components/common/AntigravityUI'
import { AdminSubAdminsView } from '../components/admin/sub-admins/AdminSubAdminsView'
import type { SubAdminRow } from '../types/subAdmin.types'

/* ═══ DEV-ONLY verification harness — /dev/sa-alignment ═══════════════════════
 * Mounted to measure the REAL AdminSubAdminsView geometry (header ↔ row
 * alignment, fixed-track stability, overflow, skeleton parity) against a
 * fresh development build — no auth required. The route is registered in
 * App.tsx behind `import.meta.env.DEV`, so this module is dead-code-eliminated
 * from production builds.
 * Query switches:
 *   ?skeleton=1  force the loading skeleton
 *   ?empty=1     no educators at all
 *   ?nomatch=1   search active with zero matches
 *   ?error=1     query error state (retry wiring)
 * Fixtures are adversarial: long/short names, long email, long coupon,
 * 0 vs large referrals, active vs null status. */

const FIXTURES: SubAdminRow[] = [
  {
    id: 'sa-verify-1',
    full_name: 'Dr. Satish Kumar',
    email: 'satish@example.com',
    coupon_code: 'SATISH25',
    total_referrals: 5,
    status: 'active',
    created_at: '2026-08-21T10:00:00Z',
    updated_at: '2026-08-21T10:00:00Z',
    commission_percentage: 25,
  },
  {
    id: 'sa-verify-2',
    full_name: 'A',
    email: 'a@b.co',
    coupon_code: 'EDUA1B2C3',
    total_referrals: null,
    status: null,
    created_at: '2025-12-31T23:59:59Z',
    updated_at: '2025-12-31T23:59:59Z',
    commission_percentage: 0,
  },
  {
    id: 'sa-verify-3',
    full_name: 'Professor Rajasekhara Reddy Venkata Subramaniam',
    email: 'rajasekhara.reddy.venkata.subramaniam@longdomain.university.edu.in',
    coupon_code: 'VERYLONGCOUPONCODE2026',
    total_referrals: 128,
    status: 'active',
    created_at: '2024-01-05T08:30:00Z',
    updated_at: '2024-01-05T08:30:00Z',
    commission_percentage: 100,
  },
]

export default function SaAlignmentHarness() {
  const params = new URLSearchParams(window.location.search)
  const mode = (key: string) => params.has(key)

  const loading = mode('skeleton')
  const error = mode('error') ? 'Simulated database failure for retry verification.' : null
  const filteredSAs = mode('empty') || mode('nomatch') || loading || error ? [] : FIXTURES

  return (
    <ThemeProvider>
      <PageContainer>
        <H1 className="sr-only">Manage Educators</H1>
        <AdminSubAdminsView
          filteredSAs={filteredSAs}
          totalCount={mode('empty') ? 0 : FIXTURES.length}
          loading={loading}
          error={error}
          actionError={null}
          domainError={null}
          searchQuery={mode('nomatch') ? 'zzz-no-match' : ''}
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
          onSearchChange={() => {}}
          onAddOpen={() => {}}
          onAddClose={() => {}}
          onAddSubmit={() => {}}
          onRemoveRequest={() => {}}
          onRemoveConfirm={() => {}}
          onRemoveCancel={() => {}}
          onNewSANameChange={() => {}}
          onNewSAEmailChange={() => {}}
          onNewSACouponChange={() => {}}
          onNewSACommissionChange={() => {}}
          onEditCommissionOpen={() => {}}
          onEditCommissionClose={() => {}}
          onEditCommissionSave={() => {}}
          onCommissionEditValueChange={() => {}}
          onRetry={() => { window.dispatchEvent(new CustomEvent('sa-harness-retry')) }}
        />
      </PageContainer>
    </ThemeProvider>
  )
}
