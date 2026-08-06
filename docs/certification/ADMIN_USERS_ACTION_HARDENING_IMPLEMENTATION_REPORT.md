# Phase 3.6C.3 — Admin Users Action Hardening — Implementation Report

**Date:** 2026-08-03 · **Status:** ✅ Implemented (certified in `ADMIN_USERS_ACTION_HARDENING_CERTIFICATION.md`)
**Approved by:** 3.6C.3 phase spec (UI/UX/hook only) · **Governance:** D-137
**Decision basis:** `docs/certification/ADMIN_USERS_ACTIONS_AUDIT.md` findings C-1, C-2, C-3, A-1, A-2, H-2.
**Scope boundary:** presentation/interaction layer only (Button → ConfirmModal → Hook → UI State →
User Feedback). **No** Repository, Service authorization, Database, RLS, or SQL migration changes here —
those belong to 3.6C.4.

---

# 1. What changed

## 1.1 ConfirmModal — shared dialog safety (`SharedComponents.tsx`)

- **C-1 (user identification):** the modal now receives a rich `message` (ReactNode) from the page with
  **User (name + email), Current Status, Intended Action** — never the generic "this user account".
- **C-2 (consequence copy):**
  - Deactivate → "This user will no longer be able to access the platform until reactivated. The
    account can be reactivated at any time."
  - Activate → "This user will regain access to the platform immediately."
- **C-3 (focus on open):** added an effect that lands initial focus on the **Cancel** button when the
  dialog opens (via a stable `useId`-derived button id). Foundation `AdminModal` already provides the
  focus trap (Tab cycles inside), ESC handling, and focus restoration to the trigger on close.
- **A-2 / H-2 (in-flight lock):** new optional `busy?: boolean` prop. While busy the Confirm button
  renders `loading` (spinner + disabled) and `onClose` passed to `AdminModal` is a no-op, so ESC and
  backdrop clicks cannot close the dialog mid-flight. The footer **Cancel** stays available as a
  deliberate escape hatch (the in-flight operation completes; the row button stays disabled and the
  refetch reconciles).
- Message wrapper changed `p` → `div` (the message may now contain block content).

## 1.2 Hook — `useAdminUsers.ts`

- `confirmToggle` now holds the full **`UserRow`** (not `{id, currentStatus}`) so the modal can show
  name/email/status.
- New `togglingId: string | null` + synchronous `toggleInFlightRef` (re-entry lock).
- **H-2 (double-submit):** `handleConfirmToggle` returns early if `toggleInFlightRef.current` is set
  (guards the same-tick double confirm that the old code allowed).
- **Modal stays open while the toggle is in flight** (Confirm shows loading); it closes on success
  (after toast + refetch) or on failure (after rollback + Alert). The optimistic flip still applies at
  confirm time; the failure path removes the optimistic key (rollback) exactly as before.
- Exposed `togglingId` + `isToggling`.

## 1.3 Row — `UsersTable.tsx`

- `onToggleRequest` now passes the full `UserRow`.
- **A-1 (per-row loading only):** the affected row's Activate/Deactivate `Button` renders
  `loading={togglingId === u.id}` — a per-row spinner, never a page-level blocking state. Other rows
  remain interactive.

## 1.4 Page — `AdminUsers.tsx`

- `UsersTable` receives `togglingId` and `onToggleRequest` (full user).
- `ConfirmModal` receives the rich `message`, `busy={h.isToggling}`, and updated labels/`danger`
  derived from `confirmToggle.is_active`.

**Error surfacing (H-1):** per the 3.6C rule, operational failures continue to surface through the
certified `Alert` (page `actionError`) — **no error toast**. Success keeps the certified toast.

---

# 2. Files changed

| File | Kind | Change |
|---|---|---|
| `src/components/common/SharedComponents.tsx` | shared dialog (approved chain) | `busy` lock, focus-Cancel-on-open, `div` message wrapper |
| `src/components/admin/users/useAdminUsers.ts` | hook | `confirmToggle` = `UserRow`, `togglingId`, in-flight ref lock, modal stays open in flight |
| `src/components/admin/users/UsersTable.tsx` | page composition | full-user request, per-row `loading` |
| `src/pages/admin/AdminUsers.tsx` | page composition | rich confirm message, `busy`, updated wiring |

`AdminModal.tsx` (Foundation) and `AntigravityButton.tsx` (Foundation) were **not** modified — ESC/trap/
focus-restore and `loading` were already certified capabilities.

---

# 3. Verification

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ 0 |
| `npm run build` | ✅ (pre-existing chunk-size warning only) |
| eslint — frozen baseline **405**, zero new | ✅ |
| DS-007 runtime-audit suite (ConfirmModal) | ✅ assertions unchanged (button counts, text lookup, info mode) — suite execution remains blocked by pre-existing Vitest `ERR_REQUIRE_ESM` |
