-- =============================================================================
-- P0-03  Subscription and entitlement foundation
--
-- Threat model under test: the Android client and the future website share one
-- Supabase Auth account and reach the database through the anon key. Every
-- assertion below is an attempt to make the database believe a payment
-- happened, or to make access survive one that did not.
--
-- The model under test:
--   plans -> subscriptions -> payment_events -> user_exam_entitlements
-- where the last one is P0-02's existing table and stays the single access
-- authority. A payment advances subscription state; the trigger derives the
-- entitlement. A client can do neither.
--
-- Everything runs inside one transaction that is rolled back, so the suite
-- leaves no fixtures behind on the database it runs against.
--
-- Run with: supabase test db  (requires Docker)
--
-- Negative assertions use throws_ok(sql, NULL, NULL, description) rather than
-- the dies_ok() used in p0_02. dies_ok does not exist in pgtap 1.3.3, the
-- version available on the linked project; throws_ok is the original pgTAP name
-- and is present in every version. The four-argument form asserts only that the
-- statement fails, and deliberately does NOT pin the SQLSTATE: several refusals
-- here are RLS denials and several are CHECK constraints, and the test is about
-- "the database refused", not about which mechanism it used.
-- =============================================================================
begin;

select plan(122);

-- ─── fixtures ────────────────────────────────────────────────────────────────
-- public.users.id references auth.users, so auth is seeded first; the profile
-- rows are created by handle_new_user() and must not be re-inserted, exactly as
-- in p0_02. The admin fixture is provisioned the way the server provisions an
-- admin: role set at INSERT time by the owner, because
-- prevent_user_role_escalation() reverts an UPDATE from a non-admin.
insert into auth.users (id, email, raw_user_meta_data)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'p003-subscriber@pgtap.test',
     '{"full_name":"P003 Subscriber"}'::jsonb),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'p003-bystander@pgtap.test',
     '{"full_name":"P003 Bystander"}'::jsonb),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'p003-admin@pgtap.test',
     '{"full_name":"P003 Admin"}'::jsonb),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'p003-grantee@pgtap.test',
     '{"full_name":"P003 Grantee"}'::jsonb)
on conflict (id) do nothing;

delete from public.users where id = 'bbbbbbbb-0000-0000-0000-000000000003';
insert into public.users (id, email, full_name, role)
values ('bbbbbbbb-0000-0000-0000-000000000003', 'p003-admin@pgtap.test',
        'P003 Admin', 'admin');

-- Two plans, so the plan-change path has something to change to. The
-- subscription model deliberately seeds no plans; these are test fixtures.
insert into public.subscription_plans (code, name, amount_minor, currency, interval_unit, interval_count)
values ('pgtap_bank',  'PGTAP Bank Plan',  100000, 'INR', 'month', 1),
       ('pgtap_appsc', 'PGTAP APPSC Plan', 200000, 'INR', 'year',  1);

insert into public.plan_entitlements (plan_id, exam_id, scope)
select p.id, v.exam_id, v.scope
  from public.subscription_plans p
  join (values ('BANK_EXAMS', 'exam'), ('APPSC_GROUPS', 'group')) as v(exam_id, scope)
       on p.code = 'pgtap_bank'
union all
select p.id, 'APPSC_GROUPS', 'group'
  from public.subscription_plans p
 where p.code = 'pgtap_appsc';

-- ─── 1-4  fixture sanity ────────────────────────────────────────────────────
-- Both of these failure modes are silent: the suite runs, and reports failures
-- that point at the migration instead of at the fixture.
select is((select count(*) from public.users
            where id in ('bbbbbbbb-0000-0000-0000-000000000001',
                         'bbbbbbbb-0000-0000-0000-000000000002',
                         'bbbbbbbb-0000-0000-0000-000000000003',
                         'bbbbbbbb-0000-0000-0000-000000000004'))::bigint,
  4::bigint,
  'handle_new_user() created all four profile rows');

select is((select role::text from public.users
            where id = 'bbbbbbbb-0000-0000-0000-000000000003'),
  'admin'::text,
  'the admin fixture really is an admin');

select is((select count(*) from public.subscription_plans
            where code in ('pgtap_bank', 'pgtap_appsc'))::bigint,
  2::bigint,
  'both plan fixtures exist');

select is((select count(*) from public.plan_entitlements
            where plan_id = (select id from public.subscription_plans where code = 'pgtap_bank'))::bigint,
  2::bigint,
  'the bank plan grants both an exam and a group');

-- ─── 5-22  the privilege posture, asserted from the catalog ──────────────────
select ok((select relrowsecurity from pg_class
            where oid = 'public.subscriptions'::regclass),
  'row level security is enabled on subscriptions');

select ok((select relrowsecurity from pg_class
            where oid = 'public.payment_events'::regclass),
  'row level security is enabled on payment_events');

select ok((select relrowsecurity from pg_class
            where oid = 'public.plan_entitlements'::regclass),
  'row level security is enabled on plan_entitlements');

select ok((select relrowsecurity from pg_class
            where oid = 'public.subscription_plans'::regclass),
  'row level security is enabled on subscription_plans');

select ok(not has_table_privilege('authenticated', 'public.subscriptions', 'SELECT'),
  'a client cannot read the subscription table');
select ok(not has_table_privilege('authenticated', 'public.subscriptions', 'INSERT'),
  'a client cannot create a subscription');
select ok(not has_table_privilege('authenticated', 'public.subscriptions', 'UPDATE'),
  'a client cannot extend or rewrite a subscription');
select ok(not has_table_privilege('authenticated', 'public.subscriptions', 'DELETE'),
  'a client cannot delete a subscription');

select ok(not has_table_privilege('authenticated', 'public.payment_events', 'SELECT'),
  'a client cannot read the payment ledger');
select ok(not has_table_privilege('authenticated', 'public.payment_events', 'INSERT'),
  'a client cannot forge a payment event');
select ok(not has_table_privilege('authenticated', 'public.payment_events', 'UPDATE'),
  'a client cannot mark a payment successful');

select ok(not has_table_privilege('authenticated', 'public.user_exam_entitlements', 'SELECT'),
  'a client cannot read the entitlement table');
select ok(not has_table_privilege('authenticated', 'public.user_exam_entitlements', 'INSERT'),
  'a client cannot insert its own grant');
select ok(not has_table_privilege('authenticated', 'public.user_exam_entitlements', 'UPDATE'),
  'a client cannot widen or rewrite a grant');
select ok(not has_table_privilege('authenticated', 'public.user_exam_entitlements', 'DELETE'),
  'a client cannot delete a grant');

select ok(not has_table_privilege('authenticated', 'public.plan_entitlements', 'INSERT'),
  'a client cannot extend a plan with its own grants');
select ok(not has_table_privilege('authenticated', 'public.subscription_plans', 'INSERT'),
  'a client cannot invent a plan');

select ok(not has_function_privilege('authenticated',
    'public.billing_apply_payment_event(text, text, text, text, uuid, text, timestamptz, timestamptz, jsonb)',
    'EXECUTE'),
  'the payment processor is not callable by a client');
select ok(not has_function_privilege('anon',
    'public.get_my_subscription()', 'EXECUTE'),
  'get_my_subscription is not callable before sign-in');
select ok(not has_function_privilege('authenticated',
    'public._pf_billing_resolve_subscription(text, text, uuid)', 'EXECUTE'),
  'the subscription resolver is not callable by a client');
select ok(not has_table_privilege('service_role', 'public.payment_events', 'DELETE'),
  'the payment ledger cannot be deleted, not even by service_role');
select ok(not has_table_privilege('service_role', 'public.subscriptions', 'DELETE'),
  'service_role holds no DELETE on subscriptions: they end, they are not removed');

-- ─── 23-34  an ordinary user cannot reach any of it ──────────────────────────
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}', true);

select throws_ok($$ insert into public.subscriptions
                  (user_id, plan_id, status, current_period_end)
                values (auth.uid(),
                        (select id from public.subscription_plans), 'active', now()) $$, NULL, NULL,
  'EXPLOIT: a user cannot insert a subscription');

select throws_ok($$ update public.subscriptions
                  set current_period_end = now() + interval '10 years' $$, NULL, NULL,
  'EXPLOIT: a user cannot extend a subscription');

select throws_ok($$ update public.subscriptions
                  set status = 'active' $$, NULL, NULL,
  'EXPLOIT: a user cannot activate a subscription');

select throws_ok($$ delete from public.subscriptions $$, NULL, NULL,
  'EXPLOIT: a user cannot delete a subscription');

select throws_ok($$ insert into public.payment_events
                  (provider, provider_event_id, event_type, status)
                values ('forged', 'forged-1', 'subscription.activated', 'processed') $$, NULL, NULL,
  'EXPLOIT: a user cannot create a payment success record');

select throws_ok($$ update public.payment_events set status = 'processed' $$, NULL, NULL,
  'EXPLOIT: a user cannot mark a payment successful');

select throws_ok($$ insert into public.user_exam_entitlements (user_id, exam_id, scope)
                values (auth.uid(), 'BANK_EXAMS', 'exam') $$, NULL, NULL,
  'EXPLOIT: a user cannot grant themselves an entitlement');

select throws_ok($$ update public.user_exam_entitlements
                  set valid_until = now() + interval '10 years' $$, NULL, NULL,
  'EXPLOIT: a user cannot extend an entitlement');

select throws_ok($$ update public.user_exam_entitlements set revoked_at = null $$, NULL, NULL,
  'EXPLOIT: a user cannot un-revoke a grant');

select throws_ok($$ select * from public.subscriptions $$, NULL, NULL,
  'EXPLOIT: a user cannot read the subscription table');

select throws_ok($$ select * from public.payment_events $$, NULL, NULL,
  'EXPLOIT: a user cannot read the payment ledger');

select throws_ok($$ select public.billing_apply_payment_event(
                  'forged', 'forged-2', 'subscription.activated',
                  'forged-sub', auth.uid(), 'pgtap_bank', now(), now() + interval '30 days') $$, NULL, NULL,
  'EXPLOIT: a user cannot call the payment processor');

select throws_ok($$ select public.admin_grant_exam_entitlement(
                  auth.uid(), 'BANK_EXAMS', 'exam') $$, NULL, NULL,
  'EXPLOIT: a non-admin cannot use the admin grant RPC');

-- and nothing above had a side effect.
-- counting the tables needs the owning role: authenticated cannot read them at all.
reset role;

select is((select count(*) from public.subscriptions)::bigint, 0::bigint,
  'no subscription was created by any of the exploits above');
select is((select count(*) from public.payment_events)::bigint, 0::bigint,
  'no payment event was created by any of the exploits above');

-- back to the bystander, to prove the private read RPC stays honest
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}', true);

select is((select count(*) from public.get_my_subscription())::bigint, 0::bigint,
  'the bystander still has no subscription of their own');

-- ─── 35-42  the server processes a valid payment ─────────────────────────────
reset role;

select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_activate_1', 'subscription.activated',
                  'sub_subscriber_1', 'bbbbbbbb-0000-0000-0000-000000000001',
                  'pgtap_bank', now(), now() + interval '30 days') $$,
  'the server can process a valid activation event');

select is((select count(*) from public.payment_events
            where provider = 'pgtap' and provider_event_id = 'evt_activate_1'
              and status = 'processed')::bigint,
  1::bigint,
  'the event is recorded as processed');

select is((select status from public.subscriptions
            where provider = 'pgtap' and provider_subscription_id = 'sub_subscriber_1'),
  'active'::text,
  'the subscription is active');

select is((select count(*) from public.subscriptions)::bigint, 1::bigint,
  'exactly one subscription exists');

select is((select count(*) from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000001'
              and exam_id = 'BANK_EXAMS' and scope = 'exam')::bigint,
  1::bigint,
  'the subscription created the exam entitlement');

select is((select count(*) from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000001'
              and exam_id = 'APPSC_GROUPS' and scope = 'group')::bigint,
  1::bigint,
  'the subscription created the group entitlement');

select is((select source from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000001'
              and exam_id = 'BANK_EXAMS'),
  'subscription'::text,
  'the entitlement records that a subscription produced it');

select is((select count(*) from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000001'
              and metadata->>'subscription_id'
                  = (select id::text from public.subscriptions
                      where provider_subscription_id = 'sub_subscriber_1'))::bigint,
  2::bigint,
  'both entitlements are linked to the subscription that produced them');

select is((select valid_until = current_period_end
            from public.user_exam_entitlements e
            join public.subscriptions s
              on s.id::text = e.metadata->>'subscription_id'
           where e.user_id = 'bbbbbbbb-0000-0000-0000-000000000001'
             and e.exam_id = 'BANK_EXAMS'),
  true,
  'the entitlement expires when the paid period does');

select is((select granted_by from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000001'
              and exam_id = 'BANK_EXAMS'),
  null::uuid,
  'a subscription grant has no human granter: the server issued it');

-- ─── 43-50  the payment produced real, user-visible access ───────────────────
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- Every exam in the live catalogue is covered by the pgtap_bank plan (BANK_EXAMS
-- directly, and all four APPSC groups through the APPSC_GROUPS group grant), so
-- "an exam this plan does not cover" needs an exam that is actually uncovered.
-- A code that is merely absent would prove nothing: the access check is a pure
-- lookup on entitlements and would deny it either way.
reset role;

insert into public.exams (exam_id, exam_type)
values ('PGTAP_UNCOVERED', 'main')
on conflict (exam_id) do nothing;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}', true);

select ok(public.is_exam_allowed_for_user('BANK_EXAMS'),
  'the paid-for exam is now allowed');
select ok(public.is_exam_allowed_for_user('APPSC_GROUP_1'),
  'a group the plan covers unlocks a member exam');
select ok(public.is_exam_allowed_for_user('APPSC_GROUP_2'),
  'a group grant reaches every exam in the group, not just the first');
select ok(not public.is_exam_allowed_for_user('PGTAP_UNCOVERED'),
  'a plan never unlocks an exam it does not cover');
select is((select count(*) from public.get_my_entitlements())::bigint, 5::bigint,
  'the entitled account lists exactly the four APPSC groups plus bank exams');

select is((select plan_code from public.get_my_subscription()),
  'pgtap_bank'::text,
  'the user can read their own plan');
select is((select status from public.get_my_subscription()),
  'active'::text,
  'the user can read their own subscription status');

-- another account must learn nothing
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}', true);

select is((select count(*) from public.get_my_subscription())::bigint, 0::bigint,
  'another user cannot read this subscription');
select ok(not public.is_exam_allowed_for_user('BANK_EXAMS'),
  'another user gets no access from someone else''s payment');
select ok(not public.is_exam_allowed_for_user('APPSC_GROUP_1'),
  'another user gets no group access from someone else''s payment');

-- ─── 51-55  a replayed webhook changes nothing ───────────────────────────────
reset role;

select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_activate_1', 'subscription.activated',
                  'sub_subscriber_1', 'bbbbbbbb-0000-0000-0000-000000000001',
                  'pgtap_bank', now(), now() + interval '30 days') $$,
  'a replayed webhook is accepted rather than erroring');

select is((select (public.billing_apply_payment_event(
            'pgtap', 'evt_activate_1', 'subscription.activated',
            'sub_subscriber_1', 'bbbbbbbb-0000-0000-0000-000000000001',
            'pgtap_bank', now(), now() + interval '30 days'))->>'duplicate'),
  'true'::text,
  'a replayed webhook reports itself as a duplicate');

select is((select count(*) from public.payment_events
            where provider = 'pgtap' and provider_event_id = 'evt_activate_1')::bigint,
  1::bigint,
  'the replay created no second ledger row');

select is((select count(*) from public.subscriptions)::bigint, 1::bigint,
  'the replay created no second subscription');

select is((select count(*) from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000001'
              and revoked_at is null)::bigint,
  2::bigint,
  'the replay created no second entitlement');

-- ─── 56-59  renewal moves the period forward ─────────────────────────────────
select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_renew_1', 'invoice.paid',
                  'sub_subscriber_1', 'bbbbbbbb-0000-0000-0000-000000000001',
                  NULL, now(), now() + interval '60 days') $$,
  'the server can process a renewal');

select is((select date_trunc('day', current_period_end)::date
            from public.subscriptions where provider_subscription_id = 'sub_subscriber_1'),
  (date_trunc('day', now() + interval '60 days'))::date,
  'the renewed period end is the one the provider supplied');

select is((select count(*) from public.subscriptions)::bigint, 1::bigint,
  'a renewal does not create a second subscription');

select is((select valid_until = s.current_period_end
            from public.subscriptions s
            join public.user_exam_entitlements e
              on e.metadata->>'subscription_id' = s.id::text
           where e.user_id = 'bbbbbbbb-0000-0000-0000-000000000001'
             and e.exam_id = 'BANK_EXAMS'),
  true,
  'the entitlement was extended to match the renewal');

-- ─── 60-63  a failed payment does not cut off a paying customer ──────────────
select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_fail_1', 'payment.failed',
                  'sub_subscriber_1', 'bbbbbbbb-0000-0000-0000-000000000001') $$,
  'the server can process a payment failure');

select is((select status from public.subscriptions
            where provider_subscription_id = 'sub_subscriber_1'),
  'past_due'::text,
  'the subscription is marked past_due');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}', true);

select ok(public.is_exam_allowed_for_user('BANK_EXAMS'),
  'a declined card inside a paid period keeps the access the customer bought');

reset role;

-- ─── 64-68  cancellation is effective at period end, not at the click ─────────
select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_renew_2', 'invoice.paid',
                  'sub_subscriber_1', 'bbbbbbbb-0000-0000-0000-000000000001',
                  NULL, now(), now() + interval '60 days') $$,
  'a later renewal clears the past_due state');

select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_cancel_1', 'subscription.cancelled',
                  'sub_subscriber_1', 'bbbbbbbb-0000-0000-0000-000000000001') $$,
  'the server can process a cancellation');

select is((select status from public.subscriptions
            where provider_subscription_id = 'sub_subscriber_1'),
  'cancelled'::text,
  'the subscription is cancelled');

select is((select cancel_at_period_end from public.subscriptions
            where provider_subscription_id = 'sub_subscriber_1'),
  true,
  'the cancellation is scheduled for period end');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}', true);

select ok(public.is_exam_allowed_for_user('BANK_EXAMS'),
  'cancelling does not remove access the user has already paid for');

reset role;

-- ─── 69-73  expiration ends access ───────────────────────────────────────────
select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_expire_1', 'subscription.expired',
                  'sub_subscriber_1', 'bbbbbbbb-0000-0000-0000-000000000001') $$,
  'the server can process an expiry');

select is((select status from public.subscriptions
            where provider_subscription_id = 'sub_subscriber_1'),
  'expired'::text,
  'the subscription is expired');

select is((select count(*) from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000001'
              and revoked_at is null)::bigint,
  0::bigint,
  'expiry revoked every entitlement the subscription owned');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}', true);

select ok(not public.is_exam_allowed_for_user('BANK_EXAMS'),
  'an expired subscription grants nothing');
select ok(not public.is_exam_allowed_for_user('APPSC_GROUP_1'),
  'an expired subscription grants no group access either');

-- ─── 74-79  refund ends access ───────────────────────────────────────────────
reset role;

select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_reactivate_1', 'subscription.activated',
                  'sub_subscriber_1', 'bbbbbbbb-0000-0000-0000-000000000001',
                  'pgtap_bank', now(), now() + interval '30 days') $$,
  'a re-purchase reactivates the same subscription row rather than adding one');

select is((select count(*) from public.subscriptions)::bigint, 1::bigint,
  'the re-purchase reused the existing subscription');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}', true);

select ok(public.is_exam_allowed_for_user('BANK_EXAMS'),
  'the re-purchase restored access');

reset role;

select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_refund_1', 'payment.refunded',
                  'sub_subscriber_1', 'bbbbbbbb-0000-0000-0000-000000000001') $$,
  'the server can process a refund');

select is((select status from public.subscriptions
            where provider_subscription_id = 'sub_subscriber_1'),
  'refunded'::text,
  'the subscription is refunded');

select is((select count(*) from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000001'
              and revoked_at is null)::bigint,
  0::bigint,
  'a refund revoked every entitlement the subscription owned');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}', true);

select ok(not public.is_exam_allowed_for_user('BANK_EXAMS'),
  'a refunded subscription grants nothing');

-- ─── 80-85  a plan change re-points the grants ───────────────────────────────
reset role;

update public.subscriptions
   set plan_id = (select id from public.subscription_plans where code = 'pgtap_appsc'),
       status  = 'active',
       current_period_start = now(),
       current_period_end   = now() + interval '365 days'
 where provider_subscription_id = 'sub_subscriber_1';

select is((select count(*) from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000001'
              and exam_id = 'BANK_EXAMS' and revoked_at is null)::bigint,
  0::bigint,
  'changing plan revoked the grants the old plan no longer confers');

select is((select count(*) from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000001'
              and exam_id = 'APPSC_GROUPS' and scope = 'group'
              and revoked_at is null)::bigint,
  1::bigint,
  'changing plan granted what the new plan confers');

-- ─── 86-91  a subscription can never touch an administrative grant ───────────
-- user 4 is granted BANK_EXAMS by the admin, then subscribes to the very plan
-- that confers BANK_EXAMS. The admin row must win and must survive the
-- subscription ending.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000003","role":"authenticated"}', true);

select lives_ok($$ select public.admin_grant_exam_entitlement(
                  'bbbbbbbb-0000-0000-0000-000000000004', 'BANK_EXAMS', 'exam') $$,
  'an admin can grant the same exam the plan confers');

reset role;

select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_grantee_1', 'subscription.activated',
                  'sub_grantee_1', 'bbbbbbbb-0000-0000-0000-000000000004',
                  'pgtap_bank', now(), now() + interval '30 days') $$,
  'the grantee can also subscribe to the overlapping plan');

select is((select source from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000004'
              and exam_id = 'BANK_EXAMS' and revoked_at is null),
  'admin'::text,
  'the pre-existing administrative grant was not overwritten by the subscription');

select is((select count(*) from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000004'
              and exam_id = 'BANK_EXAMS' and revoked_at is null)::bigint,
  1::bigint,
  'the overlap did not produce two live rows for the same target');

select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_grantee_2', 'payment.refunded',
                  'sub_grantee_1', 'bbbbbbbb-0000-0000-0000-000000000004') $$,
  'the subscription can then be refunded');

select is((select count(*) from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000004'
              and exam_id = 'BANK_EXAMS' and revoked_at is null)::bigint,
  1::bigint,
  'ending the subscription did not revoke the administrative grant');

-- ─── 92-96  failure is recorded, not raised, and stays replayable ─────────────
select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_bad_1', 'invoice.paid',
                  'sub_does_not_exist', NULL) $$,
  'an event for an unknown subscription is recorded rather than raising');

select is((select (public.billing_apply_payment_event(
            'pgtap', 'evt_bad_1', 'invoice.paid',
            'sub_does_not_exist', NULL))->>'ok'),
  'false'::text,
  'an unresolvable event reports ok=false');

select is((select status from public.payment_events
            where provider = 'pgtap' and provider_event_id = 'evt_bad_1'),
  'failed'::text,
  'the failed event is retained in the ledger for audit');

select ok((select error is not null from public.payment_events
            where provider = 'pgtap' and provider_event_id = 'evt_bad_1'),
  'the failure reason is recorded');

select is((select status from public.payment_events
            where provider = 'pgtap' and provider_event_id = 'evt_reactivate_1'),
  'processed'::text,
  'an unrelated good event is unaffected by the failure');

-- ─── an unmodelled event is safe rather than fatal ───────────────────────────
select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_unknown_1', 'customer.account.verified', NULL,
                  'bbbbbbbb-0000-0000-0000-000000000001') $$,
  'an event type the model does not cover is accepted');

select is((select status from public.payment_events
            where provider = 'pgtap' and provider_event_id = 'evt_unknown_1'),
  'ignored'::text,
  'an unmodelled event is recorded as ignored');

-- ─── constraints, foreign keys and validation ────────────────────────────────
select throws_ok($$ insert into public.subscriptions
                  (user_id, plan_id, status, current_period_end)
                values ('bbbbbbbb-0000-0000-0000-000000000001',
                        (select id from public.subscription_plans where code = 'pgtap_bank'),
                        'teleported', now() + interval '30 days') $$, NULL, NULL,
  'a status outside the lifecycle vocabulary is refused');

select throws_ok($$ insert into public.subscriptions
                  (user_id, plan_id, status, current_period_start, current_period_end)
                values ('bbbbbbbb-0000-0000-0000-000000000001',
                        (select id from public.subscription_plans where code = 'pgtap_bank'),
                        'active', now() + interval '30 days', now()) $$, NULL, NULL,
  'a period that ends before it starts is refused');

select throws_ok($$ insert into public.subscriptions
                  (user_id, plan_id, status, current_period_end)
                values ('cccccccc-0000-0000-0000-0000000000ff',
                        (select id from public.subscription_plans where code = 'pgtap_bank'),
                        'active', now() + interval '30 days') $$, NULL, NULL,
  'a subscription for a user that does not exist is refused by the foreign key');

select throws_ok($$ insert into public.plan_entitlements (plan_id, exam_id, scope)
                values ('cccccccc-0000-0000-0000-0000000000ff', 'BANK_EXAMS', 'exam') $$, NULL, NULL,
  'a plan grant for a plan that does not exist is refused by the foreign key');

select throws_ok($$ insert into public.plan_entitlements (plan_id, exam_id, scope)
                values ((select id from public.subscription_plans where code = 'pgtap_bank'),
                        'BANK_EXAMS', 'universe') $$, NULL, NULL,
  'a scope outside the entitlement vocabulary is refused');

select throws_ok($$ insert into public.subscription_plans
                  (code, name, amount_minor, currency, interval_unit)
                values ('PGTAP_UPPER', 'Bad Code', 1, 'INR', 'month') $$, NULL, NULL,
  'a plan code that is not a lowercase identifier is refused');

select throws_ok($$ insert into public.subscription_plans
                  (code, name, amount_minor, currency, interval_unit)
                values ('pgtap_neg', 'Negative', -1, 'INR', 'month') $$, NULL, NULL,
  'a negative price is refused');

select throws_ok($$ insert into public.subscription_plans
                  (code, name, amount_minor, currency, interval_unit)
                values ('pgtap_cur', 'Bad Currency', 1, 'inr', 'month') $$, NULL, NULL,
  'a lower-case currency code is refused');

select throws_ok($$ insert into public.subscription_plans
                  (code, name, amount_minor, currency, interval_unit)
                values ('pgtap_bank', 'Duplicate Code', 1, 'INR', 'month') $$, NULL, NULL,
  'a duplicate plan code is refused');

-- Every validation failure in this function is recorded in the ledger and
-- reported through the return value; none of them propagate to the caller, so a
-- bad delivery can never take down a webhook handler. Asserted the same way as
-- the incomplete activation below, rather than as a raised exception.
select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_unknown_plan', 'subscription.activated',
                  'sub_x', 'bbbbbbbb-0000-0000-0000-000000000001',
                  'no_such_plan', now(), now() + interval '30 days') $$,
  'an activation against an unknown plan is recorded rather than raising');

select is((select status from public.payment_events
            where provider = 'pgtap' and provider_event_id = 'evt_unknown_plan'),
  'failed'::text,
  'the unknown plan was rejected by validation');

select ok((select error like '%UNKNOWN_PLAN%' from public.payment_events
            where provider = 'pgtap' and provider_event_id = 'evt_unknown_plan'),
  'the reason names the unknown plan');

select lives_ok($$ select public.billing_apply_payment_event(
                  'pgtap', 'evt_activate_missing_end', 'subscription.activated',
                  'sub_x', 'bbbbbbbb-0000-0000-0000-000000000001',
                  'pgtap_bank', now(), NULL) $$,
  'an activation with no period end is recorded rather than raising');

select is((select status from public.payment_events
            where provider = 'pgtap' and provider_event_id = 'evt_activate_missing_end'),
  'failed'::text,
  'the incomplete activation was rejected by validation');

select is((select count(*) from public.subscriptions)::bigint, 2::bigint,
  'no subscription was created by any rejected event');

-- ─── the entitlement invariant still holds for every fixture ─────────────────
select is((select count(*) from public.user_exam_entitlements
            where user_id = 'bbbbbbbb-0000-0000-0000-000000000002')::bigint,
  0::bigint,
  'the bystander was never granted anything at any point in this suite');

select * from finish();
rollback;
