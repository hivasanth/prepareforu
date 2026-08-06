# MANAGEMENT PAGE STANDARD

**Status:** 🔒 **PERMANENT STANDARD — CERTIFIED (Phase 3.6A, D-133)** (2026-08-03)
**Authority:** The single architecture contract for every management (CRUD / list) page in the repository.
**Scope:** Admin Questions (first implementation), Admin Users, Admin Students, Admin Exams, Admin Sub Admins, Admin History, Leaderboards, Attempt History, Question Banks, and all future management pages.
**Governance:** Pages are **never** copied from other pages. Every management page is composed from this Standard + Foundation components. This Standard supersedes page-to-page reference; Admin Questions is now the **first implementation** of the Standard, not the reference.

---

# 1. Architecture — The Management Page Skeleton

Every management page follows this exact hierarchy. It is the permanent page architecture.

```
Management Page
│
├─ PageContainer              ← shell (width + page padding)
├─ Stack                      ← section rhythm (24px)
├─ Selection Layer            ← SelectionContainer (exam/paper/subject context)
├─ Toolbar Layer              ← CollectionToolbar (search + filter + primary actions)
├─ Collection Header          ← CollectionHeader (select-all + range)
├─ Collection List            ← one CollectionCard per entity
├─ Pagination                 ← Pagination (independent)
├─ Modal                      ← AdminModal (create/edit/view/confirm)
└─ Toast                      ← ToastContainer (feedback)
```

## 1.1 Canonical skeleton (implementation form)

```
<PageContainer>
  <H1 className="sr-only">…</H1>
  <Stack gap="lg">
    <SectionReveal>
      <SelectionContainer>… context selection (AdminSelectionTabs / Tabs) …</SelectionContainer>
    </SectionReveal>

    {error && <Alert variant="error">…</Alert>}

    <SectionReveal>
      <CollectionToolbar>… search Input + CollectionFilter + Buttons …</CollectionToolbar>
    </SectionReveal>

    <SectionReveal delay={0.1}>
      <div aria-live="polite">
        <CollectionHeader … />
        <div className="flex flex-col gap-3">       ← gap-only list wrapper
          <CollectionCard layout="row" variant="premium" padding={16} …>…</CollectionCard>
          …
        </div>
        <Pagination … />
        {empty && <EmptyState … />}
      </div>
    </SectionReveal>

    {selectionCount > 0 && <BulkActionBar … />}     ← only when bulk actions exist
  </Stack>

  <Suspense>
    <AdminModal … />                                 ← entity create/edit/view
  </Suspense>
  <ConfirmModal … />
  <ToastContainer … />
</PageContainer>
```

## 1.2 Layer contract

| Layer | Component | Owns surface? | Purpose |
|---|---|---|---|
| Page | `PageContainer` | no | shell, max-width `1280px`, responsive padding |
| Selection | `SelectionContainer` (+ `Tabs`) | **yes** | cross-section context (Exam/Paper/Subject) |
| Toolbar | `CollectionToolbar` | **yes** | search, filters, primary actions |
| Collection header | `CollectionHeader` | no | select-all + "Showing X–Y of Z" |
| Collection item | `CollectionCard` | **yes** | one entity per card |
| Pagination | `Pagination` | no | prev/next + range |
| Modal | `AdminModal` / `ConfirmModal` | **yes** | dialogs |
| Toast | `ToastContainer` | **yes** | feedback |

Rules:
- Every layer has **exactly one owner**.
- `SelectionContainer`, `CollectionToolbar`, and `Pagination` are **always independent** — never nested inside another surface.
- `CollectionHeader` and `Pagination` own **no** surface (text + controls only) — the eye rests between the toolbar and card surfaces.

---

# 2. Generic Collection Architecture

The collection architecture is **entity-agnostic**. `CollectionCard` must never know what entity it renders.

```
CollectionCard
│
├── Leading       ← identity / selection (SelectionCheckbox + Avatar / Number Badge / icon)
├── Primary       ← the headline (title slot, semantic heading)
├── Secondary     ← the sub-line (subtitle slot)
├── Metadata      ← chips / facts (metadata slot)
├── Status        ← right-aligned status (trailing slot)
└── Actions       ← always-visible right-aligned actions (actions slot)
```

Slot → prop mapping (row layout):

| Generic zone | CollectionCard prop | Notes |
|---|---|---|
| Leading | `leading` | composed by the page; `shrink-0` |
| Primary | `title` | rendered via `titleAs` semantic heading |
| Secondary | `subtitle` | under the headline |
| Metadata | `metadata` | wrapped token row |
| Status | `trailing` | right-aligned; the row's status chip/badge |
| Actions | `actions` | always-visible; certified `IconButton`/`Button` |

**CollectionCard owns:** arrangement, surface, selection tint, loading skeleton, keyboard activation, heading semantics.
**Pages own:** slot content, data, actions, state.
**Pages never style CollectionCard.**

---

# 3. Entity Mapping

Each management page maps its entity into the generic collection architecture. These mappings are the permanent contract per page (finalized in each page's own audit; proposed mappings below are the standard baseline).

## 3.1 Questions (Admin Questions — first implementation)

| Zone | Content |
|---|---|
| Leading | `SelectionCheckbox` + serial `PremiumIconContainer` (number) |
| Primary | Question text (`h3`, `line-clamp-2`) |
| Secondary | — |
| Metadata | Difficulty (`DifficultyBadge`) |
| Status | — |
| Actions | View, Edit, Delete (`ActionsCell` — certified `IconButton`s) |

*Implementation note: Difficulty currently renders via the `trailing` slot (right-aligned); it is the row's status chip and reads as the trailing status zone. Acceptable placement; both `metadata` and `trailing` are valid hosts for chips.*

## 3.2 Users (Admin Users — mapped, blueprint approved)

| Zone | Content |
|---|---|
| Leading | `SelectionCheckbox` + `Avatar` (`size="md"`, circle) |
| Primary | Full name (`h3`, uppercase, truncate) |
| Secondary | Email |
| Metadata | Exam badge, Attempts, Joined |
| Status | Active / Banned (`Badge` success/danger) |
| Actions | Activate / Deactivate (`Button`) |

## 3.3 Students (expected mapping)

| Zone | Content |
|---|---|
| Leading | `SelectionCheckbox` + `Avatar` |
| Primary | Student name |
| Secondary | Email |
| Metadata | Exam / Paper, Progress, Last active |
| Status | Active / Inactive (`Badge`) |
| Actions | View, Edit, Deactivate |

## 3.4 Exams (expected mapping)

| Zone | Content |
|---|---|
| Leading | `SelectionCheckbox` + exam status icon (`PremiumIconContainer`) |
| Primary | Exam name |
| Secondary | Paper / subject count |
| Metadata | Papers, Subjects, Question count, Duration |
| Status | Active / Draft / Archived (`Badge`) |
| Actions | Edit, Manage papers, Delete |

## 3.5 Sub Admins (expected mapping)

| Zone | Content |
|---|---|
| Leading | `SelectionCheckbox` + `Avatar` |
| Primary | Name |
| Secondary | Email |
| Metadata | Role, Assigned exams, Last active |
| Status | Active / Suspended (`Badge`) |
| Actions | Edit, Assign exams, Deactivate |

---

# 4. Surface Hierarchy

Every management page contains **independent surfaces**. No nested cards, no wrapper cards, no shared visual ownership.

```
Selection Container     ← surface (context)
│
↓
Collection Toolbar      ← surface (actions)
│
↓
Collection Header       ← no surface
│
↓
Collection Items        ← surface (one CollectionCard per item)
│
↓
Pagination              ← no surface
```

Rules:
- No nested cards. A surface never contains another surface of the same family.
- No wrapper cards around the list. The list is a gap-only flex column.
- Each surface owns itself and is owned by exactly one Foundation component.
- Pages own **zero** surface styling.

---

# 5. CollectionCard Ownership

## 5.1 CollectionCard owns

| Attribute | Owned by CollectionCard |
|---|---|
| Background | via frozen `Card` surface mapping (`premium` → `premium-dark-neutral`) |
| Border | via `Card` (`border-[1.8px] border-card-premium-border`) |
| Radius | via `Card` (`rounded-2xl`) |
| Elevation / shadow | via `Card` (`shadow-card-shadow`, hover `shadow-card-premium`) |
| Hover | via `Card` (`hover:-translate-y-0.5`) |
| Animation | via `Card` (`transition-[transform,box-shadow]`) |
| Spacing | internal slot gaps (`gap-2.5 sm:gap-3`, `gap-2`, `gap-0.5`) |
| Responsive layout | `layout="row"` two-zone arrangement (`flex-col sm:flex-row`) |
| Selection appearance | `selected` → `!border-primary !bg-primary/5` (presentation only) |
| Loading | certified `LoadingSkeleton` (`role="status"`) |
| Keyboard / a11y | `role="button"`, Enter/Space, `aria-disabled`, `aria-label` |

## 5.2 Pages own

| Item | Owned by the page |
|---|---|
| Slots | what goes in `leading` / `title` / `subtitle` / `metadata` / `trailing` / `actions` |
| Data | entity fields, formatting |
| Actions | handlers, buttons in the `actions` slot |
| State | selection, modal open state, pagination, filters |

**Pages must never style CollectionCard** — no `className` overrides targeting its surface.

---

# 6. Skeleton Reuse

The canonical skeleton (Section 1.1) is **the** reusable scaffold. Every future management page must reuse it. It is composed exclusively of Foundation components:

`PageContainer` · `Stack` · `SectionReveal` · `SelectionContainer` · `CollectionToolbar` · `CollectionHeader` · `CollectionCard` · `Pagination` · `AdminModal`/`ConfirmModal` · `ToastContainer` · `EmptyState` · `Alert` · `GridSkeleton`

Pages may add thin page-scoped composition wrappers (`QuestionsActions`, `QuestionsTable`, `UsersActions`) that:
- add no surface,
- add no spacing system,
- only choose props, order, and data.

---

# 7. Spacing Contract

The permanent spacing rhythm. **No page may introduce its own spacing system.**

```
Sections                      24px   (Stack gap="lg" → var(--space-6))
↓
Between independent surfaces  24px
↓
Between CollectionCards       12px   (list wrapper gap-3 → var(--space-3))
↓
Within CollectionCard groups  8px    (var(--space-2))
```

| Location | Value | Token |
|---|---|---|
| Section gap | 24px | `--space-6` |
| Between independent surfaces | 24px | `--space-6` |
| Between CollectionCards | 12px | `--space-3` |
| Within a row's element group | 8px | `--space-2` |
| Card internal padding (management rows) | 16px | `--space-4` (`padding={16}`) |
| Toolbar padding | 12 / 16px | `p-3 md:p-4` |

Violations (forbidden): ad-hoc px values in page code, page-level `gap-*`/`space-y-*` that replace the 24/12/8 ladder, per-page spacing tokens.

---

# 8. Visual Ownership Contract

## 8.1 Foundation owns

- colors
- shadows
- radius
- borders
- hover
- animation
- spacing
- transitions

## 8.2 Pages own

- composition
- ordering
- business logic
- data

## 8.3 The rule

**Pages own zero visuals.** Any class that changes color, shadow, radius, border, hover, animation, spacing, or transition must live in a Foundation component. Pages may use only structural/composition classes (`w-full`, `shrink-0`, `flex`, `gap-*` from the contract, `min-w-0`, `truncate`, `line-clamp-2`, `sr-only`, `aria-*`).

---

# 9. Management Page Rules (permanent)

1. **One CollectionCard = one entity.**
2. **One surface = one owner.**
3. **No nested Cards.**
4. **No page-owned hover effects.**
5. **No page-owned shadows.**
6. **No page-owned spacing** (beyond the 24/12/8 contract).
7. **Toolbar is always independent** (`CollectionToolbar`, own surface).
8. **SelectionContainer is always independent.**
9. **Pagination is always independent.**
10. **Empty, Loading, and Error follow the same hierarchy** — they replace only the list layer, never the selection/toolbar layers:
    - Loading → `GridSkeleton`
    - Empty → `EmptyState`
    - Error → `Alert` (page-level, above toolbar)
11. **Pages never style Foundation components.**
12. **All surfaces belong to the certified premium family** — one language across selection, toolbar, and cards.
13. **Selection state lives in the page** — `CollectionCard` `selected` is presentation-only.
14. **Every container has exactly one purpose** — surface, spacing, animation, or semantics.
15. **The 24 → 12 → 8 spacing ladder is the page's meter.**

---

# 10. Future Page Mapping

```
Management Page Standard
        │
        ├── Admin Questions      (first implementation — certified)
        ├── Admin Users          (blueprint approved — pending implementation gate)
        ├── Admin Students       (pending)
        ├── Admin Exams          (pending)
        ├── Admin Sub Admins     (pending)
        ├── Admin History        (pending)
        ├── Leaderboards         (pending)
        ├── Attempt History      (pending)
        └── Question Banks       (pending)
```

Every page is an **implementation of the same architecture** — never an independent design. A page may not introduce a new layout pattern without amending this Standard first (new D-series decision).

---

# 11. Permanent Governance Rule

From Phase 3.6A onward:

```
Management Page Standard
        ↓
Foundation Components
        ↓
Page Composition
```

- Pages are **never copied from other pages**.
- Audits compare against the **Management Page Standard**, never against another page.
- "How does Questions do it?" → "What does the Standard require?"
- Deviations require a D-series decision before implementation.

---

# 12. Reference

- Phase 3.6 audit (superseded as the *reference*; retained as history): `docs/certification/GOLDEN_MANAGEMENT_PAGE_AUDIT.md`
- Admin Users mapping: `docs/certification/ADMIN_USERS_LAYOUT_MIGRATION_BLUEPRINT.md`
- Certification gate: `docs/certification/MANAGEMENT_PAGE_CERTIFICATION_STANDARD.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-133)
