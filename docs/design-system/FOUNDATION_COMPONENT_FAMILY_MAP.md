# Foundation Component Family Map

**Phase 3.3A — Read-Only Audit**
**Input:** Step 15 Component Audit of the 3.3A brief.
**Rule:** exactly one family per component. "Creates New Visual Language?" = the
component would need a brand-new color/shadow/radius/border that the golden owner
does not already provide.

**Phase 3.4 update (D-121):** the Control family now owns **per-role semantic
namespaces** (`--button-*`, `--input-*`, `--filter-*`, `--checkbox-*`, `--radio-*`).
Each Control consumes its role tokens; the old single `--control-surface` plan is
superseded.

---

## 1. Surface Family

| Component | File | Current Tokens | Required Tokens | New Visual Language? | Needs Refactor? |
|-----------|------|----------------|-----------------|----------------------|-----------------|
| Card | `src/components/common/AntigravityCard.tsx` | `bg-card-bg`, `border-card-premium-border`, `shadow-card-shadow` | same (Surface) | No | **No** — golden owner |
| StatCard | `AntigravityData.tsx` | `stat-card-*` + status accent | same (Surface + Status accent) | No | No |
| CollectionCard | `src/pages/user/topics/TopicCard.tsx` | delegates to Card | same | No | No |
| CollectionToolbar | `src/pages/user/*` | premium surface recipe | same (Surface); composition target = Card | No | No |
| Modal | `src/components/common/AdminModal.tsx` | surface + elevation | `--surface-floating`, `--modal-shadow` | No | No |
| Dropdown / Menu Panel | `Menu.tsx` | **`bg-card-bg`** | `--surface-floating`, `--dropdown-bg` | No | **Yes (P1)** — swap `bg-card-bg` → floating surface |
| Table / Data shell | `AntigravityData.tsx` | card shell | same | No | No |

## 2. Control Family

| Component | File | Role | Current Tokens | Required Tokens | New Visual Language? | Needs Refactor? |
|-----------|------|------|----------------|-----------------|----------------------|-----------------|
| Button / PrimaryButton | `AntigravityButton.tsx:84/133` | Button | `--material-button-*` | `--button-*` | No | No (primary); re-anchor |
| **Button Secondary** | `AntigravityButton.tsx` (secondary variant) | Button | **`bg-card-bg`, `border-card-premium-border`, `shadow-card-shadow`** | `--button-*` (surface-secondary, border, shadow, hover) | No | **Yes (P1)** — inherits Surface tokens |
| IconButton | `AntigravityButton.tsx:175` | Button | `--btn-*` | `--button-*` | No | No |
| Input / TextArea / Select | `AntigravityForm.tsx` | Input | `--input-*` family | `--input-*` role | No | No (re-anchor) |
| Checkbox | `AntigravityForm.tsx` | Checkbox | `--checkbox-*` (new) | `--checkbox-*` | No | Yes (P1) — owns its surface |
| Radio | `AntigravityForm.tsx` | Radio | `--radio-*` (new) | `--radio-*` | No | Yes (P1) — owns its surface |
| Switch | `AntigravityForm.tsx` | Checkbox (toggle) | accent + hover surfaces | same | No | No |
| PremiumSelect trigger | `PremiumSelect.tsx` | Input | `--bg-hover-bg` | `--input-*` | No | Yes (P1) — token re-scope |
| **CollectionFilter** | `src/components/common/CollectionFilter.tsx` | Filter | **trigger uses `--card-*` + `shadow-card-premium`** | `--filter-*` | No | **Yes (P1)** — must NOT become Navigation; stays Control |

## 3. Navigation Family

| Component | File | Current Tokens | Required Tokens | New Visual Language? | Needs Refactor? |
|-----------|------|----------------|-----------------|----------------------|-----------------|
| SelectionContainer | `AntigravityLayout.tsx` | `selection-surface` | `--selection-bg`, `--nav-indicator` | No | No — golden owner |
| Tabs | `AntigravityLayout.tsx` | `--material-tab-track-*` | same | No | No |
| Sidebar / Navigation | `src/components/common/Navigation.tsx` | `--sidebar-bg: var(--gradient-header)` | same | No | No |
| (aspirational) Breadcrumb | — does not exist | — | `--nav-*` family | — | N/A |

## 4. Status Family

| Component | File | Current Tokens | Required Tokens | New Visual Language? | Needs Refactor? |
|-----------|------|----------------|-----------------|----------------------|-----------------|
| Badge | `src/components/common/Alert.tsx` (Badge) | tinted fills `bg-success/10` etc. | `--color-*`, `--glow-*` | No | No — golden owner |
| DifficultyBadge | `src/components/admin/common/DifficultyBadge.tsx:16` | Badge variant delegation | same | No | No |
| Alert variants | `src/components/common/Alert.tsx` | tinted surface + border | Status colors + Surface frame | No | No (frame = Surface) |
| Status chips (InlineError) | `AntigravityForm.tsx` | tinted | Status | No | No |
| Toast | `src/components/common/Toast.tsx` | severity colors | Status colors + Surface panel | No | No |
| (aspirational) StatusChip | — does not exist | — | `--status-chip-*` | — | N/A |

## 5. Typography Family

| Component | File | Current Tokens | Required Tokens | New Visual Language? | Needs Refactor? |
|-----------|------|----------------|-----------------|----------------------|-----------------|
| Display / H1–H3 | `AntigravityTypography.tsx` | `--text-h1/h2/h3`, `--text-display` | same | No | No |
| Body / Caption / Label | `AntigravityTypography.tsx` | `--text-body/caption/label` | same | No | No |
| StatValue | `AntigravityTypography.tsx` | `--text-stat-value` | same | No | No |
| FormLabel / Helper | `AntigravityForm.tsx` | `--text-label`, `--text-hint` | same | No | No |

---

## 6. Mis-inheritance Summary (the refactor targets)

| # | Component | Inherits (wrong) | From family | Must use | Priority |
|---|-----------|------------------|-------------|----------|----------|
| M-1 | Button Secondary | `--card-premium-border`, `--shadow-card-shadow` | Surface | `--button-*` (Button role) | P1 |
| M-2 | CollectionFilter trigger | `--card-*`, `shadow-card-premium` | Surface | `--filter-*` (Filter role) | P1 |
| M-3 | Menu / PremiumSelect panel | `bg-card-bg` | Surface (wrong token) | `--surface-floating` | P1 |
| M-4 | PremiumSelect trigger | `--bg-hover-bg` | generic | `--input-*` (Input role) | P1 |

Nothing in the Design System creates a new visual language — every needed
appearance already exists in the golden User Panel implementations.

## 7. Resolution Decisions (D-series appended to DESIGN_DECISION_LOG.md)

- **D-117** Alert → Status family (severity), with Surface-family frame.
- **D-118** CollectionFilter → Control family (Filter role), never Navigation;
  anchored to search-bar golden owner.
- **D-119** Menu/PremiumSelect panel surfaces → Surface floating tokens.
- **D-120** Button Secondary & CollectionFilter drop `--card-*` inheritance in P1.
- **D-121** Control family gets per-role semantic namespaces (`--button-*`,
  `--input-*`, `--filter-*`, `--checkbox-*`, `--radio-*`); supersedes the single
  `--control-surface` plan; Filter role = canonical repo filter language.
