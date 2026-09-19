# FINAL PROMPT CONTRACT RELEASE REVIEW

Review of the completed dynamic prompt contract implementation — final hardening
pass: **REMOVE ALL LEGACY VISUAL TEACHING from every dynamically composed Admin
Bulk Upload prompt**, without redesigning the architecture, rewriting topic
content, or touching parser compatibility.

Result: **RELEASE-SIGNAL GREEN** — the FINAL COMPOSED PROMPT teaches ONLY the
canonical output format, every taught visual example is verified against the
REAL production schemas, and all relevant gates pass.

---

## 1. Legacy Structures Removed From The Prompt

Audit source of truth: `src/lib/prompts/dynamicOutputContract.ts` (the ONLY place
that emits contract prose into composed prompts). Every other file that legitimately
mentions legacy tokens is either parser compatibility (`visualNormalizer.ts`,
`questionVisualSchemas.ts`, `exam.types` DiagramData) or the removal itself
(`promptContentSanitizer.ts`, `promptComposer.ts`) — none of those are scanned per §14.

| Legacy token / shape | In final composed prompt? | How removed / why absent |
|---|---|---|
| `visual_engine` | No | Strip-by-sanitizer for topic bodies; never written by the contract. |
| `render_type` | No | Same; the AI-engine `render_type` wrapper concept is not taught. |
| `headers_en` / `rows_en` | No | Legacy bilingual table keys — never taught. The canonical table teaches `data.headers` / `data.rows` (the `TableVisualSchema` shape). |
| `title_en` / `title_te` | No | Bilingual visual titles — never taught. Visual title is a single canonical `"title"`. |
| `metadata` | No | No `metadata` wrapper taught; visuals are `{ "type", "title", "data" }`. |
| `diagram` | **Removed this pass** | 3 occurrences had to be reworded (were in the word-sense, not as a structure): the opening "genuinely needs a diagram, chart, table, timeline, map, formula, or flow diagram" → "needs a table, chart, timeline, map, formula, or flow to reason correctly"; mermaid's "the complete diagram source" → "the complete mermaid source"; the answer-leak example "or a diagram whose label IS the answer" → "or a visual whose label IS the answer". |
| Legacy table/chart wrappers | No | Only the canonical `type`-discriminated envelope is taught. |

The final composed prompt (full scan) contains **zero** occurrences of
`visual_engine`, `render_type`, `headers_en`, `rows_en`, `title_en`, `title_te`,
`metadata`, or `diagram` — verified both by test (§4) and by a file scan of the
regenerated snapshot (§14).

---

## 2. Canonical Structures Verified

- One envelope taught: `{ "type": venn | chart | geometry | table | mermaid | latex | svg | map_overlay, "title": "short heading" | null, "data": { ... } }` — mirrors `QuestionVisualSchema` (discriminated union) exactly.
- One question format taught: the 14 canonical keys in `CANONICAL_QUESTION_FIELDS` (English + Telugu + topic identity + correct_option + difficulty + visual). No aliases (`question`, `options`, `correct`) are taught.
- One AUTHORITY preamble: topic body instructions that embed any other schema/alias/visual shape are explicitly superseded.
- Chart structure: exactly ONE authoritative shape taught — `{ chartType: enum, labels, data, series? }` with a concrete example (`chartType: "bar"`, `labels`, `data`) and **no** alternative-representation keys (`datasets`, `x_axis`, `colors`, `y_axis`, `yAxisLabel` are not shown). Asserted by deep-equality test.

---

## 3. Visual Examples — Parser Verification (§6/§7/§12)

Every visual example the contract teaches is programmatically rebuilt from
`VISUAL_TYPE_CONTRACTS` and asserted against the REAL production chain:

```
buildAllVisualExamples() ──► QuestionVisualSchema.parse()      (direct)
                          ──► normalizeVisualInput(example)     (real normalizer)
                          ──► Embed in buildCanonicalQuestionExample()
                              ──► BulkQuestionSchema.safeParse() (real parser schema)
```

| Type | QuestionVisualSchema | normalizeVisualInput | BulkQuestionSchema |
|---|---|---|---|
| venn | ✅ | ✅ | ✅ |
| chart | ✅ | ✅ | ✅ |
| geometry | ✅ | ✅ | ✅ |
| table | ✅ | ✅ | ✅ |
| mermaid | ✅ | ✅ | ✅ |
| latex | ✅ | ✅ | ✅ |
| svg | ✅ | ✅ | ✅ |
| map_overlay | ✅ | ✅ | ✅ |

Chronology is taught as a canonical `table` (Year/Event) — there is no
`timeline` visual type in the production enum, and no unsupported type is taught.
Representative reasoning payloads (table comparison, chart derivation, map
inference, chronology-as-table, mermaid hierarchy, plus a no-visual question)
also pass `BulkQuestionSchema` end-to-end.

---

## 4. Topic Identity Verification (§9)

- `## TOPIC IDENTITY` block injected by `composeBulkUploadPrompt(topicPrompt,
  topic)` using the LIVE `exam_topics` bytes; not derived from URL or prompt text.
- Contract rule 5 + identity prose both teach: topic fields name the **Topic
  GROUP, never a subtopic**; values must be copied VERBATIM and be byte-identical
  across the batch; a subtopic question still carries the group name.
- Service-layer STRICT REJECT (BU-10) independently rejects cross-topic name
  drift before any write.
- E2E: BU-03/BU-04 (live heading + Telugu name), BU-06 (topic-scoped prompts),
  BU-09 (copy carries identity + contract), BU-10 (attacked name never written).

---

## 5. Bilingual Verification (§8)

- The full APPSC bilingual field set is taught explicitly and verified by test:
  `topic_en`, `topic_te`, `question_text_en`, `question_text_te`,
  `option_a_en/te` … `option_d_en/te`, `explanation_en`, `explanation_te`.
- Tiered by what the production schema permits: when `topic_te` is non-null,
  EVERY Telugu field is REQUIRED — "no null Telugu values"; when the topic has no
  Telugu name, the Telugu fields may be null/omitted.
- The canonical question example is fully bilingual (single example, every
  Telugu field populated) and passes `BulkQuestionSchema` → `SingleQuestionSchema`
  (DB write shape).

---

## 6. Visual Answer-Leak / Necessity Verification (§10)

All gate rules are present word-for-word and pinned by tests that fail on any
future drift:

- REMOVE TEST — no visual if ordinary factual knowledge suffices.
- ANSWER-LEAK TEST — reject visuals that directly display the answer (canonical
  bad example: a ranked list whose question asks for the rank; a visual whose
  label IS the answer).
- INTERPRETATION TEST — the candidate must inspect/compare/calculate/infer/
  sequence/classify/locate FROM the visual to solve.
- No decorative visuals; no predetermined visual count; "a high-quality question
  without a visual beats a forced visual question" (never force visuals).
- Visual EXPLANATION rule — explain which visual information was used and how;
  never "the visual shows the answer".

---

## 7. Test Results

| Gate | Result |
|---|---|
| Prompt suites (`src/lib/prompts` — composer, contract, hardening) | ✅ 78/78 (includes new final-composed-forbidden-token scan, real-schema × every visual example, single chart structure, full bilingual field set) |
| Question validation + visual normalizer + security (architecture, canonical contract, prompt-topic-context) + questions components | ✅ 300/300 |
| Full unit suite | ⚠️ 1679/1681 — the two failures are the pre-existing parallel-run flakes (§9); both pass in isolation (21/21) |
| E2E chrome `bulk-topic-flow` (BU-01…BU-10) | ✅ 9/9 |
| `npm run build` (tsc + vite) | ✅ built (1m 05s) |
| ESLint on all touched files | ✅ 0 issues |
| Final composed prompt token scan (file-level) | ✅ 0 forbidden-token matches |

Representative valid output (Lothal question, fully bilingual) and rejected
outputs (legacy fenced `visual_engine` block, direct-answer visual, cross-topic
name drift) were re-validated against the real parse/write chain.

---

## 8. Remaining Known Issues

1. **Parser remains structural-only by design.** Semantic quality (visual
   necessity/answer-safety, bilingual completeness, duplicate concepts) is
   enforced at the prompt/contract layer with pinned-word tests, not
   re-inspected by the parser. STRICT REJECT covers topic-name integrity only.
   Intentional per final spec ("Parser compatibility is NOT prompt
   compatibility").
2. **Chronology is taught as a canonical `table`** — accurate to the production
   enum; if a dedicated chronology/timeline type is ever wanted, the schema and
   enum must change first (production schema is authoritative).
3. **Legacy parser compatibility is retained and intentionally NOT scanned**:
   `visualNormalizer.ts` + `questionVisualSchemas.ts` accept
   `visual_engine`/`render_type`/`metadata`-wrapped and bilingual (`headers_en`
   /`rows_en`) shapes for backward compatibility (documented, tested). They are
   deliberately excluded from the prompt-token scan (§14).
4. **Bilingual = tiered**, matching the schema (null Telugu permitted when the
   topic has no Telugu name). A fully mandatory bilingual contract would require
   a schema change first.
5. DB-stored prompt bodies are untouched by design (content tier); the migration
   `20260919000000_prompts_dynamic_output_contract.sql` still requires a
   deploy-time apply (no DB access in this environment).

---

## 9. The Two Parallel-Run Unit Failures — Investigation (§16)

**Findings: genuine pre-existing, unrelated to this change. Not caused or
exposed by it.**

| Evidence | Detail |
|---|---|
| Dependency-graph isolation | `admin-topics-remediation.test.tsx` imports only `topicsService`/`theme`/types; `ds033-topic-exams.test.tsx` imports `UserTopicExams`, `topicTestService`, `useAppscPaperSelection`, `errorClassification`. A repo-wide grep shows the ONLY production consumers of the prompt contract are `AIToolCards`, `useBulkUpload`, `InstructionsTab`, `PromptEditorModal` — none of which are in either test's transitive graph. |
| Isolated execution | Both files pass together (and repeatedly) in isolation: **21/21**. The failures reproduce only under full-suite parallel contention. |
| Failure signature | Both failures are timing-sensitive UI async tests (`waitFor`/`act` under heavy parallel transform/import load) — CASE 1 (initial load → topic list renders) and FIX-4 (switching subject clears previous topics). This matches the documented pre-existing flake pattern (`admin-topics-remediation … passes in isolation`). |
| Change scope | This work modified only `src/lib/prompts/*`, the four questions components, the e2e spec, and report files — not these tests, their components, or their services. |
| Full-suite delta | The full run's only failures were these two; every prompt, security, validation, and visual test in the suite passed, including the new hardening tests. |

No fix applied — they are flaky under parallel load, not defective logic, and
fixing them would be out of scope for a prompt-contract release review (flagged
for a separate CI-investigation ticket if desired).

---

## 10. Release Conclusion

The FINAL COMPOSED PROMPT teaches only the canonical output format:
- zero legacy visual tokens (file-scan + test),
- one canonical question format, one visual envelope, one chart structure,
- verified parse-ability of every taught visual through the REAL
  `QuestionVisualSchema` → `normalizeVisualInput` → `BulkQuestionSchema` chain,
- immutable topic identity + full bilingual mandate + complete visual necessity/
  answer-leak reasoning gate.

All relevant gates pass: prompt 78/78, validation/security/component 300/300,
e2e 9/9, build green, lint clean. The two full-run-only failures are proven
pre-existing and unrelated. **The dynamic prompt contract is cleared for
release**, subject only to the deploy-time migration apply documented in §8.5.