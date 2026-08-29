# FOUNDATION_EMPTY_STATE_LANGUAGE

- **Phase:** 3.7/V — Task 16: Empty State Language
- **Status:** SPECIFICATION (evidence-based, read-only). Awaiting approval for Foundation-first
  implementation.
- **Governing rule:** every empty/error/no-results state has the SAME spacing, SAME icon size, SAME
  title style, SAME description style, SAME action button placement, SAME illustration behavior.
  Never use emoji.

---

## 1. Current state (evidence)

The Foundation has **three competing empty-state footprints** plus hand-rolled variants:

1. `EmptyState` (`SharedComponents.tsx:144-181`): `p-12 rounded-[32px] gap-2 text-center`, icon
   `text-5xl` (default `📂` emoji, `role="img"`), title `text-xl font-black uppercase tracking-tight
   Vend_Sans`, subtitle `text-sm font-bold max-w-sm`, action `mt-6 px-10` Button. `variant="management"`
   supported. `rounded-[32px]` is an arbitrary radius outside `--radius-container` (24px).
2. `ErrorState` (`:99-142`): icon `text-4xl` (default `⚠️`), title `text-lg font-bold`, buttons
   `px-6/px-8`.
3. `ErrorContainer` (`ErrorContainer.tsx:66-94`): `Card variant="default" padding=24`, `IconBadge`
   `w-20` circle, `gap-5` stack.
4. **Hand-rolled** (`ExamPaperGrid.tsx:108-117` `text-5xl` 📚 + H2; `SubAdminStudents.tsx:57-60`
   `Card subtle py-16` + `Users size=64 opacity-40`).

**Observed inconsistencies (evidence):**
- **Icon primitive not normalized:** lucide `size=48` vs `size=40` (AdminTopics:67) vs emoji string
  (`📈🏆📊📚🔒🛡️`) vs absent→default `📂` vs `AlertCircle`/`BarChart3`/`Search`.
- **Container padding spread:** Foundation `p-12` vs consumer wrappers `py-8`/`py-12`/`py-16`/`py-20`
  (UserPerformance:64, UserLeaderboard:108, UserHistory:53, SubAdminStudents:46, ExamPaperGrid:109).
- **Title style:** Foundation forces UPPERCASE+Vend_Sans; hand-rolled accepts title-case H2
  (ExamPaperGrid:112).
- **Action placement:** Foundation `mt-6 px-10`; consumers sometimes pass action, sometimes not;
  ErrorContainer differs again.
- **Illustration behavior:** none use illustrations; all are icon-based.

---

## 2. Foundation empty-state contract (proposal)

ONE `EmptyState` (fold `ErrorState`/`ErrorContainer` into it as a single component with a `tone`
prop: `empty` / `error` / `management`). Every empty state renders the same slots:

```
┌ Container (ONE surface + radius + padding)
│   ICON (ONE size, ONE box or none — NO emoji)
│   TITLE (ONE style)
│   DESCRIPTION (ONE style, muted)
│   ACTION (ONE placement)
```

### 2.1 Contract rules
| Aspect | Value |
|---|---|
| Container | `Card` surface (`variant="default"` / `management`), `padding=24`, `rounded-[var(--radius-container)]` (24px — retire the `[32px]`), `gap-2` (space-y) |
| Padding | ONE documented value `p-6 md:p-12` (or via `Card padding=24`); consumers never add `py-*` wrappers |
| Icon | ONE size: lucide `size={48}` (or a single `icon` box); **emoji banned** (default `📂`/`⚠️` replaced by lucide equivalents, e.g. `Inbox`/`AlertTriangle`) |
| Title | `text-xl font-black uppercase tracking-tight` (keep) |
| Description | `text-sm` muted, `max-w-sm` (keep) |
| Action | ONE slot: single `Button` `mt-6` (retire `px-10` divergence) |
| Illustration | decorative illustrations allowed ONLY via an explicit `illustration` prop; default none |

### 2.2 Never
- Never use emoji in an empty/error state (T16) — the `icon` prop accepts a component, not a string.
- Never hand-roll an empty state (ExamPaperGrid/SubAdminStudents pattern) — use `EmptyState`.
- Never add page-level `py-*`/`mt-*` wrappers — the container owns all vertical space.

---

## 3. Foundation evolution proposal

- Merge `ErrorState`/`ErrorContainer` into ONE `EmptyState` with `tone` (`empty`/`error`/`management`),
  one radius (`--radius-container`), one padding, one icon slot, one title/desc/action recipe.
- Replace the default emoji icons with lucide (`Inbox`/`AlertTriangle`).
- Keep backward-compatible props (`variant="management"`).
- No new tokens; radius normalization removes `[32px]`.

---

## 4. Migration (foundation-first)

1. Build the unified `EmptyState` (tone + no-emoji icon).
2. Migrate hand-rolled states (ExamPaperGrid, SubAdminStudents, TeacherLeaderboardModal, admin
   states) onto `EmptyState`.
3. Replace emoji icons (`📈🏆📊📚🔒`) with lucide.
4. Remove page `py-*` wrappers.

---

## 5. Status

- **PROPOSED** — no page change until EmptyState is unified (Foundation-first). Evidence:
  `FOUNDATION_VISUAL_LANGUAGE_AUDIT.md §3.6`.