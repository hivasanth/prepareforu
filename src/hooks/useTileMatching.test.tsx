import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

vi.mock('../services/memoryGameService', () => ({
  MEMORY_GAME_ID: 'tile_matching',
  MEMORY_LEADERBOARD_TOP_LIMIT: 50,
  startMemoryGameSession: vi.fn(),
  submitMemoryGameResult: vi.fn(),
  fetchMemoryGameLeaderboard: vi.fn(),
  fetchMemoryGamePersonalBest: vi.fn(),
  subscribeToMemoryGameLeaderboard: vi.fn(),
}))

import * as service from '../services/memoryGameService'
import { useTileMatching } from './useTileMatching'
import { RETRY_TRANSITION_MS } from './useMemoryRunEngine'
import { TILE_MATCHING_GAME_ID, TILE_MATCHING_STARTING_LIVES } from '../config/memoryGames'

type Hook = ReturnType<typeof useTileMatching>

beforeEach(() => {
  vi.clearAllMocks()
})

/** Flip every pair of the current stage by tapping two matching cells at a time. */
function completeStage(result: { current: Hook }) {
  const pairs = result.current.state.numbers
  for (let pairId = 0; pairId < pairs; pairId += 1) {
    const first = result.current.state.positions.findIndex(
      (value, index) => value === pairId && !result.current.state.matchedIndices.includes(index),
    )
    const second = result.current.state.positions.findIndex(
      (value, index) => index > first && value === pairId,
    )
    act(() => result.current.selectTile(first))
    act(() => result.current.selectTile(second))
  }
}

/** A cell that hosts a DIFFERENT pair id than cell `a` (guaranteed mismatch). */
function mismatchingCell(state: Hook['state'], otherCell: number): number {
  const value = state.positions[otherCell]
  const found = state.positions.findIndex((entry, index) => index !== otherCell && entry !== value)
  expect(found).toBeGreaterThanOrEqual(0)
  return found
}

describe('useTileMatching', () => {
  it('starts a run with an authoritative session and a full 12-tile board', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const { result } = renderHook(() => useTileMatching())

    act(() => result.current.startGame())

    expect(result.current.state.status).toBe('showingNumbers')
    expect(result.current.state.phase).toBe('recall')
    expect(result.current.state.numbers).toBe(6)
    expect(result.current.state.positions).toHaveLength(12)
    expect(new Set(result.current.state.positions).size).toBe(6)
    await waitFor(() => expect(result.current.state.sessionId).toBe('session-1'))
  })

  it('a mismatch costs a life, mistakes +1, flashes, and the STAGE KEEPS RUNNING', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const onSound = vi.fn()
    const { result } = renderHook(() => useTileMatching({ onSound }))
    vi.useFakeTimers()
    try {
      act(() => result.current.startGame())
      const wrong = mismatchingCell(result.current.state, 0)
      act(() => result.current.selectTile(0))
      act(() => result.current.selectTile(wrong))

      expect(result.current.state.status).toBe('showingNumbers')
      expect(result.current.state.lastFailureReason).toBe('wrongNumber')
      expect(result.current.state.lives).toBe(TILE_MATCHING_STARTING_LIVES - 1)
      expect(result.current.state.mistakes).toBe(1)
      expect(result.current.state.mismatchIndices).toEqual([0, wrong])
      expect(onSound).toHaveBeenCalledWith('wrong')

      await act(async () => {
        vi.advanceTimersByTime(RETRY_TRANSITION_MS)
      })
      expect(result.current.state.mismatchIndices).toHaveLength(0)
      expect(result.current.state.status).toBe('showingNumbers')
    } finally {
      vi.useRealTimers()
    }
  })

  it('a correct pair locks both tiles and keeps every life', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const onSound = vi.fn()
    const { result } = renderHook(() => useTileMatching({ onSound }))
    act(() => result.current.startGame())

    const first = 0
    const second = result.current.state.positions.findIndex(
      (value, index) => index !== first && value === result.current.state.positions[first],
    )
    act(() => result.current.selectTile(first))
    act(() => result.current.selectTile(second))

    expect(result.current.state.expected).toBe(1)
    expect(result.current.state.correctSelections).toBe(1)
    expect(result.current.state.lives).toBe(TILE_MATCHING_STARTING_LIVES)
    expect(onSound).toHaveBeenCalledWith('correct')
  })

  it('clears the stage, scores +5, and submits once under the tile_matching game id', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    vi.mocked(service.submitMemoryGameResult).mockResolvedValue({
      accepted: true,
      duplicate: false,
      score: 5,
    })
    const onSubmitted = vi.fn()
    const { result } = renderHook(() => useTileMatching({ onSubmitted }))

    act(() => result.current.startGame())
    await waitFor(() => expect(result.current.state.sessionId).toBe('session-1'))
    await waitFor(() => expect(result.current.state.status).toBe('showingNumbers'))

    completeStage(result)
    expect(result.current.state.status).toBe('stageComplete')
    expect(result.current.state.score).toBe(5)
    expect(result.current.state.lives).toBe(TILE_MATCHING_STARTING_LIVES + 1)

    act(() => result.current.finishGame())
    await waitFor(() => expect(result.current.state.status).toBe('submissionSuccess'))

    expect(service.submitMemoryGameResult).toHaveBeenCalledTimes(1)
    expect(service.submitMemoryGameResult).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: TILE_MATCHING_GAME_ID }),
    )
    expect(onSubmitted).toHaveBeenCalledTimes(1)
  })

  it('fails the stage on timeout without registering a mistake', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const onSound = vi.fn()
    const { result } = renderHook(() => useTileMatching({ onSound }))
    vi.useFakeTimers()
    try {
      act(() => result.current.startGame())
      await act(async () => {
        vi.advanceTimersByTime(result.current.state.stageTimerSeconds * 1000)
      })

      expect(result.current.state.status).toBe('stageFailed')
      expect(result.current.state.lastFailureReason).toBe('timeout')
      expect(result.current.state.mistakes).toBe(0)
      expect(result.current.state.lives).toBe(TILE_MATCHING_STARTING_LIVES - 1)
      expect(onSound).toHaveBeenCalledWith('timeUp')
      expect(onSound).not.toHaveBeenCalledWith('wrong')
    } finally {
      vi.useRealTimers()
    }
  })

  it('surfaces a submission error without losing the result', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    vi.mocked(service.submitMemoryGameResult).mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useTileMatching())

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