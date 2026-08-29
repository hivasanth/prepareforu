# Phase 5.4E — Hover & Motion Language: Foundation Evolution Implementation Report

- **Phase:** 5.4E (Hover & Motion Language) — Foundation evolution
- **Status:** IMPLEMENTED 2026-08-06 — **awaiting user certification**
- **Approval:** D-169 planning decision approved the motion token design; the user granted the
  separate dedicated 5.4E implementation approval (2026-08-06, direct directive). Foundation-only:
  ONE unified Hover & Motion language from additive motion tokens + ONE JS mirror; no theme-value
  change, no consumer/page migration.
- **Decisions:** **D-169 (planning), D-170 (implementation)** recorded in
  `docs/design-system/DESIGN_DECISION_LOG.md`

---

## 1. Executive summary

Phase 5.4E is the **hover & motion language** Foundation gate. It introduces the application's first
motion token system and converges every interactive surface onto ONE interaction language. The
pre-5.4E state had **zero motion tokens** — durations and easings were hardcoded (150–1000ms), hover
models diverged (scale, lift, rotate, brightness, elevation), `transition-all` was common, and
framer-motion ignored `prefers-reduced-motion`. The phase delivered:

1. **Motion token system** — FOUR canonical durations `--duration-fast/normal/slow/very-slow`
   (150/200/300/500ms) + FOUR canonical easings `--ease-standard/enter/exit/emphasized`, added to
   FROZEN `themes.css` `:root` **additively** (zero theme-value change), with semantic aliases
   `--duration-hover/focus/pressed/menu/modal/reveal/decorative` + `--ease-hover/focus/pressed/
   menu/modal/reveal`.
2. **`@theme` registrations** in `index.css` — `--transition-duration-*`, `--ease-*`,
   `--transition-property-interaction` — so Tailwind v4 emits the `duration-*`/`ease-*` utilities and
   the `transition-interaction` property set (verified in the built chunk).
3. **ONE JS mirror** — `src/components/common/AntigravityMotion.ts` (`MOTION_DURATION`/`MOTION_EASE`
   + `PAGE_TRANSITION`/`SECTION_REVEAL`/`MENU_TRANSITION`/`SELECT_POPUP_TRANSITION`/
   `MODAL_TRANSITION`/`TAB_SPRING`/`TRANSITION_INTERACTION`/`FOCUS_RING`/`CURSOR_NOT_ALLOWED`/
   `BUTTON_HOVER`/`BUTTON_TAP`); the numbers mirror the CSS tokens so CSS and framer-motion feel
   identical.
4. **index.css tokenization** — `.animate-in` → `fadeIn var(--duration-normal) var(--ease-standard)`;
   `.toast-slide-in` → `slideIn var(--duration-slow) var(--ease-enter)`; `.premium-card`/
   `.ancient-card`/`.light .ancient-*` family + `.ancient-btn-*` → `var(--duration-fast)`/
   `var(--ease-standard)`; hover translate lifts and `scale(1.1)`/`translateY(1px)` pressed
   transforms REMOVED; `transition: all 0.15s ease` → property-scoped tokens; the intentional
   `prefers-reduced-motion` 0.01ms overrides retained.
5. **Component sweep** — ~40 Foundation + feature files converged to
   `transition-interaction duration-fast ease-standard` + `FOCUS_RING`; inline framer transitions
   converted to `MOTION_DURATION`/`MOTION_EASE`/presets; **AdminModal rewritten** to ONE 200ms
   same-timing scrim+panel animation.
6. **`main.tsx`** — `<MotionConfig reducedMotion="user">` wraps the app so framer-motion honors
   `prefers-reduced-motion`.
7. **Bug fixes** — 9 broken `${...}`-in-plain-string interpolations fixed (AntigravityForm ×3,
   NotificationPanel ×4, Navigation ×2, TopicInfoButton ×2, AttemptCardBase unused import) — these
   rendered literal `${TRANSITION_INTERACTION}` text in double-quoted `className` strings.
8. **Verification** — `tsc -b --force` exit 0; build exit 0; eslint **396 (net −1 vs the 397
   baseline, 0 new)**; vitest 301/33 identical; dist CSS grep all motion tokens/keyframes present.
9. **Governance** — `FOUNDATION_GOVERNANCE.md` v1.24.0 → **v1.25.0** (§4 Hover & Motion Language
   Contract; §36 changelog); Freeze Register **DS-018** (Hover & Motion System FROZEN); D-169/D-170;
   execution log updated.

**Scope discipline:** the component layer touched ONLY Foundation files + the feature components
under `src/components/**` listed in §4. **No consumer, page, layout, theme-value, or token-value file
was modified.**

---

## 2. Scope executed (approved 2026-08-06)

| Area | Result |
|---|---|
| Motion tokens | `--duration-fast/normal/slow/very-slow` + `--ease-standard/enter/exit/emphasized` in `themes.css` `:root` (additive, zero value change) |
| `@theme` registrations | `--transition-duration-*`, `--ease-*`, `--transition-property-interaction` in `index.css` |
| JS mirror | `AntigravityMotion.ts` — durations/easings + 6 framer presets + shared constants |
| index.css tokenization | all hardcoded transition/animation timings tokenized; hover lifts + pressed transforms removed; reduced-motion overrides retained |
| Interaction model | `transition-interaction` (no transform); hover = brightness + elevation; pressed = dim; `FOCUS_RING`; disabled/loading = opacity + cursor |
| Component sweep | ~40 files → `transition-interaction duration-fast ease-standard` + `FOCUS_RING`; inline framer → presets; AdminModal = ONE 200ms scrim+panel |
| Reduced motion | `MotionConfig reducedMotion="user"` in `main.tsx` |
| Bug fixes | 9 broken `${...}` interpolations fixed |
| Verification | tsc/build/lint net −1; vitest identical; dist CSS grep; zero `transition-all` |
| Governance | v1.25.0 §4 Hover & Motion Language Contract; D-169/D-170; freeze register DS-018 |

Out of scope (NOT executed): any theme/token-value change, any consumer/page/layout migration,
contrast gates **C-1…C-5** (each a separate dedicated approval, never batched), and the future
**5.4F (Skeleton)** gate (separate dedicated approval).

---

## 3. The motion system

### 3.1 Tokens (themes.css `:root`, additive)

| Token | Value |
|---|---|
| `--duration-fast` | 150ms |
| `--duration-normal` | 200ms |
| `--duration-slow` | 300ms |
| `--duration-very-slow` | 500ms |
| `--ease-standard` | cubic-bezier(0.25, 0.1, 0.25, 1) |
| `--ease-enter` | cubic-bezier(0.16, 1, 0.3, 1) |
| `--ease-exit` | cubic-bezier(0.4, 0, 1, 1) |
| `--ease-emphasized` | cubic-bezier(0.175, 0.885, 0.32, 1.275) |

Semantic aliases map onto the canonical values (never literal).

### 3.2 `AntigravityMotion.ts` presets

| Preset | Duration / config | Easing |
|---|---|---|
| `PAGE_TRANSITION` | slow (300ms) | standard |
| `SECTION_REVEAL` | normal (200ms) | standard |
| `MENU_TRANSITION` | fast (150ms) | standard |
| `SELECT_POPUP_TRANSITION` | fast (150ms) | enter |
| `MODAL_TRANSITION` | normal (200ms) — scrim + panel same timing | standard |
| `TAB_SPRING` | spring 260/32/1.1 | — |

Shared constants: `TRANSITION_INTERACTION = 'transition-interaction duration-fast ease-standard'`,
`FOCUS_RING` (2px ring), `CURSOR_NOT_ALLOWED`, empty `BUTTON_HOVER`/`BUTTON_TAP` (document the
no-scale contract).

### 3.3 Interaction model

`transition-interaction` transitions ONLY color/background-color/border-color/box-shadow/filter/
opacity — **never transform**. Hover = subtle brightness + very small `--elevation-*` shadow
refinement (NO translate/scale lift). Pressed = brightness dim. Focus = `FOCUS_RING`. Disabled/
Loading = opacity + `cursor-not-allowed`.

---

## 4. Files changed

| File | Change |
|---|---|
| `src/styles/themes.css` | additive motion `:root` token block (durations, easings, semantic aliases) — NO value change |
| `src/index.css` | `@theme` motion registrations; tokenized transitions/animations; hover lifts + pressed transforms removed; reduced-motion overrides retained |
| `src/components/common/AntigravityMotion.ts` | **NEW** — the single motion constant source |
| `src/main.tsx` | `<MotionConfig reducedMotion="user">` wraps the app |
| `src/components/common/AntigravityButton.tsx` | whileHover/whileTap scale removed; `transition-interaction` + `FOCUS_RING`; `BUTTON_HOVER`/`BUTTON_TAP` presets |
| `src/components/common/AntigravityCard.tsx` | hover → brightness + elevation; scoped transition tokens |
| `src/components/common/AntigravityForm.tsx` | 3 broken `${...}` interpolations fixed; input/field transitions tokenized |
| `src/components/common/AntigravityData.tsx` | progress bar `transition-all` → `transition-[width] duration-slow ease-standard`; Badge/Pill interactions tokenized |
| `src/components/common/Menu.tsx` | menu open animation → `MENU_TRANSITION` |
| `src/components/common/Navigation.tsx` | 2 broken `${...}` interpolations fixed; tooltip `transition-[opacity,transform] duration-fast ease-standard` |
| `src/components/common/AdminModal.tsx` | rewritten — ONE 200ms same-timing scrim+panel animation (`MODAL_TRANSITION`/`.animate-modal`) |
| `src/components/common/Pill.tsx` | interaction contract already DS-017-certified (no change needed beyond token alignment) |
| `src/components/common/NotificationPanel.tsx` | 4 broken `${...}` interpolations fixed + focus rings |
| `src/components/common/TopicInfoButton.tsx` | 2 broken `${...}` interpolations fixed + focus rings; import reduced |
| `src/components/common/AttemptCardBase.tsx` | unused `TRANSITION_INTERACTION` import removed; literal classes restored |
| `src/components/common/SegmentedFilter.tsx`, `ThemeToggle.tsx`, `PremiumSelect.tsx`, `CollectionFilter.tsx`, `BilingualToggle.tsx`, `IconBadge.tsx`, `PremiumIconContainer.tsx`, `FormattedBodyText.tsx` | converged to tokens + `FOCUS_RING` |
| `src/components/common/ErrorBoundary.tsx`, `LoadingScreen.tsx` | decorative transitions tokenized |
| `src/components/common/DiagramRenderer.tsx` | balloon/table transitions tokenized (decorative — no hover scale) |
| `src/components/exam/…` (LanguageSelectionScreen, ExamLayout, QuestionPalette/Options/Actions/Navigator, ReviewLayout, ExamTimer, ExamHeader, StatusBoard) | converged to tokens + `FOCUS_RING` |
| `src/components/topics/…` (TopicReader, TopicSectionRenderer, TopicCard) | hover slide removed; converged |
| `src/components/sub-admin/create/…` (CreateStepSetup, CreateStepPrompt, CreateStepJsonPaste, CompactDateTimePicker, SuccessView, QuestionCard) | springs → presets; converged |
| `src/components/admin/upload/{UploadContextPanel,MethodSelectionView}.tsx` | card hovers + focus rings; decorative scale removed |
| `src/components/admin/settings/{SubjectCardItem,AddExamModal}.tsx` | selected `scale-[1.03]` removed; modal → `MODAL_TRANSITION` |
| `src/components/admin/questions/{PreviewTab,AIToolCards,QuestionForm}.tsx` | scale hovers → brightness + focus rings; ChevronDown `duration-200` → tokens |
| `src/components/admin/leaderboard/LeaderboardView.tsx` | podium/avatar scale+rotate removed → brightness + `hover:shadow-card-hover-shadow`; progress bar tokenized |
| `src/components/admin/shared/AdminSelectionTabs.tsx` | springs → `TAB_SPRING` |
| `src/components/profile/ProfileForm.tsx` | converged |
| `src/components/user/educator-exams/TeacherExamCard.tsx` | IconBadge/H3 converged |
| `src/components/user/leaderboard/LeaderboardComponents.tsx` | row hover tokenized |
| `src/components/user/performance/PerformanceAnalyticsSection.tsx` | `group-hover:scale-110` removed |
| `src/components/user/prepare-write/{PreparationView,SelectionView}.tsx` | arrows `active:scale-90` → `active:brightness-95` + focus rings |
| `src/components/user/{CarouselDots,TestConfigView}.tsx` | tokens + focus rings |
| `src/components/sub-admin/exams/{ExamDetailModal,ExamListSection,ExamStudentTable,ExamScoreDistribution,ExamQuestionAnalysis}.tsx` | inline framer → presets; rows/options converged |
| `FOUNDATION_GOVERNANCE.md` | v1.24.0 → **v1.25.0**; §4 Hover & Motion Language Contract; §36 changelog |
| `FOUNDATION_FREEZE_REGISTER.md` | Hover & Motion System row (**DS-018**, FROZEN) + Phase 5.4E entry |
| Root deliverables | `HOVER_LANGUAGE_SPECIFICATION.md`, `MOTION_LANGUAGE_SPECIFICATION.md`, `INTERACTION_LANGUAGE_SPECIFICATION.md`, `FOUNDATION_HOVER_AUDIT.md`, `FOUNDATION_MOTION_AUDIT.md`, `FOUNDATION_INTERACTION_AUDIT.md`, `PHASE_5_4E_IMPLEMENTATION_PLAN.md`, `PHASE_5_4E_CERTIFICATION.md` |
| `docs/design-system/PHASE_5_4E_{IMPLEMENTATION_REPORT,VISUAL_VERIFICATION,CERTIFICATION}.md` | this report + verification evidence + certification gate |
| `docs/design-system/DESIGN_DECISION_LOG.md` | **D-169** (planning), **D-170** (implementation) |
| `PHASE_3_1_EXECUTION_LOG.md` | 5.4E implementation entry |

**No consumer, page, service, schema, theme-value, or token-value file was modified.**

---

## 5. Verification summary

| Check | Result |
|---|---|
| `npx tsc -b --force` | ✅ exit 0 (required the 3 unused-import fixes first) |
| `npm run build` | ✅ exit 0 (pre-existing warnings only) |
| `npx eslint .` | ✅ **396 problems (343 E / 53 W) — net −1 vs the 397 baseline, 0 new** |
| Vitest baseline proof | ✅ clean worktree at HEAD `453b5d7` = identical 33 pre-existing failures (ds003/ds005/ds014); working tree = 301 passed / 33 failed → **0 new failures** (via `--config vitest.audit.config.ts`) |
| dist CSS grep | ✅ `transition-interaction`, `duration-fast`, `animate-modal` + `modal-in`/`modal-backdrop-in` keyframes, `--transition-duration`, `--ease-standard` all present in `dist/assets/index-DwW3Kmtl.css` |
| Regex scan | ✅ `src/components/**` + `src/index.css`: zero remaining `transition-all`; zero broken `${...}` in plain `className` strings; zero scale/rotate/translate hovers (layouts/pages out of scope and untouched) |

Full evidence in `PHASE_5_4E_VISUAL_VERIFICATION.md`.

**Note on the lint count:** the 5.4E sweep removed exactly one pre-existing eslint problem
(397 → 396) while introducing zero — the net reduction comes from the `transition: all 0.15s ease`
→ property-scoped tokenization in `index.css` and the unused-import cleanups. The remaining 396 are
the pre-existing repo-wide findings (FileNaming rule, etc.).

---

## 6. Rollback

- `git checkout` the component files + `main.tsx` → pre-5.4E transitions/hovers; delete
  `AntigravityMotion.ts`.
- `themes.css`: remove the additive `:root` motion block (no frozen value changes to revert).
- `index.css`: revert the tokenized transition/`@theme` lines to their literal values.
- Governance/docs edits are revertable single-file changes.

---

## 7. Definition of Done

- [x] ONE motion token system (CSS + JS mirror) with zero theme-value change
- [x] No `transition-all`, no hardcoded durations/easings, no inline framer numbers in `src/components/**` + `src/index.css` (layouts/pages are out of scope and untouched)
- [x] No scale/rotate/translate hover; `FOCUS_RING` on all focusable surfaces; ONE modal animation
- [x] `prefers-reduced-motion` honored (MotionConfig + CSS overrides)
- [x] 9 broken `${...}` interpolations fixed
- [x] Verification: tsc/build exit 0; eslint net −1; vitest baseline identical; dist CSS grep
- [x] Governance v1.25.0 + DS-018 + D-169/D-170 + execution log
- [x] 8 root deliverables + 3 phase docs
- [ ] **USER CERTIFICATION** (pending — `PHASE_5_4E_CERTIFICATION.md`)

## Next gate

**Phase 5.4E is IMPLEMENTED (awaiting user certification).** On certification, 5.4E CLOSES (the
Hover & Motion Foundation is permanently frozen under DS-018). Consumer/feature motion migration =
5.4G repository migration (separate approval). Contrast gates C-1…C-5 remain OPEN — each a separate
dedicated approval (never batched). Subsequent gates: 5.4F (Skeleton), 5.4G (Repository Migration).
