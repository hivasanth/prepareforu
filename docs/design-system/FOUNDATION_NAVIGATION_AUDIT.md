# Foundation Navigation Audit

**Phase 3.4 P2 — Wave 1 (Navigation Family)**
**Date:** 2026-08-02
**Scope:** Every reusable Navigation-family component and every token used to render
navigation surfaces (sidebar, nav items, active indicator, tab pill/track, filter
surfaces, theme toggle, selection container). Cross-checked against
`FOUNDATION_TOKEN_OWNERSHIP.md` and `FOUNDATION_COMPONENT_FAMILY_MAP.md`.
**Rule:** previously certified visual behaviour remains unchanged unless the change
is required by architectural ownership, explicitly approved, and logged in
`DESIGN_DECISION_LOG.md`.

---

## 1. Audit Method

1. Read every Navigation-family component and its consumers:
   `Navigation.tsx`, `layouts/SidebarLayout.tsx`, `AntigravityLayout.tsx`
   (`SelectionContainer`), `AntigravityData.tsx` (`Tabs`), `CollectionFilter.tsx`,
   `ThemeToggle.tsx`, `SegmentedFilter.tsx` (shared active-surface consumer).
2. Inventoried the `--nav-*` token set against the 7 tokens the P2 charter requires
   (`--nav-surface`, `--nav-border`, `--nav-hover`, `--nav-active`,
   `--nav-indicator`, `--nav-shadow`, `--nav-focus`).
3. Checked every component for cross-family token inheritance (Surface `card-*`,
   `shadow-*`, `--material-*`; Control `button-*`), page-level overrides
   (`!important` global CSS scoped to `.light aside`), and hardcoded color/shadow
   values.
4. Verified amber policy: no `#C9A070` may remain as default visual language
   without a documented migration target.

## 2. Navigation Token Inventory (themes.css)

### 2.1 Legacy semantic block — `:root` (dark baseline) `themes.css:574-587`, overridden for light at `:680-695`-region values
- `--bg-nav: var(--bg-surface)` (575), `--text-nav` (576), `--border-nav` (577),
  `--text-nav-secondary` (578), `--text-nav-hover` (579), `--bg-nav-hover` (580),
  `--bg-nav-active` (581), `--text-nav-active` (582), `--border-nav-indicator` (583),
  `--bg-nav-footer` (584), `--border-nav-footer` (585).
- Dark concrete values (`themes.css:847-857`) are gold-translucent
  (`rgba(200,150,12,…)`), i.e. dark nav is already tokenized.

### 2.2 `--nav-*` alias block (`themes.css:631-642`)
- `--nav-surface: var(--bg-nav)` (631), `--nav-surface-footer` (632),
  `--nav-text` (633), `--nav-text-secondary` (634), `--nav-text-hover` (635),
  `--nav-text-active` (636), `--nav-bg-hover` (637), `--nav-bg-active` (638),
  `--nav-indicator: var(--border-nav-indicator)` (639), `--nav-border: var(--border-nav)` (642).

### 2.3 Required-token coverage (P2 charter)
| Required token | Status | Evidence |
|---|---|---|
| `--nav-surface` | ✅ present | themes.css:631 |
| `--nav-border` | ✅ present | themes.css:642 |
| `--nav-indicator` | ✅ present | themes.css:639 |
| `--nav-hover` | ❌ missing | alias set uses split `--nav-bg-hover`/`--nav-text-hover` |
| `--nav-active` | ❌ missing | alias set uses split `--nav-bg-active`/`--nav-text-active` |
| `--nav-shadow` | ❌ missing | never defined |
| `--nav-focus` | ❌ missing | never defined |

## 3. Findings

### 3.1 HIGH

#### N-1 — Sidebar light branch renders via global CSS override classes, not component tokens
- Evidence: `Navigation.tsx:126` and `SidebarLayout.tsx:198` both branch
  `!isDark ? 'ancient-sidebar' : 'bg-sidebar …'`. The `ancient-sidebar` class
  (`index.css:1088-1092`) hard-wires `background: var(--sidebar-bg)`,
  `border-right: 1.8px solid var(--sidebar-border)`, `box-shadow: var(--header-shadow)`.
- The same `light: selection-container-dark` dead-class pattern is also present on
  `ThemeToggle.tsx:35`, `AntigravityButton.tsx:179,189`, `AntigravityLayout.tsx:64`
  (see N-4).
- Impact: the sidebar surface language is split between component classes (dark) and
  global CSS (light); light-mode behaviour is only correct because of a cascade of
  `.light aside … !important` rules (see N-2). This is the exact "page requires
  custom styling" anti-pattern P2 must eliminate.
- Fix direction (Wave 1): make `--sidebar-*`/nav-surface tokens the single source;
  remove the light-branch global classes by mapping them onto `--nav-*` tokens.
- Status: **approval-gated** (changes certified light renders).

#### N-2 — `.light aside` `!important` override block (index.css:698-723)
- Evidence: `.light .nav-active-surface, .light aside nav a.active …` etc. apply
  `background/color/box-shadow/border` with `!important` (`index.css:698-706`),
  including hardcoded rgba gold values `rgba(200,150,12,0.1)` (713),
  `rgba(255,223,160,1)` (714), `rgba(223,192,150,0.7)` (721). Active-tab text colour
  is forced through a sibling selector `.light .nav-active-surface + span` (709).
- Impact: page/layout-level override CSS is the only thing making light nav readable;
  components cannot be migrated independently until this block is retired.
- Fix direction (Wave 1): move the active treatment into the `--nav-*` tokens
  (`--nav-active` background/text/indicator) and delete the `!important` landing zone
  once component classes carry the language.
- Status: **approval-gated**.

#### N-3 — Cross-family token inheritance in `Tabs` (Navigation family consuming Surface material tokens)
- Evidence: `AntigravityData.tsx:79` pill (light) =
  `bg-[image:var(--material-tab-pill-surface)] border-[var(--material-tab-pill-border)] shadow-tab-pill-light`;
  `:124` track (light) = `bg-[image:var(--material-tab-track-surface)] border-[var(--material-tab-track-border)] shadow-tab-track`;
  `:78` pill (dark) = `bg-card-bg border-border-subtle shadow-elevation-1`.
- `--material-tab-*` and `shadow-tab-*` are Surface-owned (per
  `FOUNDATION_TOKEN_OWNERSHIP.md`). Tabs is Navigation-owned (per family map).
  Per D-124 "a reusable component inherits from its own family only", this is a
  cross-family violation.
- Fix direction (Wave 1): define Navigation-owned pill/track tokens
  (`--nav-tab-pill-*`, `--nav-tab-track-*`) aliasing the certified values so renders
  are unchanged while ownership is corrected.
- Status: **approval-gated** (render-neutral if aliases keep values identical).

#### N-4 — `light:selection-container-dark` is a dead class and `SelectionContainer` inherits Surface card-premium
- Evidence: `AntigravityLayout.tsx:64`
  `rounded-2xl shadow-card-premium selection-surface border-[1.8px] border-card-premium-border -translate-y-0.5 light:selection-container-dark p-3`.
  `selection-container-dark` is not a registered utility (component audit H-2, D-125:
  legacy fix rejected). `shadow-card-premium` → `--material-card-premium-shadow` →
  `var(--elevation-carved)`, which is `.light`-only (`themes.css:803`), so the shadow
  is **undefined in dark mode**. `selection-surface` = `var(--sidebar-bg)`
  (`index.css:268-270`).
- This is component-audit finding **M-6**, deferred to P2-1 exactly as planned in
  `FOUNDATION_FAMILY_IMPLEMENTATION_PLAN.md`.
- Fix direction (Wave 1): give `SelectionContainer` a Navigation-owned surface +
  shadow token (`--nav-selection-surface`, `--nav-selection-shadow`) that resolves in
  both themes; drop the dead `light:` class; stop inheriting `card-premium-*`.
- Status: **approval-gated**.

### 3.2 MEDIUM

#### N-5 — Duplicate sidebar implementations
- `Navigation.tsx` (sidebar shell, `:116-126`) and `layouts/SidebarLayout.tsx`
  (`:198`) both render a light/dark-branching sidebar with identical class language
  but separate code paths. Same for active items (`Navigation.tsx:188` vs
  `SidebarLayout.tsx:156` `nav-active-surface`).
- Fix direction (Wave 1): single `NavSidebar` composite consuming the nav tokens;
  both current shells become thin wrappers.
- Status: part of plan (no render change).

#### N-6 — `nav-active-surface` is defined twice with divergent values
- `index.css:698` (light) sets `bg-nav-active/text-nav-active/header-shadow/sidebar-border`
  while `index.css:1094` (base) sets `bg-accent-subtle/border-accent/elevation-1/color-accent`.
  One class, two recipes depending on `.light`.
- Fix direction (Wave 1): unify on the `--nav-*` alias (single recipe) and delete the
  duplicated rule. Consumers: `AntigravityData.tsx:104`, `SegmentedFilter.tsx:93`,
  `ThemeToggle.tsx:49`, `SidebarLayout.tsx:156`.
- Status: **approval-gated**.

#### N-7 — Hardcoded inset shadow in reusable component
- `AntigravityData.tsx:256` (stat-card inset surface):
  `shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] light:bg-card-bg/30 light:border-stat-card-border/20`
  — raw inset shadow value not backed by a token.
- Fix direction (Wave 1): add a `--nav-inset-shadow`/Surface `--shadow-inset-1` token.
- Status: plan.

### 3.3 LOW

#### N-8 — `--surface-nav` duplicated (`themes.css:602` and `:814`, both `var(--bg-nav)`)
- Benign duplicate; consolidate to a single definition. Status: plan.

#### N-9 — Amber chain: light nav surface derives from `#C9A070`
- `--nav-surface` → `--bg-nav` → `--bg-surface: #C9A070` (`themes.css:672`) in light.
  Documented per amber policy: component = sidebar/nav surface (light), purpose =
  legacy golden-light surface, family = Navigation (ownership target), justification =
  pre-P2 light theme, migration target = decouple `--bg-nav` from `--bg-surface`;
  re-map light nav surface to `--bg-elevated`-derived token. Status: part of plan.

## 4. Wave 1 Close-out Checklist
- [ ] `--nav-hover`, `--nav-active`, `--nav-shadow`, `--nav-focus` created (render-neutral aliases).
- [ ] N-3: Navigation-owned tab pill/track tokens, values unchanged.
- [ ] N-4: SelectionContainer Surface tokens → `--nav-selection-*`; dead `light:` class removed; dark shadow repaired.
- [ ] N-6/N-8: `nav-active-surface` and `--surface-nav` single-sourced.
- [ ] N-9: light nav surface decoupled from amber, migration target recorded.
- [ ] Repo-wide re-check: no Navigation component inherits Surface `card-*`/`shadow-*`/`--material-*`.
- [ ] Tabs, ThemeToggle, CollectionFilter, Navigation, SidebarLayout, SelectionContainer render identically in both themes.
