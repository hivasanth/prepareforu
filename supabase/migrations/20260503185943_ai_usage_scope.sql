ALTER TABLE public.ai_usage_limits
ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'subadmin';

UPDATE public.ai_usage_limits
SET scope = 'subadmin'
WHERE scope IS NULL;

ALTER TABLE public.ai_usage_limits
ALTER COLUMN scope SET NOT NULL;

ALTER TABLE public.ai_usage_limits
DROP CONSTRAINT IF EXISTS ai_usage_limits_user_id_date_key;

DROP INDEX IF EXISTS ai_usage_limits_user_id_date_key;
DROP INDEX IF EXISTS ai_usage_limits_user_id_date_idx;

CREATE UNIQUE INDEX IF NOT EXISTS ai_usage_limits_unique
ON public.ai_usage_limits(user_id, scope, date);
