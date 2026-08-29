# FOUNDATION_HOVER_LANGUAGE_V2 — Phase 6.XB (Task 27 / Global #4)

- **Phase:** 6.XB (hover-canonic contract); **amended by Phase 6.Z (D-184, 2026-08-10)** — the card/container/row hover is now the **3D lift + deepened shadow**, superseding the brightness-only model below.
- **Status:** IMPLEMENTED — awaiting certification
- **Key property:** **ONE card hover language.** `CARD_HOVER`/`ROW_HOVER` (defined in 6.XY,
  D-177/D-183) are the single canonical hover for all card/row surfaces. 6.XB extends the contract so the label
  tier / interactive accent on a hoverable advanced card also uses one standard.

---

## 1. Canonical hover (D-177 → D-184)

`src/components/common/AntigravityCard.tsx`:

```
CARD_HOVER           = transition-card-3d duration-fast ease-standard hover:-translate-y-1 hover:shadow-card-hover-3d
ROW_HOVER            = transition-card-3d duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-card-hover-3d
PREMIUM_SURFACE_HOVER = CARD_HOVER
```

All flat/elevated/subtle/premium/auth-light card variants compose `CARD_HOVER`; rows/list items compose
`ROW_HOVER`. **D-184 (Phase 6.Z) — the ONE card hover is the 3D lift:** the card rises (`-translate-y-1`,
rows `-translate-y-0.5`) and its shadow deepens/darkens (`shadow-card-hover-3d`, animated by
`transition-card-3d`). Applies in BOTH themes. Former surface-lighten (`hover:bg-hover-bg/40` +
`hover:shadow-card-hover-shadow`) retired.

## 2. 6.XB extension — label/prominent-hover accent

Where a card carries a prominent interactive title that should read as hovered (e.g. the exam-card
title in `AntigravityDashboard.tsx`), the highlight uses:

- the existing `group`/`group-hover` wiring, with the title accenting toward `text-text-primary`
  via `lg:group-hover:text-primary` — the **single standard** for "card title accents on hover".

This is additive and derived from the existing text ladder; it introduces no new hover color name.

## 3. Banned

- Second hover language per variant (`hover:shadow-card-premium` removed in 6.X — banned).
- A lift/shadow recomb in consumers — the 3D lift + `shadow-card-hover-3d` may only come from `CARD_HOVER`/`ROW_HOVER`.
- Scale/rotate/bounce transforms on hover (banned).
- `hover:bg-hover-bg/40` + `hover:shadow-card-hover-shadow` on cards/rows (the retired surface-lighten hover — banned).
- Page-level hover shadow/ring definitions outside `CARD_HOVER`/`ROW_HOVER`.
- Global #1 rule: if hover is solved once in `CARD_HOVER`, pages must not re-create it.

## 4. Enforcement

- `node scripts/foundation-audit.mjs` flags local `shadow-(default|raised|card)` and
  `drop-shadow(0 1/2/4·px)` re-definitions (banned).
- Grep sweep: zero `hover:shadow-card-premium`.

## 5. Relation

- `FOUNDATION_SKELETON_LANGUAGE_V2.md` (T27) — skeleton matches card surface incl. hover feel.
- `FOUNDATION_CARD_LANGUAGE.md` (6.X) — base hover contract.