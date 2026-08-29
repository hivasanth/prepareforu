# FOUNDATION TOKEN INTEGRITY REPORT

> Phase 5.5A — Repository Architecture & Styling Integrity Audit (READ-ONLY, documentation)

## Document Relationship

- **Depends On:** `src/styles/themes.css` (frozen), `src/index.css` (frozen)
- **Related Reports:** `FOUNDATION_CSS_ARCHITECTURE_REPORT.md`, `APPLICATION_STYLING_ARCHITECTURE_AUDIT.md`
- **Produces:** canonical findings TOKEN-TI-1, TOKEN-TI-2, TOKEN-TI-3; token metrics used by `APPLICATION_HEALTH_SCORE.md`
- **Consumed By:** `FOUNDATION_INTEGRITY_REPORT.md`, `APPLICATION_TECHNICAL_DEBT_REPORT.md` (DEBT-TD-5), `APPLICATION_HEALTH_SCORE.md` (category 9)

## Repository State

- **Branch:** `phase-3.5` — **Commit:** `453b5d7` — **Audit target:** working tree on disk (dirty) — **Audit timestamp:** 2026-08-07

## Token Registry Summary (`themes.css`, frozen)

| Metric | Value |
|---|---|
| Token definitions | 486 |
| Unique token names | 340 |
| "Duplicate" definitions | 146 (EXPECTED dark-`:root` + light-`.light` overrides — not conflicts) |
| Fully dead tokens (defined, referenced nowhere) | 0 |
| Single-referenced tokens | 68 |
| Tokens referenced only inside `themes.css` chains | 55 (dead endpoints / pending-consumption aliases) |
| Token layer architecture | Layer-1 primitives (`--forest-*`, `--gold-*`, `--space-*`, …) + Layer-2 semantic tokens (`--surface-*`, `--text-*`, `--bg-*`, `--border-*`, `--color-*`) |

## Token Flow

```
Layer-1 primitives              Layer-2 semantic tokens
--forest-* --gold-* --space-*   --surface-* --text-* --bg-* --border-* --color-*
        \                         /
         \                       /
          ▼                     ▼
       themes.css :root (dark default)  ⇄  .light (overrides)
                          │
                          ▼
       index.css  @custom-variant light  (&:where(.light, .light *))
                          │
              ▼
   Components consume via
   text-[var(--text-*)]  ·  bg-[var(--management-*)]  ·  border-[var(--border-*)]
```

## Findings

### Finding TOKEN-TI-1: 55 chain-only tokens are unconsumed endpoints
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Technical Debt
- **Owner:** Foundation
- **Affected Files:** src/styles/themes.css
- **Affected Components:** None
- **Affected Tokens:** 55 chain-only tokens
- **Evidence:** Tokens referenced only inside `themes.css` chains (no component consumption). Examples verified: `--bg-nav`, `--bg-nav-hover`, `--bg-overlay`, `--border-nav*`, `--divider-width`, `--glow-danger`, `--icon-*` (all), `--radius-container`, `--radius-control`, `--shadow-ambient`, `--shadow-pressed`, `--surface-canvas`, `--surface-hover`, `--surface-inset`, `--surface-interactive`, `--surface-nav`, `--surface-overlay`, `--surface-raised`, `--surface-secondary`, `--surface-stat`, `--surface-tab-pill`, `--text-emphasis`, `--text-header`, `--text-nav*`, `--color-danger-hover`, `--color-danger-subtle`, `--color-info-subtle`, `--color-success-hover`, `--color-success-subtle`, `--color-warning-hover`, `--color-warning-subtle`, `--bg-accent-surface`, `--bg-active`, `--bg-danger-subtle`, `--bg-input`, `--bg-success-subtle`, `--bg-warning-subtle`, `--border-disabled`.
- **Impact:** Zero fully dead tokens means no cleanup urgency; 55 aliases are pending-consumption or superseded by the semantic layer. No re-penalization risk — documented as debt.
- **Recommendation:** DEFER
- **Recommended Phase:** Repository Hygiene
- **Estimated Effort:** 1 h
- **Current Status:** Open

### Finding TOKEN-TI-2: Token consumption discipline is high
- **Severity:** Informational
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Informational
- **Owner:** Foundation
- **Affected Files:** Feature components (token consumption)
- **Affected Components:** Feature components
- **Affected Tokens:** var(--text-*), var(--management-*), var(--gold-*)
- **Evidence:** Component scan shows near-universal token usage: `text-[var(--text-muted)]` (StudentsTable.tsx:30,45,74; ExamSubComponents.tsx:15,80; ExamStudentTable.tsx:112,134; ExamQuestionAnalysis.tsx:112; ExamListSection.tsx:85; ExamDetailSection.tsx:92; ExamDetailModal.tsx:131,152-156; RecentExamItem.tsx:41,45; RecentAttemptItem.tsx:24), `bg-[var(--management-surface)]` (CollectionFilter.tsx:57; AntigravityCard.tsx:34; AdminModal.tsx:93; AntigravityForm.tsx:40,90; Menu.tsx:266; Skeleton.tsx:33,42), `border-[var(--management-border)]` (CollectionFilter.tsx:57; AdminModal.tsx:93), `text-[var(--management-accent)]` (CollectionFilter.tsx:59; Pill.tsx:121), `text-[var(--gold-300)]` (LeaderboardComponents.tsx:17; SplashPage.tsx:215,240,242), `bg-[var(--gold-*)]` (CarouselDots.tsx:25,28,36,39).
- **Impact:** No action required; confirms the Foundation is the single styling source.
- **Recommendation:** KEEP
- **Recommended Phase:** None
- **Estimated Effort:** Unknown
- **Current Status:** Open

### Finding TOKEN-TI-3: Rare non-token color bypasses (see styling report)
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Technical Debt
- **Owner:** Feature
- **Affected Files:** AuthContext.tsx:47-62, Guards.tsx:12-16, TopicReader.tsx:47,145, TopicSectionRenderer.tsx:46-198
- **Affected Components:** FullLoader, GuardLoader, TopicReader, TopicSectionRenderer
- **Affected Tokens:** Bypassed
- **Evidence:** Inline hex in `AuthContext.tsx:47-62` and `Guards.tsx:12-16`; `bg-white` in `TopicReader.tsx:47,145`; hardcoded `rgba(15,23,42,0.12)` shadows in `TopicSectionRenderer.tsx:46-198`. Canonical detail: see `APPLICATION_STYLING_ARCHITECTURE_AUDIT.md` → STYLE-ST-1, STYLE-ST-2.
- **Impact:** Six localized bypasses; the rest of the repository is token-driven.
- **Recommendation:** REMOVE
- **Recommended Phase:** Repository Hygiene
- **Estimated Effort:** 1 h
- **Current Status:** Open

## Token Stability Score

**Token Stability: 92/100** — derived and reported centrally in `APPLICATION_HEALTH_SCORE.md` as category 9 (Token Discipline).

| Factor | Effect | Notes |
|---|---|---|
| Registry integrity (0 dead, 0 conflicts) | positive | 486 defs / 340 unique, 146 expected overrides |
| Consumption coverage | moderate | 55 chain-only aliases pending consumption |
| Bypass discipline | negative | 6 localized bypasses across ~441 files |

## Previous Certification Reconciliation

| Certification | Status | Reason |
|---|---|---|
| Token-layer claims in `FOUNDATION_FINAL_READINESS_REPORT.md` / `FOUNDATION_HEALTH_SCORE.md` | Confirmed | Registry re-verified: 486/340, 0 fully dead, override pattern confirmed expected. |

## Verdict

Token layer PASS. Zero fully-dead tokens, zero conflicts, strong consumption discipline. The 55 chain-only aliases and 6 color bypasses are tracked, pre-existing debt that does not block migration.
