// Re-export everything from the canonical auth.types.ts for backward compat.
// Existing files that import from 'user.types' continue to work unchanged.
export type {
  UserRole,
  ExamType,
  ExamSelection,
  UserProfile,
  AuthState,
  AuthError,
} from './auth.types';

export interface UserRow {
  id: string
  full_name: string | null
  email: string | null
  exam_selection: string | null
  is_active: boolean
  created_at: string
  exams_taken: number | null
  daily_streak: number | null
  highest_streak: number | null
}

export interface EducatorStudentRow {
  id: string
  full_name: string | null
  email: string | null
  coupon_code: string | null
  educator_id: string
  created_at: string
}
