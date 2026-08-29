# REPOSITORY STATISTICS

> Phase 5.5B — Repository metrics derived from on-disk evidence at commit `453b5d7` (branch `phase-3.5`). No metric is estimated; every value is counted from the working tree.

## Source Code (`src/`)

| Metric | Value |
|---|---|
| Total Files | 442 |
| TSX Files | 242 |
| TS Files | 142 |
| CSS Files | 2 |
| MD Files (colocated) | 55 |
| PNG Files (asset) | 1 |

## Components

| Metric | Value |
|---|---|
| Foundation Components (`src/components/common`) | 54 code files |
| Feature Components (all `components/` outside `common`) | 179 code files |
| Total Component Code Files | 233 |
| Pages (`src/pages`) | 42 code files |
| Layouts (`src/layouts`) | 4 files |

Component breakdown by subdomain (code files):

| Subdomain | Files |
|---|---|
| `components/admin` | 52 |
| `components/common` (Foundation) | 54 |
| `components/exam` | 19 |
| `components/profile` | 4 |
| `components/sub-admin` | 39 |
| `components/user` | 55 |
| `components/visualizers` | 4 |

## Architecture

| Layer | Files |
|---|---|
| Hooks (`src/hooks`, code) | 19 |
| Contexts (`src/context`) | 3 |
| Guards (`src/guards`) | 2 |
| Services (`src/services`) | 18 |
| Utilities (`src/utils`) | 21 |
| Validations (`src/validations`) | 9 |
| Types (`src/types`) | 6 |
| Constants (`src/constants`) | 2 |
| Lib (`src/lib`) | 13 |
| Observability (`src/observability`) | 3 |
| Config (`src/config`) | 1 |
| Data (`src/data`) | 1 |
| Test setup (`src/test`) | 1 |

Note: `src/hooks` also contains 9 colocated `.md` governance logs (counted in the 55 colocated MD files).

## Styling

| Metric | Value |
|---|---|
| Token Definitions (`themes.css`) | 486 |
| Unique Token Names | 340 |
| Semantic Token Categories | Layer-1 primitives (`--forest-*`, `--gold-*`, `--space-*`) + Layer-2 semantic (`--surface-*`, `--text-*`, `--bg-*`, `--border-*`, `--color-*`) |
| Dark/light redefinitions | 146 (intentional `:root` + `.light` override pattern) |
| Fully Dead Tokens | 0 |
| Single-Referenced Tokens | 68 |
| Chain-Only Tokens (unconsumed endpoints) | 55 |
| CSS Files (frozen single-source) | 2 (`themes.css`, `index.css`) |
| Generated CSS Size | ~234 kB raw / ~33.9 kB gzip |

Utility-class consumption follows Tailwind v4 `@theme` machinery (e.g. `text-muted`, `bg-muted`, `text-primary`, spacing scale) — documented as intentional, not token bypasses. See `FOUNDATION_CSS_ARCHITECTURE_REPORT.md` and `FOUNDATION_TOKEN_INTEGRITY_REPORT.md`.

## Testing

| Metric | Value |
|---|---|
| Test Files | 12 |
| — `src/**/*.test.ts(x)` | 12 (`ds003`…`ds014` runtime audits + validation/util suites) |
| Test setup file | `src/test/setup.ts` |
| Audit test run | `npx vitest run --config vitest.audit.config.ts` → 301 passed / 33 failed |
| Default config | `vitest.config.ts` → ERR_REQUIRE_ESM (use audit config; see `APPLICATION_TECHNICAL_DEBT_REPORT.md` DEBT-TD-3) |

## Documentation

| Metric | Value |
|---|---|
| Audit Reports (`docs/audit`) | 17 (Phase 5.5A) + 5 (Phase 5.5B) = 22 |
| — Original audit reports | 16 unique + `README.md` |
| — Certification package additions | `REPOSITORY_CERTIFICATION.md`, `REPOSITORY_STATISTICS.md`, `HEALTH_SCORE_METHODOLOGY.md`, `TECHNICAL_DEBT_DASHBOARD.md`, `REPOSITORY_TIMELINE.md` |
| Governance/Certification (`docs/certification`) | 87 MD files |
| Design System (`docs/design-system`) | 88 MD files |
| Validation (`docs/validation`) | 8 files |
| Docs root (`docs/*.md`) | 1 (`error-experience-system.md`) |
| Colocated governance `.md` inside `src/` | 55 (tracked as debt — `APPLICATION_ARCHITECTURE_AUDIT.md` ARCH-AR-3) |

## Verification Commands

| Purpose | Command |
|---|---|
| TypeScript | `npx tsc -b --force` |
| Build | `npm run build` |
| Lint | `npx eslint .` |
| Tests | `npx vitest run --config vitest.audit.config.ts` |

All four match documented baselines at Δ0. See `FOUNDATION_INTEGRITY_REPORT.md`.