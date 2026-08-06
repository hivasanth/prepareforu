# ADMIN USERS — METADATA LAYOUT AUDIT (Phase 3.6C, Part 2)

**Date:** 2026-08-03 · **Status:** ⏸ AWAITING APPROVAL (no code changed)
**Scope:** the `metadata` slot of each `CollectionCard` row — currently Exam / Attempts / Joined.

---

# 1. Current rendering

`UsersTable.tsx:90-102` (inside `CollectionCard layout="row"`):

```
metadata={
  <>
    <Badge variant="default" className="capitalize">{exam || 'None'}</Badge>
    <AdminText size="metadata">        {n} Attempts</AdminText>
    <AdminText size="metadata">        Joined {formatDate(created_at)}</AdminText>
  </>
}
```

Rendered inside `CollectionCard` `rowBody` (`CollectionCard.tsx:182`) into the card's center column as:

```
<div class="flex flex-wrap items-center gap-2">
  [Badge: APPSC]  [text: 0 Attempts]  [text: Joined 07 Jul 2026]
</div>
```

## Current anatomy

- Leading group (`SelectionCheckbox` + `UserIdentity`) — left.
- Center column (`flex-1 min-w-0`): empty title/subtitle + **inline-flowing metadata** (`flex flex-wrap
  items-center gap-2`).
- Right group: trailing `Badge` (Active/Banned) + actions `Button`.

---

# 2. Findings (alignment · spacing · responsiveness · readability)

| # | Finding | Evidence |
|---|---|---|
| M-1 | **No labels** — "0 Attempts" and "Joined …" are running text; the exam is a badge. The three values have no shared label column, so values cannot be scanned vertically. | `UsersTable.tsx:90-102` |
| M-2 | **Inline flowing metadata** — the three items live in one `flex-wrap` line. When the exam name is long (e.g. `BANK_EXAMS` → "bank exams") or the row narrows, items wrap to different line counts per row. | `CollectionCard.tsx:182` (`flex flex-wrap items-center gap-2`) |
| M-3 | **No cross-row column alignment** — the metadata is one wrapped token row with variable-width children; there is no fixed column for Exam/Attempts/Joined, so columns do not line up identically across rows. | row-to-row width variance from badge/text lengths |
| M-4 | **Mixed presentation** — a `Badge` (bordered pill) sits beside plain `AdminText`; no consistent value presentation. | `Badge` vs `AdminText` in same row |
| M-5 | **Responsive inconsistency** — on `sm+` the metadata hugs the identity column and the trailing/actions stay right; on narrow widths the wrap reflows arbitrarily. Nothing forces a stable 3-value structure. | `CollectionCard.tsx:174-192` |
| M-6 | **Weak hierarchy** — "Exam" is visually stronger (badge) than the numeric/date values, which is the reverse of what admins scan for (attempts/joined). | variant weighting |

**Root cause:** metadata was composed as free-form children into the certified `metadata` slot, which is
by design a *wrapped token row*. That design fits Questions (small chips) but is the wrong structure for
Users, whose metadata is a **fixed 3-field record** that should align columnar across all rows.

---

# 3. Goal (from the brief)

Structured, labelled, identical per row — one of:

```
Exam          Attempts      Joined
APPSC         0             07 Jul 2026
```

or the labelled stacked form. **No inline flowing metadata.** Every row aligns identically.

---

# 4. Proposal — permanent metadata layout (PENDING APPROVAL)

Structured **3-column labelled metadata**, each column a label + value, equal widths, same gap rhythm on
every row:

```
  EXAM            ATTEMPTS      JOINED
  APPSC           0             07 Jul 2026
```

## Structure (page-owned composition over certified primitives only)

- Container: `flex gap-6` (24px = on the 24/12/8 ladder) inside the card metadata slot.
- Columns: three equal `flex-1 min-w-0` columns (structural classes only).
- Each column:
  - **Label** — certified `Label`/`Caption` micro-uppercase (`text-text-muted`) e.g. `EXAM`.
  - **Value** — certified `AdminText sans` `size="metadata"`; exam value keeps the certified `Badge`
    (`variant="default" capitalize`) for a consistent chip, or plain `AdminText` — decided at approval.
  - `truncate` on long values (structural).
- Because every row renders the same `flex gap-6` with three `flex-1` columns at the same available
  width, **Exam / Attempts / Joined line up identically across every row** at all breakpoints
  (`flex-wrap` only if a width floor is approved — otherwise the ladder gap handles density).

## Alignment rules (permanent)

1. Metadata is always the three fields `Exam`, `Attempts`, `Joined`, in that order.
2. All three columns equal width, aligned to the same grid line across rows.
3. Spacing between columns is exactly the ladder value 24px (`gap-6`); internal label→value is the
   ladder value 8px (`gap-2`).
4. Exam value renders as the certified `Badge` (semantic exam chip); Attempts and Joined render as
   `AdminText sans` values. Label text uses the certified micro-label primitive.
5. Long values `truncate`; the row never grows on width.
6. Responsive: columns stay 3-across on all widths (`flex-1`), stacking is **not** used (a stacked
   fallback would reintroduce M-2/M-5).

## Verification (when implemented)

- Grep: only structural classes on the metadata container (`flex`, `flex-1`, `min-w-0`, `truncate`,
  `gap-*`); all text via certified `AdminText`/`Label`; zero arbitrary values.
- Every row identical: rendered DOM has the same 3-column structure per card.
- `tsc 0 · build 0 · lint frozen baseline, zero new`.

## Alternatives considered (rejected)

| Alternative | Why rejected |
|---|---|
| Foundation `Grid cols={3}` | default responsive map is 1→2→3 columns and `gap-4/5/6` scaling — not equal-width at all breakpoints, not the 24 ladder in a card row; would need a new Grid preset (Foundation change) |
| Reuse `DataGrid`/table metadata | table chrome is a **forbidden pattern** for the primary list (Certification Standard §3); overkill for 3 fields |
| Keep inline badge+text (status quo) | fails the brief: inline flowing metadata, no labels, no alignment (M-1…M-6) |
| Stacked label-above-value rows (brief's first example) | valid but taller rows for the same information; the 3-column form is denser and matches the card-row density (padding 16, `Button xs`) |

---

# 5. Files affected (pending approval)

| File | Change (pending) |
|---|---|
| `src/components/admin/users/UsersTable.tsx` | replace inline `metadata` children with the structured 3-column composition |
| `src/components/common/CollectionCard.tsx` | none (metadata slot already supports any composition; no Foundation change) |

This part changes **page composition only** — no new Foundation component, no new token, no page-owned
visual (structural classes + certified primitives only).
