import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecentAttemptCard } from './RecentAttemptCard'
import type { PerformanceAttemptSummary } from '../../types/exam.types'

afterEach(() => cleanup())

// RecentAttemptCard delegates to AttemptCardBase and only swaps the date
// formatter for relative time. These tests confirm the delegation contract
// (interactive state, review gating, click routing) at the composition layer.

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

describe('RecentAttemptCard', () => {
  it('renders as an interactive button and routes review via onClick', async () => {
    const onClick = vi.fn()
    render(<RecentAttemptCard attempt={attempt()} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button', { name: /View full review/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders "Just now" for a very recent attempt (relative date formatter)', () => {
    render(<RecentAttemptCard attempt={attempt()} onClick={vi.fn()} />)
    expect(screen.getByText(/Just now/i)).toBeInTheDocument()
  })

  it('renders a relative time for attempts within the last hour', () => {
    const submitted = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    render(<RecentAttemptCard attempt={attempt({ submitted_at: submitted })} onClick={vi.fn()} />)
    expect(screen.getByText(/5m ago/i)).toBeInTheDocument()
  })

  it('uses an absolute date for attempts older than a day', () => {
    const submitted = new Date(Date.now() - 3 * 86400 * 1000).toISOString()
    render(<RecentAttemptCard attempt={attempt({ submitted_at: submitted })} onClick={vi.fn()} />)
    // toLocaleDateString is environment-dependent; assert it is NOT a relative token.
    expect(screen.queryByText(/ago/i)).not.toBeInTheDocument()
  })

  it('renders the reviewed attempt as non-interactive', async () => {
    const onClick = vi.fn()
    render(<RecentAttemptCard attempt={attempt({ review_accessed: true })} onClick={onClick} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText(/Already Reviewed/i)).toBeInTheDocument()
  })
})
