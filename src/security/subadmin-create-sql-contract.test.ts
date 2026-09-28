/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* ── CREATE-EXAM SQL CONTRACT (static regression) ────────────────────────────
 * Guards the hardened RPC migration's invariants so a future edit cannot
 * silently regress the security/consistency properties. This reads the
 * migration SOURCE (deterministic, no DB required) and pins the exact contract
 * the client/service/repository suites already exercise at the JS layer.
 * ─────────────────────────────────────────────────────────────────────────── */

const MIGRATION = `supabase/migrations/20260828203000_teacher_exam_create_security_hardening.sql`
const sql = readFileSync(resolve(process.cwd(), MIGRATION), 'utf8')

const CANONICAL_SNAKE_KEYS = [
  'question_text_en', 'question_text_te',
  'option_a_en', 'option_a_te', 'option_b_en', 'option_b_te',
  'option_c_en', 'option_c_te', 'option_d_en', 'option_d_te',
  'correct_option', 'display_order',
  'explanation_en', 'explanation_te', 'difficulty',
]

describe('SQL contract: canonical snake_case single-key RPC body', () => {
  it('reads every canonical field via the single-key helper', () => {
    for (const key of CANONICAL_SNAKE_KEYS) {
      expect(sql).toContain(`te_q_field(q, '${key}')`)
    }
  })

  it('contains NO camelCase spelling anywhere in the RPC contract', () => {
    expect(sql).not.toMatch(/questionText|optionA[ET]|optionB[ET]|optionC[ET]|optionD[ET]|correctOption|displayOrder|explanationEn|explanationTe/)
  })

  it('defines te_q_field as a single-key helper (no cobra-style dual-spelling fallback)', () => {
    expect(sql).toMatch(/te_q_field\(q jsonb, key text\)/)
    expect(sql).not.toMatch(/camel_key|snake_key|v_camel/)
  })

  it('drops the legacy dual-spelling 3-arg helper explicitly (graceful re-run)', () => {
    expect(sql).toContain('DROP FUNCTION IF EXISTS public.te_q_field(jsonb, text, text);')
  })
})

describe('SQL contract: W3 idempotency-before-rate-limit ordering', () => {
  it('the idempotent-retry short-circuit runs BEFORE the attempt INSERT', () => {
    const shortCircuit = sql.indexOf('WHERE sub_admin_id = v_owner_sa_id AND request_key = v_request_key;')
    const attemptInsert = sql.indexOf('INSERT INTO public.exam_publish_attempts')
    expect(shortCircuit).toBeGreaterThanOrEqual(0)
    expect(attemptInsert).toBeGreaterThan(0)
    expect(shortCircuit).toBeLessThan(attemptInsert)
  })

  it('the unique_violation recovery lookup runs AFTER the attempt INSERT (inside the insert block)', () => {
    const attemptInsert = sql.indexOf('INSERT INTO public.exam_publish_attempts')
    const recovery = sql.lastIndexOf('WHERE sub_admin_id = v_owner_sa_id AND request_key = v_request_key;')
    expect(recovery).toBeGreaterThan(attemptInsert)
  })
})

describe('SQL contract: per-owner idempotency index', () => {
  it('uses a composite partial unique index (sub_admin_id, request_key)', () => {
    expect(sql).toMatch(
      /ON public\.teacher_exams \(sub_admin_id, request_key\)\s+WHERE request_key IS NOT NULL/
    )
  })
})

describe('SQL contract: owner resolved from auth.uid() (Phase 4)', () => {
  it('resolves the owner from auth.uid() for non-admins and rejects mismatched p_sub_admin_id', () => {
    expect(sql).toMatch(/FROM public\.sub_admins sa\s+WHERE sa\.user_id = v_user_id/)
    expect(sql).toMatch(/v_owner_sa_id IS NULL OR v_owner_sa_id IS DISTINCT FROM p_sub_admin_id/)
  })

  it('lets admins target any existing sub_admin but requires it to exist', () => {
    expect(sql).toContain('IF public.is_admin() THEN')
    expect(sql).toMatch(/NOT EXISTS \(\s*SELECT 1 FROM public\.sub_admins WHERE id = v_owner_sa_id/)
  })

  it('attributions (rate-limit, insert, audit) all use the RESOLVED owner', () => {
    expect(sql).toMatch(/AND sub_admin_id = v_owner_sa_id\b/)
    expect(sql).toContain('v_owner_sa_id, btrim(p_title)')
    expect(sql).toContain("'sub_admin_id', v_owner_sa_id")
  })
})

describe('SQL contract: security posture', () => {
  it('keeps the RPC SECURITY DEFINER with a hardened search_path', () => {
    expect(sql).toContain('SECURITY DEFINER')
    expect(sql).toContain("SET search_path = 'public'")
  })

  it('drops BOTH legacy signatures (9-arg and the current 10-arg) before rebuild', () => {
    expect(sql).toContain('DROP FUNCTION IF EXISTS public.create_teacher_exam_atomic(')
  })

  it('grants EXECUTE to authenticated ONLY (no anon/PUBLIC/service_role)', () => {
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.create_teacher_exam_atomic\([\s\S]*FROM PUBLIC;/)
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.create_teacher_exam_atomic\([\s\S]*FROM anon;/)
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.create_teacher_exam_atomic\([\s\S]*TO authenticated;/)
    expect(sql).not.toMatch(/GRANT EXECUTE[^;]*service_role[^;]*;/)
  })

  it('keeps te_q_field private (no app-role EXECUTE)', () => {
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.te_q_field(jsonb, text) FROM PUBLIC, anon, authenticated;')
  })
})

describe('SQL contract: H1 validation parity + H3 rate limit + H2 audit', () => {
  it('enforces the 100-question server cap', () => {
    expect(sql).toContain('IF v_count > 100')
  })

  it('enforces the 10-per-10-minute sliding window on the RESOLVED owner', () => {
    expect(sql).toContain('IF v_recent >= 10')
    expect(sql).toContain('RATE_LIMIT_EXCEEDED')
  })

  it('keeps the transactional audit trail', () => {
    expect(sql).toContain('PERFORM public.log_security_event(')
  })
})