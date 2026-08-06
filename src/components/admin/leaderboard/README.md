# Admin Leaderboard

Feature directory for Admin → Leaderboard — administrative ranking and leaderboard display.

## Architecture

```
AdminLeaderboard.tsx (page, 61 lines)
└── useAdminLeaderboard (hook, 63 lines) — fetch, paginate, refresh cooldown, exam validation
    ├── useAdminFilters (shared — URL-based exam/paper filter state)
    └── leaderboardService → leaderboard.repository (Supabase)
├── LeaderboardView — responsive table (md+) / tablet cards (sm) / mobile cards (xs)
│   ├── LeaderboardMobileCard — compact card for xs breakpoint
│   ├── LeaderboardTabletCard — grid card for sm breakpoint
│   └── RankBadge — medal icon + rank number with tier styling
└── LeaderboardPagination — prev/next with page indicator
```

## Data Sources

- **Paper-specific**: queries `leaderboard` view, enriches with user names via `fetchUserNamesByIds`, applies `assignRanks` client-side
- **All papers**: queries `admin_leaderboard_view` materialized view with pre-joined user data
- **APPSC_GROUPS**: aggregates across `APPSC_GROUP_1` through `APPSC_GROUP_4`

## Key Decisions

- `useAdminLeaderboard` owns pagination state, refresh cooldown (30s), and exam validation — extracted from the page for SRP
- `useSupabaseQuery` handles caching, cross-tab invalidation, and error normalization
- `assignRanks` (in `utils/rankUtils.ts`) is a pure utility — no ranking logic lives in the hook or service
- Two data paths (paper vs. all) abstracted behind `fetchAdminLeaderboard` in the service layer
- `LeaderboardView` uses `React.memo` — the only memoized component (performance justified by 50-row table re-renders on filter change)
- Page is pure composition — no state management beyond hook calls
