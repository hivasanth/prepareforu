# Phase 3.6 — Golden Management Page Audit (Admin Questions)

**Status:** 🔍 **AUDIT COMPLETE — DOCUMENTATION ONLY** (no implementation)
**Page audited:** `src/pages/admin/AdminQuestions.tsx` + `src/components/admin/questions/**`
**Date:** 2026-08-03
**Purpose:** Define the Admin Questions page as the permanent structural blueprint for every management page (Admin Users, Admin Students, Admin Exams, Admin Sub Admins, future pages). This audit answers **why** the page feels visually cleaner — not color-by-color, but by hierarchy, spacing, composition, ownership, and layout philosophy.

> **SUPERSEDED BY (Phase 3.6A, D-133):** this audit is **retained as history**. The repository reference is now the **Management Page Standard** (`docs/design-system/MANAGEMENT_PAGE_STANDARD.md`) + **Management Page Certification Standard** (`docs/certification/MANAGEMENT_PAGE_CERTIFICATION_STANDARD.md`). Admin Questions is the **first implementation** of that Standard, not the "golden page". Future audits compare against the Standard, never against this page.

> **Scope note:** this audit reflects the **current** implementation. The earlier `ADMIN_QUESTIONS_PAGE_AUDIT.md` (Phase 3.1) predates the CollectionCard migration; the Questions page now renders one `CollectionCard` per row (no `DataGrid`). This document supersedes the structure sections of that audit.
>
> **No migration, refactor, rewrite, deletion, or visual change was performed during this phase.**

---

# Step 1 — Page Structure

## 1.1 Major surfaces

```
Page (AdminQuestions — pure composition root, no business logic)
│
├─ PageContainer                          ← shell: max-w-[1280px], page padding
│   └─ H1 sr-only "Manage Questions"      ← screen-reader heading only
│
├─ Stack gap="lg"                         ← vertical section rhythm (24px)
│   │
│   ├─ SectionReveal                      ← entrance animation only
│   │   └─ AdminSelectionTabs             ← EXAM / PAPER / SUBJECT context selection
│   │       └─ SelectionContainer         ← owns its surface
│   │           └─ Tabs (bare, primary/secondary) × levels 1–4
│   │
│   ├─ [conditional] SectionReveal
│   │   └─ Alert variant="error"          ← page-level error surface
│   │
│   ├─ SectionReveal
│   │   └─ QuestionsActions               ← TOOLBAR (search + filter + actions)
│   │       └─ CollectionToolbar          ← owns its surface
│   │           ├─ Input (search) + CollectionFilter (difficulty)
│   │           └─ Button Bulk Upload + Button Add Question
│   │
│   ├─ SectionReveal (delay=0.1)
│   │   └─ div aria-live="polite"         ← semantics only, no visuals
│   │       └─ QuestionsTable
│   │           ├─ div.flex.flex-col.gap-6.animate-in   ← list rhythm + enter anim
│   │           │   ├─ CollectionHeader   ← select-all + range (text only, no surface)
│   │           │   ├─ div.flex.flex-col.gap-3          ← gap-only list wrapper
│   │           │   │   └─ CollectionCard layout="row" variant="premium" padding={16} × N
│   │           │   └─ Pagination         ← text + prev/next (no surface)
│   │           └─ [empty] EmptyState     ← page-level empty surface
│   │
│   └─ BulkActionBar                      ← fixed bottom multi-select bar (z-100)
│
├─ Suspense
│   ├─ SingleQuestionModal (lazy)         ← AdminModal (view / add / edit)
│   └─ BulkUploadModal (lazy)             ← AdminModal
├─ ConfirmModal                           ← delete confirmation (AdminModal)
└─ ToastContainer                         ← fixed bottom-right (z-99999)
```

## 1.2 Key structural facts

| # | Surface | Implementation | Location |
|---|---|---|---|
| 1 | Page scaffold | `PageContainer` → `Stack gap="lg"` → `H1 sr-only` | `AdminQuestions.tsx:37-40` |
| 2 | Selection container | `AdminSelectionTabs` → `SelectionContainer` + bare `Tabs` | `AdminSelectionTabs.tsx:251-359` |
| 3 | Collection toolbar | `QuestionsActions` → `CollectionToolbar` | `QuestionsActions.tsx:22-80` |
| 4 | Collection header | `CollectionHeader` (select-all + "Showing X–Y of Z") | `QuestionsTable.tsx:64-70` |
| 5 | Collection list | `div.flex.flex-col.gap-3` (gap-only wrapper) | `QuestionsTable.tsx:73` |
| 6 | Collection item | `CollectionCard` `layout="row"` `variant="premium"` `padding={16}` | `QuestionsTable.tsx:79-107` |
| 7 | Action area | `ActionsCell` → three certified `IconButton`s | `QuestionsTableComponents.tsx:6-44` |
| 8 | Pagination | `Pagination` (`role="navigation"`) | `QuestionsTable.tsx:112-119` |
| 9 | Bulk action bar | `BulkActionBar` (fixed, `z-[100]`) | `AdminQuestions.tsx:104-108` |
| 10 | Modal | `AdminModal` (overlay + dialog + focus trap) | `AdminModal.tsx:71-128` |
| 11 | Toast | `ToastContainer` (fixed bottom-right) | `useToast.tsx:41-61` |

## 1.3 Page-role rule

`AdminQuestions.tsx` is a **pure composition root** (README rule): every presentational component is memoized, the page owns no local business logic, and every visible surface is a certified shared primitive. The page only wires state (`useAdminQuestions`) to props.

---

# Step 2 — Visual Layer Hierarchy

## 2.1 Layer stack (top → bottom)

```
Application shell (AdminLayout → SidebarLayout, global nav + page chrome)
│
├─ Page (PageContainer: width + padding, NO surface)
│   ├─ Selection Container (surface: SelectionContainer)
│   ├─ Toolbar (surface: CollectionToolbar)
│   ├─ Collection Header (text-only, NO surface)
│   ├─ Collection Item (surface: CollectionCard premium)
│   ├─ Action Area (nested in item, surface: IconButton)
│   ├─ Pagination (text + controls, NO surface)
│   ├─ Empty State (surface, GOLD_SURFACE)
│   ├─ Modal (surface: AdminModal + overlay)
│   └─ Toast (surface: ToastContainer)
└─ Bulk Action Bar (fixed overlay, surface)
```

## 2.2 Layer registry

| Layer | Owner | Consumer | Purpose | Reusable? |
|---|---|---|---|---|
| Application | `AdminLayout` / `SidebarLayout` | every page | global navigation + page chrome | shared |
| Page | `PageContainer` | page | shell, max-width, responsive padding | shared |
| Selection container | `SelectionContainer` | `AdminSelectionTabs` | owns cross-section context surface | shared |
| Toolbar | `CollectionToolbar` | `QuestionsActions` | search / filter / primary actions surface | shared |
| Collection header | `CollectionHeader` | `QuestionsTable` | select-all + range summary (no surface) | shared |
| Collection item | `CollectionCard` | `QuestionsTable` | one item per card, premium row | shared |
| Action area | `IconButton` | `ActionsCell` | per-row view/edit/delete affordances | shared (composed per page) |
| Pagination | `Pagination` | `QuestionsTable` | bounded prev/next + range | shared |
| Modal | `AdminModal` | `SingleQuestionModal`, `BulkUploadModal`, `ConfirmModal` | dialog + overlay + focus trap | shared |
| Toast | `ToastContainer` | page | transient feedback | shared |
| Bulk action | `BulkActionBar` | page | multi-select delete/cancel | feature-local (1 consumer) |

## 2.3 Layer rules

- **Every visible layer has exactly one owner.** No layer is styled by two components.
- **Surfaces appear exactly once per layer** — a layer either owns a surface or is text/layout only. `CollectionHeader` and `Pagination` deliberately own **no** surface; the eye rests between the toolbar and card surfaces.
- The page owns **none** of these layers' visuals — only order, data, and state.

---

# Step 3 — Collection Architecture

## 3.1 The Questions row pipeline

```
Row (one Question)
│
├─ Leading      → SelectionCheckbox + PremiumIconContainer (serial number)
├─ Primary      → CollectionCard title slot (question text, line-clamp-2, h3)
├─ Metadata     → (unused for Questions — difficulty is the trailing status)
├─ Status       → DifficultyBadge → CollectionCard trailing slot
├─ Actions      → ActionsCell (view / edit / delete) → CollectionCard actions slot
└─ Selection    → CollectionHeader (select-all) + per-row SelectionCheckbox
```

## 3.2 Zone / component / owner matrix

| Zone | Component | Owner |
|---|---|---|
| Selection (per row) | `SelectionCheckbox` (wraps certified `Checkbox`) | page (QuestionsTable) — state in `useAdminQuestions` |
| Selection (header) | `CollectionHeader` select-all | page (QuestionsTable) — `allOnPageSelected` logic |
| Leading index | `PremiumIconContainer` (serial `sr`) | page (QuestionsTable) — content passed in |
| Primary content | `CollectionCard` `title` slot, `titleAs="h3"`, `line-clamp-2` | `CollectionCard` renders; content owned by page |
| Status | `DifficultyBadge` (`easy/success`, `medium/warning`, `hard/danger`) | page — feature-local badge |
| Actions | `ActionsCell` (Eye / PenSquare / Trash2 `IconButton`s) | page — feature-local composition of shared `IconButton` |
| Card surface + selected tint | `CollectionCard` (`selected` → `!border-primary !bg-primary/5`) | `CollectionCard` (presentation only) |

## 3.3 The `CollectionCard` contract (from `CollectionCard.tsx`)

- `layout="row"` — horizontal premium row (used here); `layout="grid"` — vertical card.
- `variant="premium"` maps to certified surface `premium-dark-neutral` (`PREMIUM_SURFACE` recipe).
- `padding={16}` overrides the default `p-4 md:p-5` to management-row density.
- Slots: `leading`, `header`, `title`, `subtitle`, `metadata`, `content`, `footer`, `actions`, `trailing`.
- `selected` is **presentation-only** — selection logic stays in the page.
- Row anatomy internal (`rowBody`): leading → content (title/subtitle/metadata) flex row, `sm:flex-row`, `gap-2.5 sm:gap-3`; trailing + actions right-aligned, `gap-2`.
- Card owns keyboard activation (`onClick` → `role="button"`, Enter/Space), disabled, loading skeleton.

---

# Step 4 — Collection Item Anatomy

## 4.1 One Question item, decomposed

```
┌ CollectionCard (layout=row, variant=premium, padding=16) ────────────────┐
│                                                                          │
│  [SelectionCheckbox] [PremiumIconContainer "12"] │ Question text (h3)    │
│                                                    line-clamp-2          │
│                                                                          │
│                                                   [DifficultyBadge]  [Eye][Edit][Delete]
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

| Piece | Component | Reusable? | Belongs to |
|---|---|---|---|
| Selection checkbox | `SelectionCheckbox` → `Checkbox` | **shared** | page (state) + CollectionCard (selected visual) |
| Serial number badge | `PremiumIconContainer` (children = `sr`) | **shared** container; content = page | page |
| Question text | `CollectionCard` `title` slot (`h3`, `line-clamp-2`, `title` attr) | **shared** slot | CollectionCard (renders) + page (content) |
| Difficulty | `DifficultyBadge` | feature-local | page |
| Actions | `ActionsCell` (`IconButton` ×3) | shared primitives, feature-local composition | page |

## 4.2 Responsibility split

- **Belongs to `CollectionCard`:** surface, border, radius, shadow, hover lift, selected tint, disabled, keyboard activation, loading skeleton, title semantics (`titleAs`), row/grid arrangement, gap rhythm between its slots.
- **Belongs to the page:** what goes in each slot (leading/title/trailing/actions), selection state, serial number, row ordering, handlers.
- **Shared reusable primitives:** `SelectionCheckbox`, `PremiumIconContainer`, `IconButton`, `CollectionCard`, `CollectionHeader`, `Pagination`, `CollectionFilter`, `CollectionToolbar`, `Button`, `Badge`, `Input`, `AdminModal`, `EmptyState`.
- **Feature-local:** `DifficultyBadge`, `ActionsCell`, `QuestionsActions`, `QuestionsTable`, `SingleQuestionModal`, `BulkUploadModal`, `QuestionForm`.

---

# Step 5 — Container Hierarchy

## 5.1 Container inventory (Questions page)

| Container | Purpose | Necessary? | Owns visuals? |
|---|---|---|---|
| `PageContainer` | shell: max-width + page padding | yes | no (width/padding only) |
| `Stack gap="lg"` | vertical section rhythm (24px) | yes | spacing only |
| `SectionReveal` ×3 | entrance animation (opacity/y) | yes | animation only |
| `div.relative.w-full` | positioning context for selection | yes | no |
| `SelectionContainer` | cross-section context surface | yes | **yes** |
| `CollectionToolbar` | toolbar surface | yes | **yes** |
| `div.flex.flex-col.gap-6.animate-in` | list rhythm + enter animation | yes | spacing/animation only |
| `CollectionHeader` root | select-all + range alignment | yes | no |
| `div.flex.flex-col.gap-3` | gap-only list (between items) | yes | spacing only |
| `Card` (inside CollectionCard) | item surface | yes | **yes** |
| `Pagination` root | controls + range layout | yes | no |
| `div aria-live` | screen-reader region | yes | no (semantics) |
| `EmptyState` | empty feedback surface | conditional | **yes** |

## 5.2 Container rules

1. **Every container has exactly one purpose** — surface, spacing, animation, or semantics. None do double duty.
2. The **gap-only list wrapper** (`div.flex.flex-col.gap-3`) is deliberately minimal: the item is the card itself, never wrapped in another card.
3. There is **no outer container that owns both a surface and child surfaces.** `Stack` never carries a surface; `CollectionCard` never wraps other cards.
4. All animation containers (`SectionReveal`) are visual-free and sit **above** surfaces, not inside them.

---

# Step 6 — Spacing Rhythm

## 6.1 Token basis

Spacing is expressed in the certified `--space-*` scale (`themes.css:320-332`): 0=0, 1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64, 20=80, 24=96. All gaps below resolve from this scale.

## 6.2 Spacing map

| Location | Value | Token | Evidence |
|---|---|---|---|
| Page vertical padding | `py-6 md:py-10` | `--space-6` / `--space-10` | `PageContainer` |
| Page horizontal padding | `px-2 … xl:px-8` | 8…32px | `PageContainer` |
| Between sections | `Stack gap="lg"` | **24px** `--space-6` | `AdminQuestions.tsx:40` |
| Selection internal padding | `p-3` | 12px `--space-3` | `SelectionContainer` |
| Selection sub-level gap | `gap-3`, `pt-3`, divider `h-px` | 12px / 12px / 1px | `AdminSelectionTabs.tsx:282-389` |
| Toolbar padding | `p-3 md:p-4` | 12 / 16px | `CollectionToolbar` |
| Toolbar group gap | `gap-3` | 12px | `QuestionsActions.tsx:26,54` |
| Toolbar ↔ header | list wrapper `gap-6` | **24px** | `QuestionsTable.tsx:62` |
| Header ↔ first item | list wrapper `gap-6` | **24px** | `QuestionsTable.tsx:62` |
| Between items | `gap-3` | **12px** | `QuestionsTable.tsx:73` |
| Card internal padding | `padding={16}` | 16px `--space-4` | `CollectionCard` |
| Leading ↔ title | `gap-2.5 sm:gap-3` | 10 / 12px | `CollectionCard` rowBody |
| Title ↔ subtitle/metadata | `gap-0.5` / `gap-2` | 2 / 8px | `CollectionCard` |
| Selection checkbox ↔ index badge | `gap-2` | 8px | `QuestionsTable.tsx:87` |
| Title ↔ trailing/actions | `gap-3` (justify-between) | 12px | `CollectionCard` |
| Actions between buttons | `gap-2` | 8px | `ActionsCell` |
| List ↔ pagination | list wrapper `gap-6` | **24px** | `QuestionsTable.tsx:62` |
| Pagination internal | `gap-4`, `px-2` | 16 / 8px | `Pagination` |
| Empty state | `p-12`, `gap-2`, `rounded-[32px]` | 48 / 8px | `EmptyState` |
| Modal header/body | `p-6 sm:p-8` | 24 / 32px | `AdminModal` |

## 6.3 Rhythm summary

- **Three beats:** 24px between sections/layers, 12px within a layer's item stack, 8px within a row's element group. This constant 24 → 12 → 8 ladder is the page's internal meter.
- **One surface family** shares one padding dialect (toolbar 12/16, cards 16) so whitespace reads as one system instead of per-component guesses.
- Density is intentional: management rows are `16px` padding + `12px` gutter (vs dashboard cards `p-4 md:p-5` + `gap-4`), which is what makes the page feel tighter and "cleaner" than the Overview cards.

---

# Step 7 — Visual Ownership

## 7.1 Who owns what

| Surface | Owner | Owns |
|---|---|---|
| Selection container | `SelectionContainer` | `rounded-2xl`, `shadow-card-premium`, `selection-surface`, `border-[1.8px] border-card-premium-border`, `-translate-y-0.5`, `p-3` |
| Toolbar | `CollectionToolbar` | `PREMIUM_SURFACE` (bg/border/shadow), `PREMIUM_SURFACE_HOVER`, `PREMIUM_LIGHT_OVERRIDES`, `rounded-2xl`, `p-3 md:p-4` |
| Collection item | `CollectionCard` → `Card` | background (`premium-dark-neutral`), border `1.8px`, radius `rounded-2xl`, shadow `card-shadow`→`card-premium`, hover `-translate-y-0.5`, selected tint, disabled, keyboard activation, loading skeleton |
| Icon buttons | `IconButton` | size, border, hover color per intent (`primary`/`secondary`/`danger`) |
| Status badge | `DifficultyBadge` → `Badge` | variant hues (success/warning/danger) |
| Empty state | `EmptyState` | `GOLD_SURFACE`, radius, shadow |
| Modal | `AdminModal` | overlay blur, dialog surface, focus trap, sticky footer |
| Toast | `ToastContainer` | surface, status border, slide-in animation (keyframes in `index.css`) |

## 7.2 What the Questions page owns (and only this)

- **Order** of sections · **data** passed into slots · **composition** of slot content · **selection state** (`selectedIds`) · **modal state** · **serial number** derivation · **handlers**.

> **Rule (enforced in this page): pages must not own visuals.** Every style token on the Questions page appears inside a certified shared primitive; the page's own JSX contains only `sr-only`, `aria-*`, `line-clamp-2`, `gap-*`, and `w-full`/`shrink-0` composition classes.

## 7.3 Ownership invariants

1. One visual owner per surface — no two components write conflicting classes to the same node.
2. Feature components may compose shared primitives but may not restyle them (`ActionsCell` only picks `variant`/`size`/`aria-label`).
3. Surfaces are never re-specified by consumers; intent is expressed via props (`variant`, `padding`, `selected`).

---

# Step 8 — Reusable Components

## 8.1 Inventory

| Component | Scope | Used by Questions |
|---|---|---|
| `PageContainer` | shared | yes |
| `Stack` / `Grid` | shared | yes |
| `SectionReveal` | shared | yes |
| `SelectionContainer` | shared | via `AdminSelectionTabs` |
| `AdminSelectionTabs` | shared (every admin page) | yes |
| `Tabs` | shared | via `AdminSelectionTabs` |
| `CollectionToolbar` | shared | yes |
| `CollectionHeader` | shared | yes |
| `SelectionCheckbox` | shared | yes |
| `PremiumIconContainer` | shared | yes |
| `CollectionCard` | shared (Foundation composite) | yes |
| `CollectionFilter` | shared | yes |
| `Pagination` | shared | yes |
| `Input` | shared | yes |
| `Button` / `IconButton` | shared | yes |
| `Badge` | shared | via `DifficultyBadge` |
| `AdminModal` / `ConfirmModal` | shared | yes |
| `EmptyState` / `Alert` | shared | yes |
| `ToastContainer` | shared | yes |
| `Avatar` | shared | no (future Users) |
| `AdminText` / `Label` / `Caption` | shared | via primitives |
| `GridSkeleton` / `LoadingSkeleton` | shared | yes |
| `BulkActionBar` | shared admin/common (1 consumer) | yes |
| `DifficultyBadge` | **page-specific** | yes |
| `ActionsCell` | **page-specific** | yes |
| `QuestionsActions` | **page-specific** | yes |
| `QuestionsTable` | **page-specific** | yes |
| `SingleQuestionModal` / `BulkUploadModal` / `QuestionForm` | **page-specific** | yes |

## 8.2 Sharing rule

- **Shared** = used (or ready to be used) by 2+ pages with no page-specific styling.
- **Page-specific** = thin composition wrappers over shared primitives (`ActionsCell`, `QuestionsActions`); they add no surface — they only choose props and order.
- Nothing on this page creates a competing primitive; the only feature-owned components are compositions of certified ones.

---

# Step 9 — Flow Audit

## 9.1 Page flow

```
Mounted
  │
  ├─ fetch (useAdminQuestions)          isLoading=true
  │   └─ Loading  → SelectionContainer renders (context stays usable)
  │                → QuestionsTable returns GridSkeleton (count=5, h=56, 1 col)
  │
  ├─ fetch success
  │   ├─ results > 0  → CollectionHeader + CollectionCard rows + Pagination
  │   └─ results = 0  → QuestionsTable returns null
  │                    → page renders EmptyState ("No Questions Found")
  │
  ├─ fetch failure                       error set
  │   └─ Error       → Alert variant="error" above toolbar (list may also be empty → EmptyState)
  │
  ├─ selection       → CollectionHeader select-all toggles page selection
  │                  → row SelectionCheckbox toggles one id
  │                  → BulkActionBar appears when selectedIds.length > 0
  │
  ├─ pagination      → Pagination prev/next (bounded by hasMore)
  │
  ├─ modal           → SingleQuestionModal (view/add/edit, lazy)
  │                  → BulkUploadModal (lazy)
  │                  → ConfirmModal (bulk delete)
  │
  └─ toast           → ToastContainer (success/error, bottom-right, z-99999)
```

## 9.2 State → surface mapping (uniform language)

| State | Surface | Same visual language? |
|---|---|---|
| Loading | `GridSkeleton` (`LoadingSkeleton` GOLD blocks) | yes — same skeleton recipe as all pages |
| Empty | `EmptyState` (`GOLD_SURFACE` + `shadow-premium-card`) | yes |
| Error | `Alert variant="error"` (certified) | yes |
| List | `CollectionCard` premium rows | yes — item surface family |
| Selection | `CollectionHeader` + `SelectionCheckbox` | yes |
| Pagination | `Pagination` text + `IconButton`s | yes |
| Modal | `AdminModal` (focus trap, overlay blur) | yes |
| Toast | `ToastContainer` status border | yes |

## 9.3 Flow invariants

1. The selection container stays mounted and interactive during loading/error/empty — context is never blanked.
2. Loading replaces **only the list layer**, never the toolbar or selection layers.
3. Empty and error are mutually exclusive by construction (empty renders only when `!isLoading && questions.length === 0`).
4. Every state is expressed through a certified primitive — no bespoke state styling.

---

# Step 10 — Visual Rules (permanent)

1. **One `CollectionCard` = one item.** The card is the item; never wrap list items in additional cards.
2. **No wrapper around list items** — the list is a gap-only flex column (`gap-3`).
3. **Toolbar is independent** — `CollectionToolbar` owns its own surface; it is not nested inside a page card.
4. **Selection container is independent** — context selection gets its own surface above the toolbar.
5. **Header is independent** — `CollectionHeader` (select-all + range) is text-only and owns no surface.
6. **Pagination is independent** — text + controls, no surface, no border wrapper.
7. **No nested cards / no nested surfaces.** A surface never contains another surface of the same family.
8. **One visual owner per surface.** Intent is passed via props, never restyled by consumers.
9. **Pages do not own visuals.** Pages own order, data, composition, and state only.
10. **Every container has exactly one purpose** — surface, spacing, animation, or semantics.
11. **Row density is fixed** — `padding={16}`, gutter `gap-3`, element group `gap-2`, title `text-[13px]/md:text-[14px]` bold.
12. **Selection state lives in the page** — `CollectionCard` `selected` is presentation-only.
13. **All status is trailing, all actions are always-visible and right-aligned.**
14. **The 24 → 12 → 8 spacing ladder** is the page's meter: 24px between layers, 12px within a layer, 8px within a row group.
15. **All surfaces belong to the certified premium family** (same bg/border/radius/shadow recipe), so the toolbar and the cards read as one system.

---

# Summary — Why the page reads as "cleaner"

| Factor | Questions page (golden) | Counter-example risk elsewhere |
|---|---|---|
| Hierarchy | 6 distinct, independent layers (selection → toolbar → header → items → pagination → modal) | Nested surfaces collapse hierarchy into one heavy box |
| Spacing | Constant 24/12/8 ladder from one token scale | Ad-hoc px values break rhythm |
| Composition | Thin feature wrappers over shared primitives; slots, not bespoke layout | Duplicated ad-hoc layouts per page |
| Reusable components | ~25 shared primitives; page-specific code is composition-only | Page-local restyling of common patterns |
| Ownership | One visual owner per surface; pages own no visuals | Consumers restyling shared nodes |
| Layout philosophy | Independent surfaces, no nesting, one card per item, surfaces only where semantics need them | One outer card wrapping toolbar + list + pagination |

---

# Success Criteria

| Criterion | Met |
|---|---|
| Every visible layer has exactly one owner | ✅ (Step 2.2, Step 7) |
| Every reusable component is identified | ✅ (Step 8.1) |
| Every wrapper has a purpose | ✅ (Step 5.1) |
| CollectionCard responsibilities documented | ✅ (Step 3.3, Step 4.2) |
| Questions page = permanent blueprint for all management pages | ✅ (Step 10 rules + Step 11 blueprint) |
| Admin Users migration blueprint written without implementation code | ✅ → `ADMIN_USERS_LAYOUT_MIGRATION_BLUEPRINT.md` |
