/// <reference types="node" />
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { useState } from 'react'

/* ConfirmModal/AdminModal compose focus-trap-react; jsdom has no layout, so
 * the trap's "no tabbable node" check fires. Our assertions target the modal's
 * own DOM (title/buttons), not trap behavior — pass the children through. */
vi.mock('focus-trap-react', () => ({
  FocusTrap: ({ children }: { children?: ReactNode }) => children,
}))

import { ThemeProvider } from '../context/ThemeContext'
import { MemoryRouter } from 'react-router-dom'
import {
  addMinutesLocalISO,
  localISOToUTC,
  computeDuplicateRedundancy,
  getPromptText,
} from '../components/sub-admin/create/types'
import { CreateStepPrompt } from '../components/sub-admin/create/CreateStepPrompt'
import { CreateStepJsonPaste } from '../components/sub-admin/create/CreateStepJsonPaste'
import { CreateStepReview } from '../components/sub-admin/create/CreateStepReview'
import type { ParseReport, QuestionData } from '../components/sub-admin/create/types'

/* ── SUB-ADMIN CREATE WORKFLOW HARDENING SUITE ────────────────────────────────
 * C1  end = start + 30 min at mount AND when start changes (unless the user
 *     manually overrode end) — Date() handles day/month rollover.
 * C2  Naive wall-clock ISO → UTC instants (service boundary semantics);
 *     conversion is idempotent on already-UTC input.
 * C3  Duplicate detection is language-safe (Telugu preserved), collapses
 *     whitespace/case, flags the later rows and keeps the first occurrence.
 * C4  Prompt generation pins the exact requested count.
 * C5  Step 1 launch matrix is gated behind a successful copy; failure shows
 *     an INLINE error (never a toast) and the matrix stays hidden.
 * C6  Step 2 reports per-row issues: duplicates removed + invalid excluded +
 *     count-vs-requested — without throwing on the first bad row.
 * C7  Step 3 "Add Question" opens the inline editor; every destructive delete
 *     routes through the canonical ConfirmModal and renumbers display_order.
 * ─────────────────────────────────────────────────────────────────────────── */

function ui(node: ReactNode) {
  return (
    <ThemeProvider>
      <MemoryRouter>{node}</MemoryRouter>
    </ThemeProvider>
  )
}

const validQ = (over: Partial<QuestionData> = {}): QuestionData => ({
  client_id: 'q-fixed-1',
  question_text_en: 'Capital of AP?',
  option_a_en: 'Visakhapatnam',
  option_b_en: 'Amaravati',
  option_c_en: 'Vijayawada',
  option_d_en: 'Kurnool',
  correct_option: 'B',
  explanation_en: 'Amaravati is the capital.',
  display_order: 1,
  difficulty: 'medium',
  diagram: null,
  ...over,
})

const validQ2: QuestionData = {
  client_id: 'q-fixed-2',
  question_text_en: 'Largest river of AP?',
  option_a_en: 'Krishna',
  option_b_en: 'Godavari',
  option_c_en: 'Tungabhadra',
  option_d_en: 'Penna',
  correct_option: 'B',
  explanation_en: 'Godavari.',
  display_order: 2,
  difficulty: 'medium',
  diagram: null,
}

afterEach(() => {
  cleanup()
})

/* Stateful harness — the review step is a controlled component, so tests must
 * own the questions array the same way SubAdminCreate does. */
function StatefulReview({ initial }: { initial: QuestionData[] }) {
  const [questions, setQuestions] = useState(initial)
  return (
    <CreateStepReview
      questions={questions}
      setQuestions={setQuestions}
      parseReport={{ requested: 2, received: 2, accepted: 2, duplicateRows: 0, invalidRows: 0, invalidSamples: [] }}
      onConfirm={() => {}}
      onBack={() => {}}
      breakpoint="lg"
    />
  )
}

// ─── C1/C2 — scheduling arithmetic ───────────────────────────────────────────

describe('C1/C2: scheduling arithmetic and timezone boundary', () => {
  it('adds 30 minutes within the same day', () => {
    expect(addMinutesLocalISO('2026-08-28T10:00', 30)).toBe('2026-08-28T10:30')
  })

  it('rolls minutes over into the next day', () => {
    expect(addMinutesLocalISO('2026-08-28T23:45', 30)).toBe('2026-08-29T00:15')
  })

  it('rolls days over into the next month (31-day month edge)', () => {
    expect(addMinutesLocalISO('2026-08-31T23:30', 45)).toBe('2026-09-01T00:15')
  })

  it('returns the input unchanged for garbage values (picker never crashes)', () => {
    expect(addMinutesLocalISO('not-a-time', 30)).toBe('not-a-time')
  })

  it('converts naive wall-clock ISO to an explicit UTC instant (Z suffix)', () => {
    const utc = localISOToUTC('2026-08-28T10:00')
    expect(utc.endsWith('Z')).toBe(true)
    // Must represent the exact same instant a JS Date associates with the
    // naive literal (the browser-time wall clock).
    expect(utc).toBe(new Date('2026-08-28T10:00').toISOString())
  })

  it('is idempotent on already-UTC input (double conversion is a no-op)', () => {
    const utc = new Date('2026-08-28T10:00').toISOString()
    expect(localISOToUTC(utc)).toBe(utc)
  })
})

// ─── C3 — duplicate detection ────────────────────────────────────────────────

describe('C3: duplicate detection', () => {
  const q = (over: Record<string, unknown> = {}) => ({
    question_text_en: 'Capital of AP?',
    option_a_en: 'Visakhapatnam',
    option_b_en: 'Amaravati',
    option_c_en: 'Vijayawada',
    option_d_en: 'Kurnool',
    correct_option: 'B',
    ...over,
  })

  it('flags an exact repeat, keeping the first occurrence', () => {
    const rows = [q(), q()]
    const map = computeDuplicateRedundancy(rows)
    expect(map.size).toBe(1)
    expect(map.get(1)).toBe(0)
  })

  it('flags case/whitespace variants of the same question', () => {
    const rows = [q({ question_text_en: '  Capital   of AP?' }), q()]
    const map = computeDuplicateRedundancy(rows)
    expect(map.get(1)).toBe(0)
  })

  it('collapses whitespace on Telugu question text without corrupting the script (Unicode-safe)', () => {
    const rows = [
      q({ question_text_en: 'ప్రశ్న   ?' }),
      q({ question_text_en: 'ప్రశ్న ?' }),
    ]
    const map = computeDuplicateRedundancy(rows)
    expect(map.get(1)).toBe(0)
  })

  it('never flags Telugu rows whose meaning differs', () => {
    const rows = [
      q({ question_text_en: 'ఆంధ్ర ప్రదేశ్ రాజధాని ఏది?' }),
      q({ question_text_en: 'ఆంధ్రప్రదేశ్ అతిపెద్ద నది ఏది?' }),
    ]
    const map = computeDuplicateRedundancy(rows)
    expect(map.size).toBe(0)
  })

  it('does NOT flag different questions', () => {
    const rows = [q(), q({ question_text_en: 'Second question?' })]
    const map = computeDuplicateRedundancy(rows)
    expect(map.size).toBe(0)
  })

  it('does NOT flag same text with a different correct option', () => {
    const rows = [q(), q({ correct_option: 'C' })]
    const map = computeDuplicateRedundancy(rows)
    expect(map.size).toBe(0)
  })
})

// ─── C4 — prompt generation ──────────────────────────────────────────────────

describe('C4: prompt generation', () => {
  it('pins the exact requested count', () => {
    expect(getPromptText(37)).toContain('EXACTLY 37')
  })

  it('enforces strict single-array output', () => {
    const prompt = getPromptText(10)
    expect(prompt).toContain('Return ONLY the JSON array')
    expect(prompt).toContain('"question_text_en"')
    expect(prompt).toContain('"correct_option"')
  })
})

// ─── C5 — Step 1 copy gating + inline error ──────────────────────────────────

describe('C5: Step 1 copy gating (no toast, inline error)', () => {
  const baseProps = {
    targetCount: 30,
    setTargetCount: () => {},
    customCount: '',
    setCustomCount: () => {},
    promptPhase: 'count' as const,
    copied: false,
    copyError: null,
    activeAICopy: null,
    onCopyPrompt: () => {},
    onLaunchAI: () => {},
    onPromptPhaseChange: () => {},
  }

  it('hides the AI launch matrix until the prompt has been copied', () => {
    render(ui(<CreateStepPrompt {...baseProps} />))
    expect(screen.queryByText('ChatGPT')).toBeNull()
    expect(screen.queryByText('Gemini')).toBeNull()
  })

  it('shows ALL trusted AI targets once copy succeeded (launch phase)', () => {
    render(ui(<CreateStepPrompt {...baseProps} promptPhase="launch" copied />))
    expect(screen.getByText('ChatGPT')).toBeTruthy()
    expect(screen.getByText('Gemini')).toBeTruthy()
    expect(screen.getByText('Claude')).toBeTruthy()
    expect(screen.getByText('NotebookLM')).toBeTruthy()
  })

  it('surfaces the transient "Prompt Copied!" state after a copy', () => {
    render(ui(<CreateStepPrompt {...baseProps} promptPhase="launch" copied />))
    expect(screen.getByText('Prompt Copied!')).toBeTruthy()
  })

  it('renders the copy failure INLINE (never a toast) and keeps the launch matrix hidden', () => {
    render(ui(<CreateStepPrompt {...baseProps} promptPhase="copy" copyError="Could not copy the prompt to your clipboard. Click “Copy Prompt” again to retry." />))
    expect(screen.getByRole('alert').textContent).toMatch(/again to retry/i)
    expect(screen.queryByText('ChatGPT')).toBeNull()
  })
})

// ─── C6 — Step 2 parse pipeline ──────────────────────────────────────────────

describe('C6: Step 2 parse pipeline reports ALL issues', () => {
  it('collects duplicates + invalid rows, keeps valid unique rows, reports counts', async () => {
    const user = userEvent.setup()
    const setQuestions = vi.fn()
    const setParseReport = vi.fn()

    const duplicateRow = {
      question_text_en: 'Capital of AP?',
      option_a_en: 'Visakhapatnam',
      option_b_en: 'Amaravati',
      option_c_en: 'Vijayawada',
      option_d_en: 'Kurnool',
      correct_option: 'B',
    }
    const invalidRow = {
      question_text_en: 'Broken question',
      option_a_en: 'X',
      option_b_en: '',
      option_c_en: 'Y',
      option_d_en: 'Z',
      correct_option: 'A',
    }
    const goodRow = {
      question_text_en: 'Largest river of AP?',
      option_a_en: 'Krishna',
      option_b_en: 'Godavari',
      option_c_en: 'Tungabhadra',
      option_d_en: 'Penna',
      correct_option: 'B',
    }

    const json = JSON.stringify([duplicateRow, duplicateRow, invalidRow, goodRow])

    render(ui(
      <CreateStepJsonPaste
        questions={[]}
        setQuestions={setQuestions}
        requestCount={3}
        parseReport={null}
        setParseReport={setParseReport}
        onConfirm={() => {}}
        breakpoint="lg"
      />
    ))

    fireEvent.change(screen.getByLabelText('JSON questions input'), { target: { value: json } })
    await user.click(screen.getByRole('button', { name: /Parse & Validate/i }))

    await waitFor(() => expect(setQuestions).toHaveBeenCalled())

    const accepted = setQuestions.mock.calls[0][0] as QuestionData[]
    expect(accepted).toHaveLength(2)
    expect(accepted.map(q => q.display_order)).toEqual([1, 2])
    expect(accepted[0].difficulty).toBe('medium')

    const report = setParseReport.mock.calls[0][0]
    expect(report.requested).toBe(3)
    expect(report.received).toBe(4)
    expect(report.accepted).toBe(2)
    expect(report.duplicateRows).toBe(1)
    expect(report.invalidRows).toBe(1)
    expect(report.invalidSamples[0]).toMatch(/^Question 3/)
  })

  it('shows the count-vs-requested summary inline after a successful parse', async () => {
    const user = userEvent.setup()

    function StatefulPaste() {
      const [questions, setQuestions] = useState<QuestionData[]>([])
      const [report, setReport] = useState<ParseReport | null>(null)
      return (
        <CreateStepJsonPaste
          questions={questions}
          setQuestions={setQuestions}
          requestCount={3}
          parseReport={report}
          setParseReport={setReport}
          onConfirm={() => {}}
          breakpoint="lg"
        />
      )
    }

    render(ui(<StatefulPaste />))

    const json = JSON.stringify([validQ({}), validQ2, validQ({})])
    fireEvent.change(screen.getByLabelText('JSON questions input'), { target: { value: json } })
    await user.click(screen.getByRole('button', { name: /Parse & Validate/i }))

    await waitFor(() => expect(screen.getByText('2 of 3 requested questions ready')).toBeTruthy())
    expect(screen.getByText(/1 duplicate removed/)).toBeTruthy()
  })
})

// ─── W2 — the MAX_QUESTIONS cap enforced everywhere (count, paste, add) ──────

describe('W2: question-count cap is enforced on every entry path', () => {
  // Controlled input: type() must accumulate through real state like the page.
  function StatefulPrompt() {
    const [targetCount, setTargetCount] = useState(0)
    const [customCount, setCustomCount] = useState('')
    const [promptPhase, setPromptPhase] = useState<'count' | 'copy' | 'launch'>('count')
    return (
      <CreateStepPrompt
        targetCount={targetCount}
        setTargetCount={setTargetCount}
        customCount={customCount}
        setCustomCount={setCustomCount}
        promptPhase={promptPhase}
        copied={false}
        copyError={null}
        activeAICopy={null}
        onCopyPrompt={() => {}}
        onLaunchAI={() => {}}
        onPromptPhaseChange={setPromptPhase}
      />
    )
  }

  it('custom count above 100 is rejected INLINE and the prompt stays hidden', async () => {
    const user = userEvent.setup()
    render(ui(<StatefulPrompt />))

    const input = screen.getByLabelText('Custom question count')
    await user.type(input, '150')

    expect(screen.getByRole('alert').textContent).toMatch(/limited to 100 questions/i)
    // The count was not accepted and the phase fell back to selection.
    expect(screen.queryByText('Copy Prompt to Clipboard')).toBeNull()
    expect(screen.queryByText('ChatGPT')).toBeNull()
  })

  it('custom count at/below 100 is accepted and activates the copy phase', async () => {
    const user = userEvent.setup()
    render(ui(<StatefulPrompt />))

    await user.type(screen.getByLabelText('Custom question count'), '25')

    expect(screen.getByText(/EXACTLY 25 questions/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy Prompt to Clipboard' })).toBeTruthy()
  })

  it('JSON paste with more than 100 rows is rejected BEFORE parsing (report cleared, no questions accepted)', async () => {
    const user = userEvent.setup()
    const setQuestions = vi.fn()
    const setParseReport = vi.fn()

    const row = { question_text_en: 'Q?', option_a_en: 'A', option_b_en: 'B', option_c_en: 'C', option_d_en: 'D', correct_option: 'A' }
    const json = JSON.stringify(Array.from({ length: 101 }, () => row))

    render(ui(
      <CreateStepJsonPaste
        questions={[]}
        setQuestions={setQuestions}
        requestCount={101}
        parseReport={null}
        setParseReport={setParseReport}
        onConfirm={() => {}}
        breakpoint="lg"
      />
    ))

    fireEvent.change(screen.getByLabelText('JSON questions input'), { target: { value: json } })
    await user.click(screen.getByRole('button', { name: /Parse & Validate/i }))

    expect(screen.getByRole('alert').textContent).toMatch(/Batch size limited to 100 questions/i)
    expect(setQuestions).not.toHaveBeenCalled()
    // The reject path clears any stale report; no accepted list was produced.
    expect(setParseReport).toHaveBeenCalledWith(null)
  })

  it('JSON paste with EXACTLY 100 rows is accepted (inclusive boundary, matches server v_count > 100)', async () => {
    const user = userEvent.setup()
    const setQuestions = vi.fn()
    const setParseReport = vi.fn()

    const row = { question_text_en: 'Q?', option_a_en: 'A', option_b_en: 'B', option_c_en: 'C', option_d_en: 'D', correct_option: 'A' }
    const json = JSON.stringify(
      Array.from({ length: 100 }, (_, i) => ({ ...row, question_text_en: `Q${i}?` }))
    )

    render(ui(
      <CreateStepJsonPaste
        questions={[]}
        setQuestions={setQuestions}
        requestCount={100}
        parseReport={null}
        setParseReport={setParseReport}
        onConfirm={() => {}}
        breakpoint="lg"
      />
    ))

    fireEvent.change(screen.getByLabelText('JSON questions input'), { target: { value: json } })
    await user.click(screen.getByRole('button', { name: /Parse & Validate/i }))

    await waitFor(() => expect(setQuestions).toHaveBeenCalled())
    const accepted = setQuestions.mock.calls[0][0] as QuestionData[]
    expect(accepted).toHaveLength(100)
    expect(accepted[99].display_order).toBe(100)
    // No batch-limit alert surfaced on the inclusive boundary.
    expect(screen.queryByRole('alert')).toBeNull()
    expect(setParseReport).toHaveBeenCalledWith(expect.objectContaining({ received: 100, accepted: 100, duplicateRows: 0, invalidRows: 0 }))
  })

  it('Review blocks "Add Question" at exactly 100 questions', async () => {
    const user = userEvent.setup()
    const initial = Array.from({ length: 100 }, (_, i) => validQ({ client_id: `q-cap-${i}`, display_order: i + 1 }))
    render(ui(<StatefulReview initial={initial} />))

    await user.click(screen.getByRole('button', { name: /Add Question/i }))

    expect(screen.getByText(/Exams are limited to 100 questions/)).toBeTruthy()
    // No new card appeared and the existing rows were untouched.
    expect(screen.getAllByRole('button', { name: /Delete question/i })).toHaveLength(100)
  }, 30000)
})

// ─── C7 — Step 3 delete confirm + add-opens-edit ─────────────────────────────

describe('C7: Step 3 review controls', () => {
  it('routes destructive deletes through the canonical ConfirmModal', async () => {
    const user = userEvent.setup()
    render(ui(<StatefulReview initial={[validQ({ ...validQ2, display_order: 1 }), validQ2]} />))

    await user.click(screen.getByRole('button', { name: 'Delete question 1' }))
    expect(screen.getByText('Delete Question')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /^Delete$/ }))
    await waitFor(() => expect(screen.queryByText('Delete Question')).toBeNull())

    // Only one question remains and its display_order was renumbered to 1.
    const names = screen.getAllByRole('button', { name: /Delete question/i }).map(b => (b as HTMLElement).getAttribute('aria-label'))
    expect(names).toEqual(['Delete question 1'])
    expect(screen.getByText('of 1')).toBeTruthy()
  })

  it('cancelling the dialog deletes nothing', async () => {
    const user = userEvent.setup()
    render(ui(<StatefulReview initial={[validQ({ ...validQ2, display_order: 1 }), validQ2]} />))

    await user.click(screen.getByRole('button', { name: 'Delete question 1' }))
    await user.click(await screen.findByRole('button', { name: 'Keep' }))

    expect(screen.queryByText('Delete Question')).toBeNull()
    expect(screen.getAllByRole('button', { name: /Delete question/i })).toHaveLength(2)
  })

  it('"Add Question" opens the new card directly in edit mode', async () => {
    const user = userEvent.setup()
    render(ui(<StatefulReview initial={[validQ2]} />))

    await user.click(screen.getByRole('button', { name: /Add Question/i }))

    // autoEdit → the canonical Save affordance is immediately present on the
    // freshly appended card, plus its 6 inputs; the card is protected while
    // editing, so only the other card exposes a delete control.
    expect(await screen.findByRole('button', { name: /^Save$/ })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Delete question/i })).toHaveLength(1)
    expect(screen.getAllByRole('textbox')).toHaveLength(6)
  })

  it('renders the parse summary chips when rows were removed upstream', () => {
    render(ui(
      <CreateStepReview
        questions={[validQ({ ...validQ2 })]}
        setQuestions={() => {}}
        parseReport={{ requested: 3, received: 4, accepted: 1, duplicateRows: 2, invalidRows: 1, invalidSamples: [] }}
        onConfirm={() => {}}
        onBack={() => {}}
        breakpoint="lg"
      />
    ))

    expect(screen.getByText(/2 duplicates removed/)).toBeTruthy()
    expect(screen.getByText(/1 invalid excluded/)).toBeTruthy()
  })
})
