-- =============================================================================
-- MIGRATION: Revoke EXECUTE on legacy unhardened settings RPCs
-- Date: 2026-09-10
--
-- Audit finding N-6 (P3):
--   save_exam_topic_configuration(text, uuid, text, jsonb) and
--   update_exam_subjects_batch(jsonb) are legacy unhardened function entry
--   points still granted EXECUTE to authenticated / service_role. They are
--   superseded by the admin_settings RPC family (save_admin_settings_rpc,
--   save_subject_test_configuration, fetch_topic_configuration) and are not
--   referenced by any application or test code in this repository.
--
-- Fix: revoke EXECUTE from the application-facing roles. The functions are
--   left in place (owner postgres retains intrinsic access) so nothing that
--   references them breaks catastrophically, but no app role can invoke them.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.save_exam_topic_configuration(text, uuid, text, jsonb) FROM authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.update_exam_subjects_batch(jsonb) FROM authenticated, service_role;