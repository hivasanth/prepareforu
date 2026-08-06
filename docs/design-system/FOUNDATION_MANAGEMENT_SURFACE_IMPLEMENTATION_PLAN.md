# Foundation Management Surface — Implementation Plan (Planning Phase)

**Phase 3.8.1 — Foundation Implementation Planning (per D-142 next-phase directive)**
**Status:** PLANNING ONLY — **no code, token, variant, component, theme, or page changes. This plan is the additive Foundation implementation blueprint awaiting approval.**
**Approved direction:** D-142 — Management Surface Foundation Architecture approved as the long-term visual target; next phase must (1) audit affected Foundation components, (2) define the exact additive implementation, (3) assess frozen-component compatibility, (4) produce an implementation plan, (5) stop for approval before any code.
**Related:** `MANAGEMENT_SURFACE_FOUNDATION_ARCHITECTURE.md`, `MANAGEMENT_SURFACE_FOUNDATION_PROPOSAL.md`, `MANAGEMENT_SURFACE_DECISION_MATRIX.md`, `MANAGEMENT_SURFACE_MIGRATION_STRATEGY.md`, `MANAGEMENT_SURFACE_RISK_ASSESSMENT.md`, `FOUNDATION_MANAGEMENT_SURFACE_COMPONENT_AUDIT.md` (companion audit), Phase 3.7 audit set (`ADMIN_USERS_*`).

---

## 1. Scope & Guardrails

| Item | Rule |
|---|---|
| What this phase delivers | An **implementation plan** only. Zero code. |
| Additive-only | New tokens, new variants, new mappings. **Forbidden:** mutating existing variants, modifying frozen renders, changing existing token values, breaking consumers. |
| Freeze register | DS-001 Card, DS-002 Button, composite freezes (Phase 2B), CollectionToolbar (3.2.2), CollectionFilter (3.2.4), CollectionCard (v1.1) — all honored via additive entries only. |
| Page migrations | **None here.** Pages (P3+ in `MANAGEMENT_SURFACE_MIGRATION_STRATEGY.md`) migrate only after this Foundation plan is approved AND executed. |
| Standard amendment | Rule 12 text change (premium family → Management Surface Family) is a separate D-series decision; noted but not executed here. |

---

## 2. Step 1 — Exact Additive Implementation

### 2.1 Token namespace (single additive block)

**File:** `src/styles/themes.css` — append a new `:root`-scoped `--management-*` block (both themes defined; dark reuses today's certified neutral values so dark mode is pixel-unchanged). **No existing token is modified.**

Proposed tokens (values illustrative — final values set at implementation with a documented light+dark table):

| Token (new) | Light (proposed neutral) | Dark (= today's certified neutral) |
|---|---|---|
| `--management-surface` | near-white neutral (e.g. `#F8FAFC`) | `--card-bg` dark (`#1F2937`) |
| `--management-surface-muted` | light gray (`#EEF2F6`) | `--bg-hover-bg` dark (`#374151`) |
| `--management-border` | low-chroma gray (`#CBD5E1`) | `--border-subtle` dark (`#374151`) |
| `--management-border-strong` | darker gray (`#94A3B8`) | `#4B5563` |
| `--management-shadow` | soft neutral (e.g. `0 1px 2px rgb(15 23 42 / 0.06), 0 4px 12px -2px rgb(15 23 42 / 0.08)`) | `--elevation-2` dark (`:481`) |
| `--management-hover-shadow` | subtle lift (existing neutral hover scale) | `--elevation-3` dark |
| `--management-accent` | `--color-primary` (blue accent) | same |

**Hard rules:** no gold in this namespace; no `var(--border-gold)`, `var(--card-3d-shadow)`, `var(--surface-stat)`, `var(--elevation-carved)` references; accent is the existing blue `--color-primary`, never gold.

### 2.2 Card additive variant

**File:** `src/components/common/AntigravityCard.tsx` (DS-001 frozen — additive only)

- Add `'management'` to `CardVariant` union (type-level additive).
- Add `management` entry to `variantClasses` (new string; existing strings untouched):

```
management: 'rounded-2xl bg-[var(--management-surface)] border-[1.8px] border-[var(--management-border)] ' +
  'shadow-[var(--management-shadow)] transition-[transform,box-shadow] duration-200 ' +
  'hover:-translate-y-0.5 hover:shadow-[var(--management-hover-shadow)]'
```

- Add `management` to `defaultPaddingMap` → `'p-4 md:p-5'` (same density as premium variants).
- **Deliberately NO `PREMIUM_LIGHT_OVERRIDES`** on this variant — that is the amber source (`AntigravityCard.tsx:25`) and must never appear on the management recipe.
- Existing variants `elevated`/`default`/`subtle`/`premium`/`premium-neutral`/`premium-dark-neutral`/`auth-light`: **unchanged**.

### 2.3 CollectionCard additive variant

**File:** `src/components/common/CollectionCard.tsx` (frozen v1.1 — additive only)

- Add `'management'` to `CollectionCardVariant` union.
- Add to `VARIANT_MAP`:

```
management: { surface: 'management' },   // → Card variant="management"
```

- Existing entries `default`/`premium`/`subtle`/`outlined`/`compact`: **unchanged**. `premium → premium-dark-neutral` mapping stays (Exam/premium consumers unaffected).

### 2.4 Toolbar additive surface

**File:** `src/components/common/AntigravityLayout.tsx` (CollectionToolbar frozen 3.2.2)

- Add a new additive export `MANAGEMENT_TOOLBAR_SURFACE` (a management-dialect recipe string) OR a prop-free additive variant. **Proposed (additive-only):** add `export const MANAGEMENT_SURFACE = 'bg-[var(--management-surface)] border-[1.8px] border-[var(--management-border)] shadow-[var(--management-shadow)]'` beside `PREMIUM_SURFACE` in `AntigravityCard.tsx`, and give `CollectionToolbar` an additive `variant?: 'premium' | 'management'` prop defaulting to `'premium'` — **default render unchanged**; management pages pass `variant="management"`.
- `FilterBar` remains a deprecated alias of `CollectionToolbar` (D-102) — behavior inherited.

### 2.5 Button additive re-anchoring (Control role)

**File:** `src/components/common/AntigravityButton.tsx` (DS-002 frozen — additive only)

- Do **not** mutate existing `lightVariants.primary`/`secondary` (they serve non-management consumers).
- **Proposed:** add additive management-light variants via a new `Button` prop `management?: boolean` (or a `variant` extension) that selects management-dialect class strings using `--management-*` tokens:
  - management primary: neutral surface + `--management-border` + `--management-accent` text/active
  - management secondary: `--management-surface-muted` + `--management-border` + neutral shadow
- Status-hued `success`/`danger` row buttons: **unchanged** (already amber-free, Status family).
- Existing primary/secondary/auth variants: **unchanged**.

### 2.6 Filter / Input additive token consumption

- **CollectionFilter** (`CollectionFilter.tsx`, frozen 3.2.4): trigger currently consumes `--filter-surface`/`--filter-border`/`--filter-shadow` (amber in light, `themes.css:978-981,1240-1241`). **Additive:** add a `management?: boolean` prop switching to management token values (e.g. `bg-[var(--management-surface)]` + `border-[var(--management-border)]` + `shadow-[var(--management-shadow)]`). Default unchanged.
- **Input** (`AntigravityForm.tsx` `FIELD_SURFACE`): amber arrives via `--input-border = --border-subtle` gold-tint (`:937`). **Additive:** `Input` gains `management?: boolean` (or a border-override class) using `--management-border`; default unchanged. Shared `FIELD_SURFACE` string untouched.

### 2.7 Skeleton / Empty additive neutral variant

**File:** `src/components/common/SharedComponents.tsx` (LoadingSkeleton / GridSkeleton / EmptyState)

- Add additive `variant?: 'premium' | 'management'` (default `'premium'`) that uses `--management-surface`/`--management-border`/`--management-shadow` instead of the gold `GOLD_SURFACE` + `shadow-premium-card`/`shadow-premium-carved` (`SharedComponents.tsx:17,35,59,140`). `GOLD_SURFACE` stays for premium consumers.
- Management pages pass `variant="management"` for their loading/empty states.

### 2.8 Modal / Toast / Selection / Menu additive re-anchoring

| Component | File (line) | Amber source today | Additive change (proposed) |
|---|---|---|---|
| AdminModal panel | `AdminModal.tsx:82,120` | `bg-card-bg` parchment + `ancient-overlay` + `--border-subtle` gold-tint | Add `management?: boolean` → `bg-[var(--management-surface)] border-[var(--management-border)]`; drop `ancient-overlay` only in the management branch |
| Toast panel | `useToast.tsx:52` | `bg-card-bg` parchment | Add `management?: boolean` (via a prop or theme hook) → `bg-[var(--management-surface)]`; Status hue borders unchanged |
| SelectionContainer | `AntigravityLayout.tsx:60-67` | `selection-surface` gold + `--card-premium-border` (Navigation family) | **Highest-touch (R-8).** Additive `variant?: 'premium'\|'management'`; management variant uses `--management-surface`/`--management-border`; gold retained as active-state accent. Navigation-family consumers unchanged |
| Menu panel | `Menu.tsx:275` | `bg-[var(--surface-floating)]` (`#FFF8E7` light warm) + `--border-subtle` | Add additive panel-surface variant via `--management-*`; default unchanged |

---

## 3. Step 2 — Frozen-Component Compatibility (per change)

| # | Change | Frozen entity | Freeze rule | Compatibility verdict |
|---|---|---|---|---|
| C-1 | New `--management-*` tokens | token block (no freeze) | additive block; no existing token mutated | ✅ Safe |
| C-2 | `Card` `management` variant | DS-001 Card | new variants allowed; existing variants pixel-identical | ✅ Safe (additive entry in `variantClasses` + `defaultPaddingMap`) |
| C-3 | `CollectionCard` `management` variant | CollectionCard v1.1 | additive mapping entry | ✅ Safe |
| C-4 | `CollectionToolbar` `variant="management"` prop | CollectionToolbar 3.2.2 | default render unchanged; additive prop | ✅ Safe |
| C-5 | `Button` management prop/variants | DS-002 Button | additive class selection; existing variants unchanged | ✅ Safe |
| C-6 | `CollectionFilter` management prop | CollectionFilter 3.2.4 | default trigger unchanged; additive prop | ✅ Safe |
| C-7 | `Input` management prop | DS-003 Input | default unchanged; additive border override | ✅ Safe |
| C-8 | Skeleton/Empty `variant="management"` | SharedComponents | additive variant; `GOLD_SURFACE` retained | ✅ Safe |
| C-9 | AdminModal/Toast/Selection/Menu management props | AdminModal (2A.8), SelectionContainer (DS-012), Menu | default renders unchanged; additive branches | ✅ Safe (Selection = highest-touch; Navigation-family consumers unchanged) |

**Overall:** every change is an **additive branch on an existing component or a new token/variant entry**. No frozen render is modified. Full audit evidence in `FOUNDATION_MANAGEMENT_SURFACE_COMPONENT_AUDIT.md`.

---

## 4. Step 3 — Verification Gate (per component, before acceptance)

`FOUNDATION_GOVERNANCE.md` Verification Rules — **build success alone is never acceptance**:

- ✓ Light Mode (neutral family) · ✓ Dark Mode (pixel-identical to certified state)
- ✓ Hover · ✓ Focus · ✓ Disabled · ✓ Responsive · ✓ Accessibility
- ✓ Build (`npm run build`) · ✓ TypeScript (`npx tsc -b`) · ✓ Lint frozen baseline, zero new
- ✓ Zero-diff re-audit of existing variants/renders (freeze register compliance)
- ✓ Grep gate: no `stat-card-surface`/`card-premium-border`/`border-gold`/`shadow-premium-card`/`--card-3d-shadow` in the new management recipe strings

---

## 5. Step 4 — Sequence

| Phase step | Work | Gate |
|---|---|---|
| F1 | `--management-*` token block in `themes.css` | token review (light+dark table) |
| F2 | `Card` `management` variant (+ export `MANAGEMENT_SURFACE` const) | zero-diff on existing variants |
| F3 | `CollectionCard` `management` mapping | zero-diff on existing mappings |
| F4 | `CollectionToolbar` `variant="management"` | default render unchanged |
| F5 | `Button` management primary/secondary | existing variants unchanged |
| F6 | `CollectionFilter` + `Input` management props | defaults unchanged |
| F7 | Skeleton/Empty `variant="management"` | `GOLD_SURFACE` retained |
| F8 | Modal/Toast/Selection/Menu management branches | defaults unchanged (Selection R-8 review) |
| F9 | Freeze-register + verification certification | full gate (§3) |

Each step is additive and independently revertible (remove the new branch/variant; existing renders unaffected).

---

## 6. Step 5 — What Happens Next (not in this phase)

1. **This plan is presented for approval.** Approval authorizes the Foundation implementation (F1–F9) only.
2. **Rule 12 Standard amendment** (separate D-series decision) — premium family → Management Surface Family.
3. Foundation implementation phase executes F1–F9, each gated.
4. **P3 — Admin Users validation page** migrates (uses `management` variants + props), certified against the 16-point Certification Standard.
5. **P4 — repository-wide migration** (Questions → Students → Exams → Sub Admins → Leaderboard → future pages) → repository certification.

---

## 7. Status Declaration

- This document is an **implementation plan** for the approved (D-142) direction.
- **Zero code, zero tokens, zero variants, zero component/theme/page changes** were made in this planning phase.
- Nothing in this document authorizes implementation; it is presented at the approval gate for the Foundation implementation phase.
