# Phase 5.4D — Pills & Badges Language: Foundation Evolution Implementation Report

- **Phase:** 5.4D (Pills & Badges Language) — Foundation evolution
- **Status:** IMPLEMENTED 2026-08-06 — **awaiting user certification**
- **Approval:** user granted the separate dedicated implementation approval (2026-08-06, direct
  directive — no planning gate). Implement **exactly ONE** unified Pill/Badge language from ONE
  primitive (`<Badge role= state= variant= icon=…/>` or `<Pill …/>`); every existing badge becomes a
  wrapper; existing props remain valid.
- **Decision:** **D-168 (IMPLEMENTED)** recorded in `docs/design-system/DESIGN_DECISION_LOG.md`

---

## 1. Executive summary

Phase 5.4D is the **pills & badges language** Foundation gate. It consolidates every pill/badge
renderer onto **ONE primitive** — `Pill` — and re-implements every badge/pill as a thin,
backward-compatible role wrapper through it. The `Badge` and `DifficultyBadge` renders are
**class-token-identical** to pre-5.4D; `TagBadge` is the one intended visual change (its raw
amber/emerald/rose/purple/sky palette is replaced by semantic tokens, per the directive). The phase
delivered:

1. **`Pill` primitive created** (`src/components/common/Pill.tsx`) — the ONLY pill/badge renderer.
   12 semantic roles (`PillRole`: status/difficulty/counter/notification/selection/navigation/filter/
   exam/subject/information/category/tag — exactly one owner each), 9 modeled states
   (default/hover/pressed/selected/active/inactive/disabled/loading/focus), 9 variants (`PillVariant`),
   4 sizes (`PillSize` XS/SM/MD/LG); props `role/variant/size/state/as/inline/icon/pulse/disabled/
   loading/onClick/ariaLabel/ariaPressed/ariaCurrent/title/className/children`.
2. **ONE radius/padding/type scale** — XS/SM/MD/LG; SM (`h-5 px-2.5 rounded-full text-[9px]
   tracking-wider`) and MD (`h-7 px-3 rounded-[14px] text-[10px] tracking-wider`) reproduce the
   pre-5.4D DS-005 Badge recipes **verbatim**. No arbitrary values; consumers never define
   radius/padding/type.
3. **Typography integration (DS-016, never bypassed)** — the text layer always renders through the
   certified `Typography` `badge` role with `font-size: inherit` (the container size recipe drives
   the render). Pill defines no custom type.
4. **Semantic color contract** — status = `--color-*` (`bg-[color]/15 text-[color] border-[color]/30`);
   **selected** = 5.4A Management Surface selection colors (`--management-surface-active`/
   `--management-border-active`/`--management-accent`); **active** = solid `bg-primary text-white
   border-primary`; **inactive** = the neutral border language (`bg-transparent text-text-secondary
   border-border-subtle`); **disabled** = neutral + `opacity-40` + native `disabled`. No Tailwind
   palette, no hardcoded amber, no hex.
5. **Interaction contract** — interactive pills (Filter/Selection/Navigation) render a real
   `<button>` with keyboard focus, a visible 2px focus ring, and `aria-pressed`/`aria-current`/
   `aria-busy`/native `disabled`. Subtle certified hover: Management Surface hover fill + border for
   toggle pills, `brightness-105` + accent border for material pills — **NO scaling, NO lifting, NO
   elevation** (consistent with the future 5.4E spec, deliberately distinct from 5.4B button
   scale/lift). Loading = `Spinner` sm in current color. Pills are flat by default.
6. **Wrappers** — `Badge` rewritten as a thin Pill wrapper (DS-005 contract preserved); `DifficultyBadge`
   re-pointed through Pill (`easy→success/medium→warning/hard→danger`, file path unchanged);
   `TagBadge` re-pointed with palette → semantic (IMP→warning, TIP→success, ALERT→danger, KEY→primary,
   default→secondary); new role wrappers `StatusBadge`, `CounterBadge`, `FilterPill`, `SelectionPill`,
   `NavigationPill` (future consumer-migration targets).
7. **Barrel** — `AntigravityUI.tsx` exports `Pill` + `PillProps`/`PillRole`/`PillVariant`/`PillSize`/
   `PillState` + the 5 new wrappers.
8. **Verification** — `tsc -b` exit 0, build exit 0 (51.76s), eslint 397 = exact baseline, temp
   render-identity suite 12/12 (removed after proof), vitest baseline proven (0 new failures), zero
   `Pill` collision, scope sweep clean.
9. **Governance** — `FOUNDATION_GOVERNANCE.md` v1.23.0 → **v1.24.0** (§4 Pill & Badge Language
   Contract; §36 changelog); Freeze Register **DS-017** (Pill/Badge System FROZEN); D-168;
   execution + decision logs updated.

**Scope discipline:** the component layer touched ONLY the Foundation files listed in §4. **No
consumer, page, theme-value, or token-value file was modified.** `IconBadge` (token-based icon
tiles) and `RankBadge` (consumer layer, raw `--gold-300` material) were intentionally untouched —
RankBadge/TagBadge page migration is 5.4G work.

---

## 2. Scope executed (approved 2026-08-06)

| Area | Result |
|---|---|
| ONE `Pill` primitive | Created — 12 roles, 9 states, 9 variants, 4 sizes; the only pill/badge renderer |
| Radius/padding/type scale | XS/SM/MD/LG; SM/MD reproduce the pre-5.4D DS-005 Badge recipes verbatim |
| Typography integration | Text always renders through DS-016 `Typography` `badge` role (`font-size: inherit`) |
| Semantic colors | status `--color-*`; selected = Management Surface; active = solid primary; inactive = neutral border; disabled = neutral + opacity — no palette/amber/hex |
| Interaction | interactive pills = real `<button>` + 2px focus ring + aria attributes; subtle hover (no scale/lift); loading = `Spinner` sm |
| Legacy wrappers | `Badge` (DS-005 contract preserved), `DifficultyBadge` (re-pointed), `TagBadge` (palette → semantic) |
| New role wrappers | `StatusBadge`, `CounterBadge`, `FilterPill`, `SelectionPill`, `NavigationPill` |
| Barrel exports | `Pill` + 5 types + 5 wrappers |
| Verification | tsc/build/eslint at baseline; render identity 12/12; vitest baseline proven |
| Governance | v1.24.0 §4 Pill & Badge Language Contract; D-168; freeze register DS-017 |

Out of scope (NOT executed): any theme/token-value change, any consumer/page migration, `IconBadge`
changes, `RankBadge` changes, contrast gates **C-1…C-5** (each a separate dedicated approval, never
batched), and the future **5.4E (Hover & Motion)** / **5.4F (Skeleton)** gates (each requires a
separate dedicated approval).

---

## 3. The `Pill` primitive

### 3.1 API

```tsx
interface PillProps {
  role?: PillRole;              // 12 canonical semantic roles (one owner each)
  variant?: PillVariant;        // default|neutral|success|warning|danger|info|primary|secondary|outline
  size?: PillSize;              // xs|sm|md|lg — ONE radius/padding/type scale
  state?: PillState;            // default|selected|active|inactive|disabled|loading
  as?: 'div' | 'button';        // interactive pills render a real <button>
  inline?: boolean;             // display:inline-flex for flowing text / flex-wrap rows
  icon?: LucideIcon;
  pulse?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  ariaPressed?: boolean;        // toggle pills — aria-pressed
  ariaCurrent?: boolean;        // navigation pills — aria-current="page"
  title?: string;
  className?: string;
  children: ReactNode;
}
```

`PillState` props model 6 of the 9 states; **hover / pressed / focus are CSS pseudo-states** (they
are not props). The element carries `data-role={role}` so the semantic role is observable.

### 3.2 Size scale (ONE language, no arbitrary values)

| Size | Recipe | Origin |
|---|---|---|
| XS | `h-5 px-2 rounded-full text-[9px] tracking-wider` | counter/notification micro pills |
| SM | `h-5 px-2.5 rounded-full text-[9px] tracking-wider` | pre-5.4D Badge `sm` (verbatim) |
| MD | `h-7 px-3 rounded-[14px] text-[10px] tracking-wider` | pre-5.4D Badge `md` (verbatim, DS-005) |
| LG | `h-8 px-4 rounded-full text-[11px] tracking-wider` | category/subject pills |

Consumers never define radius/padding/type on a pill — the scale is Foundation-owned.

### 3.3 State material contract

| State | Material |
|---|---|
| default | the `variant` material |
| selected | `bg-[var(--management-surface-active)] text-[var(--management-accent)] border-[var(--management-border-active)]` — 5.4A Management Surface selection |
| active | `bg-primary text-white border-primary` — solid on-state |
| inactive | `bg-transparent text-text-secondary border-border-subtle` — neutral border language |
| disabled | `bg-hover-bg text-text-secondary border-border-subtle opacity-40 cursor-not-allowed pointer-events-none` + native `disabled` |
| loading | the `variant` material + `Spinner` sm + `aria-busy` |
| hover/pressed/focus | CSS pseudo-states (see §3.4) |

### 3.4 Interaction contract (certified, consistent with future 5.4E)

- Toggle pills (Filter/Selection at rest): neutral border language → hover = Management Surface fill
  + border (`hover:bg-[var(--management-surface-hover)] hover:border-[var(--management-border-hover)]`).
- Material pills (active/semantic): `hover:brightness-105 hover:border-primary/50`.
- Pressed: `active:brightness-95`. Focus: `focus-visible:ring-2 focus-visible:ring-primary/50
  focus-visible:ring-offset-1` (the Tabs focus language).
- **NO scaling, NO lifting, NO motion** — this hover language is deliberately distinct from the 5.4B
  button hover (which scales/lifts); it is the language the 5.4E Hover & Motion spec will formalize.

### 3.5 Wrapper mapping

| Component | Through `Pill` | Render delta |
|---|---|---|
| `Badge` | `variant`/`size`/`icon`/`pulse`/`className` map 1:1 | **none** — class tokens identical to pre-5.4D (DS-005 contract) |
| `DifficultyBadge` | `role="difficulty"`, easy→success/medium→warning/hard→danger | **none** — same classes as the pre-5.4D Badge wrapper |
| `TagBadge` | `role="tag"`, IMP→warning/TIP→success/ALERT→danger/KEY→primary/else→secondary, `size="xs"`, `inline` | intended: raw amber/emerald/rose/purple/sky → semantic tokens; label→div; rounded→rounded-full; 10px→9px |
| `StatusBadge` | `role="status"`, `size="sm"` | new (no prior render) |
| `CounterBadge` | `role="counter"`, `size="xs"` | new (no prior render) |
| `FilterPill` | `role="filter"`, toggle button | new (no prior render) |
| `SelectionPill` | `role="selection"`, toggle button | new (no prior render) |
| `NavigationPill` | `role="navigation"`, current→active solid | new (no prior render) |

---

## 4. Files changed

| File | Change |
|---|---|
| `src/components/common/Pill.tsx` | **NEW** — the single Foundation pill/badge primitive (roles, states, size scale, semantic variants, interaction contract) |
| `src/components/common/StatusBadge.tsx` | **NEW** — status role wrapper |
| `src/components/common/CounterBadge.tsx` | **NEW** — counter role wrapper |
| `src/components/common/FilterPill.tsx` | **NEW** — filter toggle pill wrapper |
| `src/components/common/SelectionPill.tsx` | **NEW** — selection toggle pill wrapper |
| `src/components/common/NavigationPill.tsx` | **NEW** — navigation pill wrapper |
| `src/components/common/AntigravityData.tsx` | `Badge` rewritten as a thin Pill wrapper (DS-005 contract preserved) |
| `src/components/common/AntigravityUI.tsx` | barrel — exports `Pill` + 5 types + 5 wrappers |
| `src/components/admin/common/DifficultyBadge.tsx` | re-pointed through `Pill` (path unchanged — QuestionsTable imports it) |
| `src/components/user/TagBadge.tsx` | re-pointed through `Pill`; raw palette → semantic tokens |
| `FOUNDATION_GOVERNANCE.md` | v1.23.0 → **v1.24.0**; §4 Pill & Badge Language Contract; §36 changelog |
| `FOUNDATION_FREEZE_REGISTER.md` | Pill/Badge System row (**DS-017**, FROZEN) + Phase 5.4D entry |
| `docs/design-system/PHASE_5_4D_IMPLEMENTATION_REPORT.md` | this report |
| `docs/design-system/PHASE_5_4D_VISUAL_VERIFICATION.md` | verification evidence |
| `docs/design-system/PHASE_5_4D_CERTIFICATION.md` | certification gate |
| `docs/design-system/DESIGN_DECISION_LOG.md` | **D-168** (5.4D IMPLEMENTED) |
| `PHASE_3_1_EXECUTION_LOG.md` | 5.4D implementation entry |

**No consumer, page, service, schema, theme-value, or token-value file was modified.**

---

## 5. Verification summary

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (51.76s, pre-existing warnings only) |
| `npx eslint .` | ✅ 397 problems (344 E / 53 W) — **exact baseline, 0 introduced, 0 in new files** |
| Render identity | ✅ temp suite 12/12: Badge md/sm + all 6 legacy variants = exact legacy class-token set; DifficultyBadge easy/medium/hard = success/warning/danger; TagBadge = semantic + zero amber/emerald/rose/purple/sky; StatusBadge/CounterBadge role+size defaults; FilterPill/SelectionPill/NavigationPill = button + management-surface selected + neutral-border rest + `aria-pressed`/`aria-current`; loading = spinner + `aria-busy`; disabled = native `disabled` (temp test removed after proof) |
| Vitest baseline proof | ✅ clean worktree at HEAD `453b5d7` = identical 33 pre-existing failures (ds003/ds005/ds014); working tree = 301 passed / 33 failed → **0 new failures** (via `--config vitest.audit.config.ts`) |
| Import collision | ✅ zero pre-existing `Pill` identifiers in `src/` |
| Scope sweep | ✅ Foundation files + the 2 existing badge wrappers only; no consumer file touched |

Full evidence in `PHASE_5_4D_VISUAL_VERIFICATION.md`.

**Note on the DS-005 runtime-audit variant tests:** the 10 variant-material assertions assert
`bg-*/10` but the certified legacy Badge render (pre-5.4D) uses `bg-*/15 border-*/30`. This is a
**pre-existing test/implementation mismatch** — identical before and after this phase (proven at
HEAD). It is not a regression and is not in 5.4D scope.

---

## 6. Rollback

- `git checkout` the 10 component files → pre-5.4D `Badge`/`DifficultyBadge`/`TagBadge` and no Pill
  components (exact previous renderers).
- Governance edits are revertable single-file changes (version bump + additive section).
- No token or recipe value was changed, so no Freeze Register value rollback applies.

---

## 7. Definition of Done

- [x] ONE `Pill` primitive created (12 roles, one owner per role; 9 states; XS/SM/MD/LG scale)
- [x] Every badge/pill rewritten as a thin wrapper; `Badge`/`DifficultyBadge` class-token-identical
- [x] `TagBadge` raw palette replaced by semantic tokens (no amber in the Foundation)
- [x] Typography always through DS-016; semantic colors only; subtle no-scale hover; a11y (focus
      ring, aria, disabled, loading)
- [x] Verification: tsc/build/eslint at baseline; render identity 12/12; vitest baseline (0 new)
- [x] Governance v1.24.0 §4 + D-168 + freeze register DS-017
- [x] No consumer/page/theme/token file touched
- [ ] **USER CERTIFICATION** (pending — `PHASE_5_4D_CERTIFICATION.md`)

## Next gate

**Phase 5.4D is IMPLEMENTED (awaiting user certification).** On certification, 5.4D CLOSES (the
Pill/Badge Foundation is permanently frozen under DS-017). TagBadge/RankBadge/consumer-pill visual
migration = 5.4G repository migration (separate approval). Contrast gates C-1…C-5 remain OPEN — each
a separate dedicated approval (never batched). Subsequent gates: 5.4E (Hover & Motion), 5.4F
(Skeleton).
