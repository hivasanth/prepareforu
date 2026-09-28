import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

vi.mock('../services/memoryGameService', () => ({
  MEMORY_GAME_ID: 'number_memory_rush',
  MEMORY_LEADERBOARD_TOP_LIMIT: 50,
  startMemoryGameSession: vi.fn(),
  submitMemoryGameResult: vi.fn(),
  fetchMemoryGameLeaderboard: vi.fn(),
  fetchMemoryGamePersonalBest: vi.fn(),
  subscribeToMemoryGameLeaderboard: vi.fn(),
}))

import * as service from '../services/memoryGameService'
import { useMemoryGame, RETRY_TRANSITION_MS } from './useMemoryGame'
import { useMemoryGameLeaderboard } from './useMemoryGameLeaderboard'

beforeEach(() => {
  vi.clearAllMocks()
})

/** Tap every remaining number of the current stage in order. */
function completeStage(result: { current: ReturnType<typeof useMemoryGame> }) {
  const positions = [...result.current.state.positions]
  const numbers = result.current.state.numbers
  act(() => result.current.selectTile(positions[0]))
  for (let number = 2; number <= numbers; number += 1) {
    act(() => result.current.selectTile(positions[number - 1]))
  }
}

describe('useMemoryGame', () => {
  it('starts a run with an authoritative session and a fresh board', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const { result } = renderHook(() => useMemoryGame())

    act(() => result.current.startGame())

    expect(result.current.state.status).toBe('showingNumbers')
    expect(result.current.state.positions).toHaveLength(3)
    expect(result.current.state.gridSize).toBe(4)
    await waitFor(() => expect(result.current.state.sessionId).toBe('session-1'))
  })

  it('hides the numbers when number 1 is tapped', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const { result } = renderHook(() => useMemoryGame())

    act(() => result.current.startGame())
    const positions = [...result.current.state.positions]
    act(() => result.current.selectTile(positions[0]))

    expect(result.current.state.phase).toBe('recall')
    expect(result.current.state.expected).toBe(2)
  })

  it('scores a cleared stage and submits once when the run is finished', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    vi.mocked(service.submitMemoryGameResult).mockResolvedValue({
      accepted: true,
      duplicate: false,
      score: 5,
    })
    const onSubmitted = vi.fn()
    const { result } = renderHook(() => useMemoryGame({ onSubmitted }))

    act(() => result.current.startGame())
    await waitFor(() => expect(result.current.state.sessionId).toBe('session-1'))

    completeStage(result)
    expect(result.current.state.status).toBe('stageComplete')
    expect(result.current.state.score).toBe(5)

    act(() => result.current.finishGame())
    await waitFor(() => expect(result.current.state.status).toBe('submissionSuccess'))

    expect(service.submitMemoryGameResult).toHaveBeenCalledTimes(1)
    expect(onSubmitted).toHaveBeenCalledTimes(1)
  })

  it('records a mistake and retries the same stage automatically', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const { result } = renderHook(() => useMemoryGame())

    act(() => result.current.startGame())
    const positions = [...result.current.state.positions]
    act(() => result.current.selectTile(positions[0]))
    act(() => result.current.selectTile(positions[2]))

    expect(result.current.state.status).toBe('stageFailed')
    expect(result.current.state.mistakes).toBe(1)

    await waitFor(
      () => expect(result.current.state.status).toBe('showingNumbers'),
      { timeout: 2500 },
    )
    expect(result.current.state.level).toBe(1)
    expect(result.current.state.stage).toBe(1)
  })

  it('surfaces a submission error without losing the result', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    vi.mocked(service.submitMemoryGameResult).mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useMemoryGame())

    act(() => result.current.startGame())
    await waitFor(() => expect(result.current.state.sessionId).toBe('session-1'))
    completeStage(result)
    act(() => result.current.finishGame())

    await waitFor(() => expect(result.current.state.status).toBe('submissionError'))
    expect(result.current.state.submissionError).toBe('network down')
    expect(result.current.state.score).toBe(5)
  })

  it('exposes the recall countdown and fails the stage when it expires', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    vi.useFakeTimers()
    try {
      const { result } = renderHook(() => useMemoryGame())

      act(() => result.current.startGame())
      const positions = [...result.current.state.positions]
      act(() => result.current.selectTile(positions[0]))

      expect(result.current.state.phase).toBe('recall')
      expect(result.current.timeRemaining).toBe(7)

      await act(async () => {
        vi.advanceTimersByTime(7000)
      })

      expect(result.current.state.status).toBe('stageFailed')
      expect(result.current.state.lives).toBe(2)
      expect(result.current.state.mistakes).toBe(0)

      // The stage is re-served automatically after the failure dwell.
      await act(async () => {
        vi.advanceTimersByTime(RETRY_TRANSITION_MS)
      })

      expect(result.current.state.status).toBe('showingNumbers')
      expect(result.current.state.phase).toBe('show')
      expect(result.current.timeRemaining).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('ends the run when all three lives are lost', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const { result } = renderHook(() => useMemoryGame())

    const loseLife = () => {
      const positions = [...result.current.state.positions]
      act(() => result.current.selectTile(positions[0]))
      act(() => result.current.selectTile(positions[positions.length - 1]))
    }

    act(() => result.current.startGame())

    loseLife()
    await waitFor(() => expect(result.current.state.status).toBe('showingNumbers'), { timeout: 3000 })
    expect(result.current.state.lives).toBe(2)

    loseLife()
    await waitFor(() => expect(result.current.state.status).toBe('showingNumbers'), { timeout: 3000 })
    expect(result.current.state.lives).toBe(1)

    loseLife()
    expect(result.current.state.lives).toBe(0)
    await waitFor(
      () => expect(result.current.state.status).toBe('gameComplete'),
      { timeout: 3000 },
    )
    expect(result.current.state.gameOverReason).toBe('lives')
    expect(result.current.state.stagesCompleted).toBe(0)
    expect(result.current.timeRemaining).toBe(0)
  })

  it('plays countdown and critical cues and a time-up (never wrong) when the timer expires', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const onSound = vi.fn()
    const { result } = renderHook(() => useMemoryGame({ onSound }))
    vi.useFakeTimers()
    try {
      act(() => result.current.startGame())
      const positions = [...result.current.state.positions]
      act(() => result.current.selectTile(positions[0]))

      // 7s budget: tick down to 2s (countdown fires on both 3 and 2).
      onSound.mockClear()
      await act(async () => {
        vi.advanceTimersByTime(5000)
      })
      expect(onSound).toHaveBeenCalledWith('countdown')

      // 2s → 1s: critical cue.
      onSound.mockClear()
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })
      expect(onSound).toHaveBeenCalledWith('countCritical')

      // 1s → 0: timeout. Cue is timeUp, NOT wrong.
      onSound.mockClear()
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })
      expect(result.current.state.status).toBe('stageFailed')
      expect(result.current.state.lastFailureReason).toBe('timeout')
      expect(onSound).toHaveBeenCalledWith('timeUp')
      expect(onSound).not.toHaveBeenCalledWith('wrong')
    } finally {
      vi.useRealTimers()
    }
  })

  it('plays a single wrong cue for a bad tap (not a time-up)', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const onSound = vi.fn()
    const { result } = renderHook(() => useMemoryGame({ onSound }))

    act(() => result.current.startGame())
    const positions = [...result.current.state.positions]
    act(() => result.current.selectTile(positions[0]))
    act(() => result.current.selectTile(positions[positions.length - 1]))

    expect(result.current.state.status).toBe('stageFailed')
    expect(result.current.state.lastFailureReason).toBe('wrongNumber')
    expect(onSound).toHaveBeenCalledWith('wrong')
    expect(onSound).not.toHaveBeenCalledWith('timeUp')
  })
})

describe('useMemoryGameLeaderboard', () => {
  it('loads once, subscribes once and unsubscribes on unmount', async () => {
    const unsubscribe = vi.fn()
    vi.mocked(service.fetchMemoryGameLeaderboard).mockResolvedValue([
      {
        rank: 1,
        userId: 'u1',
        displayName: 'Asha',
        score: 40,
        highestLevel: 2,
        highestNumber: 4,
        stagesCompleted: 4,
        accuracy: 100,
        completedAt: '2026-09-20T10:00:00Z',
      },
    ])
    vi.mocked(service.fetchMemoryGamePersonalBest).mockResolvedValue(null)
    vi.mocked(service.subscribeToMemoryGameLeaderboard).mockImplementation(
      (_onChange, onStatus) => {
        onStatus?.(true)
        return unsubscribe
      },
    )

    const { result, unmount } = renderHook(() => useMemoryGameLeaderboard())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.leaderboard).toHaveLength(1)
    expect(result.current.realtimeAvailable).toBe(true)
    expect(service.subscribeToMemoryGameLeaderboard).toHaveBeenCalledTimes(1)

    unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('marks realtime as unavailable when the channel reports an error', async () => {
    vi.mocked(service.fetchMemoryGameLeaderboard).mockResolvedValue([])
    vi.mocked(service.fetchMemoryGamePersonalBest).mockResolvedValue(null)
    vi.mocked(service.subscribeToMemoryGameLeaderboard).mockImplementation(
      (_onChange, onStatus) => {
        onStatus?.(false)
        return vi.fn()
      },
    )

    const { result } = renderHook(() => useMemoryGameLeaderboard())

    await waitFor(() => expect(result.current.realtimeAvailable).toBe(false))
    expect(result.current.leaderboard).toEqual([])
  })

  it('exposes a human-readable UTC day label for the daily board', async () => {
    vi.mocked(service.fetchMemoryGameLeaderboard).mockResolvedValue([])
    vi.mocked(service.fetchMemoryGamePersonalBest).mockResolvedValue(null)
    vi.mocked(service.subscribeToMemoryGameLeaderboard).mockReturnValue(vi.fn())

    const { result } = renderHook(() => useMemoryGameLeaderboard())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.dayLabel).toMatch(/^[A-Za-z]{3} \d{2}, \d{4}$/)
  })

  it('stays inert until the userReady gate flips on', async () => {
    vi.mocked(service.fetchMemoryGameLeaderboard).mockResolvedValue([])
    vi.mocked(service.fetchMemoryGamePersonalBest).mockResolvedValue(null)

    const { rerender } = renderHook(
      ({ userReady }) => useMemoryGameLeaderboard({ active: true, userReady }),
      { initialProps: { userReady: false } },
    )

    expect(service.fetchMemoryGameLeaderboard).not.toHaveBeenCalled()

    rerender({ userReady: true })
    await waitFor(() => expect(service.fetchMemoryGameLeaderboard).toHaveBeenCalledTimes(1))
  })

  it('ignores realtime inserts outside today and reacts to ones inside today', async () => {
    vi.mocked(service.fetchMemoryGameLeaderboard).mockResolvedValue([])
    vi.mocked(service.fetchMemoryGamePersonalBest).mockResolvedValue(null)
    let onChange: ((payload: { completed_at?: string } | null) => void) | undefined
    vi.mocked(service.subscribeToMemoryGameLeaderboard).mockImplementation((callback) => {
      onChange = callback as typeof onChange
      return vi.fn()
    })

    const { result } = renderHook(() => useMemoryGameLeaderboard())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(service.fetchMemoryGameLeaderboard).toHaveBeenCalledTimes(1)

    vi.useFakeTimers()
    try {
      // A score recorded years outside the current UTC day — inert.
      act(() => onChange?.({ completed_at: '2020-01-01T00:00:00Z' }))
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })
      expect(service.fetchMemoryGameLeaderboard).toHaveBeenCalledTimes(1)

      // A score inside today — debounced (400ms) refetch of the daily board.
      act(() => onChange?.({ completed_at: new Date().toISOString() }))
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      expect(service.fetchMemoryGameLeaderboard).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})
