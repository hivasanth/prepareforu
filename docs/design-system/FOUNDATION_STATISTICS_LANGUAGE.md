# FOUNDATION_STATISTICS_LANGUAGE

- **Phase:** 3.7/V — Task 15: Statistics Language
- **Status:** SPECIFICATION (evidence-based, read-only). Awaiting approval for Foundation-first
  implementation.
- **Governing rule:** every statistics card contains Icon → Label → Value → (Optional Trend) →
  (Optional Description), with the same spacing, same typography, same proportions; different colors
  ONLY when semantic.

---

## 1. Current state (evidence)

The central `StatCard` (`src/components/common/AntigravityCard.tsx:156-202`) already realizes
`Icon → Label → Value`:

- Row: `flex items-center gap-2 sm:gap-3 lg:gap-4`.
- Icon: `PremiumIconContainer` `iconSize=18`, container `w-9 sm:w-11 lg:w-12`,
  `rounded-stat-icon-radius`, `bg-stat-icon-bg text-stat-icon-color`.
- Label: `font-bold uppercase tracking-widest leading-none text-[9px] lg:text-[11px] text-stat-label-text`.
- Value: `font-black leading-tight tabular-nums text-base sm:text-lg lg:text-xl`.
- Region box: `h-16 sm:h-20 lg:h-24 px-3 sm:px-4 lg:px-5 py-3 lg:py-4 rounded-xl sm:rounded-2xl
  bg-card-bg border border-card-border shadow-card-shadow`.
- Loading: full `Skeleton` swap (or `StatSkeleton` grid in `SharedComponents.tsx:36-50`).

**The gap (Task 15 required): there is NO trend or description slot.** Consumers cannot express
"vs last week", "best accuracy", or description underneath the value except by bolting markup on
outside the stat block.

**Consistency problems (evidence):**

1. **Two status-input dialects:** `status` semantic token (DashboardStatsGrid:29-32, Admin StatsGrid)
   vs legacy `color` raw/css-var (Profile `var(--primary)`, PerformanceMetricsGrid raw hex
   `#2563EB/#7C3AED/#0891B2/#16A34A`, SubAdminDashboard, ReviewLayout:64-67, ResultView:56-73,
   StudentDetailModal:56-59, PrepPreview). StatCard documents it as back-compat (AntigravityCard:106-108).
2. **Duplicate stat implementations for the same job:**
   - `StatCard` (value `text-lg→xl`).
   - `ResultStatCard` (`AntigravityResults.tsx:24-41`): lucide 28px, `w-14 h-14 rounded-2xl` box,
     value `text-3xl font-black`, variant success/danger.
   - `ScoreCard` (`:8-22`): `text-2xl→4xl` in 80-112px circle.
   - `MetricBlock` (`AntigravityData.tsx:240-261`): icon-less label + value `text-[20px] font-black`.
   - `ExamSummaryCards` (`:30-48`): hand-rolled Card+inline, `cardVal` responsive, 5 cards.
3. **Label casing rejects** (UPPERCASE+tracking in DashboardStatsGrid/StatisticsSection vs Sentence-case
   in SubAdminDashboard/Review/StudentDetailModal) — same foundation, divergent copy.
4. **Unit handling** — `unit` prop (DashboardStatsGrid "Days") vs string-concatenation
   (PerformanceMetricsGrid `${..}%`) relying on StatCard's regex splitter (AntigravityCard:141-144).

---

## 2. Foundation statistics contract (proposal)

Extend the ONE `StatCard` so every statistic block renders the same rhythm:

```
┌ ICON box (fixed, one dialect) ─ Label (kicker)
└ Value (base→xl, tabular)     ─ Unit
   └ Trend (optional)  └ Description (optional, muted)
```

### 2.1 Structural slots (all optional)
| Slot | Recipe |
|---|---|
| Icon | the single icon-box dialect (see FOUNDATION_ICON_LANGUAGE.md) |
| Label | `uppercase tracking-widest metric-label` (token: `--stat-label-text`) |
| Value | `font-black tabular-nums`, `--stat-value` ladder base/lg/xl |
| Unit | appended unit (already supported) |
| Trend | NEW slot: `TrendUp/Down` + delta text, muted-tone, ONE recipe |
| Description | NEW slot: muted body line under value |
| Loading | `Skeleton` full-swap (or `StatSkeleton` grid) |

### 2.2 Color — semantic ONLY
Replace the legacy `color` string/raw-hex input with the single **semantic `status` token** set
(primary/success/warning/danger/info/accent/secondary). Raw hex (`#2563EB`) is banned; StatCard's
back-compat `color` is retired in the same FS evolution. Colors differ ONLY when semantic (T15
allowed).

### 2.3 Proportion/spacing — identical everywhere
Same gap, same icon box size, same value size ladder, same box padding, same placeholder for all
consumers. Casing normalized to UPPERCASE label (or made a component prop default).

---

## 3. Foundation evolution proposal

- Add `trend` + `description` slots to `StatCard` (additive props) OR a `StatMetric` vocabulary
  component; keep `StatCard` as the single owner.
- Retire `ResultStatCard`/`ScoreCard`/`MetricBlock`/`ExamSummaryCards` divergence by pointing the two
  consumer contexts (results & exam summary) onto StatCard variants (big: `variant="metric"` scales
  the value). No new tokens.
- Freeze-compatible with DS-016…DS-020 (additive slots + one status input).

---

## 4. Migration (foundation-first)

1. Add `trend`/`description` + semantic-only `status` to StatCard.
2. Migrate the 7 `color` call sites → `status` tokens.
3. Replace ResultStatCard/ScoreCard/MetricBlock/ExamSummaryCards with StatCard+size variant.
4. Normalize label casing + unit via component defaults.

---

## 5. Status

- **PROPOSED** — no page change until StatCard is evolved (Foundation-first). Evidence:
  `FOUNDATION_VISUAL_LANGUAGE_AUDIT.md §3.5`.