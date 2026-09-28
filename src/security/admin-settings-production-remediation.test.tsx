/// <reference types="node" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { useAdminSettings } from '../components/admin/settings/useAdminSettings'
import { AddExamModal } from '../components/admin/settings/AddExamModal'
import AdminSettingsPage from '../pages/admin/AdminSettings'
import { AdminSettingsSkeleton } from '../components/admin/settings/AdminSettingsSkeleton'
import { ThemeProvider } from '../context/ThemeContext'
import { normalizeError } from '../utils/errorClassification'
import type { ExamConfig, ExamSubject, ExamTopicConfig } from '../types/exam.types'
import type { UserProfile } from '../types/auth.types'

/* ── ADMIN SETTINGS PRODUCTION REMEDIATION REGRESSION SUITE ─────────────────
 * BUG-A  Exams save flows through ONE atomic RPC (save_admin_settings_rpc)
 *        — single call, exact migration payload contract, zero legacy writes.
 * BUG-B  Successful Exams save re-pairs BOTH dual-baseline snapshots with the
 *        committed state → isDirty=false, no false unsaved-changes modal, no
 *        pre-save restore on Discard.
 * BUG-C  Validation rejections expose a NON-retryable SaveError (no Retry
 *        button); transport failures expose a retryable one whose factory
 *        reads CURRENT context at retry time (never replays Exam A into B).
 * BUG-D  Group-level pseudo-selection renders neutral guidance, never the
 *        misleading "No Configuration" EmptyState.
 * BUG-E  No nested live region around the settings content.
 * BUG-F  AddExamModal Cancel routes through the single reset path.
 * BUG-J  AddExamModal submit handler refuses re-entry while submitting.
 * BUG-H  Classifier is structured-first; bare substrings can no longer
 *        misclassify wrapped auth/server/network errors.
 * BUG-I  Skeleton exposes exactly ONE loading status region, decorative innards,
 *        no !important compensation classes.
 * ─────────────────────────────────────────────────────────────────────────── */

vi.mock('../hooks/useAdminFilters', async () => {
  const { useSyncExternalStore, useCallback } = await import('react')
  const state = { exam: 'EXAM_A', paper: 'all', subject: 'all' }
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach(l => l())
  const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
  const snapshot = () => `${state.exam}|${state.paper}|${state.subject}`
  return {
    __resetFilters: () => { state.exam = 'EXAM_A'; state.paper = 'all'; state.subject = 'all' },
    __setExam: (exam: string) => { state.exam = exam; state.paper = 'all'; state.subject = 'all'; notify() },
    __setFiltersRaw: (exam: string, paper: string, subject: string) => {
      state.exam = exam; state.paper = paper; state.subject = subject; notify()
    },
    useAdminFilters: () => {
      useSyncExternalStore(subscribe, snapshot)
      const update = useCallback((patch: Partial<typeof state>) => {
        Object.assign(state, patch)
        notify()
      }, [])
      return {
        selectedExam: state.exam,
        selectedPaper: state.paper,
        selectedSubject: state.subject,
        setSelectedExam: (v: string) => update({ exam: v, paper: 'all', subject: 'all' }),
        setSelectedPaper: (v: string) => update({ paper: v, subject: 'all' }),
        setSelectedSubject: (v: string) => update({ subject: v }),
      }
    },
  }
})

const serviceMocks = vi.hoisted(() => ({
  fetchExamPapers: vi.fn(),
  fetchExamConfig: vi.fn(),
  fetchExamSubjects: vi.fn(),
  fetchTopicConfiguration: vi.fn(),
  saveAdminSettingsAtomic: vi.fn(),
  saveSubjectTestConfiguration: vi.fn(),
  createNewExam: vi.fn(),
}))

const mockUser = vi.hoisted(() => ({ id: 'admin-1', role: 'admin' }))

vi.mock('../services/adminService', () => ({ adminService: serviceMocks }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }))
vi.mock('../components/admin/shared/AdminSelectionTabs', () => ({
  AdminSelectionTabs: () => <div data-testid="selection-tabs" />,
}))

// focus-trap's MutationObserver-driven revalidation races RTL's synchronous
// open/close cycles in jsdom ("zero tabbable nodes"). The REAL trap contract
// (focus, Escape, restore) is browser-proven in e2e/admin-settings-remediation
// .spec.ts BR-2; these unit tests only need the modal shell + form flow.
vi.mock('focus-trap-react', () => ({
  FocusTrap: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

const { __resetFilters, __setExam, __setFiltersRaw } =
  await import('../hooks/useAdminFilters') as unknown as {
    __resetFilters: () => void
    __setExam: (e: string) => void
    __setFiltersRaw: (e: string, p: string, s: string) => void
  }

function makeConfig(): ExamConfig {
  return {
    id: 'cfg-1', exam_id: 'EXAM_A', name: 'Exam A', exam_selection: 'TEST',
    total_questions: 10, total_marks: 10, duration_minutes: 30,
    negative_marking: false, negative_mark_value: 0, is_published: true,
  }
}

function makeSubjects(): ExamSubject[] {
  return ['Alpha', 'Beta'].map((name, i) => ({
    id: `sub-${i}`, exam_id: 'EXAM_A', paper_id: 'paper-A',
    subject_name: name, question_count: 5, marks_per_question: 1, display_order: i,
  }))
}

function makeTopics(required: number[]): ExamTopicConfig[] {
  return required.map((req, i) => ({
    id: `topic-${i}`,
    topic_en: `Topic ${i}`,
    topic_te: null,
    display_order: i,
    required_questions: req,
    test_20_required: 1,
    test_30_required: 1,
    test_50_required: 1,
    actual_count: 0,
  }))
}

/** Valid exams-mode fixture: 2 subjects × q5, topics [2,1,1,1] per subject. */
function primeFetches(opts: { topics?: Record<string, ExamTopicConfig[]> } = {}) {
  serviceMocks.fetchExamPapers.mockResolvedValue([
    { id: 'paper-A', paper_name: 'Paper A', total_questions: 10, total_marks: 10, duration_minutes: 30, negative_marking: false, negative_mark_value: 0 },
  ])
  serviceMocks.fetchExamConfig.mockResolvedValue(makeConfig())
  serviceMocks.fetchExamSubjects.mockResolvedValue(makeSubjects())
  serviceMocks.fetchTopicConfiguration.mockImplementation(
    (_ctx: unknown, _exam: string, _paper: string, subjectName: string) =>
      Promise.resolve(opts.topics?.[subjectName] ?? makeTopics([2, 1, 1, 1]))
  )
  serviceMocks.saveAdminSettingsAtomic.mockResolvedValue({
    ok: true, configs_updated: 0, papers_updated: 2, subjects_updated: 2, topics_updated: 8,
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  serviceMocks.fetchTopicConfiguration.mockResolvedValue([])
  __resetFilters()
})

afterEach(() => {
  cleanup()
  ;(globalThis as Record<string, unknown>)[STATE_KEY] = null
})

type HookState = ReturnType<typeof useAdminSettings>
const STATE_KEY = '__remediation_hook_state__'
const getHookState = (): HookState | null =>
  ((globalThis as Record<string, unknown>)[STATE_KEY] as HookState | undefined) ?? null

function Harness() {
  const s = useAdminSettings()
  useEffect(() => { ;(globalThis as Record<string, unknown>)[STATE_KEY] = s })
  return null
}

async function renderLoadedHook() {
  primeFetches()
  render(<Harness />)
  await waitFor(() => expect(getHookState()?.isLoading).toBe(false))
  // Topics prefetch settles
  await waitFor(() => expect(Object.keys(getHookState()?.topicConfigs ?? {}).length).toBe(2))
}

describe('BUG-A — atomic Exams save', () => {
  it('ATOMIC-1: save issues exactly ONE RPC with the migration payload contract', async () => {
    await renderLoadedHook()
    act(() => { getHookState()?.setConfig({ ...makeConfig(), total_marks: 12 }) })

    let result: boolean | undefined
    await act(async () => { result = await getHookState()?.handleSave() })

    expect(result).toBe(true)
    expect(serviceMocks.saveAdminSettingsAtomic).toHaveBeenCalledTimes(1)
    const input = serviceMocks.saveAdminSettingsAtomic.mock.calls[0][1]
    expect(input.examId).toBe('EXAM_A')
    expect(input.paperId).toBeNull()
    expect(input.config.total_questions).toBe(10)
    expect(input.config.total_marks).toBe(12)
    expect(input.subjects).toEqual([
      { id: 'sub-0', question_count: 5, marks_per_question: 1 },
      { id: 'sub-1', question_count: 5, marks_per_question: 1 },
    ])
    expect(input.topics).toEqual([
      { paper_id: 'paper-A', subject_name: 'Alpha', topics: [
        { topic_id: 'topic-0', required_questions: 2 },
        { topic_id: 'topic-1', required_questions: 1 },
        { topic_id: 'topic-2', required_questions: 1 },
        { topic_id: 'topic-3', required_questions: 1 },
      ] },
      { paper_id: 'paper-A', subject_name: 'Beta', topics: [
        { topic_id: 'topic-0', required_questions: 2 },
        { topic_id: 'topic-1', required_questions: 1 },
        { topic_id: 'topic-2', required_questions: 1 },
        { topic_id: 'topic-3', required_questions: 1 },
      ] },
    ])
  })

  it('ATOMIC-2: RPC rejection surfaces the structured message and keeps the draft dirty', async () => {
    await renderLoadedHook()
    serviceMocks.saveAdminSettingsAtomic.mockRejectedValue(
      new Error('Failed to save settings atomically: SUM_MISMATCH: Topic requirements sum (6) must equal subject total (5)')
    )
    act(() => { getHookState()?.setConfig({ ...makeConfig(), total_marks: 12 }) })

    let result: boolean | undefined
    await act(async () => { result = await getHookState()?.handleSave() })

    expect(result).toBe(false)
    const s = getHookState()
    expect(s?.topicError).toContain('SUM_MISMATCH')
    expect(s?.saveSuccess).toBe(false)
    expect(s?.isDirty).toBe(true)
  })
})

describe('BUG-B — baseline recapture after successful Exams save', () => {
  it('BASELINE-1: save success clears isDirty AND draftDivergesFromServer', async () => {
    await renderLoadedHook()
    expect(getHookState()?.isDirty).toBe(false)

    act(() => { getHookState()?.setConfig({ ...makeConfig(), duration_minutes: 45 }) })
    expect(getHookState()?.isDirty).toBe(true)

    await act(async () => { await getHookState()?.handleSave() })

    const s = getHookState()
    expect(s?.saveSuccess).toBe(true)
    expect(s?.isDirty).toBe(false)
    expect(s?.draftDivergesFromServer).toBe(false)
  })

  it('BASELINE-2: clean post-save state switches selection WITHOUT the unsaved-changes modal', async () => {
    await renderLoadedHook()
    act(() => { getHookState()?.setConfig({ ...makeConfig(), duration_minutes: 45 }) })
    await act(async () => { await getHookState()?.handleSave() })

    act(() => { getHookState()?.setSelectedExam('EXAM_B') })
    expect(getHookState()?.pendingSelection).toBeNull()
    expect(getHookState()?.selectedExam).toBe('EXAM_B')
  })

  it('BASELINE-3: Discard after save restores the SAVED values, not pre-save ones', async () => {
    await renderLoadedHook()
    act(() => { getHookState()?.setConfig({ ...makeConfig(), duration_minutes: 45 }) })
    await act(async () => { await getHookState()?.handleSave() })

    // Post-save edit, then discard via the confirmation flow
    act(() => { getHookState()?.setConfig({ ...makeConfig(), duration_minutes: 90 }) })
    expect(getHookState()?.isDirty).toBe(true)
    act(() => { getHookState()?.discardForSwitch() })
    expect(getHookState()?.config?.duration_minutes).toBe(45)
  })

  it('BASELINE-4: retry-path success also recaptures baselines', async () => {
    await renderLoadedHook()
    serviceMocks.saveAdminSettingsAtomic.mockRejectedValueOnce(
      new Error('Failed to save settings atomically: axios network hiccup')
    )
    act(() => { getHookState()?.setConfig({ ...makeConfig(), duration_minutes: 45 }) })
    await act(async () => { await getHookState()?.handleSave() })
    expect(getHookState()?.topicError).toBeTruthy()
    expect(getHookState()?.saveRetryable).toBe(true)

    await act(async () => { await getHookState()?.retrySave() })

    const s = getHookState()
    expect(s?.saveSuccess).toBe(true)
    expect(s?.isDirty).toBe(false)
    expect(s?.draftDivergesFromServer).toBe(false)
  })
})

describe('BUG-C — retry semantics', () => {
  it('RETRY-C1: validation rejection is NOT retryable', async () => {
    // Prime with a broken topic sum from the start (16 required vs 5 allowed)
    primeFetches({ topics: { Alpha: makeTopics([4, 4, 4, 4]) } })
    render(<Harness />)
    await waitFor(() => expect(getHookState()?.isLoading).toBe(false))
    await waitFor(() => expect((getHookState()?.topicConfigs['Alpha'] ?? []).length).toBe(4))

    act(() => { getHookState()?.setConfig({ ...makeConfig(), duration_minutes: 45 }) })
    let result: boolean | undefined
    await act(async () => { result = await getHookState()?.handleSave() })

    expect(result).toBe(false)
    const s = getHookState()
    expect(s?.topicError).toContain('must sum')
    expect(s?.saveRetryable).toBe(false)
  })

  it('RETRY-C2: transport failure IS retryable; retry uses CURRENT context only', async () => {
    await renderLoadedHook()
    serviceMocks.saveAdminSettingsAtomic.mockRejectedValueOnce(
      new Error('Failed to save settings atomically: TypeError: Failed to fetch')
    )
    act(() => { getHookState()?.setConfig({ ...makeConfig(), duration_minutes: 45 }) })
    await act(async () => { await getHookState()?.handleSave() })
    expect(getHookState()?.saveRetryable).toBe(true)

    // Switch context behind the guard's back (URL-param equivalent)
    act(() => { __setExam('EXAM_B') })
    await waitFor(() => expect(Object.keys(getHookState()?.topicConfigs ?? {}).length).toBeGreaterThan(0))

    await act(async () => { await getHookState()?.retrySave() })

    // Factory read CURRENT refs at retry time — Exam B, never Exam A
    const calls = serviceMocks.saveAdminSettingsAtomic.mock.calls
    const lastInput = calls[calls.length - 1][1]
    expect(lastInput.examId).toBe('EXAM_B')
  })
})

describe('BUG-D / BUG-E / BUG-I — page-level states', () => {
  function renderPage(exam: string) {
    act(() => { __setFiltersRaw(exam, 'all', 'all') })
    return render(
      <ThemeProvider>
        <AdminSettingsPage />
      </ThemeProvider>
    )
  }

  it('GROUP-D: group pseudo-selection shows neutral guidance, not EmptyState', async () => {
    renderPage('APPSC_GROUPS')
    await waitFor(() => expect(screen.getByText(/Select a specific exam/i)).toBeDefined())
    expect(screen.queryByText('No Configuration Yet')).toBeNull()
  })

  it('LIVE-E: settings content has no broad aria-live wrapper (no nested live regions)', () => {
    renderPage('APPSC_GROUPS')
    expect(screen.queryByLabelText('Settings content')).toBeNull()
  })

  it('SKEL-I: skeleton exposes exactly ONE status region with decorative innards', () => {
    render(<AdminSettingsSkeleton />)
    const statuses = screen.getAllByRole('status')
    expect(statuses).toHaveLength(1)
    expect(statuses[0]).toHaveAttribute('aria-label', 'Loading admin settings')
    expect(statuses[0].firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('BUG-F / BUG-J — AddExamModal', () => {
  function ModalHarness({ onClose }: { onClose: () => void }) {
    return (
      <ThemeProvider>
        <AddExamModal isOpen onClose={onClose} user={mockUser as unknown as UserProfile} onExamCreated={() => {}} />
      </ThemeProvider>
    )
  }

  it('CANCEL-F: Cancel clears validation errors before closing', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { rerender } = render(<ModalHarness onClose={onClose} />)

    // Trigger validation errors
    await user.clear(screen.getByLabelText(/Exam Key/i))
    await user.click(screen.getByRole('button', { name: /deploy dynamic exam/i }))
    await waitFor(() => expect(screen.getAllByText(/required|invalid/i).length).toBeGreaterThan(0))

    // Cancel → close → reopen: no stale errors
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(onClose).toHaveBeenCalled()
    rerender(<ModalHarness onClose={onClose} />)
    await waitFor(() =>
      expect(screen.queryByText(/required|invalid/i)).toBeNull()
    )
  })

  it('DUP-J: triple rapid submit fires exactly ONE create call', async () => {
    const user = userEvent.setup()
    let resolveCreate!: (v: void) => void
    serviceMocks.createNewExam.mockImplementation(
      () => new Promise<void>(res => { resolveCreate = res })
    )
    const onClose = vi.fn()
    render(<ModalHarness onClose={onClose} />)

    // Fill the two fields whose defaults are intentionally blank
    await user.type(screen.getByLabelText(/Exam Key/i), 'GATE_CS')
    await user.type(screen.getByLabelText(/Display Name/i), 'GATE CS')

    const submit = screen.getByRole('button', { name: /deploy dynamic exam/i })
    await user.click(submit)
    await user.click(submit)
    await user.click(submit)
    expect(serviceMocks.createNewExam).toHaveBeenCalledTimes(1)

    resolveCreate()
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})

describe('BUG-H — structured-first error classifier', () => {
  it('CLASS-1: structured status beats ambiguous message text', () => {
    const err = normalizeError({ message: 'JWT expired during fetch attempt', status: 401 })
    expect(err.category).toBe('authentication')
  })

  it('CLASS-2: Postgres 42501 → authorization', () => {
    const err = normalizeError({ message: 'new row violates row-level security policy', code: '42501' })
    expect(err.category).toBe('authorization')
  })

  it('CLASS-3: UNAUTHORIZED_ACCESS is authorization, not session expiry', () => {
    const err = normalizeError(new Error('UNAUTHORIZED_ACCESS: Admin role required'))
    expect(err.category).toBe('authorization')
  })

  it('CLASS-4: structured 500 classifies server without the word "server"', () => {
    const err = normalizeError({ message: 'Something went wrong', statusCode: 502 })
    expect(err.category).toBe('server')
  })

  it('CLASS-5: bare "server"/"fetch" words no longer force a category', () => {
    expect(normalizeError(new Error('Failed to load exam papers.')).category).toBe('unknown')
    expect(normalizeError(new Error('Failed to fetch')).category).toBe('network')
  })
})
