# Admin Users — Color Audit

**Phase 3.7 — Admin Users Visual Language Audit (Discovery only)**
**Status:** DOCUMENTATION ONLY — no code, token, variant, or Foundation changes.
**Scope:** `src/pages/admin/AdminUsers.tsx` + `src/components/admin/users/**` + every Foundation component the page renders.
**Related:** `ADMIN_USERS_SURFACE_AUDIT.md`, `ADMIN_USERS_VISUAL_AUDIT.md`, `ADMIN_USERS_MANAGEMENT_SURFACE_PROPOSAL.md`, `ADMIN_USERS_VISUAL_MIGRATION_PLAN.md`.

---

## 1. Method (Brief Step 2 — Amber Usage Audit)

The entire rendering tree was searched for every amber / parchment / gold dependency: `bg-card-bg`,
`--bg-surface`, `--border-gold`, `ancient-*`, `parchment`, gold border, gold shadow, warm gradient,
warm hover, gold outline. Each occurrence is recorded below with **Component · File · Line · Token ·
Current purpose · Owner · Consumer**.

**Search result (page-owned):** the Users page files
(`AdminUsers.tsx`, `UsersActions.tsx`, `UsersTable.tsx`, `UserIdentity.tsx`, `useAdminUsers.ts`)
contain **zero** amber/parchment/gold color classes. The only non-structural class any page file
uses is `text-text-primary` / `text-text-secondary` / `text-text-muted` (Typography) plus structural
classes (`w-full`, `flex`, `gap-*`, `min-w-0`, `truncate`, `sr-only`, `animate-in`). **Every amber
occurrence arrives transitively from frozen Foundation components via light-theme tokens.**

---

## 2. Amber / Parchment Usage Ledger

Legend: **L** = light mode, **D** = dark mode. `—` = not applicable / no amber.

| # | Component (rendered on Users) | File | Line | Token / class | Resolved color (L) | Current purpose | Owner | Consumer |
|---|---|---|---|---|---|---|---|---|
| 1 | Page canvas (body) | `themes.css` | 692 / 417 | `--bg-app` | `#E2CFA6` cream (D `#111827`) | Page background | Theme | Every page |
| 2 | Page canvas (surface) | `themes.css` | 693 / 418 | `--bg-surface` | `#C9A070` parchment (D `#1F2937`) | Card/control surface | Theme | Card, toolbar, filter, modal, toast |
| 3 | Page canvas (elevated) | `themes.css` | 694 | `--bg-elevated` | `#FFF8E7` cream | Floating surface | Theme | Floating panels |
| 4 | Card family bg | `themes.css` | 928 | `--card-bg = --bg-surface` | `#C9A070` | Card surface | Card | CollectionCard, CollectionToolbar, CollectionFilter, Menu panel, Modal, Toast |
| 5 | Card border | `themes.css` | 1224 / 1063 | `--card-border` | `--border-gold` `#A87828` (D `rgba(55,65,81,.5)`) | Card border | Card | Card default/elevated |
| 6 | Premium card border | `themes.css` | 1229 / 1087 | `--material-card-premium-border` | `--border-gold` `#A87828` (D `transparent`) | Premium border | Card | CollectionCard, CollectionToolbar, SelectionContainer, Button secondary, ThemeToggle |
| 7 | Card shadow (L) | `themes.css` | 1225 / 757 | `--card-shadow = --card-3d-shadow` / `--elevation-2` | Carved gold inset + offset shadow | Card elevation | Card | CollectionCard, CollectionToolbar |
| 8 | Card light overrides | `AntigravityCard.tsx` | 25, 30, 33-34 | `light:stat-card-surface light:shadow-premium-card` | Gold gradient `#D4A55A→#BF8A30` + carved gold shadow | All-card light material | Card | `default`, `premium-neutral`, `premium-dark-neutral` variants |
| 9 | Subtle border | `themes.css` | 724 / 448 | `--border-subtle` | `rgba(168,120,22,.30)` gold-tint (D `#374151`) | Control/divider border | Control/Surface | Input, CollectionFilter, Checkbox, Badge frame, Modal, Toast |
| 10 | Gold border (primitive) | `themes.css` | 805 | `--border-gold` | `#A87828` | Stat/gold border primitive | Surface/legacy | `GOLD_SURFACE` (skeleton, empty), Tab tokens, `--card-border`, `--checkbox-border` |
| 11 | Stat gold gradient | `themes.css` | 806 | `--surface-stat` | `#D4A55A→#C9943C→#BF8A30` | Stat/premium gold surface | StatCard | `light:stat-card-surface`, `GOLD_SURFACE`, `--stat-card-bg` |
| 12 | Stat card bg (L) | `themes.css` | 1245 / 1130 | `--stat-card-bg` | `--surface-stat` gold gradient (D `--bg-surface`) | Stat card surface | StatCard | StatCard, skeleton light override |
| 13 | Carved gold shadows | `themes.css` | 817, 824, 757 | `--stat-card-3d-shadow`, `--elevation-carved`, `--elevation-2` | Carved gold inset/offset | 3D material shadows | Surface | Card premium, StatCard, skeleton, Button secondary hover |
| 14 | Selection surface | `themes.css` | 753 region | `--selection-surface` | gold light | Navigation selected surface | Navigation | SelectionContainer |
| 15 | Primary button (L) | `themes.css` | 1099-1102, 798 | `--material-button-primary-surface/border/text`, `--gradient-header` | Dark-forest gradient + `--gold-400` border + `--brown-550` text | Primary button material | Control (Button) | ConfirmModal Confirm, EmptyState action, ErrorState Try Again |
| 16 | Secondary button (L) | `themes.css` | 1232-1237 | `--button-surface-secondary`, `--button-border-secondary`, `--button-shadow-secondary` | `#C9A070` + `#A87828` 1.8px + carved shadow | Secondary button material | Control (Button) | ConfirmModal Cancel |
| 17 | Checkbox border (L) | `themes.css` | 1239 / 965 | `--checkbox-border` | `--border-gold` `#A87828` (D `--border-subtle`) | Checkbox border | Control (Checkbox) | SelectionCheckbox |
| 18 | Input border | `themes.css` | 937 | `--input-border = --border-subtle` | gold-tint `rgba(168,120,22,.30)` | Search field border | Control (Input) | Search Input |
| 19 | Filter trigger | `CollectionFilter.tsx` (frozen 3.2.4) | — | `bg-card-bg border-border-subtle shadow-card-shadow hover:shadow-card-premium` | parchment + gold-tint + carved shadow | Filter control | Control (Filter) | Users status filter |
| 20 | Skeleton / EmptyState | `SharedComponents.tsx` | 14-53, 140 | `GOLD_SURFACE` = `stat-card-surface border border-border-gold` + `shadow-premium-card`/`shadow-premium-carved` | gold gradient + gold border + carved gold shadow | Loading + empty surfaces | Surface | GridSkeleton, EmptyState |
| 21 | Avatar light material | `AdminIconWrap.tsx` | 34 | `ancient-icon-badge` | gold/forest material | Avatar material | Icon/Display | Avatar (UserIdentity) |
| 22 | Ancient aliases (dark) | `themes.css` | 666-677 | `--ancient-*` | alias to semantic (compat) | Compatibility aliases | Theme/legacy | flagged consumers |
| 23 | Ancient aliases (light) | `themes.css` | 895-906 | `--ancient-*` | gold/cream/brown values | Compatibility aliases ("will be REMOVED" — `:688`) | Theme/legacy | flagged consumers |
| 24 | Tab light borders | `themes.css` | 1127 region | `--material-tab-*` (fallback `--border-gold`) | gold in L | Tab track/pill | Navigation | AdminSelectionTabs Tabs |

> **Dedup note:** entries 1–4 all resolve to the same amber family (cream/parchment). Entries 5–13 are
> the gold border/shadow/gradient family. Entries 15–17 are the amber button/checkbox material.
> Entries 22–23 are the legacy `--ancient-*` compatibility aliases (documented for removal post-migration).

---

## 3. What Is NOT Amber (verification)

| Component | Why it is correct | Owner |
|---|---|---|
| Alert (error) | Pure Status hues `bg-danger/10 text-danger border-danger/20` | Status |
| Status badge (Active/Banned) | Status tints, independent fills | Status |
| Row Buttons (Activate/Deactivate) | `bg-success`/`bg-danger` status-hued, transparent border | Status/Control |
| Focus ring / primary text | blue `--color-accent` primary, same in both themes | Control/Typography |
| Pagination | no surface | Foundation |
| Typography (AdminText/H1/Label) | `--text-*` tokens, theme-consistent | Typography |

---

## 4. Color Ownership (Brief Step 9)

Every visible color has **exactly one owner**. Map: **Color → Token → Owner → Consumers**.

| Color (L resolved) | Token | Owner | Consumers on Users page |
|---|---|---|---|
| `#E2CFA6` cream page | `--bg-app` | Theme | body canvas |
| `#C9A070` parchment surface | `--bg-surface` / `--card-bg` | Theme / Card | Card, toolbar, filter, modal, toast |
| `#FFF8E7` cream elevated | `--bg-elevated` | Theme | floating panels |
| `#A87828` gold border | `--border-gold` | Surface (legacy) | `--card-border`, `--material-card-premium-border`, `--checkbox-border`, `--button-border-secondary`, Tab tokens, `GOLD_SURFACE` |
| `rgba(168,120,22,.30)` gold-tint border | `--border-subtle` | Control/Surface | Input, Checkbox, Badge frame, divider, modal/toast borders |
| `#D4A55A→#BF8A30` gold gradient | `--surface-stat` / `--stat-card-bg` | StatCard | `light:stat-card-surface` overrides, `GOLD_SURFACE` |
| Carved gold shadows | `--elevation-carved`, `--stat-card-3d-shadow`, `--card-3d-shadow`, `--elevation-2` | Surface | Card light, Button secondary, skeleton, empty |
| Forest gradient + gold + brown | `--material-button-primary-*`, `--gradient-header`, `--gold-400`, `--brown-550` | Control (Button) | primary buttons (Confirm, Try Again) |
| Gold 1.8px + carved | `--button-*secondary*`, `--card-3d-shadow` | Control (Button) | secondary buttons (Cancel) |
| Gold/forest material | `ancient-icon-badge` | Icon/Display | Avatar |
| Status green | `--color-success` | Status | Badge success, Activate button, Alert |
| Status red | `--color-danger` | Status | Badge danger, Deactivate button, Alert |
| Status amber | `--color-warning` | Status | (not on page) |
| Status blue | `--color-info` | Status | (not on page) |
| Accent blue | `--color-accent` (`--primary`) | Theme | focus rings, primary text, link accents |
| Text neutrals | `--text-primary/secondary/muted/hint` | Typography | AdminText, labels |

**Ownership rules verified:**
1. Every token has exactly one owner (Theme / Surface / Control / Navigation / Status / Typography / Icon).
2. Consumers inherit; they never redefine color.
3. The only cross-family inheritance on the page is the **documented** Control→Surface amber path
   (Filter trigger, Button secondary) and Navigation→Surface path (SelectionContainer) — recorded in
   `FOUNDATION_VISUAL_FAMILIES.md` (M-1/M-2/M-6, X-2).
4. **Legacy ownership:** `--ancient-*` aliases (`themes.css:666-677`, `:895-906`) are compatibility
   aliases documented for removal after the token migration (`themes.css:687-689`).

---

## 5. Summary

- **Light mode = the amber language.** Cream page, parchment cards, gold borders/shadows/gradients,
  amber primary/secondary buttons. It is not a page defect; it is the certified-by-Standard premium
  family inherited through frozen Foundation + light tokens.
- **Dark mode = neutral.** All amber resolves to neutral slate/blue; nothing on this page is amber in dark.
- **Zero page-owned amber.** The page composes certified components; every amber cell is owned by a
  Foundation owner or the theme.
- **Ownership is clean.** One owner per color/token; consumers inherit. No raw hex in page code.
