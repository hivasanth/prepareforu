# FOUNDATION_VISUAL_POLISH_REPORT

- **Phase:** 3.7/V — Task 21: Visual Polish Audit
- **Status:** REPORT (read-only) 2026-08-07. Everything felt-different is traced to a *Foundation*
  reason, not a page reason (Task 21 explicitly: "find the Foundation reason, not the page reason").

---

## 1. Commercial-product checklist

Ask of the whole app: Premium? Modern? Consistent? Readable? Professional? One design system?

| Lens | Verdict | Foundation reason |
|---|---|---|
| Premium | ⭐ strong — forest+gold premium material, StatCard, PremiumIconContainer, EmptyState surface, certified gold (D-141) | certified premium surface language (DS-020) |
| Modern | ✅ yes — token-driven, mobile-first, motion-consistent (DS-018), reduced-motion aware | one motion + surface language |
| Consistent | ⚠️ majority yes, but "one design system" is broken where pages bypass the Foundation | covered by the five deviation groups (below) |
| Professional | ✅ yes — semantic-token discipline, accessible focus rings, table/row systems | DS-016…DS-020 ownership |
| Readable | ⚠️ minor — label ladder (`text-hint`), hand-rolled metadata sizes | T19 (statistics/labels), T17 (raw text) |
| One design system | ❌ partially — 5 repeat drift groups undermine it | the deviation groups ARE the Foundation gaps |

---

## 2. The five "doesn't feel like one system" groups (Foundation root causes)

Every instance is a *symptom* of a missing/underused Foundation primitive. Fix the Foundation once;
pages inherit. Page-specific issues (literal one-off content) are excluded.

1. **Hand-rolled surfaces instead of `Card`/container primitives** →
   - Foundation cause: `Card`/toolbars cover most cases, but there is no sanctioned "section card"
     for flow/pages → `FOUNDATION_CARD_LANGUAGE.md`, `FOUNDATION_CONTAINER_LANGUAGE.md`.
   - Examples: `ReviewLayout` (`rounded-[32px] shadow-2xl`), `LeaderboardTopCard` (gold), `ResultView`
     (`p-12`), `Unauthorized` (`rounded-[40px]`).
2. **Arbitrary/numeric spacing instead of the spacing ladder** →
   - Foundation cause: `Stack`/gap tokens exist but page authors wrote literals (`gap={48}`,
     `space-y-8`, `gap={24/32/16}`). `FOUNDATION_CONTAINER_LANGUAGE.md §2.3` (bans numeric on pages).
3. **Divider/section border alpha dialects** →
   - Foundation cause: `border-border-subtle` is used with `/8 /10 /20 /30 /40 /50` for the same
     delimiter function; the Foundation doesn't fix ONE alpha. `FOUNDATION_CARD_LANGUAGE.md §2.3`
     (`/30` everywhere).
4. **Duplicate stat / empty / icon services for one concept** →
   - Foundation cause: `StatCard` / `ResultStatCard` / `ScoreCard` / `MetricBlock` + `EmptyState` /
     `ErrorState` / `ErrorContainer` + three icon-box dialects + emoji-vs-lucide. Ownership is
     fragmented because multiple primitives were left live.
     `FOUNDATION_STATISTICS_LANGUAGE.md`, `FOUNDATION_EMPTY_STATE_LANGUAGE.md`,
     `FOUNDATION_ICON_LANGUAGE.md`.
5. **Raw data text bypassing Typography** →
   - Foundation cause: `Typography`/`AdminText`/`Label` exist but metadata/row text is hand-rolled
     `text-[9px]`/`text-[10px] text-[var(--text-muted)]`/raw `<h2>/<p>` in rows (Topics, Leaderboard,
     RecentExam, ResultsPage). `FOUNDATION_GLOBAL_RECOMMENDATIONS.md` → a single metadata type family.

---

## 3. Screen-level scan (representative) — all trace back to ≤5 groups

| Screen | Feels-off | Root Foundation cause |
|---|---|---|
| User Dashboard | solid | — (already canonical) |
| History (UserHistory) | loading gap `xxl` vs loaded `lg` rhythm shift | G2 spacing ladder |
| Results/Review | hand-rolled dark shell, 1200px re-wrap, `shadow-2xl` | G1 surfaces, G2 width |
| Performance | `space-y-8`, raw-hex stat colors | G2 + G4 status-input |
| Leaderboard | gold top card `shadow-[..50px…]`, trophy `80px`, sticky user bar | G1 (surface), G4 (icon box), T20 size |
| Admin Users/Questions | consistent (`CollectionCard` row) | — (already Foundation) |
| Admin Settings | header/footer `/50`+`bg-hover-bg` dialect | G3 divider alpha |
| Sub-Admin Settings | header `border-subtle/10` | G3 |
| Topics (Admin) | hand row + `hover:border-primary/30` | 17 List-item + hover won't match DS-018 |
| Empty/No-data pages | emoji / Foundation seams | G4 empty-state |
| Auth/Splash | premium gold intentional | — (correct) |

---

## 4. "Premium / modern / consistent" maturity call

- **Premium:** 9/10 — premium language is richly built. Polish gap = **gold-as-metadata amber** on
  exam/skip/translation labels reads gold-adjacent on functional surfaces (T18). Restrict gold to
  true premium/achievement/ranking (see `FOUNDATION_GLOBAL_RECOMMENDATIONS.md`).
- **Modern:** 9/10 — motion/surface/reduced-motion all modern.
- **Consistent / one system:** 7/10 — the five groups. Raising it is a **Foundation-first** effort,
  not page-by-page.

---

## 5. Scoring proposal (audit baseline)

| Dimension | Score | Gap |
|---|---|---|
| Premium | 80 | restrict gold-to-labels |
| Modern | 90 | — |
| Consistency | 70 | 5 deviation groups |
| Readability | 80 | label ladder |
| Professional | 90 | — |
| **One system** | **72 (weighted)** | Foundation-first fixes |

*Scores are directional audit baselines to re-run after each Foundation evolution.*

---

## 6. Next action

Implement the 4 companion specs Foundation-first (Card/Container/Statistics/Empty/Icon +
Light/Global) per the ranked migration plan, then re-run this checklist. Approval gate →
`FOUNDATION_CERTIFICATION.md`.