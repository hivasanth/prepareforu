# PROJECT ARCHITECTURE (MASTER REFERENCE)

# Document Authority

**Authority:** Canonical application architecture.
**Purpose:** Defines application layers, folder structure, data flow, responsive
strategy, component hierarchy, and overall project architecture. Architecture
decisions originate here.

---

**Classification:** Master application architecture reference. Documentation only.
**Read this FIRST** before working on any part of the project.

This document explains how the application is built, organized, and owned. It does
NOT duplicate the Design System governance — that lives in `FOUNDATION_GOVERNANCE.md`.
For day-to-day execution, follow `DESIGN_SYSTEM_WORKFLOW.md`. For implementation
history, see `FOUNDATION_FREEZE_REGISTER.md`.

---

## SECTION 1 — PROJECT OVERVIEW

**Purpose.** An exam-preparation platform (APPSC/subject/topic practice, performance
analytics, leaderboards, history) serving Students (user), Teachers, Admins, and
Sub-Admins.

**Architecture philosophy.**
- **Design System driven UI** — every surface is built from one Foundation.
- **Reusable component strategy** — Foundation Primitives → Composites → Application
  Components → Feature Components; no duplicated UI.
- **Separation of concerns** — UI renders, Hooks coordinate, Services fetch, Supabase
  persists. UI never owns database logic.
- **Scalability goals** — layered ownership, additive Foundation evolution, dead-code
  removal, and a single source of truth for every responsibility.

---

## SECTION 2 — APPLICATION ARCHITECTURE

Render/ownership stack (top to bottom):

```
Application (browser)
        ↓
Theme / Tokens (semantic tokens, dark/light)
        ↓
Foundation Primitives (Card, Button, Input, …)
        ↓
Foundation Composites (PremiumIconContainer, StatCard, EmptyState, …)
        ↓
Application Components (ExamCard, TopicCard, AttemptCard, …)
        ↓
Feature Components (Dashboard, Exams, Performance, Admin, Sub-Admin)
        ↓
Application (routing + pages)
```

**Ownership responsibilities.**
- Foundation Primitives own all visual material (surface, border, shadow, radius,
  hover, motion, typography, theme).
- Foundation Composites own documented reusable patterns only.
- Application Components own layout/content/business behaviour, NOT generic visuals.
- Feature Components own page layout, routing, feature logic, state, API integration.

---

## SECTION 3 — FOLDER ARCHITECTURE

```
src/
├── components/
│   ├── common/      # Foundation Primitives + Composites (Antigravity*, Card, Button,
│   │               #   PremiumIconContainer, StatCard, DataTable, Pagination, …)
│   ├── admin/       # Admin-scoped Application/Feature components
│   ├── user/        # User-scoped Application components (TopicCard, TopicListView, …)
│   ├── sub-admin/    # Sub-Admin-scoped components
│   ├── exam/        # Exam/question/attempt components
│   └── layout/      # Layout shells (AntigravityLayout, etc.)
├── pages/           # Route components (one file or folder per route)
│   ├── user/ admin/ sub-admin/ exam/ auth/
├── services/        # API/data-access layer (examService, userService, …)
├── hooks/           # Reusable state/data hooks (per domain: admin/user/exam/…)
├── contexts/        # React Context providers (Auth, Theme, Language)
├── guards/          # Route guards (AuthGuard, RoleGuard, GuestGuard)
├── layouts/         # Layout wrappers (UserLayout, AdminLayout, SidebarLayout, …)
├── lib/             # Low-level clients (supabase.ts) + helpers
├── config/          # App config (nav.ts, supabase.ts)
├── constants/       # Static constants
├── data/            # Data orchestration (repositories, utils) — currently thin
├── utils/           # Per-domain pure utilities (examUtils, leaderboardUtils, …)
├── types/           # TypeScript domain types (exam.types, …)
├── validations/     # Schema/validation helpers
├── styles/          # Global styles (themes.css, PHASE2_*.md)
├── assets/          # Static assets
├── test/            # Test utilities/setup
├── scripts/         # Build/maintenance scripts
└── observability/   # Logging/telemetry helpers
```

**Responsibility of each folder.** Pages compose; components render; services fetch;
hooks bridge; contexts share cross-cutting state; guards protect routes; layouts
frame pages; lib/config hold clients & config; types/utils/validations are pure and
side-effect free.

---

## SECTION 4 — DESIGN SYSTEM OVERVIEW

Governance lives in `FOUNDATION_GOVERNANCE.md`. Summary only (no duplication):

- **Foundation Primitives** — Card (DS-001), Button (DS-002), Input, Alert, Spinner,
  Pagination, DataTable, Typography. Own all visual material; never business logic.
- **Foundation Composites** — PremiumIconContainer, IconBadge, AdminIconWrap, StatCard,
  EmptyState, ErrorState. Reusable patterns composed from primitives.
- **Hierarchy** — L1 Primitive → L2 Composite → L3 Application → L4 Feature. Reverse
  dependency is forbidden.
- **Freeze Policy** — Card & Button systems PERMANENTLY FROZEN; evolution is additive,
  backward-compatible, ≥3-consumer justified.

---

## SECTION 5 — APPLICATION LAYERS

```
Foundation (L1/L2)  → owns visuals
        ↓
Application Components (L3) → compose Foundation, own layout/content/behaviour
        ↓
Feature Components (L4) → compose Application Components, own page logic
        ↓
Pages → route + compose Features, own routing/composition
        ↓
Routing → maps URLs to pages, applies guards
```

**Responsibilities.**
- Foundation: visual language only.
- Application Components: reusable presented units.
- Feature Components: feature orchestration.
- Pages: routing + composition + per-page orchestration.
- Routing: URL → page resolution, guard enforcement.

---

## SECTION 6 — DATA FLOW

```
UI (page/component)
   ↓ calls
Hook (useX)
   ↓ calls
Service (examService, userService, …)
   ↓ calls
Supabase client (lib/supabase.ts)
   ↓ queries
Database (Postgres + RLS)
   ↓ response
Supabase → Service → Hook → UI (render)
```

**Rule.** UI NEVER directly owns database logic. All data access is funnelled through
`services/` → Supabase client. Hooks coordinate loading/error/empty state; pages
compose the result.

---

## SECTION 7 — STATE MANAGEMENT

- **Context** (`src/contexts/`) — cross-cutting shared state: `AuthContext`
  (session/role), `ThemeContext` (light/dark), `LanguageContext` (i18n).
- **Local State** — component/page `useState`/`useReducer` for ephemeral UI.
- **Shared State** — domain hooks (`useDashboardData`, etc.) with race-safe guards
  (`requestId`/`mountedRef`).
- **Caching** — service-level caches (`adminQueryCache`, `persistenceRetry`); query
  memoization in hooks.
- **Ownership rules** — global/session state in Context; feature state in hooks;
  layout state in the owning page; never lift state into Foundation.

---

## SECTION 8 — THEME ARCHITECTURE

- **Theme Tokens** — defined in `src/styles/themes.css` (Semantic + Material tokens).
- **Semantic Tokens** — `--card-bg`, `--text-primary`, `--primary`, etc. (no raw
  Primitive leaks in Foundation).
- **Theme Provider** — `ThemeContext` toggles the `.light` class on `<html>`; dark is
  the baseline (no class), light adds `.light`.
- **Light / Dark** — Tailwind v4 `light:` variant (`@custom-variant light`).
- **Token ownership** — tokens owned by `themes.css`/Foundation; **no page-owned
  themes** (no inline `bg-slate-*`, raw hex, or Primitive tokens in consumers).

---

## SECTION 9 — RESPONSIVE STRATEGY

Breakpoints: **XS** (<640) · **SM** (≥640) · **MD** (≥768) · **LG** (≥1024) · **XL**
(≥1280).

- **Foundation** owns responsive behaviour of primitives/composites (intrinsic).
- **Application Components** own internal responsive layout of composed content.
- **Feature/Pages** own page-level grid/breakpoint composition (`grid-cols-1
  md:grid-cols-2 lg:grid-cols-3`, `flex-col sm:flex-row`, `useBreakpoint`).
- Responsive belongs to layout owners, never to visual material.

---

## SECTION 10 — SECURITY ARCHITECTURE

- **Authentication** — `AuthContext` + `authService` (Supabase Auth).
- **Authorization** — role model: Student / Teacher / Admin / Sub-Admin.
- **RLS** — Postgres Row Level Security enforces data access at the database layer;
  services assume RLS, never bypass it.
- **Protected Routes** — `guards/Guards.tsx` (`AuthGuard`, `RoleGuard`, `GuestGuard`)
  gate routes by session/role.
- **Consumer responsibilities** — pages pass only authorized intent; never embed
  secrets; rely on RLS + guards.
- **Enforcement inventory** — see `SECURITY_BASELINE.md` for the complete inventory
  of trusted enforcement points (RLS policies, CHECK constraints, RPCs, Edge Functions)
  and client-side defense points (Zod schemas, repository validation).

---

## SECTION 11 — PERFORMANCE STRATEGY

- **Lazy loading** — route-level `React.lazy` + `Suspense` for heavy pages (e.g.
  charts, readers).
- **Memoization** — `memo` on pure components; `useMemo` for derived data; race-safe
  hooks to avoid redundant fetches.
- **Caching** — service/query caches; query dedupe in hooks.
- **Reusable Foundation** — composing primitives avoids per-page duplicate subtrees.
- **Dead-code removal** — cleanup-on-change policy removes obsolete wrappers/helpers.
- **Bundle optimization** — code-splitting at route boundaries; vendor chunks.

---

## SECTION 12 — CODING STANDARDS

- **Naming** — PascalCase components, camelCase hooks/functions, kebab-case files for
  pages where conventional.
- **Folder conventions** — components grouped by scope (`common/user/admin/…`); one
  component per file.
- **Imports** — import Foundation/Composites from the `AntigravityUI` barrel; avoid
  relative bypasses of the barrel.
- **File organization** — co-locate feature components with their pages where scoped.
- **Component organization** — props → state → handlers → render; no business logic in
  pure presentational components.
- **Reusable code principles** — never duplicate a Foundation/Composite; extract a
  new reusable unit only with evidence (see Governance hierarchy rules).

---

## SECTION 13 — IMPLEMENTATION PRINCIPLES

Full detail in `DESIGN_SYSTEM_WORKFLOW.md`. Summary:

- **Classification** — classify every task into a hierarchy level before coding.
- **Ownership** — modify only the owner of a property.
- **Migration** — reuse Foundation, delete duplicates, delete dead code.
- **Verification** — verify in the rendered app (light/dark/hover/motion/responsive/
  a11y), not just build/tsc.
- **Cleanup** — remove dead/duplicate code, CSS, utilities, imports on every change.

---

## SECTION 14 — DOCUMENTATION INDEX

| Document | Purpose |
|---|---|
| `PROJECT_ARCHITECTURE.md` | Master application architecture (this document) |
| `FOUNDATION_GOVERNANCE.md` | Permanent Design System governance (rules, freeze, hierarchy, constitution, change control) |
| `FOUNDATION_FREEZE_REGISTER.md` | Chronological implementation history (freeze/migration/acceptance records) |
| `DESIGN_SYSTEM_WORKFLOW.md` | Daily implementation handbook (how to apply the rules) |
| `AI_PROJECT_CONTEXT.md` | AI entry point — read this first if you are an AI assistant |

---

## SECTION 15 — ONBOARDING GUIDE

A new developer or AI must follow:

1. Read `PROJECT_ARCHITECTURE.md`
2. Read `FOUNDATION_GOVERNANCE.md`
3. Read `DESIGN_SYSTEM_WORKFLOW.md`
4. Review `FOUNDATION_FREEZE_REGISTER.md`
5. Begin implementation

---

## SECTION 16 — ARCHITECTURE PRINCIPLES

- **One Design System** — a single visual language.
- **One Foundation** — the only source of reusable UI.
- **One Owner** — every responsibility has exactly one owner.
- **One Implementation** — no duplicate reusable components.
- **Zero Duplication** — delete duplicates on sight.
- **Consumer before Foundation** — fix the consumer first; change Foundation only on
  multi-consumer verified defects.
- **Runtime before Source** — the rendered app is the source of truth, not the code.
- **Architecture before Implementation** — classify and respect ownership before
  writing code.
