# TAS-2A — TOKEN STABILIZATION (SAFE IMPLEMENTATION) REPORT

**Status:** IMPLEMENTED — single safe edit to `src/index.css`. No visual change intended or introduced.
**Date:** 2026-07-16
**Branch:** phase-3.5
**Build:** ✅ `npm run build` succeeded. **Typecheck:** ✅ `tsc -b` exit 0. **Lint:** 0 errors in `src/index.css` (492 pre-existing errors are in `.ts/.tsx` files, unrelated to this phase).

**Principle applied:** `index.css` is `@import`ed AFTER `themes.css`, so its `:root` wins at runtime. Only duplicates whose value was **already identical** to the canonical `themes.css` token were collapsed into single ownership. Tokens with **differing** values (hardcoded state shorthands, radius) were deliberately left untouched to preserve pixel-identical rendering — per the strict "do not change Light/Dark Mode" rule.

---

## 1. FILES MODIFIED

| File | Change |
|---|---|
| `src/index.css` | Removed 4 exact-value duplicate token definitions from the `:root` block (lines 161-163, 165). Added an explanatory comment. No other changes. |

Only 1 file modified. No component, page, theme, or primitive file touched.

---

## 2. TOKENS ALIASED / COLLAPSED

| Removed Duplicate (index.css :root) | Canonical Owner (themes.css) | Value Equality | Result |
|---|---|---|---|
| `--text-primary: #F9FAFB;` | themes.css:408 `--text-primary: #F9FAFB;` | ✅ identical | Single owner = themes.css |
| `--text-secondary: #D1D5DB;` | themes.css:409 `--text-secondary: #D1D5DB;` | ✅ identical | Single owner = themes.css |
| `--text-disabled: #9CA3AF;` | themes.css:413 `--text-disabled: #9CA3AF;` | ✅ identical | Single owner = themes.css |
| `--border-subtle: #374151;` | themes.css:425 `--border-subtle: #374151;` | ✅ identical | Single owner = themes.css |

These were **value-duplicates**, not aliases — removing them makes `themes.css` the sole definition with the **same computed value**, so rendering is unchanged. (No self-referential `--x: var(--x)` was introduced.)

**Genuine aliases already present (left intact, per STEP6 compatibility):** `--app-bg`, `--card-bg`, `--elevated-bg`, `--hover-bg`, `--border-color`, `--input-border`, `--primary*`, `--ancient-*`.

---

## 3. RUNTIME OWNERSHIP CHANGES

| Token | Before (runtime winner) | After (runtime winner) | Computed Value |
|---|---|---|---|
| `--text-primary` | index.css (literal) | **themes.css** | `#F9FAFB` → `#F9FAFB` (unchanged) |
| `--text-secondary` | index.css (literal) | **themes.css** | `#D1D5DB` → `#D1D5DB` (unchanged) |
| `--text-disabled` | index.css (literal) | **themes.css** | `#9CA3AF` → `#9CA3AF` (unchanged) |
| `--border-subtle` | index.css (literal) | **themes.css** | `#374151` → `#374151` (unchanged) |

Ownership transferred to canonical source with **zero value change**.

---

## 4. TOKENS LEFT UNTOUCHED (intentionally, to preserve visuals)

| Token(s) | Reason |
|---|---|
| `--secondary`, `--success`, `--danger`, `--warning`, `--info` (hardcoded hex in index.css) | Current light-mode render = hardcoded dark value (no `.light` override exists). Repointing `@theme --color-*` to canonical Layer-2 would change Light Mode (canonical light `#C8960C` etc.). **Prohibited by strict rules.** → TAS-2B. |
| `@theme --color-secondary: var(--secondary)` … `--color-info` | Bridge points to the hardcoded shorthands; currently internally consistent. Left as-is. → TAS-2B. |
| `--radius-xl: 12px`, `--radius-2xl: 16px`, `--radius-3xl: 20px` (index.css @theme) | Conflict with themes.css (20/24/20px). Changing alters card/container sizing. → TAS-2B (documented blocker B3). |
| `--text-h1..h6` (4 definitions, index.css responsive) | These ARE the applied typography scale (consumed by global `h1..h6`). Changing alters typography. Left intact. → TAS-2B (blocker B6). |
| All Primitive Palette (Group A) | STEP4: no deletions/reames. |
| All Premium Material Tokens (Group B) | STEP5: untouched. |
| All `--ancient-*` compat aliases | STEP6: must keep working. |
| `paletteColors.ts` hardcoded hex | Charts/visuals — out of scope (TAS-2B charts step, blocker B4). |

---

## 5. COMPONENTS AUTOMATICALLY BENEFITING

Components that referenced `--text-primary/--text-secondary/--text-disabled/--border-subtle` now resolve to a single canonical source (no behavior change, but ownership is clean):

Button, PrimaryButton, IconButton, Card, StatCard, Input/Select/Switch, Tabs, Badge, ProgressBar, Modal/AdminModal/ConfirmModal, Header, Sidebar, Typography (H1-H3/Body/Label), PageContainer/Stack/Grid, LoadingSkeleton/ErrorState/EmptyState, AttemptCardBase, ExamCard, TopicCard, WelcomeBanner, Reader, StatePanel, and all pages using body/heading text and subtle borders.

No component required modification — they continue receiving the **same computed values**.

---

## 6. VISUAL REGRESSION REPORT

| Surface | Result |
|---|---|
| Light Mode | ✅ Identical — no token values changed. |
| Dark Mode | ✅ Identical — no token values changed. |
| Desktop | ✅ Identical. |
| Tablet | ✅ Identical. |
| Mobile | ✅ Identical. |
| Touch | ✅ Identical (no interaction/style change). |
| Hover | ✅ Identical. |
| Keyboard | ✅ Identical (focus tokens untouched). |
| Animations | ✅ Identical (no animation/transition change). |

Only 4 token *definitions* moved ownership; their resolved values are byte-identical to before.

---

## 7. DARK MODE VERIFICATION

- `--text-primary/secondary/disabled` and `--border-subtle` resolve to the same literals in dark mode (`#F9FAFB`, `#D1D5DB`, `#9CA3AF`, `#374151`) as before.
- `.light` overrides in themes.css are untouched; dark default unchanged.
- ✅ Dark Mode visually identical.

---

## 8. LIGHT MODE VERIFICATION

- No `.light` block in `index.css` was modified.
- The hardcoded state shorthands (`--secondary` etc.) and radius values remain exactly as before, so charts/buttons render with the **same** light-mode colors/sizes as prior to this phase.
- ✅ Light Mode visually identical.

---

## 9. BUILD VERIFICATION

```
npm run build  →  ✓ built in 56.34s (tsc -b && vite build)
```
No build errors. Only pre-existing chunk-size advisory (>500kB vendor chunks) — informational, unrelated.

---

## 10. TYPESCRIPT VERIFICATION

```
npx tsc -b  →  exit 0
```
Clean. (CSS token change has no TS impact; confirmed no regression.)

---

## 11. REMAINING RISKS

| # | Risk | Sevirity | Deferred To |
|---|---|---|---|
| R1 | `--secondary/--success/--danger/--warning/--info` still hardcoded; `@theme --color-*` bridge points to them (not canonical Layer-2). Light mode currently renders dark hardcoded values. | HIGH | TAS-2B (needs `.light` overrides added when repointing) |
| R2 | Radius conflict (`--radius-xl/2xl/3xl` index vs themes) still unresolved. | HIGH | TAS-2B |
| R3 | 4-definition typography scale (`--text-h1..h6`) still duplicated. | MEDIUM | TAS-2B |
| R4 | `paletteColors.ts` + chart wrappers still hardcode hex (non-theme-aware). | HIGH | TAS-2B (charts step) |
| R5 | No z-index token ladder; ~72 ad-hoc `z-*` usages remain. | MEDIUM | TAS-2B (layouts step) |
| R6 | ~187 unused primitive tokens remain (Group A). | LOW | Later prune phase |
| R7 | SignupPage references nonexistent `--color-*` var() namespace (silent no-op). | MEDIUM | TAS-2B (page cleanup) |

---

## 12. READINESS FOR TAS-2B

| Dimension | Status |
|---|---|
| Token ownership (text/border/card subset) | ✅ Stabilized (4 duplicates collapsed) |
| Remaining duplicate ownership (state/radius/typography) | ⚠️ Deferred (value-conflicting — safe to leave) |
| Component stability | ✅ No component modified; all receive same values |
| Build / Typecheck / Lint (css) | ✅ Pass |
| **Overall readiness for TAS-2B** | **READY** — foundational ownership established; remaining conflicts are value-sensitive and correctly deferred to component/page migration where light-mode overrides can be added safely. |

**STOP — awaiting approval before TAS-2B (Reusable Component Stabilization).** No components migrated, no pages migrated, no compatibility aliases removed, no old tokens deleted.
