# Admin Users — Visual Migration Plan

**Phase 3.7 — Admin Users Visual Language Audit (Discovery only)**
**Status:** PLANNING ONLY — no code, token, variant, or Foundation changes.
**Scope:** repository-wide migration roadmap toward a single neutral Management Surface Family.
**Related:** `ADMIN_USERS_SURFACE_AUDIT.md`, `ADMIN_USERS_COLOR_AUDIT.md`, `ADMIN_USERS_VISUAL_AUDIT.md`, `ADMIN_USERS_MANAGEMENT_SURFACE_PROPOSAL.md`.

---

## 1. Purpose

This roadmap sequences the (future, **not yet approved**) migration from the current amber/parchment
management language to a single neutral **Management Surface Family**. It is the authoritative
reference for the subsequent Foundation evolution phase. **Nothing here is executed in Phase 3.7.**

**Permanent rule (approved direction):** there must be only **one Management Surface language**
across the repository. Amber/parchment management surfaces are a **legacy language** identified in
this audit. Implementation begins only after explicit approval.

---

## 2. Roadmap

```
P0
Amber inventory                       ← COMPLETE (Phase 3.7 deliverables)
│
↓
P1
Foundation proposal                   ← Management Surface Family proposal (written, not implemented)
│
↓
P2
Additive Foundation evolution         ← tokens + Card/CollectionCard/toolbar/filter/button variants (additive only)
│
↓
P3
Admin Users migration (validation page)
│
↓
P4
Admin Questions migration
│
↓
Students
│
↓
Exams
│
↓
Sub Admins
│
↓
Leaderboard
│
↓
Future management pages
│
↓
Repository certification
```

---

## 3. P0 — Amber Inventory ✅ (DONE in Phase 3.7)

| Deliverable | File | Status |
|---|---|---|
| Surface inventory (light+dark, owners) | `ADMIN_USERS_SURFACE_AUDIT.md` | ✅ |
| Amber/parchment usage ledger | `ADMIN_USERS_COLOR_AUDIT.md` | ✅ |
| Family classification + component audits | `ADMIN_USERS_VISUAL_AUDIT.md` | ✅ |
| Management Surface Family target | `ADMIN_USERS_MANAGEMENT_SURFACE_PROPOSAL.md` | ✅ |
| Migration roadmap | this file | ✅ |

**Key P0 outputs used downstream:**
- Amber source list (tokens + file:line) in `ADMIN_USERS_COLOR_AUDIT.md` §2.
- The full set of frozen components that must stay additive (`ADMIN_USERS_VISUAL_AUDIT.md` §3–8).
- Critical/High/Medium/Low priority list (`ADMIN_USERS_VISUAL_AUDIT.md` §9).

---

## 4. P1 — Foundation Proposal (not started)

- [ ] Convert the conceptual proposal into a D-series decision request:
  - neutral `--management-*` token namespace (light + dark value table)
  - additive `Card` `management` variant (freeze-safe)
  - additive `CollectionCard` `management` variant mapping
  - neutral toolbar/filter/button/skeleton/selection consumption
  - Management Page Standard **rule 12** amendment (premium family → Management Surface Family)
  - one-management-language governance rule
- [ ] Approval gate — D-series decision before any P2 work.
- **Constraint:** no existing token/variant/render is mutated; additive-only.

---

## 5. P2 — Additive Foundation Evolution (not started)

- [ ] Create `--management-*` tokens (neutral light + dark). Existing tokens untouched.
- [ ] Add `Card` `management` variant (identical recipe shape; neutral light values). Existing
      variants pixel-identical (DS-001 freeze compliance).
- [ ] Add `CollectionCard` `management` variant → new Card surface.
- [ ] Neutral management variants for `CollectionToolbar`, `CollectionFilter` (via `--filter-*`),
      `Button` secondary/primary (via `--button-*`), Skeleton/Empty, Selection/Tabs.
- [ ] Verification gate per component: Light, Dark, Hover, Focus, Disabled, Responsive, A11y,
      Build, TypeScript (freeze-register Verification Rules). Build success is never acceptance.

---

## 6. P3 — Admin Users Migration (validation page)

- [ ] Users rows switch to the additive `management` CollectionCard variant.
- [ ] Toolbar, filter, search, modal, empty/error, skeleton consume neutral management surfaces.
- [ ] Row status buttons (success/danger) unchanged; modal primary/secondary go neutral.
- [ ] Validate: responsiveness, accessibility, animations, dark/light themes, Management Page
      Standard compliance (16-point Certification Standard checklist).
- [ ] Certification gate → Users becomes the first certified neutral Management Surface page.

---

## 7. P4 — Repository-wide Migration (one language)

- [ ] **Admin Questions** migrates to the neutral management family (second certified page).
- [ ] **Students** → **Exams** → **Sub Admins** → **Leaderboard** → future management pages,
      page-by-page, each against the Certification Standard.
- [ ] No page may introduce a second management language; the one-language rule is permanent.
- [ ] Amber/parchment management surfaces fully retired page-by-page (not a separate redesign).

---

## 8. Repository Certification

- [ ] Every management page certified against `MANAGEMENT_PAGE_CERTIFICATION_STANDARD.md`.
- [ ] Zero Legacy Ancient tokens remaining in the management surface path (light).
- [ ] Gold confined to accents (status/brand), never a surface.
- [ ] Full-repo verification: tsc 0 · build 0 · lint frozen baseline, zero new · grep zero
      page-owned visuals.
- [ ] Governance record: D-series decisions, freeze-register additions, page index, execution log.

---

## 9. Out of Scope / Guardrails

| Item | Rule |
|---|---|
| Implementation | No code until explicit approval after P1 gate |
| Frozen components | Mutating existing renders is forbidden (freeze register V3.1) |
| Two management languages | Never permanently — one Management Surface language |
| Non-management surfaces | Exam/premium gold family (TopicCard, ExamCard, AttemptCard, dashboard) stays untouched |
| Auth/Overlay/Status/Typography families | Unchanged except where a management surface inherits them |
