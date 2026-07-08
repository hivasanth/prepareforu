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
  streak: number | null
  total_exams: number | null
}
