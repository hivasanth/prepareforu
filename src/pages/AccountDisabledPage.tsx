import { useAuth } from '../context/AuthContext';
import { LogoSVG } from '../components/Logo';
import { ConfirmModal } from '../components/common/SharedComponents';
import {
  Button,
  Card,
  PageContainer,
  Stack,
  H1,
  Body,
  Label,
  AuthThemeProvider,
} from '../components/common/AntigravityUI';
import { useSignOutConfirmation } from '../hooks/useSignOutConfirmation';

export default function AccountDisabledPage() {
  const { logout } = useAuth();
  const { isOpen: isSignOutOpen, openDialog: openSignOut, closeDialog: closeSignOut, handleConfirm: confirmSignOut } = useSignOutConfirmation(logout);

  return (
    <AuthThemeProvider>
      <PageContainer centered>
        <div className="w-full max-w-[440px] space-y-6">
          <div className="relative z-10 flex flex-col items-center space-y-6 animate-in">
            <div className="w-16 h-16 bg-hover-bg rounded-2xl flex items-center justify-center shadow-elevation-2">
              <LogoSVG size={36} />
            </div>
            <div className="text-center">
              <H1 className="text-3xl font-black tracking-tight leading-tight">Account Disabled</H1>
              <Label className="text-text-hint text-xs font-medium uppercase tracking-widest mt-2 inline-block">Access Revoked</Label>
            </div>
          </div>

          <Card variant="auth-light" className="text-center space-y-6 animate-in">
            <div className="w-20 h-20 bg-hover-bg rounded-full flex items-center justify-center mx-auto">
              <div className="w-12 h-12 bg-danger/10 text-danger rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <Body secondary className="text-sm font-semibold leading-relaxed px-4">
                Your account has been deactivated by the platform administrators. This can happen for various reasons including policy violations or subscription issues.
              </Body>
            </div>

            <Stack gap="md" className="pt-4">
              <a href="mailto:support@prepareforu.com" className="block">
                <Button fullWidth>
                  CONTACT SUPPORT
                </Button>
              </a>
              <Button
                variant="danger"
                fullWidth
                onClick={openSignOut}
              >
                SIGN OUT
              </Button>
            </Stack>
          </Card>
        </div>
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
    </AuthThemeProvider>
  );
}
