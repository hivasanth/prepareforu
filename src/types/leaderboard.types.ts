// Canonical user-panel leaderboard result (server-ranked, safe public fields only).
export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  score: number;
  accuracy: number;
  rank: number;
  duration_seconds?: number;
  submitted_at?: string;
}

export interface LeaderboardMetadata {
  exams: { id: string; name: string }[];
  papers: { id: string; exam_id: string; name: string }[];
}

export type TimeRange = '30d' | '7d' | 'today';

// Admin leaderboard view model is fundamentally different (per exam/paper aggregates
// with exam_selection + attempt counts). Keep it clearly named and separate.
export interface AdminLeaderboardEntry {
  user_id: string;
  user_name: string;
  exam_id: string;
  exam_selection: string;
  paper_id?: string | null;
  best_score: number;
  best_accuracy: number;
  best_time_secs: number;
  last_attempt_date: string;
  total_attempts: number;
  rank?: number;
}
