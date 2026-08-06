# SURFACE_IMPLEMENTATION_PLAN

> **Phase 3.3 — documentation only.** This is the complete engineering roadmap for Phase 3.4. No implementation happens in Phase 3.3. Every recommendation below is approved for *documentation*; execution requires separate approval per batch.
>
> **Execution model:** P0 → verify → P1 → verify → P2 → verify → P3 → verify → final certification. Each batch is independently verifiable (TypeScript build, ESLint, production build, visual comparison, accessibility).

---

## 1. Step 13 — One Owner per Surface (single-owner map)

| Layer | Single owner | Inherit/define | Consumers |
|---|---|---|---|
| L0 App Canvas | Layout (body/main) | define `--bg-app` | all |
| L1 Sidebar | `Navigation` | define nav tokens | 3 layouts |
| L2 Page | `PageContainer` | transparent | all |
| L3 Section | `SectionBlock` | transparent | all |
| L4 Toolbar | `CollectionToolbar` | **inherit `Card` premium recipe** | 5+ |
| L5 Card | `Card` | define premium recipe (golden) | 37+ |
| L6 Collection | `CollectionCard` | **inherit `Card`** | 10+ |
| L7 Selection | `SelectionContainer` | inherit premium | 3 |
| L8 Control | `Button`/`Tabs`/`Badge` | define | entire app |
| L9 Input | `Input`/`Select`/`Checkbox`/`Switch`/`RadioGroup` | define control tokens | admin/auth/exam |
| L10 Dropdown | `Menu` | define floating panel | 5+ |
| L11 Modal | `AdminModal` | define modal tokens (radius/shadow) | admin CRUD |
| L12 Overlay | `AdminModal` (shared backdrop contract) | define overlay opacity/blur | all modals |
| L13 Toast | **NEW Foundation `Toast`** | define toast tokens | every page |
| L14 Loading | `LoadingSkeleton`/`StatSkeleton`/`Spinner` | unify radii | CollectionCard, DataTable |
| L15 Chart | `ChartVisualizer` | define chart container tokens | dashboards |
| L16 Badge | `Badge` | define | everywhere |
| L17 Stat | `StatCard` | define stat tokens | dashboard/perf/results |

Rule: **never two owners for the same layer.** PremiumSelect must inherit the Menu panel; SegmentedFilter/BilingualToggle must inherit Tabs; TagBadge must inherit Badge; TopicInfoButton must inherit Tooltip.

---

## 2. Step 17 — Surface Lifecycle Recommendations

| Decision | Surfaces |
|---|---|
| **Stay** | Premium, Control, Neutral (exam), Collection, Selection, Menu, Button, Stat languages |
| **Merge** | PremiumSelect panel → Menu; SegmentedFilter/BilingualToggle → Tabs; TagBadge → Badge; IconBadge/AdminIconWrap → icon consolidation; LeaderboardTablet/Mobile → LeaderboardCard; WelcomeBanner → Card hero; BulkActionBar divider → `border-border-subtle`; palette states → state tokens |
| **Disappear** | `premium-neutral` (≡ `premium-dark-neutral`); Menu redundant border pair; duplicate toast surface; `.ancient-*` classes (progressively); TopicInfoButton raw tooltip; legacy Progress bars; duplicate selected-row implementations |
| **Promote** | ToastContainer → Foundation `Toast`; Topic notebook → `NotebookCard` (only if product keeps the reading experience) |
| **Keep (tokenize)** | Auth violet, Splash brand, CarouselDots, StatCard status path |
| **New owner** | L13 Toast (Foundation `Toast`); shared Overlay contract |

---

## 3. P0 — Safe Foundation Consolidation

Characteristics: zero behavior change, zero visual regression expected, token consolidation, duplicate removal, radius normalization, shadow/border normalization, dead visual code removal, duplicate utility removal, barrel cleanup. Risk: **Very Low** (except where noted).

| ID | Component | File:Line | Current | Target | Risk | Dependencies | Effort | Notes |
|---|---|---|---|---|---|---|---|---|
| P0-1 | `premium-neutral` variant | `AntigravityCard.tsx:21` | duplicate of `premium-dark-neutral:22` | remove `premium-neutral`; keep `premium-dark-neutral` as canonical | Very Low | verify no consumer passes `premium-neutral` | S | **governance: frozen Card — additive removal requires approval** |
| P0-2 | Menu border pair | `Menu.tsx:275` | `border ... border-border-subtle` | drop duplicate `border` utility | Very Low | Menu consumers (5+) | XS | |
| P0-3 | Radius token conflict D-01 | `themes.css` vs `index.css` `@theme` | 20/24/20 vs 12/16/20 | pick one authority (recommend `@theme` 12/16/20) and remove dead `themes.css` radius block | Very Low | visual diff on all radii consumers | S | verify all rounded-xl/2xl/3xl |
| P0-4 | `--secondary` literal D-02 | `themes.css`, `LeaderboardView.tsx:125` | fixed green literal | theme `--secondary` per mode; update bar consumer | Low | LeaderboardView | S | |
| P0-5 | `--elevation-carved` dark gap D-03 | `themes.css` | undefined in dark | define dark `--elevation-carved` (e.g. elevation-3 equivalent) | **Low-Medium — visual change to frozen Card premium in dark** | Card, CollectionCard, AttemptCard, CollectionFilter, Button secondary | M | **governance: frozen components — re-audit + explicit approval required** |
| P0-6 | `--material-card-premium-border` dark gap D-04 | `themes.css` | transparent in dark | define dark premium border (e.g. `rgba(200,150,12,0.35)`) | **Low-Medium — visual change to frozen components** | Card, Button secondary, ThemeToggle, CollectionToolbar, CollectionCard | M | **governance: re-audit + approval** |
| P0-7 | Toast radius/shadow literals (tokenize only) | `useToast.tsx:54` | `rounded-2xl shadow-2xl` inline | move to utility classes while keeping visuals | Very Low | none (visual unchanged) | XS | partial P0 (full Toast promote = P1) |
| P0-8 | `--border-gold` dark gap D-05 | `themes.css` | undefined in dark | define dark value or alias to premium border | Low-Medium | StatCard skeleton family, `AntigravityLayout:54` | S | visual change in dark only |

> **Governance note:** P0-5/P0-6/P0-8 change the *appearance of frozen components in dark mode* (adding a previously-missing border/shadow). Per the Permanent Freeze Rule (V3.1) and `FOUNDATION_FREEZE_REGISTER.md`, visual/material changes to frozen components require re-audit + explicit approval. These are classified as **bug fixes** (dark-mode rendering defects) but must still pass the approval gate before execution.

---

## 4. P1 — Foundation Component Refinement

Characteristics: reusable component improvements, shared visual language, better token ownership, a11y, hover/focus, animation consistency. Risk: Low.

| ID | Component | File:Line | Current | Target | Risk | Dependencies | Effort | Notes |
|---|---|---|---|---|---|---|---|---|
| P1-1 | PremiumSelect | `PremiumSelect.tsx:211` | own panel recipe | inherit `Menu.Content` surface | Low | Menu API (≥3 consumers rule satisfied: FilterSelect, CollectionFilter, NotificationPanel) | M | keep trigger styling |
| P1-2 | Modal radius/shadow tokenization | `AdminModal.tsx:82`, `AddExamModal.tsx:200`, `LanguageSelectionScreen.tsx:28`, `ReviewLayout.tsx` | 2.5rem / 28px / 32px + `shadow-2xl` | single modal radius token + modal shadow token | Low | AdminModal (frozen — additive prop/const ok) | M | one modal family |
| P1-3 | Skeleton family | `SharedComponents.tsx:16/58/129` | 2xl / 24px / 32px | unify to one skeleton radius token | Low | CollectionCard, DataTable, Portal | S | |
| P1-4 | Toast → Foundation `Toast` | `useToast.tsx` | inline styles, no owner | new `Toast` owning L13 (token-bound, one animation) | Low | every `useToast` consumer (backward-compatible hook) | M | promotes L13 owner |
| P1-5 | Tooltip adoption | `TopicInfoButton.tsx:82`, frozen `Tooltip` | raw `shadow-xl` tooltip | migrate TopicInfoButton to frozen `Tooltip` | Low | Tooltip (frozen, zero consumers) | S | also SidebarLayout leak |
| P1-6 | Z-index single source | `Menu.tsx:68`, `Navigation.tsx:215`, `PremiumSelect.tsx:211`, `AdminModal.tsx:76`, `AddExamModal.tsx:193` | 50 / 200 / 1000 / 50 / 1000 | z-index scale token (`--z-*`): dropdown 30, sticky 40, tooltip 50, modal 100, loading 200, toast 9999+ | Low | all modal/dropdown owners | M | P-020 |
| P1-7 | Shared overlay contract | `AdminModal.tsx:78`, `ActiveExamPage.tsx:220`, `UploadProgressOverlay.tsx:26` | /60 /80 /95 | one backdrop token (opacity + blur) | Low | modal owners | S | P-021 |
| P1-8 | SegmentedFilter/BilingualToggle → Tabs | `SegmentedFilter.tsx`, `BilingualToggle.tsx` | own pill surfaces | inherit `Tabs` | Low | Tabs (frozen) | M | P-015 |
| P1-9 | Animation unification | `useToast.tsx:45`, `SplashPage.tsx:200`, `DiagramRenderer.tsx:351` | 2 inline keyframes + custom utility | motion tokens; adopt TailwindCSS Animate or Framer presets | Low | Toast, Splash | S | P-025 |

---

## 5. P2 — Consumer Migration

Characteristics: page-level adoption of already-certified Foundation components. Never introduces new visual language. Risk: Low.

| ID | Page/Area | Components replaced | Foundation reused | Expected code reduction | Risk |
|---|---|---|---|---|---|
| P2-1 | Admin Questions | palette hex → state tokens | Badge, state tokens | small | Low |
| P2-2 | User Dashboard | WelcomeBanner → Card hero | Card | medium | Low |
| P2-3 | Study Topics | notebook parchment → NotebookCard/Card | Card (or NotebookCard) | large | Medium (product decision) |
| P2-4 | Leaderboard | tablet/mobile cards → LeaderboardCard | Card | medium | Low |
| P2-5 | Admin/User lists | selected-row `!important` → shared selection utility | shared | small | Low |
| P2-6 | TagBadge consumers | TagBadge → Badge | Badge | small | Low |
| P2-7 | icon wrappers | inline `bg-*/10`, AdminIconWrap → consolidated | IconBadge/PremiumIconContainer | medium | Low |
| P2-8 | exam palette | `paletteColors.ts` → semantic state tokens | Badge/state tokens | medium | Low |
| P2-9 | SidebarLayout | `.ancient-sidebar`, `bg-slate-900` drawer → nav tokens | Navigation | small | Low |
| P2-10 | Progress legacies | SubAdminExams/Splash/Leaderboard raw bars → ProgressBar | ProgressBar | small | Low |

---

## 6. P3 — Legacy Surface Retirement

Characteristics: one-off legacy components, decorative surfaces, duplicate visual systems, obsolete wrappers, historic UI patterns.

| ID | Surface | Owner | Proposed replacement | Migration difficulty | Dependencies | Retirement recommendation |
|---|---|---|---|---|---|---|
| P3-1 | `.ancient-card-dark` | WelcomeBanner | Card hero | Medium | Card | Retire (after P2-2) |
| P3-2 | Notebook parchment | TopicSectionRenderer/TopicReader | NotebookCard or Card | Medium | product decision | Retire or Promote |
| P3-3 | TopicInfoButton raw tooltip | TopicInfoButton | Tooltip | Low | Tooltip | Retire (after P1-5) |
| P3-4 | `FilterBar` deprecated alias | AntigravityLayout | CollectionToolbar | Low | — | Retire alias in a later phase |
| P3-5 | CarouselDots primitives | CarouselDots | tokenized | Low | — | Keep + tokenize |
| P3-6 | Nav color literals | nav.ts/config | tokenized | Low | — | Retire literals |
| P3-7 | PremiumIconContainer primitive refs | PremiumIconContainer | semantic `--material-icon-*` | Medium | freeze governance | Defer (documented acceptable) |

---

## 7. P4 — Future Design System Evolution

Items intentionally deferred (recommendations only, no commitment):

- Foundation `Toast` with motion + variant language (built in P1-4, extended later).
- Foundation `NotebookCard` if the topic reading experience is retained.
- Unified `LeaderboardCard` composite.
- Page-level transition system (currently none).
- Shared z-index/overlay manager with nested-modal support.
- StatCard `color` → `status` migration (Phase 2A.2 debt).
- AttemptCard gold primitives → `--material-attempt-*`.
- Splash/Auth brand surface tokenization.

---

## 8. §9 — Foundation Freeze Impact

For every frozen Foundation component:

| Component | Can it still evolve? | Allowed | Not allowed |
|---|---|---|---|
| Card, StatCard, Button, Tabs, Badge, Input/Select/Checkbox/Switch, AdminModal, Tooltip, Progress | ✅ (additive only) | additive variants; bug fixes; a11y; performance; documentation | new visual language; duplicate surfaces; competing components; redesigned existing variants |
| Menu, Navigation, DataGrid/DataTable, Layout Primitives, Forms | ✅ (additive only) | additive variants; a11y; perf; docs; new non-breaking props | behavior/visual/API changes to existing contracts |
| CollectionCard, CollectionToolbar, CollectionFilter, SelectionCheckbox, CollectionHeader | ✅ (additive only) | additive props/variants; a11y; perf; docs | surface/material changes |
| ExamCard, AttemptCard, TopicCard, LeaderboardRow, PerformanceMetricsGrid, HistoryCard, QuestionCard | ✅ (additive only) | additive; a11y; perf; docs | surface/material changes |

> **Special case:** P0-5/P0-6/P0-8 (dark token gaps) touch frozen components. They qualify as **bug fixes** under the freeze rule but require the formal approval gate because they alter dark-mode appearance. If rejected, the alternative is to define the missing dark tokens in `themes.css` *without* changing any component class (purely additive token definitions) — components automatically pick up the corrected appearance. That route is the recommended, lowest-governance path.

---

## 9. §17 — Foundation Dependency Risk

| Component | Consumer count | Dependency count | Visual ownership | Migration difficulty | Risk |
|---|---|---|---|---|---|
| Card | 37+ files | tokens | high | high | **Critical** |
| Toast (proposed) | every page | none today | unowned | medium | **Critical** |
| Button | entire app | tokens | high | high | **Critical** |
| Menu | 5+ | tokens, framer | medium | medium | **Critical** |
| Input/Form | admin/auth/exam | tokens | high | high | **Critical** |
| CollectionCard | 10+ | Card | medium | medium | High |
| CollectionToolbar | 5+ | tokens | medium | medium | High |
| AdminModal | admin CRUD | tokens | medium | medium | High |
| StatCard | dashboard/perf/results | tokens | high | high | High |
| Navigation | 3 layouts | tokens | medium | medium | High |
| DataGrid/DataTable | admin | tokens | medium | medium | High |
| Tabs | 20+ | tokens | medium | medium | High |
| CollectionFilter | 1+ (growing) | Menu | low | low | Medium |
| PremiumSelect | 4 | Menu (target) | low | low | Medium |
| SelectionContainer | 3 | tokens | low | low | Medium |
| ThemeToggle | 2 | SelectionContainer | low | low | Medium |
| Topic notebook | topics | none (legacy) | high (self) | high | Medium |
| WelcomeBanner | dashboard | none | medium | medium | Medium |
| CarouselDots | dashboard | none | low | low | Low |
| IconBadge/AdminIconWrap | several | none | low | low | Low |

---

## 10. §18 — Repository Freeze Map (authoritative registry)

Sourced from `FOUNDATION_FREEZE_REGISTER.md` (root) + Phase 3.2.x history. This is the registry for `Next Allowed Change`.

| Component | Freeze status | Last certified | Current version | Next allowed change |
|---|---|---|---|---|
| Card | ✅ FROZEN | Phase 2A.1 | 1.0 | P0-1 (remove duplicate variant), P0-5/P0-6 (dark tokens via additive token defs, approval-gated) |
| StatCard | ✅ FROZEN | Phase 2A.2 | 1.0 | P2: `color`→`status` (Phase 2A.2 debt) |
| Button | ✅ FROZEN | Phase 2A.3 | 1.0 | P0-5 dark hover fix (additive token) |
| Tabs | ✅ FROZEN | Phase 2A.4 | 1.0 | P1-8 adoption by SegmentedFilter/BilingualToggle |
| Badge | ✅ FROZEN | Phase 2A.5 | 1.0 | P2-6 TagBadge adoption |
| Input/Select/Checkbox/Switch | ✅ FROZEN | Phase 2A.6/2A.7/DS-013 | 1.0 | none planned |
| AdminModal | ✅ FROZEN | Phase 2A.8 | 1.0 | P1-2 radius/shadow tokenization (additive) |
| Tooltip | ✅ FROZEN | Phase 2A.9 | 1.0 | P1-5 first consumers |
| ProgressBar | ✅ FROZEN | Phase 2A.10 | 1.0 | P2-10 legacy migration |
| PremiumIconContainer | ✅ FROZEN | Phase 2A.11 | 1.0 | P3-7 (deferred) |
| Menu | ✅ FROZEN | DS-008A → Phase 3.2.4 | 1.1 | P0-2 border cleanup; P1-1 PremiumSelect panel inheritance |
| Navigation | ✅ FROZEN | DS-009A | 1.0 | P1-6 z-index token; P2-9 legacy cleanup |
| DataGrid/DataTable | ✅ FROZEN | DS-010 | 1.0 | P1-6 sticky header z; P-036 alpha tokens |
| Tabs System | ✅ FROZEN | DS-011 | 1.0 | see Tabs |
| Layout Primitives | ✅ FROZEN | DS-012 | 1.0 | P1-6 z-index; P0-3 radius |
| Forms System | ✅ FROZEN | DS-013 | 1.0 | none planned |
| CollectionCard | ✅ FROZEN | Phase 3.2.1 | 1.1 | P2-5 selection utility |
| CollectionToolbar | ✅ FROZEN | Phase 3.2.2 | 1.0 | P0-6 dark token (additive) |
| SelectionCheckbox | ✅ FROZEN | Phase 3.2.3 | 1.0 | none planned |
| CollectionHeader | ✅ FROZEN | Phase 3.2.2 | 1.0 | none planned |
| PremiumSelect (FilterSelect) | ✅ FROZEN | Phase 3.2.2 | 1.0 | P1-1 panel inheritance (additive) |
| CollectionFilter | ✅ FROZEN | Phase 3.2.4 | 1.1 | P0-5 dark hover (additive token) |
| ThemeToggle | ⚠ pending registry entry | Phase 3.2.x surface refinement | 1.0 | inherits SelectionContainer; treat as frozen-composite |
| ExamCard / AttemptCard / TopicCard / LeaderboardRow / PerformanceMetricsGrid / HistoryCard / QuestionCard | ✅ FROZEN | Phase 2B.1A–2B.7 | 1.0–1.1 | additive only |
| **Toast** | ❌ **NOT FROZEN — NO OWNER** | — | — | **P1-4 promote to Foundation Toast** |
| SegmentedFilter / BilingualToggle / TagBadge / IconBadge / AdminIconWrap / WelcomeBanner / CarouselDots / LeaderboardTabletCard / LeaderboardMobileCard | ❌ not Foundation (legacy/duplicate) | — | — | P1/P2 merge or P3 retire |

---

## 11. §10 — Future Component Checklist (mandatory gate)

Every new reusable component MUST answer all of the following before implementation. If **any** answer is YES, the component **cannot be implemented until Phase review**.

```
□ Which existing surface does it inherit?        (must be non-empty, from the ownership matrix)
□ Which Foundation component owns it?            (exactly one)
□ Does it introduce a new shadow?                (if YES → phase review)
□ Does it introduce a new radius?                (if YES → phase review)
□ Does it introduce a new border?                (if YES → phase review)
□ Does it introduce a new hover?                 (if YES → phase review)
□ Does it introduce a new background?            (if YES → phase review)
□ Does it introduce a new animation?             (if YES → phase review)
```

Reference answers: inherit from Card/Menu/Button/Input/Tabs/Badge/StatCard/Toolbar/Navigation; owned by exactly one Foundation component; shadows/radii/borders/hover/backgrounds/animation must come from existing tokens (`--elevation-*`, `--radius-*`, `--border-*`, `--bg-*`, motion presets).

---

## 12. §11 — Repository Design Rules (permanent)

1. **One owner per surface.** A visual layer has exactly one owning component.
2. **One owner per elevation.** Shadows derive from `--elevation-*` and their owning surface.
3. **One owner per hover language.** Hover = lift (cards) or shadow swap (premium) or state tint (controls) — never new.
4. **One owner per animation language.** Animations use the motion presets; no inline keyframes.
5. **New reusable components inherit existing surfaces.** Creation is forbidden (Surface Creation Audit).
6. **The User Panel remains the Golden Reference.** All classification is ✅/⚠/❌ vs User Panel.
7. **Visual language evolves only through the Foundation.** Pages never add styling.
8. **Pages never introduce visual styling.** Pages compose certified components.
9. **Foundation-first implementation.** Use certified components; if none exists, promote through the audit gate.
10. **Every implementation begins with an audit.** No component is created or modified without consulting these Phase 3.3 documents.

---

## 13. §20 — Visual Governance Summary (single page)

**What is allowed?**
- New additive variants of frozen components (non-breaking).
- Bug fixes, accessibility, performance, documentation.
- New components that **inherit** an existing surface and pass the Future Component Checklist.
- Token consolidation and dead-code removal (P0 class).
- Migrations that adopt certified components (P2 class).

**What is forbidden?**
- Creating a new visual language or duplicate surface (Surface Creation Audit ❌).
- Redesigning frozen components' existing appearance/API/spacing/material/interactions.
- Pages defining their own backgrounds, borders, shadows, radii, hover, or animations.
- Inline keyframes, arbitrary hex/`rounded-[…]`/`shadow-[…]`, or hardcoded fallbacks.
- Two owners for one visual layer.
- Modifying tokens without updating `SURFACE_TOKEN_INVENTORY.md`.

**How should new reusable components be designed?**
1. Choose the surface to inherit (ownership matrix).
2. Confirm the owning Foundation component.
3. Run the Future Component Checklist — any YES = Phase review.
4. Consume existing tokens only.
5. Freeze and register in the Freeze Map.

**How should existing components evolve?**
- Frozen: additive only, through the approval gate.
- Legacy/duplicate: merge or retire per this plan's batches.
- Non-frozen (Toast): promote to Foundation.

**Reuse vs create decision flow:**
```
Does a certified Foundation component cover the need?
  YES → reuse it (compose, never re-implement).
  NO  → does it inherit an existing surface?
          YES → create it, pass the checklist, register.
          NO  → STOP. Phase review required (new surface layer).
```

---

## 14. Execution Roadmap

```
Phase 3.4
│
├─ P0  Safe Foundation Consolidation
│     ├─ tsc --noEmit          ✓
│     ├─ ESLint                ✓
│     ├─ npm run build         ✓
│     ├─ visual comparison     ✓ (light + dark)
│     └─ a11y verification     ✓
│
├─ P1  Foundation Component Refinement
│     └─ (same verification chain)
│
├─ P2  Consumer Migration
│     └─ (same verification chain)
│
├─ P3  Legacy Surface Retirement
│     └─ (same verification chain)
│
└─ Final Certification
      ├─ re-run full audit checklist (Phase 3.3 docs)
      ├─ update FOUNDATION_FREEZE_REGISTER.md
      └─ update DESIGN_DECISION_LOG.md
```

Verification is mandatory after every batch: **build success alone is NEVER acceptance.**

---

## 15. Success Criteria (Phase 3.3)

- [x] Every surface layer identified and assigned exactly one owner.
- [x] Every token inventoried with owner + consumers + obsolescence.
- [x] Every problem registered (P-001…P-036) with evidence, priority, recommendation, status.
- [x] Every legacy surface classified (Retire/Merge/Promote/Keep).
- [x] Competing visual languages audited (§4).
- [x] Health scores (0–100) established as objective baseline.
- [x] Dependency risk matrix produced.
- [x] Freeze map is the authoritative registry.
- [x] P0–P4 batches are independently executable without re-auditing the repository.
- [x] Future Component Checklist + 10 permanent Design Rules + Governance Summary ready for onboarding.
