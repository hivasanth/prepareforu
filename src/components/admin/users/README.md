# Admin Users

Feature directory for Admin → Users management.

## Architecture

```
AdminUsers.tsx (page)
└── useAdminUsers (hook) — fetch, filter, paginate, toggle status
    ├── useAuth (shared — current user for authorization)
    ├── useToast (shared — notifications)
    └── userService → user.repository (Supabase)
├── UsersActions — search input + status filter (CollectionToolbar)
├── UsersTable — FloatingList table
│   ├── FloatingListHeader (padding="md") — shared column grid header
│   ├── FloatingListItem (padding="md") × N — rows on the same grid contract
│   │   └── UserIdentity — avatar + name + email (min-w-0 truncation)
│   └── Pagination (shared)
└── ConfirmModal + ToastContainer (shared) — toggle confirmation flow
```

## Responsive column contract

`UsersTable` defines ONE `USER_TABLE_GRID` constant consumed by both the
header and every row, so column geometry can never diverge:

- `< md`: participant | status | action (fixed px status/action tracks)
- `md`: + exam
- `lg`: + exams taken + joined

Header and rows both render with `padding="md"` (16px inset) and a 1px
border so their content-box origins are identical at every breakpoint.

## Key Decisions

- `useAdminUsers` owns all state with optimistic status updates (reverts on failure)
- URL-based exam tab selection (`?exam=`) via `useSearchParams` — consistent with admin filter strategy
- `fetchIdRef` pattern for request deduplication (cancels stale fetches)
- `users` derived via `useMemo` from fetched data + optimistic status overlay
- All presentational components wrapped in `memo`
- `toggleUserStatus` uses service-layer role enforcement (`ensureRole` for admin)
