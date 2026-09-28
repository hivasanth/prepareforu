import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AttemptCardBase } from './AttemptCardBase'
import type { PerformanceAttemptSummary } from '../../types/exam.types'

afterEach(() => cleanup())

// Focused tests for the shared attempt card a11y/interaction contract
// (BUG-3). Previously only covered indirectly via the dashboard suite.

function attempt(o: Partial<PerformanceAttemptSummary> = {}): PerformanceAttemptSummary {
  return {
    id: 'A1',
    exam_id: 'E1',
    paper_id: 'P1',
    score: 7,
    accuracy: 70,
    correct_count: 7,
    wrong_count: 3,
    skipped_count: 0,
    submitted_at: new Date().toISOString(),
    exam_papers: { paper_name: 'Paper 1' },
    exam_configs: { name: 'Grand Exam' },
    ...o,
  }
}

describe('AttemptCardBase - interactive (not reviewed)', () => {
  it('renders as a button with tabIndex 0 and accessible name', () => {
    const onClick = vi.fn()
    render(<AttemptCardBase attempt={attempt()} onClick={onClick} />)
    const card = screen.getByRole('button', { name: /View full review/i })
    expect(card).toHaveAttribute('tabindex', '0')
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Grand Exam'))
  })

  it('activates on click', async () => {
    const onClick = vi.fn()
    render(<AttemptCardBase attempt={attempt()} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('activates on Enter', async () => {
    const onClick = vi.fn()
    render(<AttemptCardBase attempt={attempt()} onClick={onClick} />)
    await userEvent.keyboard('{Tab}{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('activates on Space', async () => {
    const onClick = vi.fn()
    render(<AttemptCardBase attempt={attempt()} onClick={onClick} />)
    await userEvent.keyboard('{Tab}{ }')
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not activate on other keys', async () => {
    const onClick = vi.fn()
    render(<AttemptCardBase attempt={attempt()} onClick={onClick} />)
    await userEvent.keyboard('{Tab}{a}')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders the Full Review affordance for a non-reviewed attempt', () => {
    render(<AttemptCardBase attempt={attempt({ review_accessed: false })} onClick={vi.fn()} />)
    expect(screen.getByText(/Full Review/i)).toBeInTheDocument()
  })
})

describe('AttemptCardBase - reviewed (non-interactive, BUG-3)', () => {
  const reviewed = attempt({ review_accessed: true })

  it('does NOT render as a button (no role, no tabIndex)', () => {
    render(<AttemptCardBase attempt={reviewed} onClick={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('never activates on click', async () => {
    const onClick = vi.fn()
    render(<AttemptCardBase attempt={reviewed} onClick={onClick} />)
    await userEvent.click(screen.getByText(/Already Reviewed/i).closest('div')!)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not activate on Enter or Space (no keyboard trap pre-/post)', async () => {
    const onClick = vi.fn()
    render(<AttemptCardBase attempt={reviewed} onClick={onClick} />)
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('labels the attempt as already reviewed in its aria-label', () => {
    render(<AttemptCardBase attempt={reviewed} onClick={vi.fn()} />)
    const labelled = screen.getByLabelText(/Review already completed/i)
    expect(labelled).toBeInTheDocument()
  })

  it('renders the Already Reviewed affordance', () => {
    render(<AttemptCardBase attempt={reviewed} onClick={vi.fn()} />)
    expect(screen.getByText(/Already Reviewed/i)).toBeInTheDocument()
  })

  it('renders score, accuracy and paper/exam names', () => {
    render(<AttemptCardBase attempt={attempt()} onClick={vi.fn()} />)
    expect(screen.getByText('7')).toBeInTheDocument() // score
    expect(screen.getByText('70%')).toBeInTheDocument() // accuracy (desktop metric)
    expect(screen.getByText('Paper 1')).toBeInTheDocument()
    expect(screen.getByText(/Grand Exam/i)).toBeInTheDocument()
  })
})
