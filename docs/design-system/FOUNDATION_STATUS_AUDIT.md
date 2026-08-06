# Foundation Status Audit

**Phase 3.4 P2 — Wave 2 (Status Family)**
**Date:** 2026-08-02
**Scope:** Reusable status surface language: `Alert`, `Badge`, `DifficultyBadge`,
`IconBadge`, `Toast`, notification/result status materials, and all semantic status
tokens (`--success`, `--danger`, `--warning`, `--info` + `--color-*` mappings).
Cross-checked against `FOUNDATION_TOKEN_OWNERSHIP.md` (Status owns semantic status
tokens) and D-123 (app theme is the only source of truth — no `dark:` prefixes).
**Rule:** previously certified visual behaviour remains unchanged unless the change
is required by architectural ownership, explicitly approved, and logged in
`DESIGN_DECISION_LOG.md`.

---

## 1. Audit Method

1. Read every Status-family component: `Alert.tsx`, `Badge` (`AntigravityData.tsx`),
   `IconBadge.tsx`, `DifficultyBadge.tsx`, toast rendering (`useToast.tsx`),
   `NotificationPanel.tsx` (type colours), `AntigravityResults.tsx`
   (`ResultStatCard` colours), `ErrorContainer.tsx` (severity mapping).
2. Verified all status materials use semantic tokens (`--success`/`--danger`/
   `--warning`/`--info`/`--primary`) and no raw palette classes (`amber-500`,
   `rose-500`, etc.) or `dark:` prefixes.
3. Audited token ownership: Status owns the semantic status set; verified no
   other family re-implements status materials.

## 2. Status Token Inventory

- `--success: #22C55E` (`index.css:331`), `--danger: #F87171` (`:332`),
  `--info: #3B82F6` (`:334`); `@theme` mappings `--color-success/danger/info`
  (`index.css:44-47`).
- `--warning` dark `#FBBF24` (`themes.css:472`), light `#D97706` (`:717`);
  `--color-warning-hover`/`-subtle` (473-474), `--color-info-subtle` (479/724).
- **Anomaly:** `--color-info` is overridden to green `#166534` in light
  (`themes.css:723`) while dark info is blue `#3B82F6` (`:478`). `Alert`'s info
  variant never reads it (uses `--primary`), so the light-green info override is
  currently dead weight and a trap for future consumers. See **S-5**.

## 3. Findings

### 3.1 HIGH

#### S-1 — `TagBadge` re-implements badge material with raw palette + `dark:` (D-123 violation)
- Evidence: `src/components/user/TagBadge.tsx:8-11,16` — `bg-amber-500/15 text-amber-700
  dark:text-amber-400 border-amber-500/30` (IMP), `emerald` (TIP), `rose` (ALERT),
  `purple` (KEY), `sky` (default).
- Impacts: (a) raw Tailwind palette classes instead of semantic status tokens;
  (b) `dark:text-*` is gated on the OS `prefers-color-scheme` — with no
  `@custom-variant dark` and `ThemeContext` toggling only `.light`, these classes
  are dead in app-dark and can mismatch app-light; (c) it is a parallel badge
  implementation to `Badge` (`AntigravityData.tsx:182-189`).
- Fix direction (Wave 2): re-map onto `Badge`/status tokens; TagBadge becomes a thin
  tag→variant mapper (mirroring `DifficultyBadge`).
- Status: **approval-gated** (changes certified renders of tag chips).

#### S-2 — Toast collapses `warning` into danger styling
- Evidence: `useToast.tsx:52` — `t.type === 'success' ? 'border-success' : 'border-danger'`
  and `:55-56` success → `CheckCircle2 text-success` else `XCircle text-danger`.
  The `'warning'` type (declared at `:7`) renders with danger border + X icon.
- Fix direction (Wave 2): `type → {border, icon, iconColor}` map. Render-neutral for
  the only certified branches (success/error).
- Status: plan (warning path is unreachable today — `showToast` call sites pass
  success/error; verify before changing).

### 3.2 MEDIUM

#### S-3 — Two alpha conventions for status surface material
- `Badge`: `bg-X/15 … border-X/30` (`AntigravityData.tsx:184-188`).
- `Alert` + `IconBadge`: `bg-X/10 … border-X/20` / `bg-X/10 text-X`
  (`Alert.tsx:15-18`, `IconBadge.tsx:31-37`).
- Impact: inconsistent additive surface recipe across the Status family.
- Fix direction (Wave 2): single recipe (`bg-X/10 text-X border-X/20` or a shared
  `--status-*` material token); value change on `Badge` is render-affecting →
  **approval-gated**.

#### S-4 — Remaining `dark:` prefix in reusable-code path (dead class)
- `ExamSubComponents.tsx:24`: `rank === 2 ? 'bg-slate-400/20 text-[var(--text-muted)] dark:text-text-muted'`.
  `dark:` is a no-op under D-123. Strip the prefix (render-neutral).
- Status: plan.

### 3.3 LOW

#### S-5 — `--color-info` light-green override is dead and misleading
- `themes.css:723` (`--color-info: #166534` in light) is never consumed (Alert info
  uses `--primary`). Either re-map light info to blue for true semantic parity or
  document the override. Status: plan (render-neutral — no consumer).

#### S-6 — `ErrorContainer` severity mapping is behaviour-parity, not duplication
- `ErrorContainer.tsx:27-38` maps severity → `IconBadge` status (DS-004) and renders
  identically across variants today. Not a defect; keep as single source for
  error-page status material. Status: note only.

## 4. Amber Verification (Status family)
- No `#C9A070` usage in Status components or tokens. ✅ Clean.

## 5. Wave 2 Close-out Checklist
- [ ] S-1: `TagBadge` → Badge/status-token mapper; `dark:` prefixes removed.
- [ ] S-2: Toast type→material map (success/error certified, warning repaired).
- [ ] S-3: single status surface recipe (approval-gated).
- [ ] S-4: dead `dark:` class stripped.
- [ ] S-5: `--color-info` light value reconciled or documented.
- [ ] Repo-wide re-check: no other component implements a status chip/badge material.
