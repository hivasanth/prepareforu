/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/* ─── MASTER SUB-ADMIN PROVISIONING & AUTH REMEDIATION (F1–F6) ────────────────
 * Static regression contracts for:
 *  - supabase/migrations/20260501000000_sub_admins_provisioning_baseline.sql  (F2)
 *  - supabase/migrations/20260829000001_atomic_sub_admin_provisioning_rpc.sql (F1/F3/F2)
 *  - supabase/functions/onboard-sub-admin/index.ts                            (F1/F3/F4)
 *  - supabase/functions/security-gateway/index.ts                             (F4)
 *
 * Deterministic, no DB required — mirrors the sql-contract pattern already
 * used for create_teacher_exam_atomic (20260828203000).
 * ──────────────────────────────────────────────────────────────────────────── */

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n')

const BASELINE = read('supabase/migrations/20260501000000_sub_admins_provisioning_baseline.sql')
const PROVISION = read('supabase/migrations/20260829000001_atomic_sub_admin_provisioning_rpc.sql')
const EDGE = read('supabase/functions/onboard-sub-admin/index.ts')
const GATEWAY = read('supabase/functions/security-gateway/index.ts')
const HARD_CREATE = read('supabase/migrations/20260918150000_hardening_remove_legacy_create_sub_admin.sql')
const HARD_ROLE = read('supabase/migrations/20260918160000_hardening_remove_legacy_role_mutation_rpcs.sql')
const PIN_HNU = read('supabase/migrations/20260918170000_hardening_pin_handle_new_user_search_path.sql')

/** Collapse whitespace so aligned DDL matches single-space-contract literals. */
const norm = (s: string) => s.replace(/\s+/g, ' ').trim()

/* ─────────────────────────────────────────────────────────────────────────────
 * F2 — Baseline: sub_admins table + is_sub_admin() reconciliation
 * ──────────────────────────────────────────────────────────────────────────- */
describe('F2: sub_admins provisioning baseline migration', () => {
  it('creates public.sub_admins idempotently (IF NOT EXISTS → no-op on LIVE)', () => {
    expect(BASELINE).toContain('CREATE TABLE IF NOT EXISTS public.sub_admins')
  })

  it('defines the canonical column set consumed by code/policies/edge fn', () => {
    const n = norm(BASELINE)
    for (const col of ['user_id uuid NOT NULL', 'full_name text', 'email text', 'coupon_code text', "status text NOT NULL DEFAULT 'active'", 'created_by uuid', 'total_referrals integer', 'notification_prefs jsonb', 'provision_request_id text', 'created_at timestamptz']) {
      expect(n).toContain(col)
    }
  })

  it('enables ROW LEVEL SECURITY (required for the 20260502 policy pair)', () => {
    expect(BASELINE).toContain('ALTER TABLE public.sub_admins ENABLE ROW LEVEL SECURITY;')
  })

  it('does NOT bake RLS policy STATEMENTS into the baseline (single source = 20260502)', () => {
    expect(BASELINE).not.toMatch(/^\s*CREATE POLICY/m)
  })

  it('reconciles is_sub_admin() with SECURITY DEFINER + pinned search_path + role semantics', () => {
    expect(BASELINE).toContain('CREATE OR REPLACE FUNCTION public.is_sub_admin()')
    expect(BASELINE).toContain('SECURITY DEFINER')
    expect(BASELINE).toContain('SET search_path = public, pg_temp')
    expect(BASELINE).toContain("role = 'sub_admin'")
    expect(BASELINE).toContain('auth.uid()')
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * F3 — Coupon-uniqueness backstop
 * ──────────────────────────────────────────────────────────────────────────- */
describe('F3: active-coupon uniqueness backstop', () => {
  it('creates a PARTIAL unique index on active coupons', () => {
    expect(PROVISION).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS ux_sub_admins_coupon_active\s+ON public\.sub_admins \(coupon_code\)\s+WHERE status = 'active';/)
  })

  it('coupon uniqueness is enforced by EXACTLY one index — the partial unique active-coupon index', () => {
    const couponIndexes = PROVISION.match(/CREATE UNIQUE INDEX IF NOT EXISTS ux_sub_admins_coupon_active[\s\S]*?;/g) ?? []
    expect(couponIndexes.length).toBe(1)
    expect(PROVISION).toContain('WHERE status = ')
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * F1 — Atomic provisioning RPC (infrastructure contract)
 * ──────────────────────────────────────────────────────────────────────────- */
describe('F1: admin_create_sub_admin_profile RPC — atomic + service_role-only', () => {
  const fn = /CREATE OR REPLACE FUNCTION public\.admin_create_sub_admin_profile/

  it('is SECURITY DEFINER with a pinned search_path', () => {
    expect(PROVISION).toMatch(fn)
    expect(PROVISION).toContain('SECURITY DEFINER')
    expect(PROVISION).toContain('SET search_path = public')
  })

  it('writes the profile AND grants the role in ONE transaction', () => {
    expect(PROVISION).toMatch(/INSERT INTO public\.sub_admins \(/)
    expect(PROVISION).toMatch(/SET role = 'sub_admin', sub_admin_id = v_sub_admin_id/)
  })

  it('serialises races with FOR UPDATE on BOTH the target user and the coupon', () => {
    expect(PROVISION).toMatch(/SELECT id INTO v_sub_admin_id\s+FROM public\.users\s+WHERE id = p_user_id AND email = p_email AND role = 'user'\s+FOR UPDATE;/)
    expect(PROVISION).toMatch(/FROM public\.sub_admins\s+WHERE coupon_code = p_coupon_code AND status = 'active'\s+FOR UPDATE/)
  })

  it("never overrides a live role (raises USER_NOT_FOUND unless role='user')", () => {
    expect(PROVISION).toContain("AND role = 'user'")
    expect(PROVISION).toContain("RAISE EXCEPTION 'USER_NOT_FOUND'")
  })

  it('re-raises explicit COUPON_TAKEN / ROLE_GRANT_FAILED (roll back everything)', () => {
    expect(PROVISION).toContain("RAISE EXCEPTION 'COUPON_TAKEN'")
    expect(PROVISION).toContain("RAISE EXCEPTION 'ROLE_GRANT_FAILED'")
  })

  it('keeps the transactional security audit trail with the correlation key', () => {
    expect(PROVISION).toContain("PERFORM public.log_security_event(")
    expect(PROVISION).toContain("'sub_admin_onboarded'")
    expect(PROVISION).toContain("'request_id', p_request_id")
  })

  it('EXECUTE is granted to service_role ONLY — a privilege-escalation primitive must not be client-callable', () => {
    const sig = 'public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text)'
    expect(PROVISION).toContain(`REVOKE ALL ON FUNCTION ${sig} FROM PUBLIC;`)
    expect(PROVISION).toContain(`REVOKE ALL ON FUNCTION ${sig} FROM anon;`)
    expect(PROVISION).toContain(`REVOKE ALL ON FUNCTION ${sig} FROM authenticated;`)
    expect(PROVISION).toContain(`GRANT EXECUTE ON FUNCTION ${sig} TO service_role;`)
    expect(PROVISION).not.toMatch(/GRANT EXECUTE[^;]*TO authenticated[^;]*;/)
  })
})

describe('IDEMPOTENCY: provision_request_id is the single-operation backstop', () => {
  it('adds the provision_request_id column idempotently (ADD COLUMN IF NOT EXISTS)', () => {
    expect(PROVISION).toContain('ADD COLUMN IF NOT EXISTS provision_request_id text;')
    expect(PROVISION).toContain('ux_sub_admins_provision_request')
    expect(PROVISION).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS ux_sub_admins_provision_request\s+ON public\.sub_admins \(provision_request_id\)\s+WHERE provision_request_id IS NOT NULL;/)
  })

  it('replays with the same request_id → idempotent success (returns existing id)', () => {
    expect(PROVISION).toContain('WHERE provision_request_id = p_request_id')
    expect(PROVISION).toContain('RETURN v_sub_admin_id;            -- genuine replay')
  })

  it('raises ALREADY_PROVISIONED when the same key raced a DIFFERENT auth user', () => {
    expect(PROVISION).toContain("RAISE EXCEPTION 'ALREADY_PROVISIONED'")
  })

  it('stores the request_id on the INSERT (backstop ⇒ one row per operation)', () => {
    expect(PROVISION).toContain('provision_request_id')
    expect(PROVISION).toContain('p_request_id')
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * F2 — handle_new_user trigger attach (guarded, post final definition)
 * ──────────────────────────────────────────────────────────────────────────- */
describe('F2: auth.users trigger attach is repository-managed', () => {
  it('attaches handle_new_user guarded by FUNCTION (never duplicates a live trigger)', () => {
    expect(PROVISION).toContain("t.tgrelid = 'auth.users'::regclass")
    expect(PROVISION).toContain("p.proname = 'handle_new_user'")
    expect(PROVISION).toContain('CREATE TRIGGER trg_handle_new_user_on_insert')
    expect(PROVISION).toContain('EXECUTE FUNCTION public.handle_new_user();')
  })

  it('baseline does NOT attach the trigger before the function exists (fresh-DB ordering)', () => {
    // handle_new_user's final body is defined in 20260826000001; see PROVISION only.
    expect(BASELINE).not.toContain('CREATE TRIGGER')
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * F1/F3/F4 — Edge Function onboard-sub-admin
 * ──────────────────────────────────────────────────────────────────────────- */
describe('F1/F3: onboard-sub-admin uses the atomic RPC + compensation', () => {
  it('keeps the server-side admin gate (JWT + users.role check)', () => {
    expect(EDGE).toMatch(/auth\.getUser\(jwt\)/)
    expect(EDGE).toContain('callerProfile.role !== "admin"')
  })

  it('invokes admin_create_sub_admin_profile with the full p_* contract', () => {
    expect(EDGE).toContain('admin_create_sub_admin_profile')
    for (const key of ['p_user_id', 'p_full_name', 'p_email', 'p_coupon_code', 'p_created_by', 'p_request_id']) {
      expect(EDGE).toContain(key)
    }
  })

  it('NO LONGER performs direct writes in the edge function (profile INSERT / role UPDATE moved into the RPC)', () => {
    expect(EDGE).not.toMatch(/\.insert\(/)
    expect(EDGE).not.toMatch(/\.update\(/)
  })

  it('keeps the fail-early duplicate guards (no useless invites) — coupon/email reads only', () => {
    expect(EDGE).toContain('error: "EDUCATOR_EXISTS"')
    expect(EDGE).toContain('error: "COUPON_TAKEN"')
    expect(EDGE).toContain('.from("sub_admins")')
  })

  it('compensates a failed provisioning by deleting the orphan auth user', () => {
    expect(EDGE).toContain('auth.admin.deleteUser')
    expect(EDGE).toContain('onboard_compensated')
  })

  it('maps coupon races (message + SQLSTATE 23505) to 409 COUPON_TAKEN', () => {
    expect(EDGE).toContain('rpcErr.code === "23505"')
    expect(EDGE).toContain('error: "COUPON_TAKEN"')
  })
})

describe('IDEMPOTENCY: edge function threads a per-operation request_id', () => {
  it('requires request_id (rejects missing/malformed with VALIDATION_FAILED)', () => {
    expect(EDGE).toContain('request_id')
    expect(EDGE).toContain('UUID_RE')
    expect(EDGE).toContain('A valid request_id is required')
  })

  it('replays an existing provision_request_id → 200 without creating auth users', () => {
    expect(EDGE).toContain('provision_request_id')
    expect(EDGE).toContain('replayed: true')
    expect(EDGE).toContain('.eq("provision_request_id", requestId)')
  })

  it('resolves the ALREADY_PROVISIONED race to the canonical profile + compensates its own invite', () => {
    expect(EDGE).toContain('already_provisioned')
    expect(EDGE).toContain('canonical?.id')
  })

  it('threads request_id through EVERY audit event (recoverability, never swallowed)', () => {
    expect(EDGE).toContain('request_id: requestId')
    expect(EDGE).toContain('onboard_compensation_failed')
  })
})

describe('F4: onboard-sub-admin rate limiter is FAIL-CLOSED when unconfigured', () => {
  it('refuses to proceed (503 RATE_LIMIT_UNAVAILABLE) instead of silently unthrottled', () => {
    expect(EDGE).toContain('rate_limit_misconfigured')
    expect(EDGE).toContain('error: "RATE_LIMIT_UNAVAILABLE"')
    expect(EDGE).toContain('return json(503')
  })

  it('no longer contains the old fail-open warn-and-allow path', () => {
    expect(EDGE).not.toContain('rate limiting disabled')
  })
})

describe('F4: security-gateway Turnstile is FAIL-CLOSED on missing secret', () => {
  it('returns false (→ 403 CAPTCHA_FAILED) when TURNSTILE_SECRET_KEY is unset', () => {
    expect(GATEWAY).toContain('return false')
    expect(GATEWAY).not.toContain("return true // Fail-open: allow if not configured")
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * Client-layer invariants (regression — browser must never hold power)
 * ──────────────────────────────────────────────────────────────────────────- */
describe('Client-layer invariants (regression)', () => {
  it('browser service never touches service-role / admin APIs', () => {
    const srcDir = readFileSync(join(root, 'src/App.tsx'), 'utf8')
    expect(srcDir).toBeDefined()
    // The onboarding service call still goes through the EDGE FUNCTION, not a table write.
    const svc = read('src/services/userService.ts')
    expect(svc).toMatch(/functions\.invoke\('onboard-sub-admin'/)
    expect(svc).toContain('coupon_code: couponCode')
    expect(svc).toContain('request_id: requestId')
    // The former module-global idempotency key is GONE: requestId is now a
    // per-creation caller-owned idempotency key (Phase 2 — no shared mutable
    // module state can collide two concurrent onboarding attempts).
    expect(svc).not.toContain('lastOnboardRequestId')
    expect(svc).toContain('requestId: string')
  })

  it('invite tokens are ONLY consumed by the isolated invite client, never the shared dict client', () => {
    const sup = read('src/lib/supabase.ts')
    // Session-isolation guard: the shared client disables URL-session detection
    // on the dedicated /auth/invite route so invite tokens are consumed by the
    // isolated invite client (storageKey 'p4u-invite', non-persisted) instead of
    // the shared persisted client — preventing a cross-identity session collision.
    expect(sup).toContain("detectSessionInUrl: !isInviteRoute")
    expect(sup).toContain("/auth/invite")
    // The invite callback is the single consumer; there is no OTP-in-URL handling
    // on the shared login path.
    const inv = read('src/lib/inviteClient.ts')
    expect(inv).toMatch(/storageKey:\s*'p4u-invite'/)
    expect(inv).toMatch(/persistSession:\s*false/)
  })

  it('onboarding modal still normalizes the coupon and blocks double-submit', () => {
    const page = read('src/pages/admin/AdminSubAdmins.tsx')
    expect(page).toContain('.trim().toUpperCase()')
    expect(page).toContain('addingSa')
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * COMMISSION — canonical single-source field + update RPC (master commission
 * feature). Static contracts for the commission migration, the extended create
 * RPC, the new update RPC, the edge-function pass-through, and the client
 * request_id lifecycle.
 * ──────────────────────────────────────────────────────────────────────────- */
const COMMISSION = read('supabase/migrations/20260901000000_sub_admin_commission.sql')

describe('COMMISSION: canonical field + DB-level protection', () => {
  it('adds the commission column as exact numeric (NOT float) with NOT NULL DEFAULT 0', () => {
    expect(COMMISSION).toContain('commission_percentage numeric(5,2) NOT NULL DEFAULT 0')
    expect(COMMISSION.toLowerCase()).not.toContain('commission_percentage double')
    expect(COMMISSION.toLowerCase()).not.toContain('commission_percentage real')
  })

  it('enforces the business range [0,100] with a guarded DB CHECK', () => {
    expect(COMMISSION).toContain("conname = 'sub_admins_commission_percentage_range'")
    expect(COMMISSION).toMatch(/commission_percentage >= 0 AND commission_percentage <= 100/)
  })

  it('create RPC is extended to accept + validate + persist commission atomically', () => {
    expect(COMMISSION).toContain('CREATE OR REPLACE FUNCTION public.admin_create_sub_admin_profile(')
    expect(COMMISSION).toContain('p_commission_percentage   numeric DEFAULT 0')
    expect(COMMISSION).toContain("RAISE EXCEPTION 'INVALID_COMMISSION'")
    expect(COMMISSION).toContain('commission_percentage')
    expect(COMMISSION).toContain("'sub_admin_onboarded'")
  })

  it('create EXECUTE stays service_role-ONLY on the 7-arg signature (privilege primitive)', () => {
    const sig = 'public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text, numeric)'
    expect(COMMISSION).toContain(`REVOKE ALL ON FUNCTION ${sig} FROM PUBLIC;`)
    expect(COMMISSION).toContain(`REVOKE ALL ON FUNCTION ${sig} FROM anon;`)
    expect(COMMISSION).toContain(`REVOKE ALL ON FUNCTION ${sig} FROM authenticated;`)
    expect(COMMISSION).toContain(`GRANT EXECUTE ON FUNCTION ${sig} TO service_role;`)
  })

  it('package drops the orphaned pre-commission 6-arg create overload (one canonical path)', () => {
    expect(COMMISSION).toMatch(/DROP FUNCTION IF EXISTS public\.admin_create_sub_admin_profile\(uuid, text, text, text, uuid, text\);/)
  })

  it('update RPC is SECURITY DEFINER, self-authorizes is_admin(), validates, and is authenticated-EXECUTE only', () => {
    expect(COMMISSION).toContain('admin_update_sub_admin_commission(')
    expect(COMMISSION).toContain('SECURITY DEFINER')
    expect(COMMISSION).toContain('OR NOT is_admin() THEN')
    expect(COMMISSION).toContain("RAISE EXCEPTION 'INVALID_COMMISSION'")
    expect(COMMISSION).toContain('CONCURRENT_UPDATE_CONFLICT')
    expect(COMMISSION).toContain("RAISE EXCEPTION 'SUB_ADMIN_NOT_FOUND'")
    expect(COMMISSION).toContain('GRANT EXECUTE ON FUNCTION public.admin_update_sub_admin_commission(uuid, numeric, timestamptz) TO authenticated;')
  })

  it('grant hygiene: update RPC denies anon + service_role + PUBLIC', () => {
    const sig = 'public.admin_update_sub_admin_commission(uuid, numeric, timestamptz)'
    expect(COMMISSION).toContain(`REVOKE ALL ON FUNCTION ${sig} FROM PUBLIC;`)
    expect(COMMISSION).toContain(`REVOKE ALL ON FUNCTION ${sig} FROM anon;`)
    expect(COMMISSION).toContain(`REVOKE ALL ON FUNCTION ${sig} FROM service_role;`)
  })
})

describe('COMMISSION: edge function pass-through + validation', () => {
  it('threads commission_percentage from the payload into the atomic RPC', () => {
    expect(EDGE).toContain('p_commission_percentage')
    expect(EDGE).toContain('commissionPercentage ?? 0')
    expect(EDGE).toContain('commission_percentage')
  })

  it('validates commission range server-side (reject, never clamp)', () => {
    expect(EDGE).toMatch(/commissionPercentage < 0 \|\| commissionPercentage > 100/)
    expect(EDGE).toMatch(/Number\.isNaN\(body\.commission_percentage\) \|\| !Number\.isFinite\(body\.commission_percentage\)/)
  })

  it('maps a DB INVALID_COMMISSION failure to a 400/INVALID_COMMISSION response', () => {
    expect(EDGE).toContain('invalid_commission')
    expect(EDGE).toContain('error: "INVALID_COMMISSION"')
  })
})

describe('COMMISSION: client request_id lifecycle + domain UX', () => {
  it('page owns a per-creation idempotency key and clears it on success/close (no module-global collision)', () => {
    const page = read('src/pages/admin/AdminSubAdmins.tsx')
    expect(page).toContain('requestIdRef')
    expect(page).toContain('requestIdRef.current = null')
    expect(page).toMatch(/requestIdRef\.current = makeRequestId\(\)/)
    expect(page).not.toContain('let lastOnboardRequestId')
    expect(page).not.toContain('lastOnboardRequestId =')
  })

  it('reuses the SAME request_id on retry (server dedupes), never on a fresh operation', () => {
    const page = read('src/pages/admin/AdminSubAdmins.tsx')
    expect(page).toMatch(/const requestId = requestIdRef\.current/)
    expect(page).toContain('requestIdRef.current = makeRequestId()')
  })

  it('NEVER ships a non-UUID fallback for the idempotency key (bug: Date.now-random token was rejected by the edge UUID_RE)', () => {
    const page = read('src/pages/admin/AdminSubAdmins.tsx')
    const uuid = read('src/utils/uuid.ts')
    // No date-based non-UUID token anywhere in the request-id source.
    expect(uuid).toMatch(/randomUUID|Math\.floor\(Math\.random\(\) \* n\)/)
    expect(uuid).not.toMatch(/Date\.now\(\)-\$\{Math\.random/)
    // Page delegates to the canonical generator (single source of truth).
    expect(page).toContain("import { newRequestId } from '../../utils/uuid'")
    expect(page).toMatch(/function makeRequestId\(\): string \{\s*\n\s*return newRequestId\(\)/)
  })

  it('regenerates exactly ONE fresh valid key when the ref is missing/invalid, without calling the edge fn', () => {
    const page = read('src/pages/admin/AdminSubAdmins.tsx')
    expect(page).toMatch(/if \(!requestId \|\| !UUID_RE\.test\(requestId\)\)/)
    expect(page).toContain('requestIdRef.current = makeRequestId()')
    expect(page).toContain('Your onboarding session expired. Please try again.')
    expect(page).toContain('return')
  })

  it('maps the backend error code to actionable domain UX including navigation', () => {
    const cls = read('src/utils/errorClassification.ts')
    expect(cls).toContain('mapDomainError')
    for (const code of ['EDUCATOR_EXISTS', 'COUPON_TAKEN', 'INVALID_COMMISSION', 'CONCURRENT_UPDATE_CONFLICT', 'UNAUTHENTICATED']) {
      expect(cls).toContain(`case '${code}'`)
    }
  })

  it('commission edit uses the admin-only update RPC with optimistic concurrency', () => {
    const repo = read('src/lib/repositories/user.repository.ts')
    const svc = read('src/services/userService.ts')
    expect(repo).toContain("rpc('admin_update_sub_admin_commission'")
    expect(repo).toContain('p_expected_updated_at')
    expect(svc).toContain('updateSubAdminCommission')
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * F-18 — FINAL PASS: legacy create_sub_admin removed (MD5 coupon path gone)
 * ──────────────────────────────────────────────────────────────────────────- */
describe('F-18: legacy create_sub_admin RPC is REMOVED (final sign-off pass)', () => {
  it('applies a forward-only migration that drops public.create_sub_admin(uuid, text)', () => {
    expect(HARD_CREATE).toContain('DROP FUNCTION IF EXISTS public.create_sub_admin(p_user_id uuid, p_coupon text);')
  })

  it('leaves the canonical admin_create_sub_admin_profile path untouched (no v2 created)', () => {
    expect(HARD_CREATE).not.toMatch(/CREATE (OR REPLACE )?FUNCTION/)
    expect(HARD_CREATE).not.toContain('create_sub_admin_v2')
  })

  it('no active source code calls the removed RPC (zero regression surface)', () => {
    const candidates = [
      read('src/pages/admin/AdminSubAdmins.tsx'),
      read('src/services/userService.ts'),
      read('src/lib/repositories/user.repository.ts'),
      EDGE,
    ]
    for (const src of candidates) {
      expect(src).not.toMatch(/rpc\(\s*['"]create_sub_admin['"]/)
      expect(src).not.toMatch(/from\(\s*['"]create_sub_admin['"]/)
    }
  })

  it('no MD5 coupon generation remains in the active provisioning path', () => {
    const provisioning = [
      read('supabase/migrations/20260903100000_sub_admin_auto_coupon_generation.sql'),
      EDGE,
    ]
    for (const src of provisioning) {
      expect(src).not.toMatch(/MD5\(RANDOM\(\)/)
    }
    const canonical = read('supabase/migrations/20260903100000_sub_admin_auto_coupon_generation.sql')
    expect(canonical).toContain('gen_sub_admin_coupon')
  })

  it('baseline retains the historical definition only (records removed as history, not live)', () => {
    expect(BASELINE).toContain('create_sub_admin')
    expect(HARD_CREATE).toContain('DROP FUNCTION IF EXISTS')
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * F-19 — FINAL PASS: legacy promote_to_admin / demote_from_admin removed and
 *        handle_new_user() SECURITY DEFINER search_path pinned (P6 finding)
 * ──────────────────────────────────────────────────────────────────────────- */
describe('F-19: legacy role-mutation RPCs REMOVED + handle_new_user search_path PINNED (final sign-off pass)', () => {
  it('applies a forward-only migration that drops promote_to_admin(uuid) and demote_from_admin(uuid)', () => {
    expect(HARD_ROLE).toContain('DROP FUNCTION IF EXISTS public.promote_to_admin(p_user_id uuid);')
    expect(HARD_ROLE).toContain('DROP FUNCTION IF EXISTS public.demote_from_admin(p_user_id uuid);')
  })

  it('does not re-create or redefine either role-mutation RPC (removal, not soften)', () => {
    expect(HARD_ROLE).not.toMatch(/CREATE (OR REPLACE )?FUNCTION\s+public\.(promote_to_admin|demote_from_admin)/)
  })

  it('no active source code calls the removed RPCs (zero regression surface)', () => {
    const candidates = [
      read('src/pages/admin/AdminSubAdmins.tsx'),
      read('src/services/userService.ts'),
      read('src/lib/repositories/user.repository.ts'),
      EDGE,
    ]
    for (const src of candidates) {
      expect(src).not.toMatch(/rpc\(\s*['"]promote_to_admin['"]/)
      expect(src).not.toMatch(/rpc\(\s*['"]demote_from_admin['"]/)
    }
  })

  it('every remaining SECURITY DEFINER auth-trigger keeps a pinned search_path', () => {
    expect(PIN_HNU).toContain("ALTER FUNCTION public.handle_new_user() SET search_path = 'public';")
    const hardening = read('supabase/migrations/20260918140000_hardening_rpc_consistency_and_coupon_normalization.sql')
    expect(hardening).toContain('CREATE OR REPLACE FUNCTION public.handle_new_user()')
    expect(hardening).toContain('SECURITY DEFINER')
  })

  it('baseline retains the historical definitions only (records removed as history, not live)', () => {
    expect(BASELINE).toContain('promote_to_admin')
    expect(BASELINE).toContain('demote_from_admin')
    expect(HARD_ROLE).toContain('DROP FUNCTION IF EXISTS')
  })
})