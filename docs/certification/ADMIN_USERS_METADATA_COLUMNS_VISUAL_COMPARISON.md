# Phase 3.6C.2 — Admin Users Structured Metadata — Visual Comparison

**Date:** 2026-08-03 · **Status:** ✅ Verified

---

# Before (3.6C.1 state)

Inline token row — values wrap and never align across rows; no labels; mixed badge + running text:

```
┌──────────────────────────────────────────────────────────────────┐
│ [AV] Akhila Rao                                                 │
│                                                                  │
│   [APPSC]   0 Attempts   Joined 07 Jul 2026                     │
│                                                                  │
│   [Deactivate]                           [Active]               │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│ [AV] Bhanu Prakash                                              │
│                                                                  │
│   [BANK_EXAMS]   2 Attempts   Joined 01 Mar 2026                │
│                                                                  │
│   [Deactivate]                           [Active]               │
└──────────────────────────────────────────────────────────────────┘
```

Wider badges/values push the tokens out of column alignment; on narrow widths the `flex-wrap` reflows
each row differently (M-2/M-3/M-5).

---

# After (3.6C.2)

Labelled 3-column structure, identical on every row, aligned at all breakpoints:

```
┌──────────────────────────────────────────────────────────────────┐
│ [AV] Akhila Rao                                                 │
│                                                                  │
│   EXAM          ATTEMPTS    JOINED                              │
│   [APPSC]       0           07 Jul 2026                         │
│                                                                  │
│   [Deactivate]                           [Active]               │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│ [AV] Bhanu Prakash                                              │
│                                                                  │
│   EXAM          ATTEMPTS    JOINED                              │
│   [BANK EXAMS]  2           01 Mar 2026                         │
│                                                                  │
│   [Deactivate]                           [Active]               │
└──────────────────────────────────────────────────────────────────┘
```

- Labels (`EXAM`/`ATTEMPTS`/`JOINED`) are certified micro-uppercase.
- Three equal-width columns (`flex-1`) line up across every row.
- Long values `truncate`; the row never grows.
- No visual classes — structural spacing only (`flex gap-6`, `gap-2`, `flex-1`, `min-w-0`, `truncate`).
