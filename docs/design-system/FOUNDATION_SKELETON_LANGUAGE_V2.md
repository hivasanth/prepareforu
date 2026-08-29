# FOUNDATION_SKELETON_LANGUAGE_V2 — Phase 6.XB (Task 28 / Global #5)

- **Phase:** 6.XB
- **Status:** IMPLEMENTED — awaiting certification
- **Key property:** the premium skeleton is indistinguishable in **surface** from the real card it
  previews. Since 6.X (T5) established elevation parity (`shadow-card-shadow`), 6.XB fixes the
  remaining gap: **padding & inner-layout parity** so a skeleton card and its loaded counterpart
  occupy the same footprint (a loaded card must never "grow" and reflow a skeleton viewport).

---

## 1. Current surface (6.X, frozen)

| Skeleton | Recipe |
|---|---|
| Premium card skeleton | `SKELETON_CARD_SURFACE = shadow-[var(--card-shadow)]`, `bg-surface`(shimmer over) |
| Flat | `bg-surface` (no shadow) |

## 2. 6.XB refinement — layout parity

The skeleton preview must mirror the card's **padding and internal rhythm**:

- Card variants that use `!p-5 md:!p-6` interior (e.g. exam card) preview with equivalent
  padding; **no resize on load**.
- Shimmer/animation reuses the existing `--motion-*` standard; `prefers-reduced-motion` disables.

Skeleton adoption is token-driven; a card recipe change propagates to its skeleton without a
page edit (Foundation-first).

## 3. Enforcement

- A skeleton never hovers or scales independently (no `hover:` on a loading placeholder).
- Local skeleton shadows duplicated elsewhere → flagged by `foundation-audit.mjs`.

## 4. Relation

- `FOUNDATION_CARD_LANGUAGE.md` / `FOUNDATION_HOVER_LANGUAGE_V2.md` (surface the skeleton previews).
- `FOUNDATION_VISUAL_WEIGHT_LANGUAGE.md` (absence-of-content weight contract).