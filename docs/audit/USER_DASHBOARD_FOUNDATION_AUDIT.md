# USER_DASHBOARD_FOUNDATION_AUDIT.md

Phase 6.XA — Page Production Certification Audit · User Dashboard (`/dashboard`)
Read-only Foundation-compliance audit of the page and its dependency tree.

## S8 — Foundation Compliance & S16 — Design System

### Governing rule

Per the FINAL RULE (D-179): problems solvable once in the Foundation must NOT be
solved in pages; pages fix page-specific issues only. Findings below are tagged
`PAGE` (page-owned, fixable in this page's backlog) or `FOUNDATION` (must be
recorded for the Foundation backlog, not fixed on the page).

### Evidence: certified token usage on the page

All token names below are registered in the CSS/token layer (verified via
`index.css` / `themes.css`).

| Token | Registration | Used by |
| --- | --- | --- |
| `bg-card-premium-surface` | `index.css:127` | `WelcomeBanner.tsx:83` |
| `shadow-elevation-2` | `index.css:114` | `WelcomeBanner.tsx:83` |
| `border-border-subtle` | `index.css:88` | `WelcomeBanner.tsx:83` |
| `text-on-dark` | `index.css:67` | `WelcomeBanner.tsx:94,97,100,107,108` |
| `bg-app-bg`, `text-text-primary/secondary`, `bg-primary/10`, `bg-secondary/10` | themes | `SharedComponents.tsx` (LoadingOverlay) |

The hero surface (`WelcomeBanner`) consumes only certified Layer-2 semantic
surface/type tokens — this is the intended Foundation-aligned pattern.

### Findings

| ID | Class | Severity | Finding | Evidence |
| --- | --- | --- | --- | --- |
| USR-FND-01 | FOUNDATION | Medium | `GuardLoader` hardcodes `background:'#080810'` and `AuthContext.FullLoader` hardcodes `#080810` / `#a78bfa` inline — token-discipline violation; Foundation should own a loading-layer token. | `Guards.tsx`; `AuthContext.tsx:47-58` |
| USR-FND-02 | FOUNDATION | Medium | Arbitrary radii bypass the token scale: `borderRadius={24}` (recent-activity skeletons, grid/stat skeletons) and `rounded-[10px]`/`[32px]`. Foundation should expose a certified radius token. | `DashboardRecentActivity.tsx:34`; `GridSkeleton.tsx:30`; `StatSkeleton.tsx:40,41` |
| USR-FND-03 | FOUNDATION | Medium | Emoji-as-icon fallbacks: `EmptyState` default `icon='📂'` and `ErrorState` fallback `⚠️` conflict with the lucide Icon Language. | `SharedComponents.tsx:145,117` |
| USR-FND-04 | FOUNDATION | Low | Arbitrary-value utilities `shadow-[var(--card-shadow)]` / `shadow-premium-card` used within Foundation-owned surface recipes. | `SharedComponents.tsx:164`; `Skeleton.tsx` |
| USR-FND-05 | PAGE | Info | `DashboardStatsGrid.tsx:29` uses `status="warning"` (yellow) for the positive STREAK metric — semantic-tint preference owned by the page. | `DashboardStatsGrid.tsx:29` |

### Verdict

**PARTIAL** — the page itself is token-clean (`WelcomeBanner` fully certified).
The notable compliance gaps (`USR-FND-01..04`) are Foundation-owned and must be
recorded in the Foundation backlog rather than patched on the page. Only
`USR-FND-05` is a page-level item.

## Related sections
S9 (UI consistency), S16 (design system), S13 (reusability),
S19 (recommendations), S17 (implementation readiness).