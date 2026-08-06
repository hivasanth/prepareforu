# Phase 3.6C.3 — Admin Users Action Hardening — Certification

**Status:** ✅ **CERTIFIED** (2026-08-03)
**Governance:** D-137 · **Basis:** `ADMIN_USERS_ACTIONS_AUDIT.md` + 3.6C.3 phase spec
**Scope:** presentation/interaction layer only. Repository, Service authorization, Database, RLS and
SQL migrations are **out of scope** here (they belong to 3.6C.4) — confirmed unchanged.

---

# 1. Approved-items traceability

| ID | Approved item | Delivered |
|---|---|---|
| C-1 | ConfirmModal shows User Name, User Email, Current Status, Intended Action — never generic | ✅ rich `message` block (Label + AdminText values) in `AdminUsers.tsx` |
| C-2 | Consequence copy: deactivate → "…will no longer be able to access until reactivated"; activate → "…will regain access" | ✅ exact copy implemented |
| C-3 | Focus Cancel on open · ESC closes · TAB trapped · focus returned after close | ✅ Cancel focused on open (ConfirmModal effect); ESC/trap/restore already certified in `AdminModal` (verified `AdminModal.tsx:39-64,72-75`) |
| A-1 | Per-row loading only; never block the page | ✅ `loading={togglingId === u.id}` on the affected row only |
| A-2 | Disable Activate/Deactivate/Confirm while running; prevent multiple submissions | ✅ row button `loading` (disabled styling); Confirm `loading` while `busy`; `toggleInFlightRef` re-entry lock |
| H-2 | Lock ConfirmModal while active: close/confirm disabled, cancel optional | ✅ ESC/backdrop close no-op while busy, Confirm disabled/loading, Cancel retained as escape hatch |
| (rule) | Errors via ErrorContainer/Alert, NOT toast (H-1 dropped) | ✅ `actionError` → certified `Alert`; no error toast added |
| (rule) | Success keeps Toast | ✅ `showSuccess` unchanged |

---

# 2. Verification gate

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (pre-existing warnings only) |
| eslint — frozen baseline **405 (352E/53W)**, zero new | ✅ |
| Scope guard — no service/repo/RLS/migration edits in this phase | ✅ all files changed are UI/UX/hook/shared-dialog only (3.6C.4 owns the rest) |
| DS-007 ConfirmModal runtime audit assertions | ✅ unchanged semantics (button counts, text lookup, info mode) |

---

# 3. Behaviour notes

- **Modal stays open while in flight:** the Confirm button shows a spinner; ESC/backdrop cannot close it;
  Cancel remains available. On success the modal closes after toast + refetch; on failure it closes after
  rollback + `Alert`.
- **Same-tick double confirm:** prevented by the synchronous `toggleInFlightRef` lock (the async
  `confirmToggle` guard alone was insufficient — this was H-2).
- **Cancel during flight:** closes the dialog; the operation continues; the affected row's button stays
  disabled until the promise settles and the refetch reconciles (consistent with the pre-existing
  no-timeout tolerance).

---

# 4. Certification statement

All seven approved items (C-1, C-2, C-3, A-1, A-2, H-2 + the 3.6C error/success rule) are delivered
within the presentation/interaction layer. The gate passes at the frozen lint baseline; no out-of-scope
layer was touched.

**Certified:** ✅ 2026-08-03 · **Governance:** D-137
