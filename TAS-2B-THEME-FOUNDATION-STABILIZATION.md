# TAS-2B — THEME FOUNDATION STABILIZATION (SAFE IMPLEMENTATION) REPORT

**Status:** IMPLEMENTED — single safe edit to `src/index.css`. No visual change introduced.
**Date:** 2026-07-16
**Branch:** phase-3.5
**Build:** ✅ `npm run build` → "✓ built in 51.16s". **Typecheck:** ✅ `npx tsc -b` exit 0. **Lint:** 0 errors in `src/index.css` (pre-existing 492 `.ts/.tsx` errors are unrelated to this phase).

**Principle applied:** Only ownership conflicts whose **computed value is identical** were resolved. All value-conflicting conflicts (state tokens, radius, typography scale) were deliberately left untouched to preserve pixel-identical Dark/Light rendering — per the strict "do not change appearance" rule.

---

## 1. FILES MODIFIED

| File | Change |
|---|---|
| `src/index.css` | Repointed `@theme --color-border-subtle` from `var(--border-color)` (double-hop) to `var(--border-subtle)` (canonical). Added explanatory comment. 1 line changed. |

Only 1 file, 1 logical change. No component, page, primitive, or premium-material file touched.

---

## 2. OWNERSHIP ISSUES RESOLVED

| Issue | Before | After | Computed Value |
|---|---|---|---|
| `@theme --color-border-subtle` double-hop | `var(--border-color)` → `var(--border-default)` | `var(--border-subtle)` (canonical) | `#374151` → `#374151` ✅ unchanged |

**Deferred (value-conflicting — cannot fix without changing appearance):**
| Conflict | Why deferred |
|---|---|
| `@theme --color-secondary/--success/--danger/--warning/--info` → hardcoded `--secondary` etc. | Light Mode currently renders the **dark** hardcoded value (no `.light` override exists for the shorthands). Repointing to canonical Layer-2 would change Light Mode colors. → Page/component migration phase. |
| `@theme --radius-xl/2xl/3xl` (12/16/20px) vs themes.css (20/24/20px) | Changing alters card/container sizing. → Deferred. |
| 4-definition typography scale (`--text-h1..h6`) | The index.css responsive values ARE the applied scale (consumed by global `h1..h6`). Changing alters typography. → Deferred. |
| `paletteColors.ts` + chart wrappers hardcoded hex | Non-theme-aware visuals. → Charts migration phase. |
| ~72 ad-hoc `z-*` usages | No z-index token ladder yet. → Layouts migration phase. |
| ~187 unused primitive tokens | Prune later, not in foundation phase. |

---

## 3. REMAINING COMPATIBILITY ALIASES (intact, not removed)

| Alias | Points To | Kept Because |
|---|---|---|
| `--app-bg`, `--card-bg`, `--elevated-bg`, `--hover-bg` | `--bg-*` canonical | Back-compat for body/components |
| `--border-color` | `--border-default` | Retained (still available; no longer in @theme hop) |
| `--input-border` | `--border-input` | Back-compat |
| `--primary`, `--primary-hover`, `--primary-subtle`, `--primary-rgb` | `--color-accent-*` | Back-compat |
| `--secondary`, `--success`, `--danger`, `--warning`, `--info` | hardcoded hex | Consumed by `@theme`; repoint deferred |
| `--ancient-*` (12 tokens) | `--primary`/`--text-*`/hardcoded | Required compat (Phase 7 removal) |
| `@theme --color-text-placeholder` | `var(--placeholder-color, var(--text-muted))` | Canonical-ish, fine |

---

## 4. THEME EXPORT VERIFICATION (`@theme` block, src/index.css:34-119)

| Export Group | Mapping | Single Owner? | Value OK? |
|---|---|---|---|
| Brand | `--color-primary/--primary-hover` → `--color-accent/--color-accent-hover` | ✅ | ✅ |
| Brand (state) | `--color-secondary/--success/--danger/--warning/--info` → hardcoded shorthands | ⚠️ deferred (R1) | ✅ (unchanged) |
| Background | `--color-app-bg/--card-bg/--elevated-bg/--hover-bg` → `--bg-*` | ✅ | ✅ |
| Text | `--color-text-*` (9) → `--text-*` canonical | ✅ | ✅ |
| Border | `--color-border-subtle` → `--border-subtle` (**fixed this phase**) | ✅ | ✅ `#374151` |
| Radii | `--radius-xl/2xl/3xl` | ⚠️ conflict deferred (R2) | ✅ (unchanged) |
| Shadow | `--shadow-xs..2xl` → canonical | ✅ | ✅ |
| Elevation | `--shadow-elevation-1..7` → canonical | ✅ | ✅ |
| Card/Stat | `--color-card-border`, `--shadow-card-*`, `--color-stat-*` → canonical Layer-3 | ✅ | ✅ |
| Typography utils | `--text-h1..h6/body/caption/label/button` (= XS defaults) | ⚠️ scale dup deferred (R3) | ✅ (unchanged) |
| Sidebar/Stat | `--color-sidebar`, `--color-stat-value` → canonical | ✅ | ✅ |

**Result:** Every export now maps to exactly one canonical token **except** the 3 value-conflicting groups (state/radius/typography), which are intentionally deferred.

---

## 5. PREMIUM MATERIAL VERIFICATION (Group B)

| Token | Owner | Consumers | Duplicate Def? | Conflicting Ownership? |
|---|---|---|---|---|
| `--border-gold` | themes.css:731 (.light) | `.ancient-card/--tab-pill/--input/--otp`, components | No | No |
| `--surface-stat` | themes.css:732 | `stat-card-surface` @utility, StatCard | No | No |
| `--surface-stat-overlay` | themes.css:733 | (reserved) | No | No |
| `--surface-tab-pill` | themes.css:734 | `.ancient-tab-pill`, AntigravityData | No | No |
| `--card-parchment` | themes.css:735 | (reserved) | No | No |
| `--card-3d-shadow` | themes.css:736 | `--card-shadow` (light), `.ancient-card` | No | No |
| `--stat-card-3d-shadow` | themes.css:743 | `--stat-card-shadow` (light) | No | No |
| `--elevation-carved` | themes.css:750 | `--header-shadow`, `.ancient-*`, AntigravityCard/Button | No | No |
| `--table-row-hover-light` | themes.css:755 | (reserved) | No | No |
| `--gradient-header` | themes.css:724 | `.ancient-card-dark`, `.ancient-sidebar`, components | No | No |
| `--gradient-sidebar` | themes.css:725 | `.ancient-sidebar` | No | No |
| `--gradient-surface` | themes.css:723 | `.micro-light`, `.ancient-card` | No | No |
| `--gradient-app` | themes.css:722 | `.light body` | No | No |
| `--header-shadow-md/sm` | themes.css:1015/1020 | `.ancient-tab-track`, `.ancient-icon-badge` | No | No |
| `--surface-primary/-nav/-floating/-overlay` | themes.css:760-769 | `.ancient-*` classes | No | No |

✅ All Premium Material tokens: single owner, no duplicate definitions, no conflicting ownership. **Not redesigned** (per STEP3).

---

## 6. SEMANTIC TOKEN VERIFICATION (Group C)

| Subset | Canonical Owner | Status |
|---|---|---|
| Typography (`--text-*`) | themes.css:407-417 (+ the XS defaults in index.css applied scale) | ✅ single canonical; scale-dup deferred |
| Surface (`--bg-*`, `--surface-*`) | themes.css:392-405, 547-557 | ✅ |
| Border (`--border-*`) | themes.css:419-425 | ✅ (border-subtle hop fixed) |
| Status (`--color-success/--warning/--danger/--info`, `--color-accent*`) | themes.css:427-446 | ✅ canonical; @theme bridge to hardcoded deferred |
| Overlay (`--bg-overlay`, `--surface-overlay`) | themes.css | ✅ |
| Focus (`--focus-ring-*`) | themes.css:478-481 | ✅ |
| Disabled (`--bg-disabled`, `--text-disabled`, `--opacity-disabled`) | themes.css | ✅ |
| Hover (`--bg-hover`, `--border-hover`) | themes.css | ✅ |
| Component (Layer 3: `--card-*`, `--stat-card-*`, `--btn-*`, `--input-*`, `--sidebar-*`, `--header-*`) | themes.css:844-1040 | ✅ |

Old names preserved as aliases (STEP4). No compatibility removed.

---

## 7. RUNTIME OWNERSHIP REPORT

| Token | Runtime Winner (before) | Runtime Winner (after) | Value Change? |
|---|---|---|---|
| `--border-subtle` (via `--color-border-subtle`) | `--border-color`→`--border-default` (`#374151`) | `--border-subtle` (`#374151`) | ❌ none |
| All other tokens | unchanged | unchanged | ❌ none |

Single ownership achieved for the border-subtle path. State/radius/typography paths remain intentionally dual (deferred).

---

## 8. VISUAL REGRESSION REPORT

| Surface | Result |
|---|---|
| Dark Mode | ✅ Identical |
| Light Mode | ✅ Identical (state/radius/type conflicts untouched) |
| Desktop | ✅ Identical |
| Tablet | ✅ Identical |
| Mobile | ✅ Identical |
| Touch | ✅ Identical |
| Hover | ✅ Identical |
| Keyboard | ✅ Identical (focus tokens untouched) |
| Animations | ✅ Identical |

Only 1 token *reference* changed ownership; resolved value byte-identical.

---

## 9. BUILD VERIFICATION

```
npx tsc -b        → exit 0
npm run build     → ✓ built in 51.16s
```
No errors. (Pre-existing chunk-size advisory only, informational.)

---

## 10. TYPESCRIPT VERIFICATION

```
npx tsc -b → exit 0
```
Clean. CSS token change has no TS impact; confirmed no regression.

---

## 11. REMAINING TECHNICAL DEBT

| # | Debt | Severity | Phase |
|---|---|---|---|
| D1 | `@theme --color-secondary/--success/--danger/--warning/--info` still bridge to hardcoded hex; Light Mode renders dark values | HIGH | Component/Page migration (needs `.light` overrides added when repointing) |
| D2 | Radius conflict (`--radius-xl/2xl/3xl`) unresolved | HIGH | Component migration |
| D3 | 4-definition typography scale (`--text-h1..h6`) unresolved | MEDIUM | Component migration |
| D4 | `paletteColors.ts` + chart wrappers hardcoded hex (non-theme-aware) | HIGH | Charts migration |
| D5 | No z-index token ladder; ~72 ad-hoc `z-*` | MEDIUM | Layouts migration |
| D6 | ~187 unused primitive tokens (Group A) | LOW | Later prune |
| D7 | SignupPage references nonexistent `--color-*` var() namespace (silent no-op) | MEDIUM | Page cleanup |

---

## 12. READINESS FOR PAGE-BY-PAGE COMPONENT MIGRATION

| Dimension | Status |
|---|---|
| Theme Foundation (token single-ownership where values allow) | ✅ Stabilized |
| Premium Material tokens | ✅ Verified, single owner, no dupes |
| Semantic tokens | ✅ Canonical, aliases preserved |
| Theme Export layer (`@theme`) | ✅ All exports → single canonical except 3 deferred value-conflicts |
| Build / Typecheck / Lint (css) | ✅ Pass |
| **Overall readiness** | **READY** — foundation is stable; the 3 remaining conflicts are value-sensitive and correctly deferred to component/page migration where Light-Mode overrides can be added safely without visual regression. |

**STOP — awaiting approval before the first page migration.** No reusable components migrated/redesigned, no pages migrated, no aliases removed, no legacy tokens removed, no cleanup performed.
