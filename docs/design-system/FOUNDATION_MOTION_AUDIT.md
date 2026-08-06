# Foundation Motion Audit

**Phase 3.4 P2 — Wave 4 (Motion Family)**
**Date:** 2026-08-02
**Scope:** Every motion primitive and usage — framer-motion presets, CSS
`@keyframes`/animation utilities, duration/easing inventory, reduced-motion
handling. Cross-checked against `FOUNDATION_TOKEN_OWNERSHIP.md` (Motion owns motion
presets/durations/easings).
**Rule:** previously certified visual behaviour remains unchanged unless the change
is required by architectural ownership, explicitly approved, and logged in
`DESIGN_DECISION_LOG.md`.

---

## 1. Audit Method

1. Inventoried every framer-motion usage in `src/components/common`
   (framer-motion ^12.4.7; 11 importing files).
2. Inventoried every CSS animation primitive in `index.css` and each
   `.animate-*`/`animate-in` consumer.
3. Recorded every distinct duration/easing value and every spring config.
4. Checked reduced-motion support and dead animation-utility classes.

## 2. Motion Inventory

### 2.1 Framer-motion presets
- `AntigravityAnimation.tsx` (the Motion family's preset module): `PAGE_EASE =
  SECTION_EASE = [0.25,0.1,0.25,1]` (`:4-5`); `PageTransition` 0.35s (`:16`);
  `SectionReveal` 0.28s + delay 0.08 (`:33`); `StaggerContainer` stagger 0.055 /
  delayChildren 0.08 (`:42`); `StaggerItem` 0.28s (`:63`).
- **Spring — shared config duplicated inline ×3:** `{stiffness:260, damping:32,
  mass:1.1}` at `AntigravityData.tsx:105` (Tabs pill layoutId), `SegmentedFilter.tsx:94`,
  `ThemeToggle.tsx:53`.
- **Button:** `whileHover 1.01` / `whileTap 0.98`, `transition {duration:0.2}`
  both light (`:112-115`) and dark (`:129-132`) branches.
- **IconButton:** `whileHover 1.01` / `whileTap 0.95`, **no `transition` prop**
  (`AntigravityButton.tsx:212-213`) → framer default spring; CSS
  `transition-[color,box-shadow,border-color,opacity]` (`:217`) sets no duration.
- **Menu:** scale/fade/slide presets, `transition {duration:0.18, ease:'easeOut'}`
  (`Menu.tsx:274`).

### 2.2 CSS animation primitives (`index.css`)
- `@keyframes fadeIn` (`:583`); `.animate-in { animation: fadeIn 0.2s ease-out }`
  (`:658`) — the only functional generic entrance utility.
- `@keyframes sheen` (`:1215`); `@keyframes slideIn` + `.toast-slide-in` 0.4s
  cubic-bezier(0.16,1,0.3,1) (`:1222-1229`).
- Reduced motion: global `prefers-reduced-motion` override (`:1117-1124`) ✅.

## 3. Findings

### 3.1 HIGH

#### M-1 — Two motion vocabularies; the CSS one is full of dead classes
- Evidence: 26 sites use `.animate-in fade-in slide-in-from-bottom-4 duration-500`
  (e.g. `QuestionsTable.tsx:62`, `QuestionForm.tsx:55`, `AccountDisabledPage.tsx:24`),
  and in reusable components `AdminModal.tsx:78,82`, `DiagramRenderer.tsx:46,360`,
  `QuestionVisualizer.tsx:46`, `BulkActionBar.tsx:18`, `PerformanceSkeleton.tsx:7`,
  `LeaderboardSkeleton.tsx:7`.
- Facts: no `tailwindcss-animate` in `package.json`; `fade-in`, `zoom-in`,
  `zoom-in-95`, `shake`, `slide-in-from-*` resolve to **nothing** (no `@utility`, no
  keyframe, no plugin). Only `.animate-in` works. `duration-500`/`duration-300` are
  transition-duration utilities with no transition set → no-op.
- Impact: the "animation" these 26 call sites think they configure is only the
  0.2s `fadeIn` from `.animate-in`; the intent (slide/zoom/shake/500ms) is silently
  absent. Two competing motion languages also split ownership (Motion family vs
  global CSS).
- Fix direction (Wave 4): Motion family owns one preset system. For reusable
  components switch to `AntigravityAnimation` presets; strip dead classes
  (`fade-in`, `slide-in-from-*`, `zoom-in-*`, `shake`) across the repo;
  document `.animate-in`/toast keyframes as Motion-owned CSS primitives for the cases
  framer-motion cannot cover (toast).
- Status: **approval-gated** (renders the composed animations change where dead
  classes previously implied an effect).

#### M-2 — IconButton press motion is inconsistent with Button
- Evidence: same hover scale (1.01) but `whileTap 0.95` with no `transition`
  (framer default spring) vs Button `0.98` + `duration 0.2` (`AntigravityButton.tsx:212-213`
  vs `:112-115,:129-132`). CSS transitions on IconButton have no duration (`:217`).
- Fix direction (Wave 4): share the Button transition preset. Render-affecting →
  **approval-gated**.

### 3.2 MEDIUM

#### M-3 — Spring config duplicated inline ×3
- `{260,32,1.1}` copy-pasted in Tabs/SegmentedFilter/ThemeToggle. Extract to a
  Motion-family preset (`TAB_SPRING`) and consume. No render change. Status: plan.

#### M-4 — Durations/easings not centralized
- Current spread: 0.18 `easeOut` (Menu), 0.2 (Button), 0.28/0.35
  cubic-bezier(0.25,0.1,0.25,1) (AntigravityAnimation), 0.4 cubic-bezier(0.16,1,0.3,1)
  (toast), 0.3 (`.ancient-3d-lift`, sheen opacity). Consolidate into documented
  presets (e.g. FAST=0.18, STANDARD=0.2/0.28, SLOW=0.4) in the Motion family module;
  keep exact values so renders are unchanged. Status: plan.

#### M-5 — `.animate-in`/keyframes live in global `index.css`, not the Motion family
- Ownership: Motion family must own all motion primitives. Move the animation
  utilities into the Motion family's module documentation and keep the toast/sheen
  keyframes as the sanctioned CSS-only set. Status: plan (no render change).

### 3.3 LOW

#### M-6 — `darkClassName` prop remnant in `AntigravityDashboard`
- `AntigravityDashboard.tsx:39,83` pass a `darkClassName` prop; verify it is dead
  under D-123 and remove or rewire to `isDark`. Status: plan.

#### M-7 — Skeleton languages are split
- `.skeleton-static` (`index.css:589`) plus `animate-pulse` usage in
  `LoadingOverlay.tsx:25`, `DiagramRenderer.tsx:351` (`animate-pulse-slow`),
  `Badge` pulse, `PerformanceSkeleton`/`LeaderboardSkeleton`. Consolidate under a
  Motion-owned skeleton preset. Status: plan.

## 4. Amber Verification (Motion family)
- No color values in motion primitives. ✅ Clean.

## 5. Wave 4 Close-out Checklist
- [ ] M-1: reusable components → Motion presets; dead animation classes removed repo-wide.
- [ ] M-2: IconButton shares Button's transition preset (approval-gated).
- [ ] M-3: shared `TAB_SPRING` preset.
- [ ] M-4: duration/easing preset table (values unchanged).
- [ ] M-5/M-7: motion primitives owned by Motion family; skeleton language unified.
- [ ] Repo-wide re-check: no `.animate-in fade-in …` dead-class pattern remains; every
  motion value comes from the family preset set.
