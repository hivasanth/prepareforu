# Styling System Simplification Plan

- **Phase:** 5.0 — Repository Styling System Architecture Audit (Step 12)
- **Type:** Documentation only — **recommendations only**. No implementation without separate approval.
- **Status:** Completed
- **Date:** 2026-08-04
- **Predecessor data:** STYLING_SYSTEM_ARCHITECTURE_AUDIT, STYLING_SYSTEM_COMPONENT_INVENTORY, STYLING_SYSTEM_DUPLICATION_REPORT

---

## 1. Guiding Principles
1. **No behavior or visual change** — each item is refactor/cleanup only, gated by the smoke suite.
2. **Freeze-aware** — Foundation primitives (`AntigravityUI` 108 consumers, `SharedComponents` 50, `AntigravityTypography` 28, `AdminText` 15, `AdminModal` 12) are never modified in place without a freeze-register entry and migration plan.
3. **Ship smallest, highest-value wins first** — start with pure deletions, then extractions, then token consolidation.
4. **Verify via `npx vitest run --config vitest.audit.config.ts`** (the working runner) + `npm run build`; jsdom runner is blocked by the pre-existing `ERR_REQUIRE_ESM` infra issue (DW-4).

---

## 2. Prioritized Roadmap (S1 → S10)

### S1 — Delete dead code (trivial, zero risk)
- Delete 10 orphaned files: `components/PaletteBackground.tsx`, `settings/types.ts`, and 8 never-routed barrels
  (`admin/{overview,questions,topics,upload,users}/index.ts`, `user/{subject-tests,topic-exams,topics}/index.ts`).
- Remove 19 unreferenced exported symbols (see Component Inventory §3.2).
- **Effort:** ~0.5 day. **Risk:** near-zero (all verified 0 importers).

### S2 — Extract `<FormError>` / `<FieldError>` (42 sites, 13 files)
- Replace the duplicated `text-xs font-bold text-danger mt-1` label (Tier-1 #1) with a single component.
- **Effort:** 0.5 day. **Risk:** low; pure markup consolidation.

### S3 — Remove dead variant values (20+ across 11 components)
- Trim variant unions to actually-used values:
  Button `auth-dark/auth-muted/auth-violet` + size `auth-xl`; Input `violet`; ResultStatCard `warning/primary`;
  ErrorContainer `banner/modal`; AdminText `cinzel-value/garamond-value` + 8 unused sizes; Spinner `neutral`;
  Menu `fade/slide`; CollectionCard `layout=grid` + `default/subtle/outlined/compact`; AdminModal `management`;
  Tabs `size` prop; StatCard `success/danger`.
- Keep type unions but tighten only after confirming zero usages (already verified).
- **Effort:** 1 day. **Risk:** low (dead-value deletions are safe by construction; guard with the variant table in the Component Inventory).

### S4 — Consolidate elevation/shadow systems (largest token-level win)
- Collapse the 4 parallel shadow systems into ONE: pick `--elevation-*` as canonical, alias the rest
  (`--shadow-xs..2xl`, semantic `--elevation-*`, `--shadow-ambient/contact/…`) to it, and delete the redundant
  `.light` re-declarations of the surface ladder (identical var() mappings).
- Resolve `--elevation-overlay` misname (a color posing as elevation) → route through `--surface-overlay`.
- **Effort:** 2–3 days. **Risk:** medium — requires grep-verifying every `var(--elevation-*)`/`var(--shadow-*)` consumer; freeze register entry required.

### S5 — Remove dead `@theme` registrations (~30 utilities)
- Delete never-used utility registrations: `shadow-elevation-5/6/7`, `shadow-button-primary`, `shadow-input-violet-focus`,
  `border-input-violet-focus-border`, all `*-hover/-subtle/-light` color utilities, `rounded-button-*`, `rounded-badge-md`,
  `rounded-alert`, `rounded-icon-sm`, `rounded-empty-state`, `rounded-filter`, `rounded-card-auth-light`,
  font-size `text-h1/h2/h3/display/body/…`, `--material-input-checkbox-*`.
- **Effort:** 1 day. **Risk:** low; each verified 0 class consumers.

### S6 — De-singleton `AntigravityUI` hub (architecture win)
- Split the 108-consumer / 36-dependency monolith into logical modules (Typography, Cards, Forms, Data, Layout, Feedback),
  re-exported from a slim `AntigravityUI` facade to avoid touching consumers.
- Breaks the 2 cycles `AntigravityUI ↔ DataTable` and `AntigravityUI ↔ SuccessModal` by moving the shared imports to
  the leaf modules.
- **Effort:** 3–5 days. **Risk:** medium-high (largest blast radius); freeze register + migration plan; land after S1–S5.

### S7 — Resolve duplicate/conflicting token names
- Collapse the 3 button namespaces (`--btn-*`, `--button-surface-*`, `--material-button-*`) to one family.
- Resolve `--input-border` (themes.css:912 vs index.css:312) and `--radius-xl/2xl` cross-file conflicts to a single definition.
- De-duplicate exact literals: gold `#C8960C` (4 owners), `--shadow-premium-carved`≡`--shadow-premium-icon`,
  `--card-shadow`≡`--management-shadow`≡`--filter-shadow`, `--shadow-focus` vs `--input-focus-shadow`, 3 carved-3D recipes,
  5× repeated light shadow compound, `--primary` vs `--color-accent` alias.
- Fix `text-stat-value` size/color class collision (rename one).
- **Effort:** 2–3 days. **Risk:** medium; verify every consumer via grep before aliasing.

### S8 — Extraction of repeated class compounds
- Convert Tier-1/Tier-2/Tier-3 compounds (Duplication Report §1) into layout/formatting components or shared constants:
  `BetweenRow`, `DivideList`, `SectionCardHeader`, auth-shell/auth-grid/auth-panel, carousel rail, table card wrapper,
  correct-answer accent bar, `soft-primary` icon-badge recipe (unify ~10 variant maps).
- **Effort:** 2–3 days. **Risk:** medium; must preserve exact pixel behavior (snapshot via smoke suite).

### S9 — De-hardcode token bypasses (charts + exam/topic readers)
- Replace hex chart palettes with `--chart-*` tokens (ChartVisualizer, DiagramRenderer, QuestionVisualizer, SubjectPieChart, MapVisualizer).
- Replace `rgba(15,23,42,0.12)` offset shadows (~20×) in `TopicReader`/`TopicSectionRenderer` with the `--management-*`/`--elevation-*` tokens already imported.
- Replace raw Tailwind palette classes (`amber-*`, `rose-*`, `purple-*`, `slate-*`, `red-*`, `green-*`) with semantic tokens.
- Replace `bg-white` light-only branches with the surface token; fix `bg-[var(--danger)]` light-mode divergence (unify `--danger` vs `--color-danger`).
- **Effort:** 2–3 days. **Risk:** low-medium; visual-preserving.

### S10 — Component-level simplification (feature trees)
- Break up the top-6 largest files: `useBulkUpload.ts` (623 LOC — split state machine into slices), `AddExamModal.tsx`
  (499 LOC / 67 JSX / depth 22), `AdminSelectionTabs.tsx` (471), `AntigravityData.tsx` (41 props), `AntigravityForm.tsx` (34 props), `QuestionForm.tsx` (403).
- Extract single-consumer fragile modules only when reuse justifies it (Leaderboard cards, visualizers, profile set).
- **Effort:** 3–5 days. **Risk:** medium; largest refactor, best done last with full test coverage.

---

## 3. Dependencies & Sequencing
```
S1 (0.5d) → S2 (0.5d) → S3 (1d) → S5 (1d)          [low-risk cleanups]
        ↘ S4 (2–3d) → S7 (2–3d) → S9 (2–3d)        [token consolidation]
                          ↘ S6 (3–5d)               [hub de-singleton]
                                     ↘ S8 (2–3d)    [compound extraction]
                                               ↘ S10 (3–5d) [file splits]
```
S1–S5 can ship independently and immediately. S6/S8/S10 depend on the token work being stable.

---

## 4. Verification Protocol
- Every step: `npx vitest run --config vitest.audit.config.ts` (working runner) + `npm run build`.
- Target post-audit suite: **ds007 18/18 PASS** unchanged; no new drift in ds003/ds005/ds014 (pre-existing drift
  tracked as DW-1…DW-4, out of scope).
- Each step requires a DESIGN_DECISION_LOG entry and, where a freeze-registered primitive is touched, a
  FOUNDATION_FREEZE_REGISTER entry.
- Expected outcome of full program: dead-code deletion (S1), ~40 fragment extractions (S2/S8), 20+ dead variants
  removed (S3), ~30 dead utilities removed (S5), 4→1 shadow systems (S4), 3→1 button namespaces (S7),
  hub fan-in 108→~20 (S6), zero token-bypass hot spots (S9), largest file <500 LOC (S10).