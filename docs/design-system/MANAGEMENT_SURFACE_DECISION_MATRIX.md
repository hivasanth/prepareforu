# Management Surface Decision Matrix

**Phase 3.8 — Repository-Level Design Decision (Foundation Before Migration)**
**Status:** DECISION MATRIX ONLY — **no code, token, variant, component, or Foundation changes.**
**Inputs:** Phase 3.7 audit evidence (`ADMIN_USERS_*`), the approved direction (D-140), and the architectural analysis in `MANAGEMENT_SURFACE_FOUNDATION_ARCHITECTURE.md`.
**Purpose:** compare every architectural option for the future Management Surface language and recommend exactly one repository-wide solution.

---

## 1. Options Compared

| Option | Description | Pros | Cons | Risk | Recommendation |
|---|---|---|---|---|---|
| **A. Keep amber** | Management pages continue rendering the Legacy Ancient parchment/gold family in light (status quo). | Zero work; no migration; no freeze risk. | Light mode stays amber/parchment for every management page; contradicts the approved neutral dark mode; fails the "neutral management surfaces" criterion (Phase 3.7 score 8/9 ❌); freezes an unintended language repo-wide via Standard rule 12; gold as the *surface* not the accent. | Low (operational) / High (strategic — never reaches the approved direction) | **REJECT** — the audit's purpose is to retire this. |
| **B. Neutral Management variant** | Add a `Card` `management` variant (and `CollectionCard` mapping) using a new neutral token namespace; existing variants untouched. | Additive-only, freeze-compliant (DS-001); single source of surface language; page-agnostic; gold stays as accent; dark mode already neutral so only light changes; reversible per-page during migration. | Requires new tokens + variant (approval gate); must be adopted by ALL management pages at once to avoid two languages (one-language rule); touches the frozen `Card` surface set (additively). | **Low-Medium** — additive, no existing render changes | **RECOMMENDED** |
| **C. New token family only** | Add `--management-*` tokens but no new `Card` variant; re-anchor existing variants' light values conditionally. | Token-only; no component change. | Cannot express a *distinct* management surface without either mutating existing variants' light values (freeze violation) or a new variant to host the tokens; risks collateral change to non-management consumers of the same variants (default/elevated/premium-neutral are used outside management). | **High** — either freeze violation or collateral light-mode changes | **REJECT** — the variant is the freeze-safe host for the tokens. |
| **D. Full redesign** | Redesign the entire surface system (all families, all tokens, all components) to a new neutral global language. | Cleanest end-state consistency. | Massive scope; breaks every certified freeze (Card DS-001, Button DS-002, composites); re-audits every page (Auth, Exam, Dashboard, management); contradicts "additive-only evolution" governance; highest regression risk. | **Very High** | **REJECT** — disproportional; the problem is one family (management), not the whole system. |
| **E. Hybrid (variant + tokens + page re-anchor)** | Option B for the surface + re-anchor management consumers (toolbar, filter, buttons, skeleton, selection) to the new namespace via their role tokens. | Complete management language; every layer of the Standard skeleton resolves neutral; keeps Status/Control/Typography independent. | More surface area than B alone; coordinated roll-out required; toolbar/filter/button re-anchoring must be additive per component. | **Medium** — same additive discipline, more consumers | **RECOMMENDED (execution of B)** — B is the surface decision; E is the full implementation shape. |

---

## 2. Recommendation

**Option E — Hybrid: an additive neutral Management Surface Family, implemented as Option B's new `Card`/`CollectionCard` `management` variants hosting a new `--management-*` token namespace, with management consumers (toolbar, filter, buttons, skeleton, selection) re-anchored to that namespace through their existing role tokens.**

- **Why not C alone:** a token family without a variant has no freeze-safe host; existing variants cannot be re-tinted without mutating frozen renders or leaking to non-management consumers.
- **Why not D:** the audit proves only the *management* path is amber; Auth/Exam/Status/Control/Typography are largely correct (Phase 3.7 scores 1–7 pass). A full redesign is out of proportion to the defect.
- **Why B is not enough alone:** B fixes the card surface; the toolbar, filter, buttons, skeleton, and selection are also amber in light (`ADMIN_USERS_COLOR_AUDIT.md` §2). E extends the same additive mechanism to every layer of the Management Page Standard skeleton so the page renders one coherent neutral language.
- **Hard constraints honored:** additive-only (no existing token/variant/render mutated); one Management Surface language repo-wide; gold confined to accents; status-hued row buttons and Status/Typography families unchanged; pages still own zero visuals.

**Decision:** management pages use the **neutral Management Surface Family** (proposed) instead of the Ancient/Amber surface. This is a **decision for the future implementation phase**, not authorization to build anything now.

---

## 3. Scoring Summary

| Criterion | A Keep amber | B Variant | C Token-only | D Full redesign | E Hybrid |
|---|---|---|---|---|---|
| Meets approved direction (neutral, gold-as-accent) | ❌ | ✅ | ⚠️ | ✅ | ✅ |
| Freeze-compliant (additive, no mutation) | ✅ | ✅ | ❌ | ❌ | ✅ |
| No collateral impact on non-management surfaces | ✅ | ✅ | ❌ | ❌ | ✅ |
| Complete management language (all skeleton layers) | ❌ | ⚠️ | ⚠️ | ✅ | ✅ |
| Scope proportional to defect | ✅ | ✅ | ✅ | ❌ | ✅ |
| Reversible / staged migration | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Overall** | **Reject** | **Strong candidate** | **Reject** | **Reject** | **RECOMMENDED** |

---

## 4. Rejected Alternatives (permanent unless a later D-series decision reverses them)

| Rejected | Reason |
|---|---|
| Keep amber as the permanent management language | strategic failure to reach the approved direction; freezes unintended light-mode language |
| Token-family-only evolution (no variant) | freeze violation (mutating existing variant light values) or collateral changes to non-management consumers; no clean host |
| Full repository redesign | breaks all certified freezes; re-audits every page; disproportional — only the management path is amber |
