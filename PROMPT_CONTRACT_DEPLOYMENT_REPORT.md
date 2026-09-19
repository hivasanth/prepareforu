# FINAL PROMPT CONTRACT RELEASE — DEPLOYMENT REPORT

Status: **Complete** — migration committed, deployed to the live `PrepareForU` Supabase project (`xbjhlfwqmcyatblsrhxn`), and re-verified on all 171 rows.

Date: 2026-09-19

---

## What shipped

1. **`supabase/migrations/20260921000000_prompts_full_normalization.sql`** (committed; applied live)
   - 171 md5-guarded `UPDATE public.prompt_templates` statements — one per live row (33 repo-shipped defaults + 138 live-only).
   - Guard: `id = <uuid> AND md5(prompt_text) = '<original live fingerprint>'` — a concurrent edit makes the statement a safe no-op.
   - Stored form produced by `ensureSingleContractMarker(sanitizeLegacyApplicationFormat(body))` — the same algorithm the runtime composer uses.
   - DO-block re-asserts: 171 rows present, marker on every body, zero legacy tokens, and the exact 171-fingerprint set; raises otherwise (atomic with the UPDATEs via the CLI's single transaction).
   - Deterministic: regeneration is byte-identical (SHA256 `412917BBDCA88762BA2E8CC091A52B46A6C35D11302D894B2C7BE6DEA90FFAC0`).

2. **Seed snapshot** `scripts/data/prompt_templates_live_v1.jsonl` — 171 rows, fields `id/live_md5/md5/is_default/prompt_text`; `md5` is self-consistent with `prompt_text`, `live_md5` is the guard used in the migration.

3. **Generator** `scripts/generate_prompt_full_normalization_migration.ts` — verification-first; aborts unless seed is self-consistent, bodies are token-free, and stored fingerprints are unique.

4. **Integer-distribution audit** `scripts/integer_distribution_audit.mts` — 776 distribution blocks parsed across 165/171 bodies, **PASS — 0 violations** after two content fixes.

5. **Two content fixes** (applied to seed + migration):
   - `fb41d71a` (is_default): `# QUESTION DISTRIBUTION` summed 110% → trimmed to 100%.
   - `5150a4a9`: Topic Coverage Matrix summed 55 vs declared `Total 50` → rebalanced to 50.

6. **New committed test suites** (7 prompt files / 101 tests green):
   - `promptConsumerRouting.test.ts` — pins display/copy/save paths through `composeBulkUploadPrompt` / `ensureDynamicContractMarker`; fallback prompts stay contract-clean and module-private.
   - `promptDefaultPrompts.test.ts` — 33 defaults: seed self-consistency, at-rest token-freedom, sanitizer idempotency, composition contract.

7. **Consumer routing** — InstructionsTab, AIToolCards, useBulkUpload route through `composeBulkUploadPrompt`; PromptEditorModal saves via `ensureDynamicContractMarker(canonicalized)`.

## Deployment evidence

| Step | Result |
|---|---|
| Commit | `451f922` (32 files) + `135f802` (baseline doc deployment record) |
| Deploy | `npx supabase db push --linked` → `20260921000000` listed on both Local and Remote |
| Re-verify (service-role readback, all 171) | **PASS** — marker `[PREPAREFORU_DYNAMIC_OUTPUT_CONTRACT]` exactly once ×171; 0 legacy tokens; 171/171 stored md5 == migration fingerprint set; 33 defaults intact |

## Outcome

Stored prompt bodies are now marker-bearing and token-free on the live database — the previous runtime-only guarantee (composer sanitize-at-copy) is a stored guarantee for all 171 rows. Re-running the generator or re-pushing is a byte-identical safe no-op; any concurrent runtime edit keeps its row untouched because the md5 guard no longer matches.

## Known non-blockers

- `src/admin-topics-remediation.test.tsx` has a pre-existing, unrelated 10-second hook-timeout flake under full-suite parallel load (passes 14/14 in isolation); not introduced by this work and not exercised by any prompt suite.