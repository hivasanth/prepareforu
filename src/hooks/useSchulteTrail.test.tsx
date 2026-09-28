import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

vi.mock('../services/memoryGameService', () => ({
  MEMORY_GAME_ID: 'schulte_trail',
  MEMORY_LEADERBOARD_TOP_LIMIT: 50,
  startMemoryGameSession: vi.fn(),
  submitMemoryGameResult: vi.fn(),
  fetchMemoryGameLeaderboard: vi.fn(),
  fetchMemoryGamePersonalBest: vi.fn(),
  subscribeToMemoryGameLeaderboard: vi.fn(),
}))

import * as service from '../services/memoryGameService'
import { useSchulteTrail } from './useSchulteTrail'
import { RETRY_TRANSITION_MS } from './useMemoryRunEngine'
import { SCHULTE_TRAIL_GAME_ID } from '../config/memoryGames'

type Hook = ReturnType<typeof useSchulteTrail>

beforeEach(() => {
  vi.clearAllMocks()
})

/** Tap every number of the current stage in ascending order (the whole board). */
function completeStage(result: { current: Hook }) {
  const total = result.current.state.numbers
  for (let i = 0; i < total; i++) {
    const cell = result.current.state.positions[i]
    act(() => result.current.selectTile(cell))
  }
}

/** A cell that does NOT host the current expected number. */
function wrongCell(state: Hook['state']): number {
  return (state.positions[state.expected - 1] + 1) % (state.gridSize * state.gridSize)
}

describe('useSchulteTrail', () => {
  it('starts a run with an authoritative session and a full 16-target board', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const { result } = renderHook(() => useSchulteTrail())

    act(() => result.current.startGame())

    expect(result.current.state.status).toBe('showingNumbers')
    expect(result.current.state.phase).toBe('recall')
    expect(result.current.state.numbers).toBe(16)
    expect(result.current.state.positions).toHaveLength(16)
    expect(new Set(result.current.state.positions).size).toBe(16)
    await waitFor(() => expect(result.current.state.sessionId).toBe('session-1'))
  })

  it('a wrong number costs a life and retries the same stage', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const onSound = vi.fn()
    const { result } = renderHook(() => useSchulteTrail({ onSound }))
    vi.useFakeTimers()
    try {
      act(() => result.current.startGame())
      await act(async () => {
        vi.advanceTimersByTime(RETRY_TRANSITION_MS)
      })
      act(() => result.current.selectTile(wrongCell(result.current.state)))

      expect(result.current.state.status).toBe('stageFailed')
      expect(result.current.state.lastFailureReason).toBe('wrongNumber')
      expect(result.current.state.lives).toBe(2)
      expect(result.current.state.mistakes).toBe(1)
      expect(onSound).toHaveBeenCalledWith('wrong')

      await act(async () => {
        vi.advanceTimersByTime(RETRY_TRANSITION_MS)
      })
      expect(result.current.state.status).toBe('showingNumbers')
      expect(result.current.state.level).toBe(1)
      expect(result.current.state.stage).toBe(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('a correct number advances the trail and keeps every life', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const { result } = renderHook(() => useSchulteTrail())
    vi.useFakeTimers()
    try {
      act(() => result.current.startGame())
      const cell = result.current.state.positions[0]
      act(() => result.current.selectTile(cell))

      expect(result.current.state.expected).toBe(2)
      expect(result.current.state.correctSelections).toBe(1)
      expect(result.current.state.lives).toBe(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it('clears the stage, scores +5, and submits once under the trail game id', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    vi.mocked(service.submitMemoryGameResult).mockResolvedValue({
      accepted: true,
      duplicate: false,
      score: 5,
    })
    const onSubmitted = vi.fn()
    const { result } = renderHook(() => useSchulteTrail({ onSubmitted }))

    act(() => result.current.startGame())
    await waitFor(() => expect(result.current.state.sessionId).toBe('session-1'))
    await waitFor(() => expect(result.current.state.status).toBe('showingNumbers'))

    completeStage(result)
    expect(result.current.state.status).toBe('stageComplete')
    expect(result.current.state.score).toBe(5)

    act(() => result.current.finishGame())
    await waitFor(() => expect(result.current.state.status).toBe('submissionSuccess'))

    expect(service.submitMemoryGameResult).toHaveBeenCalledTimes(1)
    expect(service.submitMemoryGameResult).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: SCHULTE_TRAIL_GAME_ID }),
    )
    expect(onSubmitted).toHaveBeenCalledTimes(1)
  })

  it('fails the stage on timeout without registering a mistake', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const onSound = vi.fn()
    const { result } = renderHook(() => useSchulteTrail({ onSound }))
    vi.useFakeTimers()
    try {
      act(() => result.current.startGame())
      await act(async () => {
        vi.advanceTimersByTime(result.current.state.stageTimerSeconds * 1000)
      })

      expect(result.current.state.status).toBe('stageFailed')
      expect(result.current.state.lastFailureReason).toBe('timeout')
      expect(result.current.state.mistakes).toBe(0)
      expect(result.current.state.lives).toBe(2)
      expect(onSound).toHaveBeenCalledWith('timeUp')
      expect(onSound).not.toHaveBeenCalledWith('wrong')
    } finally {
      vi.useRealTimers()
    }
  })

  it('surfaces a submission error without losing the result', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    vi.mocked(service.submitMemoryGameResult).mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useSchulteTrail())

    act(() => result.current.startGame())
    await waitFor(() => expect(result.current.state.sessionId).toBe('session-1'))
    await waitFor(() => expect(result.current.state.status).toBe('showingNumbers'))
    completeStage(result)
    act(() => result.current.finishGame())

    await waitFor(() => expect(result.current.state.status).toBe('submissionError'))
    expect(result.current.state.submissionError).toBe('network down')
    expect(result.current.state.score).toBe(5)
  })
})