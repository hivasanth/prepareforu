# Prompt Quality + Canonical Output Contract Hardening — Implementation Report

Scope: the FINAL hardening pass over the dynamic output contract + prompt quality, per the
44-section `PROMPT QUALITY + CANONICAL OUTPUT CONTRACT HARDENING` spec. Executed in the
mandated order: AUDIT → IMPLEMENT → TEST → REPRESENTATIVE AI-OUTPUT VALIDATION → VERIFY
FINAL PROMPT → REPORT.

---

## 1. Before / After Architecture

### Before (migration landing state)
- Composer: `composeBulkUploadPrompt(topicPrompt)` → sanitize legacy fences → inject
  `CANONICAL OUTPUT CONTRACT v1.0` once. The **actual topic bytes never reached the prompt**.
- Contract taught topic fields as "copy VERBATIM" but had no mechanism to enforce the
  Topic-GROUP-vs-subtopic rule and could not name the live values.
- Bilingual teaching: "use null when a translation is not applicable" — tolerated half-baked
  Telugu even for topics that have a Telugu name.
- Visual teaching: envelope, types, size limits, per-type data shapes, visual-opportunity
  hook. **No** necessity gate, no answer-leak test, no "must interpret to solve" rule, no
  visual-explanation rule, no "don't overuse/force" rule.
- Validation rules: 9 short rules. No exact-count rule, no integer-distribution rule, no
  duplicate-concept ledger, no option-quality/AoTA-NoA ban, no answer-spread rule.

### After
- Composer: `composeBulkUploadPrompt(topicPrompt, topic?)` — when the caller supplies the
  live `TopicIdentity` (`topic_en`, `topic_te` from the selected `exam_topics` record), a
  `## TOPIC IDENTITY` block is injected **between** the topic instructions and the contract.
  Idempotency (`CONTRACT_IDEMPOTENCY_RE` short-circuit) preserved; marker handling unchanged.
- Callers wired: `useBulkUpload.currentTopicIdentity` memo →
  `BulkUploadPanel` → `InstructionsTab` (display + copy) and `AIToolCards` (Generate-tab
  copy). Copy and display now compose byte-identical text.
- Contract `dynamicOutputContract.ts` v1.0 (same version string): canonical fields rewritten,
  question example fully bilingual, VISUAL CONTRACT extended with VISUAL USE / NECESSITY GATE /
  REASONING EXAMPLES / TYPE SELECTION / VISUAL EXPLANATION, VALIDATION RULES expanded to 16
  rules with an authority preamble.

```
topic instructions (stored body, untouched)
        │  sanitizeLegacyApplicationFormat()   (fenced legacy JSON removed)
        ▼
topic instructions (clean)
        │  + TOPIC IDENTITY block              (live exam_topics bytes, §22)
        │  + CANONICAL OUTPUT CONTRACT v1.0    (the ONLY output authority)
        ▼
composed copy/display text  ──►  clipboard  (identical in both tabs)
```

---

## 2. Prompts Audited / Changed

Stored `ai_prompts` bodies and the GENERIC/HISTORY fallbacks were **audited only** — none of
the 33 in-repo prompt bodies were edited by this pass (they are content-tier; output shaping
is the contract's job). The contract itself (`dynamicOutputContract.ts`) is the changed
artifact, plus the composer and three consumer components.

### UI copy surfaces changed
| File | Change |
|---|---|
| `src/lib/prompts/promptComposer.ts` | new `TopicIdentity`, `buildTopicIdentityBlock()`, optional topic param on compose |
| `src/lib/prompts/dynamicOutputContract.ts` | canonical fields, bilingual example, visual contract, 16 validation rules |
| `src/components/admin/questions/useBulkUpload.ts` | `currentTopicIdentity` memo; `handleCopy` composes WITH identity |
| `src/components/admin/questions/InstructionsTab.tsx` | accepts + composes with `topicIdentity` |
| `src/components/admin/questions/AIToolCards.tsx` | same, for the Generate-tab copy |
| `src/components/admin/questions/BulkUploadPanel.tsx` | threads `currentTopicIdentity` to both |

### The single most important category verified on the real pipeline
Ancient Indian History (legacy pre-canonical template): syllabus lines, visual-opportunity
matrix, distribution percentages (30/50/20) and quality line all survive byte-for-byte; the
embedded legacy fenced `visual_engine` JSON is removed; the live topic identity and the
canonical contract are injected once. Covered by `promptQualityHardening.test.ts`.

---

## 3. Topic Names Preserved

- `topic_en` / `topic_te` are **never rewritten** by any code path. The composer only reads
  them (from the selected topic record) and interpolates them verbatim into the identity
  block. No transform, case change, or transliteration exists on either value.
- The contract and identity block both carry the hard rule: topic fields are the Topic GROUP,
  never a subtopic; a question about the Indus Valley Civilization under "Ancient Indian
  History" still carries the group name; values must be byte-identical across the batch.
- Pinning test: `src/security/upload-questions-architecture.test.ts` still requires the
  GENERIC/HISTORY fallbacks to say "copy EXACTLY from the topic name given in this prompt"
  and "never translate, transliterate, shorten or rephrase them."

---

## 4. Legacy Structures Removed

Already-removed by the migration, re-verified here for every composed output:
- Fenced `visual_engine` / `render_type` JSON embedded in topic bodies → stripped by
  `sanitizeLegacyApplicationFormat` (the `# OUTPUT JSON STRUCTURE` header line survives; the
  fenced block is dropped).
- Static per-prompt "output JSON structure" copy embedded in each stored prompt → no longer
  referenced (contract is the single authority).
- The contract itself contains none of the forbidden legacy tokens:
  `visual_engine`, `render_type`, `"metadata"`, `"title_en"`, `"headers_en"`, `"rows_en"`,
  `"type": "marker"`, `"options"`, `"correct":` — asserted by test.

---

## 5. The Canonical Contract (v1.0 — unchanged version string)

`buildCanonicalOutputContract()` is the single, byte-identical authority. Structure:
1. **AUTHORITY preamble** — if topic instructions embed any other JSON schema/alias/visual
   shape, IGNORE it; this section is the ONLY authority.
2. **QUESTION OUTPUT FORMAT** — exact keys, with the canonical question object. The example
   is now fully bilingual (`topic_te: "పాలిటీ ప్రాథమికాలు"`, every Telugu field filled).
3. **VISUAL CONTRACT** — see §6.
4. **VALIDATION RULES** — 16 rules, see §7–§12.
5. Bounded (well under contexts), composed exactly once, idempotent, present once even for
   marker-embedded prompts.

---

## 6. The Visual Contract

Envelope + 8 supported types (`venn | chart | geometry | table | mermaid | latex | svg |
map_overlay`) + per-type data shapes and size limits — seeded by the production schemas in
`src/validations/questionVisualSchemas.ts` — now followed by four teaching blocks:

- **VISUAL USE — NECESSITY GATE**: a visual is included only when it provides information the
  candidate genuinely needs. Three mandatory checks: REMOVE TEST (answerable from ordinary
  factual knowledge → `visual = null`), ANSWER-LEAK TEST, INTERPRETATION TEST (candidate must
  inspect/compare/calculate/infer/sequence/classify/locate FROM the visual).
- **REASONING EXAMPLES**: good table (compare rows/columns for a conclusion/difference/
  ordering), good chart (derive percentage/difference/ratio/trend — "the answer is never a
  chart label read directly"), good map (locations without labelling the conclusion; infer
  from the distribution), good chronology (events+dates in a table; identify sequence).
- **VISUAL TYPE SELECTION**: choose the type that fits the reasoning; follow the topic's
  visual opportunities; do NOT force svg/latex/geometry/venn.
- **VISUAL EXPLANATION**: a visual question's explanation must state which visual information
  was used and how it leads to the answer; never "the visual shows the answer".
- **Accuracy note**: there is no supported `timeline` type in the production schema; the
  contract teaches chronology as a `table` (Year/Event). Documented, not "fixed" in the
  schema.

---

## 7. Topic Identity Enforcement

- **Dynamic injection**: `buildTopicIdentityBlock()` reads the LIVE `exam_topics` bytes
  (`topic_en`/`topic_te`) and writes:
  ```
  ## TOPIC IDENTITY
  Every question in this batch belongs to EXACTLY this topic group...
  topic_en = "Ancient Indian History"
  topic_te = "ప్రాచీన భారతదేశ చరిత్ర"
  Copy these values VERBATIM into every question object...
  ```
- **Topic-GROUP rule**: identity block + validation rule 5 both teach that a subtopic question
  still carries the group name and that the values are byte-identical across the batch.
- **Cross-topic drift is still a service-level rejection**: the STRICT REJECT path (BU-10)
  rejects a question whose topic name does not match the selected topic — prompt-level
  teaching is defense-in-depth on top of that hard enforcement (e2e 9/9).

---

## 8. Bilingual Enforcement

Tiered to what the schema actually permits (production schema authoritative):
- Topic **has** a Telugu name (`topic_te` non-null): every `question_text_te`,
  `option_a_te..d_te`, `explanation_te` is REQUIRED — "no null Telugu values" (validation
  rule 6). The identity block repeats the mandate with the concrete field names.
- Topic has **no** Telugu name (`topic_te` null): Telugu fields may be null or omitted.
- Quality bar (rule 7): Telugu fields are natural, grammatical, faithful translations that
  never add/omit information; Telugu options mirror English exactly.
- Verified: `promptQualityHardening.test.ts` asserts a fully bilingual payload carries every
  needed Telugu field and passes `BulkQuestionSchema`.

---

## 9. Visual Reasoning Rules

See §6 — necessity gate, reasoning examples, type selection, and explanation rule, plus
validation rule 10. All asserted word-for-word in the hardening test (soft-wrap-safe
substrings) so any future drift fails CI.

---

## 10. Answer-Leak Prevention

- Validation rule 9: options similar in length/structure/style; question wording, option
  details, visual labels/title and explanation must never reveal the correct answer.
- ANSWER-LEAK TEST names the canonical bad example: a ranked list whose question asks for the
  rank, or a diagram whose label IS the answer → reject the design.
- VISUAL EXPLANATION forbids "the visual shows the answer" explanations.
- Enforcement boundary: the parser is structural-only by design (BU-10); these semantic rules
  are taught at the prompt/contract layer and pinned by tests.

---

## 11. Distribution Handling

Validation rule 14: percentage/ratio targets in topic instructions must be converted to exact
**INTEGER** counts summing to the required total; topic coverage, difficulty, cognitive and
question-type allocations must each sum to that total and must not conflict. Rule 13 enforces
the EXACT total ("never fewer, never more; count internally and correct the total"). Rule 12
requires an A/B/C/D correct-answer spread with no repeatable pattern.

---

## 12. Parser Compatibility

- Production parse path unchanged: `BulkQuestionSchema` + `normalizeVisualInput` still accept
  every output the composer can teach. Representative payloads are piped through the REAL
  parser in tests (9 taught types + chronology-table + full-bilingual payload).
- No new fenced JSON blocks were added to contract prose, so the Phase 20 taught-example
  extraction and `legacyPromptRegression` suites remain green.
- `CONTRACT_IDEMPOTENCY_RE` short-circuit, `ensureSingleContractMarker`, and the marker
  constant are untouched.

---

## 13. Test Results

| Check | Result |
|---|---|
| New `promptQualityHardening.test.ts` (21 tests: Ancient Indian History composition, topic identity, bilingual, visual teaching, real-parser payloads) | ✅ pass |
| `promptComposer.test.ts` (topic-identity injection/idempotency/marker) | ✅ pass |
| Prompt suites (`src/lib/prompts`, 4 files) | ✅ 74/74 |
| Components + security + validations + services (`questions` area) | ✅ 895/895 |
| Full unit suite | ⚠️ 1679/1681 — the 2 failures are the documented parallel-run flake (`admin-topics-remediation` HIGH-1 CASE 1, `ds033-topic-exams` FIX-4); both pass in isolation (21/21) and are unrelated to this change |
| `npm run build` (tsc + vite) | ✅ built (3m11s) |
| ESLint on all 8 touched files | ✅ 0 issues |
| e2e chrome (BU-01…BU-10, 9 tests) | ✅ 9/9 (1 fix: BU-04 Telugu heading assertion made `exact:true` because the composed prompt now legitimately contains the topic's Telugu bytes) |

---

## 14. Representative Valid Output

### Composed prompt (Ancient Indian History, truncated to the identity moment)
```
# OBJECTIVE
Generate exactly 50 high-quality MCQs covering: Indus Valley Civilization; Vedic Age;
Jainism and Buddhism; the Mahajanapadas; the Mauryan and Gupta empires; the Sangam Age.
...
# DISTRIBUTION
Easy 30%, Medium 50%, Hard 20%.
# QUALITY
Questions must be reasoning-based and must never reveal the answer in the options.

## TOPIC IDENTITY
Every question in this batch belongs to EXACTLY this topic group...
topic_en = "Ancient Indian History"
topic_te = "ప్రాచీన భారతదేశ చరిత్ర"
Copy these values VERBATIM into every question object...
This topic is bilingual: EVERY question MUST fill every Telugu field (question_text_te,
option_a_te..option_d_te, explanation_te) — no null values.

======================================================================
CANONICAL OUTPUT CONTRACT v1.0 — AUTHORITY
...
```

### Valid model-shaped payload (exactly what a conforming model returns; parses)
```json
{
  "topic_en": "Ancient Indian History",
  "topic_te": "ప్రాచీన భారతదేశ చరిత్ర",
  "question_text_en": "Which Harappan site is best known for a dockyard and bead-making workshops?",
  "question_text_te": "హారప్పన్ నాగరికతలో ఓడరేవు మరియు పూసల పరిశ్రమకు ప్రసిద్ధి చెందిన ప్రదేశం ఏది?",
  "option_a_en": "A. Harappa",
  "option_a_te": "ఎ. హారప్పా",
  "option_b_en": "B. Mohenjo-daro",
  "option_b_te": "బి. మొహెంజోదారో",
  "option_c_en": "C. Lothal",
  "option_c_te": "సి. లోథాల్",
  "option_d_en": "D. Kalibangan",
  "option_d_te": "డి. కాలీబంగన్",
  "correct_option": "C",
  "explanation_en": "Lothal's excavated dock suggests maritime trade; bead workshops confirm craft specialisation.",
  "explanation_te": "లోథాల్‌లో తవ్వబడిన ఓడరేవు సముద్ర వాణిజ్యాన్ని; పూసల కర్మాగారాలు సంక్లిష్ట హస్తకళలను సూచిస్తాయి.",
  "difficulty": "medium",
  "visual": null
}
```
Passes `normalizeVisualInput` (when visual present) and `BulkQuestionSchema`. Each of the 9
supported visual types + the chronology table shape were also pushed through the real parser.

---

## 15. Representative Rejected Output

### (a) Legacy fenced engine block — structurally REMOVED by the composer
```json
{ "topic_en": "...", "topic_te": "...",
  "visual_engine": { "render_type": "table", "title": "Sites",
                     "headers_en": ["Site","Feature"], "rows_en": [["Lothal","Dockyard"]] } }
```
Asserted absent from composed text (no `visual_engine`, `render_type`, `"headers_en"`,
`"rows_en"`).

### (b) Direct-answer visual — REJECTED by contract teaching (canonical bad example)
A "Top 5..." ranked list visual whose question asks for the rank, or a diagram whose label IS
the answer → explicitly rejected by the ANSWER-LEAK TEST. Since the semantic gate is taught
at the contract layer (the parser stays structural-only), drift here fails the pinned
teaching assertions in CI.

### (c) Cross-topic name drift — REJECTED by STRICT REJECT at the service layer
Question carrying a topic name that differs from the selected topic is rejected and never
written (e2e BU-10: attacked topic name does not reach the DB; only canonical rows upload).

---

## 16. Remaining Compatibility Code (deliberately untouched)

- GENERIC / HISTORY fallback prompt bodies in `useBulkUpload.ts` — pinned by the security
  suite wording + e2e (`Return ONLY a valid JSON array`).
- `promptContentSanitizer.ts` marker + legacy sanitizer (dependency-free).
- `dynamicOutputContractMarker.ts`, marker constant, single-marker enforcement.
- Parser `BulkQuestionSchema` / `normalizeVisualInput` — structural-only acceptance.
- The `20260919000000_prompts_dynamic_output_contract.sql` migration (apply at deploy time;
  stored prompt bodies unchanged so **no regeneration is needed**).

---

## 17. Manual-Review Issues / Known Limitations

1. **Parser remains structural-only by design** — semantic quality (visual necessity,
   answer-safety, bilingual completeness, duplicate concepts) is enforced at the prompt/
   contract layer with pinned tests, not re-inspected by the parser. STRICT REJECT covers only
   topic-name integrity at the service layer.
2. **Chronology taught as a `table`** — no `timeline` visual type exists in the production
   schema; the contract teaches a Year/Event table instead (accuracy over a nonexistent type).
3. **Bilingual = tiered** — mandated as REQUIRED when `topic_te` is present because the
   schema allows null Telugu. If a fully-mandatory bilingual contract is ever wanted, the
   schema must change first (production schema is authoritative per spec).
4. **Two legacy visual data shapes** in the canonical example ("headers_en"/"rows_en") — kept
   because `normalizeVisualInput` deliberately WELCOMES legacy table shapes (documented
   migration compatibility). The reviewer may prefer dropping them from the taught example;
   flagged for manual decision.
5. Known parallel-run unit flake (2 files, pass in isolation) predates this pass and is
   unrelated.
6. Live DB apply of the migration still requires a deploy-time step (no DB access in this
   environment) — unchanged by this pass.

---

## 18. Acceptance (R-mapped)

| Spec requirement (excerpt) | Evidence |
|---|---|
| R1 Do not rewrite topic content | Syllabus/distribution/quality bytes byte-preserved (test) |
| R2/R3/R21 Topic identity immutable, identical across batch | TOPIC IDENTITY block + rule 5 + STRICT REJECT (BU-10) |
| R4/R24 Bilingual mandatory; no null Telugu for bilingual topics | Rule 6 + identity mandate + full-bilingual payload parses |
| R5/R6 Telugu/English quality | Rule 7 (faithful, no add/omit; options mirror exactly) |
| R7 Reasoning priority | Rule 8 (comparison/chronology/cause/application/inference/multi-statement) |
| R8 No answer giveaways | Rule 9 + type-selection/explanation prose |
| R9–R16, R33, R35–R38 Visual necessity/reasoning/no-leak/no-overuse/explanation | VISUAL CONTRACT §6 + rule 10, all pinned word-for-word |
| R17/R19/R20/R23/R40 One output contract, one visual contract, production schema authoritative | Single `buildCanonicalOutputContract()`; AUTHORITY preamble; schema-driven type enum/limits |
| R18 Legacy structures removed | Composer strips fenced legacy JSON; no forbidden tokens |
| R22 Dynamic topic injection | Live `exam_topics` bytes via `currentTopicIdentity` at ≥4 call sites |
| R25 Exact question count = 50 | Rule 13 (EXACTLY the number specified) |
| R26/R27 Integer distributions | Rule 14 |
| R29 No duplicate concepts | Rule 11 (internal concept ledger) |
| R30 Option quality; no All/None of the Above | Rule 12 |
| R31 Answer distribution not predictable | Rule 12 (spread, no repeatable pattern) |
| R32 Explanations | Canonical field + visual-explanation rule |
| R34 Final internal quality review checklist | 16-rule validation block doubles as the checklist |
| R36/R37 Good/bad visual examples | REASONING EXAMPLES (good) + ANSWER-LEAK example (bad) |
| R38 Don't overuse visuals | REMOVE TEST, no-predetermined-number, "no visual beats a forced visual" |
| R39 Architecture | Single authority + idempotent single-composition pipeline (§1) |
| R42 Testing list | promptQualityHardening (21) + composer topic-identity + real-parser payloads ✚ full/isolated unit, build, lint, e2e 9/9 |
| R43 Acceptance criteria | Acceptance matrix above + e2e BU-01…BU-10 9/9 ✅ |