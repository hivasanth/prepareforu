/**
 * Utility functions for leaderboard data processing and ranking calculation.
 */

import type { LeaderboardEntry } from '../types/leaderboard.types'
export type { LeaderboardEntry }

/**
 * Format time in seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Assign ranks with support for duplicate ranks (ties)
 */
export function assignRanks(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  let currentRank = 1
  return entries.map((entry, index) => {
    if (index > 0) {
      const prev = entries[index - 1]
      const isTie = 
        prev.best_score === entry.best_score && 
        prev.best_accuracy === entry.best_accuracy && 
        prev.best_time_secs === entry.best_time_secs
      
      if (!isTie) {
        currentRank = index + 1
      }
    }
    return { ...entry, rank: currentRank }
  })
}

/**
 * Map exam selection keys to their constituent group IDs for APPSC
 */
export const APPSC_GROUPS = ['APPSC_GROUP_1', 'APPSC_GROUP_2', 'APPSC_GROUP_3', 'APPSC_GROUP_4']
