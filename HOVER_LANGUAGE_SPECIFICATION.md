# Phase 5.4 — Hover & Interaction Language Specification

**Status:** ⏳ AWAITING APPROVAL (design proposal — no implementation until approved)
**Date:** 2026-08-06
**Parent audit:** `VISUAL_LANGUAGE_AUDIT.md`

---

## 1. Purpose

Define the ONE hover/interaction language. Every interactive surface (buttons, cards, nav items,
table rows, icons, pills, stat cards, chart panels) responds with the same grammar: consistent
motion channel, duration, easing, and elevation language. The current state is **divergent**
(mixed scale/translate/shadow, durations 150–500ms, `transition-all` vs scoped). This spec unifies
it around the certified patterns already present in the Foundation components.

---

## 2. Current-state divergence (evidence)

Repo-wide sweep (48 matches, `src/**/*.tsx`) + user components (17 matches):

| Pattern | Examples | Issue |
|---|---|---|
| `hover:scale-105` / `hover:scale-110` | `LeaderboardView` (avatar `hover:scale-105`), `PerformanceAnalyticsSection` (`group-hover:scale-110`), `MethodSelectionView` (`group-hover:scale-110`), `Navigation` icon (`lg:group-hover/nav:scale-110`) | Scale channel used inconsistently (105 vs 110) |
| `group-hover:rotate-12` | `LeaderboardView` rank avatar, `MethodSelectionView` icon (`group-hover:rotate-12`) | Rotation only on specific decorative elements |
| `hover:-translate-y-0.5` | `AntigravityCard` surface recipe, Button secondary (light + management) | Card lift channel (certified) |
| `hover:translate-y-0` | `QuestionCard` (`hover:-translate-y-0 hover:shadow-elevation-3`) | Odd — no-op base `-translate-y-0`, only shadow lifts |
| `lg:group-hover:translate-x-1` | `TopicCard`, `SidebarLayout` logout icon | Directional micro-slide for chevron/icons |
| `hover:shadow-*` / `hover:shadow-elevation-3` | `QuestionCard`, `SubjectCardItem`, `TeacherExamCard`, `AntigravityCard` | Elevation-only hover (certified shadow system) |
| `hover:shadow-card-premium` | `AntigravityCard PREMIUM_SURFACE_HOVER`, `TopicCard` | Premium shadow lift |
| `hover:bg-hover-bg/20` | `LeaderboardComponents` row, `DataGrid` row | Surface-hover channel (row/ghost) |
| `lg:hover:bg-hover-bg/20` | `LeaderboardComponents` | desktop-gated row hover |
| `lg:group-hover:text-primary` | `TeacherExamCard` title | Color-shift channel |
| `group-hover:text-primary` | `LeaderboardView` name | Color-shift channel |
| `group-hover:opacity-100` / `hover:opacity-*` | `LeaderboardView` score hover, `AIToolCards` footer | Opacity reveal |
| `transition-all` | `MethodSelectionView`, `TopicCard`, `TeacherExamCard`, `SubjectCardItem` | Over-broad transition (cost + unpredictable) |
| `transition-transform` | `LeaderboardView` avatar, `PerformanceAnalyticsSection` | Fine when scoped to transform |
| `transition-colors` | `LeaderboardComponents`, `CarouselDots`, `TeacherExamCard`, `SidebarLayout` | Fine when scoped to color |
| `transition-[transform,box-shadow,border-color] duration-200` | `AntigravityCard` (certified) | The ideal scoped transition |
| `transition-[color,box-shadow,border-color,opacity,filter] duration-200` | `Button` base (certified) | The ideal scoped transition |
| Durations | 150/200/300/500ms + `duration-1000` (`DailyAttemptsChart` entrance) | Divergent |
| Framer-motion | Button `whileHover scale 1.01`, IconButton `1.01/0.95`, drawer springs | Certified motion |

---

## 3. The ONE hover language (grammar)

### 3.1 Interaction channels (pick the right channel, don't mix)
| Channel | Utility pattern | Use for |
|---|---|---|
| Surface | `hover:bg-hover-bg` / `hover:bg-hover-bg/20` / `hover:bg-hover-bg/30` | rows, ghost buttons, icon buttons, nav items, menus |
| Elevation | `hover:shadow-elevation-1/2/3` or token shadow-hover (`--management-shadow-hover`, `--card-hover-shadow`, `shadow-card-premium`) | cards, stat cards, panels |
| Lift | `hover:-translate-y-0.5` | cards (Card surface recipe) |
| Color | `hover:text-primary` / `group-hover:text-primary`, `hover:text-text-primary` | text accents, icon accents, links |
| Border | `hover:border-*` (token) | outlined controls, pills, fields |
| Scale | `group-hover:scale-110` (on inner icon only), `hover:scale-105` (avatar) | decorative icon/avatar emphasis ONLY |
| Opacity | `group-hover:opacity-100` | reveal-on-hover secondary info |
| Rotation | `group-hover:rotate-12` | decorative icon flourish ONLY (rank avatars, method icons) |
| Slide | `group-hover:translate-x-1` | chevron/arrow directional affordance |

### 3.2 Canonical recipes (the ONLY sanctioned composites)
| Element | Recipe |
|---|---|
| **Card hover** (certified `AntigravityCard`) | `transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-…` (premium → `shadow-card-premium`; management → `shadow-[var(--management-shadow-hover)]`) |
| **Button hover** (certified `AntigravityButton`) | scoped transition on `[color,box-shadow,border-color,opacity,filter]` + `whileHover scale 1.01`; variant adds shadow/brightness/translate per recipe |
| **IconButton hover** | `hover:bg-… hover:text-…` + `whileHover scale 1.01`, `whileTap 0.95` |
| **Row hover** | `hover:bg-hover-bg/30 transition-colors` (DataGrid certified); table header `bg-hover-bg/50` static |
| **Nav item hover** | `hover:bg-hover-bg hover:text-text-primary transition-all duration-200`; icon `lg:group-hover/nav:scale-110` + `lg:group-hover/nav:text-primary` (certified Navigation) |
| **Pill/tab hover** | inactive pill `text-secondary` → `text-color-secondary-light` (tab pill material `--material-tab-text-hover`); see PILL spec |
| **Stat card hover** | surface recipe via `StatCard` (certified) |
| **Inner-icon scale** | `group-hover:scale-110 transition-transform duration-500` ONLY on decorative icons inside a `group` card |
| **Rank/method flourish** | `group-hover:rotate-12 transition-transform` on avatar/method icon |
| **Reveal-on-hover** | `opacity-0 group-hover:opacity-100 transition-opacity` for secondary metadata |

### 3.3 Duration scale (the ONE scale)
| Token | Value | Use |
|---|---|---|
| fast | 150ms | color/border micro-shifts |
| **standard** | **200ms** | **default for all hover channels** (matches Button base + Card recipe) |
| slow | 300ms | surface morphs, sidebar width, header transitions |
| reveal | 500ms | decorative icon scale/rotate flourish (group-hover) |
| entrance | 1000ms | page/card entrance animation only (fade/slide-in from-bottom, `animate-in`), not hover |

### 3.4 Transition scoping rule
- **Never `transition-all`** on cards/panels — always scope: `transition-[transform,box-shadow,border-color]` for surfaces, `transition-colors` for color, `transition-transform` for scale/translate/rotate, `transition-opacity` for reveals.
- `transition-all` permitted only on tiny decorative elements with a certified precedent (existing `SubjectCardItem`, `TeacherExamCard` icon-badge usage to be normalized).

### 3.5 Full element coverage (every interactive element)
| Element | Hover channel | Canonical recipe |
|---|---|---|
| Card / CollectionCard | lift + elevation | `transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-…` (premium `shadow-card-premium`; management `--management-shadow-hover`) |
| Question card / Topic card / Exam card | lift + elevation (same as card) | same canonical card recipe (fix `transition-all` outliers H-1/H-5/H-6) |
| Container / panel (non-clickable) | none | no hover state |
| Table row | surface | `hover:bg-hover-bg/30 transition-colors` |
| Menu item / dropdown item | surface | `hover:bg-hover-bg hover:text-text-primary transition-colors` (Navigation item pattern) |
| Button | scale (framer) + recipe channel | `whileHover scale 1.01` + variant shadow/brightness/translate (BUTTON spec) |
| IconButton | surface + scale | `hover:bg-… hover:text-…` + `whileHover scale 1.01` |
| Sidebar nav item | surface + icon accent | `hover:bg-hover-bg hover:text-text-primary`; icon `lg:group-hover/nav:scale-110` + `lg:group-hover/nav:text-primary` |
| Toolbar button | surface / soft | `soft`/`secondary` variant recipe |
| Pill / badge (inactive) | color + surface | inactive pill `hover:text-[var(--material-tab-text-hover)]` + `hover:bg-white/5` (light) / border `border-border-subtle` static (PILL spec) |
| Filter / segmented pill | surface | `hover:bg-hover-bg/… hover:text-primary transition-colors` |
| Icon badge | color | `hover:bg-… hover:text-…` via IconBadge/IconButton |
| Rank avatar / method icon | scale + rotate (decorative) | `group-hover:scale-110` / `group-hover:rotate-12 transition-transform duration-500` (certified flourish) |
| Reveal-on-hover metadata | opacity | `opacity-0 group-hover:opacity-100 transition-opacity` |
| Chevron / directional | slide | `group-hover:translate-x-1 transition-transform` |

### 3.6 Motion safety
- Respect `prefers-reduced-motion`: framer-motion animations and `group-hover` transforms should be gated or neutralized (existing motion usage is lightweight; add `motion-reduce:` where transforms are substantive).
- Hover states must not affect layout (transform/opacity/shadow only — certified).

---

## 4. Compliance map (issues H-*)

| ID | Location | Current | Action |
|---|---|---|---|
| H-1 | `QuestionCard` | `hover:-translate-y-0 hover:shadow-elevation-3` (no-op translate) | → canonical card hover (lift -0.5 + shadow) or plain shadow-only; remove no-op translate |
| H-2 | `MethodSelectionView` | `transition-all group-hover:scale-110 shadow-xl shadow-primary/20` | → scoped `transition-[transform,box-shadow]`, keep shadow, use `shadow-primary/20` token (allowed) |
| H-3 | `PerformanceAnalyticsSection` | `group-hover:scale-110 transition-transform duration-500` | ✅ canonical decorative-icon recipe (keep) |
| H-4 | `LeaderboardView` avatar | `hover:scale-105 transition-transform` + `group-hover:rotate-12` | ✅ canonical flourish (keep) |
| H-5 | `TopicCard` | `hover:shadow-card-premium` + `lg:group-hover:translate-x-1` + `transition-all` | → scoped transitions; keep channels |
| H-6 | `TeacherExamCard` | `transition-all` on icon badge + `lg:group-hover:text-primary transition-colors` | → scope icon-badge transition |
| H-7 | `SubjectCardItem` | `transition-all duration-300` + selected `scale-[1.03]` | → scope; duration 200 or 300 per scale; keep selected-state scale (structural selection, not hover) |
| H-8 | `CarouselDots` | `transition-colors duration-300` | ✅ keep |
| H-9 | `LeaderboardComponents` rows | `transition-colors` + `lg:hover:bg-hover-bg/20` | ✅ keep |
| H-10 | `AIToolCards` footer | `group-hover:opacity-100 transition-opacity` | ✅ keep |
| H-11 | `BulkActionBar` | hover surface channel | verify uses token hover |
| H-12 | Global | `transition-all` occurrences | sweep + scope (targets: MethodSelectionView, TopicCard, TeacherExamCard, SubjectCardItem) |
| H-13 | Menu / dropdown items | verify Navigation pattern | ensure `hover:bg-hover-bg hover:text-text-primary transition-colors` (Menu.tsx audit in migration) |
| H-14 | Toolbar buttons | verify soft/secondary | ensure no custom hover classes on FilterBar/toolbar buttons |
| H-15 | Collection/Question/Topic cards | verify canonical card hover | confirm all card consumers use the certified card recipe after H-1/H-5/H-6 |

---

## 5. Frozen

- `AntigravityCard` hover recipe (lift + scoped shadow transition).
- `AntigravityButton`/`IconButton` motion + scoped transitions.
- `Navigation` item hover (surface + icon scale/color).
- `DataGrid` row hover (`bg-hover-bg/30 transition-colors`).
- Framer-motion certified patterns (Button/IconButton scales, drawer springs, collapse width).
