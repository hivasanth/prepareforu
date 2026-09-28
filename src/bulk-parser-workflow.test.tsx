/// <reference types="node" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { PreviewTab } from './components/admin/questions/PreviewTab'
import { useBulkUpload } from './components/admin/questions/useBulkUpload'
import type { BulkTabType, ParsedDataItem } from './components/admin/questions/useBulkUpload'
import { adminQuestionService } from './services/adminQuestionService'
import type { UserProfile } from './types/auth.types'
import { generateQuestionHash } from './utils/hashUtils'

/* ── BP-01..BP-10 Bulk Parser workflow gate regression suite ───────────────
 * Business rules locked here:
 *   BP-01  guarded preview shows ONLY the canonical validation message
 *   BP-02  validated preview renders canonical QuestionCards (no clones)
 *   BP-03  preview exposes NO exam-taking controls (no mark-for-review)
 *   BP-04  SYNC N QUESTIONS lives in the preview wrapper footer, N = pending
 *   BP-05  validation success binds dataset to exam/paper/subject/topic ctx
 *   BP-06  user JSON edit after validation → idle, dataset cleared
 *   BP-07  context change after validation → idle, dataset cleared
 *   BP-08  invalid JSON → 'invalid', preview stays gated
 *   BP-09  duplicates are auto-filtered and counted, not synced
 *   BP-10  syncing/uploading disables the footer action (no double submit)
 * ───────────────────────────────────────────────────────────────────────── */

vi.mock('./services/adminQuestionService', () => ({
  adminQuestionService: {
    listPrompts: vi.fn(async () => ({ success: true, data: [] })),
    upsertPrompt: vi.fn(),
    deletePrompt: vi.fn(),
    bulkInsertQuestions: vi.fn(),
  },
}))

vi.mock('./services/topicTestService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/topicTestService')>()
  return {
    ...actual,
    fetchTopicsBySubject: vi.fn(async () => [
      { id: 'topic-1', topic_en: 'Logical & Analytical Reasoning', topic_te: 'తార్కిక మరియు విశ్లేషణాత్మక తర్కం' },
    ]),
  }
})

// LAN-ORIGIN FIX: wrap generateQuestionHash so BP-11 can simulate a hashing
// failure mid-validation. Every other test still delegates to the REAL
// implementation (deterministic Web Crypto → js-sha256), so behaviour is
// unchanged outside the failure injection.
vi.mock('./utils/hashUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils/hashUtils')>()
  return {
    ...actual,
    generateQuestionHash: vi.fn(actual.generateQuestionHash),
  }
})

const GUARD_MESSAGE =
  'Please enter valid JSON questions and click Validate Questions to continue to Preview & Sync.'

function row(question: string, correct = 'B', difficulty = 'easy', extra: Record<string, unknown> = {}) {
  return {
    question,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correct,
    difficulty,
    explanation: `${question} — explained`,
    ...extra,
  }
}

const VALID_ROWS = [
  row('What is 2 + 2?', 'B', 'easy', { question_text_te: '2 + 2 ఎంత?' }),
  row('Capital of France?', 'C', 'medium'),
]

function item(partial: Partial<ParsedDataItem>): ParsedDataItem {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    status: 'pending',
    question: 'Sample?',
    options: ['A1', 'B1', 'C1', 'D1'],
    correct: 'A',
    explanation: '',
    difficulty: 'easy',
    ...partial,
  }
}

function tabProps(overrides: Partial<Parameters<typeof PreviewTab>[0]> = {}) {
  return {
    parsedData: [],
    setParsedData: () => {},
    duplicateCount: 0,
    canPreview: false,
    syncBlockers: [],
    isUploading: false,
    onSync: () => {},
    examId: 'EXAM1',
    paperId: 'PAPER1',
    subjectName: 'Mathematics',
    ...overrides,
  }
}

function renderPreview(overrides: Partial<Parameters<typeof PreviewTab>[0]> = {}) {
  return render(
    <ThemeProvider>
      <PreviewTab {...tabProps(overrides)} />
    </ThemeProvider>
  )
}

describe('BP — PreviewTab validation gate', () => {
  beforeEach(() => cleanup())

  it('BP-01: unvalidated state renders only the canonical guard message', () => {
    renderPreview({ parsedData: [], canPreview: false })
    expect(screen.getByText(GUARD_MESSAGE)).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('radiogroup')).toBeNull()
  })

  it('BP-02: validated state renders the canonical QuestionCard surfaces', () => {
    const data = [
      item({ id: 'q1', question: VALID_ROWS[0].question }),
      item({ id: 'q2', question: VALID_ROWS[1].question }),
    ]
    renderPreview({ parsedData: data, canPreview: true })
    expect(screen.getByText('What is 2 + 2?')).toBeTruthy()
    expect(screen.getByText('Capital of France?')).toBeTruthy()
    /* ONE per-card language toggle (English default) — NEVER a page-level
     * global control. Each card's toggle is the only radiogroup in it. */
    expect(screen.getAllByRole('radiogroup', { name: 'Preview question language' })).toHaveLength(2)
    expect(screen.queryByText(/Preview Language:/i)).toBeNull()
  })

  it('BP-03: preview carries no mark-for-review control', () => {
    renderPreview({ parsedData: [item({ id: 'q1' })], canPreview: true })
    expect(screen.queryByText(/mark for review/i)).toBeNull()
  })

  it('BP-04: sync action sits in the footer with the pending count', async () => {
    const user = userEvent.setup()
    const onSync = vi.fn()
    renderPreview({
      parsedData: [item({ id: 'q1' }), item({ id: 'q2' }), item({ id: 'q3', status: 'success' })],
      canPreview: true,
      onSync,
    })
    const btn = screen.getByRole('button', { name: /sync 2 questions/i })
    await user.click(btn)
    expect(onSync).toHaveBeenCalledTimes(1)
  })

  it('BP-05..: telugu switch re-renders ONLY the clicked card through its own toggle', async () => {
    const user = userEvent.setup()
    renderPreview({
      parsedData: [item({ id: 'q1', question: 'What is 2 + 2?', question_text_te: '2 + 2 ఎంత?' }),
        item({ id: 'q2', question: 'Other?', question_text_te: 'మరొకటి?' })],
      canPreview: true,
    })
    const q1 = document.querySelector('[data-question-preview-id="q1"]') as HTMLElement
    const q2 = document.querySelector('[data-question-preview-id="q2"]') as HTMLElement
    expect(q1).toBeTruthy()
    expect(q2).toBeTruthy()
    await user.click(within(q1).getByRole('radio', { name: 'te' }))
    expect(within(q1).getByText('2 + 2 ఎంత?')).toBeTruthy()
    /* q2 is untouched by q1's per-card toggle */
    expect(within(q2).getByText('Other?')).toBeTruthy()
  })
})

/* ── hook-level gate: explicit validation machine + context binding ────── */

const ADMIN_USER = {
  id: 'admin-1',
  email: 'admin@test.dev',
  full_name: 'Admin',
  role: 'admin',
} as unknown as UserProfile

type BulkApi = ReturnType<typeof useBulkUpload>

function HookHarness({ topicId, onApi }: { topicId: string | null; onApi: (api: BulkApi) => void }) {
  const [parsedData, setParsedData] = useState<ParsedDataItem[]>([])
  const [activeTab, setActiveTab] = useState<BulkTabType>('instructions')
  const api = useBulkUpload({
    examId: 'EXAM1',
    examLabel: 'Exam One',
    paperId: 'PAPER1',
    paperLabel: 'Paper One',
    subjectName: 'Mathematics',
    topicId,
    onSuccess: vi.fn(),
    onClose: vi.fn(),
    activeTab,
    setActiveTab,
    parsedData,
    setParsedData,
    authUser: ADMIN_USER,
  })
  onApi(api)
  return (
    <div
      data-testid="harness"
      data-status={api.validationStatus}
      data-can={String(api.canPreview)}
      data-tab={activeTab}
      data-count={parsedData.length}
      data-rows={parsedData.map(i => `${i.status}:${i.error ?? ''}`).join('|')}
    />
  )
}

async function mountAndValidate(topicId: string | null) {
  const apiRef: { current: BulkApi | null } = { current: null }
  const view = render(
    <ThemeProvider>
      <HookHarness topicId={topicId} onApi={a => { apiRef.current = a }} />
    </ThemeProvider>
  )
  await act(async () => {})
  const harness = () => screen.getByTestId('harness')
  await act(async () => { apiRef.current!.handleJsonChange(JSON.stringify(VALID_ROWS)) })
  await act(async () => { await apiRef.current!.handleAnalyze() })
  return { view, apiRef, harness }
}

describe('BP — explicit validation state machine (useBulkUpload)', () => {
  beforeEach(() => { cleanup(); vi.clearAllMocks() })

  it('BP-05: successful validation flips status to valid, binds context, lands on preview', async () => {
    const { harness } = await mountAndValidate('topic-1')
    expect(harness().dataset.status).toBe('valid')
    expect(harness().dataset.can).toBe('true')
    expect(harness().dataset.tab).toBe('preview')
    expect(harness().dataset.count).toBe('2')
  })

  it('BP-06: editing the JSON after validation returns to idle and clears the dataset', async () => {
    const { apiRef, harness } = await mountAndValidate('topic-1')
    await act(async () => {
      apiRef.current!.handleJsonChange(JSON.stringify([row('Edited question?')]))
    })
    expect(harness().dataset.status).toBe('idle')
    expect(harness().dataset.can).toBe('false')
    expect(harness().dataset.count).toBe('0')
  })

  it('BP-07: changing the topic context invalidates a previously valid run', async () => {
    const { apiRef, harness, view } = await mountAndValidate('topic-1')
    expect(harness().dataset.status).toBe('valid')

    view.rerender(
      <ThemeProvider>
        <HookHarness topicId="topic-2" onApi={a => { apiRef.current = a }} />
      </ThemeProvider>
    )
    await act(async () => {})
    expect(harness().dataset.status).toBe('idle')
    expect(harness().dataset.can).toBe('false')
    expect(harness().dataset.count).toBe('0')
  })

  it('BP-08: malformed JSON marks validation invalid and keeps preview gated', async () => {
    const apiRef: { current: BulkApi | null } = { current: null }
    render(
      <ThemeProvider>
        <HookHarness topicId="topic-1" onApi={a => { apiRef.current = a }} />
      </ThemeProvider>
    )
    await act(async () => {})
    await act(async () => { apiRef.current!.handleJsonChange('{ definitely not json') })
    await act(async () => { await apiRef.current!.handleAnalyze() })
    const harness = screen.getByTestId('harness')
    expect(harness.dataset.status).toBe('invalid')
    expect(harness.dataset.can).toBe('false')
    expect(harness.dataset.count).toBe('0')
    expect(apiRef.current!.errors.length).toBeGreaterThan(0)
  })

  it('BP-09: duplicate rows are filtered out of the validated queue and counted', async () => {
    const apiRef: { current: BulkApi | null } = { current: null }
    render(
      <ThemeProvider>
        <HookHarness topicId="topic-1" onApi={a => { apiRef.current = a }} />
      </ThemeProvider>
    )
    await act(async () => {})
    const dupes = JSON.stringify([row('Same question?'), row('Same question?')])
    await act(async () => { apiRef.current!.handleJsonChange(dupes) })
    await act(async () => { await apiRef.current!.handleAnalyze() })
    const harness = screen.getByTestId('harness')
    expect(harness.dataset.status).toBe('valid')
    expect(harness.dataset.count).toBe('1')
    expect(apiRef.current!.duplicateCount).toBe(1)
  })

  it('BP-11: a hashing failure mid-validation marks invalid instead of hanging at validating', async () => {
    // LAN-ORIGIN FIX: on a non-secure LAN origin hashing can fail; validation
    // must terminate into 'invalid' with a visible error, never stall forever
    // at 'validating' behind the preview gate.
    vi.mocked(generateQuestionHash).mockRejectedValueOnce(new Error('hashing unavailable on this origin'))
    const apiRef: { current: BulkApi | null } = { current: null }
    render(
      <ThemeProvider>
        <HookHarness topicId="topic-1" onApi={a => { apiRef.current = a }} />
      </ThemeProvider>
    )
    await act(async () => {})
    await act(async () => { apiRef.current!.handleJsonChange(JSON.stringify(VALID_ROWS)) })
    await act(async () => { await apiRef.current!.handleAnalyze() })
    const harness = screen.getByTestId('harness')
    expect(harness.dataset.status).toBe('invalid')
    expect(harness.dataset.can).toBe('false')
    expect(harness.dataset.count).toBe('0')
    expect(apiRef.current!.errors.length).toBeGreaterThan(0)
    expect(harness.dataset.status).not.toBe('validating')
  })

  it('BP-10: uploading state disables the sync action until completion', () => {
    renderPreview({ parsedData: [item({ id: 'q1' })], canPreview: true, isUploading: true })
    /* canonical Button shows a spinner (aria-busy) while loading */
    const btn = screen.getByRole('button', { name: /syncing/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
    expect(btn.getAttribute('aria-busy')).toBe('true')
  })
})

/* ── BP-11..BP-14 STRICT REJECT topic-guard surfacing (DEF-4) ─────────────
 * The selected topic is the sole ingestion authority. When AI rows do not
 * byte-match its canonical topic_en/topic_te, the preview must surface the
 * exact expected bytes BEFORE sync, and a rejected chunk must explain itself
 * instead of the generic "An unexpected error occurred". The service contract
 * itself stays untouched (STRICT REJECT is immutable). */

const TOPIC = {
  topicEn: 'Logical & Analytical Reasoning',
  topicTe: 'తార్కిక మరియు విశ్లేషణాత్మక తర్కం',
}

describe('BP — STRICT REJECT topic-guard preview & failure surfacing', () => {
  beforeEach(() => { cleanup(); vi.clearAllMocks() })

  it('BP-11: topic-scoped preview exposes the guard summary for mismatched rows', async () => {
    const apiRef: { current: BulkApi | null } = { current: null }
    render(
      <ThemeProvider>
        <HookHarness topicId="topic-1" onApi={a => { apiRef.current = a }} />
      </ThemeProvider>
    )
    await act(async () => {})
    await act(async () => { apiRef.current!.handleJsonChange(JSON.stringify(VALID_ROWS)) })
    await act(async () => { await apiRef.current!.handleAnalyze() })
    expect(apiRef.current!.topicGuard).toEqual({
      topicEn: TOPIC.topicEn,
      topicTe: TOPIC.topicTe,
      mismatched: 2,
      pending: 2,
    })
  })

  it('BP-12: pending rows carrying the EXACT canonical bytes clear the guard', async () => {
    const apiRef: { current: BulkApi | null } = { current: null }
    render(
      <ThemeProvider>
        <HookHarness topicId="topic-1" onApi={a => { apiRef.current = a }} />
      </ThemeProvider>
    )
    await act(async () => {})
    const exact = JSON.stringify([
      row('What is 2 + 2?', 'B', 'easy', { topic_en: TOPIC.topicEn, topic_te: TOPIC.topicTe }),
      row('Capital of France?', 'C', 'medium', { topic_en: TOPIC.topicEn, topic_te: TOPIC.topicTe }),
    ])
    await act(async () => { apiRef.current!.handleJsonChange(exact) })
    await act(async () => { await apiRef.current!.handleAnalyze() })
    expect(apiRef.current!.topicGuard).toBeNull()
  })

  it('BP-13: a fully-rejected chunk surfaces the exact expected topic bytes, not the generic error', async () => {
    const apiRef: { current: BulkApi | null } = { current: null }
    vi.mocked(adminQuestionService.bulkInsertQuestions).mockResolvedValue({
      success: false,
      data: {
        inserted: 0,
        duplicated: 0,
        failed: 2,
        failures: [
          { index: 0, error: `Topic mismatch: questions in this upload must use "${TOPIC.topicEn}" exactly.` },
          { index: 1, error: `Telugu topic mismatch: questions must use "${TOPIC.topicTe}" exactly.` },
        ],
      },
      error: { message: '2 of 2 questions failed' },
    } as never)
    render(
      <ThemeProvider>
        <HookHarness topicId="topic-1" onApi={a => { apiRef.current = a }} />
      </ThemeProvider>
    )
    await act(async () => {})
    await act(async () => { apiRef.current!.handleJsonChange(JSON.stringify(VALID_ROWS)) })
    await act(async () => { await apiRef.current!.handleAnalyze() })
    await act(async () => { await apiRef.current!.handleUpload() })
    expect(apiRef.current!.errors[0].message).toContain(`must use "${TOPIC.topicEn}" exactly`)
    expect(apiRef.current!.errors[0].message).not.toContain('An unexpected error occurred')
    /* rows are marked error AND carry the verbatim authored reason */
    const rows = screen.getByTestId('harness').dataset.rows ?? ''
    expect(rows).toContain(`error:Topic mismatch: questions in this upload must use "${TOPIC.topicEn}" exactly.`)
  })

  it('BP-14: PreviewTab renders the pre-sync guard warning with the exact bytes', () => {
    renderPreview({
      parsedData: [item({ id: 'q1' }), item({ id: 'q2' })],
      canPreview: true,
      topicGuard: { topicEn: TOPIC.topicEn, topicTe: TOPIC.topicTe, mismatched: 1, pending: 2 },
    })
    expect(screen.getByText(/don't match this topic/i)).toBeTruthy()
    const banner = screen.getByText(/won't sync unless their topic matches/i)
    expect(banner.textContent).toContain(`"${TOPIC.topicEn}"`)
    expect(banner.textContent).toContain(`"${TOPIC.topicTe}"`)
    expect(banner.textContent).toContain('1 of 2')
  })
})
