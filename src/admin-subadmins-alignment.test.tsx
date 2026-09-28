/// <reference types="node" />
import { describe, it, expect, afterEach, vi } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from './context/ThemeContext'
import { AdminSubAdminsView } from './components/admin/sub-admins/AdminSubAdminsView'
import { SUB_ADMIN_TABLE_GRID, HEADER_CELL } from './components/admin/sub-admins/subAdminTableGrid'
import type { SubAdminRow } from './types/subAdmin.types'

/* ─── Sub-Admins remediation regression suite ───────────────────────────────
 * Focused structural tests locking in the /admin/sub-admins audit findings:
 * shared grid contract, header, elevated wrapper, management family,
 * single-render cells, new columns, retry wiring, dead-code removal. */

const here = dirname(fileURLToPath(import.meta.url))

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

const ROWS: SubAdminRow[] = [
  sa(),
  sa({ id: 'sa2', full_name: 'A', email: 'a@b.co', coupon_code: 'EDUA1B2C3', total_referrals: null, status: null }),
]

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

/** All SUB_ADMIN_TABLE_GRID instances in the rendered view (header first). */
function gridInstances(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.grid')).filter(el =>
    el.className.includes('grid-cols-[minmax(0,1fr)_104px_72px_96px]'),
  )
}

afterEach(cleanup)

describe('grid contract — one authoritative definition', () => {
  it('exports the deterministic responsive grid + canonical header typography', () => {
    expect(SUB_ADMIN_TABLE_GRID).toContain('grid-cols-[minmax(0,1fr)_104px_72px_96px]')
    expect(SUB_ADMIN_TABLE_GRID).toContain('md:grid-cols-[minmax(0,1fr)_104px_80px_72px_96px]')
    expect(SUB_ADMIN_TABLE_GRID).toContain('lg:grid-cols-[minmax(0,1.8fr)_104px_80px_88px_88px_72px_96px]')
    expect(SUB_ADMIN_TABLE_GRID).not.toMatch(/max-content/)
    expect(SUB_ADMIN_TABLE_GRID).not.toMatch(/grid-cols-\[auto/)
    expect(HEADER_CELL).toBe('text-[10px] font-bold uppercase tracking-widest')
  })

  it('header and every row consume the identical SUB_ADMIN_TABLE_GRID class list', () => {
    const { container } = renderView()
    const grids = gridInstances(container)
    expect(grids).toHaveLength(3) // header + 2 rows
    for (const g of grids) {
      expect(g.className).toContain(SUB_ADMIN_TABLE_GRID)
    }
  })
})

describe('header — labels and responsive visibility', () => {
  it('renders all seven column labels with canonical HEADER_CELL typography', () => {
    const { container } = renderView()
    const header = gridInstances(container)[0]
    const cells = Array.from(header.children)
    expect(cells.map(c => c.textContent)).toEqual([
      'Educator', 'Coupon', 'Joined', 'Referrals', 'Status', 'Commission', 'Actions',
    ])
    for (const cell of cells) {
      expect(cell.className).toContain(HEADER_CELL)
    }
  })

  it('hides Joined below md and Referrals/Status below lg — header matches rows', () => {
    const { container } = renderView()
    const grids = gridInstances(container)
    const [header, ...rows] = grids
    // Rows use flex cells; the header uses block spans — same visibility tiers.
    for (const g of rows) {
      const [, , joined, referrals, status] = Array.from(g.children) as HTMLElement[]
      expect(joined.className).toContain('hidden')
      expect(joined.className).toContain('md:flex')
      expect(referrals.className).toContain('hidden')
      expect(referrals.className).toContain('lg:flex')
      expect(status.className).toContain('hidden')
      expect(status.className).toContain('lg:flex')
    }
    const [, , joinedH, referralsH, statusH] = Array.from(header.children) as HTMLElement[]
    expect(joinedH.className).toContain('hidden')
    expect(joinedH.className).toContain('md:block')
    expect(referralsH.className).toContain('hidden')
    expect(referralsH.className).toContain('lg:block')
    expect(statusH.className).toContain('hidden')
    expect(statusH.className).toContain('lg:block')
  })
})

describe('rows — single render per semantic value', () => {
  it('renders each coupon code exactly once (no duplicate mobile/trailing copies)', () => {
    renderView()
    expect(screen.getAllByText('SATISH25')).toHaveLength(1)
    expect(screen.getAllByText('EDUA1B2C3')).toHaveLength(1)
  })

  it('renders each joined date exactly once', () => {
    const { container } = renderView()
    const dates = container.querySelectorAll('.hidden.md\\:flex')
    const dateTexts = Array.from(dates).filter(el => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(el.textContent || ''))
    expect(dateTexts).toHaveLength(ROWS.length)
  })

  it('identity uses the reusable UserIdentity pattern (Avatar + tokenized text), not raw spans', () => {
    const { container } = renderView()
    // Avatar monogram is aria-hidden decorative; name is tokenized heading text.
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.getByText('Dr. Satish Kumar')).toBeInTheDocument()
    expect(screen.getByText('satish@example.com')).toBeInTheDocument()
    const source = readFileSync(join(here, 'components', 'admin', 'sub-admins', 'AdminSubAdminsView.tsx'), 'utf8')
    expect(source).not.toMatch(/AdminIconWrap/)
    expect(source).not.toMatch(/text-base/)
    expect(source).not.toMatch(/text-xs/)
  })

  it('renders Referrals (null → 0) and Status (active → success badge, else muted dash)', () => {
    renderView()
    expect(screen.getByText('5')).toBeInTheDocument()          // row 1 referrals
    expect(screen.getByText('0')).toBeInTheDocument()          // row 2 null → 0
    expect(screen.getByText('Active')).toBeInTheDocument()     // row 1 badge
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)            // row 2 muted fallback
  })

  it('action group exposes a per-row accessible Edit + Remove pair', () => {
    renderView()
    expect(screen.getByRole('button', { name: 'Remove Dr. Satish Kumar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove A' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit commission for Dr. Satish Kumar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit commission for A' })).toBeInTheDocument()
  })
})

describe('management family + elevated wrapper', () => {
  it('wraps the list in the canonical elevated Card', () => {
    const { container } = renderView()
    const card = container.querySelector('.shadow-elevation-3')
    expect(card).not.toBeNull()
    // The elevated card owns the header grid (the FloatingList chrome).
    expect(card!.querySelector('.grid')!.className).toContain(SUB_ADMIN_TABLE_GRID)
  })

  it('uses the management toolbar/input/empty-state variants — no deprecated FilterBar', () => {
    /* Normalize line endings: git checkout (core.autocrlf) may hand the file
     * to us with CRLF, and one assertion below spans a newline. */
    const source = readFileSync(join(here, 'components', 'admin', 'sub-admins', 'AdminSubAdminsView.tsx'), 'utf8').replace(/\r\n/g, '\n')
    expect(source).toContain('CollectionToolbar variant="management"')
    expect(source).toContain('Input\n              variant="management"')
    expect(source).toContain('variant="management"') // EmptyState × 2
    expect(source).not.toContain('FilterBar')
  })

  it('integrates Add Educator into the toolbar (no standalone action row)', () => {
    renderView()
    expect(screen.getByRole('button', { name: /Add Educator|Add/ })).toBeInTheDocument()
    const source = readFileSync(join(here, 'components', 'admin', 'sub-admins', 'AdminSubAdminsView.tsx'), 'utf8')
    expect(source).not.toContain('justify-end mb-6')
  })

  it('shows the result count above the list inside a count-scoped aria-live region (SA-6)', () => {
    renderView()
    // SA-6: the live region moved from the whole list wrapper to the result
    // count paragraph so filter typing announces one summary, not the list.
    const live = screen.getByLabelText('Showing 2 of 7 educators')
    expect(live.getAttribute('aria-live')).toBe('polite')
    expect(live.textContent).toContain('Showing 2 of 7 Educators')
  })
})

describe('states', () => {
  it('error state wires the real refetch callback (no noop retry)', async () => {
    const onRetry = vi.fn()
    renderView({ error: 'Database connection failed.', onRetry })
    const retry = screen.getByRole('button', { name: 'Try Again' })
    await userEvent.click(retry)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('differentiates empty dataset from empty search results', () => {
    const first = renderView({ filteredSAs: [], searchQuery: '' })
    expect(screen.getByText('No Educators Yet')).toBeInTheDocument()
    first.unmount()

    renderView({ filteredSAs: [], searchQuery: 'zzz' })
    expect(screen.getByText('No Matches')).toBeInTheDocument()
  })

  it('loading skeleton mirrors the real chrome: elevated card + header + 5 rows on the same grid', () => {
    const { container } = renderView({ loading: true, filteredSAs: [] })
    const status = screen.getByRole('status', { name: 'Loading educators' })
    expect(status).toBeInTheDocument()
    const grids = gridInstances(container)
    expect(grids).toHaveLength(6) // header skeleton + 5 row skeletons
    for (const g of grids) {
      expect(g.className).toContain(SUB_ADMIN_TABLE_GRID)
    }
  })
})

describe('cleanup', () => {
  it('dead SubAdminMobileCard component is removed from the repository', () => {
    expect(existsSync(join(here, 'components', 'admin', 'sub-admins', 'SubAdminMobileCard.tsx'))).toBe(false)
  })

  it('page fetcher surfaces real errors and uses a non-empty cache key', () => {
    const source = readFileSync(join(here, 'pages', 'admin', 'AdminSubAdmins.tsx'), 'utf8').replace(/\r\n/g, '\n')
    expect(source).toContain("}, ['sub_admins'])")
    expect(source).toMatch(/catch \(err\) \{[\s\S]*?error: err/)
    expect(source).not.toContain('error: null }\n  }, [])')
  })
})

/* ─── A3 — ARIA table semantics layered over the shared grid (roles only) ─── */
describe('A3: rows expose ARIA table semantics without changing the grid contract', () => {
  it('list is a role=table with an accessible name; header renders columnheaders in a row', () => {
    const { container } = renderView()
    const table = container.querySelector('[role="table"]')
    expect(table).not.toBeNull()
    expect(table!.getAttribute('aria-label')).toBe('Educators')
    const headerRow = table!.querySelector('div[role="row"]') as HTMLElement
    expect(headerRow).not.toBeNull()
    expect(headerRow.className).toContain(SUB_ADMIN_TABLE_GRID)
    expect(Array.from(headerRow.querySelectorAll('[role="columnheader"]')).map(h => h.textContent)).toEqual([
      'Educator', 'Coupon', 'Joined', 'Referrals', 'Status', 'Commission', 'Actions',
    ])
  })

  it('every FloatingListItem is a role=row with exactly 7 role=cell children', () => {
    const { container } = renderView()
    const rows = Array.from(container.querySelectorAll('div[role="row"]'))
    expect(rows).toHaveLength(1 + ROWS.length) // header row + educator rows
    for (const row of rows.slice(1)) {
      expect(row.querySelectorAll('[role="cell"]')).toHaveLength(7)
    }
  })

  it('roles added zero extra DOM nodes — header and row grids still have exactly 7 children', () => {
    const { container } = renderView()
    const grids = gridInstances(container)
    expect(grids).toHaveLength(1 + ROWS.length) // header + rows, identical to before
    for (const g of grids) {
      expect(g.children.length).toBe(7)
      for (const child of Array.from(g.children)) {
        expect(child.getAttribute('role')).toBe(g === grids[0] ? 'columnheader' : 'cell')
      }
    }
  })
})
