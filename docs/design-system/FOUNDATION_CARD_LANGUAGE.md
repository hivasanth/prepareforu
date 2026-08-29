# FOUNDATION_CARD_LANGUAGE

- **Phase:** 3.7/V — Task 11: Card Layout Language
- **Status:** SPECIFICATION (evidence-based, read-only). Awaiting approval for Foundation-first
  implementation (do NOT patch pages).
- **Governing rule:** cards must follow ONE rhythm — Header → Primary Content → Secondary Content →
  Metrics → Footer Actions — with identical spacing rules. Never create card-specific spacing; never
  use arbitrary padding; never use page-specific spacing.

---

## 1. Current state (evidence)

The certified `Card` primitive (`src/components/common/AntigravityCard.tsx`) owns the **surface**
language (variant surfaces + `CARD_HOVER`, DS-020) via a **padding map** and variant defaults:

- `padding` map: `0→p-0, 16→p-4, 20→p-5, 24→p-6` (AntigravityCard.tsx:66-73).
- Variant defaults: `elevated p-4 md:p-6; default p-4 md:p-5; subtle p-3 md:p-4;
  premium/premium-neutral/premium-dark-neutral p-4 md:p-5; auth-light p-8 md:p-10; management p-4 md:p-5`
  (75-84).
- `CARD_HOVER` (25-26): `transition-interaction duration-fast ease-standard hover:bg-hover-bg/40
  hover:shadow-card-hover-shadow`.
- Radius tokens (`themes.css:305-308`): `--radius-card 20px / --radius-container 24px /
  --radius-control 12px`.

**What is NOT standardized — the content `row` structure.** Across the app the *internal* arrangement
of a card (header, content, metrics, footer, their gaps and delimiters) is re-derived per module:

- **Good (converged):** `AttemptCardBase` = `header(mb-4) → body(gap-4 grid) → footer(mt-auto pt-4
  border-t border-border-subtle/30)` (AttemptCardBase.tsx:41-86); `CollectionCard` grid/row layouts with
  `autoHeader gap-2.5/3 → metadata gap-2 → content flex-1 → footer mt-auto pt-4 border-t`
  (CollectionCard.tsx:148-176). These ARE the golden row/grid card structures.
- **Divergent:**
  - `SettingsCard` header `p-5 border-b bg-hover-bg/20 border-subtle/50`, body `p-6 flex-1`, footer
    `p-4 border-t bg-hover-bg/10` (SettingsCard.tsx:15-25).
  - `QuestionCard` header `p-4 md:p-6 border-b border-subtle/50 bg-hover-bg/30`, body `p-5 md:p-6`
    (QuestionCard.tsx:41,69).
  - `ProfileForm:66` / `TestConfigView:29` / `PreparationView:83` `p-8`/`p-12` — far beyond the
    certified `p-6` max.
  - Sub-admin settings headers `p-8 … border-subtle/10` (Identity/Notification/Backup/Session).
- **Card paddings override map** — see `FOUNDATION_VISUAL_LANGUAGE_AUDIT.md §3.1`.

---

## 2. Foundation card layout contract (proposal — implement once, in Foundation)

Standardize on the **certified `CollectionCard` row anatomy** as the single card rhythm. All cards
render the same zones with the same spacing:

```
┌ CoordinateHeader (row xl):                                gap-3 (icon/drag) + flex-1
│   [ leading ]  [ primary (title/subtitle) ]  [ trailing ]
├── gap (metadata)  gap-2 (flex-wrap)
├── content       flex-1 min-w-0
├── separator     border-t border-border-subtle/30  (only when footer present)
└── footer/actions  mt-auto pt-3 (row) / pt-4 (grid)
```

### 2.1 Canonical paddings (single ladder — never varies per module)
Only these four paddings + the six variant defaults are legal:

| Intent | Padding |
|---|---|
| Dense row / list item | `p-4` (16) |
| Default | `p-4 md:p-5` (20) |
| Spacious / feature | `p-6` (24) |
| Full-bleed art / auth | `p-8 md:p-10` (auth-light only) |

`Card` `padding` prop remains the single entrypoint. Any "card-ish" container that needs another
padding is either not a card (it is a Page/page container → `FOUNDATION_CONTAINER_LANGUAGE.md`) or it
is a violation.

### 2.2 Canonical internal rhythm
| Slot | Spacing rule |
|---|---|
| Header→content | `mb-4` (or the CollectionCard header block's own gaps) |
| Title↔subtitle↔trailing | `gap-2.5`/`gap-3` (leading) |
| Content rows | default `gap (space-y)` via the layout ladder, never literal |
| Metrics zone | see `FOUNDATION_STATISTICS_LANGUAGE.md` (one shared row rhythm) |
| Footer top divider | `mt-auto pt-3 (row) / pt-4 (grid) + border-t border-border-subtle/30` — **ONE alpha `/30` only** |
| Icon-in-card | single icon-box dialect (see `FOUNDATION_ICON_LANGUAGE.md`) |

### 2.3 Divider language (single source)
All card delimiters (header-bottom, footer-top, between card zones) use **`border-border-subtle/30`**
(not `/10 /20 /50 /8`). Divider opacity is owned by `Card`/`CollectionCard`, not pages.

### 2.4 Never
- `p-8`/`p-10`/`p-12` on a card (auth-light exempt).
- `rounded-[...]` arbitrary radii on a card surface (use `--radius-card`/`--radius-container` via the
  `Card` variant).
- `shadow-2xl`/`shadow-xl`/raw-`rgba` shadows on a card (use `--card-shadow`/`--elevation-*`).
- page-level re-padding of a `Card` (`!p-5`, inline `style={{padding}}`).

---

## 3. Foundation evolution proposal (implement once)

- **Keep** `Card` surface + padding map + `CARD_HOVER` as the single surface/padding owner.
- **Promote the canonical structure into a Foundation composite**, e.g. `CardContent`/`Card.Body`
  with slots (`header`/`content`/`metadata`/`metrics`/`footer`), OR (preferred) extend
  `CollectionCard` so any card can opt into the row/grid anatomy with guaranteed gaps + `/30` divider.
  No new tokens required.
- Additive → no change to DS-016…DS-020; freeze-compatible.

---

## 4. Consumer migration plan (foundation-first order)

Full details in `FOUNDATION_CONSUMER_MIGRATION_PLAN.md`. Principle: build the Foundation composite
first, then migrate:
1. `AttemptCardBase` → CollectionCard row anatomy (already close; converge divider `/30`).
2. Settings / Question / sub-admin settings cards → canonical header/body/footer + `border-subtle/30`.
3. Hand-rolled non-`Card` surfaces (ReviewLayout, ResultsView) → `Card`/premium variant (T12 partner).
4. Remove page padding overrides (`p-8 …`) → back to `p-6`/`larger` only for feature containers.

---

## 5. Verification & status

- Status: **PROPOSED** — no page/Card change until the Foundation composite is approved & built
  (Foundation-first rule).
- Evidence index: `FOUNDATION_VISUAL_LANGUAGE_AUDIT.md §3.1`.