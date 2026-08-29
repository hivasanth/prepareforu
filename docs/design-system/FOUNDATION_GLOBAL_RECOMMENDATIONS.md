# FOUNDATION_GLOBAL_RECOMMENDATIONS

- **Phase:** 3.7/V — Tasks 18 (Premium), 22 (Future-Proof Rules) + cross-cutting global governance.
- **Status:** RECOMMENDATIONS (read-only, Foundation-only scope).
- **FINAL RULE:** If a problem can be solved once in the Foundation, it MUST NOT be solved in pages.
  Page implementations fix page-specific issues only; everything else evolves in the Foundation first.

---

## 1. Global principles (recommended as permanent)

1. **Foundation-first ordering** — a deviation found in >1 place is a Foundation gap; fix the
   primitive before any page. Migration is one Foundation change + roll-out, never per-page patches.
2. **One owner per concept** — one `Card` anatomy, one container tier, one stat block, one empty
   state, one icon ladder, one divider, one label family. No second implementation for the same job.
3. **Semantic tokens only, no raw values** — raw hex (`#FFD700`, `#B8860B`), raw rgba shadows,
   arbitrary radii, and emoji-as-icon are banned on Foundation & page surfaces; route through tokens.
4. **The Future-Proof Gateway (Task 22)** — see §3: every page audit must pass the checklist
   before implementation.
5. **Documentation as approval gate** — each language spec (_CARD_, _CONTAINER_, _STATISTICS_,
   _EMPTY_STATE_, _ICON_) opens when its Foundation primitive ships; pages follow.

---

## 2. Premium Theme Language (T18) — global gold rules

**Gold/privacy contract (extends D-141):**
- Gold communicates ONLY: Premium, Achievement, Ranking, Wisdom, Rewards, Certificates.
- **Never use gold as normal text, body text, metadata, or labels.**
- Gold maps via the certified tokens when used (`--gold-*`, `--gradient-header`, `--surface-stat`,
  PremiumIconContainer/EmptyState/StatCard) — D-141-sanctioned surfaces only.

### 2.1 Findings to action
| Evidence | Verdict | Action |
|---|---|---|
| `LeaderboardTopCard #FFD700→#B8860B` | ✅ LEGIT premium/ranking | keep (foundation gold) |
| BrandTitle gradient `#f5e0be→#b88c3a` | ✅ LEGIT premium brand | keep |
| StatCard `--surface-stat` gold | ✅ LEGIT (D-141) | keep |
| Stats-nav indicator `#C8960C` | ✅ LEGIT premium chrome | keep |
| `QuestionCard:72` / `ReviewQuestionCard:39` "Tamil translation unavailable" amber **label** | ⚠️ amber-on-label | migrate amber→semantic warning token text, NOT gold |
| `ExamSubComponents:35` AccuracyBadge amber (quality band) | ⚠️ | separate quality→success/warning semantic, not gold |
| `ExamSummaryCards:24`, `ExamStudentTable:147`, `ExamQuestionAnalysis:110` amber metadata | ⚠️ | route to semantic warning/`--text-*`, not gold |
| `--premium-gold #d4af37` (DEAD) | ❌ dead token | remove/retire |

Note: the flagged items are **amber** (`text-amber-400`/`--color-warning`), not the gold family. The
violation is using a gold-adjacent warm accent as *metadata/label*, which visually contradicts the
premium rule. Global recommendation: metadata/labels use the neutral label ladder + semantic
warning token; gold stays on premium surfaces only.

---

## 3. Future-Proof Rules (T22) — the Future-Gate checklist (permanent)

**Every future page audit must check ALL of these BEFORE implementation begins. No page may skip.**

Category | Checks
---|---
Typography hierarchy | DS-016 roles used; no raw `text-[9px]`; heading scales via `Typography`
Surface hierarchy | tokens `--bg-*`; no raw hex; premium/subtle/etc via `Card` variant
Container language | uses `PageContainer`/`Stack`/`SectionHeader`; **no NEW container component**
Card language | uses `Card`/`CollectionCard` anatomy (Header→Content→Metrics→Footer, `/30` divider)
Hover language | DS-018 `CARD_HOVER`/`transition-interaction`; no translate/scale; one fill alpha
Motion language | DS-018 durations/easings; reduced-motion honored
Skeleton language | DS-019 `Skeleton`/`Spinner`; token colors; one loading recipe
Statistics language | one `StatCard`; semantic `status`; trend/description slots only
Icon language | lucide only; size ladder; no emoji; no glyph arrows; no raw stroke/size
Empty State language | ONE `EmptyState` (tone); no emoji; no hand-rolled state
Button language | DS-014 button roles; no page button styling
Accessibility | focus rings, aria, contrast (label ladder), reduced-motion
Responsive | mobile-first; no fixed-width tables <640px; no over-scaling
Performance | no 500-row client fetches; cache; avoid rule/transition
Security | RoleGuard per layout; RLS; no secret logging
Foundation compliance | passes §1 FINAL RULE (no page-solved Foundation problem)

**Enforcement:** this checklist becomes a fixed checklist in each new page's audit doc, and a branch
in the review. CI can enforce the mechanical subset (no emoji-in-icon, no numeric-size, no raw hex,
no new container/card primitive) via lint/scan (T14/T16/T22).

---

## 4. Global migration sequencing (foundation-first)

Recommended order (each ships the Foundation primitive first, then consumer-roll):
1. Container + Card anatomy (T11/T12/T13) → Foundation composites / canonical row.
2. Icon ladder + emoji→lucide + arrow→lucide (T14).
3. Statistics: StatCard trend/description + semantic-only input (T15).
4. Empty state unification (T16).
5. List-item (T17) rows onto CollectionCard row (post T11).
6. Premium gold restriction (T18) + Label/meta family (T19) + Light refine.
7. Responsive cleanup (T20).
8. Future-gate + CI lints (T22).
(Each ships thru `FOUNDATION_CONSUMER_MIGRATION_PLAN.md`; freeze-compatible; additive.)

---

## 5. Status

- Read-only recommendations; approval gate in `FOUNDATION_CERTIFICATION.md`.