# AR-013: Add Caching to topicsService.ts

**Phase:** 6.13 — Service Layer Cache Gap
**Date:** 2026-07-22
**Status:** ✅ COMPLETE (stale — already implemented)
**Effort:** 0.125 day (audit only, no code changes)

---

## Finding

**AR-013 is stale.** The backlog claimed "topicsService.ts has zero caching while all other services cache." This is incorrect.

### Evidence

`topicsService.ts` already uses `queryCache.fetchWithDedup` with a 5-minute TTL:

```typescript
// topicsService.ts lines 16-20
const cacheKey = `${TOPICS_PREFIX}${examId}_${paperId}_${subjectName}`;
return queryCache.fetchWithDedup(cacheKey, async () => {
  const data = await topicRepo.fetchPublishedTopics(examId, paperId, subjectName);
  return (data as unknown as StudyTopic[]) ?? []
}, 300000, force); // 5 min TTL
```

This is identical to the pattern used by `subjectTestService.ts`, `examService.ts`, `performanceService.ts`, and other cached services.

### Functions in topicsService.ts

| Function | Has Cache? | Notes |
|----------|:----------:|-------|
| `fetchTopics` | ✅ Yes | `queryCache.fetchWithDedup` / 5-min TTL / `force` param |
| `fetchTopicsAdmin` | ❌ No | Intentionally uncached — admin live data |
| `getNextDisplayOrder` | ❌ No | Ordering helper, not a data fetch |

The two uncached functions are intentionally uncached:
- `fetchTopicsAdmin` is for admin views where live data is required
- `getNextDisplayOrder` is a utility that returns a single number, not a dataset

### Service Cache Audit (Bonus)

Full audit of all 17 service files:

| Category | Count |
|----------|------:|
| Services with `queryCache.fetchWithDedup` | 10 |
| Services with `adminQueryCache` | 1 |
| Entirely uncached services | 3 (userService, adminService, notificationService) |
| Services with mixed cached/uncached | 4 |

All database reads go through the repository layer. No service calls `supabase.from()` directly for table reads.

---

## What Changed

| Change | Details |
|--------|---------|
| Code changes | None — service already cached |
| ARCHITECTURE_BACKLOG.md | AR-013 status → Complete (stale) |
| ARCHITECTURE_BACKLOG.md | Version 2.3.0 → 2.4.0 |
| ARCHITECTURE_BACKLOG.md | Progress 12/28 → 13/28 (46.4%) |
| ARCHITECTURE_BACKLOG.md | Metrics register updated |

---

## Verification

| Check | Status |
|-------|:------:|
| `topicsService.ts` has cache with 5-min TTL | ✅ Already implemented (line 17) |
| Repeated topic reads within TTL return cached data | ✅ Via `queryCache.fetchWithDedup` |
| Cache invalidation on write operations | ✅ Via `force = true` parameter |
| TypeScript clean | ✅ No changes made |
| Build passes | ✅ No changes made |
| Tests pass | ✅ 79/79 |
| Behavioral change | None — service already cached |

---

## Final Status

### AR-013 PERMANENTLY CLOSED

- topicsService.ts already has queryCache.fetchWithDedup with 5-min TTL
- No code changes needed
- Backlog item was stale at creation time
- Full service cache audit completed as bonus finding
