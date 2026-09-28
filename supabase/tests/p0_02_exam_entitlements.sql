-- =============================================================================
-- P0-02  Server-owned exam entitlements
--
-- Threat model under test: before P0-02 an account holder could grant themselves
-- access to an entire exam category by writing users.exam_selection, because
-- public.is_exam_allowed_for_user() read that user-writable column and the
-- column carried an authenticated UPDATE grant. Signup metadata could set the
-- same value.
--
-- These assertions pin the replacement: authorization is decided by
-- public.user_exam_entitlements, exam_selection is a validated preference that
-- grants nothing, and the entitlement table is unreachable from the client.
--
-- Run with: supabase test db  (requires Docker)
-- =============================================================================
begin;

select plan(46);

-- ─── fixtures ────────────────────────────────────────────────────────────────
-- public.users.id references auth.users, so auth is seeded first. Inserting into
-- auth.users fires handle_new_user(), which creates the public.users profile from
-- the signup metadata. The profiles must therefore NOT be re-inserted afterwards:
-- the original suite did, and its ON CONFLICT DO NOTHING silently turned every
-- insert into a no-op, leaving all four fixtures with role='user' and
-- exam_selection=NULL. Nine downstream assertions were then measuring a fixture
-- that did not exist, and the suite could only report "admin privileges required".
--
-- handle_new_user() honours full_name and exam_selection from metadata but
-- hardcodes role='user' on purpose (see the SECURITY HARDENING note in that
-- function). So the two preferences under test are seeded exactly the way a real
-- signup seeds them: through metadata, not through a privileged write.
insert into auth.users (id, email, raw_user_meta_data)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'p002-groups@pgtap.test',
     '{"full_name":"P002 Groups","exam_selection":"APPSC_GROUPS"}'::jsonb),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'p002-none@pgtap.test',
     '{"full_name":"P002 None"}'::jsonb),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'p002-admin@pgtap.test',
     '{"full_name":"P002 Admin"}'::jsonb),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'p002-bank@pgtap.test',
     '{"full_name":"P002 Bank","exam_selection":"BANK_EXAMS"}'::jsonb)
on conflict (id) do nothing;

-- The admin fixture is provisioned the way the server provisions an admin: the
-- role is set at INSERT time by the table owner. The original suite tried
-- UPDATE public.users SET role='admin', which prevent_user_role_escalation()
-- silently reverts for any caller that is not already an admin, so the row stayed
-- role='user' and every admin_grant_*/admin_revoke_* assertion failed.
--
-- Nothing is weakened or disabled to get here. The guard is a BEFORE UPDATE
-- trigger; an owner-level INSERT is a different statement, and the guard remains
-- fully armed for every client path -- the suite still proves that in the
-- privilege section and again at the admin-writes-another-account assertion.
delete from public.users where id = 'aaaaaaaa-0000-0000-0000-000000000003';

insert into public.users (id, email, full_name, role, exam_selection)
values ('aaaaaaaa-0000-0000-0000-000000000003', 'p002-admin@pgtap.test',
        'P002 Admin', 'admin', null);

-- APPSC_GROUP_1 is the only exam that actually has question rows, so it is the
-- only one on which an RLS assertion is meaningful rather than vacuously true.

-- ─── fixture sanity ──────────────────────────────────────────────────────────
-- The two defects above were both silent: the suite ran, and reported failures
-- that pointed at the migration instead of at the fixture. These five assertions
-- fail loudly at the top if a future edit reintroduces either defect.
select is((select count(*) from public.users
            where id in ('aaaaaaaa-0000-0000-0000-000000000001',
                         'aaaaaaaa-0000-0000-0000-000000000002',
                         'aaaaaaaa-0000-0000-0000-000000000003',
                         'aaaaaaaa-0000-0000-0000-000000000004'))::bigint,
  4::bigint,
  'handle_new_user() created all four profile rows');

select is((select role::text from public.users
            where id = 'aaaaaaaa-0000-0000-0000-000000000003'),
  'admin'::text,
  'the admin fixture really is an admin');

select is((select exam_selection from public.users
            where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'APPSC_GROUPS'::text,
  'the group fixture carries a seeded preference');

select is((select exam_selection from public.users
            where id = 'aaaaaaaa-0000-0000-0000-000000000004'),
  'BANK_EXAMS'::text,
  'the bank fixture carries a seeded preference');

select is((select exam_selection from public.users
            where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  null::text,
  'the unentitled fixture has no preference at all');

-- ─── 6-9  the privilege hole is closed ───────────────────────────────────────
select ok(
  not has_column_privilege('authenticated', 'public.users', 'exam_selection', 'UPDATE'),
  'exam_selection is no longer writable by the account holder');

select ok(
  has_column_privilege('authenticated', 'public.users', 'full_name', 'UPDATE'),
  'full_name is still self-writable');

select ok(
  has_column_privilege('authenticated', 'public.users', 'last_activity_date', 'UPDATE'),
  'last_activity_date is still self-writable');

select ok(
  not has_function_privilege('authenticated',
    'public._pf_entitled_exam(uuid, text)', 'EXECUTE'),
  'the resolver cannot be called directly by a client');

-- ─── 10-13  the entitlement table is server-owned ────────────────────────────
select ok(
  not has_table_privilege('authenticated', 'public.user_exam_entitlements', 'SELECT'),
  'a client cannot read the entitlement table');

select ok(
  not has_table_privilege('authenticated', 'public.user_exam_entitlements', 'INSERT'),
  'a client cannot insert its own grant');

select ok(
  not has_table_privilege('authenticated', 'public.user_exam_entitlements', 'UPDATE'),
  'a client cannot widen or rewrite a grant');

select ok(
  (select relrowsecurity from pg_class
    where oid = 'public.user_exam_entitlements'::regclass),
  'row level security is enabled on the entitlement table');

-- ─── 14-16  the backfill preserved existing access ───────────────────────────
-- Every account that held a usable exam_selection before the migration must now
-- hold a matching entitlement, or the migration silently locked real users out.
-- These two assert the *content* of the backfill. The original version compared
-- one count against itself filtered by scope, which is satisfied by any row whose
-- scope is bogus and by no rows at all, so it could not fail.
select is(
  (select count(*) from public.user_exam_entitlements
    where scope not in ('exam', 'group')),
  0::bigint,
  'no grant carries a scope outside the known vocabulary');

select ok(
  not exists (select 1 from public.user_exam_entitlements
               where source = 'migration'
                 and metadata->>'migrated_from' is null),
  'every migrated grant records the user column it was translated from');

select is(
  (select count(*) from public.user_exam_entitlements where exam_id = 'all'),
  0::bigint,
  'the literal ''all'' never became a grant, matching the old NOT IN list');

select is(
  (select count(*)
     from public.user_exam_entitlements e
     join public.users u on u.id = e.user_id
    where u.exam_selection is null),
  0::bigint,
  'no account with a NULL selection was granted anything');

-- ─── 17-23  a preference grants nothing ──────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated"}', true);

select ok(
  not public.is_exam_allowed_for_user('APPSC_GROUP_1'),
  'a NULL-selection account is denied APPSC_GROUP_1');

select ok(
  not public.is_exam_allowed_for_user('BANK_EXAMS'),
  'a NULL-selection account is denied BANK_EXAMS');

select is(
  (select count(*) from public.get_my_entitlements())::bigint, 0::bigint,
  'an unentitled account has an empty entitlement list');

-- THE EXPLOIT. Each of these is a way the old model could be abused.
select dies_ok(
  $$ update public.users set exam_selection = 'APPSC_GROUPS'
      where id = 'aaaaaaaa-0000-0000-0000-000000000002' $$,
  'EXPLOIT: writing exam_selection directly is refused');

select dies_ok(
  $$ select public.set_preferred_exam('APPSC_GROUP_1') $$,
  'EXPLOIT: the preference validator refuses an unentitled exam');

select dies_ok(
  $$ insert into public.user_exam_entitlements (user_id, exam_id, scope)
     values (auth.uid(), 'APPSC_GROUPS', 'group') $$,
  'EXPLOIT: a direct entitlement insert is refused');

-- and the account must still be locked out afterwards
select ok(
  not public.is_exam_allowed_for_user('APPSC_GROUP_1'),
  'the account is still denied after every exploit attempt');

-- ─── 24-28  a stated preference never implies access ─────────────────────────
-- Still before any grant exists, and from an account whose exam_selection is
-- 'APPSC_GROUPS'. Under the old model this was the whole vulnerability: the value
-- was the grant. Under the new model it is inert.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- granted by the admin below; assert after that grant lands
select ok(
  not public.is_exam_allowed_for_user('APPSC_GROUP_1'),
  'before the grant the group-preference account is still denied');

select ok(
  not public.is_exam_allowed_for_user('BANK_EXAMS'),
  'a group preference never implies bank exams');

select is(
  (select count(*) from public.get_my_entitlements())::bigint, 0::bigint,
  'an ungranted account sees an empty entitlement list');

select is(
  (select count(*) from public.questions where exam_id = 'APPSC_GROUP_1')::bigint,
  0::bigint,
  'RLS hides the populated exam from an ungranted account');

select ok(
  not public.is_exam_allowed_for_user('APPSC_GROUP_1'),
  'a stated preference alone is never sufficient');

-- ─── 29-35  admin authority over grants ──────────────────────────────────────
-- The grants created here are what section 36-41 asserts against.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}', true);

select dies_ok(
  $$ update public.users set exam_selection = 'BANK_EXAMS'
      where id = 'aaaaaaaa-0000-0000-0000-000000000002' $$,
  'even an admin cannot write another account''s preference directly');

select lives_ok(
  $$ select public.admin_grant_exam_entitlement(
       'aaaaaaaa-0000-0000-0000-000000000002', 'APPSC_GROUP_1', 'exam') $$,
  'an admin can grant an exam');

select lives_ok(
  $$ select public.admin_grant_exam_entitlement(
       'aaaaaaaa-0000-0000-0000-000000000001', 'APPSC_GROUPS', 'group') $$,
  'an admin can grant a group');

select dies_ok(
  $$ select public.admin_grant_exam_entitlement(
       'aaaaaaaa-0000-0000-0000-000000000002', 'NOT_A_REAL_EXAM', 'exam') $$,
  'an unknown exam cannot be granted');

select dies_ok(
  $$ select public.admin_grant_exam_entitlement(
       'aaaaaaaa-0000-0000-0000-000000000002', 'APPSC_GROUPS', 'exam') $$,
  'a category name cannot be granted as if it were an exam');

select dies_ok(
  $$ select public.admin_grant_exam_entitlement(
       'aaaaaaaa-0000-0000-0000-000000000002', 'APPSC_GROUP_2', 'exam',
       now(), now() - interval '1 day') $$,
  'a backwards validity window is refused');

-- role is not entitlement
select ok(
  not public.is_exam_allowed_for_user('APPSC_GROUP_1'),
  'being an admin does not itself unlock any exam');

-- ─── 36-41  the grant is effective for the grantee ───────────────────────────
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);

select ok(
  public.is_exam_allowed_for_user('APPSC_GROUP_1'),
  'a group grant unlocks a member exam');

select ok(
  public.is_exam_allowed_for_user('APPSC_GROUP_4'),
  'a group grant unlocks every member exam');

select is(
  (select count(*) from public.get_my_entitlements() where exam_id like 'APPSC_GROUP%')::bigint,
  4::bigint,
  'the entitled account lists all four APPSC groups');

select ok(
  (select count(*) > 0 from public.questions where exam_id = 'APPSC_GROUP_1'),
  'RLS now serves the previously hidden questions');

select lives_ok(
  $$ select public.set_preferred_exam('APPSC_GROUP_2') $$,
  'an entitled account may store a preference');

select is(
  (select exam_selection from public.users
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'APPSC_GROUP_2'::text,
  'the preference was persisted');

-- ─── 42-46  revocation closes it again ───────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}', true);

select lives_ok(
  $$ select public.admin_revoke_exam_entitlement(
       'aaaaaaaa-0000-0000-0000-000000000001', 'APPSC_GROUPS', 'group') $$,
  'an admin can revoke a group grant');

select dies_ok(
  $$ select public.admin_revoke_exam_entitlement(
       'aaaaaaaa-0000-0000-0000-000000000001', 'APPSC_GROUPS', 'group') $$,
  'revoking the same grant twice is refused');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);

select ok(
  not public.is_exam_allowed_for_user('APPSC_GROUP_1'),
  'the revoked grant no longer confers access');

select is(
  (select count(*) from public.questions where exam_id = 'APPSC_GROUP_1')::bigint,
  0::bigint,
  'RLS closes again for the revoked account');

reset role;

select * from finish();
rollback;
