import { Eye, EyeOff, Shield, CheckCircle2, XCircle, Lock, RefreshCcw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  Button,
  IconButton,
  Input,
  Badge,
  Stack,
  Grid,
  H3,
  Body,
  Label,
  IconBadge,
  Alert,
} from '../common/AntigravityUI';

interface ProfileFormProps {
  currentPass: string;
  onCurrentPassChange: (value: string) => void;
  newPass: string;
  onNewPassChange: (value: string) => void;
  confirmPass: string;
  onConfirmPassChange: (value: string) => void;
  loading: boolean;
  showCurrent: boolean;
  onToggleShowCurrent: () => void;
  showNew: boolean;
  onToggleShowNew: () => void;
  showConfirm: boolean;
  onToggleShowConfirm: () => void;
  isVerified: boolean;
  showForgot: boolean;
  error: string | null;
  fieldErrors: { currentPass?: string; newPass?: string; confirmPass?: string };
  onCurrentPassBlur: () => void;
  onNewPassBlur: () => void;
  onConfirmPassBlur: () => void;
  passwordMatch: boolean | null;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  passwordValid: boolean;
  onVerify: () => void;
  onForgotPassword: () => void;
  onPasswordUpdate: (e: React.FormEvent) => void;
  onResetVerification: () => void;
}

export function ProfileForm({
  currentPass, onCurrentPassChange,
  newPass, onNewPassChange,
  confirmPass, onConfirmPassChange,
  loading,
  showCurrent, onToggleShowCurrent,
  showNew, onToggleShowNew,
  showConfirm, onToggleShowConfirm,
  isVerified, showForgot, error, fieldErrors,
  onCurrentPassBlur, onNewPassBlur, onConfirmPassBlur,
  passwordMatch, hasMinLength, hasUppercase, hasNumber, hasSpecial,
  passwordValid,
  onVerify, onForgotPassword, onPasswordUpdate, onResetVerification,
}: ProfileFormProps) {
  return (
    <Card variant="premium-neutral" className="p-8 md:p-12">
      <div className="flex items-center gap-6 mb-12">
        <IconBadge icon={Shield} size="4xl" shape="rounded" status="primary" className="rounded-2xl" />
        <div>
          <H3 className="uppercase tracking-tight m-0">Security & Credentials</H3>
          <Body secondary className="mt-1">Manage your session authentication and account access.</Body>
        </div>
      </div>

      <form onSubmit={onPasswordUpdate} className="space-y-12">
        {error && (
          <Alert variant="error" icon={AlertCircle} title="Action failed" className="w-full max-w-3xl">
            {error}
          </Alert>
        )}
        <div className="max-w-3xl">
          <Stack gap={40}>
            <Stack gap={16} className="relative">
              <div className="flex justify-between items-end">
                <Label className="text-[12px] uppercase tracking-widest">Current Password</Label>
                {isVerified && (
                  <Badge variant="success" className="h-7 px-3 rounded-lg font-semibold tracking-widest text-[9px]">
                    <CheckCircle2 size={12} className="mr-1.5" /> AUTHENTICATED
                  </Badge>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPass}
                  onChange={(e) => {
                    onCurrentPassChange(e.target.value);
                    if (isVerified) onResetVerification();
                  }}
                  onBlur={onCurrentPassBlur}
                  placeholder="Type current password to verify"
                  disabled={isVerified || loading}
                  id="currentPass"
                  aria-invalid={fieldErrors.currentPass ? true : undefined}
                  aria-describedby={fieldErrors.currentPass ? "currentPass-error" : undefined}
                  rightIcon={isVerified ? CheckCircle2 : (showCurrent ? EyeOff : Eye)}
                  onRightIconClick={() => !isVerified && onToggleShowCurrent()}
                  className={`transition-all font-medium ${isVerified ? 'border-success/30 bg-success/5 text-success' : ''}`}
                  inputMode="text"
                  autoComplete="current-password"
                />
                {isVerified && (
                  <IconButton
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={onResetVerification}
                    className="absolute -right-14 top-1/2 -translate-y-1/2"
                    aria-label="Reset password verification"
                  >
                    <RefreshCcw size={18} />
                  </IconButton>
                )}
              </div>

              {fieldErrors.currentPass && (
                <span id="currentPass-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                  {fieldErrors.currentPass}
                </span>
              )}

              {!isVerified && (
                <div className="flex items-center justify-between mt-2 px-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onForgotPassword}
                  >
                    Recover Password?
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    onClick={onVerify}
                    disabled={!currentPass || loading}
                  >
                    Verify Access
                  </Button>
                </div>
              )}
            </Stack>

            <AnimatePresence>
              {isVerified && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: 20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 20 }}
                  className="overflow-hidden"
                >
                  <Stack gap={40} className="pt-10 border-t border-border-subtle/30">
                    <Grid cols={1} sm={2} gap={24}>
                      <Stack gap={16}>
                        <Label className="text-[12px] uppercase tracking-widest">New Password</Label>
                        <Input
                          type={showNew ? 'text' : 'password'}
                          value={newPass}
                          onChange={(e) => onNewPassChange(e.target.value)}
                          onBlur={onNewPassBlur}
                          placeholder="Create strong password"
                          id="newPass"
                          aria-invalid={fieldErrors.newPass ? true : undefined}
                          aria-describedby={fieldErrors.newPass ? "newPass-error" : undefined}
                          rightIcon={showNew ? EyeOff : Eye}
                          onRightIconClick={onToggleShowNew}
                          className="font-medium"
                          inputMode="text"
                          autoComplete="new-password"
                        />
                        {fieldErrors.newPass && (
                          <span id="newPass-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                            {fieldErrors.newPass}
                          </span>
                        )}
                      </Stack>
                      <Stack gap={16}>
                        <Label className="text-[12px] uppercase tracking-widest">Confirm Password</Label>
                        <Input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPass}
                          onChange={(e) => onConfirmPassChange(e.target.value)}
                          onBlur={onConfirmPassBlur}
                          placeholder="Re-type new password"
                          id="confirmPass"
                          aria-invalid={fieldErrors.confirmPass ? true : undefined}
                          aria-describedby={fieldErrors.confirmPass ? "confirmPass-error" : undefined}
                          rightIcon={showConfirm ? EyeOff : Eye}
                          onRightIconClick={onToggleShowConfirm}
                          className="font-medium"
                          inputMode="text"
                          autoComplete="new-password"
                        />
                        {fieldErrors.confirmPass && (
                          <span id="confirmPass-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
                            {fieldErrors.confirmPass}
                          </span>
                        )}
                      </Stack>
                    </Grid>

                    <div className="flex gap-4 flex-wrap pb-8 border-b border-border-subtle/30" role="list" aria-live="polite">
                      <Badge variant={hasMinLength ? 'success' : 'default'} className="px-4 py-2 rounded-xl font-bold tracking-widest">
                        <div className="flex items-center gap-2" role="listitem">
                          {hasMinLength ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                          <Label className="m-0">MIN. 8 CHARACTERS</Label>
                        </div>
                      </Badge>
                      <Badge variant={hasUppercase ? 'success' : 'default'} className="px-4 py-2 rounded-xl font-bold tracking-widest">
                        <div className="flex items-center gap-2" role="listitem">
                          {hasUppercase ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                          <Label className="m-0">UPPERCASE LETTER</Label>
                        </div>
                      </Badge>
                      <Badge variant={hasNumber ? 'success' : 'default'} className="px-4 py-2 rounded-xl font-bold tracking-widest">
                        <div className="flex items-center gap-2" role="listitem">
                          {hasNumber ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                          <Label className="m-0">INCLUDES NUMBER</Label>
                        </div>
                      </Badge>
                      <Badge variant={hasSpecial ? 'success' : 'default'} className="px-4 py-2 rounded-xl font-bold tracking-widest">
                        <div className="flex items-center gap-2" role="listitem">
                          {hasSpecial ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                          <Label className="m-0">SPECIAL CHARACTER</Label>
                        </div>
                      </Badge>
                      <Badge variant={passwordMatch === true ? 'success' : passwordMatch === false ? 'danger' : 'default'} className="px-4 py-2 rounded-xl font-bold tracking-widest">
                        <div className="flex items-center gap-2" role="listitem">
                          {passwordMatch === true ? <CheckCircle2 size={16} /> : passwordMatch === false ? <XCircle size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
                          <Label className="m-0">IDENTICAL MATCH</Label>
                        </div>
                      </Badge>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={loading || !passwordValid || !passwordMatch}
                        variant="success"
                        size="xl"
                        loading={loading}
                      >
                        <Lock size={18} className="mr-3" /> Commit Changes
                      </Button>
                    </div>
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>
          </Stack>
        </div>

        {!isVerified && showForgot && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="p-6 rounded-[24px] bg-danger/5 border border-danger/20 flex gap-4 items-center shadow-inner"
          >
            <AlertCircle size={24} className="text-danger shrink-0" />
            <div className="flex-1">
              <Body className="text-danger font-semibold text-[12px] uppercase tracking-widest">Authentication Conflict</Body>
              <Body className="text-[13px] text-danger/80 m-0 mt-1">If you can't recall your password, use the recovery engine.</Body>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onForgotPassword}
            >
              Reset Via Email
            </Button>
          </motion.div>
        )}
      </form>

      <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-40 -mb-40 pointer-events-none" />
    </Card>
  );
}
