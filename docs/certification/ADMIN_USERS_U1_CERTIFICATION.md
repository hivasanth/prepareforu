# Admin Users — U-1 Surface Family Certification (Phase 3.5 · Page 1 of 11)

**Status:** ✅ **U-1 CERTIFIED** (2026-08-02)
**Gate:** U-1 (Surface Family) — approved per-item P2 gate; U-2, U-3, U-4, U-5, U-20 remain closed.
**Page:** `/admin/users`
**Change:** `AdminUsersView.tsx:127` — page-owned `ancient-card` surface retired; panel adopts
certified `Card variant="default"` (golden reference). **No Foundation component changed.**
**Inputs:** `ADMIN_USERS_U1_SURFACE_IMPLEMENTATION_REPORT.md` · `ADMIN_USERS_U1_VISUAL_COMPARISON.md`
**Baseline (frozen):** lint 405 problems (352 errors / 53 warnings) · `tsc -b` 0 · `build` 0.

---

## Certification verdict

**U-1 = ✅ CERTIFIED.** The Surface Family (`Card`) now owns 100% of the Admin Users panel
appearance; the page owns layout/composition only. Panel re-frozen.

---

## 1. Gate success criteria → result

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Foundation-first audit (current surface, ownership, consumers, golden reference) | ✅ PASS | Implementation report §1 (recipe, L5 owner, 4 consumers, golden comparison) |
| 2 | Reuse existing Foundation if it satisfies (no page-specific surface invented) | ✅ PASS | D-127 reuse-vs-create: certified `default` covers the need; **zero Card change** |
| 3 | Page no longer owns structural surface (colors/shadows/borders/radius/hover/elevation/animation) | ✅ PASS | `ancient-card` removed from `AdminUsersView.tsx:127`; panel = `variant="default"` only |
| 4 | Surface Family owns 100% of panel appearance | ✅ PASS | All appearance attributes resolve through `Card` variantClasses + Foundation tokens |
| 5 | No duplicate surface recipes | ✅ PASS | Page-owned `ancient-card` usage removed (class retained only for remaining consumers) |
| 6 | Reusable | ✅ PASS | `default` is the standard certified Card variant (37+ consumers) |
| 7 | Thinner consumer | ✅ PASS | className reduced `ancient-card overflow-hidden` → `overflow-hidden` |
| 8 | Adoption score increases | ✅ PASS | 73% → **76%** (surface recipe de-duplicated) |
| 9 | Re-certified and re-frozen | ✅ PASS | this certification + freeze register update |
| 10 | TypeScript / build / lint clean, zero new findings | ✅ PASS | `tsc -b` 0 · `build` 0 · lint 405 (352E/53W) = baseline · targeted eslint 0 |
| 11 | Light / dark / desktop / tablet / XS verified | ✅ PASS | 6-scenario matrix (visual comparison §3) |

---

## 2. Accepted deltas (intentional, golden-reference-aligned)

| Theme | Delta | Rationale |
|---|---|---|
| Light | parchment base `#C9A070` → certified gold gradient `--surface-stat`; border 1.8px→1px; radius 18px→16px; grain sheen removed | moves the panel onto the certified golden reference (D-106); sub-family tint only |
| Dark | border `#374151` → `rgba(55,65,81,.5)`; radius 20px→16px; shadow `--shadow-sm`→`--elevation-2` | same `#1F2937` background; minor within-family depth |

Both deltas are the **Foundation's certified attributes**, not page-invented styling.

---

## 3. Scope delivered

| Item | Delivered |
|---|---|
| U-1 audit (current surface / ownership / consumers / golden reference) | ✅ |
| U-1 implementation (migrate panel to `Card variant="default"`, drop `ancient-card`) | ✅ `AdminUsersView.tsx:127` |
| D-127 decision logged | ✅ `DESIGN_DECISION_LOG.md` |
| Visual comparison | ✅ `ADMIN_USERS_U1_VISUAL_COMPARISON.md` |
| Freeze register / page index / execution log updated | ✅ |

**Not in scope:** U-2 (typography), U-3 (`AdminText`), U-4 (name), U-5 (`Avatar`), U-20 (Overlay) —
remain closed, each with its own gate. Same-recipe consumers `AdminSubAdminsView.tsx:146` and
`BulkActionBar.tsx:20` are documented for their own pages; `.ancient-card` CSS is retained until
they migrate (P3 retirement).

---

## 4. Foundation adoption

```
Foundation Components Used:     16 / 22   (Card now consumed via the golden-reference default variant)
Foundation Opportunities:       4         (U-2 Typography, U-3 AdminText, U-5 Avatar, U-20 Overlay — U-1 SURFACE DELIVERED)
Page-Owned Components:          3         (AdminUsersView, UsersToolbar, UserMobileCard) + 1 hook
Raw UI Implementations:         2         (mobile avatar, mobile name — U-5/U-4, P2-gated)
Page-Owned Surfaces:            0         (was 1: ancient-card) — Surface family owns the panel
Foundation Adoption:            76%       → Target: 95%+
```

---

## 5. Freeze state

- **`Card`:** unchanged — remains frozen (DS-001 / Phase 2A.1, version 1.0). U-1 made **zero**
  Foundation modifications; the `default` variant was already certified.
- **Admin Users panel:** re-frozen with the Surface Family as sole surface owner. No further
  render-affecting change without a new approval gate.

---

## 6. Next gate

The **U-20 approval gate may now be opened** (per the U-1 gate instruction: only after U-1
certification). U-2, U-3, U-4, U-5 also remain open for their own individual gates.

---

## 7. References

- Implementation report: `docs/certification/ADMIN_USERS_U1_SURFACE_IMPLEMENTATION_REPORT.md`
- Visual comparison: `docs/certification/ADMIN_USERS_U1_VISUAL_COMPARISON.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-127)
- P0/P1 certification (superseded P2 status): `docs/certification/ADMIN_USERS_P0_P1_CERTIFICATION.md`
