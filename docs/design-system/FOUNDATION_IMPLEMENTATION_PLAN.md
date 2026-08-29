# FOUNDATION_IMPLEMENTATION_PLAN — Phase 6.XB (Task 5/6.XB core)

- **Phase:** 6.XB
- **Status:** IMPLEMENTED within 6.XB Foundation scope (token layer + audit gate complete; consumer
  migration items are the certified follow-on T35 plan)
- **Key property:** the plan separates **Foundation-only** work (done now, stops at G-gate green)
  from **consumer migration** work (deferred, gated per page).

---

## 1. Foundation-only (implemented in 6.XB)

| Step | Deliverable | File |
|---|---|---|
| 1 | Add hero/readability text roles (dark + light) | `src/styles/themes.css` |
| 2 | Register `--color-text-*` utils | `src/index.css` |
| 3 | Brighten light `elevated/hover/active` one notch | `src/styles/themes.css` |
| 4 | Enforcement audit script + `audit:foundation` script | `scripts/foundation-audit.mjs`, `package.json` |
| 5 | Spec docs (14 deliverables) | `docs/design-system/FOUNDATION_*_LANGUAGE/…` |
| 6 | Governance: D‑decision + freeze + phase reports | decision log, freeze register, execution log |

## 2. Consumer migration (deferred — T35 plan, gated)

| Bucket | Work | Gate |
|---|---|---|
| palette | `paletteColors.ts` → `--chart-*`/`--avatar-*` semantic set | M3 |
| density | 27 px-spacing warnings → ladder roles | M2 |
| tokens | `AntigravityData bg-[color]` → typed prop | M1 |

Each migrates **only** with a passing `npm run audit:foundation <scope>` and the M1–M6 gate below.

## 3. Verified state

`npx tsc -b`, `npm run build`, `scripts/foundation-audit.mjs` all pass (warnings only for the debt
inventory). **STOP** after certification — no page migration proceeds without separate approval.