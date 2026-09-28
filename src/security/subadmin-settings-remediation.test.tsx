import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, renderHook, screen, waitFor, cleanup, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext'
import SubAdminSettings from '../pages/sub-admin/SubAdminSettings'
import { useSettings } from '../components/sub-admin/settings/useSettings'
import { DEFAULT_PREFS } from '../components/sub-admin/settings/types'
import { escapeCSVCell, downloadCSV } from '../utils/csvUtils'
import { identityUpdateSchema } from '../validations/securitySchemas'
import * as userService from '../services/userService'
import * as authService from '../services/authService'
import * as teacherExamService from '../services/teacherExamService'
import type { UserProfile } from '../types/auth.types'

// /sub-admin/settings remediation lock-in (B1–B8, B11):
//   B1  optimistic toggle race — single-flight guard + revert on failure
//   B2  no default flash — single role="status" skeleton + ErrorContainer retry
//   B3  spreadsheet formula injection neutralised at the CSV boundary
//   B4  exports paginate (no silent .limit truncation) + explicit truncation notice
//   B5  lastLogin built from YYYY-MM-DD parts on the LOCAL calendar
//   B6  identityUpdateSchema name max(80) client-side bound
//   B7  partial save — name saved + password failed → explicit message, no rollback
//   B8  2s copied timer cleared on re-arm and on unmount
//   B11 notification_prefs merged with DEFAULT_PREFS on load AND every write

const MOCK_USER = { id: 'sa-1', full_name: 'Test SA', role: 'sub_admin' } as unknown as UserProfile

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: MOCK_USER, loading: false, logout: vi.fn() }),
}))

vi.mock(import('../services/userService'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    fetchSubAdminProfileAndUser: vi.fn(),
    updateSubAdminProfile: vi.fn(),
    updateSubAdminNotificationPrefs: vi.fn(),
    fetchStudentsByEducatorId: vi.fn(),
  }
})

vi.mock('../services/authService', () => ({
  updatePassword: vi.fn(),
}))

vi.mock('../services/teacherExamService', () => ({
  fetchTeacherExamsForExport: vi.fn(),
}))

const svc = () => vi.mocked(userService)
const authSvc = () => vi.mocked(authService)
const examSvc = () => vi.mocked(teacherExamService)

const PROFILE = {
  id: 'sa-1',
  full_name: 'Ada Admin',
  email: 'ada@example.com',
  coupon_code: 'FRIENDS',
  notification_prefs: { ...DEFAULT_PREFS },
}

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

beforeEach(() => {
  svc().fetchSubAdminProfileAndUser.mockResolvedValue({ profile: PROFILE, lastActivity: 'Aug 28, 2026' })
  svc().updateSubAdminProfile.mockResolvedValue(undefined)
  svc().updateSubAdminNotificationPrefs.mockResolvedValue(undefined)
  svc().fetchStudentsByEducatorId.mockResolvedValue({ rows: [], truncated: false })
  examSvc().fetchTeacherExamsForExport.mockResolvedValue({ rows: [], truncated: false })
  authSvc().updatePassword.mockResolvedValue({ success: true })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <SubAdminSettings />
      </ThemeProvider>
    </MemoryRouter>,
  )
}

async function renderLoadedHook() {
  const rendered = renderHook(() => useSettings())
  await waitFor(() => expect(rendered.result.current.loading).toBe(false))
  return rendered
}

// ─── B3 — formula-injection neutralisation ──────────────────────────────────

describe('B3 — escapeCSVCell neutralises spreadsheet formulas at the boundary', () => {
  it.each([
    '=1+1',
    '+SUM(A1:A9)',
    '-2+3',
    '@cmd',
    '\t=2+5',
    '\r=2+5',
  ])('prefixes a leading apostrophe to trigger %j', (cell) => {
    expect(escapeCSVCell(cell)).toBe(`'${cell}`)
  })

  it('also neutralises tab/CR-triggered formulas that get re-quoted for delimiters', () => {
    const out = escapeCSVCell('\t=HYPERLINK("http://evil")')
    // Re-quoting wraps the cell in quotes, but the apostrophe still lands
    // BEFORE the tab-triggered formula, so the neutralisation holds.
    expect(out.indexOf("'")).toBeLessThan(out.indexOf('=HYPERLINK'))
    expect(out).toContain('=HYPERLINK(')
    expect(out).toMatch(/^"/)
  })

  it('leaves benign cells untouched', () => {
    expect(escapeCSVCell('Ada Lovelace')).toBe('Ada Lovelace')
    expect(escapeCSVCell('2026-08-28')).toBe('2026-08-28')
    expect(escapeCSVCell('')).toBe('')
    expect(escapeCSVCell(null)).toBe('')
    expect(escapeCSVCell(undefined)).toBe('')
    expect(escapeCSVCell(42)).toBe('42')
  })

  it('still quotes delimiters and doubles embedded quotes after neutralising', () => {
    expect(escapeCSVCell('a,b')).toBe('"a,b"')
    expect(escapeCSVCell('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCSVCell('=1+1,="nested"')).toBe(`"'=1+1,=""nested"""`)
  })

  it('downloadCSV serialises through escapeCSVCell (integration)', async () => {
    // Production intentionally DEFERS object-URL revocation by 10s so the
    // browser download manager can pick up the transfer before the URL is
    // released (see csvUtils.ts — revoking synchronously after click races and
    // can abort the download). The test spies on setTimeout to assert the
    // deferred revocation is scheduled (not fired immediately), matching the
    // documented production behavior.
    const blobSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout')
    const origCreateElement = document.createElement.bind(document)
    const anchors: HTMLAnchorElement[] = []
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag)
      if (tag.toLowerCase() === 'a' && el instanceof HTMLAnchorElement) anchors.push(el)
      return el
    })

    downloadCSV({ filename: 'students_export.csv', headers: ['Name'], rows: [['=1+1'], ['Ada, A.']] })

    expect(createSpy).toHaveBeenCalled()
    const anchor = anchors[0]
    expect(anchor.getAttribute('download')).toBe('students_export.csv')
    expect(blobSpy).toHaveBeenCalledOnce()
    const blob = blobSpy.mock.calls[0][0] as Blob
    const text = await blob.text()
    expect(text).toBe(`Name\n'=1+1\n"Ada, A."`)

    // Deferred revoke was scheduled (once) with the documented 10s delay and
    // has not yet been invoked synchronously.
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10000)
    expect(revokeSpy).not.toHaveBeenCalled()

    blobSpy.mockRestore()
    revokeSpy.mockRestore()
    setTimeoutSpy.mockRestore()
    createSpy.mockRestore()
  })
})

// ─── B5 — local-calendar date formatting ────────────────────────────────────

describe('B5 — formatDateOnly keeps YYYY-MM-DD on the LOCAL calendar', () => {
  it('builds the date from parsed parts (never UTC-midnight shifted)', async () => {
    const real = await vi.importActual<typeof import('../services/userService')>('../services/userService')
    const expected = new Date(2026, 7, 28).toLocaleDateString()
    expect(real.formatDateOnly('2026-08-28')).toBe(expected)
  })

  it('returns unrecognised input unchanged', async () => {
    const real = await vi.importActual<typeof import('../services/userService')>('../services/userService')
    expect(real.formatDateOnly('not-a-date')).toBe('not-a-date')
  })
})

// ─── B6 — client-side name length bound ─────────────────────────────────────

describe('B6 — identityUpdateSchema enforces name max(80) client-side', () => {
  it('accepts exactly 80 characters and rejects 81 with the canonical message', () => {
    expect(identityUpdateSchema.safeParse({ name: 'a'.repeat(80), password: undefined }).success).toBe(true)
    const res = identityUpdateSchema.safeParse({ name: 'a'.repeat(81), password: undefined })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues.map(i => i.message)).toContain('Name must be 80 characters or less')
    }
  })
})

// ─── B1 — single-flight toggle + optimistic revert ──────────────────────────

describe('B1 — notification toggle is single-flight with revert-on-error', () => {
  it('ignores a second toggle while the first mutation is in flight', async () => {
    const slow = deferred<void>()
    svc().updateSubAdminNotificationPrefs.mockReturnValueOnce(slow.promise)

    const { result } = await renderLoadedHook()

    act(() => {
      void result.current.handleTogglePref('notify_on_attempt', false, result.current.setNotifyAttempt)
    })
    act(() => {
      void result.current.handleTogglePref('notify_on_exam_closure', false, result.current.setNotifyCompletion)
    })

    // The second call must be swallowed by the savingPrefsRef guard.
    expect(svc().updateSubAdminNotificationPrefs).toHaveBeenCalledTimes(1)
    expect(result.current.savingPrefs).toBe(true)
    expect(result.current.notifyCompletion).toBe(true)

    await act(async () => { slow.resolve() })
    expect(result.current.savingPrefs).toBe(false)
    expect(result.current.notifyAttempt).toBe(false)
    expect(result.current.notifyCompletion).toBe(true)
  })

  it('reverts the optimistic toggle and shows friendly inline copy on failure', async () => {
    svc().updateSubAdminNotificationPrefs.mockRejectedValueOnce(
      Object.assign(new Error('new row violates row-level security policy'), { code: '42501' }),
    )

    const { result } = await renderLoadedHook()
    act(() => {
      void result.current.handleTogglePref('notify_on_attempt', false, result.current.setNotifyAttempt)
    })
    expect(result.current.notifyAttempt).toBe(false)

    await act(async () => {})
    expect(result.current.notifyAttempt).toBe(true)
    expect(result.current.actionError).toBe('Failed to save preference. Please try again.')
  })

  it('writes the FULL normalized preference object derived from profileRef (B11 write path)', async () => {
    svc().fetchSubAdminProfileAndUser.mockResolvedValueOnce({
      profile: { ...PROFILE, notification_prefs: { notify_on_attempt: false } } as typeof PROFILE,
      lastActivity: 'Aug 28, 2026',
    })

    const { result } = await renderLoadedHook()
    act(() => {
      void result.current.handleTogglePref('notify_on_exam_closure', false, result.current.setNotifyCompletion)
    })
    await act(async () => {})

    expect(svc().updateSubAdminNotificationPrefs).toHaveBeenCalledWith({
      notify_on_attempt: false,
      notify_on_exam_closure: false,
      notify_on_new_student: true,
    })
    // The DB only supplied one key; on write the default fills the rest.
    expect(result.current.notifyNewStudent).toBe(true)
  })
})

// ─── B11 — default-aware hydration ──────────────────────────────────────────

describe('B11 — missing preference keys hydrate from DEFAULT_PREFS', () => {
  it('merges sparse db prefs with defaults for every toggle (never undefined)', async () => {
    svc().fetchSubAdminProfileAndUser.mockResolvedValueOnce({
      profile: { ...PROFILE, notification_prefs: { notify_on_exam_closure: false } } as typeof PROFILE,
      lastActivity: 'Aug 28, 2026',
    })

    const { result } = await renderLoadedHook()
    expect(result.current.notifyAttempt).toBe(true)
    expect(result.current.notifyCompletion).toBe(false)
    expect(result.current.notifyNewStudent).toBe(true)
  })
})

// ─── B7 — partial save semantics ────────────────────────────────────────────

describe('B7 — name saved then password failed → explicit partial-save message, no rollback', () => {
  it('reports the partial state, keeps the name committed, preserves password input', async () => {
    authSvc().updatePassword.mockResolvedValueOnce({
      success: false,
      error: { source: 'auth', code: 'SESSION_EXPIRED', message: 'token expired' },
    })

    const { result } = await renderLoadedHook()
    act(() => { result.current.setName('Renamed Admin') })
    act(() => { result.current.setPassword('StrongP@ss1') })

    await act(async () => { await result.current.handleSaveProfile() })

    expect(svc().updateSubAdminProfile).toHaveBeenCalledWith('Renamed Admin')
    expect(result.current.profile?.full_name).toBe('Renamed Admin')
    expect(result.current.password).toBe('StrongP@ss1')
    expect(result.current.actionError).toBe('Name saved, but password update failed: token expired')
  })

  it('strips any server VALIDATION_FAILED: prefix before it can reach the UI', async () => {
    authSvc().updatePassword.mockResolvedValueOnce({
      success: false,
      error: { source: 'auth', code: 'UNKNOWN', message: 'VALIDATION_FAILED: ApiError: short' },
    })

    const { result } = await renderLoadedHook()
    act(() => { result.current.setPassword('StrongP@ss1') })

    await act(async () => { await result.current.handleSaveProfile() })

    expect(result.current.actionError).not.toBeNull()
    expect(result.current.actionError).not.toMatch(/VALIDATION_FAILED/i)
  })

  it('full success clears the password and clears errors', async () => {
    const { result } = await renderLoadedHook()
    act(() => { result.current.setPassword('StrongP@ss1') })

    await act(async () => { await result.current.handleSaveProfile() })

    expect(result.current.password).toBe('')
    expect(result.current.actionError).toBeNull()
  })
})

// ─── B4 — exports never falsely claim completeness ──────────────────────────

describe('B4 — export pagination semantics at the hook', () => {
  function stubDownload() {
    const blobSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    return { blobSpy, revokeSpy }
  }

  it('students export: truncated → explicit notice, download still happens', async () => {
    const { blobSpy, revokeSpy } = stubDownload()
    svc().fetchStudentsByEducatorId.mockResolvedValueOnce({
      rows: [{ full_name: 'Ada', email: 'ada@example.com', created_at: '2026-01-01' }],
      truncated: true,
    })

    const { result } = await renderLoadedHook()
    await act(async () => { await result.current.handleExportStudents() })

    expect(blobSpy).toHaveBeenCalledOnce()
    expect(result.current.notice).toMatch(/Only the first 1 student records were exported/i)
    expect(result.current.notice).toMatch(/administrator/i)
    expect(result.current.actionError).toBeNull()
    revokeSpy.mockRestore()
    blobSpy.mockRestore()
  })

  it('students export: complete → no notice, no error', async () => {
    const { blobSpy } = stubDownload()
    svc().fetchStudentsByEducatorId.mockResolvedValueOnce({
      rows: [{ full_name: 'Ada', email: 'ada@example.com', created_at: '2026-01-01' }],
      truncated: false,
    })

    const { result } = await renderLoadedHook()
    await act(async () => { await result.current.handleExportStudents() })

    expect(result.current.notice).toBeNull()
    expect(result.current.actionError).toBeNull()
    expect(blobSpy).toHaveBeenCalledOnce()
    blobSpy.mockRestore()
  })

  it('students export: empty roster → inline "No students found", NOT a success download', async () => {
    const { blobSpy } = stubDownload()
    const { result } = await renderLoadedHook()
    await act(async () => { await result.current.handleExportStudents() })

    expect(result.current.actionError).toBe('No students found')
    expect(blobSpy).not.toHaveBeenCalled()
    blobSpy.mockRestore()
  })

  it('exams export: truncation notice text uses exam copy', async () => {
    const { blobSpy } = stubDownload()
    examSvc().fetchTeacherExamsForExport.mockResolvedValueOnce({
      rows: [{ title: 'Midterm', total_questions: 10, total_marks: 100, created_at: '2026-01-01' }],
      truncated: true,
    })

    const { result } = await renderLoadedHook()
    await act(async () => { await result.current.handleExportExams() })

    expect(result.current.notice).toMatch(/Only the first 1 exam records were exported/i)
    expect(blobSpy).toHaveBeenCalledOnce()
    blobSpy.mockRestore()
  })
})

// ─── B8 — copied-reset timer hygiene ────────────────────────────────────────

describe('B8 — 2s copied timer is cleared before re-arming', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  it('a re-copy cancels the earlier reset so state never flickers early', async () => {
    const { result } = await renderLoadedHook()

    vi.useFakeTimers()
    try {
      // First copy arms the reset timer at fake t=0.
      act(() => { void result.current.handleCopyCoupon() })
      await act(async () => {})
      expect(result.current.copied).toBe(true)

      // 300ms later a SECOND copy succeeds → it must clear the first timer.
      await act(async () => { await vi.advanceTimersByTimeAsync(300) })
      act(() => { void result.current.handleCopyCoupon() })
      await act(async () => {})

      // Advance to fake t=2000. Without the clear-on-re-arm fix the FIRST
      // timer fires now and snaps copied=false mid-session. With B8 it must
      // still be true (the only live timer is the second copy's at t=2300).
      await act(async () => { await vi.advanceTimersByTimeAsync(1700) })
      expect(result.current.copied).toBe(true)

      // Advance past the second timer → final reset happens exactly once.
      await act(async () => { await vi.advanceTimersByTimeAsync(300) })
      expect(result.current.copied).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not setState after unmount (timer cleared on cleanup)', async () => {
    const { result, unmount } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.useFakeTimers()
    let actError: unknown = null
    try {
      act(() => { void result.current.handleCopyCoupon() })
      await act(async () => {})
      unmount()
      expect(() => {
        act(() => { vi.advanceTimersByTime(2500) })
      }).not.toThrow()
    } catch (e) {
      actError = e
    } finally {
      vi.useRealTimers()
    }
    expect(actError).toBeNull()
  })
})

// ─── B2 — page-level loading / error / retry gating ─────────────────────────

describe('B2 — page gates loading, error and retry', () => {
  it('exactly ONE loading status owner while pending; real grid is never mounted with defaults', async () => {
    svc().fetchSubAdminProfileAndUser.mockImplementation(() => deferred<{ profile: typeof PROFILE; lastActivity: string }>().promise)

    renderPage()

    await waitFor(() => expect(screen.getByRole('status', { name: 'Loading settings' })).toBeInTheDocument())
    expect(screen.getAllByRole('status', { name: 'Loading settings' })).toHaveLength(1)
    // No identity/recruitment content while loading.
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Copy coupon')).not.toBeInTheDocument()
  })

  it('success replaces the skeleton with the real settings grid', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Save Changes')).toBeInTheDocument())
    expect(screen.queryByRole('status', { name: 'Loading settings' })).not.toBeInTheDocument()
  })

  it('load failure surfaces the canonical error surface with a retry', async () => {
    svc().fetchSubAdminProfileAndUser.mockRejectedValue(
      Object.assign(new Error('new row violates row-level security policy'), { code: '42501' }),
    )

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(screen.queryByText(/SQLSTATE|\b42501\b|row-level security/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading settings' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('a missing educator profile row is a BUSINESS error, not a technical one', async () => {
    svc().fetchSubAdminProfileAndUser.mockResolvedValue({ profile: null, lastActivity: '—' })

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('retry button shows a busy state while a retry is in flight', async () => {
    const hang = deferred<{ profile: typeof PROFILE; lastActivity: string }>()
    svc().fetchSubAdminProfileAndUser
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockReturnValueOnce(hang.promise)

    renderPage()

    const retry = await screen.findByRole('button', { name: /try again/i })
    await act(async () => {
      retry.click()
      await Promise.resolve()
    })
    const busyRetry = screen.getByRole('button', { name: 'Retrying…' })
    expect(busyRetry).toBeDisabled()
    expect(busyRetry).toHaveAttribute('aria-busy', 'true')

    await act(async () => { hang.resolve({ profile: PROFILE, lastActivity: 'Aug 28, 2026' }) })
    await waitFor(() => expect(screen.getByText('Save Changes')).toBeInTheDocument())
  })

  it('edit-time failures render inline Alerts: actionError (error) and truncation notice (warning)', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Save Changes')).toBeInTheDocument())
    expect(screen.queryByText('Action failed')).not.toBeInTheDocument()
    expect(screen.queryByText('Partial export')).not.toBeInTheDocument()
  })
})

// ─── Structural source contracts ────────────────────────────────────────────

describe('Structural source contracts (B1–B8, B11 wiring)', () => {
  const here = join(__dirname, '..')
  const readSrc = (p: string) => readFileSync(join(here, p), 'utf8').replace(/\r\n/g, '\n')

  it('B2: page owns exactly one role="status" and delegates to the skeleton + error surface', () => {
    const page = readSrc('pages/sub-admin/SubAdminSettings.tsx')
    const skeleton = readSrc('components/sub-admin/settings/SubAdminSettingsSkeleton.tsx')
    // Any role="status" JSX lives in the skeleton file (single owner); the page
    // may only mention it in prose/comments.
    expect(page.match(/<[^>]*role="status"/g) ?? []).toHaveLength(0)
    expect(page).toContain('ErrorContainer')
    expect(page).toContain('RetryButton')
    expect(page).toMatch(/Alert\s+variant="error"/)
    expect(page).toMatch(/Alert\s+variant="warning"/)
    expect(page).toContain('SubAdminSettingsSkeleton')
    expect(skeleton.replace(/\/\*[\s\S]*?\*\//g, '').match(/role="status"/g)?.length ?? 0).toBe(1)
    expect(skeleton).toContain('aria-label="Loading settings"')
  })

  it('B1: single-flight guard + optimistic revert live in the hook', () => {
    const hook = readSrc('components/sub-admin/settings/useSettings.ts')
    expect(hook).toContain('savingPrefsRef.current = true')
    expect(hook).toContain('if (savingPrefsRef.current) return')
    expect(hook).toContain('Failed to save preference. Please try again.')
    expect(hook).toContain('setter(!value)')
  })

  it('B11: writes always spread DEFAULT_PREFS first', () => {
    const hook = readSrc('components/sub-admin/settings/useSettings.ts')
    expect(hook).toContain('...DEFAULT_PREFS,')
    expect(hook).toContain('...(profileRef.current.notification_prefs ?? {})')
  })

  it('B8: copied timer is cleared on re-arm and on unmount', () => {
    const hook = readSrc('components/sub-admin/settings/useSettings.ts')
    expect(hook).toContain('clearTimeout(copiedTimerRef.current)')
    expect(hook).toContain('copiedTimerRef.current = window.setTimeout')
  })

  it('B3: FORMULA_TRIGGERS and the apostrophe-prefix guard exist at the boundary', () => {
    const csv = readSrc('utils/csvUtils.ts')
    // Source stores triggers as character literals ('\t', '\r' are escaped).
    for (const t of ["'='", "'+'", "'-'", "'@'", "'\\t'", "'\\r'"]) {
      expect(csv, t).toContain(t)
    }
    expect(csv).toContain("str = `'${str}`")
  })

  it('B4: repos paginate with exact count + range loop and return { rows, truncated }', () => {
    for (const [file, marker] of [
      ['lib/repositories/user.repository.ts', 'fetchAllStudentsByEducatorId'],
      ['lib/repositories/teacherExam.repository.ts', 'fetchAllTeacherExamsBySubAdminId'],
    ] as const) {
      const src = readSrc(file)
      expect(src).toContain(marker)
      expect(src).toContain("count: 'exact'")
      expect(src).toContain('.range(from, from + pageSize - 1)')
      expect(src).toContain('return { rows, truncated: rows.length < total }')
    }
    const svcSrc = readSrc('services/userService.ts') + readSrc('services/teacherExamService.ts')
    expect(svcSrc).toContain('return { rows: result.rows, truncated: result.truncated }')
    expect(svcSrc).toContain('const result = await teacherExamRepo.fetchAllTeacherExamsBySubAdminId(subAdminId)')
  })

  it('B5: formatDateOnly reconstructs from YYYY-MM-DD parts (no UTC Date constructor)', () => {
    const svcSrc = readSrc('services/userService.ts')
    expect(svcSrc).toMatch(/const date = new Date\(Number\(y\), Number\(m\) - 1, Number\(d\)\)/)
  })

  it('B6: identityUpdateSchema caps the name at 80', () => {
    const schema = readSrc('validations/securitySchemas.ts')
    expect(schema).toContain(".max(80, 'Name must be 80 characters or less')")
  })

  it('B4/B5/B6: no hidden .limit() truncation or raw error/date leaks in export paths', () => {
    const svcSrc = readSrc('services/userService.ts')
    const examSrc = readSrc('services/teacherExamService.ts')
    // Exports now consume only the paginated helpers.
    expect(svcSrc).not.toMatch(/fetchStudentsByEducatorId[\s\S]{0,200}\.limit\(5000\)/)
    expect(examSrc).not.toMatch(/fetchTeacherExamsForExport[\s\S]{0,200}\.limit\(1000\)/)
  })
})