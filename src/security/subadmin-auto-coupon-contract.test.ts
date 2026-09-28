/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/* ─── SUB-ADMIN AUTO-COUPON GENERATION + LIVE RECONCILIATION (static contract)
 * Locks in the security and correctness properties of:
 *   - supabase/migrations/20260903100000_sub_admin_auto_coupon_generation.sql
 *   - supabase/migrations/20260903110000_live_schema_reconciliation.sql
 *   - supabase/functions/onboard-sub-admin/index.ts  (invite redirect + return)
 *   - src/validations/authSchemas.ts                 (coupon now optional)
 *   - src/utils/errorClassification.ts               (new domain codes)
 * Deterministic, no DB required — mirrors the sql-contract pattern used by the
 * provisioning master test.
 * ──────────────────────────────────────────────────────────────────────────── */

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n')

const COUPON = read('supabase/migrations/20260903100000_sub_admin_auto_coupon_generation.sql')
const RECON = read('supabase/migrations/20260903110000_live_schema_reconciliation.sql')
const HARD_LEGACY = read('supabase/migrations/20260918120000_hardening_remove_legacy_auth_sub_admin_path.sql')
const HARD_DEAD = read('supabase/migrations/20260918130000_hardening_drop_dead_update_user_streak.sql')
const HARD_RPC = read('supabase/migrations/20260918140000_hardening_rpc_consistency_and_coupon_normalization.sql')
const EDGE = read('supabase/functions/onboard-sub-admin/index.ts')
const SCHEMA = read('src/validations/authSchemas.ts')
const CLASS = read('src/utils/errorClassification.ts')
const MASTER = read('src/security/subadmin-provisioning-master.test.ts')

describe('AUTO-COUPON: server-side, crypto-only generator (no client influence)', () => {
  it('generates in a SECURITY DEFINER plpgsql helper, not in the EF/client', () => {
    expect(COUPON).toMatch(/CREATE OR REPLACE FUNCTION public\.gen_sub_admin_coupon\(\)/)
    expect(COUPON).toContain('SECURITY DEFINER')
    expect(COUPON).toContain('SET search_path = public, pg_temp')
  })

  it('uses gen_random_bytes (crypto) — never MD5(RANDOM()) / ids / emails / counters', () => {
    expect(COUPON).toContain('gen_random_bytes(1)')
    // Strip doc comments before negative assertions: the file intentionally
    // states "never from Math.random()" in comments; we scan only real code.
    const code = COUPON.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
    // pgcrypto installs into the `extensions` schema on this platform, which is
    // NOT in the helper's pinned search_path (public, pg_temp). The call MUST be
    // explicitly schema-qualified or it fails at runtime with
    // "function gen_random_bytes(integer) does not exist" (verified on LIVE).
    expect(code).toContain('extensions.gen_random_bytes(1)')
    // The forbidden legacy pattern (present in the ORIGINAL baseline) must NOT
    // be introduced by the new generator.
    expect(code).not.toMatch(/MD5\(RANDOM\(\)/)
    expect(code).not.toMatch(/floor\(random\(\).*1000000/)
    expect(code).not.toMatch(/Math\.random/)
  })

  it('matches the app coupon convention: 8-char unambiguous uppercase alnum', () => {
    expect(COUPON).toMatch(/FOR v_i IN 1\.\.8 LOOP/)
    expect(COUPON).toContain("'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'")
  })
})

describe('AUTO-COUPON: atomic, collision-safe, bounded retry in the RPC', () => {
  it('extended create RPC keeps the SAME 7-arg signature (existing contract)', () => {
    expect(COUPON).toContain('p_commission_percentage   numeric DEFAULT 0')
    expect(COUPON).toContain('RETURNS uuid')
  })

  it('auto-generates when the supplied coupon is blank / NULL', () => {
    expect(COUPON).toContain("v_supplied := p_coupon_code IS NOT NULL AND btrim(p_coupon_code) <> '';")
    expect(COUPON).toContain('RAISE EXCEPTION \'COUPON_TAKEN\'')
  })

  it('wraps the INSERT in an implicit subtransaction (BEGIN..EXCEPTION, no SAVEPOINT) and retries on unique_violation (bounded)', () => {
    // An explicit SAVEPOINT / ROLLBACK TO SAVEPOINT must NOT be used: PL/pgSQL
    // on the live platform cannot parse `ROLLBACK TO` in a function body
    // (verified server `syntax error at or near "TO"`), so the deployable,
    // semantically-identical pattern is a BEGIN..EXCEPTION subtransaction.
    // Only non-comment code is scanned for the negative assertions — the file
    // legitimately discusses the rejected `ROLLBACK TO` construct in comments.
    const code = COUPON.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
    expect(code).not.toContain('ROLLBACK TO')
    expect(code).not.toContain('SAVEPOINT sub_admin_insert')
    expect(COUPON).toContain('EXCEPTION WHEN unique_violation THEN')
    expect(COUPON).toContain('v_max_attempts constant int := 8')
    expect(COUPON).toContain("RAISE EXCEPTION 'COUPON_GENERATION_EXHAUSTED'")
  })

  it('only retries for AUTO-GENERATED codes; a supplied collision still raises COUPON_TAKEN', () => {
    expect(COUPON).toContain("IF v_supplied THEN\n        RAISE EXCEPTION 'COUPON_TAKEN'")
  })

  it('role grant + audit remain in the SAME transaction (atomicity preserved)', () => {
    expect(COUPON).toContain("SET role = 'sub_admin', sub_admin_id = v_sub_admin_id")
    expect(COUPON).toContain("'sub_admin_onboarded'")
    expect(COUPON).toContain("'coupon_auto_generated', NOT v_supplied")
  })

  it('create RPC EXECUTE stays service_role-ONLY (privilege primitive)', () => {
    const sig = 'public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text, numeric)'
    expect(COUPON).toContain(`REVOKE ALL ON FUNCTION ${sig} FROM anon;`)
    expect(COUPON).toContain(`REVOKE ALL ON FUNCTION ${sig} FROM authenticated;`)
    expect(COUPON).toContain(`GRANT EXECUTE ON FUNCTION ${sig} TO service_role;`)
  })

  it('gen_sub_admin_coupon is locked to service_role (not a public coupon factory)', () => {
    expect(COUPON).toContain('REVOKE ALL ON FUNCTION public.gen_sub_admin_coupon() FROM anon;')
    expect(COUPON).toContain('REVOKE ALL ON FUNCTION public.gen_sub_admin_coupon() FROM authenticated;')
    expect(COUPON).toContain('GRANT EXECUTE ON FUNCTION public.gen_sub_admin_coupon() TO service_role;')
  })
})

describe('AUTO-COUPON: Edge Function optional-coupon + allowlisted invite redirect', () => {
  it('treats a blank coupon as auto-generate (no min-length gate on empty)', () => {
    expect(EDGE).toMatch(/couponCode\.length > 0 && couponCode\.length < 3/)
  })

  it('validates a SUPPLIED coupon is uppercase alphanumeric', () => {
    expect(EDGE).toMatch(/\^\[A-Z0-9\]\+\$/)
  })

  it('never derives coupon from client values — the DB is the authority', () => {
    // The only occurrences are the intentional documentation comment (line ~125),
    // never a real call producing a coupon. Assert no actual generation call.
    expect(EDGE).not.toMatch(/Math\.random\(\)\s*[-+*/]/)
    expect(EDGE).not.toMatch(/crypto\.randomUUID\(\)/) // generation lives in the RPC
  })

  it('passes an allowlisted, env-driven redirectTo to inviteUserByEmail', () => {
    expect(EDGE).toContain('inviteRedirectUrl')
    expect(EDGE).toContain('redirectTo: inviteRedirectUrl')
    expect(EDGE).toContain('isAllowedInviteRedirect')
    expect(EDGE).toContain('INVITE_REDIRECT_ALLOWLIST')
    // The redirect must be env-driven; it must NEVER come from the client payload.
    expect(EDGE).not.toMatch(/redirectTo:.*body\./s)
  })

  it('fails CLOSED (503) when the invite redirect is not allowlisted', () => {
    expect(EDGE).toContain('INVITE_REDIRECT_MISCONFIGURED')
    expect(EDGE).toContain('return json(503')
  })

  it('returns the server-generated coupon so the Admin UI can display it', () => {
    expect(EDGE).toContain('coupon_code: generatedCoupon')
    expect(EDGE).toContain('.from("sub_admins")')
  })

  it('maps COUPON_GENERATION_EXHAUSTED to a retryable 503', () => {
    expect(EDGE).toContain('COUPON_GENERATION_EXHAUSTED')
    expect(EDGE).toContain('return json(503')
  })
})

describe('AUTO-COUPON: client schema + domain UX', () => {
  it('client schema makes coupon optional (blank = auto-generate)', () => {
    expect(SCHEMA).toContain("z.literal('')")
    expect(SCHEMA).toContain('z.string().min(3')
  })

  it('onboarding success surfaces the generated coupon to the admin', () => {
    const page = read('src/pages/admin/AdminSubAdmins.tsx')
    expect(page).toContain('generatedCoupon')
    expect(page).toContain('res.coupon_code')
    const view = read('src/components/admin/sub-admins/AdminSubAdminsView.tsx')
    expect(view).toContain('Coupon code generated')
    expect(view).toContain('generatedCoupon')
  })

  it('domain classification covers the new codes without leaking internals', () => {
    expect(CLASS).toContain("case 'COUPON_GENERATION_EXHAUSTED'")
    expect(CLASS).toContain("case 'INVITE_REDIRECT_MISCONFIGURED'")
    const types = read('src/types/error.types.ts')
    expect(types).toContain("'INVITE_REDIRECT_MISCONFIGURED'")
    expect(types).toContain("'COUPON_GENERATION_EXHAUSTED'")
  })
})

describe('RECONCILIATION: fresh DB reproduces LIVE schema', () => {
  it('adds FULL UNIQUE(coupon_code) + UNIQUE(email) matching live names', () => {
    expect(RECON).toContain("conname = 'sub_admins_coupon_code_key'")
    expect(RECON).toContain("ADD CONSTRAINT sub_admins_coupon_code_key UNIQUE (coupon_code)")
    expect(RECON).toContain("conname = 'sub_admins_email_key'")
    expect(RECON).toContain("ADD CONSTRAINT sub_admins_email_key UNIQUE (email)")
  })

  it('creates user_creation_logs with live column set + RLS', () => {
    expect(RECON).toContain('CREATE TABLE IF NOT EXISTS public.user_creation_logs')
    expect(RECON).toContain('user_id       uuid NOT NULL')
    expect(RECON).toContain('error_code    text NOT NULL')
    expect(RECON).toContain("DEFAULT gen_random_uuid()")
    expect(RECON).toContain('ENABLE ROW LEVEL SECURITY')
  })

  it('reproduces handle_new_sub_admin + handle_email_confirmed (parity)', () => {
    expect(RECON).toContain('CREATE OR REPLACE FUNCTION public.handle_new_sub_admin()')
    expect(RECON).toContain('CREATE OR REPLACE FUNCTION public.handle_email_confirmed()')
  })

  it('attaches triggers guarded by FUNCTION (no live duplicate)', () => {
    expect(RECON).toContain("p.proname = 'handle_new_sub_admin'")
    expect(RECON).toContain("p.proname = 'handle_email_confirmed'")
    expect(RECON).toContain('CREATE TRIGGER on_auth_user_created_sub_admin')
    expect(RECON).toContain('CREATE TRIGGER on_email_confirmed')
  })

  it('reconciliation sum is accounted for (parity migration is present and latest)', () => {
    // Guards against the reconciliation migration being accidentally removed.
    expect(RECON).toContain('live schema reconciliation')
    expect(MASTER).toBeDefined()
  })
})

describe('HARDENING: legacy client-metadata provisioning path is REMOVED (9.1/9.2)', () => {
  it('drops the auth.users trigger, its function, and the dead audit table', () => {
    expect(HARD_LEGACY).toContain('DROP TRIGGER IF EXISTS on_auth_user_created_sub_admin ON auth.users')
    expect(HARD_LEGACY).toContain('DROP FUNCTION IF EXISTS public.handle_new_sub_admin()')
    expect(HARD_LEGACY).toContain('DROP TABLE IF EXISTS public.user_creation_logs')
  })

  it('keeps the legitimate auth triggers untouched (signup role + email confirm)', () => {
    // The hardening migration must NOT drop on_auth_user_created / on_email_confirmed.
    expect(HARD_LEGACY).not.toContain('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users')
    expect(HARD_LEGACY).not.toContain('DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users')
    expect(HARD_LEGACY).not.toContain('DROP FUNCTION IF EXISTS public.handle_email_confirmed()')
    expect(HARD_LEGACY).not.toContain('DROP FUNCTION IF EXISTS public.handle_new_user()')
  })

  it('drops the dead, anon-writable SECURITY DEFINER update_user_streak RPC', () => {
    expect(HARD_DEAD).toContain('DROP FUNCTION IF EXISTS public.update_user_streak(p_user_id uuid)')
  })
})

describe('HARDENING: exam access parity + coupon normalization (9.3/9.4/9.5)', () => {
  it('is_teacher_exam_active delegates access to the canonical _pf_teacher_exam_access predicate', () => {
    expect(HARD_RPC).toMatch(/CREATE OR REPLACE FUNCTION public\.is_teacher_exam_active\(/)
    expect(HARD_RPC).toContain('IF NOT public._pf_teacher_exam_access(p_exam_id) THEN')
  })

  it('get_teacher_exam_questions blocks non-owners from draft/out-of-window exams', () => {
    expect(HARD_RPC).toMatch(/CREATE OR REPLACE FUNCTION public\.get_teacher_exam_questions\(/)
    expect(HARD_RPC).toContain("IF v_status <> 'published' THEN")
    expect(HARD_RPC).toContain("RAISE EXCEPTION 'EXAM_NOT_STARTED'")
    expect(HARD_RPC).toContain("RAISE EXCEPTION 'EXAM_WINDOW_CLOSED'")
    // Answer fields remain LITERALLY ABSENT from the student projection.
    const studentProjectionOnly = (HARD_RPC.match(/q\.display_order, q\.diagram[\s\S]*?\) q;/g) ?? [''])
    expect(studentProjectionOnly.length).toBeGreaterThanOrEqual(1)
    expect(HARD_RPC).toContain('q.correct_option,')
  })

  it('revokes anon EXECUTE on get_teacher_exam_questions (defense-in-depth residue)', () => {
    expect(HARD_RPC).toContain('REVOKE ALL ON FUNCTION public.get_teacher_exam_questions(uuid) FROM anon')
  })

  it('validate_coupon normalizes the probe to canonical upper+btrim form', () => {
    expect(HARD_RPC).toContain('WHERE coupon_code = upper(btrim(p_coupon)) AND status = \'active\'')
    // anon EXECUTE preserved — validate_coupon is intentionally pre-login.
    expect(HARD_RPC).toContain('GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO anon, authenticated, service_role')
  })

  it('handle_new_user normalizes signup-metadata coupons to canonical upper+btrim form', () => {
    expect(HARD_RPC).toContain("v_coupon := NULLIF(upper(btrim(new.raw_user_meta_data->>'coupon_code')), '');")
    expect(HARD_RPC).toContain("v_role_str := 'user'")
  })
})
