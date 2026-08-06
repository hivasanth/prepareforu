# Validation Dead Register

**Phase 2B — Form Validation (Step 2: Schema Consolidation, Step 5: Sub-Admin Module, Step 8: Repository Final Certification).**
**Status:** ACTIVE — updated 2026-08-01 (Step 8).
**Purpose:** Record dead / unreachable validation code, its confirmation, and its removal. Step 8 adds repository-level dead items confirmed during final certification.

---

## D1 — `validateQuestions()` in `src/components/sub-admin/create/types.ts`

- **What:** `export function validateQuestions(rawJson)` — a complete per-row question JSON validator (empty/size/batch guards + field presence + correct-option enum + truncation normalization), ~40 lines.
- **Why it was flagged:** Audit C3/C5 — never imported anywhere; `CreateStepJsonPaste.handleParse` was a near-verbatim inline copy of it (now also migrated).
- **Zero-consumer confirmation (2026-08-01):**
  - `grep validateQuestions` → matches only in `types.ts` (definition) and markdown docs. **Zero runtime consumers.**
  - No test file imports it.
  - No barrel export references it.
- **No-runtime-dependency confirmation:** the function depended only on `safeParse` (same file) and `QuestionData` (same file). Both remain in use after removal: `safeParse` is consumed by `CreateStepJsonPaste`; `QuestionData` is consumed by `CreateStepJsonPaste` and `useCreateExam`.
- **Action:** **REMOVED** 2026-08-01. The per-row validation responsibility now lives in the certified `BulkQuestionSchema` (`src/validations/questionSchema.ts`), consumed by `CreateStepJsonPaste`.
- **Behavioral impact:** None for reachable code — the function was never invoked. Stale README references (`src/components/sub-admin/create/README.md`) are noted for a later documentation pass.

---

## D2 — `validateConfig()` in `src/components/sub-admin/create/types.ts`

- **What:** `export function validateConfig(config)` — a wizard-local exam-config validator (title length, duration/negative ranges, start-in-past, end-after-start, duration ≤ window, window ≤ 30 days), ~40 lines, written against the file-local `ExamConfig` type.
- **Why it was flagged:** Audit C6 / Duplicate Register O3 — it expressed the same limits as the Admin `examCreationSchema` with different wording, so the Sub-Admin create wizard and the Admin exam rules could drift.
- **Zero-consumer confirmation (2026-08-01):**
  - `grep validateConfig` → matches only in `types.ts` (definition + type exports) after the Step 5 rewrite of `CreateStepSetup`; prior to the rewrite the only consumer was `CreateStepSetup` (now migrated to the shared schema).
  - No test file imports it.
- **No-runtime-dependency confirmation:** the function depended only on the file-local `ExamConfig` type; `safeParse`/`QuestionData` (same file) remain in use after removal.
- **Action:** **REMOVED** 2026-08-01 (Step 5). The wizard's Setup step now validates via the shared `examConfigSchema` (`src/validations/securitySchemas.ts`), which reuses the shared range scalars and the canonical `EXAM_NEGATIVE_MARK_RANGE_MESSAGE` — the duplicate rule no longer exists.
- **Behavioral impact:** None for reachable code paths — validation rules, wording, and timing are preserved by `examConfigSchema` (verified by the new `examConfigSchema` test suite and manual review).

---

## Change Record

- v1.0.0 — 2026-08-01 — Step 2: D1 `validateQuestions()` confirmed dead (zero consumers, no runtime dependency) and removed.
- v1.1.0 — 2026-08-01 — Step 5: D2 `validateConfig()` removed; replaced by shared `examConfigSchema` in `securitySchemas.ts`.
- v1.2.0 — 2026-08-01 — Step 8: registered D3 (zero-use canonical layout primitives), D4 (stale `sub-admin/create/README.md` still documents removed validators), D5 (dead `notVisitedCount` prop in `SubmitExamModal`), D6 (dead `spacing` map in `AntigravityTypography`). All confirmed via grep during final certification; none blocks production.

---

## D3 — Zero-use canonical layout primitives

- **Reason:** Repository-wide layout is single-sourced in `AntigravityLayout.tsx`; three primitives are exported but unused, so they are dead API surface that also masks `SectionBlock` as the canonical section primitive.
- **What:**
  - `SectionBlock` (`AntigravityLayout.tsx:43-47`) — `<SectionBlock>` has **0 JSX uses** repo-wide; `SectionWrapper` is used 0 times and not barrel-exported; layout `PageHeader` has 0 JSX uses (the `<PageHeader>` in `AdminSettings.tsx:30` is the separate admin portal component).
  - `SectionWrapper` (`AntigravityLayout.tsx:100-104`) additionally duplicates `SectionBlock` spacing behavior with off-scale `space-y-[14px]` — see F-DS-7 in `design-system-compliance.md`.
- **Current Consumers:** None (grep `<SectionBlock>` / `<SectionWrapper>` / layout `PageHeader` JSX = 0).
- **Removal Phase:** Next planned consolidation phase — either adopt `SectionBlock` where section spacing is needed (7 legacy `SectionHeader` consumers are the natural candidates) or mark these `@deprecated` and remove in a later cleanup. Do NOT delete `SectionBlock` before confirming no adoption path.
- **Reference:** `docs/certification/design-system-compliance.md` F-DS-7.

## D4 — Stale `src/components/sub-admin/create/README.md` documenting removed validators

- **Reason:** After D1/D2 removal, the README still documents `validateQuestions()` (lines 74, 790, 918, 971, 989) and `validateConfig()` (lines 133, 187, 322, 558, 781, 917, 976, 988) as live code, contradicting the Dead Register and creating doc↔code drift at certification time. (Self-acknowledged in D1; unresolved until Step 8.)
- **Current Consumers:** Documentation only — no runtime references exist; `grep validateQuestions`/`validateConfig` in `src/` returns zero runtime matches.
- **Removal Phase:** Documentation cleanup phase (update README + `AR004_VERIFICATION.md` historical reference).
- **Reference:** `docs/validation/validation-compliance.md`; `src/components/sub-admin/create/README.md`.

## D5 — Dead `notVisitedCount` prop in `SubmitExamModal`

- **Reason:** The interface declares `notVisitedCount?: number` (`SubmitExamModal.tsx:11`) and `ActiveExamPage.tsx:209` passes it, but the component never destructures or renders it (Unanswered is derived as `Math.max(0, total - answered)`).
- **Current Consumers:** One caller (`ActiveExamPage.tsx:209`) passes the value; the rendered summary never reads it.
- **Removal Phase:** Next cleanup phase — remove the prop from the interface and the call site (behavior is unchanged; derived Unanswered remains).
- **Reference:** `src/components/exam/SubmitExamModal.tsx:11`.

## D6 — Dead `spacing` map in `AntigravityTypography`

- **Reason:** `AntigravityTypography.tsx:3-11` exports `spacing = { xs:'4px', sm:'8px', … }`, a vestigial JS duplication of the `--space-*` token system with **zero consumers** (grep across `src` = 0). Violates the single-spacing-source rule in `FOUNDATION_GOVERNANCE.md` §13.
- **Current Consumers:** None.
- **Removal Phase:** Next consolidation phase — delete the export (typography components already consume `--text-*`/`--space-*` tokens).
- **Reference:** `src/components/common/AntigravityTypography.tsx:3-11`.
