# FOUNDATION_ICON_LANGUAGE

- **Phase:** 3.7/V — Task 14: Icon Language
- **Status:** SPECIFICATION (evidence-based, read-only). Awaiting approval for Foundation-first
  implementation.
- **Governing rule:** consistent size, stroke width, visual weight, spacing, alignment, color
  behavior, hover/disabled/active behavior. Never mix icon systems. Never mix icon weights. Never use
  emoji. Never use glyph arrows.

---

## 1. Current state (evidence)

**Icon library:** lucide-react is the icon system (imported across the app). There is NO cap on icon
size or a single "icon box" owner:

- **Size spread (evidence):** `size=8` (TopicListItem:62) → `size=140`
  (MethodSelectionView:33-47), `size=120` (ExamListSection:106), `size=64` (SubAdminStudents:39,
  ResultView:47), `size=48/40/36/32/28/24/20/18/16/15/14/13/12/11/10` — 20+ discrete sizes.
- **Three parallel "icon box" dialects:**
  1. `PremiumIconContainer` / `IconBadge` (`iconSize=12-24`, e.g. StatCard `iconSize=18`, container
     `w-9…w-12`).
  2. `ResultStatCard` inline `w-14 h-14 rounded-2xl` box.
  3. `ScoreCard` `w-20/28` circle.
- **strokeWidth mixing:** hardcoded `strokeWidth={2.5}` (AccountDisabledPage), `3`
  (ReviewQuestionCard:101), default 2 — no single weight.
- **Emoji-as-icon:** EmptyState/ErrorState default `📂`/`⚠️`; consumers pass `🔒📈🏆📊📚🛡️`
  (UserTeacherExams:56, UserPerformance:66, UserLeaderboard:110, ExamPaperGrid:109, TopicReader:169,
  UpdatePasswordPage:13). Emoji occupies an icon *slot*, not content.
- **Glyph arrows:** `→` in admin string copy (MethodSelectionView:44/73, AIToolCards:65,
  BulkUploadModal:41-49, JsonTab:38) vs lucide Chevron components elsewhere.
- **Inline `<svg>` instead of lucide:** ErrorBoundary:36, AccountDisabledPage, UpdatePasswordPage eye,
  UploadProgressOverlay progress circle, QuestionVisualizer geometry (data-viz — acceptable).

---

## 2. Foundation icon contract (proposal)

### 2.1 System
- **lucide-react is the ONLY icon system.** Inline `<svg>` is allowed ONLY for decorative
  data-viz/progress (charts, progress rings) and custom glyphs; generic UI icons must be lucide.

### 2.2 Size language (one ladder)
| Tier | Box | Icon size | Use |
|---|---|---|---|
| micro | — | 12 | inline w/ text labels |
| small | — | 16 | list metadata, buttons sm |
| default | `w-8 h-8` | 18 | StatCard icon, row icons |
| medium | `w-10 h-10` | 24 | section icons, empty-state |
| large | `w-14 h-14` | 32 | feature/hero icons |
| display | `w-20 h-20`+ | 48 | empty/hero/illustration |

Icon **box** (when used) is the SINGLE `PremiumIconContainer`/`IconBadge` recipe; boxes are not
re-invented per page. `ResultStatCard`/`ScoreCard` icon boxes migrate onto the ladder.

### 2.3 Weight
ONE stroke: `strokeWidth={2}` everywhere (lucide default). Bans: `2.5`, `3`, mixed in adjacent
slots. `fill` only for ranking/chart glyphs.

### 2.4 Color behavior
- Icons inherit text color by default; semantic color ONLY via the certified token/status props
  (`text-stat-icon-*`, `--icon-*`, `IconBadge` status). Raw hex banned.
- **Hover/disabled/active** follow the DS-018 interaction model: hover = `--duration-hover` color
  tint, disabled = `opacity` + `cursor-not-allowed` (never scale), active = semantic accent. Icons
  inside interactive elements use the parent's focus/hover states — no per-icon inline behavior.

### 2.5 Never
- Never use emoji in an icon slot (T14/T16) — content prose may contain emoji, icon slots must not.
- Never use glyph arrows (`→`, `←`, `›`, `❯`) as icons — use lucide `ArrowRight`/`ChevronRight`.
- Never introduce a fourth icon box dialect.

---

## 3. Foundation evolution proposal

- Publish a single **icon-size ladder** + box recipe on `PremiumIconContainer`/`IconBadge`
  (extend `size` prop tiers); stat the whole repo against it.
- Replace default `📂`/`⚠️` and consumer emoji icons with lucide (empty/error states).
- Replace glyph arrows in admin copy with lucide icons.
- Add an ESLint/CI check banning emoji-in-icon-slots and non-ladder `size=` (future gate,
  `FOUNDATION_GLOBAL_RECOMMENDATIONS.md`).

---

## 4. Migration (foundation-first)

1. Ladder + box owner in Foundation; retire ResultStatCard/ScoreCard boxes.
2. Emoji → lucide (Empty/ErrorState + the ~9 emoji call sites).
3. Glyph arrows → lucide (admin copy).
4. strokeWidth normalization to 2.

---

## 5. Status

- **PROPOSED** — no page change until the Foundation ladder is built (Foundation-first). Evidence:
  `FOUNDATION_VISUAL_LANGUAGE_AUDIT.md §3.4`.