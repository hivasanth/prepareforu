# /EXAMS SKELETON REMEDIATION REPORT

Status: **COMPLETE** — scope EX-1..EX-8, page-scoped, browser-verified.
Classification set: `FIXED` / `PARTIALLY FIXED` / `VERIFIED NO CHANGE REQUIRED` / `DEFERRED`.

---

## 1. Files Modified

| File | Change | Scope |
|---|---|---|
| `src/components/user/full-exams/ExamGridSkeleton.tsx` | Full rewrite of the exam-paper skeleton (EX-1, EX-2, EX-4, EX-5, EX-6, EX-7, EX-8) | /exams only |
| `src/pages/user/UserExams.tsx` | Replaced module-level `loadingContent` with in-component `renderLoadingContent()` gating the selection skeleton (EX-3) | /exams only |
| `src/components/common/Skeleton.tsx` | **Approved exception**: additive `pad?: string` prop (default-preserving). Justified by verified implementation blocker, see EX-7. | additive, all existing callers unchanged |

No changes to `Card`, `Button`, `Tabs`, `SelectionContainer`, `themes.css`, `index.css` (only the additive `Skeleton` prop above). No `!important`, no override-stacking, no second skeleton system, no JS breakpoint detection, no transform hacks.

---

## 2. Finding-by-Finding Detail

### EX-1 — Mobile carousel slide geometry (HIGH) — **FIXED**
- **Before**: slide `min-w-[85%]` — 15% of the next card peeked in; only `snap-center` (no `snap-always`); `gap-6` vs final `gap-4`; no `px-[3px]`/`-mx-[3px]` gutter compensation.
- **After** (matches final `ExamPaperGrid` mobile row verbatim):
  `flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 px-[3px] -mx-[3px] pb-4 scroll-smooth` with slides `min-w-full shrink-0 snap-center snap-always`.
- **Validation**: 390 → slideWidth **374px** = carousel clientWidth **380px − 6px** (3px each side), i.e. a **full-width slide, no peek**. `min-width:100%`, gap 16px, snap-align center, snap-stop always. 414 → 398/404, identical. **PASS**.

### EX-2 — Responsive breakpoint / grid columns (HIGH) — **FIXED**
- **Before**: `md:hidden` / `hidden md:grid` with `md:grid-cols-2` — carousel persisted 640–767, single column at 640.
- **After**: carousel `sm:hidden`; grid `hidden sm:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 w-full auto-rows-stretch` — exact final `ExamPaperGrid` desktop wrapper.
- **Validation**: 390/414 → carousel **ON**, grid **OFF**. 640/767/768/1024 → grid **2 tracks** (292/355.5/312/348px). 1280/1440 → grid **4 tracks** (222/262px). gridCards 8, mobile slideCount 4. **PASS**.

### EX-3 — Selection skeleton only for APPSC (MEDIUM) — **FIXED**
- **Before**: `isAppsc === false` still rendered the selection skeleton → phantom tabs for Bank Exams.
- **After**: `renderLoadingContent()` returns `<ExamSelectionSkeleton />` only when `(authLoading || isAppsc)`; papers skeleton otherwise. AUTH UNKNOWN retains old structure during `authLoading`.
- **Validation**: APPSC profile → **2** status regions (selection + papers), `selectionSkeleton=true`. NONAPPSC (`BANK_EXAMS`) → **1** status region, `selectionSkeleton=false`, no phantom tabs. **PASS**.

### EX-4 — CTA geometry (MEDIUM) — **FIXED**
- **Before**: CTA placeholder `height={40} borderRadius={10}`, no footer divider → floated off bottom.
- **After**: footer `mt-3 pt-3 border-t border-border-subtle/30`; CTA `width="100%" height={48} borderRadius={14}` (final `Button` h-[48px], r14); card `flex flex-col gap-4`, body `flex-1 flex flex-col gap-4`, metrics `mt-auto pt-2`.
- **Validation**: ctaHeight **48**, ctaRadius **14px**, footer border 1px `--border-subtle @ 30%` (dark) / `@ 30%` (light), card gap 16px, `ctaPinnedGap` **21** (<768: 1px border + 20px pb) / **25** (≥768: 24 + 1) → CTA **bottom-pinned**. **PASS**.

### EX-5 — Metric border color in light theme (MEDIUM) — **FIXED**
- **Before**: `border-white/5` → invisible-ish divider in light mode.
- **After**: `border border-border-subtle/30 light:border-stat-card-border/20` — the token pair winning the reference audit of `METRIC_CONTAINER` (`bg-hover-bg/20 p-3 rounded-xl border border-border-subtle/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] light:bg-card-bg/30 light:border-stat-card-border/20`).
- **Validation**: dark border = `oklab(0.3729…/0.3)` (`--border-subtle` @30%), light border = `oklab(0.65/0.2)` (`--stat-card-border` @20%), 1px both. **PASS**.

### EX-6 — Badge geometry (LOW) — **FIXED**
- **Before**: 56×22, `rounded-full` (pill r11).
- **After**: `width={56} height={28} borderRadius={14}` — exact final `Pill` md geometry (`h-7 px-3 rounded-[14px]`).
- **Validation**: badgeHeight **28**, badgeRadius **14px**. **PASS**.

### EX-7 — Card padding vs final card (LOW) — **FIXED** (approved exception)
- **Before**: `p-6` always; final Card is `p-5 md:p-6`.
- **Fix**: `Skeleton.tsx` gains additive `pad?: string` (default `p-4` row / `p-6` card preserved for all existing callers). Grid card uses `pad="p-5 md:p-6"`.
- **Blocker evidence (verified before editing)**: compiled `dist/assets/index-*.css` emits `.p-5{` at offset **110342** *before* `.p-6{` at **110372**, so a page-layer `className="p-5"` can never beat the primitive's hardcoded `p-6` — a genuine implementation blocker satisfying the task's exception rule.
- **Validation**: card paddingTop **20px** <768, **24px** ≥768. **PASS**.

### EX-8 — Slide count (LOW) — **VERIFIED NO CHANGE REQUIRED**
- Task instruction permits keeping the fixed count. No safe synchronous count source exists pre-load (grid renders before `allowedExamIds`), and adding a network request for count was explicitly disallowed. Retained: 8 desktop skeletons / `Math.min(count, 4)` mobile slides.
- **Validation**: gridCards **8** (640–1440), slideCount **4** (390/414). **PASS (no change)**.

### Downstream (documented, unchanged)
- `/active-exam` retains its generic `PageLoader` + "Initializing secure environment" state — security-init sequence, out of scope; the task's scope limitation to /exams (and explicit "keep downstream unchanged") applies.

---

## 3. Browser Validation Matrix

Method: CDP (Chrome debug port 9222) against the Vite dev server (5173). `/rest/v1/exam_papers*` held to persist the skeleton; `/auth/v1/user` + `/rest/v1/users` fulfilled with CORS headers; `localStorage` theme + auth token seeded before each `?v=N` navigation. Profiles: APPSC_GROUPS (4 ids) and BANK_EXAMS.

| Viewport | Carousel | Grid | Grid cols | Cards/Slides | Card pad | CTA | Badge | Metric border | RM pulse |
|---|---|---|---|---|---|---|---|---|---|
| 390 dark | ON | OFF | — | 4 slides | 20px | 48/14, pinned | 28/14 | `--border-subtle`/0.3, 1px | 0.01ms |
| 414 dark | ON | OFF | — | 4 slides | 20px | 48/14, pinned | 28/14 | dark 1px | 0.01ms |
| 640 dark | OFF | ON | 2 (292px) | 8 cards | 20px | 48/14 | 28/14 | dark 1px | 0.01ms |
| 767 dark | OFF | ON | 2 (355.5px) | 8 cards | 20px | 48/14 | 28/14 | dark 1px | 0.01ms |
| 768 dark | OFF | ON | 2 (312px) | 8 cards | 24px | 48/14 | 28/14 | dark 1px | 0.01ms |
| 1024 dark | OFF | ON | 2 (348px) | 8 cards | 24px | 48/14 | 28/14 | dark 1px | 0.01ms |
| 1280 dark | OFF | ON | 4 (222px) | 8 cards | 24px | 48/14 | 28/14 | dark 1px | 0.01ms |
| 1440 dark | OFF | ON | 4 (262px) | 8 cards | 24px | 48/14 | 28/14 | dark 1px | 0.01ms |
| 390 light | ON | OFF | — | 4 slides | 20px | 48/14 | 28/14 | `--stat-card-border`/0.2, 1px | — |
| 768 light | OFF | ON | 2 (312px) | 8 cards | 24px | 48/14 | 28/14 | light 1px | — |
| 1440 light | OFF | ON | 4 (262px) | 8 cards | 24px | 48/14 | 28/14 | light 1px | — |

Accessibility regions (EX-3): APPSC → **2** status regions (one per skeleton, both `role="status"`); NONAPPSC → **1**.

Reduced motion (verified): `animation-duration: 0.01ms`, `animation-iteration-count: 1`, `transition-duration: 0.01ms`, `scroll-behavior: auto` (global collapse at `src/index.css:1059` applies).

**Result: all rows PASS.**

---

## 4. Accessibility

- Each skeleton remains a single `role="status"` + descriptive `aria-label` (selection / exam papers). No region explosion; NONAPPSC correctly yields exactly one region.
- Reduced-motion is honored globally; the carousel's `scroll-behavior: auto` under reduced motion prevents the `scroll-smooth` auto-scroll, matching the final grid's behavior.
- No `aria-hidden` focus trap changes; no content is keyboard-focusable during loading (all placeholders inert, matching final grid).
- Status: **no regression; EX-3 improves the a11y story by removing the phantom tabs for non-APPSC users.**

---

## 5. Build & Tests

- `npx tsc --noEmit` — **clean**.
- `npm run build` — **passes** (7 pre-existing CSS-optimizer warnings re wildcard arbitrary `var(--border-*)/--gold-*/--management-*/--text-*` utilities; unchanged by this work; compiled output confirmed to contain `p-5`, `p-6`, `md:p-6`).
- `npx eslint` on the 3 changed files — **clean**.
- `npm test` — **165 passed (5 files)**, 10 pre-existing `ERR_REQUIRE_ESM` worker-start errors (`@csstools/css-calc` ESM-in-CJS require chain in `@asamuzakjp/css-color`); exact known project baseline, **no new failures** and no test touches the changed files.

---

## 6. Original Audit Matrix → Status

| Category | Before | After | Verdict |
|---|---|---|---|
| EX-1 Mobile carousel slide geometry | fail (15% peek, no snap-always, wrong gap) | full-width `min-w-full snap-always` slide, gap-4, gutter-corrected | FIXED |
| EX-2 Breakpoint / grid columns | fail (carousel to 767, 1 col at 640) | carousel <640; 2/2/2/2/4 cols exact | FIXED |
| EX-3 Loading flow (phantom tabs) | fail (selection skeleton for non-APPSC) | `(authLoading || isAppsc)` gate | FIXED |
| EX-4 CTA geometry | fail (40/10, floated) | 48/14, footer divider, bottom-pinned | FIXED |
| EX-5 Metric border light | fail (`border-white/5`) | `border-subtle/30` / `stat-card-border/20` | FIXED |
| EX-6 Badge geometry | fail (56×22 r-full) | 56×28 r14 | FIXED |
| EX-7 Card padding | fail (`p-6` always) | `p-5 md:p-6` via `pad` prop | FIXED |
| EX-8 Slide count | low note (over-representation) | fixed count retained (allowed) | VERIFIED NO CHANGE REQUIRED |
| Downstream /active-exam | generic loader | unchanged (documented) | NO CHANGE |

---

## 7. Remaining Issues

1. **EX-8** — fixed count (8/4) intentionally retained; dynamic count would require an out-of-scope network request. No action.
2. **Residual audit notes** (Navigation / Filter categories, 3 pts) — no actionable page-scoped defect identified during this remediation; the /exams tab/filter skeleton-free behavior is unchanged and correct.
3. Downstream `/active-exam` generic loader — intentionally unchanged (security-init; out of scope).
4. Repo is broadly uncommitted vs HEAD (198 files dirty) — **no commit made**; only `UserExams.tsx` (M) plus `Skeleton.tsx`, `ExamGridSkeleton.tsx` (untracked) belong to this task.

---

## 8. Final Score

- **Original audit: 27/40** (Geometry 3 · Color 3 · Material 4 · Responsive 2 · Loading Flow 4 · Filter 4 · Navigation 3 · A11y 4).
- **Points recovered** (severity-weighted, matching the audit's HIGH=2 / MEDIUM=1 / LOW=1 scale): EX-1 (+2), EX-2 (+2), EX-3 (+1), EX-4 (+1), EX-5 (+1), EX-6 (+1), EX-7 (+1) = **+9**.
- **Re-scored: 36/40.**
- Points withheld (4): EX-8 (1, deliberately deferred/verified no-change per task instruction) + residual out-of-scope audit notes (3) with no actionable page-scoped defect.
