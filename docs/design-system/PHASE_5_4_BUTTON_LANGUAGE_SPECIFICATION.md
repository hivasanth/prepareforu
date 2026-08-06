# Phase 5.4 — Button Language Specification

**Status:** SPECIFICATION (planning) — no Foundation evolution, no token changes, no component changes, no consumer migration.
**Role:** Lead Foundation Architect.
**Date:** 2026-08-04
**Companion docs:** `PHASE_5_4_VISUAL_LANGUAGE_AUDIT.md` (§3.3), `FOUNDATION_VISUAL_MIGRATION_PLAN.md`.
**Governance:** adopting this spec is a D-series decision; the `AntigravityButton` evolution it proposes is a separate implementation decision gated by approval.

---

## 1. Purpose

Define **one** button language for the entire repository: one material, one size ladder, one elevation model, one hover/pressed/focus/disabled state model. **Only color varies by action.** Every button-like element must be a `Button`/`IconButton` variant — no raw `<button>`/`<a>` reproductions, no `!h-*`/`!w-*`/`!bg-*` hacks.

---

## 2. The Single Button Material (depth model — fixes the light-mode flatness)

One permanent material with one elevation story in both themes. Applied identically to every variant.

| State | Recipe | Rationale |
|---|---|---|
| rest | `shadow-[var(--elevation-1)]` + `border` (1.8px, transparent for filled variants) | seated on the surface, gentle lift |
| hover | `hover:-translate-y-0.5 hover:shadow-[var(--elevation-3)]` + color step (below) | the SAME elevate+shadow language as Cards — one elevation geometry |
| active/pressed | `active:translate-y-0` + `active:shadow-[var(--elevation-1)]` + `active:brightness-95` | pressed back into the surface; felt press feedback on every variant |
| focus | global `:focus-visible` ring (2px `--focus-ring-color`, 2px offset) | already global; buttons must not disable it |
| disabled | `opacity-30` + `cursor-not-allowed pointer-events-none` | certified current behavior retained |

- **Motion:** the universal `whileHover={{ scale: 1.01 }}` is **removed** (it coexists with class hovers and double-animates). The single hover is the class-based elevate+shadow; scale is not a button gesture. Respect `prefers-reduced-motion` (already global).
- **Color is the only variant delta.** The recipes below differ in `bg/border/text/hover-bg` only.

---

## 3. Action → Variant Mapping (one color per action category)

| Action category | Variant | Light material | Dark material | Hover |
|---|---|---|---|---|
| Primary / primary CTA | `primary` | `--material-button-primary-surface` (forest gradient) + white text | `--color-accent` + white text | `hover:brightness-110` |
| Secondary / neutral action | `secondary` | `--bg-surface` + `--border-subtle` + `--text-primary` | `--bg-hover` + `--border-subtle` + `--text-primary` | elevate + shadow |
| Destructive | `danger` | `--color-danger` + white text | `--color-danger` + white text | `hover:brightness-105` |
| Success / confirm | `success` | `--color-success` + white text | `--color-success` + white text | `hover:brightness-105` |
| Low-emphasis inline | `soft` | `--color-accent/10` bg + accent text + `--border-accent/20` | same (tokenized) | `hover:bg-accent/20` |
| Borderless / toolbar icon | `ghost` | transparent + `--text-secondary` | transparent + `--text-secondary` | `--bg-hover` + `--text-primary` |
| Management primary (D-144) | `management` | `--management-accent` + white | `--management-accent` + white | `hover:brightness-110` |
| Management secondary | `management` | `--management-surface-muted` + `--border-strong` + `--text-primary` | `--bg-hover` + `--border-strong` | elevate + shadow |

Explicit exclusions (permanent):
- **No purple/green/etc. ad-hoc accents.** `QuestionActions.tsx:36` purple → `soft` variant (or a documented status variant if product requires it — own decision).
- **No hardcoded white/amber chips as buttons** (ExamLayout amber chip, TopicReader `bg-white`) — these migrate to `ghost`/`soft` variants.

---

## 4. Size Ladder (exact, one set)

| size | height | padding-x | font | radius | weight/tracking |
|---|---|---|---|---|---|
| xs | `h-8` (32px) | `px-3` | `text-[10px]` | `rounded-[10px]` | `font-bold tracking-wider` |
| sm | `h-9` (36px) | `px-4` | `text-xs` | `rounded-[12px]` | `font-bold tracking-wider` |
| md | `h-[48px]` | `px-6` | `text-[13px]` | `rounded-[14px]` | `font-bold tracking-wider` |
| lg | `h-[48px]` | `px-8` | `text-[14px]` | `rounded-[14px]` | `font-bold tracking-wider` |
| xl | `h-14` (56px) | `px-10` | `text-[15px]` | `rounded-[16px]` | `font-bold tracking-wider` |
| **hero (new, optional)** | `h-[56px]` | `px-12` | `text-[16px]` | `rounded-[16px]` | `font-bold tracking-wider` |

- `IconButton`: sm `w-[36px] h-[36px] rounded-[10px]`, md `w-[44px] h-[44px] rounded-xl`.
- **All radii are in this ladder.** `rounded-[13px]` (QuestionNavigator) → `rounded-[12px]` (sm) or `rounded-[14px]` (md). No other radius on a button.
- **No inline `style={{height}}`, no `!h-*`/`!w-*`, no `py-*` on a fixed-height button.** Consumers that need a larger CTA use `hero`/`xl`; smaller use `sm`/`xs`.
- Width (`w-full`, `flex-1`, `min-w-*`) remains a consumer-layout concern and is allowed.

---

## 5. Typography & Spacing (invariant)

- `text-transform: uppercase`, `font-bold`, `tracking-wider` for every button (already the base). Overrides like `text-sm`/`text-base`/`text-lg`/`font-black` on buttons are removed.
- Internal icon gap: `gap-1.5` standard; icons sized relative to font size.
- Padding-x from the ladder only; `px-8`/`px-10` overrides only via the corresponding size, never by hand.

---

## 6. Gap-to-Spec Register (from the audit)

| # | Violation | Location | Remediation |
|---|---|---|---|
| B-1 | `!h-9 sm:!h-10` + text overrides + color-kill | BulkActionBar.tsx:30,33 | use `size="sm"` (36px) or `xs`; secondary stays secondary |
| B-2 | `py-4 text-lg/text-base` on fixed h-[48px] | SubmitExamModal.tsx:62,70 | use `hero`/`xl` size |
| B-3 | `!w-8 !h-8` icon buttons | TopicListItem.tsx (×6) | `IconButton size="xs"` |
| B-4 | `!w-8 !h-8 !rounded-xl !bg-app-bg` icon buttons | QuestionsTableComponents.tsx:16,27,38 | `IconButton size="xs"` + row-action variant |
| B-5 | `h-14`, `h-[58px]`, `h-10`, inline height | CreateStepPrompt.tsx:78,94; CreateStepPublish.tsx:67,77; ExamDetailSection.tsx:104,115 | `hero` (56px) / `xl` / `md` / `sm` |
| B-6 | `rounded-[13px]` | QuestionNavigator.tsx:19-37,104-116 | `rounded-[12px]` (sm) |
| B-7 | purple mark-for-review | QuestionActions.tsx:36 | `soft` variant |
| B-8 | ~20 raw button elements (exam + create flows, TopicReader, TopicInfoButton, BilingualToggle, SuccessView, micro-buttons) | see audit §D | migrate to `Button`/`IconButton` variants |
| B-9 | conflicting double shadows / scale | universal `whileHover scale` + class hovers | remove motion-scale; single class hover |
| B-10 | md/lg identical (48px) forcing hacks | size ladder | add `hero` 56px |

---

## 7. Acceptance Criteria (applied at each evolution's certification)

1. Every button-like element in `src` is a `Button`/`IconButton` with a documented variant + size; zero raw-button reproductions.
2. Zero `!h-*`/`!w-*`/`!bg-*`/`!rounded-*`/`!text-*` hacks on buttons.
3. One elevation story (rest/hover/pressed) on every variant; one color per action category.
4. All radii/heights from the ladder; no `rounded-[13px]`, no inline heights.
5. Dark rendering byte-identical to the certified baseline (this evolution is light-first where it must be, and the material is theme-tokenized).
6. Verification: TypeScript build, production build, ESLint baseline (397), vitest audit baseline (33/301), hover/focus/active/disabled manual checks in light + dark.

---

## 8. Rollback

- Consumer migration: revert per-file variant swap (single commit per consumer).
- Button evolution: revert `AntigravityButton.tsx` change (additive — new `hero` size, removed motion-scale, tokenized recipes).
All changes additive or per-consumer reversible; never mutates a certified variant's render in dark.

---

*End of Button Language Specification. No code changes are authorized by this document.*
