# Styling System Health Score

- **Phase:** 5.0 — Repository Styling System Architecture Audit (Step 10 / Step 11 / final score)
- **Type:** Documentation only. Zero code, token, or Foundation changes.
- **Status:** Completed
- **Date:** 2026-08-04

---

## 1. Scorecard

| Dimension | Weight | Score /100 | Rating | Evidence |
|---|---|---|---|---|
| 1. Architecture clarity | 20% | 78 | Good | 3-layer token contract (Layer1→2→3, frozen) is clear and simple; marred by monolith hub + 8 dead barrels |
| 2. Layer complexity | 15% | 55 | Fair | 4 parallel elevation/shadow systems; `.light` re-declares inherited surfaces; `--elevation-overlay` misnamed |
| 3. Token hygiene | 20% | 58 | Fair | ~30 dead utilities, 3 button namespaces, 2 conflicting `--input-border`/`--radius-*`, 4× gold literal, exact duplicates |
| 4. Component quality | 20% | 62 | Fair | 20+ dead variants, 19 unreferenced exports, 10 dead files, 3 circular deps, top-6 files ≥400 LOC (largest 623) |
| 5. Reusability | 15% | 70 | Good | 108→143-consumer Foundation barrel, 50-consumer SharedComponents; weak spots: dead barrels, single-consumer fragile modules |
| 6. Deviation risk (hardcoding) | 10% | 50 | Fair | Hex chart palettes, arbitrary shadows (~30 sites), raw Tailwind palette classes, light-mode `--danger` divergence |
| **Overall** | 100% | **62** | **Moderate** | See §3 |

---

## 2. Complexity Baseline

### 2.1 Token/utility surface
- `src/styles/themes.css` = **1127 lines**; `src/index.css` = **1070 lines**.
- ~30 registered `@theme` utilities with **zero class consumers** (dead weight).
- 4 parallel shadow/elevation systems collapsing to ~3 visual levels.

### 2.2 Component surface
- **236 component files** under `src/components/**` (of 387 total files under `src`).
- **3 circular dependencies** (`AntigravityUI↔DataTable`, `AntigravityUI↔SuccessModal`, `BulkUploadPanel↔PromptEditorModal`).
- **10 orphaned files** + **19 unreferenced exports**.
- **Largest files (>500 LOC, all of src):** `useBulkUpload.ts` (623), `securitySchemas.test.ts` (605), `SignupPage.tsx` (563), `authService.ts` (546), `adminQuestionService.ts` (507) — only one is a component (`useBulkUpload`).
- **Deepest live chain:** length 11 (`prepare-write/index → ExamView → exam/index → QuestionCard → QuestionActions → AntigravityUI → DataTable → SharedComponents → AdminModal → AntigravityButton → Spinner`).
- **Largest prop surfaces:** `AntigravityData.tsx` (41 props), `AntigravityForm.tsx` (34).
- **Most JSX-dense:** `AddExamModal.tsx` (499 LOC, 67 JSX elements, depth 22).

### 2.3 Dead variant surface (defined, never used)
20+ values across 11 components — dominated by the `auth-*` family and the never-passed `size`/`shape`/variant branches.

---

## 3. Overall Verdict — 62 / 100 (Moderate)

The system is **sound at its core** (a clear, frozen, three-layer token architecture with a working Tailwind bridge
and a genuinely reusable Foundation), but is **carrying a large amount of dead and duplicated surface area**:

- **Strengths worth protecting:** the frozen Layer contract, the `@theme` bridge, and the reusable Foundation hub.
- **Main risks:** the `AntigravityUI` monolith (108 consumers / 36 deps / 2 cycles), the 4-way shadow duplication,
  dead utilities/variants that invite future misuse, and token-bypass hot spots in charts and exam/topic readers.

**Interpretation of score bands:**
- 80+ Excellent · 70–79 Good · 55–69 **Moderate** · <55 Needs work.
- At 62 the system is maintainable today but the accumulated dead surface will make future theme/migration work
  increasingly risky (and any visual change must today be verified in up to 4 parallel shadow definitions).

---

## 4. Biggest Levers (from Simplification Plan)
| Lever | Est. impact | Effort | Risk |
|---|---|---|---|
| S1 delete dead code | Removes 10 files + 19 exports | 0.5d | zero |
| S2 `<FormError>` extraction | −42 duplicated fragments | 0.5d | low |
| S4 shadow-system consolidation | 4→1 systems; removes `.light` duplicates | 2–3d | medium |
| S5 dead-utility removal | −30 registered utilities | 1d | low |
| S6 de-singleton hub | fan-in 108→~20; breaks 2 cycles | 3–5d | med-high |
| S7 token de-duplication | 3→1 button namespaces; resolves conflicts | 2–3d | medium |

**After S1–S7 the projected score rises to ≈ 78 (Good);** completing S8–S10 (compound extraction + de-hardcoding +
file splits) projects ≈ 85.

---

## 5. Roadmap answer to Success Criterion #10
The full prioritized roadmap (S1→S10) is in **STYLING_SYSTEM_SIMPLIFICATION_PLAN.md**. Sequencing: low-risk
deletions/extractions first (S1, S2, S3, S5), then token consolidation (S4, S7), then architecture
(S6), then the deeper extractions (S8, S9, S10). Nothing in this phase is implemented — each step requires
separate approval, a DESIGN_DECISION_LOG entry, and (where frozen primitives are touched) a
FOUNDATION_FREEZE_REGISTER entry.