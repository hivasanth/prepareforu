# Phase 3.7 — Admin Users Visual Language Audit (Execution Plan)

**Status:** APPROVED (discovery/documentation only) — awaiting exit from plan mode to write deliverables.

## Locked scope
- **No code changes. No token changes. No component changes. No Foundation changes.**
- Do NOT modify Card, CollectionCard, Management Page Standard, or introduce a Management Surface Family.
- Target: `src/pages/admin/AdminUsers.tsx` + `src/components/admin/users/**` + every rendered Foundation component.
- Long-term direction (approved, NOT implemented here): one neutral **Management Surface Family** repo-wide; amber/parchment = legacy. Users first, then Questions, then Students/Exams/Sub Admins/Leaderboard/future pages.

## Deliverables (5 docs, all evidence-based, written to `docs/design-system/`)
1. `ADMIN_USERS_SURFACE_AUDIT.md` — complete surface inventory (per surface: Component/Owner/Background/Border/Shadow/Radius/Hover/Elevation/Motion/Tokens, light+dark), page render tree, surface-ownership summary. Core fact: light-mode surfaces all resolve to parchment `#C9A070` / gold `#A87828` / carved-gold shadows via frozen Foundation + theme tokens; dark is neutral.
2. `ADMIN_USERS_COLOR_AUDIT.md` — Step 2 amber/parchment usage ledger (every `bg-card-bg` / `--bg-surface` / `--border-gold` / `ancient-*` / gold shadow / warm gradient consumer with File/Line/Component/Token/Purpose/Owner/Consumer) + Step 9 Color→Token→Owner→Consumers ownership map (every visible color has exactly one owner).
3. `ADMIN_USERS_VISUAL_AUDIT.md` — Steps 3–8 family classification (Management/Control/Navigation/Status/Typography/Overlay/Legacy Ancient/Exam/Neutral), CollectionCard audit (current `premium→premium-dark-neutral`, amber in light; no neutral variant; document Current→Future→Risk, do NOT create), Card variant audit (no variant neutral in light; `premium-neutral`/`premium-dark-neutral` identical — L-4/D-122), Toolbar/Button/Badge audits, Step 10 scoring → Critical/High/Medium/Low.
4. `ADMIN_USERS_MANAGEMENT_SURFACE_PROPOSAL.md` — Step 10 proposal (no implementation): illustrative neutral `--management-*` token namespace, additive freeze-safe Card `management` variant, CollectionCard mapping, button/badge neutral guidance, Management Page Standard rule-12 amendment path, one-management-language rule.
5. `ADMIN_USERS_VISUAL_MIGRATION_PLAN.md` — Step 11 phased roadmap: P0 amber inventory → P1 Foundation proposal → P2 additive component evolution → P3 Users migration (validation page) → P4 Questions + remaining pages → repository certification.

## Governance record (documentation only)
- New `D-140` entry in `docs/design-system/DESIGN_DECISION_LOG.md`: Phase 3.7 = audit-only; Management Surface Family direction approved as future target; no implementation this phase.
- Note in execution log (Phase 3.7 section).

## Key verified evidence (gathered, ready for docs)
- `themes.css`: `--bg-app` L `#E2CFA6` (:692) / D `#111827` (:417); `--bg-surface` L `#C9A070` (:693) / D `#1F2937` (:418); `--bg-elevated` L `#FFF8E7` (:694); `--border-subtle` L `rgba(168,120,22,.30)` (:724) / D `#374151` (:448); `--border-gold` `#A87828` (:805); `--surface-stat` gold gradient (:806); `--card-bg=--bg-surface` (:928); `--card-border` L `--border-gold` (:1224); `--material-card-premium-border` L `--border-gold` (:1229); `--material-button-primary-surface/border/text` forest+gold+brown (:1099-1102); `--button-surface-secondary` L `#C9A070` (:1232), border L `--border-gold` 1.8px (:1234-35), shadow `--card-3d-shadow` (:1236); `--checkbox-border` L `--border-gold` (:1239); `--stat-card-bg` L `--surface-stat` (:1245); carved shadows `--elevation-2` (:757), `--stat-card-3d-shadow` (:817), `--elevation-carved` (:824); ancient compat aliases (:666-677 dark, :895-906 light, "will be REMOVED" note :688).
- `AntigravityCard.tsx`: `PREMIUM_SURFACE` (:20-21), `PREMIUM_LIGHT_OVERRIDES` (:25), `default` (:30), `premium-neutral`/`premium-dark-neutral` identical (:33-34), `GOLD_SURFACE` (:26).
- `CollectionCard.tsx`: `premium→premium-dark-neutral` (:64).
- `UsersTable.tsx`: `variant="premium"` (:68), exam Badge default (:79), status Badge success/danger (:97-103), Button success/danger (:106-114), 3.6D fixed columns (:14-19).
- `UsersActions.tsx`: Input + CollectionFilter inside CollectionToolbar.
- `AdminUsers.tsx`: selection tabs, Alert error, UsersActions, UsersTable, ConfirmModal (Cancel=secondary amber, Confirm=primary/danger amber), EmptyState gold, ToastContainer.
- `SharedComponents.tsx`: LoadingSkeleton/GridSkeleton `GOLD_SURFACE`+`shadow-premium-carved` (:14-53), EmptyState `GOLD_SURFACE` (:140), ConfirmModal→AdminModal (:170-225).
- `AdminSelectionTabs.tsx`: SelectionContainer + Tabs (primary/secondary) + `bg-border-subtle` divider (:284, :391).
- `AntigravityButton.tsx`: primary light forest+gold+brown (:37-42), secondary light parchment+gold (:43-46), success/danger status-hued (:47-50, :76-79).
- `AdminIconWrap.tsx`:34 `ancient-icon-badge` light material (Avatar).
- Corrected finding: Users rows are parchment/gold, NOT dark forest (forest only on raw `Card variant="premium"` Exam-family consumers).
- Verified: page owns zero surface/color classes; all amber arrives transitively via frozen Foundation + light tokens.

## Verification after writing
- `git diff --stat` → only `docs/` files changed; zero `src/` changes.
- Stop at approval gate and present: amber usage report, surface ownership report, color ownership report, Management Surface proposal, migration roadmap.
