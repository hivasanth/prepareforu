# AR-023 Completion Report — Input/Select ARIA Forwarding

**Date:** 2026-07-22
**Phase:** 6.23
**Status:** PERMANENTLY CLOSED

---

## Summary

Repository-wide audit of Foundation input component accessibility. `Input` and `TextArea` were already fully compliant (using `...props` spread). `Select` had a genuine ARIA gap: no native HTML attribute forwarding, no label association. Fixed by extending `React.SelectHTMLAttributes` and adding `id`/`htmlFor` linkage.

## Audit Findings

| Backlog Claim | Verified | Notes |
|---|---|---|
| Input does not forward aria-label | **FALSE** | Input uses `...props` spread (line 40) — all native attrs forwarded |
| TextArea does not forward aria-label | **FALSE** | TextArea uses `...props` spread (line 80) — all native attrs forwarded |
| Select does not forward aria-label | **TRUE** | Select had no `...props` spread, no native attr forwarding |

**Verdict:** 1 of 3 claims TRUE. Backlog was partially stale — Input and TextArea were already compliant.

## Changes Made

### Select Component (`AntigravityForm.tsx:90-155`)

| Attribute | Before | After |
|---|---|---|
| Interface | Custom `SelectProps` (5 own props) | Extends `React.SelectHTMLAttributes<HTMLSelectElement>` |
| Props forwarding | None — only destructured props | `...props` spread onto `<select>` |
| `id` | Not rendered | Auto-generated from `label` prop, or accepts explicit `id` |
| `htmlFor` on `<label>` | Not present | `htmlFor={selectId}` — programmatic association |
| `aria-label` forwarding | Not possible | Now forwarded via `...props` |
| `aria-labelledby` forwarding | Not possible | Now forwarded via `...props` |
| `aria-describedby` forwarding | Not possible | Now forwarded via `...props` |
| `name` forwarding | Not possible | Now forwarded via `...props` |
| `required` forwarding | Not possible | Now forwarded via `...props` |
| `className` on `<select>` | Merged | Removed from `<select>` (kept on wrapper div) |

### No Changes Needed

- **Input:** Already uses `...props` spread — all native attrs forwarded
- **TextArea:** Already uses `...props` spread — all native attrs forwarded

## Consumer Impact

| Consumer | File | Change Needed |
|---|---|---|
| FilterSelect (AntigravityLayout) | Uses Menu, not Foundation Select | None |
| AdminSettings | Uses Foundation Input | None |
| DailyAttemptsChart | Uses FilterSelect (Menu-based) | None |
| All other Select consumers | 5 files total | None — backward compatible |

## Verification

- **TypeScript:** Clean
- **Build:** Succeeds
- **Tests:** 79/79 pass
- **Behavioral changes:** None — visual rendering identical
- **Backward compatibility:** Full — new props are optional, defaults preserve existing behavior

## Files Modified

1. `src/components/common/AntigravityForm.tsx` — Select: extended native HTML attrs, added `...props` spread, `id`/`htmlFor` label association
2. `ARCHITECTURE_BACKLOG.md` — AR-023 CLOSED, metrics updated
