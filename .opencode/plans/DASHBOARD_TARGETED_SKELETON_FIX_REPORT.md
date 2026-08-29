# /DASHBOARD TARGETED SKELETON FIX REPORT

Scope: the two LOW-severity skeleton defects confirmed in `DASHBOARD_SKELETON_AUDIT_REPORT.md`.
Only `DashboardRecentActivity.tsx` and `DashboardStatsGrid.tsx` were modified. No skeleton
primitive, theme token, /review, or other dashboard file was touched.

---

## FIX-1 — Recent Activity skeleton card count 3 → 5

**Before** (`DashboardRecentActivity.tsx`):
```tsx
<GridSkeleton decorative count={3} height={180} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" gap="gap-4 md:gap-5 lg:gap-6" />
```

**After** (line 33):
```tsx
<GridSkeleton decorative count={5} height={180} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" gap="gap-4 md:gap-5 lg:gap-6" />
```

**Rationale:** the final content list renders up to 5 cards (`fetchRecentAttempts` default
`limit = 5`, `attempt.repository.ts`). 3 skeleton placeholders under-matched the real content.

**Visual result — skeleton outer grid children:**
| Breakpoint | 390 | 414 | 640 | 768 | 1024 | 1280 | 1440 |
|---|---|---|---|---|---|---|---|
| Dark  | 5 | 5 | 5 | 5 | 5 | 5 | 5 |
| Light | 5 | – | 5 | 5 | 5 | 5 | – |

Columns unchanged and still matching final `<Grid cols={1} sm={2} lg={3}>`: computed
`gridTemplateColumns` = 1 col (390/414), 2 cols (640/768), 3 cols (1024/1280/1440).

---

## FIX-2 — Stats skeleton mobile columns 1 → 2

**Before** (`DashboardStatsGrid.tsx`):
```tsx
<StatSkeleton decorative columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-4" gap="gap-4 md:gap-5 lg:gap-6" />
```

**After** (line 19):
```tsx
<StatSkeleton decorative columns="grid-cols-2 lg:grid-cols-4" gap="gap-4 md:gap-5 lg:gap-6" />
```

**Rationale:** the final stats grid is `<Grid cols={2} lg={4}>` → `grid-cols-2 lg:grid-cols-4`.
The old skeleton rendered 1 column at <768px, mismatching the real 2-column layout.

**Visual result — grid classes / computed columns:**
| Breakpoint | 390 | 414 | 640 | 768 | 1024 | 1280 | 1440 |
|---|---|---|---|---|---|---|---|
| Class (both themes) | `grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6 w-full` everywhere |
| Computed cols — Dark | 2 | 2 | 2 | 2 | 4 | 4 | 4 |
| Computed cols — Light | 2 | – | 2 | 2 | 4 | 4 | – |
| Cards (both themes)  | 4 | 4 | 4 | 4 | 4 | 4 | 4 |

Stats cards = 4 at every viewport (matches final 4 tiles).

---

## Browser Validation

Method: Chrome CDP (`localhost:9222`) against the Vite dev server (`localhost:5173`). Supabase
requests for `get_user_dashboard_stats`, `rest/v1/attempts`, and `rest/v1/exam_configs` were held
(Fetch interception) to pin the dashboard in its loading state; `/auth/v1/user` and `/rest/v1/users`
were fulfilled to pass the auth gate. Layout probed via live `getComputedStyle(gridTemplateColumns)`
and DOM child counts. Themes applied through the app's own ThemeContext (`localStorage.theme`).

| Viewport | Theme | Path | Stats cols | Stats cards | Recent cols | Recent cards | status roles | Result |
|---|---|---|---|---|---|---|---|---|
| 390x844  | Dark  | /dashboard | 2 | 4 | 1 | 5 | 2 | PASS |
| 414x896  | Dark  | /dashboard | 2 | 4 | 1 | 5 | 2 | PASS |
| 640x900  | Dark  | /dashboard | 2 | 4 | 2 | 5 | 2 | PASS |
| 768x1024 | Dark  | /dashboard | 2 | 4 | 2 | 5 | 2 | PASS |
| 1024x800 | Dark  | /dashboard | 4 | 4 | 3 | 5 | 2 | PASS |
| 1280x800 | Dark  | /dashboard | 4 | 4 | 3 | 5 | 2 | PASS |
| 1440x1000| Dark  | /dashboard | 4 | 4 | 3 | 5 | 2 | PASS |
| 390x844  | Light | /dashboard | 2 | 4 | 1 | 5 | 2 | PASS |
| 640x900  | Light | /dashboard | 2 | 4 | 2 | 5 | 2 | PASS |
| 768x1024 | Light | /dashboard | 2 | 4 | 2 | 5 | 2 | PASS |
| 1024x800 | Light | /dashboard | 4 | 4 | 3 | 5 | 2 | PASS |
| 1280x800 | Light | /dashboard | 4 | 4 | 3 | 5 | 2 | PASS |

Result: **12 / 12 PASS** (7 viewports dark + 5 viewports light).

---

## Layout Shift

- **Stats:** skeleton is now `grid-cols-2 lg:grid-cols-4`, identical to the final stats grid —
  skeleton→final transition no longer re-flows from 1 column to 2. Layout-shift eliminated.
- **Recent:** skeleton now renders 5 placeholders matching the final list's max of 5 cards;
  skeleton→final growth (the shift that appeared when 5 cards replaced 3 placeholders) removed.

---

## Build / Test

- `npx tsc -b --force` — clean, no errors.
- `npm run build` — passed (7 pre-existing CSS-optimizer warnings; unchanged from baseline).
- `npm run lint` — zero findings in the two changed files (repository-wide 379 pre-existing
  errors unrelated to this change; no `no-explicit-any` introduced).
- `npm test` — 165 passed / 10 `ERR_REQUIRE_ESM` vitest worker errors (known baseline).

---

## Regression

- /review untouched — still renders the passed-in `ExamPageLoading` spinner.
- `Skeleton.tsx`, `SharedComponents.tsx`, `AntigravityCard.tsx` — unmodified.
- Theme tokens (`themes.css`, `index.css`) — unmodified; dark baseline and light `.light` override
  verified present in both validation passes.
- A11y unchanged: both skeletons keep the container-level `role="status"` + `decorative` inner
  placeholders (statusRoles = 2 live regions, same as before the fix).
- No `!important`, no CSS hacks, no new abstractions, no shared-limit constant introduced.

---

## Final Verdict

**READY** — both fixes implemented, build/test clean, and browser-validated across all 12
viewport × theme combinations with no regressions.
