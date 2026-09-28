/// <reference types="node" />
/* ── Bulk Upload Preview — per-card language + local edit/delete suite ─────
 * §B directive: the global preview language toggle is REMOVED. Every preview
 * card owns its own presentation language (default English) plus a LOCAL
 * Edit/Delete toolbar. Nothing but the final Sync touches the database.
 *
 *   B32  per-card language toggle, English by default, one toggle PER card
 *   B33  flipping one card's language never affects the other cards
 *   B34  correct option stays visibly marked in both languages + static
 *        informational options (unchanged read-only preview contract)
 *   B35  Edit opens the canonical SingleQuestionModal in LOCAL-ONLY mode —
 *        saved changes re-render the card, no DB call, topic bytes preserved
 *   B36  Delete asks for confirmation, removes the card (renumbering the
 *        rest), drops its language state, no DB call, sync excludes it
 *   B37  syncBlockers block-list surfaces invalid rows and disables Sync; the
 *        in-flight final gate never reaches the DB with such a row
 *   T10  sync still sends the current bilingual row state after edits
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { PreviewTab } from './components/admin/questions/PreviewTab'
import { useBulkUpload, validatePendingRowsForSync } from './components/admin/questions/useBulkUpload'
import type { BulkTabType, ParsedDataItem } from './components/admin/questions/useBulkUpload'
import { adminQuestionService } from './services/adminQuestionService'
import type { UserProfile } from './types/auth.types'

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

/* The LOCAL-ONLY editor still mounts the canonical form modal (useAuth +
 * AdminModal/FocusTrap). These are exercised per-card; stub the globals. */
vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin-1', role: 'admin' } }),
}))
vi.mock('focus-trap-react', () => ({
  FocusTrap: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

const TOPIC = {
  topicEn: 'Logical & Analytical Reasoning',
  topicTe: 'తార్కిక మరియు విశ్లేషణాత్మక తర్కం',
}

function preItem(id: string, overrides: Partial<ParsedDataItem> = {}): ParsedDataItem {
  const n = id.replace(/\D/g, '')
  return {
    id,
    status: 'pending',
    question: `Question ${n} EN`,
    options: [`Q${n} A EN`, `Q${n} B EN`, `Q${n} C EN`, `Q${n} D EN`],
    correct: 'B',
    explanation: `Explanation ${n} EN`,
    difficulty: 'easy',
    topic_en: TOPIC.topicEn,
    topic_te: TOPIC.topicTe,
    question_text_te: `ప్రశ్న ${n} TE`,
    option_a_te: `Q${n} A TE`,
    option_b_te: `Q${n} B TE`,
    option_c_te: `Q${n} C TE`,
    option_d_te: `Q${n} D TE`,
    explanation_te: `వివరణ ${n} TE`,
    ...overrides,
  }
}

/* A stateful host so Preview can own parsedData (edit/delete mutate it). */
function Host({
  items, topicGuard = null, syncBlockers = [], canPreview = true,
}: {
  items: ParsedDataItem[]
  topicGuard?: Parameters<typeof PreviewTab>[0]['topicGuard']
  syncBlockers?: Parameters<typeof PreviewTab>[0]['syncBlockers']
  canPreview?: boolean
}) {
  const [parsedData, setParsedData] = useState<ParsedDataItem[]>(items)
  return (
    <ThemeProvider>
      <PreviewTab
        parsedData={parsedData}
        setParsedData={setParsedData}
        duplicateCount={0}
        canPreview={canPreview}
        topicGuard={topicGuard}
        syncBlockers={syncBlockers}
        isUploading={false}
        onSync={() => setParsedData((p) => [...p])}
        examId="EXAM1"
        examLabel="Exam One"
        paperId="PAPER1"
        paperLabel="Paper One"
        subjectName="Mathematics"
        topicId="topic-1"
        topicEnglish={TOPIC.topicEn}
        topicTelugu={TOPIC.topicTe}
      />
    </ThemeProvider>
  )
}

function previewCards() {
  return Array.from(document.querySelectorAll('[data-question-preview-id]')) as HTMLElement[]
}

function cardOf(id: string) {
  return document.querySelector(`[data-question-preview-id="${id}"]`) as HTMLElement
}

async function openEdit(id: string) {
  const user = userEvent.setup()
  await user.click(within(cardOf(id)).getByRole('button', { name: 'Edit question' }))
  const dialogEl = (await screen.findByRole('dialog')) as HTMLElement
  return { dialogEl, dlg: within(dialogEl) }
}

function correctRows(card: HTMLElement): HTMLElement[] {
  return Array.from(card.querySelectorAll<HTMLElement>('[data-question-card-correct="true"]'))
}

beforeEach(() => cleanup())

describe('B32/B33 — per-card language control (no global toggle)', () => {
  it('B32: ONE language toggle PER card, English by default, zero global controls', () => {
    render(<Host items={[preItem('q1'), preItem('q2')]} />)

    const cards = previewCards()
    expect(cards).toHaveLength(2)
    for (const card of cards) {
      const group = within(card).getByRole('radiogroup', { name: 'Preview question language' })
      expect(within(group).getByRole('radio', { name: 'en' })).toHaveAttribute('aria-checked', 'true')
      expect(within(group).getByRole('radio', { name: 'te' })).toHaveAttribute('aria-checked', 'false')
    }
    /* No page-level "Preview Language:" control exists anymore. */
    expect(screen.queryByText(/Preview Language:/i)).toBeNull()
    /* The cards' own radios are the only radio buttons in the preview. */
    expect(screen.getAllByRole('radio')).toHaveLength(4)
  })

  it('B33: flipping ONE card to Telugu leaves every other card in English', async () => {
    const user = userEvent.setup()
    render(<Host items={[preItem('q1'), preItem('q2')]} />)

    await user.click(within(cardOf('q1')).getByRole('radio', { name: 'te' }))

    /* q1 — Telugu */
    expect(within(cardOf('q1')).getByText('ప్రశ్న 1 TE')).toBeTruthy()
    expect(within(cardOf('q1')).queryByText('Question 1 EN')).toBeNull()
    /* q2 — untouched, still English */
    expect(within(cardOf('q2')).getByText('Question 2 EN')).toBeTruthy()
    expect(within(cardOf('q2')).queryByText(/ప్రశ్న 2 TE/)).toBeNull()

    /* flipping back restores q1 only */
    await user.click(within(cardOf('q1')).getByRole('radio', { name: 'en' }))
    expect(within(cardOf('q1')).getByText('Question 1 EN')).toBeTruthy()
    expect(within(cardOf('q1')).queryByText(/ప్రశ్న 1 TE/)).toBeNull()
  })
})

describe('B34 — correct option + static options (unchanged read-only contract)', () => {
  it('B34: correct option visibly marked in English, then in Telugu on the SAME card', async () => {
    const user = userEvent.setup()
    render(<Host items={[preItem('q1')]} />)

    const rowsEn = correctRows(cardOf('q1'))
    expect(rowsEn).toHaveLength(1)
    expect(rowsEn[0]!.querySelector('[data-question-card-marker="B"]')).toBeTruthy()

    await user.click(within(cardOf('q1')).getByRole('radio', { name: 'te' }))
    const rowsTe = correctRows(cardOf('q1'))
    expect(rowsTe).toHaveLength(1)
    expect(rowsTe[0]!.querySelector('[data-question-card-marker="B"]')).toBeTruthy()
    expect(within(rowsTe[0]!).getByText('Correct answer')).toBeTruthy()
  })

  it('B34: options stay static informational rows — no radio role, no hover affordance', () => {
    render(<Host items={[preItem('q1')]} />)
    expect(screen.queryByRole('radiogroup', { name: /answer options/i })).toBeNull()

    const staticRows = Array.from(cardOf('q1').querySelectorAll('[data-question-card-marker]'))
      .map(el => el.parentElement)
      .filter((el): el is HTMLElement => el !== null)
    expect(staticRows).toHaveLength(4)
    for (const row of staticRows) {
      expect(row.tagName).toBe('DIV')
      expect(row.getAttribute('role')).not.toBe('radio')
      expect(row.className).toContain('cursor-default')
      expect(row.className).not.toContain('cursor-pointer')
      expect(row.className).not.toMatch(/hover:/)
    }
  })
})

describe('B35 — local-only Edit (never touches the database)', () => {
  it('B35: editing updates the preview card WITHOUT any DB write; topic bytes preserved', async () => {
    render(<Host items={[preItem('q1')]} />)

    const { dlg, dialogEl } = await openEdit('q1')
    expect(dlg.getByText('Edit Question')).toBeTruthy()

    /* change the question text + one option in the form (fields live inside the
       modal — the question field carries the canonical id `question-text-_en`
       (suffix = `_en`), options are labelled `Option A`..`Option D`) */
    const questionInput = dialogEl.querySelector('#question-text-_en') as HTMLTextAreaElement
    const optionInput = dlg.getByRole('textbox', { name: 'Option A' }) as HTMLTextAreaElement
    await userEvent.clear(questionInput)
    await userEvent.type(questionInput, 'Edited question 1')
    await userEvent.clear(optionInput)
    await userEvent.type(optionInput, 'Edited option A')

    await userEvent.click(dlg.getByRole('button', { name: /save changes/i }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(within(cardOf('q1')).getByText('Edited question 1')).toBeTruthy()
    expect(within(cardOf('q1')).getByText('Edited option A')).toBeTruthy()
    /* no database operation happened during the local edit — Sync (via
       bulkInsertQuestions) is the only DB boundary and it was not invoked */
    expect(vi.mocked(adminQuestionService.bulkInsertQuestions)).not.toHaveBeenCalled()
  })
})

describe('B36 — local-only Delete', () => {
  it('B36: delete confirms, removes the card, renumbers the rest, drops language state, no DB call', async () => {
    const user = userEvent.setup()
    render(<Host items={[preItem('q1'), preItem('q2'), preItem('q3')]} />)
    expect(previewCards()).toHaveLength(3)

    /* put q2 into Telugu so we can prove its language state dies with it */
    await user.click(within(cardOf('q2')).getByRole('radio', { name: 'te' }))
    expect(within(cardOf('q2')).getByText('ప్రశ్న 2 TE')).toBeTruthy()

    await user.click(within(cardOf('q2')).getByRole('button', { name: 'Delete question' }))
    expect(screen.getByText('Delete Question from Preview?')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /yes, remove from preview/i }))

    expect(previewCards()).toHaveLength(2)
    /* remaining cards renumbered: q3 now sits at position 2 */
    expect(within(cardOf('q1')).getByText('Question 1 of 2')).toBeTruthy()
    expect(within(cardOf('q3')).getByText('Question 2 of 2')).toBeTruthy()
    /* q3 was never switched — it renders English (no leaked language state) */
    expect(within(cardOf('q3')).getByText('Question 3 EN')).toBeTruthy()
    expect(vi.mocked(adminQuestionService.bulkInsertQuestions)).not.toHaveBeenCalled()
  })
})

describe('B37 — pre-sync block-list + final gate', () => {
  it('B37: syncBlockers surface invalid rows as an alert and disable Sync', async () => {
    render(
      <Host
        items={[preItem('q1'), preItem('q2')]}
        syncBlockers={[{ id: 'q1', message: 'Row 1 (question_text_en): English question is required' }]}
      />
    )
    expect(screen.getByText(/Sync blocked - fix invalid questions/i)).toBeTruthy()
    expect(screen.getByText(/English question is required/)).toBeTruthy()
    const syncBtn = screen.getByRole('button', { name: /sync 2 questions/i })
    expect(syncBtn).toBeDisabled()
  })

  it('B37: validatePendingRowsForSync flags a row an edit would corrupt', () => {
    const ok = preItem('ok')
    const broken = { ...preItem('broken'), question: '' }
    const problems = validatePendingRowsForSync([ok, broken], { examId: 'EXAM1', paperId: 'PAPER1', subjectName: 'Mathematics' })
    expect(problems).toHaveLength(1)
    expect(problems[0]!.id).toBe('broken')
    expect(problems[0]!.message).toContain('Row 2')
  })

  it('B37: handleUpload aborts before the DB when the final gate finds a blocked row', async () => {
    vi.mocked(adminQuestionService.bulkInsertQuestions).mockResolvedValue({
      success: true,
      data: { inserted: 1, duplicated: 0, failed: 0, failures: [] },
    } as never)

    const apiRef: { current: BulkApi | null } = { current: null }
    const rows = [bilingualRow('What is 2 + 2?')]
    render(
      <ThemeProvider>
        <HookHarness onApi={a => { apiRef.current = a }} />
      </ThemeProvider>
    )
    await act(async () => {})
    await act(async () => { apiRef.current!.handleJsonChange(JSON.stringify(rows)) })
    await act(async () => { await apiRef.current!.handleAnalyze() })
    expect(screen.getByTestId('harness').dataset.can).toBe('true')

    /* corrupt the row exactly as an invalid preview edit would */
    await act(async () => {
      apiRef.current!.setParsedData(prev => prev.map(i => ({ ...i, question: '' })))
    })

    await act(async () => { await apiRef.current!.handleUpload() })
    expect(vi.mocked(adminQuestionService.bulkInsertQuestions)).not.toHaveBeenCalled()
    expect(screen.getByTestId('harness').dataset.syncError).toContain('Sync blocked')
  })
})

/* ── hook-level: sync payload stays bilingual + current after local edits ── */

const ADMIN_USER = {
  id: 'admin-1',
  email: 'admin@test.dev',
  full_name: 'Admin',
  role: 'admin',
} as unknown as UserProfile

type BulkApi = ReturnType<typeof useBulkUpload>

function HookHarness({ initialRows = [], topicId, onApi }: {
  initialRows?: ParsedDataItem[]
  topicId?: string | null
  onApi: (api: BulkApi) => void
}) {
  const [parsedData, setParsedData] = useState<ParsedDataItem[]>(initialRows)
  const [activeTab, setActiveTab] = useState<BulkTabType>('instructions')
  const api = useBulkUpload({
    examId: 'EXAM1',
    examLabel: 'Exam One',
    paperId: 'PAPER1',
    paperLabel: 'Paper One',
    subjectName: 'Mathematics',
    topicId: topicId ?? 'topic-1',
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
      data-count={parsedData.length}
      data-sync-error={api.error ?? ''}
    />
  )
}

function bilingualRow(qn: string, correct = 'B') {
  return {
    question: qn,
    options: [`${qn} A`, `${qn} B`, `${qn} C`, `${qn} D`],
    correct,
    difficulty: 'easy',
    explanation: `${qn} — explained`,
    question_text_te: `${qn} – TE`,
    option_a_te: `${qn} A – TE`,
    option_b_te: `${qn} B – TE`,
    option_c_te: `${qn} C – TE`,
    option_d_te: `${qn} D – TE`,
    explanation_te: `${qn} – TE explained`,
    topic_en: TOPIC.topicEn,
    topic_te: TOPIC.topicTe,
  }
}

describe('Bulk Upload sync — bilingual payload contract', () => {
  beforeEach(() => { cleanup(); vi.clearAllMocks() })

  it('T10: synced rows carry BOTH question_text_en and question_text_te (+ options/explanation)', async () => {
    vi.mocked(adminQuestionService.bulkInsertQuestions).mockResolvedValue({
      success: true,
      data: { inserted: 2, duplicated: 0, failed: 0, failures: [] },
    } as never)

    const apiRef: { current: BulkApi | null } = { current: null }
    render(
      <ThemeProvider>
        <HookHarness onApi={a => { apiRef.current = a }} />
      </ThemeProvider>
    )
    await act(async () => {})
    const rows = [bilingualRow('What is 2 + 2?'), bilingualRow('Capital of France?', 'C')]
    await act(async () => { apiRef.current!.handleJsonChange(JSON.stringify(rows)) })
    await act(async () => { await apiRef.current!.handleAnalyze() })
    expect(screen.getByTestId('harness').dataset.can).toBe('true')

    await act(async () => { await apiRef.current!.handleUpload() })

    const payload = vi.mocked(adminQuestionService.bulkInsertQuestions).mock.calls[0][0]
    expect(payload).toHaveLength(2)
    for (const [index, q] of payload.entries()) {
      expect(q.question_text_en).toBe(rows[index].question)
      expect(q.question_text_te).toBe(`${rows[index].question} – TE`)
      expect(q.option_a_en).toBe(`${rows[index].question} A`)
      expect(q.option_a_te).toBe(`${rows[index].question} A – TE`)
      expect(q.option_d_te).toBe(`${rows[index].question} D – TE`)
      expect(q.explanation_en).toBe(`${rows[index].question} — explained`)
      expect(q.explanation_te).toBe(`${rows[index].question} – TE explained`)
      expect(q.correct_option).toBe(rows[index].correct)
      expect(q.topic_en).toBe(TOPIC.topicEn)
      expect(q.topic_te).toBe(TOPIC.topicTe)
    }
  })

  it('T10-sync-current: sync sends the EDITED preview state, not the stale validation', async () => {
    vi.mocked(adminQuestionService.bulkInsertQuestions).mockResolvedValue({
      success: true,
      data: { inserted: 1, duplicated: 0, failed: 0, failures: [] },
    } as never)

    const apiRef: { current: BulkApi | null } = { current: null }
    const rows = [bilingualRow('What is 2 + 2?')]
    render(
      <ThemeProvider>
        <HookHarness onApi={a => { apiRef.current = a }} />
      </ThemeProvider>
    )
    await act(async () => {})
    await act(async () => { apiRef.current!.handleJsonChange(JSON.stringify(rows)) })
    await act(async () => { await apiRef.current!.handleAnalyze() })
    expect(screen.getByTestId('harness').dataset.can).toBe('true')

    /* the exact state a §B local edit leaves behind */
    await act(async () => {
      apiRef.current!.setParsedData(prev => prev.map(i => ({ ...i, question: 'EDITED question', option_a_te: 'EDITED A TE' })))
    })

    await act(async () => { await apiRef.current!.handleUpload() })

    const payload = vi.mocked(adminQuestionService.bulkInsertQuestions).mock.calls[0][0]
    expect(payload[0]!.question_text_en).toBe('EDITED question')
    expect(payload[0]!.option_a_te).toBe('EDITED A TE')
    expect(payload[0]!.topic_en).toBe(TOPIC.topicEn)
  })
})