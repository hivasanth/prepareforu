# USER_DASHBOARD_IMPLEMENTATION_BACKLOG.md

Phase 6.XA — Page Production Certification Audit · User Dashboard (`/dashboard`)
Read-only implementation backlog derived from the audit findings.

## S17 — Implementation Readiness

> Scope gate: Phase 6.XA is READ-ONLY. The items below are the backlog for the
> subsequent **Phase 6.XB** implementation. `VERIFY` items require database-side
> inspection, not code changes on this page.

### Backlog (ordered)

| Order | ID | Class | Severity | Effort | Risk | Finding |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | USR-SEC-01 | VERIFY | Verify | 1–2h | High | Confirm RPC `get_user_dashboard_stats` filters by `auth.uid()`/RLS server-side. |
| 2 | USR-ARC-01 / USR-CQ-01 | REFACTOR | Low | 1h | Low | Re-home/alias `fetchDashboardRecentAttempts` out of `performanceService` coupling. |
| 3 | USR-ARC-03 / USR-CQ-02 | UX | Low | 0.5h | Low | Confirm intentionality of duplicate `/exams` CTAs. |
| 4 | USR-UX-01 | UX | Low | 1h | Low | Decouple `isRetrying` between the two dashboard sections. |
| 5 | USR-FND-01 | FOUNDATION | Medium | 1–2h | Low | Add loading-layer token; replace hardcoded `#080810`/`#a78bfa` in Guards/AuthContext. |
| 6 | USR-FND-02 | FOUNDATION | Medium | 1h | Low | Expose certified radius token; replace arbitrary `borderRadius`/`rounded-[…]` values. |
| 7 | USR-FND-03 | FOUNDATION | Medium | 1h | Low | Replace emoji-as-icon fallbacks in EmptyState/ErrorState with lucide icon language. |
| 8 | USR-FND-04 | FOUNDATION | Low | 0.5h | Low | Replace arbitrary `shadow-[…]` utilities with certified shadow utility classes. |

### Partitioning by governance boundary

- **Page-owned (Phase 6.XB, code)**: `USR-ARC-01`, `USR-ARC-03`, `USR-CQ-01/02`,
  `USR-UX-01`, `USR-FND-05`.
- **Package-owned (Phase 6.XB, code)**: none for this page.
- **Foundation-owned (separate Foundation backlog)**: `USR-FND-01..04`.
- **Verify-only (DB, Phase 6.XB)**: `USR-SEC-01`.

### Ordering rationale

`USR-SEC-01` first (security boundary), then low-effort/low-risk refactors.
Foundation items are batched into the Foundation backlog independently.

## Related sections
All section verifies + S17 score build from this backlog.