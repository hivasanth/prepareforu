import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../hooks/useToast'
import { useStableFetch } from '../../../hooks/useStableFetch'
import { useSignOutConfirmation } from '../../../hooks/useSignOutConfirmation'
import { identityUpdateSchema } from '../../../validations/securitySchemas'
import * as authService from '../../../services/authService'
import {
  fetchSubAdminProfileAndUser,
  updateSubAdminProfile,
  updateSubAdminNotificationPrefs,
  fetchStudentsByEducatorId,
} from '../../../services/userService'
import { fetchTeacherExamsForExport } from '../../../services/teacherExamService'
import { downloadCSV } from '../../../utils/csvUtils'
import type { ProfileData, NotificationPrefs, PrefKey } from './types'
import { DEFAULT_PREFS } from './types'

export function useSettings() {
  const { user, logout } = useAuth()
  const { toasts, showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)
  const { mountedRef } = useStableFetch()
  const {
    isOpen: isSignOutOpen,
    openDialog: openSignOut,
    closeDialog: closeSignOut,
    handleConfirm: confirmSignOut,
  } = useSignOutConfirmation(logout)

  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [lastLogin, setLastLogin] = useState<string>('—')

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'name' | 'password', string>>>({})
  const submittedRef = useRef(false)

  const [notifyAttempt, setNotifyAttempt] = useState(true)
  const [notifyCompletion, setNotifyCompletion] = useState(true)
  const [notifyNewStudent, setNotifyNewStudent] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)

  const [copied, setCopied] = useState(false)
  const [exportingStudents, setExportingStudents] = useState(false)
  const [exportingExams, setExportingExams] = useState(false)

  // ── Data Loading ──

  useEffect(() => {
    async function loadData() {
      if (!user) return
      try {
        const { profile: p, lastActivity } = await fetchSubAdminProfileAndUser(user.id)
        if (!mountedRef.current) return
        if (p) {
          const prefs: NotificationPrefs = { ...DEFAULT_PREFS, ...(p.notification_prefs as any) }
          setProfile(p)
          setName(p.full_name || '')
          setNotifyAttempt(prefs.notify_on_attempt)
          setNotifyCompletion(prefs.notify_on_exam_closure)
          setNotifyNewStudent(prefs.notify_on_new_student)
        }
        setLastLogin(lastActivity)
      } catch (err: any) {
        if (mountedRef.current) setError(err.message || 'Failed to load profile')
      }
    }
    loadData()
  }, [user?.id])

  // ── Profile Save ──

  const runValidation = useCallback(() => {
    const result = identityUpdateSchema.safeParse({
      name,
      password: password || undefined,
    })
    const nextErrors: Partial<Record<'name' | 'password', string>> = {}
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as 'name' | 'password' | undefined
        if (field) nextErrors[field] = issue.message
      })
    }
    return { result, fieldErrors: nextErrors }
  }, [name, password])

  const handleSaveProfile = useCallback(async () => {
    if (!profile) return
    submittedRef.current = true
    const { result, fieldErrors } = runValidation()
    setFieldErrors(fieldErrors)
    if (!result.success) return

    setSaving(true)
    setError(null)
    try {
      if (name !== profile.full_name) {
        await updateSubAdminProfile(profile.id, user?.id, name)
        if (!mountedRef.current) return
        setProfile({ ...profile, full_name: name })
      }

      if (password) {
        const result = await authService.updatePassword(password)
        if (!mountedRef.current) return
        if (!result.success) throw new Error(result.error?.message)
        setPassword('')
      }

      showSuccess('Profile updated successfully')
      setFieldErrors({})
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      if (mountedRef.current) setSaving(false)
    }
  }, [profile, name, password, user?.id, runValidation])

  const handleFieldBlur = useCallback((field: 'name' | 'password') => {
    if (!submittedRef.current) return
    const { fieldErrors } = runValidation()
    setFieldErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
  }, [runValidation])

  // ── Notification Toggle ──

  const handleTogglePref = useCallback(
    async (key: PrefKey, value: boolean, setter: (v: boolean) => void) => {
      if (!profile) return

      setter(value)
      setSavingPrefs(true)

      try {
        const newPrefs = { ...profile.notification_prefs, [key]: value }
        await updateSubAdminNotificationPrefs(profile.id, newPrefs)
        if (!mountedRef.current) return
        setProfile({ ...profile, notification_prefs: newPrefs })
      } catch (err: any) {
        setter(!value)
        setError(err.message || 'Failed to save preference')
      } finally {
        if (mountedRef.current) setSavingPrefs(false)
      }
    },
    [profile],
  )

  // ── Coupon Actions ──

  const handleCopyCoupon = useCallback(async () => {
    if (!profile?.coupon_code) return
    try {
      await navigator.clipboard.writeText(profile.coupon_code)
      if (!mountedRef.current) return
      setCopied(true)
      showSuccess('Coupon copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Failed to copy coupon')
    }
  }, [profile?.coupon_code])

  const handleShareCoupon = useCallback(async () => {
    if (!profile?.coupon_code) return
    const text = `Join my exam platform!\n\nEducator: ${profile.full_name}\nCoupon Code: ${profile.coupon_code}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join My Exams', text })
      } catch {
        /* user dismissed */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        showSuccess('Share text copied')
      } catch {
        setError('Could not copy automatically. Select and copy manually.')
      }
    }
  }, [profile?.coupon_code, profile?.full_name])

  // ── CSV Exports ──

  const handleExportStudents = useCallback(async () => {
    if (!user?.id) return
    setExportingStudents(true)
    try {
      const data = await fetchStudentsByEducatorId(user.id)
      if (!data?.length) return setError('No students found')

      downloadCSV({
        filename: 'students_export.csv',
        headers: ['Name', 'Email', 'Joined'],
        rows: data.map((u: any) => [u.full_name, u.email, u.created_at]),
      })
      showSuccess('Export complete')
    } catch {
      setError('Export failed')
    } finally {
      setExportingStudents(false)
    }
  }, [user?.id])

  const handleExportExams = useCallback(async () => {
    if (!profile) return
    setExportingExams(true)
    try {
      const data = await fetchTeacherExamsForExport({ user }, profile.id)
      if (!data?.length) return setError('No exams found')

      downloadCSV({
        filename: 'exams_export.csv',
        headers: ['Title', 'Questions', 'Marks', 'Created At'],
        rows: data.map((e: any) => [e.title, e.total_questions, e.total_marks, e.created_at]),
      })
      showSuccess('Export complete')
    } catch {
      setError('Export failed')
    } finally {
      setExportingExams(false)
    }
  }, [profile, user])

  return {
    user,
    toasts,
    error,
    profile,
    lastLogin,
    name,
    setName,
    password,
    setPassword,
    saving,
    fieldErrors,
    notifyAttempt,
    setNotifyAttempt,
    notifyCompletion,
    setNotifyCompletion,
    notifyNewStudent,
    setNotifyNewStudent,
    savingPrefs,
    copied,
    exportingStudents,
    exportingExams,
    isSignOutOpen,
    openSignOut,
    closeSignOut,
    confirmSignOut,
    handleSaveProfile,
    handleFieldBlur,
    handleTogglePref,
    handleCopyCoupon,
    handleShareCoupon,
    handleExportStudents,
    handleExportExams,
  }
}
