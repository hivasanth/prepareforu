# FOUNDATION_CONTENT_DENSITY_LANGUAGE — Phase 6.XB (Task 29 / Global)

- **Phase:** 6.XB
- **Status:** SPECIFIED — awaiting implementation approval in the 6.XB plan
- **Key property:** spacing/density is expressed through the semantic **token ladder** only; pages
  express density as *intent* (compact / default / relaxed), never as bespoke px values.

---

## 1. Density spectrum

| Intent | Card interior | Stack gap | Applies to |
|---|---|---|---|
| Compact | `p-3` (12px) | `gap-2` (8px) | dense management rows, key-value pairs |
| Default | `p-5 md:p-6` | `gap-3`/`gap-4` | cards (current certified recipes) |
| Relaxed | `p-6 md:p-8` | `gap-6` | hero-adjacent, empty-state, onboarding |

Density is a **contract property of the component family**, not a per-page number.

## 2. Banned

- Arbitrary px radius/spacing in consumers: `rounded-[24px]`, `mx-[10px]`, `gap-[7px]`, etc.
  (flagged by `foundation-audit.mjs` as warnings today; becomes a hard block after consumer
  migration).
- Layout tweaks that only exist to compensate for a missing Foundation spacing role.

## 3. Current audit baseline

`node scripts/foundation-audit.mjs` reports 27 warnings for arbitrary px spacing/radius across
consumer pages (e.g. `LeaderboardView rounded-[24px]`, `ReviewLayout rounded-[32px]`,
`QuestionNavigator rounded-[13px]`, `ExamHeader mx-[10px]`). These are **pre-existing page debts**
tracked in `FOUNDATION_DESIGN_DEBT.md` (T34) and resolved through the certified migration plan
(T35) — never fixed piecemeal during 6.XB.

## 4. Relation

- `FOUNDATION_VISUAL_WEIGHT_LANGUAGE.md` (rhythm + hierarchy share this ladder).
- `FOUNDATION_DESIGN_DEBT.md` (the 27 px-warning inventory).