# FOUNDATION_METADATA_LANGUAGE — Phase 6.XB (Task 26 / Global #2)

- **Phase:** 6.XB
- **Status:** IMPLEMENTED — awaiting certification
- **Key property:** metadata (dates, attempts, questions, subject, badges-of-information) shares
  **ONE semantic color token** (`--text-meta-label` = muted). No page individually hand-picks a gray
  scale for meta in/around cards.

---

## 1. Role

"Metadata" = non-primary factual/generic text that characterises a record without being its metric
value or its title: exam dates, attempt counts, question-quantity chips, subject tags, source
labels. It sits **one step below** secondary text and **one step above** disabled.

## 2. Token

| Role | Dark | Light |
|---|---|---|
| Metadata label | `--text-meta-label` = `--text-muted` (#9CA3AF) | `--text-meta-label` = `--text-muted` (#6B7280) |

Utility: `text-text-meta-label`.

## 3. Hierarchy (visual weight, low → high)

```
text-text-hint        (value-neutral trace, e.g. placeholders/help)
text-text-meta-label  (metadata — dates, counts, tags)        ← this doc
text-text-secondary   (supporting copy)
text-text-primary     (titles, headings)
text-text-hero-heading (hero surface heading)
```

## 4. Enforcement

- Metadata never uses raw `text-gray-[…]` or a per-page gray; it uses `text-text-meta-label`.
- Stat *labels* (STREAK/WISDOM/…) are **not** metadata — they are **metric labels** (T25) and use
  `text-text-metric-label`.

## 5. Relation

- `FOUNDATION_READABILITY_LANGUAGE.md` (T23) defines the token.
- `FOUNDATION_STATISTICS_LANGUAGE.md` (T31) contrasts metric label vs metadata.