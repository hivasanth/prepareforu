# AR-022 — Live Verification Runbook (closes the BLOCKED/UNVERIFIED gates)

You run this with **your own Supabase credentials**. Do NOT paste secrets into the
repo, this file, or the chat — use the CLI which stores your token outside the
repo, or paste into the dashboard SQL editor directly.

## Step 0 — Choose an environment (IMPORTANT)

The live project is `xbjhlfwqmcyatblsrhxn` (production). **Recommendation: run this
against a staging/duplicate project first** to validate the migration + tests, then
re-run the migration push on production with a normal deploy approval.

---

## Step 1 — Link & auth the CLI

```bash
supabase login                     # opens browser; stores token in ~/.supabase
supabase link --project-ref xbjhlfwqmcyatblsrhxn
#   (or your staging ref). Prompts not needed if you set SUPABASE_ACCESS_TOKEN.
```

## Step 2 — Inspect current migration state (before applying)

Via the dashboard SQL editor (or `supabase db remote commit`) confirm:

```sql
-- Is the hardening RPC's 10-arg definition live?
SELECT proname, pg_get_function_identity_arguments(oid)
FROM pg_proc
WHERE proname = 'create_teacher_exam_atomic';

-- What are its ACLs? (must become: authenticated=X/postgres=X only)
SELECT proname, proacl
FROM pg_proc
WHERE proname = 'create_teacher_exam_atomic';

-- Does teacher_exams.request_key exist? is exam_publish_attempts present?
SELECT column_name FROM information_schema.columns
WHERE table_name='teacher_exams' AND column_name='request_key';

SELECT to_regclass('public.exam_publish_attempts');
```

## Step 3 — Apply the hardening migration

```bash
supabase db push --linked          # applies supabase/migrations/20260828203000_*.sql
```

Re-run the Step 2 queries and confirm:
- `create_teacher_exam_atomic(text,uuid,timestamptz,timestamptz,integer,numeric,numeric,jsonb,text,text)`
  is the **only** signature;
- `proacl` shows `authenticated=X/postgres=X` (no `anon`, no empty-role PUBLIC);
- `request_key` column + `exam_publish_attempts` table exist;
- indexes present: `uq_teacher_exams_request_key`, `uq_teacher_exam_questions_order`.

---

## Step 4 — Provision three test identities

The service calls with the **authenticated user's** `sub_admins.user_id`
mapped to `sub_admins.id` (this is what the `sub_admin_id` param must be), so:

1. **Admin** — role `admin`.
2. **Sub-Admin A** — an auth user whose `sub_admins.user_id = <A's auth uid>`.
3. **Sub-Admin B** — a second sub-admin (isolation target).

Create via dashboard Auth → Add user, then insert the linkage:

```sql
-- Use the auth.users id for each account:
INSERT INTO public.sub_admins (user_id, display_name, email)
VALUES ('<A-auth-uid>', 'Test Sub Admin A', 'a@example.com');
INSERT INTO public.sub_admins (user_id, display_name, email)
VALUES ('<B-auth-uid>', 'Test Sub Admin B', 'b@example.com');
```

---

## Step 5 — Verification tests

### 5a. Anonymous / unauthenticated denial
Use the dashboard "Supabase API" anon key and REST, or the app signed-out. The
create RPC must return an authorization error (never create a row):

```bash
curl -X POST "https://xbjhlfwqmcyatblsrhxn.supabase.co/rest/v1/rpc/create_teacher_exam_atomic" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"p_title":"anon test","p_sub_admin_id":"<A-subadmin-id>","p_duration_minutes":60,"p_marks_per_question":1,"p_negative_mark_value":0,"p_start_time":"2030-01-01T00:00:00Z","p_end_time":"2030-01-01T02:00:00Z","p_questions":[]}'
```
Expected: `error` (UNAUTHORIZED or no permission). No row created.

### 5b. Authorized publish (Sub-Admin A signed in) — bilingual + round-trip
Signed in as A, call with a real question set (snake_case keys), including Telugu
fields and a `request_key`:

```sql
SELECT public.create_teacher_exam_atomic(
  'APPSC Live Test – <uuid>',        -- p_title (≥5 chars, unique)
  '<A-subadmin-id>',                 -- p_sub_admin_id = sub_admins.id
  now() + interval '1 hour', now() + interval '3 hours',
  120, 1.5, 0.25,                    -- duration, marks, negative
  '[{
     "question_text_en":"Capital of AP?","question_text_te":"రాజధాని?",
     "option_a_en":"Vijayawada","option_b_en":"Amaravati",
     "option_c_en":"Kurnool","option_d_en":"Nellore",
     "option_a_te":"విజయవాడ",
     "correct_option":"B","explanation_en":"Amaravati.","explanation_te":"అమరావతి.",
     "display_order":1,"difficulty":"medium"
   }]'::jsonb,
  'text', '<request-key-uuid>'
);
```
Assert: returns a `uuid`; `teacher_exams` row has `source_type='text'` and
`request_key=<key>`; `teacher_exam_questions` row preserves
`question_text_te='రాజధాని?'` and `option_a_te='విజయవాడ'`.

### 5c. Idempotent replay (same key → same exam)
Re-run 5b verbatim. Assert: returns the **same** `uuid`; still exactly **one**
row for that `request_key`.

### 5d. Sub-Admin B isolation (negative)
Signed in as **B**, attempt to publish with `p_sub_admin_id = <A-subadmin-id>`.
Expected: `UNAUTHORIZED` (B is not the owner of A's sub_admin row). B may
publish using B's own `sub_admin_id`.

### 5e. Rate limit
As A, publish 10+ times (distinct `request_key`s) within 10 minutes. The 11th
must return `RATE_LIMIT_EXCEEDED`.

### 5f. Validation parity (server mirrors client)
Attempt each and assert `VALIDATION_ERROR` (no row): marks = 100; title = "abc";
`end_time <= start_time`; window > 30 days; duplicate `display_order`; question
missing a required option; both `question_text_en` and `questionTextEn` supplied
with **different** values (dual-key conflict).

---

## Step 6 — Cleanup (staging/dev only)

```sql
-- remove test rows
DELETE FROM public.teacher_exam_questions WHERE teacher_exam_id IN (
  SELECT id FROM public.teacher_exams WHERE title LIKE 'APPSC Live Test – %');
DELETE FROM public.teacher_exams WHERE title LIKE 'APPSC Live Test – %';
DELETE FROM public.exam_publish_attempts;
DELETE FROM public.sub_admins WHERE display_name LIKE 'Test Sub Admin %';
```

---

## Recording results back into AR-022

After Step 3 + Step 5 pass on staging/prod, update
`AR022_REMEDIATION_REPORT.md`:
- Migration applied-state → **PASS**.
- 5a–5f test rows → **PASS** for each.
- Then the overall verdict becomes full **PUBLISH-READY** with no BLOCKED items.
