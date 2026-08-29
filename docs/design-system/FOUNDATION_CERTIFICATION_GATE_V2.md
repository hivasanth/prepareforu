# FOUNDATION_CERTIFICATION_GATE_V2 — Phase 6.XB (Task 35 / Pass criteria)

- **Phase:** 6.XB
- **Status:** IMPLEMENTED
- **Key property:** a repeatable, binary pass/fail gate for **Foundation-layer** changes (6.XB scope)
  and, separately, the gate that future **consumer migrations** must satisfy. A change is certified
  only when every box is green.

---

## 1. Foundation-layer gate (6.XB scope) — all green

| # | Requirement | Evidence |
|---|---|---|
| G1 | TypeScript compiles | `npx tsc -b` exit 0 |
| G2 | Production build | `npm run build` exit 0 |
| G3 | ESLint (changed files) | exit 0 |
| G4 | Unit tests | `npm test` green (165 baseline + unchanged worker note) |
| G5 | Token additions additive | diff = new names only; none of DS-019/DS-020 changed |
| G6 | No new colors | all 10 new `--text-*` map to existing primitives |
| G7 | No opacity-as-emphasis | sweep zero |
| G8 | No page migration | no consumer file touched (scope boundary) |
| G9 | Audit script healthy | `npm run audit:foundation` exits 0 (warnings only) |
| G10 | No new debt added | audit counts stable vs baseline |

## 2. Consumer-migration gate V2 (future T35 work)

A page/consumer migration is certified only when:

| # | Requirement |
|---|---|
| M1 | consumer file(s) stop failing the audit hard-error bucket in `<scope>` |
| M2 | all px spacing mapped to density-ladder roles (no arbitrary px) |
| M3 | palette/`bg-[color]` indirection resolved to semantic tokens |
| M4 | visual weight ladder used (no rank skips) |
| M5 | `npm run audit:foundation <page>` === CLEAN |
| M6 | tsc/build/test/eslint for that scope green |

## 3. Enforcement mechanics

- `scripts/foundation-audit.mjs` is the executable gate for M-tiers and the hard-error floor.
- Per-page runs: `node scripts/foundation-audit.mjs src/components/<scope>`.

## 4. Relation

- `FOUNDATION_DESIGN_DEBT.md` — inventory the M1–M3 findings resolve.
- `FOUNDATION_VISUAL_CERTIFICATION.md` — 6.XB certification package.