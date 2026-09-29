-- =============================================================================
-- Subscription and entitlement foundation
--
-- Context
--   public.user_exam_entitlements (20261004000000, P0-02) is already the single
--   server-owned content-access authority. It is RLS-enabled with zero policies,
--   holds no privilege for anon/authenticated, and is read only through
--   public._pf_entitled_exam. Its `source` vocabulary already reserves
--   'subscription' and 'payment' for exactly this phase.
--
--   Therefore this migration does NOT create an entitlements table. Creating a
--   second one would establish a second authority, and the two could disagree:
--   the one is_exam_allowed_for_user reads is the only one that gates content.
--   Subscriptions are added as the *reason* an entitlement exists, and the
--   entitlement rows themselves stay in the existing table.
--
--   No payment provider is integrated here. The event vocabulary below is
--   provider-neutral on purpose: the handler stores whatever the provider calls
--   an event, and only the six modelled types change subscription state.
--
-- Data ownership
--   plans / plan_entitlements : server-managed catalogue. Read by the server.
--   subscriptions             : server-owned. Written only by
--                               billing_apply_payment_event (service_role).
--   payment_events            : append-only server ledger. Never deleted.
--   user_exam_entitlements    : written only by the sync trigger and the
--                               existing admin_* RPCs. A client can neither read
--                               nor write it, before or after this migration.
--
-- Business rules encoded here (agreed, not inferred)
--   * A failed payment marks the subscription past_due and does NOT remove
--     access; access ends when the period lapses or the provider says so.
--   * Cancellation is effective at period end, not at the moment of request.
--   * Renewal periods are supplied by the payment provider. The database
--     performs no billing-period arithmetic.
--   * No plans are seeded. Catalogue contents are a product decision.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. subscription_plans -- the catalogue
--
-- Owner: server. A plan is inert data; it grants nothing by existing.
-- amount_minor/currency rather than a provider-specific money column, so the
-- same catalogue serves any provider without a schema change.
-- -----------------------------------------------------------------------------
CREATE TABLE public.subscription_plans (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    code           text        NOT NULL UNIQUE
                               CHECK (code ~ '^[a-z0-9][a-z0-9_]{1,63}$'),
    name           text        NOT NULL CHECK (btrim(name) <> ''),
    description    text,
    amount_minor   bigint      NOT NULL CHECK (amount_minor >= 0),
    currency       text        NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    interval_unit  text        NOT NULL
                               CHECK (interval_unit IN ('day', 'week', 'month', 'year')),
    interval_count integer     NOT NULL DEFAULT 1 CHECK (interval_count > 0),
    is_active      boolean     NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.subscription_plans IS
    'Server-managed plan catalogue. Inert until a subscription references it. '
    'Contains no payment-provider identifiers.';

-- -----------------------------------------------------------------------------
-- 2. plan_entitlements -- what a plan confers
--
-- exam_id/scope deliberately mirror public.user_exam_entitlements exactly and
-- are deliberately NOT foreign keyed, for the same reason P0-02 gave: a 'group'
-- grant names a category (APPSC_GROUPS) that has no row in public.exams, only in
-- exam_configs.exam_selection. One vocabulary, resolved the same way at read
-- time, so a plan and a manual grant are interchangeable.
-- -----------------------------------------------------------------------------
CREATE TABLE public.plan_entitlements (
    plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    exam_id text NOT NULL CHECK (btrim(exam_id) <> ''),
    scope   text NOT NULL DEFAULT 'exam'
                     CHECK (scope IN ('exam', 'group')),
    PRIMARY KEY (plan_id, exam_id, scope)
);

COMMENT ON TABLE public.plan_entitlements IS
    'The exam grants a plan confers. Mirrors user_exam_entitlements vocabulary.';

-- -----------------------------------------------------------------------------
-- 3. subscriptions
--
-- 'incomplete' is the state a subscription is in before any successful payment,
-- and is the only state that confers no access. 'past_due' and 'cancelled'
-- still confer access: the former during the provider retry window, the latter
-- until current_period_end, which is already enforced at read time by
-- _pf_entitled_exam's valid_until comparison.
-- -----------------------------------------------------------------------------
CREATE TABLE public.subscriptions (
    id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  uuid        NOT NULL
                                         REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id                  uuid        NOT NULL
                                         REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status                   text        NOT NULL
                                         CHECK (status IN ('incomplete', 'active', 'past_due',
                                                           'cancelled', 'expired', 'refunded')),
    current_period_start     timestamptz NOT NULL DEFAULT now(),
    current_period_end       timestamptz NOT NULL,
    cancel_at_period_end     boolean     NOT NULL DEFAULT false,
    cancelled_at             timestamptz,
    ended_at                 timestamptz,
    provider                 text,
    provider_subscription_id text,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT subscriptions_window_ck
        CHECK (current_period_end > current_period_start)
);

-- At most one live subscription per (user, plan). A double-clicked checkout or a
-- duplicated webhook therefore converges on one row instead of two, and a user
-- may hold subscriptions to several different plans at once.
CREATE UNIQUE INDEX subscriptions_live_uk
    ON public.subscriptions (user_id, plan_id)
    WHERE status IN ('incomplete', 'active', 'past_due');

-- One provider subscription maps to exactly one local subscription. Partial so
-- that a locally-provisioned subscription needs no provider identity.
CREATE UNIQUE INDEX subscriptions_provider_uk
    ON public.subscriptions (provider, provider_subscription_id)
    WHERE provider IS NOT NULL AND provider_subscription_id IS NOT NULL;

CREATE INDEX subscriptions_user_idx ON public.subscriptions (user_id);

CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.subscriptions IS
    'Server-owned subscription state. Never written by a client. Entitlement is '
    'derived from this table by trigger, never by the client.';

-- -----------------------------------------------------------------------------
-- 4. payment_events -- the append-only ledger
--
-- The unique (provider, provider_event_id) is the whole duplicate-webhook
-- defence: a retried or replayed delivery cannot create a second row, so it
-- cannot be processed twice. 'processed' and 'ignored' are terminal. 'failed'
-- is deliberately NOT terminal, so a genuine retry after a transient failure
-- is reprocessed while a duplicate of a successful event is rejected.
--
-- No DELETE is granted on this table: history is append-only.
-- -----------------------------------------------------------------------------
CREATE TABLE public.payment_events (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    provider          text        NOT NULL CHECK (btrim(provider) <> ''),
    provider_event_id text        NOT NULL CHECK (btrim(provider_event_id) <> ''),
    event_type        text        NOT NULL CHECK (btrim(event_type) <> ''),
    user_id           uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    subscription_id   uuid        REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    payload           jsonb       NOT NULL DEFAULT '{}'::jsonb,
    status            text        NOT NULL
                                  CHECK (status IN ('processed', 'ignored', 'failed')),
    error             text,
    received_at       timestamptz NOT NULL DEFAULT now(),
    processed_at      timestamptz,
    CONSTRAINT payment_events_provider_event_uk UNIQUE (provider, provider_event_id)
);

CREATE INDEX payment_events_subscription_idx ON public.payment_events (subscription_id);
CREATE INDEX payment_events_user_idx        ON public.payment_events (user_id);

COMMENT ON TABLE public.payment_events IS
    'Append-only provider event ledger. Uniqueness of '
    '(provider, provider_event_id) is the duplicate-webhook guard.';

-- -----------------------------------------------------------------------------
-- 5. Lock every new table down the same way P0-02 locked entitlements
--
-- RLS on with no policies, and no privilege for anon or authenticated. Nothing
-- here is reachable from the Android app or the future website through the
-- Data API; reads go through get_my_subscription, writes through
-- billing_apply_payment_event as service_role.
-- -----------------------------------------------------------------------------
ALTER TABLE public.subscription_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_entitlements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events      ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.subscription_plans FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.plan_entitlements FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.subscriptions     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.payment_events    FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_plans  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_entitlements   TO service_role;
-- No DELETE on subscriptions either: a subscription is ended, not removed, so
-- that its entitlement history stays joinable.
GRANT SELECT, INSERT, UPDATE          ON public.subscriptions      TO service_role;
GRANT SELECT, INSERT, UPDATE          ON public.payment_events     TO service_role;

-- Supabase's default privileges hand ALL on every new public table to
-- service_role, so a GRANT alone does not narrow anything. Without these
-- revokes service_role could DELETE or TRUNCATE the event ledger, which would
-- make the audit trail and the duplicate-webhook guard both optional.
REVOKE DELETE, TRUNCATE ON public.subscriptions  FROM service_role;
REVOKE DELETE, TRUNCATE ON public.payment_events FROM service_role;

-- -----------------------------------------------------------------------------
-- 6. Entitlement sync
--
-- One trigger, so entitlement follows subscription state no matter which writer
-- touched the row. That is what makes it impossible to hold an active
-- subscription without the matching grants, or to hold grants after the
-- subscription that produced them has ended.
--
-- Every row this touches is identified by metadata->>'subscription_id' = the
-- subscription's own id, which is why a subscription can never revoke, extend
-- or overwrite an administrative or migration grant. Where an admin grant and a
-- subscription grant collide on (user, exam, scope), the pre-existing row wins
-- and the subscription does nothing to it.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.billing_sync_subscription_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_link text := NEW.id::text;
BEGIN
    -- 6a. End the grants this subscription owns that must no longer be live:
    --     the subscription is in a non-granting state, the paid period has
    --     lapsed, or the plan changed and no longer confers this target.
    UPDATE public.user_exam_entitlements e
       SET revoked_at = COALESCE(NEW.ended_at, now())
     WHERE e.user_id = NEW.user_id
       AND e.revoked_at IS NULL
       AND e.metadata ->> 'subscription_id' = v_link
       AND (
             NEW.status NOT IN ('active', 'past_due', 'cancelled')
          OR NEW.current_period_end <= now()
          OR NOT EXISTS (
                SELECT 1
                  FROM public.plan_entitlements pe
                 WHERE pe.plan_id = NEW.plan_id
                   AND pe.exam_id = e.exam_id
                   AND pe.scope  = e.scope
             )
       );

    -- 6b. Assert what the current plan confers, while access is live. Idempotent:
    --     re-running the trigger rewrites the same rows with the same values.
    IF NEW.status IN ('active', 'past_due', 'cancelled')
       AND NEW.current_period_end > now() THEN
        INSERT INTO public.user_exam_entitlements (
            user_id, exam_id, scope, valid_from, valid_until,
            source, granted_by, metadata)
        SELECT NEW.user_id, pe.exam_id, pe.scope,
               NEW.current_period_start, NEW.current_period_end,
               'subscription', NULL,
               jsonb_build_object('subscription_id', v_link,
                                  'plan_id', NEW.plan_id)
          FROM public.plan_entitlements pe
         WHERE pe.plan_id = NEW.plan_id
        ON CONFLICT (user_id, exam_id, scope) WHERE revoked_at IS NULL
        DO UPDATE SET valid_from  = EXCLUDED.valid_from,
                      valid_until = EXCLUDED.valid_until,
                      source      = EXCLUDED.source,
                      metadata    = EXCLUDED.metadata
         -- Only ever touch a row this same subscription created.
         WHERE public.user_exam_entitlements.metadata ->> 'subscription_id' = v_link;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_billing_sync_subscription_entitlements
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.billing_sync_subscription_entitlements();

REVOKE ALL ON FUNCTION public.billing_sync_subscription_entitlements() FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. Subscription lookup helper
--
-- Resolves the target subscription by provider identity, falling back to the
-- user when the provider sends a user id instead of a subscription id. The
-- fallback is deliberately disabled when a subscription id WAS supplied but did
-- not match, so a stale id can never silently land on an unrelated row.
--
-- Revoked from anon/authenticated: it takes an arbitrary user id, so it must
-- not be reachable as a billing lookup by a client.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._pf_billing_resolve_subscription(
    p_provider                 text,
    p_provider_subscription_id text,
    p_user_id                  uuid
) RETURNS public.subscriptions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
    SELECT *
      FROM public.subscriptions
     WHERE NULLIF(btrim(COALESCE(p_provider_subscription_id, '')), '') IS NOT NULL
       AND provider = btrim(p_provider)
       AND provider_subscription_id = btrim(p_provider_subscription_id)
     UNION ALL
    SELECT *
      FROM public.subscriptions
     WHERE NULLIF(btrim(COALESCE(p_provider_subscription_id, '')), '') IS NULL
       AND p_user_id IS NOT NULL
       AND user_id = p_user_id
       AND status IN ('incomplete', 'active', 'past_due', 'cancelled')
     LIMIT 1
$$;

REVOKE ALL ON FUNCTION public._pf_billing_resolve_subscription(text, text, uuid) FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 8. billing_apply_payment_event -- the one authoritative writer
--
-- Service role only. This is the server-side half of
--     webhook -> Supabase verifies/processes -> subscription status
--                                          -> server-owned entitlement
-- The trigger above turns the subscription write into the entitlement write, so
-- a payment never grants anything directly: it can only advance subscription
-- state, and the grants follow from that.
--
-- Failure is recorded, not raised. Rolling the insert back would destroy the
-- idempotency key and make the event unreplayable, so a failed event is
-- committed with status='failed' and the handler returns ok=false. The
-- provider's retry then finds a 'failed' row and reprocesses it, whereas a
-- retry of a 'processed' event is reported as a duplicate and does nothing.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.billing_apply_payment_event(
    p_provider                 text,
    p_provider_event_id        text,
    p_event_type               text,
    p_provider_subscription_id text        DEFAULT NULL,
    p_user_id                  uuid        DEFAULT NULL,
    p_plan_code                text        DEFAULT NULL,
    p_period_start             timestamptz DEFAULT NULL,
    p_period_end               timestamptz DEFAULT NULL,
    p_payload                  jsonb       DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_event     public.payment_events%ROWTYPE;
    v_sub       public.subscriptions%ROWTYPE;
    v_plan_id   uuid;
    v_period_start timestamptz;
    v_error     text;
    v_reprocess boolean := false;
BEGIN
    IF NULLIF(btrim(p_provider), '') IS NULL
       OR NULLIF(btrim(p_provider_event_id), '') IS NULL
       OR NULLIF(btrim(p_event_type), '') IS NULL THEN
        RAISE EXCEPTION 'INVALID_EVENT: provider, provider_event_id and event_type are required';
    END IF;

    -- Idempotency. A concurrent duplicate blocks on the unique index until the
    -- first transaction commits, then falls through to the reload below.
    INSERT INTO public.payment_events (
        provider, provider_event_id, event_type, user_id, payload, status)
    VALUES (
        btrim(p_provider), btrim(p_provider_event_id), btrim(p_event_type),
        p_user_id, COALESCE(p_payload, '{}'::jsonb), 'processed')
    ON CONFLICT (provider, provider_event_id) DO NOTHING
    RETURNING * INTO v_event;

    IF NOT FOUND THEN
        SELECT * INTO v_event
          FROM public.payment_events
         WHERE provider = btrim(p_provider)
           AND provider_event_id = btrim(p_provider_event_id);

        IF v_event.status = 'failed' THEN
            -- A genuine retry of an event that previously failed.
            v_reprocess := true;
        ELSE
            RETURN jsonb_build_object(
                'ok', true, 'duplicate', true, 'ignored', false,
                'event_id', v_event.id, 'event_type', v_event.event_type,
                'event_status', v_event.status);
        END IF;
    END IF;

    BEGIN
        CASE btrim(p_event_type)

        WHEN 'subscription.activated' THEN
            IF p_user_id IS NULL THEN
                RAISE EXCEPTION 'MISSING_PARAMETER: p_user_id is required for subscription.activated';
            END IF;
            IF NULLIF(btrim(COALESCE(p_plan_code, '')), '') IS NULL THEN
                RAISE EXCEPTION 'MISSING_PARAMETER: p_plan_code is required for subscription.activated';
            END IF;
            IF p_period_end IS NULL THEN
                RAISE EXCEPTION 'MISSING_PARAMETER: p_period_end is required for subscription.activated';
            END IF;

            SELECT id INTO v_plan_id
              FROM public.subscription_plans
             WHERE code = btrim(p_plan_code) AND is_active;
            IF v_plan_id IS NULL THEN
                RAISE EXCEPTION 'UNKNOWN_PLAN: %', p_plan_code;
            END IF;

            v_period_start := COALESCE(p_period_start, now());
            IF p_period_end <= v_period_start THEN
                RAISE EXCEPTION 'INVALID_WINDOW: p_period_end must be after the period start';
            END IF;

            -- A re-purchase must revive the row the provider already holds,
            -- whichever terminal state it reached. This cannot be an
            -- INSERT ... ON CONFLICT against subscriptions_live_uk: an expired,
            -- cancelled or refunded row falls outside that index's predicate,
            -- so the insert collides on subscriptions_provider_uk instead and
            -- the customer is charged for access that is never granted. Resolve
            -- the row first, exactly as the other event types do, and only
            -- insert when the provider is opening a genuinely new subscription.
            SELECT * INTO v_sub
              FROM public.subscriptions
             WHERE (provider = btrim(p_provider)
                    AND provider_subscription_id = btrim(p_provider_subscription_id))
                OR (user_id = p_user_id AND plan_id = v_plan_id)
             ORDER BY (provider = btrim(p_provider)
                       AND provider_subscription_id = btrim(p_provider_subscription_id)) DESC,
                      created_at DESC
             LIMIT 1
             FOR UPDATE;

            IF v_sub.id IS NOT NULL THEN
                -- A provider subscription may only ever be moved to the
                -- account that already owns it.
                IF v_sub.user_id <> p_user_id THEN
                    RAISE EXCEPTION 'SUBSCRIPTION_OWNERSHIP_MISMATCH: provider subscription % belongs to another account',
                                    p_provider_subscription_id;
                END IF;

                UPDATE public.subscriptions
                   SET status = 'active',
                       plan_id = v_plan_id,
                       current_period_start = v_period_start,
                       current_period_end   = p_period_end,
                       provider             = btrim(p_provider),
                       provider_subscription_id = COALESCE(
                           NULLIF(btrim(p_provider_subscription_id), ''),
                           provider_subscription_id),
                       cancel_at_period_end = false,
                       cancelled_at = NULL,
                       ended_at     = NULL
                 WHERE id = v_sub.id
                RETURNING * INTO v_sub;
            ELSE
                INSERT INTO public.subscriptions (
                    user_id, plan_id, status, current_period_start, current_period_end,
                    provider, provider_subscription_id)
                VALUES (
                    p_user_id, v_plan_id, 'active', v_period_start, p_period_end,
                    btrim(p_provider), NULLIF(btrim(p_provider_subscription_id), ''))
                RETURNING * INTO v_sub;
            END IF;

        WHEN 'invoice.paid' THEN
            SELECT * INTO v_sub
              FROM public._pf_billing_resolve_subscription(
                       p_provider, p_provider_subscription_id, p_user_id);
            IF v_sub.id IS NULL THEN
                RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND: provider=%, provider_subscription_id=%, user_id=%',
                                p_provider, p_provider_subscription_id, p_user_id;
            END IF;
            IF p_period_end IS NULL THEN
                RAISE EXCEPTION 'MISSING_PARAMETER: p_period_end is required for invoice.paid';
            END IF;

            -- The provider owns the period; the database only stores it.
            v_period_start := COALESCE(p_period_start, v_sub.current_period_start);
            IF p_period_end <= v_period_start THEN
                RAISE EXCEPTION 'INVALID_WINDOW: p_period_end must be after the period start';
            END IF;

            UPDATE public.subscriptions
               SET status = 'active',
                   current_period_start = v_period_start,
                   current_period_end   = p_period_end,
                   cancel_at_period_end = false,
                   cancelled_at = NULL,
                   ended_at     = NULL
             WHERE id = v_sub.id
            RETURNING * INTO v_sub;

        WHEN 'payment.failed' THEN
            SELECT * INTO v_sub
              FROM public._pf_billing_resolve_subscription(
                       p_provider, p_provider_subscription_id, p_user_id);
            IF v_sub.id IS NULL THEN
                RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND: provider=%, provider_subscription_id=%, user_id=%',
                                p_provider, p_provider_subscription_id, p_user_id;
            END IF;

            -- past_due keeps access. The sync trigger grants nothing new and
            -- revokes nothing here, so a declined card does not cut off a
            -- customer who is inside a paid period.
            UPDATE public.subscriptions
               SET status = 'past_due'
             WHERE id = v_sub.id
            RETURNING * INTO v_sub;

        WHEN 'subscription.cancelled' THEN
            SELECT * INTO v_sub
              FROM public._pf_billing_resolve_subscription(
                       p_provider, p_provider_subscription_id, p_user_id);
            IF v_sub.id IS NULL THEN
                RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND: provider=%, provider_subscription_id=%, user_id=%',
                                p_provider, p_provider_subscription_id, p_user_id;
            END IF;

            -- Effective at period end: status leaves 'active' but the grants
            -- survive until current_period_end, which _pf_entitled_exam already
            -- enforces. No immediate revocation.
            UPDATE public.subscriptions
               SET status = 'cancelled',
                   cancel_at_period_end = true,
                   cancelled_at = COALESCE(cancelled_at, now()),
                   ended_at = NULL
             WHERE id = v_sub.id
            RETURNING * INTO v_sub;

        WHEN 'subscription.expired' THEN
            SELECT * INTO v_sub
              FROM public._pf_billing_resolve_subscription(
                       p_provider, p_provider_subscription_id, p_user_id);
            IF v_sub.id IS NULL THEN
                RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND: provider=%, provider_subscription_id=%, user_id=%',
                                p_provider, p_provider_subscription_id, p_user_id;
            END IF;

            UPDATE public.subscriptions
               SET status = 'expired',
                   cancel_at_period_end = false,
                   ended_at = COALESCE(ended_at, now())
             WHERE id = v_sub.id
            RETURNING * INTO v_sub;

        WHEN 'payment.refunded' THEN
            SELECT * INTO v_sub
              FROM public._pf_billing_resolve_subscription(
                       p_provider, p_provider_subscription_id, p_user_id);
            IF v_sub.id IS NULL THEN
                RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND: provider=%, provider_subscription_id=%, user_id=%',
                                p_provider, p_provider_subscription_id, p_user_id;
            END IF;

            UPDATE public.subscriptions
               SET status = 'refunded',
                   cancel_at_period_end = false,
                   ended_at = COALESCE(ended_at, now())
             WHERE id = v_sub.id
            RETURNING * INTO v_sub;

        ELSE
            -- Unmodelled event. Recorded for audit, changes nothing. This is
            -- what makes an unknown provider event safe rather than fatal.
            UPDATE public.payment_events
               SET status = 'ignored', processed_at = now()
             WHERE id = v_event.id;

            RETURN jsonb_build_object(
                'ok', true, 'duplicate', false, 'ignored', true,
                'event_id', v_event.id, 'event_type', btrim(p_event_type));
        END CASE;

    EXCEPTION WHEN OTHERS THEN
        -- Recorded, not raised: see the note above the function body.
        v_error := SQLSTATE || ' ' || SQLERRM;

        UPDATE public.payment_events
           SET status = 'failed', error = v_error, processed_at = now(),
               user_id = COALESCE(p_user_id, v_event.user_id),
               subscription_id = v_sub.id
         WHERE id = v_event.id;

        RETURN jsonb_build_object(
            'ok', false, 'duplicate', v_reprocess, 'ignored', false,
            'event_id', v_event.id, 'event_type', btrim(p_event_type),
            'error', v_error);
    END;

    UPDATE public.payment_events
       SET status = 'processed',
           processed_at = now(),
           user_id = COALESCE(p_user_id, v_event.user_id),
           subscription_id = v_sub.id
     WHERE id = v_event.id;

    RETURN jsonb_build_object(
        'ok', true, 'duplicate', v_reprocess, 'ignored', false,
        'event_id', v_event.id, 'event_type', btrim(p_event_type),
        'subscription_id', v_sub.id,
        'status', v_sub.status,
        'current_period_end', v_sub.current_period_end);
END;
$$;

-- The only client-visible surface of the whole subscription system.
REVOKE ALL ON FUNCTION public.billing_apply_payment_event(text, text, text, text, uuid, text, timestamptz, timestamptz, jsonb) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.billing_apply_payment_event(text, text, text, text, uuid, text, timestamptz, timestamptz, jsonb) TO service_role;

-- -----------------------------------------------------------------------------
-- 9. get_my_subscription -- the only client-readable view of billing state
--
-- Scoped to auth.uid() inside the function, so there is no id parameter to
-- tamper with. The user learns their plan, status and period, and nothing about
-- any other account. Revoked from anon because EXECUTE defaults to PUBLIC.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_subscription()
RETURNS TABLE (
    subscription_id      uuid,
    plan_code            text,
    plan_name            text,
    status               text,
    current_period_start timestamptz,
    current_period_end   timestamptz,
    cancel_at_period_end boolean,
    cancelled_at         timestamptz,
    ended_at             timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
    SELECT s.id, p.code, p.name, s.status,
           s.current_period_start, s.current_period_end,
           s.cancel_at_period_end, s.cancelled_at, s.ended_at
      FROM public.subscriptions s
      JOIN public.subscription_plans p ON p.id = s.plan_id
     WHERE s.user_id = auth.uid()
     ORDER BY (s.status IN ('active', 'past_due', 'cancelled')) DESC,
              s.current_period_end DESC
     LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_my_subscription() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_subscription() TO authenticated;

-- PostgREST schema cache must see the new tables and RPCs immediately.
NOTIFY pgrst, 'reload schema';
