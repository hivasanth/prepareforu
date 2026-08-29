# FOUNDATION_READABILITY_LANGUAGE — Phase 6.XB (Task 23 / Global #1)

- **Phase:** 6.XB (Foundation Visual Language Evolution; Tasks 23–35)
- **Status:** IMPLEMENTED — awaiting certification (Phase 6.XB certification package)
- **Key property:** additive **semantic readability roles** — every text role owns **exactly ONE
  color token**, defined as a named `--text-*` role and registered as Tailwind utilities so
  consuming components (including page/StatCard layers) resolve colors through tokens, never raw
  palette or opacity.

---

## 1. Principle

> If legibility can be guaranteed once in the Foundation tokens, it MUST NOT be re-solved per-page
> with raw colors or opacity tweaks.

The Foundation already owns the neutral text ladder. Phase 6.XB **adds named roles** so that
semantic *meaning* (metric value, metadata date, hero line, status) carries and is backed by a token
— closing the gap where components had to reach for `--text-primary/secondary/muted` directly or
invent local values.

## 2. Role → token map (ONE source of truth)

All new tokens are **additive** (no certified name changed, no namespace reused for a new purpose):

| Semantic role | Dark token | Light token | Basis |
|---|---|---|---|
| Primary text | `--text-primary` (#F9FAFB) | `--text-primary` (#111827) | pre-existing |
| Secondary text | `--text-secondary` (#D1D5DB) | `--text-secondary` (#4B5563) | pre-existing |
| Muted text | `--text-muted` (#9CA3AF) | `--text-muted` (#6B7280) | pre-existing |
| Hint / caption | `--text-hint` (#6B7280) | `--text-hint` (#9CA3AF) | pre-existing |
| Disabled | `--text-disabled` (#9CA3AF) | `--text-disabled` (#9CA3AF) | pre-existing |
| **Hero heading** | `--text-hero-heading` (#FFFFFF) | `--text-hero-heading` (#FFFFFF) | NEW (T24) |
| **Hero subtitle** | `--text-hero-subtitle` (#F3F4F6) | `--text-hero-subtitle` (#F3F4F6) | NEW (T24) |
| **Hero caption** | `--text-hero-caption` (#D1D5DB) | `--text-hero-caption` (#D1D5DB) | NEW (T24) |
| **Metric label** | `--text-metric-label` = `--text-secondary` | same | NEW (T25) |
| **Metadata** | `--text-meta-label` = `--text-muted` | same | NEW (T26) |
| **Success text** | `--text-success` = `--color-success` | `--text-success` (#16A34A) | NEW (T23) |
| **Warning text** | `--text-warning` = `--color-warning` | `--text-warning` (#B45309) | NEW (T23) |
| **Danger text** | `--text-danger` = `--color-danger` | `--text-danger` (#DC2626) | NEW (T23) |
| **Info text** | `--text-info` = `--color-info` | `--text-info` (#2563EB) | NEW (T23) |

> Hero roles keep their **light** values in light mode because the hero banner surface is the
> fixed-dark forest gradient in **both** themes; hero text must always be light.

## 3. Tailwind registration

Registered in `src/index.css` `@theme` as `--color-text-*` (next to the existing
`--color-text-primary/secondary/…`) producing utilities:

```
text-text-hero-heading   text-text-hero-subtitle   text-text-hero-caption
text-text-metric-label   text-text-meta-label
text-text-success        text-text-warning         text-text-danger   text-text-info
```

All resolve through `var()` indirection so a single token change re-rolls every consumer.

## 4. What certification gates

- Dark/light token sets present in `src/styles/themes.css` (`:root`, `.light`).
- All 10 new colors registered in `src/index.css` `@theme`.
- No existing/certified token value changed (additive only).
- Banned sweeps: zero `text-success/warning/danger/info` overriding via opacity on consumer text.

## 5. Relation to other 6.XB docs

- `FOUNDATION_HERO_LANGUAGE.md` (T24) — hero chain uses `text-text-hero-heading/subtitle/caption`.
- `FOUNDATION_METADATA_LANGUAGE.md` (T26) — metadata uses `text-text-meta-label`.
- `FOUNDATION_STATISTICS_LANGUAGE.md` (T25/T31) — metric label uses `text-text-metric-label`.
- `FOUNDATION_VISUAL_WEIGHT_LANGUAGE.md` (T31) — contrast ladder derives from these roles.