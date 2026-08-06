# Phase 3.6C.4 — Admin Users Status Security — Visual Comparison

**Date:** 2026-08-03 · **Status:** ✅ Verified (behavioural; no visible layout change)

This phase changes **behaviour and data integrity**, not the visual surface. The diagram below
documents the new enforcement at each layer for the toggle flow.

---

# Toggle flow (post-3.6C.4)

```
Admin clicks Deactivate
  → ConfirmModal (name/email/status/action + consequence copy)   [3.6C.3]
  → handleConfirmToggle → optimistic flip, modal locked in flight [3.6C.3]
  → toggleUserStatus(ctx, targetUserId, isActive)
       → ensureRole(['admin'])                      ⛔ throws UNAUTHORIZED_ACCESS if not admin
       → self-target check  (user.id === target)    ⛔ ACTION_FORBIDDEN
       → findUserById(target)
            → not found                             ⛔ USER_NOT_FOUND
            → target.role !== 'user'                ⛔ ACTION_FORBIDDEN   (SEC-1)
       → updateUser(id, { is_active })
            → UPDATE users SET is_active = … WHERE id = …
            → RLS rls_users_admin_all  (is_admin())  ✅ allowed
            → affected rows returned
                 → 0 rows                            ⛔ UPDATE_FAILED      (R-1)
       → logInfo success (requestId + target)       ✅                   (S-2)
  → success → toast + refetch (row reconciles)
```

---

# The four attack scenarios (post)

| Attempt | Layer that blocks | Result visible to caller |
|---|---|---|
| Banned user runs `UPDATE users SET is_active=true WHERE id=self` | RLS `rls_users_self_update` `WITH CHECK` (`is_active` must be unchanged) **+** `prevent_user_role_escalation` trigger | ⛔ row not changed (RLS rejects / trigger reverts) |
| Admin toggles **themselves** via API | Service S-1 self-target | ⛔ `ACTION_FORBIDDEN`, warn log |
| Admin toggles **another admin / sub-admin** via API | Service S-1 `role !== 'user'` | ⛔ `ACTION_FORBIDDEN`, warn log |
| Admin (or direct SQL) deactivates the **last active admin** | `trg_prevent_last_admin_deactivation` | ⛔ `is_active` reverted (no lockout) |

**No visual change:** the page renders identically to the 3.6C.3 state — the security work is
invisible in happy-path pixels and observable only as correct rejections in the above cases.

---

# Regression tests (migration SECTION 5)

- TEST 5.1 — `rls_users_self_update` WITH CHECK forbids `is_active` change (structural).
- TEST 5.2 — `prevent_user_role_escalation` guards `is_active` (structural).
- TEST 5.3 — last-admin lockout trigger exists.
- TEST 5.4 — last-admin lockout function enforces the admin-role rule.
- TEST 5.5 — admin can still update a student row (behavioural; SKIP for non-admin).
