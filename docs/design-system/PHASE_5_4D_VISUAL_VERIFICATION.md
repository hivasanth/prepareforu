# Phase 5.4D — Pills & Badges Language: Visual Verification

- **Phase:** 5.4D (Pills & Badges Language)
- **Status:** IMPLEMENTED 2026-08-06 — automated evidence complete; manual visual checks await user
  confirmation during certification
- **Key property:** Phase 5.4D is a **structural** change — one `Pill` primitive + thin wrappers —
  where `Badge`/`DifficultyBadge` renders are **class-token-identical** to pre-5.4D, and `TagBadge`
  has the **one mandated visual change** (raw amber/emerald/rose/purple/sky palette → semantic
  tokens). Visual verification therefore verifies rendered-output identity for the preserved
  components, the intended semantic migration for `TagBadge`, the interaction contract for the new
  interactive pills, and the build/lint/test baselines.

---

## 1. Automated / mechanical evidence (executed)

### 1.1 TypeScript

```
npx tsc -b        → exit 0
```

### 1.2 Production build

```
npm run build      → exit 0 (51.76s)
```

Pre-existing benign warnings only (chunk-size advisory).

### 1.3 ESLint baseline (regression guard)

```
npx eslint .       → 397 problems (344 errors / 53 warnings)
```

**Exactly the pre-5.4D baseline. Zero new lint problems introduced — including zero in the 6 new
files.** (Remaining findings are the pre-existing repo-wide FileName-rule errors.)

### 1.4 Render-identity proof (server-render + DOM assertions)

Temporary test `src/__5_4d_render_check.test.tsx` (created for proof, **removed after** the run;
never committed) asserted:

| Component | Assertion | Result |
|---|---|---|
| `Badge` md default | class tokens = `h-7 px-3 rounded-[14px] text-[10px] tracking-wider font-bold uppercase border flex items-center gap-1.5 w-fit bg-hover-bg text-text-secondary border-border-subtle` | ✅ |
| `Badge` sm + all 6 legacy variants | class tokens = legacy sm recipe + `bg-*/15 text-* border-*/30` materials (default/success/danger/warning/primary/secondary) | ✅ |
| `Badge` icon | `<svg>` present + `data-role="information"` | ✅ |
| `DifficultyBadge` easy/medium/hard | success/warning/danger semantic materials only | ✅ |
| `TagBadge` IMP/TIP/ALERT/KEY | warning/success/danger/primary materials + **zero** amber/emerald/rose/purple/sky classes | ✅ |
| `StatusBadge` / `CounterBadge` | `data-role="status"/"counter"` + size/variant defaults | ✅ |
| `FilterPill` (rest) | `<button>`, neutral border language (`bg-transparent text-text-secondary border-border-subtle`), `data-role="filter"`, `aria-pressed`, visible focus ring, management-surface hover fill | ✅ |
| `FilterPill` / `SelectionPill` (selected) | Management Surface selection colors (`--management-surface-active`/`--management-accent`/`--management-border-active`) + `aria-pressed="true"` | ✅ |
| `NavigationPill` (current / rest) | solid `bg-primary text-white border-primary` + `aria-current="page"` / neutral border at rest | ✅ |
| `Pill` loading | `Spinner` (`role="status"`) + `aria-busy="true"` | ✅ |
| `Pill` disabled | native `disabled` | ✅ |
| `Pill` inactive | neutral border language, no amber | ✅ |

**Result: 12/12 assertions passed.**

### 1.5 Vitest baseline proof (no new failures)

- **Default config caveat:** `vitest.config.ts` (tailwind plugin) cannot start with the
  pre-existing `@csstools/css-calc` ERR_REQUIRE_ESM — runs must use
  `--config vitest.audit.config.ts`.
- **Baseline worktree:** clean worktree at HEAD `453b5d7` run via the audit config:
  **301 passed, 33 failed** (ds003/ds005/ds014 — pre-existing failures).
- **Working tree:** **301 passed, 33 failed** — **identical**.
- **Conclusion: 0 new failures introduced by 5.4D.** Temp test removed.

> Note: 10 of the 33 pre-existing failures are DS-005 variant-material assertions that expect
> `bg-*/10` while the certified legacy Badge renders `bg-*/15 border-*/30` — a pre-existing
> test/impl mismatch proven identical at HEAD (before this phase).

### 1.6 Import-collision check

`Pill` identifier searched across `src/` (grep) before implementation → **0 matches**. The new
primitive introduces no name collision.

### 1.7 Scope sweep (no consumer drift)

`git status --short src` after implementation:

```
 M src/components/admin/common/DifficultyBadge.tsx
 M src/components/common/AntigravityData.tsx
 M src/components/common/AntigravityUI.tsx
 M src/components/user/TagBadge.tsx
?? src/components/common/CounterBadge.tsx
?? src/components/common/FilterPill.tsx
?? src/components/common/NavigationPill.tsx
?? src/components/common/Pill.tsx
?? src/components/common/SelectionPill.tsx
?? src/components/common/StatusBadge.tsx
```

Only the 6 new Foundation files + 4 Foundation/wrapper files. (The `Typography.tsx`/`AdminText.tsx`/
`AntigravityTypography.tsx` lines shown by a broader sweep are the still-uncommitted **5.4C** work —
not part of 5.4D.) **No consumer, page, theme, or token file modified.**

---

## 2. Manual visual checks (recommended — await user confirmation)

| # | Check | Expected |
|---|---|---|
| M1 | **Badge consumers** — StudentsTable, TeacherLeaderboardModal ranks, TeacherExamCard, SubjectCardItem, ProfileForm, ParsedPreview, AttemptCardBase (dark + light) | pixel-identical to pre-5.4D (same classes, same colors, same sizes) |
| M2 | **DifficultyBadge** in QuestionsTable (easy/medium/hard) | same success/warning/danger rendering as before |
| M3 | **TagBadge** in TopicSectionRenderer / AdminTopicPreviewRenderer (IMP/TIP/ALERT/KEY/default) | **intended migration**: amber→warning, emerald→success, rose→danger, purple→primary, sky→secondary; label→div; rounded→rounded-full; 10px→9px; height now fixed h-5 |
| M4 | **FilterPill / SelectionPill** (demo state in a dev page if desired) | rest = neutral outline chip; selected = accent-tinted chip; hover = subtle fill; focus = 2px ring; no scale/lift |
| M5 | **NavigationPill** (current + rest) | current = solid primary pill; rest = neutral outline with hover fill |
| M6 | **Disabled / Loading** states (Pill API) | disabled = 40% opacity neutral; loading = spinner replacing text, `aria-busy` |

---

## 3. Conclusion

All mechanically verifiable invariants pass. `Badge` and `DifficultyBadge` render
**class-token-identically** to their pre-5.4D output (the DS-005 contract is preserved). `TagBadge`
shows the **single mandated visual change** (semantic tokens replace the raw palette — the 
Foundation now contains zero amber). The new interactive pills implement the certified subtle hover,
visible focus ring, disabled, and loading contracts. Build, typecheck, lint, and the vitest baseline
are unchanged (0 new failures). The pills & badges language is now enforced through ONE primitive.
