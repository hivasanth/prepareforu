import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useStableFetch } from '../../../hooks/useStableFetch'
import { useSignOutConfirmation } from '../../../hooks/useSignOutConfirmation'
import { identityUpdateSchema } from '../../../validations/securitySchemas'
import * as authService from '../../../services/authService'
import { normalizeError } from '../../../utils/errorClassification'
import type { PageError } from '../../../types/error.types'
import {
  fetchSubAdminProfileAndUser,
  updateSubAdminProfile,
  updateSubAdminNotificationPrefs,
  fetchStudentsByEducatorId,
} from '../../../services/userService'
import { fetchTeacherExamsForExport } from '../../../services/teacherExamService'
import { downloadCSV } from '../../../utils/csvUtils'
import { copyText } from '../../../utils/clipboardUtils'
import type { ProfileData, NotificationPrefs, PrefKey } from './types'
import { DEFAULT_PREFS } from './types'

export function useSettings() {
  const { user, logout } = useAuth()
  const { mountedRef, nextId, isStale } = useStableFetch()
  const {
    isOpen: isSignOutOpen,
    openDialog: openSignOut,
    closeDialog: closeSignOut,
    handleConfirm: confirmSignOut,
  } = useSignOutConfirmation(logout)

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<PageError | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [lastLogin, setLastLogin] = useState<string>('—')

  // B1: single source of truth for the LAST confirmed profile. Sorted setState
  // closures are free to fire out of order, so every toggle reads from this
  // ref instead of a captured `profile` snapshot.
  const profileRef = useRef<ProfileData | null>(null)
  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'name' | 'password', string>>>({})
  const [saving, setSaving] = useState(false)
  const submittedRef = useRef(false)

  const [notifyAttempt, setNotifyAttempt] = useState(true)
  const [notifyCompletion, setNotifyCompletion] = useState(true)
  const [notifyNewStudent, setNotifyNewStudent] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const savingPrefsRef = useRef(false)

  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<number | null>(null)
  const [exportingStudents, setExportingStudents] = useState(false)
  const [exportingExams, setExportingExams] = useState(false)

  // B2: form fields hydrate EXACTLY once from the first successful load.
  // Retries after a failure never clobber what the user already typed.
  const loadedOnceRef = useRef(false)

  // B8: clear any pending "copied" reset timer on unmount.
  useEffect(
    () => () => {
      if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current)
    },
    [],
  )

  // ── Data Loading ──

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    const id = nextId()
    setLoading(true)
    // B2: the previous failure stays visible (busy RetryButton) until this
    // pipeline actually resolves — it is cleared only on success.
    try {
      const { profile: p, lastActivity } = await fetchSubAdminProfileAndUser(user.id)
      if (!mountedRef.current || isStale(id)) return
      setLastLogin(lastActivity)

      if (!p) {
        setError(normalizeError(new Error('Educator profile not found'), {
          category: 'business',
          severity: 'medium',
          fallbackMessage: 'Educator profile not found. Please contact admin.',
        }))
        return
      }

      const prefs: NotificationPrefs = {
        ...DEFAULT_PREFS,
        ...(p.notification_prefs ?? {}),
      }
      setProfile({ ...p, notification_prefs: prefs })
      if (!loadedOnceRef.current) {
        loadedOnceRef.current = true
        setName(p.full_name || '')
        setNotifyAttempt(prefs.notify_on_attempt)
        setNotifyCompletion(prefs.notify_on_exam_closure)
        setNotifyNewStudent(prefs.notify_on_new_student)
      }
      setError(null)
    } catch (err: unknown) {
      if (!mountedRef.current || isStale(id)) return
      setError(normalizeError(err, { severity: 'high' }))
    } finally {
      if (mountedRef.current && !isStale(id)) setLoading(false)
    }
  }, [user?.id, nextId, mountedRef, isStale])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
    setActionError(null)
    let nameSaved = false
    try {
      if (name !== profile.full_name) {
        await updateSubAdminProfile(name)
        nameSaved = true
        if (!mountedRef.current) return
        setProfile(prev => (prev ? { ...prev, full_name: name } : prev))
      }

      if (password.trim()) {
        const result = await authService.updatePassword(password)
        if (!mountedRef.current) return
        if (!result.success) throw new Error(result.error?.message)
        setPassword('')
      }

      setSuccessMessage('Profile updated successfully')
      setFieldErrors({})
    } catch (err: unknown) {
      // B7: name committed but the password step failed → tell the user exactly
      // that. The saved name is never rolled back. Also strips any server
      // VALIDATION_FAILED: prefix so raw validation text cannot reach the UI.
      const raw = String(err instanceof Error ? err.message : (err ?? 'Failed to update profile'))
      const message = raw.replace(/^VALIDATION_FAILED:\s*/i, '')
      setActionError(
        nameSaved ? `Name saved, but password update failed: ${message}` : message,
      )
    } finally {
      if (mountedRef.current) setSaving(false)
    }
  }, [profile, name, password, runValidation, mountedRef])

  const handleFieldBlur = useCallback((field: 'name' | 'password') => {
    if (!submittedRef.current) return
    const { fieldErrors } = runValidation()
    setFieldErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
  }, [runValidation])

  // ── Notification Toggle ──

  const handleTogglePref = useCallback(
    async (key: PrefKey, value: boolean, setter: (v: boolean) => void) => {
      if (!profileRef.current) return
      // B1: single-flight guard — one preference mutation in flight at a time
      // (switches are also disabled while savingPrefs). A second call would
      // otherwise race against the first and resurrect a stale preference key.
      if (savingPrefsRef.current) return

      savingPrefsRef.current = true
      setSavingPrefs(true)
      setActionError(null)
      setter(value)

      try {
        // B11: always write the FULL normalized preference object. Merging the
        // DB value over DEFAULT_PREFS guarantees every required key is present
        // in the RPC payload, then the toggled key wins. Read from profileRef
        // (last confirmed profile) so an out-of-order stale closure cannot
        // resurrect a previous key's value.
        const basePrefs: NotificationPrefs = {
          ...DEFAULT_PREFS,
          ...(profileRef.current.notification_prefs ?? {}),
        }
        const newPrefs: NotificationPrefs = { ...basePrefs, [key]: value }
        await updateSubAdminNotificationPrefs({ ...newPrefs })
        if (!mountedRef.current) return
        setProfile(prev => (prev ? { ...prev, notification_prefs: newPrefs } : prev))
      } catch {
        // B1: revert the optimistic toggle on failure. Friendly copy — raw
        // server validation text must never reach the UI.
        if (!mountedRef.current) return
        setter(!value)
        setActionError('Failed to save preference. Please try again.')
      } finally {
        savingPrefsRef.current = false
        if (mountedRef.current) setSavingPrefs(false)
      }
    },
    [mountedRef],
  )

  // ── Coupon Actions ──

  const handleCopyCoupon = useCallback(async () => {
    if (!profile?.coupon_code) return
    const ok = await copyText(profile.coupon_code)
    // LAN-ORIGIN FIX: "Copied" is shown ONLY after the write actually
    // succeeded — never optimistically.
    if (!ok) {
      setActionError('Failed to copy coupon')
      return
    }
    if (!mountedRef.current) return
    setCopied(true)
    // B8: clear any pending timer before arming a new one, so rapid re-copies
    // cannot have an old timer snap the state back early.
    if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = window.setTimeout(() => setCopied(false), 2000)
  }, [profile?.coupon_code, mountedRef])

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
      const ok = await copyText(text)
      if (ok) {
        setCopied(true)
        if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current)
        copiedTimerRef.current = window.setTimeout(() => setCopied(false), 2000)
      } else {
        setActionError('Could not copy automatically. Select and copy manually.')
      }
    }
  }, [profile?.coupon_code, profile?.full_name])

  // ── CSV Exports ──

  const handleExportStudents = useCallback(async () => {
    if (!user?.id) return
    setExportingStudents(true)
    setActionError(null)
    setNotice(null)
    try {
      const { rows, truncated } = await fetchStudentsByEducatorId(user.id)
      if (!rows?.length) {
        if (mountedRef.current) setActionError('No students found')
        return
      }

      downloadCSV({
        filename: 'students_export.csv',
        headers: ['Name', 'Email', 'Joined'],
        rows: rows.map((u) => [u.full_name as string, u.email as string, u.created_at as string]),
      })
      // B4: the export is complete (paginated), but if the safety-net guard
      // still reported truncation, the user is told explicitly — never a false
      // "Export complete".
      if (!mountedRef.current) return
      if (truncated) {
        setNotice(
          `Only the first ${rows.length} student records were exported. Ask your administrator for a complete data export.`,
        )
      } else {
        setSuccessMessage('Export complete')
      }
    } catch {
      if (mountedRef.current) setActionError('Export failed')
    } finally {
      if (mountedRef.current) setExportingStudents(false)
    }
  }, [user?.id, mountedRef])

  const handleExportExams = useCallback(async () => {
    if (!profile) return
    setExportingExams(true)
    setActionError(null)
    setNotice(null)
    try {
      const { rows, truncated } = await fetchTeacherExamsForExport({ user }, profile.id)
      if (!rows?.length) {
        if (mountedRef.current) setActionError('No exams found')
        return
      }

      downloadCSV({
        filename: 'exams_export.csv',
        headers: ['Title', 'Questions', 'Marks', 'Created At'],
        rows: rows.map((e) => [e.title, e.total_questions, e.total_marks, e.created_at]),
      })
      if (!mountedRef.current) return
      if (truncated) {
        setNotice(
          `Only the first ${rows.length} exam records were exported. Ask your administrator for a complete data export.`,
        )
      } else {
        setSuccessMessage('Export complete')
      }
    } catch {
      if (mountedRef.current) setActionError('Export failed')
    } finally {
      if (mountedRef.current) setExportingExams(false)
    }
  }, [profile, user, mountedRef])

  return {
    user,
    loading,
    error,
    actionError,
    notice,
    clearNotice: () => setNotice(null),
    successMessage,
    clearSuccessMessage: () => setSuccessMessage(null),
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
    fetchData,
  }
}