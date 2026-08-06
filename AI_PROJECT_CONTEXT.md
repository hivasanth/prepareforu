# AI PROJECT CONTEXT (MASTER AI ENTRY POINT)

# Document Authority

**Authority:** Primary entry point for every AI agent and contributor.
**Purpose:** Quickly understand the project, technology stack, architecture, Design
System, workflow, and documentation. This document is ALWAYS read first.

---

**Purpose:** The single document every AI assistant (ChatGPT, Claude, Gemini, Cursor,
Copilot, Windsurf, etc.) must read **before making ANY change** to this project. It
lets an AI understand the project in minutes without reading hundreds of files.

This is an **AI onboarding document** — not governance, not workflow, not architecture
(pointers to those live below).

---

# Documentation Index

| Read Order | Document | Purpose |
|---|---|---|
| 1 | `AI_PROJECT_CONTEXT.md` | Project entry point and onboarding |
| 2 | `PROJECT_ARCHITECTURE.md` | Application architecture |
| 3 | `FOUNDATION_GOVERNANCE.md` | Design System governance |
| 4 | `DESIGN_SYSTEM_WORKFLOW.md` | Daily implementation workflow |
| 5 | `FOUNDATION_FREEZE_REGISTER.md` | Historical implementation and adoption record |
| 6 | `SECURITY_BASELINE.md` | Security posture, enforcement inventory, scoring methodology |
| 7 | `ARCHITECTURE_BACKLOG.md` | Architecture refactoring backlog and engineering roadmap |

This is an overview only. The detailed lifecycle and maintenance policy live in
`FOUNDATION_GOVERNANCE.md` (§15 Governance Lifecycle, §24 Documentation Baseline).

---

# AI Governance Guidance

The governance framework is **stable** (v1.19.0). Future AI agents should assume
governance is complete. Do NOT expand governance unless:

- A genuine architectural gap exists, OR
- The user explicitly requests governance evolution.

Otherwise, focus on:

- Foundation evolution
- Foundation adoption
- Feature implementation
- Architecture improvements

instead of creating additional governance.

---

# Governance Maintenance

Future AI agents should prefer improving existing governance rather than expanding
it. If an existing rule already solves the problem, reuse it. If a rule becomes
obsolete, recommend removing or simplifying it. Do not preserve obsolete governance
simply for historical reasons. Historical context belongs in the Freeze Register,
not in the governance rules.

---

## 1. Project Summary

An **exam-preparation platform** (APPSC / subject / topic practice, performance
analytics, leaderboards, exam history) for four roles: Student (user), Teacher,
Admin, Sub-Admin. Built as a SPA with a Supabase backend (Postgres + RLS + Auth).

Key facts:
- UI is **Design System driven** — one Foundation owns all reusable visuals.
- Code is organized in strict layers (Foundation → Application → Feature → Page).
- The app is **frozen** at the Foundation level: Card and Button systems are
  permanently frozen and must not be modified for individual pages.

---

## 2. Technology Stack

- **Framework:** React + TypeScript (Vite).
- **Styling:** Tailwind CSS v4 (Semantic tokens; `light:` custom variant; dark is
  baseline, `.light` class enables light mode).
- **Animation:** Framer Motion (`motion.div` etc.) — used sparingly, Foundation-owned.
- **Backend:** Supabase (Postgres + Row Level Security + Auth).
- **Data access:** `services/` → Supabase client (`lib/supabase.ts`) → Database.
- **Routing:** route-based pages with guards (`AuthGuard`, `RoleGuard`, `GuestGuard`).
- **State:** React Context (Auth/Theme/Language) + domain hooks; no global store.
- **Testing:** Vitest.

---

## 3. Application Architecture Overview

→ Full detail in **`PROJECT_ARCHITECTURE.md`** (read it first).

Stack (top→bottom): `Browser → Theme/Tokens → Foundation Primitives → Foundation
Composites → Application Components → Feature Components → Pages → Routing`.

Ownership: Foundation owns visuals; Application Components own layout/content/
behaviour; Feature/Pages own routing + feature logic; UI never owns database logic.

---

## 4. Design System Overview

→ Full rules in **`FOUNDATION_GOVERNANCE.md`**.

- **Foundation Primitives** (L1): Card (DS-001), Button (DS-002), Input, Alert,
  Spinner, Pagination, DataTable, Typography — own all visual material.
- **Foundation Composites** (L2): PremiumIconContainer, IconBadge, AdminIconWrap,
  StatCard, EmptyState, ErrorState — reusable patterns.
- **Hierarchy:** L1 → L2 → L3 (Application) → L4 (Feature). Reverse dependency
  forbidden.
- **Freeze:** Card & Button systems PERMANENTLY FROZEN; evolution only additive,
  backward-compatible, ≥3-consumer justified.

---

## 5. Frozen Systems

The following are **permanently frozen** and are the ONLY approved implementations.
Do NOT redesign, duplicate, recreate, restyle, or replace them:

- ✅ **Cards** — `src/components/common/AntigravityCard.tsx` (DS-001).
- ✅ **Buttons** — `src/components/common/AntigravityButton.tsx` (DS-002).
- ✅ **Composite Components** — `PremiumIconContainer`, `IconBadge`, `AdminIconWrap`,
  `StatCard`, `EmptyState`, `ErrorState`, and any future Foundation composite.
- ➕ **Any future frozen system** — once frozen in `FOUNDATION_FREEZE_REGISTER.md`, it
  joins this list automatically.

If a single consumer looks wrong, fix the **consumer**, not the Foundation.

---

## 6. Project Rules

- **One Foundation** — the only source of reusable UI.
- **One Design System** — a single visual language.
- **One Owner** — every responsibility has exactly one owner.
- **No Duplication** — delete duplicates on sight.
- **Consumer before Foundation** — fix the consumer first; change Foundation only on
  multi-consumer verified defects.
- **Runtime before Source** — the rendered app is the source of truth, not the code.
- **Delete after migration** — after migrating to Foundation, delete obsolete/
  duplicate/compatibility code. Never keep both.

---

## 7. Implementation Workflow

→ Full steps in **`DESIGN_SYSTEM_WORKFLOW.md`**.

Every task: classify → find owner → compare with approved reference → implement
(owner only) → remove duplicates → verify runtime → document → freeze (if applicable).
Build success alone is NOT acceptance.

---

## 8. Documentation Index

| Document | Purpose |
|---|---|
| `PROJECT_ARCHITECTURE.md` | Master application architecture (read first) |
| `FOUNDATION_GOVERNANCE.md` | Permanent Design System governance (rules, freeze, hierarchy) |
| `DESIGN_SYSTEM_WORKFLOW.md` | Daily implementation handbook (how to apply the rules) |
| `FOUNDATION_FREEZE_REGISTER.md` | Chronological implementation history (freeze/migration records) |
| `SECURITY_BASELINE.md` | Security posture, enforcement inventory, scoring methodology |
| `ARCHITECTURE_BACKLOG.md` | Architecture refactoring backlog and engineering roadmap |

This file (`AI_PROJECT_CONTEXT.md`) is the AI entry point that points to all six.

---

## 9. AI Checklist — Before Writing Code

- [ ] Read `PROJECT_ARCHITECTURE.md`
- [ ] Read `FOUNDATION_GOVERNANCE.md`
- [ ] Read `DESIGN_SYSTEM_WORKFLOW.md`
- [ ] Check `FOUNDATION_FREEZE_REGISTER.md` for the relevant frozen component
- [ ] Locate the **rendered** component (not the file you assume)
- [ ] Determine the **owner** of the property in question
- [ ] Verify **runtime** (see the actual rendered UI)

Only then begin implementation.

---

## 10. AI Checklist — After Implementation

- [ ] Remove dead code
- [ ] Remove duplicate styling
- [ ] Verify runtime (light/dark/hover/motion/responsive/a11y)
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Update documentation if a freeze/migration/report is required

---

## 11. Common Mistakes To Avoid

- **Changing Foundation for one page** — fix the consumer instead.
- **Recreating existing components** — reuse the Foundation/Composite.
- **Guessing runtime behavior** — verify in the rendered app.
- **Leaving compatibility code** — delete obsolete/duplicate code after migration.
- **Duplicating CSS** — never re-declare Foundation-owned visuals in a consumer.
- **Creating one-off variants** — additive Foundation evolution only with ≥3
  consumers + backward compatibility.

---

## 12. Final Principle

**The AI must adapt to the project's architecture. The project must never adapt to the
AI.**

Follow the existing Foundation, governance, and workflow. Do not impose external
patterns, duplicate systems, or page-owned visuals.
