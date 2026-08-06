# Phase 3.6B — Admin Users Visual Comparison

**Before:** legacy `AdminUsersView` (outer `AdminCard` + desktop `DataGrid` + mobile `UserMobileCard` dual
path) and `UsersToolbar` (tabs-inside-toolbar + `FilterBar`/`FilterSelect` + total-users `Badge`).
**After:** Management Page Standard skeleton composed from certified Foundation components only.
**Render parity intent:** same information, same content hierarchy — surfaces resolve through the same
Foundation tokens (premium dark-neutral cards, selection surface, semantic badges).

---

# 1. Zone-by-Zone Comparison

| Zone | Before | After | Render note |
|---|---|---|---|
| Page title | `H1` sr-only (kept) | `H1` sr-only (kept) | unchanged |
| Exam tabs | `AdminTabTrack` + `ExamTabs` inside a `SectionReveal`; `ExamTabs` styled `bg-transparent border-none p-0 w-fit` | `SelectionContainer` layer: `AdminSelectionTabs` with `customExamTabs=EXAM_TABS`, `showPapers/showSubjects` off | tabs render through the certified selection surface; same `?exam=` semantics |
| Toolbar | `FilterBar` (borderless) with `Input` search + `FilterSelect` (Active/Banned Only) + `Badge` "`{n}` Users" (hidden on mobile) | `CollectionToolbar` (premium surface) with search `Input` + `CollectionFilter` (All / Active Only / Banned Only) | search field renders identically; status control now a certified `CollectionFilter`; total-users `Badge` removed (Blueprint D-5) → superseded by `CollectionHeader` range |
| Error (users) | `ErrorState message={error} onRetry` inside the card | page-level `Alert variant="error"` "Failed to load users" + `EmptyState` "Try Again" action (`handleRetry`) | retry preserved through certified primitives |
| Error (toggle) | (page-level `Alert` already) | page-level `Alert variant="error"` "Action failed" | unchanged behavior |
| List header | none (no select-all; no range) | `CollectionHeader` (select-all `SelectionCheckbox` + "Showing X–Y of Z") | **new** — selection per Management Page Standard (Blueprint §3 selection column) |
| Row — desktop | `DataGrid` row: icon avatar + name/email stack · exam `Badge` · attempts (value + "Completed" `Label`) · joined · status `Badge` · action `Button` | one responsive `CollectionCard layout="row" variant="premium" padding={16}`: leading = `SelectionCheckbox` + `UserIdentity` (avatar + name + email) · metadata = exam `Badge` + "`{n}` Attempts" + "Joined {date}" · trailing = Active/Banned `Badge` · actions = Activate/Deactivate `Button` | same data, same `Badge` semantics, same action button; content re-ordered into card anatomy |
| Row — mobile | `UserMobileCard`: bordered `bg-card-bg` card, avatar/name/email row + status, exam/attempts row, joined + action row | **same single `CollectionCard`** (no mobile path) | dual-path eliminated; the certified card scales to `flex-col` on small widths with identical information |
| Loading | `LoadingSkeleton` stack (`p-4 space-y-3`) in `AdminCard` | `GridSkeleton count={5} height={56} columns="grid-cols-1"` | equivalent skeleton rhythm |
| Empty | `EmptyState` (Users icon, "No Students Found") | `EmptyState` (Search icon, "No Students Found", retry on error) | preserved; icon/title standardised |
| Pagination | footer row: "Page X of Y" + two `IconButton` chevrons (border-top) | certified `Pagination` (1-based `page` mapped `page-1` → `onPageChange` writes `+1`) | same 1-based contract at the page; Foundation pagination component |
| Overlays | `ConfirmModal` + `ToastContainer` (kept) | `ConfirmModal` + `ToastContainer` (kept) | unchanged |
| Wrapper | `AdminCard className="overflow-hidden p-0"` outer card | no outer card — `SectionReveal` + `Stack gap="lg"` | forbidden outer wrapper Card eliminated |

---

# 2. Skeleton Comparison

| Standard zone | Before | After |
|---|---|---|
| Selection | tabs styled into the toolbar flow, no selection surface | `SelectionContainer` (certified) |
| Toolbar | bare `FilterBar` | `CollectionToolbar` premium surface |
| List | `DataGrid` + `UserMobileCard` | `CollectionCard` list |
| Pagination | custom footer | `Pagination` Foundation |
| Empty | `EmptyState` inside card | `EmptyState` after table |
| Overlays | `ConfirmModal` + `ToastContainer` | unchanged |

---

# 3. Visual-Only Deltas (deliberate, per Blueprint D-series decisions)

| # | Delta | Decision |
|---|---|---|
| 1 | Total-users `Badge` removed | D-5 — range now lives in `CollectionHeader`; count still visible ("Showing X–Y of Z") |
| 2 | Status control gains an `All` option | D-4 — `CollectionFilter` (All / Active Only / Banned Only); default still `'active'` |
| 3 | "Completed" micro-label under attempts removed | folded into the "`{n}` Attempts" metadata line (Blueprint §3 metadata) |
| 4 | Select-all checkbox added to list header | Blueprint §3 selection column (Management Page Standard) |
| 5 | Error retry moves from in-card `ErrorState` to `EmptyState` "Try Again" + page `Alert` | Blueprint row 12 (ErrorState → Alert) |

---

# 4. Layout Metrics After

| Meter | Value |
|---|---|
| Page sections gap | 24px (`Stack gap="lg"`) |
| Card-to-card gap | 12px (`gap-3`) |
| Row leading group gap | 8px (`gap-2`) |
| Header/list/pagination gap | 24px (`gap-6`) |
| Toolbar padding | `p-3 md:p-4` (CollectionToolbar) |
| Card padding | 16px (`CollectionCard padding={16}`) |
| Action button | `Button size="xs"` |

---

# 5. Conclusion

All information previously visible on `/admin/users` remains present in the same content hierarchy,
rendered through the certified Management Page Standard skeleton. The only visual removals are
`UserMobileCard`'s page-owned card treatment and the toolbar total `Badge`, both replaced by
certified equivalents. **Render parity confirmed at the data + token level; no page-authored CSS.**
