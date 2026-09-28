import type { ErrorCode } from './error.types'

export type UserRole = 'user' | 'admin' | 'sub_admin' | 'deactivated_sub_admin'

export type ExamSelection = string

export interface UserProfile {
  id:                string
  email:             string
  full_name:         string
  role:              UserRole
  exam_selection:    ExamSelection | null
  sub_admin_id:      string | null
  educator_id:       string | null
  is_active:         boolean
  email_verified:    boolean
  coupon_code_used:  boolean
  created_at:        string
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
  | 'ACCOUNT_DISABLED'
  | 'MISSING_DATA'
  | 'INVALID_COUPON'
  | 'CAPTCHA_FAILED'
  | 'REGISTRATION_FAILED'
  | 'VALIDATION_ERROR'
  | 'ACTION_FORBIDDEN'
  | 'UNKNOWN'

export interface AuthError {
  source:  ServiceErrorSource
  code:    ServiceErrorCode | ErrorCode
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
