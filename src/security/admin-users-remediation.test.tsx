/// <reference types="node" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, renderHook, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext'
import { USERS_PAGE_SIZE, useAdminUsers } from '../components/admin/users/useAdminUsers'
import AdminUsersPage from '../pages/admin/AdminUsers'
import { UsersTable } from '../components/admin/users/UsersTable'
import { fetchUsersPaginated } from '../services/userService'
import { supabase } from '../lib/supabase'
import { fetchUsersPaginated as repoFetchUsersPaginated } from '../lib/repositories/user.repository'
import { getRouteForRole } from '../utils/getRouteForRole'

/* ─── ADMIN USERS remediation suite (AU-1 … AU-5) ────────────────────────────
 * AU-1: a refresh failure with rows on screen keeps the rows AND exposes retry.
 * AU-2: an invalid ?exam= value is normalized — never fabricated success-empty.
 * AU-3: search escaping lives SERVER-SIDE in admin_list_users (no client .or()).
 * AU-4: ONE loading status owner; skeleton uses USER_TABLE_GRID structure.
 * AU-5: authoritative page-size constant; no `any` in the data hook.
 * ROLE-SEPARATION: admin_list_users is the single authoritative read path. */

const here = dirname(fileURLToPath(import.meta.url))

vi.mock('../services/userService', () => ({
  fetchUsersPaginated: vi.fn(),
  toggleUserStatus: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))

vi.mock('../context/AuthContext', () => {
  const stableUser = { id: 'admin-1', role: 'admin', exam_selection: null }
  return { useAuth: vi.fn(() => ({ user: stableUser, loading: false, initialized: true })) }
})

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1',
    full_name: 'Alice',
    email: 'alice@example.com',
    exam_selection: 'APPSC_GROUPS',
    is_active: true,
    created_at: '2026-01-15T10:00:00Z',
    exams_taken: 3,
    daily_streak: 2,
    highest_streak: 5,
    ...overrides,
  }
}

function renderHookWithRouter(url = '/admin/users') {
  return renderHook(() => useAdminUsers(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
    ),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

const ADMIN_LIST_USERS_MIGRATION = join(here, '../../supabase/migrations/20260905052311_admin_users_role_separation_rpcs.sql')

describe('AU-3 — search escaping moved server-side (no client .or() grammar)', () => {
  const migration = readFileSync(ADMIN_LIST_USERS_MIGRATION, 'utf-8')

  it('the list path is the admin_list_users RPC; no client .or()/ilike grammar remains', () => {
    const source = readFileSync(join(here, '../lib/repositories/user.repository.ts'), 'utf-8')
    const fn = source.slice(source.indexOf('export async function fetchUsersPaginated'))
    expect(fn).toContain("rpc('admin_list_users'")
    expect(fn).not.toContain('.or(')
    expect(fn).not.toContain('buildOrIlikeFilter')
    expect(fn).not.toContain(".from('users')")
    expect(fn).not.toMatch(/ilike\.%/)
  })

  it('ILIKE wildcards are escaped server-side via replace(), backslash first', () => {
    expect(migration).toContain(`replace(replace(replace(v_search, '\\', '\\\\'), '%', '\\%'), '_', '\\_')`)
  })

  it('search terms are bound with %L (data), never concatenated unescaped', () => {
    expect(migration).toContain('NULLIF(btrim(p_search)')
    expect(migration).toContain('full_name ILIKE')
    expect(migration).toContain('%L')
    expect(migration).not.toMatch(/\|\|\s*p_search/)
  })

  it('only whitelisted columns can reach the dynamic ORDER BY %I', () => {
    expect(migration).toContain("p_sort_column IN ('full_name', 'email', 'exam_selection', 'is_active', 'created_at')")
    expect(migration).toContain('ORDER BY u.%I')
    expect(migration).toContain('%I')
  })
})

describe('AU-2 — invalid ?exam= never fabricates success-empty', () => {
  it.each(['all', 'APPSC_GROUPS', 'BANK_EXAMS'])(
    'valid tab %s reaches the backend (existing mapping unchanged)',
    async (tab) => {
      const url = tab === 'all' ? '/admin/users' : `/admin/users?exam=${tab}`
      vi.mocked(fetchUsersPaginated).mockResolvedValue({ rows: [], total: 0 } as never)
      const { result } = renderHookWithRouter(url)
      await waitFor(() => expect(result.current.isUsersLoading).toBe(false))
      expect(fetchUsersPaginated).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ activeTab: tab }),
      )
    },
  )

  it('normalizes an unknown exam through the URL system and never renders success-empty', async () => {
    vi.mocked(fetchUsersPaginated).mockResolvedValue({ rows: [], total: 0 } as never)
    const { result } = renderHookWithRouter('/admin/users?exam=garbage')

    // While normalizing, the page holds LOADING — not an empty success state…
    await waitFor(() => expect(result.current.activeTab).toBe('all'))
    // …then the normalized context ('all') is what actually reaches the backend.
    await waitFor(() => expect(result.current.isUsersLoading).toBe(false))
    expect(fetchUsersPaginated).toHaveBeenCalledTimes(1)
    expect(fetchUsersPaginated).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ activeTab: 'all' }),
    )
  })

  it('the fabricated empty short-circuit no longer exists in source', () => {
    const hookSource = readFileSync(join(here, '../components/admin/users/useAdminUsers.ts'), 'utf-8')
    expect(hookSource).not.toContain('setData({ rows: [], total: 0 })')
    expect(hookSource).not.toContain('KNOWN_EXAM_IDS')
  })
})

describe('AU-1 — error with existing rows keeps rows AND retry', () => {
  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <ThemeProvider>
          <AdminUsersPage />
        </ThemeProvider>
      </MemoryRouter>,
    )
  }

  it('test A+B: initial success shows rows; later failure keeps them with visible Retry', async () => {
    vi.mocked(fetchUsersPaginated)
      .mockResolvedValueOnce({ rows: [userRow()], total: 1 } as never)
      .mockRejectedValueOnce(new Error('Failed to fetch'))

    const view = renderPage()
    await waitFor(() =>
      expect(view.container.textContent).toContain('alice@example.com'),
    )
    expect(view.container.textContent).not.toContain('Failed to load users')

    // Trigger a refetch that fails: type into the debounced search box — the
    // hook re-runs fetchData for the new query while stale rows stay visible.
    const search = view.container.querySelector('input[aria-label="Search students"]')!
    fireEvent.change(search, { target: { value: 'zzz' } })
    await waitFor(() => expect(view.container.textContent).toContain('Failed to load users'), { timeout: 5000 })
    // Stale rows remain on screen…
    expect(view.container.textContent).toContain('alice@example.com')
    // …no false EmptyState…
    expect(view.container.textContent).not.toContain('No Students Found')
    // …and a retry control exists outside any EmptyState.
    expect(view.container.querySelector('[aria-label="Retry"]')).toBeTruthy()
  })

  it('test C: successful retry replaces rows and clears the error', async () => {
    vi.mocked(fetchUsersPaginated)
      .mockResolvedValueOnce({ rows: [userRow()], total: 1 } as never)
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce({
        rows: [userRow({ id: 'u2', full_name: 'Bob', email: 'bob@example.com' })],
        total: 1,
      } as never)

    const view = renderPage()
    await waitFor(() => expect(view.container.textContent).toContain('alice@example.com'))
    const search = view.container.querySelector('input[aria-label="Search students"]')!
    fireEvent.change(search, { target: { value: 'zzz' } })
    await waitFor(() => expect(view.container.textContent).toContain('Failed to load users'), { timeout: 5000 })
    fireEvent.click(view.container.querySelector('[aria-label="Retry"]')!)
    await waitFor(() => expect(view.container.textContent).not.toContain('Failed to load users'), { timeout: 5000 })
    expect(view.container.textContent).toContain('bob@example.com')
  })

  it('test D: failed retry retains stale rows and the error', async () => {
    vi.mocked(fetchUsersPaginated)
      .mockResolvedValueOnce({ rows: [userRow()], total: 1 } as never)
      .mockRejectedValue(new Error('Failed to fetch'))

    const view = renderPage()
    await waitFor(() => expect(view.container.textContent).toContain('alice@example.com'))
    const search = view.container.querySelector('input[aria-label="Search students"]')!
    fireEvent.change(search, { target: { value: 'zzz' } })
    await waitFor(() => expect(view.container.textContent).toContain('Failed to load users'), { timeout: 5000 })
    fireEvent.click(view.container.querySelector('[aria-label="Retry"]')!)
    await waitFor(() =>
      expect(view.container.querySelectorAll('[aria-label="Retry"]').length).toBeGreaterThan(0),
      { timeout: 5000 },
    )
    expect(view.container.textContent).toContain('alice@example.com')
    expect(view.container.textContent).toContain('Failed to load users')
  })
})

describe('AU-4 — single loading owner; skeleton matches table contract', () => {
  it('renders exactly ONE role=status region; inner pieces carry none', () => {
    const view = render(
      <ThemeProvider>
        <UsersTable users={[]} loading page={1} totalPages={0} onPageChange={() => {}} togglingId={null} onToggleRequest={() => {}} />
      </ThemeProvider>,
    )
    const statuses = view.container.querySelectorAll('[role="status"]')
    expect(statuses.length).toBe(1)
    expect(statuses[0].getAttribute('aria-label')).toBe('Loading students')
    // No NESTED status regions inside the single loading owner.
    expect(statuses[0].querySelectorAll('[role="status"]').length).toBe(0)
    // Decorative bars are aria-hidden.
    expect(view.container.querySelectorAll('.animate-pulse[aria-hidden="true"]').length).toBeGreaterThan(0)
    // Skeleton reuses the ONE shared grid contract.
    const grids = Array.from(view.container.querySelectorAll('.grid'))
    expect(grids.length).toBeGreaterThanOrEqual(6) // header + 5 rows
    expect(view.container.textContent).toContain('Participant')
    expect(view.container.textContent).toContain('Status')
  })

  it('final table and skeleton share the same grid class string', () => {
    const tableSource = readFileSync(join(here, '../components/admin/users/UsersTable.tsx'), 'utf-8')
    const skeletonUses = (tableSource.match(/USER_TABLE_GRID/g) ?? []).length
    expect(skeletonUses).toBeGreaterThanOrEqual(4) // header, rows, skeleton header, skeleton rows
    expect(tableSource).toContain('<UsersTableSkeleton />')
    expect(tableSource).toContain('decorative')
  })
})

describe('AU-5 — constants and typing hygiene', () => {
  it('page exports the authoritative page size and the label derives from it', () => {
    expect(USERS_PAGE_SIZE).toBe(20)
    const pageSource = readFileSync(join(here, '../pages/admin/AdminUsers.tsx'), 'utf-8')
    expect(pageSource).toContain('USERS_PAGE_SIZE')
    expect(pageSource).not.toMatch(/\* 20/)
  })

  it('data hook contains no `any` annotations', () => {
    const hookSource = readFileSync(join(here, '../components/admin/users/useAdminUsers.ts'), 'utf-8')
    expect(hookSource).not.toMatch(/: any\b/)
    expect(hookSource).toContain('catch (error: unknown)')
    expect(hookSource).toContain('classifyError')
  })

  it('classified errors replace the generic hard-coded copy', async () => {
    vi.mocked(fetchUsersPaginated).mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = renderHookWithRouter('/admin/users')
    await waitFor(() => expect(result.current.usersError).toBeTruthy())
    expect(result.current.usersError).toBe('Please check your internet connection and try again.')
  })
})

describe('ROLE-SEPARATION — removed educators are archived at the boundary', () => {
  const migration = readFileSync(ADMIN_LIST_USERS_MIGRATION, 'utf-8')

  it('user_role carries an archived value that guards never allow-list', () => {
    const types = readFileSync(join(here, '../types/auth.types.ts'), 'utf-8')
    expect(types).toMatch(/UserRole = 'user' \| 'admin' \| 'sub_admin' \| 'deactivated_sub_admin'/)
  })

  it('routing sends the archived role to /unauthorized — never the student dashboard', () => {
    expect(getRouteForRole('deactivated_sub_admin')).toBe('/unauthorized')
    expect(getRouteForRole('user')).toBe('/dashboard')
    expect(getRouteForRole('admin')).toBe('/admin/overview')
    expect(getRouteForRole('sub_admin')).toBe('/sub-admin/dashboard')
  })

  it('admin_remove_sub_admin archives the role and never reverts to "user"', () => {
    const remove = migration.slice(
      migration.lastIndexOf('CREATE OR REPLACE FUNCTION public.admin_remove_sub_admin'),
      migration.lastIndexOf('CREATE OR REPLACE FUNCTION public.admin_list_users'),
    )
    expect(remove).toContain("SET role = 'deactivated_sub_admin'")
    expect(remove).not.toContain("role = 'user'")
    expect(remove).toContain('NOT is_admin()')
  })

  it('admin_revoke_sub_admin_role uses the same archive semantics (defense in depth)', () => {
    const revoke = migration.slice(
      migration.lastIndexOf('CREATE OR REPLACE FUNCTION public.admin_revoke_sub_admin_role'),
      migration.lastIndexOf('CREATE OR REPLACE FUNCTION public.admin_list_users'),
    )
    expect(revoke).toContain("SET role = 'deactivated_sub_admin'")
    expect(revoke).not.toContain("role = 'user'")
  })

  it('admin_list_users hard-codes USER-only + no sub-admin identity in BOTH count and rows predicates', () => {
    const list = migration.slice(migration.lastIndexOf('CREATE OR REPLACE FUNCTION public.admin_list_users'))
    expect((list.match(/u.role = ''user''/g) ?? []).length).toBe(2)
    expect((list.match(/NOT EXISTS \(SELECT 1 FROM public\.sub_admins/g) ?? []).length).toBe(2)
  })

  it('the list RPC self-authorizes with is_admin() and denies everyone else', () => {
    const list = migration.slice(migration.lastIndexOf('CREATE OR REPLACE FUNCTION public.admin_list_users'))
    expect(list).toContain('is_admin()')
    expect(list).toContain('Unauthorized: admin role required.')
  })
})

describe('ROLE-SEPARATION — repository calls admin_list_users (single authoritative path)', () => {
  it('forwards filters as RPC params and maps {rows,count}', async () => {
    const rpc = vi.mocked(supabase.rpc)
    rpc.mockResolvedValue({ data: { rows: [{ id: 'u1' }], count: 7 }, error: null } as never)
    const result = await repoFetchUsersPaginated({
      activeTab: 'APPSC_GROUPS',
      statusFilter: 'inactive',
      searchQuery: 'Doe, Jr.',
      offset: 20,
      pageSize: 20,
      sortColumn: 'created_at',
      sortAscending: false,
    })
    expect(rpc).toHaveBeenCalledWith('admin_list_users', {
      p_exam_selection: 'APPSC_GROUPS',
      p_status: 'inactive',
      p_search: 'Doe, Jr.',
      p_sort_column: 'created_at',
      p_sort_asc: false,
      p_offset: 20,
      p_limit: 20,
    })
    expect(result).toEqual({ rows: [{ id: 'u1' }], count: 7 })
  })

  it('maps the default tabs to NULL so server defaults apply', async () => {
    const rpc = vi.mocked(supabase.rpc)
    rpc.mockResolvedValue({ data: { rows: [], count: 0 }, error: null } as never)
    await repoFetchUsersPaginated({ activeTab: 'all', statusFilter: 'all', searchQuery: '', offset: 0, pageSize: 20 })
    expect(rpc).toHaveBeenCalledWith('admin_list_users', expect.objectContaining({
      p_exam_selection: null,
      p_status: null,
      p_search: null,
      p_limit: 20,
    }))
  })

  it('propagates RPC errors — a denial must never render as an empty list', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('Unauthorized: admin role required.') } as never)
    await expect(
      repoFetchUsersPaginated({ activeTab: 'all', statusFilter: 'all', searchQuery: '', offset: 0, pageSize: 20 }),
    ).rejects.toThrow('Unauthorized: admin role required.')
  })
})

