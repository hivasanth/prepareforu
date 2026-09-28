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
  total_marks: number
  duration_minutes: number
  created_at: string
}

export interface SubAdminDashboardData {
  stats: SubAdminDashboardStats | null
  recentExams: SubAdminRecentExams[]
}
