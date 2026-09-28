// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/* ═══ B6 — Sub-admin self-update hardening (static security contract) ═════════
 * Proves the generic Record<string, unknown> update surface is gone and that
 * every self-mutation flows through a narrowly-scoped, ownership-checked,
 * least-privilege RPC defined in the B6 migration. */

const here = join(__dirname)

const read = (...p: string[]) => readFileSync(join(here, ...p), 'utf8')

describe('B6 sub-admin self-update hardening', () => {
  const repoSource = read('..', 'lib', 'repositories', 'user.repository.ts')
  const serviceSource = read('..', 'services', 'userService.ts')
  const hookSource = read('..', 'components', 'sub-admin', 'settings', 'useSettings.ts')
  const migration = read(
    '..', '..', 'supabase', 'migrations', '20260821235959_b6_sub_admin_self_update_hardening.sql'
  )

  it('removes the generic Record<string, unknown> sub_admins updater', () => {
    expect(repoSource).not.toMatch(/export async function updateSubAdmin\(/)
    expect(repoSource).not.toMatch(/\.from\('sub_admins'\)\s*\n?\s*\.update/)
    expect(serviceSource).not.toMatch(/updateSubAdmin\(saId|updateSubAdmin\(id/)
  })

  it('routes name + prefs mutations through one purpose-specific RPC each', () => {
    expect(repoSource).toContain("rpc('update_sub_admin_name'")
    expect(repoSource).toContain("rpc('update_sub_admin_notification_prefs'")
    expect(serviceSource).toContain('updateSubAdminNameViaRpc(fullName)')
    expect(serviceSource).toContain('updateSubAdminNotificationPrefsViaRpc(prefs)')
  })

  it('settings hook uses the narrowed single-purpose signatures', () => {
    expect(hookSource).toContain('await updateSubAdminProfile(name)')
    expect(hookSource).toContain('await updateSubAdminNotificationPrefs({ ...newPrefs })')
    expect(hookSource).not.toContain('updateSubAdminProfile(profile.id')
    expect(hookSource).not.toContain('updateSubAdminNotificationPrefs(profile.id')
  })

  it('migration defines SECURITY DEFINER RPCs with pinned search_path', () => {
    /* Count code lines only (trailing newline) — the header comment also
     * mentions the phrase in prose. */
    const definers = migration.match(/SECURITY DEFINER\r?\n/g) || []
    expect(definers.length).toBe(2)
    expect((migration.match(/SET search_path = public, pg_temp/g) || []).length).toBe(2)
  })

  it('ownership derives from auth.uid(), never from parameters', () => {
    /* One ownership-scoped UPDATE per function, plus the users-row sync. */
    expect((migration.match(/WHERE user_id = auth\.uid\(\)/g) || []).length).toBe(2)
    expect(migration).toContain('WHERE id = auth.uid()')
    expect(migration).toContain("RAISE EXCEPTION 'FORBIDDEN")
  })

  it('grants are least-privilege: revoked from PUBLIC/anon, granted to authenticated', () => {
    expect((migration.match(/FROM PUBLIC, anon/g) || []).length).toBe(2)
    expect((migration.match(/TO authenticated;/g) || []).length).toBe(2)
  })

  it('mutations touch exact columns only — never protected fields', () => {
    expect(migration).toContain('SET full_name = v_name')
    expect(migration).toContain('SET notification_prefs = p_prefs')
    for (const forbidden of ['user_id', 'role', 'sub_admin_id', 'created_by', 'status', 'coupon_code', 'total_referrals']) {
      expect(migration).not.toMatch(new RegExp(`SET\\s+${forbidden}\\s*=`))
    }
  })

  it('server-side validation rejects bad names and malformed prefs', () => {
    expect(migration).toContain('VALIDATION_FAILED: Display name must be between 1 and 80 characters.')
    expect(migration).toContain('VALIDATION_FAILED: Preferences must be a JSON object.')
    expect(migration).toContain('VALIDATION_FAILED: Unknown preference key.')
    expect(migration).toContain("jsonb_typeof(p_prefs -> v_key) <> 'boolean'")
  })
})
