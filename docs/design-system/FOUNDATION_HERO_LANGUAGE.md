# FOUNDATION_HERO_LANGUAGE — Phase 6.XB (Task 24 / Global #2)

- **Phase:** 6.XB (Foundation Visual Language Evolution; Tasks 23–35)
- **Status:** IMPLEMENTED — awaiting certification
- **Key property:** ONE hero banner contract. Every heading/subtitle/caption/eyebrow on the hero
  resolves through the hero text **roles**, and the hero surface owns its gradient/overlay. Pages
  never re-implement hero typography or hero text color.

---

## 1. Contract

The hero banner (currently the dashboard/global `WelcomeBanner` entry hero) must:

1. Render heading, subtitle and caption through the semantic roles:
   - Heading → `text-text-hero-heading` (always light; AA on forest gradient).
   - Subtitle → `text-text-hero-subtitle` (light; AA).
   - Caption → `text-text-hero-caption` (legible tertiary, **#D1D5DB**).
2. **Never** use `text-warning`/`text-danger` for its primary heading chain (status colors are for
   status, per D-175).
3. **Never** rely on `opacity` to convey emphasis on hero text (opacity-as-emphasis banned).
4. Own its surface: forest gradient + overlay are part of the hero recipe, not inlined per page.

## 2. Tokens (dual-theme safe)

Because the hero surface is the fixed-dark forest gradient in **both** themes, the hero roles carry
light values in `.light` too:

```
dark  .light
--text-hero-heading   #FFFFFF   #FFFFFF
--text-hero-subtitle  #F3F4F6   #F3F4F6
--text-hero-caption   #D1D5DB   #D1D5DB
```

## 3. Enforcement

- The hero is owned once; consuming pages render the hero component and pass **content** only.
- Banned sweep: `text-warning`/`text-danger` in hero primary chain; `opacity-*` on hero heading.

## 4. Relation

- `FOUNDATION_READABILITY_LANGUAGE.md` (T23) defines the hero role tokens.
- `FOUNDATION_VISUAL_WEIGHT_LANGUAGE.md` (T31) — hero heading carries the top visual weight.