# FOUNDATION_DASHBOARD_LANGUAGE — Phase 6.XB (Task 30 / Global)

- **Phase:** 6.XB
- **Status:** SPECIFIED
- **Key property:** the dashboard/global entry composition is **one coherent statistics language**,
  not a pile of bespoke decorative cards. Everything a statistic shows anywhere (net, ant, verse,
  analytics, leaderboard) uses the SAME statistic vocabulary or deliberately defers to it.

---

## 1. Composition principles

1. **One statistic card** (StatCard family) renders every numeric highlight: label + value + delta.
2. Hero + stat ladder on the dashboard is the **canonical** layout; other surfaces reuse the same
   card rather than inventing parallel layouts.
3. **Metric label** (`STREAK / WISDOM / PRECISION / RANK / …`) uses `text-text-metric-label`.
4. Metric **value** uses the certified StatCard numeric ladder (6.X SS refinement).
5. **Metadata** (dates/counts) uses `text-text-meta-label`.

## 2. Hierarchy

```
value (numeric ladder)  >  metric label  >  metadata  >  hint
```

## 3. Banned

- Bespoke stat card re-implementations per page with hand-rolled label colors.
- Numeric values styled with per-page fonts/weights instead of the StatCard recipe.

## 4. Relation

- `FOUNDATION_STATISTICS_LANGUAGE.md` (6.X) — StatCard contract.
- `FOUNDATION_METADATA_LANGUAGE.md` (T26) — meta uses `text-text-meta-label`.
- `FOUNDATION_READABILITY_LANGUAGE.md` (T23) — metric-label token.