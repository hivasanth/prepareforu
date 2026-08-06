# Foundation Token Ownership

**Phase 3.3A — Read-Only Audit**
**Rule:** Every token belongs to **exactly one family**. Tokens are listed here with
their verified location in `src/styles/themes.css` (line numbers current at audit
time). Token namespaces that exist today are kept; nothing is renamed or moved in
this phase.

**Phase 3.4 update (D-121):** the Control family now defines **per-role semantic
namespaces** (`--button-*`, `--input-*`, `--filter-*`, `--checkbox-*`, `--radio-*`).
They are documented in §4 and created in Phase 3.4. Each role is a member of the
Control family but owns its own appearance — like Status owns
success/warning/danger/info.

---

## 1. Family Token Ownership (one owner each)

| Family | Token namespace | Existing tokens (verified) | Locations |
|--------|-----------------|----------------------------|-----------|
| **Surface** | `--surface-*` | canvas, nav, primary, secondary, interactive, floating, overlay, hover, inset, raised | themes.css:601-610 |
| **Surface** | `--elevation-*` | carved (light-only — dark GAP), + elevation scale | themes.css:803 |
| **Surface** | `--shadow-*` | semantic shadow aliases incl. `--shadow-modal` | themes.css:622-628 |
| **Surface** | `--card-*` | `--card-bg`, `--card-border` (dark:992 / light:1153), `--card-shadow` | themes.css:897-941, 992, 1153 |
| **Surface** | `--material-card-premium-*` | surface, border, shadow | themes.css:1004-1017, 1158 |
| **Surface** | `--stat-card-*` | border (light:1163 `--border-gold`), radius | themes.css:1060-1068 |
| **Surface** | `--dropdown-*` (panel half) | `--dropdown-bg`, `--dropdown-radius:16px`, `--dropdown-z:50` | themes.css:924-931 |
| **Control** | `--input-*` | `--input-bg`, `--input-text`, `--input-border`, `--input-radius`, `--input-focus-border` | themes.css:909-914 |
| **Control** | `--btn-*` | button surfaces/borders | themes.css:897-908 |
| **Control** | `--material-button-*` | primary surface, primary shadow | themes.css:1027-1031 |
| **Control** | `--material-input-*` | input family | themes.css:1033-1042 |
| **Control** | `--dropdown-*` (trigger half) | `--dropdown-*` trigger tokens | themes.css:924-931 |
| **Navigation** | `--nav-*` | `--nav-surface`, `--nav-text`, `--nav-bg-hover`, `--nav-bg-active`, `--nav-indicator` | themes.css:631-639 |
| **Navigation** | `--bg-nav-*`/`--text-nav-*`/`--border-nav-*` | nav, nav-active, nav-indicator, nav-footer | themes.css:574-587 |
| **Navigation** | `--selection-bg` | dark #2D5A27 (508) / light #166534 (753) | themes.css:508, 753 |
| **Navigation** | `--material-tab-track-*` | track, track-shadow | themes.css:1045-1049 |
| **Navigation** | `--sidebar-*` | `--sidebar-bg: var(--gradient-header)` | themes.css:1128-1129 |
| **Status** | `--color-success/warning/danger/info` | semantic palette | themes.css:595-599 region |
| **Status** | `--glow-*` | success/warning/danger glows | themes.css:596-597 |
| **Status** | badge radii | badge radius token | themes.css:572 region |
| **Typography** | `--text-h1/h2/h3/body/caption/label/stat-value/badge` | full type scale | themes.css:560-572 |
| **Typography** | `--text-primary/secondary/muted/hint/title/on-dark` | text color palette | themes.css:441-450 |

---

## 2. Orphan / Cross-Family Violations Found (must be resolved in P0–P4)

These tokens are currently **shared or orphaned** — the root cause of
`SURFACE_PROBLEM_REGISTER.md` P-001/P-002/P-003.

| Token | Used by today | Owned by | Violation |
|-------|---------------|----------|-----------|
| `--bg-surface` | Card, CollectionToolbar, CollectionFilter, Button Secondary, PremiumSelect, Input | **Surface** | Controls inherit a Surface token |
| `--bg-hover-bg` | controls (hover), dropdown triggers | **Control** | name collides with generic hover semantics; re-scoped per role (D-121: `--button-*`/`--input-*`/`--filter-*`/`--checkbox-*`/`--radio-*`) |
| `--border-subtle` | controls + nav + surface edges | **Control** (border) | shared across families; re-anchored into per-role Control borders (D-121) |
| `--card-premium-border` / `--shadow-card-shadow` | **Button Secondary** (`AntigravityButton.tsx:38-39`), **CollectionFilter trigger** | **Surface** | Controls inherit Surface premium tokens |
| `--card-bg` | Menu panel, PremiumSelect panel, CollectionFilter trigger | **Surface** | panels should use `--surface-floating` (Surface) |
| `--selection-bg` | SelectionContainer selected surface | **Navigation** | correct owner; ensure Controls never consume it |
| `--text-primary` | legacy `.ancient-card-dark` + body | **Typography** | acceptable universal consumption (type is safe everywhere) |

---

## 3. Token → Family reference (quick lookup)

- **Surface:** `--bg-surface`, `--surface-*`, `--elevation-*`, `--shadow-*`,
  `--card-*`, `--material-card-premium-*`, `--stat-card-*`, `--dropdown-*` (panel),
  `--modal-*`, `--radius-container`, `--radius-control`.
- **Control:** role namespaces `--button-*`, `--input-*`, `--filter-*`,
  `--checkbox-*`, `--radio-*` (Phase 3.4, D-121); legacy `--btn-*`,
  `--material-button-*`, `--material-input-*`, `--dropdown-*` (trigger),
  `--bg-hover-bg`, `--border-subtle`.
- **Navigation:** `--nav-*`, `--bg-nav-*`, `--text-nav-*`, `--border-nav-*`,
  `--selection-bg`, `--material-tab-track-*`, `--sidebar-*`, `--gradient-header`.
- **Status:** `--color-success`, `--color-warning`, `--color-danger`,
  `--color-info`, `--glow-*`, badge radius.
- **Typography:** `--text-*` scale + `--text-*` colors, `--color-accent` (used by
  focus borders — **Control** owns focus border; accent is a Control-family value).

---

## 4. Gaps Requiring New Tokens (Phase 3.4 only — documented, NOT created here)

| Gap | Family | Notes |
|-----|--------|-------|
| `--button-*` role namespace | Control | Button language: surface primary/secondary, border, hover, focus (D-121) |
| `--input-*` role namespace (extended) | Control | Input language: surface, border, focus — shared by PremiumSelect (D-121) |
| `--filter-*` role namespace | Control | Filter language: surface, border, active, hover — CollectionFilter ONLY (D-121, D-118) |
| `--checkbox-*` role namespace | Control | Checkbox language: surface, border, selected (D-121) |
| `--radio-*` role namespace | Control | Radio language: surface, border, selected (D-121) |
| `--surface-floating` dark value parity | Surface | verify dark/light parity for panels |
| `--elevation-carved` dark value | Surface | **missing dark** (themes.css:803 light-only) |
| `--border-gold` dark value | Surface | **missing dark** (themes.css:784 light-only) |
| `--nav-indicator` usage in Tabs | Navigation | track tokens exist; indicator unification |
| `--status-chip-*` | Status | aspirational StatusChip component |

**Note (D-121):** the earlier plan's single `--control-surface`/`--control-border`
gaps are **superseded** by the per-role namespaces above. A shared control surface
would force Button/Input/Filter/Checkbox/Radio to render identically, which is
incorrect — they are one family with multiple semantic roles.

All token creation/migration is deferred to `FOUNDATION_FAMILY_IMPLEMENTATION_PLAN.md`;
**this phase makes no token changes.**
