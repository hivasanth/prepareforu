# Admin Users — U-4 Identity Rendering Audit (Phase 3.5 · Page 1 of 11)

**Gate:** U-4 (Identity Rendering) — approved per-item P2 gate (2026-08-03)
**Status:** ✅ AUDIT COMPLETE — identity family now 100% Foundation-owned via one page-scoped
composition (`UserIdentity`) over the frozen `Avatar` primitive (DS-014)
**Page:** `Admin Users` — `/admin/users`
**Method:** implementation evidence (code reads) across both breakpoints + repository identity
rendering scan. This is an **Identity audit, not a Typography audit** — U-2 (Typography) and U-3
(`AdminText`) are explicitly out of scope and remain closed.

---

## Step 1 — Identity inventory

Every identity representation on the page:

| Element | Current Component | Foundation Owner | Status |
|---|---|---|---|
| User avatar (medallion) | `Avatar` (DS-014) | `Avatar` | ✅ Foundation-owned (U-5) |
| User initials (monogram) | `Avatar` `deriveInitial` (`name → email → fallback`) | `Avatar` | ✅ Foundation-owned (U-5) |
| User name | `AdminText` garamond (desktop) **vs** raw `<p>` (mobile) — **duplicated** | page composition (no certified Typography yet — U-2/U-3 pending) | ❌ **U-4 target** |
| User email | `Mail` icon + `text-secondary` (desktop) **vs** raw `<p>` no icon (mobile) — **duplicated** | page composition | ❌ **U-4 target** |
| Name fallback (`'Unknown'`) | `|| 'Unknown'` **×2** (desktop + mobile) | — | ❌ **U-4 target** |
| Role | not rendered on this page (students only) | n/a | n/a |
| Status badge (Active/Banned) | `Badge` variant `success`/`danger` | `Badge` (certified) | ✅ Foundation-owned |
| Selection indicator | none on this page (no row-selection UI) | n/a | n/a |

---

## Step 2 — Foundation ownership

| Owner category | Avatar owns (DS-014) | Page owns | Status |
|---|---|---|---|
| initials | ✅ `deriveInitial` | — | ✅ |
| fallback | ✅ `fallback='?'` (monogram) | — | ✅ |
| image / monogram rendering | ✅ `AdminIconWrap` via `Avatar` | — | ✅ |
| sizing (`sm`/`md`/`lg`) | ✅ | — | ✅ |
| shape (`circle`/`square`) | ✅ | — | ✅ |
| decorative handling / `aria-label` | ✅ `decorative` / `role="img"` | — | ✅ |
| status slot | ✅ `status` prop | — | ✅ |
| layout / composition / spacing | — | ✅ `UserIdentity` (page-scoped) | ✅ |

**Rule check — "no page may own avatar rendering":** the page folder now contains exactly one
`Avatar` usage (inside `UserIdentity`) and **zero** `charAt`, `initials`, or monogram logic.
Avatar rendering is 100% delegated to the frozen DS-014 primitive.

---

## Step 3 — Duplicate rendering audit

Duplications found (all within the identity block; both breakpoints rendered the same data
independently):

| # | Duplication | Desktop (`AdminUsersView.tsx`) | Mobile (`UserMobileCard.tsx`) |
|---|---|---|---|
| 1 | Name text render | `AdminText variant="garamond"` `text-base` | raw `<p>` `font-bold text-sm` |
| 2 | Name fallback logic | `{u.full_name \|\| 'Unknown'}` | `{user.full_name \|\| 'Unknown'}` |
| 3 | Email render | `Mail` icon + `flex gap-1 text-secondary` | raw `<p>` (no icon) |
| 4 | Identity block composition (Avatar + name + email arrangement) | inline `Stack` block | inline `div` block |

Already resolved by U-5: avatar duplication ×2 → 1 (both breakpoints now compose `Avatar`).

**Result:** four duplications in the identity family, all collapsing into one shared composition.

---

## Step 4 — Consumer audit

| Consumer | Usage | Status |
|---|---|---|
| Desktop grid | `<UserIdentity user={u} />` — `AdminUsersView.tsx:36-38` | ✅ composes DS-014 |
| Mobile card | `<UserIdentity user={user} truncate />` — `UserMobileCard.tsx:16` | ✅ composes DS-014 |
| Future reusable consumers | `UserIdentity` is **page-scoped** (D-130). Promotion to Foundation allowed only when ALL hold: used by multiple modules · identical composition across consumers · no page-specific layout assumptions · typography already certified | ⏸ deferred |

Both breakpoints consume the **same** `UserIdentity` composition; `truncate` is the only layout
hint (page-owned layout concern), default `false` for desktop, `true` for mobile.

---

## Step 5 — Accessibility audit

| Aspect | Before U-4 | After U-4 | Owner |
|---|---|---|---|
| Avatar `decorative=true` → `aria-hidden` | page `aria-hidden` span/div (U-12) | inside `Avatar` (U-5, unchanged) | `Avatar` ✅ |
| Avatar `decorative=false` → `role="img"` + `aria-label` | n/a on this page | `Avatar` contract (unused here — name is adjacent visible text) | `Avatar` ✅ |
| Decorative `Mail` icon | `aria-hidden` (U-12) | `aria-hidden` — now in one place (`UserIdentity`) | page composition ✅ |
| Keyboard neutrality | no focusable identity elements | unchanged — identity is non-interactive text/image; no keyboard impact | ✅ |
| Screen-reader output | name + email read as text; avatar hidden | identical — name/email still visible text; avatar hidden (name adjacent) | ✅ |
| Page-level SR duplication | 2 page-local SR treatments (desktop + mobile) | **0** — single composition carries the only decorative-icon treatment | ✅ |

No duplicated accessibility remains. `UserIdentity` adds no `role`/`aria` of its own; it only
arranges Avatar (which owns its SR contract) and plain text.

---

## Step 6 — Foundation adoption

```
Foundation Components Used:     17 / 22   (unchanged — UserIdentity is a page-scoped composition,
                                            NOT a new Foundation component; Avatar remains the only
                                            identity renderer)
Foundation Opportunities:       2          (U-2 Typography, U-3 AdminText — U-4 name RESOLVED as page
                                            composition; U-5 Avatar delivered; U-1/U-20 closed)
Page-Owned Components:          4          (AdminUsersView, UsersToolbar, UserMobileCard, UserIdentity) + 1 hook
Raw UI Implementations:         0          (mobile raw <p> name/email removed — was 1)
Foundation Adoption:            77%        → Target: 95%+ (remaining gap = U-2/U-3 Typography composite)
```

**Movement vs. U-5 (77%):** the numeric metric is unchanged because the approved D-130 decision
keeps `UserIdentity` page-scoped (composition ownership does not affect the adoption metric).
What moved: **Raw UI Implementations 1 → 0**, **page-owned identity rendering removed**,
duplicate name/email/fallback/composition logic removed, and the identity family became
**100% Foundation-owned** (all rendering delegated to DS-014). The 95%+ target is set by the
U-2/U-3 Typography composite.

---

## Verification

- `npx tsc -b` → exit 0
- `npm run build` → exit 0 (pre-existing chunk notices only)
- `npm run lint` → **405 problems (352 E / 53 W)** = frozen baseline, **zero new findings**
- Zero duplicate identity renderers: exactly one `Avatar` usage and one `|| 'Unknown'` fallback
  in the page folder; zero `charAt`/`initials` logic

---

## Deliverables

- Implementation: `src/components/admin/users/UserIdentity.tsx` (new, page-scoped) ·
  `AdminUsersView.tsx` · `UserMobileCard.tsx` · `index.ts` (page barrel)
- Visual comparison: `docs/certification/ADMIN_USERS_U4_VISUAL_COMPARISON.md`
- Implementation report: `docs/certification/ADMIN_USERS_U4_IMPLEMENTATION_REPORT.md`
- Certification: `docs/certification/ADMIN_USERS_U4_CERTIFICATION.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-130)
