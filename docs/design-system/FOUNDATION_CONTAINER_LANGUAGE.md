# FOUNDATION_CONTAINER_LANGUAGE

- **Phase:** 3.7/V — Task 12: Container Language
- **Status:** SPECIFICATION (evidence-based, read-only). Awaiting approval for Foundation-first
  implementation.
- **Governing rule:** every container (Dashboard/Admin/Performance/History/Analytics/Settings/Question/
  User/Exam) uses ONE background, ONE border language, ONE radius language, ONE shadow language, ONE
  hover language, ONE spacing language. Never invent a new container.

---

## 1. Current state (evidence)

The certified Foundation already owns the **container surface token family** and a small set of
sanctioned generic containers:

- **Session-groups surfaces** (Semantic tokens): `--bg-app`, `--bg-surface`, `--bg-elevated`,
  `--bg-hover`, `--bg-active`, `--bg-input`, `--bg-overlay`; borders `--border-default`,
  `--border-input`, `--border-subtle`; radius `radius-container 24px`; shadows `--elevation-1..4`.
- **Sanctioned generic containers** (`AntigravityLayout.tsx`):
  - `CollectionToolbar`/`FilterBar` (206-222): `p-3 md:p-4 rounded-2xl` + `PREMIUM_SURFACE` or
    `MANAGEMENT_SURFACE`.
  - `SelectionContainer` (45-62): `rounded-2xl p-3` + premium/management.
  - `PageContainer` (37): `max-w-[1280px]` centered.
  - `PageHeader` / `SectionHeader` / `Stack` / `Grid`.
- Certified `Card` variants = the section/card surface ladder (DS-020).

**Deviations cluster into a few repeat groups (not page-specific):**

1. **Hand-rolled "section/card rail" surfaces** — `ReviewLayout.tsx:55,78` (`shadow-2xl/xl
   rounded-[32px] p-8`), `LeaderboardTopCard.tsx:17` (gold gradient shell), `ResultView.tsx:76`
   (`p-12 text-center`), `Unauthorized.tsx:24` (`rounded-[40px]`). These are containers that never use
   a Foundation container/card.
2. **Width re-wrap** — `ResultsPage.tsx:57` and `ReviewLayout.tsx:54` wrap the already-1280px
   `PageContainer` in an inner `max-w-[1200px]`; Login/Signup wrap `max-w-[1200px] grid`. Page-specific
   widths duplicate `PageContainer`.
3. **Ad-hoc section surroundings** (borders/shadows): `border-primary/30` rails, gold `rgba` shadows,
   `bg-card-bg/90 backdrop-blur`, raw `#C8960C` sidebar override.
4. **Numeric section spacing** (`gap={48}`, `space-y-8`, `gap={24/32}`, `gap={16}`) breaks the
   spacing token ladder.

---

## 2. Foundation container contract (proposal)

### 2.1 ONE background / border / radius / shadow / hover / spacing per container tier
Define **exactly these container roles** (all already derivable from existing tokens/components; no
new tokens, no new component invention beyond what the container language needs):

| Role | Primitive | Radius | Border | Shadow | Hover |
|---|---|---|---|---|---|
| Page | `PageContainer` | — | — | — | — |
| Section wrapper | (T13 companion — `Stack` + optional `PageHeader`/`SectionHeader`) | — | — | — | — |
| Card / panel | `Card` variant ladder (DS-020) | card 20px | card border | card shadow | `CARD_HOVER` |
| Toolbar/filter rail | `CollectionToolbar`/`FilterBar`/`SelectionContainer` | container 24px | border-subtle | — | surface-fill |
| Management rail | `CollectionToolbar` `variant="management"` | container | management border | management shadow | — |

### 2.2 Rules (never)
- **Never invent a new container component/surface.** A box that is not a Page, Section, Card,
  Toolbar, SelectionContainer or Modal must map onto one of those (or explicitly be a page-layout
  flex wrapper via `Stack`/`Grid`).
- **Never re-wrap `PageContainer`** with a second `max-w-[…]` (one width authority: 1280px).
- **Never add a page-specific background/border/shadow** to an otherwise-generic container. Surface
  intent (premium vs management vs subtle) is expressed via the `Card`/toolbar `variant`, never via
  ad-hoc classes.
- **Never use arbitrary radius** on a container surface prop (use the three radius tokens).
- **Never use `space-y-8`/`gap={48}`** where a `Stack`/`Grid` gap token applies.

### 2.3 Spacing (ONE spacing language)
Sections are separated by ONE rhythm — the layout gap tokens via `Stack` (`gap="lg"` for page sections,
the `section` alias 32px) and the `space-*` ladders in shared component line. Numeric literals are
banned on page containers.

---

## 3. Foundation evolution proposal (implement once)

- **Restore a canonical Section-block primitive** (a thin composite over `Stack` + optional
  `PageHeader`/`SectionHeader` + optional divider) so every page section uses the same wrapper and
  gap. This is the single missing primitive for T13, and it also removes the `gap={48}`/`space-y-8`
  page dialects. (Note: `SectionWrapper`/`SectionBlock` were previously deleted as dead — a new,
  honestly-consumed primitive is additive.)
- Wire the "container language" into `Card` (surface + hover) and the three toolbars so pages stop
  hand-rolling rails. No token-value change required for the dark mode; light brightening is DS-020.

---

## 4. Consumer migration (foundation-first)

1. Remove page `max-w-[1200px]` re-wraps (ResultsPage, ReviewLayout, Auth) → rely on `PageContainer`.
2. Route ReviewLayout/ResultsView/Unauthorized containers onto `Card`/premium variants (T11 partner).
3. Replace numeric `Stack gap={48/24/16}` & `space-y-8` with the gap ladder.
4. Converge hover-fill alphas (`/40 /30 /20`) + divider alphas to the single contract
   (`FOUNDATION_CARD_LANGUAGE.md §2.3` / hover in DS-018).

---

## 4. Status

- **PROPOSED** — no page/container change until Foundation primitives are built & approved
  (Foundation-first). Evidence: `FOUNDATION_VISUAL_LANGUAGE_AUDIT.md §3.1/§3.3`.