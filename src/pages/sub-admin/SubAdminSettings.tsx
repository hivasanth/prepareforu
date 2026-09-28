import {
  PageContainer,
  Stack,
  Grid,
  SectionReveal,
  Alert,
  ErrorContainer,
  RetryButton,
} from '../../components/common/AntigravityUI'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useSettings } from '../../components/sub-admin/settings/useSettings'
import { SubAdminSettingsSkeleton } from '../../components/sub-admin/settings/SubAdminSettingsSkeleton'
import { IdentitySection } from '../../components/sub-admin/settings/IdentitySection'
import { RecruitmentSection } from '../../components/sub-admin/settings/RecruitmentSection'
import { NotificationSection } from '../../components/sub-admin/settings/NotificationSection'
import { BackupSection } from '../../components/sub-admin/settings/BackupSection'
import { SessionSection } from '../../components/sub-admin/settings/SessionSection'

export default function SubAdminSettings() {
  const ctx = useSettings()

  // B2: page-level load failure → canonical error surface with a loading-guarded
  // retry. The real grid is NEVER rendered with defaults while data is missing.
  if (ctx.error && !ctx.profile) {
    return (
      <PageContainer>
        <ErrorContainer category={ctx.error.category} severity={ctx.error.severity}>
          <p className="text-lg font-bold text-text-primary">{ctx.error.title}</p>
          <p className="text-base text-text-secondary">{ctx.error.message}</p>
          <RetryButton onRetry={ctx.fetchData} loading={ctx.loading} />
        </ErrorContainer>
      </PageContainer>
    )
  }

  // B2: no default flash — render the skeleton (single role="status" owner)
  // until the profile load resolves.
  if (ctx.loading || ctx.profile === null) {
    return (
      <PageContainer>
        <SubAdminSettingsSkeleton />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Stack gap="lg">
        {ctx.successMessage && (
          <SectionReveal>
            <Alert variant="success" icon={CheckCircle2} title="Action complete" className="w-full" onDismiss={ctx.clearSuccessMessage}>
              {ctx.successMessage}
            </Alert>
          </SectionReveal>
        )}
        {ctx.actionError && (
            <SectionReveal>
              <Alert variant="error" icon={AlertCircle} title="Action failed" className="w-full">
                {ctx.actionError}
              </Alert>
            </SectionReveal>
          )}
          {ctx.notice && (
            <SectionReveal>
              <Alert
                variant="warning"
                icon={Info}
                title="Partial export"
                className="w-full"
                onDismiss={ctx.clearNotice}
              >
                {ctx.notice}
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
  )
}