# Admin Users — Management Surface Migration — Visual Comparison

**Phase 4.0 (D-146)** — before/after of every migrated surface on the Admin Users page.
**Status:** ✅ VERIFIED (2026-08-03)

> Comparison method: the migration replaced **variant selectors only** on existing certified Foundation components (`variant="management"` / `management` props). The pre-migration side is the certified premium dialect; the post-migration side is the certified Management dialect (tokens from `themes.css` §3 of the Phase 3.9 report). Layout, spacing, structure, motion, and a11y attributes are unchanged. Dark-mode values alias certified dark tokens → **pixel-identical in dark**.

---

## 1. Surface-by-surface comparison

| # | Surface | Before (premium) | After (management) | Visual delta |
|---|---|---|---|---|
| 1 | **Toolbar** (`CollectionToolbar`) | `bg-card-bg border-card-premium-border shadow-card-shadow` (+ light `stat-card-surface`/`shadow-premium-card`) | `--management-surface` + `--management-border-strong` + `--management-shadow` | **Light:** parchment/amber → neutral white `#FFFFFF` surface, gray border `#CBD5E1`; **Dark:** identical |
| 2 | **Search field** (`Input`) | `ancient-input` light gold material + `--input-border` gold-tint | `--management-surface` + `--management-border` + accent focus | **Light:** gold field → neutral white field, focus = accent; **Dark:** identical |
| 3 | **Status filter trigger + panel** (`CollectionFilter`) | premium trigger (`--filter-*` tokens, gold-tint in light) + premium `Menu` panel (`surface-floating`/ancient overlay) | management trigger (`--management-*`) + management `Menu` panel (neutral, no `ancient-overlay`) | **Light:** gold → neutral; **Dark:** identical |
| 4 | **Loading skeleton** (`GridSkeleton`) | gold skeleton blocks (`GOLD_SURFACE` + `shadow-premium-carved`) | neutral `MANAGEMENT_SKELETON_*` blocks | **Both themes:** neutral |
| 5 | **Collection rows** (`CollectionCard` → `Card`) | `premium` variant (`PREMIUM_LIGHT_OVERRIDES` amber in light) | `management` variant (neutral surface/border/shadow, no `PREMIUM_LIGHT_OVERRIDES`) | **Light:** parchment/amber → neutral white rows; **Dark:** identical |
| 6 | **Empty state** (`EmptyState`) | gold surface + `shadow-premium-card` | neutral surface/border/shadow | **Light:** amber → neutral; **Dark:** identical |
| 7 | **Toast** (`ToastContainer`) | `bg-card-bg` parchment panel | `--management-surface` panel | **Light:** parchment → neutral; **Dark:** identical (Status hues unchanged) |

---

## 2. State coverage (post-migration)

| State | Covered by | Result |
|---|---|---|
| Light mode | all §1 surfaces → neutral Management family | ✅ neutral, no amber |
| Dark mode | all §1 surfaces → certified dark tokens | ✅ pixel-identical to certified dark |
| Hover | Card rows (`-translate-y-0.5` + `--management-shadow-hover`), Toolbar, Filter trigger (`--management-border-hover`), search field (`--management-border-hover`) | ✅ |
| Focus | Input accent focus ring (`--management-accent`), Filter trigger (`--management-border-active`) | ✅ |
| Disabled | inherited from frozen Button/Input/Filter (unchanged) | ✅ |
| Loading | `GridSkeleton variant="management"` | ✅ |
| Empty | `EmptyState variant="management"` (with retry button) | ✅ |
| Confirmation | `ConfirmModal` → premium `AdminModal` (G2 — shared composite, retained) | ⚠️ retained premium, documented |
| Pagination | `Pagination` (certified composite, unchanged) | ✅ |
| Search | `Input variant="management"` | ✅ |
| Filter | `CollectionFilter variant="management"` | ✅ |
| Toolbar | `CollectionToolbar variant="management"` | ✅ |
| Collection Cards | `CollectionCard variant="management"` | ✅ |
| Metadata | `AdminText` + `Badge` (unchanged certified) | ✅ |
| Buttons | Status `danger`/`success` row toggles (Status family, amber-free) | ✅ |
| Status | `Badge success/danger` (unchanged) | ✅ |
| Alerts / ErrorContainer | `Alert variant="error"` (Status family, unchanged) | ✅ |
| Toast | `ToastContainer variant="management"` | ✅ |

---

## 3. Light vs Dark token trace (migrated surfaces)

| Token | Light | Dark |
|---|---|---|
| `--management-surface` | `#FFFFFF` | `#1F2937` (`--bg-surface`) |
| `--management-surface-muted` | `#F8FAFC` | `#374151` (`--bg-elevated`) |
| `--management-border` | `#E2E8F0` | `--border-subtle` |
| `--management-border-strong` | `#CBD5E1` | `--card-border` |
| `--management-border-hover` | `#94A3B8` | `--border-hover` |
| `--management-border-active` | `--color-accent` | `--color-accent` |
| `--management-shadow` / `--management-shadow-hover` | neutral slate shadows | `--elevation-2` / `--elevation-3` |
| `--management-accent` | `--color-accent` | `--color-accent` |

**Amber removal from the Admin Users page:** before — 7 page-owned surfaces carried the amber/parchment premium language in light mode; after — all 7 consume the certified neutral Management family. **Zero amber tokens remain in the in-scope files** (grep gate).

---

## 4. Responsive regression statement

The migration changed **no** layout, spacing, breakpoint, or structural class. Verified unchanged:
- Toolbar group: `flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0` (XS → desktop stack → row).
- Search field: `w-full`; filter: `w-full sm:w-fit`.
- Collection row: `layout="row"` compact two-zone management row + `padding={16}` + fixed column widths (`IDENTITY_COL`/`EXAM_COL`/`ATTEMPTS_COL`/`JOINED_COL`/`STATUS_COL`/`ACTION_COL`).
- `CollectionHeader` range strip + `Pagination`.
- Page: `PageContainer` → `Stack gap="lg"` → `SectionReveal` structure.

---

## 5. Visual regression evidence

| Check | Result |
|---|---|
| `tsc -b` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (pre-existing warnings only) |
| Lint frozen baseline | ✅ 405 (352E/53W) — zero new |
| Compiled CSS | ✅ management utilities in `dist` (surface ×21) |
| Grep amber in scope | ✅ zero |
| Grep `variant="premium"` in scope | ✅ zero |

---

## 6. Remaining visual items (documented, out of scope)

- **G1** Selection layer (`AdminSelectionTabs` → `SelectionContainer`): premium; shared across 7+ admin pages.
- **G2** Confirmation dialog (`ConfirmModal` → `AdminModal`): premium; Foundation `SharedComponents.tsx`.
- **G3** EmptyState internal action button: premium primary; Foundation `SharedComponents.tsx`.

None of these are page-owned visuals; each requires a separate shared-component gate. No **page** visual remains in the premium/amber dialect.
