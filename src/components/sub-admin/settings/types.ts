export interface NotificationPrefs {
  notify_on_attempt: boolean
  notify_on_exam_closure: boolean
  notify_on_new_student: boolean
}

export const DEFAULT_PREFS: NotificationPrefs = {
  notify_on_attempt: true,
  notify_on_exam_closure: true,
  notify_on_new_student: true,
}

export interface ProfileData {
  id: string
  full_name: string
  email: string
  coupon_code: string | null
  notification_prefs: NotificationPrefs
}

export type PrefKey = keyof NotificationPrefs
