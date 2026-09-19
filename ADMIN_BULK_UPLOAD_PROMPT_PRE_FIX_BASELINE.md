# ADMIN_BULK_UPLOAD_PROMPT_PRE_FIX_BASELINE.md

Full 171-live-body prompt normalization — pre-fix baseline (Phase 8/41 hardening).

Status: **Baseline captured** (post-fix sanitizer probes: 0/171 leaks; runtime compose: 0/0/0). This document records the pre-fix evidence and the fixes applied.

---

## 1. Live DB state (reference point)

| Metric | Value |
|---|---|
| Live `prompt_templates` rows | **171** (33 defaults / 138 secondary; 171 topics ↔ 171 prompts, 1:1) |
| Stored body marker (`[PREPAREFORU_DYNAMIC_OUTPUT_CONTRACT]`) | **0 / 171** |
| Stored legacy tokens | `visual_engine` ×171, `diagram` ×103, `title_en/te` ×101, `metadata` ×76, `render_type` ×63, `headers/rows_en` ×66 |
| Storage state | frozen at Phase 8 (`20260823121745_prompt_topic_canonicalization.sql`); Phases 11/12 exist only as untracked local files, never applied |
| Snapshot artifact | `%TEMP%\opencode\pfu_live_prompts_clean.json` (2,807,863 B; re-extracted byte-exact via `cmd /c` redirect to preserve UTF-8 `✓` = `E2 9C 93`) |

## 2. Pre-fix leaks (the 4 of 171, from the forensic audit §13)

| Row id | Segment / Topic | `is_default` | Token | Surviving text (sanitizer output) |
|---|---|---|---|---|
| `60390c66-c093-4103-a7cb-d406809fea63` | BANK_EXAMS / English Language / Vocabulary | false | `metadata` | `"metadata": "<svg>...</svg>"` (BAD EXAMPLE 4 fence) |
| `38ec331e-1259-47b9-9384-ecbfd1e2bd27` | S&T / Energy Requirement and Efficiency | false | `diagram` | `* process_diagram` (`## Occasionally Suitable` bullet) |
| `6087e13c-0080-4565-b637-8ec34c3e70db` | Geography / General Geography | **true** | `metadata` | `Visuals must include proper labels and educational metadata.` |
| `9066693b-be5f-4660-b7bb-6bc5007a70ef` | S&T / Env. Science, Biotech & Nanotech | false | `diagram` | `* process_diagram` (`## Occasionally Suitable` bullet) |

Composed output across all 171 at baseline: contract exactly once ×171, no marker leak, **4 token leaks** above.

## 3. Root cause — fence pairing bug (new discovery)

`FENCE_OPEN_RE = /\`\`\`(?:json)?\s*\n([\s\S]*?)\n\`\`\`/g` mis-pairs code fences:
- The closer pattern `\n\`\`\`` also matches `\`\`\`json` opener lines (`\n\`\`\`` ` is a prefix of `\n\`\`\`json`), so a `\`\`\`json` *opener* is consumed as the *closer* of the previous fence.
- Consecutive fences then cascade-shift by one. The evil effect: a legacy fence whose **own** opener+closer pair would have been detected (e.g. the `visual_engine` + `"metadata": "<svg>…"` BAD EXAMPLE 4 fence at lines 774–781 in `60390c66`) instead gets its opener consumed as a closer, so the whole fence is **never evaluated** and its body survives.
- Verified via global `exec` scan: in `60390c66` the OLD regex pairs `…→(760→774), (781→852)` — the 774–781 legacy fence is skipped entirely.

## 4. Fixes applied — `src/lib/prompts/promptContentSanitizer.ts`

1. **FENCE pairing fixed.** `FENCE_OPEN_RE = /\`\`\`(?:json[^\r\n]*)?[ \t]*\r?\n([\s\S]*?)\r?\n\`\`\`(?!\S)/g`
   — opener may carry a legacy `id` attr; a **closer must be a bare `\`\`\`` at end-of-line** (`(?!\S)`), so `\`\`\`json` lines can no longer be hijacked as closers. This is the primary fix for `60390c66`.
2. **Fenced string-form metadata.** Added `LEGACY_METADATA_STRING_RE` (`"metadata": "<svg|html|data:image`) to `isLegacyJsonFenceBody`, closing §12 gap 1 for any future fence whose metadata value is an embedded payload (canonical contract has no `metadata` key).
3. **`process_diagram` / uppercase DIAGRAM reword.** Replaced `DIAGRAM_WORD_RE` with `LEGACY_SHAPE_WORD_RE = /\b(Diagrams|diagrams|Diagram|diagram|DIAGRAMS|DIAGRAM)\b|_diagram(s)?\b/g` and mapped `process_diagram → process_visual`, `# DIAGRAM → # Visual`, etc. Closes §12 gap 2 (`38ec331e`, `9066693b`).
4. **`educational metadata` prose context.** Added `educational\s+metadata` to `METADATA_RENDERER_CONTEXT_RE`, closing §12 gap 3 (`6087e13c`).

## 5. Post-fix verification (this session)

| Probe | Result |
|---|---|
| Sanitizer-only residual scan (`pfu_probe_sanitize_171.mts`, clean snapshot) | **0 / 171** bodies with residual tokens |
| Runtime compose, all 171 (`pfu_probe_compose.test.ts`) | contract **171/171**, marker leak **0**, token leaks **0** |
| Corpus suite `promptCorpus.test.ts` (33 in-repo bodies) | **9 / 9 pass** |
| Academic-content guard | min sanitized length across 171 = 3524 B (`d5c94426`); focus bodies 12.7–18.0 KB — no over-strip |

## 6. Completed follow-on (supersedes the remaining plan)

1. **Consolidated 171-row normalization migration** committed: `supabase/migrations/20260921000000_prompts_full_normalization.sql` — deterministic (SHA256 `412917BB…FFAC0`), md5-guarded against the live seed, DO-block re-asserts 171 marker-bearing/token-free/fingerprint-set. Phase 11/12 (untracked) deleted. Generator: `scripts/generate_prompt_full_normalization_migration.ts`; reproducible seed: `scripts/data/prompt_templates_live_v1.jsonl` (fields `id/live_md5/md5/is_default/prompt_text`).
2. **171-body regression corpus test**: `promptCorpus.test.ts` now loads the consolidated migration (all 171 bodies) — 9/9 pass.
3. **Integer-distribution audit**: `scripts/integer_distribution_audit.mts` scans all 171 normalized stored bodies (776 blocks parsed across 165 bodies) — PASS with 0 violations after 2 content fixes below.
   - Fixed `5150a4a9-…` (Topic Coverage Matrix allocations summed 55 vs `Total → 50 Questions`; rebalanced to 50).
   - Fixed `fb41d71a-…` (is_default; `# QUESTION DISTRIBUTION` summed 110%; trimmed Constitutional Amendments & Bodies 10%→5%).
   - Corrections applied to the seed; migration regenerated; determinism re-verified; `live_md5` keeps each UPDATE guarded against the ORIGINAL live fingerprint (concurrent-edit safety intact).
4. **Direct-consumer audit + fallback reachability proof**: committed `src/lib/prompts/promptConsumerRouting.test.ts` — pins every `prompt_text` read path through `composeBulkUploadPrompt` (InstructionsTab / AIToolCards / useBulkUpload copy) and the save path through `ensureDynamicContractMarker` (PromptEditorModal), plus module-private `GENERIC_PROMPT`/`HISTORY_PROMPT` stay contract-clean.
5. **Default-prompt tests**: `src/lib/prompts/promptDefaultPrompts.test.ts` — 33 `is_default` rows: seed self-consistency, at-rest token-freedom, sanitizer idempotency, composition contract. 7/7 pass.
6. **Full verification**: `npm run build` green; ESLint clean on changed files; prompt suites 8 files / 102 tests green. (Full-suite run has a pre-existing unrelated timing flake in `src/admin-topics-remediation.test.tsx` — passes 14/14 in isolation.)

Prompt suites now total 8 files / 102 tests. Deploy + live re-verify + final report remain.