# SURFACE_PROBLEM_REGISTER

> **Phase 3.3 — read-only.** No fixes in this phase. Every entry is evidence + recommendation only. Priorities follow the P0–P4 model (see `SURFACE_IMPLEMENTATION_PLAN.md`).

---

## 1. Step 16 — Problem Table

| ID | Problem | Layer | Evidence | Golden Reference delta | Priority | Status |
|---|---|---|---|---|---|---|
| P-001 | `--elevation-carved` undefined in dark → premium hover shadow vanishes | L5/L6/L8 | `themes.css` `--material-card-premium-shadow` dark = `--elevation-carved` (no dark definition); `AntigravityCard.tsx:20-22`, `CollectionCard`, `AttemptCardBase:32`, `CollectionFilter` | ❌ premium hover absent in dark | P0 | Deferred |
| P-002 | `--material-card-premium-border` transparent in dark → premium cards lose border | L5/L6/L8 | `themes.css`; consumers `AntigravityButton`, `AntigravityCard`, `AntigravityForm`, `AntigravityLayout`, `ThemeToggle` | ❌ no border in dark | P0 | Deferred |
| P-003 | `--border-gold` undefined in dark → `border-border-gold` fails | L17/L14 | `SharedComponents.tsx:16/34/58/129`, `AntigravityLayout.tsx:54`, notebook | ❌ skeletons/stat borders broken in dark | P1 | Deferred |
| P-004 | Radius token conflict (`themes.css` 20/24/20 vs `@theme` 12/16/20) | all | `SURFACE_TOKEN_INVENTORY.md` D-01 | ⚠ ambiguous authority | P0 | Deferred |
| P-005 | `--secondary` fixed green literal, not themed | L8 | `LeaderboardView.tsx:125` `bg-secondary`; `themes.css` | ⚠ wrong in dark | P0 | Deferred |
| P-006 | Modal radius un-tokenized (3 values) | L11 | `AdminModal.tsx:82` `rounded-[2.5rem]`, `AddExamModal.tsx:200` `rounded-[2.5rem]`, `LanguageSelectionScreen.tsx:28` `rounded-[28px]`, `ReviewLayout.tsx` `rounded-[32px]` | ⚠ inconsistent modal family | P1 | Deferred |
| P-007 | Toast has no Foundation owner + inline styles + hardcoded fallbacks | L13 | `useToast.tsx:37-69` (`var(--card-bg, #1f2937)`, `#22c55e`, `#f87171`, `rounded-2xl shadow-2xl backdrop-blur-md` inline) | ❌ unowned surface | P1 | Deferred |
| P-008 | Topic notebook parchment language (raw hex + hard-offset gold shadows) | L5 | `TopicSectionRenderer.tsx:48/55/61/106/160/200`, `TopicReader.tsx:50/66/75/101/152/172` | ❌ separate visual language | P2 | Deferred |
| P-009 | No Popover layer exists; tooltip/panel needs are split across Menu, Tooltip, NotificationPanel | L10 | `grep z-*` shows no generic popover; `TopicInfoButton.tsx:82` raw tooltip | ⚠ layer gap | P2 | Deferred |
| P-010 | WelcomeBanner `.ancient-card-dark` (forest gradient legacy) | L5 | `WelcomeBanner.tsx:69` | ❌ ancient language | P2 | Deferred |
| P-011 | PremiumSelect panel duplicates Menu.Content recipe | L10 | `PremiumSelect.tsx:211` vs `Menu.tsx:275` | ⚠ duplicate floating panel | P1 | Deferred |
| P-012 | `premium-neutral` ≡ `premium-dark-neutral` identical class strings | L5 | `AntigravityCard.tsx:21-22` | ⚠ one is dead | P0 | Deferred |
| P-013 | Menu.Content redundant border pair | L10 | `Menu.tsx:275` `border ... border-border-subtle` | ⚠ trivial duplicate | P0 | Deferred |
| P-014 | Hand-rolled tooltip surface (`TopicInfoButton`) duplicates frozen `Tooltip` | L10 | `TopicInfoButton.tsx:65/82/115` `shadow-xl`; `Tooltip` frozen DS-008A-adjacent, zero consumers | ⚠ duplicate tooltip | P1 | Deferred |
| P-015 | SegmentedFilter / BilingualToggle create own pill surfaces | L8 | `SegmentedFilter.tsx:97`, `BilingualToggle.tsx` | ⚠ duplicate of Tabs | P1 | Deferred |
| P-016 | TagBadge separate from frozen Badge | L16 | `TagBadge.tsx` | ⚠ duplicate tag system | P2 | Deferred |
| P-017 | Three icon systems (PremiumIconContainer, IconBadge, AdminIconWrap, inline `bg-*/10`) | L8 | `PremiumIconContainer.tsx:40`, `IconBadge.tsx:61`, `AdminIconWrap.tsx:19`, inline wrappers | ⚠ duplicate icon surfaces | P2 | Deferred |
| P-018 | Leaderboard fragmentation (table row + tablet card + mobile card, all neutral) | L5 | `LeaderboardView.tsx`, `LeaderboardTabletCard.tsx`, `LeaderboardMobileCard.tsx`, `TeacherLeaderboardModal.tsx` | ⚠ 3+ surfaces for one feature | P2 | Deferred |
| P-019 | Skeleton family radii inconsistent (2xl / 24px / 32px) | L14 | `SharedComponents.tsx:16/58/129` | ⚠ 3 radii | P1 | Deferred |
| P-020 | Z-index conflicts (modal tiers 50 vs 1000; dropdown tiers 50 vs 200 vs 1000; tooltip vs modal both 50) | L11/L10/L12 | `AdminModal.tsx:76` (z-50), `AddExamModal.tsx:193` (z-[1000]), `PremiumSelect.tsx:211` (z-[1000]), `Navigation.tsx:215` (z-[200]), `Menu.tsx:68` (z-50 default), `TopicInfoButton.tsx:82` (z-50) | ⚠ stacking bugs risk | P1 | Deferred |
| P-021 | Backdrop opacity inconsistency (bg-app-bg/60 vs /80 vs /95) | L12 | `AdminModal.tsx:78` `/60`, `ActiveExamPage.tsx:220` `/80`, `UploadProgressOverlay.tsx:26` `/95` | ⚠ no shared overlay contract | P2 | Deferred |
| P-022 | Exam palette raw hex (current/answered/marked/skipped) | L16 | `paletteColors.ts:4-18` (`#22C55E`, `#8B5CF6`, `#F59E0B`, `#3B82F6`, `#94A3B8`, `#64748B`) desktop + mobile dupes | ⚠ bypass state tokens | P2 | Deferred |
| P-023 | Nav per-item color literals | L1/L8 | `src/data/nav.ts`, `src/config/navigation.ts` (`#8B5CF6`, `#F59E0B`, `#3B82F6`) | ⚠ bypass | P3 | Deferred |
| P-024 | CarouselDots primitive gold dots | L16 | `CarouselDots.tsx:25/28/36/39` `var(--gold-200)`, `var(--border-gold)`, rgba glow | ⚠ primitive leak | P3 | Deferred |
| P-025 | Animation orphans: Toast inline `@keyframes slideIn`, Splash inline `sheen` keyframe, custom `pulse-slow` | L13/L0 | `useToast.tsx:45-49`, `SplashPage.tsx:200` `animate-[sheen_4s_infinite_linear]`, `DiagramRenderer.tsx:351` `animate-pulse-slow` | ⚠ multiple animation languages | P1 | Deferred |
| P-026 | Selected-row state implemented in 3 places | L6 | `CollectionCard.tsx:109` (`!border-primary !bg-primary/5`), DataGrid, Tabs, NotificationPanel | ⚠ duplicate selection visuals | P2 | Deferred |
| P-027 | StatCard legacy `color` raw-hex escape | L17 | `AntigravityCard.tsx` StatCard; `StatisticsSection.tsx:31` `color="#F59E0B"`, PerformanceMetricsGrid hexes | ⚠ Phase 2A.2 known debt | P2 | Deferred |
| P-028 | AttemptCard dark gold primitive leak | L5 | `AttemptCardBase.tsx` `var(--border-gold)`, `var(--brown-550)`, `var(--gold-400)`, `var(--ancient-gold)` | ⚠ primitive leak | P2 | Deferred |
| P-029 | PremiumIconContainer references primitives by design | L8 | `PremiumIconContainer.tsx:40` `var(--gradient-header)`, `var(--ancient-gold-bright)`, `shadow-premium-icon` | ⚠ documented, single-owner, acceptable | P3 | Accept |
| P-030 | SidebarLayout legacy `bg-slate-900` drawer + `.ancient-sidebar` light | L1 | `SidebarLayout.tsx:187` `bg-slate-900/50`, `:198` `.ancient-sidebar` | ⚠ legacy nav surface | P2 | Deferred |
| P-031 | Legacy Progress duplicates | L14 | `SubAdminExams` raw bars, `SplashPage.tsx:242` raw bar, `LeaderboardView.tsx:125` `bg-secondary` | ⚠ bypass ProgressBar | P2 | Deferred |
| P-032 | Chart/recharts tooltip + grid inline styles | L15 | `DiagramRenderer.tsx:95/142/193` `backgroundColor: var(--surface-floating)`, `boxShadow: '0 10px 15px'` | ⚠ inline chart styling | P2 | Deferred |
| P-033 | `BulkActionBar` raw primitive divider (`var(--ancient-gold)`) | L4 | `BulkActionBar.tsx:29` | ⚠ primitive leak | P3 | Deferred |
| P-034 | Auth pages use separate auth language (violet cards, `bg-gradient-to-br`, `shadow-[0_12px_24px_rgba(124,58,237,0.3)]`) | L5 | `AntigravityButton.tsx:55/80` violet variant, auth pages | ⚠ intentional auth identity — keep but tokenize | P3 | Keep |
| P-035 | Splash brand language (radial canvas, sheen, custom font, `var(--border-gold)` text) | L0 | `SplashPage.tsx:166/178/200/215/240/242` | ⚠ branded surface — keep but tokenize | P3 | Keep |
| P-036 | DataGrid `border-border-subtle/20`/`/30` opacity variants (non-tokenized alpha) | L15 | `DiagramRenderer.tsx:220/225/231`, table borders | ⚠ arbitrary alpha | P3 | Deferred |

---

## 2. Legacy Surface Register

Classification: **Retire** / **Merge** / **Promote** / **Keep**.

| Surface | Owner | Current consumers | Visual purpose | Proposed Foundation target | Classification | Priority |
|---|---|---|---|---|---|---|
| WelcomeBanner `.ancient-card-dark` | `WelcomeBanner.tsx:69` | User Dashboard | hero banner | `Card` (hero variant) or dedicated HeroCard | **Merge** | Medium |
| Topic notebook parchment | `TopicSectionRenderer.tsx` / `TopicReader.tsx` | Study Topics (reader, list, index) | decorative reading surface | **Retire** if replaced by premium Card; **Promote** if retained as product feature (NotebookCard) | **Retire or Promote** | Medium |
| Custom tooltip (TopicInfoButton) | `TopicInfoButton.tsx` | Topic info buttons | informational tooltip | frozen `Tooltip` | **Merge** | High |
| SegmentedFilter pills | `SegmentedFilter.tsx` | Users, admin filters | segmented control | `Tabs` | **Merge** | Medium |
| BilingualToggle | `BilingualToggle.tsx` | user pages | language toggle | `Tabs`/`RadioGroup` | **Merge** | Medium |
| TagBadge | `TagBadge.tsx` | tags | status tags | `Badge` | **Merge** | Low |
| IconBadge / AdminIconWrap / inline `bg-*/10` wrappers | respective | several pages | icon chips | `PremiumIconContainer` + `IconBadge` (consolidate) | **Merge** | Medium |
| CarouselDots gold dots | `CarouselDots.tsx` | User Dashboard | carousel indicator | tokenize (keep component) | **Keep + tokenize** | Low |
| LeaderboardTabletCard / LeaderboardMobileCard | admin leaderboard | admin leaderboard | responsive cards | unified `LeaderboardCard` → `Card` | **Merge** | Medium |
| ToastContainer | `useToast.tsx` | every page | toast | **Promote** to Foundation Toast (owns L13) | **Promote** | High |
| Splash brand surfaces | `SplashPage.tsx` | splash | branded splash | keep, tokenize | **Keep + tokenize** | Low |
| Auth violet cards | auth pages | auth | distinct auth identity | keep, tokenize | **Keep + tokenize** | Low |
| BulkActionBar divider | `BulkActionBar.tsx:29` | bulk actions | divider | `border-border-subtle` | **Merge** | Low |

---

## 3. §4 — Design Language Audit

Which visual languages exist; which are legitimate, which merge, which retire.

| Language | Where | Legitimate? | Action |
|---|---|---|---|
| **Premium** (gold/forest carved 3D) | `Card` premium, CollectionCard, CollectionToolbar, SelectionContainer, StatCard | ✅ Legitimate — the golden reference | Keep; fix dark gaps (P-001/P-002) |
| **Control** (neutral, `border-subtle`, `rounded-xl`) | Input, Select, Checkbox, Switch, Button primary, Menu items | ✅ Legitimate | Keep |
| **Neutral** (calm exam workspace) | `QuestionCard` elevated | ✅ Legitimate (approved deviation) | Keep documented |
| **Ancient** (`.ancient-sidebar`, `.ancient-card`, `.ancient-overlay`, `.ancient-input`, `.ancient-header`) | SidebarLayout, AdminUsersView, BulkActionBar, AdminModal, forms | ⚠ Legacy | **Merge** progressively into Semantic utilities |
| **Notebook** (parchment + hard-offset gold) | TopicSectionRenderer, TopicReader | ❌ Divergent | **Retire** (or Promote to NotebookCard) |
| **Auth** (violet, gradient, auth-light) | Login/Signup/VerifyEmail/FinishSignIn, `Card auth-light`, Button violet | ⚠ Distinct identity | **Keep** + tokenize |
| **Splash** (radial canvas, sheen) | SplashPage | ⚠ Branded | **Keep** + tokenize |
| **Tooltip** (raw `shadow-xl` + frozen `Tooltip`) | TopicInfoButton | ⚠ Duplicate | **Merge** into `Tooltip` |
| **Chart** (recharts inline styles + wrapper surfaces) | DiagramRenderer, dashboards | ⚠ Inline | **Merge** into ChartVisualizer tokens |
| **Collection** (premium toolbar + CollectionCard rows) | Questions, Users, Leaderboard, etc. | ✅ Legitimate (premium-derived) | Keep |
| **Selection** (selection-surface) | SelectionContainer, ThemeToggle | ✅ Legitimate | Keep |
| **Menu/Dropdown** | Menu, PremiumSelect, NotificationPanel | ✅ Legitimate | Keep; merge PremiumSelect panel |
| **Button** | Button variants | ✅ Legitimate | Keep; fix secondary dark gap |
| **Stat** (gold gradient tiles) | StatCard, skeleton family | ✅ Legitimate | Keep; fix dark border-gold + radii |
| **Toast** (inline) | ToastContainer | ❌ Divergent | **Promote** to Foundation |
| **Palette/state colors** (exam hex states) | paletteColors.ts, nav config | ❌ Bypass | **Merge** into state tokens |

---

## 4. §8 — Surface Health Score (0–100)

Baseline objective score: token usage + duplication + ownership + inheritance + consistency + User Panel parity.

| Surface | Score | Basis |
|---|---|---|
| Card | 98 | golden recipe, fully tokenized; minor: radius conflict impact |
| StatCard | 90 | tokenized; legacy `color` escape (−5), dark border-gold (−5) |
| CollectionCard | 95 | delegates surface; selection `!important` (−5) |
| CollectionToolbar | 92 | premium recipe; hand-rolled copy of Card (−8) |
| Menu | 90 | single-owner; redundant border pair (−5), z-tier conflict (−5) |
| CollectionFilter | 88 | built on Menu; dark premium hover gap inherited (−12) |
| Tabs | 90 | tokenized; SegmentedFilter/BilingualToggle duplicates (−10) |
| Input/Form | 88 | tokenized; `.ancient-input` legacy light class (−12) |
| Navigation | 88 | tokenized; `.ancient-sidebar` legacy + slate-900 drawer (−12) |
| DataGrid/DataTable | 88 | tokenized; opacity variants (−12) |
| SelectionContainer | 86 | premium selection; only 3 consumers |
| ThemeToggle | 84 | inherits selection surface; own trigger styling |
| Button | 85 | tokenized; secondary dark hover gap (−10), violet raw shadow (−5) |
| AdminModal | 70 | un-tokenized radius/shadow (−20), z-tier conflict (−10) |
| Alert | 85 | state tints; shake animation per-instance |
| LoadingSkeleton | 68 | 3 radii (−15), border-gold dark gap (−10), pulse-only (−7) |
| PremiumSelect | 73 | duplicate panel (−15), own trigger (−12) |
| TagBadge | 55 | duplicate of Badge |
| SegmentedFilter | 55 | own pill surface |
| BilingualToggle | 55 | own toggle surface |
| IconBadge/AdminIconWrap | 60 | duplicate icon systems |
| TopicInfoButton tooltip | 45 | raw surface duplicate of Tooltip |
| WelcomeBanner | 30 | `.ancient-card-dark` legacy |
| Topic notebook | 35 | parchment hex + hard-offset shadows |
| Toast | 25 | inline styles, no owner, hardcoded fallbacks |
| CarouselDots | 50 | primitive gold leak |
| Splash | 60 | branded (keep) but un-tokenized |
| Auth cards | 70 | distinct (keep) but un-tokenized |
| Leaderboard composites | 55 | fragmentation + neutral surfaces |
| Recharts inline | 50 | inline chart styling |

**Lowest = top migration priority:** Toast (25), WelcomeBanner (30), Topic notebook (35), TopicInfoButton tooltip (45), CarouselDots (50).

---

## 5. Summary

- **36 problems** registered (P-001 … P-036), none fixed in this phase.
- **P0 (7):** P-001, P-002, P-004, P-005, P-012, P-013 (+ D-01/D-02 resolution).
- **P1 (10):** P-003, P-006, P-007, P-011, P-014, P-015, P-019, P-020, P-025.
- **P2 (12):** P-008, P-009, P-010, P-016, P-017, P-018, P-021, P-022, P-026, P-027, P-028, P-030, P-031, P-032.
- **P3 (6):** P-023, P-024, P-029, P-033, P-034, P-035, P-036.
- **14 legacy surfaces** registered with Retire/Merge/Promote/Keep classification.
- **17 visual languages** audited: 10 legitimate/keep, 6 merge, 1 retire (Notebook) or promote (Toast), 2 keep-but-tokenize.

Implementation batches for these entries live in `SURFACE_IMPLEMENTATION_PLAN.md`.
