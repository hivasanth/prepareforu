# Phase 3.3 — Application Surface Layer Audit

> **Status:** Phase 3.3 (read-only documentation phase). APPROVED.
> **Scope:** 100% discovery. No code, token, color, shadow, border, hover, animation, or component changes.
> **Golden Reference:** The **User Panel** is the ONLY visual reference. Every reusable component must inherit its visual language from the User Panel.
> **Classification:** ✅ Matches User Panel · ⚠ Similar but Different · ❌ Divergent

This document is the single authoritative reference for the application's visual surface architecture. It is one of five deliverables produced by Phase 3.3:

| Deliverable | Purpose |
|---|---|
| `SURFACE_LAYER_AUDIT.md` (this file) | Layers, owners, inheritance, consumers, motion, z-index, lifecycle |
| `SURFACE_TOKEN_INVENTORY.md` | Every design token, its definition, mapping, owner, consumers |
| `SURFACE_PROBLEM_REGISTER.md` | Every problem, legacy surface, competing language, health score |
| `SURFACE_IMPLEMENTATION_PLAN.md` | One-owner map, P0–P4 execution roadmap, freeze map, governance |
| `DESIGN_DECISION_LOG.md` | Decision log preventing reintroduction of discarded patterns |

---

## 1. Theme & Rendering Architecture (Ground Truth)

Discovered from implementation — not assumed.

- **Tailwind v4, CSS-first.** There is **no** `tailwind.config.*`. Configuration lives in `src/index.css` (`@theme` + custom variants) and token definitions live in `src/styles/themes.css` (token-only, 1173 lines).
- **Dark mode is the default** = `:root` in `themes.css`.
- **Light mode** = `.light` class on `<html>` (`@custom-variant light (&:where(.light, .light *))` at `index.css:8`). There is **no** `[data-theme=dark]`.
- **Two CSS files only:** `src/index.css` (Tailwind v4 `@theme` mapping + utilities, 1170 lines) and `src/styles/themes.css` (tokens).
- **Frozen components** may be revisited additively only (see §9 in the implementation plan). Several file paths referenced by older audits have moved (e.g. topic system now lives under `src/components/user/topics/`); all paths in this audit are verified against the current tree.

### 1.1 Root backgrounds

| Utility | Token | Dark (`:root`) | Light (`.light`) |
|---|---|---|---|
| `bg-app-bg` | `--bg-app` | `#111827` (themes.css:427) | `#E2CFA6` (themes.css:671) |
| `bg-surface` | `--bg-surface` | `#1F2937` (themes.css:428) | `#C9A070` (themes.css:672) |
| `bg-elevated` | `--bg-elevated` | `#374151` (themes.css:429) | `#FFF8E7` (themes.css:673) |
| `bg-hover-bg` | `--bg-hover` | `#1F2937` (themes.css:430) | `#D5B486` (themes.css:674) |
| `bg-active` | `--bg-active` | `#374151` (themes.css:431) | `#C8A473` (themes.css:675) |

---

## 2. Step 1 — Discovered Layer Hierarchy

The sample layer list in the brief is **not** the real hierarchy. The hierarchy below was discovered from the implementation. Layers are ordered from the outermost page surface to the innermost floating/overlay surfaces.

| # | Layer | Real name | Verified source |
|---|---|---|---|
| L0 | Application background | App Canvas | `body`/`main` `bg-app-bg`; light radial parchment `--gradient-app` |
| L1 | Sidebar / Navigation shell | Sidebar Surface | `Navigation` + `SidebarLayout`; `.ancient-sidebar` (light) / `bg-card-bg` (dark) |
| L2 | Page surface | Page Canvas | `PageContainer` (transparent; `bg-app-bg` shows through) |
| L3 | Section surface | Section Block | `SectionBlock`/`SectionWrapper` (transparent spacing) |
| L4 | Toolbar surface | CollectionToolbar / FilterBar | `AntigravityLayout.tsx:217` — premium Card family |
| L5 | Card surface | Card / StatCard | `AntigravityCard.tsx` variants (premium family = golden reference) |
| L6 | Collection surface | CollectionCard | `CollectionCard.tsx` — composite delegating surface to `Card` |
| L7 | Selection surface | SelectionContainer | `AntigravityLayout.tsx:63` — premium selection material |
| L8 | Control surface | Buttons, Tabs, Badges | `AntigravityButton.tsx`, `AntigravityData.tsx` |
| L9 | Input surface | Input / Select / Checkbox / Switch | `AntigravityForm.tsx` |
| L10 | Dropdown surface | Menu / PremiumSelect panel | `Menu.tsx` (`Menu.Content`), `PremiumSelect.tsx:211` |
| L11 | Modal surface | AdminModal + independent modals | `AdminModal.tsx:82`, `AddExamModal.tsx:193/200`, `LanguageSelectionScreen.tsx:28`, `ReviewLayout.tsx:48` |
| L12 | Overlay surface | Backdrops, LoadingOverlay, UploadProgressOverlay | `AdminModal.tsx:78`, `LoadingOverlay.tsx:18`, `UploadProgressOverlay.tsx:26` |
| L13 | Toast surface | ToastContainer | `useToast.tsx:37` (inline styles — no token owner) |
| L14 | Loading / Skeleton surface | LoadingSkeleton / StatSkeleton / Spinner / PortalLoadingSkeleton | `SharedComponents.tsx`, `Spinner.tsx` |
| L15 | Chart surface | Chart / Metric containers | `DiagramRenderer.tsx`, `AntigravityResults.tsx` |
| L16 | Badge / Tag surface | Badge / Tag / Pill | `AntigravityData.tsx` (Badge), `TagBadge.tsx` |
| L17 | Stat surface | StatCard tiles | `AntigravityCard.tsx` (StatCard), `stat-card-surface` |

> **No Popover layer exists.** The application has zero generic Popover components. Tooltip behaviour is provided by the frozen `Tooltip` (DS-008A-adjacent) and dropdown behaviour by `Menu`/`PremiumSelect`. `NotificationPanel` is a Menu-based panel. The "Popover" layer is deliberately absent — see Problem Register P-009.

---

## 3. Step 2/3 — Surface Detail & Inventory

### 3.1 Canonical premium surface (Golden Reference)

The **User Panel premium card** is the only reference. Its recipe is the frozen `Card`/`StatCard` variants in `AntigravityCard.tsx`:

```
rounded-2xl
bg-card-bg                 (dark #1F2937 / light #C9A070)
border-[1.8px]
border-card-premium-border (dark transparent / light #A87828)
shadow-card-shadow         (dark --elevation-2 / light --card-3d-shadow inset gold + 5px 6px 0px)
hover:shadow-card-premium  (dark --elevation-carved [UNDEFINED] / light carved gold 3D)
light:stat-card-surface    (gold gradient #D4A55A → #BF8A30)
light:shadow-premium-card
light:border-card-premium-border
```

**User Panel golden-reference consumers:** `src/components/user/topics/TopicCard.tsx`, `ExamCard` (dashboard), `AttemptCardBase`/`RecentAttemptCard` (history), `StatCard` tiles (performance), `Card` usage in user pages.

### 3.2 Layer detail table

| Layer | Owner component | Files | Consumers | Background | Border | Radius | Elevation/Shadow | Hover | Status vs User Panel |
|---|---|---|---|---|---|---|---|---|---|
| L0 App Canvas | `body`/layout | `main.tsx`, `SidebarLayout.tsx:296`, `index.css` | all pages | `bg-app-bg` | none | n/a | none | n/a | ✅ base |
| L1 Sidebar | `Navigation` (DS-009A frozen) | `Navigation.tsx`, `SidebarLayout.tsx` | User/Admin/SubAdmin layouts | `bg-card-bg` (dark) / `.ancient-sidebar` (light) | `border-r border-border-subtle` (dark) / `sidebar-border` (light) | n/a | `shadow-sm` header | `hover:bg-hover-bg` items | ⚠ legacy `.ancient-sidebar` |
| L2 Page | `PageContainer` (DS-012 frozen) | `AntigravityLayout.tsx` | all pages | transparent (`bg-app-bg` shows) | none | n/a | none | n/a | ✅ |
| L3 Section | `SectionBlock` | `AntigravityLayout.tsx` | all pages | transparent | none | n/a | none | n/a | ✅ |
| L4 Toolbar | `CollectionToolbar`/`FilterBar` (frozen 3.2.2) | `AntigravityLayout.tsx:217` | Questions, Users, SubAdmins, Students, Exams | `bg-card-bg` | `border-[1.8px] border-card-premium-border` | `rounded-2xl` | `shadow-card-shadow` → `hover:shadow-card-premium` | `hover:shadow-card-premium` | ✅ matches premium Card |
| L5 Card | `Card` (DS-001 frozen) | `AntigravityCard.tsx` | 37+ (admin+user+auth) | per variant | per variant | `rounded-2xl` (auth `rounded-[2.5rem]`) | `shadow-card-shadow`/`shadow-elevation-3` | `-translate-y-0.5` + premium shadow | ✅ GOLDEN REFERENCE |
| L6 Collection | `CollectionCard` (frozen 3.2.1) | `CollectionCard.tsx` | Questions, Leaderboard, Students, History, Search, Notifications, Exams, Topics, Admin lists | delegates to `Card` | delegates | delegates | delegates | delegates | ✅ |
| L7 Selection | `SelectionContainer` | `AntigravityLayout.tsx:63` | questions/exam/paper/subject selection | `selection-surface` (dark) / `light:selection-container-dark` | `border-[1.8px] border-card-premium-border` | `rounded-2xl` | `shadow-card-premium` | n/a | ✅ premium family |
| L8 Control | `Button`/`Tabs`/`Badge`/`IconButton` | `AntigravityButton.tsx`, `AntigravityData.tsx` | entire app | `bg-primary`/`bg-card-bg`/`bg-hover-bg` | `border-[1.8px]` primary border (light) / `border-border-subtle` | `rounded-[10px..18px]` (button), `rounded-xl` (tab) | `--material-button-*` / `shadow-elevation-2` | `hover:-translate-y-0.5`, `brightness-110` | ⚠ secondary button = premium family, dark gap |
| L9 Input | `Input`/`Select`/`Checkbox`/`Switch`/`RadioGroup` (DS-013 frozen) | `AntigravityForm.tsx` | admin + auth + exam forms | `bg-hover-bg` / `.light .ancient-input` | `border border-border-subtle`, focus `border-primary` | `rounded-xl` | none | `hover:border-primary/70` | ✅ control family |
| L10 Dropdown | `Menu` (DS-008A frozen v1.1), `PremiumSelect` | `Menu.tsx:275`, `PremiumSelect.tsx:211` | FilterSelect, NotificationPanel, CollectionFilter, DailyAttemptsChart, ExamListSection, Settings | `bg-card-bg` | `border border-border-subtle` (Menu) | `rounded-2xl` | `shadow-elevation-4` | per item `hover:bg-hover-bg` | ✅ floating family |
| L11 Modal | `AdminModal` (frozen 2A.8) + independent | `AdminModal.tsx:82`, `AddExamModal.tsx:200`, `LanguageSelectionScreen.tsx:28`, `ReviewLayout.tsx` | admin CRUD, add exam, language selection, submit confirm | `bg-card-bg` | `border border-border-subtle` | **`rounded-[2.5rem]` (not tokenized)** | `shadow-2xl` | n/a | ⚠ radius un-tokenized, three different radius values |
| L12 Overlay | per-modal backdrops + `LoadingOverlay` | `AdminModal.tsx:78`, `LoadingOverlay.tsx:18`, `UploadProgressOverlay.tsx:26` | all modals, load states | `bg-app-bg/60`–`/95`, `bg-card-bg/40` | none | n/a | `backdrop-blur-*` | n/a | ⚠ three different backdrop opacities |
| L13 Toast | `ToastContainer` — **no Foundation owner** | `useToast.tsx:37` | every page via `useToast` | **inline `var(--card-bg, #1f2937)`** | **inline 2px `var(--success)/var(--danger)`** | `rounded-2xl` | `shadow-2xl` | n/a | ❌ inline styles, hardcoded fallbacks |
| L14 Loading | `LoadingSkeleton`/`StatSkeleton`/`Spinner` | `SharedComponents.tsx`, `Spinner.tsx` | CollectionCard, DataTable, Portal loading | `stat-card-surface` (skeleton family) | `border border-border-gold` | `rounded-2xl`/`rounded-[24px]`/`rounded-[32px]` | `shadow-premium-carved`/`shadow-premium-card` | n/a | ⚠ three different skeleton radii |
| L15 Chart | `ChartVisualizer`/`MetricBlock` | `DiagramRenderer.tsx`, `AntigravityResults.tsx` | dashboards, diagrams, results | `bg-card-bg/40`–`/50` | `border-border-subtle/30` | `rounded-2xl`/`rounded-xl` | `shadow-sm`, tooltip `0 10px 15px` | `hover:scale-105` | ⚠ recharts tooltip inline styles |
| L16 Badge/Tag | `Badge` (DS-002 frozen) / `TagBadge` | `AntigravityData.tsx`, `TagBadge.tsx` | everywhere | state tints (`bg-success/10` etc.) | `border-success/20` etc. | `rounded-full`/`rounded-xl` | `shadow-sm` | n/a | ✅ |
| L17 Stat | `StatCard` (frozen 2A.2) | `AntigravityCard.tsx`, `AntigravityLayout.tsx:54` | dashboard, performance, results | `stat-card-surface` (gold gradient light) / `bg-hover-bg/20` | `border-border-gold` | `rounded-2xl` | `shadow-premium-card`/`shadow-premium-carved` | n/a | ✅ stat family |

### 3.3 Surface inventory (complete)

| Layer | Owner | Component | Files | Consumers | Status |
|---|---|---|---|---|---|
| L0 | Layout | App canvas | `SidebarLayout.tsx`, `index.css` | all pages | ✅ |
| L1 | Navigation | `Navigation` | `Navigation.tsx` | 3 layouts | ⚠ |
| L2 | PageContainer | `PageContainer` | `AntigravityLayout.tsx` | all pages | ✅ |
| L3 | SectionBlock | `SectionBlock`/`SectionWrapper` | `AntigravityLayout.tsx` | all pages | ✅ |
| L4 | CollectionToolbar | `CollectionToolbar`/`FilterBar` | `AntigravityLayout.tsx` | Questions, Users, SubAdmins, Students, Exams | ✅ |
| L5 | Card | `Card`/`StatCard` | `AntigravityCard.tsx` | 37+ files | ✅ |
| L6 | CollectionCard | `CollectionCard` | `CollectionCard.tsx` | 10+ collection pages | ✅ |
| L7 | SelectionContainer | `SelectionContainer` | `AntigravityLayout.tsx` | exam/paper/subject selection | ✅ |
| L8 | Button/Tabs/Badge | `Button`, `Tabs`, `Badge` | `AntigravityButton.tsx`, `AntigravityData.tsx` | entire app | ⚠ |
| L9 | Input/Form | `Input`, `Select`, `Checkbox`, `Switch`, `RadioGroup` | `AntigravityForm.tsx` | admin/auth/exam | ✅ |
| L10 | Menu | `Menu`, `PremiumSelect` | `Menu.tsx`, `PremiumSelect.tsx` | 5+ dropdowns | ✅ |
| L11 | AdminModal | `AdminModal` | `AdminModal.tsx` | admin CRUD | ⚠ |
| L12 | Overlay | backdrops + `LoadingOverlay` | multiple | all modals | ⚠ |
| L13 | **NONE** | `ToastContainer` | `useToast.tsx` | every page | ❌ |
| L14 | SharedComponents | `LoadingSkeleton`/`StatSkeleton` | `SharedComponents.tsx` | CollectionCard, DataTable | ⚠ |
| L15 | ChartVisualizer | chart wrappers | `DiagramRenderer.tsx`, `AntigravityResults.tsx` | dashboards | ⚠ |
| L16 | Badge | `Badge` | `AntigravityData.tsx` | everywhere | ✅ |
| L17 | StatCard | `StatCard` | `AntigravityCard.tsx` | dashboard/perf/results | ✅ |

---

## 4. Steps 4–7 — Background, Border, Shadow, Radius Audits

### 4.1 Background audit (Step 4)

| Class | Token | Consumer occurrences (current tree) |
|---|---|---|
| `bg-card-bg` | `--bg-surface` | 74 occurrences / 48 files |
| `bg-hover-bg` | `--bg-hover` | 125 occurrences / 54 files |
| `bg-app-bg` | `--bg-app` | layout + loading + modal backdrops + auth pages |
| `bg-primary/*` | `--primary` | 42+ `bg-primary/10` alone; fills + tints everywhere |
| `bg-card-premium-surface` | `--material-card-premium-surface` | 1 / 1 (`AntigravityCard.tsx`) |
| `light:stat-card-surface` | `--stat-card-bg` gold gradient | 5 / 2 (`AntigravityCard`, `AntigravityLayout`) |
| `bg-selected-row` | `--selected-row` | DataGrid/Tabs selection |
| `selection-surface` | `--selection-surface` | SelectionContainer, ThemeToggle |
| `bg-stripe-bg` | `--stripe-bg` | DataGrid striping |
| `nav-active-surface` | `--nav-active-surface` | Navigation active pill |
| `bg-hover-bg/20` etc. | opacified | MetricBlock, PreviewTab, DiagramRenderer |
| `color-mix()`/`rgba()`/hex | — | see hardcoded register (`SURFACE_PROBLEM_REGISTER.md` §Legacy) |

### 4.2 Border audit (Step 5)

| Border class | Token | Files | Notes |
|---|---|---|---|
| `border-border-subtle` | `--border-subtle` | 200 occurrences / 87 files | single most-used border; dark `#374151`, light `rgba(168,120,22,0.30)` |
| `border-card-border` | `--card-border` | Card default/elevated/subtle | dark `rgba(55,65,81,0.5)`, light `--border-gold #A87828` |
| `border-card-premium-border` | `--material-card-premium-border` | `AntigravityButton`, `AntigravityCard`, `AntigravityForm`, `AntigravityLayout`, `ThemeToggle` | **transparent in dark** → premium cards lose borders in dark mode (❌) |
| `border-border-gold` | `--border-gold` | StatCard skeleton family, `AntigravityLayout` | `--border-gold` is **undefined in dark** (❌) |
| `border-primary/*` | `--primary` | focus rings, selected states | ✅ |
| raw hex borders | — | topic notebook (`border-[var(--border-gold)]`, `#8B5A10`) | legacy notebook language |
| **Border width duplication** | `border` vs `border-[1.8px]` vs `border-[1.5px]` vs `border-[2px]` vs `border-[2.5px]` vs `border-[3px]` | Card 1.8px premium; notebook 1.5–3px | non-uniform width language |

### 4.3 Shadow / elevation audit (Step 6)

| Shadow utility | Token | Occurrences | Dark | Light |
|---|---|---|---|---|
| `shadow-card-shadow` | `--card-shadow` | 8 / 4 files | `--elevation-2` | `--card-3d-shadow` (inset gold + `5px 6px 0px`) |
| `shadow-card-hover-shadow` | `--card-hover-shadow` | Card elevated | `--elevation-raised`→`--shadow-md` | `--shadow-contact` |
| `shadow-card-premium` | `--material-card-premium-shadow` | 9 / 6 files | `--elevation-carved` (**undefined in dark**) | `light:shadow-premium-card` carved gold 3D |
| `shadow-elevation-1..4` | `--elevation-1..4` | 18 / 9 files | soft black | **inset 3D bevels** (elevation-2/3) in light |
| `shadow-2xl` | Tailwind literal | 15 / 15 files | — | — |
| `shadow-xl` | Tailwind literal | 13 / 11 files | — | — |
| `shadow-sm`/`shadow-lg` | Tailwind literals | several | — | — |
| `shadow-premium-card` | `--premium-card` primitive | StatCard/skeleton | — | light carved 3D |
| `shadow-premium-carved` | `--premium-carved` primitive | StatCard skeleton | — | light carved 3D |
| `shadow-premium-icon` | `--premium-icon` primitive | `PremiumIconContainer` | — | light carved 3D |
| arbitrary `shadow-[...]` | — | topic notebook `[2px_2px_0px_#8B5A10]` … `[8px_8px_0px_#8B5A10]`; `SubjectCardItem` `[0_0_15px_rgba(...)]`; recharts tooltip | — | legacy notebook 3D offsets + brand glows |

> **Key finding:** `--elevation-carved` is undefined in dark mode → the premium hover shadow (`hover:shadow-card-premium`) silently falls back in dark. This is a root token gap (see `SURFACE_TOKEN_INVENTORY.md` §Discrepancies).

### 4.4 Radius audit (Step 7)

| Radius | Occurrences | Owner |
|---|---|---|
| `rounded-xl` | controls, tabs, metric blocks | Input/Select/Checkbox, DataGrid |
| `rounded-2xl` | 88 / 51 files — cards, toolbars, dropdowns, modals-panel, toast | Card family |
| `rounded-3xl` | 13 / 8 files | skeleton family, admin tablet cards, topic reader |
| `rounded-full` | avatars, badges, switches | Avatar/Badge/Switch |
| `rounded-[10px]`–`[18px]` | Button sizes | Button |
| `rounded-[24px]`/`[28px]`/`[32px]`/`[36px]` | **arbitrary** — `AntigravityResults`, modal panels, `LanguageSelectionScreen`, `ReviewLayout`, `SharedComponents` skeleton, `AntigravityButton auth-xl` | **not tokenized** (❌) |
| `rounded-[2.5rem]` | **arbitrary** — AdminModal panel, AddExamModal, `Card auth-light` | **not tokenized** (❌) |

> **Radius token conflict:** `themes.css` defines `--radius-xl: 20px`, `--radius-2xl: 24px`, `--radius-3xl: 20px` while `@theme` maps `radius-xl: 12px`, `radius-2xl: 16px`, `radius-3xl: 20px`. Two authorities disagree (see `SURFACE_TOKEN_INVENTORY.md` D-01).

---

## 5. Step 8 — Premium Surface Audit (one language or many?)

**Conclusion: there are two premium sub-languages plus one legacy gold system.**

| Component | Surface recipe | Language | Verdict |
|---|---|---|---|
| `Card` premium / premium-neutral / premium-dark-neutral | `bg-card-bg|bg-card-premium-surface` + 1.8px premium border + `shadow-card-shadow`→`hover:shadow-card-premium` + `light:stat-card-surface light:shadow-premium-card` | **Premium (golden reference)** | ✅ |
| `StatCard` | `stat-card-surface` gold gradient + `border-border-gold` + `shadow-premium-card` | Stat (premium-derived) | ✅ |
| `CollectionToolbar`/`FilterBar` | identical to `Card premium-neutral` | Premium | ✅ |
| `CollectionCard` | delegates to `Card` | Premium | ✅ |
| `SelectionContainer` | `selection-surface` + 1.8px premium border + `shadow-card-premium` | Premium | ✅ |
| `CollectionFilter` trigger | `bg-card-bg border-border-subtle shadow-card-shadow hover:shadow-card-premium` | **Control + premium shadow mix** | ⚠ inherits control border, premium hover — intentional, differs from toolbar |
| `PremiumSelect` trigger/panel | `bg-hover-bg border-border-subtle` + panel `bg-card-bg rounded-2xl border-border-subtle shadow-elevation-4` | Control + floating | ⚠ panel is its own recipe (duplicate of `Menu.Content`) |
| `Menu` panel | `bg-card-bg border-border-subtle rounded-2xl shadow-elevation-4 ancient-overlay` | Floating | ✅ |
| `Alert` | state tints | Alert | ✅ |
| `AdminModal` | `bg-card-bg border-border-subtle rounded-[2.5rem] shadow-2xl` | Modal | ⚠ un-tokenized radius/shadow |
| Question cards (exam) | `Card variant="elevated"` (neutral) | **Neutral (intentional deviation)** | ✅ documented deviation |
| Leaderboard | raw `<tr>` rows + `LeaderboardTabletCard`/`LeaderboardMobileCard` (neutral `bg-card-bg border rounded-3xl`) | Neutral | ⚠ fragmentation |
| Topic notebook | parchment `#FFFDF9`/`#F5EAD4` + hard-offset gold `shadow-[..px_..px_0px_#8B5A10]` | **Legacy Notebook** | ❌ separate language |
| WelcomeBanner | `.ancient-card-dark` forest gradient | **Legacy Ancient** | ❌ separate language |

**There is exactly ONE premium language** (the frozen `Card` premium family). The "second surface language" observed in Bulk Upload / CollectionToolbar / CollectionFilter is in fact this same premium family — with two inherited dark-mode defects (transparent premium border, undefined carved elevation).

---

## 6. Step 9 — Layer Hierarchy Diagram

```
Application (bg-app-bg)
│
├── Sidebar / Navigation shell (Navigation / SidebarLayout)
│     ├── nav items  (Navigation.Item → active pill, tooltip)
│     ├── logo, role badge, theme toggle, sign-out
│     └── mobile drawer + backdrop (z-[60]/[70])
│
├── Page Canvas (PageContainer, transparent)
│     └── Section (SectionBlock)
│           ├── CollectionToolbar / FilterBar  (premium Card family)
│           │     ├── search Input (control family)
│           │     ├── CollectionFilter (Menu dropdown)
│           │     ├── PremiumSelect (large lists)
│           │     └── Buttons (Button)
│           ├── SelectionContainer (selection surface)
│           ├── CollectionCard list / grid  → Card  (premium family)
│           │     └── Badge, PremiumIconContainer, Progress, StatCard
│           ├── DataGrid / DataTable  →  Card shell, striped rows, Pagination
│           ├── Chart surfaces (DiagramRenderer / recharts)
│           └── StatCard tiles (stat family)
│                 └── modal (AdminModal / AddExamModal / …)
│                       └── overlay backdrop + LoadingOverlay
│
├── Toast (fixed, z-[99999], NO Foundation owner)
└── Fullscreen: Splash (z-[9999]), LoadingScreen (z-[100]), uploading overlay (z-[200])
```

---

## 7. Step 10 — Golden Reference Comparison

| Surface | Status | Evidence |
|---|---|---|
| User Panel `Card` premium family | ✅ **GOLDEN** | `AntigravityCard.tsx:20-22` |
| `StatCard` | ✅ | `AntigravityCard.tsx` StatCard + `AntigravityLayout.tsx:54` |
| `CollectionToolbar` | ✅ | `AntigravityLayout.tsx:217` identical recipe |
| `CollectionCard` | ✅ | delegates surface to `Card` |
| `SelectionContainer` | ✅ | `AntigravityLayout.tsx:63` premium selection |
| `Menu` panel | ✅ (floating family) | `Menu.tsx:275` |
| `CollectionFilter` | ⚠ | trigger = control border + premium hover; deliberate |
| `PremiumSelect` | ⚠ | own panel recipe (duplicate of Menu.Content) |
| `Button` secondary | ⚠ | premium family but dark hover shadow missing (`--elevation-carved` gap) |
| `AdminModal` | ⚠ | `rounded-[2.5rem]`, `shadow-2xl` un-tokenized |
| `ToastContainer` | ❌ | inline styles + hardcoded fallbacks, no owner |
| Topic notebook | ❌ | parchment hex + hard-offset gold shadows |
| WelcomeBanner | ❌ | `.ancient-card-dark` |
| Exam `QuestionCard` | ⚠ | **intentional** neutral deviation (approved DS) |
| Leaderboard composites | ⚠ | fragmentation; neutral surfaces |
| Auth pages (`Card auth-light/violet`) | ⚠ | separate auth language |

---

## 8. Step 11 — Surface Duplication Audit

| Duplicate | Location(s) | Detail |
|---|---|---|
| `premium-neutral` ≡ `premium-dark-neutral` | `AntigravityCard.tsx:21-22` | identical class strings — one is dead |
| `Menu.Content` redundant border pair | `Menu.tsx:275` | `border ... border-border-subtle` (one utility covers both) |
| `PremiumSelect` panel vs `Menu.Content` | `PremiumSelect.tsx:211` vs `Menu.tsx:275` | two implementations of the same floating panel recipe |
| `CollectionToolbar` vs `Card premium` | `AntigravityLayout.tsx:217` | hand-rolled duplicate of the Card premium recipe (frozen as-is; would ideally compose `Card`) |
| Selected-row state | `CollectionCard.tsx:109`, DataGrid, Tabs, NotificationPanel | three implementations of `bg-primary/5`-style selection |
| Toast surface | `useToast.tsx:54` | duplicated `rounded-2xl shadow-2xl` + border width/color inline |
| Modal panel surface | `AdminModal`, `AddExamModal`, `LanguageSelectionScreen`, `ReviewLayout` | three different radius values for the same "modal panel" layer |
| Skeleton family | `SharedComponents.tsx:16/34/58/129` | three different radii for the same skeleton layer |
| Notification panel trigger | `NotificationPanel.tsx:161` | wraps `Menu` but restyles trigger — acceptable (consumer owns trigger) |
| Tag systems | `TagBadge.tsx` vs `Badge` | separate tag implementation vs frozen Badge |

---

## 9. Step 15 — Surface Adoption Audit

For every reusable component: does it **inherit** an existing surface or **create** its own?

| Component | Current surface | Should inherit from | Consumers | Verdict |
|---|---|---|---|---|
| `Card` | premium Card (golden) | Foundation Card | User Panel + admin | ✅ inherits (is the foundation) |
| `CollectionCard` | delegates to `Card` | Card | Admin Questions | ✅ |
| `CollectionToolbar`/`FilterBar` | premium toolbar | Card | Questions, Users, SubAdmins | ⚠ hand-rolled recipe (frozen) |
| `CollectionFilter` | premium dropdown | Menu | Questions | ✅ (v1.1 built on Menu) |
| `PremiumSelect` | own trigger + own panel | CollectionToolbar + Menu panel | Settings, filters | ❌ duplicate panel |
| `Button` secondary | premium family | Button | entire app | ⚠ dark hover gap |
| `ThemeToggle` | selection-surface | SelectionContainer | SidebarLayout, settings | ✅ |
| `SegmentedFilter` | own pill | Tabs | Users, admin filters | ❌ own pill surface |
| `BilingualToggle` | own | Tabs/RadioGroup | user pages | ❌ own toggle surface |
| `NotificationPanel` | Menu | Menu | user/admin headers | ✅ |
| `TopicInfoButton` | raw `shadow-xl` tooltip | frozen `Tooltip` | topics | ❌ duplicate tooltip surface |
| `ToastContainer` | inline styles | (needs Foundation Toast) | every page | ❌ no surface owner |
| `WelcomeBanner` | `.ancient-card-dark` | Card (hero variant) | User Dashboard | ❌ legacy |
| Topic notebook | parchment hex | Notebook surface / Card | topics reader | ❌ legacy |
| `CarouselDots` | gold primitive dots | (tokenize) | User Dashboard | ❌ primitive leak |
| `AdminIconWrap`/`IconBadge` | own icon wrappers | `PremiumIconContainer`/`IconBadge` | admin | ⚠ duplicate icon systems |

---

## 10. §1 — Foundation Layer Ownership Matrix

One owner per visual layer. Never two.

| Layer | Owner | Files | Consumers | Status |
|---|---|---|---|---|
| L0 App Canvas | Layout (body/main) | `SidebarLayout.tsx`, `index.css` | all | Foundation Owner ✅ |
| L1 Sidebar | `Navigation` (DS-009A) | `Navigation.tsx` | 3 layouts | Foundation Owner ✅ |
| L2 Page | `PageContainer` (DS-012) | `AntigravityLayout.tsx` | all | Foundation Owner ✅ |
| L3 Section | `SectionBlock` | `AntigravityLayout.tsx` | all | Foundation Owner ✅ |
| L4 Toolbar | `CollectionToolbar`/`FilterBar` (3.2.2) | `AntigravityLayout.tsx` | 5+ pages | Foundation Owner ✅ |
| L5 Card | `Card`/`StatCard` (DS-001/2A.2) | `AntigravityCard.tsx` | 37+ files | Foundation Owner ✅ |
| L6 Collection | `CollectionCard` (3.2.1) | `CollectionCard.tsx` | 10+ | Foundation Owner ✅ |
| L7 Selection | `SelectionContainer` | `AntigravityLayout.tsx` | 3 | Foundation Owner ✅ |
| L8 Control | `Button`/`Tabs`/`Badge`/`IconButton` | `AntigravityButton.tsx`, `AntigravityData.tsx` | entire app | Foundation Owner ✅ |
| L9 Input | `Input`/`Select`/`Checkbox`/`Switch`/`RadioGroup` (DS-013) | `AntigravityForm.tsx` | admin/auth/exam | Foundation Owner ✅ |
| L10 Dropdown | `Menu` (DS-008A) | `Menu.tsx` | 5+ | Foundation Owner ✅ |
| L11 Modal | `AdminModal` (2A.8) | `AdminModal.tsx` | admin CRUD | Foundation Owner ⚠ (independent modals bypass) |
| L12 Overlay | `AdminModal` backdrop + `LoadingOverlay` | `AdminModal.tsx`, `LoadingOverlay.tsx` | all modals | ⚠ shared overlay contract needed |
| L13 Toast | **NO OWNER** | `useToast.tsx` | every page | ❌ **vacant** |
| L14 Loading | `LoadingSkeleton`/`StatSkeleton`/`Spinner` | `SharedComponents.tsx`, `Spinner.tsx` | CollectionCard, DataTable | ⚠ radii inconsistent |
| L15 Chart | `ChartVisualizer`/`MetricBlock` | `DiagramRenderer.tsx`, `AntigravityResults.tsx` | dashboards | ⚠ |
| L16 Badge | `Badge` (DS-002) | `AntigravityData.tsx` | everywhere | Foundation Owner ✅ |
| L17 Stat | `StatCard` | `AntigravityCard.tsx` | dashboard/perf/results | Foundation Owner ✅ |

---

## 11. §2 — Surface Inheritance Tree

```
User Panel (GOLDEN REFERENCE)
└── Card (premium family)
      ├── StatCard  (stat family)
      ├── CollectionToolbar / FilterBar
      ├── SelectionContainer
      ├── CollectionCard  → Card
      ├── AttemptCardBase / RecentAttemptCard
      ├── ExamCard, TopicCard, PerformanceMetric tiles
      └── DataTable → Card shell
Menu (dropdown)
      ├── PremiumSelect (❌ duplicates panel)
      ├── CollectionFilter (✅)
      └── NotificationPanel (✅)
AntigravityForm (controls)
      ├── Input / Select / Checkbox / Switch / RadioGroup
      └── CollectionFilter trigger (inherits control border)
AntigravityButton (buttons)
      └── Button secondary → premium family
AntigravityLayout (layout)
      ├── PageContainer → SectionBlock → SectionHeader
      └── FilterBar (deprecated alias of CollectionToolbar)
Navigation → sidebar
SharedComponents → LoadingSkeleton / StatSkeleton
```

---

## 12. §3 — Surface Creation Audit

Every reusable component answered: **✅ inherits** or **❌ creates**.

| Component | Inherits | Creates |
|---|---|---|
| Card, StatCard | — (foundation source) | ✅ (defines golden recipe) |
| CollectionCard | ✅ Card | — |
| CollectionToolbar | ✅ Card premium recipe (hand-rolled copy) | ⚠ |
| SelectionContainer | ✅ premium family | — |
| CollectionFilter | ✅ Menu | — |
| PremiumSelect | ❌ own panel | ✅ |
| Button | — (foundation source) | ✅ (defines button recipe) |
| Input/Select/Checkbox/Switch/RadioGroup | — (foundation source) | ✅ |
| Menu | — (foundation source) | ✅ |
| AdminModal | — (foundation source) | ✅ |
| NotificationPanel | ✅ Menu | — |
| ThemeToggle | ✅ SelectionContainer | — |
| SegmentedFilter | ❌ | ✅ own pill surface |
| BilingualToggle | ❌ | ✅ own toggle surface |
| TopicInfoButton | ❌ | ✅ raw tooltip surface |
| ToastContainer | ❌ | ✅ inline-styled surface |
| WelcomeBanner | ❌ | ✅ `.ancient-card-dark` |
| Topic notebook (TopicSectionRenderer/TopicReader) | ❌ | ✅ parchment surface |
| TagBadge | ❌ | ✅ own tag surface |
| IconBadge / AdminIconWrap | ⚠ | ✅ own icon wrapper surfaces |
| CarouselDots | ❌ | ✅ gold primitive dots |
| LeaderboardView/Tablet/Mobile | ⚠ | ✅ own neutral row/card surfaces |

> **This is the most important finding of Phase 3.3.** Eleven components create their own surface instead of inheriting. Each is registered in `SURFACE_PROBLEM_REGISTER.md`.

---

## 13. §5 — Visual Dependency Graph

```
CollectionCard ──▶ Card ──▶ Design Tokens (themes.css)
CollectionToolbar ──▶ Card ──▶ Layout (AntigravityLayout) ──▶ Tokens
CollectionFilter ──▶ Menu ──▶ Tokens
PremiumSelect ──▶ (own panel) ──▶ Tokens   [❌ should point to Menu]
Button ──▶ Button Tokens (--material-button-*) ──▶ Typography ──▶ Motion
Input/Select/Checkbox/Switch ──▶ Control Tokens ──▶ Typography
AdminModal ──▶ Overlay Tokens (backdrop, --card-bg) ──▶ Tokens
StatCard ──▶ Stat Tokens (stat-card-surface, border-gold) ──▶ Tokens
DataTable ──▶ DataGrid ──▶ Card ──▶ Tokens
Navigation ──▶ Nav Tokens (nav-active-surface, sidebar-*) ──▶ Tokens
ThemeToggle ──▶ SelectionContainer ──▶ Selection Tokens
ToastContainer ──▶ ⛔ NONE (inline)   [❌]
```

---

## 14. §6 — Consumer Hierarchy

Foundation components grouped by consuming surface area.

| Component | Admin | User | Sub Admin | Exam | Auth | Shared |
|---|---|---|---|---|---|---|
| Card | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| StatCard | ✅ | ✅ | — | ✅ | — | ✅ |
| CollectionCard | ✅ | ✅ | ✅ | — | — | ✅ |
| CollectionToolbar | ✅ | ✅ | ✅ | — | — | ✅ |
| CollectionFilter | ✅ | — | — | — | — | ✅ |
| PremiumSelect | ✅ | — | ✅ | — | — | ✅ |
| Menu | ✅ | ✅ | ✅ | — | — | ✅ |
| Button | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Input/Form | ✅ | — | ✅ | — | ✅ | ✅ |
| AdminModal | ✅ | ✅ | ✅ | — | — | ✅ |
| DataGrid/DataTable | ✅ | — | ✅ | — | — | ✅ |
| Tabs | ✅ | ✅ | ✅ | — | — | ✅ |
| Badge | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Navigation | ✅ | ✅ | ✅ | — | — | ✅ |
| LoadingSkeleton | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| ToastContainer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 15. §7 — Visual Complexity Score

Approximate: consumer count + visual responsibility + duplicate responsibility + maintenance impact.

| Rank | Component | Notes |
|---|---|---|
| **Critical** | Card, Button, Menu, Input/Form | highest consumers; several frozen; Menu v1.1 |
| **Critical** | ToastContainer | highest reach (every page), zero ownership, inline styles |
| **High** | CollectionCard, CollectionToolbar, StatCard, Navigation, DataGrid/DataTable, AdminModal, Tabs | broad consumers, frozen composites |
| **High** | PremiumSelect, Topic notebook | own-surface components with duplicate responsibility |
| **Medium** | CollectionFilter, SelectionContainer, NotificationPanel, ThemeToggle, LoadingSkeleton | moderate reach, mostly inheriting |
| **Medium** | WelcomeBanner, SegmentedFilter, BilingualToggle, TagBadge, IconBadge | legacy/duplicate surface creators |
| **Low** | CarouselDots, LeaderboardTablet/Mobile, AdminIconWrap, RetryButton, Spinner | contained, single-purpose |

---

## 16. §12 — Component Variant Matrix

| Component | Variants | Consumers | Golden variant | Deprecated / duplicate |
|---|---|---|---|---|
| Card | `default`, `elevated`, `premium`, `premium-neutral`, `premium-dark-neutral`, `subtle`, `auth-light` | 37+ files | `premium` (User Panel) | `premium-neutral` ≡ `premium-dark-neutral` (one is dead) |
| StatCard | `color` legacy escape (Phase 2A.2 debt) | dashboard/perf/results | `status` (future) | legacy `color` raw-hex prop |
| Button | `primary`, `secondary`, `success`, `danger`, `outline`, `ghost`, `dark`, `light`, `violet`, `auth-xl`, `IconButton` | entire app | `primary` | none |
| Badge | `default`, `secondary`, `success`, `warning`, `danger`, `info` | everywhere | `default` | `TagBadge` separate |
| CollectionCard | `grid`, `row` (+ `default`/`premium`/`subtle`/`outlined`/`compact` surface mapping) | 10+ pages | `row` premium (Questions golden reference) | none |
| CollectionToolbar | `CollectionToolbar` + deprecated alias `FilterBar` | 5+ pages | `CollectionToolbar` | `FilterBar` alias (keep for churn-free) |
| CollectionFilter | single (v1.1) | Questions | v1.1 | none |
| Menu | scale/fade/slide animation presets; align left/right/center | 5+ dropdowns | `Menu` | `PremiumSelect` panel duplicate |
| Alert | `success`/`error`/`warning`/`info` | admin pages | `Alert` | none |
| Modal | `AdminModal` (canonical) + AddExamModal, LanguageSelectionScreen, ReviewLayout, SubmitExamModal, SuccessModal | admin + exam | `AdminModal` | independent modal panels with differing radii |
| Input | `text`/`password`/`email`/`number`/`search`, compact/violet | admin/auth/exam | `Input` | none (legacy `checkbox` variant removed DS-013) |
| Tabs | `sm`/`md`/`lg`, icon + badge support | 20+ | `Tabs` | `SegmentedFilter`, `BilingualToggle` separate pills |

---

## 17. §13 — Motion & Animation Audit

| Animation language | Owner | Consumers | Tokens | Duration | Easing | Status |
|---|---|---|---|---|---|---|
| Card lift (`hover:-translate-y-0.5`) | Card | all card consumers | `transition-[transform,box-shadow] duration-200` | 200ms | default | ✅ one language |
| Hover scale (`hover:scale-*`) | Button, AIToolCards, DiagramRenderer nodes | buttons, tool cards, diagrams | `transition-all duration-200` | 200ms | default | ⚠ mixed with lift |
| Fade entrance (`animate-in fade-in`) | pages/sections | admin tabs, exam pages | TailwindCSS Animate | 300–1000ms | default | ✅ |
| Slide entrance (`slide-in-from-*`) | page containers, drawer, BulkActionBar | tab content, drawer, bulk bar | TailwindCSS Animate | 500ms | default | ✅ |
| Zoom modal (`zoom-in-95`) | AdminModal | modals | TailwindCSS Animate | 300ms | default | ✅ |
| Shake (`animate-in shake`) | Alert (validation) | JsonTab | TailwindCSS Animate | 500ms | default | ✅ |
| Skeleton shimmer/pulse | SharedComponents (owned) | CollectionCard, DataTable | `animate-pulse` | — | — | ⚠ pulse only, no shimmer keyframe |
| Spinner (`animate-spin`) | Spinner | loading states | `animate-spin` | — | — | ✅ |
| Toast slide-in | ToastContainer (own keyframe) | toasts | **inline `@keyframes slideIn`** | 400ms | cubic-bezier(0.16,1,0.3,1) | ❌ un-tokenized, per-instance |
| Page transitions | none (page-level) | — | — | — | — | ⚠ no unified page transition |
| Pill slide (`layoutId`) | Tabs, Navigation | tab/active nav | Framer Motion spring | — | spring | ✅ |
| Pulse slow | DiagramRenderer | diagrams | `animate-pulse-slow` | — | — | ⚠ custom utility |
| Ping | VerifyEmailPage | ring | `animate-ping duration-[2.5s]` | 2.5s | default | ⚠ one-off |
| Sheen | SplashPage | logo sheen | `animate-[sheen_4s_infinite_linear]` | 4s | linear | ❌ inline keyframe |
| Upload progress | UploadProgressOverlay | upload overlay | `animate-pulse` | — | — | ⚠ |

> Goal: **one animation language.** Current state: TailwindCSS Animate + Framer Motion + one inline keyframe (Toast) + one inline `sheen` keyframe (Splash) + custom `pulse-slow`. The Toast and Splash keyframes are the only true orphans.

---

## 18. §14 — Z-Index & Overlay Layer Audit

Complete stacking hierarchy (verified from implementation):

| Stack level | z-index | Owner | Verified sources | Conflicts |
|---|---|---|---|---|
| In-page content | `z-10` | content wrappers, Form icons, carousel arrows, TopicInfoButton trigger | auth pages, SelectionView, LoadingScreen content | — |
| Raised content | `z-20` | diagram nodes, selected subject card, sticky table header | DiagramRenderer, SubjectCardItem, DataGrid | — |
| Sticky bars | `z-30` | PreparationView sticky header, AdminModal footer, diagram center | PreparationView, AdminModal | — |
| Back/float | `z-40` | ReviewLayout back button, Navigation drawer | ReviewLayout, Navigation | — |
| **Dialog/panel tier** | `z-50` | AdminModal, LanguageSelectionScreen, ExamHeader, TopicInfoButton tooltip, UploadProgressOverlay, Menu (default), Navigation hamburger | AdminModal:76, LanguageSelectionScreen:28, Menu:68 | ⚠ tooltip and menu and modal share `z-50` |
| Drawer backdrop/panel | `z-[60]`/`z-[70]` | SidebarLayout drawer + backdrop | SidebarLayout:179/187/198 | ✅ |
| Loading screen | `z-[100]` | LoadingScreen, BulkActionBar, SidebarLayout hamburger | LoadingScreen:5, BulkActionBar:18 | ⚠ hamburger competes with drawer |
| Notifications / exam overlay | `z-[200]` | NotificationPanel, Navigation dropdown, ActiveExamPage uploading overlay | NotificationPanel:157, Navigation:215, ActiveExamPage:220 | ⚠ two dropdowns at different z (Menu z-50 vs Navigation z-[200]) |
| Modal (independent) | `z-[1000]` | AddExamModal, PremiumSelect panel | AddExamModal:193, PremiumSelect:211 | ⚠ **inconsistent modal tier** (AdminModal z-50 vs AddExamModal z-[1000]) |
| Splash / skip-link | `z-[9999]` | SplashPage, SidebarLayout focus skip-link | SplashPage:166, SidebarLayout:86 | — |
| **Toast / emergency** | `z-[99999]` | ToastContainer | useToast:43 | ✅ topmost |

**Conflicts:**
1. `AdminModal` (z-50) vs `AddExamModal` (z-[1000]) — two modal tiers, nested-modal ordering unreliable.
2. `Menu` default z-50 vs `Navigation` dropdown z-[200] vs `PremiumSelect` z-[1000] — three dropdown tiers.
3. Tooltip (`z-50`) vs modal (`z-50`) — tooltip above a modal cannot be guaranteed.
4. Toast is correctly the single highest layer — but it is unowned.
5. No shared overlay contract: backdrops use `bg-app-bg/60`, `/80`, `/95` (three opacities).

---

## 19. §15 — Typography–Surface Coupling

Typography is audited separately later; here we record where typography is **coupled to surfaces**.

| Surface | Typography owner | Visual owner | Dependency |
|---|---|---|---|
| Card title | `AntigravityTypography` (Heading) | Card | heading inherits card spacing; premium cards use cinzel (`font-cinzel`) in light only |
| Collection title | `CollectionHeader`/`SectionHeader` | CollectionCard / Section | `text-[13px]/[14px]` uppercase for management rows |
| Toolbar labels | `CollectionToolbar` consumer | CollectionToolbar | uppercase micro-text (`text-[11px] font-bold uppercase tracking-widest`) |
| Button labels | Button | Button | uppercase tracking-wider; sizes mapped to Button sizes |
| Badge text | Badge | Badge | `text-[9px] uppercase` variants |
| Modal title | AdminModal header | AdminModal | header border separates title from body |
| Page title | `PageHeader` | PageContainer | `font-cinzel` light titles (User Panel) |
| Stat value | StatCard | StatCard | large numeric, `font-cinzel` light |
| Toast text | ToastContainer (inline) | ToastContainer | `font-bold text-sm` inline — **couples typography to unowned surface** ❌ |

---

## 20. §16 — Surface Lifecycle

Every Foundation surface staged: Created → Consumed → Shared → Frozen → Deprecated → Removed.

| Surface | Stage |
|---|---|
| Card, StatCard, Button, Tabs, Badge, Input/Select/Checkbox/Switch, AdminModal, Menu, Navigation, DataGrid/DataTable, Layout Primitives | **Frozen** |
| CollectionCard (v1.1), CollectionToolbar, CollectionFilter (v1.1), SelectionCheckbox, CollectionHeader, ThemeToggle | **Frozen** (3.2.x) |
| PremiumSelect panel (own recipe) | Consumed (⚠ duplicate of Menu panel — candidate **Deprecated/merge**) |
| `FilterBar` alias | **Deprecated** (retained for zero churn) |
| ToastContainer | Created (no owner, **not frozen**) |
| `.ancient-card-dark` (WelcomeBanner), topic parchment, `SegmentedFilter`, `BilingualToggle`, `TagBadge`, `IconBadge` wrappers, `CarouselDots` | **Deprecated** candidates (see Problem Register) |
| `AdminCard`, `ProfileDropdown`, `AdminPagination`, old `TopicCard`/`TopicSectionRenderer`/`TopicReader` (old paths), `Performance*` old set | **Removed** |
| LeaderboardTabletCard / LeaderboardMobileCard | Consumed (fragmentation candidate) |
| `Tooltip` (frozen) | Frozen (no consumers migrated yet) |

---

## 21. Phase 3.3 Success Criteria Checklist

- [x] Every surface layer identified (17 layers, L0–L17).
- [x] Every background traced (token + consumer counts).
- [x] Every border documented (width/token/color/radius/consumers/duplicates).
- [x] Every shadow/elevation documented (incl. undefined dark `--elevation-carved`).
- [x] Every radius documented (incl. arbitrary values + token conflict).
- [x] Every hover treatment documented (lift vs scale vs shadow swap).
- [x] Every animation language documented (owner/duration/easing/status).
- [x] Every owner assigned (one per layer; **Toast layer vacant — registered**).
- [x] Every consumer listed (grouped by Admin/User/SubAdmin/Exam/Auth/Shared).
- [x] Every duplicate surface documented.
- [x] Every obsolete surface documented.
- [x] Every component creating a second visual language documented (§3 Surface Creation Audit).
- [x] Golden Reference (User Panel) captured and used for ✅/⚠/❌ classification.
- [x] Component Variant Matrix, Motion Audit, Z-Index Audit, Typography Coupling, Lifecycle complete.

See `SURFACE_TOKEN_INVENTORY.md` for the token layer, `SURFACE_PROBLEM_REGISTER.md` for problems and legacy register, and `SURFACE_IMPLEMENTATION_PLAN.md` for ownership, batches, and governance.
