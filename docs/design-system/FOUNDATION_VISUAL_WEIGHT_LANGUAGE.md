# FOUNDATION_VISUAL_WEIGHT_LANGUAGE — Phase 6.XB (Task 31 / Global)

- **Phase:** 6.XB
- **Status:** SPECIFIED
- **Key property:** visual weight = **role-derived**, monotonic, and consistent site-wide. The
  Foundation defines ONE weight/contrast ladder; every element is placed on it by its semantic role
  — never by a page's taste.

---

## 1. Weight ladder (color → attention)

| Rank | Role token | Used for |
|---|---|---|
| 5 | `text-text-hero-heading` | hero heading (top attention) |
| 4 | `text-text-primary` | titles, headings, primary values |
| 3 | `text-text-secondary` | supporting copy, metric label |
| 2 | `text-text-meta-label` | metadata, counts, chips |
| 1 | `text-text-hint` | helper/trace |

Separately, **semantic status** (`text-text-success/warning/danger/info`) carries *meaning* and
must not be confused with the neutral weight ladder.

## 2. Rules

- Weight implies **color**, and optionally type-size; it never implies `opacity` as emphasis.
- Primary headings use the primary/herom token; secondary copy secondary; metadata meta; helper
  hint. A page cannot "jump" a rank for style.
- Light/dark role tokens carry equal *perceptual* weight (anti-aliasing / luminance budget kept).

## 3. Enforcement

- `text-hint` on metric *labels* (a 6.X fix) is codified as a banned regression here.
- Opacity-as-emphasis on any weight-ranked text is banned (D-175).

## 4. Relation

- `FOUNDATION_READABILITY_LANGUAGE.md` (role tokens driving this ladder).
- `FOUNDATION_DASHBOARD_LANGUAGE.md` (applied to stat hierarchy).