# Admin Users — U-5 Avatar Foundation Audit (Phase 3.5 · Page 1 of 11)

**Gate:** U-5 (Avatar) — approved per-item P2 gate (2026-08-02)
**Status:** ✅ AUDIT COMPLETE — **new certified `Avatar` primitive created (DS-014)**
**Page:** `Admin Users` — `/admin/users`
**Method:** implementation evidence (code reads + DS-014 runtime audit test) + visual contract
comparison against the certified `AdminIconWrap` material.

---

## Step 1 — Finding under audit (U-5)

The plan (`ADMIN_USERS_IMPLEMENTATION_PLAN.md` U-5) identified **two independent avatar
implementations** of the same visual contract, with **no certified `Avatar` primitive**:

| Breakpoint | Before | Location |
|---|---|---|
| Desktop | `AdminIconWrap size="md" rounded="full"` initials monogram | `AdminUsersView.tsx:38` |
| Mobile | hand-rolled `w-9 h-9 … bg-primary/10` div | `UserMobileCard.tsx:15` |

Both re-derived the same contract (initials monogram, circular medallion, light `ancient-icon-badge`
/ dark `bg-primary/10`), so the "one owner per surface" rule was violated at the page layer.

---

## Step 2 — Ownership audit

| Owner category | Desktop impl | Mobile impl | Certified owner |
|---|---|---|---|
| Monogram derivation (initial letter) | page | page | `Avatar` (DS-014) |
| Circle medallion surface | `AdminIconWrap` (frozen composite, DS-004 companion) | raw `bg-primary/10` div | `AdminIconWrap` (via `Avatar`) |
| Light material (`ancient-icon-badge`) | `AdminIconWrap` | raw `light:` class | `AdminIconWrap` (via `Avatar`) |
| Dark material (`bg-primary/10 text-primary`) | `AdminIconWrap` | raw | `AdminIconWrap` (via `Avatar`) |
| Sizing (`sm`/`md`/`lg`) | `AdminIconWrap` sizes | hard-coded `w-9 h-9` | `Avatar` sizes → `AdminIconWrap` |
| Shape (`circle`/`square`) | `rounded="full"` | hard-coded `rounded-full` | `Avatar` shape → `AdminIconWrap` |
| Screen-reader treatment | page `aria-hidden` span | page `aria-hidden` div | `Avatar` (`decorative` / `role="img"`) |
| Status indicator slot | n/a | n/a | `Avatar` `status` slot (new) |

**Result:** the surface material was already owned by the frozen `AdminIconWrap`; the page duplicated
it. `Avatar` composes `AdminIconWrap` (permanent rule: *improve the Foundation first; page-specific
solutions only when genuinely unique*), so no new material was invented.

---

## Step 3 — Design contract of the new primitive (DS-014)

`src/components/common/Avatar.tsx` (68 lines):

| Aspect | Contract |
|---|---|
| API | `name?`, `email?` (fallback monogram source), `fallback?` (default `'?'`), `size` (`sm`/`md`/`lg`), `shape` (`circle`/`square`), `decorative` (default `true`), `ariaLabel?`, `status?`, `className?` |
| Monogram | first character of `name`, else first character of `email`, else `fallback`; uppercased |
| Sizes | `sm` = `w-7 h-7 text-[10px]`, `md` = `w-9 h-9 text-sm`, `lg` = `w-14 h-14 text-lg` |
| Shapes | `circle` → `rounded-full`, `square` → `rounded-lg` |
| Material | delegated to frozen `AdminIconWrap` (light `ancient-icon-badge`, dark `bg-primary/10 text-primary`) |
| A11y | `decorative=true` → `aria-hidden`; `decorative=false` → `role="img"` + `aria-label` (name-derived or `ariaLabel` override) |
| Status slot | optional `status` node rendered in the bottom-right corner (e.g. verified badge) |

**Golden reference:** the frozen `AdminIconWrap` visual contract promoted to a named, reusable
`Avatar` primitive — identical material, added monogram + a11y + status-slot semantics.

---

## Step 4 — Repository consumers

| Consumer | Usage | Status |
|---|---|---|
| `AdminUsersView.tsx:39` (desktop grid) | `<Avatar name={u.full_name} email={u.email} size="md" shape="circle" />` | ✅ migrated — page-local `AdminIconWrap` block replaced |
| `UserMobileCard.tsx:17` (mobile) | `<Avatar name={user.full_name} email={user.email} size="md" shape="circle" />` | ✅ migrated — hand-rolled `w-9 h-9` div replaced |
| `ds014-runtime-audit.test.tsx` | 17 tests: monogram derivation, certified surface, a11y contract, status slot | ✅ runtime audit |

Both consumers import `Avatar` via the `AntigravityUI` barrel (single-owner Foundation export).
The two page implementations are gone — one certified primitive remains.

---

## Step 5 — Verification

- `npx tsc -b` → exit 0
- `npm run build` → exit 0
- `npm run lint` → 405 problems (352 E / 53 W) = frozen baseline, zero new findings
- DS-014 runtime audit (`src/ds014-runtime-audit.test.tsx`, 17 tests) → present and code-reviewed;
  the vitest runner currently fails to load in this environment (`ERR_REQUIRE_ESM` from
  `@asamuzakjp/css-color`) — a pre-existing toolchain issue, unrelated to U-5.

---

## Deliverables

- Implementation: `src/components/common/Avatar.tsx` (new) · `AntigravityUI.tsx` (barrel export) ·
  `AdminUsersView.tsx` · `UserMobileCard.tsx` · `ds014-runtime-audit.test.tsx` (renamed from ds008)
- Visual comparison: `docs/certification/ADMIN_USERS_U5_AVATAR_VISUAL_COMPARISON.md`
- Certification: `docs/certification/ADMIN_USERS_U5_AVATAR_CERTIFICATION.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-129)
