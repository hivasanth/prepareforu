/**
 * Memory Games domain types (Number Memory Rush, Visual Memory Matrix, Schulte
 * Trail and Tile Matching).
 *
 * All game state is externalised here so the engine, the UI and the service
 * layer share one contract. The persisted result is deliberately parsed down to
 * leaderboard-safe fields — internal identifiers (user id, session id, row id)
 * are never part of a display model.
 */

/** Canonical game identifier. Extend the union when new memory games ship. */
export type MemoryGameId =
  | 'number_memory_rush'
  | 'visual_memory_matrix'
  | 'tile_matching'
  | 'schulte_trail'

/**
 * Canonical game state machine. Every transition is driven by the reducer in
 * `src/utils/memoryGameLogic.ts`; UI branches on this instead of scattered
 * booleans.
 */
export type MemoryGameStatus =
  | 'idle'
  | 'showingNumbers'
  | 'recalling'
  | 'stageComplete'
  | 'stageFailed'
  | 'levelComplete'
  | 'gameComplete'
  | 'submittingScore'
  | 'submissionSuccess'
  | 'submissionError'

/** The two gameplay sub-phases of an active stage. */
export type MemoryStagePhase = 'show' | 'recall'

/**
 * Shared view-state contract consumed by the game shell (GameStatusBar,
 * PlaygroundStatus, statusMessage, MemoryGameResultScreen). Both game engines
 * produce states that conform to this surface so the shell is written exactly
 * once; the engines themselves stay separate reducers with their own rules.
 */
export interface MemoryRunViewState {
  status: MemoryGameStatus
  level: number
  stage: number
  /** Primary metric of the current level: numbers (Rush) or pattern targets (Matrix). */
  numbers: number
  gridSize: number
  phase: MemoryStagePhase
  score: number
  lives: number
  stageTimerSeconds: number
  correctCell: number | null
  wrongCell: number | null
  lastStagePoints: number
  lastLevelBonus: number
  lastFailureReason: 'wrongNumber' | 'emptyTile' | 'timeout' | null
  gameOverReason: 'lives' | 'finished' | 'completed' | null
  stagesCompleted: number
  correctSelections: number
  /** Wrong picks in the CURRENT run (folded into accuracy by `buildMetrics`). */
  mistakes: number
  /** Next expected picks (numbers: next number; pattern: found + 1). */
  expected: number
  sessionId: string | null
  sessionLoading: boolean
  announcement: string
  submissionError: string | null
}

/** Canonical score payload — the ONLY shape that may reach the leaderboard. */
export interface MemoryGameMetrics {
  score: number
  highestLevel: number
  highestNumber: number
  stagesCompleted: number
  stagesFailed: number
  mistakes: number
  accuracy: number
  averageReactionTimeMs: number
}

/** Request shape for the authoritative submit RPC. */
export interface SubmitMemoryGameInput {
  sessionId: string
  gameId: MemoryGameId
  metrics: MemoryGameMetrics
}

export interface MemoryScoreSubmissionResult {
  accepted: boolean
  duplicate: boolean
  score: number
}

/** Display model for a single leaderboard row (safe public fields only). */
export interface MemoryLeaderboardEntry {
  rank: number
  /** Used solely to highlight the signed-in user's own row — never rendered. */
  userId: string
  displayName: string
  score: number
  highestLevel: number
  highestNumber: number
  stagesCompleted: number
  accuracy: number
  completedAt: string
}

/** Display model for the signed-in user's personal best. */
export interface MemoryPersonalBest {
  score: number
  highestLevel: number
  highestNumber: number
  stagesCompleted: number
  accuracy: number
  completedAt: string
}

/** Runtime shape returned by `get_memory_game_leaderboard`. */
export interface MemoryLeaderboardRow extends Record<string, unknown> {
  rank?: number
}

/** Runtime shape returned by `get_memory_game_personal_best`. */
export interface MemoryPersonalBestRow extends Record<string, unknown> {
  score?: number
}
