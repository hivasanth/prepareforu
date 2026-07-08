export type UserRole = 'user' | 'admin' | 'sub_admin'

export type ExamSelection = string

export interface UserProfile {
  id:                string
  email:             string
  full_name:         string
  role:              UserRole
  exam_selection:    ExamSelection | null
  coupon_code:       string | null
  coupon_code_used:  boolean
  sub_admin_id:      string | null
  educator_id:       string | null
  streak:            number
  longest_streak:    number
  total_exams:       number
  overall_accuracy:  number
  is_active:         boolean
  email_verified:    boolean
  provider:          string | null
  created_at:        string
  updated_at:        string
}

export type ServiceErrorSource = 'auth' | 'db' | 'network' | 'unknown'
export type ServiceErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMIT'
  | 'NETWORK'
  | 'NETWORK_ERROR'
  | 'SESSION_EXPIRED'
  | 'EMAIL_NOT_VERIFIED'
  | 'USER_NOT_FOUND'
  | 'UPDATE_FAILED'
  | 'DELETE_FAILED'
  | 'SECURITY_ERROR'
  | 'TIMEOUT'
  | 'SIGNUP_TIMEOUT'
  | 'COUPON_TIMEOUT'
  | 'CHECK_USER_TIMEOUT'
  | 'ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'LOCK_ERROR'
  | 'ACCOUNT_LOCKED'
  | 'MISSING_DATA'
  | 'INVALID_COUPON'
  | 'UNKNOWN'

export interface AuthError {
  source:  ServiceErrorSource
  code:    ServiceErrorCode
  field?:  'email' | 'password' | 'confirmPassword' | 'fullName' | 'general'
  message: string
}

export interface ServiceResult<T = any> {
  success: boolean
  data?:   T | null
  error?:  AuthError
  meta?:   Record<string, unknown>
}

export type ExamType = ExamSelection

export interface AuthState {
  user: UserProfile | null
  loading: boolean
}

export interface CouponResult {
  valid:         boolean
  subAdminName?: string
  error?:        string
}
