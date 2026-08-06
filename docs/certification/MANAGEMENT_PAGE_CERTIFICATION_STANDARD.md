# MANAGEMENT PAGE CERTIFICATION STANDARD

**Status:** 🔒 **PERMANENT — CERTIFIED (Phase 3.6A, D-133)** (2026-08-03)
**Purpose:** The mandatory certification checklist and gate for every management (CRUD / list) page. A page is certified as a **Management Page** only when it satisfies this Standard — never by comparison to another page.
**Authority:** `docs/design-system/MANAGEMENT_PAGE_STANDARD.md` (the architecture contract).

---

# 1. Mandatory Components

A certified management page **must** use:

| Component | Mandatory |
|---|---|
| Management Page Skeleton (`PageContainer` → `Stack` → Selection → Toolbar → Header → List → Pagination → Modal → Toast) | ✅ |
| `CollectionCard` (one per entity, `layout="row"`) | ✅ |
| `CollectionToolbar` (independent surface) | ✅ |
| `CollectionHeader` (select-all + range) | ✅ |
| `SelectionContainer` (independent context surface) | ✅ |
| `Pagination` (independent) | ✅ |
| `AdminModal` / `ConfirmModal` (dialogs) | ✅ |
| `ToastContainer` | ✅ |
| `EmptyState` / `Alert` / `GridSkeleton` (state layers) | ✅ |

# 2. Certification Checklist

A page is certified only if **all** of the following hold:

- [ ] Uses the Management Page Skeleton.
- [ ] Uses `CollectionCard`.
- [ ] Uses `CollectionToolbar`.
- [ ] Uses `CollectionHeader`.
- [ ] Uses `SelectionContainer`.
- [ ] Uses `Pagination`.
- [ ] Has independent surfaces (selection / toolbar / cards / pagination never nest).
- [ ] Has **zero** nested Cards.
- [ ] Has **zero** page-owned visuals (colors, shadows, radius, borders, hover, animation, spacing, transitions).
- [ ] Uses the **24 → 12 → 8** spacing rhythm.
- [ ] Foundation owns every visual.
- [ ] One CollectionCard = one entity; `CollectionCard` never knows the entity it renders.
- [ ] Selection, Toolbar, Header, Pagination each have exactly one owner.
- [ ] Loading / Empty / Error replace only the list layer (selection + toolbar stay mounted and interactive).
- [ ] Selection state lives in the page; `selected` is presentation-only.
- [ ] No page introduces a new layout pattern, spacing system, or surface.

# 3. Forbidden Patterns (auto-fail)

| Anti-pattern | Why it fails |
|---|---|
| Outer `Card` wrapping toolbar + list + pagination | nested surfaces; collapses hierarchy |
| `DataGrid` table used as the primary list | table chrome breaks the one-card-per-entity contract |
| Dual desktop/mobile render paths (table + mobile cards) | `CollectionCard layout="row"` is responsive — one path |
| Page-owned `hover:*`, `shadow-*`, `rounded-*`, `border-*` on page components | pages own zero visuals |
| Page-level ad-hoc spacing values outside the 24/12/8 ladder | spacing contract violation |
| Page-local restyling of Foundation components via `className` overrides | one-owner-per-surface violation |
| Page-specific selection checkbox / badge / button re-implementations | must reuse certified primitives |

# 4. Certification Gate

Each page is certified through the standard gate (no shortcut):

```
1. Plan      → page plan against the Management Page Standard (components, mapping, deltas)
2. Audit     → structural audit: skeleton, surfaces, ownership, spacing, flow (docs only)
3. Approve   → gate decision (new D-series entry for deviations)
4. Implement → composition only; Foundation-first (Reuse → Refine → Create)
5. Verify    → tsc 0 · build 0 · lint frozen baseline, zero new · grep: zero page-owned visuals
6. Certify   → freeze-register entry + certification doc + page index update
```

## 4.1 Verification evidence (mandatory)

- `npx tsc -b` → exit 0.
- `npm run build` → exit 0.
- Lint → frozen baseline (currently **405 = 352E/53W**), zero new findings.
- Grep of the page folder → zero raw visual utilities on page-owned components (page code contains only structural/composition classes).
- Render proof → the page's surfaces resolve through Foundation tokens; no page-authored CSS.

## 4.2 Deviations

Any deviation from the Standard (a new layout pattern, a new spacing value, a page-owned visual, a different surface) requires an explicit D-series decision **before** implementation. Unlogged deviations fail the gate.

# 5. Adoption Metric

Pages are tracked by Foundation adoption:

- `Foundation Components Used` — count of distinct certified Foundation components consumed by the page.
- `Raw UI Implementations` — page-owned visual implementations; a certified page has **0**.
- `Page-owned typography` — a certified page has **0** (all text via Layer 1 / Layer 2 primitives).

# 6. Current Adoption

| Page | Status | Foundation components | Raw UI | Page-owned visuals |
|---|---|---|---|---|
| Admin Questions | ✅ **CERTIFIED** (first implementation of the Standard) | high (collection family complete) | 0 | 0 |
| Admin Users | ✅ **CERTIFIED** (second implementation — `ADMIN_USERS_MANAGEMENT_STANDARD_CERTIFICATION.md`, D-134) | 20+ (collection family complete; 0 raw UI) | 0 | 0 |
| Admin Students | ⚪ pending | — | — | — |
| Admin Exams | ⚪ pending | — | — | — |
| Admin Sub Admins | ⚪ pending | — | — | — |
| Admin History / Leaderboards / Attempt History / Question Banks | ⚪ pending | — | — | — |

# 7. Certification Documents

Each certified page produces:

- Page audit (structure, ownership, spacing, flow) against the Standard
- Implementation report (mapping, adoption metrics, verification)
- Certification document (checklist sign-off)
- Freeze-register entry + decision-log entry (D-series)

# 8. Reference

- Standard: `docs/design-system/MANAGEMENT_PAGE_STANDARD.md`
- Admin Users blueprint: `docs/certification/ADMIN_USERS_LAYOUT_MIGRATION_BLUEPRINT.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-133)
- Page index: `docs/certification/PAGE_CERTIFICATION_INDEX.md`
