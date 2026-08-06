# Management Surface Foundation Architecture

**Phase 3.8 — Repository-Level Design Decision (Foundation Before Migration)**
**Status:** ARCHITECTURE & DECISION DOCUMENT ONLY — **no code, token, variant, component, or Foundation changes. No page migration.**
**Approved direction (D-140):** a neutral **Management Surface Family** is the long-term repository direction; Phase 3.8 determines *how the Foundation must evolve* to support it before any page migrates.
**Related:** `MANAGEMENT_SURFACE_DECISION_MATRIX.md`, `MANAGEMENT_SURFACE_FOUNDATION_PROPOSAL.md`, `MANAGEMENT_SURFACE_MIGRATION_STRATEGY.md`, `MANAGEMENT_SURFACE_RISK_ASSESSMENT.md`, plus Phase 3.7 audit set (`ADMIN_USERS_*`).

---

## 1. The Architectural Fact (proven in Phase 3.7)

> **The Admin Users page owns zero amber styling.** The amber/parchment visual language originates in the **Foundation** — the frozen `Card` `PREMIUM_LIGHT_OVERRIDES` (`AntigravityCard.tsx:25,30,33-34`) plus the light-mode theme tokens — and arrives on every management surface transitively (evidence: `ADMIN_USERS_COLOR_AUDIT.md` §2, 24-row ledger; `ADMIN_USERS_SURFACE_AUDIT.md` §4).

Consequence: changing individual pages cannot fix the language. **The Foundation must evolve first. Only after the Foundation is approved may any page migration begin.**

```
Foundation
    ↓
Management Surface Family        ← introduced here (Phase 3.8 decision, later approval to build)
    ↓
Management Components
    ↓
Management Pages
```

NOT

```
Users → Questions → Students → Exams    ← page-by-page patching hides the problem
```

---

## 2. Step 1 — Foundation Ownership Audit

### 2.1 Who owns what today (evidence-based)

| Concern | Current Owner (correct) | Owns via | Light-mode result |
|---|---|---|---|
| Management surfaces (cards, toolbar, selection) | Foundation `Card` (DS-001, frozen) | `PREMIUM_LIGHT_OVERRIDES` = `light:stat-card-surface light:shadow-premium-card` (`AntigravityCard.tsx:25`) applied to `default`/`premium-neutral`/`premium-dark-neutral` (`:30,33,34`) | parchment + gold gradient + carved gold shadow |
| Collection surfaces | Foundation `CollectionCard` (frozen v1.1) | maps `premium → premium-dark-neutral` (`CollectionCard.tsx:64`); delegates 100% of surface to `Card` | parchment + gold (transitive) |
| Backgrounds | Theme (`themes.css`) | `--bg-app` `#E2CFA6` cream (`:692`), `--bg-surface` `#C9A070` parchment (`:693`), `--surface-stat` gold gradient `#D4A55A→#BF8A30` (`:806`) | amber canvas / parchment cards |
| Borders | Theme | `--border-subtle` gold-tint `rgba(168,120,22,.30)` (`:724`), `--card-border`/`--material-card-premium-border` = `--border-gold` `#A87828` (`:1224`,`:1229`), `--checkbox-border` gold (`:1239`), `--filter-border`/`--input-border` | gold/amber borders everywhere |
| Elevation | Theme | `--elevation-carved` (light-only, `:803`), `--elevation-2` | carved gold depth |
| Shadows | Theme | `--card-shadow` = `--card-3d-shadow` (`:1225`,`:757`), `--material-card-premium-shadow` = carved (`:824`), `--shadow-premium-card`, `--stat-card-3d-shadow` (`:817`) | carved gold shadows |
| Hover | Foundation `Card` | `PREMIUM_SURFACE_HOVER` = `hover:shadow-card-premium` (`AntigravityCard.tsx:24`), `hover:-translate-y-0.5` | gold hover shadow |
| Page surface ownership | Pages | Management Page Standard §8.3 — **pages own zero visuals** | n/a (already correct) |

Every surface has **exactly one owner**; nothing is orphaned, duplicated, or page-owned (`ADMIN_USERS_SURFACE_AUDIT.md` §4). The owner of the amber language is unambiguously the **Foundation (`Card` light overrides) + light theme tokens** — never the pages.

### 2.2 Current Owner → Desired Owner → Migration Risk

| Concern | Current Owner | Desired Owner | Migration Risk |
|---|---|---|---|
| Management card surface (light) | `Card` premium variants (amber in L) | **`Card` new `management` variant** (neutral L/D) | Low-moderate — additive new variant; existing variants pixel-identical (DS-001). Requires token namespace first. |
| Collection row surface (light) | `CollectionCard` `premium` → `premium-dark-neutral` (amber in L) | **`CollectionCard` new `management` variant** → new Card surface | Low — additive variant; all management pages flip together (one-language rule). |
| Toolbar surface (light) | `CollectionToolbar` premium recipe (amber in L) | neutral management recipe (new tokens) | Moderate — shared by every management page; flip must be coordinated. |
| Selection surface (light) | `SelectionContainer`/Tabs gold (Navigation family) | neutral management selection; gold to accents | High — Navigation-family cross-consumers (D-121 documented inheritance); touch only via management-scoped tokens. |
| Backgrounds / borders / elevation / shadows (light) | Theme tokens (amber) | neutral `--management-*` token set; existing tokens untouched | Moderate — additive; legacy tokens remain for non-management families. |
| Hover (light) | `Card` `hover:shadow-card-premium` | neutral management hover (new variant classes) | Low — variant-scoped. |
| Buttons (light) | `Button` primary gold/brown (`:1099-1102`), secondary parchment+gold (`:1232-1237`) | neutral management Button materials (via `--button-*` role tokens) | Moderate — Control-family global; scope via management consumption. |

**Ownership conclusion:** the Foundation already owns the language correctly (one owner per surface). The decision is not *who* owns it but *which* language the Foundation expresses for management consumers.

---

## 3. Step 2 — Management Surface Decision

**Decision: YES — Management Pages should use a neutral Management Surface instead of the Ancient/Amber Surface.**

Architectural reasoning:

1. **The amber language is a Legacy Ancient (premium/Exam) artifact.** It is the certified family for the User Panel premium Card (`FOUNDATION_VISUAL_FAMILIES.md` §3, golden owner = premium Card/StatCard) and the Exam-family consumers (`Card variant="premium"` forest/parchment — TopicCard, ExamCard, AttemptCard). Management pages are a *different product surface* (CRUD/list operations) with no intrinsic need for parchment/gold.
2. **Light-mode amber is theme leakage, not intent.** Dark mode already renders every management surface neutral (`ADMIN_USERS_SURFACE_AUDIT.md` §1). The amber is a light-mode-only artifact of `PREMIUM_LIGHT_OVERRIDES` + light tokens — inconsistent with the approved neutral dark state. One language per theme is the target; today light contradicts dark.
3. **Foundation-first is mandated.** D-140 approved the neutral Management Surface Family as the long-term direction. Phase 3.7 scored the page ❌ on "neutral management surfaces (light)" and "amber confined to accents" (`ADMIN_USERS_VISUAL_AUDIT.md` §9). Failing scores are the *raison d'être* for this decision.
4. **Gold stays — as an accent.** The direction never removes gold; it confines it to brand/status accents (status-hued badges/buttons, brand moments). Management surfaces become calm/neutral, gold remains in the palette for accents (success/danger/warning/info + brand).
5. **No page is exempt.** Because Management Page Standard rule 12 mandates one premium surface family for *all* management pages, a decision to keep amber would freeze it repo-wide forever. The YES decision keeps the Standard's "one language" principle intact — it only changes which family that language is.

This is a **decision, not an implementation** — full option comparison in `MANAGEMENT_SURFACE_DECISION_MATRIX.md`.

---

## 4. Step 3 — Visual Language Separation (Permanent Families)

The repository defines these permanent visual families. Every reusable component and every token belongs to **exactly one** family; cross-family inheritance only where explicitly documented.

| Family | Purpose | Owner | Consumers (today) | Lifetime |
|---|---|---|---|---|
| **Management** (new, proposed) | CRUD/list surfaces — calm, neutral, scannable; gold confined to accents | Foundation (new `--management-*` tokens + `Card` `management` variant) | All Management Page Standard pages: Questions, Users, Students, Exams, Sub Admins, History, Leaderboards, Attempt History, Question Banks, future pages | Permanent — the single management language |
| **Exam** | Premium/gold interactive experience cards | Foundation `Card variant="premium"` (forest/parchment material, `--material-card-premium-*`) | TopicCard, ExamCard, AttemptCard/HistoryCard, exam flow | Permanent — user-facing premium experience |
| **Legacy Ancient** | The parchment/gold premium language in light mode | Foundation premium family + light theme tokens (`--card-*`, `--stat-card-*`, `--elevation-carved`) | Currently every management surface (to be **retired from management** page-by-page) | **Legacy** — retained only for Exam/premium family; management adoption ends at migration |
| **Authentication** | Splash/Login/Signup/Verify — branded surfaces | `Card variant="auth-light"`, `AuthThemeProvider` | Auth pages | Permanent |
| **Status** | Semantic state/outcome/severity | `Badge`/`Alert`/`Toast` severity, `--color-success/warning/danger/info` | All pages (chips, badges, alerts, toasts, stat accents) | Permanent — independent of surface family |
| **Control** | Buttons, inputs, filters, checkbox, radio, selects | `AntigravityButton`, `AntigravityForm`, `CollectionFilter`, `PremiumSelect`; `--button-*`/`--input-*`/`--filter-*`/`--checkbox-*`/`--radio-*` (D-121) | Every page | Permanent — independent; **light material is amber today via `--button-*` light values → becomes neutral for management consumption** |
| **Navigation** | Selection, tabs, sidebar — where the user is/can go | `SelectionContainer`, `Tabs`, `Navigation`; `--nav-*`, `--selection-bg`, `--material-tab-track-*` | All pages | Permanent — selection surfaces gold in light today; management-scoped neutral variant to be considered (risky, see Risk Assessment) |
| **Typography** | Type scale + text colors | `AntigravityTypography`/`AdminText`; `--text-*` | Every family (universal allowed dependency) | Permanent — unchanged |

**Rules derived:**
- A component/token may belong to **one** family only.
- Management pages consume only the **Management** family (surfaces) + **Status/Control/Typography** (content/actions/type).
- Exam/premium gold family is **not** the management language and must not be re-introduced into management pages after migration.

---

## 5. Step 5 — Card Architecture

### 5.1 Responsibilities (current)

| Component | Owns | Does NOT own |
|---|---|---|
| `Card` (`AntigravityCard.tsx`, DS-001 frozen) | Surface recipe: background, border, radius, shadow, hover, elevation, motion, padding per variant | Content, slots, layout semantics |
| `CollectionCard` (`CollectionCard.tsx`, frozen v1.1) | Arrangement (`grid`/`row`), slot anatomy (leading/title/subtitle/metadata/content/footer/actions/trailing), selection tint, loading skeleton, keyboard/a11y, spacing | The actual surface material — **delegates 100% to `Card`** via `VARIANT_MAP` (`CollectionCard.tsx:59-68`) |

### 5.2 Where should Management surfaces live?

**Answer: BOTH — with a strict division of labor.**

- **`Card` owns the management *surface*** (a new additive `management` variant: neutral light + neutral dark recipe, mirroring the existing premium recipe *shape* — `rounded-2xl`, transition, hover lift, premium border-width — but with `--management-*` neutral token values). This is the single source of the management material, consistent with the golden-owner principle (`FOUNDATION_VISUAL_FAMILIES.md` §3: Card is the surface owner).
- **`CollectionCard` owns the management *mapping*** (a new additive `management` variant in `VARIANT_MAP` that maps to the new `Card` surface). It must NOT hand-roll a surface — same delegation contract as today.

Reasoning:
1. Card is the certified surface authority (DS-001); introducing the neutral material anywhere else would create a second surface language.
2. CollectionCard is the certified collection authority; pages must never style it (Management Page Standard §5.2). The variant mapping is the only entry point.
3. Keeping surface in Card and mapping in CollectionCard means future management components (toolbar, filter, skeleton) consume the *same* Card surface language via shared tokens — one recipe, many consumers.

### 5.3 Future evolution

- Additive only: new `Card` variant + new `CollectionCard` variant. Existing variants pixel-identical (DS-001 freeze rule; `FOUNDATION_GOVERNANCE.md` API Evolution — ≥3 consumers, backward compatible, Foundation-owned).
- No `PREMIUM_LIGHT_OVERRIDES` mutation (forbidden without re-audit + approval).
- `CollectionToolbar`/`CollectionFilter`/skeleton/empty/selection follow by consuming the new management tokens through their existing role namespaces (`--toolbar-*`, `--filter-*`, `--button-*`, etc.) — not new component owners.

---

## 6. Step 6 — Token Strategy

**No token is created or changed in Phase 3.8.** This is the architecture for the later (approved) evolution. Classification of the token set under the Management Surface direction:

| Token (namespace) | Today | Decision under Management direction |
|---|---|---|
| `--management-*` | **does not exist** (verified: zero hits in `themes.css`) | **NEW (proposed)** — the single Management-family token namespace (light + dark neutral values). Only token creation permitted at the P2 gate. |
| `--bg-app`, `--bg-surface`, `--bg-card-bg` | amber in L, neutral in D | **REMAIN** (back global canvas + non-management families). Management pages consume the new namespace instead. |
| `--card-*`, `--material-card-premium-*`, `--stat-card-*`, `--elevation-carved`, `--card-3d-shadow` | amber premium family | **REMAIN, EXAM/ANCIENT-ONLY** — still consumed by Exam/premium family; management stops consuming them (page-by-page). Never renamed/moved (frozen consumers). |
| `--border-subtle`, `--input-border`, `--checkbox-border`, `--filter-border` | gold-tint in L | **REMAIN** for Control-family non-management consumers; management controls re-anchor to neutral values via the management namespace (token-level, not component-level). |
| `--button-*` light materials (primary gold/brown, secondary parchment+gold) | amber in L | **REMAIN, ANCIENT-TINTED** — Control family role tokens stay; management consumption flips to neutral via new light values in the management namespace. (Evaluate: per-role neutral light aliases vs. new `--button-*` light values — decided in Foundation proposal.) |
| `--selection-surface`, `--material-tab-track-*` | gold in L (Navigation) | **REMAIN, NAVIGATION-ONLY** — management selection migrates via a management-scoped selection surface; Navigation family untouched. |
| `--ancient-*` aliases (e.g. `--border-gold`, legacy `--ancient-*`) | legacy | **BECOME DEPRECATED / REMOVAL-CANDIDATE** for the management path only; `--border-gold` and `--elevation-carved` dark values stay DEFERRED (D-122) while frozen Exam/Tab consumers reference them. Full alias retirement is a later token phase, not this one. |

**Principle:** existing tokens are never mutated, renamed, or re-tasked (frozen consumers). The management direction is expressed by **adding one namespace** and **re-anchoring management consumers** to it. Deprecation is scoped (management path only), never repo-wide deletion while frozen Exam/Tab consumers exist.

---

## 7. Step 7 — Migration Strategy (summary)

The permanent repository migration order. **No page may migrate before the Foundation is certified.**

```
Foundation evolution (approved in a later phase, P2 gate)
    ↓
Admin Users            ← first validation page (after Foundation approval)
    ↓
Admin Questions
    ↓
Students
    ↓
Exams
    ↓
Sub Admins
    ↓
Leaderboard
    ↓
Future management pages
    ↓
Repository certification
```

Full detail, gates, and entry criteria in `MANAGEMENT_SURFACE_MIGRATION_STRATEGY.md`.

---

## 8. Step 10 — Repository Rules (permanent, if Foundation evolution is approved)

1. **Only ONE Management Surface language exists repo-wide** — the certified neutral Management Surface Family. Two management languages are permanently forbidden.
2. **Management pages never own visual surfaces** — Management Page Standard §8.3 already mandates zero page-owned visuals; unchanged and re-affirmed.
3. **Foundation owns all management materials** — the `Card` `management` variant + `--management-*` namespace are the single source; pages compose, never style.
4. **Ancient/parchment language is reserved for legacy/Exam experiences only** — retained for the premium/Exam family (TopicCard/ExamCard/AttemptCard); it is retired from management surfaces page-by-page, never reintroduced.
5. **Future management pages must inherit from the certified Management Surface Family** — any new management page after migration starts from the neutral family; no page may copy a pre-migration page.
6. **Additive-only evolution** — no existing token/variant/render is mutated; new variants/tokens only (DS-001 freeze, `FOUNDATION_GOVERNANCE.md` API Evolution).
7. **Gold is an accent, never a surface** — confined to status/brand highlights in management pages.
8. **Every migration is a D-series-gated phase** — no page flips outside an approved phase; the Certification Standard gate applies per page.

---

## 9. Status Declaration

- This document is **architecture and decision only**.
- **Zero code, zero token, zero variant, zero component, zero Foundation, zero page changes** were made in Phase 3.8.
- The neutral Management Surface Family and all `--management-*` / `management` variant references are **proposed targets**, not created artifacts.
- Implementation begins only after explicit approval of the Foundation proposal (`MANAGEMENT_SURFACE_FOUNDATION_PROPOSAL.md`) and a new D-series decision.
