# Typography Implementation Plan

**Phase 5.4C — Typography Language (planning / audit only)**
**Status:** ⏳ PLAN ONLY — NOT authorized to execute. Each workstream below requires a separate dedicated approval (established gate pattern from 5.4A/5.4B).
**Date:** 2026-08-06
**Role:** Lead Foundation Architect
**12-part structure:** this file carries **Part 9 (Implementation Roadmap)** and **Part 10 (Risk Assessment)**.
**Approval gates (never combined):** Gate A = contrast decisions (X-1…X-7, render-affecting); Gate B = Foundation consolidation (render-identical); Gate C = reusable-component migration; Gate D = admin/exam/page migration; Gate E = dead-token SAFE DELETE.

---

## Part 9 — Implementation Roadmap

### Phase 0 — Decisions (Gate A, separate approval)

Resolve the render-affecting contrast findings before any Foundation work:
- X-1 `--text-hint` (both themes) — raise value OR constrain to decorative.
- X-2 `--text-muted` on elevated — usage gate (`--text-secondary` on elevated).
- X-3 dark `--text-link` on surface/elevated — raise dark value or underline+secondary in tables.
- X-4 dark `--text-on-accent`/`--text-on-danger` — darker fills or bold/large-only.
- X-5 light `--placeholder-color` — raise value.
- X-6 light status-as-text — role restriction (already in this spec).
- X-7 dark nav-active — lighter accent text or fill indicator.

Deliverable: `TYPOGRAPHY_CONTRAST_DECISIONS.md` (decided pairs, new values, visual-delta report).

### Workstream 1 — Foundation consolidation (Gate B, render-identical)

1. **Utility surface for the canonical scale (R-2):** register `--text-display/h1/h2/h3/body/small/caption/label/badge` in `@theme`. Additive; does not override existing utilities. Proof: byte-identical resolve for every token value.
2. **Weight/tracking/leading utility wiring (R-6):** map the **live** `--weight-*`, `--lh-*`, `--ls-*`, `--tt-*` sets to utilities **only where value-identical** to the Tailwind default they replace; any value difference is deferred to Gate A.
3. **Typography composite (R-1):** merge `AntigravityTypography` + `AdminText` into one superset primitive; `role` resolves the full token tuple (no inline `var()`); export existing names as thin wrappers. **Zero consumer churn.**
4. **New primitives:** `MicroText` (R-3, 9-13px scale only), `StatValue` (R-4), `LinkText` (R-5).
5. **`--brand-text-gradient` token (R-8):** `BrandTitle` consumes the token with values copied exactly (`#f5e0be`→`#b88c3a`) → render-identical.
6. **Governance:** `FOUNDATION_GOVERNANCE.md` Typography Language Contract (role→token→contrast table from the spec); `TYPOGRAPHY_LANGUAGE_SPECIFICATION.md` status → IMPLEMENTED.

Deliverables: implementation report, visual verification, certification package (per 5.4A/5.4B pattern).

### Workstream 2 — Reusable-component migration (Gate C)

Ordered by shared-impact (candidates from Component Audit §3):
1. `AdminModal`, `AntigravityLayout` — raw `<h2>` → `H2` primitive (render-identical).
2. 102 arbitrary `text-[Npx]` in `src/components/common` → MicroText / scale utilities (pixel-identical swaps only).
3. `text-[var(--text-muted)]` bypass (23) → `text-text-muted`.
4. `BrandTitle` gradient already tokenized (WS-1); verify.
5. Opacity fades in reusable components → ladder roles where the resolved color differs, else defer to Gate D.

### Workstream 3 — Admin / exam / page migration (Gate D)

Per-area (each area its own sub-gate, mirroring 3.6/4.0 page-migration pattern):
1. Admin questions: `QuestionForm`, `CreateStep*`, `AdminTopicPreviewRenderer` (hint-content remap C-1, opacity, `text-green-500`).
2. Exam/performers: `ExamDetailSection`, `ExamPerformers`, `ExamQuestionAnalysis`, `ExamStudentTable`, `ExamSummaryCards`, `ExamSubComponents` (palette text, `var(--text-muted)` bypass).
3. Profile/auth: `StatisticsSection`, `ResultsPage`, `VerifyEmailPage`, `AccountDisabledPage`, `SuccessView`, `SidebarLayout`, `LanguageSelectionScreen` (hint-content, palette text, sub-8px).
4. **Never in the same phase as Foundation work** (D-145 rule).

### Workstream 4 — Dead-token cleanup (Gate E)

5.3-style SAFE DELETE of the **41 dead typography tokens** (audit §5.3), deletion-only, after the sweep is re-run to prove zero consumers. Zero runtime/visual/Foundation-value changes.

### Workstream 5 — Certification

Per `TYPOGRAPHY_CERTIFICATION_CHECKLIST.md` (parts 11-12): verification plan + checklist + manual visual verification (both themes, all role tiers).

---

## Part 10 — Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **R-1 Utility override shifts certified renders.** Registering `--text-*`/`--weight-*`/`--tracking-*` could collide with Tailwind defaults (`tracking-widest`, `leading-normal`, `font-semibold`, …). | Med | High | only register names that do not exist as defaults; value-identity proof per token; any mismatch defers to Gate A. |
| **R-2 "Render-identical" claim fails on responsive/bespoke values** (`text-[10px] sm:text-xs`, `text-xl sm:text-2xl`). | Med | High | pixel-swap rule: a migration is approved only where the token value equals the rendered px at every breakpoint; otherwise keep the site or classify as render-affecting. |
| **R-3 Contrast fixes (X-*) change visuals broadly** (hint used 14×, muted-on-elevated, dark buttons). | High | High | Gate A owns all value changes; visual-delta report; certify in both themes before any consumer work. |
| **R-4 Composite consolidation hides a value difference** (inline `var()` vs class resolution, font-variant gating). | Med | High | snapshot comparison per role before/after; `!isDark` cinzel/garamond gate must be byte-identical. |
| **R-5 Dead-token deletion removes a token consumed via CSS-internal ref not caught by TS sweep.** | Low | Med | sweep counts refs across CSS + TSX (dead-tokens4 method); `--text-badge`/`--text-link` double-checked for utility wiring (none). |
| **R-6 Large consumer surface (283 primitive tags, 278 arbitrary sizes, 536 weights)** extends phase time / rebase conflicts. | Med | Med | area-scoped sub-gates (D-146 pattern); Foundation never mixed with consumer work. |
| **R-7 Micro-text floor (9px) removes intentional tiny labels** (7-8px non-essential). | Med | Low | non-essential labels allowed ≥3:1 at 7-8px; only *content* micro-text is floored (C-4). |
| **R-8 Status-color role restriction changes meaning of green/red in tables** (pass/fail data columns). | Med | Med | status tokens remain for true pass/fail badges (V-7); neutral ladder for data columns — visual, but gated in Gate D. |
| **R-9 Light placeholder raise alters many inputs.** | Low | Med | Gate A decision; single token value change, wide surface — visual delta reviewed before approval. |

**Risk posture:** zero production change in 5.4C. All execution risks sit behind their own dedicated gates; the 12-part certification structure is the approval vehicle.

---

*End of Typography Implementation Plan. This is a plan only; no code changes are authorized by this document.*
