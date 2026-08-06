import {
  PageContainer,
  Stack,
  Grid,
  PageTransition,
} from '../../components/common/AntigravityUI';
import { LoadingSkeleton } from '../../components/common/SharedComponents';
import { ToastContainer } from '../../hooks/useToast';
import { useProfile } from '../../components/profile/useProfile';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { StatisticsSection } from '../../components/profile/StatisticsSection';
import { ProfileForm } from '../../components/profile/ProfileForm';

export default function UserProfile() {
  const profile = useProfile();

  if (profile.authLoading || !profile.user) {
    return (
      <PageContainer>
        <Stack gap={48}>
          <LoadingSkeleton height={180} borderRadius={24} />
          <Stack gap={24}>
            <LoadingSkeleton height={40} width={200} borderRadius={12} />
            <Grid cols={4} gap={24}>
              {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} height={100} borderRadius={16} />)}
            </Grid>
          </Stack>
          <LoadingSkeleton height={400} borderRadius={24} />
        </Stack>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageTransition>
        <Stack gap={48}>
          <ProfileHeader user={profile.user} memberSince={profile.memberSince} />
          <StatisticsSection user={profile.user} getReadableExam={profile.getReadableExam} />
          <ProfileForm
            currentPass={profile.currentPass}
            onCurrentPassChange={profile.handleCurrentPassChange}
            newPass={profile.newPass}
            onNewPassChange={profile.setNewPass}
            confirmPass={profile.confirmPass}
            onConfirmPassChange={profile.setConfirmPass}
            loading={profile.loading}
            showCurrent={profile.showCurrent}
            onToggleShowCurrent={() => profile.setShowCurrent(!profile.showCurrent)}
            showNew={profile.showNew}
            onToggleShowNew={() => profile.setShowNew(!profile.showNew)}
            showConfirm={profile.showConfirm}
            onToggleShowConfirm={() => profile.setShowConfirm(!profile.showConfirm)}
            isVerified={profile.isVerified}
            showForgot={profile.showForgot}
            error={profile.error}
            fieldErrors={profile.fieldErrors}
            onCurrentPassBlur={profile.onCurrentPassBlur}
            onNewPassBlur={profile.onNewPassBlur}
            onConfirmPassBlur={profile.onConfirmPassBlur}
            passwordMatch={profile.passwordMatch}
            hasMinLength={profile.hasMinLength}
            hasUppercase={profile.hasUppercase}
            hasNumber={profile.hasNumber}
            hasSpecial={profile.hasSpecial}
            passwordValid={profile.passwordValid}
            onVerify={profile.handleVerify}
            onForgotPassword={profile.handleForgotPassword}
            onPasswordUpdate={profile.handlePasswordUpdate}
            onResetVerification={profile.resetVerification}
          />
        </Stack>
        <ToastContainer toasts={profile.toasts} />
      </PageTransition>
    </PageContainer>
  );
}
