import { useCallback, useEffect, useRef, useState } from 'react'
import { useStableFetch } from './useStableFetch'
import { usePageError } from './usePageError'
import {
  fetchMemoryGameLeaderboard,
  fetchMemoryGamePersonalBest,
  subscribeToMemoryGameLeaderboard,
  MEMORY_LEADERBOARD_TOP_LIMIT,
  MEMORY_GAME_ID,
  type MemoryScoreInsertPayload,
} from '../services/memoryGameService'
import { isWithinToday, formatTodayLabel } from '../utils/timeUtils'
import type {
  MemoryGameId,
  MemoryLeaderboardEntry,
  MemoryPersonalBest,
} from '../types/memoryGame.types'

/** Coalesce bursts of realtime inserts into a single refetch. */
const REALTIME_DEBOUNCE_MS = 400

export interface UseMemoryGameLeaderboardOptions {
  /**
   * Which title's leaderboard scope this hook serves. Filters both the RPC
   * reads AND the realtime channel, so a Number Memory Rush page never sees a
   * Visual Memory Matrix score. Default `number_memory_rush`.
   */
  gameId?: MemoryGameId
  /**
   * Mount-level gate. When false the hook is inert: no fetch, no realtime
   * subscription, and any previously loaded data is retained. Views should tie
   * this to visibility (e.g. a dialog's open state) so the subscription exists
   * only while the board is on screen. Default true.
   */
  active?: boolean
  /**
   * Auth gate. Callers pass `user && !authLoading` so the hook never fires an
   * RPC while the session is still bootstrapping (avoids burst "Not
   * authenticated" failures). When false the hook waits and starts once both
   * gates turn true. Default true.
   */
  userReady?: boolean
}

export interface UseMemoryGameLeaderboardReturn {
  leaderboard: MemoryLeaderboardEntry[]
  personalBest: MemoryPersonalBest | null
  loading: boolean
  realtimeAvailable: boolean
  errorState: ReturnType<typeof usePageError>['state']
  pageError: ReturnType<typeof usePageError>['error']
  retryError: () => void
  refresh: () => void
  topLimit: number
  /** "Today" label for the daily leaderboard scope (UTC day, server parity). */
  dayLabel: string
}

/**
 * Loads today's live leaderboard + the user's personal best and keeps the board
 * fresh through a single realtime subscription while active. Falls back to the
 * last known state with `realtimeAvailable=false` when the channel drops —
 * never a polling loop.
 */
export function useMemoryGameLeaderboard(
  { gameId = MEMORY_GAME_ID, active = true, userReady = true }: UseMemoryGameLeaderboardOptions = {},
): UseMemoryGameLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<MemoryLeaderboardEntry[]>([])
  const [personalBest, setPersonalBest] = useState<MemoryPersonalBest | null>(null)
  const [loading, setLoading] = useState(false)
  const [realtimeAvailable, setRealtimeAvailable] = useState(true)

  const { state: errorState, error: pageError, captureError, retry: retryError, reset } =
    usePageError()
  const { nextId, isStale } = useStableFetch()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  const enabled = active && userReady

  const load = useCallback(
    async (silent = false): Promise<boolean> => {
      const id = nextId()
      if (!silent) {
        setLoading(true)
        reset()
      }
      try {
        const [entries, best] = await Promise.all([
          fetchMemoryGameLeaderboard(gameId, MEMORY_LEADERBOARD_TOP_LIMIT),
          fetchMemoryGamePersonalBest(gameId),
        ])
        if (isStale(id)) return false
        setLeaderboard(entries)
        setPersonalBest(best)
        return true
      } catch (error) {
        if (isStale(id)) return false
        if (!silent) captureError(error, { retryFn: () => load(false) })
        return false
      } finally {
        if (!isStale(id) && !silent) setLoading(false)
      }
    },
    [gameId, nextId, isStale, captureError, reset],
  )

  // Load once, and again whenever the gates flip back on (e.g. dialog reopen).
  useEffect(() => {
    if (!enabled) return
    void load(false)
  }, [enabled, load])

  // One managed subscription while active — only re-reading the RPC when a new
  // score lands inside today's UTC window, debounced, no polling loop.
  useEffect(() => {
    if (!enabled) return
    const scheduleRefresh = (payload: MemoryScoreInsertPayload | null) => {
      // Server-filtered to this game already; keep the UTC-day gate as the
      // single "today only" authority for the daily board.
      if (!isWithinToday(payload?.completed_at)) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        void load(true)
      }, REALTIME_DEBOUNCE_MS)
    }
    const unsubscribe = subscribeToMemoryGameLeaderboard(scheduleRefresh, setRealtimeAvailable, gameId)
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      unsubscribe()
    }
  }, [enabled, load, gameId])

  const refresh = useCallback(() => {
    if (!enabled) return
    void load(true)
  }, [enabled, load])

  return {
    leaderboard,
    personalBest,
    loading,
    realtimeAvailable,
    errorState,
    pageError,
    retryError,
    refresh,
    topLimit: MEMORY_LEADERBOARD_TOP_LIMIT,
    dayLabel: formatTodayLabel(new Date()),
  }
}