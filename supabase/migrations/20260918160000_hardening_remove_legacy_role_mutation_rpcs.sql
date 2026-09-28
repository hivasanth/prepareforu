-- ─────────────────────────────────────────────────────────────────────────────
-- FINAL SIGN-OFF PASS — P3: remove DEAD role-mutation RPC surface
-- ─────────────────────────────────────────────────────────────────────────────
-- Audit (2026-09-18):
--   promote_to_admin(uuid)      — SECURITY DEFINER, search_path=public, is_admin()-guarded
--   demote_from_admin(uuid)     — SECURITY DEFINER, search_path=public, is_admin()-guarded
--   Both: EXECUTE granted to postgres + authenticated + service_role.
--   ZERO callers: no src/edge/e2e/tests/UI references; no pg_depend object;
--   no policies/triggers/views; the only reference repo-wide is a comment inside
--   public.handle_new_user (role is server-authoritative; edge path already uses
--   admin_revoke_sub_admin_role for compensation).
--   MIGRATION HISTORY: both introduced by 20260401000000 baseline; never called
--   from an active login path. Classified DEAD -> removed safely (forward-only).

DROP FUNCTION IF EXISTS public.promote_to_admin(p_user_id uuid);

DROP FUNCTION IF EXISTS public.demote_from_admin(p_user_id uuid);

COMMIT;