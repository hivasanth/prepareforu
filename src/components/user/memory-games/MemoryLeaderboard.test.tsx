import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ThemeProvider } from '../../../context/ThemeContext'
import { MemoryLeaderboard } from './MemoryLeaderboard'
import type { MemoryLeaderboardEntry } from '../../../types/memoryGame.types'
import type { PageError, PageErrorState } from '../../../types/error.types'

const entries: MemoryLeaderboardEntry[] = [
  {
    rank: 1, userId: 'u1', displayName: 'Alice', score: 240,
    highestLevel: 7, highestNumber: 9, stagesCompleted: 24, accuracy: 92.5,
    completedAt: '2026-09-20T10:00:00Z',
  },
  {
    rank: 2, userId: 'u2', displayName: 'Bob', score: 190,
    highestLevel: 6, highestNumber: 9, stagesCompleted: 20, accuracy: 88,
    completedAt: '2026-09-20T09:00:00Z',
  },
]

const pageError: PageError = {
  category: 'network',
  code: 'NETWORK_FETCH_FAILED',
  severity: 'high',
  title: 'Network error',
  message: 'Could not load today\'s leaderboard.',
  retryable: true,
  timestamp: Date.now(),
}

const baseProps = {
  leaderboard: entries,
  loading: false,
  errorState: 'success' as PageErrorState,
  pageError: null as PageError | null,
  retryError: vi.fn(),
  topLimit: 50,
  currentUserId: '',
}

describe('MemoryLeaderboard', () => {
  afterEach(cleanup)

  function renderBoard(overrides: Partial<typeof baseProps> = {}) {
    return render(
      <ThemeProvider>
        <MemoryLeaderboard {...baseProps} {...overrides} />
      </ThemeProvider>,
    )
  }

  it('renders ranked rows with score, name and the signed-in user highlighted', () => {
    renderBoard({ currentUserId: 'u1' })

    expect(screen.getByText('Rank')).toBeTruthy()
    expect(screen.getByText('Player')).toBeTruthy()
    expect(screen.getByText('Score')).toBeTruthy()

    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()
    expect(screen.getByText('240')).toBeTruthy()
    expect(screen.getByText('190')).toBeTruthy()
    expect(screen.getByText('You')).toBeTruthy()
  })

  it('does not show a "You" pill for any other user id', () => {
    renderBoard({ currentUserId: 'u99' })
    expect(screen.queryByText('You')).toBeNull()
  })

  it('shows a busy live region while loading with no data yet', () => {
    renderBoard({ leaderboard: [], loading: true, errorState: 'loading' })

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('Alice')).toBeNull()
  })

  it('shows a distinct empty state — never an error — when there are no scores', () => {
    renderBoard({ leaderboard: [], errorState: 'success' })
    expect(screen.getByText('No scores yet today')).toBeTruthy()
    expect(screen.queryByText('Network error')).toBeNull()
  })

  it('shows the page error with a retry button when the data fetch fails', () => {
    renderBoard({ leaderboard: [], errorState: 'error', pageError })
    expect(screen.getByText('Network error')).toBeTruthy()
    expect(screen.getByText(/Could not load today/)).toBeTruthy()
    const retry = screen.getByRole('button', { name: 'Try Again' })
    retry.click()
    expect(baseProps.retryError).toHaveBeenCalled()
  })
})