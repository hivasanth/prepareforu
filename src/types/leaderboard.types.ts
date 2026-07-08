export interface LeaderboardEntry {
  user_id: string
  user_name: string
  exam_id: string
  exam_selection: string
  paper_id?: string | null
  best_score: number
  best_accuracy: number
  best_time_secs: number
  last_attempt_date: string
  total_attempts: number
  rank?: number
}
