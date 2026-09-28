-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION: View TRUNCATE grant cleanup
--
-- Follow-up to 20260826000002: that migration covered TABLES; the two public
-- VIEWS (question_counts, topic_counts) still carried TRUNCATE grants for the
-- client roles. TRUNCATE is not executable against views in PostgreSQL, so
-- these grants were inert — revoked purely for privilege hygiene so the
-- permission surface states exactly what each role may do.
-- ════════════════════════════════════════════════════════════════════════════

REVOKE TRUNCATE ON public.question_counts FROM anon, authenticated;
REVOKE TRUNCATE ON public.topic_counts FROM anon, authenticated;
