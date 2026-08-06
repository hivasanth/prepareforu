# Phase 3.1 · Module 2 (Admin) — Visual Migration Plan + Inventory

**Module:** Admin (second consumer of the User Panel / Authentication visual language)
**Status:** ✅ **EXECUTED** — inventory approved 2026-08-02, migration complete
**Audit date:** 2026-08-02

This document is the **Admin Visual Inventory** required by the workflow gate. It is written
*before* any code change. No migration work begins until this inventory is approved.

> **Execution update (see §8):** The inventory was approved and the migration ran
> Priority 1 → 4. Before/after comparison and certification are in
> `docs/certification/PHASE_3_1_ADMIN_VISUAL_COMPARISON.md` and
> `docs/certification/PHASE_3_1_ADMIN_CERTIFICATION.md`.

---

## 0. Scope

| # | Surface | File |
|---|---|---|
| 1 | Admin Overview | `src/pages/admin/AdminOverview.tsx` |
| 2 | Admin Questions | `src/pages/admin/AdminQuestions.tsx` |
| 3 | Admin Users | `src/pages/admin/AdminUsers.tsx` |
| 4 | Admin Settings | `src/pages/admin/AdminSettings.tsx` |
| 5 | Admin Leaderboard | `src/pages/admin/AdminLeaderboard.tsx` |
| 6 | Admin Upload | `src/pages/admin/AdminUpload.tsx` |
| 7 | Admin Topics | `src/pages/admin/AdminTopics.tsx` |
| 8 | Admin Sub-Admins | `src/pages/admin/AdminSubAdmins.tsx` |

Plus all reusable components under `src/components/admin/` consumed by the above.

**Excluded (frozen):** Foundation, design tokens, validation system, accessibility foundation,
business logic, routing, permissions. This is a **visual-only** standardization.

---

## 1. Certified visual target (definition of done)

The Admin module must match the **User Panel AND Authentication** language:
- Certified primitives only: `PageContainer`, `Stack`, `Grid`, `SectionReveal`, `Card` (variants),
  `H1`/`H3`, `Badge` (`default|success|danger|warning|primary|secondary`), `Button`/`IconButton`
  (`primary|secondary|danger|ghost|soft|success`), `Input`/`TextArea`/`RadioGroup`/`Tabs`/
  `FilterSelect`/`SelectionContainer`, `Spinner`, `Pagination`, `DataGrid`, `Alert`, `ConfirmModal`,
  `AdminModal`, `PageHeader`, `EmptyState`/`ErrorState`, `LoadingOverlay`, `ToastContainer`.
- Tokens only (`text-primary`, `text-success`, `text-warning`, `text-danger`, `text-secondary`,
  `bg-hover-bg`, `border-border-subtle`, etc.) — **no palette colors** (`green-500`, `red-600`,
  `amber-400`, `teal-500`, `orange-500`, `slate-900`, …) except the certified chart-specific
  exemption (Recharts palette) established in Module 1.
- Same micro-typography scale (`text-[7px]`–`[13px]`) and radii (`rounded-2xl/3xl/40px`) the
  User Panel itself uses.

---

## 2. Admin Visual Inventory (per page)

### 2.1 `AdminOverview.tsx` — ✅ CERTIFIED
| Item | Value |
|---|---|
| Certified components | `PageContainer`, `H1` (sr-only), `Stack`, `SectionReveal`, `Card variant="default"`, `AdminSelectionTabs`, `StatsGrid`, lazy `DailyAttemptsChart` |
| Manual styling | none at page level |
| Hardcoded colors | 0 |
| Duplicate components | 0 |
| Verdict | Certified; no migration needed at page level |

### 2.2 `AdminQuestions.tsx` → `components/admin/questions/*` — ⚠️ PARTIAL
| Item | Value |
|---|---|
| Certified components | `DataGrid`+`Pagination` (`QuestionsTable`), `Card`, `Badge`, `Button`, `IconButton`, `ConfirmModal`, `AdminModal`, `EmptyState`/`ErrorState`, `ToastContainer`, `Tabs` |
| Manual styling | `QuestionsTableComponents.tsx:39` `SubjectBadge` (`px-3 py-1 rounded-full` manual pill — duplicates certified `Badge`) |
| Hardcoded colors | `QuestionForm.tsx` green (`green-500` ×12 lines 146–364 — correct-answer state) + amber (`amber-400` ×11 — Telugu section); `QuestionsTable.tsx:177` `text-red-500` (delete hover) |
| Duplicate components | `SubjectBadge` (manual pill vs `Badge`) |
| Verdict | Certified skeleton; color + raw-button remediation needed |

### 2.3 `AdminUpload.tsx` → `components/admin/questions/*` (Json/Preview/Instructions) — ⚠️ PARTIAL
| Item | Value |
|---|---|
| Certified components | `Button`, `TextArea`, `IconButton`, `Card variant="premium-neutral"`, `Badge` |
| Manual styling | `JsonTab` validation panel (`bg-red-500/10 … rounded-2xl`); `InstructionsTab` `text-green-500` icon + `bg-primary/5 … rounded-3xl` wrapper; `PreviewTab` `bg-amber-500/5` alert + stat cards `bg-hover-bg/20 … rounded-2xl` |
| Hardcoded colors | `JsonTab.tsx:32,33,39,40,46` red; `PreviewTab.tsx:31,32,34` amber; `InstructionsTab.tsx:52` green |
| Raw `<button>` | `JsonTab.tsx:44` "Skip Row" |
| Verdict | Certified skeleton; migrate red/amber/green to `danger`/`warning`/`success` tokens + `Alert`/`Badge` |

### 2.4 `AdminTopics.tsx` → `components/admin/topics/*` — ⚠️ PARTIAL
| Item | Value |
|---|---|
| Certified components | `Badge`, `Input`/`TextArea`, `Stack`, `Alert` |
| Manual styling | `AdminTopicPreviewRenderer.tsx` tag pills (`bg-amber-500/10`…`bg-sky-500/10` lines 210–214); `TopicListItem` manual row + action icon buttons |
| Hardcoded colors | `TopicListItem.tsx:101` `text-teal-500`; `AdminTopicPreviewRenderer.tsx:45` `bg-red-600` (YouTube link); amber/emerald/rose/purple/sky tag pills (lines 210–214) |
| Raw `<button>` | `AdminTopicPreviewRenderer.tsx:25` (language toggle), `TopicListItem.tsx:73,81,89,98,106,113` (6 action buttons) |
| Duplicate components | action icon buttons vs `IconButton`; tag pills vs `Badge` |
| Verdict | Migrate raw buttons → `IconButton`/`Button`; tag pills → `Badge` variants; `text-teal-500` → `text-primary`; `bg-red-600` → `danger`-token link |

### 2.5 `AdminLeaderboard.tsx` → `components/admin/leaderboard/*` — ❌ DIVERGENT (largest cluster)
| Item | Value |
|---|---|
| Certified components | `Card`, `Button`, `Spinner` |
| Manual styling | `LeaderboardView.tsx` raw `<table>/<thead>/<th>/<tbody>/<td>` (lines 68–120+), top-3 manual `rounded-[32px]` wrapper, manual `rounded-[40px]` table wrapper, `shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]` |
| Hardcoded colors | `RankBadge.tsx:7,9,11` (`rgba(245,158,11,0.3)` gold glow, `bg-slate-300/20`, `border-slate-300/30`, `text-orange-500`, `bg-orange-400/10`) |
| Duplicate components | `RankBadge` rank pill vs `Badge variant="primary"`/`secondary` |
| Parity question | User Panel `LeaderboardTable.tsx` ALSO wraps raw `<table>` inside certified `Card` (`p-0 border-none`) with token-colored `<th>` micro-type. → **Precedent: raw `<table>` inside certified `Card` is the User Panel's own certified pattern.** |
| Verdict | Standardize wrapper to certified `Card` (`p-0 border-none shadow-2xl`) + token-colored `<th>` exactly like User `LeaderboardTable`; replace rank palette with `Badge`; remove raw rgba shadows |

### 2.6 `AdminSettings.tsx` → `components/admin/settings/*` — ✅ MOSTLY CERTIFIED
| Item | Value |
|---|---|
| Certified components | `Stack`, `Grid`, `Input`, `Label`, `Badge`, `Card`, `RadioGroup` |
| Manual styling | `SubjectCardItem.tsx:27-34` manual selection card (`rounded-2xl border-2`, raw shadows) |
| Hardcoded colors | `SubjectCardItem.tsx:31` `shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]`; `SubjectPieChart.tsx:4` Recharts `COLORS` palette (chart-specific — **exempt** per Module 1 precedent); `SubjectPieChart.tsx:29` tooltip raw `boxShadow` |
| Verdict | Subject card → `Card` + token shadows; pie chart exempt (chart-specific) |

### 2.7 `AdminUsers.tsx` / `AdminSubAdmins.tsx` → `components/admin/users|subadmins/*` — ✅ MOSTLY CERTIFIED
| Item | Value |
|---|---|
| Certified components | `DataGrid`-style views, `Card`, `Button`/`IconButton`, `ConfirmModal`, `AdminModal`, `Badge`, `ToastContainer`, `Pagination` |
| Manual styling | none flagged in sweep (beyond generic spacing) |
| Hardcoded colors | 0 flagged |
| Verdict | Verify during migration; expect no changes |

### 2.8 `AdminOverview` chart (`DailyAttemptsChart.tsx`) — ✅ CHART-EXEMPT
`boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'` (line 98) is a **Recharts tooltip** style —
chart-specific, exempt per Module 1 precedent (matches `SubjectPieChart` tooltip). Wrapper is
already certified `Card variant="default"`.

---

## 3. Cross-cutting inventory (all of `src/components/admin/`)

| Category | Count / Evidence |
|---|---|
| Raw `<button>` not using `Button`/`IconButton` | **9 files**: `topics/AdminTopicPreviewRenderer.tsx`, `topics/LangInputPanel.tsx`, `topics/TopicListItem.tsx`, `questions/AIToolCards.tsx`, `questions/JsonTab.tsx`, `questions/QuestionForm.tsx`, `questions/QuestionsTable.tsx`, `questions/QuestionsTableComponents.tsx`, `common/BulkActionBar.tsx` |
| Manual table | `leaderboard/LeaderboardView.tsx` (parity with User `LeaderboardTable` precedent) |
| Palette colors | **5 files**: `RankBadge.tsx`, `DailyAttemptsChart.tsx` (exempt), `LeaderboardView.tsx`, `SubjectPieChart.tsx` (exempt), `SubjectCardItem.tsx` — plus **11 more files** with red/green/amber/teal/slate/orange literal classes (JsonTab, PreviewTab, InstructionsTab, QuestionForm, QuestionsTable, TopicListItem, AdminTopicPreviewRenderer, BulkActionBar) |
| Duplicate badge/pill components | `QuestionsTableComponents.SubjectBadge`, `AdminTopicPreviewRenderer` tag pills, `RankBadge`, `TopicListItem` action buttons — all vs certified `Badge`/`IconButton` |
| Manual card wrappers | `QuestionForm` (`bg-app-bg … rounded-3xl` read-only statements/explanations, `rounded-2xl` visual-editor + option containers), `PreviewTab` stat cards, `JsonTab` error panel, `InstructionsTab` hero (`bg-primary/5 rounded-3xl`), `AdminTopicPreviewRenderer` (`rounded-[20px]` wrapper) — candidate `Card variant="subtle"`/`soft` |
| Spacing / arbitrary values | `text-[…]` ×102, `w-[…]` ×15, `h-[…]` ×11, `rounded-[…]` ×7, `shadow-[…]` ×3, `bg-[…]` ×2 — **micro-typography on scale with User Panel** (certified precedent) |
| Manual spinners | 0 (all `LoadingOverlay`/`Spinner`/`GridSkeleton`) |
| Inline `<style>` | 0 |
| `ThemeContext`/`.light` wrappers | 1 (`BulkActionBar.tsx:20` `bg-slate-900 … light ? 'ancient-card'`) |

---

## 4. Migration plan (proposed, pending approval)

### Priority 1 — Eliminate palette colors (visual divergence)
1. `QuestionForm.tsx` — correct-answer `green-500` → `Badge variant="success"` for the "Correct
   Answer" pill; option ring/check → `border-success`/`text-success` tokens; Telugu `amber-400`
   section → `warning` tokens (`Badge variant="warning"`, `border-warning/30 bg-warning/5`).
2. `JsonTab.tsx` — validation panel → certified `Alert variant="danger"` + `Badge variant="danger"`;
   "Skip Row" raw button → `Button variant="danger" size="sm"`.
3. `PreviewTab.tsx` — duplicate alert → `Alert variant="warning"`; stat cards → token classes or
   `Card variant="subtle"`.
4. `InstructionsTab.tsx` — `text-green-500` icon → `text-success`; hero wrapper → `Card`.
5. `TopicListItem.tsx:101` — `text-teal-500` → `text-primary`.
6. `AdminTopicPreviewRenderer.tsx` — YouTube `bg-red-600` link → `Button`/token; tag pills →
   `Badge variant="danger"`/`warning`/`success`/`primary`/`secondary` (IMP/TIP/ALERT/KEY/other).
7. `QuestionsTable.tsx:177` — delete hover `text-red-500` → `text-danger`.
8. `BulkActionBar.tsx` — `bg-slate-900`/`light:ancient-card` split → single certified token
   surface (`Card`/`bg-card-bg backdrop-blur-xl border-border-subtle`), `text-white/40` → tokens.

### Priority 2 — Standardize raw buttons → `Button`/`IconButton`
9. `TopicListItem.tsx` — 6 raw icon buttons → `IconButton variant="ghost"` (with existing
   `aria-label`, disabled states, focus rings preserved).
10. `AdminTopicPreviewRenderer.tsx:25` language toggle → `Tabs`/`Button`; `QuestionForm.tsx:184`
    "Correct?" → `Button variant="ghost"`; `QuestionsTable.tsx:155+` row actions →
    `IconButton variant="ghost"`; `AIToolCards.tsx`/`LangInputPanel.tsx`/`QuestionsTableComponents.tsx`
    raw buttons → `Button`/`IconButton`.

### Priority 3 — Tables, badges, cards
11. `LeaderboardView.tsx` — rewrap raw table in certified `Card className="p-0 border-none shadow-2xl"`,
    token-colored `<th>` micro-type — **exact mirror of User `LeaderboardTable`** (certified parity);
    replace `rounded-[32px]`/`rounded-[40px]` manual wrappers with `Card` variants; remove
    `shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]` → token shadow.
12. `RankBadge.tsx` — palette gold/slate/orange → `Badge variant="primary"`/`secondary` + token
    classes; drop `rgba(245,158,11,0.3)` glow.
13. `SubjectBadge` (`QuestionsTableComponents.tsx`) → certified `Badge`.
14. Manual card wrappers (QuestionForm read-only panels, visual-editor box, PreviewTab stat cards,
    InstructionsTab hero, AdminTopicPreviewRenderer wrapper, SubjectCardItem) → `Card` variants +
    token shadows.

### Priority 4 — Sweep + verify (no visual regression)
15. Re-run palette-color grep over `src/components/admin` + `src/pages/admin` → expect only
    chart-exempt (Recharts) + achromatic lighting.
16. `npx tsc -b` and `npm run build` → exit 0.
17. ESLint on all touched surfaces.
18. Confirm a11y (labels, `aria-*`, focus rings), responsiveness, permissions, business logic
    untouched.

---

## 5. Preserved invariants (migration must not change)

- Business logic / routing / permissions (`role`, `sub_admin`, exam visibility) — untouched.
- Validation system — untouched (error messages, `aria-invalid`/`aria-describedby`).
- Accessibility foundation — focus rings, labels, roles, `aria-live` all preserved.
- Responsiveness — grids, hidden/sm: variants, overflow handling all preserved.
- Certified component API — no props removed/renamed; only className/palette migrations.

---

## 6. Deliverables after approval

- `PHASE_3_1_ADMIN_VISUAL_COMPARISON.md` (before/after per page)
- `PHASE_3_1_ADMIN_CERTIFICATION.md` (12-criteria check, like Module 1)
- Updated `PHASE_3_1_EXECUTION_LOG.md` (Module 2 entry)
- Module 3 (Exam/Sub-Admin) must NOT begin until Admin certification + approval.

---

## 7. Gate

**This inventory is the approval gate.** No code is changed until the user approves the plan.
On approval, migration proceeds Priority 1 → 4 with per-cluster verification.

---

## 8. Execution summary (2026-08-02)

Approved with refinements: visual unification (not redesign); leave certified-looking code
untouched; preserve size/spacing/interaction/a11y/keyboard on button migrations; do NOT
rewrite the Leaderboard table structure — only wrapper/spacing/colors/shadows/borders/
typography; do NOT normalize micro-typography; charts stay exempt; prefer reuse over recreation.

### 8.1 Files changed (13)

| File | Change |
|---|---|
| `src/components/admin/questions/QuestionForm.tsx` | `green-500`→`success` (×12), `amber-400/500/600`→`warning` (×17) — correct-answer + Telugu sections now token-based |
| `src/components/admin/questions/JsonTab.tsx` | Validation panel → certified `Alert variant="error"` + `Button variant="danger" size="xs"` (Skip Row); red palette removed |
| `src/components/admin/questions/PreviewTab.tsx` | Duplicate alert → certified `Alert variant="warning"`; amber palette removed |
| `src/components/admin/questions/InstructionsTab.tsx` | `text-green-500`→`text-success` |
| `src/components/admin/questions/AIToolCards.tsx` | Manual card wrapper → certified `Card variant="subtle"` (tool-card CTAs retained, semantic token colors) |
| `src/components/admin/questions/QuestionsTable.tsx` | Mobile row actions → `IconButton variant="ghost"` (+`focusRing`); delete hover `text-red-500`→`text-danger` |
| `src/components/admin/questions/QuestionsTableComponents.tsx` | `ActionsCell` → `IconButton` (chip look preserved via overrides); `SubjectBadge` → certified `Badge variant="secondary"` |
| `src/components/admin/topics/TopicListItem.tsx` | 6 action buttons → `IconButton variant="ghost"` (+`focusRing`, `disabledOpacity={30}`); `text-teal-500`→`text-primary` |
| `src/components/admin/topics/AdminTopicPreviewRenderer.tsx` | Lang toggle → `Button size="xs"` primary/ghost; YouTube link `bg-red-600`→`bg-danger`; tag pills (IMP/TIP/ALERT/KEY) → certified `Badge` variants |
| `src/components/admin/topics/LangInputPanel.tsx` | AI Prompt Helper / Load Example → `Button size="xs"` soft/ghost |
| `src/components/admin/leaderboard/RankBadge.tsx` | rank 2 slate → tokens; rank 3 orange → `gold-300` brand token + warning; rank 1 rgba glow → `shadow-warning/30` |
| `src/components/admin/leaderboard/LeaderboardView.tsx` | Table wrapper → certified `Card` (`p-0 border-none shadow-2xl`) — **mirrors User `LeaderboardTable`**; rank-2/3 avatar palette → `secondary`/`primary` tokens; table structure untouched |
| `src/components/admin/common/BulkActionBar.tsx` | Dark surface `bg-slate-900 border-white/10`→`bg-card-bg border-border-subtle`; `text-white/*`→tokens |

### 8.2 Retained deliberately (documented, no visual divergence)

- **`AIToolCards` card-shaped CTAs** — full-card layout (icon/title/description/footer) with semantic token fills (`bg-primary/secondary/success`) + achromatic `text-white`; a `Button` cannot hold the layout without regression. Reuse-over-replacement.
- **`QuestionForm` "Correct?" micro-button + Telugu accordion toggle** — embedded structural micro-controls, now fully token-colored.
- **Token-based manual containers** — `QuestionForm` read-only panels (`bg-success/5`, `bg-warning/5`), `InstructionsTab` hero (`bg-primary/5`), `PreviewTab` stat cards, `AdminTopicPreviewRenderer` wrapper, `SubjectCardItem` (shadow uses `var(--primary-rgb)` design token) — token-compliant callouts, not Card duplicates. Left unchanged per "leave what matches".

### 8.3 Verification

- Palette sweep over `src/components/admin/**` + `src/pages/admin/**` → **clean**; only chart-exempt (Recharts tooltips/palette in `DailyAttemptsChart`/`SubjectPieChart`) and one `var(--primary-rgb)` token shadow remain.
- Raw `<button>` sweep → only the 3 retained items above.
- `npx tsc -b` → exit 0 · `npm run build` → exit 0 (only pre-existing chunk notices).
- ESLint on all touched files → **0 migration-introduced problems**; 4 pre-existing errors (unused `err`/`_idx`, 2 `any`) verified present pre-migration via `git stash`.
- a11y preserved: `aria-label`/`title`/`aria-expanded`/`aria-controls` retained; `focusRing` added to migrated icon buttons (improvement).
- Micro-typography and radii unchanged except the Leaderboard table wrapper radius standardized `rounded-[40px]`→`rounded-2xl` (Card default, matching the User Panel's own `LeaderboardTable`).

### 8.4 Visual-parity revision (post-certification review)

The first certification was returned by the user — the acceptance criterion is **pixel-level visual
parity** with the certified User Panel (canonical), not just token compliance. A cross-reference of
every custom Admin visual against the certified User Panel implementations produced these fixes:

| File | Fix | Certified reference |
|---|---|---|
| `shared/AdminSelectionTabs.tsx` | Non-`bare` branch now renders `SelectionContainer` + `bare` `Tabs` (removed manual `p-2 rounded-[28px]` wrapper + track tabs) | User `TopicPortalView` / `SelectionView` (`SelectionContainer` + `bare` `Tabs`) |
| `questions/PromptEditorModal.tsx` | Overlay `bg-black/60 backdrop-blur-sm` → `bg-app-bg/60 backdrop-blur-md`; panel `rounded-[32px]` → `rounded-[2.5rem]` | Certified `AdminModal` |
| `settings/AddExamModal.tsx` | Overlay `bg-black/70 backdrop-blur-md` → `bg-app-bg/60 backdrop-blur-md`; panel `rounded-[24px] bg-card-bg/98 … backdrop-blur-xl` → `rounded-[2.5rem] bg-card-bg` | Certified `AdminModal` |
| `leaderboard/LeaderboardView.tsx` | Top-3 cards `rounded-[32px]` → `rounded-[24px]`; row avatar `bg-gradient-to-br from-primary to-primary-dark` → solid `bg-primary` (`--primary-dark` token does not exist) | User `LeaderboardTopCard` `rounded-[24px]`; certified avatar `bg-primary text-white shadow-lg shadow-primary/20` |
| `settings/SubjectCardItem.tsx` | Removed `useTheme`/`isDark` ternaries + `bg-white/40` + `bg-[var(--ancient-cream)]` → token-only classes in both modes | All colors resolve through DS theme tokens |
| `questions/UploadProgressOverlay.tsx` | `rounded-[28px]` → `rounded-[2.5rem]` (matches the modal panel it overlays) | Certified `AdminModal` radius |
| `topics/AdminTopicPreviewRenderer.tsx` | `rounded-[20px]` → `rounded-3xl` (= `--radius-3xl` token value) | DS radius tokens |

Retained after cross-check (certified-consistent): `BulkActionBar` `ancient-card`/`isDark` (matches
certified `Navigation`/`AdminIconWrap`; `--ancient-*` resolve via tokens), `AIToolCards` `bg-white/5`
(User `LeaderboardTopCard` `bg-white/10`), `text-white` on token fills, `backdrop-blur` sticky
surfaces, `hover:scale`/`group-hover:scale-110`, framer-motion, `animate-in`/`animate-pulse`,
`rounded-3xl`.

Verification re-run: `npx tsc -b` exit 0; `npm run build` exit 0 (pre-existing chunk notices only);
ESLint — 0 migration-introduced problems (reported issues are pre-existing `set-state-in-effect` /
`_idx` / `any` in untouched code, confirmed via `git diff`).

### 8.5 Component-reuse revision (post-certification review)

The parity revision was also returned by the user. The acceptance criterion is now **component
reuse**: do NOT re-create the User Panel appearance — reuse the exact certified User Panel component
that produces the required appearance. Mandated categories (Stat Cards, Selection Containers, Chart
Containers, Dashboard Cards, Icon Containers, Header Containers, Filter Containers) must be
identical in padding / shadows / border-radius / elevation / hover / transitions / internal spacing;
only content may differ. This round reused the exact certified components:

| File | Reused certified component (User Panel usage) |
|---|---|
| `overview/StatsGrid.tsx` | `Grid cols={2} lg={4}` + `StatCard status="accent/secondary/info/warning"` (was raw grid + legacy `color="var(…)"`) — mirrors `DashboardStatsGrid` |
| `pages/admin/AdminOverview.tsx` | Chart container `Card variant="premium-neutral" padding={24} className="group"` + `LoadingSkeleton` fallback (was `Card variant="default" p-0 overflow-hidden min-h-[400px]`) — mirrors `PerformanceAnalyticsSection` |
| `overview/DailyAttemptsChart.tsx` | Header → `PerformanceSectionHeader` (imported directly from user panel); chart area `h-[260px] lg:h-[300px]` + `animate-in fade-in slide-in-from-bottom-4 duration-1000` (was custom icon-box + `<h3>/<p>` + `h-[220px] sm:h-[250px] mt-2`) |
| `users/UsersToolbar.tsx` | `FilterBar` default certified surface (removed `border-none bg-transparent gap-4` overrides) — same plain usage as `AdminFilterBar` |
| `questions/QuestionsActions.tsx` | raw toolbar `<div>` → certified `FilterBar` |
| `users/UserMobileCard.tsx` | raw `rounded-2xl p-4 space-y-3 border bg-card-bg border-border-subtle/80` → certified `Card` (matches `LeaderboardMobileCard`) |
| `sub-admins/SubAdminMobileCard.tsx` | raw card `<div>` → certified `Card` |
| `topics/TopicListItem.tsx` | raw `motion.div bg-card-bg/50 border-border-subtle/40` row + raw `bg-primary/20` index chip → certified `Card variant="default"` (motion props passed through) + `PremiumIconContainer` — mirrors User `TopicCard` |

Audited and retained as already-reused (no change): Selection Containers (both `AdminSelectionTabs`
branches = `SelectionContainer` + `bare` `Tabs`, identical to User `TopicPortalView`/`SelectionView`),
Icon Containers (`AdminIconWrap`/`IconBadge`/`PremiumIconContainer` — shared frozen composites the
User Panel itself uses), Header Containers (shared `AdminPageTitle` via `SidebarLayout`; `AdminText`
`cinzel`/`garamond` section headers; `PerformanceSectionHeader` for the chart). Charts stay exempt at
the library level (Recharts tooltips/palettes); their containers are now aligned.

Verification re-run (component-reuse round): `npx tsc -b` exit 0; `npm run build` exit 0 (pre-existing
chunk notices only); ESLint on the 8 touched files → **0 problems**; sweeps → no hex/rgb outside
chart-internal data, `StatCard color=` escape hatch removed, only arbitrary radius left is
`LeaderboardView` `rounded-[24px]` (certified User `LeaderboardTopCard` value).
