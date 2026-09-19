# PROJECT-WIDE PROMPT FORENSIC AUDIT

Scope: every prompt family feeding the app, their storage, their runtime
consumers, their history and their current contamination state. Companion:
`PROJECT_WIDE_PROMPT_NORMALIZATION_REPORT.md` (what changed + how it's enforced).

---

## 1. Prompt families (complete inventory)

### Family A — Admin Bulk Upload (MCQ generator for question-paper teams)
- Storage: DB table `prompt_templates` (uuid PK, prompt_text, topic_id, subject_id).
  - 171 rows per the `20260822112933` migration comment ("171/171 resolved").
  - 33 bodies ship canonically in the repository (migrated in
    `20260823121745_prompt_topic_canonicalization.sql`, re-normalized in
    `20260919000000_prompts_dynamic_output_contract.sql` [Phase 11] and
    `20260920000000_prompts_legacy_prose_normalization.sql` [Phase 12]).
  - 138 rows exist live-only, seeded outside the repo; they are NOT rewritten by
    migrations — the runtime composer normalizes them at display/copy time with
    the identical sanitizer.
- Read/write surface:
  - `src/lib/repositories/exam.repository.ts` (~434–540): `listPrompts`,
    `upsertPrompt`, `countPromptsForTopic`.
  - `src/services/adminQuestionService.ts` (~551+): prompt CRUD endpoints.
  - `src/components/admin/questions/PromptEditorModal.tsx`: admin edit path +
    `canonicalizePromptTopics` + `ensureDynamicContractMarker` on save.
- Composition: `composeBulkUploadPrompt(topicPrompt, topicIdentity)`
  (`src/lib/prompts/promptComposer.ts`) → sanitized topic body + TOPIC IDENTITY
  block + canonical dynamic output contract (exactly once).
- final state: every composed prompt = academic topic content only + the ONE
  shared contract; internal marker `[PREPAREFORU_DYNAMIC_OUTPUT_CONTRACT]` is
  replaced at runtime and never reaches the model/clipboard/instructions UI.

### Family B — Sub-admin Teacher Exam static prompt (parallel pipeline)
- `getPromptText(count)` in `src/components/sub-admin/create/types.ts` — a
  self-contained static prompt for a different generator path.
- Storage/write is its own RPC `createTeacherExamAtomic`
  (`src/services/teacherExamService.ts`); validated client-side by
  `BulkQuestionSchema` (CreateStepJsonPaste → QuestionCard → useCreateExam →
  CreateStepReview).
- Audited separately: no legacy application-format tokens, no visual_engine,
  no dynamic-contract dependency. Out of scope of the shared contract by design.

### Family C — Study-topic AI prompt renderer (NOT MCQs)
- `AI_PROMPT_TEMPLATE` in `src/constants/aiPromptTemplate.ts` — a rich
  study-material renderer ("Table"/"Bullet" directives are intentional for
  study notes, not question JSON). Consumer: `useAdminTopics.ts:11` (Admin Topic
  copy-AI-prompt). Explicitly out of MCQ-contract scope; unmodified.

### Fallbacks (Family A runtime)
- `useBulkUpload.ts:156` `GENERIC_PROMPT` and `:165` `HISTORY_PROMPT`, selected
  when `subjectName === 'History and Culture'` (line ~341). Both verified free
  of forbidden tokens; HISTORY = 60 MCQs (10 per section × 6), difficulty
  18/30/12 — internal totals feasible.

---

## 2. Runtime consumers of the composed prompt (no hidden LLM calls)

`composeBulkUploadPrompt` is consumed ONLY by:
- `useBulkUpload.ts:457` `handleCopy` (clipboard copy),
- `InstructionsTab.tsx:32` (display),
- `AIToolCards.tsx:38` (copy).

There are no in-app LLM invocations anywhere in the MCQ pipeline — the composed
text is copied for the operator to use elsewhere. Therefore "what the model
sees" == "what compose returns + the stale Contract not normally copied" (the
composed prompt appends the canonical contract; commands copy the composed
text). The stored-body contamination therefore equals live contamination, and
the corpus-wide tests below assert on the FINAL COMPOSED form.

---

## 3. Legacy contamination findings

Token scan over the 33 in-repo bodies (outside fenced examples — the part that
survives Phase 11 and reaches the model after composition):

- 12 of 33 bodies carried legacy format PROSE after Phase 11, i.e. the composed
  prompts for those topics contained `visual_engine`, `render_type`,
  `metadata` (renderer checklists + JSON keys, incl. Telugu
  "Structured JSON Metadata" renderer lines), and/or `diagram(s)`:
  `24368973` (Polity 6), `34524ad8` (Telugu 3), `383de54a` (Telugu 1),
  `74bb3a5e` (Polity 4), `9aee358b` (APPSC G2 Social History),
  `b0426987` (Bank 3 Networking), `b987883c` (Telugu 2),
  `ba90a119` (Bank 1 Computer Fundamentals), `c54cde71` (S&T 3 ISRO),
  `e3a9d6aa` (Polity 1), `e90517a9` (Bank 2 Software), `f15487b3` (Polity 2).
- 2 further bodies (`0fcf1a16`, `56c94778`) held legacy *shape* wording
  (`## 4. Diagram`, `"type":"diagram",` inside kept fence fragments) — total
  14 bodies touched by the prose scrub (incl. `56c94778`'s outside header).
- Root cause: post-Phase-11, only *fenced* legacy JSON was stripped. Renderer-era
  prose and `metadata` keys inside *kept* example fences survived.
- The shared canonical contract itself also taught a hard-coded cross-topic
  example (Dr. Ambedkar / Indian-constitution) wrapped around a "Polity Basics"
  question — cross-topic contamination by design (fixed in Phase 12, see below).

---

## 4. Secondary findings

- Phase 11 UPDATE guard literals do NOT recompute to the bodies they ship (all
  33 stale; the phase-11 DO-block fingerprint set DOES match). Phase 12 guards
  therefore use recomputed md5s anchored to the phase-11 asserted set.
- 3 Telugu prompts advertise difficulty 35/50/15 with N=50 — percentages cannot
  divide into 50 exactly; nearest integer triple (17/25/8 = 50) satisfies the
  contract's exact-count rule with a small percentage drift. All other 30 bodies
  use 30/50/20 → 15/25/10 (exact).
- `rg` (ripgrep) is not installed in this environment (used grep-tool lesson).
- No in-repo INSERT migration seeds `prompt_templates` — rows were live-seeded;
  only canonicalizing/normalizing migrations exist in-repo.