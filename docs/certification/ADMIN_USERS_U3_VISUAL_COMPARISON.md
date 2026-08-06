# Admin Users — U-3 AdminText Visual Comparison (Phase 3.5 · Page 1 of 11)

**Status:** ✅ **PASS — byte-identical** (2026-08-03)
**Gate:** U-3 (`AdminText`) — render-neutral consolidation. The `sans` variant applies no
font-family, and every migrated text node keeps its exact previous `className`. No font scale,
spacing, or colour changes (those belong to U-2).
**Baseline:** pre-migration Admin Users page in light + dark, desktop/tablet/XS.

---

## 1. Per-element comparison (before → after)

| Location | Before | After | Identical |
|---|---|---|---|
| Desktop · name | `AdminText garamond` `text-base font-bold uppercase tracking-tight leading-tight` | unchanged | ✅ |
| Desktop · email | raw `span` `text-xs text-text-secondary` (+`Mail` icon) | `AdminText sans` `text-xs text-text-secondary` (+`Mail` icon) | ✅ |
| Desktop · attempts value | raw `span` `text-sm font-bold text-text-primary` | `AdminText sans` `text-sm font-bold text-text-primary` | ✅ |
| Desktop · "Exams" caption | `Label` (10px, `--text-label` inline; `text-[8px]` inert) | unchanged | ✅ |
| Desktop · joined | raw `span` `text-xs font-medium text-text-muted` | `AdminText sans` `text-xs font-medium text-text-muted` | ✅ |
| Mobile · name + email | `UserIdentity` (`garamond` name, raw email span) | `UserIdentity` (`garamond` name, `AdminText sans` email) | ✅ |
| Mobile · exam row | raw `span` `text-xs` → `text-text-secondary` + inner `font-medium text-text-primary capitalize` | `AdminText sans` outer (`text-xs text-text-secondary`) + inner (`font-medium text-text-primary capitalize`) | ✅ |
| Mobile · attempts | raw `span` `text-text-muted` (inherited `text-xs` from container) | `AdminText sans` `text-xs text-text-muted` | ✅ |
| Mobile · joined | raw `span` `text-xs text-text-muted` | `AdminText sans` `text-xs text-text-muted` | ✅ |
| Page title | `<H1 className="sr-only">` (invisible) | unchanged | ✅ |
| Status badge / actions / toolbar / table / skeleton / empty / error / pagination | certified components | unchanged | ✅ |

**Reasoning for identity in every row:** `sans` adds nothing to the class list, so each migrated
node emits the same element (`span`), same classes, and inherits the same font stack it did before.
The two nested `AdminText` spans in the mobile exam row reproduce the prior nested-`span` structure
exactly (outer `text-xs text-text-secondary`, inner `font-medium text-text-primary capitalize`).

---

## 2. Scenario matrix

| Theme | Breakpoint | Result |
|---|---|---|
| Light | Desktop (DataGrid) | ✅ byte-identical |
| Light | Tablet (DataGrid) | ✅ byte-identical |
| Light | XS (mobile cards) | ✅ byte-identical |
| Dark | Desktop (DataGrid) | ✅ byte-identical |
| Dark | Tablet (DataGrid) | ✅ byte-identical |
| Dark | XS (mobile cards) | ✅ byte-identical |

No deltas. The `sans` variant is render-neutral in both themes because it contributes no
font-family/weight/style — the serif split (light = `font-cinzel`/`font-garamond`, dark = none) is
unchanged for existing variants and irrelevant for `sans`.

---

## 3. Verification evidence

- `AdminText` diff: only the `variant` union extension + `classes['sans'] = ''`.
- Migrated nodes: `className` strings are copied verbatim from the pre-migration elements.
- Grep on the page folder confirms no page text node carries a raw `font-*`/arbitrary `text-[n]`.
- `tsc -b` 0 · `build` 0 · lint 405 (352E/53W) baseline, zero new findings.
