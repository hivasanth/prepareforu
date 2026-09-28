-- ============================================================================
-- P0-01  Server-authoritative attempt snapshots
--
-- Proves a client can no longer choose which questions it is graded against:
-- the old forge RPC is gone, the internal writer is not client-callable, direct
-- UPDATE on attempts is revoked, and review answers are confined to the set the
-- server actually served. Every expectation here was executed against the live
-- schema in a rolled-back transaction before being written down.
--
--   npx supabase test db                      (local stack, with Docker)
-- ============================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(38);

-- ---------------------------------------------------------------------------
-- fixtures
--
-- public.users.id is FK'd to auth.users, and a handle_new_user trigger may have
-- already created the profile row, so seed auth first and keep the profile
-- insert idempotent. questions.topic_en is trigger-validated against
-- exam_topics, and attempts.exam_id is FK'd to public.exams.
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values ('11111111-1111-1111-1111-111111111111', 'pgtap-alice@example.invalid',
        '{"full_name":"PGTAP Alice"}'::jsonb),
       ('22222222-2222-2222-2222-222222222222', 'pgtap-bob@example.invalid',
        '{"full_name":"PGTAP Bob"}'::jsonb);

insert into public.users (id, email, full_name, role, exam_selection)
values ('11111111-1111-1111-1111-111111111111', 'pgtap-alice@example.invalid',
        'PGTAP Alice', 'user', 'PGTAP_EXAM'),
       ('22222222-2222-2222-2222-222222222222', 'pgtap-bob@example.invalid',
        'PGTAP Bob', 'user', 'PGTAP_EXAM')
on conflict (id) do nothing;

update public.users set exam_selection = 'PGTAP_EXAM'
 where id in ('11111111-1111-1111-1111-111111111111',
              '22222222-2222-2222-2222-222222222222');

insert into public.exams (exam_id) values ('PGTAP_EXAM')
on conflict (exam_id) do nothing;

insert into public.exam_configs (id, exam_id, name, exam_selection, total_marks,
                                total_questions, duration_minutes, created_by)
values ('88888888-8888-8888-8888-888888888888', 'PGTAP_EXAM', 'PGTAP Exam',
        'PGTAP_EXAM', 11, 8, 30, '11111111-1111-1111-1111-111111111111');

insert into public.exam_papers (id, exam_id, paper_name, stage, total_questions,
                                total_marks, duration_minutes)
values ('33333333-3333-3333-3333-333333333333', 'PGTAP_EXAM', 'PGTAP Paper',
        'PRELIMS', 8, 11, 30);

insert into public.exam_subjects (id, exam_id, paper_id, subject_name,
                                  question_count, marks_per_question)
values ('44444444-4444-4444-4444-444444444444', 'PGTAP_EXAM',
        '33333333-3333-3333-3333-333333333333', 'PGTAP_SUBJ_A', 5, 1),
       ('55555555-5555-5555-5555-555555555555', 'PGTAP_EXAM',
        '33333333-3333-3333-3333-333333333333', 'PGTAP_SUBJ_B', 3, 2);

insert into public.exam_topics (id, exam_id, paper_id, subject_name, topic_en)
values ('99999999-9999-9999-9999-999999999999', 'PGTAP_EXAM',
        '33333333-3333-3333-3333-333333333333', 'PGTAP_SUBJ_A', 'PGTAP_TOPIC');

-- 5 questions in SUBJ_A (marks 1), 3 in SUBJ_B (marks 2) => paper total 11
insert into public.questions (id, exam_id, paper_id, subject_name, correct_option,
                              created_by, content_hash, question_text_en,
                              explanation_en)
select ('60000000-0000-0000-0000-00000000000' || i)::uuid,
       'PGTAP_EXAM', '33333333-3333-3333-3333-333333333333', 'PGTAP_SUBJ_A', 'A',
       '11111111-1111-1111-1111-111111111111',
       'pgtap-a-' || i, 'Q' || i, 'why ' || i
  from generate_series(1,5) i;

update public.questions set topic_en = 'PGTAP_TOPIC'
 where id = '60000000-0000-0000-0000-000000000001';

insert into public.questions (id, exam_id, paper_id, subject_name, correct_option,
                              created_by, content_hash, question_text_en,
                              explanation_en)
select ('70000000-0000-0000-0000-00000000000' || i)::uuid,
       'PGTAP_EXAM', '33333333-3333-3333-3333-333333333333', 'PGTAP_SUBJ_B', 'B',
       '11111111-1111-1111-1111-111111111111',
       'pgtap-b-' || i, 'QB' || i, 'whyb ' || i
  from generate_series(1,3) i;

-- ---------------------------------------------------------------------------
-- 1-5  the client can no longer author or rewrite a snapshot
-- ---------------------------------------------------------------------------
select hasnt_function('public', 'set_attempt_snapshot',
  array['uuid','jsonb'], 'client-settable snapshot writer is gone');

select hasnt_function('public', 'create_attempt',
  array['text','uuid','uuid','public.attempt_source'],
  'legacy 4-argument create_attempt is gone');

select ok(not has_function_privilege('authenticated',
    'public._pf_write_attempt_snapshot(uuid,uuid,integer)', 'EXECUTE'),
    'snapshot writer is not client callable');

select ok(not has_function_privilege('authenticated',
    'public._pf_attempt_question_set(uuid,uuid,integer)', 'EXECUTE'),
    'question selector is not client callable');

select ok(not has_table_privilege('authenticated','public.attempts','UPDATE'),
    'authenticated has no UPDATE grant on attempts');

-- ---------------------------------------------------------------------------
-- 6  the retired RPC is unreachable
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select dies_ok($$ select public.set_attempt_snapshot(
    gen_random_uuid(), '[]'::jsonb) $$,
    'set_attempt_snapshot raises instead of forging a set');

-- ---------------------------------------------------------------------------
-- 7-12  exam_tab: the served set has no answers and stays inside the paper
-- ---------------------------------------------------------------------------
select lives_ok($$ select public.create_attempt('PGTAP_EXAM',
    '33333333-3333-3333-3333-333333333333', null,
    'exam_tab'::public.attempt_source) $$,
    'exam_tab attempt starts');

-- create_attempt resumes rather than duplicating, so this yields the same id
select set_config('pf.a1', public.create_attempt('PGTAP_EXAM',
    '33333333-3333-3333-3333-333333333333', null,
    'exam_tab'::public.attempt_source)->>'attempt_id', true);

select is((select jsonb_array_length(questions_snapshot)::text
             from public.attempts where id = current_setting('pf.a1')::uuid),
    '8', 'the whole paper is served');

select is((select count(*)::text from public.attempts a,
             jsonb_array_elements(a.questions_snapshot) e
           where a.id = current_setting('pf.a1')::uuid
             and e ? 'correct_option'),
    '0', 'the snapshot carries no answer key');

select is((select count(*)::text from public.attempts a,
             jsonb_array_elements(a.questions_snapshot) e
           where a.id = current_setting('pf.a1')::uuid
             and e ? 'explanation_en'),
    '0', 'the snapshot carries no explanations');

select is((select count(*)::text from public.attempts a,
             jsonb_array_elements(a.questions_snapshot) e
           where a.id = current_setting('pf.a1')::uuid
             and not exists (select 1 from public.questions q
                             where q.id = (e->>'id')::uuid
                               and q.paper_id = '33333333-3333-3333-3333-333333333333'
                               and q.is_active)),
    '0', 'every served id is an active question of that paper');

select is((select total_marks::text from public.attempts
           where id = current_setting('pf.a1')::uuid),
    '11', 'marks come from the blueprint, not the client');

-- ---------------------------------------------------------------------------
-- 13-16  resume is idempotent and cannot mutate the set
-- ---------------------------------------------------------------------------
select set_config('pf.snap_before',
  (select questions_snapshot::text from public.attempts
    where id = current_setting('pf.a1')::uuid), true);

select lives_ok($$ select public.create_attempt('PGTAP_EXAM',
    '33333333-3333-3333-3333-333333333333', null,
    'exam_tab'::public.attempt_source) $$,
    'resuming an exam_tab attempt succeeds');

select set_config('pf.a2', public.create_attempt('PGTAP_EXAM',
    '33333333-3333-3333-3333-333333333333', null,
    'exam_tab'::public.attempt_source)->>'attempt_id', true);

select is(current_setting('pf.a2'), current_setting('pf.a1'),
    'resume returns the original attempt id');

select is((select questions_snapshot::text from public.attempts
           where id = current_setting('pf.a1')::uuid),
    current_setting('pf.snap_before'),
    'the snapshot is unchanged by resuming');

select dies_ok($$ update public.attempts
                  set questions_snapshot = '[]'::jsonb
                where user_id = auth.uid() $$,
    'a direct snapshot UPDATE is rejected');

-- ---------------------------------------------------------------------------
-- 17-19  subject_test samples server-side
-- ---------------------------------------------------------------------------
reset role;
update public.attempts set abandoned = true
 where user_id = '11111111-1111-1111-1111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select lives_ok($$ select public.create_attempt('PGTAP_EXAM', null, null,
    'subject_test'::public.attempt_source, 'PGTAP_SUBJ_A', null, 2) $$,
    'subject_test attempt starts');

select set_config('pf.s1', public.create_attempt('PGTAP_EXAM', null, null,
    'subject_test'::public.attempt_source, 'PGTAP_SUBJ_A', null, 2
    )->>'attempt_id', true);

select is((select jsonb_array_length(questions_snapshot)::text
             from public.attempts where id = current_setting('pf.s1')::uuid),
    '2', 'the requested sample size is honoured');

select is((select count(*)::text from public.attempts a,
             jsonb_array_elements(a.questions_snapshot) e
           where a.id = current_setting('pf.s1')::uuid
             and e->>'subject_name' is distinct from 'PGTAP_SUBJ_A'),
    '0', 'sampled questions come from the requested subject');

-- ---------------------------------------------------------------------------
-- 20-21  the server refuses malformed source selections
-- ---------------------------------------------------------------------------
reset role;
update public.attempts set abandoned = true
 where user_id = '11111111-1111-1111-1111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select dies_ok($$ select public.create_attempt('PGTAP_EXAM', null, null,
    'topic_exam'::public.attempt_source, 'PGTAP_SUBJ_A', null) $$,
    'topic_exam without a topic is rejected');

select dies_ok($$ select public.create_attempt('PGTAP_EXAM', null, null,
    'subject_test'::public.attempt_source, 'PGTAP_SUBJ_MISSING', null) $$,
    'an unknown subject is rejected');

-- ---------------------------------------------------------------------------
-- 22-23  review is owner-scoped and only after submission
-- ---------------------------------------------------------------------------
reset role;
update public.attempts set abandoned = true
 where user_id = '11111111-1111-1111-1111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select set_config('pf.b1', public.create_attempt('PGTAP_EXAM',
    '33333333-3333-3333-3333-333333333333', null,
    'exam_tab'::public.attempt_source)->>'attempt_id', true);

reset role;
update public.attempts set status = 'completed'
 where id = current_setting('pf.b1')::uuid;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select dies_ok($$ select public.get_content_review_questions(
    current_setting('pf.b1')::uuid) $$,
    'another user''s completed attempt cannot be reviewed');

select dies_ok($$ select public.get_content_review_questions(
    current_setting('pf.a1')::uuid) $$,
    'review is refused before the attempt is submitted');

-- ---------------------------------------------------------------------------
-- 24-25  after submission, answers are released for the served set only
-- ---------------------------------------------------------------------------
reset role;
update public.attempts set status = 'completed'
 where id = current_setting('pf.a1')::uuid;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select count(*)::text from jsonb_array_elements(
             public.get_content_review_questions(
               current_setting('pf.a1')::uuid)) r
           where r ? 'correct_option'),
    '8', 'review returns an answer for every served question');

select is((select count(*)::text from jsonb_array_elements(
             public.get_content_review_questions(
               current_setting('pf.a1')::uuid)) r
           where not exists (select 1 from public.attempts a,
                               jsonb_array_elements(a.questions_snapshot) s
                             where a.id = current_setting('pf.a1')::uuid
                               and s->>'id' = r->>'id')),
    '0', 'review never reaches beyond the recorded snapshot');

-- ---------------------------------------------------------------------------
-- P0-01b  answers and grading are scoped to the served set
--
-- P0-01 made the snapshot server-authored but left the ANSWER path open: a
-- question was validated against the whole exam/paper rather than the attempt's
-- own snapshot, so a 2-question test could be answered on 6 unserved questions
-- and returned score 9.00 against total_marks 2.00. These assertions pin the
-- fix: membership is decided only by the served set.
-- ---------------------------------------------------------------------------
select ok(not has_function_privilege('authenticated',
    'public._pf_attempt_serves_question(uuid,uuid)', 'EXECUTE'),
    'served-question predicate is not client callable');

reset role;
update public.attempts set abandoned = true
 where user_id = '11111111-1111-1111-1111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

-- 2 served out of 5 in the subject, so there are unserved questions to attack
select set_config('pf.s2', public.create_attempt('PGTAP_EXAM', null, null,
    'subject_test'::public.attempt_source, 'PGTAP_SUBJ_A', null, 2
    )->>'attempt_id', true);

select set_config('pf.unserved_a', (
  select q.id::text from public.questions q
   where q.exam_id = 'PGTAP_EXAM' and q.subject_name = 'PGTAP_SUBJ_A'
     and not exists (select 1 from public.attempts a,
                       jsonb_array_elements(a.questions_snapshot) e
                      where a.id = current_setting('pf.s2')::uuid
                        and (e->>'id')::uuid = q.id)
   order by q.id limit 1), true);

select set_config('pf.unserved_b', (
  select q.id::text from public.questions q
   where q.exam_id = 'PGTAP_EXAM' and q.subject_name = 'PGTAP_SUBJ_B'
   order by q.id limit 1), true);

select dies_ok(format($$ select public.set_question_answer(
    %L::uuid, %L::uuid, 'A') $$, current_setting('pf.s2'),
    current_setting('pf.unserved_a')),
    'an unserved question from the same subject cannot be answered');

select dies_ok(format($$ select public.set_question_answer(
    %L::uuid, %L::uuid, 'A') $$, current_setting('pf.s2'),
    current_setting('pf.unserved_b')),
    'a question from another subject cannot be answered');

select dies_ok(format($$ select public.touch_question_visit(%L::uuid, %L::uuid) $$,
    current_setting('pf.s2'), current_setting('pf.unserved_b')),
    'an unserved question cannot be marked visited');

select dies_ok(format($$ select public.add_question_time(%L::uuid, %L::uuid, 5) $$,
    current_setting('pf.s2'), current_setting('pf.unserved_b')),
    'time cannot be accrued against an unserved question');

select dies_ok(format($$ select public.set_question_review(%L::uuid, %L::uuid, true) $$,
    current_setting('pf.s2'), current_setting('pf.unserved_b')),
    'an unserved question cannot be marked for review');

select is((select count(*)::text from public.attempt_answers
            where attempt_id = current_setting('pf.s2')::uuid),
    '0', 'no attempt_answers row exists for any unserved question');

-- the resume cache silently drops keys that were never served
select lives_ok(format($$ select public.update_attempt_answers_cache(%L::uuid,
    jsonb_build_object(%L::uuid::text, 'A', %L::uuid::text, 'A') $$,
    current_setting('pf.s2'), current_setting('pf.unserved_a'),
    current_setting('pf.unserved_b')),
    'answers cache accepts a payload that also contains unserved keys');

select is((select count(*)::text from jsonb_object_keys(
            (select answers_json from public.attempts
              where id = current_setting('pf.s2')::uuid))),
    '0', 'the resume cache stores no unserved keys');

-- a served answer is accepted, graded, and the score stays within the total
select lives_ok(format($$ select public.set_question_answer(%L::uuid, %L::uuid, 'A') $$,
    current_setting('pf.s2'),
    (select (e->>'id')::text from public.attempts a,
            jsonb_array_elements(a.questions_snapshot) e
      where a.id = current_setting('pf.s2')::uuid limit 1)),
    'a served question can still be answered');

select is((select public.submit_attempt(current_setting('pf.s2')::uuid)
             ->> 'correct_count'),
    '1', 'only the served answer is graded');

select ok((select (public.submit_attempt(current_setting('pf.s2')::uuid)->>'score')::numeric
             <= (select total_marks::numeric from public.attempts
                  where id = current_setting('pf.s2')::uuid)),
    'the score can never exceed the marks available in the served set');

select dies_ok(format($$ select public.update_attempt_answers_cache(
    %L::uuid, '{}'::jsonb) $$, current_setting('pf.s2')),
    'the resume cache is frozen once the attempt is submitted');

reset role;

select * from finish();
rollback;
