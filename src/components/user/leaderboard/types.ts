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
