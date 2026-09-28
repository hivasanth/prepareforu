import { memo } from 'react'
import { getMemoryAchievement } from '../../../config/memoryGames'
import type { MemoryRunViewState } from '../../../types/memoryGame.types'
import type { MemoryGameMetrics, MemoryPersonalBest } from '../../../types/memoryGame.types'

interface MemoryGameResultScreenProps {
  state: MemoryRunViewState
  metrics: MemoryGameMetrics
  best: MemoryPersonalBest | null
  /** "Highest Number" vs "Pattern Size" — the per-game highest-metric label. */
  highestMetricLabel?: string
  onPlayAgain: () => void
  onBack: () => void
  onRetrySubmit: () => void
}

function formatReaction(ms: number): string {
  if (ms <= 0) return '—'
  return `${(ms / 1000).toFixed(1)}s`
}

function SubmissionStatus({
  state,
  onRetrySubmit,
}: {
  state: MemoryRunViewState
  onRetrySubmit: () => void
}) {
  if (state.status === 'submittingScore') {
    return (
      <p className="nmr-submit loading" role="status">
        Saving your score…
      </p>
    )
  }
  if (state.status === 'submissionSuccess') {
    return (
      <p className="nmr-submit ok" role="status">
        Score saved to the leaderboard
      </p>
    )
  }
  if (state.status === 'submissionError') {
    return (
      <div className="modal-actions" role="alert">
        <p className="nmr-submit err">{state.submissionError ?? 'Could not save your score.'}</p>
        <button type="button" className="action-btn" onClick={onRetrySubmit}>
          Retry saving
        </button>
      </div>
    )
  }
  if (state.stagesCompleted === 0) {
    return (
      <p className="nmr-submit" role="status">
        Clear at least one stage to appear on the leaderboard.
      </p>
    )
  }
  return null
}

/** Post-run summary rendered as the original glass overlay modal. */
export const MemoryGameResultScreen = memo(function MemoryGameResultScreen({
  state,
  metrics,
  best,
  highestMetricLabel = 'Highest Number',
  onPlayAgain,
  onBack,
  onRetrySubmit,
}: MemoryGameResultScreenProps) {
  const isNewBest = best === null ? metrics.score > 0 : metrics.score > best.score
  const achievement = getMemoryAchievement(metrics.highestLevel)

  const title =
    isNewBest ? 'New Personal Best!' : state.gameOverReason === 'lives' ? 'Game Over' : 'Run Complete'

  const stat = (label: string, value: string | number) => (
    <div className="modal-stat-card" key={label}>
      <span className="label">{label}</span>
      <span className="val">{value}</span>
    </div>
  )

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true" aria-label="Run result">
      <p className={isNewBest ? 'modal-title win' : 'modal-title'}>
        {title}
      </p>
      <span className="rank-badge">{achievement}</span>

      <div className="modal-stats">
        {stat('Final Score', metrics.score)}
        {stat('Best Score', best ? best.score : metrics.score)}
        {stat('Highest Level', metrics.highestLevel)}
        {stat(highestMetricLabel, metrics.highestNumber)}
        {stat('Stages Completed', metrics.stagesCompleted)}
        {stat('Accuracy', `${metrics.accuracy}%`)}
        {stat('Avg Time / Pick', formatReaction(metrics.averageReactionTimeMs))}
        {stat('Mistakes', metrics.mistakes)}
      </div>

      <SubmissionStatus state={state} onRetrySubmit={onRetrySubmit} />

      <div className="modal-actions">
        <button type="button" className="main-btn" onClick={onPlayAgain}>
          Play Again
        </button>
        <button type="button" className="action-btn" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  )
})
