# Phase 5.4F — Skeleton & Loading Language: Implementation Plan

**Phase:** 5.4F (Skeleton & Loading Language Foundation Evolution)
**Date:** 2026-08-06
**Decisions:** D-171 (planning gate) → D-172 (implementation gate)
**Status:** 📋 PLANNING — implementation begins after the user grants the separate dedicated 5.4F
implementation approval (same protocol as 5.4E).

---

## 1. Objective

Establish the **ONE** skeleton + loading language:

1. **ONE `Skeleton` primitive** (`src/components/common/Skeleton.tsx`) — the single owner of
   skeleton rendering (surface, block, radius, pulse, a11y), with `LoadingSkeleton`/`GridSkeleton`/
   `StatSkeleton` rewired as thin backward-compatible wrappers.
2. **ONE spinner/overlay language** — `Spinner` gains the `current` variant; `LoadingOverlay` becomes
   the ONE overlay; `PremiumLoader`/`Loader`/`LoadingScreen` delegate to it; raw timing tokenized.
3. **Zero amber/gold/warm shimmer** — the gold premium skeleton material (`GOLD_SURFACE`,
   `--gold-300`, `shadow-premium-*`) and the gold `PremiumLoader` hex are removed from the
   skeleton/loading language.
4. **Reuse certified Motion + Surface languages** — skeleton/loading colors resolve from
   `--skeleton-*`/`--management-*` (certified Surface Language: light = Management ladder, dark =
   certified dark neutrals); all loading timing uses DS-018 Motion tokens.
5. **Foundation-only** — `src/components/**` + additive tokens in `src/styles/themes.css` only.
   No `src/pages/**`, `src/layouts/**`, `src/context/**`, `src/guards/**`, theme-value, or
   token-value change. Consumer call-sites (App/AuthContext/Guards/AuthCallbackPage) are untouched —
   the components they render are rewritten internally.

---

## 2. Scope

**In scope (Foundation + feature):**

| File | Change |
|---|---|
| `src/styles/themes.css` | **Additive** skeleton tokens: `--skeleton-surface` (dark `--bg-elevated` / light `--bg-elevated`) + `--skeleton-block` (dark `--border-input` / light `--bg-active`). FROZEN theme values untouched. |
| `src/components/common/Skeleton.tsx` | NEW — the ONE primitive (`variant`/`type`/`lines`/`height`/`width`/`borderRadius`/`className`/`ariaLabel`). |
| `src/components/common/SharedComponents.tsx` | `LoadingSkeleton`/`GridSkeleton`/`StatSkeleton` → thin wrappers over `Skeleton` (legacy APIs preserved); `LoadingOverlay` added (ONE overlay). |
| `src/components/common/Spinner.tsx` | Add `variant="current"` (`border-current border-t-transparent`). |
| `src/components/common/AntigravityButton.tsx`, `Pill.tsx` | Spinner hack `className="border-current border-t-transparent"` → `variant="current"`. |
| `src/components/user/TestConfigView.tsx`, `sub-admin/exams/ExamDetailSection.tsx` | Spinner → explicit variants (`current` / `primary`). |
| `src/components/common/AntigravityCard.tsx` | StatCard `loading` block → `Skeleton` (SK-2). |
| `src/components/sub-admin/exams/ExamDetailModal.tsx` | Hand-rolled pulse → `LoadingSkeleton` (SK-2). |
| `src/components/admin/questions/QuestionsTable.tsx` | `GridSkeleton` → `variant="management"` (SK-1/SK-6). |
| `src/components/admin/sub-admins/AdminSubAdminsView.tsx` | `LoadingSkeleton` → `variant="management"` (SK-1/SK-6). |
| `src/components/admin/questions/UploadProgressOverlay.tsx` | `0.4s ease` → `var(--duration-normal) var(--ease-standard)` (LG-3). |
| `src/components/PremiumLoader.tsx` | Internals → `LoadingOverlay` (LG-1). |
| `src/components/Loader.tsx` | Internals → `Spinner lg` (LG-2). |
| `src/components/LoadingScreen.tsx` | Delegate to `LoadingOverlay`; `delay-700` → token (LG-4/LG-5). |

**Out of scope (untouched):** `src/pages/**`, `src/layouts/**`, `src/context/AuthContext.tsx`,
`src/guards/Guards.tsx`, `src/App.tsx`, all theme/token values, `SharedComponents` `EmptyState`
(premium content surface — not a skeleton), `CollectionCard` (already uses the family + `role="status"`).

---

## 3. Design decisions

1. **Neutral premium skeleton** — premium skeleton material becomes `--skeleton-surface` /
   `--skeleton-block` (light `#F1F5F9`/`#E2E8F0`, dark `#374151`/`#4B5563`). The gold
   `stat-card-surface`/`gold-300`/`shadow-premium-*` material is banned from the skeleton language
   (SK-1). The certified gold `StatCard` component surface (D-141) is untouched — only its loading
   placeholder is neutral.
2. **Additive tokens** — `--skeleton-surface`/`--skeleton-block` added to FROZEN `themes.css`
   (dark `:root` + light `.light`), mirroring the D-144 management-token pattern. No existing value
   changes.
3. **Thin wrappers** — `LoadingSkeleton`/`GridSkeleton`/`StatSkeleton` keep their exact call-sites.
   Zero consumer-file churn for skeleton geometry (only the two management-variant additions above).
4. **One overlay** — `LoadingOverlay` owns full-screen (`fixed inset-0 z-[100] bg-app-bg`,
   `transition-interaction duration-very-slow ease-standard`) and inline variants. `LoadingScreen`
   (ambient) and `PremiumLoader`/`Loader` (inline) delegate to it / to `Spinner`.
5. **Spinner color language** — `primary` (accent) + `current` (inherit foreground). The four
   `border-current border-t-transparent` className hacks migrate to `variant="current"`.
6. **Motion honored** — `prefers-reduced-motion` block (`index.css:1114`) neutralizes all loading
   animation; no per-component handling needed. Overlay/ring timing uses DS-018 tokens.

---

## 4. Deliverables

**Root (planning/design):**
- `FOUNDATION_SKELETON_AUDIT.md` (✅ written), `FOUNDATION_LOADING_AUDIT.md` (✅ written)
- `SKELETON_LANGUAGE_SPECIFICATION.md` (✅ APPROVED status), `LOADING_LANGUAGE_SPECIFICATION.md` (✅ written)
- `PHASE_5_4F_IMPLEMENTATION_PLAN.md` (this file)
- `PHASE_5_4F_CERTIFICATION.md` (after implementation)

**docs/design-system (implementation):**
- `PHASE_5_4F_IMPLEMENTATION_REPORT.md`, `PHASE_5_4F_VISUAL_VERIFICATION.md`,
  `PHASE_5_4F_CERTIFICATION.md`

**Governance:**
- `FOUNDATION_GOVERNANCE.md` v1.25.0 → **v1.26.0** (§4 Skeleton & Loading Language Contract,
  §36 changelog)
- `FOUNDATION_FREEZE_REGISTER.md` (DS-019 Skeleton & Loading System row + Phase 5.4F entry)
- `PHASE_3_1_EXECUTION_LOG.md` (Phase 5.4F entry at EOF)
- `docs/design-system/DESIGN_DECISION_LOG.md` (D-171 planning, D-172 implementation)

---

## 5. Verification plan

1. `npx tsc -b --force` → exit 0 (before + after).
2. `npm run build` → exit 0 (pre-existing warnings only).
3. `npx eslint .` → exactly 396 problems (343 E / 53 W) — net −1 vs the 397 baseline, 0 new.
4. Vitest `--config vitest.audit.config.ts` → 301 passed / 33 failed — identical baseline
   (clean-worktree proof at HEAD `453b5d7`).
5. dist CSS grep → `skeleton-surface`, `skeleton-block`, `animate-pulse`, `animate-spin`,
   `--duration-*`, `--ease-standard` present in the built chunk.
6. Source regex scans:
   - `bg-[var(--skeleton-` present in `Skeleton.tsx`; zero `GOLD_SURFACE`/`gold`/`#d4af37`/
     `#2c4c3b`/`#f4ebd8`/`--premium-green` anywhere in `src/components/**` skeleton/loading code.
   - zero `0.4s`/`delay-700` in loading components; zero `border-current border-t-transparent`
     className hacks (all `variant="current"`).
7. Manual dark/light/reduced-motion checks (documented in `PHASE_5_4F_VISUAL_VERIFICATION.md`).

---

## 6. STOP point

Implementation STOPs after verification for user certification of 5.4F. **5.4G (Repository
Migration) does NOT begin without a separate dedicated approval** — and 5.4F itself must be
certified first.
