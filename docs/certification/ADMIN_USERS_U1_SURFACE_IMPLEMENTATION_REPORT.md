# Admin Users — U-1 Surface Family Implementation Report (Phase 3.5 · Page 1 of 11)

**Gate:** U-1 (Surface Family) — approved per-item P2 gate (2026-08-02)
**Status:** ✅ IMPLEMENTED · VERIFIED
**Page:** `Admin Users` — `/admin/users`
**Scope:** `src/components/admin/users/AdminUsersView.tsx:127` (panel surface only)
**Decision:** D-127 (`docs/design-system/DESIGN_DECISION_LOG.md`) — reuse certified `Card`, no new variant.

---

## 1. Foundation-first audit

### 1.1 Current surface (before)

| Attribute | Value (dark) | Value (light) |
|---|---|---|
| Component | `Card variant="subtle" padding={0}` | same |
| Page-owned class | `ancient-card overflow-hidden` (`AdminUsersView.tsx:127`) | same |
| Background | `--surface-primary` (= `--bg-surface` `#1F2937`) + `--gradient-surface` (`none` dark) | `--card-parchment` (gradient over `#C9A070`) |
| Border | 1px `--border-subtle` (`#374151`) | 1.8px `--border-gold` (`#A87828`) |
| Radius | `--radius-card` = `--radius-3xl` (20px) | 18px (hardcoded) |
| Shadow | `--elevation-surface` (= `--shadow-sm`) | `--card-3d-shadow` (inset gold + `5px 6px 0px rgba(105,62,15,.70)` + ambient) |
| Hover | `--elevation-raised` + `--border-hover` | `translateY(-2px) translateX(-1px)` |
| Texture | none | grain `::before` (repeating-linear-gradient) |
| Motion | `all .2s cubic-bezier(.16,1,.3,1)` | 18px/0.18s ease transitions |

The surface is **page-owned**: the legacy `ancient-card` class (`.ancient-card` `index.css:845-853`; `.light .ancient-card` `:1127-1178`) is layered **on top of** the certified `Card` `subtle` recipe, which it fully overrides. This violates "One owner per surface", "Pages never introduce visual styling", and the Amber Color Policy (D-124) — `ancient-card` is a hand-rolled duplicate of the certified gold/amber material outside the Foundation.

### 1.2 Foundation ownership

- **L5 Card surface** is owned by `Card` (`AntigravityCard.tsx`) — the golden reference is the User Panel premium family (SURFACE_LAYER_AUDIT.md:53, 73-89; D-106).
- Certified recipe that **already reproduces the same material**:
  - Light: `light:stat-card-surface` (`--surface-stat` gold gradient `#D4A55A→#BF8A30`) + `light:shadow-premium-card` (`--stat-card-3d-shadow` + cream inset) + `light:border-card-premium-border` (`--border-gold` `#A87828`).
  - Dark: `bg-card-bg` (= `--bg-surface` `#1F2937`) + `border-card-border` (`rgba(55,65,81,.5)`) + `shadow-card-shadow` (= `--elevation-2`).
- `.ancient-card` is classified **⚠ Legacy → Merge/Disappear** (SURFACE_PROBLEM_REGISTER.md:81; SURFACE_IMPLEMENTATION_PLAN.md §2) and its raw amber hex is the tracked amber backlog P-2 (FOUNDATION_CROSS_FAMILY_AUDIT.md:44, 78).

### 1.3 Repo consumers of `ancient-card` (audit)

| File:Line | Recipe | Status |
|---|---|---|
| `AdminUsersView.tsx:127` | `Card subtle` + `ancient-card` | **U-1 subject — migrated** |
| `AdminSubAdminsView.tsx:146` | `Card subtle` + `ancient-card` (identical) | future consumer (same migration) |
| `BulkActionBar.tsx:20` | `!isDark ? 'ancient-card' : 'bg-card-bg …'` (light-only, floating bar) | future consumer |
| `WelcomeBanner.tsx:69` | `ancient-card-dark` (separate forest variant) | P3-1 / P2-2 planned |

### 1.4 Golden reference comparison

The legacy light recipe (`#C9A070` + `#A87828` + `--card-3d-shadow`) is the **same amber/gold carved family** as the certified premium Card light recipe (`--surface-stat` + `--border-gold` + `--stat-card-3d-shadow`) — one is Foundation-owned, the other is a page-owned duplicate. Adoption of `default` moves the panel onto the golden reference with a sub-family tint delta (parchment base → saturated gold gradient).

---

## 2. Implementation decision (D-127)

**Reuse-vs-create flow** (SURFACE_IMPLEMENTATION_PLAN.md §13):
> Does a certified Foundation component cover the need? **YES → reuse it.** No new variant.

- **Rejected — new `parchment`/`ancient` Card variant:** would create a competing/duplicate surface ("new visual language" forbidden for frozen `Card`; `.ancient-*` scheduled to disappear, not promote).
- **Rejected — `variant="premium"`:** dark background becomes forest `--forest-900` `#0A1E12` (was slate `#1F2937`) — a large, unnecessary dark-mode change.
- **Rejected — keep `variant="subtle"` + drop class:** `subtle` is a quiet utility surface (`rounded-xl bg-card-bg/60`), not the golden reference; light would lose the carved material.
- **Selected — `variant="default"`:** certified golden-reference card; light = carved gold material (≈ current parchment family), dark = `#1F2937` (unchanged from current), 1px gold border, `rounded-2xl` 16px, hover lift retained. **Zero Foundation change; pure page migration.**

### 2.1 Change

```diff
- <Card variant="subtle" padding={0} className="ancient-card overflow-hidden" role="region" aria-label="Users list" aria-live="polite">
+ <Card variant="default" padding={0} className="overflow-hidden" role="region" aria-label="Users list" aria-live="polite">
```

`padding={0}` (layout), `overflow-hidden`, `role`/`aria-label`/`aria-live` retained — all non-surface.

---

## 3. Verification

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (pre-existing chunk-size notices only) |
| `npm run lint` | ✅ 405 problems (352E/53W) — **identical to the frozen baseline**; zero new findings |
| `npx eslint src/components/admin/users/AdminUsersView.tsx` | ✅ 0 findings |
| Light / dark / desktop / tablet / XS | ✅ see `ADMIN_USERS_U1_VISUAL_COMPARISON.md` (inspection-based, repo precedent) |

---

## 4. Foundation adoption impact

```
Before U-1:  page-owned ancient-card surface (duplicate recipe) · Card consumed (subtle variant)
After U-1:   Card default owns 100% of panel appearance · page owns layout/composition only
Foundation Adoption: 73% → 76%  (surface recipe de-duplicated; 1 page-owned surface retired)
Target: 95%+ after remaining P2 (U-2..U-5, U-20)
```

## 5. Consumers affected / rollback

- **Direct:** only `AdminUsersView.tsx`. No other file changed.
- **Future same-recipe consumers:** `AdminSubAdminsView.tsx:146`, `BulkActionBar.tsx:20` — documented, not migrated (separate pages/gates).
- **Legacy CSS retained:** `.ancient-card` / `.light .ancient-card` / `.ancient-card-dark` remain in `index.css` until the remaining consumers migrate (P3 retirement, per SURFACE_IMPLEMENTATION_PLAN.md §2/P3-1).
- **Rollback:** single-line revert `variant="default"` → `variant="subtle"` + restore `ancient-card` class. `Card` component untouched, so no Foundation rollback exists.

## 6. Deliverables

- Visual comparison: `docs/certification/ADMIN_USERS_U1_VISUAL_COMPARISON.md`
- Certification: `docs/certification/ADMIN_USERS_U1_CERTIFICATION.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-127)
