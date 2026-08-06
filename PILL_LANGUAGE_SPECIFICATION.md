# Phase 5.4 — Pill, Badge & Selection Language Specification

**Status:** ⏳ AWAITING APPROVAL (design proposal — no implementation until approved)
**Date:** 2026-08-06
**Parent audit:** `VISUAL_LANGUAGE_AUDIT.md`

---

## 1. Purpose

Define the ONE pill/badge/selection language. All small capsule elements — Badge, selection pills
(Tabs active), segmented filters, icon badges, status chips, tag pills, rank badges — render with
one material grammar and the same state model. Source of truth: `AntigravityData.Badge` +
`Tabs` (pill), `IconBadge`, `PremiumIconContainer`, `AdminIconWrap`, `SelectionContainer`,
`SegmentedFilter`, `CollectionFilter`.

---

## 2. Pill grammar (material + state)

| Aspect | Certified recipe | Notes |
|---|---|---|
| Shape | `rounded-full` (pills) / `rounded-lg`–`rounded-xl` (icon badges) | pill = capsule |
| Micro-type | `--text-badge` (0.5625rem/9px, weight 700, tracking 0.05em, uppercase) or `text-[9px]/[10px]` bold uppercase | canonical micro-scale |
| Track (Tabs) | `--material-tab-track-surface` = `var(--bg-surface)`; `--material-tab-track-border` = `var(--border-subtle)`; `--material-tab-track-shadow` = `var(--elevation-2)` | neutral track (Phase 4.2) |
| Active pill (premium) | `--material-tab-pill-surface` = `var(--surface-tab-pill)` (gold gradient); `--material-tab-pill-border` = `var(--gold-300)`; `--material-tab-pill-shadow-light` (gold inner + neutral drop) | premium gold pill |
| **Active pill (management)** | `bg-[var(--management-accent)] text-white` (accent-bg + white text) | management-consistent selection (P-5) |
| Inactive tab text | `--material-tab-text-inactive` = `var(--text-secondary)` | |
| Tab hover text | `--material-tab-text-hover` = `var(--color-secondary-light)` | hover channel |
| **Inactive pill border** | `border border-border-subtle` (static, visible, semantic) + label `opacity-70 hover:opacity-100` | Part 6: inactive pills must feel selectable and not appear broken (see §2.1) |
| Selection surface | `--selection-bg` / `--selection-text` | text-selection (native) |
| Icon badge | `bg-X/10 text-X border border-X/20 rounded-lg` (per `IconBadge` STATUS_MATERIAL) | status-coded icon chip |
| Gold icon badge (light) | `ancient-icon-badge` (AdminIconWrap light); dark `bg-primary/10 text-primary` | premium/management split (frozen) |
| Premium icon container | `light:bg-[image:var(--gradient-header)] light:text-[var(--ancient-gold-bright)] light:shadow-premium-icon` | premium accent chip |
| Badge variants | `default\|success\|danger\|warning\|primary\|secondary` | `AntigravityData.Badge` |
| Pulse | `Badge … animate-pulse` (e.g. `SubjectCardItem` "Selected") | allowed |

### 2.1 Inactive-pill recipe (Part 6 — "selectable, modern, not broken")

Current drift: inactive pills across Tabs / `SelectionContainer` / `SegmentedFilter` /
`CollectionFilter` historically used **inconsistent or invisible borders** (borderless ghost pills,
`border-transparent`, bare text-only tabs), making the inactive state look broken or flat.

**The ONE inactive-pill recipe:**
```
border border-border-subtle            /* semantic, visible in both themes (light #E2E8F0 / dark #374151) */
text-text-secondary                    /* readable 7.6:1 light / 11:1 dark (T-2 safe on elevated) */
opacity-70 hover:opacity-100
hover:text-[var(--material-tab-text-hover)]  /* premium: gold-bright on hover */
transition-colors duration-200
```
Rules:
1. Inactive pills ALWAYS carry a visible semantic border (`--border-subtle`-class). No borderless
   inactive pills; no `border-transparent` for the resting state.
2. Text uses `--text-secondary` (meets AA on every surface in both themes).
3. Hover = text color shift to the tab-hover token (premium) or `--color-accent`/`--text-primary`
   (management) + label opacity 100%. Surface tint `hover:bg-white/5` (light premium) or
   `hover:bg-hover-bg/…` (neutral) optional, per family.
4. Focus: `focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1`
   (Tabs certified).
5. Segmented/collection filters reuse the same border + text rules so every pill family reads
   identically.

---

## 3. Badge variants (certified — AntigravityData.tsx)
| Variant | Material |
|---|---|
| default | neutral surface + border |
| primary | `bg-primary/10 text-primary border border-primary/20` (or certified equivalent) |
| secondary | muted surface + secondary text |
| success | `bg-success/10 text-success border border-success/20` |
| danger | `bg-danger/10 text-danger border border-danger/20` |
| warning | `bg-warning/10 text-warning border border-warning/30` |

All badges: `rounded-full`, `--text-badge` micro-type, size overridable via `className` (`!h-*`,
`!px-*`, `!text-[…]`) — size-only overrides permitted, material overrides prohibited.

---

## 4. Selection pill language (Tabs / SelectionContainer)

Certified composite (`AdminSelectionTabs`, mirroring User `TopicPortalView`/`SelectionView`):
- `SelectionContainer` (track) + `bare` `Tabs`.
- Active tab = gold premium pill (`--material-tab-pill-surface`), inactive = transparent on
  neutral track, hover = `--material-tab-text-hover`.
- Management selection (where used): active pill uses `--management-accent` background
  (`bg-[var(--management-accent)] text-white`) — the management-consistent alternative. Verify
  current Tabs `management` support; if absent, spec it (issue P-5).

---

## 5. Current pill/badge inventory

| Consumer | Pill/Badge | Status |
|---|---|---|
| `Badge` (AntigravityData) | all variants | ✅ Certified |
| `RankBadge` (admin leaderboard) | rank 1 gold / rank 2 slate / rank 3 orange → tokenized (Phase 3.1: `shadow-warning/30`, gold-300) | ✅ Certified |
| `QuestionsTableComponents.SubjectBadge` | replaced by `Badge variant="secondary"` (Phase 3.1) | ✅ Certified |
| `AdminTopicPreviewRenderer` tag pills | IMP/TIP/ALERT/KEY → `Badge` variants (Phase 3.1) | ✅ Certified |
| `QuestionForm` correct-answer pill | `bg-success/10 text-success border-success/20 rounded-full` + Telugu `warning` pill | ✅ Certified |
| `SubjectCardItem` "Selected" | `Badge variant="secondary"` + `animate-pulse` + size override | ✅ Certified |
| `TopicListItem` badges | `Badge variant="default"` + `!text-[9px] !py-0 !px-1.5` | ✅ Certified |
| `ParsedPreview` badges | `Badge variant="default"` + size overrides | ✅ Certified |
| `LeaderboardMobileCard` | `Badge variant="primary"` `!h-6 !px-2 !text-[9px]` | ✅ Certified |
| `UploadContextPanel` | `Badge variant="primary"` `text-[10px] py-0 px-2 opacity-80` | ✅ Certified |
| `IconBadge` | status icon chips | ✅ Certified |
| `AdminIconWrap` / `PremiumIconContainer` | icon containers | ✅ Certified (frozen split) |
| `SegmentedFilter` | segmented pills | ✅ Certified |
| `CollectionFilter` | filter pills (management) | ✅ Certified |

**Residue to unify:** none in admin (Phase 3.1 cleaned). Verify user-side pills
(`TopicCard` tags, `QuestionCard` tags, exam/leaderboard chips) — audit notes they use the same
`Badge`/token grammar; sweep in migration verification (P-6).

---

## 6. Pill/badge issue list (P-*)

| ID | Issue | Action |
|---|---|---|
| P-1 | Material overrides on Badge | Governance rule: size-only `!` overrides allowed; material overrides banned |
| P-2 | Raw manual pills (any `rounded-full` div with inline colors) | Sweep in migration; replace with `Badge`/tokens |
| P-3 | `RankBadge` non-primary ranks | Already tokenized; verify contrast (rank-3 orange on warning) |
| P-4 | Tag/chip color families (topics preview tag pills) | Already `Badge` variants; verify consistent mapping (IMP/TIP/ALERT/KEY ↔ primary/secondary/warning/danger) |
| P-5 | Tabs `management` pill variant | Confirm whether `Tabs` supports a management active-pill; if not, add spec'd management pill (accent-bg + white text) as a governance-design issue |
| P-6 | User-side pill sweep | Verify `TopicCard`/`QuestionCard`/exam chips use certified `Badge` grammar (verification step in migration plan) |

---

## 7. Frozen

- `AntigravityData.Badge` variants + pill geometry.
- `--material-tab-*` pill material (premium gold) and track.
- `SelectionContainer` + `bare Tabs` composite.
- `IconBadge` STATUS_MATERIAL, `PremiumIconContainer`, `AdminIconWrap` icon-badge split.
- `SegmentedFilter`, `CollectionFilter` (management filter pills).
