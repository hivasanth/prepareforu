import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RefObject } from 'react'
import { ExamPaperGrid } from '../ExamPaperGrid'
import type { ExamPaper } from '../../../../types/exam.types'

/* ── ExamPaperGrid ─ FUNC-1 component suite ─────────────────────────────────
 * Locks the /exams grid render contract:
 *   G-a  one card per paper (no duplicate DOM) for the active tab/group
 *   G-b  "Not Enough Questions" cards render a DISABLED CTA
 *   G-c  clicking a valid card's Start CTA calls onStartExam with that paper
 *   G-d  APPSC group Tabs render and switch the active group
 * Guards: ThemeContext is mocked only (matches repo convention); the real
 *         grid + card components render. No `any` types outside the mock shim.
 * ──────────────────────────────────────────────────────────────────────────── */

const theme = vi.hoisted(() => ({ useTheme: vi.fn(() => ({ isDark: false })) }))
vi.mock('../../../../context/ThemeContext', () => theme)

function paper(id: string, examId: string, name: string): ExamPaper {
  return {
    id,
    exam_id: examId,
    paper_name: name,
    stage: 'PRELIMS',
    total_questions: 120,
    total_marks: 120,
    duration_minutes: 120,
    negative_marking: true,
    negative_mark_value: 0.33,
    display_order: 0,
    start_time: null,
    end_time: null,
  }
}

const groupOptions = [
  { id: 'APPSC_GROUP_1', label: 'GROUP 1' },
  { id: 'APPSC_GROUP_2', label: 'GROUP 2' },
]

const baseProps = {
  isAppsc: true,
  groupOptions,
  activeGroup: 'APPSC_GROUP_1',
  onGroupChange: vi.fn(),
  displayedPapers: [] as ExamPaper[],
  availabilityMap: {} as Record<string, { valid: boolean; message?: string }>,
  isStarting: null as string | null,
  onStartExam: vi.fn(),
  currentIndex: 0,
  onScroll: vi.fn(),
  onScrollToCard: vi.fn(),
  scrollContainerRef: { current: null } as RefObject<HTMLDivElement | null>,
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('ExamPaperGrid — FUNC-1', () => {
  it('G-a: renders exactly one article card per displayed paper (no duplicated DOM)', () => {
    const papers = [
      paper('a', 'APPSC_GROUP_1', 'General Studies'),
      paper('b', 'APPSC_GROUP_1', 'General Aptitude'),
    ]
    render(
      <ExamPaperGrid
        {...baseProps}
        displayedPapers={papers}
        availabilityMap={{ a: { valid: true }, b: { valid: true } }}
      />
    )
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByRole('article', { name: 'General Studies' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'General Aptitude' })).toBeInTheDocument()
    // Each card renders exactly one start CTA (2 cards → 2 enabled CTAs).
    expect(screen.getAllByRole('button', { name: /start practice/i })).toHaveLength(2)
  })

  it('G-b: a card with insufficient questions renders a disabled CTA', () => {
    const papers = [paper('low', 'APPSC_GROUP_1', 'Under-Filled')]
    render(
      <ExamPaperGrid
        {...baseProps}
        displayedPapers={papers}
        availabilityMap={{ low: { valid: false, message: 'Not Enough Questions' } }}
      />
    )
    const cta = screen.getByRole('button', { name: /not enough questions/i })
    expect(cta).toBeDisabled()
    expect(screen.queryByRole('button', { name: /start practice/i })).toBeNull()
  })

  it('G-c: clicking a valid card CTA calls onStartExam with the matching paper', async () => {
    const user = userEvent.setup()
    const good = paper('g', 'APPSC_GROUP_1', 'Ready Paper')
    const onStartExam = vi.fn()
    render(
      <ExamPaperGrid
        {...baseProps}
        displayedPapers={[good]}
        availabilityMap={{ g: { valid: true } }}
        onStartExam={onStartExam}
      />
    )
    await user.click(screen.getByRole('button', { name: /start practice/i }))
    expect(onStartExam).toHaveBeenCalledTimes(1)
    expect(onStartExam).toHaveBeenCalledWith(good)
  })

  it('G-d: APPSC renders group Tabs and switching invokes onGroupChange', async () => {
    const user = userEvent.setup()
    const onGroupChange = vi.fn()
    render(
      <ExamPaperGrid
        {...baseProps}
        availabilityMap={{}}
        displayedPapers={[]}
        onGroupChange={onGroupChange}
      />
    )
    expect(screen.getByRole('tablist', { name: 'Select exam group' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /group 2/i }))
    expect(onGroupChange).toHaveBeenCalledWith('APPSC_GROUP_2')
  })

  it('G-e: non-APPSC (isAppsc=false) renders no group tabs', () => {
    render(
      <ExamPaperGrid
        {...baseProps}
        isAppsc={false}
        groupOptions={[]}
        activeGroup="DEFAULT"
      />
    )
    expect(screen.queryByRole('tablist')).toBeNull()
  })
})
