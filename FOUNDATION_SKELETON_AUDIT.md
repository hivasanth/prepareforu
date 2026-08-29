# FOUNDATION SKELETON AUDIT

**Phase:** 5.4F (Skeleton & Loading Language Foundation Evolution)
**Date:** 2026-08-06
**Scope:** `src/components/**` only (Foundation + feature). `src/pages/**`, `src/layouts/**`,
theme/token values are out of scope and untouched. `rg` unavailable — evidence gathered via
`Select-String`/read sweeps of every consumer.

---

## 1. Purpose

Inventory every skeleton/loading-placeholder render in the Foundation + feature layer, classify
each against the ONE skeleton language (approved `SKELETON_LANGUAGE_SPECIFICATION.md`), and list
the SK-* defects 5.4F must close.

---

## 2. Skeleton family inventory (source: `SharedComponents.tsx`)

| Component | Location | Material (current) | Variants | Used by |
|---|---|---|---|---|
| `LoadingSkeleton` (text) | `SharedComponents.tsx:22,42-52` | premium: `GOLD_SURFACE` (`stat-card-surface border border-gold-300` + `shadow-premium-icon`); management: `bg-[var(--management-surface-muted)]` | `premium` (default) / `management` | CollectionCard, PortalLoadingSkeleton, DashboardSkeletons, LeaderboardSkeleton, PerformanceSkeleton, NotificationPanel, SelectionView, TeacherLeaderboardModal, PerformanceAnalyticsSection, DailyAttemptsChart, ExamDetailSection, AdminSubAdminsView, DashboardRecentActivity |
| `LoadingSkeleton` (card) | `SharedComponents.tsx:24-40` | premium: gold `GOLD_SURFACE` + `shadow-premium-icon`; inner blocks `bg-hover-bg` | `premium` / `management` | (no current consumer uses `type="card"`) |
| `GridSkeleton` | `SharedComponents.tsx:54-62` | delegates to `LoadingSkeleton` | `premium` / `management` | UsersTable (`management` ✓), QuestionsTable (`premium` ✗), LeaderboardSkeleton, TopicPortalView, ExamListSection |
| `StatSkeleton` | `SharedComponents.tsx:64-78` | premium gold `GOLD_SURFACE` + `shadow-premium-card` | premium only | DashboardStatsGrid (`user/dashboard`), StatsGrid (`admin/overview`), ExamDetailModal (`count={2}`) |
| `EmptyState` | `SharedComponents.tsx:125-162` | premium gold `GOLD_SURFACE` (NOT a loading component) | `premium` / `management` | various | 

**Skeleton consumers with hand-rolled (non-family) placeholders:**

| File | Line | Renders | Defect |
|---|---|---|---|
| `components/sub-admin/exams/ExamDetailModal.tsx` | 276 | `<div className="h-32 bg-hover-bg/30 rounded-2xl animate-pulse" />` | SK-2 inline pulse outside the family |
| `components/common/AntigravityCard.tsx` | 189-191 | `<div className="h-4 w-16 animate-pulse rounded mt-1 bg-hover-bg\|bg-stat-card-border/20" />` | SK-2 inline pulse; `bg-stat-card-border/20` light material is theme-branching by hand |
| `components/admin/sub-admins/AdminSubAdminsView.tsx` | 104-110 | `<LoadingSkeleton … />` (premium default) inside a `Card variant="subtle"` | SK-1/SK-6 premium-on-management |
| `components/admin/questions/QuestionsTable.tsx` | 51 | `<GridSkeleton count={5} height={56} … />` (premium default) | SK-1/SK-6 premium-on-management |

---

## 3. Motion audit (skeleton pulse)

- All skeleton surfaces use **`animate-pulse`** — the single skeleton motion. ✓ (SK-4 satisfied already)
- **Zero shimmer** anywhere in `src/` (grep `shimmer` = 0 hits). ✓
- No custom skeleton keyframes, no per-page loader classes. ✓
- `prefers-reduced-motion` honored by the global 0.01ms block at `src/index.css:1114`. ✓
- Raw stagger timing `delay-700` on the LoadingScreen ambient (loading-language, not skeleton) → LG-4.

---

## 4. Color audit (amber/gold/warm)

| Token/material | Location | Warm? | In skeleton language? |
|---|---|---|---|
| `GOLD_SURFACE = 'stat-card-surface border border-gold-300'` | `AntigravityCard.tsx:26` | ✅ gold gradient (`--surface-stat` `#D4A55A→#C9943C→#BF8A30`) | ✅ used by `LoadingSkeleton` + `StatSkeleton` → **SK-1 GOLD** |
| `--gold-300` border (`border-gold-300`) | via `GOLD_SURFACE` | ✅ `#B8860B` | ✅ in premium skeleton material → **SK-1 GOLD** |
| `shadow-premium-icon` / `shadow-premium-card` | `SharedComponents.tsx:26,44,68` | warm-tinted gold shadows | ✅ in premium skeleton material → **SK-1 GOLD** |
| `bg-hover-bg` / `bg-hover-bg/30` / `bg-stat-card-border/20` | blocks | neutral slate | raw (non-token) usage in hand-rolled pulses → **SK-2** |

**Dark-mode divergence (SK-6):** premium skeletons render the gold `stat-card-surface` gradient in
BOTH themes — in dark mode a skeleton flashes the warm light-gold material. The certified neutral
dark ladder (`--bg-elevated #374151`, `--border-input #4B5563`) is never used by any skeleton.

---

## 5. Theme-awareness (light/dark) audit

| Skeleton | Light | Dark | Verdict |
|---|---|---|---|
| Premium text/card (`GOLD_SURFACE`) | gold gradient + gold border | **gold gradient + gold border** (unchanged) | ✗ warm in both; wrong theme story (SK-1/SK-6) |
| Premium inner blocks (`bg-hover-bg`) | `#F1F5F9` | `#1F2937` (on gold) | ✗ contrast vs gold meaningless |
| Management `MANAGEMENT_SKELETON_SURFACE` | `#FCFCFD` + `#E2E8F0` border | `#1F2937` + `#374151` border | ✓ theme-aware (D-144) |
| Management `MANAGEMENT_SKELETON_BLOCK` | `#F6F8FA` | `#374151` | ✓ theme-aware (D-144) |
| `bg-hover-bg/30` (ExamDetailModal) | translucent slate | translucent slate | ✗ hand-rolled; no token story |
| `bg-hover-bg` / `bg-stat-card-border/20` (StatCard loading) | `#F1F5F9` / `stat-card-border 20%` | `#1F2937` | ✗ hand-branched by `isDark` |

---

## 6. A11y audit

| Container | role/aria | Verdict |
|---|---|---|
| `CollectionCard` loading | `role="status" aria-label="Loading collection item"` | ✓ |
| `PortalLoadingSkeleton` | `role="status" aria-live="polite" aria-label="Loading content"` | ✓ |
| `LoadingSkeleton` (text) | bare div (no role) | ✓ consumers own the live region |
| `ExamDetailModal` loading wrapper | `role="status" aria-label="Loading exam details"` | ✓ (the inner raw pulse is inside it) |
| `StatCard` loading | bare div (no role) — parent `StatsGrid` `role="region" aria-live` | ✓ live region at grid level |
| `Skeleton` card type (future) | to carry `role="status"` + `aria-label` | → 5.4F |

---

## 7. Issue list (SK-*)

| ID | Issue | Evidence | Action (5.4F) |
|---|---|---|---|
| SK-1 | **Gold/warm premium skeleton material** (`GOLD_SURFACE`, `--gold-300`, `shadow-premium-*`) used as the default premium skeleton + StatSkeleton | `SharedComponents.tsx:26,44,68`; `AntigravityCard.tsx:26` | Replace premium skeleton material with certified neutral tokens (`--skeleton-surface` = `--bg-elevated`, `--skeleton-block` = `--border-input` dark / `--bg-active` light). Zero gold/amber/warm in the skeleton language. |
| SK-2 | **Inline pulse blocks outside the family** | `ExamDetailModal.tsx:276`, `AntigravityCard.tsx:189-191` | Rewire through the ONE `Skeleton` primitive. |
| SK-3 | **Variant parity** — `StatSkeleton` premium-only, rendered inside a management modal (`ExamDetailModal`); premium-on-management mismatches remain | `QuestionsTable.tsx:51`, `AdminSubAdminsView.tsx:107` | Neutral premium material (post SK-1) renders safely on management surfaces; management consumers (`QuestionsTable`, `AdminSubAdminsView`) migrate to `variant="management"`; `StatSkeleton` keeps premium geometry (neutral). |
| SK-4 | Skeleton motion consistency | all `animate-pulse`; zero shimmer | Already satisfied — carry forward as a rule, not a change. |
| SK-5 | a11y roles | `role="status"` present on all surface wrappers | Card-type skeleton gains `role="status"` + `aria-label` on the primitive. |
| SK-6 | **Dark-mode divergence** — premium skeleton shows the light-gold material in dark theme | gold gradient under dark; `isDark` hand-branch in `AntigravityCard` | Token-backed theme-aware materials: dark premium = `#374151` surface / `#4B5563` block. No light-color flash in dark. |

---

## 8. Frozen (confirmed by this audit)

- `animate-pulse` = the single skeleton motion.
- `SharedComponents.tsx` skeleton family = the single family (LoadingSkeleton/GridSkeleton/StatSkeleton).
- `Spinner` = the single inline loading indicator (covered in `FOUNDATION_LOADING_AUDIT.md`).
- No shimmer, no custom skeleton keyframes anywhere.
