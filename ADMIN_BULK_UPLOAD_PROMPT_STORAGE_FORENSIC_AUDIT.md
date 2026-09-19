# ADMIN_BULK_UPLOAD_PROMPT_STORAGE_FORENSIC_AUDIT.md

> Forensic, read-only audit of the entire Admin Bulk Upload prompt family — database state, repo migration state, runtime composition, fallbacks, and every surface that consumes or mutates prompts.
> Audit date: 2026-09-19. Method: live Supabase/PostgREST probes (admin session), git status/history inspection, migration byte-level md5 comparison, and vitest-driven runtime composition equivalence checks. No files, DB rows, migrations, prompts, or source were modified during this audit. All scratch test/script files created for measurement were deleted afterward.

---

## 1. Executive Summary

The Admin Bulk Upload prompt family consists of **300 logical objects** across four storage/runtime tiers:

| Tier | Object | Count | State |
|---|---|---|---|
| Live DB rows | `prompt_templates` | **171** | All legacy-in-storage; none carry the dynamic contract marker |
| Repo migration corpus | `20260920000000_prompts_legacy_prose_normalization.sql` | **33** | Fully normalized, marker-bearing — NEVER applied to live DB |
| Repo migration corpus | `20260919000000_prompts_dynamic_output_contract.sql` | **33** | Marker-bearing, 33/33 body match live guard md5 — NEVER applied to live DB |
| Code fallbacks | `GENERIC_PROMPT` + `HISTORY_PROMPT` (`useBulkUpload.ts`) | **2** | Clean of forbidden tokens; no marker; contract reference only |

**Headline finding:** the live database is frozen at the **Phase 8 state** (`20260823121745_prompt_topic_canonicalization.sql`) for every one of the 33 corpus rows, and the two later normalized-marker migrations (Phases 11 and 12) were **never applied**. md5 parity is the definitive proof: live bodies match Phase 8 shipped bodies **33/33**, match Phase 11 guard md5s **33/33** (pre-state = live), and match Phase 12 target bodies **0/33**. Zero of 171 stored bodies contain the marker `[PREPAREFORU_DYNAMIC_OUTPUT_CONTRACT]`, and all 171 still contain legacy tokens (e.g. `visual_engine` in 171/171).

The system still works **only because** the runtime composer (`composeBulkUploadPrompt`) sanitizes stored bodies at display/copy time. That sanitizer is verified leak-free for 33/33 corpus-live bodies and 134/138 live-only bodies — but **4 live-only rows leak exactly one legacy token each** after composition (see §21).

---

## 2. Audit Scope and Method

### 2.1 Scope

What was audited:
- `supabase.public.prompt_templates` — all 171 live rows (full text digest, tokens, md5, defaults, timestamps).
- Migration files `20260822112933…`, `20260822140637…`, `20260823121745…`, `20260919000000…`, `20260920000000…` and their generators (`scripts/generate_prompt_dynamic_contract_migration.ts`, `scripts/generate_prompt_prose_normalization_migration.ts`).
- Runtime prompt pipeline: `AdminBulkParserTopic` → `BulkUploadPanel` → `useBulkUpload` → `InstructionsTab` / `AIToolCards` / `PromptEditorModal`.
- Prompt library: `promptComposer.ts`, `dynamicOutputContract.ts`, `promptContentSanitizer.ts`, `promptCorpus.test.ts`, `promptTopicCanonicalizer.ts`.
- Repository layer: `exam.repository.ts` prompt functions; admin service `adminQuestionService.listPrompts`.

What was intentionally **NOT** modified: any file, DB row, migration, prompt, or source. Only read operations / ephemeral scripts (deleted after use).

### 2.2 Method

1. `pfu_prompt_audit_probe.mjs` + `pfu_forbidden_rows.json` — live digest of all 171 rows (id, exam/paper/subject/topic ids + names, `is_default`, `prompt_text` length, md5, `first_line`, `created_at`, `updated_at`, forbidden-token scan, marker scan).
2. `pfu_prompt_probe2.mjs` — topic/reference integrity, exam & paper distribution, migration-history visibility (result: PostgREST cannot read `schema_migrations`; not exposed).
3. `pfu_md5_parity.mjs` — md5 parity of live bodies vs Phase 8 UPDATE bodies (33), Phase 11 UPDATE bodies (33) and guard md5s, Phase 12 target bodies (33).
4. `pfu_corpus_token_scan.mjs` — forbidden-token / marker scan across the 33 Phase 8, 33 Phase 11, and 33 Phase 12 migration bodies.
5. `pfu_coverage_probe.mjs` → `pfu_coverage.json` — topic↔prompt 1:1 coverage, segment coverage, empty/duplicate checks.
6. `pfu_extract_bodies.mjs` → `pfu_liveonly_bodies.jsonl` (138) + `pfu_corpuslive_bodies.jsonl` (33) — body extraction for runtime composition check.
7. Vitest runtime-equivalence check (ephemeral `_audit_runtime_normalize_check.test.ts`, since deleted): composed output of every one of the 171 live bodies through `composeBulkUploadPrompt` must contain the contract exactly once, never contain the marker, and never contain any forbidden token.
8. `.live-db-audit.mjs` / `remote_migs.json` — remote migration-name listing (captured 18-09-2026 17:13:04) for deployment sequencing.
9. `git status --porcelain` + `git log` — tracked/un-tracked state of every prompt migration.

### 2.3 Corpus definition (ambiguity resolved)

Phase 8, Phase 11, and Phase 12 migrations each contain exactly **33** `UPDATE prompt_templates … WHERE id = '…'` blocks. The Phase 8 file additionally contains 4 more `WHERE id` lines (`09bc50af…`, `3e6c0596…`, `b09904f4…`, `8c964276…`) that belong to the trailing `exam_topics` validity-guard `NOT IN` block, not to prompt UPDATEs. **Corpus = 33 prompt ids**, not 37.

---

## 3. Table A — Live `prompt_templates` inventory

**Total rows: 171. Distinct md5: 171/171 (no exact duplicates). Default rows: 33. Marker rows: 0/171.**

| Metric | Value |
|---|---|
| Total rows | **171** |
| `is_default = true` | **33** (one per subject in most segments) |
| `is_default = false` | **138** |
| rows with marker | **0** (0.0%) |
| rows with `visual_engine` | **171** (100.0%) |
| rows with `render_type` | **63** |
| rows with `headers_en` / `rows_en` | **66** / **66** |
| rows with `title_en` / `title_te` | **101** / **101** |
| rows with `metadata` | **76** |
| rows with `diagram` | **103** |
| distinct md5 | **171** (0 bi-identical rows) |
| `updated_at` min | 2026-06-29 12:41:49 |
| `updated_at` max (Phase 8 run) | **2026-08-23 12:18:57** |
| rows with `updated_at` = phase 8 timestamp | **33** (the corpus) |

### 3.1 Bulk-identifier groups present in stored bodies (`first_line` families)

Stored bodies carry inconsistent "Prompt N" lineage prefixes (evidence of organic seeding, not an enforced naming scheme):

| Family pattern | Example count families |
|---|---|
| `# Prompt N - <Segment - Subject - Topic>` | ~90 rows across groups |
| `# Prompt N (Version 2.0) - …` | 6 |
| `# Prompt N (Version 3.0) - …` | ~20 |
| `# Prompt N › …` (chevron separators, Group 2 Prelims) | ~14 |
| `# Prompt N – APPSC – Group 1 – …` (en dash, Group 1) | ~30 |
| `# #prompt1 - APPSC Group 3 …` (double hash) | 1 |
| no header (raw `You are an expert question paper setter…`) | 5 |

There is **no single naming convention** enforced in storage. Some rows use telugu topic names with mangled encoding in the header (e.g. `# Prompt 1 - APPSC Group 4 - ?????? - ?????…`).

---

## 4. Table B — Exam distribution of the 171 live prompt rows

| Exam | Rows | Notes |
|---|---|---|
| APPSC_GROUP_1 | **32** | General Studies + General Aptitude + S&T paper family |
| APPSC_GROUP_2 | **53** | Prelims + Mains variants (V2.0/V3.0 lineages) |
| APPSC_GROUP_3 | **42** | Contemporary Problems / General Studies families |
| APPSC_GROUP_4 | **20** | Telugu + Regional + General Studies + Mental Ability |
| BANK_EXAMS | **24** | English, Quant, Reasoning, Computer, Banking/Financial |
| **Total** | **171** | Σ = 171 (no orphan exam_id) |

### 4.1 Segment distribution

- **33 distinct segments** `(exam_id, paper_id, subject_name)` hold all 171 rows; every segment has ≥1 prompt.
- Every segment has **exactly one** `is_default = true` row (Mental Ability: 3 segments, Science and Technology: 2, Geography: 2, all others: 1) → no segment is missing a default, no segment has multiple defaults.
- Example segment topic counts: APPSC_GROUP_1 segments have 1–6 topics each; largest segment has 6 topics.

---

## 5. Table C — Topic↔prompt integrity (1:1 coverage)

Probed against `exam_topics` (live) + `prompt_templates`:

| Check | Result |
|---|---|
| `exam_topics` rows | **171** |
| topics with ≥1 prompt | **171** (100.0%) |
| topics with 0 prompts | **0** |
| prompt rows | **171** |
| topics with >1 prompt (multi-prompt collisions) | **0** |
| prompt rows with empty/whitespace `prompt_text` | **0** |
| prompt rows whose `topic_id` references a missing topic | **0** (unresolved = 0) |
| cross-segment topic mismatch (topic belongs to a different `exam/paper/subject` than the prompt row) | **0** |
| duplicate prompt bodies (md5) | **0** |

Every stored prompt is topic-scoped, and every topic owns exactly one stored prompt — a clean 1:1 graph. This graph was established by Phase 8 canonicalization + `20260822112933_prompt_templates_topic_id.sql`.

---

## 6. Table D — Migration ↔ live parity (md5 forensic proof)

### 6.1 Phase 8 — `20260823121745_prompt_topic_canonicalization.sql` (LAST APPLIED)

| Metric | Value |
|---|---|
| prompt UPDATE blocks | 33 |
| live rows matching Phase 8 shipped body md5 | **33 / 33** |
| live rows not matching (drifted since) | **0** |
| Phase 8 bodies containing marker | 0 / 33 |
| Phase 8 bodies containing any legacy token | **33 / 33** |
| corpus rows `updated_at` | **2026-08-23 12:18:57** (phase 8 run time) |

Phase 8 was a *topic-canonicalization* pass (rewrote `topic_name`/`topic_id`, splitting some subject rows), **not** a format-normalization pass. Its 33 shipped bodies are byte-identical to what is in the live DB today.

### 6.2 Phase 11 — `20260919000000_prompts_dynamic_output_contract.sql` (NEVER APPLIED)

| Metric | Value |
|---|---|
| prompt UPDATE blocks | 33 |
| live rows matching Phase 11 **guard md5s** (pre-state) | **33 / 33** |
| live rows matching Phase 11 target bodies | **33 / 33 would apply; 0 applied** |
| Phase 11 bodies containing marker | **33 / 33** |
| Phase 11 bodies still containing legacy tokens | **14 / 33** |
| git tracked? | **NO — untracked (`??`)** |

The Phase 11 guard (`WHERE id = … AND md5?` style equality on pre-state) confirms the live row content equals the pre-state of every Phase 11 UPDATE. The migration exists in the repo but its bodies are **not** in the live DB, and the file itself is untracked in git. Its shipped bodies carry the marker but only strip legacy tokens where the generator could identify them — 14 still contain legacy prose tokens.

### 6.3 Phase 12 — `20260920000000_prompts_legacy_prose_normalization.sql` (NEVER APPLIED)

| Metric | Value |
|---|---|
| prompt UPDATE blocks | 33 |
| live rows matching Phase 12 target body md5 | **0 / 33** |
| Phase 12 bodies containing marker | **33 / 33** |
| Phase 12 bodies containing any legacy token | **0 / 33** |
| git tracked? | **NO — untracked (`??`)** |
| enforced by `promptCorpus.test.ts` | **YES — 9 tests, 9 pass** |

Phase 12 is the fully-clean normalization (no legacy tokens, marker present, contract-slot prose normalized). It is enforced by `src/lib/prompts/promptCorpus.test.ts` (**9/9 passing**) against the *migration-shipped bodies* — i.e. the test enforces the repo state, **not** the live DB state.

### 6.4 Deployment sequencing evidence (`remote_migs.json`, 18-09 17:13:04)

Remote `supabase_migrations.schema_migrations` list ends at **`20260918190000`** — predating the Phase 11/12 files (created 19-09). Combined with git `??` status and the md5 parity above, **Phase 11 and Phase 12 have never reached the live project database.**

---

## 7. Table E — Stored-body token census (live DB, all 171 rows)

| Token | Rows containing it | Meaning |
|---|---|---|
| `visual_engine` | **171** (100%) | Legacy visual key — every stored body |
| `render_type` | 63 | Legacy render dispatch value |
| `headers_en` / `rows_en` | 66 / 66 | Legacy table-in-JSON keys |
| `title_en` / `title_te` | 101 / 101 | Legacy visual title keys |
| `metadata` | 76 | Legacy visual metadata key |
| `diagram` | 103 | Legacy render type / prose references |
| `[PREPAREFORU_DYNAMIC_OUTPUT_CONTRACT]` | **0** | Canonical marker — absent everywhere live |

**Verdict: storage is 100% legacy-format; the marker is 0/171.** The live product depends entirely on runtime sanitization.

---

## 8. Table F — Default rows: corpus vs live-only

Only **8 of 33** `is_default = true` rows belong to the 33-id migration corpus. **25 default rows are live-only**, and **29 corpus rows are not default**:

| Category | Count | Examples |
|---|---|---|
| Default + corpus | 8 | `e3a9d6aa` (Constitution…), `9aee358b` (Social & Cultural History AP), `d5c94426` (Vocabulary), `4be72d8f` (Rural Health…), `fcdd0458` (Social Tensions…), `42078dd0` (General Science…), `ba90a119` (Computer Fundamentals), `383de54a` (General Telugu) |
| Default + live-only | 25 | `040deaeb` (Indus Valley…), `6087e13c` (Geography — General Geography, **leaks see §21**), `ef9be6b0` (S&T), `a445f631` (Current Events), `b80450b0` (Logical & Analytical Reasoning), `116c4833` (Ancient History), `ce72d2ec` (Physical Geography), `85b66db3` (Structure of Indian Society), `bfe6f3fe` (International Current Events), `f20c2aa9` (Mental Ability), `8a66de07` (Indian Constitution), `30715575` (Basic Concepts of Economics), `4a273a68` (Basics of Science…), `6aaf9c97` (National Governance…), `80b08911` (Ancient Andhra History), `b0329188` (Logical Reasoning…), `fb41d71a` (Indian Democracy…), `0754689b` (Calculation & Speed Maths), `757856fb` (Logical Reasoning), `2ac5825c` (English Grammar), `45d06cf2` (Banking Awareness), `d27bb6eb` (Current Affairs), `77136f07` (Logical & Analytical Reasoning), `66a620f9` (Reading Comprehension), `77299515` (Basic Characteristics of Indian Economy) |
| Corpus + non-default | 29 | every other corpus id |

**Implication:** the "default" prompt shown at page load is *rarely* a normalized corpus body. It comes from the legacy-in-storage live rows and is only made contract-clean at runtime.

---

## 9. Runtime pipeline (how a stored body becomes a prompt)

```
AdminBulkParserTopic (page)
 └─ BulkUploadPanel
     └─ useBulkUpload
         ├─ fetchTopicsBySubject(examId, paperId, subjectName)  → topics
         ├─ adminQuestionService.listPrompts(…, topicId)        → promptBlocks
         └─ currentPrompt = promptBlocks.find(p => p.is_default)?.prompt_text
              || (subjectName === 'History and Culture' ? HISTORY_PROMPT : GENERIC_PROMPT)
 └─ InstructionsTab
     └─ activeBlock = promptBlocks.find(b => b.is_default) ?? promptBlocks[0] ?? null
        text = composeBulkUploadPrompt(activeBlock?.prompt_text ?? fallbackPrompt, topicIdentity).text
 └─ AIToolCards
     └─ copies composeBulkUploadPrompt(topicPrompt, topicIdentity).text
 └─ PromptEditorModal (save)
     └─ canonicalizePromptTopics(prompt)  +  ensureDynamicContractMarker(prompt_text)
```

Selection rule confirmed in `InstructionsTab.tsx`: `find(is_default) ?? [0] ?? null`. Topic-scoped pages always fetch exactly the topic's single prompt → 1:1 selection as Table C shows. Both the Instructions tab display and the AIToolCards copy go through the **same composer**, so displayed text and generated-JSON prompt share one contract.

---

## 10. The runtime composer — single source of truth in practice

`src/lib/prompts/promptComposer.ts` — `composeBulkUploadPrompt(topicPrompt, topicIdentity)`:
1. Sanitizes the stored body via `promptContentSanitizer.sanitizeLegacyApplicationFormat`.
2. Strips legacy fences, aliases, and prose references; rewrites `diagram`→`visual`, `render_type` cases, `metadata`/bilingual keys, `visual_engine` objects.
3. Ensures exactly one contract via `ensureSingleContractMarker`; appends `dynamicOutputContract` text with `CANONICAL OUTPUT CONTRACT v…` header (1 occurrence per composed prompt, verified).
4. Injects `topic_en`/`topic_te` as the TOPIC IDENTITY block.

Contract canonical source: `dynamicOutputContract.ts` (`QUESTION_OUTPUT_CONTRACT_VERSION`). Parser: `BulkQuestionSchema`. Visual bounds shared with `normalizeVisualInput` / `assertVisualSizeLimits` via `SUPPORTED_VISUAL_TYPES` / `VISUAL_LIMITS` (`questionVisualSchemas.ts`).

---

## 11. Runtime composition equivalence check (172-invocation proof)

Ephemeral vitest (`_audit_runtime_normalize_check.test.ts`, deleted after run) composed **every one of the 171 live bodies** through the real composer and asserted: contract exactly once, marker absent, and no forbidden token present.

| Input set | Body count | Compose clean | Fail |
|---|---|---|---|
| Corpus-live (`pfu_corpuslive_bodies.jsonl`) | 33 | **33** ✅ | 0 |
| Live-only (`pfu_liveonly_bodies.jsonl`) | 138 | 134 | **4** |
| **Total** | **171** | **167** | **4** |

The 33 corpus-live bodies are 100% runtime-clean (their Phase-12 normalization happened in migration and holds at runtime). **134/138 live-only bodies are also runtime-clean.** 4 live-only rows each leak exactly one forbidden token (§21).

---

## 12. Sanitizer gaps found (root cause of the 4 leaks)

Inspection of `promptContentSanitizer.ts` and the leak contexts (§21) isolates three sanitizer behaviors that leave legacy text in composed output:

1. **`"metadata": "<string>"` in a fenced JSON example survives.** The legacy-fence detector flags fences by `visual_engine`/`render_type`/bilingual/alias keys and by `"type":"marker"`, but a fence containing only `"metadata": "<svg>...</svg>"` (a *string* value, not an object) is treated as non-legacy. The `metadata` token then survives as the literal `"metadata"` in the fenced bad-example JSON. (`60390c66`)
2. **`process_diagram` render-type token survives.** The `DIAGRAM_WORD_RE` rewrites whole-word `diagram(s)` (and applicable `render_type` labels), but the underscore compound `process_diagram` is not matched by the whole-word regex, so it passes through in the "Occasionally Suitable render types" bullets. (`38ec331e`, `9066693b`)
3. **Prose `"educational metadata"` line survives.** Prose lines containing `metadata` are only stripped when they match the metadata-context phrases (Complete metadata / Missing metadata / etc.); the generic phrase `Visuals must include proper labels and educational metadata.` does not match, so the line survives with the token `metadata`. (`6087e13c`)

These are **not** covered by `promptCorpus.test.ts` because that suite only asserts the 33 Phase-12 migration bodies — the 138 live-only rows are outside its corpus. §23 recommends extending the assertion set to the 138 extracted live-only bodies.

---

## 13. The 4 live-only rows that leak a legacy token at runtime

| Row id | Segment | Topic | `is_default` | Token leaked (count) | Context |
|---|---|---|---|---|---|
| `60390c66-c093-4103-a7cb-d406809fea63` | BANK_EXAMS / English Language | Vocabulary | false | `metadata` (×1) | fenced `"metadata": "<svg>...</svg>"` in BAD EXAMPLE 4 |
| `38ec331e-1259-47b9-9384-ecbfd1e2bd27` | S&T | Energy Requirement and Efficiency | false | `diagram` (×1) | `process_diagram` in "Occasionally Suitable render types" |
| `6087e13c-0080-4565-b637-8ec34c3e70db` | Geography | General Geography | **true** | `metadata` (×1) | prose `labels and educational metadata.` |
| `9066693b-be5f-4660-b7bb-6bc5007a70ef` | S&T | Env. Science, Biotech & Nanotech | false | `diagram` (×1) | `process_diagram` in "Occasionally Suitable render types" |

All four are live-only (outside the 33-corpus). Two are `S&T`, one is `English Language`, one is `Geography` — and one (`6087e13c`) is a **default-flagged** row, i.e. a visible-on-load prompt. All four compose the contract once, install no marker leak, and contain no other forbidden token. Full ≤40-char offsets and exact byte contexts were captured during the run (§12 lists them).

---

## 14. Repository layer (`exam.repository.ts` / admin service)

- `fetchPrompts` — the only live prompt-read path; called by `adminQuestionService.listPrompts`; scope `(exam, paper, subject, topic)`.
- `validatePromptTopicContext` — verifies prompt→topic 1:1 integrity before save (matches Table C's clean graph).
- `upsertPrompt` — insert/update with `topic_id`; store path does not re-sanitize until `PromptEditorModal`'s `canonicalizePromptTopics` + `ensureDynamicContractMarker`.
- `deletePromptById`, `countPromptsForTopic` — cleanup/validation helpers.
- No `is_active`/`created_by`/`updated_by` columns exist on `prompt_templates` (`id, exam_id, paper_id, subject_name, topic_name, prompt_text, is_default, created_at, updated_at, topic_id`).

---

## 15. Fallback prompts (`useBulkUpload.ts`)

| Object | Location | Length | Marker | Forbidden tokens | Contract text |
|---|---|---|---|---|---|
| `GENERIC_PROMPT` | line 156 | 540 chars | none | none | references "CANONICAL OUTPUT CONTRACT appended below" — delivered by composer |
| `HISTORY_PROMPT` | line 165 | 23,201 chars | none | none | references contract twice ("Follow the CANONICAL OUTPUT CONTRACT appended below…") — delivered by composer |

Fallback is used only when `promptBlocks` is empty or has no default (line 340–343) and as the new-draft seed (line 388). Both are clean; neither is corrupted at runtime. 5 live rows share the literal `You are an expert question paper setter for competitive exams like APPSC and UPSC…` opening — those are terminal seeds of `HISTORY_PROMPT` lineage stored as DB rows.

---

## 16. Save-path mutation (`PromptEditorModal`)

On save, `canonicalizePromptTopics` (canonical id/name from `exam_topics`) runs, then `ensureDynamicContractMarker` guarantees the marker exists in `prompt_text`. The UI therefore **cannot persist a row without the marker** after this save path — future edits will gradually convert stored rows to marked rows. Nothing today backfills the 171 legacy rows automatically.

---

## 17. Test/assertion coverage status

| Suite | Scope | Result |
|---|---|---|
| `src/lib/prompts/promptCorpus.test.ts` | **33 Phase-12 bodies only** | **9/9 pass** |
| `src/lib/utils/promptTopicCanonicalizer.test.ts` | canonicalizer | pass (repo) |
| `src/security/prompt-topic-context.test.ts` | topic context integrity | pass (repo) |
| Ephemeral runtime-equivalence check (deleted) | **171 live bodies** | **167 clean / 4 leak** |

Critical gap: no committed test asserts the 138 live-only bodies (runtime-normalizable without a DB migration). See §23.

---

## 18. Evidence trail (artifacts)

Read-only artifacts produced under `%TEMP%\opencode` (repo tree untouched by the audit):
- `pfu_prompt_rows_digest.json` — 171-row live digest.
- `pfu_forbidden_rows.json` — per-token row sets.
- `pfu_corpuslive_bodies.jsonl` (33) / `pfu_liveonly_bodies.jsonl` (138) — extracted bodies.
- `pfu_coverage.json` — topic/prompt/segment coverage.
- `remote_migs.json` — remote migration list (stale re: phases 11/12).
- `pfu_prompt_audit_probe.mjs`, `pfu_prompt_probe2.mjs`, `pfu_md5_parity.mjs`, `pfu_corpus_token_scan.mjs`, `pfu_coverage_probe.mjs`, `pfu_extract_bodies.mjs` — reproducible probes.

Scratch files created for measurement inside the repo (`scripts/_audit_runtime_normalize_check.mts`, `scripts/_audit_runtime_normalize_check.test.ts`, `src/lib/prompts/_audit_runtime_normalize_check.test.ts`) were **deleted** after the run; `git status` was verified clean of them.

---

## 19. Risks

1. **Silent legacy storage:** 100% of live bodies are legacy-in-storage; any code path that reads `prompt_text` without the composer (future exports, prompts list, admin reporting) will surface legacy prose and `visual_engine` verbatim.
2. **Default prompts are legacy:** 25/33 default-flagged rows are live-only legacy bodies; one (`6087e13c`) leaks a legacy token even after composition.
3. **Deployment gap:** Phases 11/12 exist only as untracked local files; nothing in the remote migration list or git history carries them. A schema reset/db restore would silently lose the normalization intent.
4. **Corpus test blind spot:** `promptCorpus.test.ts` gives false comfort — it pins migration bodies, not the DB state that actually serves users.
5. **Token censors are content-driven:** the sanitizer's 3 gaps (§12) mean a stored body's exact phrasing dictates whether it survives cleanly; there is no structured guarantee without a migration.

---

## 20. Recommendations (no changes made in this audit)

1. In a controlled change (not this audit): apply Phase 12 (`20260920000000…`) to the live DB for the 33 corpus rows, then extend the corpus to cover the 25 default live-only rows + remaining 113 live-only rows, migrating them to marker-bearing normalized storage.
2. Harden `promptContentSanitizer`: strip `"metadata": "<string>"` fences (match string values as well as objects), add `process_diagram`/compound legacy render names to the render-type rewrite list, and treat prose `metadata` (any sentence) as removable when part of a "visuals must…" guidance line.
3. Commit Phases 11/12 and their generator scripts (`generate_prompt_dynamic_contract_migration.ts`, `generate_prompt_prose_normalization_migration.ts`) and record them in `remote_migs.json`.
4. Extend `promptCorpus.test.ts` (or add a sibling suite) to run the full **171-body runtime-equivalence assertion** used here, so live-only leak regressions (like the 4 found) fail CI.
5. Add a read guard/log for any consumer that reads `prompt_text` without composing.

---

## 21. Full runtime-equivalence result (the 4 leaks in detail)

Composed-output contexts (offsets in composed body, body = pre-contract segment):

| Row id | token | body offset | body line | surviving text (sanitized excerpt) |
|---|---|---|---|---|
| `60390c66` | `metadata` | 11271 | 735 | `` `"metadata": "<svg>...</svg>"` `` inside BAD EXAMPLE 4 JSON fence |
| `38ec331e` | `diagram` | 10927 | 593 | `* process_diagram` bullet under "Occasionally Suitable" |
| `6087e13c` | `metadata` | 13295 | 864 | `Visuals must include proper labels and educational metadata.` |
| `9066693b` | `diagram` | 11847 | 649 | `* process_diagram` bullet under "Occasionally Suitable" |

All other 133 live-only rows and all 33 corpus-live rows: contract exactly once, no marker, no forbidden token.

---

## 22. Schema reference (`prompt_templates`)

Columns: `id uuid pk`, `exam_id`, `paper_id`, `subject_name`, `topic_name`, `prompt_text text`, `is_default boolean`, `created_at`, `updated_at`, `topic_id uuid fk → exam_topics.id`.

- No soft-delete / audit columns. No view. PostgREST exposure of `schema_migrations` is disabled (deployment proof was therefore md5/updated_at based).

---

## 23. Proposed regression suite contract (for a later, permitted change)

Assert for every one of the 171 extracted bodies (`pfu_liveonly_bodies.jsonl` ∪ `pfu_corpuslive_bodies.jsonl`):
1. `composeBulkUploadPrompt(body, identity).text` contains `CANONICAL OUTPUT CONTRACT v` exactly once.
2. It does not contain `[PREPAREFORU_DYNAMIC_OUTPUT_CONTRACT]`.
3. It does not contain `visual_engine`, `render_type`, `headers_en`, `rows_en`, `title_en`, `title_te`, `metadata`, or `diagram`.
4. Round-trip `ensureDynamicContractMarker(sanitizeLegacyApplicationFormat(body))` is idempotent.

This matrix would have caught all 4 leaks from §13 at CI time.

---

## 24. Timeline reconstruction (how storage froze at Phase 8)

1. `2026-06-28/29` — original organic seeding (rows with `updated_at` around 06-29; `Prompt 1/2/3` families; history-topic generator lineage visible in 5 rows).
2. `2026-07-01…08-22` — topic-scoping migrations (`20260822112933`, `20260822140637`) add `topic_id`, validate segment fks.
3. `2026-08-23 12:18:57` — **Phase 8 canonicalization** (`20260823121745…`): rewrites topics, splits rows; `updated_at` stamped; 33 corpus rows still byte-identical today.
4. Between 08-23 and 08-26 — editing via `PromptEditorModal` stops touching the 33 corpus rows (their `updated_at` stays 08-23); live-only rows keep older timestamps (06-29…).
5. Repository (untracked) gains Phase 11 + 12 migrations + generators; `promptCorpus.test.ts` pins Phase 12 bodies; **none of it reaches the live DB** (remote list ends 09-18 19:00).
6. `2026-09-19` — this audit: proofs 0/171 marker, 171/171 legacy tokens, 33/33/0 md5 parity, 4 runtime leaks.

---

## 25. Frequently-cited numbers (quick reference)

- 171 live rows; 171 distinct md5; 33 defaults; 0 markers.
- Corpus = 33 (Phases 8/11/12 each) — not 37 (4 extra ids are the exam_topics guard).
- Phase 8 live match 33/33; Phase 11 guard match 33/33; Phase 12 target match 0/33.
- Tokens live: visual_engine 171, diagram 103, title_en/te 101, metadata 76, render_type 63, headers/rows_en 66.
- Runtime: 167/171 compose clean; 4 leak (3 distinct tokens, 1 default row).
- Fallbacks: 2 (GENERIC 540 B, HISTORY 23,201 B), both clean.
- Coverage: 171 topics ↔ 171 prompts (1:1), 0 unresolved, 0 multi-prompt, 0 duplicates.
- Segments: 33, each with prompts; each with exactly 1 default.

---

## FINAL VERDICT

CURRENT ADMIN BULK UPLOAD PROMPT ARCHITECTURE: **171 legacy-format stored bodies (100% carry `visual_engine`; 0/171 carry `[PREPAREFORU_DYNAMIC_OUTPUT_CONTRACT]`) composed at runtime through `composeBulkUploadPrompt` into contract-clean output; live storage is frozen at the Phase 8 state (`20260823121745`, `updated_at` 2026-08-23 12:18:57), while Phase 11 and Phase 12 normalized-marker migrations exist only as untracked local files that were never applied (md5: Phase 8 33/33, Phase 11 guard 33/33, Phase 12 target 0/33; remote migration list ends at `20260918190000`).**

COUNTS: **171 stored prompts (33 `is_default`, 138 secondary; 171 topics ↔ 171 prompts, 1:1, 0 duplicates, 0 unresolved); 33-row migration corpus enforced by `promptCorpus.test.ts` (9/9 pass); 2 clean code fallbacks (`GENERIC_PROMPT` 540 B, `HISTORY_PROMPT` 23,201 B); runtime composition verified over all 171 bodies — 167 clean, 4 live-only leaks (`60390c66` metadata, `38ec331e` diagram, `6087e13c` metadata [default], `9066693b` diagram).**

SINGLE SOURCE OF TRUTH: **`src/lib/prompts/dynamicOutputContract.ts` (contract text + `QUESTION_OUTPUT_CONTRACT_VERSION`), applied via `promptComposer.composeBulkUploadPrompt` + `promptContentSanitizer` + `ensureSingleContractMarker` at display/copy time; the DB is a legacy reservoir, not the contract source.**

FUTURE SCHEMA CHANGE SAFETY: **LOW — 100% of persisted bodies are legacy-in-storage and the marker exists 0/171; any direct `prompt_text` read bypasses normalization; default selection (`find(is_default) ?? [0]`) surfaces legacy rows including the leaking `6087e13c`; Phases 11/12 are uncommitted and un-deployed, so normalization intent is not reproducible from the repo or the remote.**

FINAL AUDIT STATUS: **NOT CLEAN — 4 of 171 runtime-composed prompts leak one legacy token each (3 distinct leak classes: string-form `"metadata"` fences, `process_diagram` underscore tokens, non-context `metadata` prose); live DB is at Phase 8 while Phase 11/12 are unapplied and untracked; `promptCorpus.test.ts` enforces the 33-body migration corpus only and cannot detect the live-only leaks found here. Recommended first action: apply Phase 12 to the live DB, extend the corpus to all 171 live bodies, commit the Phase 11/12 migrations, and add the full 171-body runtime-equivalence regression suite.**