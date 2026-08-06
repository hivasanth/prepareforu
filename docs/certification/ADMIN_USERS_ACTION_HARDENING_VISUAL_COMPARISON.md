# Phase 3.6C.3 — Admin Users Action Hardening — Visual Comparison

**Date:** 2026-08-03 · **Status:** ✅ Verified

---

# Before (3.6C.2 state)

```
  ┌────────────────────────────────────────────────────────────┐
  │  Deactivate User                                          │
  │  Are you sure you want to deactivate this user account?   │
  │                                            [Cancel][Deact]│
  └────────────────────────────────────────────────────────────┘
```
- No name / email / status — the admin cannot verify the target (C-1).
- No consequence copy (C-2).
- Nothing focused on open; focus rests on the dialog shell (C-3).
- Row button never shows in-flight state; confirm can double-fire same-tick (A-1/A-2/H-2).

---

# After (3.6C.3)

```
  ┌────────────────────────────────────────────────────────────┐
  │  Deactivate User                                          │
  │  USER             CURRENT STATUS    ACTION                │
  │  Akhila Rao       Active           Deactivate             │
  │  akhila@example.com                                        │
  │  This user will no longer be able to access the platform  │
  │  until reactivated. The account can be reactivated at     │
  │  any time.                                                │
  │                                       [Cancel] [Deact ⏳] │
  └────────────────────────────────────────────────────────────┘
```

- **C-1:** name + email + current status + intended action (labelled, certified primitives).
- **C-2:** explicit consequence line.
- **C-3:** Cancel is focused on open (dashed ring indicator on Cancel); Tab is trapped; ESC closes;
  focus returns to the row Deactivate button on close.
- **A-2/H-2 (in flight):** Confirm shows a spinner + disabled; ESC/backdrop do not close the dialog.

Row (behind / after close), while the toggle is in flight:

```
  ┌────────────────────────────────────────────────────────────┐
  │ [AV] Akhila Rao           EXAM   ATTEMPTS   JOINED        │
  │                           APPSC   0          07 Jul 2026  │
  │                                                   [Active]│
  │   [⏳ Deactivate]     ← per-row spinner (A-1), only this row │
  └────────────────────────────────────────────────────────────┘
```

- Only the affected row's button shows loading/disabled (A-1); other rows stay interactive.

---

# Rendering notes

- All new dialog content uses certified primitives (`Label`, `AdminText`, `Button` `loading`) and
  structural spacing (`flex flex-col gap-1/gap-3`) — zero page-owned visuals.
- No Foundation component was modified for this phase (`AdminModal`, `AntigravityButton` already
  provided trap/ESC/restore and `loading`).
