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
import { useVisualMemoryMatrix } from './useVisualMemoryMatrix'
import { RETRY_TRANSITION_MS } from './useMemoryRunEngine'

type Hook = ReturnType<typeof useVisualMemoryMatrix>

beforeEach(() => {
  vi.clearAllMocks()
})

/** Recall every remaining pattern tile of the current stage. */
function completeStage(result: { current: Hook }) {
  for (const cell of [...result.current.state.positions]) {
    act(() => result.current.selectTile(cell))
  }
}

/** A guaranteed non-target cell on the current board. */
function wrongCell(state: Hook['state']): number {
  return Array.from({ length: state.gridSize * state.gridSize }, (_, i) => i).find(
    (cell) => !state.positions.includes(cell),
  )!
}

describe('useVisualMemoryMatrix', () => {
  it('starts a run with an authoritative session and a fresh 4-target pattern on a 4×4 board', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const { result } = renderHook(() => useVisualMemoryMatrix())

    act(() => result.current.startGame())

    expect(result.current.state.status).toBe('showingNumbers')
    expect(result.current.state.phase).toBe('show')
    expect(result.current.state.positions).toHaveLength(4)
    expect(result.current.state.gridSize).toBe(4)
    expect(new Set(result.current.state.positions).size).toBe(4)
    await waitFor(() => expect(result.current.state.sessionId).toBe('session-1'))
  })

  it('tapping a highlighted target ends the preview immediately and marks it green', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const { result } = renderHook(() => useVisualMemoryMatrix())
    vi.useFakeTimers()
    try {
      act(() => result.current.startGame())
      expect(result.current.state.phase).toBe('show')

      const target = result.current.state.positions[0]
      const before = result.current.state.previewSeconds
      const timerBefore = result.current.state.stageTimerSeconds
      act(() => result.current.selectTile(target))

      // Preview is gone at once, the tapped tile is the first found tile…
      expect(result.current.state.phase).toBe('recall')
      expect(result.current.state.correctTiles).toEqual([target])
      expect(result.current.state.correctSelections).toBe(1)
      expect(result.current.state.expected).toBe(2)
      // …lives untouched and the recall budget unchanged.
      expect(result.current.state.lives).toBe(3)
      expect(result.current.state.stageTimerSeconds).toBe(timerBefore)

      // Advancing past the original preview dwell must NOT mutate anything: the
      // preview timeout is dead after the early termination.
      await act(async () => {
        vi.advanceTimersByTime(before * 1000)
      })
      expect(result.current.state.phase).toBe('recall')
      expect(result.current.state.correctTiles).toEqual([target])
      expect(result.current.state.lives).toBe(3)

      // The recalled pattern still resolves on its remaining targets.
      for (const cell of result.current.state.positions.filter((c) => c !== target)) {
        act(() => result.current.selectTile(cell))
      }
      expect(result.current.state.status).toBe('stageComplete')
      expect(result.current.state.correctSelections).toBe(4)
    } finally {
      vi.useRealTimers()
    }
  })

  it('an empty tile tapped during the preview stays fully inert', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const { result } = renderHook(() => useVisualMemoryMatrix())
    act(() => result.current.startGame())

    const empty = Array.from(
      { length: result.current.state.gridSize * result.current.state.gridSize },
      (_, i) => i,
    ).find((cell) => !result.current.state.positions.includes(cell))!
    act(() => result.current.selectTile(empty))

    expect(result.current.state.phase).toBe('show')
    expect(result.current.state.status).toBe('showingNumbers')
    expect(result.current.state.lives).toBe(3)
    expect(result.current.state.mistakes).toBe(0)
    expect(result.current.state.wrongCell).toBeNull()
  })

  it('auto-hides the pattern after the preview dwell and starts the recall clock', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    vi.useFakeTimers()
    try {
      const { result } = renderHook(() => useVisualMemoryMatrix())
      act(() => result.current.startGame())
      expect(result.current.state.phase).toBe('show')

      await act(async () => {
        vi.advanceTimersByTime(result.current.state.previewSeconds * 1000)
      })

      expect(result.current.state.phase).toBe('recall')
      expect(result.current.timeRemaining).toBe(result.current.state.stageTimerSeconds)
    } finally {
      vi.useRealTimers()
    }
  })

  it('scores a cleared pattern stage and submits once when the run is finished', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    vi.mocked(service.submitMemoryGameResult).mockResolvedValue({
      accepted: true,
      duplicate: false,
      score: 5,
    })
    const onSubmitted = vi.fn()
    const { result } = renderHook(() => useVisualMemoryMatrix({ onSubmitted }))

    act(() => result.current.startGame())
    await waitFor(() => expect(result.current.state.sessionId).toBe('session-1'))
    await waitFor(() => expect(result.current.state.phase).toBe('recall'), { timeout: 5000 })

    completeStage(result)
    expect(result.current.state.status).toBe('stageComplete')
    expect(result.current.state.score).toBe(5)

    act(() => result.current.finishGame())
    await waitFor(() => expect(result.current.state.status).toBe('submissionSuccess'))

    expect(service.submitMemoryGameResult).toHaveBeenCalledTimes(1)
    expect(service.submitMemoryGameResult).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: 'visual_memory_matrix' }),
    )
    expect(onSubmitted).toHaveBeenCalledTimes(1)
  })

  it('records a mistake and retries the same stage with a fresh pattern', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const { result } = renderHook(() => useVisualMemoryMatrix())
    vi.useFakeTimers()
    try {
      act(() => result.current.startGame())
      await act(async () => {
        vi.advanceTimersByTime(result.current.state.previewSeconds * 1000)
      })
      act(() => result.current.selectTile(wrongCell(result.current.state)))

      expect(result.current.state.status).toBe('stageFailed')
      expect(result.current.state.lastFailureReason).toBe('emptyTile')
      expect(result.current.state.mistakes).toBe(1)
      expect(result.current.state.lives).toBe(2)

      await act(async () => {
        vi.advanceTimersByTime(RETRY_TRANSITION_MS)
      })
      expect(result.current.state.status).toBe('showingNumbers')
      expect(result.current.state.level).toBe(1)
      expect(result.current.state.stage).toBe(1)
      expect(result.current.state.phase).toBe('show')
    } finally {
      vi.useRealTimers()
    }
  })

  it('fails the stage on timeout without registering a mistake', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const onSound = vi.fn()
    const { result } = renderHook(() => useVisualMemoryMatrix({ onSound }))
    vi.useFakeTimers()
    try {
      act(() => result.current.startGame())
      await act(async () => {
        vi.advanceTimersByTime(result.current.state.previewSeconds * 1000)
      })
      expect(onSound).toHaveBeenCalledWith('reveal')

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

  it('plays a wrong cue for a bad tap and advances a cleared stage', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    const onSound = vi.fn()
    const { result } = renderHook(() => useVisualMemoryMatrix({ onSound }))
    vi.useFakeTimers()
    try {
      act(() => result.current.startGame())
      await act(async () => {
        vi.advanceTimersByTime(result.current.state.previewSeconds * 1000)
      })

      act(() => result.current.selectTile(wrongCell(result.current.state)))
      expect(onSound).toHaveBeenCalledWith('wrong')

      await act(async () => {
        vi.advanceTimersByTime(RETRY_TRANSITION_MS)
      })
      await act(async () => {
        vi.advanceTimersByTime(result.current.state.previewSeconds * 1000)
      })

      completeStage(result)
      expect(result.current.state.status).toBe('stageComplete')

      await act(async () => {
        vi.advanceTimersByTime(1000)
      })
      expect(result.current.state.status).toBe('showingNumbers')
      expect(result.current.state.stage).toBe(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('surfaces a submission error without losing the result', async () => {
    vi.mocked(service.startMemoryGameSession).mockResolvedValue('session-1')
    vi.mocked(service.submitMemoryGameResult).mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useVisualMemoryMatrix())

    act(() => result.current.startGame())
    await waitFor(() => expect(result.current.state.sessionId).toBe('session-1'))
    await waitFor(() => expect(result.current.state.phase).toBe('recall'), { timeout: 5000 })
    completeStage(result)
    act(() => result.current.finishGame())

    await waitFor(() => expect(result.current.state.status).toBe('submissionError'))
    expect(result.current.state.submissionError).toBe('network down')
    expect(result.current.state.score).toBe(5)
  })
})
