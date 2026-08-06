export interface SubAdminDashboardStats {
  totalExams: number
  activeExams: number
  totalStudents: number
  totalAttempts: number
}

export interface SubAdminRecentExams {
  id: string
  title: string
  status: string
  total_questions: number
  duration_minutes: number
  created_at: string
}

export interface SubAdminRecentAttempt {
  id: string
  score: number
  created_at: string
  users?: {
    full_name?: string
  }
}

export interface SubAdminDashboardData {
  stats: SubAdminDashboardStats | null
  recentExams: SubAdminRecentExams[]
  recentAttempts: SubAdminRecentAttempt[]
}
