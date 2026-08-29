import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

export interface CaptchaFieldHandle {
  reset: () => void;
}

interface CaptchaFieldProps {
  onTokenChange: (token: string | null) => void;
  onError?: () => void;
}

/* Shared Turnstile widget (FIX-4 / BE-5). Extracted from the Login/Signup
   inline usage so the reauthenticate gate can reuse the exact same mechanism:
   same widget, same env site key, same server-side verification path. */
export const CaptchaField = forwardRef<CaptchaFieldHandle, CaptchaFieldProps>(
  ({ onTokenChange, onError }, ref) => {
    const turnstileRef = useRef<TurnstileInstance | undefined>(null);

    useImperativeHandle(ref, () => ({
      reset: () => turnstileRef.current?.reset(),
    }));

    return (
      <Turnstile
        ref={turnstileRef}
        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
        onSuccess={(token) => onTokenChange(token)}
        onExpire={() => onTokenChange(null)}
        onError={() => {
          onTokenChange(null);
          onError?.();
        }}
      />
    );
  }
);

CaptchaField.displayName = 'CaptchaField';
