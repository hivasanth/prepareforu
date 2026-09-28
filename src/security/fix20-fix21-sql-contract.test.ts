/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* ── FIX-20 / FIX-21 SQL CONTRACT (static regression) ────────────────────────
 * Guards the two production-fix migrations applied live on 2026-09-18 so a
 * future edit cannot silently regress:
 *   FIX-20 (20260918180000): teacher-exam answers must persist — the hard FK
 *     attempt_answers.question_id → questions(id) was dropped and replaced by a
 *     BEFORE INSERT OR UPDATE trigger that accepts ids from questions OR
 *     teacher_exam_questions; mutable RPCs become teacher-exam aware.
 *   FIX-21 (20260918190000): reset_failed_login was an anon-reachable
 *     SECURITY DEFINER that could clear ANY account's lockout; now it is
 *     authenticated-only and self-scoped to the JWT email (or admin).
 * These static reads are deterministic (no DB required) — the live behaviour
 * was verified over HTTP during the sign-off pass.
 * ─────────────────────────────────────────────────────────────────────────── */

const FIX20 = `supabase/migrations/20260918180000_fix_teacher_exam_answer_persistence.sql`
const FIX21 = `supabase/migrations/20260918190000_fix_reset_failed_login_self_scope.sql`
const sql20 = readFileSync(resolve(process.cwd(), FIX20), 'utf8')
const sql21 = readFileSync(resolve(process.cwd(), FIX21), 'utf8')

describe('SQL contract FIX-20: teacher-exam answer persistence', () => {
  it('drops the old hard FK attempt_answers.question_id → questions(id)', () => {
    expect(sql20).toContain('DROP CONSTRAINT IF EXISTS attempt_answers_question_id_fkey')
  })

  it('replaces it with a trigger accepting questions OR teacher_exam_questions', () => {
    expect(sql20).toMatch(/CREATE TRIGGER trg_attempt_answers_question_integrity/)
    expect(sql20).toMatch(/BEFORE INSERT OR UPDATE OF question_id ON public\.attempt_answers/)
    expect(sql20).toMatch(/EXECUTE FUNCTION public\._pf_ensure_attempt_answer_question\(\)/)
    expect(sql20).toContain('FROM public.questions')
    expect(sql20).toContain('FROM public.teacher_exam_questions')
  })

  it('makes the immutable attempt-mutation RPCs teacher-exam aware', () => {
    for (const fn of ['touch_question_visit', 'set_question_review', 'add_question_time']) {
      expect(sql20).toMatch(new RegExp(`CREATE OR REPLACE FUNCTION public\\.${fn}\\(`))
      const bodyStart = sql20.indexOf(`FUNCTION public.${fn}(`)
      const bodyEnd = sql20.length
      const body = sql20.slice(bodyStart, bodyEnd).slice(0, 1200)
      expect(body).toContain('v_attempt.teacher_exam_id IS NOT NULL')
      expect(body).toContain('FROM public.teacher_exam_questions q')
      expect(body).toContain('FROM public.questions WHERE id = p_question_id')
    }
  })

  it('keeps a strict security posture on the new trigger helper', () => {
    expect(sql20).toContain('SECURITY INVOKER')
    expect(sql20).toContain("SET search_path = ''")
    expect(sql20).toContain("RAISE EXCEPTION 'QUESTION_NOT_FOUND: %'")
  })
})

describe('SQL contract FIX-21: lockout reset is self-scoped', () => {
  it('keeps reset_failed_login SECURITY DEFINER but restricts EXECUTE to authenticated/service_role', () => {
    expect(sql21).toContain('SECURITY DEFINER')
    expect(sql21).toMatch(/REVOKE ALL ON FUNCTION public\.reset_failed_login\(text\) FROM PUBLIC;/)
    expect(sql21).toMatch(/REVOKE ALL ON FUNCTION public\.reset_failed_login\(text\) FROM anon;/)
    expect(sql21).toMatch(/GRANT EXECUTE ON FUNCTION public\.reset_failed_login\(text\) TO authenticated;/)
    expect(sql21).not.toMatch(/GRANT EXECUTE[^;]*reset_failed_login[^;]*TO anon;/)
  })

  it('enforces caller==target via the JWT email claim (or admin/sub_admin)', () => {
    expect(sql21).toContain("auth.jwt() ->> 'email'")
    expect(sql21).toContain('public.is_admin()')
    expect(sql21).toContain('public.is_sub_admin()')
  })

  it('guards against cross-user reset and normalizes the email', () => {
    expect(sql21).toMatch(/LOWER\(BTRIM\(p_email\)\)/)
    expect(sql21).toMatch(/RAISE EXCEPTION 'UNAUTHORIZED_ACCESS/)
  })
})