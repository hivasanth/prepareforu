# Foundation Token Verification — Phase 5.2A

**Phase:** 5.2A (Token Ownership Verification — Review Only)
**Status:** VERIFIED, AWAITING APPROVAL
**Scope:** Every token defined in `src/styles/themes.css` and `src/index.css`. No implementation changes were made.
**Date:** 2026-08-04
**Inputs:** `FOUNDATION_TOKEN_AUDIT.md` (reference audit, dispositions KEEP/MERGE/REMOVE/DEPRECATE/CONFLICT), `FOUNDATION_TOKEN_OWNERSHIP.md` (Phase 3.3A ownership map), live source tree (clean, Phase 5.2 certified).

## 1. Purpose

Independently re-verify every token the Phase 5.2 dead-code cleanup and the reference audit flagged, because that cleanup produced **false positives** (e.g. `--btn-*` count 30 vs actual 38, `forest-500` claimed KEEP but has 0 consumers, AdminText size tokens claimed removable but are live). This document records the verification methodology and the verified classification. It is a review-only artifact: **no token was deleted, renamed, merged, or repointed.**

## 2. Methodology

### 2.1 Source of truth
The live tree after Phase 5.2 certification. Token definitions were extracted from:
- `src/styles/themes.css` (1272 lines) — layered light/dark theme definitions
- `src/index.css` (1158 lines) — `:root` overrides, `@theme` block (~109 registrations, ~1309 derived utilities), `@utility` recipes, and CSS rules

731 unique token definitions were extracted in total.

### 2.2 Two-phase usage scan
1. **Single-scan utility counting** — every utility class name (e.g. `bg-…`, `text-…`, `border-…`) is counted across `src/` TS/TSX files using the boundary regex `(?<![\w-])(…)(?![\w-])`. The `@theme` registration map (token → generated utility name) is derived from the `@theme` block.
2. **CSS reference graph** — every `var(--token)` occurrence in `themes.css`/`index.css` is split into **definition-line refs** (token X's own value referencing token Y) vs **rule-line refs** (real CSS rules / `@utility` recipes referencing token Y).

### 2.3 Transitive liveness fixpoint
A token is **LIVE** if it is consumed by:
- a source file (`var(--token)` in TS/TSX), or
- a CSS rule / `@utility` recipe, or
- another token that is itself LIVE (definition-line ref).

Liveness is propagated to a fixpoint, so dead chains resolve fully (e.g. `--surface-hover` is dead because its only refsByDead consumer `--dropdown-item-hover` is dead; `--shadow-xs` is dead because `--btn-primary-active-shadow`/`--shadow-pressed` are dead). A token is **DEAD** only when no transitive live consumer exists.

### 2.4 Cascade caveat (carried from the reference audit)
`themes.css` is unlayered and therefore beats `@theme` utilities in the cascade; a dead *utility* does not by itself prove a *token* dead, and a live token with only a dead utility consumer is still classified per its true consumers. Verification treats token liveness independently of utility cascade behavior.

### 2.5 Test dependency check
Every token was matched inside `*.test.ts(x)`, `*.spec.ts(x)`, and test-helper files. **Zero DEAD tokens are referenced by any test file** — all SAFE REMOVE candidates are free of test pins.

## 3. Verified classification

| Category | Count | Meaning |
|---|---|---|
| SAFE REMOVE | 418 | No transitive live consumer anywhere in the tree. Ready for deletion under Phase 5.3. |
| FREEZE PROTECTED | 222 | Consumed by a certified frozen Foundation component; deletion/modification requires freeze-register governance. |
| KEEP | 74 | LIVE and in use; canonical, must stay. |
| MERGE | 16 | Near-duplicate tokens with identical or intentionally-colliding values; merge candidates to be resolved by a design decision (FG-5/FG-6 etc.). |
| LEGACY COMPATIBILITY | 1 | `--border-color` — D-121 retained compatibility alias; canonical owner is now `--border-default`. |
| **Total** | **731** | |

LIVE (transitively) **313**; DEAD (transitively) **418**.

## 4. Audit vs verified discrepancy table

These are the corrections Phase 5.2A establishes over the reference audit and the Phase 5.2 cleanup:

| Claim (audit / Phase 5.2) | Verified finding |
|---|---|
| `--btn-*` removable set = 30 | **38** `--btn-*` tokens are dead (audit undercounted by 8). |
| `--forest-500` KEEP (alongside `--forest-900`) | `--forest-500` has **0 consumers**; only `--forest-900` is LIVE (2 src var + 1 css var). |
| AdminText `--text-body/metadata/heading` + sizes removable | LIVE via `AdminText.tsx:7-9` `var(--text-*)` — FREEZE PROTECTED. |
| `--radius-sm/md/lg/full` KEEP (audit §5) | `--radius-sm/lg/full` are **DEAD** (only refs route through dead `radius-tooltip/surface/pill`); `--radius-md` is LIVE via `radius-control → stat-icon-radius`. |
| `--elevation-popover` KEEP (via dropdown-shadow) | **DEAD** — `dropdown-*` namespace is dead. |
| `--shadow-xs` "re-evaluate with --btn-* removal" | **DEAD** — its only refs (`btn-primary-active-shadow`, `shadow-pressed`) are dead. |
| `--surface-hover` "1 hop KEEP" | **DEAD** — sole consumer `dropdown-item-hover` is dead. |
| `--text-small`/`--text-badge` KEEP (canonical scale) | **DEAD** after the Phase 5.2 AdminText prune — no consumers. |
| `--text-h1/h2/h3` canonical | **MERGE** — triple-registered (themes.css:529-533 + index.css:248-250 identical) plus @theme registration; FG-5 collision. |
| `--gold-50` KEEP | **DEAD** (0 consumers); `gold-100/200/400` KEEP, `gold-300` FREEZE PROTECTED. |
| `--shadow-premium-*` separate | **MERGE** — `--shadow-premium-carved` ≡ `--shadow-premium-icon` (index.css:185-186 identical values). |
| `--elevation-carved`/`card-3d-shadow`/`stat-card-3d-shadow` distinct | **MERGE** — near-identical carved recipes (FG-6). |
| `secondary/success/danger/warning/info` legacy aliases | **MERGE** — legacy aliases of `--color-*` canonical tokens. |

## 5. Test-pin verification

- Total tokens referenced in tests: subset of LIVE set only.
- **418 SAFE REMOVE tokens: 0 test references.** No test suite pins a removable token, so deletion cannot break tests.

## 6. Known scan limitations

- Double-prefixed utilities (e.g. `text-text-secondary` from `--color-text-secondary`) are generated by the `@theme` naming convention and are legitimate — the boundary regex plus the registration map handle them correctly.
- `@utility` recipe tokens (e.g. `stat-card-bg` via `stat-card-surface`) are attributed as CSS/rule consumers; the utility class's own source usage is captured via its consumers where the recipe token itself has no `@theme` registration.
- Freeze protection is attributed per **frozen consumer file**; non-frozen composite consumers (ExamPaperCard, WelcomeBanner, SharedComponents, AntigravityResults/Animation/Dashboard) are intentionally excluded from the rigorous frozen list to avoid inflation.

## 7. Gate

Phase 5.2A is review-only. **No token was changed.** Phase 5.3 (implementation) must not begin until this inventory is approved. Full per-token detail lives in `FOUNDATION_TOKEN_CONSUMER_MAP.md`, `FOUNDATION_TOKEN_DELETE_LIST.md`, and `FOUNDATION_TOKEN_KEEP_LIST.md`.