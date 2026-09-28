# Admin Leaderboard

Feature directory for Admin → Leaderboard — administrative ranking and leaderboard display.

## Architecture

```
AdminLeaderboard.tsx (page)
├── H1 (sr-only) — accessible page heading
├── AdminSelectionTabs — exam/paper filter tabs
├── useAdminLeaderboard (hook) — fetch, paginate, exam validation
│   ├── useAdminFilters (shared — URL-based exam/paper filter state)
│   └── leaderboardService → leaderboard.repository → get_admin_leaderboard RPC
├── LeaderboardSkeleton — shape-matched loading state (Skeleton primitive + shared grid)
├── LeaderboardView — single responsive row model using FloatingList
│   ├── FloatingListHeader padding="none" — column header (premium gold surface)
│   ├── FloatingListItem padding="none" — one per entry
│   │   ├── CSS Grid: rank, name, score, duration, attempts, last active
│   │   ├── RankBadge — medal icon + rank number with tier styling
│   │   │   (documented intentional exception — see design-system-reference.md)
│   │   └── Avatar — canonical participant monogram
│   └── Pill — score (success), duration (info), attempts (neutral)
└── Pagination — prev/next with page indicator
```

## Responsive Grid

ONE shared contract — `LEADERBOARD_GRID` + `LEADERBOARD_CELL` in `LeaderboardView.tsx` —
consumed by the header, every row, AND the skeleton. Deterministic fixed metric
tracks + flexible participant column; no `auto`/`max-content` metric tracks.

| Breakpoint | Visible columns |
|------------|----------------|
| < lg       | Rank, Participant, Score |
| lg–xl      | Rank, Participant, Score, Duration, Attempts, Last Active |
| xl+        | Same columns with widened xl tracks |

Header and rows share an identical content-box origin: both use
`padding="none"` materials plus the grid's own `px-1` inset.

## Data Sources

- **Single authoritative read path**: the admin-guarded `get_admin_leaderboard`
  SECURITY DEFINER RPC (`supabase/migrations/20260821000000_admin_leaderboard_security_rank.sql`)
- **Paper-scoped** (`paperId` set): reads the precomputed `leaderboard` table,
  joins user names server-side
- **Exam-aggregate** (`paperId` null): reads the `admin_leaderboard_view`
  materialized view
- **Rank is database-authoritative**: global ROW_NUMBER over the same
  deterministic order used for pagination (score DESC, accuracy DESC, time ASC,
  submitted_at ASC, user_id ASC) — ranks continue across pages; the client
  never recomputes them

## Refresh Architecture

The materialized view is refreshed SERVER-SIDE by pg_cron
(`'refresh-materialized-views'`, every 10 minutes) and table ranks by
`'refresh-leaderboard-ranks'` (every 5 minutes). Browser sessions never trigger
MV refresh. `refresh_leaderboard_view()` remains only as an admin-guarded
maintenance RPC.

## Key Decisions

- `useAdminLeaderboard` owns pagination state and exam validation — extracted from the page for SRP
- `useSupabaseQuery` handles caching, cross-tab invalidation, and error normalization
- Participant names are normalized once at the service boundary (`Unknown`
  fallback); the UI assumes a safe non-empty string
- `LeaderboardView` uses `React.memo` — the only memoized component (performance justified by 50-row table re-renders on filter change)
- Page is pure composition — no state management beyond hook calls
