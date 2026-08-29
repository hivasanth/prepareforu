# USER_DASHBOARD_ACCESSIBILITY_AUDIT.md

Phase 6.XA — Page Production Certification Audit · User Dashboard (`/dashboard`)
Read-only accessibility audit.

## S12 — Accessibility

### Semantic structure & landmarks

- Single visually-hidden `H1` `"Dashboard"` (`UserDashboard.tsx:27`) — one H1 per page.
- `WelcomeBanner` uses `role="banner"` + `aria-label="Welcome"` (landmark)
  (`WelcomeBanner.tsx:80-82`).
- Loading wrappers expose `role="status" aria-live="polite"` +
  `aria-label` (`DashboardStatsGrid.tsx:18`, `DashboardRecentActivity.tsx:32`).
- Error experiences expose `role="alert" aria-live="assertive"`
  (`ErrorContainer.tsx:82-83`).

### Keyboard & focus

- `RecentAttemptCard` via `AttemptCardBase` renders `role="button"`, `tabIndex=0`,
  and handles `Enter`/`Space` (`AttemptCardBase.tsx`) — keyboard-operable cards.
- `RetryButton` is a real `<Button>` — natively focusable.

### Icons & decorative content

- Decorative hero image is `aria-hidden` (`WelcomeBanner.tsx:86-90`).
- `BarChart3` empty-state icon is `aria-hidden` (`DashboardRecentActivity.tsx:45`).
- `RecentAttemptCard` provides an `aria-label` including score/accuracy for
  screen readers.

### Findings

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| USR-A11Y-01 | Low | The visible hero name (`Typography role="display" as="h2"`) and the `H2` "Recent Activity" introduce an implicit heading grouping without a visible H1; acceptable per single-H1 guidance but worth confirming screen-reader announcements of the sr-only H1. | `UserDashboard.tsx:27`; `WelcomeBanner.tsx:97` |

### Verdict

**PASS** — strong semantic roles, live-region loading/error announcements,
keyboard-operable cards, and decorative-only imagery.

## Related sections
S2 (loading), S3 (error), S12 (reusability language), S10 (UX).