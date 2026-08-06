# Management Surface Migration Strategy

**Phase 3.8 — Repository-Level Design Decision (Foundation Before Migration)**
**Status:** STRATEGY ONLY — the permanent migration order and gates. **No page migration and no Foundation change occur in Phase 3.8.**
**Related:** `MANAGEMENT_SURFACE_FOUNDATION_ARCHITECTURE.md`, `MANAGEMENT_SURFACE_FOUNDATION_PROPOSAL.md`, `MANAGEMENT_SURFACE_DECISION_MATRIX.md`, `MANAGEMENT_SURFACE_RISK_ASSESSMENT.md`, `ADMIN_USERS_VISUAL_MIGRATION_PLAN.md` (Phase 3.7 roadmap).

---

## 1. The Permanent Migration Order

```
Foundation evolution           ← Phase P2 (after proposal + Standard amendments are approved)
    ↓
Admin Users                    ← FIRST validation page (after Foundation certification)
    ↓
Admin Questions
    ↓
Students
    ↓
Exams
    ↓
Sub Admins
    ↓
Leaderboard
    ↓
Future management pages
    ↓
Repository certification
```

**Hard rule:** no page may migrate before the Foundation is certified. Patching pages first (the "Users → Questions → …" order) is rejected — it hides the problem instead of fixing the source (Phase 3.7 proof: pages own zero amber).

---

## 2. Phase Sequence & Gates

### P2 — Additive Foundation Evolution (the only phase that touches the Foundation)

Entry criteria:
- [ ] D-series decision approving the `--management-*` token namespace + `Card`/`CollectionCard` `management` variants (from the Proposal).
- [ ] D-series decision approving the Management Page Standard **rule 12** amendment (premium family → Management Surface Family).
- [ ] Freeze-register review confirms additive-only compliance (DS-001).

Work (all additive):
1. Create `--management-*` tokens (light + dark neutral). Existing tokens untouched.
2. Add `Card` variant `management` — recipe shape of premium, neutral values, **no** `PREMIUM_LIGHT_OVERRIDES`. Existing variants pixel-identical.
3. Add `CollectionCard` variant `management` → new Card surface. `premium` unchanged.
4. Re-anchor management consumers via their role namespaces: `CollectionToolbar`, `CollectionFilter` (`--filter-*`), search Input (`--input-*`), `Button` primary/secondary (`--button-*`), `GridSkeleton`/`EmptyState`, modal panel, selection.
5. Per-component verification gate: Light · Dark · Hover · Focus · Disabled · Responsive · A11y · Build · TypeScript (`FOUNDATION_GOVERNANCE.md` Verification Rules). Build success alone is never acceptance.

Exit criteria:
- [ ] Existing frozen renders pixel-identical (re-audit zero-diff).
- [ ] New variants verified in both themes.
- [ ] Foundation-phase certification recorded (freeze register + execution log).

### P3 — Admin Users migration (validation page)

- [ ] Users rows switch to `CollectionCard` `management` variant.
- [ ] Toolbar, filter, search, modal, empty/error, skeleton consume the neutral management surfaces.
- [ ] Row status buttons (success/danger) and status badges unchanged.
- [ ] Validate against the 16-point `MANAGEMENT_PAGE_CERTIFICATION_STANDARD.md` checklist.
- [ ] **Certification gate** → Users becomes the first certified neutral Management Surface page. This validates the Foundation before any other page migrates.

### P4 — Repository-wide migration (one language, page-by-page)

- [ ] **Admin Questions** → the second certified neutral management page (first Standard implementation must stay aligned with the family).
- [ ] **Students** → **Exams** → **Sub Admins** → **Leaderboard** → **future management pages**, each gated by the Certification Standard.
- [ ] No page may introduce a second management language; the one-language rule is permanent.
- [ ] Legacy Ancient/amber management surfaces retired page-by-page (never a separate redesign).

### Repository Certification (final)

- [ ] Every management page certified against `MANAGEMENT_PAGE_CERTIFICATION_STANDARD.md`.
- [ ] Zero Legacy Ancient tokens remaining in the management surface path (light).
- [ ] Gold confined to accents (status/brand), never a surface.
- [ ] Full-repo verification: tsc 0 · build 0 · lint frozen baseline, zero new · grep zero page-owned visuals.
- [ ] Governance record: D-series decisions, freeze-register additions, page index, execution log.

---

## 3. Per-Page Migration Checklist (applies to every page)

| # | Check |
|---|---|
| 1 | Page consumes certified `management` surfaces only (no leftover amber classes — grep `stat-card-surface`, `card-premium-border`, `border-gold`, `shadow-premium-card`, `--card-3d-shadow` on the page path) |
| 2 | Status/Control/Typography content unchanged |
| 3 | Row status buttons keep Status hues |
| 4 | Dark mode pixel-identical to certified state |
| 5 | Light mode renders the neutral family |
| 6 | Management Page Standard skeleton/spacing/ownership intact (scores 1–7 still pass) |
| 7 | Certification Standard 16-point checklist passes |
| 8 | No new page-owned visuals introduced |
| 9 | One-language rule holds repo-wide (no two management languages concurrently) |

---

## 4. Roll-Back & Safety

- **Per-phase reversibility:** every phase is gated; a failed certification rolls the page back to its certified prior state (Foundation phases are additive — reverting = removing the new variant/token, existing renders unaffected).
- **Freeze guard:** any phase that would mutate an existing frozen render is blocked (requires re-audit + new D-series decision; `FOUNDATION_GOVERNANCE.md`).
- **No-coexistence rule:** because the Standard mandates one management language, a page flips to the neutral family only when its Foundation support is certified — never piecemeal within a page.

---

## 5. Scope Boundaries

| In scope | Out of scope |
|---|---|
| Management surface path (cards, toolbar, filter, buttons, skeleton/empty, modal, selection on management pages) | Exam/premium gold family (TopicCard, ExamCard, AttemptCard, dashboard) — stays untouched |
| Management Page Standard rule 12 (amended text) | Auth, Navigation, Status, Typography families — unchanged except management-scoped consumption |
| `--management-*` namespace + additive variants | Full repository redesign; token deletion; mutation of existing renders |

---

## 6. Success Criteria

- [ ] Foundation evolved first; pages migrated only after Foundation certification.
- [ ] Users is the first validation page.
- [ ] Questions and all remaining Management pages migrate only after Foundation certification.
- [ ] One Management Surface language repo-wide at the end.
- [ ] Zero page-owned visuals; gold only as an accent.
- [ ] Every migration phase carries a D-series decision + certification gate.
