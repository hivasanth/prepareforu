import { CheckCircle2 } from 'lucide-react';
import {
  PageContainer,
  Stack,
  PageTransition,
  ErrorContainer,
  RetryButton,
  H2,
  Body,
  Alert,
} from '../../components/common/AntigravityUI';
import { ConfirmModal } from '../../components/common/SharedComponents';
import { useSignOutConfirmation } from '../../hooks/useSignOutConfirmation';
import { Skeleton } from '../../components/common/Skeleton';
import { StatSkeleton } from '../../components/common/SharedComponents';
import { useProfile } from '../../components/profile/useProfile';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { StatisticsSection } from '../../components/profile/StatisticsSection';
import { AccountActions } from '../../components/profile/AccountActions';
import { ProfileForm } from '../../components/profile/ProfileForm';
import { useState } from 'react';

export default function UserProfile() {
  const profile = useProfile();
  const { isOpen: isSignOutOpen, openDialog: openSignOut, closeDialog: closeSignOut, handleConfirm: confirmSignOut } = useSignOutConfirmation(profile.logout);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (profile.authLoading) {
    return (
      <PageContainer>
        <div role="status" aria-live="polite" aria-label="Loading profile" className="flex flex-col gap-12">
          <Skeleton type="card" height={180} borderRadius={24} decorative />
          <StatSkeleton decorative columns="grid-cols-2 md:grid-cols-2 lg:grid-cols-4" gap="gap-4 lg:gap-6" />
          <Skeleton type="card" height={420} borderRadius={24} decorative />
        </div>
      </PageContainer>
    );
  }

  if (!profile.user) {
    return (
      <PageContainer>
        <ErrorContainer category="network" severity="critical">
          <H2>Unable to load your profile</H2>
          <Body>We could not load your profile. Please try again.</Body>
          <RetryButton onRetry={profile.retryProfile} loading={profile.profileRetrying} />
        </ErrorContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageTransition>
        <Stack gap={48}>
          {profile.successMessage && (
            <Alert variant="success" icon={CheckCircle2} title="Success" onDismiss={profile.clearSuccessMessage}>
              {profile.successMessage}
            </Alert>
          )}
          <ProfileHeader user={profile.user} memberSince={profile.memberSince} />
          <StatisticsSection
            examSelection={profile.user.exam_selection ?? ''}
            getReadableExam={profile.getReadableExam}
            stats={profile.stats}
            statsLoading={profile.statsLoading}
            statsError={profile.statsError}
            isRetrying={profile.statsRetrying}
            onRetry={profile.retryStats}
          />
          <AccountActions
            isPasswordFormOpen={profile.showPasswordForm}
            onTogglePasswordForm={profile.togglePasswordForm}
            onSignOut={openSignOut}
            onDeleteAccount={() => setIsDeleteOpen(true)}
            deleteError={profile.deleteError}
          />
          {profile.showPasswordForm && (
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
              captchaRef={profile.captchaRef}
              captchaToken={profile.captchaToken}
              onCaptchaTokenChange={profile.onCaptchaTokenChange}
              onVerify={profile.handleVerify}
              onForgotPassword={profile.handleForgotPassword}
              onPasswordUpdate={profile.handlePasswordUpdate}
              onResetVerification={profile.resetVerification}
            />
          )}
        </Stack>

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

        <ConfirmModal
          open={isDeleteOpen}
          title="Delete Account"
          message="This will permanently delete your account and all of your data. This action cannot be undone. Are you sure you want to continue?"
          confirmLabel="Delete Account"
          cancelLabel="Cancel"
          danger
          busy={profile.deleteLoading}
          onConfirm={() => {
            setIsDeleteOpen(false);
            profile.handleDeleteAccount();
          }}
          onCancel={() => setIsDeleteOpen(false)}
        />
      </PageTransition>
    </PageContainer>
  );
}
