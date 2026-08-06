# Phase 3.4 P2 — Foundation Completion — Implementation Report

**Status:** ✅ IMPLEMENTED (2026-08-02)
**Directive:** P2 plan approved as **Option 2 — render-neutral work only**. Approved scope:
(1) token completion — architecture only, computed values unchanged; (2) dead code removal —
only after verifying zero consumers; (3) duplicate consolidation — behavior identical;
(4) foundation cleanup (duplicate ownership/mappings/constants); (5) documentation.
All **render-affecting (⛔) items are deferred** and require per-item approval + a
`DESIGN_DECISION_LOG.md` entry before code.
**Decision:** D-126 (P2 render-neutral completion; ⛔ items deferred)
**Method:** render-neutral by construction — no computed value changed, no consumer migration
(that is Phase 3.5), zero page-level work beyond dead-class removal.

---

## 1. Objective

Resolve the render-neutral portion of the six P2 audits
(`docs/design-system/FOUNDATION_{NAVIGATION,STATUS,TYPOGRAPHY,MOTION,OVERLAY,CROSS_FAMILY}_AUDIT.md`)
for the approved scope. Specifically:

- **Token completion** (architecture only): complete the Navigation alias block and add the
  Overlay `--z-*` layer scale without changing any computed value.
- **Dead code removal** (after zero-consumer verification): dead `dark:`-prefixed classes
  (D-123), dead `animate-in <companion>` animation classes, `animate-pulse-slow`,
  `selection-container-dark` classes + orphaned rule, unused `spacing` export.
- **Duplicate consolidation** (behavior identical): shared `TAB_SPRING` motion preset.
- **Foundation cleanup**: remove the duplicate light `--surface-nav`; move `.light .ancient-card`
  raw amber hex → `--card-parchment`/`--border-gold` tokens (amber backlog P-2).
- **Documentation**: every completed cleanup logged here, in the decision log (D-126),
  freeze register, and execution log.

---

## 2. Changes implemented

### 2.1 A1 — Navigation token completion (render-neutral)

`src/styles/themes.css` — alias block after `--nav-border` (`:646-649`):

```css
--nav-hover:  var(--nav-bg-hover);
--nav-active: var(--nav-bg-active);
--nav-shadow: var(--elevation-1);
--nav-focus:  var(--shadow-focus);
```

All four resolve to the exact certified values already consumed elsewhere; they are aliases
only, no computed value changes.

**Duplicate `--surface-nav` removed:** the `.light`-scoped redefinition (was `themes.css:814`)
is deleted with a rationale comment; the single `:root` `--surface-nav: var(--bg-nav)`
definition remains. Grep confirms exactly **1** definition. Render-neutral: the light value
chain is unchanged (`--surface-nav` → `--bg-nav` → `--bg-surface`).

### 2.2 O-2/O-3 — Overlay layer scale (render-neutral)

`src/styles/themes.css` (`:656-661`):

```css
--z-canvas:  0;
--z-content: 10;
--z-sticky:  30;
--z-drawer:  70;
--z-modal:   100;
--z-toast:   99999;
```

Values reproduce the certified stack. `--z-dropdown` is **intentionally NOT duplicated** — the
existing `--dropdown-z` token already serves the dropdown layer (documented in `themes.css`).
No overlay component was migrated (O-4/O-1 remain deferred) — the scale is now the single
source for future consumption.

### 2.3 F P-2 — `.light .ancient-card` amber → tokens (render-neutral)

`src/index.css` — the `.light .ancient-card` rule now uses
`background: var(--card-parchment); border: 1.8px solid var(--border-gold);`, replacing the
raw hex `#C9A070` (background) and `#A87828` (border). `--card-parchment` (`themes.css:807`)
embeds the same `#C9A070` gradient and `--border-gold` is the same `#A87828`, so the computed
render is byte-identical. Removes the final raw-amber hex from `index.css`.

### 2.4 D-125 / N-4 — `selection-container-dark` dead code removed

Removed the dead `light:selection-container-dark` class (not a registered utility; `light:`
generates no CSS — D-125) from all three sites:
- `AntigravityLayout.tsx:64` — `SelectionContainer` (N-4/M-6).
- `ThemeToggle.tsx` — theme toggle surface.
- `AntigravityButton.tsx` — `IconButton` theme variant (2 spots: theme light + dark branch).

Removed the orphaned `.light .selection-container-dark` block from `index.css` (was `:276-282`)
and replaced it with an explanatory comment. Grep confirms **0** references. Zero consumers →
safe dead-code removal per approved scope item 2.

### 2.5 S-4 / D-123 — dead `dark:` classes stripped (Status + palette)

App theme is the sole source of truth (D-123); `dark:` utilities resolve to the OS media query
and are dead/inconsistent in React branches. Stripped (no consumer → safe):
- `TagBadge.tsx` — `dark:text-*` from all 4 TAG_STYLES + the default sky style.
- `ExamSubComponents.tsx:24` — `dark:text-text-muted` (S-4).
- `paletteColors.ts` — `dark:text-[#94A3B8] dark:border-[#64748B]` in both exported functions.

Grep confirms **0** `dark:`-prefixed utilities across `src/**/*.{tsx,ts,css}`. Render-neutral:
the classes never applied under the app-theme architecture.

### 2.6 M-1/M-5 — dead animation classes removed

The `.animate-in fade-in slide-in-from-*` pattern resolves to nothing — `fade-in`,
`slide-in-from-*`, `zoom-in-*`, `shake` are not registered utilities (no `tailwindcss-animate`
dependency) and `tailwindcss-animate` does not ship the Tailwind v4 default variant. Normalized
**23 sites** `animate-in <dead classes>` → `animate-in`:

| Site | Site |
|---|---|
| `BulkActionBar` | `PerformanceAnalyticsSection` |
| `DailyAttemptsChart` | `PerformanceSkeleton` |
| `AIToolCards` | `TestConfigView` |
| `InstructionsTab` | `AdminLeaderboard` |
| `JsonTab` (×2) | `AccountDisabledPage` (×2) |
| `PreviewTab` | `QuestionsTable` |
| `QuestionForm` (×3) | `AdminModal` (×2) |
| `DiagramRenderer` (×2) | `QuestionVisualizer` |
| `LeaderboardSkeleton` | |

Removed dead `animate-pulse-slow` (`DiagramRenderer.tsx:351`). Grep confirms **0** `animate-in`
+ companion combos and **0** `animate-pulse-slow`. No composed entrance animation appeared
(M-1 ⛔ risk does not apply — the classes never compiled to CSS).

### 2.7 M-3 — shared `TAB_SPRING` preset (duplicate consolidation)

`AntigravityAnimation.tsx:10`:

```ts
export const TAB_SPRING = { type: 'spring', stiffness: 260, damping: 32, mass: 1.1 } as const
```

Three consumers now import it (behavior identical — same constants, previously duplicated
inline): `AntigravityData.tsx:106` (Tabs pill), `SegmentedFilter.tsx:95`, `ThemeToggle.tsx:54`.

### 2.8 T-4 — unused `spacing` export removed

`AntigravityTypography.tsx` — removed the unused `spacing` export (grep: zero importers).
No render impact; `letterSpacing` entries remain untouched.

### 2.9 Documentation

`README.md` in `leaderboard/` and `performance/` updated `animate-in fade-in` → `animate-in`
to match the code.

---

## 3. Files changed

| File | Change |
|---|---|
| `src/styles/themes.css` | A1 nav tokens (`:646-649`); O-2 layer scale (`:656-661`); duplicate light `--surface-nav` removed |
| `src/index.css` | `.light .ancient-card` → tokens; dead `.light .selection-container-dark` block removed |
| `src/components/common/AntigravityLayout.tsx` | removed `light:selection-container-dark` (`SelectionContainer`) |
| `src/components/common/AntigravityButton.tsx` | removed `light:selection-container-dark` (theme variant, 2 spots) |
| `src/components/common/ThemeToggle.tsx` | removed dead class; `TAB_SPRING` |
| `src/components/common/AntigravityData.tsx` | Tabs `transition={TAB_SPRING}` |
| `src/components/common/SegmentedFilter.tsx` | `transition={TAB_SPRING}` |
| `src/components/common/AntigravityAnimation.tsx` | `TAB_SPRING` preset (M-3) |
| `src/components/common/AntigravityTypography.tsx` | removed unused `spacing` export (T-4) |
| `src/components/user/TagBadge.tsx` | stripped `dark:text-*` (S-1 dead-code part) |
| `src/components/sub-admin/exams/ExamSubComponents.tsx` | stripped `dark:text-text-muted` (S-4) |
| `src/utils/paletteColors.ts` | stripped `dark:text-*/dark:border-*` (both fns) |
| `src/components/admin/common/BulkActionBar.tsx` | dead animation classes |
| `src/components/admin/overview/DailyAttemptsChart.tsx` | dead animation classes |
| `src/components/admin/questions/AIToolCards.tsx`, `InstructionsTab.tsx`, `JsonTab.tsx`, `PreviewTab.tsx`, `QuestionForm.tsx`, `QuestionsTable.tsx` | dead animation classes |
| `src/components/common/AdminModal.tsx`, `DiagramRenderer.tsx` (×2 + `animate-pulse-slow`), `QuestionVisualizer.tsx` | dead animation classes |
| `src/components/user/leaderboard/LeaderboardSkeleton.tsx` | dead animation classes |
| `src/components/user/performance/PerformanceAnalyticsSection.tsx`, `PerformanceSkeleton.tsx` | dead animation classes |
| `src/components/user/TestConfigView.tsx` | dead animation classes |
| `src/pages/admin/AdminLeaderboard.tsx` | dead animation classes |
| `src/pages/AccountDisabledPage.tsx` | dead animation classes (×2) |
| `src/components/user/leaderboard/README.md`, `src/components/user/performance/README.md` | `animate-in fade-in` → `animate-in` |

No page-level behavior changes; no consumer migrations (Phase 3.5).

---

## 4. Verification

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 — only pre-existing chunk-size notices |
| `npm run lint` | ⚠️ 405 pre-existing problems (352 errors / 53 warnings) — **zero P2-introduced** (§4.1) |
| `--surface-nav` definitions | ✅ exactly 1 (`themes.css`) |
| `dark:`-prefixed utilities in `src` | ✅ 0 |
| `selection-container-dark` | ✅ 0 references (components + CSS) |
| `animate-pulse-slow` | ✅ 0 |
| `animate-in` + dead companion | ✅ 0 combos |
| `TAB_SPRING` | ✅ 1 definition + 3 consumers |
| `#C9A070` / `#A87828` in `src/index.css` + components | ✅ 0 (remaining matches are token definitions in `themes.css` and a data-viz palette array, both documented) |
| `spacing` importers | ✅ 0 |

### 4.1 Lint baseline (pre-existing, not P2)

Identical to the certified P1 baseline: **405 problems (352 errors / 53 warnings)** in
untouched files (`src/utils/*`, `src/observability/*`, `src/pages/*`, `supabase/functions/*`).
No P2-touched region introduced a new lint error.

---

## 5. Render-preservation notes

### 5.1 Render-neutral (verified at token/class level)

- **2.1** — nav tokens are aliases to existing values; `--surface-nav` value chain unchanged.
- **2.2** — `--z-*` values reproduce the certified stack; no component migrated.
- **2.3** — `--card-parchment` embeds the same `#C9A070` gradient; `--border-gold` = same
  `#A87828`.
- **2.4 / 2.5** — removed classes never compiled to CSS (unregistered utility / `light:` with
  no matching rule / `dark:` OS-gated in an app-theme architecture). Dead by construction.
- **2.6** — companion classes resolved to nothing; only `animate-in` remained active, now kept.
- **2.7** — same constants, single source.
- **2.8** — zero importers.

### 5.2 Accepted visual deltas

**None.** Unlike P1, this wave shipped **zero** intentional visual deltas — every change is
render-identical in both themes.

---

## 6. Amber audit

- `.light .ancient-card` raw hex removed — the last raw-amber usage in `index.css` is gone.
- Remaining `#C9A070`/`#A87828` occurrences are all token **definitions** (`themes.css`:
  `--brown-*`, `--bg-surface`, `--border-gold`, `--card-parchment`, `--scrollbar-thumb-hover`,
  `--border-input`, role-token comments) and the `SubjectPieChart` data-viz palette array —
  none are component surfaces.
- Light Control role tokens referencing amber (D-124 §scheduled) remain **untouched** —
  changing them is a render change requiring new design approval (still deferred, as in P1).

---

## 7. Performance / safety

All changes are class-string edits, token additions, constant extraction, or deletions of
dead code. No hook/logic changes; no per-render computation added.

---

## 8. Deferred (render-affecting ⛔ — require per-item approval)

Not implemented this wave, per the Option 2 approval. Each requires its own review +
`DESIGN_DECISION_LOG.md` entry before code.

| Item | Audit | Nature |
|---|---|---|
| N-2 `.light aside … !important` retirement + `ancient-sidebar` single-sourcing | Navigation A3 | light sidebar/nav-item renders |
| N-9 amber nav-surface decouple (`--bg-nav` off `--bg-surface`) | Navigation A2 | light sidebar colour |
| SelectionContainer `--nav-selection-surface`/`--nav-selection-shadow` | Navigation A2 / X-2 | dark shadow render |
| S-1 `TagBadge` → thin mapper over `Badge` (status tokens) | Status | tag chip colours |
| S-3 Status surface recipe unify (`Badge` /15→/10) | Status / X-6 | surface alpha |
| T-1 `--brand-text-gradient` token for `BrandTitle` | Typography H-1 | gradient source |
| T-2 raw size → semantic roles (~102 sites) | Typography | per-site pixel risk |
| T-3/D-2 single Typography composite | Typography | consolidation |
| M-2 IconButton `whileTap` + 0.2s transition | Motion | press feedback |
| O-1/X-3/D-4 AdminModal/SuccessModal recipe unify | Overlay | modal surface/radius/animation |
| O-4/D-5 `PremiumSelect` → `Menu` + shared `Tooltip` | Overlay | overlay components |
| A3 `Navigation` + `SidebarLayout` shell merge | Navigation D-1 | composite |

---

## 9. Remaining (documented, non-blocking)

| Item | Where | Disposition |
|---|---|---|
| O-3 `Menu` default `'z-50'` literal | `Menu.tsx:275` | consume `--z-*` in a future overlay wave (O-2 scale ready) |
| `--dropdown-z` vs `--z-dropdown` | `themes.css` | single token intentionally kept (`--dropdown-z`); documented |
| `SubjectPieChart` data-viz palette | `SubjectPieChart.tsx:4` | data colors, not a surface; out of Foundation scope |
| Browser pixel spot-check | — | manual step (CLI cannot render); recommended `npm run dev` light+dark pass (§10) |

---

## 10. Manual visual spot-check (recommended post-certification)

Render-neutrality was verified at the token/class level (§5.1). A browser light + dark pass is
the recommended final manual check — surfaces should be **pixel-identical to the P1-certified**
renders (there are no accepted deltas this wave):
`SelectionContainer`, `ThemeToggle`, `IconButton` theme, `Tabs` pill, `TagBadge`,
`QuestionsTable`, `AdminModal`, toasts, skeletons, `AccountDisabledPage`, `.ancient-card`
cards, and the admin analytics dashboard (chart entrances).

---

## 11. Governance

- **D-126** — P2 render-neutral completion logged; all ⛔ items formally deferred to per-item
  approval.
- **D-123** — dead `dark:` classes removed, never to be reintroduced.
- **D-125** — `selection-container-dark` code fully removed (legacy documented in D-125);
  Navigation-family token wave still owns any future `SelectionContainer` refinement.
- **D-124** — amber policy upheld: raw amber hex removed from `index.css`; light Control role
  tokens still scheduled for migration (unchanged from P1).
- Audit + plan inputs: `docs/design-system/FOUNDATION_{NAVIGATION,STATUS,TYPOGRAPHY,MOTION,
  OVERLAY,CROSS_FAMILY}_AUDIT.md` / `PHASE_3_4_P2_IMPLEMENTATION_PLAN.md`.

---

## 12. Verdict

**Phase 3.4 P2 (render-neutral portion) = ✅ IMPLEMENTED.** All five approved scope items are
complete with **zero accepted visual deltas**: token completion (nav aliases, `--z-*` scale,
`--surface-nav` dedup), dead-code removal (23 animation sites + `animate-pulse-slow` +
`dark:` classes + `selection-container-dark` + `spacing` export — all verified zero-consumer),
duplicate consolidation (`TAB_SPRING`), foundation cleanup (ancient-card amber → tokens),
and documentation. `tsc` + `vite build` green; lint baseline confirmed unchanged (405 problems,
zero P2-introduced); repo-wide audit clean. All render-affecting ⛔ items remain deferred and
require per-item approval before implementation. Phase 3.5 (consumer migration) may begin on
approval of the certification.
