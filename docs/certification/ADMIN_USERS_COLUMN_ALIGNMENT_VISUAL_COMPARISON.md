# Phase 3.6D — Admin Users CollectionCard Column Alignment — Visual Comparison

**Date:** 2026-08-03 · **Governance:** D-139
**Method:** composition diff of `src/components/admin/users/UsersTable.tsx` (the only changed file) against
the certified 3.6C state. No screenshots — the comparison is structural/derived from the certified
`CollectionCard` row anatomy plus fixed-width composition, verified against the compiled CSS.

---

# 1. Before vs After — one row

### Before (Phase 3.6C.2 — repeated headings, `flex-1` thirds)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Avatar] Jonathan Smith                EXAM         ATTEMPTS     JOINED                       │
│          jonathan@email.com            [ APPSC ]    0            07/03/2026        [Active] [Deactivate] │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Every row re-renders the `Label`s `EXAM` / `ATTEMPTS` / `JOINED`. The three columns were equal
`flex-1 min-w-0` thirds of the leftover text-block width — and that leftover width depended on the
trailing button label length, so badge/date X positions drifted between `Activate` and `Deactivate`
rows.

### After (Phase 3.6D — fixed columns, headings removed)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Avatar] Jonathan Smith            [ APPSC ]    0    07/03/2026        [Active] [Deactivate] │
│          jonathan@email.com                                                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
   └──── 2fr ≈ 300px ────┘   └─160px─┘ └100px┘ └─140px─┘   └─130px─┘ └──auto──┘
```

The identity column is now the widest; exam/attempts/joined/status/actions each own a **fixed** zone.
No element's X position depends on any other row's content.

---

# 2. What was removed

| Element | Before | After |
|---|---|---|
| `Label` → "EXAM" (per row) | rendered | **removed** |
| `Label` → "ATTEMPTS" (per row) | rendered | **removed** |
| `Label` → "JOINED" (per row) | rendered | **removed** |
| equal `flex-1 min-w-0` metadata thirds | rendered | replaced by fixed widths |
| content-dependent trailing width | shifted status column | fixed `ACTION_COL` |

---

# 3. What was added

| Element | Width (mobile → desktop) | Role |
|---|---|---|
| Identity column | 170 → 200 → 240 → 280 → 300px | largest column; `truncate` via `UserIdentity` |
| Exam column | 150 → 160px | badge left edge fixed; long names ellipsized |
| Attempts column | 100px | number left edge fixed |
| Joined column | 130 → 140px | date left edge fixed |
| Status column | 110 → 130px | badge left edge fixed |
| Action button | 104px | Activate/Deactivate identical width |

---

# 4. Alignment (3 rows, mixed content — the failing case in 3.6C)

| Row | Identity (fixed) | Exam (160px) | Attempts (100px) | Joined (140px) | Status (130px) | Actions (104px) |
|---|---|---|---|---|---|---|
| A | `[Avatar] A. Ramesh` / `ar@x.com` | `[ APPSC ]` | `5` | `02/02/2026` | `[Active]` | `[Deactivate]` |
| B | `[Avatar] B. Krishnan` / `bk@y.com` | `[ RBI Grade B ]` | `12` | `19/11/2025` | `[Banned]` | `[Activate]` |
| C | `[Avatar] C` / `c@z.com` | `[ UPSC ]` | `0` | `07/03/2026` | `[Active]` | `[Deactivate]` |

All three rows share the same six X origins — the badge, the number, the date, the status badge, and the
button begin at identical horizontal positions. Before 3.6D, rows B and C shifted because their
`Activate`/`Deactivate` button widths and identity lengths differed.

---

# 5. Responsive & theme

| Mode | Behaviour |
|---|---|
| Desktop ≥ xl | single-line `\| 2fr · 160 · 100 · 140 · 130 · auto \|` |
| Tablet lg/md | fixed columns wrap in order (controlled compression) — same widths, same X origins per wrapped line |
| Mobile | `CollectionCard` stacks card rows; identity on top-left, columns wrap beside/below it in order, status+actions on the bottom row |
| Light / Dark | identical — no page-owned colors, shadows, radii, borders, or hover rules added |

---

# 6. Visual-ownership guarantee

- `CollectionCard` still owns: padding, background, shadow, hover, animation, borders (premium surface).
- Page owns: slot **composition** only — column widths, order, wrap behaviour.
- No `bg-*`, no `shadow-*`, no `rounded-*`, no `border-*`, no `hover:*` added to the users page (grep-verified).

Net effect: `Premium CollectionCard + Professional Management Table`, not `independent cards with
floating content`.
