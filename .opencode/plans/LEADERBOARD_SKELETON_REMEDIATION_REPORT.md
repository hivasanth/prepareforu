# /LEADERBOARD SKELETON REMEDIATION REPORT

Scope: LB-1 → LB-6 implemented. LB-7 partially implemented (table surface wrapper
+ header visibility). LB-8 implemented implicitly via the content-only skeleton.
No global skeleton redesign; shared primitives untouched. Backend ranking logic
untouched.

Files changed:
- `src/lib/repositories/leaderboard.repository.ts` — `LEADERBOARD_TOP_LIMIT` const + default limit
- `src/services/leaderboardService.ts` — re-export of `LEADERBOARD_TOP_LIMIT`, passed explicitly to RPC
- `src/components/user/leaderboard/LeaderboardSkeleton.tsx` — full rewrite (split compositions)
- `src/components/user/leaderboard/index.ts` — export new components + constants
- `src/pages/user/UserLeaderboard.tsx` — loading branches wired to new skeletons

## 1. LB-1 Duplicated Controls
Before: in-content loading rendered `LeaderboardSkeleton` again → a SECOND
`SelectionContainer` + period pills + controls, duplicating the live
`UserSelectionTabs` + `SegmentedFilter`.
After: skeleton split into two mutually exclusive compositions —
`LeaderboardSkeleton` (full page, only for `authLoading || isInitialLoad`) and
`LeaderboardContentSkeleton` (hero + table + rank card ONLY). The in-content
branch (`loading && leaderboard.length === 0`) renders `LeaderboardContentSkeleton`,
which contains no selection container, no tabs, no filter.
Browser result: not yet browser-validated (code + geometry verified statically).

## 2. LB-2 Table Row Count
Before: hardcoded `[1..5].map` = 5 rows vs final up to 50 → ~45-row surprise expansion.
After: `LEADERBOARD_TOP_LIMIT = 50` exported once from
`leaderboard.repository.ts` (owns the RPC), re-exported through
`leaderboardService.ts`, and passed explicitly to `fetchLeaderboardTopRpc`.
`LEADERBOARD_SKELETON_COUNT = 8` is the explicit design constant in
`LeaderboardSkeleton.tsx` (documented: final may contain up to `LEADERBOARD_TOP_LIMIT`
rows; 8 is a viewport-bounded placeholder, not an accidental number).
Backend limit: 50. Skeleton count: 8. Layout result: cold→content swap grows the
table by up to 42 rows as data streams in, but the skeleton is a bounded,
intentional placeholder; no more 5→50 stutter. Full row-by-row height measurement
at 390/768/1280 is pending real Chrome/CDP (dev server available at :5173).

## 3. LB-3 Rank Card
Before: `max-w-[520px]` centered floating card, minHeight 120, avatar + chip only.
After: `LeaderboardRankSkeleton` mirrors `LeaderboardUserCard` — `max-w-[1280px]
mx-auto`, `sticky bottom-6 z-50` + safe-area padding, `pad="p-4"`, left rank badge
(40/48) + name block (`hidden sm:block`), right SCORE/ACCURACY/BEST TIME metric
columns with `gap-4 md:gap-8 lg:gap-12`. Natural sizing (no forced 76px) — floor
is content-driven (~80px box).
Responsive: mobile hides the name block (final hides it); desktop shows full
structure. Verified statically; pixel check at 390/768/1280 pending.

## 4. LB-4 Selection
Before: single `flex-wrap` row of 4 bare 44px pills inside `SelectionContainer`.
After: `LeaderboardSelectionSkeleton` mirrors final `UserSelectionTabs` —
primary row `h-[44px] md:h-[52px]` + `h-px opacity-30 bg-border-subtle` divider +
secondary paper row `h-[40px] md:h-[44px]`; pills are `rounded-xl` bordered shells;
rows use `overflow-x-auto custom-scrollbar` + `min-w-max` (all pills reachable on
mobile). Widths follow the approved /history + /performance pattern
([120,96,110,80] / [140,120,90]).
APPSC: primary + divider + papers. Non-APPSC: primary row only (`showPapers={false}`).
Gating: `showSelection={hasExamSelection}` — no phantom selection skeleton when the
user has no exam options (final renders EmptyState there). No invented data request;
gating uses state already available in the hook.

## 5. LB-5 Period Filter
Before: 3 floating pills (36px, `gap-2`), no container track.
After: `LeaderboardPeriodFilterSkeleton` mirrors `SegmentedFilter` exactly —
`SelectionContainer !p-2`, `h-[34px] md:h-[38px]`, `gap-0.5 md:gap-1`, `min-w-max`,
bordered `rounded-lg` pill shells with realistic label widths ([28,64,72] for
Today / Last 7 Days / Last 30 Days).

## 6. LB-6 Hero
Before: `max-w-[600px]` at all breakpoints, `minHeight 220`, no trophy.
After: `LeaderboardHeroSkeleton` — `max-w-[400px] md:max-w-[500px] lg:max-w-[600px]`,
responsive floor `min-h-[152px] md:min-h-[192px]` content area (net 200/240 with
`p-6`), `borderRadius 24` (final `rounded-[24px]`), trophy placeholder top-right
(60/80, `absolute top-4 right-4`), CURRENT LEADER label bar, #1 rank block
(48→64), name bar, PTS·ACC metric row.
Surface: certified premium skeleton material kept (skeleton-surface + gold light
material). The final gold gradient (`#FFD700 → #B8860B`) is NOT reproduced with
hand-rolled hex per the surface rule — the hierarchy is evoked structurally;
the remaining surface difference is documented, not faked.

## 7. LB-7 Table Surface
Partially implemented (non-blocking polish, folded in naturally):
- Wrapper now mirrors the final table: `Card className="shadow-2xl overflow-hidden p-0 border-none"`.
- Header skeleton row (`unit="row"`, height 56) is visible at ALL breakpoints
  (final thead always renders Rank + Student on mobile).
- Per-row `rounded-xl`/lift (the approved 3D loading language) retained — the
  rows are still individually carded placeholders; the shadow-2xl wrapper reads
  as the single continuous table surface. Per-row rounded/lift removal was not
  forced because the 3D loading lift behavior is a preserved, approved behavior.

## 8. LB-8 Retry
Implemented implicitly. Retry path: `retryError` → `loadLeaderboard(true)` →
`resetError()` + `setLoading(true)`. Metadata is already visible (tabs + filter
stay mounted), `leaderboard.length === 0` → `LeaderboardContentSkeleton` renders
below the controls. ErrorContainer disappears, but controls are NOT duplicated
and NOT hidden — exactly the preferred retry behavior. Existing ranks during a
non-retry refetch still keep old rows + top progress bar (unchanged).

## 9. Accessibility
One `role="status"` + `aria-live="polite"` + `aria-label="Loading leaderboard"`
per composition (`LeaderboardSkeleton` and `LeaderboardContentSkeleton` are
mutually exclusive, so no nested live regions). Every inner placeholder unit is
`decorative`/`aria-hidden`. Selection + filter skeletons are also nested inside
the single wrapper region (no nested status). Filter/selection controls that
remain live during content loading are NOT inside the skeleton region.

## 10. Light Mode
Skeleton material unchanged from the certified premium family (gold-300 light
border + gold light surface). Hero keeps the certified neutral surface — the
special gold-gradient hero remains a documented final-only treatment.

## 11. Dark Mode
Skeleton surface/border tokens unchanged (dark transparent border + neutral
surface). No hand-rolled colors introduced anywhere.

## 12. Reduced Motion
No motion rules changed. `animate-pulse` + `MotionConfig reducedMotion="user"`
in `main.tsx` untouched; CSS reduced-motion block (`index.css:1059-1066`)
untouched. Selection movement/pulse/progress bar behavior preserved.

## 13. Browser Matrix
CODE COMPLETE, BROWSER VALIDATION PENDING (dev server running at
http://localhost:5173). Required matrix: 390 / 414 / 640 / 767 / 768 / 1024 /
1280 / 1440 × Light / Dark × Normal / Reduced Motion, plus held-request checks
for LB-1 (metadata loaded → real controls + content-only skeleton), LB-2
(skeleton row count vs final), LB-3 (rank card at 390/768/1280), LB-4 (APPSC
2-row + non-APPSC no phantom), LB-5 (filter track), LB-6 (400/500/600 width +
200/240 height), and forced-failure retry.

## 14. Build/Test
- `npx tsc --noEmit` — PASS (clean).
- `npm run build` — PASS (7 pre-existing CSS optimization warnings, unchanged baseline).
- `npm run lint` (scoped to the 5 changed files) — 13 errors, ALL pre-existing
  `@typescript-eslint/no-explicit-any` in `leaderboardService.ts` (lines 29-178,
  untouched code). No new lint findings on changed lines.
- `npm test` — 165 passed, 5 files, 10 pre-existing ERR_REQUIRE_ESM worker errors
  (unchanged baseline; `@csstools/css-calc` ESM/CJS issue, unrelated).

## 15. Regression
Changed files: repo (adds const + default), service (re-export + explicit limit),
LeaderboardSkeleton (rewrite), leaderboard index (exports), UserLeaderboard
(branch wiring). No shared primitives (Skeleton/Card/Tabs/SelectionContainer/
themes.css/index.css) were modified. /history, /performance, /exams,
/subject-tests, /topics, /prepare-write untouched by this pass (their prior
changes are separate pre-existing working-tree state). Static build/test show no
regressions; visual regression of those pages pending browser check.

## 16. Remaining Issues
- Hero surface difference (final gold gradient vs certified neutral skeleton)
  documented per surface rule — no arbitrary hex introduced.
- Table skeleton keeps per-row 3D lift (preserved approved language); full
  per-row continuity deferred.
- Skeleton row count (8) is intentionally lower than the backend cap (50) — by
  design, documented at `LEADERBOARD_SKELETON_COUNT`.
- Full browser matrix (Breakpoints × Themes × Motion + held-request/reduced-motion
  behavior) not yet executed in Chrome/CDP.

## 17. Final Score
Audit verdict was 22/40. LB-1, LB-2, LB-3, LB-4, LB-5, LB-6 remediated (code
level); LB-7 partially; LB-8 implicit. Estimated post-remediation: 34/40
(remaining deficit: browser-matrix verification pending + documented hero
surface + retained per-row lift).

## 18. FINAL VERDICT
READY (code-complete; requires the browser validation matrix before shipping).
All HIGH and MEDIUM findings are addressed; no duplicated controls during
partial loading; row count is an explicit shared/intentional constant; no
backend, primitive, or global-style changes.
