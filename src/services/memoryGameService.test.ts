import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MemoryGameMetrics } from '../types/memoryGame.types'

vi.mock('../lib/repositories/memoryGame.repository', () => ({
  MEMORY_LEADERBOARD_TOP_LIMIT: 50,
  startMemoryGameSessionRpc: vi.fn(),
  submitMemoryGameScoreRpc: vi.fn(),
  fetchMemoryGameLeaderboardRpc: vi.fn(),
  fetchMemoryGamePersonalBestRpc: vi.fn(),
  subscribeToMemoryGameScores: vi.fn(),
}))

import * as repo from '../lib/repositories/memoryGame.repository'
import {
  fetchMemoryGameLeaderboard,
  fetchMemoryGamePersonalBest,
  startMemoryGameSession,
  submitMemoryGameResult,
  subscribeToMemoryGameLeaderboard,
} from './memoryGameService'

const validMetrics: MemoryGameMetrics = {
  score: 30,
  highestLevel: 2,
  highestNumber: 4,
  stagesCompleted: 4,
  stagesFailed: 0,
  mistakes: 0,
  accuracy: 100,
  averageReactionTimeMs: 850,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('memoryGameService — sessions', () => {
  it('starts a session through the repository', async () => {
    vi.mocked(repo.startMemoryGameSessionRpc).mockResolvedValue('session-123')
    await expect(startMemoryGameSession()).resolves.toBe('session-123')
    expect(repo.startMemoryGameSessionRpc).toHaveBeenCalledWith('number_memory_rush')
  })
})

describe('memoryGameService — submission', () => {
  it('submits validated metrics and normalises the result', async () => {
    vi.mocked(repo.submitMemoryGameScoreRpc).mockResolvedValue({
      accepted: true,
      duplicate: false,
      score: 30,
    })

    const result = await submitMemoryGameResult({
      sessionId: 'session-123',
      gameId: 'number_memory_rush',
      metrics: validMetrics,
    })

    expect(result).toEqual({ accepted: true, duplicate: false, score: 30 })
    expect(repo.submitMemoryGameScoreRpc).toHaveBeenCalledWith({
      sessionId: 'session-123',
      gameId: 'number_memory_rush',
      metrics: validMetrics,
    })
  })

  it('refuses an impossible score before reaching the network', async () => {
    await expect(
      submitMemoryGameResult({
        sessionId: 'session-123',
        gameId: 'number_memory_rush',
        metrics: { ...validMetrics, score: 65 },
      }),
    ).rejects.toThrow(/maximum/i)
    expect(repo.submitMemoryGameScoreRpc).not.toHaveBeenCalled()
  })

  it('throws when the server does not accept the run', async () => {
    vi.mocked(repo.submitMemoryGameScoreRpc).mockResolvedValue({
      accepted: false,
      duplicate: false,
      score: 0,
    })
    await expect(
      submitMemoryGameResult({
        sessionId: 'session-123',
        gameId: 'number_memory_rush',
        metrics: validMetrics,
      }),
    ).rejects.toThrow(/not accepted/i)
  })

  it('reports a duplicate replay without erroring', async () => {
    vi.mocked(repo.submitMemoryGameScoreRpc).mockResolvedValue({
      accepted: true,
      duplicate: true,
      score: 30,
    })
    const result = await submitMemoryGameResult({
      sessionId: 'session-123',
      gameId: 'number_memory_rush',
      metrics: validMetrics,
    })
    expect(result.duplicate).toBe(true)
  })
})

describe('memoryGameService — reads', () => {
  it('maps leaderboard rows to the display model', async () => {
    vi.mocked(repo.fetchMemoryGameLeaderboardRpc).mockResolvedValue([
      {
        rank: 1,
        user_id: 'u1',
        user_name: 'Asha',
        score: 120,
        highest_level: 5,
        highest_number: 7,
        stages_completed: 4,
        accuracy: 96.5,
        completed_at: '2026-09-20T10:00:00Z',
      },
      {
        rank: 2,
        user_id: 'u2',
        user_name: '   ',
        score: '60',
        highest_level: 3,
        highest_number: '5',
        stages_completed: '2',
        accuracy: '90',
        completed_at: '2026-09-20T09:00:00Z',
      },
    ])

    const entries = await fetchMemoryGameLeaderboard()

    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({
      rank: 1,
      userId: 'u1',
      displayName: 'Asha',
      score: 120,
      highestLevel: 5,
      highestNumber: 7,
    })
    expect(entries[1].displayName).toBe('Anonymous Student')
    expect(entries[1].score).toBe(60)
  })

  it('returns an empty list for a null payload', async () => {
    vi.mocked(repo.fetchMemoryGameLeaderboardRpc).mockResolvedValue(
      null as unknown as never,
    )
    await expect(fetchMemoryGameLeaderboard()).resolves.toEqual([])
  })

  it('returns null when the user has no personal best yet', async () => {
    vi.mocked(repo.fetchMemoryGamePersonalBestRpc).mockResolvedValue(null)
    await expect(fetchMemoryGamePersonalBest()).resolves.toBeNull()
  })

  it('maps a personal best row', async () => {
    vi.mocked(repo.fetchMemoryGamePersonalBestRpc).mockResolvedValue({
      score: 90,
      highest_level: 4,
      highest_number: 6,
      stages_completed: 4,
      accuracy: 88.25,
      completed_at: '2026-09-20T10:00:00Z',
    })
    await expect(fetchMemoryGamePersonalBest()).resolves.toEqual({
      score: 90,
      highestLevel: 4,
      highestNumber: 6,
      stagesCompleted: 4,
      accuracy: 88.25,
      completedAt: '2026-09-20T10:00:00Z',
    })
  })
})

describe('memoryGameService — realtime', () => {
  it('delegates subscription and returns the unsubscribe function', () => {
    const unsubscribe = vi.fn()
    vi.mocked(repo.subscribeToMemoryGameScores).mockReturnValue(unsubscribe)
    const onChange = vi.fn()
    const onStatus = vi.fn()

    const result = subscribeToMemoryGameLeaderboard(onChange, onStatus)

    expect(repo.subscribeToMemoryGameScores).toHaveBeenCalledWith(
      onChange,
      onStatus,
      'number_memory_rush',
    )
    expect(result).toBe(unsubscribe)
  })
})
