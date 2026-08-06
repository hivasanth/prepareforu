# AR-022 Completion Report — FilterSelect Listbox Roles

**Date:** 2026-07-22
**Phase:** 6.22
**Status:** PERMANENTLY CLOSED

---

## Summary

Fixed ARIA pattern mismatch in FilterSelect: the popup container used `role="menu"` (inherited from Menu component) but items used `role="option"` — an incorrect combination. Added `role="listbox"` support to Menu.Content and applied it to FilterSelect. Added `aria-label` and `aria-controls` for full screen reader semantics.

## Audit Findings

| Backlog Claim | Verified | Notes |
|---|---|---|
| Missing listbox role | **TRUE** | Menu.Content hardcoded `role="menu"` |
| Missing `aria-expanded` | **FALSE** | Menu.Trigger already had it (line 139) |
| Missing `aria-haspopup` | **FALSE** | Menu.Trigger already had it (line 140) |
| Native `<select>` used | **FALSE** | FilterSelect is a custom dropdown using Menu compound component |

**Verdict:** 1 of 4 claims TRUE. Backlog was partially stale but the core issue was genuine.

## Changes Made

### 1. Menu.tsx — Generic infrastructure (backward-compatible)

| Change | Before | After |
|---|---|---|
| `Menu.Content` role | Hardcoded `role="menu"` | `role` prop, default `"menu"` |
| `Menu.Content` id | Not supported | `id` prop for `aria-controls` linking |
| `Menu.Content` aria-label | Not supported | `aria-label` prop |
| `Menu.Trigger` props | Only `className`, `asChild` | Accepts `aria-label`, `aria-controls`, spreads onto element |

### 2. AntigravityLayout.tsx — FilterSelect

| Change | Before | After |
|---|---|---|
| Popup role | `role="menu"` (inherited) | `role="listbox"` |
| Trigger accessible name | None | `aria-label={label \|\| placeholder \|\| 'Select option'}` |
| Trigger-controls link | None | `aria-controls={listboxId}` |
| Popup id | None | `id={listboxId}` for linking |
| Popup aria-label | None | `aria-label={label \|\| placeholder \|\| 'Options'}` |
| Props interface | No `label` prop | `label?: string` (was in interface but unused) |

### Consumers (5 files, no changes needed)

| File | Usage |
|---|---|
| `AdminUsersView.tsx:174` | Status filter |
| `QuestionsActions.tsx:36` | Difficulty filter |
| `DailyAttemptsChart.tsx:66` | Date range filter |
| `UserTeacherExams.tsx:271` | Month filter |
| `AdminFilterBar.tsx:44` | Month filter |

## ARIA Pattern Compliance

| Attribute | WAI-ARIA Listbox Pattern | FilterSelect (after) |
|---|---|---|
| Container role | `role="listbox"` | ✓ |
| Item role | `role="option"` | ✓ (was already present) |
| Selected state | `aria-selected` | ✓ (was already present) |
| Trigger expanded | `aria-expanded` | ✓ (via Menu.Trigger) |
| Trigger haspopup | `aria-haspopup` | ✓ (via Menu.Trigger) |
| Trigger-controls | `aria-controls` | ✓ (new) |
| Keyboard nav | Arrow Up/Down, Home/End | ✓ (via Menu.Content) |
| Escape closes | Escape key | ✓ (via Menu.Content) |

## Verification

- **TypeScript:** Clean
- **Build:** Succeeds
- **Tests:** 79/79 pass
- **Behavioral changes:** None — visual rendering and interaction identical
- **Backward compatibility:** Full — Menu.Content default role remains "menu"

## Files Modified

1. `src/components/common/Menu.tsx` — Added `role`, `id`, `aria-label` props to Menu.Content; added `aria-label`, `aria-controls` props to Menu.Trigger
2. `src/components/common/AntigravityLayout.tsx` — FilterSelect: added `role="listbox"`, `aria-label`, `aria-controls`, `id` linking
3. `ARCHITECTURE_BACKLOG.md` — AR-022 CLOSED, metrics updated
