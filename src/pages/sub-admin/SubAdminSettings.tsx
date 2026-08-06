import {
  PageContainer,
  Stack,
  Grid,
  SectionReveal,
  Alert,
} from '../../components/common/AntigravityUI'
import { AlertCircle } from 'lucide-react'
import { ToastContainer } from '../../hooks/useToast'
import { useSettings } from '../../components/sub-admin/settings/useSettings'
import { IdentitySection } from '../../components/sub-admin/settings/IdentitySection'
import { RecruitmentSection } from '../../components/sub-admin/settings/RecruitmentSection'
import { NotificationSection } from '../../components/sub-admin/settings/NotificationSection'
import { BackupSection } from '../../components/sub-admin/settings/BackupSection'
import { SessionSection } from '../../components/sub-admin/settings/SessionSection'

export default function SubAdminSettings() {
  const ctx = useSettings()

  return (
    <>
      <PageContainer>
        <Stack gap="lg">
          {ctx.error && (
            <SectionReveal>
              <Alert variant="error" icon={AlertCircle} title="Action failed" className="w-full">
                {ctx.error}
              </Alert>
            </SectionReveal>
          )}
          <SectionReveal>
            <Grid cols={2} gap={24}>
              <IdentitySection
                name={ctx.name}
                onNameChange={ctx.setName}
                email={ctx.profile?.email || ''}
                password={ctx.password}
                onPasswordChange={ctx.setPassword}
                saving={ctx.saving}
                onSave={ctx.handleSaveProfile}
                fieldErrors={ctx.fieldErrors}
                onFieldBlur={ctx.handleFieldBlur}
              />

              <Stack gap="lg">
                <RecruitmentSection
                  couponCode={ctx.profile?.coupon_code ?? null}
                  copied={ctx.copied}
                  onCopy={ctx.handleCopyCoupon}
                  onShare={ctx.handleShareCoupon}
                />

                <NotificationSection
                  notifyAttempt={ctx.notifyAttempt}
                  onNotifyAttemptChange={(v) => ctx.handleTogglePref('notify_on_attempt', v, ctx.setNotifyAttempt)}
                  notifyCompletion={ctx.notifyCompletion}
                  onNotifyCompletionChange={(v) => ctx.handleTogglePref('notify_on_exam_closure', v, ctx.setNotifyCompletion)}
                  notifyNewStudent={ctx.notifyNewStudent}
                  onNotifyNewStudentChange={(v) => ctx.handleTogglePref('notify_on_new_student', v, ctx.setNotifyNewStudent)}
                  saving={ctx.savingPrefs}
                />
              </Stack>
            </Grid>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <Grid cols={2} gap={24}>
              <BackupSection
                exportingStudents={ctx.exportingStudents}
                onExportStudents={ctx.handleExportStudents}
                exportingExams={ctx.exportingExams}
                onExportExams={ctx.handleExportExams}
              />

              <SessionSection
                lastLogin={ctx.lastLogin}
                isSignOutOpen={ctx.isSignOutOpen}
                openSignOut={ctx.openSignOut}
                closeSignOut={ctx.closeSignOut}
                confirmSignOut={ctx.confirmSignOut}
              />
            </Grid>
          </SectionReveal>
        </Stack>
      </PageContainer>

      <ToastContainer toasts={ctx.toasts} />
    </>
  )
}
