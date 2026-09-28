/**
 * ─── Shared Memory Run engine ───────────────────────────────────────────────
 *
 * The ONE React adapter for ALL memory games (Number Memory Rush, Visual
 * Memory Matrix, Schulte Trail and Tile Matching). It owns the recall
 * countdown, stage auto-advance / retry transitions, transient tile feedback,
 * sound cues and the authoritative session + score submission — exactly the
 * concerns that were originally embedded in `useMemoryGame`. Each game supplies
 * its own pure reducer, stage planner and metrics builder via
 * `MemoryRunEngineConfig`, so rules stay in the reducers while
 * timers/sound/submission are written exactly once.
 *
 * `USE_MEMORY_RUN_ENGINE_IMPLEMENTED_OBSOLETE` is deliberately absent from this
 * module: the original single-game implementation was refactored INTO this one
 * rather than duplicated.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import {
  startMemoryGameSession,
  submitMemoryGameResult,
} from '../services/memoryGameService'
import type {
  MemoryGameId,
  MemoryGameMetrics,
  MemoryRunViewState,
} from '../types/memoryGame.types'
import { isStageActive } from '../utils/memoryGameLogic'

/** Opt-in sound cue channels shared by both games. */
export type MemorySoundCue =
  | 'reveal'
  | 'correct'
  | 'wrong'
  | 'stage'
  | 'level'
  | 'complete'
  | 'countdown'
  | 'countCritical'
  | 'timeUp'

/** Feedback dwell times before the board auto-advances / retries. */
export const STAGE_TRANSITION_MS = 900
export const RETRY_TRANSITION_MS = 1200

/** The action subset every memory-run reducer must handle identically. */
export type MemoryRunSharedAction =
  | { type: 'START_GAME'; positions: number[]; now: number }
  | { type: 'SET_SESSION'; sessionId: string | null; loading: boolean }
  | { type: 'ADVANCE_STAGE'; positions: number[] }
  | { type: 'RETRY_STAGE'; positions: number[] }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'LIVES_EXHAUSTED' }
  | { type: 'CLEAR_FEEDBACK' }
  | { type: 'FINISH_GAME' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; message: string }
  | { type: 'RESET' }

export interface MemoryRunStageDescriptor {
  level: number
  stage: number
  numbers: number
  gridSize: number
  stagesRequired: number
}

/** How a game resolves progression + boards (differs per engine, stable fns). */
export interface MemoryRunPlanner {
  getStageDescriptor: (level: number, stage: number) => MemoryRunStageDescriptor
  createStagePositions: (numbers: number, gridSize: number) => number[]
  /**
   * Optional: games that need the LEVEL + STAGE to build randomness (rather
   * than only numbers/gridSize) supply this instead; when present it takes
   * precedence over `createStagePositions`.
   */
  createStagePositionsFromDescriptor?: (descriptor: MemoryRunStageDescriptor) => number[]
  getMaxLevel: () => number
}

export interface MemoryRunEngineConfig<
  S extends MemoryRunViewState,
  // `A` is the game's OWN action union: it must cover every shared action at
  // runtime (all games handle them), and may add game-specific ones
  // (SELECT_TILE / PREVIEW_END). `MemoryRunSharedAction` documents the minimum.
  A,
> {
  initialState: () => S
  reduce: (state: S, action: A) => S
  planner: MemoryRunPlanner
  buildMetrics: (state: S) => MemoryGameMetrics
  gameId: MemoryGameId
  /**
   * Countdown clock tuning. Defaults (tick 1000ms / step 1s) reproduce the
   * classic per-second games. Games that need sub-second decay (e.g. a
   * streak-based timer) tick more often in fractional steps.
   */
  countdownTickMs?: number
  countdownStepSeconds?: number
  /**
   * How long a transient correct/wrong highlight stays before the reducer
   * clears it (default 450ms). Hotter streak caps decay smoothly. Games whose
   * own mistake momentum is longer — Tile Matching reveals the mismatched pair
   * (reuses the shared RETRY_TRANSITION_MS grasp) — pass their dwell here
   * instead of re-implementing the feedback timer.
   */
  feedbackDwellMs?: number
}

export interface MemoryRunEngineOptions {
  /** Called after a score is accepted so the leaderboard can refresh. */
  onSubmitted?: () => void
  /** Optional sound cue sink (no-op when the user has sound disabled). */
  onSound?: (cue: MemorySoundCue) => void
}

export interface MemoryRunEngineReturn<
  S extends MemoryRunViewState,
  // Same game action union as the config — the engine returns the raw dispatch
  // so each game can wire its own selector gestures.
  A,
> {
  state: S
  metrics: MemoryGameMetrics
  /** Seconds left on the current recall timer (0 when no timer is running). */
  timeRemaining: number
  /** The game's own reducer dispatch (selector actions like SELECT_TILE). */
  dispatch: Dispatch<A>
  startGame: () => void
  finishGame: () => void
  resetGame: () => void
  retrySubmit: () => void
}

/**
 * Composes the shared timers + submission around a game-specific reducer. All
 * rules live in the reducer (`config.reduce`); the engine never knows about
 * numbers vs patterns.
 */
export function useMemoryRunEngine<
  S extends MemoryRunViewState,
  // See MemoryRunEngineConfig — same rationale.
  A,
>(
  config: MemoryRunEngineConfig<S, A>,
  options: MemoryRunEngineOptions = {},
): MemoryRunEngineReturn<S, A> {
  const {
    initialState,
    reduce,
    planner,
    buildMetrics,
    gameId,
    countdownTickMs = 1000,
    countdownStepSeconds = 1,
  } = config
  const feedbackDwellMsRef = useRef(config.feedbackDwellMs ?? 450)
  feedbackDwellMsRef.current = config.feedbackDwellMs ?? 450
  const [state, dispatch] = useReducer(reduce, undefined, initialState)
  const [timeRemaining, setTimeRemaining] = useState(0)

  const optionsRef = useRef(options)
  optionsRef.current = options

  const stateRef = useRef(state)
  stateRef.current = state

  // Planner functions are module-stable, but keep them in a ref so the object
  // identity never churns the timers below.
  const plannerRef = useRef(planner)
  plannerRef.current = planner

  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const submittedSessionRef = useRef<string | null>(null)
  const submittingRef = useRef(false)

  // Sub-second streak timers (games with streak-capped clocks) need to survive
  // a stageTimer cap shrink on a correct round WITHOUT resetting:
  // `countdownRunningRef` tracks "a countdown is live" and
  // `countdownRemainingRef` the live value, so the effect below clamps instead
  // of restarting the clock mid-stage.
  const countdownRunningRef = useRef(false)
  const countdownRemainingRef = useRef(0)

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current)
      transitionTimer.current = null
    }
  }, [])

  const clearCountdown = useCallback(() => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current)
      countdownTimer.current = null
    }
  }, [])

  /**
   * Resolve the next stage's stimulus. Games that key randomness off the
   * LEVEL + STAGE (rather than just numbers/gridSize) implement
   * `createStagePositionsFromDescriptor`; everything else uses the plain
   * numbers/gridSize path. One place to keep both call sites consistent.
   */
  const resolveStagePositions = useCallback(
    (descriptor: MemoryRunStageDescriptor): number[] =>
      plannerRef.current.createStagePositionsFromDescriptor?.(descriptor) ??
      plannerRef.current.createStagePositions(descriptor.numbers, descriptor.gridSize),
    [],
  )

  // ── Recall countdown: runs ONLY while the player is recalling (after the
  //    preview has ended for Matrix / after the reveal tap for Rush / for the
  //    whole stage for whole-board games like Schulte Trail and Tile Matching).
  //    Starts at the stage's configured budget, ticks once per countdownStepSeconds,
  //    and fails the stage on 0. Cleared on success/failure/over/unmount — never
  //    two timers.
  //
  //    Sub-second cap games never reset the clock inside a stage: a correct
  //    answer shrinks `stageTimerSeconds` only, so the effect re-runs and CLAMPS
  //    the running value to the new cap instead of restarting it (the effect body
  //    never flips `countdownRunningRef` back to false on re-runs; that only
  //    happens when recall actually stops).
  const activeRecall = isStageActive(state.status) && state.phase === 'recall'
  useEffect(() => {
    clearCountdown()
    if (!activeRecall) {
      countdownRunningRef.current = false
      countdownRemainingRef.current = 0
      setTimeRemaining(0)
      return
    }
    if (countdownRunningRef.current) {
      countdownRemainingRef.current = Math.min(
        countdownRemainingRef.current,
        state.stageTimerSeconds,
      )
    } else {
      countdownRunningRef.current = true
      countdownRemainingRef.current = state.stageTimerSeconds
    }
    setTimeRemaining(countdownRemainingRef.current)
    countdownTimer.current = setInterval(() => {
      countdownRemainingRef.current = Math.max(
        0,
        countdownRemainingRef.current - countdownStepSeconds,
      )
      setTimeRemaining(countdownRemainingRef.current)
      if (countdownRemainingRef.current <= 0) {
        countdownRunningRef.current = false
        clearCountdown()
        dispatch({ type: 'TIMER_EXPIRED' } as A)
      }
    }, countdownTickMs)
    return clearCountdown
  }, [
    activeRecall,
    state.stageTimerSeconds,
    countdownTickMs,
    countdownStepSeconds,
    clearCountdown,
    dispatch,
  ])

  // ── Auto-advance / retry after a stage resolves ──────────────────────────
  useEffect(() => {
    clearTransitionTimer()
    const current = stateRef.current
    if (current.status === 'stageComplete' || current.status === 'levelComplete') {
      transitionTimer.current = setTimeout(() => {
        const snapshot = stateRef.current
        let positions: number[] = []
        if (snapshot.status === 'levelComplete') {
          if (snapshot.level < plannerRef.current.getMaxLevel()) {
            const next = plannerRef.current.getStageDescriptor(snapshot.level + 1, 1)
            positions = resolveStagePositions(next)
          }
        } else if (snapshot.status === 'stageComplete') {
          const next = plannerRef.current.getStageDescriptor(snapshot.level, snapshot.stage + 1)
          positions = resolveStagePositions(next)
        }
        dispatch({ type: 'ADVANCE_STAGE', positions } as A)
      }, STAGE_TRANSITION_MS)
    } else if (current.status === 'stageFailed') {
      transitionTimer.current = setTimeout(() => {
        const snapshot = stateRef.current
        if (snapshot.status !== 'stageFailed') return
        // No lives left → the run is over instead of a retry.
        if (snapshot.lives <= 0) {
          dispatch({ type: 'LIVES_EXHAUSTED' } as A)
          return
        }
        const descriptor = plannerRef.current.getStageDescriptor(snapshot.level, snapshot.stage)
        const positions = resolveStagePositions(descriptor)
        dispatch({ type: 'RETRY_STAGE', positions } as A)
      }, RETRY_TRANSITION_MS)
    }
    return clearTransitionTimer
  }, [state.status, clearTransitionTimer, dispatch, resolveStagePositions])

  // ── Transient tile feedback clears itself ────────────────────────────────
  useEffect(() => {
    if (state.correctCell === null && state.wrongCell === null) return
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(
      () => dispatch({ type: 'CLEAR_FEEDBACK' } as A),
      feedbackDwellMsRef.current,
    )
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    }
  }, [state.correctCell, state.wrongCell, dispatch])

  // ── Sound cues (only on real transitions) ────────────────────────────────
  const prevPhase = useRef(state.phase)
  const prevSelections = useRef(state.correctSelections)
  // Tile Matching (and any future game) loses a life on a wrong match while the
  // stage KEEPS RUNNING — the classic `stageFailed` branch below never fires for
  // it, so a separate `mistakes` counter guards its 'wrong' cue too.
  const prevMistakes = useRef(state.mistakes)
  useEffect(() => {
    const sound = optionsRef.current.onSound
    if (!sound) {
      prevPhase.current = state.phase
      prevSelections.current = state.correctSelections
      prevMistakes.current = state.mistakes
      return
    }
    if (state.phase === 'recall' && prevPhase.current === 'show') sound('reveal')
    if (state.correctSelections > prevSelections.current) sound('correct')
    if (state.mistakes > prevMistakes.current && state.status !== 'stageFailed') sound('wrong')
    if (state.status === 'stageComplete') sound('stage')
    if (state.status === 'levelComplete') sound('level')
    if (state.status === 'stageFailed' && state.lastFailureReason !== 'timeout') sound('wrong')
    if (state.status === 'gameComplete') sound('complete')
    prevPhase.current = state.phase
    prevSelections.current = state.correctSelections
    prevMistakes.current = state.mistakes
  }, [state.phase, state.correctSelections, state.mistakes, state.status, state.lastFailureReason])

  // ── Recall countdown cues: 3s/2s tick, 1s critical, 0 = time up ─────────
  useEffect(() => {
    const sound = optionsRef.current.onSound
    if (!sound) return
    if (state.phase === 'recall' && isStageActive(state.status)) {
      if (timeRemaining === 3 || timeRemaining === 2) sound('countdown')
      if (timeRemaining === 1) sound('countCritical')
    }
    if (state.status === 'stageFailed' && state.lastFailureReason === 'timeout') {
      sound('timeUp')
    }
  }, [state.phase, state.status, state.lastFailureReason, timeRemaining])

  // ── Submission ───────────────────────────────────────────────────────────
  const runSubmission = useCallback(async () => {
    const snapshot = stateRef.current
    if (submittingRef.current) return
    if (snapshot.stagesCompleted <= 0) return

    submittingRef.current = true
    dispatch({ type: 'SUBMIT_START' } as A)
    try {
      let sessionId = snapshot.sessionId
      if (!sessionId) {
        sessionId = await startMemoryGameSession(gameId)
        dispatch({ type: 'SET_SESSION', sessionId, loading: false } as A)
      }
      const metrics = buildMetrics(stateRef.current)
      await submitMemoryGameResult({
        sessionId,
        gameId,
        metrics,
      })
      submittedSessionRef.current = sessionId
      dispatch({ type: 'SUBMIT_SUCCESS' } as A)
      optionsRef.current.onSubmitted?.()
    } catch (error) {
      dispatch({
        type: 'SUBMIT_ERROR',
        message: error instanceof Error ? error.message : 'Could not save your score.',
      } as A)
    } finally {
      submittingRef.current = false
    }
  }, [gameId, buildMetrics, dispatch])

  useEffect(() => {
    if (state.status !== 'gameComplete') return
    if (state.stagesCompleted <= 0) return
    if (state.sessionId && submittedSessionRef.current === state.sessionId) return
    void runSubmission()
  }, [state.status, state.stagesCompleted, state.sessionId, runSubmission])

  // ── Actions ──────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    clearTransitionTimer()
    submittedSessionRef.current = null
    submittingRef.current = false
    const descriptor = plannerRef.current.getStageDescriptor(1, 1)
    const positions = resolveStagePositions(descriptor)
    dispatch({ type: 'START_GAME', positions, now: Date.now() } as A)
    dispatch({ type: 'SET_SESSION', sessionId: null, loading: true } as A)
    void startMemoryGameSession(gameId)
      .then((sessionId) => dispatch({ type: 'SET_SESSION', sessionId, loading: false } as A))
      .catch(() => dispatch({ type: 'SET_SESSION', sessionId: null, loading: false } as A))
  }, [clearTransitionTimer, gameId, dispatch, resolveStagePositions])

  const finishGame = useCallback(() => {
    clearTransitionTimer()
    clearCountdown()
    dispatch({ type: 'FINISH_GAME' } as A)
  }, [clearTransitionTimer, clearCountdown, dispatch])

  const resetGame = useCallback(() => {
    clearTransitionTimer()
    clearCountdown()
    submittedSessionRef.current = null
    submittingRef.current = false
    dispatch({ type: 'RESET' } as A)
  }, [clearTransitionTimer, clearCountdown, dispatch])

  const retrySubmit = useCallback(() => {
    submittedSessionRef.current = null
    dispatch({ type: 'SUBMIT_START' } as A)
    submittingRef.current = false
    void runSubmission()
  }, [runSubmission, dispatch])

  // Clean up timers on unmount.
  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current)
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
      clearCountdown()
    },
    [clearCountdown],
  )

  const metrics = useMemo(() => buildMetrics(state), [state, buildMetrics])

  return { state, metrics, timeRemaining, dispatch, startGame, finishGame, resetGame, retrySubmit }
}