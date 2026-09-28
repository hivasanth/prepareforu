/// <reference types="node" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor, act } from '@testing-library/react'
import { useEffect } from 'react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from './context/ThemeContext'
import AdminSettingsPage from './pages/admin/AdminSettings'
import { useAdminSettings } from './components/admin/settings/useAdminSettings'
import { computeEvenDistribution, getTopicThresholdSum, TOPIC_MIN_REQUIRED } from './components/admin/settings/utils/topicConfigUtils'
import type { ExamConfig, ExamSubject, ExamTopicConfig } from './types/exam.types'
import type { UserProfile } from './types/auth.types'

/* ── ST-01..ST-12 Subject Test mode regression suite ─────────────────────
 * Business rules locked here:
 *   ST-01  deterministic even distribution (equal + remainder cases)
 *   ST-02  auto-default first valid subject on mode activation
 *   ST-03  invalid persisted column → deterministic draft init (dirty)
 *   ST-04  valid persisted column → preserved verbatim
 *   ST-05  manual edits preserved; sum mismatch blocks Save
 *   ST-06  manual rebalance re-enables Save
 *   ST-07  per-topic minimum mirrors backend INVALID_THRESHOLD rule
 *   ST-08  mode switch recomputes violating columns deterministically
 *   ST-09  save flows through the RPC chain and refetches LIVE values
 *   ST-10  save payload maps the active mode column only
 *   ST-11  page-level Save gating (dirty && valid)
 *   ST-12  panel reuses shared containers (no duplicate topic components)
 * Backend authority (save_subject_test_configuration) is verified against
 * the LIVE database separately in the final report. */

// Reactive stand-in for the URL-param-backed filter hook: identical shape,
// but mutations notify subscribers so hook effects observe them like the
// real router-driven implementation.
vi.mock('./hooks/useAdminFilters', async () => {
  const { useSyncExternalStore, useCallback } = await import('react')
  const state = { exam: 'APPSC_GROUP_1', paper: 'all', subject: 'all' }
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach(l => l())
  const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
  const snapshot = () => `${state.exam}|${state.paper}|${state.subject}`
  return {
    __setFilters: (exam: string, paper: string, subject: string) => {
      state.exam = exam; state.paper = paper; state.subject = subject
      notify()
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
}))

// Stable identity across renders — a fresh object would recreate the hook's
// fetchData callback each render and re-trigger its mount effect forever.
const mockUser = vi.hoisted(() => ({ id: 'admin-1', role: 'admin' }))

vi.mock('./services/adminService', () => ({
  adminService: serviceMocks,
}))

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('./components/admin/shared/AdminSelectionTabs', () => ({
  AdminSelectionTabs: () => <div data-testid="selection-tabs" />,
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { __setFilters } = await import('./hooks/useAdminFilters') as any

const adminUser = { id: 'admin-1', role: 'admin' } as unknown as UserProfile

function makeConfig(): ExamConfig {
  return {
    id: 'cfg-1', exam_id: 'APPSC_GROUP_1', name: 'Group 1', exam_selection: 'APPSC_GROUP_1',
    total_questions: 20, total_marks: 20, duration_minutes: 30,
    negative_marking: false, negative_mark_value: 0, is_published: true,
  }
}

function makeSubjects(n: number): ExamSubject[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `sub-${i}`, exam_id: 'APPSC_GROUP_1', paper_id: 'paper-1',
    subject_name: `Subject ${String.fromCharCode(65 + i)}`,
    question_count: 5, marks_per_question: 1, display_order: i,
  }))
}

function makeTopics(n: number, values?: Partial<Record<'required_questions' | 'test_20_required' | 'test_30_required' | 'test_50_required', number>>): ExamTopicConfig[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `topic-${i}`,
    topic_en: `Topic ${String.fromCharCode(65 + i)}`,
    topic_te: null,
    display_order: i,
    required_questions: 1,
    test_20_required: 1,
    test_30_required: 1,
    test_50_required: 1,
    actual_count: 0,
    ...values,
  }))
}

function primeFetch(opts: {
  subjects?: ExamSubject[]
  topicsBySubject?: Record<string, ExamTopicConfig[]>
} = {}) {
  const subjects = opts.subjects ?? makeSubjects(2)
  serviceMocks.fetchExamPapers.mockResolvedValue([
    { id: 'paper-1', paper_name: 'General Studies', total_questions: 20, total_marks: 20, duration_minutes: 30, negative_marking: false, negative_mark_value: 0 },
  ])
  serviceMocks.fetchExamConfig.mockResolvedValue(makeConfig())
  serviceMocks.fetchExamSubjects.mockResolvedValue(subjects)
  serviceMocks.fetchTopicConfiguration.mockImplementation(
    (_ctx: unknown, _exam: string, _paper: string, subjectName: string) =>
      Promise.resolve(opts.topicsBySubject?.[subjectName] ?? makeTopics(4))
  )
}

type HookState = ReturnType<typeof useAdminSettings>

// Snapshot channel: components publish their hook state here; tests read it.
const STATE_KEY = '__st_hook_state__'
const getHookState = () => (globalThis as Record<string, unknown>)[STATE_KEY] as HookState

describe('ST — Subject Test distribution algorithm', () => {
  it('ST-01a: divides equally when divisible (5 topics × 20/30/50)', () => {
    expect(computeEvenDistribution(5, 20)).toEqual([4, 4, 4, 4, 4])
    expect(computeEvenDistribution(5, 30)).toEqual([6, 6, 6, 6, 6])
    expect(computeEvenDistribution(5, 50)).toEqual([10, 10, 10, 10, 10])
  })

  it('ST-01b: distributes deterministically when not divisible (6 topics / 20)', () => {
    const dist = computeEvenDistribution(6, 20)
    expect(dist).toEqual([4, 4, 3, 3, 3, 3])
    expect(dist.reduce((a, b) => a + b, 0)).toBe(20)
    // Deterministic — no randomness
    expect(computeEvenDistribution(6, 20)).toEqual(dist)
    // 7 topics / 50: base 7 + remainder 1 → first topic gets the extra
    expect(computeEvenDistribution(7, 50)).toEqual([8, 7, 7, 7, 7, 7, 7])
  })

  it('ST-01c: sum always equals the selected count and every value respects the minimum', () => {
    for (const total of [20, 30, 50]) {
      for (const n of [1, 3, 5, 6, 9]) {
        const dist = computeEvenDistribution(n, total)
        expect(dist.reduce((a, b) => a + b, 0)).toBe(total)
        expect(Math.min(...dist)).toBeGreaterThanOrEqual(TOPIC_MIN_REQUIRED)
      }
    }
    // n > total is mathematically unsatisfiable under the backend rule
    // (min >= 1 AND sum == total); validation blocks such saves — the
    // distribution itself must still sum correctly.
    const overflow = computeEvenDistribution(21, 20)
    expect(overflow.reduce((a, b) => a + b, 0)).toBe(20)
  })
})

describe('ST — hook behavior', () => {


  function Harness() {
    const s = useAdminSettings()
    // Publish after commit — the react-hooks lint forbids outer writes in render.
    useEffect(() => { ;(globalThis as Record<string, unknown>)[STATE_KEY] = s })
    return null
  }

  function renderHook() {
    render(<Harness />)
  }

  // Real flow: load → activate Subject Test → auto-default subject + draft
  // initialization settle before assertions.
  async function activateSubjectTest() {
    await waitFor(() => expect(getHookState().isLoading).toBe(false))
    await waitFor(() => expect(getHookState().topicConfigs['Subject A']).toBeDefined())
    act(() => { getHookState().setPageMode('subject_test') })
    await waitFor(() => expect(getHookState().selectedSubject).toBe('Subject A'))
  }

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    __setFilters('APPSC_GROUP_1', 'paper-1', 'all')
  })

  it('ST-02: activates with first valid defaults — exam, paper, then first subject auto-selected', async () => {
    primeFetch()
    renderHook()
    await activateSubjectTest()
    expect(getHookState().testMode).toBe('20') // Section 4 default
  })

  it('ST-03: invalid persisted 20-column is reinitialized deterministically — savable correction, NOT user-dirty', async () => {
    // Persisted: all ones → sum 4 ≠ 20
    primeFetch({ subjects: makeSubjects(1), topicsBySubject: { 'Subject A': makeTopics(5, { test_20_required: 1 }) } })
    renderHook()
    await activateSubjectTest()
    await waitFor(() => {
      expect(getHookState().topicConfigs['Subject A'].map(t => t.test_20_required)).toEqual([4, 4, 4, 4, 4])
    })
    // Dual-signal semantics: deterministic initialization is part of the init
    // baseline → NO unsaved-changes warning; but the draft diverges from the
    // RAW server payload → Save stays enabled to persist the correction.
    expect(getHookState().isDirty).toBe(false)
    expect(getHookState().draftDivergesFromServer).toBe(true)
  })

  it('ST-04: valid persisted configuration is preserved verbatim (not dirty)', async () => {
    primeFetch({
      subjects: makeSubjects(1),
      topicsBySubject: { 'Subject A': makeTopics(5, { test_20_required: 4 }) },
    })
    renderHook()
    await activateSubjectTest()
    expect(getHookState().topicConfigs['Subject A'].map(t => t.test_20_required)).toEqual([4, 4, 4, 4, 4])
    expect(getHookState().subjectTestSum).toBe(20)
    expect(getHookState().subjectTestValid).toBe(true)
    expect(getHookState().isDirty).toBe(false)
  })

  it('ST-05: manual edit is preserved; 22/20 sum disables save validity', async () => {
    primeFetch({
      subjects: makeSubjects(1),
      topicsBySubject: { 'Subject A': makeTopics(5, { test_20_required: 4 }) },
    })
    renderHook()
    await activateSubjectTest()
    await waitFor(() => expect(getHookState().subjectTestValid).toBe(true))

    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-0', 6) })
    const drafts = getHookState().topicConfigs['Subject A'].map(t => t.test_20_required)
    expect(drafts).toEqual([6, 4, 4, 4, 4]) // other topics untouched (Section 14)
    expect(getHookState().subjectTestSum).toBe(22)
    expect(getHookState().subjectTestValid).toBe(false)
  })

  it('ST-06: manual rebalance back to exactly 20 re-enables validity', async () => {
    primeFetch({
      subjects: makeSubjects(1),
      topicsBySubject: { 'Subject A': makeTopics(5, { test_20_required: 4 }) },
    })
    renderHook()
    await activateSubjectTest()
    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-0', 6) })
    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-1', 3) })
    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-4', 3) })
    // 6+3+4+4+3 = 20
    expect(getHookState().topicConfigs['Subject A'].map(t => t.test_20_required)).toEqual([6, 3, 4, 4, 3])
    expect(getHookState().subjectTestValid).toBe(true)
  })

  it('ST-07: a zero-valued topic violates the backend minimum even when the sum matches', async () => {
    primeFetch({
      subjects: makeSubjects(1),
      topicsBySubject: { 'Subject A': makeTopics(5, { test_20_required: 4 }) },
    })
    renderHook()
    await activateSubjectTest()
    // 0 + 6 + 6 + 4 + 4 = 20 → sum passes, minimum fails (backend INVALID_THRESHOLD)
    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-0', 0) })
    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-1', 6) })
    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-2', 6) })
    expect(getHookState().subjectTestSum).toBe(20)
    expect(getHookState().subjectTestValid).toBe(false)
  })

  it('ST-08: switching to a mode whose persisted column violates its total recomputes deterministically', async () => {
    // 20-column valid; 30-column stale (all 1s → sum 5 ≠ 30)
    primeFetch({
      subjects: makeSubjects(1),
      topicsBySubject: { 'Subject A': makeTopics(5, { test_20_required: 4, test_30_required: 1 }) },
    })
    renderHook()
    await activateSubjectTest()
    expect(getHookState().isDirty).toBe(false)

    // Clean draft → the guarded mode switch applies IMMEDIATELY (no modal).
    act(() => { getHookState().setTestMode('30') })
    const drafts = getHookState().topicConfigs['Subject A'].map(t => t.test_30_required)
    expect(drafts).toEqual([6, 6, 6, 6, 6])
    expect(getHookState().subjectTestSum).toBe(30)
    // Deterministic re-init is baseline-level (no warning) but diverges from
    // raw server data (savable) — dual-signal semantics.
    expect(getHookState().pendingSelection).toBeNull()
    expect(getHookState().isDirty).toBe(false)
    expect(getHookState().draftDivergesFromServer).toBe(true)
    // The 20-column draft is untouched by the 30Q recompute (mode isolation)
    expect(getHookState().topicConfigs['Subject A'].map(t => t.test_20_required)).toEqual([4, 4, 4, 4, 4])
  })
})

describe('ST — save flow through the RPC chain', () => {


  function Harness() {
    const s = useAdminSettings()
    // Publish after commit — the react-hooks lint forbids outer writes in render.
    useEffect(() => { ;(globalThis as Record<string, unknown>)[STATE_KEY] = s })
    return null
  }

  function renderHook() {
    render(<Harness />)
  }

  async function activateSubjectTest() {
    await waitFor(() => expect(getHookState().isLoading).toBe(false))
    await waitFor(() => expect(getHookState().topicConfigs['Subject A']).toBeDefined())
    act(() => { getHookState().setPageMode('subject_test') })
    await waitFor(() => expect(getHookState().selectedSubject).toBe('Subject A'))
  }

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    __setFilters('APPSC_GROUP_1', 'paper-1', 'all')
  })

  it('ST-09: save posts to save_subject_test_configuration via the repository chain, then refetches LIVE values', async () => {
    // All three mode columns are internally consistent (M-04): 20→[4..4],
    // 30→[6..6], 50→[10..10], each summing to its total.
    const saved = makeTopics(5, { test_20_required: 4, test_30_required: 6, test_50_required: 10 })
    primeFetch({ subjects: makeSubjects(1), topicsBySubject: { 'Subject A': saved } })
    serviceMocks.saveSubjectTestConfiguration.mockResolvedValue(undefined)

    renderHook()
    await activateSubjectTest()
    await waitFor(() => expect(getHookState().subjectTestValid).toBe(true))
    const callsBefore = serviceMocks.fetchTopicConfiguration.mock.calls.length

    await act(async () => { await getHookState().handleSave() })

    expect(serviceMocks.saveSubjectTestConfiguration).toHaveBeenCalledTimes(1)
    expect(serviceMocks.saveSubjectTestConfiguration).toHaveBeenCalledWith(
      expect.objectContaining({ user: adminUser }),
      'APPSC_GROUP_1', 'paper-1', 'Subject A', '20',
      expect.arrayContaining([expect.objectContaining({ topic_id: 'topic-0', required_questions: 4 })]),
    )
    // Section 24: server readback after successful save
    expect(serviceMocks.fetchTopicConfiguration.mock.calls.length).toBeGreaterThan(callsBefore)
    expect(getHookState().saveSuccess).toBe(true)
    expect(getHookState().isDirty).toBe(false)
  })

  it('ST-10: save maps ONLY the active mode column into the payload', async () => {
    // 2 topics: 20→[10,10] sum 20, 30→[15,15] sum 30, 50→[25,25] sum 50 —
    // all consistent so the M-04 save-time gate passes.
    primeFetch({
      subjects: makeSubjects(1),
      topicsBySubject: { 'Subject A': makeTopics(2, { test_20_required: 10, test_30_required: 15, test_50_required: 25 }) },
    })
    serviceMocks.saveSubjectTestConfiguration.mockResolvedValue(undefined)
    renderHook()
    await activateSubjectTest()
    await waitFor(() => expect(getHookState().subjectTestValid).toBe(true))

    await act(async () => { await getHookState().handleSave() })

    const [, , , , modeArg, topicsArg] = serviceMocks.saveSubjectTestConfiguration.mock.calls[0]
    expect(modeArg).toBe('20')
    expect(topicsArg).toEqual([
      { topic_id: 'topic-0', required_questions: 10 },
      { topic_id: 'topic-1', required_questions: 10 },
    ])
    expect(getTopicThresholdSum(getHookState().topicConfigs['Subject A'], '30')).toBe(30) // untouched
  })

  it('ST-09b: a failing RPC keeps dirty state and surfaces the inline error', async () => {
    primeFetch({
      subjects: makeSubjects(1),
      topicsBySubject: { 'Subject A': makeTopics(5, { test_20_required: 4, test_30_required: 6, test_50_required: 10 }) },
    })
    serviceMocks.saveSubjectTestConfiguration.mockRejectedValue(new Error('SUM_MISMATCH'))
    renderHook()
    await activateSubjectTest()
    await waitFor(() => expect(getHookState().subjectTestValid).toBe(true))

    await act(async () => { await getHookState().handleSave() })

    expect(getHookState().saveSuccess).toBe(false)
    expect(getHookState().topicError).toContain('SUM_MISMATCH')
    // Draft values remain for retry (Section 23)
    expect(getHookState().topicConfigs['Subject A'][0].test_20_required).toBe(4)
    expect(getHookState().retrySave).toBeTypeOf('function')
  })
})

describe('ST — unsaved-changes confirmation flow (unified modal)', () => {


  function Harness() {
    const s = useAdminSettings()
    // Publish after commit — the react-hooks lint forbids outer writes in render.
    useEffect(() => { ;(globalThis as Record<string, unknown>)[STATE_KEY] = s })
    return null
  }

  function renderHook() {
    render(<Harness />)
  }

  async function activateSubjectTest() {
    await waitFor(() => expect(getHookState().isLoading).toBe(false))
    await waitFor(() => expect(getHookState().topicConfigs['Subject A']).toBeDefined())
    act(() => { getHookState().setPageMode('subject_test') })
    await waitFor(() => expect(getHookState().selectedSubject).toBe('Subject A'))
  }

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    __setFilters('APPSC_GROUP_1', 'paper-1', 'all')
  })

  function primeValidColumns() {
    // All three mode columns internally consistent (M-04): 20→[4..4],
    // 30→[6..6], 50→[10..10]. Clean switches apply immediately; manual edits
    // are what create dirtiness.
    primeFetch({
      subjects: makeSubjects(1),
      topicsBySubject: { 'Subject A': makeTopics(5, { test_20_required: 4, test_30_required: 6, test_50_required: 10 }) },
    })
  }

  it('CF-01: a DIRTY draft parks the complete switch intent in pendingSelection without applying it', async () => {
    primeValidColumns()
    renderHook()
    await activateSubjectTest()

    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-0', 6) })
    expect(getHookState().isDirty).toBe(true)

    act(() => { getHookState().setTestMode('30') })
    expect(getHookState().pendingSelection).toEqual({ kind: 'test_mode', value: '30' })
    // Selection NOT applied while the decision is pending
    expect(getHookState().testMode).toBe('20')
    expect(getHookState().topicConfigs['Subject A'].map(t => t.test_20_required)).toEqual([6, 4, 4, 4, 4])
  })

  it('CF-02: Stay Here closes the prompt and preserves the exact dirty draft', async () => {
    primeValidColumns()
    renderHook()
    await activateSubjectTest()
    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-0', 6) })
    act(() => { getHookState().setTestMode('30') })

    act(() => { getHookState().stayHere() })
    expect(getHookState().pendingSelection).toBeNull()
    expect(getHookState().testMode).toBe('20')
    expect(getHookState().topicConfigs['Subject A'].map(t => t.test_20_required)).toEqual([6, 4, 4, 4, 4])
    expect(getHookState().isDirty).toBe(true)
  })

  it('CF-03: Discard Changes restores the init-baseline draft EXACTLY, then applies the pending switch', async () => {
    primeValidColumns()
    renderHook()
    await activateSubjectTest()
    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-0', 6) })
    act(() => { getHookState().setTestMode('30') })

    act(() => { getHookState().discardForSwitch() })
    expect(getHookState().pendingSelection).toBeNull()
    // The confirmed selection IS applied
    expect(getHookState().testMode).toBe('30')
    // Draft restored verbatim from the init baseline (no DB call by contract)
    expect(getHookState().topicConfigs['Subject A'].map(t => t.test_20_required)).toEqual([4, 4, 4, 4, 4])
    expect(getHookState().isDirty).toBe(false)
    // Manual-edit tracking was cleared: the next mode switch is immediate
    act(() => { getHookState().setTestMode('20') })
    expect(getHookState().pendingSelection).toBeNull()
    expect(getHookState().testMode).toBe('20')
  })

  it('CF-04: Save-and-switch failure KEEPS the prompt open with the inline error; success resolves it', async () => {
    primeValidColumns()
    serviceMocks.saveSubjectTestConfiguration.mockRejectedValueOnce(new Error('SUM_MISMATCH'))
      .mockResolvedValue(undefined)
    renderHook()
    await activateSubjectTest()
    // Valid but divergent draft: [6,3,4,4,3] sums to 20
    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-0', 6) })
    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-1', 3) })
    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-4', 3) })
    await waitFor(() => expect(getHookState().subjectTestValid).toBe(true))
    act(() => { getHookState().setTestMode('30') })
    expect(getHookState().pendingSelection).toEqual({ kind: 'test_mode', value: '30' })

    // Failure: decision stays parked, error surfaced, nothing applied
    await act(async () => { await getHookState().saveAndSwitch() })
    expect(serviceMocks.saveSubjectTestConfiguration).toHaveBeenCalledTimes(1)
    expect(getHookState().pendingSelection).toEqual({ kind: 'test_mode', value: '30' })
    expect(getHookState().testMode).toBe('20')
    expect(getHookState().topicError).toContain('SUM_MISMATCH')

    // Retry succeeds: existing save path runs with the CURRENT dirty draft,
    // server readback realigns, THEN the pending selection is applied
    // (applying a confirmed switch opens a fresh context, so the transient
    // success flag is reset — the durable outcomes below are the contract).
    await act(async () => { await getHookState().saveAndSwitch() })
    expect(serviceMocks.saveSubjectTestConfiguration).toHaveBeenCalledTimes(2)
    const [, , , subjectArg, modeArg, topicsArg] = serviceMocks.saveSubjectTestConfiguration.mock.calls[1]
    expect(subjectArg).toBe('Subject A')
    expect(modeArg).toBe('20')
    expect(topicsArg).toEqual([
      { topic_id: 'topic-0', required_questions: 6 },
      { topic_id: 'topic-1', required_questions: 3 },
      { topic_id: 'topic-2', required_questions: 4 },
      { topic_id: 'topic-3', required_questions: 4 },
      { topic_id: 'topic-4', required_questions: 3 },
    ])
    expect(getHookState().topicError).toBeNull()
    expect(getHookState().isDirty).toBe(false)
    expect(getHookState().pendingSelection).toBeNull()
    expect(getHookState().testMode).toBe('30')
  })

  it('CF-05: restoring the exact baseline value clears dirtiness (numeric normalization)', async () => {
    primeValidColumns()
    renderHook()
    await activateSubjectTest()
    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-0', 6) })
    expect(getHookState().isDirty).toBe(true)
    act(() => { getHookState().handleTopicThresholdChange('Subject A', 'topic-0', 4) })
    expect(getHookState().isDirty).toBe(false)
    // Clean again → next switch is immediate
    act(() => { getHookState().setTestMode('30') })
    expect(getHookState().pendingSelection).toBeNull()
    expect(getHookState().testMode).toBe('30')
  })

  it('CF-06: the same unified flow guards PAPER switches from Exams mode', async () => {
    primeFetch() // default: 2 subjects × generic topics
    renderHook()
    await waitFor(() => expect(getHookState().isLoading).toBe(false))
    await waitFor(() => expect(getHookState().config).not.toBeNull())

    act(() => { getHookState().handleQuestionCountChange(0, 9) })
    expect(getHookState().isDirty).toBe(true)

    act(() => { getHookState().setSelectedPaper('paper-2') })
    expect(getHookState().pendingSelection).toEqual({ kind: 'paper', value: 'paper-2' })
    expect(getHookState().selectedPaper).toBe('paper-1')

    act(() => { getHookState().discardForSwitch() })
    expect(getHookState().pendingSelection).toBeNull()
    await waitFor(() => expect(getHookState().selectedPaper).toBe('paper-2'))
    // Subject question_count restored to its baseline value (5)
    expect(getHookState().subjects[0].question_count).toBe(5)
  })
})

describe('ST — page integration', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    __setFilters('APPSC_GROUP_1', 'paper-1', 'all')
  })

  function renderPage() {
    return render(
      <ThemeProvider>
        <AdminSettingsPage />
      </ThemeProvider>,
    )
  }

  it('ST-11: Save Changes disabled until draft is dirty AND valid; enabled when both hold', async () => {
    const user = userEvent.setup()
    primeFetch({
      subjects: makeSubjects(1),
      topicsBySubject: { 'Subject A': makeTopics(5, { test_20_required: 4 }) },
    })
    renderPage()

    // Switch to Subject Test mode
    await user.click(await screen.findByRole('tab', { name: /subject test/i }))
    await waitFor(() => expect(screen.getByText('Subject A')).toBeInTheDocument())

    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    // Valid but pristine → disabled (Section 15)
    expect(saveBtn).toBeDisabled()

    // Manual edit → 22/20 invalid → still disabled
    const inputs = screen.getAllByRole('spinbutton')
    await user.clear(inputs[0])
    await user.type(inputs[0], '6')
    await waitFor(() => expect(saveBtn).toBeDisabled())
    expect(screen.getByRole('alert')).toHaveTextContent(/must equal the selected 20/i)

    // Rebalance → valid + dirty → enabled
    await user.clear(inputs[1])
    await user.type(inputs[1], '3')
    await user.clear(inputs[4])
    await user.type(inputs[4], '3')
    await waitFor(() => expect(saveBtn).toBeEnabled())
  })

  it('ST-12: Subject Test panel renders through the SHARED container components', async () => {
    const user = userEvent.setup()
    // Persisted [10, 10] already sums to the 20Q total → preserved verbatim,
    // so the CONFIGURED chip reflects server data without redistribution.
    primeFetch({
      subjects: makeSubjects(1),
      topicsBySubject: { 'Subject A': makeTopics(2, { test_20_required: 10 }) },
    })
    renderPage()
    await user.click(await screen.findByRole('tab', { name: /subject test/i }))

    await waitFor(() => expect(screen.getByText('Subject A')).toBeInTheDocument())
    expect(screen.getByText('Configured')).toBeInTheDocument()
    expect(screen.getByText('Required')).toBeInTheDocument()
    // CONFIGURED summary visible (sum 10+10 = 20 vs 20 target)
    await waitFor(() => {
      expect(screen.getByLabelText('Configured 20 of 20 questions')).toBeInTheDocument()
    })
  })
})