/// <reference types="node" />
import { describe, it, expect, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from './context/ThemeContext'
import { QuestionsTable } from './components/admin/questions/QuestionsTable'
import { QUESTION_TABLE_GRID } from './components/admin/questions/questionsTableGrid'
import { Pagination } from './components/common/Pagination'
import type { Question } from './types/exam.types'

/* ─── AQ-01…AQ-08 regression suite ──────────────────────────────────────────
 * Focused structural tests for the /admin/questions responsive header/row
 * alignment remediation. Each test names the audit finding it locks in.
 * (AQ-08 heading semantics is asserted at browser level in
 * e2e/questions-alignment.spec.ts.) */

const here = dirname(fileURLToPath(import.meta.url))

function question(id: string, difficulty: Question['difficulty'], text: string): Question {
  return {
    id,
    exam_id: 'e1',
    paper_id: 'p1',
    subject_name: 'History',
    correct_option: 'A',
    difficulty,
    negative_marks: 0,
    question_text_en: text,
  }
}

const QUESTIONS: Question[] = [
  question('q1', 'easy', 'Easy question text?'),
  question('q2', 'medium', 'Medium question text?'),
  question('q3', 'hard', 'Hard question text?'),
]

function noop() {}

function renderTable(overrides: Partial<Parameters<typeof QuestionsTable>[0]> = {}) {
  return render(
    <ThemeProvider>
      <QuestionsTable
        questions={QUESTIONS}
        isLoading={false}
        page={0}
        setPage={noop}
        hasMore={false}
        totalCount={QUESTIONS.length}
        pageSize={30}
        selectedIds={[]}
        onSelect={noop}
        onSelectAll={noop}
        onEdit={noop}
        onView={noop}
        onDelete={noop}
        {...overrides}
      />
    </ThemeProvider>,
  )
}

/** All QUESTION_TABLE_GRID instances in the rendered table (header first). */
function gridInstances(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.grid')).filter(el =>
    el.className.includes('grid-cols-[20px_28px'),
  )
}

afterEach(cleanup)

describe('AQ-01 — dedicated number column', () => {
  it('header exposes a # cell for the number column', () => {
    const { container } = renderTable()
    const header = container.querySelector('[data-testid="questions-header-grid"]')!
    const cells = Array.from(header.children)
    expect(cells).toHaveLength(5)
    expect(cells[1].textContent).toBe('#')
    expect(cells.map(c => c.textContent)).toEqual([
      'Select all on this page', '#', 'Question', 'Difficulty', 'Actions',
    ])
  })

  it('NumberBadge is a direct grid child, not nested inside the question h3', () => {
    const { container } = renderTable()
    const row = gridInstances(container)[1] // header is index 0
    const children = Array.from(row.children)
    // [SELECT checkbox] [NUMBER badge] [QUESTION h3] [DIFFICULTY pill] [ACTIONS]
    expect(children).toHaveLength(5)
    const badge = children[1]
    expect(badge.className).toContain('w-7')
    expect(badge.textContent).toBe('1')
    const titleWrapper = children[2]
    expect(titleWrapper.querySelector('h3')).not.toBeNull()
    expect(titleWrapper.contains(badge)).toBe(false)
    expect(badge.contains(titleWrapper.querySelector('h3')!)).toBe(false)
  })
})

describe('AQ-02 — one deterministic grid contract', () => {
  it('header and every row consume the identical QUESTION_TABLE_GRID class list', () => {
    const { container } = renderTable()
    const grids = gridInstances(container)
    expect(grids).toHaveLength(4) // header + 3 rows
    for (const g of grids) {
      expect(g.className).toContain(QUESTION_TABLE_GRID)
    }
  })

  it('uses fixed tracks — no content-dependent max-content/auto columns', () => {
    expect(QUESTION_TABLE_GRID).toContain('grid-cols-[20px_28px_minmax(0,1fr)_112px]')
    expect(QUESTION_TABLE_GRID).toContain('md:grid-cols-[20px_28px_minmax(0,1fr)_72px_112px]')
    expect(QUESTION_TABLE_GRID).not.toMatch(/max-content/)
    expect(QUESTION_TABLE_GRID).not.toMatch(/grid-cols-\[auto/)
  })
})

describe('AQ-03 — shared header/row gutters', () => {
  it('header surface (SelectionContainer padding="md") and rows share the same p-4 inset', () => {
    const { container } = renderTable()
    const header = container.querySelector('[data-testid="questions-header-grid"]')!
    const headerInset = header.closest('.p-4')
    expect(headerInset).not.toBeNull()
    const row = gridInstances(container)[1]
    const rowInset = row.closest('.p-4')
    expect(rowInset).not.toBeNull()
    // Same inset utility → identical horizontal content-box geometry.
    expect(headerInset!.className).toContain('p-4')
    expect(rowInset!.className).toContain('p-4')
  })
})

describe('AQ-04 — deterministic difficulty track', () => {
  it('difficulty cells are centered in a fixed track and hidden below md together with the header cell', () => {
    const { container } = renderTable()
    const rows = gridInstances(container).slice(1)
    for (const row of rows) {
      const diffCell = row.children[3] as HTMLElement
      expect(diffCell.className).toContain('hidden')
      expect(diffCell.className).toContain('md:flex')
      expect(diffCell.className).toContain('justify-center')
    }
    const header = container.querySelector('[data-testid="questions-header-grid"]')!
    const diffHeader = header.children[3] as HTMLElement
    expect(diffHeader.className).toContain('hidden')
    expect(diffHeader.className).toContain('md:block')
  })

  it('EASY / MEDIUM / HARD rows keep the same column geometry contract (fixed tracks)', () => {
    // The difficulty labels differ in width; the 72px fixed track guarantees
    // the Actions column x-position cannot move between states.
    const { container } = renderTable()
    const rows = gridInstances(container).slice(1)
    const pills = rows.map(r => r.children[3].textContent)
    expect(pills).toEqual(['easy', 'medium', 'hard'])
    for (const row of rows) {
      expect(row.className).toBe(rows[0].className)
    }
  })
})

describe('AQ-05 — result count rendered once', () => {
  it('top metadata shows the range; Pagination hides its duplicate range text', () => {
    renderTable()
    const ranges = screen.getAllByText(/Showing\s+1–3\s+of\s+3/)
    expect(ranges).toHaveLength(1)
    // Pagination itself remains (prev/next controls), without a second range.
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument()
  })
})

describe('AQ-06 — skeleton parity with loaded structure', () => {
  it('loading state mirrors metadata row + elevated card + header bar + five rows + pagination', () => {
    const { container } = renderTable({ isLoading: true, questions: [] })
    const status = screen.getByRole('status', { name: 'Loading questions' })
    expect(status).toBeInTheDocument()
    // Header bar skeleton + five row skeletons share the real grid contract.
    const grids = gridInstances(container)
    expect(grids).toHaveLength(6)
    for (const g of grids) {
      expect(g.className).toContain(QUESTION_TABLE_GRID)
    }
    // Row skeletons expose the same five-column geometry placeholders.
    const rowSkeleton = grids[1]
    expect(rowSkeleton.children).toHaveLength(5)
    // No real content leaks into the loading state.
    expect(screen.queryByRole('heading')).toBeNull()
  })
})

describe('AQ-07 — premium border token defined', () => {
  it('--border-premium-width is defined with a numeric value in themes.css', () => {
    const css = readFileSync(join(here, 'styles', 'themes.css'), 'utf8')
    const match = css.match(/--border-premium-width:\s*(\d+)px/)
    expect(match).not.toBeNull()
    expect(Number(match![1])).toBeGreaterThan(0)
    // No circular self-reference anywhere in the token's definitions.
    expect(css).not.toMatch(/--border-premium-width:\s*var\(--border-premium-width\)/)
  })
})

describe('AQ-09 — select-all lives in the header grid (single rendering)', () => {
  it('the select-all checkbox is the FIRST child of the header grid, same SelectionCheckbox as rows', () => {
    const { container } = renderTable()
    // Exactly one select-all control in the whole table.
    const selectAll = screen.getAllByRole('checkbox', { name: 'Select all on this page' })
    expect(selectAll).toHaveLength(1)
    // …and it is inside the header grid's first track — not above the table.
    const header = container.querySelector('[data-testid="questions-header-grid"]')!
    expect(header.children[0]).toBe(selectAll[0].closest('label'))
    // Row checkboxes remain direct first-track children of their row grids.
    const rows = gridInstances(container).slice(1)
    for (const row of rows) {
      const rowCb = row.children[0]?.querySelector('input[type="checkbox"]')
      expect(rowCb).not.toBeNull()
    }
  })

  it('header and row checkboxes share the identical component class list', () => {
    const { container } = renderTable()
    const header = container.querySelector('[data-testid="questions-header-grid"]')!
    const headerLabel = header.children[0]
    const rowLabel = gridInstances(container)[1].children[0]
    expect(headerLabel.tagName).toBe(rowLabel.tagName)
    expect(headerLabel.className).toBe(rowLabel.className)
  })

  it('select-all toggles every page checkbox on (behavior unchanged)', async () => {
    let capturedIds: string[] | null = null
    const { rerender } = renderTable({
      onSelectAll: ids => { capturedIds = ids },
    })
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all on this page' }))
    expect(capturedIds).toEqual(['q1', 'q2', 'q3'])
    rerender(
      <ThemeProvider>
        <QuestionsTable
          questions={QUESTIONS}
          isLoading={false}
          page={0}
          setPage={noop}
          hasMore={false}
          totalCount={QUESTIONS.length}
          pageSize={30}
          selectedIds={['q1', 'q2', 'q3']}
          onSelect={noop}
          onSelectAll={noop}
          onEdit={noop}
          onView={noop}
          onDelete={noop}
        />
      </ThemeProvider>,
    )
    expect(screen.getByRole('checkbox', { name: 'Select all on this page' })).toBeChecked()
  })
})

describe('Pagination showRange option', () => {
  const base = { page: 0, onPageChange: noop, totalCount: 30, pageSize: 30, label: 'questions' }

  afterEach(cleanup)

  it('default renders the range text', () => {
    render(
      <ThemeProvider>
        <Pagination {...base} />
      </ThemeProvider>,
    )
    expect(screen.getByText(/Showing/)).toBeInTheDocument()
  })

  it('showRange={false} hides the range text but keeps the controls', () => {
    render(
      <ThemeProvider>
        <Pagination {...base} showRange={false} />
      </ThemeProvider>,
    )
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument()
  })
})
