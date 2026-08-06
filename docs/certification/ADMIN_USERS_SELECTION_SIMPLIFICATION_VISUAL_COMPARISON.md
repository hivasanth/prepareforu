# Phase 3.6C.1 — Admin Users Selection Simplification — Visual Comparison

**Date:** 2026-08-03 · **Status:** ✅ Verified

---

# Before (3.6B)

```
┌──────────────────────────────────────────────────────────────┐
│ ☑ Select all on this page            Showing 1–20 of 128      │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [☑] [AV] Akhila Rao                 [APPSC] [0 Att] ...  │ │
│ │                                                           │ │
│ │   [Deactivate]   [Active]                                 │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [☑] [AV] Bhanu Prakash              [BANK] [2 Att] ...   │ │
│ │                                                           │ │
│ │   [Deactivate]   [Active]                                 │ │
│ └──────────────────────────────────────────────────────────┘ │
│ (… 18 more rows, each with a per-row checkbox)               │
└──────────────────────────────────────────────────────────────┘
```

Every row carried a `SelectionCheckbox`; the header carried a select-all checkbox that fed
`selectedIds` — which was consumed by **nothing** (no bulk action exists for users).

---

# After (3.6C.1)

```
┌──────────────────────────────────────────────────────────────┐
│                                           Showing 1–20 of 128 │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [AV] Akhila Rao                  [APPSC] [0 Att] ...     │ │
│ │                                                           │ │
│ │   [Deactivate]   [Active]                                 │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [AV] Bhanu Prakash               [BANK] [2 Att] ...      │ │
│ │                                                           │ │
│ │   [Deactivate]   [Active]                                 │ │
│ └──────────────────────────────────────────────────────────┘ │
│ (… 18 more rows, no checkboxes)                              │
└──────────────────────────────────────────────────────────────┘
```

The header shows the range summary only (right-aligned, no empty slot for a removed checkbox). Rows are
identical to before minus the per-row checkbox.

---

# Questions (unchanged, for contrast)

```
┌──────────────────────────────────────────────────────────────┐
│ ☑ Select all on this page            Showing 1–20 of 1,412   │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [☑] 3 + 5 = ?                  [APPSC] [Group 1] ...     │ │
│ │      [Delete]  [Edit]                                    │ │
│ └──────────────────────────────────────────────────────────┘ │
```

Questions keeps its select-all + per-row checkboxes because `bulkDeleteQuestions` is a real bulk
operation.

---

# Rendering notes

- **No new visual classes** were introduced on either path; the range-only header reuses the existing
  `flex items-center justify-between gap-3 px-1` container and the certified range text.
- The conditional `SelectionCheckbox` mounts/unmounts cleanly (no layout jump — the checkbox had fixed
  geometry, and the range stays right-aligned in both forms).
