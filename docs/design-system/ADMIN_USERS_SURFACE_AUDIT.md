# Admin Users — Surface Audit

**Phase 3.7 — Admin Users Visual Language Audit (Discovery only)**
**Status:** DOCUMENTATION ONLY — no code, token, variant, or Foundation changes.
**Scope:** `src/pages/admin/AdminUsers.tsx` + `src/components/admin/users/**` + every Foundation component the page renders.
**Related:** `ADMIN_USERS_COLOR_AUDIT.md`, `ADMIN_USERS_VISUAL_AUDIT.md`, `ADMIN_USERS_MANAGEMENT_SURFACE_PROPOSAL.md`, `ADMIN_USERS_VISUAL_MIGRATION_PLAN.md`.

---

## 1. Method (Brief Step 1 — Complete Surface Inventory)

Every visible surface on the page was enumerated from the render tree, then resolved to its
background / border / shadow / radius / hover / elevation / motion / tokens in **both** themes.

**Key resolution fact:** every surface resolves through **semantic tokens** (`--bg-*`, `--card-*`,
`--border-*`, `--elevation-*`, `--material-*`, `--stat-card-*`) defined in `src/styles/themes.css`.
The page itself owns **zero** surface styling (Management Page Standard §8.3 — "pages own zero
visuals"). All amber/parchment/gold reaches the page transitively through frozen Foundation
components and light-theme tokens.

**Headline finding:** in **light mode**, `--bg-surface` is parchment tan `#C9A070`
(`themes.css:693`), `--border-subtle` is gold-tinted `rgba(168,120,22,.30)` (`:724`), card borders
are gold `#A87828` (`:1224`, `:1229`), card shadows are carved gold (`:757`, `:817`, `:824`, `:1225`),
and the stat/button light surfaces are gold gradients or gold-brown material (`:806`, `:1099-1102`,
`:1232-1237`, `:1245`). **In dark mode every surface is neutral** (`#111827`/`#1F2937`/`#374151`,
neutral borders and shadows). The amber language is a **light-mode-only** phenomenon.

---

## 2. Page Render Tree (surface map)

```
PageContainer (no surface — shell)
└─ Stack gap="lg"
   ├─ SectionReveal → AdminSelectionTabs
   │    └─ SelectionContainer (SURFACE A) + Tabs (Navigation) + bg-border-subtle divider
   ├─ Alert variant="error"   (Status hues; no Surface-family bg)
   ├─ SectionReveal → UsersActions
   │    └─ CollectionToolbar (SURFACE B)
   │         └─ Input (Search) (Control) + CollectionFilter (SURFACE C)
   ├─ SectionReveal → UsersTable
   │    ├─ CollectionHeader (no surface)
   │    ├─ CollectionCard row per user (SURFACE D)  [List]
   │    │    └─ UserIdentity → Avatar (SURFACE E)
   │    │        Badge exam default / Badge status success|danger (Status)
   │    │        Button success|danger (Status-hued)
   │    ├─ Pagination (no surface)
   │    └─ GridSkeleton → LoadingSkeleton (SURFACE F)  [loading]
   │    EmptyState (SURFACE G)  [empty]
   └─ ConfirmModal → AdminModal (SURFACE H) + Buttons (SURFACE I)
   └─ ToastContainer → Toast (SURFACE J)
```

---

## 3. Surface Inventory

Legend — **Family** column uses the Phase 3.7 classification (see `ADMIN_USERS_VISUAL_AUDIT.md`
§3). **L/D** = Light / Dark resolved surface. Amber rows = **Legacy Ancient** language.

### A. Page & page background

| Attribute | Value |
|---|---|
| Component | `body` / app canvas (via theme) |
| Owner | Theme (`themes.css`); consumed everywhere |
| Background L / D | `--bg-app` `#E2CFA6` (cream) / `#111827` (`themes.css:692`/`:417`) |
| Border / Shadow / Radius | — |
| Tokens | `--bg-app` |
| Family | **Legacy Ancient (L) / Neutral (D)** |
| Verdict | Page shell inherits the light cream canvas — amber by theme, not by page |

### B. PageContainer

| Attribute | Value |
|---|---|
| Component | `PageContainer` (`AntigravityLayout.tsx`, frozen DS-012) |
| Owner | Foundation Layout |
| Surface | **None** — `max-w-[1280px] mx-auto` + padding only |
| Family | Layout (neutral) |
| Verdict | Correct — no surface |

### C. SelectionContainer (Exam context)

| Attribute | Value |
|---|---|
| Component | `SelectionContainer` (`AntigravityLayout.tsx`); consumed by `AdminSelectionTabs.tsx:254/361` |
| Owner | Foundation Navigation (frozen DS-012) |
| Classes | `rounded-2xl shadow-card-premium selection-surface border-[1.8px] border-card-premium-border -translate-y-0.5 light:selection-container-dark p-3` |
| Background L / D | `--selection-surface` (gold light) / forest-900 dark |
| Border L / D | `--card-premium-border` = `--border-gold` `#A87828` (L, `themes.css:1229`) / `transparent` (D, `:1087`) |
| Shadow | `--material-card-premium-shadow` = `--elevation-carved` carved gold (L, `:824`) / `none` (D) |
| Radius | `rounded-2xl` |
| Hover | none |
| Motion | `-translate-y-0.5` |
| Tokens | `--selection-surface`, `--border-card-premium-border`, `--shadow-card-premium` |
| Family | **Navigation family; amber/gold surface in L** |
| Risk | Cross-family surface inheritance documented (M-6 / X-2, D-121); any change affects all navigation consumers |

### D. CollectionToolbar (Search + Filter container)

| Attribute | Value |
|---|---|
| Component | `CollectionToolbar` (`AntigravityLayout.tsx`, frozen Phase 3.2.2); consumed by `UsersActions.tsx:16` |
| Owner | Foundation Surface |
| Classes | `rounded-2xl bg-card-bg border-[1.8px] border-card-premium-border shadow-card-shadow hover:shadow-card-premium light:stat-card-surface light:shadow-premium-card` |
| Background L / D | `--card-bg` = parchment `#C9A070` (L, `themes.css:928`/`:693`) / `#1F2937` (D); light overridden by `--surface-stat` gold gradient `#D4A55A→#BF8A30` (`:806`) |
| Border L / D | `#A87828` gold (L) / `transparent` (D) |
| Shadow L / D | `--card-shadow` = carved gold (L, `:1225`/`:757`) / `--elevation-2` neutral (D); hover carved |
| Radius | `rounded-2xl` |
| Hover | `hover:shadow-card-premium` |
| Motion | `transition-[transform,box-shadow]` |
| Tokens | `--bg-card-bg`, `--border-card-premium-border`, `--shadow-card-shadow`, `light:stat-card-surface`, `light:shadow-premium-card` |
| Family | **Surface family; amber/parchment in L** |
| Risk | Primary amber strip; shared with every management page (Questions, Students, Exams, Sub Admins) |

### E. Search Input

| Attribute | Value |
|---|---|
| Component | `Input` (`AntigravityForm.tsx`, frozen DS-013); consumed by `UsersActions.tsx:20` |
| Owner | Foundation Control (Input role) |
| Background L / D | `--input-surface` (theme `--bg-*` derived) |
| Border L / D | `--input-border` = `--border-subtle` → gold-tint `rgba(168,120,22,.30)` (L, `themes.css:937`/`:724`) / `#374151` (D, `:448`) |
| Focus | `focus:border-primary` (blue accent — independent) |
| Radius | rounded-md family |
| Tokens | `--input-*`, `--border-subtle` |
| Family | **Control (Input role)** — correct family; amber via `--border-subtle` token in L |
| Risk | Token-level; shared by every Input consumer repo-wide |

### F. CollectionFilter trigger + panel

| Attribute | Value |
|---|---|
| Component | `CollectionFilter` (`CollectionFilter.tsx`, frozen 3.2.4) + `Menu.Content` (DS-008A); consumed by `UsersActions.tsx:30` |
| Owner | Foundation Control (Filter role) |
| Trigger | `bg-card-bg border-border-subtle shadow-card-shadow hover:shadow-card-premium` → parchment + gold-tint border + carved shadow in L |
| Panel | `bg-card-bg rounded-2xl border-border-subtle shadow-elevation-4` → parchment + gold-tint in L |
| Tokens | `--card-bg`, `--border-subtle`, `--card-shadow` (trigger); Control `--filter-*` role tokens also exist (`themes.css:978-984`) |
| Family | **Control (Filter role); amber in L via Surface tokens** |
| Risk | Documented cross-family inheritance (M-2); `--filter-*` role tokens exist but are not fully consumed |

### G. CollectionHeader

| Attribute | Value |
|---|---|
| Component | `CollectionHeader` (frozen Phase 3.2.2) — range-only here; consumed by `UsersTable.tsx:56` |
| Owner | Foundation |
| Surface | **None** (text + controls only) |
| Family | Neutral |
| Verdict | Correct — no surface; eye rests between amber strips |

### H. CollectionCard (management row) — the list surface

| Attribute | Value |
|---|---|
| Component | `CollectionCard` (`CollectionCard.tsx`, frozen v1.1) — `variant="premium"` at `UsersTable.tsx:68` |
| Owner | Foundation CollectionCard → delegates to frozen `Card` |
| Variant map | `premium → premium-dark-neutral` (`CollectionCard.tsx:64`) |
| Card recipe | `PREMIUM_SURFACE` = `bg-card-bg border-[1.8px] border-card-premium-border shadow-card-shadow` + `PREMIUM_LIGHT_OVERRIDES` = `light:stat-card-surface light:shadow-premium-card` (`AntigravityCard.tsx:20-25,34`) |
| Background L / D | parchment `#C9A070` (L, overridden by gold `--surface-stat` gradient) / `#1F2937` (D) |
| Border L / D | `#A87828` gold 1.8px (L) / `transparent` (D) |
| Shadow L / D | carved gold (L) / `--elevation-2` neutral (D) |
| Radius | `rounded-2xl` |
| Hover | `hover:shadow-card-premium hover:-translate-y-0.5` |
| Tokens | `--bg-card-bg`, `--border-card-premium-border`, `--shadow-card-shadow`, `light:stat-card-surface`, `light:shadow-premium-card` |
| Family | **Surface family; amber/parchment in L** — the dominant amber surface |
| Risk | One row per user (up to 20/page); the highest-visibility amber surface on the page |

> **Correction note:** Users rows are **parchment/gold**, NOT dark forest. Dark-forest
> (`--material-card-premium-surface = --forest-900`, `themes.css:1076`) applies only to raw
> `Card variant="premium"` consumers in the Exam family (TopicCard, ExamCard, AttemptCard). The
> CollectionCard `premium` variant maps to `premium-dark-neutral` (`bg-card-bg`), so it is parchment.

### I. Avatar (within UserIdentity)

| Attribute | Value |
|---|---|
| Component | `Avatar` (`Avatar.tsx`, frozen DS-014) → `AdminIconWrap` (`AdminIconWrap.tsx:34`) |
| Owner | Foundation Icon/Display |
| Light material | `ancient-icon-badge` class (gold/forest material) |
| Dark material | `bg-primary/10 text-primary` |
| Family | **Icon/Display; Legacy Ancient light material** |
| Risk | Single-owner premium material (documented PremiumIconContainer pattern, freeze register); candidate |

### J. Badges (exam `default`, status `success`/`danger`)

| Attribute | Value |
|---|---|
| Component | `Badge` (`Alert.tsx` Badge export, frozen Phase 2A.5); consumed by `UsersTable.tsx:79,97` |
| Owner | Foundation Status |
| Status hues | `success`/`danger` translucent tinted fills — independent of amber |
| Default (exam) | neutral chip; `border-border-subtle` frame → gold-tint in L |
| Family | **Status family — correct** |
| Risk | Hues correct; default-badge border token amber-tinted in L (token-level) |

### K. Action Buttons (Activate / Deactivate)

| Attribute | Value |
|---|---|
| Component | `Button` (`AntigravityButton.tsx:47-50,76-79`) `variant="success"` / `variant="danger"`; consumed by `UsersTable.tsx:106` |
| Owner | Foundation Control (Button role) + Status hues |
| Surface | `bg-success text-white` / `bg-danger text-white`, transparent border |
| Family | **Status-hued; outside the amber language** |
| Verdict | Correct — the row actions already use neutral-hued status buttons |

### L. Buttons — primary & secondary (ConfirmModal footer, EmptyState, ErrorState)

| Attribute | Value |
|---|---|
| Component | `Button` primary / secondary (`AntigravityButton.tsx:37-46,71-75`) |
| Primary L | `--material-button-primary-surface` = `--gradient-header` dark-forest gradient + `--gold-400` border + `--brown-550` text (`themes.css:1099-1102`, `:798`) |
| Secondary L | `bg-button-surface-secondary` = `--bg-surface` parchment `#C9A070` + 1.8px `--button-border-secondary` = `--border-gold` `#A87828` + `--button-shadow-secondary` = `--card-3d-shadow` carved (`themes.css:1232-1237`) |
| Dark | primary blue `bg-primary`, secondary neutral `--button-*` |
| Family | **Control (Button role); amber in L for primary & secondary** |
| Risk | Page's amber buttons: Confirm Cancel (secondary), Confirm (primary/danger), Try Again (primary) |

### M. GridSkeleton / LoadingSkeleton (loading state)

| Attribute | Value |
|---|---|
| Component | `GridSkeleton` → `LoadingSkeleton` (`SharedComponents.tsx:14-53`); consumed by `UsersTable.tsx:43` |
| Classes | `GOLD_SURFACE` = `stat-card-surface border border-border-gold` + `shadow-premium-card`/`shadow-premium-carved` (`AntigravityCard.tsx:26`) |
| Background L / D | gold `--surface-stat` gradient (L, `themes.css:806`) / neutral (D) |
| Border | `--border-gold` `#A87828` (L, `:805`) |
| Family | **Surface family; Legacy Ancient gold in L** |
| Risk | Skeleton family already has a gold dialect flagged (FOUNDATION_COMPONENT_AUDIT M-3) |

### N. EmptyState

| Attribute | Value |
|---|---|
| Component | `EmptyState` (`SharedComponents.tsx:126-155`); consumed by `AdminUsers.tsx:85` |
| Classes | `rounded-[32px] ${GOLD_SURFACE} shadow-premium-card` |
| Background L / D | gold `--surface-stat` gradient (L) / neutral (D) |
| Border | `--border-gold` (L) |
| Family | **Surface family; Legacy Ancient gold in L** |
| Risk | Shared by all empty states; candidate |

### O. ConfirmModal / AdminModal (dialog)

| Attribute | Value |
|---|---|
| Component | `ConfirmModal` (`SharedComponents.tsx:170-225`) → `AdminModal` (frozen Phase 2A.8); consumed by `AdminUsers.tsx:97` |
| Panel L / D | `bg-card-bg` parchment `#C9A070` (L) / `#1F2937` (D); light overlay via `ancient-overlay` class |
| Border/Shadow | `border-border-subtle` gold-tint (L); `--modal-shadow` |
| Family | **Overlay family; panel inherits parchment/gold in L** |
| Risk | Panel surface + amber footer buttons (see L) |

### P. Toast

| Attribute | Value |
|---|---|
| Component | `ToastContainer` → `Toast` (`Toast.tsx`); consumed by `AdminUsers.tsx:138` |
| Panel | Surface-family panel (`bg-card-bg`) + severity Status hues |
| Family | **Overlay + Status (documented, FOUNDATION_VISUAL_FAMILIES §6)** |
| Risk | Panel amber-tinted in L (token-level); severity hues correct |

### Q. Pagination

| Attribute | Value |
|---|---|
| Component | `Pagination` (Foundation); consumed by `UsersTable.tsx:120` |
| Surface | **None** (controls only) |
| Family | Neutral |
| Verdict | Correct — no surface |

---

## 4. Surface Ownership Summary

| Surface | Owner (correct) | Family today | Light language | Candidate for migration |
|---|---|---|---|---|
| Page canvas (`--bg-app`) | Theme | — | Legacy Ancient cream | Yes (token) |
| PageContainer | Foundation Layout | Layout | neutral | — |
| SelectionContainer | Foundation Navigation | Navigation | **amber/gold** | Yes (surface) |
| CollectionToolbar | Foundation Surface | Surface | **amber/parchment** | Yes (surface) |
| Search Input | Foundation Control | Control | gold-tint border | Yes (token) |
| CollectionFilter | Foundation Control | Control | **amber/parchment** | Yes (surface+token) |
| CollectionHeader | Foundation | — | neutral | — |
| CollectionCard row | Foundation CollectionCard | Surface | **amber/parchment** | Yes (surface) |
| Avatar | Foundation Icon/Display | Icon | **Legacy Ancient gold** | Yes (material) |
| Badge (exam/status) | Foundation Status | Status | hues correct; border gold-tint | Token only |
| Row Buttons (success/danger) | Foundation Control | Status-hued | **neutral** | — |
| Primary/Secondary Buttons | Foundation Control | Control | **amber** | Yes (token) |
| GridSkeleton / EmptyState | Foundation Surface | Surface | **gold** | Yes (surface) |
| ConfirmModal / AdminModal | Foundation Overlay | Overlay | **parchment/gold** | Yes (surface) |
| Toast | Foundation Overlay/Status | Overlay+Status | panel amber | Token only |
| Pagination | Foundation | — | neutral | — |

**Every surface has exactly one owner** (Management Page Standard §4). No surface is orphaned,
duplicated, or page-owned. The migration candidate is therefore a **token/Foundation-surface** change,
not a page-composition change.

---

## 5. What Would Need To Change (Current State evidence only — Future Proposal NOT implemented)

For a neutral light Management Surface Family, the **light-mode** resolved values would change for:

| Surface | Token(s) that resolve amber today | File:Line |
|---|---|---|
| Page canvas | `--bg-app` `#E2CFA6` | `themes.css:692` |
| Card family background | `--card-bg = --bg-surface` `#C9A070` | `themes.css:928`, `:693` |
| Card family border | `--card-border`, `--material-card-premium-border` = `--border-gold` | `themes.css:1224`, `:1229` |
| Card family shadow | `--card-shadow = --card-3d-shadow`, `--elevation-carved`, `--elevation-2` | `themes.css:1225`, `:757`, `:824` |
| Card light overrides | `PREMIUM_LIGHT_OVERRIDES` (`light:stat-card-surface`, `light:shadow-premium-card`) on `default`/`premium-neutral`/`premium-dark-neutral` | `AntigravityCard.tsx:25,30,33-34` |
| Control borders | `--border-subtle`, `--input-border`, `--checkbox-border`, `--filter-border` | `themes.css:724,937,1239,979` |
| Button secondary | `--button-surface-secondary`, `--button-border-secondary`, `--button-shadow-secondary` | `themes.css:1232-1237` |
| Button primary | `--material-button-primary-surface/border/text` | `themes.css:1099-1102` |
| Stat/gold material | `--surface-stat`, `--stat-card-bg`, `--stat-card-3d-shadow` | `themes.css:806,1245,817` |
| Selection surface | `--selection-surface` (light gold) | `themes.css:753` region |

This is exactly the scope of `ADMIN_USERS_MANAGEMENT_SURFACE_PROPOSAL.md`. **No value here is changed
in Phase 3.7.**
