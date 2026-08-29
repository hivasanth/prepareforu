# FOUNDATION_DESIGN_DEBT — Phase 6.XB (Task 34)

- **Phase:** 6.XB
- **Status:** IMPLEMENTED (inventory of pre-existing consumer-layer debt, resolution deferred to the
  certified migration plan — T35)
- **Key property:** an honest, machine-measured inventory of consumer-layer findings that violate
  Foundation-first rules but are **not** exceptions and are **not** fixed during 6.XB (no page
  migration until certification).

---

## 1. Debt inventory (measured by `node scripts/foundation-audit.mjs`)

### 1a. Hard violations (20) — `src/utils/paletteColors.ts`

Chart/avatar color table uses raw hex classnames (`bg-[#22C55E]`, `bg-[#8B5CF6]`,
`bg-[#F59E0B]`, `bg-[#3B82F6]`) instead of semantic tokens.

- **Impact:** colors can't be re-themed; violates token ownership.
- **Resolution (T35):** move palette to a Foundation-owned token set (e.g. an additive
  `--chart-*`/`--avatar-*` semantic namespace) and re-point the util.
- **NOT fixed now** — consumer change deferred to certified migration.

### 1b. Arbitrary px spacing/radius (27 warnings)

| File | Finding |
|---|---|
| `LeaderboardView.tsx:40` | `rounded-[24px]` |
| `ExamHeader.tsx:19` | `mx-[10px]` |
| `LanguageSelectionScreen.tsx:37` | `rounded-[28px]` |
| `QuestionNavigator.tsx:18,101` | `rounded-[13px]` |
| `ReviewLayout.tsx:55,78` | `rounded-[32px]` |
| + others | see `foundation-audit.mjs` run |

- **Resolution (T35):** map each px to the nearest ladder role via `FOUNDATION_CONTENT_DENSITY_LANGUAGE.md`.

### 1c. `bg-[color]` dynamic token indirection — `AntigravityData.tsx:163`

Arbitrary `bg-[color]` utility string; resolve to a typed semantic prop in migration.

## 2. Debt vs Exception

All above are **debt**, not exceptions (see `FOUNDATION_EXCEPTION_REGISTRY.md` — active list empty).
They will be resolved in the certified visual migration (T35), phase-by-phase, with the audit script
as the gate: a migration closes only when its debt bucket reports zero.

## 3. Acceptance

- 6.XB adds **no new** debt (token additions are additive; audit re-run confirms stable counts).
- Audit script ships in `package.json` (`npm run audit:foundation`).