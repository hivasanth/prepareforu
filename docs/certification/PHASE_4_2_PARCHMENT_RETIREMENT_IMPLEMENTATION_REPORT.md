# Phase 4.2 — Parchment / Ancient Surface Family Retirement — Implementation Report

**Phase 4.2 (D-150) — retire the parchment/ancient surface family across PrepareForU.**
**Status:** ✅ **IMPLEMENTED** (2026-08-04) — repository surface-language retirement; reuse of the certified neutral Management Surface family only.
**Approved decision (user-confirmed):** **Option 1 — Parchment Family Only.** Retire parchment/ancient surfaces and the 12 hexes; **preserve the premium gold accent family**.
**Scope:** `src/styles/themes.css`, `src/index.css`, and the parchment-consuming components named in §3. **No new palette, no redesign, no page-owned colors.**

---

## 1. Repository state (input)

✅ Phase 3.9 — Foundation Management Surface Implementation & Certification (D-144/D-145) supplied the **certified neutral Management Surface family** (`--management-*` token namespace, neutral light values, gold confined to accents). ✅ Phase 4.0 — Admin Users was the first certified consumer (D-146/D-147). ✅ Phase 4.1/4.1A — Admin Questions planning + TextArea Foundation evolution (D-148/D-149). This phase retires the **parchment/ancient** surface language that previously reached management surfaces transitively, reusing only already-certified neutral tokens. **No new Foundation API was created in this phase.**

---

## 2. Decision and rationale (D-150)

**Decision:** Retire the entire parchment/ancient surface family — the 12 hexes `#FFF8E7 #FDF5E2 #F4E5C4 #EFD9AF #E8D5B0 #E2CFA6 #DFC096 #D5B486 #C9A070 #C4A882 #A87828 #8B5A10` — plus parchment-adjacent warm values (`#FFFDF9`, `#F5EAD4`, warm rgba variants, `#2D1505 #3D1F08 #5D4037 #23120B #0A0503 #4A3525`, pie `#4E342E`). All management surfaces become neutral via the certified Management Surface family.

**Preserved (premium gold accent family, NOT retired):** `--gold-*` scale, `#C8960C`, `#FFD700`, `#d4af37`, `#B8860B`, `--premium-green`, `font-cinzel/garamond/ancient`, `--color-secondary #C8960C`, warm `rgba(200,150,12,…)` nav/header gold, StatCard/premium-surface gold accents, `--border-tab-nav`-type indicator gold. The premium gold family is a distinct certified visual family (D-141: gold = accent only, not a surface).

**Rejected alternatives (recorded in D-150):** (a) retire parchment *and* gold together — rejected: gold is a distinct certified premium accent family, not part of the parchment surface language; (b) introduce a new neutral palette — rejected: reuse-only mandate, no new tokens.

---

## 3. Changes applied

### 3.1 `src/styles/themes.css` (Foundation — primary edited layer)

| Change | Detail |
|---|---|
| Retired primitives | `--brown-*` scale, parchment canvas family, `--pie-amber`, `--pie-bronze`, `--pie-brown`, `--border-gold`, `--surface-stat-overlay`, `--card-parchment`, `--table-row-hover-light` removed (comment marks retirement) |
| Light semantic tokens neutralized | `--bg-app #F8FAFC`, `--bg-surface #FFFFFF`, `--bg-elevated #F1F5F9`, `--bg-hover #F1F5F9`, `--bg-active #E2E8F0`, `--bg-input #FFFFFF`, `--bg-disabled rgba(15,23,42,0.04)`, `--bg-overlay rgba(15,23,42,0.45)`; text `#111827/#4B5563/#6B7280/#9CA3AF`, `--text-on-dark #F9FAFB`; borders `#E2E8F0/#CBD5E1/#166534/#94A3B8`; scrollbar `#D1D5DB/#9CA3AF`; `--gradient-app none`, `--gradient-surface none`; shadows all neutral `rgba(15,23,42,…)` |
| Ancient alias remap (dark `:root`) | `--ancient-gold → var(--color-secondary)`; `--ancient-gold-bright → var(--color-secondary-light)`; `--ancient-brown-deep → var(--text-primary)`; `--ancient-brown → var(--text-secondary)`; `--ancient-cream / --ancient-cream-light → var(--bg-surface)`; `--ancient-amber → var(--color-warning)`; `--ancient-forest → var(--color-accent)`; `--ancient-danger → var(--color-danger)`; `--ancient-danger-hover → var(--color-danger-subtle)`; `--ancient-badge-bg/border → var(--color-success-subtle)/var(--color-success)` |
| Light-only premium gold material | Preserved for StatCard/AntigravityCard consumers: `--surface-stat`, `--surface-tab-pill`, `--stat-card-3d-shadow`, `--card-3d-shadow`, `--elevation-carved` (premium-icon consumers only) |
| `.light` ancient alias block | Deleted (light now resolves through neutral semantic tokens) |
| `--gradient-header` | Kept `linear-gradient(150deg, #162B1C… #0A1A10…)` in both themes (premium accent, not parchment) |

### 3.2 `src/index.css`

| Change | Detail |
|---|---|
| `@theme` mappings | Removed `--color-border-gold`; added `--color-border-default: var(--border-default)` and `--color-gold-300: var(--gold-300)` (enables `border-border-default` / `border-gold-300` utilities) |
| Ancient alias remap | Same neutral remap as `themes.css` (index.css `--ancient-*` → neutral tokens) |
| `.ancient-3d-lift` | Neutral hover (`var(--elevation-3)` both themes) |
| `.light aside` nav text | `rgba(212,168,75,0.7)` (gold accent preserved) |
| `.light .ancient-input/-select/-textarea/-otp` | Gold borders → `--border-subtle`/`--border-hover`/`--border-focus` + neutral `rgba(0,0,0,…)` focus rings |
| `.light .ancient-card` | → `var(--management-surface)`, `1.8px solid var(--management-border)`, `var(--management-shadow)`, neutral grain `rgba(15,23,42,0.02)` |
| `.ancient-*` class names | **Preserved everywhere** (smoke locks ds007 49/110/169, ds014 52/55, ds003 100 depend on them) |

### 3.3 Components (parchment surface consumers → neutral Management Surface recipe)

Neutral recipe: light `bg-white` or `bg-[var(--management-surface)]` + `border-2 border-border-default` (or `border-border-subtle`) + `shadow-[2px_2px_0px_rgba(15,23,42,0.12)]`; dark branch unchanged. Hardcoded parchment shadows `#8B5A10` → `rgba(15,23,42,0.12)`; hardcoded `#F5EAD4`/`#FFF8E7`/`#FDF5E2`/`#FFFDF9` surfaces → `var(--bg-elevated)`/`bg-white`/`var(--management-surface)`; section-header gold text → `text-text-secondary`.

| File | Change |
|---|---|
| `src/components/user/topics/TopicReader.tsx` | 6 parchment surfaces/shadows → neutral (back, card, primary, inactive pills/prev, disabled/next) incl. motion variants |
| `src/components/user/topics/TopicSectionRenderer.tsx` | Section header → `text-text-secondary`; all card/pill/chip/list surfaces → `var(--management-surface)`/`var(--bg-elevated)` + neutral borders/shadows; callout neutralized |
| `src/components/admin/common/BulkActionBar.tsx` | `ancient-card` → `bg-[var(--management-surface)] border-border-subtle`; divider/`cancel` neutral |
| `src/components/admin/sub-admins/AdminSubAdminsView.tsx` | Removed `ancient-card` class from `Card variant="subtle"` |
| `src/components/admin/settings/SubjectPieChart.tsx` | Pie palette: `#A87828→#B45309`, `#8B5A10→#64748B`, `#4E342E→#475569`, `#12291C→#166534`; `#C8960C`/`#1A3316` unchanged (gold accent preserved) |
| `src/components/user/CarouselDots.tsx` | `border-gold` → `gold-300` (gold accent preserved) |
| `src/pages/SplashPage.tsx` | Tagline → `text-[var(--gold-300)]` (gold accent preserved) |
| `src/components/common/AntigravityCard.tsx` | `GOLD_SURFACE` → `border border-gold-300` (gold accent preserved) |

### 3.4 Unchanged consumers (resolved via neutralized aliases/definitions — no edit needed)

`PremiumIconContainer.tsx` (premium accent consumer; `--elevation-carved`/`--ancient-gold-bright` aliases still resolve), `AdminIconWrap.tsx`, `AntigravityForm.tsx`, `Menu.tsx`, `Navigation.tsx`, `TopicInfoButton.tsx`, `SubjectCardItem.tsx`, `AdminModal.tsx` — `.ancient-*`/`--ancient-*` consumers whose definitions/aliases are now neutral, class names intact.

---

## 4. Verification

| Gate | Result |
|---|---|
| TypeScript build (`tsc -b`) | ✅ exit 0 |
| Production build (`npm run build`) | ✅ exit 0 (pre-existing chunk-size warnings only) |
| Phase 4.2 smoke suite (`ds007-runtime-audit`) | ✅ **18/18 PASS** under `vitest.audit.config.ts` |
| Repository scan locks | ✅ retired hexes/tokens absent; `.ancient-*` class names + gold accent preserved (rg/Select-String scan) |
| `npm run test` (default jsdom config) | ✅ 5 pure-TS suites / **165 tests PASS**; component suites do not start workers — **pre-existing environment issue** (`@asamuzakjp/css-color` CJS `require()` of ESM-only `@csstools/css-calc`, Node 20.12.2), unrelated to Phase 4.2 |
| Lint | Pre-existing `@typescript-eslint/no-explicit-any` etc. only (unrelated to this migration) |

### 4.1 New regressions

**Zero.** The Phase 4.2 smoke suite (ds007) passes completely; the 33 audit-suite failures below existed independently of this phase and were not modified by this work.

---

## 5. Pre-existing test drift (documented, NOT modified)

> These failures existed independently of the Phase 4.2 implementation and were not modified by this work. They were surfaced only because `npm run test` (jsdom config) cannot start component-test workers in this environment; running the suite under `vitest.audit.config.ts` (threads + happy-dom, no tailwindcss plugin) executes them and exposes class-drift between the audit tests and the current component contracts. None of the affected components/tokens/classes are part of the parchment surface family.

| Suite | Affected component | Failure count | Why outside Phase 4.2 | Future phase responsible |
|---|---|---|---|---|
| `ds003-runtime-audit.test.tsx` | `AntigravityForm` (`Input`/`TextArea`/`Select`) | 21 | Tests assert `bg-hover-bg border-border-subtle text-text-primary`; component contract now renders `bg-input-bg border-input-border text-input-text` + `ancient-input` (a Forms-System/DS-003 class-drift, not a surface-language change) | Dedicated Forms System (DS-003) audit/refactor phase; test-suite reconciliation |
| `ds005-runtime-audit.test.tsx` | `Badge` | 10 | Tests assert `bg-success/10 text-success`; component renders `bg-success/15 … border-success/30` (opacity/border class drift in the Status family) | Status family audit/reconciliation phase |
| `ds014-runtime-audit.test.tsx` | `Avatar`/`AdminIconWrap` | 2 | Test asserts `ancient-icon-badge` in light mode, but the test's `.light` wrapper does not flip `ThemeContext.isDark`, and `AdminIconWrap` maps `lg→rounded-xl` while the test expects `rounded-lg` (test/environment contract drift in the Identity family) | Identity family (U-4/U-5) test reconciliation phase |

---

## 6. Deferred work register (tracked technical debt — NOT Phase 4.2 blockers)

| # | Component | Current issue | Recommended future phase | Priority |
|---|---|---|---|---|
| DW-1 | `AntigravityForm` (Input/TextArea/Select) | ds003 audit asserts `bg-hover-bg border-border-subtle` classes the component no longer emits (`bg-input-bg border-input-border text-input-text`); `Select` `id` now `select-<label>` (a11y improvement) vs the test's documented-gap assertion | Forms System (DS-003) audit + ds003 reconciliation | Medium |
| DW-2 | `Badge` | ds005 asserts `bg-<hue>/10` opacity; component renders `/15` + `border-<hue>/30` | Status family audit + ds005 reconciliation | Low |
| DW-3 | `Avatar`/`AdminIconWrap` | ds014 light-mode assertion depends on `ThemeContext.isDark` flipping (test uses only `.light` wrapper); `square → rounded-lg` expectation vs `lg→rounded-xl` mapping | Identity family test reconciliation | Low |
| DW-4 | Test environment | `npm run test` (jsdom config) cannot start component-test workers: `@asamuzakjp/css-color` CJS build `require()`s ESM-only `@csstools/css-calc` on Node 20.12.2 (`ERR_REQUIRE_ESM`) | Dedicated test-infra phase (upgrade Node ≥22.12, or pin compatible `@csstools/*`/`@asamuzakjp/css-color`, or make the audit config the default) | Medium |

Each item is a **tracked technical-debt entry**, not a Phase 4.2 requirement. They are explicitly out of scope for the parchment retirement and must be handled in their own dedicated phases.

---

## 7. Mandatory rules compliance

| Rule | Status |
|---|---|
| No new palette / no redesign / no page-owned colors | ✅ — reuse of certified neutral Management Surface family + preserved premium gold only |
| No new Foundation API created | ✅ — token remaps and `.ancient-*` definition neutralizations only; `@theme` additions are mapping utilities (`border-border-default`, `gold-300`) |
| Parchment family fully retired | ✅ — 12 hexes + parchment-adjacent warm values + brown scale + pie parchment colors removed |
| Premium gold accent family preserved | ✅ — `--gold-*`, `--color-secondary`, StatCard/premium gold material, nav/header gold retained |
| `.ancient-*` class names preserved | ✅ — smoke locks (ds007 18/18) green |
| No unrelated component evolution | ✅ — only parchment consumers touched; AntigravityForm/Badge/Avatar/AdminIconWrap unchanged (drift documented, deferred) |

---

## 8. Deliverables

- Implementation report: this document
- Certification: `docs/certification/PHASE_4_2_PARCHMENT_RETIREMENT_CERTIFICATION.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-150)
- Governance: `FOUNDATION_FREEZE_REGISTER.md` (Phase 4.2 entry) · `PHASE_3_1_EXECUTION_LOG.md` (Phase 4.2 entries) · `docs/certification/PAGE_CERTIFICATION_INDEX.md` (Phase 4.2 row)
