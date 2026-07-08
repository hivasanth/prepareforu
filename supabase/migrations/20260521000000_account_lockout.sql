-- ─── Account Lockout: Schema ──────────────────────────────────────────────────
-- Adds two columns to public.users.
-- failed_login_attempts : running count of consecutive wrong passwords
-- locked_until          : if set and in the future, account is locked
-- Both default to safe values — existing rows are unaffected.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ NULL;

-- Index so the lockout check (WHERE email = ?) is fast
CREATE INDEX IF NOT EXISTS idx_users_email_lockout
  ON public.users (email)
  WHERE locked_until IS NOT NULL;


-- ─── RPC 1: is_account_locked ─────────────────────────────────────────────────
-- Called BEFORE attempting Supabase auth.
-- Returns TRUE  → account is locked, tell the user how long to wait.
-- Returns FALSE → account is free to attempt login.
-- SECURITY DEFINER so it can read public.users without RLS interference.

CREATE OR REPLACE FUNCTION public.is_account_locked(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked_until  TIMESTAMPTZ;
  v_attempts      INTEGER;
  v_seconds_left  INTEGER;
BEGIN
  SELECT locked_until, failed_login_attempts
  INTO   v_locked_until, v_attempts
  FROM   public.users
  WHERE  email = LOWER(TRIM(p_email));

  -- User not found → not locked (Supabase auth will handle unknown email)
  IF NOT FOUND THEN
    RETURN jsonb_build_object('locked', false);
  END IF;

  -- Lock has expired → clear it automatically
  IF v_locked_until IS NOT NULL AND v_locked_until <= NOW() THEN
    UPDATE public.users
    SET    locked_until          = NULL,
           failed_login_attempts = 0
    WHERE  email = LOWER(TRIM(p_email));

    RETURN jsonb_build_object('locked', false);
  END IF;

  -- Still locked
  IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
    v_seconds_left := EXTRACT(EPOCH FROM (v_locked_until - NOW()))::INTEGER;
    RETURN jsonb_build_object(
      'locked',       true,
      'seconds_left', v_seconds_left,
      'attempts',     v_attempts
    );
  END IF;

  RETURN jsonb_build_object('locked', false, 'attempts', v_attempts);
END;
$$;


-- ─── RPC 2: record_failed_login ───────────────────────────────────────────────
-- Called AFTER Supabase auth returns a wrong-password error.
-- Increments the counter. Locks the account after 5 consecutive failures.
-- Lock duration: 15 minutes (easily changed in one place below).

CREATE OR REPLACE FUNCTION public.record_failed_login(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts     INTEGER;
  v_locked_until TIMESTAMPTZ;
  v_lock_after   CONSTANT INTEGER     := 5;
  v_lock_minutes CONSTANT INTEGER     := 15;
BEGIN
  UPDATE public.users
  SET    failed_login_attempts = failed_login_attempts + 1,
         locked_until = CASE
           WHEN (failed_login_attempts + 1) >= v_lock_after
           THEN NOW() + (v_lock_minutes || ' minutes')::INTERVAL
           ELSE locked_until
         END
  WHERE  email = LOWER(TRIM(p_email))
  RETURNING failed_login_attempts, locked_until
  INTO   v_attempts, v_locked_until;

  IF NOT FOUND THEN
    -- Email not in public.users (e.g. attacker probing) — return silently
    RETURN jsonb_build_object('recorded', false);
  END IF;

  RETURN jsonb_build_object(
    'recorded',     true,
    'attempts',     v_attempts,
    'locked',       v_locked_until IS NOT NULL AND v_locked_until > NOW(),
    'locked_until', v_locked_until
  );
END;
$$;


-- ─── RPC 3: reset_failed_login ────────────────────────────────────────────────
-- Called AFTER a successful login.
-- Clears the counter and any active lock so a legitimate user
-- is never penalised after recovering their password.

CREATE OR REPLACE FUNCTION public.reset_failed_login(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET    failed_login_attempts = 0,
         locked_until          = NULL
  WHERE  email = LOWER(TRIM(p_email));
END;
$$;


-- ─── RLS: lock the new columns down ──────────────────────────────────────────
-- Users must never be able to write these columns themselves.
-- The existing rls_users_self_update policy uses WITH CHECK that
-- only allows updating columns that match current values — but to be
-- explicit we revoke direct column access.
-- All writes go through SECURITY DEFINER RPCs above.

REVOKE UPDATE (failed_login_attempts, locked_until)
  ON public.users
  FROM authenticated;
