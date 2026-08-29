# FOUNDATION_VISUAL_MIGRATION_PLAN_V2 — Phase 6.XB (Task 35 / consumer follow-on)

- **Phase:** 6.XB
- **Status:** SPECIFIED — **deferred**. No consumer migration runs under 6.XB; this is the
  gate-certified plan for the follow-on effort.
- **Key property:** consumer migration is token-mapping + audit-gated; it does not redesign pages.

---

## 1. Principles

1. **Foundation first** — every consumer finding has a Foundation-side role to map to before the
   consumer is touched.
2. **Gated per scope** — `npm run audit:foundation <scope>` must be CLEAN to close a scope.
3. **No design drift** — migration only swaps raw values for semantic roles; layout/visual intent
   unchanged.

## 2. Migration buckets (from `FOUNDATION_DESIGN_DEBT.md`)

| Bucket | Consumers | Map to | Gate |
|---|---|---|---|
| Palette | `src/utils/paletteColors.ts` (20 hex findings) | additive `--chart-*`/`--avatar-*` token set | M3 |
| Density | leaderboard, exam screens, navigators (27 px warnings) | `FOUNDATION_CONTENT_DENSITY_LANGUAGE.md` ladder | M2 |
| Token indirection | `AntigravityData.tsx:163` `bg-[color]` | typed semantic prop | M1 |

## 3. Order

1. Add Foundation `--chart-*`/`--avatar-*` tokens (Foundation-layer change → its own mini-gate).
2. Migrate palette → tokens (M3).
3. Map px spacing per screen (M2), re-running the audit per file.
4. Resolve `bg-[color]` (M1).
5. Re-run repo-wide `npm run audit:foundation` → **CLEAN**, then certify that consumer phase.

## 4. Explicit non-goals

- No page redesigns, no new layout inventions, no exceptions (registry stays empty).
- No parallel Foundation changes while migrations run (freeze discipline).

## 5. Relation

- `FOUNDATION_CERTIFICATION_GATE_V2.md` (M1–M6 gate).
- `FOUNDATION_DESIGN_DEBT.md` (the inventory being burned down).