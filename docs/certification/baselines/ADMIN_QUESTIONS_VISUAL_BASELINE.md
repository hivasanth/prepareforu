# Phase 3.1 · Admin Questions — Visual Regression Baseline (PRE-implementation)

**Captured:** 2026-08-02, immediately after approval, BEFORE any implementation.
**Method:** inspection-based snapshot (repo precedent — no headless browser tooling; admin route is
auth-guarded so scripted captures show only the GuardLoader). Baseline = authoritative element/token
inventory from `ADMIN_QUESTIONS_PAGE_AUDIT.md` Areas 3/6, locked here as the "before" reference.

---

## Baseline: 43 elements, ~74% Design System coverage

| Concern | Elements | Certified | Raw/Duplicate | Est. Coverage |
|---|---|---|---|---|
| Scaffold + selection + toolbar | 8 | 8 | 0 | 100% |
| List | 12 | 6 | 6 (wrapper, cards, chip, monogram, sr-number) | 50% |
| Modals + forms | 14 | 10 | 4 (prompt modal, pill, json chip, stat tiles) | 71% |
| Upload + confirm + empty + error + toast | 9 | 8 | 1 (overlay ring) | 89% |
| **Total** | **43** | **32** | **11** | **~74%** |

## Baseline token/raw snapshot (per Audit Area 6)

| Element | PRE state (baseline) | POST target |
|---|---|---|
| Desktop table wrapper | raw `div.border.rounded-3xl.overflow-hidden.shadow-2xl.relative.bg-card-bg.border-border-subtle` | `Card` premium |
| Mobile card rows | raw `div.border.rounded-2xl` | `Card` subtle |
| Mobile index chip | raw `span text-[10px]` | `IconBadge` |
| Q-monogram | raw `w-8 h-8 rounded-full bg-primary/10` | `PremiumIconContainer` + `aria-hidden` |
| SrNumber | raw `span text-[10px] font-semibold text-text-muted` | token typography |
| Row checkbox | unlabeled `SelectionCheckbox` | certified `Checkbox` w/ label |
| Row actions | `IconButton title=` | `aria-label=` |
| Header pill | raw `div` | `Badge` |
| JSON chip | raw `div.bg-card-bg/90.backdrop-blur-md.rounded-lg.font-mono` | `Badge` |
| Stat tiles ×4 | raw `div.p-4.rounded-2xl.border.bg-hover-bg/20` | `MetricBlock`/stat-card |
| Instructions panel | raw `div.bg-primary/5.border-primary/20.p-6.rounded-3xl` | `Card` subtle |
| Upload overlay | raw `bg-card-bg/95 backdrop-blur-md rounded-[2.5rem]` + raw SVG ring | token surface + ARIA |
| PromptEditorModal | raw custom modal | `AdminModal` |
| Retained exceptions | H1 sr-only · AI tool cards · BulkActionBar · Telugu panel · Guard bg (#080810, infra) | unchanged |

## Hardcoded-color sweep (baseline)

| Scope | Hits |
|---|---|
| `src/components/admin/questions/**` + BulkActionBar + DifficultyBadge | **0** |
| Guard `#080810` (infra, outside page) | 1 (deferred) |

## Scenes for post-comparison

Initial load (skeleton) · loaded list · filters applied · single modal · bulk modal (generate tab) ·
upload overlay · empty state · error state. Compare POST against this snapshot for token/a11y deltas.

## Freeze marker

Baseline locked. POST must match except the 14 intentional deltas above (which move toward the
certified golden reference) and the 5 retained exceptions.
