# Phase 5.3B - Token Consolidation: Dead Button Namespace Implementation Report

- **Phase:** 5.3B - Token Consolidation batch B (dead `--btn-*` Button namespace + dead `--button-border-secondary-width`)
- **Type:** Deletion-only of dead CSS custom-property definitions. Zero runtime, visual, Foundation, token-value, or page behavior changes.
- **Status:** Complete (verification pending certification)
- **Date:** 2026-08-04
- **Companion docs:** FOUNDATION_TOKEN_VERIFICATION.md, FOUNDATION_TOKEN_CONSUMER_MAP.md, FOUNDATION_TOKEN_DELETE_LIST.md, FOUNDATION_TOKEN_KEEP_LIST.md (Phase 5.2A verified inventory - authoritative), PHASE_5_3A_IMPLEMENTATION_REPORT.md / PHASE_5_3A_CERTIFICATION.md (prior batch), FOUNDATION_FREEZE_REGISTER.md, PHASE_3_1_EXECUTION_LOG.md, DESIGN_DECISION_LOG.md (D-152, D-153)
- **Approval:** Phase 5.3B implementation approval granted by the user (complete Button namespace inventory presented; 39 SAFE REMOVE tokens authorized).

---

## 1. Scope and Constraints

Phase 5.3B executed **only** the approved SAFE REMOVE Button-namespace items from the Phase 5.2A verified inventory:

- **`--btn-*` (38 tokens)** — dead compatibility aliases, groups: primary (9), secondary (7), success (6), danger (6), ghost (5), outline (5). All `reason=no-refs`.
- **`--button-border-secondary-width` (1 token)** — dead width alias, `reason=no-refs` (doc refs only).

**Total: 39 unique tokens, 41 definition lines removed** (`btn-primary-active-shadow` and `button-border-secondary-width` are each defined in both the dark and light theme blocks).

### Explicitly protected (NOT touched — frozen)

- `--button-*` certified Control namespace (11 tokens: `button-surface-secondary`, `button-text-secondary`, `button-border-secondary`, `button-shadow-secondary`, `button-shadow-secondary-hover`, `button-surface-ghost`, `button-surface-ghost-hover`, `button-text-ghost`, `button-text-ghost-hover`, `button-border-ghost`, `button-surface-secondary-hover`)
- `--material-button-*` (4 tokens, consumed by `AntigravityButton.tsx`)
- `@theme` button registrations (`--color-button-*` x9, `--shadow-button-*` x2 at index.css:119-129)
- AntigravityButton, Control namespace, Management namespace, Premium namespace

### Batch rules honored

- **No mixing:** this batch contains only SAFE REMOVE tokens. No MERGE (5.3D), no CONFLICT, no FREEZE PROTECTED, no KEEP.
- **Independently verifiable:** full gate battery run after the edit (Section 7).
- **Zero deleted live tokens:** all 313 LIVE tokens re-verified present after the edit.
- **Zero deleted freeze-protected tokens:** all 222 FREEZE PROTECTED present (incl. all 15 button-family FREEZE PROTECTED).
- **Every deletion traceable to the verified inventory:** each removed token has a row in `FOUNDATION_TOKEN_DELETE_LIST.md` with category SAFE REMOVE and reason `no-refs`.

---

## 2. Files Modified

| File | Lines before | Lines after | Delta |
|------|-------------:|------------:|------:|
| `src/styles/themes.css` | 1038 | 997 | **-41** (all 39 tokens' definition lines, dark + light blocks) |
| `src/index.css` | 1147 | 1147 | 0 (untouched — 0 definition lines in 5.3B set) |

No other file modified. CRLF preserved (byte-faithful content-match removal).

## 3. Removed Tokens (39)

### `--btn-*` — 38 dead compatibility aliases (all `no-refs`)

- **primary (9):** `btn-primary-bg`, `btn-primary-text`, `btn-primary-border`, `btn-primary-shadow`, `btn-primary-hover-bg`, `btn-primary-hover-shadow`, `btn-primary-active-shadow` (dark:893 + light:986), `btn-primary-disabled-bg`, `btn-primary-disabled-text`
- **secondary (7):** `btn-secondary-bg`, `btn-secondary-text`, `btn-secondary-border`, `btn-secondary-shadow`, `btn-secondary-hover-bg`, `btn-secondary-hover-border`, `btn-secondary-active-bg`
- **success (6):** `btn-success-bg`, `btn-success-text`, `btn-success-border`, `btn-success-shadow`, `btn-success-hover-bg`, `btn-success-hover-shadow`
- **danger (6):** `btn-danger-bg`, `btn-danger-text`, `btn-danger-border`, `btn-danger-shadow`, `btn-danger-hover-bg`, `btn-danger-hover-shadow`
- **ghost (5):** `btn-ghost-bg`, `btn-ghost-text`, `btn-ghost-border`, `btn-ghost-hover-bg`, `btn-ghost-active-bg`
- **outline (5):** `btn-outline-bg`, `btn-outline-text`, `btn-outline-border`, `btn-outline-hover-bg`, `btn-outline-hover-border`

### Dead alias (1)

- `button-border-secondary-width` (dark:696 + light:999)

## 4. Consumer Counts (verified, CSV)

All 39 tokens: **0 src / 0 util / 0 css / 0 rule / 0 test**. Doc mentions only (not consumers): `btn-primary-active-shadow` (1), `btn-secondary-bg` (1), `btn-secondary-hover-bg` (1), `button-border-secondary-width` (5).

- 0 runtime consumers, 0 CSS consumers, 0 Tailwind utilities, 0 test consumers.

## 5. Cross-Batch Hazard Analysis

Performed before edit. **Result: NONE.** No non-5.3B definition references any 5.3B token (unlike 5.3A's `elevation-popover` case). The 5.3B tokens reference only LIVE tokens (`--color-accent`, `--text-on-accent`, `--shadow-sm`, etc.), so removal creates zero dangling `var()` references.

## 6. Cleanup Dashboard (permanent technical-debt burn-down chart)

| Metric | Before | After |
|--------|-------:|------:|
| Repository Tokens | 511 | **472** |
| SAFE REMOVE Remaining | 198 | **159** |
| FREEZE PROTECTED | 222 | 222 |
| LIVE Tokens | 313 | 313 |
| MERGE Pending | 16 | 16 |

This dashboard is appended to this report after every cleanup phase and becomes the permanent technical-debt burn-down chart.

## 7. Verification (Gate Battery)

| Gate | Result |
|------|--------|
| `tsc -b` (via `npm run build`) | PASS |
| `npm run build` (vite) | PASS (37.76s; only pre-existing chunk-size + CSS warnings, unchanged) |
| `npm run lint` | 397 problems (344 errors + 53 warnings) = exact pre-existing baseline, 0 introduced |
| audit suite (`vitest.audit.config.ts`) | 33 failed / 301 passed = exact pre-existing baseline (ds003 21, ds005 10, ds014 2; ds007 smoke 18/18) |
| Repository token scan | PASS (0 source refs to `--btn-*` / `button-border-secondary-width` in src) |
| Consumer scan | PASS (313 LIVE consumers intact) |
| Dangling var() scan | PASS (0 dangling refs introduced; only pre-existing comment-text mentions and the pre-existing undocumented `--fw-h*`/`--lh-h*` refs at index.css:500-505, both predating 5.3B) |

## 8. Notes

- **`--fw-h1..6` / `--lh-h1..6` pre-existing observation (NOT introduced by 5.3B):** the `h1-h6` rules at index.css:500-505 reference `var(--fw-h*)`/`var(--lh-h*)`, which are defined nowhere in the repo — including at HEAD (Initial commit). These tokens are absent from the Phase 5.2A verified inventory (never defined). This is pre-existing technical debt outside Phase 5.3B scope; it predates 5.3A/5.3B and requires its own decision.

## 9. Conclusion

Zero runtime regressions, zero visual regressions, zero deleted live tokens, zero deleted freeze-protected tokens, zero dangling variables. All 39 removals traceable to the approved inventory. Batch 5.3B independently verifiable and ready for certification.
