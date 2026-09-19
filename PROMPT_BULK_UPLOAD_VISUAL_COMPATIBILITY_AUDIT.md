# Admin Bulk Upload Prompt ↔ Visual System — Forensic Compatibility Audit

**Date:** 2026-09-18
**Scope:** Read-only forensic audit — no code, DB, prompt, migration, or data modifications.
**Verdict:** **COMPATIBLE WITH PROMPT CHANGES**

The canonical application contract (parser → normalizer → Zod schema → jsonb storage → secure renderer) is internally consistent, secure, and accepts all canonical shapes **plus** the legacy `render_type`/`visual_engine` shapes it deliberately supports. The incompatibilities found are confined to the **prompt contract layer**: the *live stored SQL prompts* currently instruction AI output shapes that the canonical gate rejects (bilingual `_en`/`_te` keys, `timeline`/`map`/`diagram` types, scalar chart `series[].value`, empty `visual`/`visual_engine` placeholders, map_overlay overlay `type` keys). Live production data (17/121 visuals) is 100% canonical — proof the application side behaves correctly.

---

## 1. Scope & Method

This audit answers: **for every visual structure a live Admin Bulk-Upload prompt promises or instructs the AI to generate, does that structure survive the real ingestion pipeline and render correctly?**

Pipeline traced (the real one):
`AI output → JSON.parse → BulkQuestionSchema (src/validations/questionSchema.ts:46-104) → normalizeVisualInput (src/services/questions/visualNormalizer.ts:59-84) → QuestionVisualSchema strict discriminated union (src/validations/questionVisualSchemas.ts) → questions.visual jsonb → secure fetch → QuestionVisualizer → 8 renderers`.

Verification was **in-memory only** — a temporary scratch test exercised the real `BulkQuestionSchema.safeParse` + `normalizeVisualInput` with 15 representative payloads and was deleted afterward. No production data, DB, or code was modified.

---

## 2. Prompt Inventory (Phase 1)

| # | Source | Location | Visual instructions present? |
|---|--------|----------|------------------------------|
| P1 | Live stored `prompt_templates` (171 rows, seeded out-of-band, rewritten by `20260823121745`) | DB table (fetched via `adminQuestionService.listPrompts`, shown in bulk-upload Instructions tab via `promptBlocks.find(p => p.is_default)?.prompt_text`) | **YES — multiple dialects**, several incompatible |
| P2 | `GENERIC_PROMPT` (in-code) | `useBulkUpload.ts:155-175` | Ambiguous rule 5: "Include 'visual' key ONLY if a diagram/chart is present. Use metadata schema for geometry, charts, venn, and tables." No shape, no type list, contradicting the example array (which omits visual) |
| P3 | `HISTORY_PROMPT` (in-code fallback for History and Culture) | `useBulkUpload.ts:177-342` | Skeleton only: `"visual": { "type": "...", "data": { ... } }` in final output (line 318). Canonical-compatible top level, but zero per-type field spec or type enum |
| P4 | Admin "Generate" tab copy prompt | `AIToolCards.tsx:34-35` → `getPromptText(MAX_QUESTIONS)` (sub-admin/create/types.ts:162-183) | **NO visual key at all** — this path never produces visuals (silent omission, not a rejection) |
| P5 | Topic-content prompt | `src/constants/aiPromptTemplate.ts:4-271` | Not bulk JSON; markdown model card only; no visual payload |

### Stored SQL (P1) visual dialects — exact lines in `20260823121745_prompt_topic_canonicalization.sql`

**Dialect A — bilingual `title_en`/`headers_en`/`rows_en` + unsupported types (INCOMPATIBLE)**
- DI prompt (Prompt 8, Visual Mandatory): lines 484-560.
  - Table: `"visual":{"type":"table","title_en":..,"title_te":..,"data":{"headers_en":[..],"headers_te":[..],"rows_en":[..],"rows_te":[..]}}`
  - Chart: `"visual":{"type":"chart","title_en":..,"title_te":..,"data":{"chartType":"bar","series":[{"name":"Rice","value":120}]}}`
- History & Culture (Group 1 & Group 2, e.g. Medieval/Bhakti/Sufi prompt lines 5460-5590):
  - Timeline: `"visual":{"type":"timeline","title_en":..,"data":{"events_en":[{"label","year"}],"events_te":[..]}}`
  - Table: bilingual headers_en/rows_en
  - Map: `"visual":{"type":"map","title_en":..,"data":{"locations_en":[{"name":"Agra"}],"locations_te":[..]}}`
  - Diagram: `"visual":{"type":"diagram","title_en":..,"data":{"labels_en":{..},"labels_te":{..}}}`
  - No-visual literal: `"visual": {}` (line 5434-5437 instruction)

**Dialect B — legacy `visual_engine.render_type` (PARTIALLY COMPATIBLE)**
- e.g. lines 720, 1470 output placeholders `"visual_engine": {}`; lines 2050-2090 "Do NOT include the visual_engine field"; lines 2243-2400 GOOD/BAD `visual_engine:{render_type,metadata}` examples (table/map_overlay).
- map_overlay GOOD example (line ~2298) includes `{"type":"marker","lat":..,"lng":..,"label":"India"}` — the `type` key is **not** in the canonical overlay schema and is rejected.

---

## 3. Application Contract — Source of Truth (Phase 3-4)

- **Canonical visual:** `{ type: VisualType, title?: string|null, data: Record<string, unknown> }` — `src/types/exam.types.ts:42-49`.
- **`SUPPORTED_VISUAL_TYPES = ['venn','chart','geometry','table','mermaid','latex','svg','map_overlay']`** — `timeline`, `map`, `diagram` are **not** in the set.
- **`VISUAL_LIMITS`** (`questionVisualSchemas.ts:4-17`): 200KB JSON / depth 8 / title 300 / table rows 100 / cols 20 / cell 2000 / mermaid 50 000 / latex 20 000 / svg payload 100 000 / chart points 500 / series 10 / map overlays 200.
- All per-type schemas `.strict()` on both the type object and `data` — **any unknown key is a hard rejection**.
  - Table data: `{ headers: string[1..20], rows: (string|number|boolean)[][] ≤100×20 }`
  - Chart data: `chartType ∈ {bar,line,area,pie}`, `labels/x_axis`, `data`, `series: (number | {name?, value: number[]})[]`, `datasets`, `colors`, `y_axis/yAxisLabel` — **`series[].value` must be an ARRAY of numbers**.
  - Map overlay data: `center{lat,lng}`, `zoom[1..20]`, `overlays: {lat,lng,label?,color?}[]` `.strict()` — no `type` key allowed.
  - Mermaid: `data.code` only. Latex: `expression`/`latex` non-empty. Svg: `svg_content`/`svg`.
- **Normalizer** accepts, in priority order: legacy `{visual_engine:{...}}` wrapper → legacy `{render_type,...}` object → canonical `{type,title,data}`; **throws `VisualNormalizationError` on anything else** (`visualNormalizer.ts:59-84`). Converts legacy mermaid from `metadata.definition`/`code`.
- **Bulk parser**: `visual: normalizeVisualInput(arg.visual ?? arg.visual_engine ?? null)` (`questionSchema.ts:71`). A thrown normalizer error is caught per-row at `useBulkUpload.ts:563-569` → `Row N (visual): ...` and the whole batch is marked invalid if any row fails.
- **DB**: `questions.visual` jsonb (no `questions.diagram` column); legacy `teacher_exam_questions.diagram` has 0 live rows and is isolate-only.
- **Renderers** (`QuestionVisualizer`): 8 types, single `role="img"`, per-renderer error boundaries, DOMPurify on svg, Mermaid strict dynamic import.

### Legacy `diagram` (sub-admin) isolation
`DiagramData` union (`pie_chart/bar_chart/line_graph/table/venn_diagram` + `metadata`) on `Question.diagram` and sub-admin create types is a **separate field** — not part of the bulk `visual` path, not written to `questions.visual`, 0 live rows. Out of scope for prompt compatibility; documented as isolated.

---

## 4. Empirical Runtime Trace — Phase 7 Results

Actual `BulkQuestionSchema.safeParse` / `normalizeVisualInput` outcomes for 15 representative payloads (scratch test, deleted after run):

| # | Payload (prompt-sourced vs canonical) | normalizer | bulk-upload row outcome |
|---|---------------------------------------|-----------|--------------------------|
| 1 | DI stored table (bilingual `title_en`/`headers_en`/`rows_en`) | **REJECT** | Row (visual) error |
| 2 | DI stored chart (`title_en` + scalar `series[].value`) | **REJECT** | Row (visual) error |
| 3 | History stored timeline (`type:timeline`, `events_en`) | **REJECT** | Row (visual) error |
| 4 | History stored map (`type:map`, `locations_en`) | **REJECT** | Row (visual) error |
| 5 | History stored diagram (`type:diagram`, `labels_en`) | **REJECT** | Row (visual) error |
| 6 | History stored "no visual" literal `visual: {}` | **REJECT** | Row (visual) error |
| 7 | Canonical table `{type,title,data:{headers,rows}}` | ACCEPT | Import |
| 8 | Canonical chart but **scalar** `series[].value` (as the prompt writes it) | **REJECT** | Row (visual) error |
| 9 | Canonical chart with **array** `series[].value` | ACCEPT | Import |
| 10 | Legacy `visual_engine:{render_type,metadata:{headers,rows}}` | ACCEPT | Import |
| 11 | Legacy wrapper map_overlay **with `type` key** in overlay (as stored GOOD example) | **REJECT** (ZodError) | Row (visual) error |
| 12 | Legacy wrapper map_overlay without `type` key | ACCEPT | Import |
| 13 | Canonical-AI engine `render_type` + top-level headers/rows (the `tests/fixtures/canonical-ai-question.json` shape) | ACCEPT | Import |
| 14 | `HISTORY_PROMPT` literal `visual:{type,data}` table skeleton | ACCEPT | Import |
| 15 | Canonical `map_overlay` (`center`,`zoom`,`overlays`) | ACCEPT | Import |

**8 accepted / 7 rejected.** Every rejected shape is one the *stored SQL prompts explicitly instruct* or that a model could produce from the under-specified in-code prompts.

---

## 5. Master Compatibility Matrix (Prompt | Parser | Normalizer | Schema | DB | Renderer)

| Visual structure promised by a prompt | Prompt contract (L1) | Ingestion (L2) | Rendering (L3) | Status |
|---------------------------------------|----------------------|----------------|----------------|--------|
| `visual: {type:'table', data:{headers,rows}}` (no `_en`/`_te`) | supported by HISTORY skeleton & canonical | ACCEPT | ACCEPT (TableVisualizer) | **COMPATIBLE** |
| `visual: {type:'chart', data:{chartType, series:[{name,value:[..]}]}}` (array) | absent from stored prompts | ACCEPT | ACCEPT | **COMPATIBLE** (correct shape not documented) |
| `visual_engine: {render_type, metadata:{headers,rows}}` (legacy) | stored GROUP-1 & General Studies prompts | ACCEPT | ACCEPT | **COMPATIBLE** |
| `visual_engine:{render_type:'map_overlay', metadata:{overlays:[{lat,lng,label}]}}` | **some stored** GOOD examples add `type:'marker'` | over lay `type` **REJECT** | — | **INCOMPATIBLE (as written)** |
| `visual: {type:'table', title_en/title_te, data:{headers_en..rows_te}}` (bilingual) | DI + History stored prompts | **REJECT** (strict) | — | **INCOMPATIBLE** |
| `visual: {type:'chart', title_en/te, data:{series:[{value:120}]}}` (scalar) | DI stored prompt GOOD example | **REJECT** (value must be array) | — | **INCOMPATIBLE** |
| `visual: {type:'timeline', data:{events...}}` | History stored prompt | **REJECT** (type not in SUPPORTED_VISUAL_TYPES) | — | **INCOMPATIBLE** |
| `visual: {type:'map', data:{locations...}}` | History stored prompt | **REJECT** (not `map_overlay`) | — | **INCOMPATIBLE** |
| `visual: {type:'diagram', data:{labels...}}` | History stored prompt | **REJECT** (type not supported) | — | **INCOMPATIBLE** |
| `visual: {}` (no-visual literal) | History stored Step-1 rule | **REJECT** (empty object) | — | **INCOMPATIBLE** |
| `visual_engine: {}` (placeholder in output schema) | DI lines 720/1470, many prompts | **REJECT** (no render_type) | — | **INCOMPATIBLE** (if emitted literally) |
| omit field entirely when no visual | all prompts "Do NOT include" | ACCEPT (`null`) | — | **COMPATIBLE** |
| (Generate-tab prompt) no visual key | P4 | produces no visual (silent) | — | **GAP** (no visuals ever) |

---

## 6. Field Matrix — stored-prompt fictional fields vs canonical schema

| Field instructed by a stored prompt | Exists in canonical schema? | Where it goes |
|-------------------------------------|-----------------------------|---------------|
| `type` | YES (enum of 8) | discriminator |
| `title` | YES | `title` |
| `title_en` / `title_te` | **NO** | strict rejects |
| `data.headers_en` / `headers_te` | **NO** (must be `headers`) | strict rejects |
| `data.rows_en` / `rows_te` | **NO** (must be `rows`) | strict rejects |
| `data.chartType` / `series` / `name` | YES | accepted **only if `value` is array** |
| `data.events_en/_te` | **NO** (no timeline type) | type not supported |
| `data.locations_en/_te` | **NO** (use `map_overlay.overlays`) | type not supported |
| `data.labels_en/_te` | **NO** (no diagram type) | type not supported |
| `visual_engine` / `render_type` / `metadata` | YES (normalizer compatibility) | converted to canonical |
| overlay `type:'marker'` | **NO** | strict rejects |

---

## 7. Limits — are prompt-instructed sizes within `VISUAL_LIMITS`?

Stored prompts never state numeric limits; the GOOD/BAD examples stay well within limits (small tables, few chart points, handful of overlays; mermaid examples are single-flow). **No prompt-instructed payload exceeds the enforced limits**, so limit violations are not a prompt issue. One limit-relevant instruction gap: prompts do not warn that list sizes are capped (100 rows / 20 cols / 500 points / 10 series / 200 overlays / 50 KB mermaid / 20 KB latex), so a model generating large data can silently exceed caps → rejection.

---

## 8. Silently-Lost Data / Silent Corruption

- **No silent data loss on accepted paths.** Canonical shapes round-trip unchanged. Legacy conversion is lossy by design but *documented and safe*: legacy mermaid `metadata.definition`/`code` → rebuilt strictly as `{code}`; extra top-level keys in a legacy engine are dropped but the engine schema is `passthrough`, so `convertLegacyEngine` derives only supported keys and `QuestionVisualSchema.parse` enforces the strict surface.
- **Rejections are loud**, not silent: each failing row surfaces as `Row N (visual): Unsupported visual format or invalid visual data` and the batch is blocked (`useBulkUpload.ts:615-617`). An admin following a stored prompt verbatim will hit a **full-batch rejection**, not corrupt data.
- **Silent omission risk (P4):** the Admin Generate-tab "Copy System Prompt" contains no visual instruction, so its pipeline output has visual `null` — no error, but zero visuals are ever generated through that entry point.
- **Empty-placeholder risk:** the many `"visual_engine": {}` output-schema placeholders (e.g. DI lines 720/1470) instruct the model to literally emit an empty engine object → per-row rejection. The correct instruction is *omit the field* (which the same prompts also state).

---

## 9. Findings Classification

**CRITICAL** — prompt instructions that guarantee whole-row rejection for the subjects they target:
- C1. Stored History (& Culture / Medieval / Ancient) prompts instruct unsupported types `timeline`, `map`, `diagram` with bilingual `_en`/`_te` data keys (migration lines ~5460-5590). Empirically rejected (P7 #3-5).
- C2. Stored DI (Visual Mandatory) prompt instructs bilingual table/chart keys `title_en/te`, `headers_en/te`, `rows_en/te` (migration lines ~484-560) and scalar `series[].value`. Empirically rejected (P7 #1-2, #8). These are the **default** (`is_default=true`) prompts shown in the bulk-upload Instructions tab for the Data Interpretation and History topics.
- C3. The literal `"visual": {}` "no visual" instruction is rejected (P7 #6): an empty object is not a valid `null`.

**HIGH**
- H1. `"visual_engine": {}` placeholders in output schemas cause rejection if emitted verbatim (multiple stored prompts).
- H2. Legacy map_overlay GOOD example embeds `{"type":"marker",...}` in overlays, which the strict overlay schema rejects (P7 #11) — the reference example itself is non-importable.
- H3. Chart contract mismatch: every stored chart example uses scalar `{name,value}` but the schema requires `value: number[]`; even a **canonical** chart with scalar value is rejected (P7 #8). The correct shape is nowhere documented for the AI.

**MEDIUM**
- M1. `GENERIC_PROMPT` rule 5 ("Include 'visual' key… Use metadata schema…") is ambiguous, contradicts its own example array (which omits `visual`), names an outdated "metadata schema" concept, and documents no type enum or field shapes → models free-form visual output that is often rejected.
- M2. `HISTORY_PROMPT` visual skeleton `"visual":{"type":"...","data":{...}}` has no type allow-list and no per-type data schema → same free-form risk; accepts only if the model happens to choose one of the 5 canonical shapes with valid data.
- M3. No numeric limit guidance anywhere in prompts (rows/cols/points/series/overlays/kb caps).

**LOW**
- L1. P4 (Generate-tab copy prompt) omits visuals — silent capability gap, no rejection.
- L2. `aiPromptTemplate.ts` (markdown model card) carries no visual contract — by design, informational.

**INFO**
- I1. Live data is 100% canonical (13 table + 4 mermaid, `title` set, 0 `_en`/`_te`, 0 legacy markers) — the application gate is behaving correctly; the drift is entirely in the prompt corpus.
- I2. `Question.diagram`/`DiagramData` legacy field is fully isolated (0 live rows, not on the bulk path, sub-admin-only).

---

## 10. Answers — Verdict Questions

1. **Do all prompt-declared visual types exist in the canonical system?** NO — prompts declare `timeline`, `map`, `diagram`; supported set is `venn, chart, geometry, table, mermaid, latex, svg, map_overlay`.
2. **Do prompt-instructed fields map 1:1 onto the schema?** NO — `title_en/te`, `headers_en/te`, `rows_en/te`, `events_en/te`, `locations_en/te`, `labels_en/te` have no canonical targets.
3. **Is nesting preserved end-to-end?** YES for canonical and legacy-converted shapes; NO for bilingual/unsupported-type shapes (rejected, not mangled).
4. **Are bilingual visual fields supported?** NO — canonical schemas are strict, single-language `title`/`headers`/`rows`. Bilingual *question text* is supported; bilingual *visual internal fields* are not part of the contract.
5. **Are all prompt-instructed sizes within `VISUAL_LIMITS`?** YES — but prompts never document the caps, risking silent cap-exceed rejections for large outputs.
6. **Is any valid prompt shape silently altered or dropped?** NO valid shape is silently dropped; accepted shapes round-trip faithfully. The only silent loss is the intentional legacy-engine top-level/mermaid collapse (documented) and the P4 visual omission (no visual ever generated).
7. **Does any prompt shape cause hard rejections?** YES — C1/C2/C3/H1/H2/H3 all cause per-row `(visual)` rejections; the batch is blocked if any present.
8. **Is the legacy `render_type`/`metadata` path intact and lossless-enough?** INTACT and verified (P7 #10, #12, #13). map_overlay GOOD example must drop `type:'marker'` (H2).
9. **Do `visual` and `visual_engine` keys both work?** YES — `arg.visual ?? arg.visual_engine` prefix then normalized. Both accepted when shapes are valid.
10. **Are empty objects handled correctly?** Empty `{}` (visual) or `{}` (visual_engine) are **rejected**, not silently coerced to null — correct & safe, but incompatible with prompt placeholders (C3/H1).
11. **Does the parser's row-error UX surface these failures?** YES — `Row N (visual): message` + batch blocked; clear but crude (no field-path detail from the throw path).
12. **Is the tightest defensible contract satisfied by prompts?** NO — only legacy `render_type` dialects (Group-1/General-Studies style) and the HISTORY `{type,data}` skeleton satisfy it; DI bilingual and History timeline/map/diagram prompts do not.
13. **Does the audit introduce or recommend any security weakening?** NO — nothing in this audit changes DOMPurify, Mermaid strictness, size limits, or fetch isolation.
14. **Are renderers verified end-to-end?** Renderers were component-tested in the visualization program (1607 tests, all canonical shapes); the browser E2E visual pass and print/export remain future work. This audit's runtime coverage is ingestion-level, not pixel-level.
15. **Overall verdict?** **COMPATIBLE WITH PROMPT CHANGES.** The application contract accepts canonical types + the supported legacy wrapper; the stored prompt corpus must be realigned to it.

---

## 11. Release-Gate Verdict

| Gate | Verdict | Basis |
|------|---------|-------|
| Canonical contract is internally consistent & secure | **PASS** | strict schemas + size/depth guards + F/D enrichment in report `QUESTION_VISUAL_RENDERING_IMPLEMENTATION_REPORT.md` |
| Parser → normalizer → schema accepts canonical shapes | **PASS** | P7 #7, #9, #15; 17/17 live visuals round-trip |
| Legacy `render_type`/`visual_engine` compatibility | **PASS** | P7 #10, #12, #13; named compatibility in normalizer |
| Stored **DI** prompt is importable as written | **FAIL** | P7 #1, #2 (bilingual keys) |
| Stored **History** prompts importable as written | **FAIL** | P7 #3, #4, #5, #6 (unsupported types + empty literal) |
| Prompt output-schema placeholders are non-poisonous | **FAIL** | `"visual_engine":{}` / `"visual":{}` emitted verbatim → rejection |
| Chart instruction matches schema | **FAIL** | scalar `series[].value`; correct array form undocumented |
| No silent data corruption or loss | **PASS** | rejections are loud; conversions documented |
| Generate-tab path can produce visuals | **FAIL (gap)** | P4 has no visual instruction |
| No security regression | **PASS** | zero security changes; strictness preserved |
| **OVERALL** | **COMPATIBLE WITH PROMPT CHANGES** | Application gate sound; prompt corpus needs realignment |

---

## 12. Correction Plan (for a subsequent, separately-scoped change — NOT performed here)

**PRIORITY 1 — realign stored prompts to the canonical visual contract** (new prompt_templates content, `is_default` preserved):
1. Replace bilingual visual objects with canonical shapes:
   - Table → `{"type":"table","title":"..","data":{"headers":[..],"rows":[..]}}`
   - Chart → `{"type":"chart","title":"..","data":{"chartType":"bar","series":[{"name":"..","value":[120,95,82]}]}}` (**value must be array**)
   - Timeline → encode as **canonical table** (`headers:["Event","Year"]`, rows) or `mermaid`; do not use `timeline`
   - Map → `{"type":"map_overlay","title":"..","data":{"center":{..},"overlays":[{"lat":..,"lng":..,"label":".."}]}}` — **omit `type` in overlays**
   - Diagram/hierarchy → `mermaid` `{"type":"mermaid","title":"..","data":{"code":"graph TD;..."}}`
2. Change every `"visual": {}` / `"visual_engine": {}` placeholder instruction to **"omit the visual/visual_engine key entirely when no visual is required"**.
3. Add a visual **type allow-list** (8 canonical types) and one GOOD/BAD canonical example per type, with numeric caps (rows/cols/points/series/overlays/kb).
4. State that visual fields are single-language (`title`/`headers`/`rows`), matching the canonical contract; keep bilingual text fields as-is.

**PRIORITY 2 — in-code prompts:**
5. Harden `GENERIC_PROMPT` rule 5 and `HISTORY_PROMPT` by embedding the canonical type enum + per-type data shapes (consume the same shared prompt fragment).
6. Add a `visual` key to the `AIToolCards` "Generate" prompt (`getPromptText`) so that entry point can produce visuals.

**PRIORITY 3 — hardening (non-blocking, optional):**
7. Catch the normalizer throw's zod detail in `useBulkUpload.ts:563-569` to also list the failing field path (better UX than a single message).
8. Detect prompt rows containing non-canonical visual dialects at prompt-write time (validation guard) to prevent future drift.
9. Server-side validation of `questions.visual` as a follow-up guard (documented previously; still recommended).

---

## 13. Evidence Record

- Migration: `supabase/migrations/20260823121745_prompt_topic_canonicalization.sql` (DI bilingual lines 484-560; History timeline/table/map/diagram lines 5430-5590; legacy `visual_engine` GOOD/BAD lines 2050-2400).
- Code: `useBulkUpload.ts` (GENERIC 155-175, HISTORY 177-342, currentPrompt 380-384, per-row catch 562-569); `AIToolCards.tsx:34-35`; `sub-admin/create/types.ts:162-183`; `questionSchema.ts:46-104`; `visualNormalizer.ts:20-84`; `questionVisualSchemas.ts:4-180`; `exam.types.ts:3-49`.
- Live checks (read-only):
  - `questions.visual` jsonb; 17/121 visuals (13 table + 4 mermaid), all with canonical `title`, 0 with `title_en`/`headers_en`/`render_type`.
  - 171 `prompt_templates` rows seeded out-of-band; DI/History default prompts contain bilingual/unsupported-type visual instructions; legacy `render_type` prompts (Group-1 Ancient History) use the supported wrapper.
  - Visual-bearing topics: "Early Medieval India & South Indian Dynasties" (12) and "Indus Valley Civilization & Early Historic India" (5), subject History and Culture, paper 926c7d30-….
- Phase 7 in-memory trace: 8 ACCEPT / 7 REJECT across 15 representative payloads through the **real** `BulkQuestionSchema.safeParse` + `normalizeVisualInput` (scratch test created and deleted; no repo or DB change).