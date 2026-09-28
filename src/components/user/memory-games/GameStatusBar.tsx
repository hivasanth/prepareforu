import { memo, useEffect, useRef, useState } from 'react'
import {
  isStageActive,
} from '../../../utils/memoryGameLogic'
import {
  NUMBER_MEMORY_RUSH_STATUS_COPY,
  STAGES_PER_LEVEL,
  STARTING_LIVES,
  type MemoryRunStatusCopy,
} from '../../../config/memoryGames'
import type { MemoryPersonalBest, MemoryRunViewState } from '../../../types/memoryGame.types'
import { statusMessage } from './statusMessage'

const Stat = memo(function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone: string
}) {
  return (
    <div className="metric-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${tone}`}>{value}</span>
    </div>
  )
})

/** The in-run stats HUD: six core metrics (no timer, no status line). */
export const GameStatusBar = memo(function GameStatusBar({
  state,
  maxLevel,
  maxLives = STARTING_LIVES,
  metricLabel = 'Numbers',
  best = null,
  side = 'all',
}: {
  state: MemoryRunViewState
  maxLevel: number
  /**
   * Max life pool the run renders. Almost every game kills at 0 from exactly
   * `STARTING_LIVES`; Tile Matching keeps active matches above its own cap, so
   * the HUD (hearts + sr label) must reflect that pool rather than assume 5.
   */
  maxLives?: number
  metricLabel?: string
  /**
   * The SAME personal best the result screen consumes (single source of truth —
   * no second best-score state). Metric 6 ("Best") renders its score.
   */
  best?: MemoryPersonalBest | null
  /**
   * Which stat subset to render. The wide desktop layout splits the SAME six
   * metrics into two LAYOUT-ONLY columns (3 LEFT around the play card / 3 RIGHT);
   * every metric renders its OWN independent card, so the HUD is never
   * duplicated — only a column may render one half.
   */
  side?: 'all' | 'left' | 'right'
}) {
  const stagesRequired = STAGES_PER_LEVEL

  const hearts = Array.from({ length: maxLives }, (_, index) => (
    <span key={index} className={index < state.lives ? 'heart on' : 'heart off'} aria-hidden="true">
      {index < state.lives ? '♥' : '♡'}
    </span>
  ))

  const leftStats = (
    <>
      <Stat label={metricLabel} value={state.numbers} tone="tone-cyan" />
      <Stat label="Score" value={state.score} tone="tone-amber" />
      <Stat label="Level" value={`${state.level}/${maxLevel}`} tone="tone-indigo" />
    </>
  )

  const rightStats = (
    <>
      <Stat label="Stage" value={`${state.stage}/${stagesRequired}`} tone="tone-emerald" />
      <div className="metric-card">
        <span className="stat-label">Lives</span>
        <span className="stat-value nmr-hearts" role="img" aria-label={`${state.lives} of ${maxLives} lives remaining`}>
          {hearts}
        </span>
      </div>
      <Stat label="Best" value={best ? best.score : 0} tone="tone-amber" />
    </>
  )

  return (
    <div className="stats-grid">
      {side === 'all' ? (
        <>
          {leftStats}
          {rightStats}
        </>
      ) : side === 'left' ? (
        leftStats
      ) : (
        rightStats
      )}
    </div>
  )
})

/**
 * The playground status cluster: recall timer pill, the sr-only countdown
 * announcements and the live status line. Lives in the PLAYGROUND card so the
 * stats card stays purely numeric.
 */
export const PlaygroundStatus = memo(function PlaygroundStatus({
  state,
  timeRemaining,
  statusCopy = NUMBER_MEMORY_RUSH_STATUS_COPY,
  timerLabel,
}: {
  state: MemoryRunViewState
  timeRemaining: number
  statusCopy?: MemoryRunStatusCopy
  /** Custom timer text formatter (for games with sub-second timers). */
  timerLabel?: (seconds: number) => string
}) {
  const message = statusMessage(state, statusCopy)
  const urgent = state.status === 'stageFailed' || state.status === 'submissionError'
  const highlight = state.status === 'showingNumbers' || state.status === 'recalling'

  const messageClass = ['status-msg', urgent ? 'urgent' : '', highlight ? 'highlight' : '']
    .filter(Boolean)
    .join(' ')

  // timeRemaining > 0 guards the single post-reveal frame where the countdown
  // effect has not yet populated the value (avoids showing a "0s" pill).
  const timing = isStageActive(state.status) && state.phase === 'recall' && timeRemaining > 0
  const ratio = timing && state.stageTimerSeconds > 0 ? timeRemaining / state.stageTimerSeconds : 1
  const timerTone =
    !timing || ratio > 0.5 ? '' : ratio > 0.25 ? 'warn' : 'critical'

  // Screen-reader timer announcements: cue once at recall start, then only the
  // 3-second threshold, and "Time expired." exactly when the timer really runs
  // out (never after a cleared stage, where lastFailureReason is not timeout).
  // Updates are scheduled through a microtask callback so the effect body never
  // calls setState synchronously.
  const prevTiming = useRef(false)
  const [timerAnnouncement, setTimerAnnouncement] = useState('')
  useEffect(() => {
    if (!timing) {
      if (prevTiming.current && state.lastFailureReason === 'timeout') {
        queueMicrotask(() => setTimerAnnouncement('Time expired.'))
      }
      prevTiming.current = false
      return
    }
    if (!prevTiming.current) {
      prevTiming.current = true
      queueMicrotask(() => setTimerAnnouncement('Recall timer started.'))
      return
    }
    if (timeRemaining === 3) {
      queueMicrotask(() => setTimerAnnouncement('Three seconds remaining.'))
    }
  }, [timing, timeRemaining, state.lastFailureReason])

  return (
    <>
      <div className="nmr-hud-timer" hidden={!timing}>
        <span className={`nmr-timer ${timerTone}`.trim()} aria-hidden="true">
          ⏱ {timerLabel ? timerLabel(timeRemaining) : `${timeRemaining}s`}
        </span>
      </div>

      <span className="sr-only" role="status">
        {timerAnnouncement}
      </span>

      <p className={messageClass} role="status" aria-live="polite">
        {message}
      </p>
    </>
  )
})