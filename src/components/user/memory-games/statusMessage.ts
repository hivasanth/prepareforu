import {
  NUMBER_MEMORY_RUSH_STATUS_COPY,
  type MemoryRunStatusCopy,
} from '../../../config/memoryGames'
import type { MemoryRunViewState } from '../../../types/memoryGame.types'

/** Per-failure copy for the visual status line (keeps the lives count). */
export function failureLabel(reason: MemoryRunViewState['lastFailureReason']): string {
  switch (reason) {
    case 'emptyTile':
      return 'Incorrect tile'
    case 'timeout':
      return 'Time expired'
    default:
      return 'Wrong number'
  }
}

/**
 * Live status copy for the in-run status line, shared by the playgrounds of
 * all memory games. Wording that differs per game (numbers vs pattern vs ink)
 * is provided by `copy`; the end/submission states read identically and stay
 * here.
 */
export function statusMessage(
  state: MemoryRunViewState,
  copy: MemoryRunStatusCopy = NUMBER_MEMORY_RUSH_STATUS_COPY,
): string {
  switch (state.status) {
    case 'idle':
      return copy.idle
    case 'showingNumbers':
      return copy.showingNumbers
    case 'recalling':
      return copy.recalling({ expected: state.expected, numbers: state.numbers })
    case 'stageComplete':
      return copy.stageComplete(state.lastStagePoints)
    case 'levelComplete':
      return copy.levelComplete(state.level, state.lastLevelBonus)
    case 'stageFailed':
      return copy.stageFailed(
        copy.failureLabel ? copy.failureLabel(state.lastFailureReason) : failureLabel(state.lastFailureReason),
        state.lives,
      )
    case 'gameComplete':
      return copy.gameComplete
    case 'submittingScore':
      return 'Saving your score…'
    case 'submissionSuccess':
      return 'Score saved to the leaderboard.'
    case 'submissionError':
      return state.submissionError ?? 'Could not save your score.'
    default:
      return ''
  }
}