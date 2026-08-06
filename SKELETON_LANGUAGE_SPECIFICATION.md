# Phase 5.4 — Skeleton & Loading Language Specification

**Status:** ⏳ AWAITING APPROVAL (design proposal — no implementation until approved)
**Date:** 2026-08-06
**Parent audit:** `VISUAL_LANGUAGE_AUDIT.md`

---

## 1. Purpose

Define the ONE skeleton/loading language. Every loading state — page loaders, table grids, stat
grids, card skeletons, row placeholders — renders through the shared skeleton family
(`SharedComponents.tsx`) with a single material grammar and a consistent pulse. No inline skeleton
re-implementations.

---

## 2. The skeleton family (source of truth — `SharedComponents.tsx`)

| Component | Purpose | Family |
|---|---|---|
| `LoadingSkeleton` | generic block/bar skeleton | premium (default) / management (prop) |
| `GridSkeleton` | table/list grid placeholder | premium (default) / management |
| `StatSkeleton` | stat-card placeholder | premium |
| `LoadingOverlay` | full-surface loading | premium |
| `Spinner` | inline loading indicator (buttons, standalone) | accent |
| `MANAGEMENT_SKELETON_SURFACE` | management skeleton base token | management |
| `MANAGEMENT_SKELETON_BLOCK` | management skeleton bar token | management |

---

## 3. Skeleton grammar (material + motion)

### 3.1 Light/dark skeleton palette (Part 7 — one skeleton color story)

| Element | Light | Dark | Token/class |
|---|---|---|---|
| Skeleton base surface | `#F1F5F9` (slate-100) | `#374151` (gray-700) | premium: `bg-hover-bg` / `bg-elevated` |
| Skeleton block/bar | `#E2E8F0` (slate-200) | `#4B5563` (gray-600) | premium: `bg-border-subtle`-tone block |
| Management base surface | `#F6F8FA` (relight muted) | `#1F2937` (surface) | `MANAGEMENT_SKELETON_SURFACE` |
| Management block/bar | `#E8ECF2` | `#374151` | `MANAGEMENT_SKELETON_BLOCK` |
| Motion | `animate-pulse` both themes | same | the ONE skeleton motion |
| Radius | matches replaced element (`rounded-lg`/`rounded-xl`/`rounded-2xl`) | same | per target |
| a11y | container `role="status"`/`aria-label` ("Loading…"), `aria-busy` where supported | same | |

**Dark-mode rule (Part 7 fix):** skeleton blocks/surfaces MUST be theme-aware. A premium skeleton
rendered on a management surface in dark mode must not flash the light premium color
(`#F1F5F9`) — it must resolve to the dark surface. Any skeleton that visibly renders the wrong
theme color is a defect (SK-1/SK-6).

### 3.2 Rules
1. **Every loading state uses the shared family.** No raw `animate-pulse bg-slate-*` /
   `bg-white/…` blocks outside `SharedComponents`.
2. **Family must match the surface being loaded:** premium content → premium skeleton; management
   content → management skeleton (`GridSkeleton`/`LoadingSkeleton` management variant).
3. **One motion** — `animate-pulse`. No shimmer/custom keyframes; no per-page loader classes.
4. **No layout shift:** skeleton geometry must match the certified component it replaces
   (Card padding, StatCard size, table row height).

---

## 4. Current adoption & gaps

| Surface | Skeleton used | Family | Status |
|---|---|---|---|
| Admin Users | `GridSkeleton` management | management | ✅ |
| Admin Sub-Admins | `GridSkeleton` (verify variant) | — | ⚠️ verify management |
| Admin Questions | `LoadingSkeleton`/`GridSkeleton` (premium default) | premium | ⚠️ align with management (Questions is a management surface) |
| Admin Overview | `LoadingSkeleton` chart fallback | premium | ⚠️ decision (chart panel family) |
| Admin Topics/Settings/Leaderboard/Upload | `LoadingSkeleton`/`Spinner`/`LoadingOverlay` | premium | ⚠️ align per surface family |
| User dashboard | `DashboardRecentActivity` `LoadingSkeleton`/`EmptyState` | premium | ✅ reference |
| SidebarLayout route fallback | `Spinner size="md"` | — | ✅ |
| Buttons | `Spinner size="sm" border-current border-t-transparent` | — | ✅ |

**Key gaps (Part 7):**
1. Management skeleton tokens (`MANAGEMENT_SKELETON_SURFACE`/`_BLOCK`) are defined but **only
   Admin Users consumes them**. Questions and other admin tooling still render premium-default
   skeletons on management surfaces (SK-1).
2. **Dark-mode divergence:** Admin Questions and Admin Users skeletons show unwanted dark-mode
   colors (Questions renders the premium light skeleton on a management surface in dark theme).
   The management skeleton tokens fix this for Users; Questions still needs them (SK-6).

---

## 5. Skeleton issue list (SK-*)

| ID | Issue | Action |
|---|---|---|
| SK-1 | Management skeletons under-adopted | Migrate Questions + other management surfaces to `GridSkeleton`/`LoadingSkeleton` management variant |
| SK-2 | Inline pulse blocks (any outside SharedComponents) | Sweep `animate-pulse` in admin/user; replace raw blocks with family components |
| SK-3 | `LoadingSkeleton`/`GridSkeleton`/`StatSkeleton` variant parity | Verify `StatSkeleton` renders premium gold stat placeholder consistent with `StatCard` (D-141) |
| SK-4 | Skeleton motion consistency | Confirm all `animate-pulse`; ban shimmer |
| SK-5 | a11y roles | Ensure all skeleton containers carry `role="status"`/aria labels |
| SK-6 | Dark-mode skeleton divergence (Questions/Users) | Migrate Questions (and any premium-on-management skeleton) to the management variant so dark mode shows `#1F2937`/`#374151` — no light-color flash in dark theme |

---

## 6. Frozen

- `SharedComponents.tsx` skeleton family + management skeleton tokens.
- `Spinner` (inline loader, button loader).
- `LoadingOverlay`.
- `animate-pulse` as the single skeleton motion.
