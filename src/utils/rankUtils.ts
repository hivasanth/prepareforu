import type { LeaderboardEntry } from '../types/leaderboard.types';

export type { LeaderboardEntry };

export const APPSC_GROUPS = ['APPSC_GROUP_1', 'APPSC_GROUP_2', 'APPSC_GROUP_3', 'APPSC_GROUP_4'];

export function assignRanks(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  let currentRank = 1;
  return entries.map((entry, index) => {
    if (index > 0) {
      const prev = entries[index - 1];
      const isTie =
        prev.best_score === entry.best_score &&
        prev.best_accuracy === entry.best_accuracy &&
        prev.best_time_secs === entry.best_time_secs;
      if (!isTie) {
        currentRank = index + 1;
      }
    }
    return { ...entry, rank: currentRank };
  });
}
