# AR-022 Audit Report — Dropdown & Listbox Accessibility

**Date:** 2026-07-22
**Scope:** Repository-wide dropdown, listbox, combobox, and menu accessibility audit

---

## Dropdown Inventory

| Component | File | Type | Consumers | Accessibility Status |
|---|---|---|---|---|
| FilterSelect | `AntigravityLayout.tsx:193` | Custom listbox (via Menu) | 5 files | **Fixed (AR-022)** |
| Menu | `Menu.tsx:62` | Generic menu/listbox | FilterSelect + others | **Fixed (AR-022)** |
| AntigravityData accordion | `AntigravityData.tsx:83` | Disclosure | 1 file | Already compliant (`aria-controls`) |
| QuestionForm toggle | `QuestionForm.tsx:259` | Disclosure | 1 file | Already compliant (`aria-expanded`, `aria-controls`) |

## Native Elements (Category C — No Changes)

No native `<select>` elements found in the codebase. All dropdowns are custom implementations.

## ARIA Pattern Analysis

### FilterSelect (before fix)

```
<div>                          ← no role
  <button>                     ← Menu.Trigger: aria-expanded ✓, aria-haspopup ✓
    ...
  </button>
  <div role="menu">            ← WRONG: should be listbox for select widget
    <button role="option">     ← correct for listbox, wrong parent
    <button role="option">     ← correct for listbox, wrong parent
  </div>
</div>
```

### FilterSelect (after fix)

```
<div>
  <button aria-expanded aria-haspopup aria-label aria-controls="filter-select-...">  ← fully accessible trigger
    ...
  </button>
  <div id="filter-select-..." role="listbox" aria-label="...">  ← correct ARIA pattern
    <button role="option" aria-selected>  ← correct
    <button role="option" aria-selected>  ← correct
  </div>
</div>
```

## Keyboard Navigation (Verified)

| Key | Menu.Content Support | Notes |
|---|---|---|
| Arrow Down | ✓ | Moves to next item, wraps |
| Arrow Up | ✓ | Moves to previous item, wraps |
| Home | ✓ | Moves to first item |
| End | ✓ | Moves to last item |
| Escape | ✓ | Closes popup |
| Enter/Space | ✓ | Activates focused item (via onClick) |
| Tab | ✓ | Standard browser focus traversal |

## Focus Management (Verified)

- Trigger receives focus on Tab
- Popup opens on click or ArrowDown
- First item receives focus when popup opens (via keyboard)
- Escape returns focus to trigger
- Outside click closes popup

## Dead Code Audit

| Finding | Status |
|---|---|
| Duplicate dropdown components | None found |
| Duplicate keyboard handlers | None — all via Menu.Content |
| Duplicate accessibility helpers | None |
| Unused listbox utilities | None |

## Architecture Verification

| Check | Status |
|---|---|
| Single ownership of dropdown behavior | ✓ Menu.tsx |
| Single ownership of keyboard handling | ✓ Menu.Content |
| Single ownership of focus management | ✓ Menu.Content |
| No circular dependencies | ✓ |
| No duplicated accessibility logic | ✓ |

## Metrics

| Metric | Before | After |
|---|---|---|
| Components audited | 4 | 4 |
| Dropdowns found | 2 (FilterSelect, Menu) | 2 |
| Accessibility issues | 3 (role mismatch, missing aria-label, missing aria-controls) | 0 |
| Components modified | 0 | 2 (Menu.tsx, AntigravityLayout.tsx) |
| ARIA attributes added | 0 | 5 (role=listbox, aria-label×2, aria-controls, id) |
| Keyboard improvements | 0 | 0 (already compliant) |
| Focus improvements | 0 | 0 (already compliant) |
| Files modified | 0 | 3 (incl. ARCHITECTURE_BACKLOG.md) |
| Files created | 0 | 1 (this report) |
| Files deleted | 0 | 0 |
