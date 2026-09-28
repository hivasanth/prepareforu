import { KeyRound, LogOut, Trash2, ShieldAlert, AlertCircle } from 'lucide-react';
import {
  Card,
  Button,
  Stack,
  H3,
  Body,
  IconBadge,
  Alert,
} from '../common/AntigravityUI';

interface AccountActionsProps {
  isPasswordFormOpen: boolean;
  onTogglePasswordForm: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  deleteError: string | null;
}

export function AccountActions({
  isPasswordFormOpen,
  onTogglePasswordForm,
  onSignOut,
  onDeleteAccount,
  deleteError,
}: AccountActionsProps) {
  return (
    <Card variant="premium-neutral" className="p-8 md:p-12 relative overflow-hidden">
      <div className="flex items-center gap-6 mb-10">
        <IconBadge icon={ShieldAlert} size="4xl" shape="rounded" status="primary" className="rounded-2xl" />
        <div>
          <H3 className="uppercase tracking-tight m-0">Account Actions</H3>
          <Body secondary className="mt-1">Manage your credentials, session and account.</Body>
        </div>
      </div>

      <Stack gap={12}>
        {deleteError && (
          <Alert variant="error" icon={AlertCircle} title="Unable to delete account" className="w-full">
            {deleteError}
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 rounded-2xl bg-hover-bg/40 border border-border-subtle/60">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center" aria-hidden>
                <KeyRound size={18} />
              </span>
              <div className="min-w-0">
                <Body className="font-bold text-[13px] m-0">Update Password</Body>
                <Body secondary className="text-[12px] m-0 mt-0.5">
                  Verify your identity and set a new password.
                </Body>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant={isPasswordFormOpen ? 'secondary' : 'primary'}
            size="md"
            onClick={onTogglePasswordForm}
            aria-expanded={isPasswordFormOpen}
          >
            {isPasswordFormOpen ? 'Hide Password Settings' : 'Update Password'}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 rounded-2xl bg-hover-bg/40 border border-border-subtle/60">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center" aria-hidden>
                <LogOut size={18} />
              </span>
              <div className="min-w-0">
                <Body className="font-bold text-[13px] m-0">Sign Out</Body>
                <Body secondary className="text-[12px] m-0 mt-0.5">
                  End this session and return to the sign-in page.
                </Body>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onSignOut}
          >
            <LogOut size={16} className="mr-2" /> Sign Out
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 rounded-2xl bg-danger/5 border border-danger/20">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-danger/10 text-danger flex items-center justify-center" aria-hidden>
                <Trash2 size={18} />
              </span>
              <div className="min-w-0">
                <Body className="font-bold text-[13px] text-danger m-0">Delete Account</Body>
                <Body secondary className="text-[12px] m-0 mt-0.5 text-danger/80">
                  Permanently delete your account and all data. This cannot be undone.
                </Body>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={onDeleteAccount}
          >
            <Trash2 size={16} className="mr-2" /> Delete Account
          </Button>
        </div>
      </Stack>
    </Card>
  );
}
