# Exam Validation Exception Register

**Phase 2B — Step 6 (Exam Runtime Validation), Step 8 (Repository Final Certification).**
**Status:** ACTIVE — created 2026-08-01 (Step 6), extended Step 8.
**Principle (Golden Rule):** The exam experience wins where ordinary form validation conflicts with exam usability. This register records every justified deviation from the standard validation model (inline field errors + certified `Alert`), so the runtime never silently drifts and every exception has a stated reason.

The standard model was established in Steps 3–5: field validation is shown **inline below the field** (`aria-live="polite"`, `id` + `aria-invalid` + `aria-describedby`), API/server failures render on the certified `Alert` (`role="alert"`), timing is submit + blur. During a timed exam none of those surfaces exist — the student is reacting under time pressure, answers are transient, and the server is authoritative. The exceptions below are therefore **deliberate**, not debt.

---

## Registered exceptions

| # | Surface | Standard model says | Why the exception | Kept as |
|---|---|---|---|---|
| E1 | Timer countdown | Validation/status announcements use `role="status"` live regions | The timer is the core exam constraint; its live countdown must be announced for screen readers but must not disturb reading | `role="timer"` + `aria-label` + sr-only `role="status"` announcements at 10-second marks in the final minute |
| E2 | Time expiry / auto-submit | Inline error + Alert | Expiry is not a validation error — it is a hard system boundary; the modal is intentionally non-dismissable so a student cannot keep the exam open past time | Auto-submit modal (auto-submit variant), announced via the timer's live region |
| E3 | Unanswered-question summary | Field validation | Not an error — a pre-submit briefing. Must be announced, but as a summary, not as per-field errors | Summary box in the manual-submit modal with `role="status"` |
| E4 | Tab-switch limit | Alert | Auto-submit security boundary; the warning belongs in the contextual exam banner so the student keeps their place, not a dismissable toast/Alert | Contextual exam banner (`onSecurityNotice`) |
| E5 | Fullscreen exit / prompt | Alert | Security state change, not a validation failure; must stay contextual and never block the exam | Raw contextual boxes (Step 6); `role="alert"` added in Step 7 on the prompt (`ExamLayout`) and the violation notice (`StatusBoard`) - still not forced to the certified `Alert` surface |
| E6 | Security notices (fullscreen prompt, Telugu fallback) | Alert | Contextual status, not errors | Raw amber/cyan contextual boxes |
| E7 | Telugu-fallback boxes | Alert | Fallback language notice, not an error | Contextual box |
| E8 | Transient save-failure banner | Alert | Answer saves are transient and auto-retried; a hard Alert would interrupt the flow for a momentary RPC rejection | Optimistic rollback + 5 s contextual banner (`onError`) |
| E9 | Silent autosave | Field validation | Fire-and-forget by design — must never interrupt the student; only logged | `catch {}` with a log added (Step 6) |
| E10 | Navigation time/visit persistence | Field validation | Non-stale failures are silently recovered by design; logging only | `console.warn` kept; log added |
| E11 | Session expiry auto-submit | Alert | Hard system boundary, not a validation error | Auto-submit flow (unchanged) |
| E12 | One-time review gate | Alert | A gate on access, not a field validation; must show as a full-page state | Full-page error state (unchanged), with the write now wrapped so it cannot become an unhandled rejection |

---

## What is NOT an exception (in-scope fixes, standard model where it fits)

- Invalid attempt/paper links → retryable full-page `ExamPageError` (reliability fix, #2/#3 in the inventory).
- Invalid answer-option value at the service boundary → shared `selectedOptionSchema` throw (rule, not a form surface).
- Result parsing → shared `submitResultSchema` (validation of a payload, not a form).
- EN-field integrity post-fetch → shared `questionEnFieldsSchema` (rule owner, messages preserved).

---

## Change Record

- v1.0.0 — 2026-08-01 — Created with Step 6. E1–E12 registered as deliberate exam-experience exceptions to the Steps 3–5 standard model.
- v1.1.0 — 2026-08-01 — Step 7: E5 `role="alert"` wiring completed on the fullscreen prompt and violation notice. No new exceptions registered — the sweep introduced no deviations from the standard model.
- v1.2.0 — 2026-08-01 — Step 8 (final certification): registered E13–E19 — repository-wide deviations confirmed during certification that are NOT exam-runtime Golden-Rule exceptions but are deliberate, severity-classified, owner-assigned deviations accepted for production. Each has a future review phase.

---

## E13 — Base `Button` has no keyboard focus ring

- **Reason:** `AntigravityButton` renders no `focus-visible:ring` (only `IconButton` supports opt-in `focusRing`). The frozen golden reference §10.3 specifies a focus ring; the base button relies on browser-default focus outlines today.
- **Severity:** High
- **Owner:** Foundation (Design System — Button)
- **Future Phase:** Next planned a11y hardening phase (additive `focus-visible:ring` to base `Button`; no geometry change).
- **Reference:** `src/components/common/AntigravityButton.tsx:19-27,89-125`; `design-system-compliance.md`.

## E14 — No `warning` button variant

- **Reason:** The Button system defines 9 variants with no `warning`; the Phase 2A semantic mapping (D2) assigned "attention/retry" to existing variants — `RetryButton` uses `primary`, amber/warning semantics live only in `Alert`/`Badge`/`StatCard`. Creating a variant is a Foundation-evolution decision requiring ≥3 consumers and is deferred.
- **Severity:** Medium
- **Owner:** Foundation (Design System — Button)
- **Future Phase:** Next planned phase if ≥3 runtime consumers require an attention variant.
- **Reference:** `src/components/common/AntigravityButton.tsx:9,30-82`; `PHASE_2_EXECUTION_LOG.md` Phase 2A D1–D3.

## E15 — `QuestionNavigator` parallel `NavButton` mini-system

- **Reason:** `QuestionNavigator.tsx:26-30,33,104-110` defines a local `NavButton` re-implementing primary/secondary/danger variants instead of composing the certified `Button`. Exam-flow micro-controls are registered exceptions (E22–E75 precedent); the exam navigation bar predates the Button system and is intentionally left visually stable.
- **Severity:** Low
- **Owner:** Exam feature
- **Future Phase:** Next consolidation phase — migrate `NavButton` to certified `Button`/`IconButton` and delete the local variant map.
- **Reference:** `src/components/exam/QuestionNavigator.tsx:26-30`.

## E16 — Raw `<button>` standard-action sites outside the Button system

- **Reason:** ~15 raw `<button>` elements are genuine standard actions not covered by E22–E75: `ExamLayout.tsx:28` (Enter Fullscreen), `SuccessView.tsx:41,47`, `LangInputPanel.tsx:63,71`, `JsonTab.tsx:44` (Skip Row), `QuestionCard.tsx:90-98`, `TopicListItem.tsx:73-113` (5 icon actions), `QuestionsTableComponents.tsx:48-71` + `QuestionsTable.tsx:157-180`, `NotificationPanel.tsx:120,204,213,223`, `QuestionActions.tsx:30`, `AIToolCards.tsx:51`, `AntigravityResults.tsx:46` (CTACard, also unexported/dead). The largest cluster is admin/topic table icon actions that should be `IconButton`.
- **Severity:** Low
- **Owner:** Feature owners (Admin tables, topics, exam layout, notifications)
- **Future Phase:** Next consolidation phase — migrate to `Button`/`IconButton`.
- **Reference:** `design-system-compliance.md` button audit.

## E17 — Auth-page bypass of the layout/typo system (documented golden-reference bypass)

- **Reason:** `SplashPage`, `FinishSignInPage`, `AccountDisabledPage`, `UpdatePasswordPage`, `VerifyEmailPage`, `LoginPage`, `SignupPage` intentionally bypass PageContainer/typography tokens (documented as HIGH/MEDIUM bypass in golden ref §1.4). Auth inputs also lack programmatic labels (F-A-3).
- **Severity:** High (a11y) / Low (layout)
- **Owner:** Auth feature
- **Future Phase:** Next planned a11y hardening phase (input labels first), then layout adoption.
- **Reference:** `GOLDEN_REFERENCE_DESIGN_SYSTEM.md` §1.4; `accessibility-compliance.md` F-A-3.

## E18 — `CTACard` in `AntigravityResults` uses a raw `<button>` and is unexported

- **Reason:** `AntigravityResults.tsx:46` `CTACard` is a whole-card `<button>`, not the certified surface, and is not re-exported from the barrel (0 consumers — see D-register). Kept as-is pending removal decision.
- **Severity:** Low
- **Owner:** Foundation (Design System — AntigravityResults)
- **Future Phase:** Next consolidation phase — remove `CTACard` (dead) or migrate to `Card`+`Button`.
- **Reference:** `src/components/common/AntigravityResults.tsx:46`; `dead-register.md` context.

## E19 — File-local `topicUpsertSchema` outside `src/validations/`

- **Reason:** `src/lib/repositories/exam.repository.ts:270-276` defines an inline zod schema (topic-en integrity, otherwise unvalidated). Contradicts the schema-inventory "must not exist" rule; does not duplicate a shared rule. Registered as a deviation pending consolidation (duplicate/exception register gap closed by this entry).
- **Severity:** Medium
- **Owner:** Exam feature (repository layer)
- **Future Phase:** Next validation consolidation phase — move into `src/validations/` and re-point `validateOrThrow`.
- **Reference:** `src/lib/repositories/exam.repository.ts:270-285`; `validation-compliance.md` F-V-1.
