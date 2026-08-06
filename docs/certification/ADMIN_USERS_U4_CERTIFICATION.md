# Admin Users — U-4 Identity Rendering Certification (Phase 3.5 · Page 1 of 11)

**Status:** ✅ **U-4 CERTIFIED** (2026-08-03)
**Gate:** U-4 (Identity Rendering) — approved per-item P2 gate. U-2 (typography), U-3 (`AdminText`),
U-6 remain closed.
**Page:** `/admin/users`
**Change:** one page-scoped identity composition (`UserIdentity`) composes the frozen `Avatar`
primitive (DS-014) on both breakpoints; the duplicated name render, email render, `'Unknown'`
fallback, and identity-block arrangement are removed. `Avatar` remains the **only** identity renderer.
**Inputs:** `ADMIN_USERS_U4_IDENTITY_AUDIT.md` · `ADMIN_USERS_U4_IMPLEMENTATION_REPORT.md` ·
`ADMIN_USERS_U4_VISUAL_COMPARISON.md`
**Baseline (frozen):** lint 405 problems (352 errors / 53 warnings) · `tsc -b` 0 · `build` 0.

---

## Certification verdict

**U-4 = ✅ CERTIFIED.** Identity rendering on the Admin Users page is fully delegated to the frozen
`Avatar` primitive (DS-014) — monogram, fallback, size, shape, decorative/`aria-label` contract,
status slot. The page owns **layout only**, expressed through one shared `UserIdentity` composition
used identically by desktop and mobile. Duplicate identity logic is removed, the page is
re-certified and re-frozen.

---

## 1. Gate success criteria → result

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Avatar Foundation is the only owner of identity rendering | ✅ PASS | exactly one `Avatar` usage (inside `UserIdentity`); zero `charAt`/`initials`/monogram logic in the page folder |
| 2 | The page owns layout only | ✅ PASS | `UserIdentity` composes `Stack` (certified layout primitive) + `Avatar` + name + email; `truncate` is the only page layout hint |
| 3 | Duplicate identity logic removed | ✅ PASS | name render ×2→1, email render ×2→1, `\|\| 'Unknown'` ×2→1, identity arrangement ×2→1 |
| 4 | No duplicated initials | ✅ PASS | monogram derived solely by `Avatar` (`deriveInitial`) |
| 5 | No duplicated fallback logic | ✅ PASS | one `'Unknown'` fallback, one `'?'` monogram fallback (both single-location) |
| 6 | No duplicated accessibility | ✅ PASS | Avatar SR contract (U-5) + one decorative `Mail` `aria-hidden`; zero page-level SR treatment |
| 7 | No page-level avatar styling | ✅ PASS | no avatar classes/styling in page files; all surface delegated to DS-014 |
| 8 | Desktop and mobile share the same composition | ✅ PASS | both consume `<UserIdentity …>` (`AdminUsersView.tsx:36-38`, `UserMobileCard.tsx:16`) |
| 9 | No premature Foundation expansion | ✅ PASS | `UserIdentity` stays page-scoped; NOT registered as DS-015 / Foundation primitive (D-130) |
| 10 | Foundation adoption increases (identity family) | ✅ PASS | Raw UI Implementations 1 → 0; identity family 100% Foundation-owned; metric 17/22 = 77% unchanged per D-130 |
| 11 | TypeScript / build / lint clean, zero new findings | ✅ PASS | `tsc -b` 0 · `build` 0 · lint 405 (352E/53W) = baseline |
| 12 | Responsive · light · dark verified | ✅ PASS | `ADMIN_USERS_U4_VISUAL_COMPARISON.md` 6-scenario matrix (desktop/tablet/XS × light/dark) |

---

## 2. Accepted deltas (intentional, visual-unification)

| Location | Delta | Rationale |
|---|---|---|
| Mobile · identity gap | `gap-3` (12px) → certified `Stack` `gap-sm` (8px) | certified layout primitive; mobile joins the canonical desktop spacing scale |
| Mobile · name | raw `<p>` sans 14px → `AdminText` garamond 16px (light = serif italic) | the plan's U-4 "which look wins?" decision — **desktop wins**; single canonical name render |
| Mobile · email | bare `<p>` → Mail-icon line (desktop look) | single canonical email render; truncation preserved |

Desktop renders are pixel-identical. All deltas are confined to the identity block; status badge,
exam type, attempts, joined date, and actions are untouched.

---

## 3. Scope delivered

| Item | Delivered |
|---|---|
| U-4 audit (inventory, ownership, duplication, consumers, a11y, adoption) | ✅ `ADMIN_USERS_U4_IDENTITY_AUDIT.md` |
| Implementation — `UserIdentity` page-scoped composition | ✅ `src/components/admin/users/UserIdentity.tsx` |
| Consumer migration (desktop + mobile) | ✅ `AdminUsersView.tsx:36-38`, `UserMobileCard.tsx:16`; page barrel updated |
| Implementation report | ✅ `ADMIN_USERS_U4_IMPLEMENTATION_REPORT.md` |
| Visual comparison | ✅ `ADMIN_USERS_U4_VISUAL_COMPARISON.md` |
| D-130 decision logged | ✅ `DESIGN_DECISION_LOG.md` |
| Freeze register / page index / execution log updated | ✅ |

**Not in scope:** U-2 (typography), U-3 (`AdminText`), U-6 (alpha tokens) — remain closed. No
typography, token, or `Avatar` changes.

---

## 4. Foundation adoption

```
Foundation Components Used:     17 / 22   (unchanged — UserIdentity is page composition; Avatar remains
                                            the only identity renderer)
Foundation Opportunities:       2         (U-2 Typography, U-3 AdminText — U-4 name RESOLVED as page
                                            composition; U-5 Avatar delivered; U-1/U-20 closed)
Page-Owned Components:          4         (AdminUsersView, UsersToolbar, UserMobileCard, UserIdentity) + 1 hook
Raw UI Implementations:         0         (mobile raw <p> name/email removed — was 1)
Foundation Adoption:            77%       → Target: 95%+ (U-2/U-3 Typography composite)
```

---

## 5. Freeze state

- **`Avatar` (DS-014):** unchanged, remains frozen — the only identity renderer.
- **`AdminText`:** unchanged — existing typography used as-is; **not** frozen early (U-3/T-3 owns
  its consolidation).
- **`UserIdentity`:** page-scoped composition. **Promotion rule (D-130):** may become a Foundation
  component only when ALL hold — used by multiple modules · composition identical across consumers ·
  no page-specific layout assumptions · typography already certified.
- **Admin Users page:** re-frozen — identity family 100% Foundation-owned, 0 raw implementations.
- **Remaining P2 gates:** U-2 (typography), U-3 (`AdminText`), U-6 (alpha tokens).

---

## 6. Remaining gates

U-2 (typography), U-3 (`AdminText`), U-6 (alpha tokens) — each opens a separate approval gate.

---

## 7. References

- Audit: `docs/certification/ADMIN_USERS_U4_IDENTITY_AUDIT.md`
- Implementation report: `docs/certification/ADMIN_USERS_U4_IMPLEMENTATION_REPORT.md`
- Visual comparison: `docs/certification/ADMIN_USERS_U4_VISUAL_COMPARISON.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-130)
- Prior: `ADMIN_USERS_U5_AVATAR_CERTIFICATION.md` (DS-014) · `ADMIN_USERS_U1_CERTIFICATION.md` ·
  `ADMIN_USERS_U20_CERTIFICATION.md` · `ADMIN_USERS_P0_P1_CERTIFICATION.md`
