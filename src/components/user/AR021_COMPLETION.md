# AR-021 Completion Report — CarouselDots ARIA

**Date:** 2026-07-22
**Phase:** 6.21
**Status:** PERMANENTLY CLOSED

---

## Summary

Added WAI-ARIA tablist semantics to the CarouselDots component for screen reader accessibility. The component serves as carousel navigation dots (interactive, not decorative), making tablist the correct ARIA pattern.

## Audit Findings

| Backlog Claim | Verified | Notes |
|---|---|---|
| Container lacks `role="tablist"` | **TRUE** | Container was a plain `<div>` |
| Dots lack `role="tab"` | **TRUE** | Dots were plain `<button>` elements |
| Active dot lacks `aria-selected` | **TRUE** | No selected state communicated |
| Dots lack `aria-label` | **FALSE** | Already had `aria-label="Go to slide N"` ✓ |

**Verdict:** 3 of 4 claims TRUE. Backlog was accurate (not stale).

## Changes Made

**File:** `src/components/user/CarouselDots.tsx` (35 lines)

| Attribute | Before | After |
|---|---|---|
| Container | `<div>` | `<div role="tablist" aria-label="Carousel navigation">` |
| Each button | `<button>` | `<button role="tab" aria-selected={isActive}>` |
| aria-label | `aria-label="Go to slide N"` | Unchanged (already present) |

## Verification

- **TypeScript:** Clean
- **Build:** Succeeds
- **Tests:** 79/79 pass
- **Behavioral changes:** None — visual rendering identical
- **Consumer:** 1 file (`UserExams.tsx:212`) — no changes needed

## Files Modified

1. `src/components/user/CarouselDots.tsx` — added `role="tablist"`, `role="tab"`, `aria-selected`
2. `ARCHITECTURE_BACKLOG.md` — AR-021 CLOSED, metrics updated
