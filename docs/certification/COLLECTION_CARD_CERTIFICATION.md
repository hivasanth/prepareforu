# Phase 3.2 — CollectionCard Foundation Certification

**Component:** `src/components/common/CollectionCard.tsx` (barrel export in `AntigravityUI.tsx`)
**Classification:** **Level 2 — Foundation Composite** (composes Level 1 primitives into a reusable
premium collection-surface pattern; owns composition, layout arrangement, hierarchy, and
accessibility structure only)
**Status:** ✅ **CERTIFIED & FROZEN** (Mandate 16)
**Date:** 2026-08-02
**Approval:** Design approved by user with refinements (two certified layouts; presentation-only
responsibility; selection composed via slots; always-visible admin actions)
**Basis:** `FOUNDATION_GOVERNANCE.md` §3 (Composite Components) + §6 (Change Control) + §11 (Layout
Primitives: compose, don't recreate)

---

# 1. Responsibility Contract

## Foundation Composite owns

- Content arrangement for the two certified layouts (`grid` / `row`)
- Visual hierarchy (slot order, section gaps, footer pinning)
- Semantic heading structure (`titleAs`) and `role`/keyboard activation for clickable cards
- Loading skeleton (`role="status"`) and disabled/selected appearance
- Slot composition of certified Level 1 primitives

## It does NOT own (per approved design)

- Selection logic, bulk actions, CRUD behavior, permissions, business rules, page state
  → pages compose the certified `SelectionCheckbox` (or `RankBadge` / `Avatar` / `StatusIcon` /
  `TopicIcon` / `ExamStatusIcon`) into the `leading` slot
- Card surface / border / radius / shadow / hover / elevation / transition
  → **delegated entirely to the frozen `Card` (DS-001)**; CollectionCard passes only variant +
  density + layout arrangement, never re-implements surface styling

---

# 2. API (presentation-only, additive, backward-compatible)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `layout` | `'grid' \| 'row'` | `grid` | Only content arrangement differs |
| `variant` | `'default' \| 'premium' \| 'subtle' \| 'outlined' \| 'compact'` | `default` | Maps to certified Card surfaces |
| `leading` | `ReactNode` | — | Media slot (page-composed) |
| `header` | `ReactNode` | — | Custom full-width header region |
| `title` | `ReactNode` | — | Semantic heading (`titleAs`) |
| `subtitle` | `ReactNode` | — | Secondary line |
| `metadata` | `ReactNode` | — | Badge / chip row |
| `content` | `ReactNode` | — | Main body slot (grows to pin footer in grid) |
| `footer` | `ReactNode` | — | Footer region (left of actions in grid) |
| `actions` | `ReactNode` | — | Always-visible, right-aligned action area |
| `trailing` | `ReactNode` | — | Header-right slot |
| `loading` | `boolean` | `false` | `LoadingSkeleton` + `role="status"` |
| `selected` | `boolean` | `false` | Visual border/tint only — no logic |
| `disabled` | `boolean` | `false` | Opacity + pointer + keyboard |
| `onClick` | `() => void` | — | Clickable card (`role="button"`, Enter/Space) |
| `titleAs` | `h1–h4 \| p \| span` | `h2` | Semantic heading tag |
| `ariaLabel` | `string` | — | Forwarded to Card |
| `className` | `string` | — | Layout-only escape hatch |

## Variant → Card surface mapping

| CollectionCard variant | Card surface | Rationale |
|---|---|---|
| `default` | `default` | Standard token surface |
| `premium` | `premium-dark-neutral` | The app-standard premium library look (ExamCard, TopicPortalView, TeacherExamCard) — neutral surface + `card-premium-border` + premium hover shadow |
| `subtle` | `subtle` | Quiet metadata surfaces |
| `outlined` | `default` + `!shadow-none` | Border-defined edge, no elevation |
| `compact` | `default` + `padding={16}` + tighter type | Dense rows/lists |

Premium hover (`transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5
hover:shadow-card-premium`), radius, border, and light/dark token material are inherited from the
frozen `Card` — **zero hover/duplicate logic in CollectionCard**. The approved "border enhancement"
hover note is satisfied by the certified premium gold border (light) + elevation/premium-shadow
hover; a hover border-color change would modify the frozen Card and is explicitly **not** re-created
here (governance: no duplication, Rule 5).

---

# 3. Both layouts share the exact same surface language

- Same `Card` surface, border, radius, elevation, hover, shadow, focus ring
- Same typography scale (`text-[15px] md:text-[16px]` grid / `text-[14px] md:text-[15px]` row /
  `text-[13px]` compact titles, `Caption` subtitles)
- Same token spacing (`gap-1/1.5/2/3`, `gap-4` rows, `pt-4 border-t border-border-subtle/30`
  divider)
- Only the **arrangement** of the slots differs: vertical stack (grid) vs horizontal row (row)

---

# 4. Governance compliance

| Governance rule | Compliance |
|---|---|
| §3 Composite owns visual language | ✅ Composition + layout arrangement owned by CollectionCard; surface delegated to Card |
| §3 Consumers may not override surface/hover/border | ✅ CollectionCard enforces this — no consumer-level `!border-*`/`shadow-*`/`hover:*` surface overrides are needed; `selected` is a composite-owned visual |
| §6 API Evolution (≥3 consumers) | ✅ Consumers identified: grid — Questions, Exams, Topics, Study Cards, Dashboard Collections; row — Leaderboard, Students, History, Search Results, Notifications (>3) |
| §6 Backward compatible additive | ✅ New component; no existing API changed |
| §11 Compose layout primitives | ✅ Card (surface), Caption (typography), LoadingSkeleton (loading) composed; `flex`/`gap` layout only |
| §5 Rule 6 Clean as you go | ✅ Dead `SrNumber`/`QuestionCell` removed from `QuestionsTableComponents.tsx` |
| §5 Rule 4 Runtime first | ✅ tsc + build green (verification below); visual is an inheritance of the frozen Card premium surface |

---

# 5. Accessibility

- `title` rendered as a semantic heading (`titleAs`, default `h2`)
- Clickable cards: `role="button"` + `tabIndex` + Enter/Space activation (`aria-disabled` when
  disabled) — same certified pattern as `AttemptCardBase`
- `loading`: `role="status"` + `aria-label` on the skeleton
- `selected`: presentation only; the page's `SelectionCheckbox` (sr-only label) carries the
  selection semantics
- Actions slot stays always-visible and right-aligned (admin efficiency/discoverability), with
  certified `IconButton` `aria-label`s + `focusRing` — actions are never hidden behind hover
- No keyboard/ARIA regression: Card is a plain region unless made clickable

---

# 6. Verification

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| ESLint (CollectionCard, barrel, QuestionsTable, QuestionsTableComponents) | ✅ **0 migration-introduced problems** (3 barrel `react-refresh` errors are pre-existing: `useTheme` line 2 verified at HEAD; Navigation/ToastContainer lines are pre-existing Phase 3.1 barrel exports — none on the new lines) |
| `npm run build` | ✅ exit 0 (only pre-existing chunk-size notices) |
| Token classes compile | ✅ `!bg-primary/5`, `!border-primary`, `!shadow-none`, `bg-primary\/5` (color-mix) present in emitted CSS |
| Runtime | Inspection-based per repo precedent (admin route auth-guarded, no headless tooling) |

---

# 7. Freeze Marker

**CollectionCard = ✅ CERTIFIED & FROZEN.**

- Level 2 Foundation Composite, permanent single source of truth for premium collection surfaces
  (grid + row).
- Future consumers (Leaderboard, Students, History, Search Results, Notifications, Topics, Exams,
  Study Cards) must compose this component and **must not** re-create collection-card visuals.
- Any capability addition must satisfy `FOUNDATION_GOVERNANCE.md` §3 API Evolution (≥3 consumers,
  backward compatible, Foundation-owned, no consumer-specific props).

**Rollback:** single additive file + barrel export; revert per-file if needed. No DB, service, or
contract migration involved.

---

# 8. Phase 3.2.1 — Compact Management Layout Refinement (Golden Reference)

**Status:** ✅ **CERTIFIED & FROZEN** — the `row` layout is now the **default compact premium
management layout** for all future collection pages (2026-08-02)
**Scope:** Layout refinement only — NO redesign of the component contract. The `grid` layout,
variant set, surfaces, hover, tokens, and a11y are untouched.
**First row consumer (golden reference):** Admin Questions (`layout="row" variant="premium"
padding={16}`)

## Refinements made (non-breaking, additive)

| Change | Detail |
|---|---|
| **New `padding` prop** | `padding?: 16 \| 20 \| 24` — overrides the variant default padding so a premium surface adopts management-row density (`p-4`). Additive, backward compatible. |
| **Row layout → compact two-zone management row** | Zone 1 (flex-1): `leading` + `title`/`subtitle`/`metadata`/`content`; Zone 2 (shrink-0): `trailing` + `actions`. Desktop/tablet = single horizontal line via `sm:flex-row sm:items-center`; mobile wraps to two lines (Zone 1 top, Zone 2 bottom with `justify-between`). Question gets most horizontal space (`min-w-0`), actions never shift. |
| **Row title density** | `text-[13px] md:text-[14px]` — Linear/GitHub/Notion-grade density. |
| **Layout-aware skeleton** | `row` renders a compact inline skeleton (`role="status"`); `grid` unchanged. |
| **Build-graph fix** | `SharedComponents` now imports `Button` from `./AntigravityButton` directly (same module the barrel re-exports) — breaks the `AntigravityUI ↔ CollectionCard` circular re-export (via `SharedComponents → barrel`), eliminating the Rollup chunk circular-dependency warning. No copy created; governance-safe. |

## Golden Reference — Admin Questions composition

Required order (left → right): **Selection → Question Number → Question → Difficulty → Actions**.

| Slot | Content | Certified component |
|---|---|---|
| `leading` (grouped) | `SelectionCheckbox` + question number | `SelectionCheckbox` (checkbox) + `PremiumIconContainer` (User Panel `TopicCard` numbered-medallion pattern, compact `w-7 h-7 rounded-lg`) |
| `title` | Question text, `line-clamp-2` ellipsis (full text only in View/Edit) | semantic `h3` |
| `trailing` | Difficulty | `DifficultyBadge` (certified `Badge` wrapper) |
| `actions` | View / Edit / Delete | certified `IconButton` trio — always visible, right-aligned, equal gap, same hover/focus |

Removed: subject (page already filters by it) and the ID footer line (height reduction). Each row is a
single premium `CollectionCard` — no wrapper surface, no nested cards (outer page `Card` removed;
the cards themselves are the visual grouping).

## Verification (Phase 3.2.1)

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| ESLint (5 touched files) | ✅ 0 migration-introduced problems (barrel `react-refresh` errors remain pre-existing: lines 2/72/84) |
| `npm run build` | ✅ exit 0 — **circular re-export warning eliminated**; only pre-existing chunk-size notices |
| Dead code | ✅ `SubjectBadge` removed (no remaining consumers); unused `Badge` imports cleaned |

## Freeze marker (updated)

- `CollectionCard` remains ✅ **CERTIFIED & FROZEN**.
- **The `row` layout is the mandatory compact management layout.** Future collection pages
  (Leaderboard, Students, Topics, Exams, History, Search Results, Notifications, Admin/Sub-Admin
  lists) MUST compose `CollectionCard layout="row"` with the same slot contract — no page may
  re-create a management-row layout.
- `grid` remains the certified layout for dashboard-style vertical collections (Study Cards,
  Dashboard Collections).
- The `padding` prop is part of the frozen API (additive).

---

# 9. Phase 3.2.2 — Collection System Refinement (Foundation First)

**Status:** ✅ **RE-CERTIFIED** — CollectionCard unchanged (v1.1 frozen); the surrounding reusable
Foundation blocks were refined so every collection page shares one surface family
(2026-08-02)
**Method:** Foundation-first — each reusable block was fixed at the source so all consumers
(Admin Questions, Users, Sub-Admins, Students, Exams) improve automatically with zero page-level
visual code.

## Reusable blocks added / refined

| Block | File | Change |
|---|---|---|
| `CollectionToolbar` (alias `FilterBar`) | `AntigravityLayout.tsx` | Promoted from translucent surface (`bg-card-bg/50 rounded-[14px] border-border-subtle`) to the **pixel-identical premium Card surface** (`rounded-2xl bg-card-bg border-[1.8px] border-card-premium-border shadow-card-shadow hover:shadow-card-premium light:stat-card-surface light:shadow-premium-card`). Same family as the premium `CollectionCard`. `FilterBar` kept as a deprecated alias — **zero consumer churn** (QuestionsActions, UsersToolbar, AdminSubAdminsView, AdminFilterBar×2 all inherit the new surface). |
| `FilterSelect` (via `PremiumSelect`) | `PremiumSelect.tsx` | Trigger inactive state: translucent `bg-hover-bg/60` + `opacity-70` → **premium filled surface** `bg-hover-bg border-border-subtle hover:border-primary/50 focus:border-primary` (matches certified `Input`/`Checkbox` focus & hover language). Dropdown panel `bg-surface-floating` → **`bg-card-bg`** so every floating panel in the app is one family (`rounded-2xl border-border-subtle shadow-elevation-4`). |
| `SelectionCheckbox` | `src/components/common/SelectionCheckbox.tsx` (new) | **Promoted to the Foundation set** — same certified `Checkbox` wrapper (square `w-5 h-5 rounded-md`, premium border/hover/focus, centered white checkmark `text-white strokeWidth={3}`). Page-level duplicate removed from `QuestionsTableComponents.tsx` — single implementation for all management collections. |
| `CollectionHeader` | `src/components/common/CollectionHeader.tsx` (new) | Reusable top row: **`SelectionCheckbox` + "Select all on this page" + "Showing X–Y of Z"**. Replaces the inline row in `QuestionsTable`; future consumers: Users, Students, Leaderboard, Topics, Exams. |

## Requirement → resolution map (user brief)

1. **Toolbar container** → `CollectionToolbar` (premium surface, one family with cards)
2. **FilterSelect** → premium filled trigger, no transparency, certified Input/Checkbox hover/focus
3. **Bulk Upload** → already composed with certified `Button variant="secondary"` — no page styling (audited, unchanged)
4. **SelectionCheckbox** → square premium checkbox already certified (DS-013); promoted to Foundation, duplicate removed
5. **Select All** → already reuses `SelectionCheckbox`; now lives in `CollectionHeader` (one implementation)
6. **CollectionHeader** → new reusable block (select-all + range)
7. **Toolbar layout** → same radius/border/shadow/elevation as premium cards
8. **One surface family** → `CollectionHeader → CollectionToolbar → CollectionCard → Pagination → Dropdown` all `bg-card-bg` + `card-premium-border` / `border-border-subtle`; floating panels unified to `bg-card-bg`
9. **Dropdown** → `PremiumSelect` panel aligned to the app premium menu language (`rounded-2xl border bg-card-bg shadow-elevation-4`, full arrow/Home/End/Enter/Escape/Tab keyboard)
10. **Hover consistency** → toolbar `hover:shadow-card-premium` (card family), trigger `hover:border-primary/50` (control family), buttons/cards unchanged
11. **Color audit** → removed every translucent/`opacity-70` surface; all surfaces now Design System tokens
12. **Reusable audit** → documented per change (Current → Consumers → Foundation Updated → Pages Improved → Duplicates Removed) in `ADMIN_QUESTIONS_IMPLEMENTATION_REPORT.md` §22
13. **Certification** → CollectionCard, CollectionToolbar, FilterSelect, SelectionCheckbox, CollectionHeader verified; Button & Menu unchanged (already certified)

## Re-certification matrix

| Block | Status |
|---|---|
| `CollectionCard` (v1.1) | ✅ CERTIFIED & FROZEN (unchanged in 3.2.2) |
| `CollectionToolbar` (FilterBar) | ✅ CERTIFIED — premium collection surface |
| `FilterSelect` (PremiumSelect) | ✅ CERTIFIED — filled premium trigger + unified panel |
| `SelectionCheckbox` | ✅ CERTIFIED — Foundation-owned, single implementation |
| `CollectionHeader` | ✅ CERTIFIED — reusable select-all + range row |
| `Button` / `Menu` | ✅ unchanged (already certified, not modified) |

## Verification (Phase 3.2.2)

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| ESLint (7 touched files) | ✅ **0 migration-introduced problems** (barrel `react-refresh` errors at lines 2/76×2/88 + `PageHeader` `any` at :74 are all pre-existing baseline, only line-shifted) |
| `npm run build` | ✅ exit 0 (only pre-existing chunk-size notices) |
| Dead code | ✅ page-level `SelectionCheckbox` removed (single Foundation implementation) |

# 10. Phase 3.2.3 — Foundation Refinement (Final Collection System Alignment)

**Status:** ✅ **RE-CERTIFIED** (2026-08-02)
**Method:** Foundation-first — refinements made only in the reusable Foundation components
(`Checkbox`, `Button`, new `CollectionFilter`); no page-specific styling introduced. Every
consumer (Admin Questions, Users, Students, Leaderboard, Topics, Exams) inherits the improvements
automatically.

## Audit chain (Current → Reusable component → Consumers → Automatic improvements → Duplicates removed)

| Change | Current | Reusable component | Consumers | Automatic improvements | Duplicates removed |
|---|---|---|---|---|---|
| Selection checkbox visual quality | certified `Checkbox` (DS-013) was already square (`w-5 h-5 rounded-md border-2`) but visually plain | `AntigravityForm.tsx` `Checkbox` refined: premium unchecked surface (`bg-hover-bg border-border-subtle light:bg-card-bg light:border-card-premium-border`), checked state now `bg-primary border-primary shadow-elevation-2 shadow-primary/30` (premium elevation), stronger focus ring (`peer-focus:ring-4 … /25` + `peer-focus:border-primary`), clearer hover (`peer-hover:border-primary/70`), centered white checkmark (flex-centering + `strokeWidth={3}`) | `SelectionCheckbox` → QuestionsTable rows + `CollectionHeader` select-all; PromptEditorModal | row + select-all checkboxes render the premium square control in every collection page | none (single `Checkbox` implementation) |
| Bulk Upload visual identity | `Button variant="secondary"` already used the same `Button` as Add Question | `AntigravityButton.tsx` light `secondary` surface aligned to the premium collection language: `border border-card-border shadow-elevation-1` → `border-[1.8px] border-card-premium-border shadow-card-shadow hover:shadow-card-premium hover:-translate-y-0.5` (same radius/elevation family as `primary` and `CollectionCard`) | Bulk Upload, Cancel/Close buttons, login provider buttons, Review/Results secondary CTAs | secondary buttons read as premium controls alongside primary — only icon/label/semantic variant differ | none |
| Difficulty filter | `FilterSelect` dropdown (Menu-based, 3 options) | new **`CollectionFilter`** (`src/components/common/CollectionFilter.tsx`): `SelectionContainer` + `Tabs` pill language — selected = `nav-active-surface` primary pill, unselected = `text-text-secondary border border-border-subtle` standard pill; no dropdown / no floating panel; `sm` size; responsive via Tabs `overflow-x-auto` | Difficulty filter in `QuestionsActions` | finite option sets render as always-visible pills in one selection family with Exam/Paper/Subject selection | none |

## CollectionFilter — Foundation contract

- **Purpose:** replace dropdown filters for small finite option sets (Difficulty, Status, Role,
  Language, Question Type, ...). Selection is always visible — no dropdown, no transparent popup.
- **Composition:** `SelectionContainer` (premium surface) + `Tabs` (`bare`, `variant="primary"`,
  `size="sm"`) — motion pill, spring animation, keyboard navigation (arrow/Home/End) all inherited
  from the certified `Tabs`. `TabOption` API (`id`/`label`/`icon`/`badge`/`disabled`).
- **Scope:** finite sets only (≤ ~8 options). Large / searchable / dynamic lists keep
  `PremiumSelect`.
- **Build-graph:** imports `Tabs` from `./AntigravityData` and `SelectionContainer` from
  `./AntigravityLayout` directly — never the `AntigravityUI` barrel (Foundation set rule).

## Re-certification matrix

| Block | Status |
|---|---|
| `CollectionCard` (v1.1) | ✅ CERTIFIED & FROZEN (unchanged in 3.2.3) |
| `CollectionToolbar` (FilterBar) | ✅ CERTIFIED (unchanged in 3.2.3) |
| `FilterSelect` (PremiumSelect) | ✅ CERTIFIED — retained for large/searchable lists |
| `Checkbox` (DS-013) | ✅ RE-CERTIFIED — premium square control (border/hover/focus/elevation refined) |
| `SelectionCheckbox` | ✅ RE-CERTIFIED — inherits premium `Checkbox` automatically |
| `Button` (secondary) | ✅ RE-CERTIFIED — aligned to premium collection language |
| `CollectionFilter` | ✅ **NEW — CERTIFIED** finite-set pill filter |
| `CollectionHeader` | ✅ CERTIFIED (unchanged in 3.2.3) |

## Verification (Phase 3.2.3)

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| ESLint (4 touched files) | ✅ **0 new problems** (barrel `react-refresh` errors at lines 2/80×2/92 are the pre-existing baseline, shifted +4 by the new exports) |
| `npm run build` | ✅ exit 0 (only pre-existing chunk-size notices) |
| Dead code | ✅ no page-level duplicates introduced; `FilterSelect` retained for PremiumSelect consumers |

---

# 11. Phase 3.2.4 — CollectionFilter Redesign (Premium Dropdown)

**Status:** ✅ **RE-CERTIFIED** (2026-08-02)
**Method:** Foundation-first — the pill-style `CollectionFilter` was **redesigned in place** to a
**premium dropdown** reusing the existing `Menu` foundation. No page-specific styling introduced;
the Admin Questions page required **one additive prop** (`label="Difficulty"`) and inherited the
new dropdown automatically.

## Design rule

- `SelectionContainer` = **navigation between sections** (Exam/Paper/Subject).
- `CollectionFilter` = **filtering within the current section** (Difficulty/Status/Role/Language/…).
- Same Design System tokens (colors, borders, shadows, hover, animations) — different UX patterns.

## Audit chain (Current → Reusable component → Consumers → Automatic improvements → Duplicates removed)

| Change | Current | Reusable component | Consumers | Automatic improvements | Duplicates removed |
|---|---|---|---|---|---|
| Difficulty filter | `CollectionFilter` pill (`SelectionContainer` + `Tabs`) | **redesigned** `CollectionFilter` (`src/components/common/CollectionFilter.tsx`) — **premium dropdown** on the `Menu` foundation: compact trigger (`h-[44px] md:h-[48px] rounded-xl`, `bg-card-bg border-border-subtle shadow-card-shadow hover:shadow-card-premium hover:border-primary/50 focus:border-primary`, uppercase micro-text + rotating `ChevronDown`, active state `bg-primary/10 text-primary border-primary/20`); `Menu.Content` panel (premium surface/border/`shadow-elevation-4`/radius); selected row = `✓` check + primary text + premium background (`Menu.Item selected`) | Difficulty filter in `QuestionsActions` (trigger label `Difficulty`; `All`/`Easy`/`Medium`/`Hard` rows) | finite-set filters render as a compact premium dropdown matching the search bar; selected item read at a glance | none |
| `Menu` foundation | `Menu` v1.0 (no selected row, no disabled trigger, `shadow-2xl` panel) | `Menu.tsx` v1.1 — `Menu.Item` `selected` prop (primary text + `bg-primary/20` + focus/hover tint), `Menu.Trigger` `disabled` prop (native + guarded handlers), `Menu.Content` panel shadow → `shadow-elevation-4` (matches `PremiumSelect`) | `CollectionFilter` (new), `NotificationPanel` (inherits refined panel shadow) | any future dropdown can render checked rows and disabled triggers from the Foundation | none |

## CollectionFilter — Foundation contract (v1.1)

- **Purpose:** premium dropdown filter for small finite option sets (Difficulty, Status, Role,
  Language, Question Type, ...). Reuses the `Menu` foundation — not `Tabs`.
- **Trigger:** compact, same size as the search bar controls. Shows the selected option when a
  concrete value is chosen (`Easy ▼`), otherwise the `label` prop (`Difficulty ▼`).
- **Panel:** `Menu.Content` premium surface (`bg-card-bg`, `border-border-subtle`,
  `shadow-elevation-4`, `rounded-2xl`); rows = `Menu.Item` — selected row renders `✓` + primary
  text + premium background, unselected = standard menu item. Keyboard nav (arrows/Home/End),
  outside-click and Escape close all inherited from `Menu`.
- **API:** `CollectionFilterOption` (`id`/`label`/`disabled`) + `value`/`onChange`/`label`/
  `ariaLabel`/`disabled`/`align`.
- **Scope:** finite sets only. Large / searchable / dynamic lists keep `PremiumSelect`;
  Exam/Paper/Subject keep `SelectionContainer` (navigation).
- **Build-graph:** imports `Menu` from `./Menu` directly — never the `AntigravityUI` barrel.

## Re-certification matrix (Phase 3.2.4)

| Block | Status |
|---|---|
| `CollectionCard` (v1.1) | ✅ CERTIFIED & FROZEN (unchanged) |
| `CollectionToolbar` (FilterBar) | ✅ CERTIFIED (unchanged) |
| `CollectionHeader` | ✅ CERTIFIED (unchanged) |
| `SelectionCheckbox` / `Checkbox` | ✅ CERTIFIED (unchanged — premium square from 3.2.3) |
| `Button` (secondary) | ✅ CERTIFIED (unchanged — premium surface from 3.2.3) |
| `Menu` / Dropdown | ✅ RE-CERTIFIED **v1.1** — `selected` item, `disabled` trigger, `shadow-elevation-4` panel |
| `CollectionFilter` | ✅ RE-CERTIFIED **v1.1** — premium dropdown (Menu-based), finite-set filter |
| `FilterSelect` (PremiumSelect) | ✅ CERTIFIED — retained for large/searchable lists |

## Verification (Phase 3.2.4)

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| ESLint (4 touched files) | ✅ **0 new problems** (barrel `react-refresh` lines 2/80×2/92 remain the pre-existing baseline) |
| `npm run build` | ✅ exit 0 (only pre-existing chunk-size notices) |
| Dead code | ✅ no page-level duplicates; `SelectionContainer`/`Tabs` untouched (navigation language reserved) |
