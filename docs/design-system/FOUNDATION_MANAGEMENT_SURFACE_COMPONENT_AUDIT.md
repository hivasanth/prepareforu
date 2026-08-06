# Foundation Management Surface — Affected-Component Audit (Planning Phase)

**Phase 3.8.1 — Foundation Implementation Planning (per D-142 next-phase directive)**
**Status:** AUDIT ONLY — **no code, token, variant, component, theme, or page changes.**
**Purpose:** Step 1 of the approved next phase — audit every affected Foundation component (where the amber language lives and the exact additive hook), and Step 3 — assess compatibility with frozen components.
**Related:** `FOUNDATION_MANAGEMENT_SURFACE_IMPLEMENTATION_PLAN.md` (the plan this audit feeds), `MANAGEMENT_SURFACE_*` (Phase 3.8 set), Phase 3.7 audit set (`ADMIN_USERS_*`).

---

## 1. Method

Every Foundation component in the Management Page Standard skeleton was read (`AntigravityCard`, `CollectionCard`, `AntigravityLayout`, `AntigravityButton`, `AntigravityForm`, `CollectionFilter`, `SharedComponents`, `AdminModal`, `Menu`, `useToast`, `AntigravityData` for Tabs) and resolved to its light-mode token source. For each: current amber source (File:Line · Token), the additive hook, and the freeze verdict.

---

## 2. Affected-Component Audit

| # | Component | File (amber source) | Amber source in light | Additive hook (proposed) | Frozen? | Verdict |
|---|---|---|---|---|---|---|
| A-1 | `Card` | `AntigravityCard.tsx:25,30,33-34` | `PREMIUM_LIGHT_OVERRIDES` = `light:stat-card-surface light:shadow-premium-card` on `default`/`premium-neutral`/`premium-dark-neutral`; gold borders/shadows | new `management` variant (no `PREMIUM_LIGHT_OVERRIDES`) | **DS-001 FROZEN** | ✅ additive variant allowed; existing variants untouched |
| A-2 | `CollectionCard` | `CollectionCard.tsx:59-68` | `premium → premium-dark-neutral` delegates to amber `Card` | new `management` variant in `VARIANT_MAP` → `Card variant="management"` | **v1.1 FROZEN** | ✅ additive mapping |
| A-3 | `CollectionToolbar` | `AntigravityLayout.tsx:217-221` | `PREMIUM_SURFACE` + `PREMIUM_LIGHT_OVERRIDES` (parchment + gold gradient + carved) | additive `variant="management"` prop (default `'premium'`) | **Phase 3.2.2 FROZEN** | ✅ default render unchanged |
| A-4 | `FilterBar` | `AntigravityLayout.tsx:224` | deprecated alias of `CollectionToolbar` | inherits A-3 behavior | deprecated alias | ✅ |
| A-5 | `Button` (primary/secondary) | `AntigravityButton.tsx:36-46,70-75` | light primary forest+gold+brown (`--material-button-primary-*`, `:1099-1102`); secondary parchment+gold (`--button-surface-secondary`/`--button-border-secondary`/`--button-shadow-secondary`, `:1232-1237`) | additive `management` prop/branch with `--management-*` values | **DS-002 FROZEN** | ✅ existing variants unchanged |
| A-6 | `Button` (success/danger rows) | `AntigravityButton.tsx:47-50` | status-hued (green/red) — **amber-free** | none (stay) | DS-002 | ✅ no change |
| A-7 | `Input` | `AntigravityForm.tsx:7` | `FIELD_SURFACE = bg-input-bg border-input-border`; `--input-border = --border-subtle` gold-tint (`:937/:724`) | additive `management` border override → `--management-border` | DS-003 (Input system) | ✅ default unchanged |
| A-8 | `CollectionFilter` trigger | `CollectionFilter.tsx:54-63` | `--filter-surface = --bg-surface` parchment, `--filter-border = --border-subtle` gold-tint, `--filter-shadow = --card-3d-shadow` (`:978-981,1240-1241`) | additive `management` prop switching to `--management-*` | **Phase 3.2.4 FROZEN** | ✅ default unchanged |
| A-9 | `CollectionFilter` panel | `Menu.tsx:275` | `bg-[var(--surface-floating)]` (`#FFF8E7` warm light) + `border-border-subtle` + `ancient-overlay` | additive panel-surface variant (management) | Menu (DS-009 family) | ✅ default unchanged |
| A-10 | `SelectionContainer` | `AntigravityLayout.tsx:60-67` | `selection-surface` gold + `--card-premium-border` + `--material-card-premium-shadow` (Navigation family) | additive `variant="management"`; gold → active-state accent only | **DS-012 FROZEN** (Navigation) | ✅ additive; **highest-touch (R-8)** — Navigation-family consumers unchanged |
| A-11 | `Tabs` | `AntigravityData.tsx:100,125` | light `--material-tab-track-surface` = `--gradient-header` gold (`:1116-1118`) | management consumption only (via A-10 context); Tabs default unchanged | DS-011 FROZEN | ✅ no change this phase (review in F8) |
| A-12 | `LoadingSkeleton` / `GridSkeleton` | `SharedComponents.tsx:14-53` | `GOLD_SURFACE` + `shadow-premium-carved` (gold) | additive `variant="management"` (neutral) | SharedComponents | ✅ `GOLD_SURFACE` retained |
| A-13 | `EmptyState` | `SharedComponents.tsx:126-155` | `GOLD_SURFACE` + `shadow-premium-card` (gold) | additive `variant="management"` | SharedComponents | ✅ |
| A-14 | `AdminModal` panel | `AdminModal.tsx:82,120` | `bg-card-bg` parchment + `ancient-overlay` + `--border-subtle` gold-tint | additive `management` branch → `--management-surface`/`--management-border`; drop `ancient-overlay` in branch only | AdminModal (Phase 2A.8) | ✅ default unchanged |
| A-15 | `ConfirmModal` | `SharedComponents.tsx:170-225` | renders via `AdminModal` + amber Cancel/Confirm buttons | inherits A-14 (panel) + A-5 (buttons) | SharedComponents | ✅ additive |
| A-16 | `Toast` | `useToast.tsx:52` | `bg-card-bg` parchment panel + `--border-subtle`; Status hue borders correct | additive `management` panel surface (Status hues unchanged) | useToast | ✅ |
| A-17 | `StatePanel` | `AntigravityLayout.tsx:50-58` | `GOLD_SURFACE` + `shadow-premium-card` | not on the Standard skeleton; out of scope unless a management page uses it | — | ⏸️ out of scope (documented) |
| A-18 | Theme tokens (light) | `themes.css:692,693,724,757,805,806,928,1224,1225,1229,1232-1241,1245-1247` | `--bg-app` cream, `--bg-surface` parchment, `--border-subtle` gold-tint, carved shadows, `--border-gold`, `--surface-stat`, `--material-button-primary-*` | new additive `--management-*` block; **no existing token touched** | token block (no freeze) | ✅ additive |

---

## 3. Frozen-Component Compatibility Assessment

| Freeze | Entity | Change type | Risk | Requirement |
|---|---|---|---|---|
| DS-001 | Card | additive variant | Low | new `variantClasses` + `defaultPaddingMap` entries only; existing strings byte-identical |
| DS-002 | Button | additive prop/branch | Low | existing `lightVariants`/`darkVariants` untouched; management class strings appended |
| DS-003 | Input | additive border override | Low | `FIELD_SURFACE` untouched; prop-level override |
| DS-009 | Menu | additive panel variant | Low | default panel string unchanged |
| DS-011 | Tabs | none this phase | Low | untouched |
| DS-012 | SelectionContainer | additive variant | **Medium** | Navigation-family consumers unchanged; gold→accent only in management branch |
| CollectionCard v1.1 | CollectionCard | additive mapping | Low | `VARIANT_MAP` entry appended |
| CollectionToolbar 3.2.2 | CollectionToolbar | additive prop | Low | default render identical |
| CollectionFilter 3.2.4 | CollectionFilter | additive prop | Low | default trigger identical |
| Phase 2A.8 | AdminModal | additive branch | Low | default panel identical |
| Phase 2B composites (ExamCard/AttemptCard/TopicCard) | — | **not touched** | — | premium/Exam family stays gold |

**Conclusion:** no frozen render is modified by any proposed change. The entire plan is additive branches on existing components plus one new token namespace and one new `Card`/`CollectionCard` variant pair. `PREMIUM_LIGHT_OVERRIDES`, `GOLD_SURFACE`, and all existing variant strings remain byte-identical.

---

## 4. Non-Consumer / Scope Boundaries

| Out of scope | Reason |
|---|---|
| Exam/premium gold family (TopicCard/ExamCard/AttemptCard, dashboard) | D-142: Ancient/Amber reserved for legacy/Exam experiences; untouched |
| Auth family | D-142: Authentication family independent |
| Navigation family beyond management-scoped selection | D-121 documented inheritance; only management branch changes |
| `StatePanel` | not on the Management Page Standard skeleton |
| Page migrations (Users/Questions/…) | P3/P4 in `MANAGEMENT_SURFACE_MIGRATION_STRATEGY.md`; after Foundation |
| Rule 12 Standard text amendment | separate D-series decision |

---

## 5. Audit Conclusion

- The amber language reaches management surfaces through **18 audited Foundation touchpoints** (A-1…A-18), all resolvable by an **additive** hook.
- **Zero frozen renders require modification.** Every change is a new token, new variant, or new default-preserving prop branch.
- The single highest-risk item remains the **Navigation-family SelectionContainer** (A-10, R-8) — mitigated by scoping the neutral branch to management and keeping gold as an active-state accent.
- This audit feeds the additive implementation plan in `FOUNDATION_MANAGEMENT_SURFACE_IMPLEMENTATION_PLAN.md`. **No implementation is authorized by this document.**
