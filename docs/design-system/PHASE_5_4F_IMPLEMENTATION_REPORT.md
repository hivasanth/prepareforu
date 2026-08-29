# Phase 5.4F — Skeleton & Loading Language: Foundation Evolution Implementation Report

- **Phase:** 5.4F (Skeleton & Loading Language) — Foundation evolution
- **Status:** IMPLEMENTED 2026-08-06 — **awaiting user certification**
- **Approval:** D-171 planning decision approved the skeleton/loading language design; the user
  granted the separate dedicated 5.4F implementation approval (2026-08-06, direct directive with the
  DO/DON'T checklist). Foundation-only: ONE `Skeleton` primitive (single rendering owner) with thin
  geometry-only wrappers; ONE `Spinner` (`variant="current"`) + ONE `LoadingOverlay`; loaders
  delegate internally; additive `--skeleton-*` tokens only; no consumer/page/layout/context/guard
  migration.
- **Decisions:** **D-171 (planning), D-172 (implementation)** recorded in
  `docs/design-system/DESIGN_DECISION_LOG.md`

---

## 1. Executive summary

Phase 5.4F is the **skeleton & loading language** Foundation gate. It collapses the pre-5.4F state
(multiple hand-rolled pulse skeletons, gold/amber placeholder material, three loader components with
divergent markup, raw `0.4s`/`delay-700` timing, and the `border-current border-t-transparent`
spinner hack) into ONE skeleton primitive, ONE spinner, ONE overlay, ONE timing source, and ONE
color language. The phase delivered:

1. **ONE Skeleton primitive** — `src/components/common/Skeleton.tsx`: the ONLY skeleton renderer.
   Owns surface/block colors (premium = the neutral `--skeleton-*` language; management = the
   certified D-144 Management Surface Family material), radius, `animate-pulse`, and a11y
   (card-type = `role="status"` + `aria-label`). No rendering duplication anywhere else.
2. **Thin wrappers** — `LoadingSkeleton`/`GridSkeleton`/`StatSkeleton` rewired as backward-compatible
   wrappers composing `Skeleton` (geometry/convenience props only). Zero consumer call-site churn.
3. **Zero gold** — the gold premium skeleton material (`GOLD_SURFACE`/`shadow-premium-icon`/
   `shadow-premium-card`) and the gold `PremiumLoader` hex are gone from the skeleton/loading
   language. Gold remains ONLY on the certified premium CONTENT surfaces (EmptyState/StatCard/
   PremiumIconContainer, D-141) — never on placeholders or loading indicators.
4. **Management variants** — `QuestionsTable` (GridSkeleton) + `AdminSubAdminsView`
   (LoadingSkeleton) now pass `variant="management"` (SK-1/SK-3/SK-6).
5. **ONE spinner** — `Spinner` gained `variant="current"`; the four `border-current
   border-t-transparent` inline hacks migrated (AntigravityButton Button ×2 + IconButton, Pill,
   TestConfigView). The page-level `SubAdminDashboard` hack is out of scope (documented for 5.4G).
6. **ONE overlay + delegation** — `LoadingOverlay` (full-screen/inline, ambient, message, ariaLabel,
   `role="status" aria-live="polite"`). `LoadingScreen` (ambient), `PremiumLoader` (inline), `Loader`
   (→ `Spinner lg`) delegate internally — App/AuthContext/Guards/AuthCallbackPage consumers
   unchanged (LG-1/LG-2/LG-5).
7. **Motion tokenized** — `UploadProgressOverlay` `0.4s ease` → `stroke-dashoffset
   var(--duration-normal) var(--ease-standard)` (LG-3); ambient `delay-700` →
   `[animation-delay:var(--duration-very-slow)]` (LG-4). Zero raw durations in the loading language.
8. **Additive tokens** — `--skeleton-surface` (dark `var(--bg-elevated)` / light `#F1F5F9`) +
   `--skeleton-block` (dark `var(--border-input)` / light `#E2E8F0`) added to FROZEN `themes.css`
   (dark `:root` aliases + light `.light` hexes). The ONLY skeleton tokens.
9. **Verification** — `tsc -b --force` exit 0; build exit 0; eslint **396 (net −1 vs the 397
   baseline, 0 new)**; vitest 301/33 identical; dist CSS grep all skeleton tokens + keyframes
   present; regex scans of `src/components/**` clean.
10. **Governance** — `FOUNDATION_GOVERNANCE.md` v1.25.0 → **v1.26.0** (§4 Skeleton & Loading
    Language Contract; §36 changelog); Freeze Register **DS-019** (Skeleton & Loading System
    FROZEN); D-171/D-172; execution log updated.

**Scope discipline:** only Foundation/loading component files under `src/components/**` +
`src/styles/themes.css` (additive) were modified. **No consumer, page, layout, context, guard,
theme-value, or token-value file was modified.**

---

## 2. Scope executed (approved 2026-08-06)

| Area | Result |
|---|---|
| Skeleton primitive | `Skeleton.tsx` — the ONE renderer (variant premium/management, type text/card, lines, height, width, borderRadius, className, ariaLabel) |
| Thin wrappers | `LoadingSkeleton`/`GridSkeleton`/`StatSkeleton` compose `Skeleton` (geometry/convenience only) — zero consumer call-site churn |
| Zero gold | gold skeleton material removed from ALL skeletons; gold remains only on certified premium CONTENT surfaces (EmptyState/StatCard/PremiumIconContainer, D-141) |
| Hand-rolled pulses | `ExamDetailModal` + `AntigravityCard` StatCard rewired through the primitive (SK-2) |
| Management variants | `QuestionsTable` (GridSkeleton) + `AdminSubAdminsView` (LoadingSkeleton) → `variant="management"` (SK-1/SK-3/SK-6) |
| One spinner | `Spinner` `variant="current"`; `border-current border-t-transparent` hacks migrated (AntigravityButton ×3, Pill, TestConfigView) |
| One overlay | `LoadingOverlay` (`role="status" aria-live="polite"`); `LoadingScreen`/`PremiumLoader`/`Loader` delegate (LG-1/LG-2/LG-5) |
| Motion tokenized | `UploadProgressOverlay` `0.4s ease` → tokens (LG-3); ambient `delay-700` → `[animation-delay:var(--duration-very-slow)]` (LG-4) |
| Additive tokens | `--skeleton-surface`/`--skeleton-block` (dark var aliases + light hexes) — the ONLY skeleton tokens |
| Verification | tsc/build/lint net −1; vitest identical; dist CSS grep; regex scans clean |
| Governance | v1.26.0 §4 Skeleton & Loading Language Contract; D-171/D-172; freeze register DS-019 |

Out of scope (NOT executed): any consumer/page/layout/context/guard migration, the page-level
`SubAdminDashboard` spinner hack (documented for 5.4G), contrast gates **C-1…C-5** (each a separate
dedicated approval, never batched), and the future **5.4G (Repository Migration)** gate (separate
dedicated approval).

---

## 3. The skeleton & loading language

### 3.1 Skeleton tokens (themes.css, additive)

| Token | Dark value | Light value |
|---|---|---|
| `--skeleton-surface` | `var(--bg-elevated)` | `#F1F5F9` |
| `--skeleton-block` | `var(--border-input)` | `#E2E8F0` |

The ONLY skeleton colors. Management variants resolve through the certified D-144 Management
Surface Family namespace (`--management-surface-muted` blocks, `--management-surface` +
`--management-border` + `--management-shadow` cards) — pixel-identical to the pre-5.4F management
card skeleton. Dark mode is token-driven — no `isDark` branches in placeholders.

### 3.2 The ONE `Skeleton` primitive

`variant` selects the material grammar (premium = neutral skeleton language; management = D-144
management material). `type="card"` renders a full card placeholder (`role="status"` +
`aria-label="Loading"`); `type="text"` renders a single pulse bar. `radius`/`pulse`/colors/a11y are
owned by the primitive; wrappers pass geometry/convenience only.

### 3.3 ONE spinner + ONE overlay

`Spinner` is the ONLY spinner — `variant="primary"` (certified accent border) and
`variant="current"` (the certified replacement for the deprecated `border-current border-t-transparent`
hack). `LoadingOverlay` is the ONLY overlay — full-screen (fixed, app-bg, fade via
`transition-interaction duration-very-slow ease-standard`) or inline (no background), optional
ambient accent pulses (staggered with `[animation-delay:var(--duration-very-slow)]`), optional
caption, `role="status" aria-live="polite"`. All loading motion uses the certified Motion Language
(DS-018) — `animate-pulse`/`animate-spin` + the `--duration-*`/`--ease-*` tokens; `prefers-reduced-motion`
is honored by the global override.

---

## 4. Files changed

| File | Change |
|---|---|
| `src/components/common/Skeleton.tsx` | **NEW** — the ONE skeleton renderer (surface/block colors, radius, pulse, a11y) |
| `src/components/common/SharedComponents.tsx` | `LoadingSkeleton`/`GridSkeleton`/`StatSkeleton` rewired as thin wrappers over `Skeleton`; `LoadingOverlay` added |
| `src/components/common/Spinner.tsx` | `variant="current"` added (the certified spinner-hack replacement) |
| `src/components/common/AntigravityButton.tsx` | 3 inline `border-current border-t-transparent` spinners → `variant="current"` (Button branches ×2 + IconButton) |
| `src/components/common/Pill.tsx` | loading spinner → `variant="current"` |
| `src/components/user/TestConfigView.tsx` | loading spinner → `variant="current"` |
| `src/components/sub-admin/exams/ExamDetailModal.tsx` | hand-rolled pulse card → `<LoadingSkeleton height={128} borderRadius={16} />` |
| `src/components/sub-admin/exams/ExamDetailSection.tsx` | redundant `text-primary border-primary/20 border-t-primary` classes cleaned → `<Spinner size="sm" />` |
| `src/components/common/AntigravityCard.tsx` | StatCard loading → `<Skeleton width={64} height={16} borderRadius={4} className="mt-1" />` (hand dark/light branch removed) |
| `src/components/admin/questions/QuestionsTable.tsx` | GridSkeleton → `variant="management"` |
| `src/components/admin/sub-admins/AdminSubAdminsView.tsx` | LoadingSkeleton → `variant="management"` |
| `src/components/admin/upload/UploadProgressOverlay.tsx` | `0.4s ease` → `stroke-dashoffset var(--duration-normal) var(--ease-standard)` |
| `src/components/PremiumLoader.tsx` | gold duplicate spinner removed → delegates to `LoadingOverlay` (inline, LG-1) |
| `src/components/Loader.tsx` | book-loader markup removed → delegates to `<Spinner size="lg" />` (LG-2) |
| `src/components/LoadingScreen.tsx` | raw `delay-700` tokenized → delegates to `LoadingOverlay` (full-screen + ambient, LG-4/LG-5) |
| `src/styles/themes.css` | additive `--skeleton-surface`/`--skeleton-block` (dark `:root` aliases + light `.light` hexes) — NO value change |
| `FOUNDATION_GOVERNANCE.md` | v1.25.0 → **v1.26.0**; §4 Skeleton & Loading Language Contract; §36 changelog |
| `FOUNDATION_FREEZE_REGISTER.md` | Skeleton & Loading System row (**DS-019**, FROZEN) + Phase 5.4F entry |
| Root deliverables | `FOUNDATION_SKELETON_AUDIT.md`, `FOUNDATION_LOADING_AUDIT.md`, `SKELETON_LANGUAGE_SPECIFICATION.md`, `LOADING_LANGUAGE_SPECIFICATION.md`, `PHASE_5_4F_IMPLEMENTATION_PLAN.md`, `PHASE_5_4F_CERTIFICATION.md` |
| `docs/design-system/PHASE_5_4F_{IMPLEMENTATION_REPORT,VISUAL_VERIFICATION,CERTIFICATION}.md` | this report + verification evidence + certification gate |
| `docs/design-system/DESIGN_DECISION_LOG.md` | **D-171** (planning), **D-172** (implementation) |
| `PHASE_3_1_EXECUTION_LOG.md` | 5.4F implementation entry |

**No consumer, page, layout, context, guard, service, schema, theme-value, or token-value file was
modified.**

---

## 5. Verification summary

| Check | Result |
|---|---|
| `npx tsc -b --force` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (pre-existing warnings only) |
| `npx eslint .` | ✅ **396 problems (343 E / 53 W) — net −1 vs the 397 baseline, 0 new** |
| Vitest baseline proof | ✅ working tree = 301 passed / 33 failed = identical baseline (via `--config vitest.audit.config.ts`) |
| dist CSS grep | ✅ `--skeleton-surface`/`--skeleton-block` (dark var aliases + light hexes), `animate-pulse`, `animate-spin`, `[animation-delay:var(--duration-very-slow)]` all present in `dist/assets/index-BPaGez_a.css` |
| Regex scan | ✅ `src/components/**`: zero `#d4af37`/`#2c4c3b`/`#f4ebd8`/`--premium-green`; zero gold on any skeleton material; zero `0.4s`/`delay-700`; zero inline `border-current border-t-transparent` hacks in scope |

Full evidence in `PHASE_5_4F_VISUAL_VERIFICATION.md`.

**Note on the lint count:** the 5.4F work introduced zero new eslint findings (396 unchanged from
the 5.4E close). The remaining 396 are the pre-existing repo-wide findings (FileNaming rule, etc.).

---

## 6. Rollback

- `git checkout` the component files → pre-5.4F skeletons/spinners/loaders; delete
  `Skeleton.tsx`; remove the `LoadingOverlay` addition and wrapper rewiring.
- `themes.css`: remove the additive `--skeleton-*` block (no frozen value changes to revert).
- Governance/docs edits are revertable single-file changes.

---

## 7. Definition of Done

- [x] ONE `Skeleton` primitive — single owner of colors, radius, pulse, a11y; no rendering duplication
- [x] Wrappers thin (geometry/convenience only); zero consumer call-site churn
- [x] Zero amber/gold/warm in the skeleton/loading language (gold = certified premium CONTENT surfaces only)
- [x] ONE `Spinner` (`variant="current"` replaces the hacks) + ONE `LoadingOverlay`; loaders delegate
- [x] Motion tokenized to DS-018 (no raw durations/delays); reduced-motion honored
- [x] Additive `--skeleton-*` tokens only; dark mode token-driven (no `isDark` branches)
- [x] Management variants on Questions/Sub-Admins
- [x] Verification: tsc/build exit 0; eslint net −1; vitest baseline identical; dist CSS grep; regex scans clean
- [x] Governance v1.26.0 + DS-019 + D-171/D-172 + execution log
- [x] 6 root deliverables + 3 phase docs
- [ ] **USER CERTIFICATION** (pending — `PHASE_5_4F_CERTIFICATION.md`)

## Next gate

**Phase 5.4F is IMPLEMENTED (awaiting user certification).** On certification, 5.4F CLOSES (the
Skeleton & Loading Foundation is permanently frozen under DS-019). **5.4G (Repository Migration)
does NOT begin on this certification — it requires a separate dedicated approval.** Contrast gates
C-1…C-5 remain OPEN — each a separate dedicated approval (never batched).
