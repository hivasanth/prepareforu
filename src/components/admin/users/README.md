# Admin Users

Feature directory for Admin → Users management.

## Architecture

```
AdminUsers.tsx (page, 45 lines)
└── useAdminUsers (hook, 122 lines) — fetch, filter, paginate, toggle status
    ├── useAuth (shared — current user for authorization)
    ├── useToast (shared — notifications)
    └── userService → user.repository (Supabase)
├── AdminUsersView — main content component with DataGrid + mobile cards
│   ├── UsersToolbar — exam tabs + search input + status filter + user count
│   └── UsersPagination — prev/next with page indicator
└── UserMobileCard — mobile card with avatar, name, email, status, toggle
```

## Key Decisions

- `useAdminUsers` owns all state with optimistic status updates (reverts on failure)
- URL-based exam tab selection (`?exam=`) via `useSearchParams` — consistent with admin filter strategy
- `fetchIdRef` pattern for request deduplication (cancels stale fetches)
- `users` derived via `useMemo` from fetched data + optimistic status overlay
- All presentational components wrapped in `memo`
- `toggleUserStatus` uses service-layer role enforcement (`ensureRole` for admin)
