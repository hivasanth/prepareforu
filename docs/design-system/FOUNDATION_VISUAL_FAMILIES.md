# Foundation Visual Families

**Phase 3.3A — Foundation Visual Family Architecture (Read-Only)**
**Status:** Documentation only — no code/token/component changes
**Related:** `SURFACE_TOKEN_INVENTORY.md`, `SURFACE_PROBLEM_REGISTER.md`, `FOUNDATION_TOKEN_OWNERSHIP.md`

---

## 1. Why Families Exist

The root problem carried from Phase 3.3 (`SURFACE_PROBLEM_REGISTER.md` P-001): one
semantic token (`--bg-surface`) is inherited by Card, CollectionToolbar,
CollectionFilter, Button Secondary, PremiumSelect, and Input. Changing it alters
unrelated UI.

Phase 3.3A replaces the *surface-first* mental model with a *family-first* model:

> Every reusable component belongs to **exactly one Foundation family**. Every token
> belongs to **exactly one Foundation family**. A component may only inherit tokens
> from its own family, **unless a cross-family inheritance is explicitly documented
> in this file**.

The Design System does not invent new colors, filters, or button styles. Each family
is anchored by the **existing, proven User Panel implementation** that already owns
that appearance. That implementation becomes the canonical reference (the
**"golden owner"**).

---

## 2. The Five Families

| # | Family | Golden Owner (existing User Panel impl) | Core Question |
|---|--------|------------------------------------------|---------------|
| 1 | **Surface** | Premium Card (`AntigravityCard.tsx`), StatCard | "Does this define the stage the content sits on?" |
| 2 | **Control** | Search-bar Input + CTA Button (`AntigravityButton.tsx`) | "Does the user click/type/select on this?" |
| 3 | **Navigation** | SelectionContainer + Tabs (`AntigravityLayout.tsx`), Sidebar (`Navigation.tsx`) | "Does this express where the user is / can go?" |
| 4 | **Status** | DifficultyBadge, Alert variants | "Does this communicate state/outcome/severity?" |
| 5 | **Typography** | Heading/Body/Caption scale (`AntigravityTypography.tsx`) | "Does this set a type size/weight/case?" |

The five questions are mutually exclusive; every reusable component must answer
**exactly one** of them "yes".

---

## 3. Family 1 — Surface

**Purpose:** Define the structural stage of the interface — background, border,
radius, elevation, shadow of the frame content sits on.

**Golden Owner:** Premium Card (`src/components/common/AntigravityCard.tsx`)
— premium surface recipe (`bg-card-bg`, `border-card-premium-border`,
`shadow-card-shadow`) and StatCard recipe. This is the proven User Panel surface
language; nothing in the Design System may invent a competing surface language.

**Token namespace (existing):** `--surface-*` (`themes.css:601-610`),
`--elevation-*` (`themes.css:803`), semantic shadow aliases `--shadow-*`
(`themes.css:622-628`), component tokens `--card-bg`, `--card-border`,
`--card-shadow`, `--material-card-premium-surface/border/shadow`
(`themes.css:1004-1017`), `--stat-card-*` (`themes.css:1060-1068`),
`--modal-shadow`.

**Component ownership (Surface):**

| Component | File | Notes |
|-----------|------|-------|
| Page / Section | `AntigravityLayout.tsx` | page frame |
| Card | `AntigravityCard.tsx` | **golden owner** |
| StatCard | `AntigravityData.tsx` | card recipe + status accents |
| CollectionCard | `src/pages/user/topics/TopicCard.tsx` | delegates to Card |
| CollectionToolbar | `src/pages/user/*` | premium surface strip |
| Modal | `src/components/common/AdminModal.tsx` | overlay + panel surface |
| Dropdown Panel / Menu Panel | `Menu.tsx`, `PremiumSelect.tsx` | floating surface (`--surface-floating`) |
| Table/Data shell | `AntigravityData.tsx` | data card shell |

**Token ownership (Surface):** structural only — backgrounds, borders, radii,
elevation, shadows. **Never** semantic colors (success/warning/etc.), never
interactive focus rings, never type scale.

**Cross-family inheritance ALLOWED (documented):**
- Modal/Alert panel surface MAY inherit Surface tokens (they are structural).
- Status chips/Alert **colors** come from Status family; their **container** is a
  Surface-family surface. Documented in `FOUNDATION_COMPONENT_FAMILY_MAP.md`.

**Cross-family inheritance FORBIDDEN:**
- A **Control** must NOT use `--card-*` / `--material-card-premium-*` shadow or
  border tokens (today: Button Secondary, CollectionFilter trigger do this — see
  Problem P-002/P-003). Controls use Control-family tokens only.
- A **Navigation** element must NOT use `--card-*` border tokens for its selected
  state.

---

## 4. Family 2 — Control

**Purpose:** Define every interactive widget the user clicks, types into, toggles,
selects, or submits. Owns control background, control border, control radius,
hover/focus/active/disabled states, and transition timing.

**Phase 3.4 (D-121):** the Control family is ONE family containing MULTIPLE
**semantic roles** — exactly like the Status family contains
success/warning/danger/info. Each role owns its own appearance; roles do NOT share
a single surface token.

```
Control Family
├── Button Language   → --button-*    (golden: User Panel Buttons)
├── Input Language    → --input-*     (golden: User Panel Input, PremiumSelect)
├── Filter Language   → --filter-*    (golden: Exam Selection interaction)
├── Checkbox Language → --checkbox-*  (golden: certified SelectionCheckbox)
└── Radio Language    → --radio-*     (golden: certified Radio)
```

**Golden Owner:** User Panel search-bar Input + CTA Button
(`src/components/common/AntigravityButton.tsx`, `AntigravityForm.tsx`). The proven
control language: compact control surface, `border-border-subtle`, `focus:border-primary`
focus ring. **No new "filter colors" or "button colors" are invented** — every role
derives from an existing certified implementation.

**Token namespaces:** per-role `--button-*`, `--input-*`, `--filter-*`,
`--checkbox-*`, `--radio-*` (Phase 3.4, D-121); legacy `--btn-*`
(`themes.css:897-908`), `--material-button-*` (`themes.css:1027-1031`),
`--material-input-*` (`themes.css:1033-1042`), `--dropdown-*` trigger
(`themes.css:924-931`).

**Component ownership (Control):**

| Component | File | Role | Status today |
|-----------|------|------|--------------|
| Button / PrimaryButton / IconButton | `AntigravityButton.tsx` | Button | Primary OK; **Secondary uses `--card-*` tokens — refactor to `--button-*` (P1)** |
| Input / TextArea / Select | `AntigravityForm.tsx` | Input | re-anchor to `--input-*` role tokens |
| Checkbox | `AntigravityForm.tsx` | Checkbox | re-anchor to `--checkbox-*` |
| Radio | `AntigravityForm.tsx` | Radio | re-anchor to `--radio-*` |
| Switch | `AntigravityForm.tsx` | Checkbox (toggle) | uses accent/hover surfaces; OK |
| PremiumSelect | `PremiumSelect.tsx` | Input (inherits Input tokens) | trigger re-scope to `--input-*`; panel → Surface floating |
| CollectionFilter | `src/components/common/CollectionFilter.tsx` | Filter | **uses `--card-*` surface tokens — refactor to `--filter-*` (P1)**; stays Control, never Navigation |
| Menu trigger | `Menu.tsx` | Control | trigger control; Menu panel → Surface floating |

**Repository rule (Phase 3.4, D-121):** a reusable component may inherit from
another reusable component ONLY if it belongs to the same Foundation family AND
uses the correct semantic role tokens.
- ✅ `PremiumSelect` → `--input-*` (same family, correct role)
- ✅ `CollectionFilter` → `--filter-*` (same family, correct role)
- ❌ `CollectionFilter` → Card surface
- ❌ `Button Secondary` → Card surface
- ❌ `Checkbox` → Button tokens

**Token ownership (Control):** per-role surface/border/hover/focus/active/selected
tokens. **Never** card shadows, never semantic status colors, never nav selection
colors.

**Cross-family inheritance ALLOWED (documented):**
- Dropdown **panel** surface (for Menu/PremiumSelect) inherits Surface-family
  floating surface tokens — a structural stage, not a control state.
- PremiumSelect trigger consumes **Input** role tokens (same family).

**Cross-family inheritance FORBIDDEN:**
- Controls must NOT inherit `--card-*`, `--material-card-premium-*`,
  `--stat-card-*`, `--nav-*`, or Status-family colors.

---

## 5. Family 3 — Navigation

**Purpose:** Define where the user is and where they can go — selected state,
active indicator, navigation hover, navigation animation.

**Golden Owner:** SelectionContainer + Tabs (`AntigravityLayout.tsx`) and Sidebar
(`src/components/common/Navigation.tsx`). Proven nav language: gold-ish selection
surface, indicator border, uppercase labels.

**Token namespace (existing):** `--nav-*` (`themes.css:631-639`),
`--bg-nav*`/`--text-nav*`/`--border-nav*` (`themes.css:574-587`),
`--selection-bg` (`themes.css:508/753`), `--material-tab-track-*`
(`themes.css:1045-1049`), `--sidebar-bg`/`--sidebar-*` (`themes.css:1128`).

**Component ownership (Navigation):**

| Component | File | Status today |
|-----------|------|--------------|
| SelectionContainer | `AntigravityLayout.tsx` | golden owner; uses `selection-surface` |
| Tabs | `AntigravityLayout.tsx` | `--material-tab-track-*` |
| Sidebar / Navigation | `src/components/common/Navigation.tsx` | `--sidebar-bg` gradient |
| (aspirational) Breadcrumb | — | does NOT exist yet; future component |

**Token ownership (Navigation):** selection/active surface, nav hover, active
indicator border, nav text, nav animation. **Never** generic `--card-*` borders for
selection. **Never** Status-family colors for active state.

**Cross-family inheritance FORBIDDEN:**
- CollectionFilter must NOT become Navigation even though it "filters" — it is a
  Control (per Step 15 of the brief). Its control language is anchored to the
  search-bar golden owner, not to SelectionContainer.

---

## 6. Family 4 — Status

**Purpose:** Communicate semantic state/outcome/severity. Owns semantic colors only
— success / warning / danger / info — plus the containers that *carry* them
(chips, badges, alert variants, toast).

**Golden Owner:** `src/components/admin/common/DifficultyBadge.tsx` (delegates to
`Badge`), Alert variants (`src/components/common/Alert.tsx`), stat accents.
Proven status language: translucent tinted fills (`bg-success/10`),
tinted text (`text-success`), optional tinted border.

**Token namespace (existing):** `--color-success/warning/danger/info`
(`themes.css:595-599` region), `--glow-*` (`themes.css:596-597`), badge radii.

**Component ownership (Status):**

| Component | File | Status today |
|-----------|------|--------------|
| Badge | `src/components/common/Alert.tsx` (Badge export) | golden owner |
| DifficultyBadge | `src/components/admin/common/DifficultyBadge.tsx` | correct |
| Alert variants | `src/components/common/Alert.tsx` | correct |
| Status chips (InlineError etc.) | `AntigravityForm.tsx` | correct |
| Toast | `src/components/common/Toast.tsx` | panel is Surface; severity is Status |
| (aspirational) StatusChip | — | does NOT exist yet |

**Token ownership (Status):** semantic colors and their translucent fills/borders/
glows. **Never** structural surfaces (`--bg-surface`, `--surface-*`), never nav
selection colors, never control focus rings.

**Cross-family inheritance ALLOWED (documented):**
- Status containers (badge chip, alert box, toast) MAY inherit a Surface-family
  background/border/radius — the **frame** is structural; only the **hue** is Status.

**Cross-family inheritance FORBIDDEN:**
- Structural surfaces must not take on status hues except through documented
  Status-family accents (e.g. StatCard status icon uses Status tokens).

---

## 7. Family 5 — Typography

**Purpose:** Define the type scale and text colors — heading hierarchy, body,
caption, label (uppercase tracked), helper, stat value, brand title.

**Golden Owner:** `src/components/common/AntigravityTypography.tsx` (H1/H2/H3,
Body, Label, Display, Caption, BrandTitle) — proven User Panel type scale.

**Token namespace (existing):** full scale `--text-h1/h2/h3/body/caption/label/
stat-value/badge` (`themes.css:560-572`); text colors `--text-primary/secondary/
muted/hint/title/on-dark` (`themes.css:441-450`).

**Component ownership (Typography):** Display, Heading (H1–H3), Body, Caption,
Label (uppercase tracked), Helper/FormLabel, StatValue, BrandTitle.

**Token ownership (Typography):** type sizes, weights, letter-spacing, line-height,
text colors, text gradients (brand title). **No** visual surfaces — typography never
owns a background, border, shadow, or radius.

**Cross-family inheritance:** Typography tokens are consumed by every other family
(text labels inside controls, nav labels, status chip labels). This is the one
**allowed** universal dependency — type tokens are safe to consume anywhere.

---

## 8. The Component → Family Audit (Step 15)

Every reusable component answers **one** family. Current mis-inheritance flagged:

| Component | Current family (as built) | Correct family | Problem |
|-----------|---------------------------|----------------|---------|
| Button Secondary | Control, but uses `--card-premium-border`/`--shadow-card-shadow` | Control (Button role) | inherits Surface tokens → `--button-*` |
| CollectionFilter | Control, but uses `--card-*`/`--shadow-card-premium` trigger | Control (Filter role) | inherits Surface tokens → `--filter-*` |
| PremiumSelect trigger | Control (`--bg-hover-bg`) | Control (Input role) | re-scope to `--input-*`; panel → Surface floating |
| Menu panel | Surface (`bg-card-bg`) | Surface | should use `--surface-floating` |
| CollectionToolbar | Surface | Surface | correct, but composition target = Card |
| SelectionContainer | Navigation (`selection-surface`) | Navigation | correct; do not convert to Control |
| Card / StatCard | Surface | Surface | correct; golden owner |
| Badge / DifficultyBadge / Alert | Status | Status | correct |
| Tabs / Sidebar | Navigation | Navigation | correct |
| Input / Form controls | Control | Control (Input/Checkbox/Radio roles) | correct family; re-anchor per role |
| Typography components | Typography | Typography | correct |

**Design rule for future components (checklist — any YES on Q4–Q8 stops until
architecture approval):**
1. Which family? (exactly one)
2. What do I inherit from? (same-family component or family token)
3. Which family tokens do I use? (from `FOUNDATION_TOKEN_OWNERSHIP.md`)
4. Do I introduce a **new color**?
5. Do I introduce a **new shadow/elevation**?
6. Do I introduce a **new radius**?
7. Do I introduce a **new hover/focus/active state**?
8. Do I introduce a **new border**?

---

## 9. Known Gaps (for Phase 3.4, no changes here)

| # | Gap | Status (Phase 3.4 P0, D-121) |
|---|-----|-------|
| 3.3A-G1 | No dedicated Control role namespaces; controls partially use `--bg-hover-bg`/`--border-subtle` today → `--button-*`/`--input-*`/`--filter-*`/`--checkbox-*`/`--radio-*` (D-121) | ✅ **CLOSED** (P0) — role namespaces created in `themes.css`; all six Control components consume them |
| 3.3A-G2 | Button Secondary + CollectionFilter inherit `--card-*` Surface tokens → per-role Control tokens | ✅ **CLOSED** (P0) — re-anchored to `--button-*`/`--filter-*`; zero `--card-*` classes remain in Control components |
| 3.3A-G3 | `--elevation-carved` has **no dark value** (`themes.css:803` is light-only) | ⏸️ **DEFERRED (D-122)** — dark `:root` references it (e.g. `--material-card-premium-shadow`); adding a dark value would re-add a carved shadow to frozen `Card` premium dark renders (DS-001 freeze). The current `none` fallback IS the certified dark state. |
| 3.3A-G4 | `--border-gold` has **no dark value** (`themes.css:784` light-only) | ⏸️ **DEFERRED (D-122)** — dark `:root` references it (Tab tokens `--material-tab-*`); adding a dark value would alter frozen `Tabs` dark renders (DS-011 freeze). The `currentColor` fallback IS the certified dark state. |
| 3.3A-G5 | Breadcrumb and StatusChip are aspirational (do not exist) | Not in P0 scope (P2/P3) |
| 3.3A-G6 | Menu/PremiumSelect panels use `bg-card-bg` instead of `--surface-floating` | ✅ **CLOSED** (P0, D-119) — `Menu.tsx` + `PremiumSelect.tsx` panels → `bg-[var(--surface-floating)]`; all floating panels share the Surface floating surface |

Full remediation in `FOUNDATION_FAMILY_IMPLEMENTATION_PLAN.md` (P0–P4).
