import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { GuardLoader } from '../../guards/Guards'
import { isSubAdmin } from '../../utils/authUtils'

import {
  User,
  Mail,
  Lock,
  Ticket,
  Copy,
  Share2,
  Bell,
  Shield,
  LogOut,
  Check,
  Database,
  Users,
  BookOpen
} from 'lucide-react'
import * as authService from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import { downloadCSV } from '../../utils/csvUtils'
import {
  PageContainer, 
  Stack, 
  Grid, 
  Card, 
  Input, 
  Button, 
  Switch, 
  Label, 
  SectionReveal,
  Body
} from '../../components/common/AntigravityUI'
import { ConfirmModal } from '../../components/common/SharedComponents'
import { fetchSubAdminProfileAndUser, updateSubAdminProfile, updateSubAdminNotificationPrefs, fetchStudentsByEducatorId } from '../../services/userService'
import { fetchTeacherExamsForExport } from '../../services/teacherExamService'
import { useSignOutConfirmation } from '../../hooks/useSignOutConfirmation'

interface NotificationPrefs {
  notify_on_attempt: boolean
  notify_on_exam_closure: boolean
  notify_on_new_student: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  notify_on_attempt: true,
  notify_on_exam_closure: true,
  notify_on_new_student: true,
}

interface ProfileData {
  id: string
  full_name: string
  email: string
  coupon_code: string | null
  notification_prefs: NotificationPrefs
}

export default function SubAdminSettings() {
  const { user, loading: authLoading, logout } = useAuth()
  const { showSuccess, showError } = useToast()
  const { isOpen: isSignOutOpen, openDialog: openSignOut, closeDialog: closeSignOut, handleConfirm: confirmSignOut } = useSignOutConfirmation(logout)

  // ── State ──
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [lastLogin, setLastLogin] = useState<string>('—')

  // Form State
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  // Notifications State — hydrated from DB
  const [notifyAttempt, setNotifyAttempt] = useState(true)
  const [notifyCompletion, setNotifyCompletion] = useState(true)
  const [notifyNewStudent, setNotifyNewStudent] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Feedback State
  const [copied, setCopied] = useState(false)
  const [exportingStudents, setExportingStudents] = useState(false)
  const [exportingExams, setExportingExams] = useState(false)

  // ── Fetch Data ──
  useEffect(() => {
    let cancelled = false
    async function loadData() {
      if (!user) return
      try {
        const { profile, lastActivity } = await fetchSubAdminProfileAndUser(user.id)
        if (cancelled) return
        if (profile) {
          const prefs: NotificationPrefs = { ...DEFAULT_PREFS, ...(profile.notification_prefs as any) }
          setProfile(profile)
          setName(profile.full_name || '')
          setNotifyAttempt(prefs.notify_on_attempt)
          setNotifyCompletion(prefs.notify_on_exam_closure)
          setNotifyNewStudent(prefs.notify_on_new_student)
        }
        setLastLogin(lastActivity)
      } catch (err: any) {
        if (!cancelled) showError(err.message || 'Failed to load profile')
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [user?.id])

  const handleSaveProfile = async () => {
    if (!profile) return
    if (!name.trim()) return showError('Name is required')
    if (password && password.length < 6) return showError('Password must be at least 6 characters')

    setSaving(true)
    try {
      if (name !== profile.full_name) {
        await updateSubAdminProfile(profile.id, user?.id, name)
        setProfile({ ...profile, full_name: name })
      }

      if (password) {
        const result = await authService.updatePassword(password)
        if (!result.success) throw new Error(result.error?.message)
        setPassword('')
      }

      showSuccess('Profile updated successfully')
    } catch (err: any) {
      showError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePref = async (key: keyof NotificationPrefs, value: boolean, setter: (v: boolean) => void) => {
    if (!profile) return
    
    // Optimistic UI update
    setter(value)
    setSavingPrefs(true)
    
    try {
      const newPrefs = { ...profile.notification_prefs, [key]: value }
      
      await updateSubAdminNotificationPrefs(profile.id, newPrefs)
      
      // Update local profile state
      setProfile({ ...profile, notification_prefs: newPrefs })
    } catch (err: any) {
      // Revert on error
      setter(!value)
      showError(err.message || 'Failed to save preference')
    } finally {
      setSavingPrefs(false)
    }
  }

  const handleCopyCoupon = async () => {
    if (!profile?.coupon_code) return
    try {
      await navigator.clipboard.writeText(profile.coupon_code)
      setCopied(true)
      showSuccess('Coupon copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showError('Failed to copy coupon')
    }
  }

  const handleShareCoupon = async () => {
    if (!profile?.coupon_code) return
    const text = `Join my exam platform!\n\nEducator: ${profile.full_name}\nCoupon Code: ${profile.coupon_code}`
    if (navigator.share) {
      try { await navigator.share({ title: 'Join My Exams', text }) } catch { /* user dismissed share sheet */ }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        showSuccess('Share text copied')
      } catch {
        showError('Could not copy automatically. Select and copy manually.')
      }
    }
  }

  const handleExportStudents = async () => {
    if (!user?.id) return
    setExportingStudents(true)
    try {
      const data = await fetchStudentsByEducatorId(user.id)
      if (!data?.length) return showError('No students found')

      const csv = [['Name', 'Email', 'Joined'].join(','), ...data.map((u: any) => [u.full_name, u.email, u.created_at].join(','))].join('\n')
      downloadFile(csv, 'students_export.csv')
      showSuccess('Export complete')
    } catch (e) { showError('Export failed') } finally { setExportingStudents(false) }
  }

  const handleExportExams = async () => {
    if (!profile) return
    setExportingExams(true)
    try {
      const data = await fetchTeacherExamsForExport(profile.id)
      if (!data?.length) return showError('No exams found')

      const csv = [['Title', 'Questions', 'Marks', 'Created At'].join(','), ...data.map((e: any) => [e.title, e.total_questions, e.total_marks, e.created_at].join(','))].join('\n')
      downloadFile(csv, 'exams_export.csv')
      showSuccess('Export complete')
    } catch (e) { showError('Export failed') } finally { setExportingExams(false) }
  }

  const downloadFile = (content: string, filename: string) => downloadCSV(content, filename)

  if (authLoading) return <GuardLoader />
  if (!isSubAdmin(user)) return <Navigate to="/unauthorized" replace />

  return (
    <>
      <PageContainer>

        <Stack gap="lg">
          <SectionReveal>
            <Grid cols={2} gap={24}>
              {/* Profile Config */}
              <Card variant="default" className="p-8">
                <Stack gap="lg">
                  <Stack direction="row" gap="sm" align="center" className="border-b border-border-subtle/10 pb-4">
                    <User size={18} className="text-primary" />
                    <Label>Identity Profile</Label>
                  </Stack>

                  <Stack gap="md">
                    <Stack gap="xs">
                      <Label>Full Name</Label>
                      <Input 
                        placeholder="e.g. Dr. Jane Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </Stack>

                    <Stack gap="xs">
                      <Label>Email (Read Only)</Label>
                      <Input 
                        value={profile?.email || ''}
                        disabled
                        leftIcon={Mail}
                      />
                    </Stack>

                    <Stack gap="xs">
                      <Label>Update Password</Label>
                      <Input 
                        type="password"
                        placeholder="Leave blank to keep current"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={Lock}
                      />
                    </Stack>

                    <Button 
                      variant="primary" 
                      onClick={handleSaveProfile} 
                      loading={saving}
                      className="mt-2"
                    >
                      Save Changes
                    </Button>
                  </Stack>
                </Stack>
              </Card>

              {/* Right Column: Coupon & Notifications */}
              <Stack gap="lg">
                {/* Coupon Card */}
                <Card variant="elevated" className="p-8 bg-primary/5 border-primary/20">
                  <Stack gap="lg">
                    <Stack direction="row" gap="sm" align="center">
                      <Ticket size={18} className="text-primary" />
                      <Label className="text-primary">Recruitment Protocol</Label>
                    </Stack>
                    
                    <div className="bg-card-bg border border-primary/20 rounded-2xl p-6 flex items-center justify-between">
                      <Stack gap="xs">
                        <Label>Your unique coupon code</Label>
                        <span className="text-xl font-black tracking-widest text-text-primary">
                          {profile?.coupon_code || 'UNASSIGNED'}
                        </span>
                      </Stack>
                      <Stack direction="row" gap="sm">
                        <Button variant="secondary" onClick={handleCopyCoupon} className="!w-10 !h-10 !p-0">
                          {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                        </Button>
                        <Button variant="primary" onClick={handleShareCoupon} className="!w-10 !h-10 !p-0">
                          <Share2 size={16} />
                        </Button>
                      </Stack>
                    </div>
                  </Stack>
                </Card>

                {/* Notifications */}
                <Card variant="default" className="p-8">
                  <Stack gap="lg">
                    <Stack direction="row" gap="sm" align="center" className="border-b border-border-subtle/10 pb-4">
                      <Bell size={18} className="text-primary" />
                      <Label>Engagement Alerts</Label>
                    </Stack>
                    
                    <Stack gap="md">
                      <div className="flex items-center justify-between">
                        <Body>Notify on student attempts</Body>
                        <Switch checked={notifyAttempt} onChange={(v) => handleTogglePref('notify_on_attempt', v, setNotifyAttempt)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Body>Notify on exam closure</Body>
                        <Switch checked={notifyCompletion} onChange={(v) => handleTogglePref('notify_on_exam_closure', v, setNotifyCompletion)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Body>Notify on new student signup</Body>
                        <Switch checked={notifyNewStudent} onChange={(v) => handleTogglePref('notify_on_new_student', v, setNotifyNewStudent)} />
                      </div>
                      {savingPrefs && (
                        <Body secondary className="text-xs">Saving...</Body>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              </Stack>
            </Grid>
          </SectionReveal>

          {/* Data & Security Row */}
          <SectionReveal delay={0.1}>
            <Grid cols={2} gap={24}>
              {/* Export */}
              <Card variant="default" className="p-8">
                <Stack gap="lg">
                  <Stack direction="row" gap="sm" align="center" className="border-b border-border-subtle/10 pb-4">
                    <Database size={18} className="text-primary" />
                    <Label>Operational Backups</Label>
                  </Stack>
                  
                  <Body secondary>Download full records of your student cohort and examination history in CSV format.</Body>
                  
                  <Stack direction="row" gap="md">
                    <Button variant="secondary" onClick={handleExportStudents} loading={exportingStudents} className="flex-1">
                      <Users size={16} className="mr-2" /> Students
                    </Button>
                    <Button variant="secondary" onClick={handleExportExams} loading={exportingExams} className="flex-1">
                      <BookOpen size={16} className="mr-2" /> Exams
                    </Button>
                  </Stack>
                </Stack>
              </Card>

              {/* Security */}
              <Card variant="default" className="p-8">
                <Stack gap="lg">
                  <Stack direction="row" gap="sm" align="center" className="border-b border-border-subtle/10 pb-4">
                    <Shield size={18} className="text-primary" />
                    <Label>Session Security</Label>
                  </Stack>
                  
                  <div className="flex items-center justify-between flex-1">
                    <Stack gap="xs">
                      <Label>Last Protocol Sync</Label>
                      <span className="font-black text-text-primary text-sm">{lastLogin}</span>
                    </Stack>
                    <Button variant="danger" onClick={openSignOut}>
                      <LogOut size={16} className="mr-2" /> Terminate Session
                    </Button>
                  </div>
                </Stack>
              </Card>
            </Grid>
          </SectionReveal>
        </Stack>
      </PageContainer>

      <ConfirmModal
        open={isSignOutOpen}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to sign in again to continue."
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        onConfirm={confirmSignOut}
        onCancel={closeSignOut}
        danger
      />
    </>
  )
}
